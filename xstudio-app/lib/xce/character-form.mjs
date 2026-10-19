import {worldRecords,emptyWorld,validateWorld} from './world-library.mjs';
import {editAsset} from './asset-edit.mjs';
import {saveCharacterDetails} from './character-network.mjs';
import {updateAssetMetadata,updateGenerationPrompt} from './asset-metadata.mjs';
import {classifyAssets} from './classifications.mjs';
import {editCharacterState,attachCharacterCostume} from './entity-composition.mjs';
import {assignAssetCodes,codedRecords} from './asset-codes.mjs';
export function characterDraft(m,id){
 if(!/^[a-zA-Z0-9_-]{1,128}$/.test(id)||['__proto__','constructor','prototype'].includes(id)||codedRecords(m).some(x=>(x.record.id||x.record.asset_id)===id)||m.trash?.[id])throw Error('Character ID already exists or is invalid');
 const next=structuredClone(m);next.world_library||=emptyWorld();next.world_library.characters||={};next.world_library.characters[id]={id,type:'characters',name:'',status:'DRAFT',reference_ids:[],metadata:{style_anchor:'RL'}};return next;
}
export function applyCharacterAction(m,p,id,a){
 const record=worldRecords(m).find(r=>r.id===id&&r.type==='characters'&&!r.deleted_at);if(!record)throw Error('Character not found');
 if(a.asset_id&&a.asset_id!==id||a.character_id&&a.character_id!==id)throw Error('Character mismatch');
 let next=m,result={};
 switch(a.action){
 case 'asset_edit':if(a.details?.category!=='characters')throw Error('Use asset organization to change primary category');({manifest:next,...result}=editAsset(m,id,{...a.details,description:''}));if(m.asset_details?.[id]?.description!==undefined)next.asset_details[id].description=m.asset_details[id].description;break;
 case 'character_details':next=saveCharacterDetails(m,id,a.details,worldRecords(m));break;
 case 'metadata_update':({manifest:next,...result}=updateAssetMetadata(m,p,m.revision,id,a.expected_version,a.patch));break;
 case 'generation_prompt_update':({manifest:next,...result}=updateGenerationPrompt(m,p,m.revision,id,a.expected_version,a.text,a.provenance));break;
 case 'classify':({manifest:next,...result}=classifyAssets(m,p,m.revision,m.revision,[{asset_id:id,classification:a.classification,expected_version:a.expected_version}]));if(!result.results[0].ok)throw Error(result.results[0].error);break;
 case 'character_state':next=editCharacterState(m,{...a,character_id:id},worldRecords(m));break;
 case 'attach_character_costume':({manifest:next,...result}=attachCharacterCostume(m,{...a,character_id:id},worldRecords(m)));break;
 case 'character_images':{
  const ids=a.reference_ids;if(!Array.isArray(ids)||ids.length>30||new Set(ids).size!==ids.length||ids.some(r=>typeof r!=='string'||!m.references?.[r]||m.references[r].deleted_at||m.references[r].role==='DIAGNOSTIC'))throw Error('Choose saved project images');
  const anchors=a.anchors||{};if(Object.keys(anchors).some(k=>!['face_anchor_url','body_anchor_url'].includes(k))||Object.values(anchors).some(v=>typeof v!=='string'||v&&!ids.includes(v)))throw Error('Invalid face or body reference');
  if(record.status==='LOCKED')throw Error('Unlock the character before changing reference images');
  next=structuredClone(m);const target=record.legacy?next.manifest_store.characters[id]:next.world_library.characters[id];target.reference_ids=ids;target.metadata={...target.metadata,...anchors};break;
 }
 default:throw Error('Unsupported character form operation');
 }
 return {manifest:next,result:{...result,revision:next.revision,asset:result.asset||worldRecords(next).find(r=>r.id===id),asset_details:next.asset_details,character_network:next.character_network,character_cast_groups:next.character_cast_groups,state_variants:next.state_variants}};
}
export function saveCharacterForm(m,p,args){
 if(args.expected_revision!==m.revision)throw Error('Project changed; reload before saving');
 if(!Array.isArray(args.operations)||args.operations.length>100)throw Error('Too many character changes');
 let next=args.create?characterDraft(m,args.asset_id):structuredClone(m);
 for(const operation of args.operations)next=applyCharacterAction(next,p,args.asset_id,operation).manifest;
 const row=worldRecords(next).find(r=>r.id===args.asset_id&&r.type==='characters');if(!row?.name?.trim())throw Error('Enter a character name');
 if(args.create&&!row.reference_ids.length)throw Error('Choose a character sheet or reference image');
 if(args.create)next.world_library=validateWorld(next.world_library,m);
 assignAssetCodes(next);return next;
}
