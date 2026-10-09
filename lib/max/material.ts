import "server-only";

import { hiloConArchivos } from "@/lib/max/flujo";
import { clasificar, leerCarpetaDrive, linksDrive, mimeDe, nombreSeguro, seBaja, unirMaterial, type Material } from "@/lib/max/material-reglas";
import { cliente, guardarCliente } from "@/lib/max/repo";
import { subirArchivo, urlFirmada } from "@/lib/pulse/storage";

// Junta el material de un cliente para sus creativos (Elvin, 9/oct/2026): lo que el equipo sube al hilo del pedido en
// #max-aprobaciones (adjuntos de Slack) y las carpetas de Drive "cualquiera con el enlace" que se pegan ahí. Baja logos,
// fotos y PDFs (guía de marca), los guarda en Storage (pulse/motion/clientes/<slug>/) con URL firmada de 1 año —la que usa
// Remi para renderizar— y los deja en la ficha del expediente (ficha.material). Los videos (b-roll) solo se listan.
// Así nadie tiene que pasarle "URLs públicas" ni "colores hex" a Max: él mira el logo y las fotos y produce.

const UN_ANO = 365 * 24 * 3600;
const MAX_ARCHIVOS = 40;

async function bajar(url: string, headers: Record<string, string> = {}): Promise<{ datos: Buffer; mime: string | null } | null> {
  try {
    const r = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(45_000) });
    if (!r.ok) return null;
    const mime = r.headers.get("content-type");
    if (mime?.startsWith("text/html")) return null; // Drive devolvió una página (archivo privado o aviso), no el archivo
    return { datos: Buffer.from(await r.arrayBuffer()), mime };
  } catch {
    return null;
  }
}

type Pendiente = { clave: string; nombre: string; origen: "slack" | "drive"; carpeta?: string; url: string; headers?: Record<string, string>; mime?: string; bytes?: number; ver?: string };

// Carpetas públicas de Drive, con sus subcarpetas (2 niveles: "Fotos DR", "Logo"…).
async function archivosDrive(carpetas: string[]): Promise<Pendiente[]> {
  const out: Pendiente[] = [];
  const visitadas = new Set<string>();
  const recorrer = async (id: string, ruta: string, nivel: number) => {
    if (visitadas.has(id) || nivel > 2 || out.length >= MAX_ARCHIVOS) return;
    visitadas.add(id);
    const html = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`, { signal: AbortSignal.timeout(20_000) }).then((r) => (r.ok ? r.text() : "")).catch(() => "");
    for (const e of leerCarpetaDrive(html)) {
      if (e.carpeta) await recorrer(e.id, ruta ? `${ruta}/${e.titulo}` : e.titulo, nivel + 1);
      else out.push({ clave: `drive-${e.id}`, nombre: e.titulo, origen: "drive", carpeta: ruta || undefined, url: `https://drive.usercontent.google.com/download?id=${e.id}&export=download&confirm=t`, ver: `https://drive.google.com/file/d/${e.id}/view` });
    }
  };
  for (const c of carpetas) await recorrer(c, "", 0);
  return out;
}

export async function reunirMaterial(slug: string, { canal, hilo, drive = [] }: { canal?: string; hilo?: string; drive?: string[] }) {
  const exp = await cliente(slug);
  if (!exp) throw new Error(`no existe el expediente ${slug}`);
  const ficha = (exp.ficha ?? {}) as Record<string, unknown>;
  const viejo = Array.isArray(ficha.material) ? (ficha.material as Material[]) : [];
  const yaBajados = new Set(viejo.filter((m) => m.url).map((m) => m.clave));
  const avisos: string[] = [];
  const pendientes: Pendiente[] = [];
  const carpetas = new Set<string>();
  for (const d of drive) for (const c of linksDrive(d).carpetas) carpetas.add(c);

  // 1) El hilo del pedido: adjuntos + links de Drive que se pegaron ahí.
  const canalHilo = canal || process.env.SLACK_MAX_CHANNEL_ID || "";
  if (hilo && canalHilo) {
    const h = await hiloConArchivos(canalHilo, hilo);
    if (!h.ok) avisos.push(`no pude leer el hilo (${h.error})`);
    for (const t of h.textos) for (const c of linksDrive(t).carpetas) carpetas.add(c);
    const token = process.env.SLACK_BOT_TOKEN || "";
    for (const f of h.archivos) {
      const url = f.url_private_download || f.url_private;
      if (!url) continue;
      pendientes.push({ clave: `slack-${f.id}`, nombre: f.name || f.id, origen: "slack", url, headers: { Authorization: `Bearer ${token}` }, mime: f.mimetype, bytes: f.size, ver: f.url_private });
    }
  }
  // 2) Drive (carpetas públicas).
  pendientes.push(...(await archivosDrive([...carpetas])));

  // 3) Bajar lo que sirve (logo, fotos, PDF) y subirlo a Storage; los videos solo se listan.
  const nuevos: Material[] = [];
  const cola = pendientes.slice(0, MAX_ARCHIVOS);
  const trabajar = async (p: Pendiente) => {
    const mime = mimeDe(p.nombre, p.mime);
    const tipo = clasificar(p.nombre, mime, p.carpeta);
    const base: Material = { clave: p.clave, nombre: p.nombre, tipo, origen: p.origen, carpeta: p.carpeta, ver: p.ver, bytes: p.bytes };
    if (!seBaja(tipo, p.bytes) || yaBajados.has(p.clave)) { nuevos.push(base); return; }
    const b = await bajar(p.url, p.headers);
    if (!b) { avisos.push(`no pude bajar ${p.nombre}${p.origen === "drive" ? " (¿la carpeta está como 'cualquiera con el enlace'?)" : ""}`); nuevos.push(base); return; }
    const ruta = `motion/clientes/${slug}/${p.clave}-${nombreSeguro(p.nombre)}`;
    await subirArchivo(ruta, b.datos, mimeDe(p.nombre, b.mime));
    nuevos.push({ ...base, bytes: b.datos.length, url: (await urlFirmada(ruta, UN_ANO)) ?? undefined });
  };
  for (let i = 0; i < cola.length; i += 4) await Promise.all(cola.slice(i, i + 4).map((p) => trabajar(p).catch((e) => avisos.push(`${p.nombre}: ${String(e?.message || e).slice(0, 120)}`))));
  if (pendientes.length > MAX_ARCHIVOS) avisos.push(`había ${pendientes.length} archivos; tomé los primeros ${MAX_ARCHIVOS}`);

  const material = unirMaterial(viejo, nuevos);
  await guardarCliente({ slug, ficha: { material } });
  return { material, avisos, carpetasDrive: [...carpetas].length };
}
