import {copyWorldAsset,removeWorldAssets} from './triage-world-transfer.mjs';
import {categories} from './core.mjs';
import {allocate,annotate} from './namespace.mjs';
import {intakeReferences} from './intake-references.mjs';
import {intakeScene} from './scene-intake.mjs';
import {reclassify} from './reclassify.mjs';
import {transfer} from './transfer.mjs';
import {manage} from './manage.mjs';
import {deleteRecords} from './library.mjs';
import {worldRecords} from './world-library.mjs';
import {assignCastGroup,CAST_GROUPS} from './cast-groups.mjs';
import {saveSceneCast} from './scene-cast.mjs';
import {assignAssetCodes,codedRecords} from './asset-codes.mjs';
import {unassignedReferences} from './attachments.mjs';
export const TRIAGE_TYPES={character:'Characters',creature:'Creatures',scene:'Scenes',prop:'Props',wardrobe:'Wardrobe',vehicle:'Vehicles',location:'Locations',room:'Rooms'};
export const triageKey=a=>(a.category==='references'||a.sourceReference?'reference':a.asset_type||(!a.legacy&&!a.sourceReference&&a.type?'world':null)||({characters:'character',creatures:'creature',props:'prop',vehicles:'vehicle',locations:'location',scenes:'scene'}[a.category])||'world')+':'+(a.asset_id||a.scene_id||a.id);
export function stageReference(m,referenceId,type,name){
 const ref=m.references?.[referenceId];if(!ref||ref.role==='DIAGNOSTIC'||!ref.key)throw Error('Missing or diagnostic source image');
 if(!Object.hasOwn(TRIAGE_TYPES,type)||!name?.trim()||name.length>200)throw Error('Choose a category and a name (max 200 characters)');
 if(type==='scene'){const result=intakeScene(m,{name,reference_ids:[referenceId]});result.scene.intake_source_reference_ids=[referenceId];return {id:result.scene.scene_id,entity:'scene'}}
 if(['wardrobe','room'].includes(type)){const category=type==='room'?'rooms':'wardrobe',id=allocate(m,'prop',name);m.world_library||={};m.world_library[category]||={};m.world_library[category][id]={id,type:category,name,status:'DRAFT',reference_ids:[referenceId],thumbnail_reference_id:referenceId,metadata:{style_anchor:''}};return {id,entity:'world'}}
 const refs=intakeReferences(m,[referenceId],type,name),id=allocate(m,type,name);
 m.manifest_store[categories[type]][id]=annotate({asset_id:id,asset_type:type,name:name.trim(),status:'DRAFT',reference_ids:refs,intake_source_reference_ids:[referenceId],reference_preservation:true,analysis_pending:true,mode:'simple',medium:'RL',target_deliverable:type==='character'?'character_turnaround':type==='creature'?'creature_sheet':type==='location'?'location_map':'prop_sheet',immutable_traits:{silhouette:'',material_spec:''},generation_review:null},m,type);
 return {id,entity:type};
}
const get=(m,item)=>item.entity==='reference'?m.references?.[item.id]:item.entity==='scene'?m.scenes?.[item.id]:item.entity==='world'?Object.values(m.world_library||{}).flatMap(rows=>Object.values(rows)).find(a=>a.id===item.id):m.manifest_store?.[categories[item.entity]]?.[item.id];
function assignSelectedCodes(m,selected){const ids=new Set(selected.map(x=>x.id)),scope={...m,references:Object.fromEntries(Object.entries(m.references||{}).filter(([id])=>ids.has(id))),scenes:Object.fromEntries(Object.entries(m.scenes||{}).filter(([id])=>ids.has(id))),world_library:Object.fromEntries(Object.entries(m.world_library||{}).map(([type,rows])=>[type,Object.fromEntries(Object.entries(rows).filter(([id])=>ids.has(id)))])),manifest_store:Object.fromEntries(Object.entries(m.manifest_store||{}).map(([type,rows])=>[type,Object.fromEntries(Object.entries(rows).filter(([id])=>ids.has(id)))]))};assignAssetCodes(scope,codedRecords(m).map(x=>x.record.asset_code).filter(Boolean));}
export function triageBatch(source,destination,args){
 if(!['categorize','cast','save','move','scene','delete'].includes(args.action)||!Array.isArray(args.items)||!args.items.length||args.items.length>50||new Set(args.items.map(x=>x.entity+':'+x.id)).size!==args.items.length)throw Error('Select 1–50 distinct assets and a bulk action');
 for(const i of args.items)if(!['reference','character','creature','prop','vehicle','location','scene','world','keyframe'].includes(i.entity)||typeof i.id!=='string'||!get(source,i))throw Error('Selection is no longer available');
 if(args.action==='move'&&args.project_id===args.destination_project_id)throw Error('Choose a different project, or use Add to scene');
 const src=structuredClone(source),cross=args.project_id!==args.destination_project_id,dst=cross?structuredClone(destination):src,results=[];
 if(dst.system_pool&&!['move','delete'].includes(args.action))throw Error('Choose a creative destination project');
 if(args.action==='cast'&&!Object.hasOwn(CAST_GROUPS,args.group))throw Error('Choose a cast group');
 if(args.action==='delete'){if(cross)throw Error('Delete from the source project');removeWorldAssets(src,args.items.filter(x=>x.entity==='world'));const legacy=args.items.filter(x=>x.entity!=='world'),next=legacy.length?deleteRecords(src,{items:legacy,confirm:true,cascade:false}).manifest:src;return {source:next,destination:next,cross:false,results:args.items};}
 const mapping=new Map();
 let nextNumber=1;const names=new Set(worldRecords(dst).map(a=>a.name));
 for(const item of args.items){let current={...item};const original=get(src,item);
  if(cross){if(item.entity==='world')current.id=copyWorldAsset(src,dst,item.id,args.project_id,args.destination_project_id,mapping);else{const result=transfer(src,dst,{...item,project_id:args.project_id,destination_project_id:args.destination_project_id,operation:args.action==='move'?'move':'duplicate'});current.id=result.id;}}
  if(['categorize','cast','save','scene'].includes(args.action)){
   if(current.entity==='reference'){
    // Never silently classify an arbitrary photo as a character in Batch Save.
    const type=args.action==='cast'||args.action==='scene'?'character':args.category;
    if(!Object.hasOwn(TRIAGE_TYPES,type))throw Error('Choose the category for these unsaved images');
    let name=get(dst,current).name||get(dst,current).asset_name||'Unnamed asset';
    if(args.action==='cast'&&['background','extras','military'].includes(args.group)){const prefix=args.group==='background'?'BG_Character':args.group==='extras'?'Extra_Character':'Unit_Character';do{name=prefix+'_'+String(nextNumber++).padStart(2,'0')}while(names.has(name));names.add(name)}
    current=stageReference(dst,current.id,type,name);if(args.action==='cast'){get(dst,current).rename_pending=true;}
   }else if(args.action==='categorize'&&current.entity!==args.category){if(!Object.hasOwn(TRIAGE_TYPES,args.category))throw Error('Choose an asset category');if(['character','creature','prop','vehicle','location'].includes(args.category)&&['character','creature','prop','vehicle','location'].includes(current.entity)){const result=reclassify(dst,{...current,target_category:args.category});current={id:result.id,entity:args.category};}else{const original=get(dst,current),ref=[...(original.reference_ids||[]),original.source_image_id,original.blueprint_id].find(id=>dst.references[id]?.key);if(!ref)throw Error('Attach an image before changing category');const originalItem=current;current=stageReference(dst,ref,args.category,original.name);get(dst,current).reclassified_from={id:originalItem.id,type:originalItem.entity};if(original.status!=='LOCKED'){if(originalItem.entity==='world'){dst.trash||={};dst.trash['world:'+originalItem.id]={entity:'world',record:original};delete dst.world_library[original.type][originalItem.id]}else manage(dst,{...originalItem,action:'delete',confirm:true})}}}
   if(args.action==='cast'){if(current.entity!=='character'&&!(current.entity==='world'&&get(dst,current).type==='characters'))throw Error('Cast assignment requires characters');Object.assign(dst,assignCastGroup(dst,current.id,args.group,worldRecords(dst)));}
   if(args.action==='scene'){if(current.entity!=='character'&&current.entity!=='creature'&&!(current.entity==='world'&&get(dst,current).type==='characters'))throw Error('Scene roster selection accepts characters and creatures');Object.assign(dst,saveSceneCast(dst,args.scene_id,[...new Set([...(dst.scenes?.[args.scene_id]?.character_ids||[]),current.id])]));}
  }
  if(cross){src.asset_triage||={processed:{}};src.asset_triage.processed||={};src.asset_triage.processed[item.entity+':'+item.id]={destination_project_id:args.destination_project_id,id:current.id,entity:current.entity};if(args.action==='move')for(const ref of [...(original.reference_ids||[]),...(original.intake_source_reference_ids||[]),original.source_image_id,original.blueprint_id].filter(Boolean))src.asset_triage.processed['reference:'+ref]={destination_project_id:args.destination_project_id,id:current.id,entity:current.entity};}
  results.push({source_id:item.id,source_entity:item.entity,...current,name:get(dst,current)?.name||original.name});
 }
 if(cross&&args.action==='move')removeWorldAssets(src,args.items.filter(x=>x.entity==='world'));
 assignSelectedCodes(dst,results);dst.permits={};return {source:src,destination:dst,cross,results};
}
export function pendingTriage(m){return unassignedReferences(m).filter(r=>!m.asset_triage?.processed?.['reference:'+r.id]);}
