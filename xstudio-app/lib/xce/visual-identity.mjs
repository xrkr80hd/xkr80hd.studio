// Shared by creation, editing, prompt compilation and view review. No browser storage.
const requireValue=(ok,message)=>{if(!ok)throw Error(message)};
const copy=value=>structuredClone(value);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export const VEHICLE_VIEWS=[
 ['front','FRONT','Straight-on frontal elevation, centered and symmetrical.'],
 ['front_three_quarter','FRONT 3/4',"Front three-quarter from the driver side."],
 ['driver_profile','PROFILE 1',"Full driver-side profile, exactly perpendicular."],
 ['rear','REAR','Straight-on rear elevation, centered and symmetrical.'],
 ['rear_three_quarter','REAR 3/4',"Rear three-quarter from the passenger side."],
 ['passenger_profile','PROFILE 2',"Full passenger-side profile, exactly perpendicular."],
 ['top_down','TOP-DOWN','True 90-degree overhead showing the entire vehicle, roof, hood and bed when present.'],
 ['front_cabin','FRONT CABIN',"Camera at the actual driver-side opening, horizontally across front cabin toward passenger side. Show front seats, upholstery, dashboard, steering wheel and console."],
 ['rear_cabin','REAR CABIN',"Camera at the actual passenger-side rear seating access, horizontally across rear seating toward driver side. Use a real rear door when present; otherwise use the actual available cabin access. Show real seat count, arrangement, materials, stitching and trim. Never invent a rear door or rear seats."]
].map(([id,label,camera])=>({id,label,camera}));
export const THIRD_ROW={id:'third_row',label:'THIRD ROW',camera:'Supplementary third-row view through a physically accessible opening. Preserve actual access and seating geometry.'};
export const VEHICLE_FIELDS=['manufacturer','model_year','make','model','body_configuration','trim','wheelbase','paint','wheels','tires','suspension','ride_height','cab_configuration','bed_length','window_tint','grille','headlights','taillights','badges','accessories','doors','steering_position','seat_rows','seat_count','seating_configuration','seat_material','seat_color','seat_materials_by_row','upholstery_by_row','upholstery_pattern','stitching','dashboard','console','interior_trim'];
const CHARACTER_FIELDS=['silhouette','face_features','costume_layers','material_spec','color_palette_hex','other_locked_tokens'];
const identityFields=a=>a.asset_type==='vehicle'?VEHICLE_FIELDS:CHARACTER_FIELDS;
const unknown=value=>value==null||String(value).trim()===''||/^(?:not applicable|not available|unknown|n\/a)$/i.test(String(value).trim());

export function validateVin(value){
 const vin=String(value||'').trim().toUpperCase();
 requireValue(/^[A-HJ-NPR-Z0-9]{17}$/.test(vin),'VIN must contain 17 letters/digits, excluding I, O and Q.');
 const alphabet='ABCDEFGHJKLMNPRSTUVWXYZ',numbers=[1,2,3,4,5,6,7,8,1,2,3,4,5,7,9,2,3,4,5,6,7,8,9];
 const weights=[8,7,6,5,4,3,2,10,0,9,8,7,6,5,4,3,2];
 const remainder=[...vin].reduce((sum,char,i)=>sum+(Number.isNaN(Number(char))?numbers[alphabet.indexOf(char)]:Number(char))*weights[i],0)%11;
 const check=remainder===10?'X':String(remainder);
 // Mandatory for North American VINs; other markets still require decoder validation.
 const required=/^[1-5]/.test(vin);
 requireValue(!required||vin[8]===check,'VIN check digit is invalid. Verify the supplied VIN.');
 return {vin,format_valid:true,check_digit_status:vin[8]===check?'valid':required?'invalid':'not_applicable'};
}

