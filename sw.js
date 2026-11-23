// Offline cache for Arise. Bump VERSION when the app changes.
const VERSION = "arise-v7";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Same-origin files: network first (so updates arrive), cache when offline. Sync calls go straight to the network.
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (u.origin !== location.origin || e.request.method !== "GET") return;
  e.respondWith(fetch(e.request, { cache: "no-cache" }).then(r => {
    const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html"))));
});
// Reminders from the server (web push)
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data.json(); } catch { d = { title: "Arise", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "Arise", { body: d.body || "", tag: d.tag || "arise", icon: "icon-192.png", badge: "icon-192.png" }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => ws.length ? ws[0].focus() : clients.openWindow("./")));
});
