import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildCampaignBody, buildTargeting, buildAdSetBody, buildCreativeBody, buildAdBody,
  specPublicoWeb, specPublicoEngagement, specSimilar, payloadLista, sha256,
  validarPlan, expandirPlan, resumirInsights, centavos,
} from "../scripts/meta-ads/core.mjs";

const planBase = () => ({
  marca: "level-up", nombre: "LU · Test", objetivo: "OUTCOME_LEADS", cuentaId: "2010206776851",
  pageId: "111", igUserId: "222", pixelId: "27706808412306198", landing: "https://class.levelupmediapr.net/crecimiento",
  urlTags: "utm_source=meta&utm_medium=paid&utm_campaign=lu-diagnostico&utm_content={{ad.name}}&utm_term={{adset.name}}",
  topeDiario: 120,
  targetingBase: { paises: ["PR"], edadMin: 25, edadMax: 55, plataformas: ["instagram"] },
  publicos: {
    A: { nombre: "Frío", intereses: [{ id: "1", name: "Coaching" }], advantage: true, excluir: ["clientes"] },
    C: { nombre: "Caliente", incluir: ["web-180d", "123456"], excluir: ["clientes"] },
  },
  creativos: [{ clave: "V1", copy: { textoPrincipal: "Tú decides.", titulo: "T", descripcion: "D" } }],
  conjuntos: [
    { clave: "A-V1", publico: "A", creativo: "V1", presupuestoDiario: 13 },
    { clave: "C-V1", publico: "C", creativo: "V1", presupuestoDiario: 13 },
  ],
});
const disponibles = new Map([["clientes", "900"], ["web-180d", "901"]]);

test("campaña: PAUSED, ABO declarado, sin categoría especial", () => {
  const b = buildCampaignBody({ nombre: "X" });
  assert.equal(b.status, "PAUSED");
  assert.equal(b.objective, "OUTCOME_LEADS");
  assert.equal(b.is_adset_budget_sharing_enabled, "false");
  assert.deepEqual(b.special_ad_categories, []);
});

test("targeting: IG-only, advantage explícito, públicos y exclusiones", () => {
  const t = buildTargeting({ incluir: ["1"], excluir: ["2"], intereses: [{ id: "5", name: "Coaching" }], advantage: false });
  assert.deepEqual(t.publisher_platforms, ["instagram"]);
  assert.ok(t.instagram_positions.includes("reels"));
  assert.deepEqual(t.targeting_automation, { advantage_audience: 0 });
  assert.deepEqual(t.custom_audiences, [{ id: "1" }]);
  assert.deepEqual(t.excluded_custom_audiences, [{ id: "2" }]);
  assert.deepEqual(t.flexible_spec, [{ interests: [{ id: "5", name: "Coaching" }] }]);
  assert.equal(t.geo_locations.countries[0], "PR");
});

test("conjunto: leads del pixel, centavos, PAUSED", () => {
  const b = buildAdSetBody({ nombre: "S", campaignId: "c", presupuestoDiario: 13, pixelId: "p", targeting: {} });
  assert.equal(b.daily_budget, "1300");
  assert.equal(b.optimization_goal, "OFFSITE_CONVERSIONS");
  assert.deepEqual(b.promoted_object, { pixel_id: "p", custom_event_type: "LEAD" });
  assert.equal(b.destination_type, "WEBSITE");
  assert.equal(b.status, "PAUSED");
  assert.equal(centavos(1), "100");
  assert.throws(() => buildAdSetBody({ nombre: "S", campaignId: "c", presupuestoDiario: 13, targeting: {} }));
});

test("creativo: video + instagram_user_id + url_tags + CTA con link", () => {
  const b = buildCreativeBody({ nombre: "C", pageId: "1", igUserId: "2", videoId: "v", link: "https://x", textoPrincipal: "hola", titulo: "t", descripcion: "d", urlTags: "utm_source=meta" });
  assert.equal(b.object_story_spec.instagram_user_id, "2");
  assert.equal(b.object_story_spec.instagram_actor_id, undefined);
  assert.equal(b.object_story_spec.video_data.video_id, "v");
  assert.deepEqual(b.object_story_spec.video_data.call_to_action, { type: "LEARN_MORE", value: { link: "https://x" } });
  assert.equal(b.url_tags, "utm_source=meta");
  assert.throws(() => buildCreativeBody({ nombre: "C", pageId: "1", link: "x" }));
});

