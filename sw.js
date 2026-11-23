/* The platform moved to /app/. This file only retires the old root service worker; it keeps every cache. */
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.registration.unregister())});