export async function decodeVin(value,fetcher=fetch){
 const checked=validateVin(value),url='https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/'+checked.vin+'?format=json';
 let response,data;
 try{response=await fetcher(url,{redirect:'error',signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error();data=await response.json()}catch{return {...checked,status:'unavailable',verified_specifications:{},unverified_fields:VEHICLE_FIELDS,source_url:url,message:'VIN service unavailable. Factory details remain unverified; retry verification before factory-authenticated production.'}}
 const row=data.Results?.[0];
 requireValue(row&&String(row.VIN||'').toUpperCase()===checked.vin,'VIN decoder returned a mismatched vehicle');
 const errors=String(row.ErrorCode??'').split(',').map(s=>s.trim());
 const valid=errors.length>0&&errors.every(code=>code==='0');
 const map={manufacturer:'Manufacturer',model_year:'ModelYear',make:'Make',model:'Model',body_configuration:'BodyClass',trim:'Trim',wheelbase:'WheelBaseShort',doors:'Doors',seat_rows:'SeatRows',seat_count:'Seats'};
 const facts={};if(valid)for(const [key,source]of Object.entries(map))if(!unknown(row[source]))facts[key]={value:String(row[source]).trim(),source_type:'vin_decoder',source_url:url,verified_at:new Date().toISOString()};
 return {...checked,status:valid&&['make','model','model_year'].every(k=>facts[k])?'verified':'unverified',verified_specifications:facts,unverified_fields:VEHICLE_FIELDS.filter(k=>!facts[k]),source_url:url,decoder_errors:errors,message:valid?'Decoder fields only; exact installed trim, packages, wheels and upholstery require build data or actual references.':String(row.ErrorText||'VIN decoding did not fully validate. No factory specifications were accepted.')};
}

export function splitEdit(text){
 const match=/(?:^|\s)(?:[-–—]\s*)?edit(?:[ \t]*:[ \t]*|[ \t]+)/i.exec(text);
 if(!match)return {head:text.trim()};
 const head=text.slice(0,match.index).replace(/\s*[-–—]\s*$/,'').trim(),instruction=text.slice(match.index+match[0].length).trim();
 requireValue(instruction,'Provide the requested modification after edit:');
 return {head,edit_instruction:instruction,edit_intent:/^(?:take note of|verify|investigate|confirm|check)\b/i.test(instruction)?'verify':'modify'};
}

/** @param {any} asset @param {any} options */
export function initializeIdentity(asset,options={}){
 const {vin,verification,baseline={},state}=options;
 requireValue(['vehicle','character'].includes(asset.asset_type),'Identity continuity supports characters and vehicles');
 requireValue(!asset.visual_identity,'Base identity already exists; use an authorized edit');
 const fields=identityFields(asset);requireValue(Object.keys(baseline).every(k=>fields.includes(k)),'Unknown baseline attribute');
 requireValue(state!=='Custom Modified','Custom Modified is derived from resolved approved edits');
 const base=asset.asset_type==='character'?copy(asset.immutable_traits):copy(baseline);
 const decoded=verification?.verified_specifications||{};
 const discrepancies=[];
 for(const [field,fact]of Object.entries(decoded)){
  if(!unknown(base[field])&&!equal(String(base[field]).toLowerCase(),String(fact.value).toLowerCase()))discrepancies.push({field,reference_value:base[field],verified_value:fact.value,source_reference_ids:[...(asset.reference_ids||[])],status:'unresolved'});
  base[field]=fact.value;
 }
 const checked=vin?validateVin(vin):null;
 if(verification)requireValue(checked?.vin===verification.vin,'VIN verification does not match this asset');
 asset.visual_identity={schema_version:'1.0.0',root_asset_id:asset.asset_id,revision:1,base_identity:base,base_snapshot:copy(base),approved_modifications:[],active_visual_reference:copy(base),state:state||(verification?.status==='verified'?'Factory Original':'Reference Matched'),vin:checked?.vin||null,vin_verification:verification||{status:vin?'unverified':'not_supplied',verified_specifications:{},unverified_fields:asset.asset_type==='vehicle'?VEHICLE_FIELDS:[]},discrepancies,views:{},history:[]};
 if(state==='Factory Original')requireValue(!vin||verification?.status==='verified','Factory Original with VIN requires successful verification');
 return asset.visual_identity;
}

export function applyIdentityEdit(asset,{instruction,changes={},request_id=crypto.randomUUID(),intent='modify'}){
 const model=asset.visual_identity;requireValue(model,'Establish the base identity first');
 requireValue(typeof instruction==='string'&&instruction.trim(),'Explicit edit instruction required');
 requireValue(!model.approved_modifications.some(e=>e.id===request_id),'Edit request already exists; reload its saved record');
 const allowed=identityFields(asset);requireValue(Object.keys(changes).every(k=>allowed.includes(k)),'Unsupported modification attribute');
 // Verification requests record intent without creating fabricated custom features.
 requireValue(['modify','verify'].includes(intent),'Unknown edit intent');
 requireValue(intent!=='verify'||!Object.keys(changes).length,'Verification instructions cannot modify appearance');
 const record={id:request_id,instruction:instruction.trim().replace(/^edit\s*:\s*/i,''),intent,changes:copy(changes),status:intent==='verify'?'verification_requested':Object.keys(changes).length?'resolved':'pending_resolution',created_at:new Date().toISOString()};
 model.history.push({revision:model.revision,active_visual_reference:copy(model.active_visual_reference),state:model.state});
 model.approved_modifications.push(record);model.revision++;
 Object.assign(model.active_visual_reference,copy(changes));
 if(Object.keys(changes).length)model.state='Custom Modified';
 if(asset.asset_type==='character')Object.assign(asset.immutable_traits,copy(changes));
 for(const view of Object.values(model.views))if(Object.keys(changes).length&&view.status==='approved')view.status='needs_review';
 if(model.active_sheet?.status==='approved')model.active_sheet.status='needs_review';
 asset.generation_review=null;
 return record;
}

export function resolveIdentityEdit(asset,{request_id,changes}){
 const model=asset.visual_identity,edit=model?.approved_modifications.find(e=>e.id===request_id);
 requireValue(edit?.status==='pending_resolution','Choose a pending edit request');
 requireValue(changes&&Object.keys(changes).length,'Resolve explicitly requested attributes before generation');
 requireValue(Object.keys(changes).every(k=>identityFields(asset).includes(k)),'Unsupported modification attribute');
 edit.changes=copy(changes);edit.status='resolved';
 model.active_visual_reference=copy(model.base_identity);
 for(const entry of model.approved_modifications)Object.assign(model.active_visual_reference,copy(entry.changes));
 model.revision++;model.state='Custom Modified';
 if(asset.asset_type==='character')Object.assign(asset.immutable_traits,copy(model.active_visual_reference));
 for(const view of Object.values(model.views))if(view.status==='approved')view.status='needs_review';
 if(model.active_sheet?.status==='approved')model.active_sheet.status='needs_review';
 asset.generation_review=null;return edit;
}

export function assertIdentity(asset,{production=false}={}){
 const model=asset.visual_identity;if(!model)return;
 requireValue(equal(model.base_identity,model.base_snapshot),'Locked base identity changed');
 const expected=copy(model.base_identity);for(const edit of model.approved_modifications)if(edit.status==='resolved')Object.assign(expected,edit.changes);
 requireValue(equal(expected,model.active_visual_reference),'Active appearance differs from approved modifications');
 if(asset.asset_type==='character')for(const key of CHARACTER_FIELDS)requireValue(equal(asset.immutable_traits[key],expected[key]),'Character attribute changed outside the authorized edit: '+key);
 if(production){
  requireValue(!model.approved_modifications.some(e=>e.status==='pending_resolution'),'Resolve pending edit attributes before production');
  requireValue(!model.discrepancies.some(d=>d.status==='unresolved'),'Resolve VIN/reference discrepancies before production');
  if(model.vin)requireValue(model.vin_verification.status==='verified','Verify the VIN before production; no factory details were fabricated');
 }
}

export function identityReferenceIds(asset){
 const ids=[];const scan=value=>{if(!value||typeof value!=='object')return;for(const [key,item]of Object.entries(value)){if(['reference_id','source_reference_id'].includes(key)&&typeof item==='string')ids.push(item);else scan(item)}};
 scan(asset.visual_identity);return [...new Set(ids)];
}
export function generationReferenceIds(asset){
 const excluded=new Set((asset.visual_identity?.discrepancies||[]).filter(d=>d.status==='reference_corrected').flatMap(d=>[...(d.source_reference_ids||[]),d.source_reference_id].filter(Boolean)));
 return [...new Set([...(asset.reference_ids||[]).filter(id=>!excluded.has(id)),...(asset.visual_identity?.active_sheet?.status==='approved'&&asset.visual_identity.active_sheet.identity_revision===asset.visual_identity.revision?[asset.visual_identity.active_sheet.reference_id]:[]),...Object.entries(asset.visual_identity?.views||{}).filter(([key,view])=>key!==asset.active_reference_view&&view.status==='approved'&&view.identity_revision===asset.visual_identity.revision).map(([,view])=>view.reference_id)])];
}

export function identityTokens(asset,{production=false}={}){
 const model=asset.visual_identity;if(!model)return [];
 assertIdentity(asset,{production});
 return ['ONE ASSET. ONE IDENTITY. MULTIPLE CAMERA ANGLES. ZERO UNAUTHORIZED CHANGES.',
  'Identity root: '+model.root_asset_id+'; revision: '+model.revision+'; state: '+model.state,
  'Locked base identity: '+JSON.stringify(model.base_identity),
  'Approved attribute changes: '+JSON.stringify(model.approved_modifications.filter(e=>e.status==='resolved').map(e=>e.changes)),
  'Active visual reference: '+JSON.stringify(model.active_visual_reference),
  ...(asset.asset_type==='vehicle'?['VIN verification: '+model.vin_verification.status+'; verified factory evidence: '+JSON.stringify(model.vin_verification.verified_specifications),'Unverified vehicle details (do not invent): '+model.vin_verification.unverified_fields.join(', ')]:[]),
  'For explicitly modified attributes, approved active values override the corresponding original reference or factory baseline values. Use the exact assigned image references for every other feature. Preserve all unrelated features. Camera and clothing changes do not authorize identity or geometry changes. Never print internal identity, VIN or edit metadata inside an image.'];
}

export function vehicleViewList(asset){
 const list=[...VEHICLE_VIEWS];if(Number(asset.visual_identity?.active_visual_reference?.seat_rows)===3)list.push(THIRD_ROW);return list;
}
export function vehicleFormatTokens(asset){
 const view=asset.active_reference_view&&vehicleViewList(asset).find(v=>v.id===asset.active_reference_view);
 requireValue(!asset.active_reference_view||view,'Invalid vehicle camera view');
 return [
  'Vehicle reference: one consistent cinematic production asset across all camera angles.',
  asset.mode==='complex'?'Complex sheet: nine core views with source-evidenced details and optional verified third-row reference.':'Simple sheet: nine core vehicle views without additional detail insets.',
  view?'Single full-frame reference image: '+view.label+'. '+view.camera:'Nine-view cinematic vehicle reference sheet. '+VEHICLE_VIEWS.map(v=>v.label+': '+v.camera).join(' '),
  'Neutral consistent lighting and clean neutral background for compositing. No dealership scenery, brand header or promotional overlay. Preserve actual vehicle badges. Exact body geometry, wheelbase, paint, wheels, tires, lights, grille, trim and accessories in every angle. No perspective distortion or hidden invented equipment.',
  'Preserve exact cabin layout, steering position, row count, seat count, materials and colors. Respect real openings and access. If a rear cabin does not exist, flag that view as not applicable; never invent seats or doors. Missing visual details need source evidence before rendering.',
  asset.medium==='CB'?'Comic-book rendering preserving the same locked design.':'Photographic full-scale cinematic vehicle reference, suitable for AI video. No game-asset or miniature treatment.'
 ];
}

export function prepareVehicleView(asset,view_id,aspect_ratio='16:9'){
 requireValue(asset.asset_type==='vehicle','Vehicle reference required');assertIdentity(asset,{production:true});
 validateAspectRatio(aspect_ratio);
 const view=vehicleViewList(asset).find(v=>v.id===view_id);requireValue(view,'Unknown or unavailable vehicle view');
 const model=asset.visual_identity,active=model.active_visual_reference;
 if(view_id==='rear_cabin')requireValue(Number(active.seat_rows)>1,'Rear seating must be verified or reference-matched; this view may be not applicable');
 if(view_id.endsWith('cabin')||view_id==='third_row')requireValue(['seating_configuration','seat_material','seat_color'].every(k=>!unknown(active[k])),'Interior seating configuration, materials and colors need verified build data or observed references');
 asset.active_reference_view=view_id;asset.aspect_ratio=aspect_ratio;
 return {view,aspect_ratio,identity_revision:model.revision,requires_pixel_review:true};
}

export function validateAspectRatio(aspect_ratio){
 requireValue(/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(aspect_ratio)&&aspect_ratio.split(':').every(n=>Number(n)>0&&Number(n)<=100),'Invalid aspect ratio');
 return aspect_ratio;
}

export function recordVehicleView(asset,{view_id,reference_id,checks,observations,approve=false},manifest){
 const model=asset.visual_identity;requireValue(model&&vehicleViewList(asset).some(v=>v.id===view_id),'Unknown vehicle view');
 requireValue(reference_id&&manifest.references[reference_id]&&manifest.references[reference_id].role!=='DIAGNOSTIC','Saved non-diagnostic output required');
 requireValue(observations?.trim(),'Actual visual inspection notes required');
 const fields=['body_configuration','paint','wheels_tires','grille_lights','trim_badges','interior_layout','seats_upholstery','modifications','camera'];
 requireValue(fields.every(k=>typeof checks?.[k]==='boolean'),'All continuity checks must be reported, including non-applicable attributes');
 const passed=fields.every(k=>checks[k]);requireValue(!approve||passed,'Inconsistent views cannot be approved');
 const old=model.views[view_id];model.views[view_id]={reference_id,identity_revision:model.revision,status:passed?(approve?'approved':'reviewed'):'flagged',checks:copy(checks),observations,history:[...(old?.history||[]),...(old?[{...old,history:undefined}]:[])]};
 return model.views[view_id];
}

export function compareVehicleEvidence(asset,evidence){
 const model=asset.visual_identity;requireValue(model,'Establish identity first');
 for(const item of evidence){
  requireValue(VEHICLE_FIELDS.includes(item.field),'Unknown vehicle evidence attribute');
  requireValue(['build_sheet','reference_image','user_confirmed'].includes(item.source_type),'Unsupported evidence type');
  requireValue(item.source_reference_id&&asset.reference_ids.includes(item.source_reference_id),'Evidence must reference an image assigned to this asset');
  requireValue(!unknown(item.value),'Evidence value required');
  const fact=model.vin_verification.verified_specifications[item.field];
  if(fact&&!equal(String(fact.value).toLowerCase(),String(item.value).toLowerCase())){
   model.discrepancies.push({field:item.field,reference_value:item.value,verified_value:fact.value,source_reference_id:item.source_reference_id,status:'unresolved'});continue;
  }
  // Evidence enriches the factory baseline only before it is frozen for production.
  requireValue(!Object.keys(model.views).length&&!model.approved_modifications.some(edit=>edit.status==='resolved'&&Object.keys(edit.changes).length),'Baseline is locked; add a new approved edit to change established details');
  model.base_identity[item.field]=copy(item.value);model.base_snapshot=copy(model.base_identity);model.active_visual_reference=copy(model.base_identity);
  model.vin_verification.verified_specifications[item.field]={value:copy(item.value),source_type:item.source_type,source_reference_id:item.source_reference_id,verified_at:new Date().toISOString()};
  model.vin_verification.unverified_fields=model.vin_verification.unverified_fields.filter(k=>k!==item.field);
 }
 model.revision++;return model;
}
