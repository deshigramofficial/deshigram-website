/* DeshiGram: fresh pages and scripts; only static media may be cached. */
const CACHE='deshigram-media-v20261015';
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys()){if(key!==CACHE)await caches.delete(key)}await self.clients.claim()})()));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;const media=/\.(?:png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);if(!media){event.respondWith(fetch(request));return}event.respondWith(caches.open(CACHE).then(async cache=>{const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok)cache.put(request,response.clone()).catch(()=>{});return response}))});
