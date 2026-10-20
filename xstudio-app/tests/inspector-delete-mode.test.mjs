import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {recordKey} from '../lib/xce/inspector-queue.mjs';

// Exercise the real transition with UI setters; no server writes are allowed here.
const source=readFileSync(new URL('../app/CinematicStudio.tsx',import.meta.url),'utf8');
const ast=ts.createSourceFile('CinematicStudio.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
let handler;
function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text==='showQueueItem')handler=node.getText(ast);ts.forEachChild(node,visit)}
visit(ast);
assert.ok(handler);
const js=ts.transpileModule(handler,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
function harness(mode={modal:'detail',editing:false},reference=false){
 const a=reference?{id:'R2',category:'references'}:{asset_id:'C2',asset_type:'character',name:'Next character'};
 const calls=[],state={};
 const context={busy:true,inspectorQueue:{current:{records:[a],index:0}},inspectorDrafts:{current:new Map([[recordKey(a),{editAction:'create',selected:{id:'unrelated'}}]])},detailParent:{current:{}},deleteInspectorMode:{current:mode},recordKey,entityOf:a=>a.asset_type||'reference',rememberInspectorDraft:()=>{throw Error('Must not copy deleted draft onto successor')},editRecord:a=>calls.push(['edit',a]),createFromReference:()=>{throw Error('Must not create a record')},setQueueVersion:f=>{state.version=f(0)}};
 for(const key of ['EditingAsset','EditError','UploadContext','Selected','StagedFiles','Modal','EditEntity','EditAction','EditData','EditId','TargetProject','TargetId'])context['set'+key]=value=>{state[key]=value};
 vm.createContext(context);vm.runInContext(js,context);context.showQueueItem(0,true);
 return {a,state,calls};
}
test('deletion returns the successor to the same detail card without restoring a create draft',()=>{
 const {a,state,calls}=harness();assert.equal(state.Modal,'detail');assert.equal(state.Selected,a);assert.equal(state.EditingAsset,'');assert.deepEqual(calls,[]);assert.equal(state.EditAction,undefined);assert.equal(state.version,1);
});
test('inline edit mode follows the successor ID instead of retaining the deleted ID',()=>{
 const {state,calls}=harness({modal:'detail',editing:true});assert.equal(state.Modal,'detail');assert.equal(state.EditingAsset,'C2');assert.deepEqual(calls,[]);
});
test('an existing full editor remains an update editor on the next saved asset',()=>{
 const {a,calls}=harness({modal:'manage',editing:false});assert.deepEqual(calls,[['edit',a]]);
});
test('a reference successor never opens intake or creates a record after deletion',()=>{
 const {state,calls}=harness({modal:'manage',editing:false},true);assert.equal(state.Modal,'detail');assert.deepEqual(calls,[]);
});
