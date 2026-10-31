import test from 'node:test';
import assert from 'node:assert/strict';
import {workspaceOperation,includeCreatedProjects,trashAssets,restoreAssets} from '../lib/mcp/workspace.mjs';
import {readToolRequest} from '../lib/mcp/request-body.mjs';
import {fresh} from '../lib/xce/core.mjs';

const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
function fixture(scopes=['asset:read','asset:write','asset:delete']){
 const m=fresh();m.campaign_name='Existing';m.active_project_code='EX';
 const rows=new Map([['P',{manifest:JSON.stringify(m),revision:1}]]),files=new Map(),calls=[],codes=new Map();
 const auth={owner:'11111111-1111-4111-8111-111111111111',principal:'oauth:one-delegation',projects:new Set(['P']),scopes:new Set(scopes)};
 const request=async a=>{calls.push(a);if(a.op==='load')return {data:rows.get(a.project)||null};if(a.op==='projects')return {data:[...rows].map(([project,r])=>({project,...r}))};if(a.op==='code')return {data:codes.has(a.project)?{code:codes.get(a.project)}:null};if(a.op==='reserve_code'){if([...codes.values()].includes(a.code))return {reserved:false};codes.set(a.project,a.code);return {data:null};}if(a.op==='save'){const prior=rows.get(a.project);if((prior?.revision||0)!==a.revision)return {changes:0};rows.set(a.project,{manifest:a.manifest,revision:a.revision+1});return {changes:1};}if(a.op==='file_put'){files.set(a.key,Buffer.from(a.base64,'base64'));return {saved:true};}throw Error('Unexpected operation '+a.op);};
 const getImage=async key=>files.has(key)?{arrayBuffer:async()=>files.get(key)}:null;
 return {auth,request,getImage,rows,files,calls,codes};
}
const edit={project_id:'P',expected_revision:1,confirm:true};

