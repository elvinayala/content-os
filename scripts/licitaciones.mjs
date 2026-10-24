#!/usr/bin/env node
// Gabo — el licitador (licita a nombre de `empresa.nombre` del pipeline: Digital Seed Ventures LLC desde el
// 19/oct/2026). Lleva el pipeline de subastas/RFP del gobierno de PR
// (data/licitaciones/pipeline.json) y arma el mensaje para Elvin: qué hay, cuánto está en juego,
// cuándo cierra y qué necesito de él. El cerebro y la rutina están en
// vault/proyectos/licitaciones/cerebro-gabo.md y .claude/commands/licitar.md.
//
//   node scripts/licitaciones.mjs lista [estado]                 pipeline ordenado por cierre
//   node scripts/licitaciones.mjs ver <id>                       una oportunidad completa
//   node scripts/licitaciones.mjs estado <id> <estado> [nota]    mover (nueva|analizando|preparando|lista|sometida|ganada|perdida|descartada)
//   node scripts/licitaciones.mjs doc <docId> <tiene|tramite|no|desconocido> [--vence AAAA-MM-DD]
//   node scripts/licitaciones.mjs validar                        revisa el JSON (ids, fechas, estados)
//   node scripts/licitaciones.mjs mensaje                        imprime el mensaje para Elvin
//   node scripts/licitaciones.mjs enviar                         se lo manda (Telegram + espejo Slack, firma Gabo)

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARCHIVO = path.join(ROOT, "data/licitaciones/pipeline.json");

export const ESTADOS = ["nueva", "analizando", "preparando", "lista", "sometida", "ganada", "perdida", "descartada"];
export const ACTIVOS = ["nueva", "analizando", "preparando", "lista"];
// Parte el mensaje por bloques (líneas en blanco) sin pasar de `max` caracteres por parte.
export function partirMensaje(texto, max = 3700) {
  const partes = [];
  let actual = "";
  for (const bloque of texto.split(/\n\n+/)) {
    const junto = actual ? `${actual}\n\n${bloque}` : bloque;
    if (junto.length <= max) { actual = junto; continue; }
    if (actual) partes.push(actual);
    actual = bloque.length <= max ? bloque : bloque.slice(0, max);
  }
  if (actual) partes.push(actual);
  return partes;
}
export const ESTADOS_DOC =["tiene", "tramite", "no", "desconocido"];

// Días enteros desde `hoy` (AAAA-MM-DD) hasta la fecha de cierre (AAAA-MM-DD o ISO). Negativo = ya cerró.
export function diasPara(cierre, hoy) {
  if (!cierre) return null;
  const a = Date.UTC(...hoy.slice(0, 10).split("-").map((n, i) => (i === 1 ? n - 1 : +n)));
  const b = Date.UTC(...cierre.slice(0, 10).split("-").map((n, i) => (i === 1 ? n - 1 : +n)));
  return Math.round((b - a) / 86400000);
}

// Documentos obligatorios de la oportunidad que la empresa no tiene listos para la fecha de cierre.
export function bloqueos(op, documentos = []) {
  const porId = Object.fromEntries(documentos.map((d) => [d.id, d]));
  return (op.requiere || []).flatMap((id) => {
    const d = porId[id];
    if (!d) return [{ id, nombre: id, motivo: "no está en la lista de documentos" }];
    if (d.estado !== "tiene") return [{ id, nombre: d.nombre, motivo: { tramite: "en trámite", no: "no lo tenemos" }[d.estado] || "sin confirmar" }];
    if (d.vence && op.cierre && d.vence.slice(0, 10) < op.cierre.slice(0, 10)) return [{ id, nombre: d.nombre, motivo: `vence el ${d.vence.slice(0, 10)}, antes del cierre` }];
    return [];
  });
}

// "Municipio de Bayamón" → "Bayamón"; "Oficina de Gerencia y Presupuesto (OGP)" → "OGP".
export function agenciaCorta(a = "") {
  const sigla = a.match(/\(([A-ZÁÉÍÓÚÑ]{2,})\)/);
  if (sigla) return sigla[1];
  return a.replace(/^Municipio de /, "").replace(/^Departamento de (la |el )?/, "Depto. ").replace(/^Corporación de (la )?/, "Corp. ").replace(/ de Puerto Rico$/, "");
}

export function dinero(n) {
  if (n == null) return "?";
  return n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;
}

