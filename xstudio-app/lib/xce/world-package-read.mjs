import {NARRATIVE_ROLES,ENTITY_TYPES} from './character-labels.mjs';
import {POWER_TIERS,LIGHTING_PRESETS,GEOGRAPHY,VISUAL_STYLES,PROJECT_TYPES} from './world-presets.mjs';
// XCE world package reader: the ZIP that xce_world_builder writes on `fin`.
// Browser-safe: no Node APIs. The server re-reads and re-validates every package.
import {WORLD_BUILDER_FIELDS} from './world-builder-fields.mjs';

export const PACKAGE_FORMAT='xce-world-package';
export const PACKAGE_VERSION='1.0.0';
export const PACKAGE_MANIFEST='xce-world-package.json';
export const MAX_IMAGE_BYTES=2_500_000;
export const MAX_PACKAGE_ASSETS=500;
export const MAX_PACKAGE_IMAGES=600;

export const PACKAGE_CATEGORIES=['characters','creatures','wardrobe','props','vehicles','locations','rooms','scenes_and_shots'];
export const CATEGORY_TYPE={characters:'character',creatures:'creature',wardrobe:'wardrobe',props:'prop',vehicles:'vehicle',locations:'location',rooms:'room',scenes_and_shots:'keyframe'};
export const CATEGORY_ROLE={characters:'IDENTITY',creatures:'IDENTITY',wardrobe:'COSTUME',props:'PROP',vehicles:'PROP',locations:'LOCATION',rooms:'LOCATION',scenes_and_shots:'BLUEPRINT'};
// Folder names a user (or ChatGPT) might use. The first word of each list is canonical.
const FOLDER_ALIASES={
 characters:['characters','character','cast','chars','people','heroes','villains','ch'],
 creatures:['creatures','creature','beasts','beast','monsters','cr'],
 wardrobe:['wardrobe','costumes','costume','outfits','outfit','wd'],
 props:['props','prop','weapons','weapon','items','item','objects','pr'],
 vehicles:['vehicles','vehicle','cars','car','ships','veh','vh'],
 locations:['locations','location','places','place','environments','environment','sets','lc','loc'],
 rooms:['rooms','room','interiors','interior','rm'],
 scenes_and_shots:['scenes_and_shots','scenes','scene','shots','shot','frames','frame','storyboard','storyboards','keyframes','sb','sh']
};
// Mirrors METADATA_FIELDS in asset-metadata.mjs (kept here so this file stays browser-safe).
export const DETAIL_FIELDS=['silhouette','full_name','description','biography','species','distinguishing_characteristics','appearance','anatomy','facial_features','hair','skin','fur','scales','markings','wardrobe','armor','accessories','equipment','personality','motivations','abilities','background','biome','atmosphere'];

export const need=(ok,message)=>{if(!ok)throw Error(message);};
export const text=(value,limit)=>typeof value==='string'?value.trim().slice(0,limit):'';
export const same=(a,b)=>String(a||'').trim()===String(b||'').trim();
export const norm=value=>String(value||'').trim().toLocaleLowerCase();

export function imageMime(bytes){
 if(!bytes||bytes.length<12)return null;
 if(bytes[0]===0x89&&bytes[1]===0x50&&bytes[2]===0x4e&&bytes[3]===0x47)return 'image/png';
 if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
 if(String.fromCharCode(...bytes.subarray(0,4))==='RIFF'&&String.fromCharCode(...bytes.subarray(8,12))==='WEBP')return 'image/webp';
 return null;
}
export function categoryForFolder(segment){
 const s=norm(segment).replace(/[^a-z0-9_]+/g,'_').replace(/^_+|_+$/g,'');
 return PACKAGE_CATEGORIES.find(c=>FOLDER_ALIASES[c].includes(s))||null;
}
// "CH-01_Terra_Branford_front_v2.png" -> "Terra Branford"
export function assetNameFromFile(path){
 let base=String(path).split('/').pop().replace(/\.[a-z0-9]{2,5}$/i,'');
 base=base.replace(/^[A-Z0-9]{2,4}-(CH|CR|PR|VH|LOC|SB|SH|RF|AS|WD|RM)-[A-Z0-9]+(-v\d+)?[ _-]*/i,'')
  .replace(/^(ch|cr|pr|veh|vh|lc|loc|rm|wd|sb|sh|sc)[-_ ]?\d+[ _-]+/i,'')
  .replace(/^\d{1,3}[ _.-]+/,'');
 base=base.replace(/([ _-](front|back|rear|side|left|right|profile|three[ _-]?quarter|3q|face|closeup|close[ _-]?up|full|body|turnaround|sheet|mcs(rl|cb)?(smpl|cmplx)?(-s[1-6])?|mvs|anchor|ref|reference|s[1-6]|v\d+|final|approved|draft|frame-\d{1,3}|\d{1,3}))+$/i,'');
 const name=base.replace(/[_]+/g,' ').replace(/\s+/g,' ').trim();
 return name||'Unnamed';
}
const strip=path=>String(path).replace(/^\/+/,'').replace(/\\/g,'/');
// A ZIP made by "compress folder" often wraps everything in one top folder.
function rootPrefix(paths){
 const first=paths.map(p=>p.split('/')).filter(parts=>parts.length>1).map(parts=>parts[0]);
 if(!first.length||first.length!==paths.length)return '';
 return first.every(x=>x===first[0])&&!categoryForFolder(first[0])&&first[0]!=='images'?first[0]+'/':'';
}

