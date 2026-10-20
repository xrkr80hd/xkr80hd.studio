import test from 'node:test';
import assert from 'node:assert/strict';
import {parseAssetCommand,canonical} from '../lib/xce/core.mjs';
import {CHARACTER_VIEWS,assertSheetReview} from '../lib/xce/sheet-contract.mjs';

test('current MCS request overrides stale vehicle context and compiles six character columns for all four modes',()=>{
 for(const cmd of ['mcsrlsmpl','mcscbsmpl','mcsrlcmplx','mcscbcmplx']){
  const parsed=parseAssetCommand(`${cmd} - personal - Leigh`,{asset_type:'vehicle',mode:'complex',medium:'CB'});
  assert.equal(parsed.asset_type,'character');assert.equal(parsed.target_deliverable,'character_turnaround');assert.equal(parsed.name,'Leigh');assert.deepEqual(parsed.render_contract.core_views,CHARACTER_VIEWS);
  const prompt=canonical({...parsed,immutable_traits:{}},{}).join('\n');assert.doesNotMatch(prompt,/TOP-DOWN|FRONT CABIN|REAR CABIN|nine core|PROFILE 2/);
  if(cmd.endsWith('smpl')){assert.match(prompt,/exactly SIX|exactly six/i);assert.equal(parsed.render_contract.rows,1);assert.equal(parsed.render_contract.total_panels,6);}
 }
 const vehicle=parseAssetCommand('mvsrlsmpl - Kia - K4 - LXS');assert.equal(vehicle.render_contract.core_view_count,9);assert.match(canonical({...vehicle,immutable_traits:{}},{}).join('\n'),/TOP-DOWN/);
});
test('mismatched stored character/vehicle deliverables cannot compile',()=>{
 for(const a of [{asset_type:'character',target_deliverable:'vehicle_turnaround'},{asset_type:'vehicle',target_deliverable:'character_turnaround'}])assert.throws(()=>canonical({...a,mode:'simple',medium:'RL',immutable_traits:{}},{}),/category mismatch/);
});
test('reject seven-body/two-face, stacked and wrong-style character sheets rather than passing a format boolean',()=>{
 const a={asset_type:'character',target_deliverable:'character_turnaround',mode:'simple',medium:'RL'};
 const layout={asset_type:'character',mode:'simple',medium:'RL',core_views:CHARACTER_VIEWS,total_panels:6,rows:1};assert.doesNotThrow(()=>assertSheetReview(a,layout));
 for(const bad of [{...layout,total_panels:9,rows:2},{...layout,rows:2},{...layout,medium:'CB'},{...layout,asset_type:'vehicle'},{...layout,core_views:['front_body','front_three_quarter','left_profile','rear','rear_three_quarter','right_profile','front_right_three_quarter','front_face','three_quarter_face']}])assert.throws(()=>assertSheetReview(a,bad),/sheet|MCS/i);
 assert.throws(()=>assertSheetReview(a),/inspected character sheet/);
});