function monto(op) {
  const m = op.monto || {};
  if (m.min == null && m.max == null) return "monto por confirmar";
  const r = m.min != null && m.max != null && m.min !== m.max ? `${dinero(m.min)}–${dinero(m.max)}` : dinero(m.max ?? m.min);
  return `${r}${m.base ? ` (${m.base})` : ""}`;
}

// El mensaje del día para Elvin: corto, lo que necesito de él al frente (Elvin: "en resumen breve").
// Primero la que más chance tenemos de ganar (encaje); a igual encaje, la que cierra antes. Van con todo el
// detalle las que estamos preparando y hasta completar `detalle` (2) con las de más encaje; las demás, en una línea.
export function mensajeElvin(p, hoy, { detalle = 2 } = {}) {
  const activas = (p.oportunidades || [])
    .filter((o) => ACTIVOS.includes(o.estado))
    .map((o) => ({ ...o, dias: diasPara(o.cierre, hoy) }))
    .filter((o) => o.dias == null || o.dias >= 0)
    .sort((a, b) => (b.encaje ?? 0) - (a.encaje ?? 0) || (a.dias ?? 999) - (b.dias ?? 999));
  const enJuego = activas.reduce((s, o) => s + (o.monto?.max ?? o.monto?.min ?? 0), 0);
  const empresa = p.empresa?.nombre || "la empresa";
  const L = [`🏛️ Licitaciones · ${hoy}`, `${activas.length} oportunidad(es) activas · hasta ${dinero(enJuego)} en juego para ${empresa}`];
  const enDetalle = new Set(activas.filter((o) => ["preparando", "lista"].includes(o.estado)).map((o) => o.id));
  activas.filter((o) => !enDetalle.has(o.id)).slice(0, Math.max(0, detalle - enDetalle.size)).forEach((o) => enDetalle.add(o.id));
  const resto = activas.filter((o) => !enDetalle.has(o.id));
  activas.filter((o) => enDetalle.has(o.id)).forEach((o, i) => {
    L.push("", `${i + 1}) ${o.titulo} — ${o.agencia}`);
    L.push(`   Cierra: ${o.cierre ? o.cierre.slice(0, 10) : "sin fecha"}${o.dias != null ? ` (${o.dias} días)` : ""} · ${monto(o)} · encaje ${o.encaje ?? "?"}/100 · ${o.estado}`);
    if (o.porQue) L.push(`   Por qué: ${o.porQue}`);
    const b = bloqueos(o, p.documentos);
    if (b.length) L.push(`   ⛔ Falta: ${b.map((x) => `${x.nombre} (${x.motivo})`).join("; ")}`);
    const pide = (o.necesitoDeElvin || []).filter((n) => !n.hecho);
    if (pide.length) {
      L.push("   Necesito de ti:");
      pide.forEach((n) => L.push(`   • ${n.que}${n.para ? ` — para ${n.para}` : ""}`));
    }
    if (o.proximoPaso) L.push(`   Lo próximo que hago yo: ${o.proximoPaso}`);
  });
  if (resto.length) {
    // En el radar solo van las preguntas que son decisión de Elvin; bajar contratos públicos y preparar
    // borradores no necesita su OK (eso lo hace Gabo solo), así que no se repite en cada línea.
    L.push("", `También en el radar (${resto.length}):`);
    resto.forEach((o) => {
      const pide = (o.necesitoDeElvin || []).find((n) => !n.hecho && n.tipo !== "presentarme" && n.que.includes("?"));
      const que = pide && (pide.que.length > 80 ? `${pide.que.slice(0, 79).trimEnd()}…` : pide.que);
      L.push(`• ${agenciaCorta(o.agencia)} · ${o.titulo.replace(/ \(contrato que vence\)$/, "").replace(/^Servicios de /, "")} · ${dinero(o.monto?.max ?? o.monto?.min)} · ${o.dias != null ? `${o.dias} días` : "sin fecha"} · encaje ${o.encaje ?? "?"}${que ? ` → ${que}` : ""}`);
    });
    L.push("Dime a cuáles me presento y les preparo el diagnóstico y la propuesta de 1 página.");
  }
  const faltan = (p.documentos || []).filter((d) => d.estado !== "tiene" && d.clave);
  const corto = (d) => d.nombre.split(" · ")[0].split(" (")[0];
  if (faltan.length) L.push("", `📋 Documentos clave de ${empresa} sin confirmar (${faltan.length}): ${faltan.map(corto).join(" · ")}`);
  if (!activas.length) L.push("", "Hoy no hay nada abierto que nos convenga. Sigo vigilando.");
  return L.join("\n");
}

