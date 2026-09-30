/* Service worker de la app de clientes de Level Up (29/sep/2026): recibe las notificaciones push y abre la pantalla del aviso.
   NO guarda páginas ni datos (resultados y archivos del cliente): sin señal solo muestra un aviso.
   Patrón del portal de proveedores de Resuelto (vault/proyectos/plomeria-pr/agente/portal/sw.js). */
const ICONO = "/cliente/iconos/192.png";
const BADGE = "/cliente/iconos/badge.png";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { texto: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.titulo || "Level Up Media", {
    body: d.texto || "",
    icon: ICONO,
    badge: BADGE,
    tag: d.tag || "lu",
    renotify: true,
    vibrate: [150, 80, 150],
    data: { url: d.url || "/cliente" },
  }));
});

// Tocar la notificación: si la app ya está abierta, la trae al frente en esa pantalla; si no, la abre.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const destino = new URL((e.notification.data && e.notification.data.url) || "/cliente", self.location.origin);
  if (destino.origin !== self.location.origin || !destino.pathname.startsWith("/cliente")) destino.pathname = "/cliente";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((cs) => {
    for (const c of cs) {
      if (new URL(c.url).origin === self.location.origin && "focus" in c) return c.focus().then((w) => (w || c).navigate(destino.href));
    }
    return self.clients.openWindow(destino.href);
  }));
});

// Apple/Google a veces renuevan la suscripción: se vuelve a registrar sola (la cookie de la sesión va con el fetch).
self.addEventListener("pushsubscriptionchange", (e) => {
  const opciones = e.oldSubscription && e.oldSubscription.options;
  if (!opciones || !opciones.applicationServerKey) return;
  e.waitUntil(self.registration.pushManager.subscribe(opciones).then((sub) =>
    fetch("/cliente/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accion: "suscribir", sub, anterior: e.oldSubscription.endpoint, instalada: true }) }),
  ));
});

// Sin señal: un aviso claro en vez de la pantalla de error del navegador. Con señal, todo va directo a la red.
self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate") return;
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0b0b0b"><title>Level Up</title>' +
    '<body style="margin:0;min-height:100svh;display:grid;place-items:center;background:#0b0b0b;color:#e8eaf2;font:16px system-ui;text-align:center;padding:24px">' +
    '<div><p style="font-size:40px;margin:0">📶</p><p style="font-weight:600">Sin conexión</p><p style="opacity:.7">Level Up necesita internet para mostrarte tu cuenta.<br>Vuelve a intentar cuando tengas señal.</p>' +
    '<button onclick="location.reload()" style="margin-top:12px;padding:10px 18px;border-radius:999px;border:0;background:#f5ce1a;color:#0b0b0b;font-weight:600">Reintentar</button></div>',
    { headers: { "content-type": "text/html; charset=utf-8" } },
  )));
});
