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
