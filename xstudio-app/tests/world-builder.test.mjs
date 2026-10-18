import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/xce/core.mjs';
import {compileWorld,worldContextHeader} from '../lib/xce/world-builder.mjs';
import {updateWorldBuilder} from '../lib/xce/world-builder-fields.mjs';
import {editProjectDetails} from '../lib/xce/project-summary.mjs';
import {chatHandoff} from '../lib/xce/chat-handoff.mjs';
import {projectBackup} from '../lib/xce/project-backup.mjs';
function fixture(){const m=fresh();m.campaign_name='Actual project';m.references={R:{id:'R',name:'Alpha and Beta_Truth and Discipline.png [Scenes]',role:'IDENTITY',key:'private/key'}};m.manifest_store.characters.C={asset_id:'C',name:'Alpha',status:'DRAFT',reference_ids:['R']};m.manifest_store.characters.B={asset_id:'B',name:'Beta',status:'DRAFT'};m.character_cast_groups={C:'main',B:'background'};return m}
test('editable story fields roundtrip and new worlds have no invented story or cast',()=>{const m=fresh();assert.deepEqual(compileWorld(m,'P').character_directory,[]);assert.equal(compileWorld(m,'P').world_bible.authored_story.story_so_far,'');updateWorldBuilder(m,{aesthetic:'  Warm urban noir  ',story_so_far:'Pasted story.',world_type:'Original world'});editProjectDetails(m,{world_builder:{production_brief:'My brief'}});assert.equal(compileWorld(m,'P').world_bible.authored_story.story_so_far,'Pasted story.');assert.equal(m.world_builder.aesthetic,'Warm urban noir');assert.equal(m.world_builder.production_brief,'My brief')});
test('all world edits validate before mutation and cannot set executable or private fields',()=>{const m=fixture(),before=JSON.stringify(m);for(const p of [{story_so_far:'x'.repeat(50001)},{story_so_far:3},{world_type:'valid',admin:true},[]])assert.throws(()=>updateWorldBuilder(m,p));assert.equal(JSON.stringify(m),before);assert.throws(()=>editProjectDetails(m,{name:'New',world_builder:{notes:3}}));assert.equal(m.campaign_name,'Actual project')});
test('title parsing never creates characters, traits or objectives from filenames',()=>{const m=fixture(),before=JSON.stringify(m),w=compileWorld(m,'P');assert.equal(w.character_directory.length,2);assert.equal(w.character_directory[0].saved_objective,'');assert.equal(w.character_directory[0].title_hints[0].status,'TITLE_HINT_NOT_CANON');assert.equal(w.world_bible.title_tags[0].title,'Alpha and Beta Truth and Discipline');assert.equal(JSON.stringify(m),before);assert.doesNotMatch(JSON.stringify(w),/private\/key/);assert.deepEqual(w,JSON.parse(JSON.stringify(w)))});
test('scene context scopes actors while preserving the authored story and saved background group',()=>{const m=fixture();updateWorldBuilder(m,{story_so_far:'Saved premise'});const w=compileWorld(m,'P'),header=worldContextHeader(w,['C']);assert.match(header,/Saved premise/);assert.match(header,/Only these selected scene actors/);const payload=JSON.parse(header.split('\n')[1]);assert.deepEqual(payload.character_directory.map(c=>c.id),['C']);assert.equal(w.character_directory.find(c=>c.character_id==='B').cast_tier,'Background Characters');assert.equal(w.chatgpt_bulk_execution_directives.target_plugins.length,6)});
test('copy and project records include world story without authorizing automatic generation',()=>{const m=fixture();updateWorldBuilder(m,{story_so_far:'Saved premise'});const h=chatHandoff({project:'Actual',project_id:'P',name:'Alpha',asset_code:'CODE',manifest:m});assert.match(h,/Saved premise/);assert.match(h,/wait for my next instruction/);const b=projectBackup(m,{project_id:'P',revision:1});assert.equal(b.world_builder.world_bible.authored_story.story_so_far,'Saved premise');assert.doesNotMatch(JSON.stringify(b),/private\/key/)});

test('legacy project JSON exports carry canonical identity without changing source records',()=>{
 const m=fixture();m.project_id='stale';m.active_project_code='ACT';const before=JSON.stringify(m);
 const exported=JSON.parse(JSON.stringify(projectBackup(m,{project_id:'legacy-P',revision:7})));
 assert.equal(exported.project_id,'legacy-P');assert.equal(exported.manifest.project_id,'legacy-P');
 assert.deepEqual(exported.project_metadata,exported.manifest.project_metadata);
 assert.equal(exported.project_metadata.project_name,'Actual project');assert.equal(exported.project_metadata.project_code,'ACT');
 assert.equal(JSON.stringify(m),before);assert.doesNotMatch(JSON.stringify(exported),/private\/key/);
});
