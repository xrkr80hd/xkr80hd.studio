import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareAutoArgs} from '../lib/xce/namespace.mjs';
import {fresh} from '../lib/xce/core.mjs';
import {cleanUploadName,genericUploadName} from '../lib/xce/clean-name.mjs';
function project(){const m=fresh();m.campaign_name='Final Fantasy VI';m.active_project_code='FF6';m.manifest_store.characters['FF6-CH-DOMA-SOLDIER-v1']={asset_id:'FF6-CH-DOMA-SOLDIER-v1',asset_type:'character',name:'Doma Soldier',namespace_root:'FF6-CH-DOMA-SOLDIER',reference_ids:[],status:'DRAFT'};m.active_asset_id='FF6-CH-DOMA-SOLDIER-v1';return m;}
test('a location upload never borrows the selected character name',()=>{
 const a=prepareAutoArgs(project(),'register_reference',{role:'LOCATION',name:'FF6 - OPERA HOUSE EXTERIOR - LOCATION REFERENCE.PNG [Props and Locations]',mime_type:'image/png',image_base64:'x'});
 assert.equal(a.asset_type,'location');assert.notEqual(a.asset_name,'Doma Soldier');assert.match(a.asset_name,/Opera House Exterior/);
});
test('a named character file keeps its own name even while another character is selected',()=>{
 const a=prepareAutoArgs(project(),'register_reference',{role:'IDENTITY',name:'Celes Chere.png',mime_type:'image/png',image_base64:'x'});
 assert.equal(a.asset_name,'Celes Chere');
});
test('an unnamed sheet for the selected character still joins that character',()=>{
 const a=prepareAutoArgs(project(),'register_reference',{role:'IDENTITY',name:'image-gen-3.png',mime_type:'image/png',image_base64:'x'});
 assert.equal(a.asset_name,'Doma Soldier');assert.match(a.reference_id,/^FF6-CH-DOMA-SOLDIER-v\d+$/);
});
test('filename cleaning drops extensions, folder tags and copy numbers',()=>{
 assert.equal(cleanUploadName('Zoda(1).jpg'),'Zoda');assert.equal(cleanUploadName('wht_heli [Props and Locations]'),'wht heli');
 assert.equal(genericUploadName('3D5F802A-84CD-4E5A-A384-6D264505342A.jpeg'),true);assert.equal(genericUploadName('Bola'),false);
});