test('read-only clients cannot create, import or delete anything',async()=>{
 const f=fixture(['asset:read']);for(const name of ['create_folder','import_asset','delete_assets','delete_folder','purge_trash'])await assert.rejects(workspaceOperation(name,edit,f),/Permission required/);assert.equal(f.calls.length,0);
});
test('explicit confirmation and project grant run before mutation',async()=>{
 const f=fixture();await assert.rejects(workspaceOperation('delete_folder',{...edit,confirm:false},f),/confirmation/);
 await assert.rejects(workspaceOperation('delete_folder',{...edit,project_id:'OTHER'},f),/not found/);assert.equal(f.calls.length,0);
});
test('create folder verifies saved revision and gives only its creating delegation access',async()=>{
 const f=fixture();const result=await workspaceOperation('create_folder',{project_id:'NEW',name:'New World',confirm:true},f);
 assert.equal(result.revision,1);assert.ok(f.auth.projects.has('NEW'));
 const renewed={...f.auth,projects:new Set(['P'])};await includeCreatedProjects(renewed,f.request);assert.ok(renewed.projects.has('NEW'));
 const other={...renewed,principal:'oauth:other',projects:new Set(['P'])};await includeCreatedProjects(other,f.request);assert.equal(other.projects.has('NEW'),false);
 const read={...renewed,projects:new Set(['P']),scopes:new Set(['asset:read'])};await includeCreatedProjects(read,f.request);assert.equal(read.projects.has('NEW'),false);
});
test('creation cannot overwrite a saved folder or system folder',async()=>{
 const f=fixture();await assert.rejects(workspaceOperation('create_folder',{project_id:'P',name:'Overwrite',confirm:true},f),/already exists/);await assert.rejects(workspaceOperation('create_folder',{project_id:'xce-system',name:'Pool',confirm:true},f),/Reserved/);
 assert.equal(f.rows.get('P').revision,1);
});
test('folder update, trash and restore preserve image references and revision checks',async()=>{
 const f=fixture();let r=await workspaceOperation('update_folder',{...edit,name:'Renamed'},f);assert.equal(r.revision,2);
 await assert.rejects(workspaceOperation('delete_folder',edit,f),/Project changed/);
 r=await workspaceOperation('delete_folder',{...edit,expected_revision:2},f);assert.ok(r.recoverable);
 assert.ok(JSON.parse(f.rows.get('P').manifest).deleted_at);
 r=await workspaceOperation('list_trash',{project_id:'P',limit:30,offset:0},f);assert.equal(r.folder_deleted,true);
 await workspaceOperation('restore_folder',{...edit,expected_revision:3},f);assert.equal(JSON.parse(f.rows.get('P').manifest).deleted_at,undefined);
});
test('locked folders cannot be modified or inspected through trash tools',async()=>{
 const f=fixture(),m=JSON.parse(f.rows.get('P').manifest);m.folder_lock={pin_hash:'private'};f.rows.get('P').manifest=JSON.stringify(m);
 await assert.rejects(workspaceOperation('update_folder',{...edit,name:'Other'},f),/Folder locked/);
 await assert.rejects(workspaceOperation('list_trash',{project_id:'P',limit:30,offset:0},f),/Folder locked/);
});
test('import original image verifies stored bytes and creates only a draft',async()=>{
 const f=fixture();const r=await workspaceOperation('import_asset',{...edit,name:'Example',mime_type:'image/png',image_base64:image.toString('base64'),upload_category:'cast:main'},f);
 assert.equal(r.verified,true);assert.equal(r.approved,false);assert.equal(r.status,'DRAFT');
 const m=JSON.parse(f.rows.get('P').manifest);assert.equal(m.manifest_store.characters[r.asset_id].status,'DRAFT');assert.equal(m.character_cast_groups[r.asset_id],'main');assert.deepEqual([...f.files.values()][0],image);
});
test('invalid image bytes and failed read-back never save a successful import',async()=>{
 const f=fixture();await assert.rejects(workspaceOperation('import_asset',{...edit,name:'Bad',mime_type:'image/png',image_base64:Buffer.from('not png').toString('base64'),upload_category:'prop'},f),/MIME/);assert.equal(f.files.size,0);
 f.getImage=async()=>null;await assert.rejects(workspaceOperation('import_asset',{...edit,name:'Missing',mime_type:'image/png',image_base64:image.toString('base64'),upload_category:'prop'},f),/read-back/);assert.equal(f.rows.get('P').revision,1);
});
test('project import requires authorized source and preserves source without moving its media',async()=>{
 const f=fixture();await assert.rejects(workspaceOperation('import_project',{project_id:'COPY',source_project_id:'SECRET',name:'Copy',expected_revision:1,confirm:true},f),/not found/);
 const prior=f.rows.get('P').manifest;const result=await workspaceOperation('import_project',{project_id:'COPY',source_project_id:'P',name:'Copy',expected_revision:1,confirm:true},f);assert.equal(result.reference_images_reused,true);assert.equal(f.rows.get('P').manifest,prior);assert.equal(JSON.parse(f.rows.get('COPY').manifest).project_id,'COPY');
});
test('asset trash and restore retain exact records and do not delete stored bytes',()=>{
 const m=fresh();m.world_library={props:{NATIVE:{id:'NATIVE',type:'props',name:'Native',status:'LOCKED',reference_ids:[]}}};
 m.manifest_store.props.LEGACY={asset_id:'LEGACY',asset_type:'prop',name:'Legacy',status:'LOCKED',reference_ids:[]};
 const before=structuredClone(m.world_library.props.NATIVE);trashAssets(m,['NATIVE','LEGACY']);assert.equal(m.world_library.props.NATIVE,undefined);
 restoreAssets(m,['prop:NATIVE','prop:LEGACY']);assert.deepEqual(m.world_library.props.NATIVE,before);assert.ok(m.manifest_store.props.LEGACY);
});
test('dependency checks block deleting a used reference atomically',()=>{
 const m=fresh();m.references.REF={id:'REF',name:'Sheet'};m.manifest_store.props.A={asset_id:'A',asset_type:'prop',reference_ids:['REF']};
 assert.throws(()=>trashAssets(m,['REF']),/used by/);assert.ok(m.references.REF);assert.equal(m.trash,undefined);
});
test('permanent deletion touches only selected trash records and checks dependencies',async()=>{
 const f=fixture(),m=JSON.parse(f.rows.get('P').manifest);m.trash={'prop:A':{entity:'prop',id:'A',record:{asset_id:'A',name:'A'}},'prop:B':{entity:'prop',id:'B',record:{asset_id:'B',name:'B'}}};f.rows.get('P').manifest=JSON.stringify(m);
 await workspaceOperation('purge_trash',{...edit,trash_keys:['prop:A']},f);const saved=JSON.parse(f.rows.get('P').manifest);assert.deepEqual(Object.keys(saved.trash),['prop:B']);assert.equal(f.calls.some(c=>c.op==='file_delete'),false);
});
test('CAS conflicts cannot overwrite another writer',async()=>{
 const f=fixture(),request=f.request;f.request=a=>a.op==='save'?Promise.resolve({changes:0}):request(a);
 await assert.rejects(workspaceOperation('update_folder',{...edit,name:'Conflict'},f),/Concurrent/);assert.equal(f.rows.get('P').revision,1);
});
test('larger request bodies are limited to image import; malformed/oversized bodies fail',async()=>{
 const request=text=>new Request('https://example.test/mcp',{method:'POST',body:text});
 const body=JSON.stringify({method:'tools/call',params:{name:'import_asset',arguments:{image_base64:'a'.repeat(70000)}}});assert.equal((await readToolRequest(request(body))).params.name,'import_asset');
 await assert.rejects(readToolRequest(request(body.replace('import_asset','get_project'))),e=>e.status===413);
 await assert.rejects(readToolRequest(request('x'.repeat(70000))),e=>e.status===413);
 await assert.rejects(readToolRequest(request('x')),e=>e.status===400);
 await assert.rejects(readToolRequest(request('x'.repeat(4_000_001))),e=>e.status===413);
});
