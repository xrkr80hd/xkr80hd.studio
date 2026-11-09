import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {unzipSync} from 'fflate';
import {fresh} from '../lib/xce/core.mjs';
import {lockNamespace} from '../lib/xce/namespace.mjs';
import {attachImage,referenceIdFor} from '../lib/xce/world-package.mjs';
import {manageShotList,shotListPackage} from '../lib/xce/shot-lists.mjs';
import {readDeliveryPackage,verifyChecksums,deliveryFingerprint,buildDeliveryShotList,isDeliveryZip,sha256Hex,DELIVERY_FORMAT} from '../lib/xce/delivery-package.mjs';

// Built by the XCE Studios v3.0 plugin's own packaging script (xce_package.py package).
const fixture=()=>unzipSync(new Uint8Array(readFileSync(new URL('./fixtures/xce-v3-delivery.zip',import.meta.url))));
function world(){const m=fresh();m.campaign_name='Fixture Noir';lockNamespace(m,'FXN');return m;}
async function importInto(m,files){
 const pkg=readDeliveryPackage(files,'xce-v3-delivery.zip'),refs={};
 for(const img of pkg.images){const id=referenceIdFor(m,'scenes_and_shots',img.shot_id+' '+img.role);Object.assign(m,attachImage(m,{reference_id:id,key:'k/'+id,name:id,mime_type:img.mime_type,size:img.byte_size,sha256:await sha256Hex(files[img.file]),category:'scenes_and_shots',asset_id:null}));refs[img.file]=id;}
 const data=buildDeliveryShotList(pkg,refs,{fingerprint:await deliveryFingerprint(pkg),now:'2026-11-09T00:00:00.000Z'});
 return {pkg,refs,result:manageShotList(m,{action:'save',id:'list-1',data:{...data,sequence_id:'list-1'}})};
}

test('reads the plugin delivery ZIP: shots, frame pairs, prompts, continuity', async()=>{
 const files=fixture();assert.ok(isDeliveryZip(Object.keys(files)));
 const pkg=readDeliveryPackage(files,'xce-v3-delivery.zip');
 assert.equal(pkg.project,'Fixture Noir');assert.equal(pkg.partial,false);assert.deepEqual(pkg.missing,[]);
 assert.deepEqual(pkg.shots.map(s=>s.shot_id),['SC01-SH01','SC01-SH02']);
 assert.equal(pkg.shots[1].duration_s,4);
 assert.equal(pkg.images.length,4);assert.deepEqual(pkg.images.map(i=>i.role),['FF','LF','FF','LF']);
 assert.match(pkg.shots[0].animation_prompt,/steps toward the right of the frame/);
 assert.equal(pkg.shots[0].continuity.look.director,'FINCHER');
 assert.ok(pkg.images.every(i=>/^[0-9a-f]{64}$/.test(i.sha256)));
 assert.deepEqual(await verifyChecksums(files,pkg),[]);
});

test('refuses a ZIP whose files were changed after packaging', async()=>{
 const files=fixture();files['SC01/SC01-SH01/animation_prompt.txt']=new TextEncoder().encode('edited');
 const pkg=readDeliveryPackage(files);
 assert.deepEqual(await verifyChecksums(files,pkg),['Checksum mismatch: SC01/SC01-SH01/animation_prompt.txt']);
 const img=fixture();img['SC01/SC01-SH02/last_frame.png']=new Uint8Array([1,2,3]);
 assert.deepEqual(await verifyChecksums(img,readDeliveryPackage(img)),['Checksum mismatch: SC01/SC01-SH02/last_frame.png']);
});

test('reports missing frames instead of padding the delivery', ()=>{
 const files=fixture();delete files['SC01/SC01-SH02/last_frame.png'];
 const pkg=readDeliveryPackage(files);
 assert.equal(pkg.partial,true);assert.deepEqual(pkg.missing,['SC01-SH02 last frame']);assert.equal(pkg.images.length,3);
});

test('rejects non-delivery ZIPs and bad manifests', ()=>{
 assert.equal(isDeliveryZip(['xce-world-package.json']),false);
 assert.throws(()=>readDeliveryPackage({'world.json':'{}'}),/not an XCE Studios v3 delivery ZIP/);
 assert.throws(()=>readDeliveryPackage({'delivery_manifest.json':'{'}),/not valid JSON/);
 assert.throws(()=>readDeliveryPackage({'delivery_manifest.json':JSON.stringify({shots:[],checksums:{}})}),/no shots/);
 const dup={shots:[{scene_id:'SC01',shot_id:'A'},{scene_id:'SC01',shot_id:'A'}],checksums:{}};
 assert.throws(()=>readDeliveryPackage({'delivery_manifest.json':JSON.stringify(dup)}),/appears twice/);
});

