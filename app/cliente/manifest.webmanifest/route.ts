import { cookies } from "next/headers";

import { COOKIE_CLIENTE, tokenCliente, verificarCookieCliente } from "@/lib/clientes-app/acceso";
import { accesoVigente } from "@/lib/clientes-app/sesion";

// Manifest de la app de clientes. En iPhone la app instalada puede no heredar la sesión de Safari: por eso, si quien lo
// pide es un cliente con acceso vigente, la app abre con SU link personal (start_url) y entra sola.
export const dynamic = "force-dynamic";

export async function GET() {
  let inicio = "/cliente";
  const c = await verificarCookieCliente((await cookies()).get(COOKIE_CLIENTE)?.value);
  if (c && (await accesoVigente(c.itemId, c.version).catch(() => null))) {
    const k = await tokenCliente(c.itemId, c.version);
    if (k) inicio = `/cliente/entrar?k=${k}`;
  }
  return Response.json(
    {
      id: "/cliente",
      name: "Level Up Media",
      short_name: "Level Up",
      description: "Tu cuenta con Level Up Media",
      lang: "es-PR",
      start_url: inicio,
      scope: "/cliente",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0b0b0b",
      theme_color: "#0b0b0b",
      icons: [
        { src: "/cliente/iconos/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/cliente/iconos/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/cliente/iconos/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json", "cache-control": "private, no-store" } },
  );
}
