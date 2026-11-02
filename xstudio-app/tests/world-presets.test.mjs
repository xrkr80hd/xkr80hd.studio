import test from 'node:test';
import assert from 'node:assert/strict';
import {projectDirectionPrompt,powerTierPrompt,POWER_TIERS,PROJECT_TYPES,VISUAL_STYLES,BIOMES,projectMedium} from '../lib/xce/world-presets.mjs';
import {setPowerTier} from '../lib/xce/power-tier.mjs';
import {updateWorldBuilder} from '../lib/xce/world-builder-fields.mjs';
import {ASSET_FORM_SECTIONS} from '../lib/xce/asset-form-layout.mjs';
test('project style and type are set once and become prompt direction',()=>{
 const m={};updateWorldBuilder(m,{visual_style:'CIN',project_type:'commercial'});
 const text=projectDirectionPrompt(m);assert.match(text,/Cinematic Realistic/);assert.match(text,/SACRED/);assert.equal(projectMedium(m),'RL');
 assert.throws(()=>updateWorldBuilder(m,{project_type:'video_game'}),/listed project type/);
 updateWorldBuilder(m,{project_type:''});assert.doesNotMatch(projectDirectionPrompt(m),/PROJECT TYPE/);
});
test('on-screen power is stored per character and reads as AI video direction',()=>{
 let m=setPowerTier({},'FF6-CR-INTANGIR','enhanced_enemy','creature');
 assert.equal(m.asset_details['FF6-CR-INTANGIR'].power_tier,'enhanced_enemy');
 assert.match(powerTierPrompt(m,[{id:'FF6-CR-INTANGIR',name:'Intangir'}]),/Intangir .*serious on-screen threat/);
 assert.throws(()=>setPowerTier({},'P','elite_boss','prop'),/characters and creatures/);
 m=setPowerTier(m,'FF6-CR-INTANGIR','','creature');assert.equal(m.asset_details['FF6-CR-INTANGIR'].power_tier,undefined);
 assert.doesNotMatch(JSON.stringify(POWER_TIERS),/game|XP|loot|stat/i);
});
test('location form has no free-text landmark, architecture, scene-marker or style fields',()=>{
 const keys=ASSET_FORM_SECTIONS.location.flatMap(([,k])=>k);
 for(const k of ['landmarks','architecture','scene_markers','visual_style'])assert.ok(!keys.includes(k),k);
 for(const k of ['biome','lighting_preset','atmosphere','world_geography'])assert.ok(keys.includes(k),k);
 assert.ok(!JSON.stringify(ASSET_FORM_SECTIONS).includes('visual_style'));
 assert.ok(BIOMES.Realistic.includes('Car dealership lot')&&BIOMES.Fantasy.length>5);
 assert.equal(Object.keys(VISUAL_STYLES).length,3);assert.deepEqual(Object.keys(PROJECT_TYPES),['cinematic','commercial','comedy']);
});
import {fresh} from '../lib/xce/core.mjs';
import {lockNamespace} from '../lib/xce/namespace.mjs';
import {readPackage,applyRecords,PACKAGE_MANIFEST} from '../lib/xce/world-package.mjs';
import {worldRecords} from '../lib/xce/world-library.mjs';
test('a fin ZIP carries project setup, on-screen power and location presets into XSTUDIO',()=>{
 const enc=v=>new TextEncoder().encode(JSON.stringify(v));
 const pkg=readPackage({[PACKAGE_MANIFEST]:enc({format:'xce-world-package',schema_version:'1.0.0',package_id:'fin-2',generator:'xce_world_builder 2.8.0',world:{name:'Final Fantasy VI'},
  world_builder:{world_type:'Live-action fantasy.',visual_style:'CIN',project_type:'cinematic'},
  assets:[{package_id:'CR-01',category:'creatures',name:'Intangir',power_tier:'enhanced_enemy',details:{biome:'Grassland / prairie'},images:[]},
   {package_id:'LOC-01',category:'locations',name:'Figaro Castle',details:{biome:'Desert',atmosphere:'Dry heat shimmer'},presets:{lighting_preset:'Golden hour',world_geography:'Desert dunes'},images:[]}]})});
 const m=fresh();m.campaign_name='Final Fantasy VI';lockNamespace(m,'FF6');
 const {manifest,id_map}=applyRecords(m,pkg,{project_id:'final-fantasy-vi',revision:1});
 assert.equal(manifest.world_builder.visual_style,'CIN');assert.equal(manifest.world_builder.project_type,'cinematic');
 assert.equal(manifest.asset_details[id_map['CR-01']].power_tier,'enhanced_enemy');
 const castle=worldRecords(manifest).find(r=>r.id===id_map['LOC-01']);assert.equal(castle.metadata.lighting_preset,'Golden hour');assert.equal(castle.metadata.world_geography,'Desert dunes');
});
