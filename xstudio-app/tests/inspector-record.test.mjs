import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/xce/core.mjs';
import {inspectorEntity,needsAssetIntake} from '../lib/xce/inspector-record.mjs';
import {presortedLibraryRows} from '../lib/xce/presorted-library.mjs';
import {prepareAutoArgs} from '../lib/xce/namespace.mjs';
import {recordKey} from '../lib/xce/inspector-queue.mjs';
import {stageReference} from '../lib/xce/asset-triage.mjs';

function fixture(){const m=fresh();m.campaign_name='Final Fantasy VI';m.references.R={id:'R',name:'Kutan',key:'private/kutan.png',role:'IDENTITY',asset_type:'character',presort:{type:'character',display_name:'Kutan'}};return m;}

test('unsaved character image uses reference identity in raw, presorted and carousel forms',()=>{
 const m=fixture(),raw=m.references.R,presorted=presortedLibraryRows(m,[])[0];
 for(const record of [raw,presorted,{...raw,category:'references',asset_id:'R'}]){
  assert.equal(inspectorEntity(record,m),'reference');
  assert.equal(needsAssetIntake(record,'move',m),true);
  assert.equal(needsAssetIntake(record,'duplicate',m),true);
  assert.equal(needsAssetIntake(record,'delete',m),false);
  assert.equal(prepareAutoArgs(m,'transfer_record',{entity:inspectorEntity(record,m),id:'R'}).id,'R');
 }
 assert.equal(recordKey(presorted),'reference:R');
 // The reported request searched the character bucket using an image ID.
 assert.throws(()=>prepareAutoArgs(m,'transfer_record',{entity:'character',id:'R'}),/No saved character matches/);
 const saved=stageReference(m,'R','character','Kutan');
 assert.equal(m.manifest_store.characters[saved.id].name,'Kutan');
 assert.ok(m.references.R);
});

test('saved characters and attached references retain their record management actions',()=>{
 const m=fixture(),saved=stageReference(m,'R','character','Kutan'),asset=m.manifest_store.characters[saved.id];
 assert.equal(inspectorEntity(asset,m),'character');
 assert.equal(needsAssetIntake(asset,'move',m),false);
 assert.equal(needsAssetIntake(m.references.R,'move',m),false);
 assert.equal(inspectorEntity({id:'P',category:'projects'},m),'project');
 assert.equal(inspectorEntity({scene_id:'S',category:'scenes'},m),'scene');
});

test('native library categories resolve through the shared studio inspector',()=>{for(const [category,entity] of Object.entries({characters:'character',props:'prop',vehicles:'vehicle',locations:'location',wardrobe:'wardrobe',rooms:'room',scenes_and_shots:'keyframe'}))assert.equal(inspectorEntity({id:'N',category},{}),entity)});
