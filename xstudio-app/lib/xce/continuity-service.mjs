import {codedRecords,recordId} from './asset-codes.mjs';
import {canonical} from './core.mjs';
import {parseAssetCommand} from './asset-command.mjs';
import {validate} from './tools.mjs';
import {initializeIdentity,applyIdentityEdit,resolveIdentityEdit,decodeVin,assertIdentity,identityTokens,generationReferenceIds,vehicleFormatTokens,vehicleViewList,prepareVehicleView,recordVehicleView,compareVehicleEvidence,validateAspectRatio,identityReferenceIds} from './visual-identity.mjs';
import {vehicleSheet} from './vehicle-sheet.mjs';

const str={type:'string',maxLength:10000},id={type:'string',pattern:'^[a-zA-Z0-9_-]{1,128}$'},any={type:'object',properties:{},additionalProperties:true};
const actions=['read','parse_command','decode_vin','establish','verify_vin','edit','resolve_edit','evidence','resolve_discrepancy','prepare_view','prepare_sheet','record_sheet','approve_sheet','record_view','mark_view_not_applicable','finish_sheet','sheet'];
const checkNames=['body_configuration','paint','wheels_tires','grille_lights','trim_badges','interior_layout','seats_upholstery','modifications','camera'];
export const CONTINUITY_SCHEMA={type:'object',additionalProperties:false,required:['action'],properties:{
 action:{type:'string',enum:actions},project_id:{...id,maxLength:80},asset_id:id,asset_name:str,asset_type:{type:'string',enum:['character','vehicle']},command_text:str,vin:str,baseline:any,state:{type:'string',enum:['Factory Original','Custom Modified','Reference Matched']},instruction:str,intent:{type:'string',enum:['modify','verify']},changes:any,request_id:id,
 evidence:{type:'array',maxItems:100,items:{type:'object',additionalProperties:false,required:['field','value','source_type','source_reference_id'],properties:{field:str,value:str,source_type:{type:'string',enum:['build_sheet','reference_image','user_confirmed']},source_reference_id:id}}},
 discrepancy_index:{type:'integer',minimum:0},resolution:{type:'string',enum:['reference_corrected','authorized_customization']},view_id:str,aspect_ratio:str,mode:{type:'string',enum:['simple','complex']},medium:{type:'string',enum:['RL','CB']},reference_id:id,checks:{type:'object',additionalProperties:false,required:checkNames,properties:Object.fromEntries(checkNames.map(k=>[k,{type:'boolean'}]))},sheet_checks:{type:'object',additionalProperties:false,required:['face_identity','anatomy','wardrobe','format'],properties:Object.fromEntries(['face_identity','anatomy','wardrobe','format'].map(k=>[k,{type:'boolean'}]))},observations:str,approve:{type:'boolean'},approval_instruction:str,expected_identity_revision:{type:'integer',minimum:1},expected_revision:{type:'integer',minimum:1},confirm:{type:'boolean'},include_media:{type:'boolean'}
}};
export const continuityRead=action=>['read','parse_command','decode_vin','sheet'].includes(action);
const requireValue=(ok,message)=>{if(!ok)throw Error(message)};
export function continuityAsset(m,id){
 const hits=codedRecords(m).filter(e=>e.type!=='reference'&&(recordId(e.record)===id||e.record.asset_code===id||e.record.name===id));
 requireValue(hits.length===1&&!hits[0].record.deleted_at&&['character','vehicle'].includes(hits[0].type),'Character or vehicle not found in this project');
 const {record,type}=hits[0],profile=m.asset_details?.[recordId(record)]?.metadata_profile||{};
 return {record,type,asset:{...structuredClone(record),asset_type:type,asset_id:recordId(record),reference_ids:[...new Set([...(record.reference_ids||[]),record.source_image_id].filter(Boolean))],immutable_traits:structuredClone(record.immutable_traits||{silhouette:profile.anatomy||profile.appearance||record.metadata?.identity_lock||'',face_features:profile.facial_features||'',costume_layers:profile.wardrobe?[profile.wardrobe]:[],material_spec:record.metadata?.material_definition||'',other_locked_tokens:[]}),mode:record.mode||'simple',medium:record.medium||record.metadata?.style_anchor||'RL',target_deliverable:type==='vehicle'?'vehicle_turnaround':'character_turnaround'}};
}
export function continuityFormData(m,id,form){
 if(!form)return m;
 requireValue(form&&typeof form==='object'&&!Array.isArray(form)&&Object.keys(form).every(k=>['vin','edit_instruction','intent'].includes(k)),'Unsupported continuity form fields');
 const next=structuredClone(m),{record,type,asset}=continuityAsset(next,id);
 requireValue(!form.vin||type==='vehicle','VIN applies to vehicles only');
 if(!asset.visual_identity)initializeIdentity(asset,{vin:form.vin});
 else requireValue(!form.vin||asset.visual_identity.vin===String(form.vin).trim().toUpperCase(),'The established VIN cannot be replaced');
 if(form.edit_instruction?.trim()){if(record.status==='LOCKED'){const original=structuredClone(record);delete original.identity_versions;record.identity_versions=[...(record.identity_versions||[]),{saved_at:new Date().toISOString(),record:original}];record.status='DRAFT';delete record.owner_image_approval;delete record.locked_at;delete record.approval_instruction;}applyIdentityEdit(asset,{instruction:form.edit_instruction,intent:form.intent||'modify'});}
 record.visual_identity=asset.visual_identity;return next;
}
function prompt(asset,m){return asset.asset_type==='vehicle'?[(asset.aspect_ratio||'16:9')+' / cinematic vehicle reference',...vehicleFormatTokens(asset),...identityTokens(asset)].join('\n'):canonical(asset,m).join('\n');}
async function media(m,ids,getImage){
 requireValue(typeof getImage==='function','Private image retrieval unavailable');const images=[];let total=0;
 for(const id of ids){const ref=m.references?.[id];requireValue(ref?.key&&!ref.deleted_at&&ref.role!=='DIAGNOSTIC','Missing production reference '+id);const image=await getImage(ref.key);requireValue(image,'Missing image bytes '+id);const bytes=Buffer.from(await image.arrayBuffer());total+=bytes.length;requireValue(bytes.length<=6*1024*1024&&total<=40*1024*1024,'Reference bundle too large; narrow the requested references');requireValue(['image/png','image/jpeg','image/webp'].includes(ref.mime_type)&&image.httpMetadata?.contentType===ref.mime_type,'Reference MIME mismatch');images.push({reference_id:id,mime_type:ref.mime_type,image_base64:bytes.toString('base64')});}
 return images;
}
/** @param {any} manifest @param {string} project @param {number} revision @param {any} args @param {any} options */
export async function continuityOperation(manifest,project,revision,args,options={}){
 const {getImage,vinDecoder=decodeVin}=options;
 validate(CONTINUITY_SCHEMA,args);
 if(args.project_id)requireValue(args.project_id===project,'Project mismatch');
 if(args.action==='parse_command')return {data:parseAssetCommand(args.command_text,args)};
 if(args.action==='decode_vin')return {data:await vinDecoder(args.vin)};
 const m=structuredClone(manifest),{record,type,asset}=continuityAsset(m,args.asset_id||args.asset_name),action=args.action;
 requireValue(!args.asset_type||args.asset_type===type,'Asset category mismatch');
 const model=asset.visual_identity;
 if(action==='read'){
  const ids=generationReferenceIds(asset);return {data:{asset:record,asset_id:asset.asset_id,name:asset.name,asset_type:type,project_id:project,revision,identity:model||null,available_views:type==='vehicle'?vehicleViewList(asset):[],prompt:prompt(asset,m),reference_ids:ids,rendered:false,...(args.include_media?{images:await media(m,ids,getImage)}:{})}};
 }
 if(action==='sheet'){
  requireValue(type==='vehicle'&&model?.combined_sheet?.identity_revision===model.revision,'Combine the current approved views first');
  const sheet=await vehicleSheet({...asset,aspect_ratio:model.combined_sheet.aspect_ratio},async id=>{const images=await media(m,[id],getImage);return {mime_type:images[0].mime_type,base64:images[0].image_base64}});
  return {data:{asset_id:asset.asset_id,identity_revision:model.revision},sheet};
 }
 requireValue(args.confirm===true,'Confirm this explicit continuity operation');
 requireValue(args.expected_revision===revision,'Project changed; reload before saving');
 requireValue(!['STBY','BRNSTRM'].includes(m.mode),'Production is paused');
 requireValue(!Object.values(m.permits||{}).some(p=>p.asset_id===asset.asset_id&&p.state==='CLAIMED'),'Record the outstanding generation before changing identity');
 // Preserve exact approved originals as recoverable versions under the stable asset ID.
 if(record.status==='LOCKED'&&(['establish','verify_vin','edit','resolve_edit','evidence','resolve_discrepancy','approve_sheet'].includes(action)||action==='record_view'&&args.approve)){
  const original=structuredClone(record);delete original.identity_versions;
  record.identity_versions=[...(record.identity_versions||[]),{saved_at:new Date().toISOString(),record:original}];
  asset.status='DRAFT';delete asset.owner_image_approval;delete asset.locked_at;delete asset.approval_instruction;
 }
 if(action==='establish'){
  requireValue(!model,'Identity baseline already exists');initializeIdentity(asset,{vin:args.vin,verification:args.vin?await vinDecoder(args.vin):undefined,baseline:args.baseline||{},state:args.state});
 }else if(action==='verify_vin'){
  requireValue(model?.vin,'Saved VIN required');requireValue(!Object.keys(model.views).length,'VIN baseline must be verified before producing views');
  const verified=await vinDecoder(model.vin);model.vin_verification=verified;
  for(const [field,fact]of Object.entries(verified.verified_specifications)){
   const previous=model.base_identity[field];if(previous!==undefined&&String(previous).toLowerCase()!==String(fact.value).toLowerCase())model.discrepancies.push({field,reference_value:previous,verified_value:fact.value,source_reference_ids:[...asset.reference_ids],status:'unresolved'});
   model.base_identity[field]=fact.value;
  }
  model.base_snapshot=structuredClone(model.base_identity);model.active_visual_reference=structuredClone(model.base_identity);for(const edit of model.approved_modifications)if(edit.status==='resolved')Object.assign(model.active_visual_reference,edit.changes);model.revision++;
 }else if(action==='edit'||action==='resolve_edit'){
  if(!model)initializeIdentity(asset);
  requireValue(type!=='character'||Object.keys(args.changes||{}).every(k=>['costume_layers','material_spec'].includes(k)),'Wardrobe edits preserve facial identity, hair and body proportions');
  if(action==='edit')applyIdentityEdit(asset,{instruction:args.instruction,changes:args.changes||{},request_id:args.request_id,intent:args.intent||'modify'});
  else resolveIdentityEdit(asset,{request_id:args.request_id,changes:args.changes});
 }else if(action==='evidence'){
  requireValue(type==='vehicle','Vehicle evidence required');compareVehicleEvidence(asset,args.evidence||[]);
 }else if(action==='resolve_discrepancy'){
  const discrepancy=model?.discrepancies[args.discrepancy_index];requireValue(discrepancy?.status==='unresolved'&&args.instruction?.trim(),'Explicit discrepancy resolution required');
  if(args.resolution==='authorized_customization')requireValue(model.approved_modifications.some(e=>e.status==='resolved'&&Object.hasOwn(e.changes,discrepancy.field)),'Resolve the authorized modification first');
  else{requireValue(args.resolution==='reference_corrected'&&args.reference_id&&!(discrepancy.source_reference_ids||[discrepancy.source_reference_id]).includes(args.reference_id),'Choose a corrected replacement reference');const ref=m.references?.[args.reference_id];requireValue(ref?.key&&!ref.deleted_at&&ref.role!=='DIAGNOSTIC','Corrected reference missing');asset.reference_ids=[...new Set([...asset.reference_ids,args.reference_id])];discrepancy.corrected_reference_id=args.reference_id;}
  discrepancy.status=args.resolution;discrepancy.resolution_instruction=args.instruction;
 }else if(action==='prepare_sheet'){
  requireValue(type==='character'&&model,'Establish the character identity first');assertIdentity(asset,{production:true});asset.mode=args.mode||asset.mode;asset.medium=args.medium||asset.medium;asset.sheet_preparation={identity_revision:model.revision,mode:asset.mode,medium:asset.medium};
 }else if(action==='record_sheet'){
  requireValue(type==='character'&&model&&asset.sheet_preparation?.identity_revision===model.revision&&args.expected_identity_revision===model.revision,'Prepare this character sheet against the current identity first');
  const ref=m.references?.[args.reference_id];requireValue(ref?.key&&!ref.deleted_at&&ref.role!=='DIAGNOSTIC','Saved character-sheet output required');requireValue(args.observations?.trim()&&args.sheet_checks,'Actual sheet inspection and all four checks required');
  const prior=model.active_sheet,passed=Object.values(args.sheet_checks).every(Boolean);model.active_sheet={reference_id:args.reference_id,identity_revision:model.revision,status:passed?'reviewed':'flagged',checks:args.sheet_checks,observations:args.observations,history:[...(prior?.history||[]),...(prior?[{...prior,history:undefined}]:[])]};
  Object.assign(ref,{parent_asset_id:model.root_asset_id,identity_revision:model.revision});
 }else if(action==='approve_sheet'){
  const sheet=model?.active_sheet;requireValue(type==='character'&&sheet?.status==='reviewed'&&sheet.identity_revision===model.revision&&sheet.reference_id===args.reference_id&&args.approval_instruction?.trim(),'Explicit approval of the exact current reviewed character sheet required');
  sheet.status='approved';sheet.approval_instruction=args.approval_instruction;record.source_image_id=args.reference_id;
 }else if(action==='prepare_view'){
  requireValue(type==='vehicle'&&model,'Establish the vehicle identity first');asset.mode=args.mode||asset.mode;asset.medium=args.medium||asset.medium;prepareVehicleView(asset,args.view_id,args.aspect_ratio||'16:9');asset.view_preparations={...asset.view_preparations,[args.view_id]:{identity_revision:model.revision,aspect_ratio:asset.aspect_ratio,prepared_at:new Date().toISOString()}};
 }else if(action==='record_view'){
  requireValue(type==='vehicle'&&model,'Vehicle identity required');const prior=model.views[args.view_id];
  if(args.approve){requireValue(prior?.status==='reviewed'&&prior.reference_id===args.reference_id&&prior.identity_revision===model.revision&&args.approval_instruction?.trim(),'Approve only this exact current reviewed output');prior.status='approved';prior.approval_instruction=args.approval_instruction;record.source_image_id=args.reference_id;}
  else{
   requireValue(asset.view_preparations?.[args.view_id]?.identity_revision===model.revision&&args.expected_identity_revision===model.revision,'Prepare this view against the current identity before recording its output');
   recordVehicleView(asset,{view_id:args.view_id,reference_id:args.reference_id,checks:args.checks,observations:args.observations},m);
   Object.assign(m.references[args.reference_id],{parent_asset_id:model.root_asset_id,view_id:args.view_id,identity_revision:model.revision});
  }
 }else if(action==='mark_view_not_applicable'){
  requireValue(type==='vehicle'&&args.view_id==='rear_cabin'&&Number(model?.active_visual_reference.seat_rows)===1&&args.observations?.trim(),'A confirmed one-row vehicle and evidence notes are required');model.views.rear_cabin={status:'not_applicable',identity_revision:model.revision,observations:args.observations};
 }else if(action==='finish_sheet'){
  requireValue(type==='vehicle'&&model,'Vehicle identity required');const ratio=validateAspectRatio(args.aspect_ratio||asset.aspect_ratio||'16:9');
  // Validate approval/current-version completeness without copying original images into the manifest.
  await vehicleSheet({...asset,aspect_ratio:ratio},async()=>({mime_type:'image/png',base64:''}));
  model.combined_sheet={identity_revision:model.revision,aspect_ratio:ratio,reference_ids:Object.values(model.views).filter(v=>v.status==='approved'&&v.identity_revision===model.revision).map(v=>v.reference_id)};
 }else throw Error('Unsupported continuity operation');
 assertIdentity(asset);
 for(const ref of identityReferenceIds(asset))requireValue(m.references?.[ref]&&!m.references[ref].deleted_at,'Saved continuity reference is missing');
 Object.assign(record,{visual_identity:asset.visual_identity,...(asset.sheet_preparation?{sheet_preparation:asset.sheet_preparation}:{}),...(asset.view_preparations?{view_preparations:asset.view_preparations}:{}),...(asset.active_reference_view?{active_reference_view:asset.active_reference_view,aspect_ratio:asset.aspect_ratio}:{}),immutable_traits:asset.immutable_traits,mode:asset.mode,medium:asset.medium,status:asset.status,reference_ids:asset.reference_ids});
 if(asset.status==='DRAFT'){delete record.owner_image_approval;delete record.locked_at;delete record.approval_instruction;}
 const ids=generationReferenceIds(asset);m.permits={};
 return {manifest:m,data:{asset:record,asset_type:type,asset_id:asset.asset_id,project_id:project,identity:asset.visual_identity,reference_ids:ids,prompt:prompt(asset,m),rendered:false,...(asset.visual_identity?.combined_sheet?{combined_sheet_url:'/api/continuity?'+new URLSearchParams({action:'sheet',project_id:project,asset_id:asset.asset_id})}:{}),...(args.include_media?{images:await media(m,ids,getImage)}:{})}};
}
