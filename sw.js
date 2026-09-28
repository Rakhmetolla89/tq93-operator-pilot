const CACHE='tq93-pwa-20260928f';
const APP_FILES=['./','index.html','manifest.webmanifest','favicon.svg','styles.css','journal.css','suggestions.css','notifications.css','safety-notice.css','well-management.css','diagram-management.css','app.js','passport-data.js','map-data.js','shift-journal-data.js','suggestions.js','notifications.js','safety-notice.js','well-management.js','diagram-management.js'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    const copy=response.clone();
    if(new URL(event.request.url).origin===self.location.origin)caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    return response;
  }).catch(()=>caches.match('index.html'))));
});