test('reads a delivery nested inside a top-level folder', ()=>{
 const files=Object.fromEntries(Object.entries(fixture()).map(([p,b])=>['xce-plugins/'+p,b]));
 const pkg=readDeliveryPackage(files);assert.equal(pkg.prefix,'xce-plugins/');assert.equal(pkg.images[0].file,'xce-plugins/SC01/SC01-SH01/first_frame.png');
});

test('server side reads the package from text files plus image sizes only', async()=>{
 const files=fixture(),texts={},info={};
 for(const [p,b] of Object.entries(files))if(/\.(json|txt)$/.test(p))texts[p]=new TextDecoder().decode(b);else if(p.endsWith('.png')&&!p.startsWith('grids/'))info[p]={mime_type:'image/png',byte_size:b.length};
 const pkg=readDeliveryPackage({...texts,...Object.fromEntries(Object.keys(info).map(p=>[p,'']))},'x.zip',{imageInfo:info});
 assert.equal(pkg.images.length,4);assert.deepEqual(await verifyChecksums({...texts},pkg,{skipImages:true}),[]);
 assert.equal(await deliveryFingerprint(pkg),await deliveryFingerprint(readDeliveryPackage(files)));
});

test('imports as a new unapproved shot list with first/last frames and v3 data', async()=>{
 const m=world(),{refs,result}=await importInto(m,fixture()),list=result.record;
 assert.equal(list.source.format,DELIVERY_FORMAT);assert.equal(list.generator,'Other');assert.equal(list.shots.length,2);
 const [a]=list.shots;
 assert.equal(a.approved,false);assert.equal(a.image_reference_id,refs['SC01/SC01-SH01/first_frame.png']);
 assert.equal(a.xce_v3.last_frame_reference_id,refs['SC01/SC01-SH01/last_frame.png']);
 assert.deepEqual(a.reference_ids,[a.xce_v3.last_frame_reference_id]);
 assert.match(a.prompt,/FF prompt for shot 1/);assert.match(a.xce_v3.last_frame_prompt,/LF prompt/);
 assert.equal(a.xce_v3.continuity.blocking.LF.MARA,'C-MG');assert.equal(a.panel.duration,6);assert.equal(a.scene_id,'SC01');
});

test('re-saving the list from the editor keeps the v3 data and source', async()=>{
 const m=world(),{result}=await importInto(m,fixture()),list=result.record;
 const resaved=manageShotList(m,{action:'save',id:'list-1',data:{name:'Renamed',folder:list.folder,generator:list.generator,shots:list.shots,mode:list.mode,sequence_id:list.sequence_id,source:list.source}}).record;
 assert.equal(resaved.name,'Renamed');assert.deepEqual(resaved.shots[1].xce_v3,list.shots[1].xce_v3);assert.deepEqual(resaved.source,list.source);
});

test('v3 data cannot point at images that are not saved, or carry bad checksums', async()=>{
 const m=world(),{result}=await importInto(m,fixture()),list=structuredClone(result.record);
 list.shots[0].xce_v3.last_frame_reference_id='NOT-SAVED';
 assert.throws(()=>manageShotList(m,{action:'save',id:'list-1',data:{...list}}),/not a saved image/);
 const bad=structuredClone(result.record);bad.shots[0].xce_v3.source_sha256.first_frame='nope';
 assert.throws(()=>manageShotList(m,{action:'save',id:'list-1',data:{...bad}}),/Invalid v3 checksum/);
 const src=structuredClone(result.record);src.source.format='OTHER';
 assert.throws(()=>manageShotList(m,{action:'save',id:'list-1',data:{...src}}),/Invalid delivery source/);
});

test('existing shot lists without v3 data are unchanged by validation', ()=>{
 const m=world();
 const plain={name:'Old',folder:'Shots',generator:'Kling',shots:[{id:'s1',title:'Shot 1',prompt:'p',character_ids:[],reference_ids:[],image_reference_id:'',approved:false,panel:{shotType:'WS',cameraMove:'STATIC',lens:'35mm',duration:3,action:'',dialogue:'',notes:'',templateKey:'WS'}}]};
 const rec=manageShotList(m,{action:'save',id:'old',data:plain}).record;
 assert.equal(rec.shots[0].xce_v3,undefined);assert.equal(rec.source,undefined);
});

test('imported shots need approval before the legacy export will package them', async()=>{
 const m=world(),{result}=await importInto(m,fixture());
 const pack=shotListPackage(result.record,m,'FXN');
 assert.ok(pack.missing.some(x=>/not approved/.test(x)));
});
