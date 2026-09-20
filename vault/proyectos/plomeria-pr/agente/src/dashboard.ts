/**
 * Tablero por cotizador (Fase 7): visitas → propuestas → cierres → close rate → GMV → ticket →
 * depósitos → aprobaciones pedidas (proxy de error de estimación) → encuestas → recovery.
 * Sale de los datos reales del almacén; nada se reporta a mano por WhatsApp.
 */
import fs from "node:fs";
import path from "node:path";
import { RAIZ, almacen, type Proyecto } from "./almacen.js";
import { colaRecovery } from "./encuestas.js";

const $ = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + "%" : "–");
const CERRADOS = new Set(["cerrado", "asignado", "en-ejecucion", "inspeccion", "completado"]);
const VISITADOS = new Set(["visita-realizada", "propuesta", "aprobacion-pendiente", "pendiente-deposito", ...CERRADOS]);

export function metricasPor(cotizadorId: string, desde?: Date) {
  const ps = almacen.proyectos().filter((p) => p.cotizadorId === cotizadorId && (!desde || new Date(p.creado) >= desde));
  const visitas = ps.filter((p) => p.visita).length;
  const realizadas = ps.filter((p) => VISITADOS.has(p.estado)).length;
  const propuestas = ps.filter((p) => p.cotizacion).length;
  const cerrados = ps.filter((p) => CERRADOS.has(p.estado));
  const gmv = cerrados.reduce((s, p) => s + (p.cotizacion?.precioFinal ?? 0), 0);
  const depositos = cerrados.reduce((s, p) => s + (p.cotizacion?.hitos?.[0]?.monto ?? 0), 0);
  const aprobaciones = ps.filter((p) => p.cotizacion?.requiereAprobacion).length;
  const enc = ps.map((p) => p.encuesta).filter((e) => e?.completadaEn);
  const prom = (k: "profesional" | "explicoBien" | "cotizacionClara") => { const v = enc.map((e) => e![k]).filter((x): x is number => typeof x === "number"); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : "–"; };
  const margen = cerrados.length ? cerrados.reduce((s, p) => s + (p.cotizacion?.margenFinal ?? 0), 0) / cerrados.length : 0;
  return { visitas, realizadas, propuestas, cerrados: cerrados.length, closeRate: pct(cerrados.length, realizadas), gmv, ticket: cerrados.length ? gmv / cerrados.length : 0, depositos, margen, aprobaciones, encuestas: enc.length, profesional: prom("profesional"), explico: prom("explicoBien"), claridad: prom("cotizacionClara"), llegoTarde: enc.filter((e) => e!.llegoATiempo === false).length, alertas: enc.filter((e) => e!.problemaRepresentante).length, recovery: ps.filter((p) => p.encuesta?.senalRecovery).length, recuperados: ps.filter((p) => p.encuesta?.recovery?.resultado === "recuperado").length, perdidos: Object.entries(ps.filter((p) => p.encuesta?.motivoNoContrato && !CERRADOS.has(p.estado)).reduce<Record<string, number>>((m, p) => { const k = p.encuesta!.motivoNoContrato!; m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]) };
}

export function dashboardHTML(): string {
  const cots = (JSON.parse(fs.readFileSync(path.join(RAIZ, "data", "cotizadores.json"), "utf8")) as any).cotizadores as { id: string; nombre: string }[];
  const ids = new Set([...cots.map((c) => c.id), ...almacen.proyectos().map((p) => p.cotizadorId).filter((x): x is string => !!x)]);
  const nombre = (id: string) => cots.find((c) => c.id === id)?.nombre ?? id;
  const mes = new Date(); mes.setDate(1); mes.setHours(0, 0, 0, 0);
  const filas = [...ids].map((id) => ({ id, t: metricasPor(id), m: metricasPor(id, mes) }));
  const todos = almacen.proyectos();
  const porCat = Object.entries(todos.filter((p) => CERRADOS.has(p.estado)).reduce<Record<string, { n: number; gmv: number; margen: number }>>((m, p) => { const k = p.categoriaId; m[k] = m[k] ?? { n: 0, gmv: 0, margen: 0 }; m[k].n++; m[k].gmv += p.cotizacion?.precioFinal ?? 0; m[k].margen += p.cotizacion?.margenFinal ?? 0; return m; }, {}));
  const embudo = { leads: todos.length, precalificados: todos.filter((p) => p.estado !== "descartado").length, visitas: todos.filter((p) => p.visita).length, realizadas: todos.filter((p) => VISITADOS.has(p.estado)).length, propuestas: todos.filter((p) => p.cotizacion).length, cerrados: todos.filter((p) => CERRADOS.has(p.estado)).length };
  const cola = colaRecovery();
  const celda = (t: ReturnType<typeof metricasPor>) => `<td>${t.visitas}</td><td>${t.realizadas}</td><td>${t.propuestas}</td><td><b>${t.cerrados}</b></td><td>${t.closeRate}</td><td>${$(t.gmv)}</td><td>${$(t.ticket)}</td><td>${$(t.depositos)}</td><td>${t.cerrados ? Math.round(t.margen * 1000) / 10 + "%" : "–"}</td><td>${t.aprobaciones}</td><td>${t.encuestas ? `${t.profesional} · ${t.explico} · ${t.claridad}` : "–"}</td><td>${t.llegoTarde || t.alertas ? `<span class="rojo">${t.llegoTarde} tarde · ${t.alertas} alertas</span>` : "0"}</td><td>${t.recovery} / ${t.recuperados}</td>`;
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resuelto · Tablero</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@700;800&family=DM+Sans:wght@400;500;600&display=swap"><style>
body{font-family:'DM Sans',system-ui,sans-serif;background:#FBF7F0;color:#08243A;margin:0;padding:24px;font-size:14px}h1{font-family:Sora;color:#0F3D5E;font-size:22px;margin:0 0 4px}h2{font-family:Sora;color:#0F3D5E;font-size:15px;margin:26px 0 8px}
.peq{color:#5C6670;font-size:12.5px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:14px;overflow:hidden;font-variant-numeric:tabular-nums}th{background:#0F3D5E;color:#fff;text-align:left;padding:9px 10px;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}td{padding:9px 10px;border-bottom:1px solid #EEE9E0;white-space:nowrap}
.emb{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}.emb div{background:#fff;border-radius:14px;padding:14px}.emb b{display:block;font-family:Sora;font-size:26px;color:#0F3D5E}.emb small{color:#5C6670;font-size:12px}.rojo{color:#B94A24;font-weight:600}.wrap{overflow-x:auto}
</style></head><body>
<h1>Resuelto · Tablero de cotizadores</h1><div class="peq">${new Date().toLocaleString("es-PR", { timeZone: "America/Puerto_Rico" })} · datos del almacén, sin reportes manuales</div>
<h2>Embudo (todo)</h2><div class="emb"><div><b>${embudo.leads}</b><small>leads</small></div><div><b>${embudo.precalificados}</b><small>precalificados</small></div><div><b>${embudo.visitas}</b><small>visitas agendadas</small></div><div><b>${embudo.realizadas}</b><small>visitas realizadas</small></div><div><b>${embudo.propuestas}</b><small>propuestas</small></div><div><b>${embudo.cerrados}</b><small>cerrados · ${pct(embudo.cerrados, embudo.realizadas)}</small></div></div>
<h2>Por cotizador · este mes / total</h2><div class="wrap"><table><tr><th>Cotizador</th><th></th><th>Visitas</th><th>Realiz.</th><th>Prop.</th><th>Cierres</th><th>Close</th><th>GMV</th><th>Ticket</th><th>Depósitos</th><th>Margen</th><th>Aprob.</th><th>Prof · Expl · Clar</th><th>Puntualidad</th><th>Recovery / recup.</th></tr>
${filas.map((f) => `<tr><td rowspan="2"><b>${nombre(f.id)}</b></td><td class="peq">mes</td>${celda(f.m)}</tr><tr><td class="peq">total</td>${celda(f.t)}</tr>`).join("") || `<tr><td colspan="15" class="peq">Sin cotizadores con proyectos todavía.</td></tr>`}</table></div>
<div class="peq" style="margin-top:6px">Aprob. = propuestas que pidieron aprobación de precio (proxy de presión sobre el margen). Prof/Expl/Clar = promedio 1–5 de la encuesta post-visita.</div>
<h2>Por categoría (cerrados)</h2><table><tr><th>Categoría</th><th>Proyectos</th><th>GMV</th><th>Ticket</th><th>Margen prom.</th></tr>${porCat.map(([k, v]) => `<tr><td>${k}</td><td>${v.n}</td><td>${$(v.gmv)}</td><td>${$(v.gmv / v.n)}</td><td>${Math.round((v.margen / v.n) * 1000) / 10}%</td></tr>`).join("") || `<tr><td colspan="5" class="peq">Sin cierres todavía.</td></tr>`}</table>
<h2>Motivos de pérdida</h2><table><tr><th>Motivo</th><th>Casos</th></tr>${Object.entries(todos.filter((p) => p.encuesta?.motivoNoContrato && !CERRADOS.has(p.estado)).reduce<Record<string, number>>((m, p) => { const k = p.encuesta!.motivoNoContrato!; m[k] = (m[k] ?? 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<tr><td>${k}</td><td>${n}</td></tr>`).join("") || `<tr><td colspan="2" class="peq">Sin encuestas completadas.</td></tr>`}</table>
<h2>Cola de Recovery (${cola.length})</h2><table><tr><th>Proyecto</th><th>Cliente</th><th>Precio</th><th>Motivo</th><th>Señales</th><th>Llamadas</th><th>Cotizador</th></tr>${cola.map((p) => `<tr><td><b>${p.id}</b></td><td>${p.nombre} · ${p.telefono}</td><td>${$(p.cotizacion?.precioFinal ?? 0)}</td><td>${p.encuesta?.motivoNoContrato ?? "–"}</td><td>${[p.encuesta?.estaComparando ? "comparando" : "", p.encuesta?.interesFinanciamiento ? "financiamiento" : ""].filter(Boolean).join(", ") || "–"}</td><td>${p.encuesta?.recovery?.llamadas ?? 0}</td><td>${p.cotizadorId ?? "–"}</td></tr>`).join("") || `<tr><td colspan="7" class="peq">Nadie en recovery.</td></tr>`}</table>
</body></html>`;
}
