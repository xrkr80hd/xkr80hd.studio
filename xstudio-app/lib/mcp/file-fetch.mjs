// Server-side download of a file ChatGPT hands over through `openai/fileParams`.
// The URL comes from the model, so treat it as untrusted: https only, public
// addresses only (every redirect hop is re-checked), a hard byte cap, a timeout,
// and no XStudio credentials on the request.
import {promises as dns} from 'node:dns';
import net from 'node:net';

export const ZIP_MAX_BYTES=41_943_040;
const MAX_REDIRECTS=3,TIMEOUT_MS=20_000;

const blocked=new net.BlockList();
for(const [net4,bits] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',4],['240.0.0.0',4]])blocked.addSubnet(net4,bits,'ipv4');
for(const [net6,bits] of [['::',128],['::1',128],['64:ff9b::',96],['100::',64],['2001::',23],['2001:db8::',32],['fc00::',7],['fe80::',10],['ff00::',8]])blocked.addSubnet(net6,bits,'ipv6');

/** @param {string} ip */
export function isPublicAddress(ip){
 const mapped=/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(ip);
 if(mapped)return isPublicAddress(mapped[1]);
 const family=net.isIP(ip);
 if(family===4)return !blocked.check(ip,'ipv4');
 if(family===6)return !blocked.check(ip,'ipv6');
 return false;
}

/**
 * @param {{download_url?:string,file_id?:string}|null|undefined} file
 * @param {{maxBytes:number,fetchImpl?:typeof fetch,lookup?:(host:string,opts:any)=>Promise<{address:string}[]>,timeoutMs?:number}} options
 * @returns {Promise<Buffer>}
 */
export async function fetchFile(file,{maxBytes,fetchImpl=fetch,lookup=dns.lookup,timeoutMs=TIMEOUT_MS}){
 const signal=AbortSignal.timeout(timeoutMs);
 const timedOut=new Promise((_,reject)=>signal.addEventListener('abort',()=>reject(Error('File download timed out')),{once:true}));timedOut.catch(()=>{});
 const bounded=promise=>Promise.race([promise,timedOut]);
 if(!file||typeof file.download_url!=='string'||typeof file.file_id!=='string'||!file.file_id)throw Error('A file with download_url and file_id is required');
 let url;
 try{url=new URL(file.download_url);}catch{throw Error('Invalid file download_url');}
 for(let hop=0;;hop++){
  if(url.protocol!=='https:')throw Error('File download must use https');
  const addresses=await bounded(lookup(url.hostname.replace(/^\[|\]$/g,''),{all:true,verbatim:true}));
  if(!addresses?.length||addresses.some(a=>!isPublicAddress(a.address)))throw Error('File host is not allowed');
  const response=await bounded(fetchImpl(url.href,{redirect:'manual',signal,headers:{accept:'*/*'}}));
  if(response.status>=300&&response.status<400){
   if(hop>=MAX_REDIRECTS)throw Error('Too many redirects while downloading the file');
   const location=response.headers.get('location');
   if(!location)throw Error('File download redirect has no location');
   url=new URL(location,url);continue;
  }
  if(!response.ok)throw Error('File download failed ('+response.status+')');
  const declared=Number(response.headers.get('content-length'));
  if(Number.isFinite(declared)&&declared>maxBytes)throw Error('File is too large');
  const chunks=[];let length=0;
  if(response.body){
   const reader=response.body.getReader();
   while(true){
    const {done,value}=await bounded(reader.read());if(done)break;
    length+=value.byteLength;
    if(length>maxBytes){await reader.cancel();throw Error('File is too large');}
    chunks.push(value);
   }
  }
  return Buffer.concat(chunks.map(c=>Buffer.from(c)),length);
 }
}
