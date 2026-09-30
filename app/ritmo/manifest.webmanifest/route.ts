// PWA de Ritmo (solo /ritmo): se instala en el teléfono como app propia, sin App Store ni Play Store
// (iPhone: Safari → Compartir → Agregar a pantalla de inicio; Android: Chrome → Instalar app).
// El service worker (public/ritmo/sw.js) recibe las notificaciones push.
export function GET() {
  return Response.json(
    {
      id: "/ritmo",
      name: "Ritmo",
      short_name: "Ritmo",
      description: "Asistencia y desempeño del equipo",
      lang: "es-PR",
      start_url: "/ritmo",
      scope: "/ritmo",
      display: "standalone",
      orientation: "portrait",
      background_color: "#191c2b",
      theme_color: "#191c2b",
      icons: [
        { src: "/ritmo/iconos/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/ritmo/iconos/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/ritmo/iconos/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        { src: "/ritmo/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      ],
      shortcuts: [
        { name: "Marcar", url: "/ritmo", icons: [{ src: "/ritmo/iconos/192.png", sizes: "192x192" }] },
        { name: "Solicitudes", url: "/ritmo/solicitudes", icons: [{ src: "/ritmo/iconos/192.png", sizes: "192x192" }] },
      ],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "public, max-age=3600" } },
  );
}
