// Entrega los leads calificados (hot/qualified, o desde config.crm.exportarDesde)
// que aún no se exportaron: SIEMPRE genera el CSV; además Pipedrive o webhook
// según config.crm.adapter. Idempotente: marca crm.exportadoEl por cuenta.
//
// Entrega DIARIA: como máximo config.entrega.leadsPorDia por corrida (o --max N),
// primero los de mayor score; el resto queda en cola para los días siguientes.
// Adapter "drive": solo genera el CSV; el comando /victory-leads lo sube a la
// carpeta compartida de Google Drive como hoja del día.
//
// Uso: node scripts/victory-core/exportar.mjs [--reexportar] [--solo-csv] [--max N] [--cola]
// Env (opcional): PIPEDRIVE_VICTORY_TOKEN, PIPEDRIVE_VICTORY_DOMAIN,
//                 VICTORY_WEBHOOK_SECRET (firma HMAC del webhook).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHmac } from "node:crypto";

// Carga .env.local (sin dotenv) para que el script sirva igual desde la tarea
// programada, que corre sin el entorno del shell del usuario.
if (existsSync(".env.local")) {
  for (const l of readFileSync(".env.local", "utf8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"(.*)"$/, "$1").trim();
  }
}

const DIR = "data/victory-core";
const config = JSON.parse(readFileSync(`${DIR}/config.json`, "utf8"));
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const reexportar = process.argv.includes("--reexportar");
const soloCsv = process.argv.includes("--solo-csv");
const hoy = new Date().toISOString().slice(0, 10);

const orden = ["hot", "qualified", "nurture", "disqualified"];
const desde = orden.indexOf(config.crm.exportarDesde ?? "qualified");
const maxArg = process.argv.indexOf("--max");
const max = maxArg > -1 ? Number(process.argv[maxArg + 1]) : (config.entrega?.leadsPorDia ?? 25);
const enCola = store.cuentas.filter(
  (c) => c.calificacion && orden.indexOf(c.calificacion.segmento) <= desde && (reexportar || !c.crm?.exportadoEl),
);
const elegibles = enCola
  .sort((a, b) => orden.indexOf(a.calificacion.segmento) - orden.indexOf(b.calificacion.segmento) || b.calificacion.score - a.calificacion.score)
  .slice(0, max);
if (process.argv.includes("--cola")) { console.log(JSON.stringify({ enCola: enCola.length, leadsPorDia: max })); process.exit(0); }
if (!elegibles.length) { console.log("Nada nuevo para exportar."); process.exit(0); }
console.log(`En cola: ${enCola.length} · se entregan ${elegibles.length} (máx ${max}) · quedan ${enCola.length - elegibles.length}`);

// ---------- CSV ----------
const cols = ["segmento", "score", "empresa", "industria", "tipo_facility", "ciudad", "direccion", "web", "telefono_empresa",
  "contacto", "cargo", "rol", "email", "email_estado", "telefono_contacto", "telefono_estado", "linkedin",
  "n_locations", "matriz", "clasificacion", "rango_oportunidad", "senales", "razones", "brief", "fuentes", "encontrado_el"];
const esc = (v) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const filas = elegibles.map((c) => {
  const k = c.calificacion; const p = c.perfil ?? {};
  const ct = (c.contactos ?? []).find((x) => x.nombre === k.contactoPrincipal) ?? (c.contactos ?? [])[0] ?? {};
  const fuentes = [...new Set([c.fuente, p.fuente, ct.fuente].filter(Boolean))].join(" | ");
  return [k.segmento.toUpperCase(), k.score, c.nombre, c.industria, p.tipoFacility, c.ciudad, c.direccion, c.web, c.telefono,
    ct.nombre, ct.titulo, ct.rol, ct.email, ct.emailEstado, ct.telefono, ct.telefonoEstado, ct.linkedin,
    p.nLocations, p.matriz, p.clasificacion, k.rangoOportunidad ?? "unknown", (p.senales ?? []).join("; "), k.razones.join("; "),
    c.brief, fuentes, c.encontradoEl].map(esc).join(",");
});
mkdirSync(`${DIR}/exports`, { recursive: true });
const rutaCsv = `${DIR}/exports/leads-${hoy}.csv`;
writeFileSync(rutaCsv, [cols.join(","), ...filas].join("\n") + "\n");
console.log(`CSV: ${rutaCsv} (${elegibles.length} leads)`);

// ---------- Pipedrive ----------
async function pd(method, path, body) {
  const token = process.env.PIPEDRIVE_VICTORY_TOKEN;
  const dominio = process.env.PIPEDRIVE_VICTORY_DOMAIN ?? "api";
  const url = `https://${dominio}.pipedrive.com/v1/${path}${path.includes("?") ? "&" : "?"}api_token=${token}`;
  const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(10000) });
  const j = await r.json();
  if (!r.ok || j.success === false) throw new Error(`Pipedrive ${method} ${path}: ${j.error ?? r.status}`);
  return j.data;
}
async function etapaId() {
  if (config.crm.pipedrive.etapaId) return config.crm.pipedrive.etapaId;
  const stages = await pd("GET", "stages");
  const s = stages.find((x) => x.name.toLowerCase() === config.crm.pipedrive.etapa.toLowerCase());
  if (!s) throw new Error(`No existe la etapa "${config.crm.pipedrive.etapa}" en Pipedrive; créala o cambia config.crm.pipedrive.etapa`);
  config.crm.pipedrive.etapaId = s.id;
  return s.id;
}
async function aPipedrive(c) {
  const k = c.calificacion; const p = c.perfil ?? {};
  const ct = (c.contactos ?? []).find((x) => x.nombre === k.contactoPrincipal) ?? (c.contactos ?? [])[0];
  const orgs = await pd("GET", `organizations/search?term=${encodeURIComponent(c.nombre)}&exact_match=true`);
  const orgId = orgs?.items?.[0]?.item?.id ?? (await pd("POST", "organizations", { name: c.nombre, address: c.direccion })).id;
  let personId = null;
  if (ct?.nombre) {
    const ps = ct.email ? await pd("GET", `persons/search?term=${encodeURIComponent(ct.email)}&fields=email&exact_match=true`) : null;
    personId = ps?.items?.[0]?.item?.id ?? (await pd("POST", "persons", {
      name: ct.nombre, org_id: orgId,
      email: ct.email ? [{ value: ct.email, primary: true, label: "work" }] : undefined,
      phone: ct.telefono ? [{ value: ct.telefono, primary: true, label: "work" }] : undefined,
    })).id;
  }
  const abiertos = await pd("GET", `organizations/${orgId}/deals?status=open`);
  const titulo = `${c.nombre} — Janitorial (${k.segmento.toUpperCase()} ${k.score})`;
  const existente = (abiertos ?? []).find((d) => d.title.startsWith(`${c.nombre} — Janitorial`));
  const deal = existente ?? (await pd("POST", "deals", { title: titulo, org_id: orgId, person_id: personId, stage_id: await etapaId(), ...(config.crm.pipedrive.pipelineId ? { pipeline_id: config.crm.pipedrive.pipelineId } : {}) }));
  const nota = [
    `Score ${k.score} · ${k.segmento.toUpperCase()} · ${c.industria} · ${p.tipoFacility ?? "facility n/d"}`,
    ct ? `Contacto: ${ct.nombre} (${ct.titulo ?? ct.rol}) · ${ct.email ?? "sin email"} [${ct.emailEstado ?? "desconocido"}] · ${ct.telefono ?? "sin tel."} [${ct.telefonoEstado ?? "desconocido"}]` : "Sin decisor identificado",
    `Locations: ${p.nLocations ?? "n/d"} · Matriz: ${p.matriz ?? "n/d"} · Rango: ${k.rangoOportunidad ?? "unknown"} · Señales: ${(p.senales ?? []).join(", ") || "ninguna"}`,
    c.brief ? `\n${c.brief}` : "",
    `\nFuentes: ${[c.fuente, p.fuente, ct?.fuente].filter(Boolean).join(" | ")} · ${c.encontradoEl}`,
  ].join("\n");
  await pd("POST", "notes", { content: nota.replace(/\n/g, "<br>"), deal_id: deal.id, pinned_to_deal_flag: 1 });
  return { adapter: "pipedrive", id: deal.id };
}