function cleanAsset(a,i,warnings){
 need(a&&typeof a==='object'&&!Array.isArray(a),'Asset '+(i+1)+' is not an object');
 const category=PACKAGE_CATEGORIES.includes(a.category)?a.category:categoryForFolder(a.category);
 need(category,'Asset '+(i+1)+' has an unknown category: '+a.category);
 const name=text(a.name,200);need(name,'Asset '+(i+1)+' needs a name');
 const key=text(a.package_id||a.id||name,64);
 const details={};for(const k of DETAIL_FIELDS){const v=text(a.details?.[k],10000);if(v)details[k]=v;}
 if(a.details)for(const k of Object.keys(a.details))if(!DETAIL_FIELDS.includes(k))warnings.push(name+': skipped unsupported detail "'+k+'"');
 const gender=['unspecified','male','female','other'].includes(a.gender)?a.gender:undefined;
 const power_tier=['characters','creatures'].includes(category)&&Object.hasOwn(POWER_TIERS,a.power_tier||'')&&a.power_tier?a.power_tier:undefined;
 if(a.power_tier&&!power_tier)warnings.push(name+': skipped unknown on-screen power "'+a.power_tier+'"');
 const presets={};for(const [k,list] of [['lighting_preset',LIGHTING_PRESETS],['world_geography',GEOGRAPHY]]){const v=text(a.presets?.[k],200);if(v){if(['locations','rooms'].includes(category))presets[k]=v;if(!list.includes(v))warnings.push(name+': '+k.replace('_',' ')+' "'+v+'" is not in the preset list; kept as typed');}}
 const narrative_role=category==='characters'&&Object.hasOwn(NARRATIVE_ROLES,a.narrative_role||'')?a.narrative_role:undefined;if(a.narrative_role&&!narrative_role)warnings.push(name+': skipped unknown narrative role "'+a.narrative_role+'"');
 const entity_type=category==='characters'&&Object.hasOwn(ENTITY_TYPES,a.entity_type||'')?a.entity_type:undefined;if(a.entity_type&&!entity_type)warnings.push(name+': skipped unknown entity type "'+a.entity_type+'"');
 return {key,category,name,power_tier,presets,narrative_role,entity_type,existing_asset_id:typeof a.existing_asset_id==='string'&&/^[\w-]{1,128}$/.test(a.existing_asset_id)?a.existing_asset_id:null,details,quick_details:text(a.quick_details,4000),gender,status_in_chat:a.status_in_chat==='APPROVED'?'APPROVED':'DRAFT',images:[]};
}

