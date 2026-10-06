import assert from "node:assert/strict";
import { test } from "node:test";

import { carrera, contarCitas, equipo, errorBono, errorDiario, leerHojaVentas, marcador, mismaPersona, pasarelaDe, pctChatter, pctCloser, resultadoCita, semanaDe, siguienteTramo, tasasDelMes, transaccionesDe } from "../lib/ventas/reglas.ts";

test("closer: 7 % base; 8-10 % solo con show-up ≥ 60 % (reglas de Nahuel)", () => {
  assert.equal(pctCloser(null, null), 0.07);
  assert.equal(pctCloser(0.8, 0.15), 0.07); // menos del 20 % = 7 %
  assert.equal(pctCloser(0.8, 0.2), 0.07);
  assert.equal(pctCloser(0.6, 0.25), 0.08);
  assert.equal(pctCloser(0.7, 0.3), 0.09);
  assert.equal(pctCloser(0.7, 0.35), 0.1);
  assert.equal(pctCloser(0.7, 0.5), 0.1);
  assert.equal(pctCloser(0.59, 0.4), 0.07); // sin 60 % de show-up se queda en 7 % aunque cierre 35 %+
});

test("chatter: 5 % solo si pasa de 200 agendas propias", () => {
  assert.equal(pctChatter(120), 0.04);
  assert.equal(pctChatter(200), 0.04);
  assert.equal(pctChatter(201), 0.05);
  assert.match(siguienteTramo("chatter", { showUp: null, cierre: null, agendas: 150 }), /51 agendas/);
});

test("pasarelas: Stripe/PayPal/ATH 3.5 %, Klarna 4.5 %, transferencia 0 %", () => {
  assert.equal(pasarelaDe("Stripe").fee, 0.035);
  assert.equal(pasarelaDe("PAYPAL").fee, 0.035);
  assert.equal(pasarelaDe("ATH Móvil").fee, 0.035);
  assert.equal(pasarelaDe("Klarna").fee, 0.045);
  assert.equal(pasarelaDe("FanBasis").fee, 0.045);
  assert.equal(pasarelaDe("Fanbasics").fee, 0.045);
  assert.equal(pasarelaDe("Transferencia").fee, 0);
  assert.equal(pasarelaDe("Transferencia").desconocida, false);
  assert.equal(pasarelaDe("Afterpay").desconocida, true);
});

const HOJA = [
  ["LUM Sales Septiembre 2026"],
  ["Fecha", "Cliente", "Tipo de Transacción", "Monto cobrado", "Método de pago", "Closer", "Setter", "Chatter", "Valor Neto"],
  ["9/1/2026", "Ana", "New Sale", "$2,000.00", "Stripe", "Roger Arteaga", "Luis Fernández", "Ana Cecilio", "$1,930.00"],
  ["9/2/2026", "Beto", "New Sale", "$1,000.00", "Klarna", "Roger", "Luis F.", "Dilan Torres", ""],
  ["9/15/2026", "Carla", "Payment of debt", "$500.00", "Transferencia", "Laura Bernal", "-", "", ""],
  ["9/27/2026", "Dani", "New Sale", "$3,000.00", "ATH Movil", "Laura Bernal", "Luis Fernandez", "Ana Cecilio", ""],
  ["", "", "", "", "", "", "", "", ""],
];

test("hoja: lee columnas, neto por pasarela y tipo", () => {
  const h = leerHojaVentas(HOJA, "mdy");
  assert.equal(h.error, undefined);
  assert.equal(h.metodoNeto, "pasarela");
  assert.equal(h.transacciones.length, 4);
  const [a, b, c] = h.transacciones;
  assert.equal(a.fecha, "2026-09-01");
  assert.equal(a.neto, 1930);
  assert.equal(b.neto, 955);
  assert.equal(c.tipo, "cuota");
  assert.equal(c.neto, 500);
  assert.equal(c.setter, "");
});

test("personas: la hoja escribe los nombres como quiere", () => {
  assert.ok(mismaPersona("Roger", "Roger Arteaga"));
  assert.ok(mismaPersona("Luis F.", "Luis Fernández"));
  assert.ok(mismaPersona("luis fernandez", "Luis Fernández"));
  assert.ok(!mismaPersona("Laura Bernal", "Luis Fernández"));
  assert.ok(!mismaPersona("", "Roger Arteaga"));
  assert.ok(mismaPersona("Rogelio", "Roger Arteaga", ["Rogelio"]));
  assert.ok(mismaPersona("Santiago Gutiérrez", "Santiago Alejandro Gutiérrez Castaño"));
  assert.ok(!mismaPersona("Santiago Pérez", "Santiago Alejandro Gutiérrez Castaño"));
  assert.ok(!mismaPersona("Juan José", "Juan David Guzman Escobar"));
});

