// Service worker: guarda la aplicación en el celular para que abra rápido y funcione sin internet.
// Los datos NO pasan por aquí: se sincronizan con OneDrive desde la aplicación.
const CACHE = "mis-inmuebles-v1";
const ARCHIVOS = [
  "./", "./index.html", "./config.js", "./manifest.webmanifest",
  "./lib/msal-browser.min.js", "./lib/xlsx.full.min.js",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Solo atiende archivos propios de la app. Microsoft (login y OneDrive) va directo a internet.
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  // Primero internet (para recibir actualizaciones), si no hay conexión usa la copia guardada.
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
