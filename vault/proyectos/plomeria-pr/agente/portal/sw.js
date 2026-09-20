/* Service worker de la app de proveedores de Resuelto: recibe la push y abre la oferta al tocarla. */
self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { titulo: "Resuelto", cuerpo: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Resuelto", {
    body: d.cuerpo || "",
    icon: "/icon-192.png", badge: "/icon-192.png",
    tag: d.tag || d.ofertaId || "resuelto", renotify: true,
    vibrate: d.urgente ? [200, 100, 200, 100, 400] : [150, 80, 150],
    requireInteraction: !!d.urgente,
    data: { url: d.url || "/proveedores" },
    actions: d.ofertaId ? [{ action: "abrir", title: "Ver y aceptar" }] : [],
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/proveedores";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ("focus" in c) { c.navigate(url); return c.focus(); } }
    return self.clients.openWindow(url);
  }));
});

// La app abre aunque no haya señal: cache mínimo del portal.
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).catch(() => caches.match("/proveedores").then((r) => r || new Response("Sin conexión. Abre la app cuando tengas señal.", { headers: { "Content-Type": "text/plain; charset=utf-8" } }))));
  }
});
