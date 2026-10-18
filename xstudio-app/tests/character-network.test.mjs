import test from 'node:test';import assert from 'node:assert/strict';
import {saveCharacterDetails,characterLinks,characterContext,characterContextPrompt} from '../lib/xce/character-network.mjs';
import {assignCastGroup} from '../lib/xce/cast-groups.mjs';
import {bindProjectPrompt} from '../lib/xce/world-library.mjs';
const chars=['Biggs','Wedge','Edgar','Sabin','Kefka'].map(id=>({id,name:id,type:'characters'}));
const save=(m,id,links=[],text='')=>saveCharacterDetails(m,id,{quick_details:text,links},chars);
test('rules are project-wide, reversible and active only for characters together',()=>{
 const base={manifest_store:{characters:{Wedge:{status:'LOCKED',reference_ids:['R']}}},references:{R:{key:'actual'}},character_stories:{Wedge:{text:'A soldier'}}};const before=structuredClone(base);
 let m=save(base,'Wedge',[{kind:'shorter_than',target_id:'Biggs'}],'Always shorter than Biggs.');
 m=save(m,'Edgar',[{kind:'equal_height',target_id:'Sabin'}]);m=save(m,'Kefka',[{kind:'opposes',target_id:'Edgar'}]);m=assignCastGroup(m,'Kefka','villain',chars);
 assert.deepEqual(base,before);assert.deepEqual(m.manifest_store,base.manifest_store);assert.deepEqual(m.references,base.references);
 assert.deepEqual(characterLinks(m,'Biggs'),[{kind:'taller_than',target_id:'Wedge'}]);assert.deepEqual(characterLinks(m,'Sabin'),[{kind:'equal_height',target_id:'Edgar'}]);
 assert.equal(characterContext(m,['Wedge'],chars).relationships.length,0);
 const c=characterContext(m,['Biggs','Wedge','Sabin','Edgar','Kefka'],chars),prompt=characterContextPrompt(c);
 assert.match(prompt,/Biggs \[Biggs\] is taller than Wedge/);assert.match(prompt,/Edgar \[Edgar\] is the same height as Sabin/);assert.match(prompt,/are in contention/);assert.match(prompt,/do not invent a fight/);assert.equal(c.details.find(a=>a.asset_id==='Kefka').cast_group,'villain');
 assert.deepEqual(characterContext(JSON.parse(JSON.stringify(m)),['Edgar','Sabin'],chars).relationships,characterContext(m,['Edgar','Sabin'],chars).relationships);
});
test('network infers height through shared links and rejects conflicting equality and height cycles',()=>{
 let m=save({},'Edgar',[{kind:'equal_height',target_id:'Sabin'}]);m=save(m,'Biggs',[{kind:'shorter_than',target_id:'Sabin'}]);
 assert.deepEqual(characterContext(m,['Biggs','Edgar'],chars).relationships,[{subject_id:'Biggs',kind:'shorter_than',object_id:'Edgar'}]);
 assert.throws(()=>save(m,'Edgar',[{kind:'equal_height',target_id:'Sabin'},{kind:'shorter_than',target_id:'Biggs'}]),/cycle/);
 assert.throws(()=>save({},'Edgar',[{kind:'equal_height',target_id:'Sabin'},{kind:'shorter_than',target_id:'Sabin'}]),/Conflicting/);
 assert.throws(()=>save({},'Biggs',[{kind:'opposes',target_id:'FOREIGN'}]),/project/);assert.throws(()=>save({},'Biggs',[{kind:'equal_height',target_id:'Biggs'}]),/different/);
});
test('editing the inverse rule updates one relationship without changing unrelated links',()=>{
 let m=save({},'Edgar',[{kind:'equal_height',target_id:'Sabin'}]);m=save(m,'Wedge',[{kind:'shorter_than',target_id:'Biggs'}]);m=save(m,'Sabin',[{kind:'equal_height',target_id:'Edgar'}]);assert.equal(m.character_network.relationships.length,2);
 m=save(m,'Biggs',[]);assert.equal(characterLinks(m,'Wedge').length,0);assert.equal(characterLinks(m,'Sabin').length,1);
});
test('bound project prompts share character continuity without adding absent characters',()=>{
 const character=(id)=>({asset_id:id,name:id,status:'LOCKED',source_image_id:'R',reference_ids:['R']});let m={manifest_store:{characters:{Edgar:character('Edgar'),Sabin:character('Sabin')}},references:{R:{key:'private',role:'IDENTITY'}}};m=save(m,'Edgar',[{kind:'equal_height',target_id:'Sabin'}]);
 const paired=bindProjectPrompt(m,'FF6','@[Edgar] beside @[Sabin]');assert.equal(paired.character_continuity.relationships.length,1);assert.match(paired.prompt,/same height/);assert.equal(bindProjectPrompt(m,'FF6','@[Edgar]').character_continuity.relationships.length,0);
});

test('arbitrary user-written rules remain exact and follow either character, with no seeded canon',()=>{
 const blank=characterContext({},chars.map(c=>c.id),chars);assert.equal(blank.relationships.length,0);assert.ok(blank.details.every(c=>c.quick_details===''));
 const rule='They exchange a private signal before crossing the bridge.';const m=save({},'Biggs',[{kind:'custom',target_id:'Wedge',text:rule}]);
 assert.equal(characterLinks(m,'Wedge')[0].text,rule);const paired=characterContext(m,['Wedge','Biggs'],chars);assert.equal(paired.relationships[0].text,rule);assert.ok(characterContextPrompt(paired).includes(rule));assert.equal(characterContext(m,['Biggs'],chars).relationships.length,0);
 assert.throws(()=>save({},'Biggs',[{kind:'custom',target_id:'Wedge',text:''}]),/Write your/);
});

test('only checked user-controlled relationship or synergy clauses enter a composition',()=>{
 const rule={kind:'custom',target_id:'Wedge',text:'Coordinate a distraction.',clause_type:'synergy',enabled:false};let m=save({},'Biggs',[rule]);assert.equal(characterContext(m,['Biggs','Wedge'],chars).relationships.length,0);assert.equal(characterLinks(m,'Wedge')[0].enabled,false);
 m=save(m,'Biggs',[{...rule,enabled:true}]);const context=characterContext(m,['Biggs','Wedge'],chars);assert.equal(context.relationships[0].clause_type,'synergy');assert.match(characterContextPrompt(context),/SYNERGY CLAUSE/);assert.equal(characterContext(m,['Biggs'],chars).relationships.length,0);
});
