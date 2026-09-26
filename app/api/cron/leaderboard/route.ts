import { ImageResponse } from "next/og";
import type { ReactElement } from "react";
import { NextResponse, type NextRequest } from "next/server";

import { JUNIO } from "@/lib/leaderboard/ejemplo";
import { ALTO, ANCHO, fuentes, leaderboard } from "@/lib/leaderboard/imagen";
import { armarCloser, armarSetter, mesPR, type ResultadoCloser, type ResultadoSetter } from "@/lib/leaderboard/reglas";
import { secretoValido } from "@/lib/pulse/seguridad";
import { parseCsv } from "@/lib/sheets";

export const runtime = "nodejs";
export const maxDuration = 60;

// Leaderboard de Level Up (Aure, 26/sep · #50–#66): L–S 7 AM y 3 PM PR lee la hoja
// "COPIA RESPALDO - VENTAS 2026 LEVEL UP", arma CLOSER y SETTER con sus reglas y, si todo cuadra,
// manda las 2 imágenes por DM desde el bot Command Center. Si algo no cuadra NO manda imágenes:
// avisa por DM qué falló. Destino: LEADERBOARD_DESTINO=aure (default elvin, hasta su OK).
//   ?ver=closer|setter → devuelve el PNG (vista previa; con &ejemplo=1 usa el ejemplo de junio) · ?dry=1 → solo JSON.
const HOJA_ID = process.env.LEADERBOARD_HOJA_ID ?? "1a44rg368MURNEqIDTrtU5jxCbBMhZ8ah-fGPSTNpQg0";
const HOJA_GID = process.env.LEADERBOARD_HOJA_GID ?? "2129209183";
const DESTINOS: Record<string, string> = { aure: "U08HA9QCJBG", elvin: process.env.CEO_SLACK_ID ?? "U08U9777PUY" };

async function leerHoja(): Promise<{ filas?: string[][]; error?: string }> {
  try {
    const r = await fetch(`https://docs.google.com/spreadsheets/d/${HOJA_ID}/export?format=csv&gid=${HOJA_GID}`, { cache: "no-store", signal: AbortSignal.timeout(20000) });
    const tipo = r.headers.get("content-type") ?? "";
    if (!r.ok || !tipo.includes("csv")) return { error: `No pude abrir la hoja de ventas (HTTP ${r.status}): tiene que estar compartida como "cualquiera con el enlace puede ver".` };
    return { filas: parseCsv(await r.text()) };
  } catch (e) {
    return { error: `No pude abrir la hoja de ventas: ${(e as Error).message}` };
  }
}

async function png(tipo: "closer" | "setter", r: ResultadoCloser | ResultadoSetter): Promise<Buffer> {
  const nodo = await leaderboard({ tipo, mes: mesPR(), total: "total" in r ? r.total : undefined, podio: r.podio, abajo: r.abajo });
  const img = new ImageResponse(nodo as unknown as ReactElement, { width: ANCHO, height: ALTO, fonts: await fuentes() });
  return Buffer.from(await img.arrayBuffer());
}

async function slack<T>(metodo: string, body: Record<string, unknown>, form = false): Promise<T & { ok: boolean; error?: string }> {
  const r = await fetch(`https://slack.com/api/${metodo}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`, "Content-Type": form ? "application/x-www-form-urlencoded" : "application/json; charset=utf-8" },
    body: form ? new URLSearchParams(body as Record<string, string>) : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  return (await r.json()) as T & { ok: boolean; error?: string };
}

/** DM con texto; devuelve el id del canal (D…) para subir archivos ahí. */
async function dm(usuario: string, texto: string): Promise<string | null> {
  const r = await slack<{ channel?: string }>("chat.postMessage", { channel: usuario, text: texto });
  return r.ok ? (r.channel ?? null) : null;
}

async function subir(canal: string, archivos: { nombre: string; titulo: string; datos: Buffer }[]): Promise<string | null> {
  const ids: { id: string; title: string }[] = [];
  for (const a of archivos) {
    const u = await slack<{ upload_url?: string; file_id?: string }>("files.getUploadURLExternal", { filename: a.nombre, length: String(a.datos.length) }, true);
    if (!u.ok || !u.upload_url || !u.file_id) return `getUploadURLExternal: ${u.error}`;
    const put = await fetch(u.upload_url, { method: "POST", body: new Uint8Array(a.datos), signal: AbortSignal.timeout(30000) });
    if (!put.ok) return `subida: HTTP ${put.status}`;
    ids.push({ id: u.file_id, title: a.titulo });
  }
  const c = await slack("files.completeUploadExternal", { files: ids, channel_id: canal });
  return c.ok ? null : `completeUploadExternal: ${c.error}`;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  if (process.env.CRON_SECRET && !secretoValido(req.headers.get("authorization"), `Bearer ${process.env.CRON_SECRET}`)) {
    return NextResponse.json({ ok: false, error: "no-auth" }, { status: 401 });
  }
  const destino = DESTINOS[process.env.LEADERBOARD_DESTINO ?? "elvin"] ?? DESTINOS.elvin;
  const { filas, error } = q.get("ejemplo") === "1" && q.get("ver") ? { filas: JUNIO, error: undefined } : await leerHoja();
  const closer = filas ? armarCloser(filas) : null;
  const setter = filas ? armarSetter(filas) : null;
  const errores = error ? [error] : [...(closer?.errores ?? []).map((e) => `Closer: ${e}`), ...(setter?.errores ?? []).map((e) => `Setter: ${e}`)];

  const ver = q.get("ver");
  if ((ver === "closer" || ver === "setter") && closer && setter) {
    const r = ver === "closer" ? closer : setter;
    if (r.errores.length) return NextResponse.json({ ok: false, errores: r.errores }, { status: 422 });
    return new NextResponse(new Uint8Array(await png(ver, r)), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  }
  if (q.get("dry") === "1") return NextResponse.json({ ok: !errores.length, errores, closer, setter });

  if (errores.length || !closer || !setter) {
    await dm(destino, `⚠️ *Leaderboard de Level Up — no lo mandé* porque algo no cuadra:\n• ${errores.join("\n• ")}\nRevísalo en la hoja y vuelve a salir en la próxima corrida.\n— Nico`);
    return NextResponse.json({ ok: false, errores });
  }
  const [imgCloser, imgSetter] = await Promise.all([png("closer", closer), png("setter", setter)]);
  const canal = await dm(destino, ":bar_chart: *LEVEL UP MEDIA — LEADERBOARD ACTUALIZADO*\n*Adjunto:*\n1. Leaderboard Closers\n2. Leaderboard Setters");
  if (!canal) return NextResponse.json({ ok: false, error: "no pude abrir el DM" }, { status: 502 });
  const fallo = await subir(canal, [
    { nombre: "leaderboard-closers.png", titulo: "Leaderboard Closers", datos: imgCloser },
    { nombre: "leaderboard-setters.png", titulo: "Leaderboard Setters", datos: imgSetter },
  ]);
  if (fallo) return NextResponse.json({ ok: false, error: fallo }, { status: 502 });
  return NextResponse.json({ ok: true, destino, closer: closer.podio.length, setter: setter.podio.length });
}
