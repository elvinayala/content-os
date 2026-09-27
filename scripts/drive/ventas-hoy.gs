/**
 * Ventas del día (Elvin, 27/sep/2026): lee las hojas de ventas de tesorería de Level Up y AI Borinquen
 * para el resumen de las 8:30 PM por Telegram (/api/cron/resumen-dia). Las hojas son privadas: este
 * script corre con TU cuenta (que ya las puede abrir) y solo devuelve la pestaña del mes que se le pide
 * de ESTAS DOS hojas, con una clave secreta. No escribe nada.
 *
 * Cómo publicarlo (una sola vez), con la copia personalizada que te pasa Claude (ya trae SECRETO_FIJO):
 *  1. script.google.com (con elvin@levelupmediapr.net) → Nuevo proyecto → borra lo que hay, pega el archivo
 *     completo → guarda con el nombre "Ventas del día".
 *  2. Implementar → Nueva implementación → tipo "Aplicación web" → Ejecutar como: Yo · Quién tiene acceso:
 *     Cualquier persona → Implementar → Autorizar acceso → copia la URL que termina en /exec y pásasela a Claude.
 */

var SECRETO_FIJO = ""; // la copia personalizada lo trae lleno; este archivo del repo nunca lleva la clave

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
  var id = HOJAS[b.marca];
  if (!id) return { ok: false, error: "marca" };
  var hojas = SpreadsheetApp.openById(id).getSheets();
  var buscar = (b.buscar || []).map(norm_);
  var elegida = null;
  for (var i = 0; i < buscar.length && !elegida; i++) {
    for (var j = 0; j < hojas.length; j++) if (norm_(hojas[j].getName()) === buscar[i]) { elegida = hojas[j]; break; }
    if (!elegida) for (var k = 0; k < hojas.length; k++) if (norm_(hojas[k].getName()).indexOf(buscar[i]) >= 0) { elegida = hojas[k]; break; }
  }
  if (!elegida) return { ok: false, error: "no encontré la pestaña del mes (" + (b.buscar || []).join(" / ") + ")" };
  return { ok: true, pestana: elegida.getName(), filas: elegida.getDataRange().getDisplayValues() };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
