import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {createServer} from 'node:http';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import {gateway} from '../lib/mcp/server.mjs';
import {dataSource} from '../lib/mcp/data.mjs';
import * as classifications from '../lib/xce/classifications.mjs';
import * as characterForm from '../lib/xce/character-form.mjs';
import * as metadata from '../lib/xce/asset-metadata.mjs';
import * as network from '../lib/xce/character-network.mjs';
import * as library from '../lib/xce/world-library.mjs';
import * as access from '../lib/xce/composer-access.mjs';
// Exercise the actual API handler and actual MCP SDK against the same isolated persistence adapter.
test('website API save -> MCP read/write -> API reload; auth and stale revision fail closed',async()=>{
 let revision=1,manifest=JSON.stringify({manifest_store:{props:{P:{asset_id:'P',asset_type:'prop',name:'Test prop',status:'LOCKED',source_image_id:'R',reference_ids:['R'],generation_prompt:'preserve'}}},references:{R:{id:'R',role:'IDENTITY'}}});
 const backend=async a=>{if(a.op==='context')return {};if(a.op==='load')return {data:{manifest,revision}};if(a.op==='save'){if(a.revision!==revision)return {changes:0};manifest=a.manifest;revision++;return {changes:1}};throw Error('Unexpected backend operation')};
 const module={exports:{}};const code=ts.transpileModule(readFileSync(new URL('../lib/xce/composer-api.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 new Function('require','module','exports',code)(name=>name.includes('character-form')?characterForm:name.includes('asset-metadata')?metadata:name.includes('character-network')?network:name.includes('world-library')?library:name.includes('classifications')?classifications:name.includes('composer-access')?access:name.includes('session-backend')?{engineRequest:backend}:name.includes('xstudio-server')?{requireOwner:async()=>({})}:name.includes('xstudio-providers')?{readBounded:async req=>Buffer.from(await req.text())}:{},module,module.exports);
 const api=module.exports.composerRequest;
 const auth={projects:new Set(['A']),scopes:new Set(['asset:read','asset:classify','asset:metadata']),principal:'test'};
 const http=createServer(async(req,res)=>{try{const bytes=[];for await(const c of req)bytes.push(c);const request=new Request('https://xstudio.xrkr80hd.studio'+req.url,{method:req.method,headers:req.headers,...(req.method==='POST'?{body:Buffer.concat(bytes)}:{})});const r=req.url.startsWith('/api/')?await api(request):await gateway(request,{config:{origins:['https://xstudio.xrkr80hd.studio']},authenticate:async r=>{assert.equal(r.headers.get('authorization'),'Bearer test');return auth},limit:async()=>{},audit:()=>{},backend,execute:dataSource(auth,backend)});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
 await new Promise(r=>http.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+http.address().port;let client;
 try{
 const save=body=>fetch(base+'/api/composer',{method:'POST',headers:{origin:'https://xstudio.xrkr80hd.studio','content-type':'application/json'},body:JSON.stringify(body)});
 let r=await save({action:'classify',project_id:'A',asset_id:'P',classification:'weapon',expected_version:0,expected_revision:1,confirm:true});assert.equal(r.status,200);assert.equal((await r.json()).revision,2);
 client=new Client({name:'test',version:'1'});await client.connect(new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{authorization:'Bearer test'}}}));
 let read=await client.callTool({name:'get_asset_classifications',arguments:{project_id:'A'}});assert.equal(read.structuredContent.assets[0].secondary_classification,'weapon');
 const update=await client.callTool({name:'update_asset_classification',arguments:{project_id:'A',asset_id:'P',classification:'equipment',expected_version:1,expected_revision:2,confirm:true}});assert.equal(update.isError,undefined);
 read=await (await fetch(base+'/api/composer?action=classifications&project_id=A')).json();assert.equal(read.assets[0].secondary_classification,'equipment');assert.equal(read.revision,3);assert.equal(JSON.parse(manifest).manifest_store.props.P.generation_prompt,'preserve');
 r=await save({action:'classify',project_id:'A',asset_id:'P',classification:'weapon',expected_version:0,expected_revision:1,confirm:true});assert.equal(r.status,409);
 r=await save({action:'metadata_update',project_id:'A',asset_id:'P',patch:{description:'Verified user text'},expected_version:0,expected_revision:3,confirm:true});assert.equal(r.status,200);
 read=await client.callTool({name:'get_asset_details',arguments:{project_id:'A',asset_id:'P'}});assert.equal(read.structuredContent.fields.description,'Verified user text');
 const prompt=await client.callTool({name:'update_asset_generation_prompt',arguments:{project_id:'A',asset_id:'P',text:'User prompt with locked source',provenance:{source:'USER_AUTHORED',reference_ids:['R'],notes:'User supplied'},expected_version:0,expected_revision:4,confirm:true}});assert.equal(prompt.isError,undefined);
 read=await (await fetch(base+'/api/composer?action=generation_prompt&project_id=A&asset_id=P')).json();assert.equal(read.text,'User prompt with locked source');assert.equal(read.version,1);assert.equal(read.history[0].text,'preserve');assert.equal(JSON.parse(manifest).manifest_store.props.P.generation_prompt,'preserve');
 r=await save({action:'character_form',project_id:'A',asset_id:'NEW',create:true,expected_revision:5,confirm:true,operations:[{action:'character_images',reference_ids:['R'],anchors:{}},{action:'asset_edit',details:{name:'User character',category:'characters',description:'',clauses:[],cast_group:'general',gender:'unspecified',equipment_ids:[],medium:'RL'}},{action:'character_details',details:{quick_details:'User continuity',links:[],gender:'unspecified'}}]});assert.equal(r.status,200);const created=await r.json();assert.equal(created.manifest.world_library.characters.NEW.name,'User character');assert.equal(created.manifest.character_network.details.NEW.text,'User continuity');
 r=await save({action:'character_form',project_id:'A',asset_id:'NEW',create:true,expected_revision:6,confirm:true,operations:[]});assert.equal(r.status,400);assert.equal(Object.keys(JSON.parse(manifest).world_library.characters).length,1);
 }finally{if(client)await client.close();http.closeAllConnections();await new Promise(r=>http.close(r))}
});
