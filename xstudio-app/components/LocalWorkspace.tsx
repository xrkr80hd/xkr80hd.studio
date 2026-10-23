'use client';
import {useEffect,useState} from 'react';
import CinematicStudio from '../app/CinematicStudio';
export default function LocalWorkspace(){
 const [owner,setOwner]=useState<string|null>(null),[ready,setReady]=useState(false);
 useEffect(()=>{try{setOwner(localStorage.getItem('xstudio:device-owner'))}catch{}setReady(true)},[]);
 if(owner)return <CinematicStudio ownerId={owner}/>;
 return <main className="standalone-page"><h1>Local workspace</h1><p>{ready?'Sign in once while connected to prepare this device for offline work.':'Opening saved device workspace…'}</p><a className="button primary" href="/login">Sign in</a></main>;
}
