/**
 * Alertas nativas de "Resuelto Pro" (la app de iPhone/Android de los plomeros). Suenan y vibran aunque el celular esté
 * bloqueado, como Uber. Android → Firebase Cloud Messaging (FCM v1, FIREBASE_SERVICE_ACCOUNT_JSON). iPhone → Apple
 * directo (APNs, llave .p8: APNS_KEY_P8 + APNS_KEY_ID + APNS_TEAM_ID; el plugin de Capacitor da el token de Apple).
 * Sin esas variables no envía nada (queda en consola) y todo lo demás sigue igual: web push + texto.
 * La app registra su token en POST /api/pro/dispositivo al entrar.
 */
import fs from "node:fs";
import http2 from "node:http2";
import crypto from "node:crypto";
import path from "node:path";
import { google } from "googleapis";
import { RAIZ } from "./almacen.js";
import type { Aviso } from "./push.js";

type Disp = { proveedorId: string; token: string; plataforma: "ios" | "android" | "otro"; creado: string };
const ARCH = path.join(RAIZ, "data", "estado", "dispositivos.json");
const leer = (): Disp[] => { try { return JSON.parse(fs.readFileSync(ARCH, "utf8")); } catch { return []; } };
const guardar = (l: Disp[]) => { fs.mkdirSync(path.dirname(ARCH), { recursive: true }); fs.writeFileSync(ARCH + ".tmp", JSON.stringify(l, null, 2)); fs.renameSync(ARCH + ".tmp", ARCH); };

export function registrar(proveedorId: string, token: string, plataforma: string) {
  const t = String(token ?? "").trim(); if (t.length < 20 || t.length > 4096) return false;
  const p = plataforma === "ios" || plataforma === "android" ? plataforma : "otro";
  guardar([...leer().filter((d) => d.token !== t), { proveedorId, token: t, plataforma: p, creado: new Date().toISOString() }]);
  return true;
}
export const cuantos = (proveedorId: string) => leer().filter((d) => d.proveedorId === proveedorId).length;

let cuenta: { project_id: string; client_email: string; private_key: string } | null | undefined;
function credenciales() {
  if (cuenta !== undefined) return cuenta;
  try { cuenta = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : null; } catch { cuenta = null; }
  return cuenta;
}
export const configurado = () => !!credenciales();
let jwt: InstanceType<typeof google.auth.JWT> | null = null;
async function tokenAcceso() {
  const c = credenciales()!;
  jwt ??= new google.auth.JWT({ email: c.client_email, key: c.private_key, scopes: ["https://www.googleapis.com/auth/firebase.messaging"] });
  return (await jwt.authorize()).access_token!;
}

/** Mensaje FCM v1 para una oferta/aviso. Puro (tests): urgente = sonido de alerta + prioridad alta. */
export function mensajeFcm(token: string, a: Aviso) {
  return {
    message: {
      token,
      notification: { title: a.titulo, body: a.cuerpo },
      data: { url: a.url, tag: a.tag ?? "", ofertaId: a.ofertaId ?? "" },
      android: { priority: "HIGH", notification: { channel_id: a.urgente ? "trabajos" : "general", sound: a.urgente ? "alerta" : "default", tag: a.tag } },
      apns: { headers: { "apns-priority": "10" }, payload: { aps: { sound: a.urgente ? "alerta.caf" : "default", "interruption-level": a.urgente ? "time-sensitive" : "active", "thread-id": a.tag } } },
    },
  };
}

