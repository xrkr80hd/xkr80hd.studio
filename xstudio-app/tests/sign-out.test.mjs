import test from 'node:test';
import assert from 'node:assert/strict';
import {signOutOfStudio} from '../lib/xce/sign-out.mjs';

function context(request){
 const stored=new Map([['xstudio:device-owner','owner'],['xstudio:owner:project:draft','unsynced draft']]);
 const destinations=[];
 return {stored,destinations,args:{request,storage:{removeItem:key=>stored.delete(key)},navigate:url=>destinations.push(url)}};
}
test('confirmed server logout removes automatic owner selection and keeps unsynced drafts',async()=>{
 const c=context(async(url,options)=>{assert.equal(url,'/api/auth/logout');assert.equal(options.method,'POST');assert.equal(options.credentials,'same-origin');return Response.json({ok:true})});
 await signOutOfStudio(c.args);
 assert.equal(c.stored.has('xstudio:device-owner'),false);
 assert.equal(c.stored.get('xstudio:owner:project:draft'),'unsynced draft');
 assert.deepEqual(c.destinations,['/login?manual=true']);
});
test('rejected, malformed and unconfirmed responses preserve the session indicator without redirecting',async()=>{
 for(const response of [Response.json({error:'Invalid origin.'},{status:403}),new Response('upstream unavailable',{status:502}),Response.json({ok:false}),Response.json({ok:true},{status:500})]){
  const c=context(async()=>response);await assert.rejects(signOutOfStudio(c.args));
  assert.equal(c.stored.get('xstudio:device-owner'),'owner');assert.deepEqual(c.destinations,[]);
 }
});
test('network failure does not claim a successful sign out',async()=>{
 const c=context(async()=>{throw Error('offline')});await assert.rejects(signOutOfStudio(c.args),/offline/);
 assert.equal(c.stored.get('xstudio:device-owner'),'owner');assert.deepEqual(c.destinations,[]);
});
test('a blocked device storage API does not prevent leaving a confirmed ended session',async()=>{
 const destinations=[];
 await signOutOfStudio({request:async()=>Response.json({ok:true}),storage:{removeItem(){throw Error('blocked')}},navigate:url=>destinations.push(url)});
 assert.deepEqual(destinations,['/login?manual=true']);
});
