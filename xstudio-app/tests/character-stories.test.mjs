import test from 'node:test';
import assert from 'node:assert/strict';
import {saveCharacterStory} from '../lib/xce/character-stories.mjs';
import {presortedLibraryRows} from '../lib/xce/presorted-library.mjs';
import {resolveComposition,defaultComposition} from '../lib/xce/composer.mjs';
test('story changes preserve approved images, identities, codes, other stories and cast',()=>{
 const m={manifest_store:{characters:{A:{asset_id:'A',name:'A',status:'LOCKED',source_image_id:'R',reference_ids:['R'],asset_code:'TEST-CH-A',immutable_traits:{face_features:'locked'}}}},references:{R:{key:'image',role:'IDENTITY'}},character_cast_groups:{A:'main'},character_stories:{B:{text:'Existing story'}}};
 const before=structuredClone(m),next=saveCharacterStory(m,'A','  A patient explorer wants to return home.  ',[{id:'A',type:'characters'}]);
 assert.deepEqual(m,before);assert.deepEqual(next.manifest_store,m.manifest_store);assert.deepEqual(next.character_cast_groups,m.character_cast_groups);assert.equal(next.character_stories.B.text,'Existing story');assert.equal(next.character_stories.A.text,'A patient explorer wants to return home.');
 const config=defaultComposition();config.placements=[{asset_id:'A',x:50,y:50,plane:'foreground',action:'standing'}];const out=resolveComposition(next,'TEST',config);
 assert.equal(out.assets[0].narrative_context.character_story,next.character_stories.A.text);assert.equal(out.assets[0].narrative_context.authority,'USER_SAVED_NARRATIVE_ONLY');assert.equal(out.config.placements[0].action,'standing');
 assert.deepEqual(out.assets[0].locked_visual_properties,{face_features:'locked'});
});
test('stories reject foreign assets, beasts and oversized input; clearing is explicit',()=>{
 const rows=[{id:'A',type:'characters'},{id:'B',type:'characters'}],m={manifest_store:{creatures:{B:{}}}};
 assert.throws(()=>saveCharacterStory(m,'missing','Story',rows));assert.throws(()=>saveCharacterStory(m,'B','Story',rows));assert.throws(()=>saveCharacterStory(m,'A','x'.repeat(4001),rows));assert.equal(saveCharacterStory(m,'A','',rows).character_stories.A.text,'');
});
test('presorted uploads appear in their category without becoming approved anchors or repeating attached images',()=>{
 const m={references:{r:{id:'r',key:'one',name:'old.png',role:'DIAGNOSTIC',presort:{type:'location',display_name:'Island'}},a:{id:'a',key:'attached',presort:{type:'character'}},alias:{id:'alias',key:'attached',presort:{type:'character'}},lost:{id:'lost',key:'unknown',presort:{type:'lost'}},notes:{id:'notes',key:'notes',presort:{type:'notes'}}}};
 const before=structuredClone(m),rows=presortedLibraryRows(m,[{reference_ids:['a']}]);assert.equal(rows.length,1);assert.equal(rows[0].name,'Island');assert.equal(rows[0].type,'locations');assert.equal(rows[0].role,'DIAGNOSTIC');assert.equal(rows[0].sourceReference,true);assert.equal(rows[0].status,'DRAFT');assert.deepEqual(m,before);
});