test("marcador del closer: comisión privada sobre el neto del mes", () => {
  const { transacciones } = leerHojaVentas(HOJA, "mdy");
  const mias = transaccionesDe(transacciones, "closer", "Roger Arteaga");
  assert.equal(mias.length, 2);
  const tasas = tasasDelMes({ diario: [{ fecha: "2026-09-01", citas: 5, presentaron: 4, conversaciones: 0, agendas: 0 }, { fecha: "2026-09-02", citas: 3, presentaron: 2, conversaciones: 0, agendas: 0 }], cierresHoja: 2, agendasLeads: 0 });
  assert.equal(tasas.showUp, 0.75);
  assert.equal(Math.round(tasas.cierre * 100), 33);
  const m = marcador({ txs: mias, rol: "closer", hoy: "2026-09-02", semana: semanaDe("2026-09-02"), tasas });
  assert.equal(m.mes, 3000);
  assert.equal(m.hoy, 1000);
  assert.equal(m.netoMes, 2885);
  assert.equal(m.pct, 0.09);
  assert.equal(m.comision, 259.65);
});

test("carrera por rol y equipo con alerta", () => {
  const { transacciones } = leerHojaVentas(HOJA, "mdy");
  const personas = [{ userId: "r", nombre: "Roger Arteaga" }, { userId: "l", nombre: "Laura Bernal" }];
  const c = carrera(transacciones, "closer", personas);
  assert.deepEqual(c.map((x) => [x.userId, x.monto]), [["l", 3500], ["r", 3000]]);
  const e = equipo(transacciones, "level_up", "2026-09-28", 13);
  assert.equal(e.mes, 6500);
  assert.equal(e.alerta?.nivel, "rojo");
  assert.equal(equipo(transacciones, "level_up", "2026-09-27", 16).alerta?.nivel, "ambar");
  assert.equal(semanaDe("2026-09-27")[0], "2026-09-21");
});

test("validaciones de diario y bonos", () => {
  assert.equal(errorDiario({ citas: 3, presentaron: 4, conversaciones: 0, agendas: 0 }), "No pueden presentarse más de las citas que tenías");
  assert.equal(errorDiario({ citas: 3, presentaron: 2, conversaciones: 10, agendas: 1 }), null);
  assert.equal(errorBono({ titulo: "Primero en cerrar 5", monto: 200, desde: "2026-09-28", hasta: "2026-10-04" }), null);
  assert.match(errorBono({ titulo: "x", monto: 200, desde: "2026-09-28", hasta: null }), /título/);
});

test("show-up desde el CRM (Nahuel, 28/sep): etapa del lead después de la cita", () => {
  assert.equal(resultadoCita("Llamada agendada"), "sin_marcar");
  assert.equal(resultadoCita("Llamada reprogramada"), "sin_marcar");
  assert.equal(resultadoCita("Llamada cancelada"), "cancelada");
  assert.equal(resultadoCita("No show"), "no_show");
  assert.equal(resultadoCita("No ofertado"), "presento");
  assert.equal(resultadoCita("Follow up"), "presento");
  assert.equal(resultadoCita("Pago reserva"), "presento");
  assert.equal(resultadoCita("Closed win"), "presento");
  assert.equal(resultadoCita("Closed lost"), "presento");
  assert.equal(resultadoCita("Llamada agendada", "ganado"), "presento");
  const crm = contarCitas(["presento", "presento", "presento", "no_show", "cancelada", "sin_marcar"]);
  assert.deepEqual(crm, { citas: 5, presentaron: 3, noShow: 1, sinMarcar: 1 });
  // CRM manda sobre el diario; las sin marcar no cuentan
  const t = tasasDelMes({ diario: [{ fecha: "2026-09-01", citas: 10, presentaron: 1, conversaciones: 0, agendas: 0 }], cierresHoja: 1, agendasLeads: 0, crm });
  assert.equal(t.showUpFuente, "crm");
  assert.equal(t.showUp, 0.75);
  assert.equal(t.presentaron, 3);
  assert.equal(t.sinMarcar, 1);
  assert.equal(Math.round(t.cierre * 100), 33);
  // sin citas marcadas en el CRM → diario
  const d = tasasDelMes({ diario: [{ fecha: "2026-09-01", citas: 4, presentaron: 3, conversaciones: 0, agendas: 0 }], cierresHoja: 0, agendasLeads: 0, crm: { citas: 2, presentaron: 0, noShow: 0, sinMarcar: 2 } });
  assert.equal(d.showUpFuente, "diario");
  assert.equal(d.showUp, 0.75);
  assert.match(siguienteTramo("closer", { showUp: null, cierre: null, agendas: 0 }), /Leads/);
});