// ---------- Webhook (CRM propio vía Zapier/Make/API) ----------
async function aWebhook(c) {
  const body = JSON.stringify({ evento: "QualifiedLeadCreated", cuenta: c });
  const secret = process.env.VICTORY_WEBHOOK_SECRET ?? "";
  const firma = secret ? createHmac("sha256", secret).update(body).digest("hex") : undefined;
  const r = await fetch(config.crm.webhookUrl, { method: "POST", headers: { "Content-Type": "application/json", ...(firma ? { "x-firma": firma } : {}) }, body, signal: AbortSignal.timeout(10000) });
  if (!r.ok) throw new Error(`Webhook ${r.status}`);
  return { adapter: "webhook", id: null };
}

let ok = 0, fallos = 0;
// `crm.adapters` (lista) o `crm.adapter` (uno). "drive" y "csv" no hacen nada
// aquí (el CSV ya está; la hoja la sube el comando). Se pueden combinar:
// ["pipedrive", "drive"] = deal en Pipedrive + hoja del día.
const adapters = soloCsv ? ["csv"] : (config.crm.adapters ?? [config.crm.adapter ?? "csv"]);
const activos = adapters.filter((a) => a === "pipedrive" || a === "webhook");
for (const c of elegibles) {
  try {
    let res = { adapter: adapters.join("+"), id: null };
    for (const a of activos) {
      if (a === "pipedrive") {
        if (!process.env.PIPEDRIVE_VICTORY_TOKEN) throw new Error("Falta PIPEDRIVE_VICTORY_TOKEN");
        const r = await aPipedrive(c);
        res = { ...res, pipedriveId: r.id };
      } else if (a === "webhook") {
        if (!config.crm.webhookUrl) throw new Error("Falta config.crm.webhookUrl");
        await aWebhook(c);
      }
    }
    c.crm = { ...res, exportadoEl: hoy, archivo: rutaCsv };
    c.etapa = "exportada";
    ok++;
  } catch (e) {
    fallos++;
    c.crm = { ...(c.crm ?? {}), error: String(e.message ?? e).slice(0, 300) };
    console.error(`✗ ${c.nombre}: ${e.message}`);
  }
}
store.actualizadoEl = new Date().toISOString();
writeFileSync(`${DIR}/cuentas.json`, JSON.stringify(store, null, 2) + "\n");
writeFileSync(`${DIR}/config.json`, JSON.stringify(config, null, 2) + "\n");
console.log(`Exportadas ${ok} (${adapters.join("+")}); fallos ${fallos}.`);
