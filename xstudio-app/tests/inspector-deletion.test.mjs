import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from '../lib/xce/core.mjs';
import {deleteRecords} from '../lib/xce/library.mjs';
import {recordKey,queueAfterDelete} from '../lib/xce/inspector-queue.mjs';

function fixture(){const m=fresh();m.references=Object.fromEntries(['R1','R2','R3'].map(id=>[id,{id,name:id,role:'IDENTITY'}]));return m;}
function queue(m,index=0){return {records:Object.values(m.references).map(r=>({...r,category:'references'})),index,completed:new Set(),pending:true,project:'P'};}
function deleted(m,id,cascade=false){return deleteRecords(m,{items:[{entity:'reference',id}],confirm:true,cascade}).manifest;}

test('deleting a middle carousel photo selects the next live photo and keeps stable IDs',()=>{
 const m=fixture(),q=queue(m,1),before=structuredClone(q),next=queueAfterDelete(q,['reference:R2'],deleted(m,'R2'));
 assert.deepEqual(next.records.map(a=>a.id),['R1','R3']);assert.equal(next.records[next.index].id,'R3');assert.deepEqual(q,before);
});
test('deleting the final-position photo wraps to another remaining photo; last photo ends the queue',()=>{
 const m=fixture(),next=queueAfterDelete(queue(m,2),['reference:R3'],deleted(m,'R3'));
 assert.equal(next.records[next.index].id,'R1');
 delete m.references.R1;delete m.references.R2;
 const empty=queueAfterDelete(queue(m),['reference:R3'],deleted(m,'R3'));assert.equal(empty.index,-1);assert.deepEqual(empty.records,[]);
});
test('cascade deletion excludes removed linked anchors, while retaining unrelated cards',()=>{
 const m=fixture();m.manifest_store.characters.C={asset_id:'C',asset_type:'character',name:'C',status:'DRAFT',reference_ids:['R2']};
 const q=queue(m,1);q.records.splice(2,0,{...m.manifest_store.characters.C,category:'characters'});
 const current=deleted(m,'R2',true);assert.ok(current.trash['character:C']);
 const next=queueAfterDelete(q,['reference:R2'],current);assert.deepEqual(next.records.map(a=>a.id||a.asset_id),['R1','R3']);assert.equal(next.records[next.index].id,'R3');
});
test('pending carousel skips completed cards after delete and retains their completion status',()=>{
 const m=fixture(),q=queue(m);q.completed.add(recordKey(q.records[1]));
 const next=queueAfterDelete(q,['reference:R1'],deleted(m,'R1'));assert.equal(next.records[next.index].id,'R3');assert.ok(next.completed.has('reference:R2'));
 const final=queueAfterDelete(next,['reference:R3'],deleted(deleted(m,'R1'),'R3'));assert.equal(final.index,-1);
});
test('failed refresh still excludes confirmed deletions without discarding other queued cards',()=>{
 const q=queue(fixture(),1),next=queueAfterDelete(q,['reference:R2']);assert.equal(next.records[next.index].id,'R3');assert.equal(next.records.length,2);
});
