import test from 'node:test';
import assert from 'node:assert/strict';
import {referencePoolRows,filterReferencePool} from '../lib/xce/reference-pool.mjs';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {fresh} from '../lib/xce/core.mjs';
import {transfer} from '../lib/xce/transfer.mjs';
import {editCharacterState} from '../lib/xce/entity-composition.mjs';

test('public manifests without private keys expose uploaded and assigned costume images',()=>{
 const manifest={references:{BASE:{name:'Baseline',role:'IDENTITY'},ALT:{name:'Royal costume',role:'COSTUME'},LOCAL:{name:'Device upload',local:true},D:{role:'DIAGNOSTIC'},OLD:{deleted_at:'today'}},manifest_store:{characters:{C:{reference_ids:['BASE']}}}};
 const rows=referencePoolRows(manifest,'P','Final Fantasy VI');
 assert.deepEqual(rows.map(r=>r.id),['BASE','ALT','LOCAL']);
 assert.deepEqual(filterReferencePool(rows,'royal costume','','P',[]).map(r=>r.id),['ALT']);
 assert.deepEqual(filterReferencePool(rows,'','','P',['BASE']).map(r=>r.id),['ALT','LOCAL']);
 const lost=referencePoolRows({references:{BASE:{name:'Another image'}}},'LOST','Lost Assets');
 assert.equal(filterReferencePool([...rows,...lost],'','LOST','P',['BASE']).length,1);
});

test('an image selected from another pool attaches as the same character costume and preserves baseline',()=>{
 const source=fresh(),destination=fresh();source.campaign_name='Lost Assets';destination.campaign_name='Final Fantasy VI';
 source.references.ALT={id:'ALT',name:'Royal costume',asset_type:'character',role:'COSTUME',key:'private/costume.png'};
 destination.references.BASE={id:'BASE',role:'IDENTITY',key:'private/base.png'};
 destination.manifest_store.characters.C={asset_id:'C',name:'Character',asset_type:'character',status:'LOCKED',source_image_id:'BASE',reference_ids:['BASE']};
 const baseline=structuredClone(destination.manifest_store.characters.C);
 const result=transfer(source,destination,{entity:'reference',id:'ALT',operation:'duplicate',project_id:'LOST',destination_project_id:'P'});
 const saved=editCharacterState(destination,{character_id:'C',operation:'save',expected_version:0,state:{id:'COSTUME',character_id:'C',name:'Royal costume',status:'DRAFT',version:1,reference_ids:[result.id],visual_description:''}},worldRecords(destination));
 assert.equal(saved.state_variants.C.COSTUME.character_id,'C');
 assert.deepEqual(saved.state_variants.C.COSTUME.reference_ids,[result.id]);
 assert.deepEqual(saved.manifest_store.characters.C,{...baseline,alternate_costumes:['COSTUME']});
 assert.equal(Object.keys(saved.manifest_store.characters).length,1);
 assert.equal(saved.references[result.id].key,'private/costume.png');
 assert.ok(source.references.ALT);
});

test('reference library groups by saved category and character role without an all-category group',async()=>{
 const {referencePoolGroups}=await import('../lib/xce/reference-pool.mjs');const m={references:{C:{role:'IDENTITY'},P:{role:'PROP'},U:{}},manifest_store:{characters:{H:{asset_id:'H',name:'Hero',reference_ids:['C']}},props:{S:{asset_id:'S',name:'Sword',reference_ids:['P']}}},character_cast_groups:{H:'main'}};
 const groups=referencePoolGroups(referencePoolRows(m,'P','Project'));assert.deepEqual(groups.map(g=>g.id),['cast:main','props','uploads']);assert.equal(groups[0].records[0].name,'Hero');assert.equal(groups[1].records[0].name,'Sword');
});

test('project folder root includes every category and only current-project images',async()=>{
 const {projectAssetFolders}=await import('../lib/xce/reference-pool.mjs');
 const m={references:{W:{name:'Costume',role:'COSTUME'},V:{name:'Car',role:'PROP'}},manifest_store:{vehicles:{CAR:{asset_id:'CAR',name:'Car',reference_ids:['V']}}}};
 const folders=projectAssetFolders(m,'CURRENT');assert.equal(folders[0].id,'characters');assert.ok(folders.some(f=>f.id==='props'));assert.ok(folders.some(f=>f.id==='vehicles'));assert.deepEqual(folders.find(f=>f.id==='wardrobe').records.map(r=>r.id),['W']);assert.ok(folders.flatMap(f=>f.records).every(r=>r.project==='CURRENT'));
});

test('single selection persists the parent costume link and repeated selection creates no duplicates',async()=>{
 const {attachCharacterCostume}=await import('../lib/xce/entity-composition.mjs');
 const m=fresh();m.references.ALT={id:'ALT',name:'Royal costume',key:'private/alt',role:'COSTUME'};m.references.BASE={id:'BASE',key:'private/base',role:'IDENTITY'};m.manifest_store.characters.C={asset_id:'C',name:'Hero',status:'LOCKED',reference_ids:['BASE'],source_image_id:'BASE'};
 const before=structuredClone(m),args={character_id:'C',reference_id:'ALT',state_id:'S',expected_version:0};
 const first=attachCharacterCostume(m,args,worldRecords(m));assert.deepEqual(first.manifest.manifest_store.characters.C.alternate_costumes,['S']);assert.deepEqual(first.state.reference_ids,['ALT']);assert.deepEqual(m,before);
 const retry=attachCharacterCostume(first.manifest,{...args,state_id:'RETRY'},worldRecords(first.manifest));assert.equal(retry.state.id,'S');assert.equal(Object.keys(retry.manifest.state_variants.C).length,1);assert.deepEqual(retry.manifest.references,m.references);assert.equal(Object.keys(retry.manifest.manifest_store.characters).length,1);
 assert.throws(()=>attachCharacterCostume(m,{...args,reference_id:'FOREIGN'},worldRecords(m)),/project/);
 const deleted=editCharacterState(first.manifest,{character_id:'C',state:first.state,operation:'delete',expected_version:1},worldRecords(first.manifest));assert.deepEqual(deleted.manifest_store.characters.C.alternate_costumes,[]);
});
