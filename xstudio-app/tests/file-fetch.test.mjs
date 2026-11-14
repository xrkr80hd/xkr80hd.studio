import test from 'node:test';
import assert from 'node:assert/strict';
import {fetchFile,isPublicAddress,ZIP_MAX_BYTES} from '../lib/mcp/file-fetch.mjs';

const file={download_url:'https://files.example.test/a',file_id:'file_1'};
const publicLookup=async()=>[{address:'93.184.216.34',family:4}];
const body=bytes=>new Response(bytes,{status:200});

test('requires download_url and file_id',async()=>{
 await assert.rejects(fetchFile({file_id:'f'},{maxBytes:10,lookup:publicLookup}),/file/);
 await assert.rejects(fetchFile({download_url:'https://x.test/a'},{maxBytes:10,lookup:publicLookup}),/file/);
 await assert.rejects(fetchFile(null,{maxBytes:10,lookup:publicLookup}),/file/);
});

test('rejects non-https',async()=>{
 await assert.rejects(fetchFile({download_url:'http://x.test/a',file_id:'f'},{maxBytes:10,lookup:publicLookup,fetchImpl:async()=>body('x')}),/https/);
});

test('rejects private, loopback and link-local addresses',async()=>{
 for(const address of ['127.0.0.1','10.0.0.5','169.254.169.254','192.168.1.1','172.16.4.4','100.64.0.1','0.0.0.0','::1','fd00::1','fe80::1','::ffff:10.0.0.1']){
  let fetched=false;
  await assert.rejects(fetchFile(file,{maxBytes:10,lookup:async()=>[{address,family:address.includes(':')?6:4}],fetchImpl:async()=>{fetched=true;return body('x');}}),/not allowed/,address);
  assert.equal(fetched,false,address+' must be refused before any request');
 }
 assert.equal(isPublicAddress('8.8.8.8'),true);
 assert.equal(isPublicAddress('2606:4700:4700::1111'),true);
});

test('re-checks every redirect hop and caps redirects',async()=>{
 const lookup=async host=>host==='internal.test'?[{address:'10.0.0.1',family:4}]:[{address:'93.184.216.34',family:4}];
 const redirectTo=location=>async()=>new Response(null,{status:302,headers:{location}});
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup,fetchImpl:redirectTo('https://internal.test/x')}),/not allowed/);
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup,fetchImpl:redirectTo('http://files.example.test/x')}),/https/);
 let hops=0;
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup,fetchImpl:async()=>{hops++;return new Response(null,{status:302,headers:{location:'https://files.example.test/n'+hops}});}}),/redirects/);
 assert.equal(hops,4);
});

test('enforces the byte cap while streaming',async()=>{
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup:publicLookup,fetchImpl:async()=>body(new Uint8Array(11))}),/too large/);
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup:publicLookup,fetchImpl:async()=>new Response(new Uint8Array(5),{headers:{'content-length':'999'}})}),/too large/);
});

test('rejects failed downloads',async()=>{
 await assert.rejects(fetchFile(file,{maxBytes:10,lookup:publicLookup,fetchImpl:async()=>new Response('no',{status:404})}),/404/);
});

test('returns the bytes and sends no credentials',async()=>{
 let seen;
 const out=await fetchFile(file,{maxBytes:10,lookup:publicLookup,fetchImpl:async(url,init)=>{seen={url,init};return body(new Uint8Array([1,2,3]));}});
 assert.deepEqual([...out],[1,2,3]);
 assert.equal(seen.url,file.download_url);
 assert.equal(seen.init.redirect,'manual');
 const headers=new Headers(seen.init.headers);
 assert.equal(headers.has('authorization'),false);
 assert.equal(headers.has('cookie'),false);
 assert.equal(ZIP_MAX_BYTES,41_943_040);
});
