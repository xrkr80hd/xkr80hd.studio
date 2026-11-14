import {assignCastGroup} from './cast-groups.mjs';
import {setPowerTier} from './power-tier.mjs';
// XCE world package: plans and applies a `fin` ZIP (read by world-package-read.mjs)
// into a saved world. Server-side; never deletes, never locks, never overwrites by default.
import {WORLD_BUILDER_FIELDS,updateWorldBuilder} from './world-builder-fields.mjs';
import {WORLD_FIELDS,emptyWorld,worldRecords} from './world-library.mjs';
import {assetMetadata,updateAssetMetadata} from './asset-metadata.mjs';
import {characterLinks,saveCharacterDetails} from './character-network.mjs';
import {assignAssetCodes,codedRecords,recordId} from './asset-codes.mjs';
import {allocate,annotate} from './namespace.mjs';
import {CATEGORY_TYPE,CATEGORY_ROLE,need,same,norm} from './world-package-read.mjs';
export * from './world-package-read.mjs';
const MAX_PRODUCTION_FILE_BYTES=250_000;

// projects: [{id,title}] for the signed-in owner. chosen: a project the user picked, or null.
// A new world's name; adds " (2)", " (3)"… when a world already uses it.
export function uniqueWorldName(projects,name){
 const base=String(name||'').trim().slice(0,190)||'Imported world',taken=new Set(projects.filter(p=>!p.system_pool).map(p=>norm(p.title)));
 if(!taken.has(norm(base)))return base;for(let n=2;n<1000;n++){const next=base+' ('+n+')';if(!taken.has(norm(next)))return next;}
 throw Error('Choose a different world name');
}
/** @param {{id:string,title:string,system_pool?:boolean}[]} projects @param {any} pkg @param {string|null} [chosen] @param {{createNew?:boolean,name?:string}} [options] */
export function resolveWorld(projects,pkg,chosen=null,{createNew=false,name=''}={}){
 const live=projects.filter(p=>!p.system_pool);
 if(createNew){const wanted=String(name||'').trim()||pkg.world_name||'Imported world',unique=uniqueWorldName(live,wanted);return {mode:'create',project_id:null,name:unique,reason:unique===wanted.trim().slice(0,190)?'You chose to create a new world':'You chose to create a new world; '+wanted+' is taken, so this one is '+unique,mismatch:false,create_new:true};}
 if(chosen){const hit=live.find(p=>p.id===chosen);need(hit,'Choose one of your worlds');const mismatch=(pkg.project_id&&pkg.project_id!==hit.id)||(!pkg.project_id&&pkg.world_name&&norm(pkg.world_name)!==norm(hit.title));return {mode:'existing',project_id:hit.id,name:hit.title,reason:'Chosen world',mismatch};}
 if(pkg.project_id){const hit=live.find(p=>p.id===pkg.project_id);if(hit)return {mode:'existing',project_id:hit.id,name:hit.title,reason:'Matched the world ID inside the ZIP',mismatch:false};}
 if(pkg.world_name){const hits=live.filter(p=>norm(p.title)===norm(pkg.world_name));if(hits.length===1)return {mode:'existing',project_id:hits[0].id,name:hits[0].title,reason:'Matched the world name',mismatch:false};if(hits.length>1)return {mode:'ambiguous',project_id:null,name:pkg.world_name,reason:'More than one world has this name; choose one',candidates:hits.map(h=>({id:h.id,title:h.title})),mismatch:false};}
 return {mode:'create',project_id:null,name:pkg.world_name||'Imported world',reason:pkg.world_name?'No world with this name yet; a new one will be created':'No world name in the ZIP; a new world will be created',mismatch:false};
}

function findExisting(m,asset){
 const type=CATEGORY_TYPE[asset.category];
 if(asset.existing_asset_id){const hit=codedRecords(m).find(e=>recordId(e.record)===asset.existing_asset_id||e.record.asset_code===asset.existing_asset_id);if(hit)return recordId(hit.record);}
 const hits=codedRecords(m).filter(({record:r,type:t})=>!r.deleted_at&&t===type&&norm(r.name)===norm(asset.name));
 return hits.length===1?recordId(hits[0].record):null;
}
function savedDetails(m,id){try{return assetMetadata(m,'',0,id).fields}catch{return {}}}

