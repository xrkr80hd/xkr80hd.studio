// The authenticated project record key is authoritative, including for legacy projects.
// Never derive an ID from a display name or a storage path.
export function stampProjectIdentity(manifest,projectId){
 if(typeof projectId!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(projectId))throw Error('Invalid project ID');
 manifest.project_id=projectId;
 manifest.project_metadata=projectMetadata(manifest,projectId);
 return manifest;
}
export function projectMetadata(manifest,projectId){
 return {schema_version:'1.0.0',source:'XSTUDIO',project_id:projectId,project_name:manifest.campaign_name||projectId,project_code:manifest.active_project_code||null};
}
export function projectPromptHeader(manifest,projectId){
 return 'XSTUDIO PROJECT METADATA (context only; do not render as visible image text): '+JSON.stringify(projectMetadata(manifest,projectId));
}
