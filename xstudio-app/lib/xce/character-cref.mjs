import {createHash} from 'node:crypto';
import {codedRecords,recordId} from './asset-codes.mjs';
import {imageMime} from './composer-service.mjs';

// Shared by the website bridge and universal MCP: no name guessing or draft fallback.
export function characterCref(m,project,selector,revision){
 const hits=codedRecords(m).filter(({record:r})=>!r.deleted_at&&!r.discarded_for_production&&(recordId(r)===selector||r.asset_code===selector));
 if(hits.length!==1)throw Error('Exact character ID or asset code not found or ambiguous');
 const {record:r,type}=hits[0];
 if(type!=='character'||r.status!=='LOCKED')throw Error('Choose a saved LOCKED character');
 const source=r.source_image_id,ref=m.references?.[source];
 if(r.owner_image_approval?.reference_id&&r.owner_image_approval.reference_id!==source)throw Error('Locked reference approval mismatch');
 if(!source||!ref||ref.deleted_at||ref.role==='DIAGNOSTIC'||['DRAFT','UNLOCKED'].includes(ref.status))throw Error('Approved character references unavailable');
 return {project_id:project,asset_id:recordId(r),asset_code:r.asset_code||null,name:r.name||r.asset_name||null,revision,asset_version:r.version??null,lock_status:'LOCKED',reference_ids:[source],source_url:'https://xstudio.xrkr80hd.studio',identity_authority:'LOCKED_REFERENCE_IMAGES',generation_authorized:false};
}
export async function prepareCharacterCref(m,project,selector,revision,getImage){
 const cref=characterCref(m,project,selector,revision),reference_id=cref.reference_ids[0],ref=m.references[reference_id];
 if(typeof ref.key!=='string'||!ref.key.startsWith('xce/')||ref.key.length>1000)throw Error('Locked reference has no retrievable cloud image');
 const object=await getImage(ref.key);
 if(!object)throw Error('Locked reference image is missing from cloud storage');
 if(!Number.isInteger(object.size)||object.size<1||object.size>6*1024*1024)throw Error('Locked reference exceeds supported image size');
 const bytes=Buffer.from(await object.arrayBuffer());
 if(bytes.length!==object.size)throw Error('Locked reference image size mismatch');
 const mime_type=imageMime(bytes),sha256=createHash('sha256').update(bytes).digest('hex');
 if(mime_type!==ref.mime_type||object.httpMetadata?.contentType!==mime_type)throw Error('Locked reference image MIME mismatch');
 const record=codedRecords(m).find(({record:r})=>recordId(r)===cref.asset_id).record;
 for(const expected of [record.owner_image_approval?.sha256,ref.sha256])if(expected&&expected!==sha256)throw Error('Locked reference image digest mismatch');
 return {cref:{...cref,images_retrieved:true},images:[{reference_id,mime_type,image_base64:bytes.toString('base64'),sha256,byte_size:bytes.length}],instruction:'Inspect the returned locked image. Use its exact identity; never substitute a draft or infer appearance from the name. Retrieval does not authorize generation, saving or unlocking.'};
}
