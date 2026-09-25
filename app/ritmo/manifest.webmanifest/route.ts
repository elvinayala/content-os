// PWA de Ritmo (solo /ritmo): se instala en el teléfono como app propia.
export function GET() {
  return Response.json(
    {
      name: "Ritmo",
      short_name: "Ritmo",
      description: "Asistencia y desempeño del equipo",
      start_url: "/ritmo",
      scope: "/ritmo",
      display: "standalone",
      background_color: "#191c2b",
      theme_color: "#191c2b",
      icons: [{ src: "/ritmo/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
