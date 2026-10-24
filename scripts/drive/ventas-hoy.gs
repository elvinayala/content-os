/**
 * Ventas del día (Elvin, 27/sep/2026): lee las hojas de ventas de tesorería de Level Up y AI Borinquen
 * para el resumen de las 8:30 PM por Telegram (/api/cron/resumen-dia). Las hojas son privadas: este
 * script corre con TU cuenta (que ya las puede abrir) y solo devuelve la pestaña del mes que se le pide
 * de ESTAS DOS hojas, con una clave secreta.
 *
 * Desde el 24/oct también ESCRIBE (Elvin: "que se automatice su hoja de Excel de ventas con Arena"): cada venta que la
 * tesorera registra en Ritmo → Arena se añade como fila en la pestaña del mes ("agregar"), y si la borra en Ritmo se
 * quita esa misma fila ("quitar"). Solo toca filas que tienen su "ID Ritmo" (columna que se añade al final del
 * encabezado la primera vez); nunca borra ni cambia filas escritas a mano. Las columnas se buscan por nombre con las
 * reglas que manda Ritmo (COLUMNAS_HOJA en lib/ventas/registro-reglas.ts). Si ya lo habías publicado, hay que
 * actualizarlo: Implementar → Gestionar implementaciones → editar → Versión nueva → Implementar (la URL no cambia).
 *
 * Cómo publicarlo (una sola vez), con la copia personalizada que te pasa Claude (ya trae SECRETO_FIJO):
 *  1. script.google.com (con elvin@levelupmediapr.net) → Nuevo proyecto → borra lo que hay, pega el archivo
 *     completo → guarda con el nombre "Ventas del día".
 *  2. Implementar → Nueva implementación → tipo "Aplicación web" → Ejecutar como: Yo · Quién tiene acceso:
 *     Cualquier persona → Implementar → Autorizar acceso → copia la URL que termina en /exec y pásasela a Claude.
 */

var SECRETO_FIJO = ""; // la copia personalizada lo trae lleno; este archivo del repo nunca lleva la clave

// Dónde se ESCRIBEN las ventas de Ritmo. Por defecto, las mismas hojas que se leen; si la hoja viva de la tesorera es
// otra (la de Level Up se llama "COPIA RESPALDO"), pon aquí su id.
var HOJAS_ESCRIBIR = {};

var HOJAS = {
  level_up: "1a44rg368MURNEqIDTrtU5jxCbBMhZ8ah-fGPSTNpQg0", // COPIA RESPALDO - VENTAS 2026 LEVEL UP
  ai_borinquen: "1A99WUgPFouujA-26K90VCA7PuuEWQAL5PHFMjKIQkQ8", // VENTAS - IA BORINQUEN
};

