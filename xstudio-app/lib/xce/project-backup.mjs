import {compileWorld} from './world-builder.mjs';
// A portable records snapshot. Image references are listed, never represented as embedded bytes.
export function projectBackup(m,{project_id,revision,created_at=new Date().toISOString()}){
 const manifest=structuredClone(m);delete manifest.folder_lock;
 const files=Object.values(m.references||{}).map(r=>({reference_id:r.id,name:r.name,mime_type:r.mime_type,size_bytes:r.size??null,content_sha256:r.content_sha256||null}));
 const strip=o=>{if(!o||typeof o!=='object')return;delete o.key;delete o.idempotency_key;for(const v of Object.values(o))strip(v)};strip(manifest);
 return {format:'xce-project-records',schema_version:'1.0.0',created_at,project_id,project_name:m.campaign_name,project_code:m.active_project_code,revision,manifest,world_builder:compileWorld(manifest,project_id),media:{embedded:false,files,instruction:'Image bytes remain in Xstudio. This records snapshot alone is not a complete media backup.'},restore_policy:'Reference snapshot only. Never overwrite a live project or approved anchor automatically.'};
}
export function projectBackupHandoff({project,project_id,project_code}){
 const folder=String(project||project_code||project_id).replace(/[\\/\u0000-\u001f]/g,'_');
 return ['Use XCE — Xstudio Cinematic Engine and the connected ChatGPT file tools.',`Export saved project ${JSON.stringify(project)} using XCE export_project_records with project_id ${JSON.stringify(project_id)}.`,`Save the returned JSON under /XSTUDIO/${folder}/Site Backup. Create that subfolder if missing. Preserve existing backup versions; do not overwrite unrelated files.`, 'Report the actual saved path and file identity. This exports records and image references, not image bytes. Never call it a full media backup or claim it was attached to a native ChatGPT Project. If the required connection or write operation is unavailable, stop and report that stage.','This authorizes this named project records backup only. Do not generate, approve, move or delete studio assets.'].join('\n');
}
