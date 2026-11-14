import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync,strToU8} from 'fflate';
import {unzipPackage,scriptDrafts,mergeScriptDrafts,upsertScript} from '../lib/xce/world-zip-import.mjs';
import {emptyStory,validateStory} from '../lib/xce/story.mjs';
import {fresh} from '../lib/xce/core.mjs';

const zip=entries=>zipSync(Object.fromEntries(Object.entries(entries).map(([k,v])=>[k,typeof v==='string'?strToU8(v):v])));
let n=0;const ids=()=>'d'+(++n);

test('unzipPackage round-trips a ZIP',()=>{
 const files=unzipPackage(zip({'world/a.txt':'hello','world/b.json':'{}'}));
 assert.equal(new TextDecoder().decode(files['world/a.txt']),'hello');
 assert.deepEqual(Object.keys(files).sort(),['world/a.txt','world/b.json']);
});

test('unzipPackage rejects bytes that are not a ZIP',()=>{
 assert.throws(()=>unzipPackage(strToU8('hello world')),/Not a ZIP/);
});

test('unzipPackage rejects too many entries',()=>{
 const entries={};for(let i=0;i<401;i++)entries['f'+i+'.txt']='x';
 assert.throws(()=>unzipPackage(zip(entries)),/too many files/);
 const ok={};for(let i=0;i<400;i++)ok['f'+i+'.txt']='x';
 assert.equal(Object.keys(unzipPackage(zip(ok))).length,400);
});

test('unzipPackage rejects unsafe paths',()=>{
 for(const name of ['../evil.txt','a/../../evil.txt','/abs.txt','C:/win.txt','a\\..\\evil.txt'])assert.throws(()=>unzipPackage(zip({[name]:'x'})),/Unsafe path/,name);
});

test('unzipPackage rejects archives too large when unpacked',()=>{
 assert.throws(()=>unzipPackage(zip({'a.txt':'x'.repeat(2000)}),{maxUnpackedBytes:1000}),/too large when unpacked/);
});

test('scriptDrafts picks script, story and notes text files only',()=>{
 const files=unzipPackage(zip({
  'Spy Cobalt/scripts/Ep1 Cold Open.md':'INT. SAFEHOUSE',
  'story/Pitch.txt':'A spy story',
  'notes/x.md':'note',
  'Pilot-script.txt':'FADE IN',
  'README.md':'ignore me',
  'scripts/a.png':new Uint8Array([137,80,78,71]),
  'scripts/bad.md':new Uint8Array([0xff,0xfe,0xfd]),
  'scripts/huge.md':'y'.repeat(150001),
  '__MACOSX/scripts/._Ep1 Cold Open.md':'junk',
 }));
 const drafts=scriptDrafts(files).sort((a,b)=>a.title.localeCompare(b.title));
 assert.deepEqual(drafts,[
  {kind:'script',title:'Ep1 Cold Open',body:'INT. SAFEHOUSE'},
  {kind:'notes',title:'x',body:'note'},
  {kind:'story',title:'Pitch',body:'A spy story'},
  {kind:'script',title:'Pilot-script',body:'FADE IN'},
 ].sort((a,b)=>a.title.localeCompare(b.title)));
});

test('mergeScriptDrafts adds new, skips same, keeps saved on conflict',()=>{
 const m=fresh();
 let story={...emptyStory(),documents:[{id:'s1',kind:'script',title:'Ep1',body:'saved text'},{id:'s2',kind:'story',title:'Pitch',body:'same body'}]};
 const r=mergeScriptDrafts(story,[{kind:'script',title:'ep1',body:'new text'},{kind:'story',title:'Pitch',body:' same body '},{kind:'notes',title:'Fresh',body:'new'}],m,ids);
 assert.deepEqual(r.added,['Fresh']);assert.deepEqual(r.same,['Pitch']);assert.deepEqual(r.kept,['ep1']);
 assert.equal(r.story.documents.find(d=>d.id==='s1').body,'saved text');
 assert.equal(r.story.documents.length,3);
 assert.doesNotThrow(()=>validateStory(r.story,m));
});

test('upsertScript creates, updates by title, and reports unchanged',()=>{
 const m=fresh();
 const a=upsertScript(emptyStory(),{title:'Ep1',body:'v1',kind:'script'},m,ids);
 assert.equal(a.action,'created');
 const b=upsertScript(a.story,{title:'EP1 ',body:'v2',kind:'script'},m,ids);
 assert.equal(b.action,'updated');assert.equal(b.id,a.id);
 assert.equal(b.story.documents.length,1);assert.equal(b.story.documents[0].body,'v2');assert.equal(b.story.documents[0].title,'Ep1');
 const c=upsertScript(b.story,{title:'Ep1',body:'v2',kind:'script'},m,ids);
 assert.equal(c.action,'unchanged');
});

test('upsertScript respects the 200 draft limit',()=>{
 const m=fresh();
 const story={...emptyStory(),documents:Array.from({length:200},(_,i)=>({id:'x'+i,kind:'notes',title:'t'+i,body:''}))};
 assert.throws(()=>upsertScript(story,{title:'one more',body:'b',kind:'script'},m,ids),/Too many drafts/);
});
