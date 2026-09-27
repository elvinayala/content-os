import assert from "node:assert/strict";
import test from "node:test";

import { archivoCoincide, elegirContrato, emparejar, leerVenta } from "../lib/pulse/contratos.ts";

const ROGER = `Natacha Agront
*Correo Electrónico:*  <mailto:nat.agront@gmail.com|nat.agront@gmail.com><mailto:nutricardn@gmail.com|n>
*Teléfono:*  <tel:+17874840203|+1 (787) 484-0203>
*Done For you + visita de contenido  3.500,00 USD por 90 dias*
*Pago total: $3.500,00*
*Closer: Roger Arteaga*
*setter: <@U09SEGSHH46|Ana Patricia Cecilio Rivero>*`;
const JUAN = `*REGISTRO DE VENTA*
*Cliente:* Leslie
*Empresa:* Integral Home Solutions & Roofing
*Correo electrónico:* <mailto:IntegralHomeSolutionsRoofing@gmail.com|IntegralHomeSolutionsRoofing@gmail.com>
*Teléfono:* <tel:7873214827|787-321-4827>`;

test("lee ventas de los dos formatos del canal", () => {
  const a = leerVenta("1", ROGER);
  assert.equal(a.nombre, "Natacha Agront");
  assert.deepEqual(a.emails, ["nat.agront@gmail.com", "nutricardn@gmail.com"]);
  assert.deepEqual(a.telefonos, ["7874840203"]);
  const b = leerVenta("2", JUAN);
  assert.equal(b.nombre, "Leslie");
  assert.deepEqual(b.emails, ["integralhomesolutionsroofing@gmail.com"]);
  assert.deepEqual(b.telefonos, ["7873214827"]);
  assert.equal(leerVenta("3", "HORRIBLE, VAMOS POR ESOS FULL PAY!"), null);
});

test("empareja por correo, teléfono o nombre y apellido; la más reciente gana", () => {
  const ventas = [leerVenta("100", ROGER), leerVenta("200", JUAN), leerVenta("300", "Omar Velazquez\n<mailto:luis.elazquez@icloud.com|x>")];
  assert.equal(emparejar({ nombre: "Otra", emails: ["NAT.AGRONT@gmail.com"], telefonos: [] }, ventas).ts, "100");
  assert.equal(emparejar({ nombre: "Leslie Pérez", emails: [], telefonos: ["7873214827"] }, ventas).ts, "200");
  assert.equal(emparejar({ nombre: "Natacha Agront", emails: ["otro@x.com"], telefonos: [] }, ventas).ts, "100");
  // Solo el nombre de pila no alcanza
  assert.equal(emparejar({ nombre: "Natacha Ruiz", emails: [], telefonos: [] }, ventas), null);
  // "Omar Vazquez" (la ficha) vs "Omar Velazquez" (la venta): sin dato duro no se arriesga
  assert.equal(emparejar({ nombre: "Omar Vazquez", emails: [], telefonos: [] }, ventas), null);
  assert.equal(emparejar({ nombre: "Omar Vazquez", emails: ["luis.elazquez@icloud.com"], telefonos: [] }, ventas).ts, "300");
});

test("elige el PDF del contrato y detecta el de otra persona", () => {
  const f = elegirContrato([{ id: "1", name: "foto.png", mimetype: "image/png" }, { id: "2", name: "recibo.pdf", mimetype: "application/pdf" }, { id: "3", name: "Level Up Media DFY  Contrato_ Natacha Agront (1).pdf" }]);
  assert.equal(f.id, "3");
  assert.equal(elegirContrato([{ id: "1", name: "foto.png", mimetype: "image/png" }]), null);
  assert.equal(archivoCoincide("Natacha Agront", "Level Up Media DFY  Contrato_ Natacha Agront (1).pdf"), true);
  assert.equal(archivoCoincide("Omar Vazquez", "Level_Up_Media_DFY__Contrato__Omar_Vázquez.pdf"), true);
  assert.equal(archivoCoincide("Joel Amil Rivera Velez", "Level_Up_Media_DFY__Contrato__Edgar_Rosado_(2).pdf"), false);
});
