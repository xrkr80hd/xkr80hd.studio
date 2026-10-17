'use client';
import {useEffect,useRef,useState} from 'react';
import {previewCacheName,readLocalImage} from '../lib/xce/local-store.mjs';
import {studioFetch} from '../lib/xce/studio-network.mjs';

export default function PreviewImage({src,alt='',thumbnail=false,...props}:React.ImgHTMLAttributes<HTMLImageElement>&{thumbnail?:boolean}){
 const [url,setUrl]=useState(''),[failed,setFailed]=useState(false),[visible,setVisible]=useState(false);const element=useRef<HTMLSpanElement>(null);
 useEffect(()=>{const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect()}},{rootMargin:'250px'});if(element.current)observer.observe(element.current);return()=>observer.disconnect()},[]);
 useEffect(()=>{
  if(!visible||typeof src!=='string')return;let active=true,object='';setFailed(false);setUrl('');const controller=new AbortController();
  async function load(){try{
   if(!(src as string).startsWith('/api/')){setUrl(src as string);return;}
   const address=new URL(src as string,location.origin),id=address.searchParams.get('file'),project=address.searchParams.get('project');
   if(thumbnail&&project&&id?.startsWith('local-')){const local=await readLocalImage(project,id);if(local){if(active)setUrl(local.thumbnail||local.data);return;}}
   const cacheKey=(src as string)+(thumbnail?'&preview=1':'');let cache:Cache|null=null;
   try{cache=typeof caches!=='undefined'?await caches.open(previewCacheName()):null;}catch{}
   let response:Response|undefined,denied=false;
   try{
    response=await studioFetch(src,{signal:controller.signal});
    denied=[401,403,423,404].includes(response.status);
    if(denied){try{await cache?.delete(cacheKey)}catch{}throw Error('unavailable');}
    if(!response.ok)throw Error('unavailable');
   }catch(error){if(controller.signal.aborted||denied)throw error;response=await cache?.match(cacheKey);if(!response)throw error;}
   if(!response)throw Error('Preview unavailable');let blob=await response.blob();
   if(thumbnail)try{const bitmap=await createImageBitmap(blob);const ratio=Math.min(1,480/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();blob=await new Promise<Blob>(resolve=>canvas.toBlob(value=>resolve(value||blob),'image/webp',0.82));}catch{}
   if(response.headers.get('X-Xstudio-Offline')!=='disabled'&&cache)try{const keys=[...await cache.keys()];while(keys.length>=120)await cache.delete(keys.shift()!);await cache.put(cacheKey,new Response(blob));}catch{}
   object=URL.createObjectURL(blob);if(active)setUrl(object);
  }catch{if(active)setFailed(true)}}void load();return()=>{active=false;controller.abort();if(object)URL.revokeObjectURL(object)};
 },[src,visible,thumbnail]);
 return <span ref={element} className="preview-frame">{url&&!failed?<img {...props} src={url} alt={alt} onError={()=>setFailed(true)} loading="lazy" decoding="async"/>:<span className="preview-placeholder" role="img" aria-label={alt||'Preview unavailable'}>{failed?'Preview unavailable':'Preview'}</span>}</span>;
}
