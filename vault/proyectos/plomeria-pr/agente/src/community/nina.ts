/**
 * Nina · el ciclo diario: decidir pilar y formato → elegir o generar el creativo → escribir el caption con Claude →
 * publicar por Zernio → reportar por Telegram. Estado en data/estado/community.json (volumen de Railway).
 */
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config.js";
import { RAIZ } from "../almacen.js";
import { NINA, PILARES, VOZ, type Pilar, type Formato } from "./identidad.js";
import { feriadoDe } from "./feriados.js";
import { BIBLIOTECA, type Creativo } from "./biblioteca.js";
import { renderTarjeta, type Tarjeta } from "./render.js";
import { crearPost, cuentasSociales } from "./zernio-posts.js";
import { reportar } from "./telegram.js";

const ARCHIVO = path.join(RAIZ, "data", "estado", "community.json");
interface Publicacion { fecha: string; pilar: Pilar | "feriado"; formato: Formato; creativoId: string; caption: string; zernioId?: string; urls?: string[]; draft?: boolean; error?: string }
interface Estado { publicaciones: Publicacion[]; preavisos: string[]; contadorCiclo: number; contadorFormato: number }
function leer(): Estado { try { return JSON.parse(fs.readFileSync(ARCHIVO, "utf8")); } catch { return { publicaciones: [], preavisos: [], contadorCiclo: 0, contadorFormato: 0 }; } }
function guardar(e: Estado) { fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true }); fs.writeFileSync(ARCHIVO, JSON.stringify(e, null, 2)); }

