import test from 'node:test';
import assert from 'node:assert/strict';
import {zipSync} from 'fflate';
import {workspaceOperation} from '../lib/mcp/workspace.mjs';
import {fresh} from '../lib/xce/core.mjs';

const PNG=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,73,72,68,82];
const png=n=>new Uint8Array([...PNG,n]);
const enc=s=>new TextEncoder().encode(typeof s==='string'?s:JSON.stringify(s));
const fileArg={download_url:'https://files.example.test/world.zip',file_id:'file_zip',file_name:'spy_cobalt_fin.zip'};

function manifest({name='Spy Cobalt',assets,world_builder={world_type:'Cold-war spy thriller.'}}){
 return {format:'xce-world-package',schema_version:'1.0.0',package_id:'fin-'+name,generator:'xce_world_builder 2.8.0',world:{name,project_id:null},world_builder,assets,relationships:[]};
}
const XRKR={package_id:'CH-01',category:'characters',name:'XRKR',details:{description:'Lead agent.'},images:[{file:'images/characters/xrkr.png'}]};
const SOL={package_id:'CH-02',category:'characters',name:'Agent SOL',details:{description:'Handler.'},images:[]};
const CAR={package_id:'VH-01',category:'vehicles',name:'Cobalt Charger',images:[{file:'images/vehicles/car.png'}]};
const finZip=(doc,extra={})=>zipSync({'xce-world-package.json':enc(doc),...extra});
const firstZip=()=>finZip(manifest({assets:[XRKR]}),{'images/characters/xrkr.png':png(1),'scripts/Ep1 Cold Open.md':enc('INT. SAFEHOUSE - NIGHT')});

function fixture(zipBytes,{scopes=['asset:read','asset:write'],projects={}}={}){
 const rows=new Map(),files=new Map(),calls=[],codes=new Map();
 const base=fresh();base.campaign_name='Existing';base.active_project_code='EX';rows.set('P',{manifest:JSON.stringify(base),revision:1});
 for(const [id,title] of Object.entries(projects)){const m=fresh();m.campaign_name=title;rows.set(id,{manifest:JSON.stringify(m),revision:1});}
 const auth={owner:'11111111-1111-4111-8111-111111111111',principal:'oauth:one',projects:new Set(rows.keys()),scopes:new Set(scopes)};
 const request=async a=>{calls.push(a);
  if(a.op==='load')return {data:rows.get(a.project)||null};
  if(a.op==='projects')return {data:[...rows].map(([project,r])=>({project,...r}))};
  if(a.op==='code')return {data:codes.has(a.project)?{code:codes.get(a.project)}:null};
  if(a.op==='reserve_code'){if([...codes.values()].includes(a.code))return {reserved:false};codes.set(a.project,a.code);return {data:null};}
  if(a.op==='save'){const prior=rows.get(a.project);if((prior?.revision||0)!==a.revision)return {changes:0};rows.set(a.project,{manifest:a.manifest,revision:a.revision+1});return {changes:1};}
  if(a.op==='file_put'){files.set(a.key,Buffer.from(a.base64,'base64'));return {saved:true};}
  throw Error('Unexpected operation '+a.op);};
 const getImage=async key=>files.has(key)?{arrayBuffer:async()=>files.get(key)}:null;
 const f={auth,request,getImage,rows,files,calls,codes,zip:zipBytes};
 f.fetchFile=async(file,opts)=>{f.lastFetch={file,opts};return Buffer.from(f.zip);};
 return f;
}
const run=(f,extra={})=>workspaceOperation('import_world_zip',{file:fileArg,confirm:true,...extra},f);
const manifestOf=(f,id)=>JSON.parse(f.rows.get(id).manifest);
const characters=m=>Object.values(m.world_library?.characters||{});

test('creates and populates a new world',async()=>{
 const f=fixture(firstZip());const r=await run(f);
 assert.equal(r.mode,'created');assert.equal(r.complete,true);
 assert.equal(f.lastFetch.opts.maxBytes,41_943_040);
 assert.ok(f.auth.projects.has(r.project_id));
 const m=manifestOf(f,r.project_id);
 const xrkr=characters(m).find(c=>c.name==='XRKR');assert.ok(xrkr);assert.equal(xrkr.status,'DRAFT');
 assert.equal(r.images.added,1);assert.equal(xrkr.reference_ids.length,1);
 assert.deepEqual(r.scripts.added,['Ep1 Cold Open']);
 assert.equal(m.story_workspace.document.documents[0].kind,'script');
 assert.equal(f.files.size,1);
});

