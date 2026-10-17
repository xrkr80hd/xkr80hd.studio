const SHELL='xstudio-shell-v1';
const cacheable=url=>url.origin===self.location.origin&&(url.pathname.startsWith('/_next/static/')||url.pathname==='/xce-icon.png');
async function prepare(){const cache=await caches.open(SHELL);const response=await fetch('/local',{cache:'reload'});if(!response.ok)throw Error('Offline shell unavailable');const html=await response.clone().text();await cache.put('/local',response);const urls=[...html.matchAll(/(?:src|href)="([^"<>]+)"/g)].map(match=>new URL(match[1].replaceAll('&amp;','&'),self.location.origin)).filter(cacheable);await Promise.allSettled(urls.map(url=>cache.add(url.href)));}
self.addEventListener('install',event=>event.waitUntil(prepare().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('message',event=>{if(event.data?.type!=='CACHE_STATIC'||!Array.isArray(event.data.urls))return;event.waitUntil(caches.open(SHELL).then(cache=>Promise.allSettled(event.data.urls.slice(0,150).map(value=>{try{const url=new URL(value,self.location.origin);if(cacheable(url))return cache.add(url.href)}catch{}}))));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'&&['/','/local'].includes(url.pathname)){
  event.respondWith(fetch(request).then(async response=>response.status>=500?(await caches.match('/local'))||response:response).catch(async()=>{const cached=await caches.match('/local');return cached||new Response('Reconnect once to prepare this device for offline work.',{status:503})}));return;
 }
 if(cacheable(url))event.respondWith(caches.open(SHELL).then(async cache=>{const existing=await cache.match(request);if(existing)return existing;const response=await fetch(request);if(response.ok)try{await cache.put(request,response.clone())}catch{}return response}));
});
