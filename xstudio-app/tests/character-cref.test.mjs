import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {characterCref,prepareCharacterCref} from '../lib/xce/character-cref.mjs';
import {referenceReader} from '../lib/xce/composer-media.mjs';
import {dataSource} from '../lib/mcp/data.mjs';
import {makeServer} from '../lib/mcp/server.mjs';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {InMemoryTransport} from '@modelcontextprotocol/sdk/inMemory.js';
const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const sha256=createHash('sha256').update(bytes).digest('hex');
function fixture(native=false){const record={id:'C',asset_id:'C',asset_code:'P-CH-C',name:'Saved identity',status:'LOCKED',asset_type:'character',source_image_id:'S',reference_ids:['OLD'],owner_image_approval:{reference_id:'S',sha256}};return {references:{S:{id:'S',key:'xce/legacy/P/S',role:'IDENTITY',mime_type:'image/png'},OLD:{id:'OLD',key:'xce/legacy/P/OLD',role:'IDENTITY',mime_type:'image/png'}},...(native?{world_library:{characters:{C:record}}}:{manifest_store:{characters:{C:record}}})};}
const reader=async()=>({size:bytes.length,arrayBuffer:async()=>bytes,httpMetadata:{contentType:'image/png'}});
for(const native of [false,true])test(`CREF retrieves only the approved cloud source (${native?'native':'legacy'}) without writes`,async()=>{const m=fixture(native),before=JSON.stringify(m),keys=[];const result=await prepareCharacterCref(m,'P','P-CH-C',4,async key=>{keys.push(key);return reader()});assert.deepEqual(keys,['xce/legacy/P/S']);assert.deepEqual(result.cref.reference_ids,['S']);assert.equal(result.images[0].image_base64,bytes.toString('base64'));assert.equal(result.images[0].sha256,sha256);assert.equal(result.cref.generation_authorized,false);assert.equal(JSON.stringify(m),before);});
test('CREF fails closed for drafts, deleted sources, mismatched approvals and changed image bytes',async()=>{for(const mutate of [m=>m.manifest_store.characters.C.status='DRAFT',m=>m.references.S.deleted_at='now',m=>m.references.S.role='DIAGNOSTIC',m=>m.manifest_store.characters.C.owner_image_approval.reference_id='OLD',m=>m.manifest_store.characters.C.owner_image_approval.sha256='0'.repeat(64)]){const m=fixture();mutate(m);await assert.rejects(prepareCharacterCref(m,'P','C',1,reader));}await assert.rejects(prepareCharacterCref(fixture(),'P','C',1,async()=>null),/missing from cloud/);await assert.rejects(prepareCharacterCref(fixture(),'P','C',1,async()=>({size:bytes.length+1,arrayBuffer:async()=>bytes,httpMetadata:{contentType:'image/png'}})),/size mismatch/);assert.throws(()=>characterCref(fixture(),'P','Unknown',1),/not found/);});
test('universal CREF enforces project access, supports metadata-only and rejects revision drift',async()=>{const m=fixture(),auth={projects:new Set(['P'])};let loads=0,downloads=0;const request=async args=>{assert.equal(args.op,'load');loads++;return {data:{manifest:JSON.stringify(m),revision:loads>1?2:1}}};const run=dataSource(auth,request,{getImage:async()=>{downloads++;return reader()}});await assert.rejects(run('get_character_cref',{project_id:'OTHER',asset_id:'C'}),/not found/);assert.equal(loads,0);await assert.rejects(run('get_character_cref',{project_id:'P',asset_id:'C'}),/Project changed/);assert.equal(downloads,1);const metadata=await run('get_character_cref',{project_id:'P',asset_id:'C',include_media:false});assert.equal(metadata.cref.asset_id,'C');assert.equal(downloads,1);});
test('discovered universal CREF returns actual MCP image content by default and no storage keys',async()=>{const m=fixture(),request=async args=>{assert.equal(args.op,'load');return {data:{manifest:JSON.stringify(m),revision:3}}},execute=dataSource({projects:new Set(['P'])},request,{getImage:reader});const server=makeServer(execute),client=new Client({name:'cref-test',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();try{await Promise.all([server.connect(a),client.connect(b)]);const list=await client.listTools(),spec=list.tools.find(t=>t.name==='get_character_cref');assert.equal(spec.inputSchema.properties.include_media.default,true);const result=await client.callTool({name:'get_character_cref',arguments:{project_id:'P',asset_id:'C'}});assert.equal(result.isError,undefined);assert.equal(result.content[1].type,'image');assert.equal(result.content[1].data,bytes.toString('base64'));assert.equal(result.structuredContent.cref.asset_id,'C');assert.ok(!JSON.stringify(result).includes('xce/legacy'));assert.ok(!JSON.stringify(result.structuredContent).includes('image_base64'));const meta=await client.callTool({name:'get_character_cref',arguments:{project_id:'P',asset_id:'C',include_media:false}});assert.equal(meta.content.length,1);}finally{await client.close();await server.close()}});

for(const name of ['get_character_cref','get_character_anchor'])test(`${name} exact code, pinned source and metadata-only over MCP`,async()=>{
 const m=fixture(),keys=[],before=JSON.stringify(m),run=dataSource({projects:new Set(['P'])},async a=>{assert.equal(a.op,'load');return {data:{manifest:JSON.stringify(m),revision:1}}},{getImage:async key=>{keys.push(key);return reader()}});
 const server=makeServer(run),client=new Client({name:'handoff',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();
 try{await Promise.all([server.connect(a),client.connect(b)]);
 const result=await client.callTool({name,arguments:{project_id:'P',asset_id:'P-CH-C',include_media:true}});
 assert.equal(result.isError,undefined);assert.deepEqual(keys,['xce/legacy/P/S']);assert.equal(result.content[1].type,'image');assert.equal(result.content[1].mimeType,'image/png');assert.equal(result.content[1].data,bytes.toString('base64'));assert.equal(result.structuredContent.cref.images_retrieved,true);
 const meta=await client.callTool({name,arguments:{project_id:'P',asset_id:'C',include_media:false}});assert.equal(meta.content.length,1);assert.equal(keys.length,1);assert.equal(JSON.stringify(m),before);
 const forbidden=await client.callTool({name,arguments:{project_id:'OTHER',asset_id:'C',include_media:true}});assert.equal(forbidden.isError,true);assert.equal(keys.length,1);
 }finally{await client.close();await server.close()}
});
test('exact code never falls back to name, duplicate, draft, gallery or mismatched reference',async()=>{
 for(const mutate of [m=>m.manifest_store.characters.C.asset_code='OTHER',m=>m.manifest_store.characters.C.status='DRAFT',m=>delete m.references.S,m=>m.references.S.status='DRAFT',m=>m.manifest_store.characters.C.source_image_id='MISSING',m=>m.manifest_store.characters.D={...m.manifest_store.characters.C,id:'D',asset_id:'D'}]){
  const m=fixture();mutate(m);let downloads=0;const run=dataSource({projects:new Set(['P'])},async()=>({data:{manifest:JSON.stringify(m),revision:1}}),{getImage:async()=>{downloads++;return reader()}});
  for(const name of ['get_character_cref','get_character_anchor'])await assert.rejects(run(name,{project_id:'P',asset_id:'P-CH-C',include_media:true}));assert.equal(downloads,0);
 }
});
test('CREF reports download, unsupported MIME and oversized original failures',async()=>{
 await assert.rejects(prepareCharacterCref(fixture(),'P','C',1,async()=>{throw Error('Reference download failed')}),/download failed/);
 await assert.rejects(prepareCharacterCref(fixture(),'P','C',1,async()=>({size:7*1024*1024})),/size/);
 await assert.rejects(prepareCharacterCref(fixture(),'P','C',1,async()=>({size:4,arrayBuffer:async()=>Buffer.from('nope'),httpMetadata:{contentType:'image/png'}})));
});
test('MCP bounds actual image envelope, not just metadata',async()=>{
 const server=makeServer(async()=>({images:[{mime_type:'image/png',image_base64:'A'.repeat(4_000_001)}]})),client=new Client({name:'size',version:'1'}),[a,b]=InMemoryTransport.createLinkedPair();
 try{await Promise.all([server.connect(a),client.connect(b)]);const result=await client.callTool({name:'get_character_cref',arguments:{project_id:'P',asset_id:'C'}});assert.equal(result.isError,true);assert.match(result.content[0].text,/too large/);assert.equal(result.content.length,1)}finally{await client.close();await server.close()}
});

test('private image reader rejects expired URLs, untrusted destinations and oversized downloads',async()=>{
 const url='https://osbsjjoxepxezcmupcak.supabase.co/storage/v1/object/sign/xstudio-engine-files/test?token=fixture';
 const request=async()=>({file:{url,size:bytes.length,mime_type:'image/png'}});
 let options;const expired=referenceReader(request,async(u,o)=>{options=o;return new Response(null,{status:403})});await assert.rejects(expired('xce/legacy/P/S'),/download failed/);assert.equal(options.redirect,'manual');assert.equal(options.cache,'no-store');
 const untrusted=referenceReader(async()=>({file:{url:'https://example.invalid/image',size:bytes.length}}),async()=>{throw Error('must not fetch')});await assert.rejects(untrusted('xce/legacy/P/S'),/Unexpected private reference URL/);
 const large=referenceReader(async()=>({file:{url,size:7*1024*1024}}),async()=>{throw Error('must not fetch')});await assert.rejects(large('xce/legacy/P/S'),/size/);
 const success=referenceReader(request,async()=>new Response(bytes));assert.deepEqual(Buffer.from(await (await success('xce/legacy/P/S')).arrayBuffer()),bytes);
});
