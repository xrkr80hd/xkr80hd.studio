import {createHash} from 'node:crypto';
import {zipSync,strToU8} from 'fflate';
import {SCRIPT_SCHEMA,scriptSave,scriptHandoff,scriptText,validateScript,scriptWarnings} from './scene-script.mjs';
import {worldRecords} from './world-library.mjs';
import {characterContext} from './character-network.mjs';
import {imageMime,prepareComposition} from './composer-service.mjs';
export function intentDigest(d){return createHash('sha256').update(JSON.stringify({project:d.project_id,scene:d.scene_id,intent:d.scene_intent,details:d.minor_details,analysis:d.intent_interpretation,planning:d.planning,roster:d.roster,continuity:d.continuity})).digest('hex')}
export function authorizedScript(m,p,s,doc){return m.scene_scripts?.[s]?.execution_approval?.digest===intentDigest(doc)}
export function saveScriptRequest(m,p,s,doc,args){
 const execute=args.execution_command==='123GO';
 if(execute&&(doc.intent_interpretation.status!=='REVIEWED'||!doc.scene_intent.trim()||doc.authoring_mode!=='AI'||doc.engine_mode!=='SCRIPT_EXECUTION'))throw Error('Review scene intent and choose AI execution before 123GO');
 const allowed=execute||authorizedScript(m,p,s,doc),result=scriptSave(m,p,s,doc,{...args,allowAiLines:allowed});
 if(doc.authoring_mode==='AI'&&allowed)result.record.execution_approval={command:'123GO',digest:intentDigest(doc),approved_at:m.scene_scripts?.[s]?.execution_approval?.approved_at||new Date().toISOString()};
 return result;
}
export function scriptPackage(m,p,s,doc){
 const clean=validateScript(doc,m,p,s,{allowAiLines:authorizedScript(m,p,s,doc)}),rows=worldRecords(m),assetIds=[...clean.roster.map(r=>r.character_id),...clean.continuity.location_ids];
 return {...scriptHandoff(clean),assets:assetIds.map(id=>rows.find(a=>a.id===id)),character_stories:Object.fromEntries(assetIds.filter(id=>m.character_stories?.[id]).map(id=>[id,m.character_stories[id]])),character_context:characterContext(m,doc.roster.map(r=>r.character_id),rows),composition:clean.continuity.composition_id?m.composer.compositions[clean.continuity.composition_id]:null,script_schema:SCRIPT_SCHEMA,script_text:scriptText(clean),warnings:scriptWarnings(clean),reference_validation:{status:'NOT_RETRIEVED',images_retrieved:false}};
}
export async function scriptExecution(m,p,s,doc,getImage){
 const payload=scriptPackage(m,p,s,doc),ids=new Set(doc.continuity.reference_ids),images=[],validation=[];let total=0;
 for(const asset of payload.assets){if(asset.status!=='LOCKED')throw Error('Required anchor is not locked: '+asset.id);if(!asset.reference_ids?.length)throw Error('Required reference missing: '+asset.id);for(const id of asset.reference_ids)ids.add(id)}
 let composition=null;if(payload.composition){const prepared=await prepareComposition(m,p,payload.composition.configuration,getImage);composition=prepared.output;for(const image of prepared.images)ids.add(image.reference_id)}
 for(const id of ids){const ref=m.references?.[id];if(!ref||ref.role==='DIAGNOSTIC')throw Error('Required reference unavailable: '+id);const object=await getImage(ref.key);if(!object||object.size>6*1024*1024)throw Error('Required image unavailable or too large: '+id);const bytes=Buffer.from(await object.arrayBuffer());total+=bytes.length;if(bytes.length>6*1024*1024||total>40*1024*1024)throw Error('Scene media exceeds export limits');const mime=imageMime(bytes);if(mime!==ref.mime_type||object.httpMetadata?.contentType!==mime)throw Error('Reference MIME mismatch');images.push({reference_id:id,mime_type:mime,bytes});validation.push({reference_id:id,sha256:createHash('sha256').update(bytes).digest('hex'),byte_length:bytes.length,mime_type:mime})}
 if(!images.length)throw Error('Attach an approved scene or character reference before exporting a production package');
 return {payload:{...payload,compiled_composition:composition,reference_validation:{status:'BYTES_VERIFIED',images_retrieved:true,references:validation},rendered:false},images};
}
export function scriptBundle(payload,images){const files={},map={};for(const i of images){const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[i.mime_type],path='references/'+i.reference_id+'.'+ext;if(!/^[\w-]+$/.test(i.reference_id)||files[path])throw Error('Invalid export image ID');const proof=payload.reference_validation.references.find(r=>r.reference_id===i.reference_id);if(!proof||proof.sha256!==createHash('sha256').update(i.bytes).digest('hex'))throw Error('Export image verification mismatch');files[path]=i.bytes;map[i.reference_id]=path}files['unified-scene.json']=strToU8(JSON.stringify(payload,null,2));files['script.txt']=strToU8(payload.script_text);files['reference-map.json']=strToU8(JSON.stringify(map,null,2));files['README.txt']=strToU8('XCE / XCE_COMPOSER / XCE_MV / XCE_SCRIPT handoff. Upload unified-scene.json and the actual images. LTSTLK planning does not authorize script or image generation. Approved asset pixels remain authoritative. No renderer has executed. Revalidate continuity after any scene changes.');return zipSync(files,{level:0})}
