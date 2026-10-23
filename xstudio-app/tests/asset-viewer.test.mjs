import test from 'node:test';
import assert from 'node:assert/strict';
import {assetViewData,selectedViewerRecords,viewerRecord} from '../lib/xce/asset-viewer.mjs';
import {triageKey} from '../lib/xce/asset-triage.mjs';
import {classifyAssets} from '../lib/xce/classifications.mjs';

function fixture(){return {revision:3,references:{approved:{id:'approved',role:'IDENTITY'},draft:{id:'draft',role:'IDENTITY'},raw:{id:'raw',role:'PROP'},removed:{id:'removed',deleted_at:'today'}},manifest_store:{characters:{hero:{asset_id:'hero',asset_type:'character',name:'Hero',status:'LOCKED',source_image_id:'approved',reference_ids:['draft'],immutable_traits:{hair:'black'}}},props:{},vehicles:{},creatures:{},locations:{},shots:{}},world_library:{vehicles:{plane:{id:'plane',type:'vehicles',name:'Aircraft',status:'DRAFT',reference_ids:[],metadata:{styling:'utility'}}}},scenes:{scene:{scene_id:'scene',name:'Scene'}},asset_details:{hero:{description:'Saved description',metadata_profile:{biography:'Saved bio'},reusable_prompt:{text:'Saved prompt',version:1}}},state_variants:{hero:{winter:{id:'winter',name:'Winter outfit',status:'DRAFT'}}}}}

test('inspection reads current canonical details and approved image without changing saved state',()=>{
 const m=fixture(),before=structuredClone(m),data=assetViewData(m,{asset_id:'hero',name:'Stale name',reference_ids:['raw']});
 assert.equal(data.record.name,'Hero');assert.equal(data.imageIds[0],'approved');assert.equal(data.description,'Saved description');assert.equal(data.biography,'Saved bio');assert.equal(data.prompt,'Saved prompt');assert.equal(data.fields.hair,'black');assert.equal(data.variations[0].name,'Winter outfit');assert.deepEqual(m,before);
});
test('mixed selections preserve order and exact identities across saved, world and raw assets',()=>{
 const m=fixture(),keys=['world:plane','character:hero','reference:raw','scene:scene'];
 const rows=selectedViewerRecords(m,keys);assert.deepEqual(rows.map(a=>a.asset_id||a.scene_id||a.id),['plane','hero','raw','scene']);assert.equal(rows[2].category,'references');assert.equal(rows[3].category,'scenes');assert.deepEqual(selectedViewerRecords(m,['character:missing','reference:removed']),[]);
});
test('all native asset categories resolve using the same selection keys as the library',()=>{
 const m=fixture();for(const type of ['characters','props','vehicles','locations','rooms','wardrobe','scenes_and_shots']){
  m.world_library[type]||={};const a={id:type,type,name:type,status:'DRAFT',reference_ids:[],metadata:{}};m.world_library[type][a.id]=a;
  assert.equal(selectedViewerRecords(m,[triageKey(a)])[0].id,a.id);assert.equal(viewerRecord(a).category,type==='scenes_and_shots'?'shots':type);
 }
});
test('batch controller updates selected classification together and preserves image locks',()=>{
 const m=fixture(),before=structuredClone(m);m.manifest_store.characters.second={...m.manifest_store.characters.hero,asset_id:'second',name:'Second'};
 const result=classifyAssets(m,'test',3,3,['hero','second'].map(asset_id=>({asset_id,classification:'supporting_cast',expected_version:0})));
 assert.equal(result.changed,2);assert.ok(result.results.every(r=>r.ok));assert.equal(result.manifest.manifest_store.characters.hero.status,'LOCKED');assert.equal(result.manifest.manifest_store.characters.hero.source_image_id,'approved');assert.equal(m.asset_details.hero.secondary_classification,undefined);assert.deepEqual(m.references,before.references);
});
test('preview includes both directions of saved synergies and prop rules without activating disabled rules',()=>{
 const m=fixture();m.character_network={details:{hero:{gender:'male',text:'Core details'}},relationships:[{subject_id:'other',object_id:'hero',kind:'custom',clause_type:'synergy',text:'Coordinate their powers',enabled:false}]};
 m.manifest_store.props.sword={asset_id:'sword',asset_type:'prop',name:'Sword',reference_ids:[]};
 m.asset_details.hero.equipment_ids=['sword'];m.asset_details.sword={clauses:[{character_id:'hero',text:'Only glows while held by Hero',enabled:true}]};
 const before=structuredClone(m),data=assetViewData(m,{asset_id:'hero'});
 assert.equal(data.relationships[0].clause_type,'synergy');assert.equal(data.relationships[0].enabled,false);assert.equal(data.relationships[0].text,'Coordinate their powers');assert.equal(data.equipment[0].name,'Sword');assert.equal(data.clauses[0].asset_name,'Sword');assert.equal(data.fields.gender,'male');assert.equal(assetViewData(m,{asset_id:'sword'}).assignedTo[0].name,'Hero');assert.deepEqual(m,before);
});
