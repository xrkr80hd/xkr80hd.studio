import {byteStream} from '../../../../lib/xce/response-stream.mjs';
import {connection,json} from '../../../../lib/xce/composer-api';
import {openProject} from '../../../../lib/xce/composer-access.mjs';
import {referenceReader} from '../../../../lib/xce/composer-media.mjs';
import {readBounded} from '../../../../lib/xstudio-providers.mjs';
import {inspectBatch,prepareBatch,batchZip,BATCH_SCHEMA} from '../../../../lib/xce/scene-batch.mjs';
export const dynamic='force-dynamic';
export const runtime='nodejs';
export const maxDuration=300;
export async function POST(req:Request){try{
 const request=await connection(req),body=JSON.parse((await readBounded(req,300000)).toString('utf8'));
 if(!['inspect','download','schema'].includes(body.action))return json({error:'Unknown export operation'},400);
 if(body.action==='schema')return json(BATCH_SCHEMA);
 const p=body.project_id,s=body.scene_id,{manifest,revision}=await openProject(request,req,p),m={...manifest,revision};
 const options={composition_id:body.composition_id||'',master_reference_id:body.master_reference_id||'',...(body.document?{document:body.document}:{})};
 if(body.action==='inspect')return json({...inspectBatch(m,p,s,options),revision});
 if(body.expected_revision!==undefined&&body.expected_revision!==revision)return json({error:'Scene project changed after preflight. Recheck before downloading.'},409);
 const report=inspectBatch(m,p,s,options);if(!report.can_export)return json({error:'Export blocked by missing or unlocked references',issues:report.issues,warnings:report.warnings},422);
 const result=await prepareBatch(m,p,s,options,referenceReader(request));
 // Reject a concurrent project/anchor change instead of delivering a stale verified snapshot.
 const current=await openProject(request,req,p);if(current.revision!==revision)return json({error:'Project changed while retrieving batch images. Recheck and export again.'},409);
 return new Response(byteStream(batchZip(result)),{headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="'+s+'_XCE_GPT_Batch.zip"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-XCE-Batch-Version':'3.1.0-GPT-BATCH-HANDOFF'}});
 }catch(e){const err=e as any;return json({error:err.message||'Scene export failed'},err.status||(/changed|roster/.test(err.message)?409:400))}}