// files: {path: Uint8Array}. Returns a normalized package plus warnings. Never throws on a
// single bad image; throws only when nothing usable can be read.
// imageInfo (server only): {path:{mime_type,byte_size}} reported by the browser, used when
// image bytes are not sent with the plan. Each image's real bytes are re-checked on upload.
/** @param {Record<string,Uint8Array>} files @param {string} [zipName] @param {{imageInfo?:Record<string,{mime_type:string,byte_size:number}>|null}} [options] @returns {any} */
export function readPackage(files,zipName='world.zip',{imageInfo=null}={}){
 const warnings=[],paths=Object.keys(files).map(strip).filter(p=>!p.endsWith('/')&&!/(^|\/)(__MACOSX|\.DS_Store)/.test(p));
 const byPath=new Map(Object.entries(files).map(([k,v])=>[strip(k),v]));
 const prefix=rootPrefix(paths),local=p=>p.startsWith(prefix)?p.slice(prefix.length):p;
 const read=p=>{const v=byPath.get(p)||byPath.get(prefix+p);return v?new TextDecoder().decode(v):null;};
 const manifestText=read(PACKAGE_MANIFEST),exportText=read('world.json');
 let pkg;
 if(manifestText){pkg=fromFinManifest(JSON.parse(manifestText),warnings);pkg.source='fin';}
 else if(exportText&&JSON.parse(exportText).format==='xce-portable-world'){pkg=fromWorldExport(JSON.parse(exportText),warnings);pkg.source='xstudio-export';}
 else {pkg=fromFolders(paths.map(local),zipName,warnings);pkg.source='folders';}
 if(pkg.production_file_path){const t=read(pkg.production_file_path);if(t){try{pkg.production_file=JSON.parse(t)}catch{warnings.push('Production file is not valid JSON; skipped')}}else warnings.push('Production file listed but missing: '+pkg.production_file_path);}
 // Attach image bytes, verify type and size.
 const images=[];
 for(const img of pkg.image_list){
  if(imageInfo){const info=imageInfo[img.file]||imageInfo[prefix+img.file];if(!info){warnings.push('Missing image in ZIP: '+img.file);continue;}need(['image/png','image/jpeg','image/webp'].includes(info.mime_type)&&Number.isInteger(info.byte_size)&&info.byte_size>0,'Invalid image details for '+img.file);images.push({...img,file:imageInfo[img.file]?img.file:prefix+img.file,mime_type:info.mime_type,byte_size:info.byte_size,too_large:info.byte_size>MAX_IMAGE_BYTES});continue;}
  // Store the exact path inside the ZIP so the browser can find the bytes again.
  const path=byPath.has(img.file)?img.file:prefix+img.file,bytes=byPath.get(path);
  if(!bytes){warnings.push('Missing image in ZIP: '+img.file);continue;}
  const mime=imageMime(bytes);if(!mime){warnings.push('Not a PNG, JPEG or WebP image: '+img.file);continue;}
  images.push({...img,file:path,mime_type:mime,byte_size:bytes.length,too_large:bytes.length>MAX_IMAGE_BYTES});
 }
 delete pkg.image_list;
 pkg.images=images;
 need(pkg.world_name||pkg.assets.length||images.length,'This ZIP has no world, assets or images XSTUDIO can read');
 need(pkg.assets.length<=MAX_PACKAGE_ASSETS,'A world ZIP can hold up to '+MAX_PACKAGE_ASSETS+' assets');
 need(images.length<=MAX_PACKAGE_IMAGES,'A world ZIP can hold up to '+MAX_PACKAGE_IMAGES+' images');
 pkg.warnings=warnings;return pkg;
}
function fromFinManifest(doc,warnings){
 need(doc&&doc.format===PACKAGE_FORMAT,'Not an XCE world package');
 need(String(doc.schema_version||'').startsWith('1.'),'Unsupported world package version '+doc.schema_version);
 const assets=(Array.isArray(doc.assets)?doc.assets:[]).map((a,i)=>cleanAsset(a,i,warnings));
 const keys=new Set();for(const a of assets){need(!keys.has(a.key),'Duplicate asset package_id: '+a.key);keys.add(a.key);}
 const image_list=[];
 assets.forEach((a,i)=>{for(const img of doc.assets[i].images||[])if(typeof img?.file==='string')image_list.push({file:strip(img.file),asset_key:a.key,category:a.category,approved:img.approved===true,role:typeof img.role==='string'?img.role.slice(0,40):''});});
 for(const img of doc.unsorted_images||[])if(typeof img?.file==='string')image_list.push({file:strip(img.file),asset_key:null,category:null,approved:img.approved===true,role:''});
 const project_settings={};for(const k of ['visual_style','project_type']){const v=doc.world_builder?.[k];if(typeof v==='string'&&v){if(Object.hasOwn(k==='visual_style'?VISUAL_STYLES:PROJECT_TYPES,v))project_settings[k]=v;else warnings.push('Skipped unknown '+k.replace('_',' ')+' "'+v+'"');}}
 const world_builder={};for(const k of Object.keys(WORLD_BUILDER_FIELDS)){const v=doc.world_builder?.[k];if(typeof v==='string'&&v.trim()){if(v.length>WORLD_BUILDER_FIELDS[k].limit)warnings.push(WORLD_BUILDER_FIELDS[k].label+' is longer than the site limit and was cut to '+WORLD_BUILDER_FIELDS[k].limit+' characters');world_builder[k]=v.trim().slice(0,WORLD_BUILDER_FIELDS[k].limit);}}
 const relationships=(Array.isArray(doc.relationships)?doc.relationships:[]).flatMap(r=>keys.has(r?.from)&&keys.has(r?.to)&&r.from!==r.to?[{from:r.from,to:r.to,clause_type:r.clause_type==='synergy'?'synergy':'relationship',kind:['equal_height','shorter_than','taller_than','opposes','custom'].includes(r.kind)?r.kind:'custom',text:text(r.text,2000),enabled:r.enabled!==false}]:(warnings.push('Skipped a relationship that does not link two package assets'),[]));
 return {project_settings,package_id:text(doc.package_id,80)||null,generator:text(doc.generator,120),world_mode:doc.world?.mode==='new'?'new':doc.world?.mode==='existing'?'existing':null,world_name:text(doc.world?.name,200),project_id:typeof doc.world?.project_id==='string'&&/^[-\w]{1,80}$/.test(doc.world.project_id)?doc.world.project_id:null,world_builder,assets,relationships,image_list,production_file_path:typeof doc.production_file==='string'?strip(doc.production_file):null};
}
function fromWorldExport(doc,warnings){
 const m=doc.manifest||{},files=Object.fromEntries((doc.media||[]).map(x=>[x.reference_id,x.file]));
 const assets=[],image_list=[];
 for(const [category,items] of Object.entries(m.world_library||{}))for(const r of Object.values(items||{})){
  if(!PACKAGE_CATEGORIES.includes(category)||!r?.name)continue;const key=text(r.id,64)||r.name;
  assets.push({key,category,name:text(r.name,200),existing_asset_id:null,details:{},quick_details:'',status_in_chat:'DRAFT',images:[]});
  for(const id of r.reference_ids||[])if(files[id])image_list.push({file:files[id],asset_key:key,category,approved:false,role:''});
 }
 for(const r of Object.values(m.manifest_store?.creatures||{}))if(r?.name){const key=text(r.asset_id,64)||r.name;assets.push({key,category:'creatures',name:text(r.name,200),existing_asset_id:null,details:{},quick_details:'',status_in_chat:'DRAFT',images:[]});for(const id of r.reference_ids||[])if(files[id])image_list.push({file:files[id],asset_key:key,category:'creatures',approved:false,role:''});}
 const used=new Set(image_list.map(i=>i.file));for(const f of Object.values(files))if(!used.has(f))image_list.push({file:f,asset_key:null,category:null,approved:false,role:''});
 warnings.push('Read an XSTUDIO world export. Records and images are imported as new drafts; approvals and locks are not copied.');
 const world_builder={};for(const k of Object.keys(WORLD_BUILDER_FIELDS))if(typeof m.world_builder?.[k]==='string'&&m.world_builder[k].trim())world_builder[k]=m.world_builder[k].slice(0,WORLD_BUILDER_FIELDS[k].limit);
 return {package_id:null,generator:'xstudio world export r'+(doc.revision??'?'),world_name:text(doc.project_name,200),project_id:typeof doc.project_id==='string'&&/^[-\w]{1,80}$/.test(doc.project_id)?doc.project_id:null,world_builder,assets,relationships:[],image_list,production_file_path:null};
}
function fromFolders(paths,zipName,warnings){
 const assets=new Map(),image_list=[];
 for(const p of paths){
  if(!/\.(png|jpe?g|webp)$/i.test(p))continue;
  const parts=p.split('/').filter(x=>x!=='images');const category=parts.slice(0,-1).map(categoryForFolder).find(Boolean)||null;
  if(!category){image_list.push({file:p,asset_key:null,category:null,approved:false,role:''});continue;}
  // A subfolder inside a category names the asset: characters/Terra/front.png
  const catIndex=parts.findIndex(x=>categoryForFolder(x)===category),sub=parts.length-catIndex>2?parts[catIndex+1]:null;
  const name=(sub?sub.replace(/[_]+/g,' ').trim():assetNameFromFile(p)).slice(0,200),key=category+':'+norm(name);
  if(!assets.has(key))assets.set(key,{key,category,name,existing_asset_id:null,details:{},quick_details:'',status_in_chat:'DRAFT',images:[]});
  image_list.push({file:p,asset_key:key,category,approved:false,role:''});
 }
 if(!assets.size&&image_list.length)warnings.push('No category folders found (characters, props, vehicles, locations…). Images go to Unassigned uploads.');
 const world_name=String(zipName).split('/').pop().replace(/\.zip$/i,'').replace(/[_-]?(fin|world|export)?[_-]?r?\d*$/i,'').replace(/[_]+/g,' ').trim();
 return {package_id:null,generator:'folder ZIP',world_name,project_id:null,world_builder:{},assets:[...assets.values()],relationships:[],image_list,production_file_path:null};
}

