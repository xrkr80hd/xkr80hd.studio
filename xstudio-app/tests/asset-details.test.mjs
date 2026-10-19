import test from 'node:test';
import assert from 'node:assert/strict';
import {saveAssetDetails,assetContext,assetContextPrompt} from '../lib/xce/asset-details.mjs';
import {defaultComposition,previewPrompt} from '../lib/xce/composer.mjs';
import {catalogue,prepareComposition} from '../lib/xce/composer-service.mjs';
import {bindProjectPrompt} from '../lib/xce/world-library.mjs';
import {canonical} from '../lib/xce/core.mjs';
const fixture=()=>({manifest_store:{characters:{C:{asset_id:'C',name:'Mog',asset_type:'character',status:'LOCKED',source_image_id:'RC'}},props:{P:{asset_id:'P',name:'Sword',asset_type:'prop',status:'LOCKED',source_image_id:'RP'}},creatures:{B:{asset_id:'B',name:'Beast',status:'LOCKED',source_image_id:'RB'}}},world_library:{vehicles:{V:{id:'V',name:'Airship',type:'vehicles',status:'LOCKED',reference_ids:['RV'],metadata:{}}}},references:Object.fromEntries(['RC','RP','RB','RV'].map(id=>[id,{key:id,mime_type:'image/png',role:'PROP'}]))});
const details={description:'A short silver sword.',clauses:[{character_id:'C',text:'Mog carries the sword in his right hand.',enabled:true}]};
test('saved description preserves IDs, locked records and exact image references',()=>{const m=fixture(),before=structuredClone(m),next=saveAssetDetails(m,'P',details);assert.deepEqual(m,before);assert.deepEqual(next.manifest_store,m.manifest_store);assert.deepEqual(next.references,m.references);assert.equal(next.asset_details.P.description,details.description);});
test('clauses activate only for both selected assets, never insert an absent character',()=>{const m=saveAssetDetails(fixture(),'P',details);for(const ids of [[],['P'],['C'],['P','B']])assert.equal(assetContext(m,ids).clauses.length,0);assert.equal(assetContext(m,['P','C']).clauses[0].text,details.clauses[0].text);m.asset_details.P.clauses[0].enabled=false;assert.equal(assetContext(m,['P','C']).clauses.length,0);});
test('native vehicles and beasts support descriptions without character-only clauses',()=>{let m=saveAssetDetails(fixture(),'V',{description:'A red airship.',clauses:[]});m=saveAssetDetails(m,'B',{description:'A scaled beast.',clauses:[]});assert.match(assetContextPrompt(assetContext(m,['V','B'])),/red airship/);assert.throws(()=>saveAssetDetails(m,'V',details),/only available for props/);assert.throws(()=>saveAssetDetails(m,'FOREIGN',details),/Choose an asset/);assert.throws(()=>saveAssetDetails(m,'P',{...details,clauses:[{...details.clauses[0],character_id:'B'}]}),/Choose a character/);});
test('preview, verified output, canonical asset and project binding include saved descriptions',async()=>{let m=saveAssetDetails(fixture(),'P',details);m=saveAssetDetails(m,'V',{description:'A red airship.',clauses:[]});const c=defaultComposition();c.placements=['P','C','V'].map(asset_id=>({asset_id,x:50,y:50,plane:'midground',action:'as described'}));const data=catalogue(m,'TEST',1);assert.match(previewPrompt('TEST',c,data.assets,data.grades,data),/short silver sword/);const bytes=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),Buffer.from('test image')]);const {output}=await prepareComposition(m,'TEST',c,async()=>({size:bytes.length,arrayBuffer:async()=>bytes,httpMetadata:{contentType:'image/png'}}));assert.match(output.final_cinematic_prompt,/short silver sword/);assert.match(output.final_cinematic_prompt,/Mog carries the sword/);assert.match(output.final_cinematic_prompt,/red airship/);assert.match(canonical(m.manifest_store.props.P,m).join('\n'),/short silver sword/);assert.match(bindProjectPrompt(m,'TEST','@[Sword] with @[Mog]').prompt,/Mog carries the sword/);});

test('one edit saves name, description, classification and character sorting without replacing a locked image',async()=>{
 const {editAsset}=await import('../lib/xce/asset-edit.mjs');const m=fixture(),before=structuredClone(m);
 const result=editAsset(m,'P',{...details,name:'Mog’s Sword',classification:'Sword',category:'props'});
 assert.equal(result.asset.asset_id,'P');assert.equal(result.asset.name,'Mog’s Sword');assert.equal(result.asset.status,'LOCKED');assert.equal(result.manifest.asset_details.P.classification,'Sword');assert.deepEqual(result.manifest.references,m.references);assert.deepEqual(m,before);
 const character=editAsset(m,'C',{name:'Mog',category:'characters',description:'Small moogle.',classification:'',clauses:[],cast_group:'main',gender:'male'});assert.equal(character.manifest.character_cast_groups.C,'main');assert.equal(character.manifest.character_network.details.C.gender,'male');
 assert.throws(()=>editAsset(m,'P',{...details,name:''}),/Enter a name/);
});
test('native locked rename keeps one record and its anchor',async()=>{
 const {editAsset}=await import('../lib/xce/asset-edit.mjs');const m=fixture(),r=editAsset(m,'V',{name:'Falcon',category:'vehicles',description:'Red airship.',classification:'Airship',clauses:[]});assert.equal(r.asset.id,'V');assert.equal(r.asset.status,'LOCKED');assert.deepEqual(r.asset.reference_ids,['RV']);assert.deepEqual(Object.keys(r.manifest.world_library.vehicles),['V']);
});

test('duplicating an asset carries its description and classification without creating a character',async()=>{
 const {fresh}=await import('../lib/xce/core.mjs'),{transfer}=await import('../lib/xce/transfer.mjs');const source={...fresh(),...fixture()},dest=fresh();source.asset_details={P:{...details,classification:'Sword'}};source.campaign_name='Source';dest.campaign_name='Destination';
 const result=transfer(source,dest,{entity:'prop',id:'P',operation:'duplicate',project_id:'source',destination_project_id:'dest'});
 assert.equal(dest.asset_details[result.id].description,details.description);assert.equal(dest.asset_details[result.id].classification,'Sword');assert.deepEqual(dest.asset_details[result.id].clauses,[]);assert.equal(Object.keys(dest.manifest_store.characters).length,0);
});
