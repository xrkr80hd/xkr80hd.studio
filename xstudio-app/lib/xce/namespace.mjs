import {need,categories,findAsset} from './core.mjs';
export const autoIdRules={module:'auto_id_parser',version:'1.0.0',rules:{auto_prefix_derivation:true,require_manual_id:false,type_prefixes:{character:'CH',creature:'CR',prop:'PR',location:'LOC',vehicle:'VH',scene:'SB',keyframe:'SB'},id_format:'{PROJECT_CODE}-{TYPE}-{ASSET_NAME}-v{VERSION}'}};
export function slug(name){const s=String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,54).replace(/-+$/,'');need(s,'Give this item a name');return s;}
export function deriveCode(name){
 const value=String(name||'').trim().replace(/^CMPN\s+/i,'');need(value,'Project name required');
 const compact=value.toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(/^(STARTROPICS|SRT)$/.test(compact))return 'SRT';
 if(/^(FINALFANTASYVI|FINALFANTASY6|FF6)$/.test(compact))return 'FF6';
 if(/^[A-Z][A-Z0-9]{1,3}$/.test(value))return value;
 const words=value.replace(/([a-z])([A-Z])/g,'$1 $2').toUpperCase().match(/[A-Z0-9]+/g)||[];
 const code=words.length>1?words.map(w=>/^\d+$/.test(w)?w:w[0]).join('').slice(0,4):compact.slice(0,3);
 return code.length>=2?code:code+'X';
}
export function lockNamespace(m,code){m.active_project_code ||= code||deriveCode(m.campaign_name||'Project');m.auto_id_parser ||= {...autoIdRules,counters:{},scene_index:0};m.auto_id_parser.counters ||= {};m.manifest_store.vehicles ||= {};m.manifest_store.creatures ||= {};m.auto_id_parser.rules ||= structuredClone(autoIdRules.rules);m.auto_id_parser.rules.type_prefixes ||= {...autoIdRules.rules.type_prefixes};m.auto_id_parser.rules.type_prefixes.creature='CR';return m.active_project_code;}
export function records(m,entity){return entity==='scene'?Object.values(m.scenes):entity==='reference'?Object.values(m.references):entity?Object.values(m.manifest_store[categories[entity]]||{}):Object.values(m.manifest_store).flatMap(Object.values);}
export function rootFor(m,entity,name){lockNamespace(m);const type=autoIdRules.rules.type_prefixes[entity];need(type,'Unknown item category');return `${m.active_project_code}-${type}-${slug(name)}`;}
const recordId=r=>r.asset_id||r.scene_id||r.id;
const recordRoot=r=>r.namespace_root||recordId(r)?.replace(/-v\d+$/,'');
const recordVersion=r=>r.namespace_version||Number(recordId(r)?.match(/-v(\d+)$/)?.[1])||0;
const allIds=m=>[...Object.keys(m.references),...Object.keys(m.scenes),...records(m).map(recordId),...Object.values(m.trash||{}).map(t=>recordId(t.record||{}))];
export function allocate(m,entity,name,root){root ||= rootFor(m,entity,name);lockNamespace(m);const ids=allIds(m);let v=m.auto_id_parser.counters[root]||0;for(const id of ids){if(id?.startsWith(root+'-v')&&/^\d+$/.test(id.slice(root.length+2)))v=Math.max(v,Number(id.slice(root.length+2)))}do{v++}while(ids.includes(root+'-v'+v));m.auto_id_parser.counters[root]=v;return root+'-v'+v;}
export function newSceneId(m){lockNamespace(m);let root;do{m.auto_id_parser.scene_index++;root=`${m.active_project_code}-SB-SC${String(m.auto_id_parser.scene_index).padStart(2,'0')}`}while(Object.keys(m.scenes).some(id=>id===root||id.startsWith(root+'-v')));return allocate(m,'scene','',root);}
export function shotId(m,scene,number){if(!m.active_project_code)return `${scene.scene_id}-shot-${number}`;const root=scene.namespace_root||scene.scene_id.replace(/-v\d+$/,'');return `${root}-SH${String(number).padStart(2,'0')}-v${scene.namespace_version||Number(scene.scene_id.match(/-v(\d+)$/)?.[1])||1}`;}
export function annotate(record,m,entity){const id=recordId(record);const match=id?.match(/^(.*)-v(\d+)$/);if(match){record.namespace_root=match[1];record.namespace_version=Number(match[2]);}record.project_code=m.active_project_code;record.category=categories[entity]||entity;return record;}
export function resolve(m,entity,target,{locked=false,active=true,deleted=false}={}){
 const list=deleted?Object.entries(m.trash||{}).filter(([key,t])=>(t.entity||key.split(':')[0])===entity).map(([,t])=>t.record):entity==='character'?[...records(m,'character'),...records(m,'creature')]:entity==='prop'?[...records(m,'prop'),...records(m,'vehicle')]:records(m,entity);
 if(target){const exact=list.find(r=>recordId(r)===target);if(exact){need(!locked||exact.status==='LOCKED','This anchor is not locked');return exact;}}
 let matches=target?list.filter(r=>slug(r.name||recordId(r))===slug(target)||(r.asset_name&&slug(r.asset_name)===slug(target))||(autoIdRules.rules.type_prefixes[r.asset_type||entity]&&r.namespace_root===rootFor(m,r.asset_type||entity,target))):[];
 if(!target&&active&&m.active_asset_id){const r=list.find(r=>recordId(r)===m.active_asset_id);if(r)matches=list.filter(v=>recordRoot(v)===recordRoot(r));}
 if(locked)matches=matches.filter(r=>r.status==='LOCKED');
 need(matches.length,'No saved '+(entity||'asset')+' matches. Choose its name.');
 const roots=new Set(matches.map(recordRoot));need(roots.size===1,'More than one item matches. Choose the item by name from the library.');
 matches.sort((a,b)=>recordVersion(b)-recordVersion(a)||String(b.locked_at||'').localeCompare(String(a.locked_at||'')));return matches[0];
}
export function inheritedReferences(m,entity,name){const root=rootFor(m,entity,name);const roles={character:['IDENTITY','COSTUME','STYLE'],creature:['IDENTITY','COSTUME','STYLE'],prop:['PROP','STYLE'],vehicle:['PROP','STYLE'],location:['LOCATION','STYLE'],scene:['BLUEPRINT']}[entity]||[];const refs=records(m,'reference').filter(r=>roles.includes(r.role)&&(r.namespace_root===root||r.asset_name&&slug(r.asset_name)===slug(name)&&r.asset_type===entity));const latest=new Map();for(const r of refs){const key=r.role;const prev=latest.get(key);if(!prev||(r.namespace_version||0)>(prev.namespace_version||0))latest.set(key,r)}return [...latest.values()].map(r=>r.id);}
export function prepareAutoArgs(m,tool,input){
 const a=structuredClone(input);lockNamespace(m);
 const get=(entity,target,opts)=>recordId(resolve(m,entity,target,opts));
 const arrays=(data)=>{for(const [field,entity]of [['character_ids','character'],['assigned_character_ids','character'],['prop_ids','prop'],['location_ids','location']])if(data[field])data[field]=data[field].map(x=>get(entity,x,{locked:['prepare_storyboard_shot','save_scene_blueprint'].includes(tool)}));};
 if(tool==='manage_record'){
  if(a.entity==='project'||a.action==='list')return a;
  if(a.action==='create'){a.id ||= a.entity==='scene'?newSceneId(m):allocate(m,a.entity,a.data?.name);if(a.entity!=='scene'&&!a.data?.reference_ids?.length)a.data.reference_ids=inheritedReferences(m,a.entity,a.data?.name);}
  else{a.id=get(a.entity,a.id||a.target_name,{deleted:a.action==='restore'});const r=a.action==='restore'?null:resolve(m,a.entity,a.id);if(a.action==='update'&&(r.status==='LOCKED'||a.entity==='scene'&&Object.keys(r.shots||{}).length)&&Object.keys(a.data||{}).some(k=>k!=='name'))a.new_version_id ||= allocate(m,a.entity,r.name,r.namespace_root);}
  if(a.data){arrays(a.data);if(a.data.blueprint_id)a.data.blueprint_id=get('reference',a.data.blueprint_id);if(a.data.reference_ids)a.data.reference_ids=a.data.reference_ids.map(x=>get('reference',x));}delete a.target_name;
 }
 if(tool==='register_reference'){
  const activeAsset=a.asset_name?null:findAsset(m,m.active_asset_id)||m.scenes[m.active_scene];const entity=a.asset_type||activeAsset?.asset_type||(activeAsset?.scene_id?'scene':null)||({IDENTITY:'character',COSTUME:'character',PROP:'prop',LOCATION:'location',BLUEPRINT:'scene',STYLE:'character',DIAGNOSTIC:'character'})[a.role];
  need(entity,'Choose what this image is for: character, prop, location, vehicle, or scene');a.role ||= ({character:'IDENTITY',creature:'IDENTITY',prop:'PROP',vehicle:'PROP',location:'LOCATION',scene:'BLUEPRINT',keyframe:'BLUEPRINT'})[entity];
  const name=a.asset_name||activeAsset?.name||String(a.name||'Image').replace(/\.[^.]+$/,'');a.name ||= name;a.reference_id ||= allocate(m,entity==='keyframe'?'scene':entity,name,activeAsset?.namespace_root);a.asset_type=entity;a.asset_name=name;
 }
 if(tool==='save_draft_asset'){a.asset_id ||= allocate(m,a.asset_type,a.name);a.reference_ids ||= inheritedReferences(m,a.asset_type,a.name);if(!a.reference_ids.length)a.reference_ids=inheritedReferences(m,a.asset_type,a.name);a.reference_ids=a.reference_ids.map(x=>get('reference',x));if(a.supersedes)a.supersedes=get(a.asset_type,a.supersedes,{locked:true});}
 if(tool==='prepare_wardrobe_edit'){const parsedName=a.command_text&&a.command_text.match(/\s+(.+?)\s+(?:[-–—]\s*)?edit\s*:?/i)?.[1];const target=a.base_asset_id||a.asset_name||parsedName;let base;if(a.base_asset_id)base=resolve(m,'character',target);else{try{base=resolve(m,'character',target,{locked:true})}catch(e){if(!e.message.startsWith('No saved'))throw e;base=resolve(m,'character',target)}}a.base_asset_id=base.asset_id;a.asset_id ||= allocate(m,'character',base.name,base.namespace_root);delete a.asset_name;}
 if(['guardrail_preflight','lock_asset_anchor','finish_simple_sheet'].includes(tool)){a.asset_id=get(a.asset_type,a.asset_id||a.asset_name);delete a.asset_name;}
 if(tool==='get_reference'){const active=findAsset(m,m.active_asset_id);a.reference_id=get('reference',a.reference_id||a.asset_name||active?.source_image_id||active?.reference_ids?.at(-1)||m.active_reference_id);delete a.asset_name;}
 if(tool==='save_scene_blueprint'){a.scene_id ||= newSceneId(m);a.blueprint_id ||= inheritedReferences(m,'scene',a.name||'Scene').at(-1);need(a.blueprint_id,'Upload a scene composition image first');a.blueprint_id=get('reference',a.blueprint_id);arrays(a);}
 if(tool==='prepare_storyboard_shot'){a.scene_id=get('scene',a.scene_id||a.scene_name||m.active_scene);const s=m.scenes[a.scene_id];if(!Object.keys(s.shots||{}).length&&!a.assigned_character_ids){for(const [field,type]of [['character_ids','character'],['prop_ids','prop'],['location_ids','location']])s[field]=s[field].map(id=>get(type,findAsset(m,id)?.name||id,{locked:true}));}a.assigned_character_ids ||= s.character_ids;arrays(a);delete a.scene_name;}
 if(tool==='transfer_record'){a.id=get(a.entity,a.id||a.target_name);delete a.target_name;}
 return a;
}
