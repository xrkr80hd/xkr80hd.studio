import test from 'node:test';
import assert from 'node:assert/strict';
import {STORY_TAGS,parseStoryImport,importStoryBlock} from '../lib/xce/story-import.mjs';
const block=(values={})=>Object.keys(STORY_TAGS).map(tag=>`[${tag}]\n${values[tag]||''}\n[/${tag}]`).join('\n\n');
test('six fields map exactly, preserving paragraphs and empty saved values after reload',()=>{
 const m={world_builder:{notes:'keep',firestarter_state:{entries:[]}},characters:{C:{name:'unchanged'}}};
 const values=Object.fromEntries(Object.keys(STORY_TAGS).slice(0,5).map(tag=>[tag,tag+'\n\nsecond line']));
 importStoryBlock(m,block(values));const reloaded=JSON.parse(JSON.stringify(m));
 for(const [tag,key] of Object.entries(STORY_TAGS))assert.equal(reloaded.world_builder[key],values[tag]||'keep');
 assert.deepEqual(reloaded.characters,m.characters);assert.deepEqual(reloaded.world_builder.firestarter_state,{entries:[]});
});
test('invalid imports are atomic',()=>{for(const bad of [block().replace('[/WORLD_TYPE]',''),block()+'\n[WORLD_TYPE]x[/WORLD_TYPE]',block().replace('[WORLD_TYPE]','[world_type]'),block().replace('[/WORLD_TYPE]','[STORY_SO_FAR][/STORY_SO_FAR][/WORLD_TYPE]'),block().replace('[WORLD_TYPE]','[WORLD_TYPE'),block({WORLD_TYPE:'x'.repeat(1001)}),block().replace('[STORY_SO_FAR]\n\n[/STORY_SO_FAR]','')]){const m={world_builder:{world_type:'original'}};assert.throws(()=>importStoryBlock(m,bad));assert.equal(m.world_builder.world_type,'original')}});
test('unknown well-formed sections warn; empty sections preserve all fields',()=>{const m={world_builder:{notes:'keep'}};const result=importStoryBlock(m,block()+'\n[EXTRA]ignore[/EXTRA]');assert.equal(result.warnings.length,1);assert.deepEqual(m,{world_builder:{notes:'keep'}});assert.deepEqual(parseStoryImport(block()).patch,{})});
test('only selected manifest changes',()=>{const a={world_builder:{notes:'A'}},b={world_builder:{notes:'B'}};importStoryBlock(a,block({WORLD_RULES_CONTINUITY:'new'}));assert.equal(a.world_builder.notes,'new');assert.equal(b.world_builder.notes,'B')});
