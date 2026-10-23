import test from 'node:test';import assert from 'node:assert/strict';
import {advanceAssetQueue,recordKey} from '../lib/xce/inspector-queue.mjs';
for(const type of ['characters','props','vehicles','creatures','locations','wardrobe','rooms','scenes_and_shots'])test(type+' advances after save and retains the last viewer until explicit close',()=>{
 const records=['A','B','C'].map(id=>({id,type})),before=structuredClone(records),initial=new Set();
 const a=advanceAssetQueue(records,0,initial);assert.equal(a.index,1);assert.equal(a.finished,false);assert.equal(initial.size,0);
 const b=advanceAssetQueue(records,a.index,a.completed);assert.equal(b.index,2);
 const c=advanceAssetQueue(records,b.index,b.completed);assert.equal(c.index,2);assert.equal(c.finished,true);assert.equal(records[c.index].id,'C');assert.equal(c.completed.size,3);assert.deepEqual(records,before);
 assert.equal(advanceAssetQueue(records,2,c.completed).index,2);
});
test('saving a single asset keeps that asset open and completed',()=>{const record={id:'A',type:'props'},next=advanceAssetQueue([record],0);assert.equal(next.index,0);assert.equal(next.finished,true);assert.ok(next.completed.has(recordKey(record)));});
test('advance skips completed records and wraps to the remaining unsaved record',()=>{const records=['A','B','C'].map(id=>({id,type:'props'})),next=advanceAssetQueue(records,2,new Set([recordKey(records[0])]));assert.equal(next.index,1);assert.equal(next.finished,false);});
