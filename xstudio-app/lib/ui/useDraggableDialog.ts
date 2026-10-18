'use client';
import {useEffect,type RefObject} from 'react';

// Native dialogs keep their focus trap and Escape behavior while being repositioned.
export function useDraggableDialog(ref:RefObject<HTMLDialogElement|null>){
 useEffect(()=>{const dialog=ref.current;if(dialog)return attachDraggableDialog(dialog)},[ref]);
}

export function attachDraggableDialog(dialog:HTMLDialogElement){
  const desktop=window.matchMedia('(min-width: 801px) and (pointer: fine)');
  let drag:{id:number,x:number,y:number,left:number,top:number,handle:HTMLElement}|null=null;
  let moved=false;
  function position(left:number,top:number){
   const box=dialog.getBoundingClientRect();
   Object.assign(dialog.style,{position:'fixed',margin:'0',right:'auto',bottom:'auto',left:Math.round(Math.max(8,Math.min(left,window.innerWidth-box.width-8)))+'px',top:Math.round(Math.max(8,Math.min(top,window.innerHeight-box.height-8)))+'px'});
   moved=true;
  }
  function end(){if(drag?.handle.hasPointerCapture(drag.id))drag.handle.releasePointerCapture(drag.id);drag=null;dialog.removeAttribute('data-dragging');}
  function reset(){end();for(const key of ['position','margin','right','bottom','left','top'])dialog.style.removeProperty(key);moved=false;}
  function down(e:PointerEvent){
   if(!desktop.matches||e.pointerType!=='mouse'||e.button!==0||!e.isPrimary)return;
   const target=e.target as HTMLElement,handle=target.closest<HTMLElement>('[data-dialog-drag-handle]');
   if(!handle||target.closest('button,input,select,textarea,label,a,summary,[contenteditable=true]'))return;
   const box=dialog.getBoundingClientRect();e.preventDefault();
   handle.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,left:box.left,top:box.top,handle};dialog.setAttribute('data-dragging','');
  }
  function move(e:PointerEvent){if(drag&&e.pointerId===drag.id){e.preventDefault();position(drag.left+e.clientX-drag.x,drag.top+e.clientY-drag.y);}}
  function key(e:KeyboardEvent){
   if(!desktop.matches||!(e.target as HTMLElement).matches('[data-dialog-drag-handle]'))return;
   const delta:{[key:string]:[number,number]}={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};
   if(e.key!=='Home'&&!delta[e.key])return;e.preventDefault();e.stopPropagation();
   if(e.key==='Home'){reset();return;}const box=dialog.getBoundingClientRect(),step=e.shiftKey?50:10;position(box.left+delta[e.key][0]*step,box.top+delta[e.key][1]*step);
  }
  function resize(){if(!desktop.matches){reset();return;}if(moved&&dialog.open){const box=dialog.getBoundingClientRect();position(box.left,box.top);}}
  dialog.addEventListener('pointerdown',down);dialog.addEventListener('pointermove',move);dialog.addEventListener('pointerup',end);dialog.addEventListener('pointercancel',end);dialog.addEventListener('lostpointercapture',end);dialog.addEventListener('keydown',key);dialog.addEventListener('close',reset);
  window.addEventListener('resize',resize);desktop.addEventListener('change',resize);
  const observer=new ResizeObserver(resize);observer.observe(dialog);
  return()=>{reset();observer.disconnect();window.removeEventListener('resize',resize);desktop.removeEventListener('change',resize);dialog.removeEventListener('pointerdown',down);dialog.removeEventListener('pointermove',move);dialog.removeEventListener('pointerup',end);dialog.removeEventListener('pointercancel',end);dialog.removeEventListener('lostpointercapture',end);dialog.removeEventListener('keydown',key);dialog.removeEventListener('close',reset);};
}
