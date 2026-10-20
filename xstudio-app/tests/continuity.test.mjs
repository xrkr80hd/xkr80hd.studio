import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {continuityOperation,continuityFormData,CONTINUITY_SCHEMA} from '../lib/xce/continuity-service.mjs';
import {saveAssetForm} from '../lib/xce/asset-form.mjs';
import {saveCharacterForm} from '../lib/xce/character-form.mjs';
import {worldRecords,validateWorld,bindProjectPrompt} from '../lib/xce/world-library.mjs';
import {approveAssetAnchor} from '../lib/xce/anchor-approval.mjs';
import {defaultComposition,compileComposition,resolveComposition} from '../lib/xce/composer.mjs';
import {dataSource} from '../lib/mcp/data.mjs';
import {toolSpecs} from '../lib/mcp/server.mjs';
import {decodeVin,VEHICLE_VIEWS} from '../lib/xce/visual-identity.mjs';
import * as service from '../lib/xce/continuity-service.mjs';
import * as access from '../lib/xce/composer-access.mjs';
import {parseAssetCommand} from '../lib/xce/asset-command.mjs';
import {byteStream} from '../lib/xce/response-stream.mjs';

const VIN='1HGCM82633A004352',bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jZl8AAAAASUVORK5CYII=','base64');
const baseline={make:'HONDA',model:'Accord',seat_rows:'2',seat_count:'5',seating_configuration:'front pair and rear bench',seat_material:'cloth',seat_color:'gray',paint:'white',grille:'factory'};
const checkNames=['body_configuration','paint','wheels_tires','grille_lights','trim_badges','interior_layout','seats_upholstery','modifications','camera'],checks=Object.fromEntries(checkNames.map(k=>[k,true]));
const fixture=()=>({revision:1,campaign_name:'Film',mode:'PRODUCTION',references:{R:{id:'R',name:'Original',key:'xce/owner/P/R',role:'PROP',mime_type:'image/png'},O:{id:'O',name:'Output',key:'xce/owner/P/O',role:'PROP',mime_type:'image/png'}},world_library:{vehicles:{V:{id:'V',type:'vehicles',name:'Custom truck',status:'DRAFT',reference_ids:['R'],metadata:{}}},characters:{C:{id:'C',type:'characters',name:'Monique',status:'DRAFT',reference_ids:['R'],metadata:{identity_lock:'Original face and body',traits:'Exact source',style_anchor:'RL'}}}}});
const image=async()=>({size:bytes.length,arrayBuffer:async()=>bytes,httpMetadata:{contentType:'image/png'}});
const vinDecoder=vin=>decodeVin(vin,async()=>Response.json({Results:[{VIN:vin,ErrorCode:'0',Make:'HONDA',Model:'Accord',ModelYear:'2003',BodyClass:'Sedan',SeatRows:'2',Seats:'5'}]}));
async function act(m,action,extra={},id='V'){
 const result=await continuityOperation(m,'P',m.revision,{action,asset_id:id,expected_revision:m.revision,confirm:true,...extra},{getImage:image,vinDecoder});
 return {result,next:result.manifest?{...result.manifest,revision:m.revision+1}:m};
}

test('native creation and reopening share continuity schema without dropping it during ordinary world edits',async()=>{
 let m=fixture();m=saveAssetForm(m,'P',{asset_id:'NEW',primary_category:'vehicle',create:true,expected_revision:1,confirm:true,reference_ids:['R'],metadata_patch:{display_name:'VIN vehicle'},expected_metadata_version:0,continuity:{vin:VIN,edit_instruction:'Red leather seats'}});
 assert.equal(m.world_library.vehicles.NEW.visual_identity.vin,VIN);assert.equal(m.world_library.vehicles.NEW.visual_identity.approved_modifications[0].status,'pending_resolution');
 const original=structuredClone(m.world_library.vehicles.NEW.visual_identity),validated=validateWorld(m.world_library,m);assert.deepEqual(validated.vehicles.NEW.visual_identity,original);
 const forged=structuredClone(m.world_library);forged.vehicles.NEW.visual_identity.active_visual_reference.paint='unauthorized';assert.throws(()=>validateWorld(forged,m),/continuity editor/);
 const changed=JSON.parse(JSON.stringify(m));assert.deepEqual(worldRecords(changed).find(r=>r.id==='NEW').visual_identity,original);
 m=saveCharacterForm(fixture(),'P',{asset_id:'NEWCHAR',create:true,expected_revision:1,operations:[{action:'metadata_update',expected_version:0,patch:{display_name:'New Monique'}},{action:'character_images',reference_ids:['R'],anchors:{}}],continuity:{edit_instruction:'baby-blue Walker uniform'}});assert.equal(m.world_library.characters.NEWCHAR.visual_identity.approved_modifications[0].instruction,'baby-blue Walker uniform');
});

