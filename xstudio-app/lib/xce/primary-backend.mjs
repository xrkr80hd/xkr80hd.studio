import {XSTUDIO_ENDPOINT} from './xstudio-bridge.mjs';
export function primaryBackend(request,fetcher=fetch){
 async function bootstrap(){}
 function prepare(sql){let values=[];const q=sql.replace(/\s+/g,' ').trim();const statement={bind(...args){values=args;return statement},async result(){
  if(q.startsWith('CREATE TABLE'))return {meta:{changes:0}};
  const owner=q.startsWith('UPDATE xce_projects')?values[1]:values[0];if(!owner)throw Error('Authenticated engine owner required');await bootstrap(owner);
  let result;
  if(q.startsWith('SELECT manifest,revision FROM xce_projects'))return {row:(await request({op:'load',project:values[1]})).data};
  if(q.startsWith('SELECT project,')&&q.includes('FROM xce_projects'))return {results:(await request({op:'projects'})).data};
  if(q.startsWith('INSERT OR IGNORE INTO xce_projects'))result=await request({op:'save',project:values[1],revision:0,manifest:values[2]});
  else if(q.startsWith('UPDATE xce_projects'))result=await request({op:'save',project:values[2],revision:values[3],manifest:values[0]});
  else if(q.startsWith('SELECT project FROM xce_active_context'))return {row:(await request({op:'context'})).data};
  else if(q.startsWith('INSERT INTO xce_active_context'))result=await request({op:'context_save',project:values[1]});
  else if(q.startsWith('SELECT code FROM xce_project_codes'))return {row:(await request({op:'code',project:values[1]})).data};
  else if(q.startsWith('INSERT OR IGNORE INTO xce_project_codes'))result=await request({op:'reserve_code',code:values[1],project:values[2]});
  else if(q.startsWith('SELECT project, position FROM xce_project_order'))return {results:((await request({op:'context'})).data?.project_order||[]).map((project,position)=>({project,position}))};
  else throw Error('Unsupported primary database operation');
  return {meta:{changes:result.changes??1}};
 },async first(){return (await statement.result()).row??null},async all(){return {results:(await statement.result()).results??[]}},async run(){return statement.result()},_query:()=>({q,values})};return statement;}
 const DB={prepare,async batch(statements){const queries=statements.map(s=>s._query());if(!queries[0]?.q.startsWith('DELETE FROM xce_project_order')||queries.slice(1).some(s=>!s.q.startsWith('INSERT INTO xce_project_order')))throw Error('Unsupported primary database batch');await bootstrap(queries[0].values[0]);await request({op:'context_save',project_order:queries.slice(1).sort((a,b)=>a.values[2]-b.values[2]).map(s=>s.values[1])});return queries.map(()=>({meta:{changes:1}}))}};
 const BUCKET={async put(key,value,options){const data=typeof value==='string'?Buffer.from(value):Buffer.from(value);return request({op:'file_put',key,base64:data.toString('base64'),mime_type:options?.httpMetadata?.contentType})},async head(key){const {file}=await request({op:'file_head',key});if(file)return file;return null},async get(key){const {file}=await request({op:'file_get',key});if(!file){return null;}const url=new URL(file.url);if(url.origin!==new URL(XSTUDIO_ENDPOINT).origin||!['/storage/v1/object/sign/xstudio-engine-files/','/storage/v1/object/sign/xstudio-assets/'].some(path=>url.pathname.startsWith(path)))throw Error('Unexpected private file URL');const r=await fetcher(file.url,{redirect:'manual',signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('Primary image download failed');const data=await r.arrayBuffer();if(data.byteLength!==file.size)throw Error('Primary image size mismatch');return {body:data,size:data.byteLength,arrayBuffer:async()=>data,httpMetadata:{contentType:file.mime_type}}}};
 return {DB,BUCKET};
}
