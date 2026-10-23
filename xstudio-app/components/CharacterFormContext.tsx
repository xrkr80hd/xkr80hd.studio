'use client';
import {createContext,useContext,useEffect,useRef} from 'react';
import {studioFetch} from '../lib/xce/studio-network.mjs';
export const CharacterFormContext=createContext<any>(null);
export function useCharacterRequest(){return useContext(CharacterFormContext)?.request||studioFetch;}
export function useCharacterSection(key:string,read:()=>any){
 const context=useContext(CharacterFormContext),current=useRef(read);current.current=read;
 useEffect(()=>{if(!context)return;context.sections.set(key,()=>current.current());return()=>{context.sections.delete(key)}},[context,key]);return !!context;
}
