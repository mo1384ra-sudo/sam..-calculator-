const CACHE_NAME = "sam-calculator-v3-20260930";
const LOCAL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json"
];
const REMOTE_ASSETS = [
  "https://i.ibb.co/RTx5Vrd9/1.jpg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_ASSETS))
      .then(() => Promise.allSettled(
        REMOTE_ASSETS.map(url => fetch(url, {mode:"no-cors"})
          .then(response => caches.open(CACHE_NAME).then(cache => cache.put(url, response)))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  event.respondWith(
    caches.match(request).then(cached => {
      if(cached) return cached;

      return fetch(request).then(response => {
        if(response && (response.status === 200 || response.type === "opaque")){
          const copy=response.clone();
          caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));
        }
        return response;
      }).catch(() => {
        if(request.mode === "navigate") return caches.match("./index.html");
        return new Response("",{status:504,statusText:"Offline"});
      });
    })
  );
});