// What will happen, without changing anything. m is the saved manifest (or null for a new world).
export function planImport(m,pkg){
 const world=Object.entries(pkg.world_builder).map(([field,incoming])=>{const saved=m?.world_builder?.[field]||'';return {field,label:WORLD_BUILDER_FIELDS[field].label,action:!saved.trim()?'fill':same(saved,incoming)?'same':'conflict',saved,incoming};});
 const assets=pkg.assets.map(a=>{const id=m?findExisting(m,a):null,fields=id?savedDetails(m,id):{};
  const details=Object.entries(a.details).map(([field,incoming])=>{const saved=fields[field]||'';return {field,action:!saved.trim()?'fill':same(saved,incoming)?'same':'conflict',saved,incoming};});
  return {key:a.key,name:a.name,category:a.category,action:id?'update':'create',asset_id:id,details,image_count:pkg.images.filter(i=>i.asset_key===a.key).length};});
 const unsorted=pkg.images.filter(i=>!i.asset_key).length,tooLarge=pkg.images.filter(i=>i.too_large).map(i=>i.file);
 return {world,assets,relationships:pkg.relationships.length,images:pkg.images.length,unsorted_images:unsorted,too_large:tooLarge,conflicts:world.filter(w=>w.action==='conflict').length+assets.reduce((n,a)=>n+a.details.filter(d=>d.action==='conflict').length,0)};
}

// choices: {"world:<field>":"zip"|"keep", "asset:<key>:<field>":"zip"|"keep"}; default keep.
// Applies records only (no image bytes). Returns {manifest, id_map, report}.
export function applyRecords(original,pkg,{project_id,revision,choices={},now=new Date().toISOString(),newId=()=>crypto.randomUUID()}){
 let m=structuredClone(original);const report={world_fields:[],created:[],updated:[],kept:[],relationships:0},id_map={};
 const use=(key,action)=>action==='fill'||(action==='conflict'&&choices[key]==='zip');
 const plan=planImport(m,pkg);
 const patch={};for(const w of plan.world){if(use('world:'+w.field,w.action)){patch[w.field]=w.incoming;report.world_fields.push(w.label);}else if(w.action==='conflict')report.kept.push(w.label);}
 // Project style and type fill in only when the project has none yet; a set choice is never overwritten.
 for(const [k,v] of Object.entries(pkg.project_settings||{}))if(!m.world_builder?.[k]){patch[k]=v;report.world_fields.push(k==='visual_style'?'Visual style':'Project type');}
 if(Object.keys(patch).length)updateWorldBuilder(m,patch);
 for(const a of plan.assets){
  const src=pkg.assets.find(x=>x.key===a.key);let id=a.asset_id;
  if(!id){
   id=newId();
   if(a.category==='creatures'){m.manifest_store||={};m.manifest_store.creatures||={};m.manifest_store.creatures[id]={asset_id:id,asset_type:'creature',name:src.name,status:'DRAFT',reference_ids:[],immutable_traits:{},mode:'simple',medium:'RL',target_deliverable:'creature_sheet',analysis_pending:true,imported_from_package:true};}
   else {m.world_library={...emptyWorld(),...m.world_library};m.world_library[a.category]={...m.world_library[a.category],[id]:{id,type:a.category,name:src.name,status:'DRAFT',reference_ids:[],thumbnail_reference_id:'',metadata:Object.fromEntries(WORLD_FIELDS[a.category].map(k=>[k,'']))}};}
   assignAssetCodes(m);report.created.push(src.name);
  }else report.updated.push(src.name);
  id_map[a.key]=id;
  const fields={};for(const d of a.details){if(use('asset:'+a.key+':'+d.field,d.action))fields[d.field]=d.incoming;else if(d.action==='conflict')report.kept.push(src.name+' — '+d.field.replaceAll('_',' '));}
  if(Object.keys(fields).length){const version=assetMetadata(m,project_id,revision,id).version;m=updateAssetMetadata(m,project_id,revision,id,version,fields).manifest;}
  if(src.power_tier&&!m.asset_details?.[id]?.power_tier)m=setPowerTier(m,id,src.power_tier,a.category);
 if(src.narrative_role&&(!m.character_cast_groups?.[id]||m.character_cast_groups[id]==='general'))m=assignCastGroup(m,id,src.narrative_role,worldRecords(m));
 if(src.entity_type&&!m.asset_details?.[id]?.entity_type){m.asset_details||={};m.asset_details[id]={...m.asset_details[id],entity_type:src.entity_type};}
 if(Object.keys(src.presets||{}).length&&m.world_library?.[a.category]?.[id]){const rec=m.world_library[a.category][id];if(rec.status!=='LOCKED'){rec.metadata={...rec.metadata};for(const [k,v] of Object.entries(src.presets))if(!rec.metadata[k])rec.metadata[k]=v;}}
 if(a.category==='characters'&&(src.quick_details||src.gender)){const saved=m.character_network?.details?.[id]?.text||'';const details={};if(src.quick_details&&!saved.trim())details.quick_details=src.quick_details;if(src.gender)details.gender=src.gender;if(Object.keys(details).length)Object.assign(m,saveCharacterDetails(m,id,details,worldRecords(m)));}
 }
 for(const r of pkg.relationships){const from=id_map[r.from],to=id_map[r.to];if(!from||!to)continue;const fromAsset=pkg.assets.find(x=>x.key===r.from);if(fromAsset?.category!=='characters')continue;
  const links=characterLinks(m,from);// The site keeps text and clause type only for custom rules; built-in kinds are unique per pair.
  if(links.some(l=>l.target_id===to&&l.kind===r.kind&&(r.kind!=='custom'||(same(l.text,r.text)&&(l.clause_type||'relationship')===r.clause_type))))continue;
  Object.assign(m,saveCharacterDetails(m,from,{links:[...links,{kind:r.kind,target_id:to,text:r.text,enabled:r.enabled,clause_type:r.clause_type}]},worldRecords(m)));report.relationships++;}
 const entry={imported_at:now,source:pkg.source,generator:pkg.generator||'',package_id:pkg.package_id||null,assets:Object.keys(id_map).length,images_expected:pkg.images.length};
 if(pkg.production_file){const size=JSON.stringify(pkg.production_file).length;if(size<=MAX_PRODUCTION_FILE_BYTES)entry.production_file=pkg.production_file;else entry.production_file_note='Production file was '+size+' bytes; kept only in the ZIP (site limit '+MAX_PRODUCTION_FILE_BYTES+').';}
 m.xce_world_packages||={};m.xce_world_packages[pkg.package_id||('import-'+now)]=entry;
 m.history||=[];m.history.push({kind:'world_package_import',source:pkg.source,date:now});
 return {manifest:m,id_map,report};
}

