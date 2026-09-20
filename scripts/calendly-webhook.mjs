#!/usr/bin/env node
// Registra (o lista/borra) la suscripción de webhook de Calendly que manda las
// citas de los closers a /api/calendly (→ Pipedrive CLOSERS).
//
//   CALENDLY_TOKEN=... node scripts/calendly-webhook.mjs crear [url]
//   CALENDLY_TOKEN=... node scripts/calendly-webhook.mjs listar
//   CALENDLY_TOKEN=... node scripts/calendly-webhook.mjs borrar <uri>
//   CALENDLY_TOKEN=... node scripts/calendly-webhook.mjs info      (org, usuarios, event types)
//
// Al crear, imprime la signing_key: guardala en Vercel como
// CALENDLY_WEBHOOK_SIGNING_KEY (la route la usa para validar la firma).

const TOKEN = process.env.CALENDLY_TOKEN;
if (!TOKEN) {
  console.error("Falta CALENDLY_TOKEN (personal access token de Calendly)");
  process.exit(1);
}
const URL_DEFAULT = "https://content-os-chi-seven.vercel.app/api/calendly";

async function api(path, init = {}) {
  const res = await fetch(`https://api.calendly.com${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}

const me = (await api("/users/me")).resource;
const org = me.current_organization;

const [cmd, arg] = process.argv.slice(2);

if (cmd === "info") {
  console.log("Usuario:", me.name, me.email, "\nOrg:", org);
  const users = await api(`/organization_memberships?organization=${encodeURIComponent(org)}&count=100`);
  console.log("\nMiembros:");
  for (const m of users.collection) console.log(" -", m.user.name, "|", m.user.email, "|", m.role);
  const ets = await api(`/event_types?organization=${encodeURIComponent(org)}&count=100&active=true`);
  console.log("\nEvent types activos:");
  for (const e of ets.collection) console.log(" -", e.name, "|", e.duration, "min |", e.profile?.name, "|", e.scheduling_url);
} else if (cmd === "listar") {
  const r = await api(`/webhook_subscriptions?organization=${encodeURIComponent(org)}&scope=organization&count=100`);
  for (const w of r.collection) console.log(w.state, "|", w.callback_url, "|", w.events.join(","), "|", w.uri);
  if (!r.collection.length) console.log("(sin webhooks a nivel organización)");
} else if (cmd === "borrar") {
  if (!arg) throw new Error("Falta la uri del webhook");
  await api(arg.replace("https://api.calendly.com", ""), { method: "DELETE" });
  console.log("Borrado", arg);
} else if (cmd === "crear") {
  const url = arg ?? URL_DEFAULT;
  // Evitar duplicados: si ya hay uno activo a esta URL, no crear otro.
  const existentes = await api(`/webhook_subscriptions?organization=${encodeURIComponent(org)}&scope=organization&count=100`);
  const dup = existentes.collection.find((w) => w.callback_url === url && w.state === "active");
  if (dup) {
    console.log("Ya existe un webhook activo a", url, "→", dup.uri, "(borralo primero si querés rotar la signing key)");
    process.exit(0);
  }
  const signingKey = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const r = await api("/webhook_subscriptions", {
    method: "POST",
    body: JSON.stringify({
      url,
      events: ["invitee.created", "invitee.canceled"],
      organization: org,
      scope: "organization",
      signing_key: signingKey,
    }),
  });
  console.log("Webhook creado:", r.resource.uri, "\nURL:", r.resource.callback_url, "\nEventos:", r.resource.events.join(", "));
  console.log("\nSIGNING KEY (guardar en Vercel como CALENDLY_WEBHOOK_SIGNING_KEY):");
  console.log(signingKey);
} else {
  console.log("Uso: info | listar | crear [url] | borrar <uri>");
}
