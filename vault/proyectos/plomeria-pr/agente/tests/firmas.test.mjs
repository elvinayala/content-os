// node --test tests/firmas.test.mjs  (usa el build en dist/)
import { test } from "node:test";
import assert from "node:assert/strict";
const D = await import("../dist/firmas/documento.js");
const PNG = "data:image/png;base64," + "iVBORw0KGgo".repeat(60);

test("las dos plantillas tienen 3 hojas, campos, casillas y firmas marcadas", () => {
  for (const tipo of D.TIPOS) {
    const html = D.plantilla(tipo);
    const { css, hojas } = D.partes(html);
    assert.equal(hojas.length, 3, tipo);
    assert.ok(css.includes(".campo"), tipo);
    assert.ok(html.includes('data-firma="firmante"') && html.includes('data-firma="resuelto"'), tipo);
    for (const c of D.CAMPOS[tipo]) if (c.tipo !== "opcion") assert.ok(html.includes(`data-campo="${c.id}"`), `${tipo}: falta el campo ${c.id} en la plantilla`);
    for (const c of D.CAMPOS[tipo]) for (const o of c.opciones ?? []) assert.ok(html.includes(`data-check="${o.check}"`), `${tipo}: falta la casilla ${o.check}`);
  }
});
test("validarDatos: exige lo requerido, teléfono de 10 dígitos y opciones válidas", () => {
  const bueno = { nombre: " Charlie  Malavé ", telefono: "(939) 905-3116", direccion: "Calle 1", municipio: "Cayey", licencia: "oficial", lic_num: "8842" };
  const v = D.validarDatos("plomero", bueno);
  assert.ok(v.ok); assert.equal(v.datos.nombre, "Charlie Malavé"); assert.equal(v.datos.colegiacion, "");
  assert.equal(D.validarDatos("plomero", { ...bueno, lic_num: "" }).ok, false);
  assert.match(D.validarDatos("plomero", { ...bueno, telefono: "12345" }).error, /10 dígitos/);
  assert.match(D.validarDatos("plomero", { ...bueno, licencia: "jefe" }).error, /opción/);
  assert.ok(D.validarDatos("ayudante", { nombre: "A", telefono: "7875551234", municipio: "Cayey", anos: "7", sacando: "si" }).ok);
});
test("imagenValida: solo PNG en data URL, ni vacío ni gigante", () => {
  assert.ok(D.imagenValida(PNG));
  assert.ok(!D.imagenValida("data:image/png;base64,AAA"));
  assert.ok(!D.imagenValida("data:image/jpeg;base64," + "A".repeat(900)));
  assert.ok(!D.imagenValida("javascript:alert(1)"));
  assert.ok(!D.imagenValida("data:image/png;base64," + "A".repeat(600_000)));
});
test("llenar: pone los datos (escapados), marca la casilla, la firma y la fecha", () => {
  const datos = { nombre: "Charlie <b>Malavé</b>", telefono: "9399053116", direccion: "Calle 1", municipio: "Cayey", licencia: "maestro", lic_num: "4471", colegiacion: "" };
  const html = D.llenar("plomero", D.plantilla("plomero"), datos, { firmante: PNG, resuelto: { nombre: "Elvin Ayala", cargo: "fundador", en: "2026-09-23T15:00:00Z" } }, "2026-09-23T16:00:00Z");
  assert.ok(html.includes("Charlie &lt;b&gt;Malavé&lt;/b&gt;"), "escapa el HTML");
  assert.ok(!html.includes("<b>Malavé</b>"));
  assert.ok(html.includes('data-check="lic_maestro">☒') && html.includes('data-check="lic_oficial">☐'));
  assert.ok(html.includes(`class="firma-img" src="${PNG}"`));
  assert.ok(html.includes("Elvin Ayala") && html.includes("Firmado electrónicamente"));
  assert.ok(html.includes(">23<") && html.includes(">septiembre<") && html.includes(">Cayey<"), "fecha y lugar");
  assert.ok(!/data-campo="[a-z_]+"><\/span>/.test(html), "no quedan campos vacíos");
});
test("certificado: trae firmante, IPs, páginas iniciadas y la huella", () => {
  const c = D.certificado({ id: "F-0001", tipo: "plomero", nombre: "Charlie", telefono: "9399053116", emitido: { en: "2026-09-23T15:00:00Z", por: "panel" }, abierto: { en: "2026-09-23T15:10:00Z", ip: "1.2.3.4" }, firmado: { en: "2026-09-23T15:20:00Z", ip: "5.6.7.8", ua: "iPhone" }, hojasIniciadas: [1, 2, 3], hashContenido: "abc123" });
  for (const x of ["F-0001", "Charlie", "1.2.3.4", "5.6.7.8", "iPhone", "1, 2, 3", "abc123"]) assert.ok(c.includes(x), x);
});

test("cambiarTipo: sin licencia pasa a ayudante antes de firmar, y queda registrado", async () => {
  const fs = await import("node:fs"); const path = await import("node:path"); const os = await import("node:os");
  const F = await import("../dist/firmas/firmas.js");
  const f = { id: "F-9999", token: "x", tipo: "plomero", nombre: "Prueba", telefono: "17875551234", estado: "pendiente", emitido: { en: new Date().toISOString(), por: "test" } };
  const r = F.cambiarTipo(f, "ayudante", "firmante");
  assert.ok(r.ok); assert.equal(f.tipo, "ayudante"); assert.equal(f.cambios.length, 1); assert.equal(f.cambios[0].de, "plomero");
  assert.equal(F.cambiarTipo({ ...f, estado: "firmado" }, "plomero", "firmante").ok, false);
  // limpiar el registro de prueba
  const archivo = path.join(process.cwd(), "data", "estado", "firmas.json");
  try { const l = JSON.parse(fs.readFileSync(archivo, "utf8")).filter((x) => x.id !== "F-9999"); fs.writeFileSync(archivo, JSON.stringify(l, null, 2)); } catch {}
});