// Adds one stored image as a draft reference and attaches it to its asset (if any).
export function attachImage(original,{reference_id,key,name,mime_type,size,sha256,category,asset_id}){
 const m=structuredClone(original),type=category?CATEGORY_TYPE[category]:null;
 need(!m.references?.[reference_id],'Reference ID already exists');
 m.references||={};
 m.references[reference_id]=annotate({id:reference_id,name,asset_name:name,...(type&&!['wardrobe','room','keyframe'].includes(type)?{asset_type:type}:{}),role:category?CATEGORY_ROLE[category]:'STYLE',mime_type,key,size,content_sha256:sha256,imported_from_package:true},m,REFERENCE_ENTITY[category]||'prop');
 if(asset_id){
  const lib=category&&category!=='creatures'?m.world_library?.[category]?.[asset_id]:null,creature=m.manifest_store?.creatures?.[asset_id];
  const record=lib||creature;need(record,'The asset for this image no longer exists; reload and retry');
  need(record.status!=='LOCKED','Locked assets are immutable; this image was not attached');
  need((record.reference_ids||[]).length<30,'This asset already has 30 images');
  record.reference_ids=[...(record.reference_ids||[]),reference_id];if(lib&&!lib.thumbnail_reference_id)lib.thumbnail_reference_id=reference_id;
 }
 return m;
}
const REFERENCE_ENTITY={characters:'character',creatures:'creature',wardrobe:'character',props:'prop',vehicles:'vehicle',locations:'location',rooms:'location',scenes_and_shots:'scene'};
export const referenceIdFor=(m,category,name)=>allocate(m,REFERENCE_ENTITY[category]||'prop',name);
