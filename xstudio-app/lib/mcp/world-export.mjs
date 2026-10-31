import {createHash} from 'node:crypto';
import {Zip,ZipPassThrough} from 'fflate';
import {compileWorld} from '../xce/world-builder.mjs';
import {codedRecords} from '../xce/asset-codes.mjs';

const PRIVATE=new Set(['key','storage_path','storage_bucket','folder_lock','session_hash','pin_hash','token_hash','salt','_mcp_created_for','mcp_locations','permits','pending_action','trash']);
export function portableData(value){
 if(Array.isArray(value))return value.map(portableData);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!PRIVATE.has(k)).map(([k,v])=>[k,portableData(v)]));
 if(typeof value==='string'&&/^https?:\/\//i.test(value)){try{const u=new URL(value);if(u.searchParams.has('token')||u.searchParams.has('signature'))return null;}catch{return null;}}
 return value;
}
const extensions={'image/png':'png','image/jpeg':'jpg','image/webp':'webp','image/svg+xml':'svg'};
export function worldExport(m,project,revision){
 const refs=Object.entries(m.references||{}).map(([id,r])=>{
  const extension=extensions[r.mime_type];if(!extension||typeof r.key!=='string'||!r.key.startsWith('xce/'))throw Error('A saved reference cannot be exported: '+id);
  const file='images/'+id.replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,100)+'-'+createHash('sha256').update(id).digest('hex').slice(0,8)+'.'+extension;
  return {reference_id:id,file,name:r.name||id,mime_type:r.mime_type,generation_input_allowed:r.role!=='DIAGNOSTIC',expected_sha256:r.sha256||r.content_sha256||null};
 });
 if(refs.length>1000)throw Error('World export supports up to 1,000 original references');
 const manifest=portableData(structuredClone(m));
 for(const r of refs)manifest.references[r.reference_id]={...manifest.references[r.reference_id],file:r.file};
 return {format:'xce-portable-world',schema_version:'1.0.0',project_id:project,project_name:m.campaign_name||project,revision,exported_at:new Date().toISOString(),manifest,world:portableData(compileWorld(m,project)),media:refs,reference_policy:'LOCKED source_image_id and approval metadata identify authoritative original images. Never substitute remembered designs. Diagnostic images cannot be generation inputs.',director_instructions:'Read DIRECTOR_BRIEF.md and world.json. Resolve every selected asset to its included original image; preserve canonical IDs, saved canon and enabled relationships/synergies. Use source images as actual generation references. Do not invent missing canon, imagery, approvals or offscreen assets.'};
}
export function directorBrief(doc){return `# ${doc.project_name} — portable director handoff\n\nProject ID: ${doc.project_id}\nRevision: ${doc.revision}\n\nRead world.json for the complete saved world, character profiles, category records, references, relationships, synergies, scenes and continuity rules. Images are original files in images/. media-index.json records the actual exported byte hashes. Keep all IDs and code-to-image mappings unchanged.\n\nStart with World Builder. Separate confirmed canon from proposals and unanswered questions. Apply an enabled relationship/synergy only when both named assets are actually in the selected scene. Do not add a character merely to activate a rule. LOCKED source_image_id and approval data identify the visual authority; drafts remain drafts.\n\nUse the actual included original images through the destination generator's supported reference inputs. Names, prose and --cref text alone are not image inputs. Preserve appearance, wardrobe, scale and world rules. Plan scenes with the user before generation; export is not permission to spend credits or publish.\n\nUpload world.json or this brief to the destination's document/notebook input, then attach its supported reference images. If it does not accept ZIP, extract this archive first. InVideo, OpenArt and other products have different import formats and reference limits; this package does not install an integration or guarantee automatic ingestion by any service.\n\nCheckpoint: report which documents and images were actually read, what remains unknown, and the next single question before continuing.\n`;}
export function worldZip(m,project,revision,getFile){
 const doc=worldExport(m,project,revision);let stopped=false,zip;
 return new ReadableStream({
  start(controller){zip=new Zip((error,data,final)=>{if(stopped)return;if(error){stopped=true;controller.error(error);return;}controller.enqueue(data);if(final){stopped=true;controller.close();}});
   const add=(name,data)=>{const entry=new ZipPassThrough(name);zip.add(entry);entry.push(data,true);};
   void(async()=>{try{
    add('world.json',Buffer.from(JSON.stringify(doc,null,2)));add('DIRECTOR_BRIEF.md',Buffer.from(directorBrief(doc)));
    const index=[];let total=0;
    for(const item of doc.media){if(stopped)return;const ref=m.references[item.reference_id],object=await getFile(ref.key);if(!object)throw Error('Original reference missing: '+item.reference_id);
     const bytes=Buffer.from(await object.arrayBuffer());if(!bytes.length||bytes.length>6*1024*1024||object.size!==bytes.length)throw Error('Original reference size mismatch');total+=bytes.length;if(total>200*1024*1024)throw Error('World media exceeds the 200 MB export limit');
     const sha256=createHash('sha256').update(bytes).digest('hex');const approvals=codedRecords(m).filter(({record:r})=>r.source_image_id===item.reference_id).map(({record:r})=>r.owner_image_approval?.sha256).filter(Boolean);
     for(const expected of [item.expected_sha256,...approvals].filter(Boolean))if(expected!==sha256)throw Error('Original reference digest mismatch: '+item.reference_id);
     if(object.httpMetadata?.contentType&&object.httpMetadata.contentType!==item.mime_type)throw Error('Original reference MIME mismatch');
     add(item.file,bytes);index.push({...item,sha256,byte_size:bytes.length});
    }
    add('media-index.json',Buffer.from(JSON.stringify(index,null,2)));zip.end();
   }catch(error){if(!stopped){stopped=true;zip.terminate();controller.error(error);}}})();
  },cancel(){stopped=true;zip?.terminate();}
 });
}