export function validar(p) {
  const errores = [];
  const ids = new Set();
  for (const o of p.oportunidades || []) {
    if (!o.id) errores.push("oportunidad sin id");
    else if (ids.has(o.id)) errores.push(`id repetido: ${o.id}`);
    ids.add(o.id);
    if (!ESTADOS.includes(o.estado)) errores.push(`${o.id}: estado inválido "${o.estado}"`);
    if (o.cierre && !/^\d{4}-\d{2}-\d{2}/.test(o.cierre)) errores.push(`${o.id}: cierre no es AAAA-MM-DD`);
  }
  for (const d of p.documentos || []) if (!ESTADOS_DOC.includes(d.estado)) errores.push(`doc ${d.id}: estado inválido "${d.estado}"`);
  return errores;
}

function hoyPR() {
  return new Date(Date.now() - 4 * 3600000).toISOString().slice(0, 10);
}
const leer = () => JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
function guardar(p) {
  p.actualizadoEl = hoyPR();
  fs.writeFileSync(ARCHIVO, JSON.stringify(p, null, 2) + "\n");
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const p = leer();
  const hoy = hoyPR();
  if (cmd === "lista") {
    const filtro = rest[0];
    (p.oportunidades || [])
      .filter((o) => (filtro ? o.estado === filtro : o.estado !== "descartada"))
      .sort((a, b) => (a.cierre || "9").localeCompare(b.cierre || "9"))
      .forEach((o) => console.log(`${(o.cierre || "sin fecha").slice(0, 10)} | ${o.estado.padEnd(10)} | ${String(o.encaje ?? "?").padStart(3)} | ${monto(o).padEnd(28)} | ${o.id} · ${o.titulo}`));
  } else if (cmd === "ver") {
    const o = (p.oportunidades || []).find((x) => x.id === rest[0]);
    if (!o) throw new Error(`No existe ${rest[0]}`);
    console.log(JSON.stringify({ ...o, dias: diasPara(o.cierre, hoy), bloqueos: bloqueos(o, p.documentos) }, null, 2));
  } else if (cmd === "estado") {
    const [id, estado, ...nota] = rest;
    const o = (p.oportunidades || []).find((x) => x.id === id);
    if (!o) throw new Error(`No existe ${id}`);
    if (!ESTADOS.includes(estado)) throw new Error(`Estado inválido. Usa: ${ESTADOS.join(" | ")}`);
    (o.historial ||= []).push({ fecha: hoy, de: o.estado, a: estado, nota: nota.join(" ") || undefined });
    o.estado = estado;
    guardar(p);
    console.log(`✓ ${id} → ${estado}`);
  } else if (cmd === "doc") {
    const [id, estado] = rest;
    const d = (p.documentos || []).find((x) => x.id === id);
    if (!d) throw new Error(`No existe el documento ${id}. Hay: ${(p.documentos || []).map((x) => x.id).join(", ")}`);
    if (!ESTADOS_DOC.includes(estado)) throw new Error(`Estado inválido. Usa: ${ESTADOS_DOC.join(" | ")}`);
    d.estado = estado;
    const i = rest.indexOf("--vence");
    if (i >= 0) d.vence = rest[i + 1];
    guardar(p);
    console.log(`✓ ${d.nombre}: ${estado}${d.vence ? ` (vence ${d.vence})` : ""}`);
  } else if (cmd === "validar") {
    const e = validar(p);
    console.log(e.length ? e.map((x) => `✖ ${x}`).join("\n") : `✓ pipeline válido (${(p.oportunidades || []).length} oportunidades)`);
    if (e.length) process.exit(1);
  } else if (cmd === "mensaje") {
    console.log(mensajeElvin(p, hoy));
  } else if (cmd === "enviar") {
    // agentes.mjs elvin corta en 3,900 caracteres (Telegram): se manda por partes, una oportunidad entera por bloque.
    const partes = partirMensaje(mensajeElvin(p, hoy));
    partes.forEach((texto, i) => {
      const cuerpo = partes.length > 1 ? `${texto}\n\n(${i + 1}/${partes.length})` : texto;
      execFileSync("node", [path.join(ROOT, "scripts/agentes.mjs"), "elvin", cuerpo], { stdio: "inherit", env: { ...process.env, AGENTE: "gabo" } });
    });
  } else {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").filter((l) => l.startsWith("//")).map((l) => l.slice(3)).join("\n"));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`✖ ${e.message}`);
    process.exit(1);
  });
}
