// Cruza el dataset de braveleads/leads-finder (JSON array en disco) con las
// cuentas por dominio, mapea título → rol (config.decisores.titulos) y guarda
// hasta maxPorCuenta contactos por cuenta. Tolera nombres de campo distintos.
//
// Uso: node scripts/victory-core/contactos.mjs <dataset.json>
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "data/victory-core";
const ruta = process.argv[2];
if (!ruta) { console.error("Uso: contactos.mjs <dataset.json>"); process.exit(1); }
const config = JSON.parse(readFileSync(`${DIR}/config.json`, "utf8"));
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const items = JSON.parse(readFileSync(ruta, "utf8"));
const hoy = new Date().toISOString().slice(0, 10);
const max = config.decisores.busquedaApify.maxPorCuenta ?? 3;

// Primer valor no vacío entre varias claves posibles (los actores cambian nombres).
const pick = (o, ...keys) => { for (const k of keys) { const v = k.split(".").reduce((a, p) => (a == null ? a : a[p]), o); if (v != null && v !== "") return v; } return null; };
const dom = (s) => { if (!s) return null; try { return new URL(String(s).startsWith("http") ? s : `https://${s}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return String(s).toLowerCase(); } };
export const rolDe = (titulo, tax = config.decisores.titulos, prioridad = config.decisores.prioridad) => {
  const t = (titulo ?? "").toLowerCase();
  for (const rol of prioridad) if ((tax[rol] ?? []).some((p) => t.includes(p))) return rol;
  return null;
};
const estadoEmail = (it) => {
  const s = String(pick(it, "email_status", "emailStatus", "email_verified", "emailVerified", "email_status_v2") ?? "").toLowerCase();
  if (["verified", "valid", "true"].includes(s)) return "verificado";
  if (["invalid", "bounced"].includes(s)) return "invalido";
  return "no_verificado";
};

const porDominio = new Map(store.cuentas.map((c) => [c.dominio, c]));
const candidatos = new Map();
const stats = { items: items.length, sinDominio: 0, sinCuenta: 0, sinRol: 0, agregados: 0, cuentasTocadas: new Set() };
for (const it of items) {
  const d = dom(pick(it, "company_domain", "companyDomain", "organization.website_url", "organization.primary_domain", "website", "domain", "company_website", "organization_website", "organizationWebsite"));
  if (!d) { stats.sinDominio++; continue; }
  const cuenta = porDominio.get(d);
  if (!cuenta) { stats.sinCuenta++; continue; }
  // Tamaño de la empresa según el proveedor: evidencia "conocida" (no la inventa Claude).
  const size = pick(it, "organizationSize", "organization.estimated_num_employees", "employee_count");
  if (cuenta.perfil && cuenta.perfil.empleadosEst == null && size != null && Number(size) > 0) {
    cuenta.perfil.empleadosEst = Number(size);
    cuenta.perfil.empleadosFuente = "apify:braveleads (organizationSize)";
  }
  const titulo = pick(it, "title", "job_title", "headline", "position");
  const rol = rolDe(titulo);
  if (!rol) { stats.sinRol++; continue; }
  const nombre = pick(it, "name", "full_name", "fullName") ?? [pick(it, "first_name", "firstName"), pick(it, "last_name", "lastName")].filter(Boolean).join(" ");
  if (!nombre) continue;
  if (cuenta.contactos.some((c) => c.nombre === nombre)) continue;
  const email = pick(it, "email", "work_email", "business_email");
  const tel = pick(it, "phone", "phone_number", "mobile_phone", "work_phone", "organization.phone");
  (candidatos.get(cuenta.id) ?? candidatos.set(cuenta.id, []).get(cuenta.id)).push({
    nombre, titulo, rol, email, emailEstado: email ? estadoEmail(it) : "desconocido",
    telefono: tel, telefonoEstado: tel ? "conocido" : "desconocido",
    linkedin: pick(it, "linkedin_url", "linkedinUrl", "linkedin"), fuente: "apify:braveleads", fecha: hoy,
  });
}
// Se quedan los `max` mejores por prioridad de rol (no los primeros del dataset);
// a igual rol, primero el que tiene email y teléfono.
const prioridad = config.decisores.prioridad;
const peso = (c) => prioridad.indexOf(c.rol) * 10 - (c.email ? 2 : 0) - (c.telefono ? 1 : 0);
for (const [id, lista] of candidatos) {
  const cuenta = store.cuentas.find((c) => c.id === id);
  const elegidos = lista.sort((a, b) => peso(a) - peso(b)).slice(0, Math.max(0, max - cuenta.contactos.length));
  cuenta.contactos.push(...elegidos);
  stats.agregados += elegidos.length; stats.cuentasTocadas.add(id);
}
store.actualizadoEl = new Date().toISOString();
writeFileSync(`${DIR}/cuentas.json`, JSON.stringify(store, null, 2) + "\n");
console.log(JSON.stringify({ ...stats, cuentasTocadas: stats.cuentasTocadas.size }));
if (items[0]) console.log("Campos del primer item:", Object.keys(items[0]).slice(0, 40).join(", "));
