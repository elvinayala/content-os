/**
 * Cliente de Bori (heybori.ai) para Resuelto. Entra con el usuario de Resuelto igual que el
 * navegador (email + contraseña → cookie de sesión) y usa los MISMOS endpoints que la app.
 * No requiere cambios en Bori.
 *
 *   npm run bori -- --estado                         ¿conectado? ¿Meta lista? ¿anuncios habilitados?
 *   npm run bori -- --estrategias                    fórmulas disponibles
 *   npm run bori -- --subir kit/flyers-clientes/c1-menu-precios.png [más archivos]
 *   npm run bori -- --preview --presupuesto 40 [--estrategia relampago-wa] [--creativos 3]
 *   npm run bori -- --relampago --presupuesto 40 --imagenes url1,url2,url3 \
 *        --mensaje "Precio fijo antes de llegar…" --saludo "Hola, quiero cotizar…" --botones "Destape|Calentador|Cisterna"
 *   npm run bori -- --campanas                       lo que hay publicado (todo nace EN PAUSA)
 *
 * Todo lo que Bori publica en Meta queda EN PAUSA: Elvin activa desde el Ads Manager.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const BASE = (process.env.BORI_URL ?? "https://www.heybori.ai").replace(/\/$/, "");
const EMAIL = process.env.BORI_EMAIL ?? "";
const PASSWORD = process.env.BORI_PASSWORD ?? "";

let cookie = "";

async function api<T = any>(ruta: string, init: RequestInit = {}): Promise<T> {
  const r = await fetch(BASE + ruta, { ...init, headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}), ...(init.headers ?? {}) } });
  const setc = r.headers.get("set-cookie");
  if (setc && setc.includes("bori_token=")) cookie = setc.split(";")[0];
  const texto = await r.text();
  let j: any = {};
  try { j = texto ? JSON.parse(texto) : {}; } catch { j = { raw: texto }; }
  if (!r.ok) throw new Error(`${ruta} → ${r.status} ${j.error ?? ""} ${j.message ?? ""}`.trim());
  return j as T;
}

export async function entrar() {
  if (!EMAIL || !PASSWORD) throw new Error("Faltan BORI_EMAIL y BORI_PASSWORD en .env");
  const j = await api<{ user: any }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  return j.user;
}

export async function estado() {
  const user = await entrar();
  const meta = user?.conn?.meta ?? user?.connSecure?.meta ?? null;
  return {
    usuario: user?.email, plan: user?.plan, creditos: user?.credits,
    anunciosHabilitados: !!(user?.adsAllowed || user?.staffAgency),
    metaConectada: !!(user?.metaConnected ?? meta), pagina: user?.conn?.metaPageName ?? meta?.pageName ?? null, cuentaPublicitaria: meta?.adAccountId ?? user?.conn?.metaAdAccountId ?? null,
    bienvenidaWhatsApp: user?.conn?.waBienvenida ?? null,
  };
}

export async function estrategias() { await entrar(); return api<{ strategies: any[] }>("/api/strategies"); }

/** Sube una imagen local como creativo (data URL). Devuelve la URL pública que Meta puede leer. */
export async function subirCreativo(archivo: string): Promise<string> {
  const buf = fs.readFileSync(archivo);
  const ext = path.extname(archivo).toLowerCase();
  const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;
  const j = await api<{ url: string }>("/api/creatives/upload", { method: "POST", body: JSON.stringify({ dataUrl }) });
  return j.url;
}

export async function preview(o: { estrategia?: string; presupuesto: number; creativos?: number }) {
  return api("/api/strategies/preview", { method: "POST", body: JSON.stringify({ strategyId: o.estrategia ?? "relampago-wa", dailyBudget: o.presupuesto, creatives: o.creativos }) });
}

/**
 * Publica la Campaña Relámpago (1 campaña · 1 conjunto Advantage+ · ventas a WhatsApp) EN PAUSA.
 * `imagenes` son URLs ya subidas a Bori (subirCreativo) o URLs públicas (p. ej. resueltopr.com/flyers/...).
 */
export async function publicarRelampago(o: { presupuesto: number; imagenes: string[]; mensaje: string; link?: string; saludo?: string; botones?: string[]; paises?: string[]; forzar?: boolean }) {
  const body = {
    strategyId: "relampago-wa",
    dailyBudget: o.presupuesto,
    creativesCount: o.imagenes.length,
    creatives: { "rl-ventas-wa": o.imagenes },              // la clave es la campaña de la fórmula
    adCopy: { message: o.mensaje.slice(0, 500), link: o.link },
    bienvenida: o.saludo ? { saludo: o.saludo, botones: o.botones ?? [] } : undefined,
    countries: o.paises ?? ["PR"],
    force: !!o.forzar,
  };
  return api("/api/campaigns/publish-strategy", { method: "POST", body: JSON.stringify(body) });
}

export async function campanas() { return api("/api/campaigns"); }

// ─────────────── CLI ───────────────
async function main() {
  const a = process.argv.slice(2);
  const tiene = (f: string) => a.includes(f);
  const val = (f: string) => { const i = a.indexOf(f); return i >= 0 ? a[i + 1] : undefined; };
  const num = (f: string, d: number) => Number(val(f) ?? d);

  if (tiene("--estado") || a.length === 0) { console.log(JSON.stringify(await estado(), null, 2)); return; }
  await entrar();
  if (tiene("--estrategias")) { const s = await estrategias(); for (const e of s.strategies) console.log(`${e.id}  ·  ${e.name}\n   ${e.goal}\n   requiere: ${(e.requires ?? []).join(", ")}\n`); return; }
  if (tiene("--subir")) {
    const archivos = a.slice(a.indexOf("--subir") + 1).filter((x) => !x.startsWith("--"));
    for (const f of archivos) console.log(f, "→", await subirCreativo(f));
    return;
  }
  if (tiene("--preview")) { console.log(JSON.stringify(await preview({ estrategia: val("--estrategia"), presupuesto: num("--presupuesto", 20), creativos: val("--creativos") ? num("--creativos", 3) : undefined }), null, 2)); return; }
  if (tiene("--relampago")) {
    const imagenes = (val("--imagenes") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!imagenes.length) throw new Error("--imagenes url1,url2 (usa --subir primero)");
    const out = await publicarRelampago({
      presupuesto: num("--presupuesto", 20), imagenes,
      mensaje: val("--mensaje") ?? "Plomero licenciado con precio fijo antes de llegar. Escríbenos por WhatsApp y te agendamos en 2 minutos.",
      link: val("--link"), saludo: val("--saludo"), botones: val("--botones")?.split("|").map((s) => s.trim()).filter(Boolean), forzar: tiene("--forzar"),
    });
    console.log(JSON.stringify(out, null, 2));
    console.log("\n⏸ Todo quedó EN PAUSA. Activar en:", out.adsManagerUrl);
    return;
  }
  if (tiene("--campanas")) { console.log(JSON.stringify(await campanas(), null, 2)); return; }
  console.log("Uso: --estado | --estrategias | --subir <archivos> | --preview --presupuesto N | --relampago --presupuesto N --imagenes u1,u2 --mensaje \"…\" | --campanas");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main().catch((e) => { console.error(String(e.message ?? e)); process.exit(1); });
