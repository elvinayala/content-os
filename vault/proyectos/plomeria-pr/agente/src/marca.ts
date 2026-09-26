/**
 * Ícono de Resuelto en TODAS las páginas de app.resueltopr.com (26/sep/2026, Elvin: "ponle favicon"). Un middleware
 * mete los <link> del ícono en cualquier HTML que salga sin ellos (portal, reserva, firmas, pago, app del plomero,
 * conversación de ventas…), así ninguna página nueva se queda sin ícono. Los PNG se generan del SVG con sharp (el CLI
 * de Railway no sube binarios).
 */
import type { Express, Request, Response, NextFunction } from "express";
import sharp from "sharp";

/** El de la app: cuadro naranja, casa blanca y el check naranja (el mismo de la PWA de los plomeros). */
export const ICONO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#F2621F"/><path d="M32 12 L53 30 V52 A2 2 0 0 1 51 54 H13 A2 2 0 0 1 11 52 V30 Z" fill="#fff"/><path d="M22 36 L29 43 L43 28" stroke="#F2621F" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
/** La casa con el check, para ponerla junto al nombre (blanca sobre azul, o azul sobre claro). */
export const casa = (fondoOscuro: boolean, px = 26) => `<svg width="${px}" height="${px}" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 L59 28 V57 A3 3 0 0 1 56 60 H8 A3 3 0 0 1 5 57 V28 Z" fill="${fondoOscuro ? "#FFFFFF" : "#0F3D5E"}"/><path d="M20 35 L29 44 L46 26" stroke="#F2621F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

const ETIQUETAS = `<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><meta name="theme-color" content="#0F3D5E">`;
export function conIcono(html: string): string {
  if (!/<head[\s>]/i.test(html) || /rel=["']icon["']/i.test(html)) return html;
  return html.replace(/<head(\s[^>]*)?>/i, (m) => m + ETIQUETAS);
}

const png = new Map<number, Buffer>();
async function pngDe(n: number) { if (!png.has(n)) png.set(n, await sharp(Buffer.from(ICONO_SVG)).resize(n, n).png().toBuffer()); return png.get(n)!; }

export function montarMarca(app: Express) {
  app.get("/favicon.svg", (_req, res) => res.type("image/svg+xml").set("Cache-Control", "public, max-age=604800").send(ICONO_SVG));
  app.get("/favicon.ico", async (_req, res) => res.type("image/png").set("Cache-Control", "public, max-age=604800").send(await pngDe(48)));
  app.get("/apple-touch-icon.png", async (_req, res) => res.type("image/png").set("Cache-Control", "public, max-age=604800").send(await pngDe(180)));
  app.use((_req: Request, res: Response, next: NextFunction) => {
    const enviar = res.send.bind(res);
    res.send = ((cuerpo?: any) => enviar(typeof cuerpo === "string" && /^\s*<!doctype html|^\s*<html/i.test(cuerpo) ? conIcono(cuerpo) : cuerpo)) as any;
    next();
  });
}