// ── iPhone: APNs con la llave .p8 (token JWT ES256, dura 1 h; se renueva a los 50 min) ──
const apns = () => (process.env.APNS_KEY_P8 && process.env.APNS_KEY_ID && process.env.APNS_TEAM_ID ? { key: process.env.APNS_KEY_P8.replace(/\\n/g, "\n"), kid: process.env.APNS_KEY_ID, team: process.env.APNS_TEAM_ID, bundle: process.env.APNS_BUNDLE || "pr.resuelto.pro", host: process.env.APNS_ENTORNO === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com" } : null);
let jwtApns: { t: string; en: number } | null = null;
function tokenApns(c: NonNullable<ReturnType<typeof apns>>) {
  if (jwtApns && Date.now() - jwtApns.en < 50 * 60_000) return jwtApns.t;
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const cuerpo = `${b64({ alg: "ES256", kid: c.kid })}.${b64({ iss: c.team, iat: Math.floor(Date.now() / 1000) })}`;
  const firma = crypto.sign("sha256", Buffer.from(cuerpo), { key: c.key, dsaEncoding: "ieee-p1363" }).toString("base64url");
  jwtApns = { t: `${cuerpo}.${firma}`, en: Date.now() }; return jwtApns.t;
}
/** Payload de APNs. Puro (tests). */
export function mensajeApns(a: Aviso) {
  return { aps: { alert: { title: a.titulo, body: a.cuerpo }, sound: a.urgente ? "alerta.caf" : "default", "interruption-level": a.urgente ? "time-sensitive" : "active", "thread-id": a.tag ?? "resuelto" }, url: a.url, ofertaId: a.ofertaId ?? "" };
}
function enviarApns(c: NonNullable<ReturnType<typeof apns>>, token: string, a: Aviso): Promise<"ok" | "muerto" | "error"> {
  return new Promise((listo) => {
    const s = http2.connect(c.host); s.on("error", () => listo("error"));
    const r = s.request({ ":method": "POST", ":path": `/3/device/${token}`, authorization: `bearer ${tokenApns(c)}`, "apns-topic": c.bundle, "apns-push-type": "alert", "apns-priority": "10" });
    let estado = 0, txt = ""; r.on("response", (h) => { estado = Number(h[":status"]); }); r.on("data", (d) => { txt += d; });
    r.on("end", () => { s.close(); if (estado === 200) listo("ok"); else if (estado === 410 || /BadDeviceToken|Unregistered/.test(txt)) listo("muerto"); else { console.error("APNs", estado, txt.slice(0, 200)); listo("error"); } });
    r.on("error", () => { s.close(); listo("error"); });
    r.end(JSON.stringify(mensajeApns(a)));
  });
}

export async function enviar(proveedorId: string, a: Aviso): Promise<number> {
  const mios = leer().filter((d) => d.proveedorId === proveedorId);
  if (!mios.length) return 0;
  let ok = 0; const muertos = new Set<string>();
  const ios = mios.filter((d) => d.plataforma === "ios"), resto = mios.filter((d) => d.plataforma !== "ios");
  const ca = apns();
  if (ios.length && !ca) console.log(`[push iPhone simulado → ${proveedorId}] ${a.titulo}`);
  if (ios.length && ca) for (const d of ios) { const r = await enviarApns(ca, d.token, a); if (r === "ok") ok++; else if (r === "muerto") muertos.add(d.token); }
  if (resto.length && !configurado()) console.log(`[push Android simulado → ${proveedorId}] ${a.titulo}`);
  if (resto.length && configurado()) {
    const c = credenciales()!;
    const acceso = await tokenAcceso().catch((e) => { console.error("FCM auth", e?.message); return null; });
    if (acceso) await Promise.all(resto.map(async (d) => {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${c.project_id}/messages:send`, { method: "POST", headers: { Authorization: `Bearer ${acceso}`, "Content-Type": "application/json" }, body: JSON.stringify(mensajeFcm(d.token, a)) }).catch(() => null);
      if (r?.ok) { ok++; return; }
      const txt = r ? await r.text() : "";
      if (r && (r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(txt))) muertos.add(d.token); else console.error("FCM", proveedorId, r?.status, txt.slice(0, 200));
    }));
  }
  if (muertos.size) guardar(leer().filter((d) => !muertos.has(d.token)));
  return ok;
}
