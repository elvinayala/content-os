import assert from "node:assert/strict";
import { test } from "node:test";

import { acciones, agruparCreativos, analizar, cadencia, estructura, faseDe, leerAcuerdo, pendientesHoy, resultadoDe, textoReporte, tipoResultado } from "../scripts/meta-ads/revision.mjs";

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

test("cadencia de Elvin (15/oct): acuerdo $3,000+ = dos veces al mes, con cualquier pago inicial; menores, mensual", () => {
  assert.equal(cadencia({ acuerdo: "3500 X 90 DIAS", pagoInicial: 1500 }).dias, 15);
  assert.equal(cadencia({ acuerdo: "3000 x 90 dias", pagoInicial: 500 }).dias, 15, "acuerdo alto aunque el pago inicial sea menor de $1,500");
  assert.match(cadencia({ acuerdo: "5000 x 120 dias", pagoInicial: 750 }).motivo, /acuerdo de \$5,000 · pago inicial \$750/);
  assert.equal(cadencia({ acuerdo: "2000 x 90 dias", pagoInicial: 2000 }).dias, 30, "acuerdo menor de $3,000");
  assert.equal(cadencia({ acuerdo: "1.200 mes a mes", pagoInicial: 1600 }).dias, 30);
  assert.equal(cadencia({}).dias, 30);
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
  assert.deepEqual(pendientesHoy(clientes, {}, "2026-10-15", { porDia: 3 }).hoy.map((x) => x.itemId), ["b", "d", "a"]);
});

