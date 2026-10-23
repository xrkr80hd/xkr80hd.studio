import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/xce/core.mjs';
import {stageReference} from '../lib/xce/asset-triage.mjs';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {presortedLibraryRows} from '../lib/xce/presorted-library.mjs';
import {referenceAssetOwners} from '../lib/xce/inspector-record.mjs';
import {manage} from '../lib/xce/manage.mjs';

function fixture(){const m=fresh();m.campaign_name='Final Fantasy VI';m.references.R={id:'R',name:'Wrong name',role:'IDENTITY',key:'private/R',presort:{type:'character',display_name:'Wrong name'}};return m;}
function browser(m){const next=structuredClone(m);for(const r of Object.values(next.references))delete r.key;return next;}

test('Name & Save shows one correctly named asset after typed reference normalization',()=>{
 const m=fixture(),saved=stageReference(m,'R','character','Kutan');
 assert.notEqual(m.manifest_store.characters[saved.id].reference_ids[0],'R');
 const view=browser(m),assets=worldRecords(view);
 assert.deepEqual(assets.map(a=>a.name),['Kutan']);
 assert.deepEqual(presortedLibraryRows(view,assets),[]);
 const owners=referenceAssetOwners(view,'R');
 assert.equal(owners.length,1);assert.equal(owners[0].asset_id,saved.id);
 const refs=Object.keys(m.references),ids=Object.keys(m.manifest_store.characters);
 manage(m,{entity:'character',action:'update',id:owners[0].asset_id,data:{name:'Corrected Kutan'}});
 assert.deepEqual(Object.keys(m.references),refs);assert.deepEqual(Object.keys(m.manifest_store.characters),ids);
 assert.equal(m.manifest_store.characters[saved.id].name,'Corrected Kutan');
 assert.ok(m.references.R);
});

test('name-only save keeps locked asset ID, approval, images and sidecars without creating a version',()=>{
 const m=fixture(),saved=stageReference(m,'R','character','Kutan'),asset=m.manifest_store.characters[saved.id];
 asset.status='LOCKED';asset.source_image_id=asset.reference_ids[0];asset.owner_image_approval={sha256:'a'.repeat(64)};
 m.state_variants={[saved.id]:{ALT:{id:'ALT',character_id:saved.id,reference_ids:['R']}}};m.character_cast_groups={[saved.id]:'villains'};
 const before=structuredClone(m),result=manage(m,{entity:'character',action:'update',id:saved.id,new_version_id:'UNUSED-VERSION',data:{name:'Correct name'}});
 assert.equal(result.record.asset_id,saved.id);assert.equal(result.record.name,'Correct name');
 assert.deepEqual(m.manifest_store.characters[saved.id],{...before.manifest_store.characters[saved.id],name:'Correct name'});
 assert.equal(m.manifest_store.characters['UNUSED-VERSION'],undefined);
 assert.deepEqual(m.state_variants,before.state_variants);assert.deepEqual(m.character_cast_groups,before.character_cast_groups);
 assert.deepEqual(m.references,before.references);
});

test('renaming a raw upload updates its displayed name without allocating any record',()=>{
 const m=fixture();m.references.R.asset_name='Wrong name';
 manage(m,{entity:'reference',action:'update',id:'R',data:{name:'Correct name'}});
 assert.deepEqual(Object.keys(m.references),['R']);assert.equal(worldRecords(m).length,0);
 assert.equal(presortedLibraryRows(browser(m),[])[0].name,'Correct name');
});

test('consumed cross-project uploads stay hidden; unrelated uploads remain available',()=>{
 const m=fixture();m.references.U={...m.references.R,id:'U',name:'Untouched'};m.asset_triage={processed:{'reference:R':{destination_project_id:'D',id:'C'}}};
 assert.deepEqual(presortedLibraryRows(browser(m),[]).map(r=>r.id),['U']);
});

test('shared reference ownership remains explicit rather than guessing which asset to rename',()=>{
 const m=fixture();stageReference(m,'R','character','First');stageReference(m,'R','character','Second');
 assert.equal(referenceAssetOwners(browser(m),'R').length,2);
});

test('native locked asset display name can change without duplicating its record',async()=>{
 const {emptyWorld,validateWorld}=await import('../lib/xce/world-library.mjs');
 const world=emptyWorld();world.props.P={id:'P',type:'props',name:'Wrong name',status:'LOCKED',reference_ids:['R'],metadata:{}};
 const m={world_library:world,references:{R:{role:'PROP'}}},renamed=structuredClone(world);renamed.props.P.name='Sword';
 const result=validateWorld(renamed,m);assert.equal(result.props.P.name,'Sword');assert.equal(result.props.P.status,'LOCKED');assert.deepEqual(result.props.P.reference_ids,['R']);assert.deepEqual(Object.keys(result.props),['P']);
 renamed.props.P.reference_ids=[];assert.throws(()=>validateWorld(renamed,m),/visual anchor/);
});


test('all scene keyframes can be renamed by stable ID before or after approval',async()=>{
 const {prepareAutoArgs}=await import('../lib/xce/namespace.mjs');
 for(const status of ['DRAFT','LOCKED'])for(const indexed of [false,true]){
  const m=fresh();m.campaign_name='Final Fantasy VI';
  const shot={asset_id:'SHOT-1',scene_id:'SCENE-1',shot_number:1,name:'Old name',status,source_image_id:'IMAGE-1',assigned_reference_ids:['IMAGE-1'],camera_spec:{framing:'wide'}};
  m.scenes['SCENE-1']={scene_id:'SCENE-1',shots:{'1':structuredClone(shot)}};
  if(indexed)m.manifest_store.shots[shot.asset_id]=structuredClone(shot);
  // A persisted manifest has separate objects in these two collections.
  for(const name of ['Rear camera behind the Emperor','My second name']){
   const args=prepareAutoArgs(m,'manage_record',{entity:'keyframe',action:'update',id:shot.asset_id,data:{name}});
   const result=manage(m,args);
   assert.equal(result.record.name,name);
   assert.deepEqual(m.scenes['SCENE-1'].shots['1'],{...shot,name});
   assert.deepEqual(Object.keys(m.manifest_store.shots),indexed?['SHOT-1']:[]);
   if(indexed)assert.deepEqual(m.manifest_store.shots['SHOT-1'],{...shot,name});
   assert.deepEqual(Object.keys(m.scenes['SCENE-1'].shots),['1']);
  }
 }
});