test('VIN verification, custom interior edits, source facts and layered state persist in the native record',async()=>{
 let {next:m}=await act(fixture(),'establish',{vin:VIN,baseline});const original=structuredClone(m.world_library.vehicles.V.visual_identity.base_identity);
 ({next:m}=await act(m,'edit',{instruction:'red leather seats',changes:{seat_color:'red',seat_material:'leather'}}));
 ({next:m}=await act(m,'edit',{instruction:'lifted suspension',changes:{suspension:'lifted'}}));
 const identity=m.world_library.vehicles.V.visual_identity;assert.deepEqual(identity.base_identity,original);assert.equal(identity.active_visual_reference.grille,'factory');assert.equal(identity.active_visual_reference.seat_color,'red');assert.equal(identity.approved_modifications.length,2);assert.equal(identity.vin_verification.verified_specifications.seat_material,undefined);
 const read=(await act(m,'read')).result;assert.equal(read.data.identity.active_visual_reference.seating_configuration,baseline.seating_configuration);assert.equal(read.data.asset.id,'V');
 await assert.rejects(act(m,'prepare_view',{view_id:'front',expected_revision:1}),/Project changed/);
});

test('one-view regeneration preserves other approved angles; stale reviews and failed continuity cannot be approved',async()=>{
 let {next:m}=await act(fixture(),'establish',{baseline});
 for(const view of ['front','rear']){
  ({next:m}=await act(m,'prepare_view',{view_id:view,aspect_ratio:'9:16'}));
  const current=m.world_library.vehicles.V.visual_identity.revision;
  await assert.rejects(act(m,'record_view',{view_id:view,reference_id:'O',expected_identity_revision:current+1,checks,observations:'Fixture'}),/current identity/);
  ({next:m}=await act(m,'record_view',{view_id:view,reference_id:'O',expected_identity_revision:current,checks,observations:'Fixture metadata review only'}));
  ({next:m}=await act(m,'record_view',{view_id:view,reference_id:'O',approve:true,approval_instruction:'Explicit fixture approval'}));
 }
 const rear=JSON.stringify(m.world_library.vehicles.V.visual_identity.views.rear);
 ({next:m}=await act(m,'prepare_view',{view_id:'front'}));assert.equal(JSON.stringify(m.world_library.vehicles.V.visual_identity.views.rear),rear);
 ({next:m}=await act(m,'record_view',{view_id:'front',reference_id:'O',expected_identity_revision:m.world_library.vehicles.V.visual_identity.revision,checks:{...checks,paint:false},observations:'Paint discrepancy'}));
 await assert.rejects(act(m,'record_view',{view_id:'front',reference_id:'O',approve:true,approval_instruction:'Approve'}),/current reviewed/);assert.equal(JSON.stringify(m.world_library.vehicles.V.visual_identity.views.rear),rear);
});

