/**
 * Max · Drive de clientes (Elvin, 24/sep/2026): "De cada cliente quiero una carpeta en Google Drive:
 * el branding, el logo, la estrategia de marketing, documentos, imágenes, flyers, videos… todo."
 *
 * Este script vive en la cuenta de Google de Level Up (script.google.com) y crea/guarda en SU Drive.
 * Content OS lo llama con una clave secreta (DRIVE_SCRIPT_URL + DRIVE_SCRIPT_SECRETO en Vercel).
 *
 * Cómo publicarlo (una sola vez), con la copia personalizada que te pasa Claude (ya trae SECRETO_FIJO):
 *  1. script.google.com → Nuevo proyecto → borra lo que hay, pega ese archivo completo → guarda ("Max Drive").
 *  2. Implementar → Nueva implementación → tipo "Aplicación web" → Ejecutar como: Yo · Quién tiene acceso:
 *     Cualquier persona → Implementar → Autorizar acceso (tu cuenta) → copia la URL que termina en /exec.
 * (Alternativa: dejar SECRETO_FIJO vacío y poner SECRETO en Configuración → Propiedades del script.)
 *
 * Crea "Clientes Level Up · Max" en tu Drive y adentro una carpeta por cliente con sus subcarpetas.
 */

var SECRETO_FIJO = ""; // la copia personalizada lo trae lleno; este archivo del repo nunca lleva la clave

var SUBCARPETAS = [
  "01 Branding y logo",
  "02 Estrategia",
  "03 Creativos (flyers e imágenes)",
  "04 Videos",
  "05 Reportes y resultados",
  "06 Documentos del cliente",
];

function doPost(e) {
  var b = {};
  try { b = JSON.parse((e && e.postData && e.postData.contents) || "{}"); } catch (err) { return json_({ ok: false, error: "json" }); }
  var secreto = PropertiesService.getScriptProperties().getProperty("SECRETO") || SECRETO_FIJO;
  if (!secreto || b.secreto !== secreto) return json_({ ok: false, error: "no-autorizado" });
  try {
    if (b.accion === "carpeta") return json_(carpeta_(b));
    if (b.accion === "doc") return json_(doc_(b));
    if (b.accion === "archivo") return json_(archivo_(b));
    if (b.accion === "listar") return json_(listar_(b));
    if (b.accion === "salud") return json_({ ok: true, raiz: raiz_().getUrl() });
    return json_({ ok: false, error: "accion" });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message || err) });
  }
}

function raiz_() {
  var p = PropertiesService.getScriptProperties();
  var id = p.getProperty("RAIZ");
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) {} }
  var f = DriveApp.createFolder("Clientes Level Up · Max");
  p.setProperty("RAIZ", f.getId());
  return f;
}

function hija_(padre, nombre) {
  var it = padre.getFoldersByName(nombre);
  return it.hasNext() ? it.next() : padre.createFolder(nombre);
}

// Idempotente: si la carpeta del cliente ya existe (mismo nombre), la reusa.
function carpeta_(b) {
  if (!b.nombre) throw new Error("falta nombre");
  var f = hija_(raiz_(), String(b.nombre).slice(0, 120));
  var subs = {};
  for (var i = 0; i < SUBCARPETAS.length; i++) subs[SUBCARPETAS[i]] = hija_(f, SUBCARPETAS[i]).getId();
  // Todo el equipo de Level Up (mismo dominio de Google Workspace) puede verla y editarla.
  try { f.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.EDIT); } catch (err) {}
  return { ok: true, id: f.getId(), url: f.getUrl(), subcarpetas: subs };
}

function destino_(b) {
  var f = DriveApp.getFolderById(b.carpetaId);
  return b.sub ? hija_(f, String(b.sub)) : f;
}

// Un Google Doc con texto (estrategia, briefs, guiones, reportes).
function doc_(b) {
  var d = DocumentApp.create(String(b.nombre || "Documento").slice(0, 200));
  d.getBody().setText(String(b.texto || ""));
  d.saveAndClose();
  var file = DriveApp.getFileById(d.getId());
  file.moveTo(destino_(b));
  return { ok: true, id: file.getId(), url: file.getUrl() };
}

// Un archivo desde un enlace (flyer, imagen, video de Higgsfield…). Límite de Google: ~50 MB.
function archivo_(b) {
  var r = UrlFetchApp.fetch(String(b.url), { muteHttpExceptions: true, followRedirects: true });
  if (r.getResponseCode() >= 300) throw new Error("no pude bajar el archivo (" + r.getResponseCode() + ")");
  var blob = r.getBlob();
  if (b.nombre) blob.setName(String(b.nombre).slice(0, 200));
  var file = destino_(b).createFile(blob);
  return { ok: true, id: file.getId(), url: file.getUrl() };
}

function listar_(b) {
  var out = [];
  var f = DriveApp.getFolderById(b.carpetaId);
  var subs = f.getFolders();
  while (subs.hasNext()) {
    var s = subs.next();
    var fs = s.getFiles();
    while (fs.hasNext()) { var x = fs.next(); out.push({ carpeta: s.getName(), nombre: x.getName(), url: x.getUrl() }); }
  }
  var sueltos = f.getFiles();
  while (sueltos.hasNext()) { var y = sueltos.next(); out.push({ carpeta: "", nombre: y.getName(), url: y.getUrl() }); }
  return { ok: true, archivos: out };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
