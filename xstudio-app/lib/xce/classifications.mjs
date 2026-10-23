import {codedRecords,recordId} from './asset-codes.mjs';
export const CLASSIFICATIONS={main_cast:'Main Cast',supporting_cast:'Supporting Cast',villain:'Villain',background_character:'Background Character',anthropomorphic:'Anthropomorphic / Beastfolk',magical_being:'Magical Being / Esper',creature_beast:'Creature / Beast',weapon:'Weapon',equipment:'Equipment',general_prop:'General Prop',vehicle:'Vehicle',location:'Location'};
export const CLASSIFICATION_TYPES={main_cast:['character'],supporting_cast:['character'],villain:['character','creature'],background_character:['character','creature'],anthropomorphic:['character','creature'],magical_being:['character','creature'],creature_beast:['character','creature'],weapon:['prop'],equipment:['prop'],general_prop:['prop'],vehicle:['vehicle'],location:['location','room']};
export function classificationValue(m,id){
 const d=m.asset_details?.[id];if(d&&Object.hasOwn(d,'secondary_classification'))return d.secondary_classification;
 const known={weapons:'weapon',magical_beings:'magical_being',beasts:'creature_beast'}[d?.library_category];
 if(known)return known;
 return {main:'main_cast',supporting:'supporting_cast',villain:'villain',background:'background_character'}[m.character_cast_groups?.[id]]||'';
}
export function classificationRows(m,project,revision){return codedRecords(m).filter(({record:r,type})=>type!=='reference'&&!r.deleted_at&&!r.discarded_for_production).map(({record:r,type})=>({asset_id:recordId(r),project_id:project,name:r.name||r.asset_name||recordId(r),primary_category:type,secondary_classification:classificationValue(m,recordId(r)),lock_status:r.status||'DRAFT',asset_code:r.asset_code||null,version:m.asset_details?.[recordId(r)]?.classification_version||0,asset_version:r.version??null,revision}));}
export const CLASSIFICATION_SCHEMA={version:'1.0.0',classifications:CLASSIFICATIONS,applicable_primary_categories:CLASSIFICATION_TYPES,metadata_only:true,max_batch_size:50,version_meaning:'classification metadata version; asset_version is unchanged',operations:{read:{action:'classifications',project_id:'required'},update:{action:'classify',project_id:'required',asset_id:'required',classification:'enum or empty to clear',expected_version:'required integer',expected_revision:'required integer',confirm:true},bulk_update:{action:'classify_bulk',project_id:'required',updates:'1–50 {asset_id, classification, expected_version}',expected_revision:'required integer',confirm:true}},empty_classification:'Clear classification without changing the primary category',partial_errors:'Valid items saved together; invalid items returned individually. Project revision conflict aborts all writes.'};
export function classifyAssets(m,project,revision,expectedRevision,updates){
 if(expectedRevision!==revision)throw Error('Project changed; reload before classifying');
 if(!Array.isArray(updates)||!updates.length||updates.length>50)throw Error('Choose 1–50 existing assets');
 const next=structuredClone(m),rows=classificationRows(m,project,revision),counts=new Map();
 for(const u of updates)if(u&&typeof u.asset_id==='string')counts.set(u.asset_id,(counts.get(u.asset_id)||0)+1);
 const results=[];let changed=0;
 for(const u of updates){const id=u?.asset_id,row=rows.find(r=>r.asset_id===id);let error;
  if(!u||Object.keys(u).some(k=>!['asset_id','classification','expected_version'].includes(k)))error='Invalid classification fields';
  else if(!row)error='Asset not found in this project';
  else if(counts.get(id)!==1)error='Duplicate asset ID in batch';
  else if(!Number.isInteger(u.expected_version)||u.expected_version!==row.version)error='Classification changed; reload asset';
  else if(u.classification!==''&&(!Object.hasOwn(CLASSIFICATIONS,u.classification)||!CLASSIFICATION_TYPES[u.classification].includes(row.primary_category)))error='Classification is not applicable to this primary category';
  if(error){results.push({asset_id:typeof id==='string'?id:null,ok:false,error});continue;}
  if(row.secondary_classification!==u.classification){next.asset_details||={};const old=next.asset_details[id]||{};next.asset_details[id]={...old,secondary_classification:u.classification,classification_version:row.version+1,classification_updated_at:new Date().toISOString()};next.history||=[];next.history.push({kind:'asset_classification',id,from:row.secondary_classification,to:u.classification,version:row.version+1,date:new Date().toISOString()});changed++;}
  results.push({asset_id:id,ok:true});
 }
 return {manifest:next,changed,results,assets:classificationRows(next,project,revision+(changed?1:0)).filter(r=>results.some(s=>s.ok&&s.asset_id===r.asset_id))};
}