test('native character edits preserve original locked version, face and proportions and cannot bypass lock checks',async()=>{
 let m=fixture();m.world_library.characters.C.status='LOCKED';m.world_library.characters.C.source_image_id='R';m.world_library.characters.C.owner_image_approval={sha256:'a'.repeat(64)};
 const original=structuredClone(m.world_library.characters.C);
 m=continuityFormData(m,'C',{edit_instruction:'baby-blue Walker uniform'});assert.deepEqual(m.world_library.characters.C.identity_versions[0].record,original);assert.equal(m.world_library.characters.C.status,'DRAFT');
 assert.throws(()=>approveAssetAnchor(m,{asset_id:'C',source_image_id:'R',confirm:true,sha256:'a'.repeat(64)}),/pending/);
 const pending=m.world_library.characters.C.visual_identity.approved_modifications[0];
 ({next:m}=await act(m,'resolve_edit',{request_id:pending.id,changes:{costume_layers:['baby-blue Walker uniform']}},'C'));
 const face=m.world_library.characters.C.visual_identity.base_identity.face_features;
 await assert.rejects(act(m,'edit',{instruction:'Change uniform',changes:{face_features:'different face'}},'C'),/facial identity/);
 assert.equal(m.world_library.characters.C.visual_identity.active_visual_reference.face_features,face);
 ({next:m}=await act(m,'prepare_sheet',{mode:'complex',medium:'CB'},'C'));assert.match((await act(m,'read',{},'C')).result.data.prompt,/complex six-view/);assert.equal(m.world_library.characters.C.medium,'CB');
 ({next:m}=await act(m,'prepare_sheet',{mode:'simple',medium:'RL'},'C'));
 await assert.rejects(act(m,'record_sheet',{reference_id:'O',expected_identity_revision:m.world_library.characters.C.visual_identity.revision,sheet_checks:{face_identity:true,anatomy:true,wardrobe:true,format:true},sheet_layout:{asset_type:'character',mode:'simple',medium:'RL',core_views:['front_body','profile_body','three_quarter_body','rear_body','front_face','profile_face'],total_panels:9,rows:2},observations:'Seven body images above two faces'},'C'),/six columns/);
 ({next:m}=await act(m,'prepare_sheet',{mode:'complex',medium:'CB'},'C'));
 const sheet_checks={face_identity:true,anatomy:true,wardrobe:true,format:true};
 ({next:m}=await act(m,'record_sheet',{reference_id:'O',expected_identity_revision:m.world_library.characters.C.visual_identity.revision,sheet_checks,sheet_layout:{asset_type:'character',mode:'complex',medium:'CB',core_views:['front_body','profile_body','three_quarter_body','rear_body','front_face','profile_face'],total_panels:6,rows:2},observations:'Inspected face, anatomy, uniform and requested complex comic layout'},'C'));
 ({next:m}=await act(m,'approve_sheet',{reference_id:'O',approval_instruction:'Approve the displayed sheet'},'C'));
 assert.equal(m.world_library.characters.C.source_image_id,'O');assert.equal(m.world_library.characters.C.visual_identity.active_sheet.status,'approved');
 const read=(await act(m,'read',{},'C')).result.data;assert.ok(read.reference_ids.includes('O'));
 const locked=approveAssetAnchor(m,{asset_id:'C',source_image_id:'O',confirm:true,sha256:'a'.repeat(64)});assert.equal(locked.asset.status,'LOCKED');
 ({next:m}=await act(m,'edit',{instruction:'black shoes',changes:{costume_layers:['baby-blue Walker uniform','black shoes']}},'C'));
 assert.equal(m.world_library.characters.C.visual_identity.active_sheet.status,'needs_review');
});

test('native scene compiler includes active continuity and refuses unresolved edits',async()=>{
 let {next:m}=await act(fixture(),'establish',{baseline});m.world_library.vehicles.V.status='LOCKED';const config=defaultComposition();config.placements=[{asset_id:'V',x:50,y:50,plane:'midground',action:'as described'}];
 const resolved=resolveComposition(m,'P',config),proof=Object.fromEntries(resolved.references.map(id=>[id,{sha256:'a'.repeat(64),byte_length:bytes.length}]));
 assert.match(compileComposition(m,'P',config,proof).final_cinematic_prompt,/Active visual reference/);assert.match(bindProjectPrompt(m,'P','Use @[Custom truck]').prompt,/Active visual reference/);
 ({next:m}=await act(m,'edit',{instruction:'Red seats'}));m.world_library.vehicles.V.status='LOCKED';assert.throws(()=>resolveComposition(m,'P',config),/pending/);
});

test('native API and MCP share project, permission and compare-and-swap gates with actual image blocks',async()=>{
 let m=fixture(),revision=1,saves=0;
 const request=async a=>{if(a.op==='load')return {data:{manifest:JSON.stringify(m),revision}};if(a.op==='save'){saves++;assert.equal(a.revision,revision);m=JSON.parse(a.manifest);revision++;return {changes:1}};throw Error('Unexpected operation')};
 const read=dataSource({projects:new Set(['P']),scopes:new Set(['asset:read'])},request,{getImage:image});
 await assert.rejects(read('manage_asset_identity',{project_id:'P',asset_id:'V',action:'establish',confirm:true,expected_revision:1}),/Metadata permission/);assert.equal(saves,0);
 const edit=dataSource({projects:new Set(['P']),scopes:new Set(['asset:metadata'])},request,{getImage:image});
 const saved=await edit('manage_asset_identity',{project_id:'P',asset_id:'V',action:'establish',baseline,confirm:true,expected_revision:1});assert.equal(saved.revision,2);
 const current=await read('get_asset_identity',{project_id:'P',asset_id:'V',include_media:true});assert.equal(current.images[0].image_base64,bytes.toString('base64'));
 await assert.rejects(edit('manage_asset_identity',{project_id:'OTHER',asset_id:'V',action:'edit',instruction:'New wheels',confirm:true,expected_revision:2}),/unavailable/);
 m.folder_lock={};await assert.rejects(read('get_asset_identity',{project_id:'P',asset_id:'V'}),/unavailable/);
 const names=toolSpecs.map(t=>t[0]);for(const name of ['get_asset_identity','verify_vehicle_vin','manage_asset_identity'])assert(names.includes(name));assert.equal(CONTINUITY_SCHEMA.properties.action.enum.includes('prepare_view'),true);
});