const client = new Anthropic();
const hoyPR = () => new Intl.DateTimeFormat("en-CA", { timeZone: config.zonaHoraria, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const horaPR = () => { const p = new Intl.DateTimeFormat("en-US", { timeZone: config.zonaHoraria, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); return { h: Number(p.find((x) => x.type === "hour")!.value) % 24, m: Number(p.find((x) => x.type === "minute")!.value) }; };
const diaSemanaPR = () => new Intl.DateTimeFormat("es-PR", { timeZone: config.zonaHoraria, weekday: "long" }).format(new Date());

export interface Plan { fecha: string; pilar: Pilar | "feriado"; formato: Formato; feriado?: string; creativo?: Creativo; generar: boolean; angulo: string }

/** Decide qué toca hoy (sin efectos secundarios). */
export function planDeHoy(estado = leer(), fecha = hoyPR()): Plan {
  const f = feriadoDe(fecha);
  if (f) return { fecha, pilar: "feriado", formato: "post", feriado: f.nombre, generar: true, angulo: f.angulo };
  const pilar = NINA.ciclo[estado.contadorCiclo % NINA.ciclo.length];
  let formato: Formato = NINA.formatos[estado.contadorFormato % NINA.formatos.length];
  const usados = new Set(estado.publicaciones.slice(-21).map((p) => p.creativoId));
  const candidatos = BIBLIOTECA.filter((c) => c.pilar === pilar && c.formato === formato && !usados.has(c.id));
  // Reels solo de biblioteca: si no queda ninguno fresco de ese pilar, toma cualquier reel fresco; si tampoco, cae a post generado.
  if (formato === "reel" && !candidatos.length) {
    const reel = BIBLIOTECA.filter((c) => c.formato === "reel" && !usados.has(c.id))[0];
    if (reel) return { fecha, pilar, formato, creativo: reel, generar: false, angulo: reel.tema };
    formato = "post";
  }
  const angulos = PILARES[pilar].angulos;
  const angulo = angulos[estado.publicaciones.length % angulos.length];
  // Alterna: 1 de biblioteca, 1 generado, para que el feed no se vea repetido.
  const prefiereBiblioteca = estado.publicaciones.length % 2 === 0 && candidatos.length > 0;
  if (prefiereBiblioteca) return { fecha, pilar, formato, creativo: candidatos[0], generar: false, angulo: candidatos[0].tema };
  return { fecha, pilar, formato, generar: true, angulo };
}

interface Guion { caption: string; tarjetas?: Tarjeta[] }

/** Claude a veces mete saltos de línea literales dentro de los strings; los escapamos antes de parsear. */
function parsearGuion(txt: string): Guion {
  const recortado = txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
  try { return JSON.parse(recortado); } catch {}
  let out = "", enStr = false, esc = false;
  for (const ch of recortado) {
    if (esc) { out += ch; esc = false; continue; }
    if (ch === "\\") { out += ch; esc = true; continue; }
    if (ch === '"') enStr = !enStr;
    if (enStr && ch === "\n") { out += "\\n"; continue; }
    out += ch;
  }
  return JSON.parse(out);
}


async function escribir(plan: Plan): Promise<Guion> {
  const pilarTxt = plan.pilar === "feriado" ? `FERIADO: ${plan.feriado}. Ángulo: ${plan.angulo}. Publica algo humano y breve sobre el día, conectado con la casa o el oficio; sin vender duro.` : `PILAR: ${plan.pilar} — ${PILARES[plan.pilar].que}\nÁngulo de hoy: ${plan.angulo}`;
  const formatoTxt = plan.formato === "carrusel" ? "CARRUSEL de 5 tarjetas: tarjeta 1 = gancho fuerte; 2-4 = desarrollo (una idea por tarjeta); 5 = cierre con CTA. Cada titular máx. 60 caracteres; apoyo máx. 120." : plan.formato === "reel" ? "REEL ya producido (video de 15 s). Solo escribe el caption." : plan.generar ? "POST de una sola imagen que TÚ diseñas: un titular potente (máx. 60 caracteres, marca 1-2 palabras clave entre *asteriscos* para pintarlas de naranja) + apoyo (máx. 120) + pill (CTA corto)." : `POST con un flyer ya diseñado sobre: ${plan.creativo?.tema}. Solo escribe el caption.`;
  const esquema = plan.generar
    ? `{"caption":"...","tarjetas":[{"eyebrow":"...","titular":"...","apoyo":"...","pill":"...","tema":"navy|cream"}${plan.formato === "carrusel" ? ", …hasta 5" : ""}]}`
    : `{"caption":"..."}`;
  const r = await client.messages.create({
    model: config.modelo, max_tokens: 1200,
    system: `Eres ${NINA.nombre}, ${NINA.cargo}. Escribes el contenido orgánico diario de Instagram y Facebook de Resuelto (plomería con precio fijo en Puerto Rico; también reclutamos plomeros licenciados en TODA la isla).\n${VOZ}\nEstructura del caption: gancho en la primera línea (sin "¿Sabías que"), 2-5 líneas cortas de desarrollo, CTA claro, línea en blanco y 4-6 hashtags (incluye ${NINA.hashtagsBase.join(" ")}). Máx. 900 caracteres. Hoy es ${diaSemanaPR()} ${plan.fecha}.\nResponde SOLO con JSON válido con este esquema: ${esquema}`,
    messages: [{ role: "user", content: `${pilarTxt}\n\nFORMATO: ${formatoTxt}` }],
  });
  const txt = r.content.filter((b) => b.type === "text").map((b: any) => b.text).join("").trim().replace(/^```json\s*|```$/g, "");
  const g = parsearGuion(txt);
  if (!g.caption) throw new Error("Claude no devolvió caption");
  return g;
}

/** Genera (si toca), publica y reporta. `modo`: "publicar" | "programar" (para mañana 11:00) | "borrador". */
export async function ejecutar(modo: "publicar" | "programar" | "borrador" = "publicar", plan = planDeHoy()): Promise<Publicacion> {
  const estado = leer();
  const guion = await escribir(plan);
  let urls: string[] = []; let creativoId = plan.creativo?.id ?? `gen-${plan.fecha}`;
  if (plan.generar) {
    const tarjetas = (guion.tarjetas ?? []).slice(0, plan.formato === "carrusel" ? 5 : 1);
    if (!tarjetas.length) throw new Error("Claude no devolvió tarjetas para generar");
    const base = config.urlPublica.replace(/\/$/, "");
    for (const [i, t] of tarjetas.entries()) {
      const archivo = await renderTarjeta({ ...t, indice: tarjetas.length > 1 ? `${i + 1}/${tarjetas.length}` : undefined }, `${plan.fecha}-${plan.pilar}-${i + 1}`);
      urls.push(`${base}/community/media/${archivo}`);
    }
  } else urls = plan.creativo!.urls;
  const esVideo = plan.formato === "reel";
  const cuando = modo === "programar" ? new Date(`${plan.fecha}T${String(NINA.horaPublicacion.hora).padStart(2, "0")}:${String(NINA.horaPublicacion.minuto).padStart(2, "0")}:00-04:00`).toISOString() : undefined;
  const res = await crearPost({
    title: `Nina · ${plan.fecha} · ${plan.pilar} · ${plan.formato}`, content: guion.caption, formato: plan.formato,
    mediaItems: urls.map((u) => ({ url: u, type: esVideo ? "video" : "image" })),
    publishNow: modo === "publicar", scheduledFor: cuando, isDraft: modo === "borrador", metadata: { pilar: plan.pilar, formato: plan.formato, creativo: creativoId },
  });
  const pub: Publicacion = { fecha: plan.fecha, pilar: plan.pilar, formato: plan.formato, creativoId, caption: guion.caption, zernioId: res.id, urls: res.urls, draft: res.draft, error: res.error };
  estado.publicaciones.push(pub);
  if (plan.pilar !== "feriado") { estado.contadorCiclo++; estado.contadorFormato++; }
  guardar(estado);
  const cuentas = await cuentasSociales();
  const cabecera = res.ok ? (res.draft ? `📝 Guardé el post de hoy como BORRADOR en Zernio (no hay Instagram/Facebook conectados todavía).` : modo === "programar" ? `🗓️ Programé el post de hoy para las 11:00 AM.` : `✅ Publicado.`) : `❌ No pude publicar: ${res.error}`;
  await reportar(`${NINA.firma}\n${cabecera}\n\n${plan.pilar === "feriado" ? `🎉 ${plan.feriado}` : `Pilar: ${plan.pilar} · Formato: ${plan.formato}`}${plan.creativo ? ` · Creativo: ${plan.creativo.id}` : " · Creativo generado"}\nCuentas: ${cuentas.length ? cuentas.map((c) => `${c.platform}${c.username ? " @" + c.username : ""}`).join(", ") : "ninguna conectada en Zernio"}\n\n${guion.caption.slice(0, 500)}${guion.caption.length > 500 ? "…" : ""}\n\n${urls[0]}${res.urls?.length ? "\n" + res.urls.join("\n") : ""}`);
  return pub;
}

/** Preaviso de la mañana: qué va a salir hoy. */
export async function preaviso(): Promise<void> {
  const estado = leer(); const hoy = hoyPR();
  if (estado.preavisos.includes(hoy)) return;
  const plan = planDeHoy(estado, hoy);
  estado.preavisos = [...estado.preavisos.slice(-30), hoy]; guardar(estado);
  await reportar(`${NINA.firma} · buenos días 👋\nHoy ${diaSemanaPR()} publico a las ${NINA.horaPublicacion.hora}:${String(NINA.horaPublicacion.minuto).padStart(2, "0")} AM:\n${plan.pilar === "feriado" ? `🎉 Post de ${plan.feriado}` : `• Pilar: ${plan.pilar}\n• Formato: ${plan.formato}\n• Ángulo: ${plan.angulo}`}${plan.creativo ? `\n• Creativo: ${plan.creativo.id} (biblioteca)` : "\n• Creativo: lo diseño yo"}\n\nSi quieres otro ángulo, escríbele a Elvin/Claude antes de las 11.`);
}

/** Loop de reloj: revisa cada minuto la hora de PR. */
export function arrancarReloj() {
  let ultimaPublicacion = "";
  const tick = async () => {
    try {
      const { h, m } = horaPR(); const hoy = hoyPR();
      if (h === NINA.horaPreaviso.hora && m === NINA.horaPreaviso.minuto) await preaviso();
      if (h === NINA.horaPublicacion.hora && m === NINA.horaPublicacion.minuto && ultimaPublicacion !== hoy) {
        const estado = leer();
        if (!estado.publicaciones.some((p) => p.fecha === hoy && !p.error)) { ultimaPublicacion = hoy; await ejecutar("publicar"); }
      }
    } catch (e) { console.error("Nina", e); await reportar(`${NINA.firma}\n❌ Error en el ciclo de hoy: ${(e as Error).message}`).catch(() => {}); }
  };
  setInterval(tick, 60_000);
  console.log(`Nina lista: preaviso ${NINA.horaPreaviso.hora}:${NINA.horaPreaviso.minuto} · publicación ${NINA.horaPublicacion.hora}:${String(NINA.horaPublicacion.minuto).padStart(2, "0")} (${config.zonaHoraria})`);
}

export function historial() { return leer(); }
