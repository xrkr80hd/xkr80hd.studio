import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/xce/core.mjs';
import {lockNamespace} from '../lib/xce/namespace.mjs';
import {worldRecords} from '../lib/xce/world-library.mjs';
import {characterLinks} from '../lib/xce/character-network.mjs';
import {readPackage,resolveWorld,uniqueWorldName,planImport,applyRecords,attachImage,referenceIdFor,assetNameFromFile,categoryForFolder,PACKAGE_MANIFEST} from '../lib/xce/world-package.mjs';

const png=new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,73,72,68,82]);
const enc=s=>new TextEncoder().encode(typeof s==='string'?s:JSON.stringify(s));
function world(name='Star Tropics'){const m=fresh();m.campaign_name=name;lockNamespace(m,'STRP');return m;}
const finPackage=(extra={})=>({
 [PACKAGE_MANIFEST]:enc({format:'xce-world-package',schema_version:'1.0.0',package_id:'fin-1',generator:'xce_world_builder 2.7.0',
  world:{name:'Star Tropics',project_id:null},
  world_builder:{world_type:'Original tropical sci-fi adventure.',aesthetic:'Sunlit 80s adventure, warm color.'},
  assets:[
   {package_id:'CH-01',category:'characters',name:'Mike Jones',details:{description:'Teen hero with a yo-yo.',personality:'Brave, stubborn.'},quick_details:'Yo-yo fighter',gender:'male',images:[{file:'images/characters/CH-01_mike_jones.png',approved:true}]},
   {package_id:'CH-02',category:'characters',name:'Zoda',details:{description:'Alien warlord.'},images:[]},
   {package_id:'VH-01',category:'vehicles',name:'Sub-C',images:[{file:'images/vehicles/VH-01_sub_c.png'}]}
  ],
  relationships:[{from:'CH-01',to:'CH-02',clause_type:'relationship',kind:'opposes',text:'Mike opposes Zoda.'}],
  unsorted_images:[{file:'images/unsorted/mood.png'}],
  production_file:'production/xce_production_file.json',...extra}),
 'images/characters/CH-01_mike_jones.png':png,'images/vehicles/VH-01_sub_c.png':png,'images/unsorted/mood.png':png,
 'production/xce_production_file.json':enc({PRODUCTION_ID:'P1',SHOTS:[]})
});

test('reads a fin package with assets, images, relationships and production file',()=>{
 const pkg=readPackage(finPackage(),'star_tropics_fin.zip');
 assert.equal(pkg.source,'fin');assert.equal(pkg.world_name,'Star Tropics');
 assert.equal(pkg.assets.length,3);assert.equal(pkg.images.length,3);assert.equal(pkg.relationships.length,1);
 assert.equal(pkg.images.find(i=>i.asset_key==='CH-01').mime_type,'image/png');
 assert.deepEqual(pkg.production_file,{PRODUCTION_ID:'P1',SHOTS:[]});
});

test('rejects files that are not images and reports missing images instead of failing',()=>{
 const files=finPackage();files['images/vehicles/VH-01_sub_c.png']=enc('not an image');delete files['images/unsorted/mood.png'];
 const pkg=readPackage(files);assert.equal(pkg.images.length,1);
 assert.ok(pkg.warnings.some(w=>w.includes('Not a PNG')));assert.ok(pkg.warnings.some(w=>w.includes('Missing image')));
});

test('sorts a plain folder ZIP with minimal organization',()=>{
 const pkg=readPackage({'My World/characters/Terra_front.png':png,'My World/characters/Terra_side.png':png,'My World/Props/sword_01.png':png,'My World/Locations/Narshe/street.png':png,'My World/random.png':png},'My_World.zip');
 assert.equal(pkg.source,'folders');
 const names=pkg.assets.map(a=>a.category+':'+a.name).sort();
 assert.deepEqual(names,['characters:Terra','locations:Narshe','props:sword']);
 assert.equal(pkg.images.filter(i=>!i.asset_key).length,1);
});

test('folder and file name helpers',()=>{
 assert.equal(categoryForFolder('Cast'),'characters');assert.equal(categoryForFolder('scenes'),'scenes_and_shots');assert.equal(categoryForFolder('misc'),null);
 assert.equal(assetNameFromFile('images/characters/STRP-CH-MIKE-v1_Mike_Jones_front_v2.png'),'Mike Jones');
 assert.equal(assetNameFromFile('CH-01_Terra_Branford_S3.png'),'Terra Branford');
 assert.equal(assetNameFromFile('CH-01_terra-branford_mcscbsmpl.png'),'terra-branford');
 assert.equal(assetNameFromFile('CH-02_Locke_mcsrlcmplx-s4_v2.png'),'Locke');
 assert.equal(assetNameFromFile('SC-03_Narshe_Gate_frame-04.png'),'Narshe Gate');
});

test('finds the right world: ID first, then exact name, else create',()=>{
 const projects=[{id:'strp',title:'Star Tropics'},{id:'ff6',title:'FF6 Redux'}];
 assert.equal(resolveWorld(projects,{project_id:'ff6',world_name:'Star Tropics'}).project_id,'ff6');
 assert.equal(resolveWorld(projects,{project_id:null,world_name:'star tropics'}).project_id,'strp');
 assert.equal(resolveWorld(projects,{project_id:null,world_name:'New Place'}).mode,'create');
 assert.equal(resolveWorld([{id:'a',title:'Same'},{id:'b',title:'Same'}],{world_name:'Same'}).mode,'ambiguous');
 assert.equal(resolveWorld(projects,{project_id:null,world_name:'FF6 Redux'},'strp').mismatch,true);
});

