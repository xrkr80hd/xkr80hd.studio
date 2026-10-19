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
 assert.deepEqual(saved.manifest_store.characters.C,baseline);
 assert.equal(Object.keys(saved.manifest_store.characters).length,1);
 assert.equal(saved.references[result.id].key,'private/costume.png');
 assert.ok(source.references.ALT);
});

test('reference library groups by saved category and character role without an all-category group',async()=>{
 const {referencePoolGroups}=await import('../lib/xce/reference-pool.mjs');const m={references:{C:{role:'IDENTITY'},P:{role:'PROP'},U:{}},manifest_store:{characters:{H:{asset_id:'H',name:'Hero',reference_ids:['C']}},props:{S:{asset_id:'S',name:'Sword',reference_ids:['P']}}},character_cast_groups:{H:'main'}};
 const groups=referencePoolGroups(referencePoolRows(m,'P','Project'));assert.deepEqual(groups.map(g=>g.id),['cast:main','props','uploads']);assert.equal(groups[0].records[0].name,'Hero');assert.equal(groups[1].records[0].name,'Sword');
});
