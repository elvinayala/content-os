// Typeform de onboarding de Level Up → Pulse.
//   node --env-file=.env.local scripts/typeform.mjs webhook            registra/actualiza el webhook "pulse" en el form
//   node --env-file=.env.local scripts/typeform.mjs webhooks           lista los webhooks del form
//   node --env-file=.env.local scripts/typeform.mjs importar --desde 2026-09-18 [--real]
//        trae las respuestas desde esa fecha y las manda al endpoint (sin --real van al tablero Demo)
//   node --env-file=.env.local scripts/typeform.mjs probar [--url http://localhost:3000]
//        respuesta falsa firmada → tablero Demo
// Env: TYPEFORM_TOKEN (Personal token: forms:read, responses:read, webhooks:read/write),
//      TYPEFORM_WEBHOOK_SECRET, CONTENT_OS_URL (default prod).
import { createHmac } from "node:crypto";

const FORM = process.env.TYPEFORM_FORM_ID ?? "vlfCgUUP";
const TOKEN = process.env.TYPEFORM_TOKEN;
const SECRETO = process.env.TYPEFORM_WEBHOOK_SECRET;
const args = process.argv.slice(2);
const opt = (k) => (args.includes(k) ? args[args.indexOf(k) + 1] : undefined);
const BASE = (opt("--url") ?? process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app").replace(/\/$/, "");
const ENDPOINT = `${BASE}/api/pulse/typeform`;

async function tf(ruta, init = {}) {
  if (!TOKEN) throw new Error("Falta TYPEFORM_TOKEN (Typeform → Settings → Personal tokens)");
  const r = await fetch(`https://api.typeform.com${ruta}`, { ...init, headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });
  const t = await r.text();
  if (!r.ok) throw new Error(`Typeform ${r.status}: ${t.slice(0, 300)}`);
  return t ? JSON.parse(t) : {};
}

async function enviar(payload, prueba) {
  if (!SECRETO) throw new Error("Falta TYPEFORM_WEBHOOK_SECRET");
  const cuerpo = JSON.stringify(payload);
  const firma = "sha256=" + createHmac("sha256", SECRETO).update(cuerpo).digest("base64");
  const r = await fetch(ENDPOINT + (prueba ? "?prueba=1" : ""), { method: "POST", headers: { "Content-Type": "application/json", "Typeform-Signature": firma }, body: cuerpo });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}

const cmd = args[0];
if (cmd === "webhook") {
  if (!SECRETO) throw new Error("Falta TYPEFORM_WEBHOOK_SECRET");
  const url = `${process.env.CONTENT_OS_URL ?? "https://content-os-chi-seven.vercel.app"}/api/pulse/typeform`;
  const r = await tf(`/forms/${FORM}/webhooks/pulse`, { method: "PUT", body: JSON.stringify({ url, enabled: true, secret: SECRETO, verify_ssl: true }) });
  console.log(`✓ webhook "pulse" en ${FORM} → ${r.url} (activo: ${r.enabled})`);
} else if (cmd === "webhooks") {
  const r = await tf(`/forms/${FORM}/webhooks`);
  for (const w of r.items ?? []) console.log(`${w.tag.padEnd(12)} ${w.enabled ? "ON " : "off"} ${w.url}`);
} else if (cmd === "importar") {
  const desde = opt("--desde");
  if (!desde) throw new Error("Usá --desde YYYY-MM-DD");
  const real = args.includes("--real");
  let before;
  let total = 0;
  for (;;) {
    const q = new URLSearchParams({ page_size: "100", since: `${desde}T00:00:00Z`, completed: "true" });
    if (before) q.set("before", before);
    const r = await tf(`/forms/${FORM}/responses?${q}`);
    const items = r.items ?? [];
    if (!items.length) break;
    for (const it of items) {
      const payload = { event_id: `import-${it.token}`, event_type: "form_response", form_response: { form_id: FORM, token: it.token ?? it.response_id, submitted_at: it.submitted_at, answers: it.answers ?? [], definition: { fields: [] } } };
      const res = await enviar(payload, !real);
      total++;
      console.log(`${it.submitted_at?.slice(0, 10)} ${res.estado ?? res.error ?? res.status} · ${res.nombre ?? ""}`);
    }
    before = items[items.length - 1].token;
    if (items.length < 100) break;
  }
  console.log(`${total} respuestas procesadas ${real ? "en LEVEL UP MEDIA" : "en el tablero Demo (agregá --real para LEVEL UP MEDIA)"}`);
} else if (cmd === "probar") {
  const token = `prueba-${Date.now()}`;
  const payload = {
    event_id: token,
    event_type: "form_response",
    form_response: {
      form_id: FORM,
      token,
      submitted_at: new Date().toISOString(),
      definition: { fields: [] },
      answers: [
        { type: "text", field: { id: "0ymO5s4bXq16", ref: "2e77dbd2-8606-4d4f-ba3d-3b6902fdffb8" }, text: "Negocio de Prueba (borrar)" },
        { type: "text", field: { id: "9neHcWUCZ2Jd", ref: "05589d6e-370b-4610-873f-65ba28a494b2" }, text: "San Juan" },
        { type: "text", field: { id: "mCmCPUxBbPP5", ref: "4d707b84-7a3e-4f6a-987a-072939cb2ae5" }, text: "Prueba" },
        { type: "text", field: { id: "MoyuVD8WEjIm", ref: "8aca66dc-fb22-4cf1-9456-cc7b0b64ed05" }, text: "Typeform" },
        { type: "phone_number", field: { id: "WUpjHzhdUolW", ref: "359fc8d8-ba73-448b-baba-f6beb5b09b91" }, phone_number: "+17870000000" },
        { type: "email", field: { id: "fkL7Bsrg3bDb", ref: "8538ca59-7920-4962-ad45-20b40b1adec8" }, email: "prueba@pulse.sistema" },
        { type: "text", field: { id: "hH7Gis2sJnPd", ref: "c4b665b5-9c7d-4c69-953d-439a78ad5d2c" }, text: "Servicio de prueba" },
        { type: "choice", field: { id: "irCA5zdpvgvV", ref: "d0901918-6230-4632-b468-9cff68def885" }, choice: { label: "B2C" } },
        { type: "choice", field: { id: "tznZo5xq9F1x", ref: "d28172c9-32d6-47f0-88b5-53408e26206c" }, choice: { label: "Más ventas" } },
      ],
    },
  };
  console.log("1ª vez:", await enviar(payload, true));
  console.log("reintento (debe decir repetido):", await enviar(payload, true));
  const malo = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Typeform-Signature": "sha256=falsa" }, body: "{}" });
  console.log("firma falsa (debe ser 401):", malo.status);
} else {
  console.log("Uso: typeform.mjs webhook | webhooks | importar --desde YYYY-MM-DD [--real] | probar [--url …]");
}
