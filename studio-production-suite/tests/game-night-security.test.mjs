import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {signGameSession,verifyGameSession,readGameSession,gameCredentialVersion} from '../lib/game-night-session.mjs';
const secret='test-secret-that-is-not-a-production-credential';
test('sessions reject expiry, tampering, missing secrets and extra signature fields',()=>{
 const cookie=signGameSession('alice',secret,1000);
 assert.equal(verifyGameSession(cookie,secret,2000),'alice');
 assert.equal(verifyGameSession(cookie,secret,1000+7*86400000),null);
 assert.equal(verifyGameSession(cookie+'x',secret,2000),null);
 assert.equal(verifyGameSession(cookie+'.extra',secret,2000),null);
 assert.equal(verifyGameSession(cookie,'',2000),null);
 assert.equal(verifyGameSession(cookie,'other',2000),null);
});
test('password reset changes credential binding without exposing password hash',()=>{
 const tag=gameCredentialVersion('old-password-hash',secret);
 const session=readGameSession(signGameSession('alice',secret,1000,tag),secret,2000);
 assert.equal(session.credentialVersion,tag);
 assert.notEqual(session.credentialVersion,gameCredentialVersion('new-password-hash',secret));
 assert.ok(!JSON.stringify(session).includes('old-password-hash'));
});
const source=readFileSync(new URL('../lib/game-night-server.js',import.meta.url),'utf8');
const context=vm.createContext({});
vm.runInContext(source.slice(source.indexOf('export async function refreshGameMedia')).replace('export async','async')+'\nthis.refresh=refreshGameMedia',context);
test('private media refresh signs only own paths and updates every shared reference',async()=>{
 const calls=[];const db={storage:{from(bucket){assert.equal(bucket,'game-night-media');return {async createSignedUrls(paths,expiry){calls.push({paths,expiry});return {data:paths.map(path=>({path,signedUrl:'https://signed.example/'+path}))};}};}}};
 const snapshot={games:[{media:{storagePath:'alice/uuid.jpg',data:'expired'}}],catalog:[{media:{storagePath:'alice/uuid.jpg',data:'expired'}}]};
 await context.refresh(snapshot,'alice',db);
 assert.equal(calls.length,1);assert.equal(calls[0].paths.length,1);assert.equal(calls[0].expiry,86400);
 assert.equal(snapshot.catalog[0].media.data,snapshot.games[0].media.data);
 await assert.rejects(context.refresh({media:{storagePath:'bob/private.jpg'}},'alice',db),/Invalid media owner/);
 await assert.rejects(context.refresh({media:{storagePath:'alice/../bob/private.jpg'}},'alice',db),/Invalid media owner/);
 assert.equal(calls.length,1);
});
