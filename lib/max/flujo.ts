import "server-only";

import {
  aprobadores,
  canalesPermitidos,
  type Decision,
  encabezadoBuzon,
  okConCambio,
  PUEDEN_PUBLICAR,
  revisarParaCliente,
  textoAprobacion,
  textoParaCliente,
  type TipoItem,
  validarDecision,
  VAN_AL_CLIENTE,
} from "./operador";
import { actualizarItem, alBuzonMax, cliente as leerCliente, crearItem, item as leerItem, type ItemMax } from "./repo";

// Max en Slack — el flujo (Slack + base). Lo usan app/api/slack-eventos (decisiones y mensajes de
// clientes), app/api/max (las manos de Max desde Railway) y el onboarding.
//
// Regla dura (Elvin, 24/sep): Max NUNCA le escribe al cliente por su cuenta. Lo que ve el cliente
// es exactamente el contenido que Elvin o Carilin aprobaron en #max-aprobaciones, y lo publica
// ESTE servidor al recibir el "ok" — no el modelo.

const CEO = process.env.CEO_SLACK_ID || "U08U9777PUY";
export const APROBADORES = () => aprobadores(process.env.MAX_APROBADORES, CEO);
export const CANAL_APROBACIONES = () => process.env.SLACK_MAX_CHANNEL_ID || "";
// Lista blanca de canales de clientes (Elvin, 24/sep: "que no añadan a Max a ningún canal de
// ningún cliente aún"). Vacía = ninguno: Max no lee ni se le envía nada a ningún cliente.
export const canalClientePermitido = (canal: string | null | undefined) => Boolean(canal) && canalesPermitidos(process.env.MAX_CANALES_CLIENTES).has(canal as string);

export class BloqueoMax extends Error {}
// Identidad de Max en Slack (24/sep): su nombre y su muñequito (public/marcas/max/, vault/ceo/identidad-max.md).
const ORIGEN = (process.env.CONTENT_OS_URL || "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const IDENTIDAD = () => ({
  username: process.env.MAX_NOMBRE_SLACK || "Max · Estratega Level Up",
  icon_url: process.env.MAX_AVATAR_URL || `${ORIGEN}/marcas/max/max-avatar-v3-512.png`,
});
const NOMBRE_APROBADOR: Record<string, string> = { elvin: "Elvin", carilin: "Carilin", jessica: "Jessica" };

async function slackApi<T = Record<string, unknown>>(metodo: string, cuerpo: Record<string, unknown>, get = false): Promise<T & { ok?: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "sin SLACK_BOT_TOKEN" } as T & { ok: boolean; error: string };
  const url = get ? `https://slack.com/api/${metodo}?${new URLSearchParams(Object.entries(cuerpo).map(([k, v]) => [k, String(v)]))}` : `https://slack.com/api/${metodo}`;
  const r = await fetch(url, {
    method: get ? "GET" : "POST",
    headers: { Authorization: `Bearer ${token}`, ...(get ? {} : { "Content-Type": "application/json; charset=utf-8" }) },
    body: get ? undefined : JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(10000),
  });
  return (await r.json().catch(() => ({ ok: false, error: "respuesta" }))) as T & { ok?: boolean; error?: string };
}

// Un DM a una persona (U…) con nombre/foto propios hay que mandarlo al id del DM (D…): si se manda al
// U…, Slack lo deja en el chat de "Slackbot" y no en el de la app (visto el 24/sep con el DM de prueba).
const dms = new Map<string, string>();
async function dmDe(usuario: string): Promise<string | null> {
  if (dms.has(usuario)) return dms.get(usuario)!;
  let cursor = "";
  for (let v = 0; v < 5; v++) {
    const r = await slackApi<{ channels?: { id: string; user?: string }[]; response_metadata?: { next_cursor?: string } }>("users.conversations", { types: "im", limit: 200, ...(cursor ? { cursor } : {}) }, true);
    if (!r.ok) break;
    for (const c of r.channels ?? []) if (c.user) dms.set(c.user, c.id);
    cursor = r.response_metadata?.next_cursor || "";
    if (!cursor || dms.has(usuario)) break;
  }
  return dms.get(usuario) ?? null;
}