test("resultado: el campo results de Meta en palabras", () => {
  const f = { results: [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d", values: [{ value: "201" }] }] };
  assert.equal(resultadoDe(f).cantidad, 201);
  assert.equal(resultadoDe(f).tipo.varios, "conversaciones");
  assert.equal(resultadoDe({ results: [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d" }] }).cantidad, 0);
  assert.equal(tipoResultado("actions:offsite_conversion.fb_pixel_lead").uno, "lead");
});

test("fases: el nombre manda (así nombra el equipo); si no, objetivo y público", () => {
  assert.deepEqual(faseDe({ name: "FASE 1 / TRÁFICO HACIA INSTAGRAM / 28-03-2026" }), { fase: 1, tipo: "trafico" });
  assert.deepEqual(faseDe({ name: "FASE 1 / RECONOCIMIENTO / THRUPLAY" }), { fase: 1, tipo: "thruplay" });
  assert.deepEqual(faseDe({ name: "FASE 4 / ENVOLVER / RMKT" }), { fase: 4, tipo: "thruplay" });
  assert.deepEqual(faseDe({ name: "FASE 3 | RMKT | $4" }), { fase: 3, tipo: "ventas" });
  assert.deepEqual(faseDe({ name: "FASE 5 ESCALAR / CREATIVOS GANADORES" }), { fase: 5, tipo: "escalar" });
  assert.deepEqual(faseDe({ name: "Post do Instagram: Sabor…", objective: "LINK_CLICKS" }, [{ optimization_goal: "VISIT_INSTAGRAM_PROFILE", destination_type: "INSTAGRAM_PROFILE" }]), { fase: 1, tipo: "trafico" });
  assert.deepEqual(faseDe({ name: "[NEXT] WhatsApp Delivery", objective: "OUTCOME_ENGAGEMENT" }, [{ optimization_goal: "CONVERSATIONS", targeting: { custom_audiences: [{ name: "IG - Envolvimento 180 D" }] } }]), { fase: 3, tipo: "ventas" });
  assert.deepEqual(faseDe({ name: "Ventas", objective: "OUTCOME_SALES" }, [{ optimization_goal: "CONVERSATIONS", targeting: { custom_audiences: [{ name: "Semelhante (PR, 1%)" }] } }]), { fase: 2, tipo: "ventas" }, "un similar no es remarketing");
});

// Cuenta de prueba (WhatsApp): un video caro que no engancha, un carrusel caro que sí engancha, un flyer con CTR bajo,
// un flyer a $0.75 (escalar), el flyer de $2 con CTR alto (evaluar) y un video quemado (frecuencia 2.4).
const conv = (v) => [{ indicator: "actions:onsite_conversion.messaging_conversation_started_7d", values: v ? [{ value: String(v) }] : undefined }];
const NOMBRES = { f1: "FLYER OFERTA", f1b: "FLYER OFERTA - Copia", v1: "VIDEO TESTIMONIO", f2: "FLYER PRECIO", v2: "VIDEO VIEJO", f3: "FLYER CEJAS", k1: "CARRUSEL MENU" };
const fila = (ad, gasto, res, ctr, fre) => ({ ad_id: ad, ad_name: NOMBRES[ad], adset_id: "s-" + ad, adset_name: "Conjunto " + ad, spend: String(gasto), impressions: String(Math.round(1000 * fre * 2)), reach: "2000", unique_ctr: String(ctr), frequency: String(fre), results: conv(res) });
const ad = (id, camp, creative, created = "2026-08-01") => ({ id, name: NOMBRES[id] || id, effective_status: "ACTIVE", created_time: created, campaign_id: camp, creative });
const anuncios = [
  ad("f1", "c3", { image_hash: "h1" }), ad("f1b", "c3", { image_hash: "h1" }, "2026-09-01"), ad("f2", "c3", { image_hash: "h2" }), ad("f3", "c3", { image_hash: "h3" }),
  ad("v1", "c4", { video_id: "vv1" }), ad("v2", "c4", { video_id: "vv2" }, "2026-06-01"),
  ad("k1", "c6", { object_story_spec: { link_data: { child_attachments: [{}, {}] } } }),
  ad("v4", "c5", { video_id: "vv4" }),
];
const campanas = [
  { id: "c1", name: "FASE 1 / TRÁFICO HACIA INSTAGRAM" }, { id: "c2", name: "FASE 1 / RECONOCIMIENTO / THRUPLAY" },
  { id: "c3", name: "FASE 2 / VENTAS WHATSAPP / FLYERS" }, { id: "c4", name: "FASE 2 / VENTAS WHATSAPP / VIDEOS" },
  { id: "c5", name: "FASE 3 / RMKT / VIDEO" }, { id: "c6", name: "[NEXT] Delivery", objective: "OUTCOME_SALES" },
];
const conjuntos = [{ campaign_id: "c6", optimization_goal: "CONVERSATIONS", targeting: {} }];
const periodos = {
  maximo: { cuenta: { spend: "1200", impressions: "60000", unique_ctr: "4.1", frequency: "3.2" }, filas: [fila("f1", 300, 150, 6, 2.1), fila("v1", 200, 30, 1.6, 1.4), fila("f2", 100, 30, 1.2, 1.2), fila("v2", 200, 100, 4, 3), fila("f3", 60, 80, 6, 1.2), fila("k1", 90, 15, 4, 1.3)] },
  mes: { cuenta: { spend: "400", impressions: "20000", unique_ctr: "3.8", frequency: "1.9" }, filas: [fila("f1", 120, 60, 5.5, 1.5), fila("f1b", 40, 20, 5, 1.3), fila("v1", 80, 8, 1.5, 1.3), fila("f2", 60, 20, 1.2, 1.2), fila("v2", 100, 40, 4, 2.4), fila("f3", 30, 40, 6, 1.2), fila("k1", 45, 9, 4, 1.3)] },
  semana: { cuenta: { spend: "100", impressions: "6000", unique_ctr: "3.5", frequency: "1.3" }, filas: [fila("f1", 30, 16, 5.2, 1.2), fila("v1", 20, 2, 1.4, 1.1), fila("f2", 15, 5, 1.1, 1.1), fila("v2", 35, 14, 3.9, 1.6), fila("f3", 10, 14, 6, 1.1)] },
  hoy: { cuenta: { spend: "12", impressions: "800", unique_ctr: "3", frequency: "1" }, filas: [fila("f1", 6, 3, 5, 1)] },
};

test("creativo, no campaña: el mismo flyer duplicado en dos conjuntos es UNO", () => {
  const g = agruparCreativos(periodos.mes.filas, new Map(anuncios.map((a) => [a.id, a])));
  const flyer = g.find((c) => c.nombre === "FLYER OFERTA");
  assert.equal(flyer.cantidad, 80);
  assert.equal(flyer.gasto, 160);
  assert.equal(flyer.conjuntos.length, 2);
  assert.equal(g.find((c) => c.nombre === "CARRUSEL MENU").formato, "carrusel");
});

test("estructura: qué le falta para la estrategia completa de 5 fases", () => {
  const e = estructura(campanas, conjuntos, anuncios);
  assert.equal(e.total, 6);
  assert.deepEqual(e.porFase, [2, 3, 1, 0, 0]);
  assert.ok(e.falta.some((f) => /Fase 3 · remarketing: 1 de 2/.test(f)));
  assert.ok(e.falta.some((f) => /Fase 4/.test(f)));
  assert.ok(!e.falta.some((f) => /Fase 1|Fase 2/.test(f)), "F1 completa y F2 con 3 campañas de video, flyers y carrusel");
  assert.equal(e.completa, false);
  const muchas = estructura(Array.from({ length: 14 }, (_, i) => ({ id: "x" + i, name: `FASE 2 / VENTAS ${i}` })), [], []);
  assert.equal(muchas.sobran, true);
});

test("costo vs. CTR primero: costo alto + CTR bajo = reemplazar ya; < $1 = escalar; ≤ $2 con CTR alto = evaluar", () => {
  const a = analizar({ periodos, anuncios, campanas, conjuntos, hoy: "2026-10-15" });
  const nivel = (nombre) => a.problemas.find((c) => c.nombre === nombre)?.nivel;
  assert.equal(nivel("VIDEO TESTIMONIO"), "urgente", "$10 por conversación y CTR 1.5 %");
  assert.equal(nivel("CARRUSEL MENU"), "costo", "$5 por conversación pero CTR 4 %: revisar oferta o gancho");
  assert.equal(nivel("FLYER PRECIO"), "ctr", "$3 no es caro aquí, pero CTR 1.2 %");
  assert.equal(nivel("FLYER OFERTA"), undefined);
  assert.deepEqual(a.escalar.map((c) => [c.nombre, c.nivel]), [["FLYER CEJAS", "escalar"], ["FLYER OFERTA", "evaluar"]]);
  assert.deepEqual(a.frecuencia.map((f) => f.nombre), ["VIDEO VIEJO"]);
  assert.equal(a.estado, "no-optimizada");
});

test("acciones para Ritmo: una por punto, con id estable y en orden de urgencia", () => {
  const a = analizar({ periodos, anuncios, campanas, conjuntos, hoy: "2026-10-15" });
  const xs = acciones(a);
  assert.equal(xs[0].tipo, "reemplazar");
  assert.equal(xs[0].prioridad, 1);
  assert.match(xs[0].texto, /^Reemplazar Video "VIDEO TESTIMONIO" · \$10\.00 c\/u · CTR 1\.5 %/);
  assert.ok(xs.some((x) => x.id === "escalar:h3" && /surf, vertical u horizontal/.test(x.texto)), "a $0.75 se puede escalar con surf");
  assert.ok(xs.some((x) => x.tipo === "estructura" && /Fase 4/.test(x.texto)));
  assert.ok(xs.some((x) => x.id === "frecuencia"));
  assert.equal(new Set(xs.map((x) => x.id)).size, xs.length, "ids únicos");
  assert.deepEqual(acciones(analizar({ periodos, anuncios, campanas, conjuntos, hoy: "2026-10-15" })).map((x) => x.id), xs.map((x) => x.id), "el mismo análisis da los mismos ids");
});

test("resumen: claro, con espacios, pocos emojis y en orden (costos → reemplazar → escalar → estrategia → frecuencia)", () => {
  const a = analizar({ periodos, anuncios, campanas, conjuntos, hoy: "2026-10-15" });
  const t = textoReporte({ nombre: "Ana", empresa: "Spa Ana", acuerdo: "3000 x 90 dias", pagoInicial: 3000, cuentaId: "123", estratega: "Rocío" }, a, { ritmo: "https://ritmo.test/x" });
  const orden = ["📋 *Spa Ana*", "⚠️ *Cuenta no optimizada*", "💰 *Costo por conversación*", "🔴 *Reemplazar ya*", "🟠 *Costo alto*", "🟡 *CTR bajo de 2 %*", "🚀 *Escalar*", "📐 *Estrategia*", "🔁 *Frecuencia", "👉 Marca cada punto en Ritmo"];
  let i = -1;
  for (const o of orden) { const j = t.indexOf(o); assert.ok(j > i, `"${o}" en orden`); i = j; }
  assert.match(t, /Revisión dos veces al mes · Estratega: Rocío/);
  assert.match(t, /Máx \$[\d.]+ · Mes \$[\d.]+ · 7 días \$[\d.]+ · Hoy \$[\d.]+/);
  assert.match(t, /\n\n🔴/, "cada bloque separado por una línea en blanco");
  assert.ok(t.split("\n").length <= 32, "corto");
  assert.doesNotMatch(t, /gratis|\bvos\b|tenés/i);
  assert.match(textoReporte({ nombre: "X", acuerdo: "500 mes a mes" }, null), /No tiene el ID de la cuenta/);
  assert.match(textoReporte({ nombre: "X", cuentaId: "9" }, null, { error: "falta el permiso" }), /No pude leer la cuenta 9: falta el permiso/);
});