test('applies records into a new world without inventing approvals',()=>{
 const pkg=readPackage(finPackage());let n=0;
 const {manifest:m,id_map,report}=applyRecords(world(),pkg,{project_id:'strp',revision:1,newId:()=>'id-'+(++n)});
 assert.equal(report.created.length,3);assert.ok(report.world_fields.includes('World type'));
 assert.equal(m.world_builder.world_type,'Original tropical sci-fi adventure.');
 const mike=worldRecords(m).find(r=>r.id===id_map['CH-01']);assert.equal(mike.name,'Mike Jones');assert.equal(mike.status,'DRAFT');
 assert.equal(m.world_library.vehicles[id_map['VH-01']].name,'Sub-C');
 assert.equal(m.asset_details[id_map['CH-01']].metadata_profile.personality,'Brave, stubborn.');
 assert.equal(m.character_network.details[id_map['CH-01']].text,'Yo-yo fighter');
 assert.equal(characterLinks(m,id_map['CH-01']).filter(l=>l.target_id===id_map['CH-02']).length,1);
 assert.deepEqual(m.xce_world_packages['fin-1'].production_file,{PRODUCTION_ID:'P1',SHOTS:[]});
});

test('re-importing matches existing assets and keeps saved text unless the user picks the ZIP',()=>{
 const pkg=readPackage(finPackage());let n=0;
 const first=applyRecords(world(),pkg,{project_id:'strp',revision:1,newId:()=>'id-'+(++n)}).manifest;
 first.world_builder.aesthetic='My edited look.';
 const plan=planImport(first,pkg);
 assert.ok(plan.assets.every(a=>a.action==='update'));
 assert.equal(plan.world.find(w=>w.field==='aesthetic').action,'conflict');
 const kept=applyRecords(first,pkg,{project_id:'strp',revision:2});
 assert.equal(kept.manifest.world_builder.aesthetic,'My edited look.');assert.equal(kept.report.created.length,0);
 assert.ok(kept.report.kept.includes('Aesthetic & tone'));
 assert.equal(characterLinks(kept.manifest,kept.id_map['CH-01']).length,1,'relationship is not duplicated');
 const chosen=applyRecords(first,pkg,{project_id:'strp',revision:2,choices:{'world:aesthetic':'zip'}});
 assert.equal(chosen.manifest.world_builder.aesthetic,'Sunlit 80s adventure, warm color.');
});

test('attaches an image as a draft reference to its asset; unsorted images stay unassigned',()=>{
 const pkg=readPackage(finPackage());let n=0;
 const {manifest,id_map}=applyRecords(world(),pkg,{project_id:'strp',revision:1,newId:()=>'id-'+(++n)});
 const rid=referenceIdFor(manifest,'characters','Mike Jones');
 const m=attachImage(manifest,{reference_id:rid,key:'xce/u/strp/'+rid,name:'Mike Jones',mime_type:'image/png',size:16,sha256:'ab',category:'characters',asset_id:id_map['CH-01']});
 const mike=m.world_library.characters[id_map['CH-01']];
 assert.deepEqual(mike.reference_ids,[rid]);assert.equal(mike.thumbnail_reference_id,rid);assert.equal(mike.status,'DRAFT');
 assert.equal(m.references[rid].role,'IDENTITY');
 const free=referenceIdFor(m,null,'mood');const m2=attachImage(m,{reference_id:free,key:'xce/u/strp/'+free,name:'mood',mime_type:'image/png',size:16,sha256:'cd',category:null,asset_id:null});
 assert.equal(m2.references[free].role,'STYLE');
 assert.throws(()=>attachImage(m2,{reference_id:free,key:'k',name:'x',mime_type:'image/png',size:1,sha256:'x',category:null,asset_id:null}),/already exists/);
});

test('create a new world from a ZIP even when the name is taken',()=>{
 const projects=[{id:'strp',title:'Star Tropics'},{id:'strp2',title:'Star Tropics (2)'}];
 const pkg={project_id:'strp',world_name:'Star Tropics'};
 const w=resolveWorld(projects,pkg,'strp',{createNew:true});
 assert.equal(w.mode,'create');assert.equal(w.project_id,null);assert.equal(w.name,'Star Tropics (3)');
 assert.equal(resolveWorld(projects,pkg,null,{createNew:true,name:'Island Two'}).name,'Island Two');
 assert.equal(uniqueWorldName([],'  '),'Imported world');
});

test('a fin ZIP records whether it is for a new or existing world',()=>{
 const files=finPackage();const doc=JSON.parse(new TextDecoder().decode(files[PACKAGE_MANIFEST]));
 doc.world.mode='new';files[PACKAGE_MANIFEST]=enc(doc);assert.equal(readPackage(files).world_mode,'new');
 doc.world.mode='existing';files[PACKAGE_MANIFEST]=enc(doc);assert.equal(readPackage(files).world_mode,'existing');
 delete doc.world.mode;files[PACKAGE_MANIFEST]=enc(doc);assert.equal(readPackage(files).world_mode,null);
});
