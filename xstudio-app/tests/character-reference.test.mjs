import test from 'node:test';
import assert from 'node:assert/strict';
import {retrieveCharacterReference} from '../lib/mcp/character-reference.mjs';
import {toolResult} from '../lib/mcp/tool-result.mjs';

const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const url='https://storage.example/signed-sheet.png?token=temporary';
function fixture(){
 const loaded=[],reads=[];
 const projects={P:{m:{characters:[{id:'CHAR',code:'CHAR_FF6_SABIN_01',type:'character'}]},revision:3},OTHER:{m:{characters:[]},revision:1},LOCKED:null};
 const deps={projectIds:new Set(Object.keys(projects)),
  loadProject:async p=>{loaded.push(p);return projects[p];},
  matches:(m,id)=>m.characters.filter(c=>c.id===id||c.code===id).map(c=>({record:c,type:c.type})),
  readCref:async(p,id)=>{reads.push({p,id});return {asset_id:'CHAR',cref:{asset_id:'CHAR',asset_code:'CHAR_FF6_SABIN_01',reference_ids:['REF'],revision:3,lock_status:'LOCKED',images_retrieved:true},images:[{reference_id:'REF',mime_type:'image/png',image_base64:bytes.toString('base64')}]};},
  signReferences:async()=>[{reference_id:'REF',media:{url,mime_type:'image/png',expires_in:60},generation_input_allowed:true}]};
 return {deps,projects,loaded,reads};
}

test('exact saved code resolves canonical identity and original pixels into the MCP response',async()=>{
 const f=fixture();
 const result=await retrieveCharacterReference({character_id:'CHAR_FF6_SABIN_01'},f.deps);
 assert.equal(result.canonical_asset_id,'CHAR');
 assert.equal(result.project_id,'P');
 assert.deepEqual(f.reads,[{p:'P',id:'CHAR_FF6_SABIN_01'}]);
 assert.equal(result.cref_parameters.value,url);
 assert.equal(result.turnaround_sheet.layout_verified,false);
 const envelope=toolResult('get_character_reference',result);
 assert.deepEqual(Buffer.from(envelope.content.find(c=>c.type==='image').data,'base64'),bytes);
 assert.equal(envelope.structuredContent.images,undefined);
 assert.equal(envelope.content[1].mimeType,'image/png');
});
test('canonical ID also resolves; sheet metadata can be omitted without losing pixels',async()=>{
 const result=await retrieveCharacterReference({character_id:'CHAR',include_turnaround:false},fixture().deps);
 assert.equal(result.turnaround_sheet,undefined);
 assert.equal(result.images.length,1);
});
test('explicit project denies unauthorized input before any lookup',async()=>{
 const f=fixture();
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR',project_id:'SECRET'},f.deps),/not found/);
 assert.equal(f.loaded.length,0);assert.equal(f.reads.length,0);
});
test('ambiguous IDs across authorized projects require project selection',async()=>{
 const f=fixture();f.projects.OTHER=f.projects.P;
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/ambiguous/);
 assert.equal(f.reads.length,0);
 const result=await retrieveCharacterReference({character_id:'CHAR',project_id:'P'},f.deps);
 assert.equal(result.project_id,'P');
});
test('duplicate exact records within a project are also ambiguous',async()=>{
 const f=fixture();f.projects.P.m.characters.push({...f.projects.P.m.characters[0]});
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/ambiguous/);
});
test('missing character does not invoke image retrieval',async()=>{
 const f=fixture();
 await assert.rejects(retrieveCharacterReference({character_id:'MISSING'},f.deps),/not found/);
 assert.equal(f.reads.length,0);
});
test('non-character exact match cannot satisfy a character request',async()=>{
 const f=fixture();f.projects.P.m.characters[0].type='creature';
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/LOCKED character/);
});
test('existing CREF lock/digest failures are propagated; no gallery fallback',async()=>{
 const f=fixture();f.deps.readCref=async()=>{throw Error('Locked reference image digest mismatch');};
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/digest mismatch/);
});
for(const result of [{cref:{lock_status:'DRAFT',images_retrieved:true},images:[{}]}, {cref:{lock_status:'LOCKED',images_retrieved:true,revision:3},images:[]}]){
 test('metadata or an unlocked result cannot masquerade as image delivery',async()=>{
  const f=fixture();f.deps.readCref=async()=>({...result,cref:{...result.cref,revision:3}});
  await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/not retrieved/);
 });
}
test('revision drift before image retrieval fails',async()=>{
 const f=fixture(),read=f.deps.readCref;
 f.deps.readCref=async(...a)=>{const r=await read(...a);r.cref.revision=4;return r;};
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/Project changed/);
});
test('revision drift while signing references fails',async()=>{
 const f=fixture(),sign=f.deps.signReferences;
 f.deps.signReferences=async(...a)=>{f.projects.P={...f.projects.P,revision:4};return sign(...a);};
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/Project changed/);
});
test('unavailable URLs fail rather than returning an incomplete success',async()=>{
 const f=fixture();f.deps.signReferences=async()=>[];
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/URL unavailable/);
});
test('failed project reads cannot hide an ambiguous code',async()=>{
 const f=fixture(),load=f.deps.loadProject;
 f.deps.loadProject=p=>p==='OTHER'?Promise.reject(Error('Backend unavailable')):load(p);
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/Backend unavailable/);
 assert.equal(f.reads.length,0);
});
test('large project grants require explicit scope; never return a partial scan',async()=>{
 const f=fixture();f.deps.projectIds=new Set(Array.from({length:51},(_,i)=>'P'+i));
 await assert.rejects(retrieveCharacterReference({character_id:'CHAR'},f.deps),/Specify project_id/);
 assert.equal(f.loaded.length,0);
});
test('invalid selectors and flags fail before any project read',async()=>{
 const f=fixture();
 for(const args of [{character_id:'../CHAR'},{character_id:''},{character_id:'CHAR',include_turnaround:'true'}])await assert.rejects(retrieveCharacterReference(args,f.deps));
 assert.equal(f.loaded.length,0);
});
test('character-reference envelope refuses links-only success and oversized payloads',()=>{
 assert.throws(()=>toolResult('get_character_reference',{reference_urls:[url]}),/not retrieved/);
 assert.throws(()=>toolResult('get_character_reference',{images:[{mime_type:'image/png',image_base64:'a'.repeat(4_000_000)}]}),/too large/);
});
test('existing tools preserve their image-vs-metadata behavior',()=>{
 const result={name:'Exact',images:[{mime_type:'image/png',image_base64:bytes.toString('base64')}]};
 assert.equal(toolResult('get_character_cref',result).content[1].type,'image');
 assert.equal(toolResult('get_character_anchor',result).content[1].type,'image');
 assert.equal(toolResult('get_asset',result).content.length,1);
});
