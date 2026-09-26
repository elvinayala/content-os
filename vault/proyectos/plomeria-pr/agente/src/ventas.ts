/**
 * Grupo de ventas en Telegram (26/sep/2026, Elvin: "crea el grupo de Telegram o deja eso listo"). La setter (Heileen)
 * recibe ahí SOLO lo de ventas: "📞 Llama para cerrar", "📞 Llamada perdida" y "🔁 Cita sin plomero". Lo demás
 * (candidatos, plomeros, contratos, Nina) sigue yendo solo a Elvin.
 * Conexión sin tocar nada: se crea el grupo con "Ventas" en el nombre y se agrega el bot @Nina_resueltoCM_bot; el
 * agente lo detecta solo (getUpdates cada 2 min mientras no esté conectado), guarda el chat y saluda. También se puede
 * fijar con la variable VENTAS_TELEGRAM_CHAT_ID. Mientras no haya grupo, los avisos siguen llegando a Elvin.
 * Cada aviso trae un enlace firmado a la conversación de ESE cliente (/ventas/c/<id>?k=…), sin login ni acceso al resto.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { config } from "./config.js";
import { RAIZ, almacen } from "./almacen.js";
import { leerHistorial } from "./historial.js";
import { avisarCoordinador } from "./canales/whatsapp.js";

const ARCH = path.join(RAIZ, "data", "estado", "ventas-telegram.json");
const leerEstado = (): { chatId?: string; titulo?: string; conectado?: string; offset?: number } => { try { return JSON.parse(fs.readFileSync(ARCH, "utf8")); } catch { return {}; } };
const guardarEstado = (d: object) => fs.writeFileSync(ARCH, JSON.stringify({ ...leerEstado(), ...d }, null, 2));
export const chatVentas = () => process.env.VENTAS_TELEGRAM_CHAT_ID || leerEstado().chatId || "";

async function tg(metodo: string, body: object) {
  const r = await fetch(`https://api.telegram.org/bot${config.telegram.botToken}/${metodo}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  return r?.ok ? (await r.json()).result : null;
}

/** Aviso de ventas: al grupo si está conectado; si no, a Elvin como siempre. */
export async function avisarVentas(texto: string) {
  const chat = chatVentas();
  if (!chat || !config.telegram.botToken) return avisarCoordinador(texto);
  const ok = await tg("sendMessage", { chat_id: chat, text: `Resuelto · ${texto}`, disable_web_page_preview: true });
  if (!ok) { console.error("Telegram ventas: no salió, va a Elvin"); await avisarCoordinador(texto); }
}

// ── Enlace firmado a la conversación de un cliente ──
const secreto = () => process.env.PORTAL_SECRETO || config.adminToken || "resuelto";
export const firmaCliente = (id: string) => crypto.createHmac("sha256", secreto()).update("ventas:" + id).digest("base64url").slice(0, 22);
export const linkCliente = (id: string) => `${config.urlPublica}/ventas/c/${encodeURIComponent(id)}?k=${firmaCliente(id)}`;
export function firmaValida(id: string, k: unknown) {
  const ok = firmaCliente(id), v = String(k ?? "");
  return v.length === ok.length && crypto.timingSafeEqual(Buffer.from(v), Buffer.from(ok));
}

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const hora = (iso?: string) => (iso ? new Date(iso).toLocaleString("es-PR", { timeZone: config.zonaHoraria, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "");
export function paginaCliente(id: string): string | null {
  const c = almacen.contacto(id); if (!c) return null;
  const ev = leerHistorial(id, 60).filter((x) => x.autor === "cliente" || x.autor === "resuelto");
  const tel = String(c.telefono ?? "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
  const burbujas = ev.map((x) => `<div class="m ${x.autor === "cliente" ? "c" : "r"}"><div>${esc(x.texto).replace(/\n/g, "<br>")}</div><small>${x.autor === "cliente" ? "Cliente" : "Resuelto"} · ${hora((x as any).fecha)}</small></div>`).join("") || `<p class="v">Todavía no hay conversación guardada.</p>`;
  const reservar = `/reservar?o=setter${c.municipio ? "&p=" + encodeURIComponent(c.municipio) : ""}`;
  return `<!doctype html><html lang="es-PR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Resuelto · ${esc(c.nombre ?? "Cliente")}</title>
<style>body{margin:0;font-family:system-ui,sans-serif;background:#FBF7F0;color:#1c2a36}header{background:#0F3D5E;color:#fff;padding:14px 16px}header b{font-size:18px}main{max-width:620px;margin:0 auto;padding:14px 16px 40px}
.card{background:#fff;border-radius:14px;padding:14px;box-shadow:0 4px 16px rgba(8,36,58,.06);margin-bottom:12px}.row{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.btn{display:inline-block;background:#F2621F;color:#fff;text-decoration:none;font-weight:700;padding:11px 16px;border-radius:10px}.btn.l{background:#0F3D5E}
.m{max-width:85%;margin:8px 0;padding:9px 12px;border-radius:12px;font-size:15px;line-height:1.35}.m small{display:block;color:#5C6670;font-size:11px;margin-top:4px}.c{background:#fff;border:1px solid #e6e1d8}.r{background:#E8F0F6;margin-left:auto}.v{color:#5C6670}</style></head><body>
<header><b>resuelto</b> · ventas</header><main>
<div class="card"><h2 style="margin:0">${esc(c.nombre ?? "Cliente sin nombre")}</h2><p class="v" style="margin:4px 0 0">${esc(tel.replace(/^(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3") || "sin teléfono")}${c.municipio ? " · " + esc(c.municipio) : ""} · llegó por ${esc(c.canal)}</p>
<div class="row">${tel ? `<a class="btn" href="tel:+1${tel}">Llamar</a>` : ""}<a class="btn l" href="${reservar}">Reservar para este cliente</a></div></div>
<div class="card">${burbujas}</div></main></body></html>`;
}

// ── Detección del grupo (sin webhook: el bot no tiene otro lector de updates) ──
const SALUDO = "✅ Grupo de ventas conectado. Aquí llegan: 📞 Llama para cerrar (escribió por las redes y dejó su número), 📞 Llamada perdida (con el mensaje de voz) y 🔁 Cita sin plomero (hay que moverle la hora al cliente). Cada aviso trae el enlace a la conversación del cliente. Respondan cada aviso con el resultado: Agendó · No contestó · Lo pensará · No le interesa.";
export async function buscarGrupoVentas() {
  if (chatVentas() || !config.telegram.botToken) return;
  const est = leerEstado();
  const ups: any[] = (await tg("getUpdates", { offset: est.offset ?? 0, timeout: 0, allowed_updates: ["message", "my_chat_member"] })) ?? [];
  if (!ups.length) return;
  guardarEstado({ offset: ups[ups.length - 1].update_id + 1 });
  for (const u of ups) {
    const chat = u.my_chat_member?.chat ?? u.message?.chat;
    if (!chat || (chat.type !== "group" && chat.type !== "supergroup") || !/ventas/i.test(chat.title ?? "")) continue;
    if (u.my_chat_member && !["member", "administrator"].includes(u.my_chat_member.new_chat_member?.status)) continue;
    guardarEstado({ chatId: String(chat.id), titulo: chat.title, conectado: new Date().toISOString() });
    await tg("sendMessage", { chat_id: chat.id, text: SALUDO });
    await avisarCoordinador(`✅ Grupo de Telegram "${chat.title}" conectado: los avisos de ventas salen ahí desde ahora.`);
    console.log("Telegram ventas conectado:", chat.title, chat.id);
    return;
  }
}
