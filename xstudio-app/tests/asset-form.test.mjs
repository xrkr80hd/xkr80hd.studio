import test from 'node:test';
import assert from 'node:assert/strict';
import {saveAssetForm} from '../lib/xce/asset-form.mjs';
import {assetMetadata} from '../lib/xce/asset-metadata.mjs';
import {assetContext,assetContextPrompt} from '../lib/xce/asset-details.mjs';
import {assetFormKind,ASSET_FORM_SECTIONS} from '../lib/xce/asset-form-layout.mjs';
const fixture=()=>({revision:7,campaign_name:'Film',references:{R:{id:'R',role:'PROP',key:'xce/owner/film/R',mime_type:'image/png'}},world_library:{props:{P:{id:'P',type:'props',name:'Practical sword',status:'LOCKED',reference_ids:['R'],metadata:{scale_anchor:'1 metre',material_definition:'Steel'},asset_code:'FILM-PR-SWORD',owner_image_approval:{reference_id:'R',sha256:'saved-hash'},source_image_id:'R'}}},asset_details:{P:{clauses:[{character_id:'C',text:'User synergy',enabled:true}],metadata_profile:{background:'Saved background'}}}});
const edit=patch=>({asset_id:'P',primary_category:'prop',expected_revision:7,confirm:true,metadata_patch:patch,expected_metadata_version:0});
test('locked weapon saves cinematic functions and effects without touching anchor, ID or relationships',()=>{
 const m=fixture(),before=structuredClone(m),next=saveAssetForm(m,'film',{...edit({special_functions:'Extends a blue light beam',screen_action:'Held low until the cue',effects_notes:'Practical glow enhanced in post',continuity_rules:'Beam off between takes'}),classification:'weapon',expected_classification_version:0});
 assert.deepEqual(m,before);assert.deepEqual(next.world_library.props.P,m.world_library.props.P);assert.deepEqual(next.asset_details.P.clauses,m.asset_details.P.clauses);assert.equal(assetMetadata(next,'film',8,'P').fields.special_functions,'Extends a blue light beam');assert.equal(next.asset_details.P.metadata_profile.background,'Saved background');assert.equal(next.asset_details.P.secondary_classification,'weapon');
 const context=assetContext(next,['P']);assert.match(assetContextPrompt(context),/Extends a blue light beam/);assert.match(assetContextPrompt(context),/Beam off between takes/);
});
test('all asset layouts use compact numbered sections with cinematic rather than game fields',()=>{
 for(const [primary,classification,kind] of [['prop','weapon','item'],['prop','equipment','item'],['prop','general_prop','general'],['creature','','creature'],['creature','magical_being','character'],['character','','character'],['location','','location'],['room','','location']])assert.equal(assetFormKind(primary,classification),kind);
 assert.equal(ASSET_FORM_SECTIONS.character.length,5);for(const kind of ['item','creature','location','general'])assert.equal(ASSET_FORM_SECTIONS[kind].length,4);
 assert.doesNotMatch(JSON.stringify(ASSET_FORM_SECTIONS),/stat_modifiers|damage_attributes|loot_table|crafting_notes/);
});
test('creation writes one correctly categorized record and preserves existing records and references',()=>{
 for(const primary of ['prop','creature','vehicle','location','room','wardrobe']){
  const m=fixture(),next=saveAssetForm(m,'film',{asset_id:'NEW',primary_category:primary,create:true,expected_revision:7,confirm:true,reference_ids:['R'],metadata_patch:{display_name:'New film asset',description:'User-authored description'},expected_metadata_version:0});
  const row=assetMetadata(next,'film',8,'NEW');assert.equal(row.primary_category,primary);assert.equal(row.fields.display_name,'New film asset');assert.deepEqual(next.world_library.props.P,m.world_library.props.P);assert.deepEqual(next.references,m.references);
  assert.throws(()=>saveAssetForm(next,'film',{asset_id:'NEW',primary_category:primary,create:true,expected_revision:7,confirm:true}),/already exists/);
 }
});
test('stale projects, stale metadata, foreign images and anchor edits fail atomically',()=>{
 const m=fixture(),before=structuredClone(m);
 for(const args of [{...edit({description:'A'}),expected_revision:6},{...edit({description:'A'}),expected_metadata_version:2},{...edit({description:'A'}),reference_ids:['FOREIGN']},{...edit({description:'A'}),reference_ids:[]},{...edit({description:'A'}),world_metadata:{material_definition:'Different'}},{...edit({description:'A'}),primary_category:'creature'},{...edit({description:'A'}),classification:'magical_being',expected_classification_version:0}])assert.throws(()=>saveAssetForm(m,'film',args));
 assert.deepEqual(m,before);
});
test('draft references and native visual metadata round-trip; malformed fields cannot bypass validation',()=>{
 const m=fixture();m.world_library.props.P.status='DRAFT';const next=saveAssetForm(m,'film',{...edit({description:'Edited'}),world_metadata:{material_definition:'Painted aluminium',style_anchor:'RL'}});assert.equal(next.world_library.props.P.metadata.material_definition,'Painted aluminium');
 for(const world_metadata of [{__unknown:'x'},{material_definition:4},{material_definition:'a'.repeat(10001)}])assert.throws(()=>saveAssetForm(m,'film',{...edit({description:'A'}),world_metadata}));
});
test('reusable prompt versions preserve the original prompt and locked approval',()=>{
 const m=fixture();m.world_library.props.P.generation_prompt='Original author prompt';const next=saveAssetForm(m,'film',{...edit({description:'Updated'}),generation_prompt:'Cinematic close-up; practical blue glow; same approved sword',expected_prompt_version:0});const saved=assetMetadata(next,'film',8,'P');assert.equal(saved.generation_prompt.version,1);assert.equal(saved.generation_prompt.history[0].text,'Original author prompt');assert.equal(next.world_library.props.P.generation_prompt,'Original author prompt');assert.deepEqual(next.world_library.props.P.owner_image_approval,m.world_library.props.P.owner_image_approval);
});
