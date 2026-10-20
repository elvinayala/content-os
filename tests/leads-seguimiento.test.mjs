import assert from "node:assert/strict";
import { test } from "node:test";

import { destinoExcel, etapaDeLectura, fechaExcel, leerLecturaLlamada, marcaExcel, objecionDe, serviciosDe, telefonoExcel, temperaturaDe, vaASeguimiento } from "../lib/leads/seguimiento-reglas.ts";

test("fechas del Excel de Lis", () => {
  assert.equal(fechaExcel("20/octubre/2026"), "2026-10-20");
  assert.equal(fechaExcel("01 OCTUBRE 2026"), "2026-10-01");
  assert.equal(fechaExcel("3 julio 2026"), "2026-07-03");
  assert.equal(fechaExcel("03/agosto/2026"), "2026-08-03");
  assert.equal(fechaExcel("2 septiembre 2026"), "2026-09-02");
  assert.equal(fechaExcel("CERRO"), null);
  assert.equal(fechaExcel(null), null);
});

test("teléfonos del Excel", () => {
  assert.equal(telefonoExcel("17874851557.0"), "17874851557");
  assert.equal(telefonoExcel("1 787-371-7613."), "17873717613");
  assert.equal(telefonoExcel("(939) 499-2821"), "19394992821");
  assert.equal(telefonoExcel("1 (863) 338-0557"), "18633380557");
  assert.equal(telefonoExcel("1.7874851557E10"), "17874851557");
  assert.equal(telefonoExcel("1 787-646-0335 / +1 787-642-4008"), "17876460335");
  assert.equal(telefonoExcel("1 (939) 289-1409, 1 (787) 458-8729,"), "19392891409");
  assert.equal(telefonoExcel(null), null);
  assert.equal(telefonoExcel("123"), null);
});

test("servicios, temperatura, marca y objeción", () => {
  assert.deepEqual(serviciosDe("DFY + AUTOFLOW"), ["DFY", "AutoFlow"]);
  assert.deepEqual(serviciosDe("DFT + CHAT"), ["DFY", "Chat"]);
  assert.deepEqual(serviciosDe("AI BORI"), ["Bori"]);
  assert.deepEqual(serviciosDe("LP + CHAT + DFY"), ["DFY", "Chat", "Landing page"]);
  assert.deepEqual(serviciosDe(null), []);
  assert.equal(temperaturaDe("FRIO"), "frio");
  assert.equal(temperaturaDe("Frío"), "frio");
  assert.equal(temperaturaDe("CALIENTE"), "caliente");
  assert.equal(temperaturaDe("CERRO"), null);
  assert.equal(marcaExcel("LEVEL"), "level_up");
  assert.equal(marcaExcel("borinquen"), "ai_borinquen");
  assert.equal(objecionDe("Presupuesto"), "Presupuesto");
  assert.equal(objecionDe("algo raro"), "Otra");
  assert.equal(objecionDe(""), null);
});

test("destino de cada fila: CERRÓ no entra; sin estado viejo = perdido; reciente = Por revisar", () => {
  assert.equal(destinoExcel("CERRO", "2026-10-01", "2026-09-01"), null);
  assert.deepEqual(destinoExcel("TIBIO", "2026-07-01", "2026-09-01"), { etapa: "Tibio", estado: "abierto" });
  assert.deepEqual(destinoExcel(null, "2026-08-31", "2026-09-01"), { etapa: "Mensaje final", estado: "perdido" });
  assert.deepEqual(destinoExcel(null, null, "2026-09-01"), { etapa: "Mensaje final", estado: "perdido" });
  assert.deepEqual(destinoExcel(null, "2026-09-01", "2026-09-01"), { etapa: "Por revisar", estado: "abierto" });
});

test("lectura de la llamada: compró no entra; dudoso a Por revisar", () => {
  const l = leerLecturaLlamada('```json\n{"es_venta":true,"compro":"no","marca":"level_up","nombre":"Eli Torres","telefono":null,"email":"ELI@X.COM","negocio":"Eli Spa","industria":"Belleza","servicios":["DFY","Bori"],"objecion":"Presupuesto","temperatura":"tibio","feedback":"Quiere pero no tiene el dinero ahora","proximo_paso":"Llamar el viernes","presion":false}\n```');
  assert.equal(l.email, "eli@x.com");
  assert.deepEqual(l.servicios, ["DFY", "Bori"]);
  assert.equal(etapaDeLectura(l), "Tibio");
  assert.equal(vaASeguimiento(l), true);
  assert.equal(vaASeguimiento({ ...l, compro: "si" }), false);
  assert.equal(vaASeguimiento({ ...l, esVenta: false }), false);
  assert.equal(etapaDeLectura({ ...l, compro: "no_claro" }), "Por revisar");
  assert.equal(leerLecturaLlamada("no hay json"), null);
  assert.equal(leerLecturaLlamada('{"email":"eli arroba x punto com"}').email, null);
  assert.equal(leerLecturaLlamada('{"email":"null"}').email, null);
});