test("anuncio: PAUSED con creative_id", () => {
  assert.deepEqual(buildAdBody({ nombre: "A", adsetId: "s", creativeId: "k" }), { name: "A", adset_id: "s", creative: { creative_id: "k" }, status: "PAUSED" });
});

test("públicos: web por pixel, engagement IG/FB, similar, lista hasheada", () => {
  const w = specPublicoWeb({ nombre: "W", pixelId: "p", dias: 180 });
  assert.equal(w.subtype, "WEBSITE");
  assert.equal(w.rule.inclusions.rules[0].retention_seconds, 180 * 86400);
  const e = specPublicoEngagement({ nombre: "E", pageId: "f", igUserId: "i", tipo: "video50" });
  assert.equal(e.rule.inclusions.rules.length, 2);
  assert.equal(e.rule.inclusions.rules[0].filter.filters[1].value, "50");
  assert.throws(() => specPublicoEngagement({ nombre: "E", tipo: "engagers" }));
  const s = specSimilar({ nombre: "L", origenId: "9", ratio: 0.01 });
  assert.deepEqual(s.lookalike_spec, { country: "PR", ratio: 0.01 });
  const p = payloadLista([[" Ana@X.com ", "+1 (787) 555-1234"], ["", ""]]);
  assert.deepEqual(p.schema, ["EMAIL", "PHONE"]);
  assert.equal(p.data.length, 1);
  assert.equal(p.data[0][0], sha256("ana@x.com"));
  assert.equal(p.data[0][1], sha256("17875551234"));
});

test("validarPlan: pasa el plan base y detecta tope, mínimo, gratis, voseo y públicos", () => {
  assert.deepEqual(validarPlan(planBase(), { publicosDisponibles: disponibles }), []);
  const p = planBase();
  p.conjuntos[0].presupuestoDiario = 5;
  p.conjuntos.push({ clave: "X", publico: "A", creativo: "V1", presupuestoDiario: 200 });
  p.creativos[0].copy.textoPrincipal = "te lo envío gratis, vos podés";
  p.publicos.C.incluir.push("no-existe");
  const errs = validarPlan(p, { publicosDisponibles: disponibles });
  assert.ok(errs.some((e) => e.includes("tope")));
  assert.ok(errs.some((e) => e.includes("< $10")));
  assert.ok(errs.some((e) => e.includes("gratis")));
  assert.ok(errs.some((e) => e.includes("voseo")));
  assert.ok(errs.some((e) => e.includes("no-existe")));
});

test("expandirPlan: resuelve públicos por clave e ids, marca video pendiente", () => {
  const arbol = expandirPlan(planBase(), { publicosDisponibles: disponibles });
  assert.equal(arbol.conjuntos.length, 2);
  const c = arbol.conjuntos[1];
  assert.deepEqual(c.adset.targeting.custom_audiences, [{ id: "901" }, { id: "123456" }]);
  assert.deepEqual(c.adset.targeting.excluded_custom_audiences, [{ id: "900" }]);
  assert.ok(c.ad.nombre.includes("reemplazar video"));
  const body = c.creativo.body("111", "222", "vid");
  assert.equal(body.object_story_spec.video_data.video_id, "vid");
  assert.ok(body.url_tags.includes("{{ad.name}}"));
  assert.deepEqual(arbol.conjuntos[0].adset.targeting.targeting_automation, { advantage_audience: 1 });
});

test("resumirInsights: CPL, mediana y recomendaciones", () => {
  const rows = [
    { adset_id: "1", adset_name: "a", spend: "26", impressions: "3000", clicks: "60", ctr: "2", actions: [{ action_type: "lead", value: "4" }] },
    { adset_id: "2", adset_name: "b", spend: "26", impressions: "3000", clicks: "10", ctr: "0.3", actions: [{ action_type: "lead", value: "1" }] },
    { adset_id: "3", adset_name: "c", spend: "26", impressions: "3000", clicks: "10", ctr: "1.5", actions: [] },
  ];
  const r = resumirInsights(rows, { compuertas: { cplMax: 10, ctrMin: 1 } });
  assert.equal(r.filas[0].cpl, 6.5);
  assert.ok(r.filas[0].recomendacion.startsWith("ganador"));
  assert.ok(r.filas[1].recomendacion.includes("pausar"));
  assert.ok(r.filas[2].recomendacion.includes("sin leads"));
  assert.equal(r.leadsTotal, 5);
});
