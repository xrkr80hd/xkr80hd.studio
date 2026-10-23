'use client';
import {useEffect,useRef,type PointerEvent} from 'react';

/** Ignore the click following a hold; scrolling, movement and cancellation never select. */
export function useLongPress(onHold:(key:string)=>void,disabled=false){
 const callback=useRef(onHold);callback.current=onHold;
 const hold=useRef<{timer:ReturnType<typeof setTimeout>|null;x:number;y:number;key:string;fired:boolean}>({timer:null,x:0,y:0,key:'',fired:false});
 function cancel(){if(hold.current.timer)clearTimeout(hold.current.timer);hold.current.timer=null}
 function start(e:PointerEvent,key:string){cancel();hold.current={timer:null,x:e.clientX,y:e.clientY,key,fired:false};if(disabled||!e.isPrimary||e.button!==0)return;hold.current.timer=setTimeout(()=>{hold.current.timer=null;hold.current.fired=true;callback.current(key)},350)}
 function move(e:PointerEvent){if(Math.hypot(e.clientX-hold.current.x,e.clientY-hold.current.y)>10)cancel()}
 function consume(key:string){if(!hold.current.fired||hold.current.key!==key)return false;hold.current.fired=false;return true}
 function reset(){cancel();hold.current.fired=false}
 useEffect(()=>{window.addEventListener('scroll',cancel,true);window.addEventListener('blur',cancel);return()=>{cancel();window.removeEventListener('scroll',cancel,true);window.removeEventListener('blur',cancel)}},[]);
 useEffect(()=>{if(disabled)reset()},[disabled]);
 return {start,move,cancel,consume,reset};
}
