import assert from "node:assert/strict";
import test from "node:test";

import { mensajeSop, modoDelDia } from "../lib/pulse/sop-mensajes.ts";

const p = { nombre: "Carilin", total: 6, publicados: 1, enRevision: 2, faltan: ["Operaciones", "Customer Success", "Producción creativa", "Contenido y community", "Estrategia y tráfico"], links: ["https://x/pulse/sops-level-up"] };

test("modo del día: primero → insistir → estatus si contestó; último día y listo", () => {
  assert.equal(modoDelDia({ yaSeLeEscribio: false, respondio: false, esUltimoDia: false, todoPublicado: false }), "primero");
  assert.equal(modoDelDia({ yaSeLeEscribio: true, respondio: false, esUltimoDia: false, todoPublicado: false }), "insistir");
  assert.equal(modoDelDia({ yaSeLeEscribio: true, respondio: true, esUltimoDia: false, todoPublicado: false }), "estatus");
  assert.equal(modoDelDia({ yaSeLeEscribio: true, respondio: true, esUltimoDia: true, todoPublicado: false }), "ultimo");
  assert.equal(modoDelDia({ yaSeLeEscribio: true, respondio: true, esUltimoDia: true, todoPublicado: true }), "listo");
});

test("mensajes breves, con progreso real y sin voseo", () => {
  const primero = mensajeSop(p, "primero");
  assert.match(primero, /De parte de Elvin/);
  assert.match(primero, /Van \*1 de 6\* publicados \(2 en revisión\)/);
  assert.match(primero, /y 1 más/);
  const estatus = mensajeSop(p, "estatus");
  assert.ok(estatus.length < 300);
  assert.doesNotMatch(estatus, /confirmas/);
  assert.match(mensajeSop(p, "insistir"), /confirmas/);
  assert.equal(mensajeSop(p, "listo"), null);
  assert.equal(mensajeSop({ ...p, total: 0 }, "primero"), null);
  for (const m of ["primero", "insistir", "estatus", "ultimo"]) assert.doesNotMatch(mensajeSop(p, m), /\b(vos|tenés|podés|subí|revisá)\b/);
});