test('actual native HTTP handler reads, writes, verifies persistence and streams the combined sheet',async()=>{
 let m=fixture(),revision=1,writes=0;
 const request=async a=>{if(a.op==='load')return {data:{manifest:JSON.stringify(m),revision}};if(a.op==='save'){writes++;m=JSON.parse(a.manifest);revision++;return {changes:1}};throw Error('Unexpected request')};
 const module={exports:{}},code=ts.transpileModule(readFileSync(new URL('../lib/xce/continuity-api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const json=(data,status=200)=>Response.json(data,{status});
 new Function('require','module','exports',code)(name=>name==='./composer-api'?{connection:async req=>{access.authorizeTransport(req);return request},json}:name.includes('composer-access')?access:name.includes('continuity-service')?service:name.includes('response-stream')?{byteStream}:name.includes('xstudio-providers')?{readBounded:async req=>Buffer.from(await req.text())}:name.includes('composer-media')?{referenceReader:()=>image}:{},module,module.exports);
 const api=module.exports.continuityRequest,call=(action,extra={})=>api(new Request('https://xstudio.xrkr80hd.studio/api/continuity',{method:'POST',headers:{origin:'https://xstudio.xrkr80hd.studio','content-type':'application/json'},body:JSON.stringify({action,project_id:'P',asset_id:'V',confirm:true,expected_revision:revision,...extra})}));
 let response=await call('establish',{baseline});assert.equal(response.status,200);assert.equal(writes,1);
 response=await call('edit',{instruction:'custom wheels',changes:{wheels:'custom'},expected_revision:0});assert.equal(response.status,400);assert.equal(writes,1);
 const identity=m.world_library.vehicles.V.visual_identity;for(const view of VEHICLE_VIEWS)identity.views[view.id]={reference_id:'O',status:'approved',identity_revision:identity.revision};
 response=await call('finish_sheet',{aspect_ratio:'9:16'});assert.equal(response.status,200);
 response=await api(new Request('https://xstudio.xrkr80hd.studio/api/continuity?'+new URLSearchParams({action:'sheet',project_id:'P',asset_id:'V'})));assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/svg/);assert.match(await response.text(),/width="2160" height="3840"/);
 const bad=await api(new Request('https://xstudio.xrkr80hd.studio/api/continuity',{method:'POST',headers:{origin:'https://evil.example'},body:'{}'}));assert.equal(bad.status,403);
});


// MVS descriptors are requested labels, never VIN-verified specifications.
test('MVS vehicle syntax supports make/model/trim, optional VIN and multiline edits while MCS stays character',()=>{
 for(const command of ['mvs','mvsrlsmpl','mvsrlcmplx','mvscbsmpl','mvscbcmplx']){
  const parsed=parseAssetCommand(`${command} - Honda - Accord - EX ${VIN}\nedit red leather seats, custom wheels`);
  assert.equal(parsed.asset_type,'vehicle');assert.equal(parsed.name,'Honda Accord EX');assert.equal(parsed.vin,VIN);assert.equal(parsed.project_name,undefined);
  assert.deepEqual(parsed.vehicle_description,{make:'Honda',model:'Accord',trim:'EX'});assert.equal(parsed.edit_instruction,'red leather seats, custom wheels');
 }
 assert.equal(parseAssetCommand('mvs - Custom - Truck - Lifted\nEDIT: black grille').vin,undefined);
 assert.equal(parseAssetCommand('mvs - Film - Truck').project_name,'Film');
 assert.equal(parseAssetCommand(`mvs - Honda - Accord - EX - ${VIN}`).vin,VIN);
 assert.throws(()=>parseAssetCommand(`mvs - Honda - Accord - EX ${VIN.slice(0,-1)}1`),/check/);
 assert.equal(parseAssetCommand('mcsrlsmpl - Film - Monique\nedit baby-blue uniform').asset_type,'character');
});