export async function publicar(channel: string, text: string, thread_ts?: string | null): Promise<{ ok: boolean; ts?: string; error?: string }> {
  if (/^U[A-Z0-9]{6,}$/.test(channel)) {
    const dm = await dmDe(channel);
    // Sin DM previo con la app: se manda sin nombre/foto propios (Slack abre el DM de la app) y la
    // próxima vez ya existe el DM.
    if (!dm) {
      const r = await slackApi<{ ts?: string }>("chat.postMessage", { channel, text, unfurl_links: false });
      return { ok: Boolean(r.ok), ts: r.ts, error: r.error };
    }
    channel = dm;
  }
  const base = { channel, text, ...(thread_ts ? { thread_ts } : {}), unfurl_links: false };
  let r = await slackApi<{ ts?: string }>("chat.postMessage", { ...base, ...IDENTIDAD() });
  if (!r.ok && r.error === "missing_scope") r = await slackApi<{ ts?: string }>("chat.postMessage", base);
  return { ok: Boolean(r.ok), ts: r.ts, error: r.error };
}

export async function usuarioSlack(id: string): Promise<{ id: string; nombre: string; email: string | null; esBot: boolean; invitado?: boolean }> {
  const r = await slackApi<{ user?: { real_name?: string; name?: string; is_bot?: boolean; is_restricted?: boolean; is_ultra_restricted?: boolean; profile?: { email?: string; real_name?: string } } }>("users.info", { user: id }, true);
  const u = r.user;
  return { id, nombre: u?.profile?.real_name || u?.real_name || u?.name || id, email: u?.profile?.email || null, esBot: Boolean(u?.is_bot), invitado: u ? Boolean(u.is_restricted || u.is_ultra_restricted) : undefined };
}

// ── Proponer ───────────────────────────────────────────────────────────────────────────────────
export async function proponer(p: { cliente: string; tipo: TipoItem; titulo?: string; contenido: string; hilo?: string | null; nota?: string | null; datos?: Record<string, unknown> }): Promise<{ item: ItemMax; aviso?: string }> {
  const c = await leerCliente(p.cliente);
  // Límites con clientes: lo grave no llega ni a aprobación (Max lo reescribe); lo dudoso va con ⚠.
  const revision = VAN_AL_CLIENTE.includes(p.tipo) ? revisarParaCliente(`${p.titulo ?? ""}\n${p.contenido}`, p.tipo) : { bloqueos: [], alertas: [] };
  if (revision.bloqueos.length) throw new BloqueoMax(`No se puede proponer al cliente: ${revision.bloqueos.join(" · ")}. Reescríbelo.`);
  const i = await crearItem(p);
  const canal = CANAL_APROBACIONES();
  if (!canal) return { item: i, aviso: "Falta SLACK_MAX_CHANNEL_ID: la propuesta quedó guardada pero no llegó a #max-aprobaciones." };
  const r = await publicar(canal, textoAprobacion({ id: i.id, tipo: p.tipo, cliente: c?.nombre || p.cliente, titulo: p.titulo || "", contenido: p.contenido, nota: p.nota || undefined, alertas: revision.alertas }));
  if (r.ok && r.ts) await actualizarItem(i.id, { aprobacionTs: r.ts });
  return { item: i, aviso: r.ok ? undefined : `No pude postear en #max-aprobaciones (${r.error}).` };
}

// Nota de Max en el hilo de un ítem (o en un hilo cualquiera) de #max-aprobaciones.
export async function notaEnAprobaciones(texto: string, hilo?: string | null): Promise<boolean> {
  const canal = CANAL_APROBACIONES();
  if (!canal) return false;
  return (await publicar(canal, texto, hilo)).ok;
}

