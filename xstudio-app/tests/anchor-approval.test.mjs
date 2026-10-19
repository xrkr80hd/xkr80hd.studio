import test from 'node:test';import assert from 'node:assert/strict';import {approveCharacterAnchor,unlockCharacterAnchor} from '../lib/xce/anchor-approval.mjs';
const fixture=()=>({manifest_store:{characters:{A:{asset_id:'A',asset_type:'character',status:'DRAFT',source_image_id:'R',reference_ids:['R'],immutable_traits:{face_features:'original'},asset_code:'FF6-CH-A'},B:{asset_id:'B',status:'DRAFT'}}},references:{R:{key:'private/image',role:'IDENTITY'}},character_network:{details:{A:{text:'User detail'}}}});
const args={asset_id:'A',source_image_id:'R',confirm:true,sha256:'a'.repeat(64)};
test('owner approval pins the exact image without inventing renderer review or changing canon',()=>{const m=fixture(),before=structuredClone(m),{manifest,asset}=approveCharacterAnchor(m,args);assert.deepEqual(m,before);assert.equal(asset.status,'LOCKED');assert.equal(asset.source_image_id,'R');assert.equal(asset.asset_code,'FF6-CH-A');assert.deepEqual(asset.immutable_traits,m.manifest_store.characters.A.immutable_traits);assert.equal(asset.generation_review,undefined);assert.equal(asset.owner_image_approval.source,'OWNER_EXPLICIT_LOCK');assert.deepEqual(manifest.character_network,m.character_network);assert.equal(manifest.manifest_store.characters.B.status,'DRAFT');});
test('approval still requires explicit consent and a verified saved image in the same project',()=>{assert.throws(()=>approveCharacterAnchor(fixture(),{...args,confirm:false}),/Lock character/);assert.throws(()=>approveCharacterAnchor(fixture(),{...args,source_image_id:'OTHER'}),/changed/);assert.throws(()=>approveCharacterAnchor(fixture(),{...args,asset_id:'FOREIGN'}),/not found/);const diagnostic=fixture();diagnostic.references.R.role='DIAGNOSTIC';assert.throws(()=>approveCharacterAnchor(diagnostic,args),/production/);assert.throws(()=>approveCharacterAnchor(fixture(),{...args,sha256:''}),/verified/);});

test('locks the displayed output reference rather than an older source',()=>{const m=fixture();m.references.NEW={key:'private/new',role:'IDENTITY'};m.manifest_store.characters.A.output_reference_id='NEW';assert.throws(()=>approveCharacterAnchor(m,args),/changed/);const {asset}=approveCharacterAnchor(m,{...args,source_image_id:'NEW'});assert.equal(asset.source_image_id,'NEW');});

test('unlock preserves images and approval history, allows edits and requires fresh approval to relock',()=>{const locked=approveCharacterAnchor(fixture(),args).manifest,before=structuredClone(locked);const {manifest,asset}=unlockCharacterAnchor(locked,args);assert.deepEqual(locked,before);assert.equal(asset.status,'DRAFT');assert.equal(asset.source_image_id,'R');assert.equal(asset.asset_code,'FF6-CH-A');assert.equal(asset.owner_image_approval,undefined);assert.equal(asset.anchor_lock_history[0].owner_image_approval.sha256,args.sha256);assert.deepEqual(manifest.references,locked.references);assert.throws(()=>unlockCharacterAnchor(locked,{...args,confirm:false}),/Confirm/);assert.throws(()=>unlockCharacterAnchor(locked,{...args,source_image_id:'OTHER'}),/changed/);assert.throws(()=>unlockCharacterAnchor(manifest,args),/locked/);assert.throws(()=>approveCharacterAnchor(manifest,{...args,confirm:false}),/Lock character/);assert.equal(approveCharacterAnchor(manifest,args).asset.status,'LOCKED');});

for(const status of ['DRAFT','REVIEWED','APPROVED','IMPORTED',undefined])test('owner can lock a saved villain with workflow status '+status,()=>{
 const m=fixture();m.manifest_store.characters.A.status=status;m.character_cast_groups={A:'villain'};
 const before=structuredClone(m),result=approveCharacterAnchor(m,args);
 assert.equal(result.asset.status,'LOCKED');assert.equal(result.asset.source_image_id,'R');
 assert.equal(result.manifest.character_cast_groups.A,'villain');assert.deepEqual(result.asset.immutable_traits,before.manifest_store.characters.A.immutable_traits);
 assert.deepEqual(result.manifest.references,before.references);assert.deepEqual(m,before);
});
test('repeating an existing lock keeps its original approval and timestamp',()=>{
 const first=approveCharacterAnchor(fixture(),{...args,now:'2026-10-18T17:00:00Z'}).manifest;
 const repeated=approveCharacterAnchor(first,{...args,now:'2026-10-18T18:00:00Z'});
 assert.deepEqual(repeated.manifest,first);
 assert.throws(()=>approveCharacterAnchor(first,{...args,sha256:'b'.repeat(64)}),/bytes changed/);
 const changed=structuredClone(first);delete changed.references.R;changed.references.NEW={key:'private/new',role:'IDENTITY'};changed.manifest_store.characters.A.output_reference_id='NEW';
 assert.throws(()=>approveCharacterAnchor(changed,{...args,source_image_id:'NEW'}),/locked character image changed/);
});
test('a legacy locked character can receive explicit owner image approval',()=>{
 const m=fixture();m.manifest_store.characters.A.status='LOCKED';
 const {asset}=approveCharacterAnchor(m,args);assert.equal(asset.status,'LOCKED');assert.equal(asset.owner_image_approval.source,'OWNER_EXPLICIT_LOCK');
});
test('deleted characters and non-character assets cannot be locked through the character action',()=>{
 const deleted=fixture();deleted.manifest_store.characters.A.deleted_at='2026-10-18';assert.throws(()=>approveCharacterAnchor(deleted,args),/not found/);
 const prop=fixture();prop.manifest_store.characters.A.asset_type='prop';assert.throws(()=>approveCharacterAnchor(prop,args),/not found/);
});

const {approveAssetAnchor,unlockAssetAnchor}=await import('../lib/xce/anchor-approval.mjs');
for(const [type,asset_type] of [['props','prop'],['creatures','creature'],['vehicles','vehicle'],['locations','location']])test(type+' can be explicitly locked, used and unlocked without duplication',()=>{
 const m={manifest_store:{[type]:{A:{asset_id:'A',asset_type,name:'Asset',status:'DRAFT',source_image_id:'R',reference_ids:['R']}}},references:{R:{key:'private/image',role:type==='locations'?'LOCATION':'PROP'}}},before=structuredClone(m);
 const locked=approveAssetAnchor(m,args);assert.deepEqual(m,before);assert.equal(locked.asset.status,'LOCKED');assert.equal(Object.keys(locked.manifest.manifest_store[type]).length,1);assert.deepEqual(locked.manifest.references,m.references);
 assert.deepEqual(approveAssetAnchor(locked.manifest,args).manifest,locked.manifest);assert.throws(()=>approveAssetAnchor(m,{...args,confirm:false}),/Lock asset/);assert.throws(()=>approveAssetAnchor(m,{...args,source_image_id:'FOREIGN'}),/changed/);assert.throws(()=>approveAssetAnchor(locked.manifest,{...args,sha256:'b'.repeat(64)}),/bytes changed/);
 assert.equal(unlockAssetAnchor(locked.manifest,args).asset.status,'DRAFT');
});