test('second send of the same ZIP changes nothing',async()=>{
 const f=fixture(firstZip());const first=await run(f);
 const again=await run(f,{project_id:first.project_id});
 assert.equal(again.mode,'existing');assert.deepEqual(again.report.created,[]);
 assert.equal(again.images.added,0);assert.equal(again.images.skipped_duplicate,1);
 assert.deepEqual(again.scripts.added,[]);assert.deepEqual(again.scripts.same,['Ep1 Cold Open']);
 assert.equal(f.files.size,1);
 assert.equal(characters(manifestOf(f,first.project_id)).filter(c=>c.name==='XRKR').length,1);
});

test('a later ZIP fills only the missing pieces',async()=>{
 const f=fixture(firstZip());const first=await run(f);
 f.zip=finZip(manifest({assets:[{...XRKR,details:{description:'CHANGED text.'},images:[]},SOL],world_builder:{world_type:'Different text.'}}));
 const r=await run(f,{project_id:first.project_id});
 assert.deepEqual(r.report.created,['Agent SOL']);
 assert.ok(r.report.kept.some(k=>/World type|description/i.test(k)));
 const m=manifestOf(f,first.project_id);
 assert.equal(m.world_builder.world_type,'Cold-war spy thriller.');
 assert.ok(characters(m).some(c=>c.name==='Agent SOL'));
});

test('an ambiguous world name writes nothing',async()=>{
 const f=fixture(firstZip(),{projects:{A:'Spy Cobalt',B:'Spy Cobalt'}});const r=await run(f);
 assert.equal(r.mode,'ambiguous');assert.equal(r.candidates.length,2);assert.equal(r.complete,false);
 assert.equal(f.calls.some(c=>c.op==='save'||c.op==='file_put'),false);
});

test('images for a locked asset are skipped and the rest continue',async()=>{
 const f=fixture(firstZip());const first=await run(f);
 const m=manifestOf(f,first.project_id),row=f.rows.get(first.project_id);
 characters(m).find(c=>c.name==='XRKR').status='LOCKED';f.rows.set(first.project_id,{...row,manifest:JSON.stringify(m)});
 f.zip=finZip(manifest({assets:[{...XRKR,images:[{file:'images/characters/xrkr2.png'}]},CAR]}),{'images/characters/xrkr2.png':png(2),'images/vehicles/car.png':png(3)});
 const r=await run(f,{project_id:first.project_id});
 assert.deepEqual(r.images.skipped_locked,['images/characters/xrkr2.png']);
 assert.equal(r.images.added,1);assert.equal(r.complete,true);
 assert.equal(f.files.size,2);
});

test('images over 2.5 MB are reported, not fatal',async()=>{
 const big=new Uint8Array(2_500_001);big.set(PNG);
 const f=fixture(finZip(manifest({assets:[CAR]}),{'images/vehicles/car.png':big}));const r=await run(f);
 assert.deepEqual(r.images.too_large,['images/vehicles/car.png']);assert.equal(r.images.added,0);assert.equal(r.complete,true);
});

test('the time budget stops cleanly and a resend finishes',async()=>{
 const zip=finZip(manifest({assets:[XRKR,CAR]}),{'images/characters/xrkr.png':png(1),'images/vehicles/car.png':png(3)});
 const f=fixture(zip);const times=[0,0,50_000];f.now=()=>times.length?times.shift():0;
 const r=await run(f);
 assert.equal(r.images.added,1);assert.equal(r.images.remaining,1);assert.equal(r.complete,false);
 const done=await run(f,{project_id:r.project_id});
 assert.equal(done.images.added,1);assert.equal(done.images.skipped_duplicate,1);assert.equal(done.complete,true);
});

test('refuses folder-locked worlds, system pools and non-ZIP bytes',async()=>{
 const locked=fixture(firstZip());const lm=fresh();lm.campaign_name='Spy Cobalt';lm.folder_lock={session_hash:'x'};locked.rows.set('L',{manifest:JSON.stringify(lm),revision:1});locked.auth.projects.add('L');
 await assert.rejects(run(locked,{project_id:'L'}),/locked/i);
 const pool=fixture(firstZip());const pm=fresh();pm.campaign_name='Pool';pm.system_pool='lost-assets';pool.rows.set('S',{manifest:JSON.stringify(pm),revision:1});pool.auth.projects.add('S');
 await assert.rejects(run(pool,{project_id:'S'}),/world|pool/i);
 const bad=fixture(enc('hello'));await assert.rejects(run(bad),/Not a ZIP/);
});

test('import_world_zip needs asset:write and confirm',async()=>{
 const f=fixture(firstZip(),{scopes:['asset:read']});await assert.rejects(run(f),/Permission required/);
 const g=fixture(firstZip());await assert.rejects(workspaceOperation('import_world_zip',{file:fileArg},g),/confirmation/);
 assert.equal(f.calls.length+g.calls.length,0);
});