function doPost(e) {
  var b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { return json_({ ok: false, error: "json" }); }
  var secreto = PropertiesService.getScriptProperties().getProperty("SECRETO") || SECRETO_FIJO;
  if (!secreto || b.secreto !== secreto) return json_({ ok: false, error: "no-autorizado" });
  try {
    if (b.accion === "salud") return json_({ ok: true });
    if (b.accion === "hoja") return json_(hoja_(b));
    if (b.accion === "agregar") return json_(conCandado_(function () { return agregar_(b); }));
    if (b.accion === "quitar") return json_(conCandado_(function () { return quitar_(b); }));
    return json_({ ok: false, error: "accion" });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function norm_(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

// b.marca = "level_up" | "ai_borinquen"; b.buscar = nombres posibles de la pestaña ("lum sales septiembre 2026").
function hoja_(b) {
  var p = pestana_(HOJAS[b.marca], b.buscar);
  if (p.error) return { ok: false, error: p.error };
  return { ok: true, pestana: p.hoja.getName(), filas: p.hoja.getDataRange().getDisplayValues() };
}

function pestana_(id, buscarCrudo) {
  if (!id) return { error: "marca" };
  var hojas = SpreadsheetApp.openById(id).getSheets();
  var buscar = (buscarCrudo || []).map(norm_);
  var elegida = null;
  for (var i = 0; i < buscar.length && !elegida; i++) {
    for (var j = 0; j < hojas.length; j++) if (norm_(hojas[j].getName()) === buscar[i]) { elegida = hojas[j]; break; }
    if (!elegida) for (var k = 0; k < hojas.length; k++) if (norm_(hojas[k].getName()).indexOf(buscar[i]) >= 0) { elegida = hojas[k]; break; }
  }
  if (!elegida) return { error: "no encontré la pestaña del mes (" + (buscarCrudo || []).join(" / ") + ")" };
  return { hoja: elegida };
}

function conCandado_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

// El encabezado: la primera de las 15 primeras filas que tiene "Fecha". Devuelve su número (1-based) y la columna de
// "ID Ritmo" (la crea al final si no existe).
function encabezado_(sh, crearId) {
  var top = sh.getRange(1, 1, Math.min(15, Math.max(1, sh.getLastRow())), Math.max(1, sh.getLastColumn())).getDisplayValues();
  for (var r = 0; r < top.length; r++) {
    if (!top[r].some(function (c) { return /^fecha/.test(norm_(c)); })) continue;
    var enc = top[r];
    var colId = -1;
    for (var c = 0; c < enc.length; c++) if (/^id ritmo/.test(norm_(enc[c]))) colId = c;
    if (colId < 0 && crearId) {
      var ultima = enc.length;
      while (ultima > 0 && !String(enc[ultima - 1]).trim()) ultima--;
      colId = ultima;
      sh.getRange(r + 1, colId + 1).setValue("ID Ritmo");
      enc = sh.getRange(r + 1, 1, 1, Math.max(sh.getLastColumn(), colId + 1)).getDisplayValues()[0];
    }
    return { fila: r + 1, enc: enc, colId: colId };
  }
  return null;
}

function filaDeId_(sh, h, id) {
  if (h.colId < 0 || sh.getLastRow() <= h.fila) return -1;
  var ids = sh.getRange(h.fila + 1, h.colId + 1, sh.getLastRow() - h.fila, 1).getDisplayValues();
  for (var i = 0; i < ids.length; i++) if (ids[i][0] === id) return h.fila + 1 + i;
  return -1;
}

// b.id, b.columnas = [[campo, patrón]], b.valores = {campo: texto}. Idempotente por id. Devuelve la fila.
function agregar_(b) {
  var p = pestana_(HOJAS_ESCRIBIR[b.marca] || HOJAS[b.marca], b.buscar);
  if (p.error) return { ok: false, error: p.error };
  var sh = p.hoja;
  var h = encabezado_(sh, true);
  if (!h) return { ok: false, error: "no encontré el encabezado con Fecha en la pestaña " + sh.getName() };
  var ya = filaDeId_(sh, h, b.id);
  if (ya > 0) return { ok: true, fila: ya, ya: true };
  var usados = {};
  var fila = h.enc.map(function (c) {
    var n = norm_(c);
    if (!n) return "";
    for (var i = 0; i < b.columnas.length; i++) {
      var campo = b.columnas[i][0];
      if (!usados[campo] && new RegExp(b.columnas[i][1]).test(n)) { usados[campo] = true; return b.valores[campo] == null ? "" : String(b.valores[campo]); }
    }
    return "";
  });
  // Debajo de la última fila con fecha (no del final de la hoja: las pestañas suelen traer totales o filas con formato).
  var ultima = h.fila;
  var colFecha = -1;
  for (var c = 0; c < h.enc.length; c++) if (/^fecha/.test(norm_(h.enc[c]))) { colFecha = c; break; }
  if (sh.getLastRow() > h.fila) {
    var fechas = sh.getRange(h.fila + 1, colFecha + 1, sh.getLastRow() - h.fila, 1).getDisplayValues();
    for (var i = fechas.length - 1; i >= 0; i--) if (String(fechas[i][0]).trim()) { ultima = h.fila + 1 + i; break; }
  }
  var destino = ultima + 1;
  var libre = sh.getRange(destino, 1, 1, fila.length).getDisplayValues()[0].every(function (x) { return !String(x).trim(); });
  if (!libre) { sh.insertRowAfter(ultima); }
  // Como si se escribiera a mano (Sheets lee la fecha y los montos con el formato de la columna). Solo las celdas que llena:
  // las fórmulas de las otras columnas (p. ej. Valor Neto) no se pisan.
  for (var k = 0; k < fila.length; k++) if (fila[k] !== "") sh.getRange(destino, k + 1).setValue(fila[k]);
  return { ok: true, fila: destino };
}

// Quita la fila de una venta borrada en Ritmo. Solo si la encuentra por su ID Ritmo.
function quitar_(b) {
  var p = pestana_(HOJAS_ESCRIBIR[b.marca] || HOJAS[b.marca], b.buscar);
  if (p.error) return { ok: false, error: p.error };
  var sh = p.hoja;
  var h = encabezado_(sh, false);
  if (!h) return { ok: true, nada: true };
  var f = filaDeId_(sh, h, b.id);
  if (f > 0) sh.deleteRow(f);
  return { ok: true, fila: f > 0 ? f : null };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