test("KPIs del diario por puesto (Elvin, 28/sep)", async () => {
  const { KPIS_VENTAS, limpiarKpis, kpisDelMes, camposViejos } = await import("../lib/ventas/reglas.ts");
  assert.deepEqual(KPIS_VENTAS.setter.map((k) => k.id), ["llamadas", "conectadas", "agendadas", "show", "no_show"]);
  assert.deepEqual(KPIS_VENTAS.chatter.map((k) => k.id), ["conversaciones", "calificados", "no_califica", "seguimiento", "mitad_conversacion", "propuesta_agenda", "link_enviado", "pases", "agendadas", "show", "no_show", "ventas", "collections"]); // planilla de chatters (6/oct)
  assert.deepEqual(KPIS_VENTAS.closer.map((k) => k.id), ["demos", "cerradas", "no_cerradas"]);
  assert.deepEqual(limpiarKpis("chatter", { conversaciones: 30, pases: "4", agendadas: 5, otra: 9 }).kpis, { conversaciones: 30, pases: 4, agendadas: 5 });
  assert.match(limpiarKpis("closer", { demos: 3, cerradas: 2, no_cerradas: 2 }).error, /demos/);
  assert.match(limpiarKpis("setter", { llamadas: -1 }).error, /llamadas/);
  assert.deepEqual(kpisDelMes([{ kpis: { llamadas: 10, show: 1 } }, { kpis: { llamadas: 5 } }, { kpis: null }]), { llamadas: 15, show: 1 });
  assert.deepEqual(camposViejos("closer", { demos: 4, cerradas: 1 }), { citas: 0, presentaron: 4, conversaciones: 0, agendas: 0 });
  assert.equal(camposViejos("chatter", { conversaciones: 20, agendadas: 3 }).agendas, 3);
});

test("ranking de ventas: metas diarias de setters y chatters, close rate de closers (30/sep)", async () => {
  const { rankingVentas, nivelCloseRate } = await import("../lib/ventas/reglas.ts");
  assert.equal(nivelCloseRate(15), "rojo");
  assert.equal(nivelCloseRate(25), "amarillo");
  assert.equal(nivelCloseRate(30), "verde");
  assert.equal(nivelCloseRate(42), "elite");
  const r = rankingVentas([
    { userId: "s1", nombre: "Setter flojo", rol: "setter", dias: 2, cash: 0, mes: { llamadas: 160, conectadas: 30, agendadas: 4 } },
    { userId: "s2", nombre: "Setter top", rol: "setter", dias: 2, cash: 0, mes: { llamadas: 260, conectadas: 70, agendadas: 10 } },
    { userId: "c1", nombre: "Closer elite", rol: "closer", dias: 5, cash: 9000, mes: { demos: 10, cerradas: 4 } },
    { userId: "c2", nombre: "Closer rojo", rol: "closer", dias: 5, cash: 1000, mes: { demos: 10, cerradas: 1 } },
    { userId: "h1", nombre: "Chatter", rol: "chatter", dias: 1, cash: 0, mes: { conversaciones: 12, pases: 6, agendadas: 3 } },
    { userId: "x", nombre: "Sin diario", rol: "setter", dias: 0, cash: 0, mes: {} },
  ]);
  const de = (n) => r.find((f) => f.nombre === n);
  assert.equal(de("Closer elite").nivel, "elite");
  assert.equal(de("Closer elite").posicion, 1);
  assert.equal(de("Closer rojo").nivel, "rojo");
  assert.match(de("Closer rojo").recomendaciones[0], /alerta roja/);
  assert.equal(de("Setter top").posicion, 1);
  assert.equal(de("Setter flojo").nivel, "rojo"); // 80 llamadas/día < 100
  assert.ok(de("Setter flojo").recomendaciones.some((x) => x.includes("llamadas realizadas")));
  assert.equal(de("Chatter").indicadores.find((i) => i.id === "conversaciones").nivel, "rojo"); // 12 < 15
  assert.equal(de("Chatter").indicadores.find((i) => i.id === "pases").nivel, "verde");
  assert.equal(de("Sin diario").nivel, "sin-datos");
});

