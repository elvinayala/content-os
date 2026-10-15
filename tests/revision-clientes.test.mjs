import assert from "node:assert/strict";
import { test } from "node:test";

import { agruparCreativos, ajustes, analizar, cadencia, leerAcuerdo, pendientesHoy, resultadoDe, textoReporte, tipoResultado } from "../scripts/meta-ads/revision.mjs";

test("acuerdo: lee el monto como lo escribe el equipo en Pulse", () => {
  assert.deepEqual(leerAcuerdo("3000 x 90 dias"), { monto: 3000, mensual: false });
  assert.deepEqual(leerAcuerdo("3.500 X 90 DIAS"), { monto: 3500, mensual: false });
  assert.deepEqual(leerAcuerdo("$2100 x 90 dias"), { monto: 2100, mensual: false });
  assert.deepEqual(leerAcuerdo("2800x 90 dias"), { monto: 2800, mensual: false });
  assert.deepEqual(leerAcuerdo("1.200 mes a mes"), { monto: 1200, mensual: true });
  assert.deepEqual(leerAcuerdo("500 MES A MES X 6 MESES"), { monto: 500, mensual: true });
  assert.deepEqual(leerAcuerdo("4500 x 6 MESES - 750 MES A MES"), { monto: 4500, mensual: false });
  assert.equal(leerAcuerdo(""), null);
});

test("cadencia de Elvin: $3,000+ o $1,500+ de una = 15 días; paquetes pequeños = 30", () => {
  assert.equal(cadencia({ acuerdo: "3000 x 90 dias", pagoInicial: 500 }).dias, 15, "acuerdo alto aunque pague en cuotas");
  assert.equal(cadencia({ acuerdo: "2000 x 90 dias", pagoInicial: 2000 }).dias, 15, "pagó $2,000 de una");
  assert.equal(cadencia({ acuerdo: "1.200 mes a mes", pagoInicial: 1600 }).dias, 15);
  assert.match(cadencia({ acuerdo: "2000 x 90 dias", pagoInicial: 2000 }).motivo, /pagó \$2,000 de una/);
  assert.equal(cadencia({ acuerdo: "1000 mes a mes", pagoInicial: 1000 }).dias, 30);
  assert.equal(cadencia({ acuerdo: "2500 X 90 DIAS", pagoInicial: 500 }).dias, 30, "cuotas de un acuerdo menor de $3,000");
  assert.match(cadencia({}).motivo, /paquete pequeño/);
});

test("quién toca hoy: vencidos primero, después los nuevos por tamaño; con tope por día", () => {
  const clientes = [
    { itemId: "a", nombre: "A", acuerdo: "3000 x 90 dias", pagoInicial: 3000 },
    { itemId: "b", nombre: "B", acuerdo: "6000 x 90 dias", pagoInicial: 6000 },
    { itemId: "c", nombre: "C", acuerdo: "500 mes a mes", pagoInicial: 500 },
    { itemId: "d", nombre: "D", acuerdo: "3500 x 90 dias", pagoInicial: 3500 },
  ];
  const estado = { a: { ultima: "2026-09-25" }, c: { ultima: "2026-10-01" }, d: { ultima: "2026-10-10" } };
  const r = pendientesHoy(clientes, estado, "2026-10-15", { porDia: 2 });
  assert.deepEqual(r.hoy.map((x) => x.itemId), ["a", "b"], "A atrasado 5 días; B nunca revisado; C (30 días) y D (15) todavía no");
  assert.equal(r.hoy[0].atraso, 5);
  assert.equal(r.enFila, 0);
  assert.deepEqual(pendientesHoy(clientes, {}, "2026-10-15", { porDia: 3 }).hoy.map((x) => x.itemId), ["b", "d", "a"]);
});

