import {saveAssetDetails} from './asset-details.mjs';
import {worldRecords,emptyWorld,validateWorld,WORLD_FIELDS,IMAGE_FIELDS} from './world-library.mjs';
import {assetMetadata,updateAssetMetadata,updateGenerationPrompt} from './asset-metadata.mjs';
import {classifyAssets} from './classifications.mjs';
import {assignAssetCodes,codedRecords} from './asset-codes.mjs';
import {equipmentIds} from './equipment.mjs';
import {saveCharacterDetails} from './character-network.mjs';
const nativeTypes={prop:'props',vehicle:'vehicles',location:'locations',room:'rooms',wardrobe:'wardrobe'};
export function assetFormDraft(m,id,primary){
 if(typeof id!=='string'||!/^[\w-]{1,128}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||codedRecords(m).some(x=>(x.record.id||x.record.asset_id)===id)||Object.values(m.trash||{}).some(t=>(t.record?.id||t.record?.asset_id)===id))throw Error('Asset ID already exists or is invalid');
 if(!Object.hasOwn(nativeTypes,primary)&&primary!=='creature')throw Error('Use the existing character or scene form for this category');
 const next=structuredClone(m);
 if(primary==='creature'){
  next.manifest_store||={};next.manifest_store.creatures||={};next.manifest_store.creatures[id]={asset_id:id,asset_type:'creature',name:'',status:'DRAFT',reference_ids:[],metadata:{},immutable_traits:{silhouette:'',material_spec:''},reference_preservation:true,analysis_pending:true,mode:'simple',medium:'RL',target_deliverable:'creature_sheet'};
 }else{
  next.world_library||=emptyWorld();const type=nativeTypes[primary];next.world_library[type]||={};next.world_library[type][id]={id,type,name:'',status:'DRAFT',reference_ids:[],metadata:{}};
 }
 return next;
}
export function saveAssetForm(m,p,args){
 if(args.expected_revision!==m.revision)throw Error('Project changed; reload before saving');
 if(args.confirm!==true)throw Error('Choose Save to apply asset changes');
 let next=args.create?assetFormDraft(m,args.asset_id,args.primary_category):structuredClone(m);
 const id=args.asset_id,entry=codedRecords(next).find(x=>(x.record.asset_id||x.record.id)===id&&x.type!=='reference');
 if(!entry||entry.type!==args.primary_category||entry.record.deleted_at)throw Error('Asset category or project mismatch');
 const record=entry.record,ids=args.reference_ids;
 if(ids!==undefined){
  if(!Array.isArray(ids)||ids.length>30||new Set(ids).size!==ids.length||ids.some(r=>typeof r!=='string'||!next.references?.[r]||next.references[r].deleted_at||next.references[r].role==='DIAGNOSTIC'))throw Error('Choose saved project reference images');
  if(record.status==='LOCKED'&&JSON.stringify(record.reference_ids||[])!==JSON.stringify(ids))throw Error('Unlock the asset before changing reference images');
  record.reference_ids=[...ids];if(!record.asset_id)record.thumbnail_reference_id=ids[0]||'';
 }
 if(args.world_metadata!==undefined){
  const keys=WORLD_FIELDS[record.type]||WORLD_FIELDS[entry.type==='creature'?'characters':nativeTypes[entry.type]]||[],patch=args.world_metadata;
  if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).some(k=>!keys.includes(k)))throw Error('Unsupported anchor metadata');
  for(const [k,v]of Object.entries(patch)){
   if(typeof v!=='string'||v.length>10000)throw Error('Invalid anchor metadata: '+k);
   if(IMAGE_FIELDS.includes(k)&&v&&!record.reference_ids.includes(v))throw Error('Choose a reference attached to this asset');
   if(record.status==='LOCKED'&&v!==(record.metadata?.[k]||''))throw Error('Unlock the asset before changing visual anchors');
  }
  record.metadata={...record.metadata,...patch};
  if(record.asset_id&&patch.style_anchor!==undefined){if(!['RL','CB'].includes(patch.style_anchor))throw Error('Choose Realistic or Comic book');record.medium=patch.style_anchor;}
 }
 const current=assetMetadata(next,p,m.revision,id);
 if(args.metadata_patch&&Object.keys(args.metadata_patch).length)next=updateAssetMetadata(next,p,m.revision,id,args.expected_metadata_version,args.metadata_patch).manifest;
 if(args.classification!==undefined){const r=classifyAssets(next,p,m.revision,m.revision,[{asset_id:id,classification:args.classification,expected_version:args.expected_classification_version}]);if(!r.results[0].ok)throw Error(r.results[0].error);next=r.manifest;}
 if(args.clauses!==undefined){if(entry.type!=='prop')throw Error('Character clauses require a prop');next=saveAssetDetails(next,id,{description:next.asset_details?.[id]?.description||'',clauses:args.clauses});}
 if(args.gender!==undefined)next=saveCharacterDetails(next,id,{gender:args.gender},worldRecords(next));
 if(args.equipment_ids!==undefined){if(!['character','creature'].includes(entry.type))throw Error('Only characters and creatures can carry inventory');next.asset_details||={};next.asset_details[id]={...next.asset_details[id],equipment_ids:equipmentIds(next,args.equipment_ids,worldRecords(next))};}
 if(args.generation_prompt!==undefined&&args.generation_prompt!==current.generation_prompt.text)next=updateGenerationPrompt(next,p,m.revision,id,args.expected_prompt_version,args.generation_prompt,{source:'USER_AUTHORED',reference_ids:current.reference_status.approved_reference_ids,notes:'User-authored in shared asset editor'}).manifest;
 const row=worldRecords(next).find(r=>r.id===id);if(!row?.name?.trim())throw Error('Enter an asset name');
 if(args.create&&!row.reference_ids.length)throw Error('Choose an asset reference image');
 // Validate native structural fields without rebuilding legacy records or visual prompts.
 if(!row.legacy)validateWorld(next.world_library,m);
 if(args.create){const only=rows=>Object.fromEntries(Object.entries(rows||{}).map(([type,records])=>[type,Object.fromEntries(Object.entries(records).filter(([key])=>key===id))]));assignAssetCodes({...next,references:{},scenes:{},world_library:only(next.world_library),manifest_store:only(next.manifest_store)},codedRecords(m).map(x=>x.record.asset_code).filter(Boolean));}return next;
}