test("escalones del director: cuánto falta para cada meta de ventas nuevas", async () => {
  const { escalones, ESCALONES_DIRECTOR } = await import("../lib/ventas/reglas.ts");
  const e = escalones(62_300, ESCALONES_DIRECTOR.level_up);
  assert.deepEqual(e.metas.map((m) => m.logrado), [true, false, false]);
  assert.deepEqual(e.siguiente, { meta: 75_000, falta: 12_700, n: 2 });
  assert.equal(escalones(0, [50_000, 75_000, 100_000]).siguiente.falta, 50_000);
  assert.equal(escalones(100_000, [50_000, 75_000, 100_000]).siguiente, null);
});

// ─── Planilla de chatters + rangos (6/oct) ───────────────────────────────────────────────────────
import { kpisDelMes as sumarKpis, KPIS_VENTAS as KPIS, limpiarKpis, rangoFechas, tasasVentas } from "../lib/ventas/reglas.ts";

test("chatter: trae todo lo de la planilla (y sigue con conversaciones/pases/agendadas para el ranking)", () => {
  const ids = KPIS.chatter.map((k) => k.id);
  for (const id of ["conversaciones", "calificados", "no_califica", "seguimiento", "mitad_conversacion", "propuesta_agenda", "link_enviado", "pases", "agendadas", "ventas", "collections"]) assert.ok(ids.includes(id), id);
});

test("limpiarKpis: dinero con centavos y comas; conteos enteros", () => {
  const r = limpiarKpis("chatter", { conversaciones: 20, calificados: "13", ventas: "3,500.50", collections: 0 });
  assert.equal(r.error, null);
  assert.deepEqual(r.kpis, { conversaciones: 20, calificados: 13, ventas: 3500.5 });
  assert.ok(limpiarKpis("chatter", { conversaciones: 2.5 }).error);
  assert.ok(limpiarKpis("chatter", { ventas: 2_000_000 }).error);
  assert.equal(sumarKpis([{ kpis: { ventas: 0.1 } }, { kpis: { ventas: 0.2 } }]).ventas, 0.3);
});

test("tasas de la planilla: sobre conversaciones; sin conversaciones = —", () => {
  const t = Object.fromEntries(tasasVentas("chatter", { conversaciones: 20, calificados: 13, agendadas: 5, mitad_conversacion: 11, propuesta_agenda: 10, link_enviado: 7 }).map((x) => [x.id, x.valor]));
  assert.deepEqual(t, { pct_calificado: 65, pct_agenda: 25, pct_mitad: 55, pct_propuesta: 50, pct_link: 35 });
  assert.equal(tasasVentas("chatter", {})[0].valor, null);
  assert.equal(tasasVentas("closer", { demos: 10, cerradas: 3 })[0].valor, 30);
});

test("rangos: hoy, ayer, 7 y 30 días, este mes y el pasado (cruzando año)", () => {
  assert.deepEqual(rangoFechas("hoy", "2026-10-06"), { id: "hoy", desde: "2026-10-06", hasta: "2026-10-06", etiqueta: "Hoy" });
  assert.equal(rangoFechas("ayer", "2026-10-01").desde, "2026-09-30");
  assert.equal(rangoFechas("7d", "2026-10-06").desde, "2026-09-30");
  assert.equal(rangoFechas("30d", "2026-10-06").desde, "2026-09-07");
  assert.deepEqual([rangoFechas("mes", "2026-10-06").desde, rangoFechas("mes", "2026-10-06").hasta], ["2026-10-01", "2026-10-06"]);
  assert.deepEqual([rangoFechas("mes-pasado", "2027-01-15").desde, rangoFechas("mes-pasado", "2027-01-15").hasta], ["2026-12-01", "2026-12-31"]);
  assert.equal(rangoFechas("cualquier-cosa", "2026-10-06").id, "mes");
});
