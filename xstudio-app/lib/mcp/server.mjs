import {METADATA_FIELDS} from '../xce/asset-metadata.mjs';
import {CLASSIFICATIONS} from '../xce/classifications.mjs';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {z} from 'zod';
import {authenticate,checkOrigin,GatewayError,redisLimiter,RESOURCE,resourceMetadata,settings,SCOPE} from './security.mjs';
import {backend,dataSource,readJSON} from './data.mjs';

const id=z.string().regex(/^[\w-]{1,128}$/);
const project_id=z.string().regex(/^[\w-]{1,80}$/);
const page={limit:z.number().int().min(1).max(100).default(30),offset:z.number().int().min(0).max(100000).default(0)};
const media={include_media:z.boolean().default(false)};
const category=z.enum(['character','creature','prop','vehicle','location','wardrobe','room','scene','keyframe','reference']);
const classification=z.enum(['',...Object.keys(CLASSIFICATIONS)]);
const update=z.strictObject({asset_id:id,classification,expected_version:z.number().int().min(0)});
const proof=z.strictObject({source:z.enum(['USER_AUTHORED','USER_CONFIRMED','REFERENCE_VERIFIED']),reference_ids:z.array(id).max(30),notes:z.string().max(4000)});
const link=z.strictObject({kind:z.enum(['equal_height','shorter_than','taller_than','opposes','custom']),target_id:id,text:z.string().max(2000).optional(),enabled:z.boolean().optional(),clause_type:z.enum(['relationship','synergy']).optional()});
const patch=z.strictObject({...Object.fromEntries(Object.keys(METADATA_FIELDS).map(k=>[k,z.string().max(10000).optional()])),display_name:z.string().min(1).max(200).optional(),quick_details:z.string().max(4000).optional(),cast_role:z.enum(['main','supporting','villain','sub_villain','general','background','extras','military']).optional(),base_character_id:z.string().max(128).optional(),analysis_status:z.enum(['unverified','user_confirmed','reference_verified']).optional(),provenance:proof.optional(),append_relationships:z.array(link).max(50).optional()});
const metadataUpdate=z.strictObject({asset_id:id,expected_version:z.number().int().min(0),patch});
const metadataBatch={project_id,expected_revision:z.number().int().min(1),updates:z.array(metadataUpdate).min(1).max(50)};
const writeScope=name=>['update_asset_details','bulk_update_asset_details','update_asset_generation_prompt'].includes(name)?'asset:metadata':name.includes('update_asset_classification')?'asset:classify':null;
export const toolSpecs=[
 ['get_project_classification_schema','Discover classification choices, allowed metadata fields, scopes and version contracts.',{project_id}],
 ['get_asset_details','Read descriptive metadata, missing fields, existing relationships, approval status and prompt versions.',{project_id,asset_id:id}],
 ['update_asset_details','Patch existing metadata only. Omitted fields and user clauses remain unchanged. Requires asset:metadata.',{project_id,...metadataUpdate.shape,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['bulk_update_asset_details','Apply resumable metadata patches across explicitly authorized projects. Locked folders and per-record errors are reported without stopping other projects.',{projects:z.array(z.strictObject(metadataBatch)).min(1).max(10),confirm:z.literal(true)}],
 ['get_asset_generation_prompt','Read reusable prompt, provenance and preserved original versions.',{project_id,asset_id:id}],
 ['update_asset_generation_prompt','Save a versioned prompt based on approved LOCKED references. Never overwrite the original generation prompt or invent reference traits.',{project_id,asset_id:id,expected_revision:z.number().int().min(1),expected_version:z.number().int().min(0),text:z.string().min(1).max(30000),provenance:proof,confirm:z.literal(true)}],
 ['get_asset_classifications','Read primary categories and secondary classifications; includes available choices, metadata versions and revision.',{project_id,asset_ids:z.array(id).max(50).optional()}],
 ['update_asset_classification','Update classification metadata only; requires explicit asset:classify permission. Preserves locked images and primary category.',{project_id,...update.shape,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['bulk_update_asset_classifications','Classify existing IDs with per-item errors and project revision protection. No duplicates or category moves.',{project_id,updates:z.array(update).min(1).max(50),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['get_character_cref','Retrieve a saved LOCKED character and verified original image blocks by exact ID or code. Images are included by default; include_media=false returns metadata only. Never substitutes draft images or invents identity.',{project_id,asset_id:id,include_media:z.boolean().default(true)}],
 ['list_projects','List explicitly authorized, available XSTUDIO projects.',{...page}],
 ['get_project','Get saved project metadata and canonical scene IDs.',{project_id}],
 ['list_project_assets','List saved asset IDs, names and metadata in one project.',{project_id,category:category.optional(),...page}],
 ['get_asset','Retrieve one saved asset and its exact reference associations. Signed media is opt-in.',{project_id,asset_id:id,...media}],
 ['get_character_anchor','Retrieve a saved LOCKED character anchor. Missing references are never substituted.',{project_id,asset_id:id,...media}],
 ['get_character_references','Retrieve saved character reference associations and optional 60-second media URLs.',{project_id,asset_id:id,...media}],
 ['list_establishing_shots','List records explicitly marked as establishing shots; do not infer a shot type.',{project_id,...page}],
 ['get_scene_references','Retrieve saved scene or shot references and saved cast metadata.',{project_id,scene_id:id,...media}],
 ['get_color_grades','Get the existing factory and saved custom grades and assignments.',{project_id}],
 ['get_composition_rules','Get saved XCE_COMPOSER configurations and user-authored clauses; optionally resolve applicable clauses for selected characters.',{project_id,character_ids:z.array(id).max(60).optional()}],
 ['search_assets','Search saved IDs, codes and names in one authorized project.',{project_id,query:z.string().min(1).max(200),category:category.optional(),...page}],
];
const headers={'cache-control':'private, no-store, max-age=0','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const response=(body,status=200,extra={})=>Response.json(body,{status,headers:{...headers,...extra}});
export function makeServer(execute,audit=()=>{}){
 const server=new McpServer({name:'xstudio-reference-gateway',version:'1.0.0'},{maxToolInputElements:500});
 for(const [name,description,shape] of toolSpecs)server.registerTool(name,{description,inputSchema:z.strictObject(shape),annotations:{readOnlyHint:!writeScope(name),destructiveHint:false,idempotentHint:true,openWorldHint:false},_meta:{securitySchemes:[{type:'oauth2',scopes:writeScope(name)?[SCOPE,writeScope(name)]:[SCOPE]}]}},async args=>{
  try{
   const result={source_url:'https://xstudio.xrkr80hd.studio',...await execute(name,args)};
   const {images,...structured}=result;
   const imageBlocks=name==='get_character_cref'?(images||[]).map(i=>({type:'image',data:i.image_base64,mimeType:i.mime_type})):[];
   const text=JSON.stringify(structured);if(Buffer.byteLength(text)>1_500_000)throw new GatewayError('Result too large; narrow the request',413);
   audit({tool:name,outcome:'success'});return {content:[{type:'text',text},...imageBlocks],structuredContent:structured};
  }catch(error){
   const safe=error instanceof GatewayError?error.message:'Reference retrieval failed';
   audit({tool:name,outcome:'denied_or_failed'});
   return {isError:true,content:[{type:'text',text:JSON.stringify({error:safe})}]};
  }
 });
 return server;
}
export async function gateway(request,deps={}){
 const audit=deps.audit||((event)=>console.info(JSON.stringify({event:'xstudio_mcp',...event})));
 const requestId=crypto.randomUUID();let server,transport,status=500,principal,cors={};
 const log=event=>audit({request_id:requestId,...(principal?{principal}:{}),...event});
 try{
  const config=deps.config||settings();checkOrigin(request,config);
  const origin=request.headers.get('origin');
  cors=origin?{'access-control-allow-origin':origin,vary:'Origin','access-control-allow-headers':'Authorization, Content-Type, Accept, MCP-Protocol-Version, MCP-Session-Id','access-control-allow-methods':'POST, GET, DELETE, OPTIONS','access-control-expose-headers':'WWW-Authenticate'}:{};
  if(request.method==='OPTIONS'){status=204;return new Response(null,{status,headers:{...headers,...cors}});}
  const limit=deps.limit||redisLimiter();await limit('global',600);
  const auth=await (deps.authenticate||authenticate)(request,config);principal=auth.principal;
  await limit(principal,60);
  const read=deps.backend||backend(auth.backendToken,fetch,{allowClassificationSave:auth.scopes?.has('asset:classify')||auth.scopes?.has('asset:metadata')});
  // Revalidate the existing API credential on EVERY request, even discovery.
  // A read-only load of an explicitly granted project never changes active context.
  await read({op:'load',project:auth.projects.values().next().value});
  if(!['POST','GET','DELETE'].includes(request.method)){status=405;return response({error:'Method not allowed'},405,{allow:'POST, GET, DELETE, OPTIONS',...cors});}
  if(request.method!=='POST'){status=405;return response({error:'No standalone SSE stream or sessions'},405,{allow:'POST, OPTIONS',...cors});}
  if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')throw new GatewayError('JSON required',415);
  const declared=Number(request.headers.get('content-length'));if(Number.isFinite(declared)&&declared>65536)throw new GatewayError('Request too large',413);
  let body;try{body=await readJSON(new Response(request.body),65536);}catch(error){throw new GatewayError(error.message==='Response too large; narrow the request'?'Request too large':'Invalid JSON',error.message==='Response too large; narrow the request'?413:400);}
  if(Array.isArray(body))throw new GatewayError('Single JSON-RPC message required',400);
  server=makeServer(deps.execute||dataSource(auth,read),log);
  transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true,maxRequestBodySize:65536});
  await server.connect(transport);
  const result=await transport.handleRequest(request,{parsedBody:body});
  status=result.status;const merged=new Headers(result.headers);for(const [k,v]of Object.entries({...headers,...cors}))merged.set(k,v);
  // JSON mode completes the request before return. No session or background stream.
  return new Response(result.body,{status:result.status,headers:merged});
 }catch(error){
  status=error instanceof GatewayError?error.status:503;
  const challenge=status===401||status===403?{'www-authenticate':`Bearer resource_metadata="https://xstudio.xrkr80hd.studio/.well-known/oauth-protected-resource/mcp", scope="${SCOPE}", error="${status===401?'invalid_token':'insufficient_scope'}"`}:{};
  const body=error instanceof GatewayError&&error.message==='Invalid JSON'?{jsonrpc:'2.0',id:null,error:{code:-32700,message:'Parse error'}}:{error:error instanceof GatewayError?error.message:'MCP gateway unavailable'};
  return response(body,status,{...cors,...challenge,...(status===429?{'retry-after':'60'}:{})});
 }finally{
  if(server)await server.close();else if(transport)await transport.close();
  log({status});
 }
}
export function metadata(){
 try{return response(resourceMetadata(settings()));}catch{return response({error:'MCP authorization not configured'},503);}
}
