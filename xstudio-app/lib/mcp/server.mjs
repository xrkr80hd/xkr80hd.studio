import {CHARACTER_GENDERS} from '../xce/character-labels.mjs';
import {WORLD_BUILDER_FIELDS} from '../xce/world-builder-fields.mjs';
import {readToolRequest} from './request-body.mjs';
import {workspaceScopes,includeCreatedProjects} from './workspace.mjs';
import {toolResult} from './tool-result.mjs';
import {CONTINUITY_SCHEMA} from '../xce/continuity-service.mjs';
import {ASSET_FORM_FIELDS} from '../xce/asset-form-layout.mjs';
import {METADATA_FIELDS} from '../xce/asset-metadata.mjs';
import {CLASSIFICATIONS} from '../xce/classifications.mjs';
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {WebStandardStreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {z} from 'zod';
import {authenticate,checkOrigin,GatewayError,redisLimiter,RESOURCE,resourceMetadata,settings,SCOPE} from './security.mjs';
import {backend,dataSource} from './data.mjs';

const id=z.string().regex(/^[\w-]{1,128}$/);
const project_id=z.string().regex(/^[\w-]{1,80}$/);
const page={limit:z.number().int().min(1).max(100).default(30),offset:z.number().int().min(0).max(100000).default(0)};
const media={include_media:z.boolean().default(false)};
const category=z.enum(['character','creature','prop','vehicle','location','wardrobe','room','scene','keyframe','reference']);
const classification=z.enum(['',...Object.keys(CLASSIFICATIONS)]);
const update=z.strictObject({asset_id:id,classification,expected_version:z.number().int().min(0)});
const proof=z.strictObject({source:z.enum(['USER_AUTHORED','USER_CONFIRMED','REFERENCE_VERIFIED']),reference_ids:z.array(id).max(30),notes:z.string().max(4000)});
const link=z.strictObject({kind:z.enum(['equal_height','shorter_than','taller_than','opposes','custom']),target_id:id,text:z.string().max(2000).optional(),enabled:z.boolean().optional(),clause_type:z.enum(['relationship','synergy']).optional()});
const patch=z.strictObject({...Object.fromEntries(Object.keys({...METADATA_FIELDS,...ASSET_FORM_FIELDS}).map(k=>[k,z.string().max(10000).optional()])),display_name:z.string().min(1).max(200).optional(),quick_details:z.string().max(4000).optional(),cast_role:z.enum(['main','supporting','villain','sub_villain','general','background','extras','military']).optional(),base_character_id:z.string().max(128).optional(),analysis_status:z.enum(['unverified','user_confirmed','reference_verified']).optional(),provenance:proof.optional(),append_relationships:z.array(link).max(50).optional()});
const metadataUpdate=z.strictObject({asset_id:id,expected_version:z.number().int().min(0),patch});
const metadataBatch={project_id,expected_revision:z.number().int().min(1),updates:z.array(metadataUpdate).min(1).max(50)};
const writeScope=name=>workspaceScopes[name]||(['update_asset_details','bulk_update_asset_details','update_asset_generation_prompt','manage_asset_identity'].includes(name)?'asset:metadata':name.includes('update_asset_classification')?'asset:classify':null);
const continuityShape=z.fromJSONSchema(CONTINUITY_SCHEMA).shape;
export const toolSpecs=[
 ['update_character_profile','Save a character gender, quick details and explicitly supplied complete linked relationship/synergy list using the native character editor validation. Omitted fields are preserved; links replaces only this character linked rules, so read current rules first.',{project_id,asset_id:id,expected_revision:z.number().int().min(1),gender:z.enum(Object.keys(CHARACTER_GENDERS)).optional(),quick_details:z.string().max(4000).optional(),links:z.array(link).max(50).optional(),confirm:z.literal(true)}],
 ['export_world','Export a portable world ZIP containing world/character metadata, relationships, synergies, original image references and a readable director brief. Returns an owner-authenticated download link; destination import support varies.',{project_id}],
 ['get_world_builder','Read saved World Builder, character/asset directory, linked rules and form schemas. Start project setup here before character details or scene generation.',{project_id}],
 ['update_world_builder','Save confirmed World Builder fields without erasing omitted fields. Shared website validation, project identity and revision checks apply.',{project_id,expected_revision:z.number().int().min(1),patch:z.strictObject({...Object.fromEntries(Object.entries(WORLD_BUILDER_FIELDS).map(([key,value])=>[key,z.string().max(value.limit).optional()])),firestarter_state:z.record(z.string(),z.unknown()).optional()}),confirm:z.literal(true)}],
 ['create_world_asset','Create a named DRAFT character, creature or other world-library record before filling its details. Does not fabricate images, approve an anchor or overwrite an existing record.',{project_id,expected_revision:z.number().int().min(1),name:z.string().trim().min(1).max(200),category:z.enum(['characters','creatures','wardrobe','props','vehicles','locations','rooms','scenes_and_shots']),confirm:z.literal(true)}],
 ['create_folder','Create a new XSTUDIO project folder. New folders created by this connection remain in its grant. Requires explicit write consent.',{project_id,name:z.string().trim().min(1).max(200),confirm:z.literal(true)}],
 ['update_folder','Edit an existing project folder name or description without changing its ID.',{project_id,name:z.string().trim().min(1).max(200).optional(),description:z.string().max(400).optional(),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['import_project','Copy an authorized saved project into a new folder. Reuses its owner-owned image references; does not upload a backup file or overwrite another project.',{project_id,source_project_id:project_id,name:z.string().trim().min(1).max(200),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['import_asset','Import real PNG/JPEG/WebP image bytes up to 2.5 MB into a folder, verify the stored image, and classify it as a draft/reference. No automatic approval.',{project_id,name:z.string().trim().min(1).max(200),mime_type:z.enum(['image/png','image/jpeg','image/webp']),image_base64:z.string().min(8).max(3333336),upload_category:z.enum(['cast:main','cast:supporting','cast:villain','cast:sub_villain','cast:general','cast:background','cast:extras','cast:military','creature','beast','magical_being','prop','weapon','vehicle','location','costume','style','diagnostic']),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['delete_folder','Move an explicitly selected project folder to recoverable trash; preserves its assets and stored images.',{project_id,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['restore_folder','Restore a deleted project folder in the current grant.',{project_id,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['delete_assets','Move exact selected asset IDs/codes to recoverable trash. Dependencies outside the selection block the whole request. Stored image bytes are preserved.',{project_id,asset_ids:z.array(id).min(1).max(50),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['restore_assets','Restore exact selected trash keys. Restore required references first or include them in the same selection.',{project_id,trash_keys:z.array(z.string().min(1).max(200)).min(1).max(50),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['list_trash','List deleted asset records and whether the folder itself is deleted. Includes revision for restore/delete actions.',{project_id,...page}],
 ['purge_trash','Permanently remove only explicitly selected trash records. Cannot restore afterward. Preserves shared stored image bytes and dependency checks.',{project_id,trash_keys:z.array(z.string().min(1).max(200)).min(1).max(50),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['get_character_reference','Retrieve a character by exact canonical ID or saved code and return its verified original LOCKED image directly into chat, canonical asset ID, and short-lived --cref URLs. Always fetches image pixels. Searches authorized unlocked projects when project_id is omitted; rejects ambiguity. include_turnaround includes source-sheet metadata without inventing its layout. Use the returned image as the downstream scene reference; verify the generator receives it.',{character_id:id,project_id:project_id.optional(),include_turnaround:z.boolean().default(true)}],
 ['get_asset_identity','Read saved base identity, approved edits, active appearance and individually reusable camera references. include_media returns actual private reference image blocks.',{project_id,asset_id:id,include_media:z.boolean().default(false)}],
 ['verify_vehicle_vin','Validate a complete VIN and decode only legitimate NHTSA fields. Exact appearance/options remain unverified without evidence.',{project_id,vin:z.string().min(1).max(17)}],
 ['manage_asset_identity','Revision-checked identity, explicit edit:, evidence, individual camera preparation/review/approval and reference-sheet operations. Uses the same native editor and API service; requires asset:metadata.',{...continuityShape,project_id,action:z.enum(CONTINUITY_SCHEMA.properties.action.enum.filter(a=>!['read','sheet','parse_command','decode_vin'].includes(a))),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['get_project_classification_schema','Discover classification choices, allowed metadata fields, scopes and version contracts.',{project_id}],
 ['get_asset_details','Read descriptive metadata, missing fields, existing relationships, approval status and prompt versions.',{project_id,asset_id:id}],
 ['update_asset_details','Patch existing metadata only. Omitted fields and user clauses remain unchanged. Requires asset:metadata.',{project_id,...metadataUpdate.shape,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['bulk_update_asset_details','Apply resumable metadata patches across explicitly authorized projects. Locked folders and per-record errors are reported without stopping other projects.',{projects:z.array(z.strictObject(metadataBatch)).min(1).max(10),confirm:z.literal(true)}],
 ['get_asset_generation_prompt','Read reusable prompt, provenance and preserved original versions.',{project_id,asset_id:id}],
 ['update_asset_generation_prompt','Save a versioned prompt based on approved LOCKED references. Never overwrite the original generation prompt or invent reference traits.',{project_id,asset_id:id,expected_revision:z.number().int().min(1),expected_version:z.number().int().min(0),text:z.string().min(1).max(30000),provenance:proof,confirm:z.literal(true)}],
 ['get_asset_classifications','Read primary categories and secondary classifications; includes available choices, metadata versions and revision.',{project_id,asset_ids:z.array(id).max(50).optional()}],
 ['update_asset_classification','Update classification metadata only; requires explicit asset:classify permission. Preserves locked images and primary category.',{project_id,...update.shape,expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['bulk_update_asset_classifications','Classify existing IDs with per-item errors and project revision protection. No duplicates or category moves.',{project_id,updates:z.array(update).min(1).max(50),expected_revision:z.number().int().min(1),confirm:z.literal(true)}],
 ['get_character_cref','Use for exact saved character reference requests such as reference FF6-CH-GAU. Retrieve verified original LOCKED anchor image blocks by exact ID/code, not a description or URL. First list authorized projects and resolve the exact owning project; ask if ambiguous, never assume the active project. Images default on; include_media=false is metadata only. Never substitute drafts. Image delivery to the client does not prove delivery to its generation tool.',{project_id,asset_id:id,include_media:z.boolean().default(true)}],
 ['list_projects','List explicitly authorized XSTUDIO project folders. include_deleted also lists recoverable deleted folders for restoration.',{...page,include_deleted:z.boolean().default(false)}],
 ['get_project','Get saved project metadata and canonical scene IDs.',{project_id}],
 ['list_project_assets','List saved asset IDs, names and metadata in one project.',{project_id,category:category.optional(),...page}],
 ['get_asset','Retrieve one saved asset and its exact reference associations. Signed media is opt-in.',{project_id,asset_id:id,...media}],
 ['get_character_anchor','Retrieve the exact saved LOCKED character anchor. Prefer get_character_cref for visual reference requests. include_media=true returns verified original image blocks using CREF; false (default) returns metadata only. Never substitutes missing references.',{project_id,asset_id:id,...media}],
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
 const server=new McpServer({name:'xstudio-reference-gateway',version:'1.0.0'},{maxToolInputElements:500,instructions:'For exact saved character references, call get_character_reference(character_id). It always retrieves the original locked image into chat and resolves only authorized unlocked projects. A project_id can narrow ambiguous IDs. get_character_cref remains available with an explicit project and media enabled. Discover authorized projects; match the exact code within the intended project and ask when ambiguous. Do not choose the active project implicitly. Metadata, descriptions and signed URLs are not image inputs. Never substitute another character or draft. Confirm actual image delivery separately from generation-tool reference delivery.'});
 for(const [name,description,shape] of toolSpecs)server.registerTool(name,{description,inputSchema:z.strictObject(shape),annotations:{readOnlyHint:!writeScope(name),destructiveHint:['delete_folder','delete_assets','purge_trash'].includes(name),idempotentHint:!writeScope(name),openWorldHint:['verify_vehicle_vin','manage_asset_identity'].includes(name)},_meta:{securitySchemes:[{type:'oauth2',scopes:writeScope(name)?[SCOPE,writeScope(name)]:[SCOPE]}]}},async args=>{
  try{
   const result={source_url:'https://xstudio.xrkr80hd.studio',...await execute(name,args)};
   let envelope;try{envelope=toolResult(name,result);}catch(e){throw new GatewayError(e.message,e.message.startsWith('Result too large')?413:502);}
   audit({tool:name,outcome:'success'});return envelope;
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
  const read=deps.backend||backend(auth.backendToken,fetch,{allowClassificationSave:auth.scopes?.has('asset:classify')||auth.scopes?.has('asset:metadata')||auth.scopes?.has('asset:delete'),allowWorkspaceWrite:auth.scopes?.has('asset:write')});
  // Revalidate the existing API credential on EVERY request, even discovery.
  // A read-only load of an explicitly granted project never changes active context.
  await includeCreatedProjects(auth,read);
  if(auth.projects.size)await read({op:'load',project:auth.projects.values().next().value});else await read({op:'projects'});
  if(!['POST','GET','DELETE'].includes(request.method)){status=405;return response({error:'Method not allowed'},405,{allow:'POST, GET, DELETE, OPTIONS',...cors});}
  if(request.method!=='POST'){status=405;return response({error:'No standalone SSE stream or sessions'},405,{allow:'POST, OPTIONS',...cors});}
  if((request.headers.get('content-type')||'').split(';')[0].trim().toLowerCase()!=='application/json')throw new GatewayError('JSON required',415);
  const declared=Number(request.headers.get('content-length'));if(Number.isFinite(declared)&&declared>4_000_000)throw new GatewayError('Request too large',413);
  let body;try{body=await readToolRequest(request);}catch(error){throw new GatewayError(error.message,error.status||400);}
  if(Array.isArray(body))throw new GatewayError('Single JSON-RPC message required',400);
  server=makeServer(deps.execute||dataSource(auth,read),log);
  transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true,maxRequestBodySize:4_000_000});
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