// ── Enviar al cliente lo aprobado ───────────────────────────────────────────────────────────────
export async function enviarAprobado(id: number): Promise<{ ok: boolean; texto: string }> {
  const i = await leerItem(id);
  if (!i) return { ok: false, texto: `No encuentro la #${id}.` };
  if (!VAN_AL_CLIENTE.includes(i.tipo)) return { ok: false, texto: `La #${id} (${i.tipo}) no se le envía al cliente.` };
  if (i.estado !== "aprobado") return { ok: false, texto: `La #${id} está ${i.estado}: solo se envía lo aprobado.` };
  const c = await leerCliente(i.cliente);
  if (!c?.canal) return { ok: false, texto: `Aprobada, pero no tengo vinculado el canal de ${c?.nombre || i.cliente}. En cuanto Max lo vincule se envía.` };
  if (!canalClientePermitido(c.canal)) return { ok: false, texto: `Aprobada, pero el canal de ${c.nombre} no está habilitado para Max (MAX_CANALES_CLIENTES). No se envió nada; cópiasela tú si quieres.` };
  const rev = revisarParaCliente(i.contenido, i.tipo);
  if (rev.bloqueos.length) return { ok: false, texto: `No la envié: ${rev.bloqueos.join(" · ")}.` };
  const r = await publicar(c.canal, textoParaCliente(i.contenido), i.hilo);
  if (!r.ok) return { ok: false, texto: `No pude enviarla al canal del cliente (${r.error}).` };
  await actualizarItem(id, { estado: "enviado", resultado: `enviado ${r.ts}` });
  await alBuzonMax(`${encabezadoBuzon("aprobacion", { evento: "enviado", item: `#${id}`, cliente: i.cliente, tipo: i.tipo })}\nYa le llegó al cliente lo aprobado (${i.titulo || i.tipo}). Sigue el proceso: actualiza la etapa y arranca el próximo paso.`);
  return { ok: true, texto: `✅ #${id} enviado a <#${c.canal}>.` };
}

// ── Decidir (Elvin o Carilin en #max-aprobaciones) ──────────────────────────────────────────────
export async function decidir(d: Decision, porSlackId: string): Promise<string> {
  const quien = APROBADORES()[porSlackId];
  if (!quien) return "Solo Elvin, Carilin o Jessica aprueban lo de Max.";
  const i = await leerItem(d.id);
  // "ok" sobre un ítem de publicar = autorización de publicar.
  const dec: Decision = d.accion === "aprobar" && i?.tipo === "publicar" ? { ...d, accion: "publicar" } : d;
  const v = validarDecision(dec, i);
  if (!v.ok || !i) return v.ok ? `No encuentro la #${d.id}.` : v.motivo;
  const nombre = NOMBRE_APROBADOR[quien] || quien;
  const cab = (evento: string) => encabezadoBuzon("aprobacion", { evento, item: `#${i.id}`, cliente: i.cliente, tipo: i.tipo, por: nombre, hilo: i.aprobacion_ts || undefined });

  if (dec.accion === "rechazar") {
    await actualizarItem(i.id, { estado: "rechazado", decididoPor: quien, decisionNota: dec.nota || "sin nota" });
    await alBuzonMax(`${cab("rechazado")}\nCorrección de ${nombre}: ${dec.nota || "(sin nota: pregúntale qué cambiar en el hilo)"}\n\nLo que habías propuesto («${i.titulo}»):\n${i.contenido.slice(0, 5000)}`);
    return `✋ Anotado: la #${i.id} no va${dec.nota ? "" : " (dime en este hilo qué cambio)"}. Max la corrige y la vuelve a subir.`;
  }

  if (dec.accion === "publicar") {
    if (!PUEDEN_PUBLICAR.includes(quien)) return `Publicar (prender pauta) es solo de Elvin o Carilin. La #${i.id} sigue esperando.`;
    await actualizarItem(i.id, { estado: "aprobado", decididoPor: quien, decisionNota: dec.nota || undefined });
    await alBuzonMax(`${cab("publicar")}\n${nombre} AUTORIZÓ publicar la #${i.id}${dec.nota ? ` (nota: ${dec.nota})` : ""}. Corre \`node scripts/meta-ads.mjs ${String(i.datos.marca || "cliente:" + i.cliente)} activar --item ${i.id}\` y confirma en el hilo con el estado real.`);
    return `🚀 Autorizado por ${nombre}. Max prende exactamente lo de la #${i.id} y confirma aquí con el estado real.`;
  }

  // aprobar
  const conCambio = okConCambio(dec.nota);
  await actualizarItem(i.id, { estado: "aprobado", decididoPor: quien, decisionNota: dec.nota || undefined });
  // Lo aprobado queda en la carpeta del cliente (Elvin, 24/sep): plan y estructura en Estrategia,
  // creativos en Creativos. Import diferido: drive.ts usa este módulo.
  const subDrive = !conCambio && ({ plan: "estrategia", campana: "estrategia", creativos: "creativos" } as Record<string, string>)[i.tipo];
  if (subDrive) {
    const drive = await import("./drive");
    if (drive.driveListo()) {
      await drive
        .guardarDoc(i.cliente, subDrive, `${i.titulo || i.tipo} · aprobado por ${nombre} (#${i.id})`, i.contenido)
        .then((doc) => actualizarItem(i.id, { datos: { drive: doc.url } }))
        .catch((e) => console.error("[max drive] aprobado", i.id, e instanceof Error ? e.message : e));
    }
  }
  if (VAN_AL_CLIENTE.includes(i.tipo)) {
    if (conCambio) {
      // "ok 7 pero cambia X": no se manda algo que nadie vio en su versión final.
      await actualizarItem(i.id, { estado: "rechazado" });
      await alBuzonMax(`${cab("ok-con-cambio")}\n${nombre} lo aprueba con este cambio: ${dec.nota}\nAplica SOLO ese cambio y vuelve a proponerlo (mismo tipo, mismo hilo del cliente) para el ok final.\n\nVersión anterior («${i.titulo}»):\n${i.contenido.slice(0, 5000)}`);
      return `👌 Va con tu cambio. Max lo ajusta y lo vuelve a subir para el ok final (así nada sale sin que lo veas).`;
    }
    const r = await enviarAprobado(i.id);
    return r.texto;
  }
  if (i.tipo === "campana") {
    await alBuzonMax(`${cab("montar")}\n${nombre} aprobó la estructura. Móntala EN PAUSA (borrador) con scripts/meta-ads.mjs y, cuando esté, sube el pedido de publicar con \`node scripts/meta-ads.mjs <marca|cliente:${i.cliente}> proponer-publicar <campaignIds> --cliente ${i.cliente}\`.${dec.nota ? ` Nota: ${dec.nota}` : ""}\n\nEstructura aprobada:\n${i.contenido.slice(0, 5000)}`);
    return `🧱 Aprobado. Max monta todo EN BORRADOR y sube aquí el "publica" con los ids.`;
  }
  await alBuzonMax(`${cab("ok")}\n${nombre} dijo que sí${dec.nota ? `: ${dec.nota}` : ""}. Sigue.\n\n(«${i.titulo}»)\n${i.contenido.slice(0, 3000)}`);
  return `👍 Anotado, Max sigue con la #${i.id}.`;
}

// ── Lecturas para Max (desde Railway no tiene por qué tener el token de Slack) ──────────────────
export async function leerCanal(canal: string, n = 30): Promise<string> {
  const r = await slackApi<{ messages?: { user?: string; bot_id?: string; username?: string; text?: string; ts?: string; thread_ts?: string; reply_count?: number; files?: { name?: string }[] }[] }>("conversations.history", { channel: canal, limit: Math.min(n, 100) }, true);
  if (!r.ok) return `No pude leer el canal (${r.error}). ¿Invitaron al bot?`;
  const nombres = new Map<string, string>();
  const lineas: string[] = [];
  for (const m of (r.messages ?? []).reverse()) {
    let quien = m.username || "bot";
    if (m.user) {
      if (!nombres.has(m.user)) nombres.set(m.user, (await usuarioSlack(m.user)).nombre);
      quien = nombres.get(m.user)!;
    }
    const fecha = new Date(Number(m.ts) * 1000).toLocaleString("es-PR", { timeZone: "America/Puerto_Rico", dateStyle: "short", timeStyle: "short" });
    const archivos = (m.files ?? []).map((f) => f.name).filter(Boolean);
    lineas.push(`[${fecha} · ts ${m.ts}${m.reply_count ? ` · ${m.reply_count} respuestas` : ""}] ${quien}: ${(m.text || "").slice(0, 1200)}${archivos.length ? ` (archivos: ${archivos.join(", ")})` : ""}`);
  }
  return lineas.join("\n") || "(canal vacío)";
}

export async function leerHilo(canal: string, ts: string): Promise<string> {
  const r = await slackApi<{ messages?: { user?: string; username?: string; text?: string; ts?: string }[] }>("conversations.replies", { channel: canal, ts, limit: 50 }, true);
  if (!r.ok) return `No pude leer el hilo (${r.error}).`;
  const out: string[] = [];
  for (const m of r.messages ?? []) out.push(`${m.user ? (await usuarioSlack(m.user)).nombre : m.username || "bot"}: ${(m.text || "").slice(0, 1500)}`);
  return out.join("\n");
}

// Canales privados donde está el bot (para vincular el canal de un cliente nuevo).
export async function canalesDelBot(): Promise<{ id: string; nombre: string; miembros: number }[]> {
  const out: { id: string; nombre: string; miembros: number }[] = [];
  let cursor = "";
  for (let v = 0; v < 10; v++) {
    const r = await slackApi<{ channels?: { id: string; name: string; num_members?: number }[]; response_metadata?: { next_cursor?: string } }>("users.conversations", { types: "private_channel,public_channel", limit: 200, exclude_archived: true, ...(cursor ? { cursor } : {}) }, true);
    if (!r.ok) break;
    for (const c of r.channels ?? []) out.push({ id: c.id, nombre: c.name, miembros: c.num_members ?? 0 });
    cursor = r.response_metadata?.next_cursor || "";
    if (!cursor) break;
  }
  return out;
}

// Resúmenes de llamadas (Fathom → #office-2-resumendellamadas) que mencionan a un cliente.
export async function buscarLlamadas(nombre: string, n = 200): Promise<string> {
  const canal = process.env.FATHOM_SLACK_CHANNEL_ID || "C0C3TCGCA07";
  const r = await slackApi<{ messages?: { text?: string; ts?: string }[] }>("conversations.history", { channel: canal, limit: Math.min(n, 200) }, true);
  if (!r.ok) return `No pude leer las llamadas (${r.error}).`;
  const claves = nombre.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter((x) => x.length >= 3);
  const hits = (r.messages ?? []).filter((m) => {
    const t = (m.text || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return claves.length && claves.filter((k) => t.includes(k)).length >= Math.min(2, claves.length);
  });
  return hits.slice(0, 3).map((m) => (m.text || "").slice(0, 6000)).join("\n\n———\n\n") || `No encontré llamadas de "${nombre}" en el canal de resúmenes.`;
}

// Publica los mensajes programados que ya vencieron (lo llama el cron cada 5 min).
export async function enviarProgramados(): Promise<{ enviados: number; fallidos: number }> {
  const { programadosVencidos, marcarProgramado } = await import("./repo");
  let enviados = 0, fallidos = 0;
  for (const m of await programadosVencidos()) {
    const r = await publicar(m.canal, m.texto);
    await marcarProgramado(m.id, r.ok ? null : r.error || "error");
    if (r.ok) enviados++; else fallidos++;
  }
  return { enviados, fallidos };
}
