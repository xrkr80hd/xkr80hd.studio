import test from 'node:test';
import assert from 'node:assert/strict';
import {attachDraggableDialog} from '../lib/ui/useDraggableDialog.ts';

class Target extends EventTarget{
 fire(type,details={}){const e=new Event(type,{cancelable:true});for(const [key,value]of Object.entries(details))Object.defineProperty(e,key,{value});this.dispatchEvent(e);return e;}
}
function fixture(desktop=true){
 const media=new Target();media.matches=desktop;
 const win=new Target();Object.assign(win,{innerWidth:1200,innerHeight:900,matchMedia:()=>media});
 const style={removeProperty(key){delete this[key]}};
 const dialog=new Target();Object.assign(dialog,{open:true,style,getBoundingClientRect:()=>({left:parseFloat(style.left??'300'),top:parseFloat(style.top??'200'),width:600,height:500}),setAttribute(){},removeAttribute(){}});
 const captures=new Set(),handle={closest:s=>s==='[data-dialog-drag-handle]'?handle:null,matches:s=>s==='[data-dialog-drag-handle]',setPointerCapture:id=>captures.add(id),hasPointerCapture:id=>captures.has(id),releasePointerCapture:id=>captures.delete(id)};
 const observer={disconnected:false};globalThis.window=win;globalThis.ResizeObserver=class{observe(){}disconnect(){observer.disconnected=true}};
 const dispose=attachDraggableDialog(dialog);
 const pointer={target:handle,pointerType:'mouse',button:0,isPrimary:true,pointerId:1,clientX:320,clientY:220};
 return {dialog,handle,win,media,dispose,pointer,observer,captures};
}
test('drag stays inside viewport and releasing the pointer ends movement',()=>{
 const f=fixture();try{
  f.dialog.fire('pointerdown',f.pointer);assert.ok(f.captures.has(1));
  f.dialog.fire('pointermove',{pointerId:1,clientX:4000,clientY:4000});assert.equal(f.dialog.style.left,'592px');assert.equal(f.dialog.style.top,'392px');
  f.dialog.fire('pointerup',{pointerId:1});assert.equal(f.captures.size,0);
  f.dialog.fire('pointermove',{pointerId:1,clientX:0,clientY:0});assert.equal(f.dialog.style.left,'592px');
  f.dialog.fire('close');assert.equal(f.dialog.style.left,undefined);
 }finally{f.dispose();}
});
test('controls, touch and narrow layouts do not start editor dragging',()=>{
 const f=fixture();try{
  const button={closest:s=>s==='[data-dialog-drag-handle]'?f.handle:button};
  f.dialog.fire('pointerdown',{...f.pointer,target:button});
  f.dialog.fire('pointermove',{pointerId:1,clientX:500,clientY:500});assert.equal(f.dialog.style.left,undefined);
  f.dialog.fire('pointerdown',{...f.pointer,pointerType:'touch'});assert.equal(f.captures.size,0);
  f.media.matches=false;f.dialog.fire('pointerdown',f.pointer);assert.equal(f.captures.size,0);
 }finally{f.dispose();}
});
test('keyboard movement, viewport changes, recentering and cleanup retain a reachable editor',()=>{
 const f=fixture();try{
  const event=f.dialog.fire('keydown',{target:f.handle,key:'ArrowRight'});assert.equal(event.defaultPrevented,true);assert.equal(f.dialog.style.left,'310px');
  f.win.innerWidth=850;f.win.fire('resize');assert.equal(f.dialog.style.left,'242px');
  f.dialog.fire('keydown',{target:f.handle,key:'Home'});assert.equal(f.dialog.style.left,undefined);
  f.dialog.fire('keydown',{target:f.handle,key:'ArrowLeft',shiftKey:true});assert.equal(f.dialog.style.left,'242px');
  f.media.matches=false;f.media.fire('change');assert.equal(f.dialog.style.left,undefined);
 }finally{f.dispose();}
 assert.equal(f.observer.disconnected,true);f.media.matches=true;f.dialog.fire('pointerdown',f.pointer);assert.equal(f.captures.size,0);
});