test("resultado: el campo results de Meta en palabras", () => {
  const f = { results: [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d", values: [{ value: "201" }] }] };
  assert.equal(resultadoDe(f).cantidad, 201);
  assert.equal(resultadoDe(f).tipo.varios, "conversaciones");
  assert.equal(resultadoDe({ results: [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d" }] }).cantidad, 0, "sin values = 0");
  assert.equal(tipoResultado("actions:offsite_conversion.fb_pixel_lead").uno, "lead");
  assert.equal(tipoResultado("actions:link_click").varios, "clics");
});

// Una cuenta de mentira con 4 creativos: un flyer ganador, un video caro, un flyer que no engancha y uno quemado.
const conv = (v) => [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d", values: v ? [{ value: String(v) }] : undefined }];
const fila = (ad, gasto, res, ctr, fre) => ({ ad_id: ad, ad_name: NOMBRES[ad], adset_id: "s-" + ad, adset_name: "Conjunto " + ad, spend: String(gasto), impressions: String(Math.round(1000 * fre * 2)), reach: "2000", unique_ctr: String(ctr), frequency: String(fre), results: conv(res) });
const NOMBRES = { f1: "FLYER OFERTA", f1b: "FLYER OFERTA - Copia", v1: "VIDEO TESTIMONIO", f2: "FLYER PRECIO", v2: "VIDEO VIEJO" };
const anuncios = [
  { id: "f1", name: "FLYER OFERTA", effective_status: "ACTIVE", created_time: "2026-08-01", creative: { image_hash: "h1" } },
  { id: "f1b", name: "FLYER OFERTA - Copia", effective_status: "ACTIVE", created_time: "2026-09-01", creative: { image_hash: "h1" } },
  { id: "v1", name: "VIDEO TESTIMONIO", effective_status: "ACTIVE", created_time: "2026-08-01", creative: { video_id: "vv1" } },
  { id: "f2", name: "FLYER PRECIO", effective_status: "ACTIVE", created_time: "2026-09-10", creative: { image_hash: "h2" } },
  { id: "v2", name: "VIDEO VIEJO", effective_status: "ACTIVE", created_time: "2026-06-01", creative: { video_id: "vv2" } },
];
const periodos = {
  maximo: { cuenta: { spend: "900", impressions: "50000", unique_ctr: "4.1", frequency: "3.2", date_start: "2026-06-01" }, filas: [fila("f1", 300, 150, 6, 2.1), fila("f1b", 100, 50, 5, 1.5), fila("v1", 200, 40, 3, 1.4), fila("f2", 100, 20, 1.2, 1.2), fila("v2", 200, 100, 4, 3)] },
  mes: { cuenta: { spend: "400", impressions: "20000", unique_ctr: "3.8", frequency: "1.9" }, filas: [fila("f1", 120, 60, 5.5, 1.5), fila("f1b", 40, 20, 5, 1.3), fila("v1", 80, 8, 2.5, 1.3), fila("f2", 60, 20, 1.2, 1.2), fila("v2", 100, 40, 4, 2.4)] },
  semana: { cuenta: { spend: "100", impressions: "6000", unique_ctr: "3.5", frequency: "1.3" }, filas: [fila("f1", 30, 16, 5.2, 1.2), fila("v1", 20, 2, 2.4, 1.1), fila("f2", 15, 5, 1.1, 1.1), fila("v2", 35, 10, 2.5, 1.6)] },
  hoy: { cuenta: { spend: "12", impressions: "800", unique_ctr: "3", frequency: "1" }, filas: [fila("f1", 6, 3, 5, 1)] },
};

test("creativo, no campaña: el mismo flyer duplicado en dos conjuntos es UNO", () => {
  const g = agruparCreativos(periodos.mes.filas, new Map(anuncios.map((a) => [a.id, a])));
  const flyer = g.find((c) => c.nombre === "FLYER OFERTA");
  assert.equal(flyer.cantidad, 80);
  assert.equal(flyer.gasto, 160);
  assert.equal(flyer.formato, "flyer");
  assert.equal(flyer.conjuntos.length, 2);
  assert.equal(g.find((c) => c.nombre === "VIDEO TESTIMONIO").formato, "video");
});

test("análisis: funcionó, caro, escalar, CTR < 2 % y frecuencia > 1.8", () => {
  const a = analizar({ periodos, anuncios });
  assert.equal(a.principal.varios, "conversaciones");
  assert.equal(a.costos.mes.gasto, 400);
  assert.ok(a.funciono.some((c) => c.nombre === "FLYER OFERTA"), "el flyer ganador");
  assert.ok(a.caros.some((c) => c.nombre === "VIDEO TESTIMONIO"), "el video a $10 por conversación vs. mediana ~$2.50");
  assert.deepEqual(a.escalar.map((c) => c.nombre), ["FLYER OFERTA"]);
  assert.ok(a.rotar.some((c) => c.nombre === "FLYER PRECIO" && /CTR único 1\.20 %/.test(c.motivo)));
  assert.deepEqual(a.cansando.map((c) => c.nombre), ["VIDEO VIEJO"], "4 % → 2.5 %: todavía pasa, pero se cansa");
  assert.deepEqual(a.frecuencia.map((f) => f.nombre), ["VIDEO VIEJO"]);
  assert.ok(!a.rotar.some((c) => c.nombre === "FLYER OFERTA"));
});

test("reporte: en el orden de Elvin y con qué ajustar", () => {
  const a = analizar({ periodos, anuncios });
  const t = textoReporte({ nombre: "Ana", empresa: "Spa Ana", acuerdo: "3000 x 90 dias", pagoInicial: 3000, cuentaId: "123", estratega: "Rocío" }, a);
  const orden = ["1) Costos", "- Máximo", "- Último mes", "- 7 días", "- Hoy", "2) Lo que ha funcionado", "3) Costos elevados", "4) Para escalar", "5) Flyers y videos", "6) Frecuencia", "Qué ajustaría"];
  let i = -1;
  for (const o of orden) { const j = t.indexOf(o); assert.ok(j > i, `"${o}" en orden`); i = j; }
  assert.match(t, /cada 15 días/);
  assert.match(t, /estratega: Rocío/);
  assert.doesNotMatch(t, /gratis|\bvos\b|tenés/i);
  assert.ok(ajustes(a).length <= 4);
  assert.match(ajustes(a)[0], /^Pedir 1 flyer y 1 video para reemplazar "FLYER PRECIO" y "VIDEO TESTIMONIO", con el ángulo de "FLYER OFERTA"/, "primero lo que no engancha (CTR < 2 %)");
  assert.match(textoReporte({ nombre: "X", acuerdo: "500 mes a mes" }, null), /No tiene el ID de la cuenta/);
  assert.match(textoReporte({ nombre: "X", cuentaId: "9" }, null, { error: "falta el permiso" }), /No pude leer la cuenta 9: falta el permiso/);
});
