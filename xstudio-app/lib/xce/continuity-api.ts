import {connection,json} from './composer-api';
import {openProject,persistComposition,ComposerError} from './composer-access.mjs';
import {CONTINUITY_SCHEMA,continuityOperation} from './continuity-service.mjs';
import {referenceReader} from './composer-media.mjs';
import {byteStream} from './response-stream.mjs';
import {readBounded} from '../xstudio-providers.mjs';
export async function continuityRequest(req:Request){
 try{
  const request=await connection(req),query=new URL(req.url).searchParams;
  const args:any=req.method==='GET'?Object.fromEntries(query):JSON.parse((await readBounded(req,150000)).toString('utf8'));
  if(args.action==='schema')return json({source_url:'https://xstudio.xrkr80hd.studio',schema:CONTINUITY_SCHEMA,mcp_tools:['get_asset_identity','verify_vehicle_vin','manage_asset_identity'],rendered:false});
  if(req.method==='GET'&&!['read','sheet'].includes(args.action||'read'))return json({error:'Use POST for this operation'},405);
  args.action||='read';if(req.method==='GET'&&args.include_media!==undefined)args.include_media=args.include_media==='true';
  const p=args.project_id,{manifest,revision}=await openProject(request,req,p);
  const result=await continuityOperation(manifest,p,revision,args,{getImage:referenceReader(request)});
  let nextRevision=revision;
  if(result.manifest)nextRevision=await persistComposition(request,p,result.manifest,revision,args.expected_revision);
  if(result.sheet)return new Response(byteStream(Buffer.from(result.sheet)),{headers:{'Content-Type':'image/svg+xml','Content-Disposition':'attachment; filename="vehicle-turnaround.svg"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'"}});
  const payload={...result.data,source_url:'https://xstudio.xrkr80hd.studio',revision:nextRevision,...(result.manifest?{manifest:{...result.manifest,revision:nextRevision}}:{})};
  if(result.data.images?.length)return new Response(byteStream(Buffer.from(JSON.stringify(payload))),{headers:{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  return json(payload);
 }catch(error){const message=(error as Error).message;return json({error:message},error instanceof ComposerError?error.status:/Project changed|Concurrent project/.test(message)?409:400)}
}
