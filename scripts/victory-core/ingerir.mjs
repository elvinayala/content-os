// Ingesta el dataset de compass/crawler-google-places (JSON array guardado en
// disco) en cuentas.json: filtra por territorio/exclusiones/filtros, normaliza
// dominio y teléfono, deduplica por placeId/dominio/teléfono y agrega los nuevos
// con etapa "descubierta". Sin red, sin IA.
//
// Uso: node scripts/victory-core/ingerir.mjs <dataset.json> <industriaId> <territorioId> [costoUsd]
import { readFileSync, writeFileSync } from "node:fs";

const DIR = "data/victory-core";
const [, , ruta, industriaId, territorioId, costoArg] = process.argv;
if (!ruta || !industriaId || !territorioId) { console.error("Uso: ingerir.mjs <dataset.json> <industriaId> <territorioId> [costoUsd]"); process.exit(1); }
const config = JSON.parse(readFileSync(`${DIR}/config.json`, "utf8"));
const store = JSON.parse(readFileSync(`${DIR}/cuentas.json`, "utf8"));
const items = JSON.parse(readFileSync(ruta, "utf8"));
const territorio = config.territorios.find((t) => t.id === territorioId);
if (!territorio) { console.error(`Territorio ${territorioId} no existe en config`); process.exit(1); }
const hoy = new Date().toISOString().slice(0, 10);

export const dominioDe = (web) => {
  if (!web) return null;
  try { return new URL(web.startsWith("http") ? web : `https://${web}`).hostname.replace(/^www\./, "").toLowerCase(); } catch { return null; }
};
export const telefonoDe = (t) => {
  const d = String(t ?? "").replace(/\D/g, "");
  if (!d) return null;
  return d.length === 10 ? `+1${d}` : d.length === 11 && d.startsWith("1") ? `+${d}` : `+${d}`;
};
const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);

const excl = (config.excluir?.categoriasMaps ?? []).map((x) => x.toLowerCase());
const ciudades = (territorio.ciudades ?? []).map((c) => c.toLowerCase());
const f = config.filtros;
const stats = { total: items.length, fueraTerritorio: 0, excluida: 0, filtros: 0, duplicada: 0, nuevas: 0 };
const vistos = { placeId: new Set(), dominio: new Set(), telefono: new Set() };
for (const c of store.cuentas) { vistos.placeId.add(c.placeId); if (c.dominio) vistos.dominio.add(c.dominio); if (c.telefono) vistos.telefono.add(c.telefono); }

const nuevas = [];
for (const it of items) {
  const ciudad = (it.city ?? "").toLowerCase();
  const enTerritorio = ciudades.length === 0 || ciudades.includes(ciudad) || ciudades.some((c) => (it.address ?? "").toLowerCase().includes(c));
  if (!enTerritorio) { stats.fueraTerritorio++; continue; }
  const cat = (it.categoryName ?? "").toLowerCase();
  if (excl.some((x) => cat.includes(x))) { stats.excluida++; continue; }
  const dominio = dominioDe(it.website);
  const telefono = telefonoDe(it.phone);
  if ((f.requiereWeb && !dominio) || (f.requiereTelefono && !telefono) || (it.reviewsCount ?? 0) < (f.minResenas ?? 0)) { stats.filtros++; continue; }
  if (vistos.placeId.has(it.placeId) || (dominio && vistos.dominio.has(dominio)) || (telefono && vistos.telefono.has(telefono))) { stats.duplicada++; continue; }
  vistos.placeId.add(it.placeId); if (dominio) vistos.dominio.add(dominio); if (telefono) vistos.telefono.add(telefono);
  nuevas.push({
    id: `${slug(it.title)}-${(it.placeId ?? "").slice(-6).toLowerCase()}`,
    placeId: it.placeId, nombre: it.title, dominio, web: it.website ?? null, telefono, telefonoEstado: telefono ? "conocido" : "desconocido",
    direccion: it.address ?? null, ciudad: it.city ?? null, zip: it.postalCode ?? null, territorio: territorioId, industria: industriaId,
    categoriaMaps: it.categoryName ?? null, rating: it.totalScore ?? null, resenas: it.reviewsCount ?? 0,
    emailsWeb: it.emails ?? [], linkedinEmpresa: (it.linkedIns ?? [])[0] ?? null,
    fuente: "apify:google-places", encontradoEl: hoy, etapa: "descubierta", perfil: null, contactos: [], calificacion: null, brief: null,
    crm: { adapter: null, id: null, exportadoEl: null },
  });
}
stats.nuevas = nuevas.length;
store.cuentas.push(...nuevas);
store.actualizadoEl = new Date().toISOString();
writeFileSync(`${DIR}/cuentas.json`, JSON.stringify(store, null, 2) + "\n");
if (costoArg) {
  config.corridas.push({ fecha: hoy, industria: industriaId, territorio: territorioId, descubiertas: items.length, nuevas: nuevas.length, costoUsd: Number(costoArg) });
  writeFileSync(`${DIR}/config.json`, JSON.stringify(config, null, 2) + "\n");
}
console.log(JSON.stringify(stats));
console.log("Nuevas:", nuevas.map((n) => `${n.id} (${n.dominio})`).join(", ") || "ninguna");
