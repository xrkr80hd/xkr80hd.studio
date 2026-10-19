import {attachmentInfo} from './attachments.mjs';

// A reference's asset_type describes its intended use, not a saved asset record.
export function inspectorEntity(record,manifest={}){
 const id=record.asset_id||record.scene_id||record.id;
 if(record.category==='references'||record.sourceReference||manifest.references?.[id])return 'reference';
 if(record.category==='scenes')return 'scene';
 if(record.category==='projects')return 'project';
 return record.asset_type||({characters:'character',creatures:'creature',props:'prop',locations:'location',vehicles:'vehicle',shots:'keyframe'})[record.category]||'keyframe';
}

export function needsAssetIntake(record,action,manifest){
 return ['move','duplicate'].includes(action)&&inspectorEntity(record,manifest)==='reference'&&!attachmentInfo(manifest,record).attached;
}

// Match ownership by explicit reference edges, never by a guessed name or image.
export function referenceAssetOwners(manifest,id){
 const linked=r=>(r.intake_source_reference_ids||[]).includes(id)||(r.reference_ids||[]).includes(id)||r.source_image_id===id||r.blueprint_id===id;
 return [
  ...Object.entries(manifest.manifest_store||{}).flatMap(([category,items])=>Object.values(items).filter(linked).map(record=>({...record,category}))),
  ...Object.values(manifest.scenes||{}).filter(linked).map(record=>({...record,category:'scenes'}))
 ];
}
