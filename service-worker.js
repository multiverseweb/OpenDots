const CACHE_NAME = "opendots-cache-v1";
const ASSETS = [
    "/",
    "/index.html",
    "/manifest.json",
    "resrc/images/OpenDots.png"
];

// Install: cache app shell
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Caching app shell");
            return cache.addAll(ASSETS);
        })
    );
});

// Activate: cleanup old caches
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
});

// Fetch: network-first, fallback to cache
self.addEventListener("fetch", event => {
    event.respondWith(
        fetch(event.request)
            .then(res => {
                const resClone = res.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});
