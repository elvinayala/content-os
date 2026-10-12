// "Una plantilla, mil videos" (Elvin, 12/oct/2026): una tabla (CSV de Excel/Sheets, o JSON) + un guion plantilla con
// {{columna}} → un guion por fila, listo para la fábrica de Remi. Lógica pura (sin red ni disco): tests/remi-lote.test.mjs.
//   Plantilla: cualquier texto del guion puede llevar {{Nombre}}, {{servicio}}, {{foto|https://…}} (valor por defecto tras |).
//   Las columnas se buscan sin importar mayúsculas, acentos ni espacios ({{Nombre del cliente}} = {{nombre_del_cliente}}).
//   Un {{campo}} que la tabla no tiene, o vacío y sin defecto, es ERROR de esa fila: nunca sale un video con huecos.

/** Normaliza un nombre de columna: "Nombre del Cliente" → "nombredelcliente". */
export const clave = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** slug para ids: "Café Ana #2" → "cafe-ana-2". */
export const slug = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/** CSV/TSV → filas (objetos). Detecta , ; o tab; respeta comillas ("a, b", "dijo ""hola"""); quita BOM y filas vacías. */
export function leerCSV(texto) {
  const t = String(texto ?? "").replace(/^﻿/, "");
  const primera = t.split(/\r?\n/, 1)[0] ?? "";
  const cuenta = (c) => primera.split(c).length - 1;
  const sep = [",", ";", "\t"].sort((a, b) => cuenta(b) - cuenta(a))[0];
  const filas = [];
  let fila = [], celda = "", comillas = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (comillas) {
      if (ch === '"' && t[i + 1] === '"') { celda += '"'; i++; }
      else if (ch === '"') comillas = false;
      else celda += ch;
    } else if (ch === '"' && celda === "") comillas = true;
    else if (ch === sep) { fila.push(celda); celda = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      fila.push(celda); filas.push(fila); fila = []; celda = "";
    } else celda += ch;
  }
  if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
  const [cab, ...resto] = filas.filter((f) => f.some((c) => c.trim() !== ""));
  if (!cab) return [];
  const nombres = cab.map((c) => c.trim());
  return resto.map((f) => Object.fromEntries(nombres.map((n, j) => [n, (f[j] ?? "").trim()])));
}

/** Los {{campos}} que usa una plantilla (normalizados, sin repetir). obligatorios: solo los que no traen |defecto. */
export function camposDe(plantilla, { obligatorios = false } = {}) {
  const s = new Set();
  JSON.stringify(plantilla).replace(/\{\{\s*([^}|]+?)\s*(\|[^}]*)?\}\}/g, (_, c, def) => { if (!obligatorios || !def) s.add(clave(c)); return ""; });
  return [...s];
}

/** Rellena la plantilla con una fila. Devuelve { guion, faltan: [campo…] }. No toca la plantilla original. */
export function rellenar(plantilla, fila) {
  const porClave = Object.fromEntries(Object.entries(fila).map(([k, v]) => [clave(k), v]));
  const faltan = new Set();
  const sustituir = (texto) => texto.replace(/\{\{\s*([^}|]+?)\s*(?:\|([^}]*))?\}\}/g, (_, campo, defecto) => {
    const v = porClave[clave(campo)];
    if (v !== undefined && String(v).trim() !== "") return String(v).trim();
    if (defecto !== undefined) return defecto.trim();
    faltan.add(campo.trim());
    return "";
  });
  const recorrer = (x) => typeof x === "string" ? sustituir(x) : Array.isArray(x) ? x.map(recorrer) : x && typeof x === "object" ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, recorrer(v)])) : x;
  return { guion: recorrer(plantilla), faltan: [...faltan] };
}

/**
 * Arma el lote. opciones: { idColumna?: string (columna que nombra cada video; si no, la 1.ª columna), max?: number (tope, 50) }.
 * Devuelve { guiones, errores: [{ fila (1 = primera fila de datos), motivo }], columnasSobran, camposSinColumna }.
 */
export function armarLote(plantilla, filas, opciones = {}) {
  const max = opciones.max ?? 50;
  const errores = [];
  if (!plantilla || typeof plantilla !== "object" || !Array.isArray(plantilla.escenas)) return { guiones: [], errores: [{ fila: 0, motivo: "la plantilla no es un guion (falta escenas)" }], columnasSobran: [], camposSinColumna: [] };
  if (!filas.length) return { guiones: [], errores: [{ fila: 0, motivo: "la tabla no tiene filas" }], columnasSobran: [], camposSinColumna: [] };
  if (filas.length > max) return { guiones: [], errores: [{ fila: 0, motivo: `la tabla tiene ${filas.length} filas y el tope es ${max} (usa --max)` }], columnasSobran: [], camposSinColumna: [] };
  const columnas = Object.keys(filas[0]);
  const campos = camposDe(plantilla);
  const camposSinColumna = camposDe(plantilla, { obligatorios: true }).filter((c) => !columnas.some((k) => clave(k) === c));
  const columnasSobran = columnas.filter((k) => !campos.includes(clave(k)));
  const colId = opciones.idColumna ? columnas.find((k) => clave(k) === clave(opciones.idColumna)) : columnas[0];
  if (opciones.idColumna && !colId) errores.push({ fila: 0, motivo: `no hay columna "${opciones.idColumna}"` });
  const base = slug(plantilla.id || "lote") || "lote";
  const usados = new Set();
  const guiones = [];
  filas.forEach((fila, i) => {
    const { guion, faltan } = rellenar(plantilla, fila);
    if (faltan.length) { errores.push({ fila: i + 1, motivo: `vacío o sin columna: ${faltan.join(", ")}` }); return; }
    let id = `${base}-${slug(colId ? fila[colId] : "") || String(i + 1)}`;
    for (let n = 2; usados.has(id); n++) id = `${base}-${slug(colId ? fila[colId] : "") || i + 1}-${n}`;
    usados.add(id);
    guion.id = id;
    guiones.push(guion);
  });
  return { guiones, errores, columnasSobran, camposSinColumna };
}
