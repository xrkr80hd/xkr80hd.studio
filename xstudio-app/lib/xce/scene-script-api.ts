import {connection,json} from './composer-api';
import {openProject,persistComposition,ComposerError} from './composer-access.mjs';
import {readBounded} from '../xstudio-providers.mjs';
import {referenceReader} from './composer-media.mjs';
import {SCRIPT_SCHEMA,MOODS,emptyScript,scriptRoster,validateScript,scriptWarnings} from './scene-script.mjs';
import {authorizedScript,saveScriptRequest,scriptPackage,scriptExecution,scriptBundle} from './scene-script-service.mjs';
export async function scriptOperation(req:Request,args:any){
 const request=await connection(req),action=args.action||'read';
 if(action==='schema')return {module:'XCE_SCRIPT',source_url:'https://xstudio.xrkr80hd.studio',schema:SCRIPT_SCHEMA,mood_presets:MOODS,text_model_connected:false,execution_transport:'HOST_CHAT_HANDOFF'};
 if(action==='projects'){const rows=(await request({op:'projects'})).data||[];return {projects:rows.flatMap((row:any)=>{const m=JSON.parse(row.manifest);return m.deleted_at||m.system_pool?[]:[{id:row.project,name:m.campaign_name||row.project}]})}}
 const p=args.project_id,{manifest:m,revision}=await openProject(request,req,p);
 if(action==='scenes')return {project_id:p,revision,scenes:Object.entries(m.scenes||{}).filter(([,s]:any)=>!s.deleted_at).map(([id,s]:any)=>({id,name:s.name||id,character_ids:s.character_ids||[]}))};
 const s=args.scene_id,base=emptyScript(m,p,s),prior=m.scene_scripts?.[s];
 if(action==='read')return {record:prior||{version:0,document:base},current_roster:scriptRoster(m,s),revision,text_model_connected:false};
 if(req.method!=='POST')throw new ComposerError('Use POST for this operation',405);
 const d=args.document;
 if(action==='save'){const result=saveScriptRequest(m,p,s,d,args);const nextRevision=await persistComposition(request,p,result.manifest,revision,args.expected_revision);return {saved:true,record:result.record,revision:nextRevision,warnings:scriptWarnings(result.record.document)}}
 if(action==='validate'){const clean=validateScript(d,m,p,s,{allowAiLines:authorizedScript(m,p,s,d)});return {valid:true,document:clean,warnings:scriptWarnings(clean)}}
 if(action==='handoff')return scriptPackage(m,p,s,d);
 if(action==='execution'||action==='export'){const {payload,images}=await scriptExecution(m,p,s,d,referenceReader(request));if(action==='export')return new Response(scriptBundle(payload,images) as any,{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="xce-unified-scene.zip"','Cache-Control':'private, no-store'}});return {payload,images:images.map((i:any)=>({reference_id:i.reference_id,mime_type:i.mime_type,image_base64:i.bytes.toString('base64')}))}}
 throw new ComposerError('Unknown script operation');
}
export async function sceneScriptRequest(req:Request){try{const args=req.method==='GET'?Object.fromEntries(new URL(req.url).searchParams):JSON.parse((await readBounded(req,300000)).toString('utf8'));const result=await scriptOperation(req,args);return result instanceof Response?result:json(result)}catch(e){const err=e as any;return json({error:err.message||'Script request failed'},err.status||(/changed|Concurrent|roster/.test(err.message)?409:400))}}
