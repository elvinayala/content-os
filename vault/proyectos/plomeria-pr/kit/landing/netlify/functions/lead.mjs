// Recibe los formularios de resueltopr.com (plomeros, contratistas, lista de espera)
// y crea/actualiza el contacto en la sub-cuenta de GHL de Resuelto, con etiquetas,
// campos personalizados y oportunidad en el pipeline que corresponde.
// El token vive en las variables de entorno de Netlify (GHL_TOKEN), nunca en el navegador.
const BASE = "https://services.leadconnectorhq.com";
const L = "GzQT638S6w7qi4dnZoU9";
const CAMPOS = { tipo: "IRmSBcEMCfVZ8G32oRnu", municipio: "SstPB2YELhAHFkDf09aS", fuente: "D7HtJfDicdJcUwSmG1G3", licencia: "kxMqn3Js5ZHz4UQFmj76", nivel: "mk050wiSRocqOnK81XZP", daco: "EbWUOcGzTVut1TfLgioC", seguro: "NpYcAOYMB6UjK3bYkUtQ", categorias: "fmNRJRHloDPwwBV7O2B3", vehiculo: "Q03CTWQGrBcZHm9skZka", nivelVerified: "XVk5x6sbjfE6yZqOebiU", estadoProveedor: "0TQvRXx8uNwXS5IhHFvh", notas: "Ny40mCem17rm6xsL2fL3" };
const PIPE = {
  plomeros: { id: "yzCPsNrmo9Er4RwVSkIn", etapa: "9e4b2405-59fe-4422-ba20-06fcfdd93d73" },
  contratistas: { id: "1jGHX6nqiUkgAipcudLp", etapa: "f55ee56f-e955-4982-9a52-eb2e6e572feb" },
};
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };
const H = (tok) => ({ Authorization: `Bearer ${tok}`, Version: "2021-07-28", "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Mozilla/5.0 (Resuelto lead function)" });

const tel = (v) => { const d = String(v || "").replace(/\D/g, ""); if (!d) return ""; if (d.length === 10) return "+1" + d; if (d.length === 11 && d.startsWith("1")) return "+" + d; return "+" + d; };
const nombre = (v) => { const p = String(v || "").trim().split(/\s+/); return { firstName: p[0] || "Sin nombre", lastName: p.slice(1).join(" ") }; };
const nivelLic = (v = "") => /maestro/i.test(v) ? "Maestro" : /oficial/i.test(v) ? "Oficial" : /aprendiz|tr[aá]mite/i.test(v) ? "Aprendiz" : "";
const vehiculo = (v = "") => /m[aá]quina/i.test(v) && !/sin/i.test(v) ? "Sí, completo" : /sin m[aá]quina/i.test(v) ? "Parcial" : /ninguno/i.test(v) ? "No" : "";
const seguro = (v = "") => /^s[ií]/i.test(v) ? "Sí" : /tr[aá]mite/i.test(v) ? "En trámite" : /^no/i.test(v) ? "No" : "";
const CATS = { banos: "Baños", baños: "Baños", cocinas: "Cocinas", pisos: "Pisos", puertas: "Puertas y ventanas", ventanas: "Puertas y ventanas", remodelacion: "Remodelación general", remodelación: "Remodelación general", piscinas: "Piscinas", exteriores: "Exteriores", poda: "Poda / árboles", arboles: "Poda / árboles", árboles: "Poda / árboles" };
const categorias = (arr) => [...new Set((Array.isArray(arr) ? arr : String(arr || "").split(",")).map((c) => { const k = String(c).trim().toLowerCase(); return Object.entries(CATS).find(([kk]) => k.includes(kk))?.[1]; }).filter(Boolean))];

export default async (req) => {
  if (req.method === "OPTIONS") return new Response("", { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("Método no permitido", { status: 405, headers: CORS });
  const tok = process.env.GHL_TOKEN;
  if (!tok) return Response.json({ ok: false, error: "GHL_TOKEN no configurado" }, { status: 500, headers: CORS });
  let d; try { d = await req.json(); } catch { return Response.json({ ok: false, error: "JSON inválido" }, { status: 400, headers: CORS }); }
  if (d.web || d.honey) return Response.json({ ok: true }, { headers: CORS }); // honeypot

  const origen = String(d.origen || "landing");
  const esPlomero = origen === "landing-plomeros", esContratista = origen === "landing-contratistas";
  const cf = (id, value) => (value ? { id, value } : null);
  const custom = [
    cf(CAMPOS.tipo, esPlomero ? "Plomero" : esContratista ? "Contratista" : "Cliente plomería"),
    cf(CAMPOS.municipio, d.municipio || d.zonas || ""),
    cf(CAMPOS.fuente, "Web"),
    esPlomero && cf(CAMPOS.licencia, d.licencia),
    esPlomero && cf(CAMPOS.nivel, nivelLic(d.nivel)),
    esPlomero && cf(CAMPOS.vehiculo, vehiculo(d.equipo)),
    esContratista && cf(CAMPOS.daco, d.daco),
    esContratista && cf(CAMPOS.seguro, seguro(d.seguro)),
    esContratista && categorias(d.categorias).length ? { id: CAMPOS.categorias, value: categorias(d.categorias) } : null,
    esContratista && cf(CAMPOS.nivelVerified, "Candidato"),
    (esPlomero || esContratista) && cf(CAMPOS.estadoProveedor, "Aplicó"),
    cf(CAMPOS.notas, [d.disponibilidad && `Disponibilidad: ${d.disponibilidad}`, d.experiencia && `Experiencia: ${d.experiencia}`, d.capacidad && `Capacidad: ${d.capacidad}`, d.empresa && `Empresa: ${d.empresa}`, d.portfolio && `Portfolio: ${d.portfolio}`, d.nivel && `Nivel (texto): ${d.nivel}`, d.equipo && `Equipo (texto): ${d.equipo}`, `Origen: ${origen} · ${d.fecha || new Date().toISOString()}`].filter(Boolean).join("\n")),
  ].filter(Boolean);
  const tags = esPlomero ? ["plomero", "candidato"] : esContratista ? ["contratista", "candidato"] : ["cliente", "lista-espera"];

  const body = { locationId: L, ...nombre(d.nombre), phone: tel(d.whatsapp || d.telefono), tags, source: origen, customFields: custom };
  if (d.email) body.email = d.email;
  const r = await fetch(`${BASE}/contacts/upsert`, { method: "POST", headers: H(tok), body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return Response.json({ ok: false, error: "GHL upsert", detalle: j }, { status: 502, headers: CORS });
  const contactId = j.contact?.id;

  let oportunidad = null;
  const pipe = esPlomero ? PIPE.plomeros : esContratista ? PIPE.contratistas : null;
  if (pipe && contactId) {
    const o = await fetch(`${BASE}/opportunities/`, { method: "POST", headers: H(tok), body: JSON.stringify({ pipelineId: pipe.id, locationId: L, name: `${body.firstName} ${body.lastName}`.trim() + (d.municipio ? ` · ${d.municipio}` : ""), pipelineStageId: pipe.etapa, status: "open", contactId, source: origen }) });
    oportunidad = (await o.json().catch(() => ({}))).opportunity?.id ?? null;
  }
  return Response.json({ ok: true, contactId, oportunidad }, { headers: CORS });
};

export const config = { path: "/api/lead" };
