// Helpers for importing a world ZIP that arrives as raw bytes on the server
// (MCP import_world_zip): safe unpacking and fill-only script drafts for the
// world's Story workspace.
import {unzipSync} from 'fflate';
import {randomUUID} from 'node:crypto';
import {validateStory} from './story.mjs';

const MAX_ENTRIES=400,MAX_UNPACKED_BYTES=120*1024*1024,MAX_BODY=150_000;
const norm=s=>String(s||'').trim().toLowerCase();

function safePath(name){
 const path=name.replaceAll('\\','/');
 if(path.startsWith('/')||/^[A-Za-z]:/.test(path)||path.split('/').includes('..'))throw Error('Unsafe path in ZIP: '+name.slice(0,200));
 return path;
}

/**
 * @param {Uint8Array} bytes
 * @param {{maxEntries?:number,maxUnpackedBytes?:number}} [limits]
 * @returns {Record<string,Uint8Array>}
 */
export function unzipPackage(bytes,{maxEntries=MAX_ENTRIES,maxUnpackedBytes=MAX_UNPACKED_BYTES}={}){
 if(!(bytes?.length>=4&&bytes[0]===0x50&&bytes[1]===0x4b&&bytes[2]===0x03&&bytes[3]===0x04))throw Error('Not a ZIP file');
 let entries=0,declared=0;
 const raw=unzipSync(bytes,{filter(file){
  if(file.name.endsWith('/'))return false;
  safePath(file.name);
  if(++entries>maxEntries)throw Error('ZIP has too many files (limit '+maxEntries+')');
  declared+=file.originalSize;if(declared>maxUnpackedBytes)throw Error('ZIP is too large when unpacked');
  return true;
 }});
 const out={};let actual=0;
 for(const [name,data] of Object.entries(raw)){actual+=data.length;if(actual>maxUnpackedBytes)throw Error('ZIP is too large when unpacked');out[safePath(name)]=data;}
 return out;
}

/** Script, story and notes text files in a ZIP. @param {Record<string,Uint8Array>} files */
export function scriptDrafts(files){
 const decoder=new TextDecoder('utf-8',{fatal:true}),drafts=[];
 for(const [path,data] of Object.entries(files)){
  const parts=path.split('/').filter(Boolean),base=parts.at(-1)||'';
  if(parts.some(p=>p==='__MACOSX')||base.startsWith('._')||!/\.(md|txt)$/i.test(base))continue;
  const folders=parts.slice(0,-1).map(p=>p.toLowerCase()),title=base.replace(/\.(md|txt)$/i,'').trim().slice(0,200);
  const kind=folders.some(f=>f==='scripts'||f==='script')?'script':folders.some(f=>f==='story'||f==='stories')?'story':folders.includes('notes')?'notes':/script/i.test(title)?'script':null;
  if(!kind||!title)continue;
  let body;try{body=decoder.decode(data);}catch{continue;}
  if(body.length>MAX_BODY)continue;
  drafts.push({kind,title,body});
 }
 return drafts;
}

/** Fill-only: add drafts whose title is new; never change a saved draft. */
export function mergeScriptDrafts(story,drafts,manifest,newId=randomUUID){
 const next={...story,documents:[...(story.documents||[])]},added=[],same=[],kept=[];
 for(const d of drafts){
  const saved=next.documents.find(x=>norm(x.title)===norm(d.title));
  if(!saved){next.documents.push({id:newId(),kind:d.kind,title:d.title,body:d.body});added.push(d.title);}
  else if(saved.body.trim()===d.body.trim())same.push(d.title);
  else kept.push(d.title);
 }
 return {story:validateStory(next,manifest),added,same,kept};
}

/** Explicit save: the same title (case-insensitive) updates that draft. */
export function upsertScript(story,{title,body,kind='script'},manifest,newId=randomUUID){
 const clean=String(title).trim().slice(0,200),documents=[...(story.documents||[])];
 const i=documents.findIndex(x=>norm(x.title)===norm(clean));
 let action,id;
 if(i<0){id=newId();documents.push({id,kind,title:clean,body});action='created';}
 else{id=documents[i].id;action=documents[i].body===body&&documents[i].kind===kind?'unchanged':'updated';documents[i]={...documents[i],kind,body};}
 return {story:validateStory({...story,documents},manifest),id,action};
}
