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

// ---------- plantillas (tráfico / DM con publicaciones existentes) ----------
import { buildAdSetBody as adsetBody, buildCreativeExistente, OPTIMIZACIONES } from "../scripts/meta-ads/core.mjs";
import { planFollowMe, planTraficoUrl, planDmInstagram, planQuiz, repartir, opcionesDesdeFlags } from "../scripts/meta-ads/plantillas.mjs";

const cfgMauro = { clave: "mauro", nombre: "Mauro PR", etiqueta: "MAURO", cuentaId: "503566678495233", pageId: "686366657897015", igUserId: "17841404146064202", igHandle: "_mauropr", reglas: { edad: [18, 35], ubicaciones: "instagram", minPorConjunto: 5 } };
const cfgLU = { clave: "level-up", nombre: "Level Up Media", etiqueta: "LU", cuentaId: "2010206776851", pageId: "103458229415869", igUserId: "222", pixelId: "27706808412306198", landing: { url: "https://class.levelupmediapr.net/crecimiento", utmBase: "utm_source=meta&utm_medium=paid" }, exclusionesBase: ["111", "222"] };

test("repartir respeta el mínimo por conjunto", () => {
  assert.equal(repartir(15, 2, 5), 7.5);
  assert.throws(() => repartir(15, 2, 10), /mínimo \$10/);
});

test("follow-me: perfil IG, reels existentes, tope de edad → público original (Meta no acepta age_max con Advantage+)", () => {
  const plan = planFollowMe(cfgMauro, { reels: ["18166493623461894", "18164515909468572"], presupuesto: 15 });
  assert.equal(plan.modo, "perfil-ig");
  assert.equal(plan.conjuntos.length, 2);
  assert.equal(plan.conjuntos[0].presupuestoDiario, 7.5);
  assert.equal(plan.publicos.P1.advantage, false);
  assert.equal(plan.publicos.P1.amplio, true);
  assert.deepEqual(validarPlan(plan), []);
  const arbol = expandirPlan(plan);
  assert.equal(arbol.campana.objective, "OUTCOME_TRAFFIC");
  const a = arbol.conjuntos[0].adset;
  assert.equal(a.optimization_goal, "PROFILE_VISIT");
  assert.equal(a.destination_type, "INSTAGRAM_PROFILE");
  assert.deepEqual(a.promoted_object, { page_id: "686366657897015" });
  assert.deepEqual(a.targeting.publisher_platforms, ["instagram"]);
  assert.equal(a.targeting.age_max, 35);
  const cr = arbol.conjuntos[0].creativo.body(plan.pageId, plan.igUserId, null);
  assert.equal(cr.source_instagram_media_id, "18166493623461894");
  assert.equal(cr.instagram_user_id, "17841404146064202");
  assert.deepEqual(cr.call_to_action, { type: "VIEW_INSTAGRAM_PROFILE", value: { link: "https://www.instagram.com/_mauropr/" } });
  assert.equal(arbol.conjuntos[0].creativo.existente, "reel 18166493623461894");
});

test("trafico-url: clics al enlace con CTA y link; sin pixel no es error", () => {
  const plan = planTraficoUrl(cfgMauro, { url: "https://youtu.be/J9AxsDIkhOw", reels: ["1"], presupuesto: 10 });
  assert.deepEqual(validarPlan(plan), []);
  const n = expandirPlan(plan).conjuntos[0];
  assert.equal(n.adset.optimization_goal, "LINK_CLICKS");
  assert.equal(n.adset.destination_type, "WEBSITE");
  assert.equal(n.adset.promoted_object, undefined);
  assert.deepEqual(n.creativo.body("p", "ig", null).call_to_action, { type: "WATCH_MORE", value: { link: "https://youtu.be/J9AxsDIkhOw" } });
  assert.throws(() => planTraficoUrl(cfgMauro, { reels: ["1"] }), /--url/);
});

test("dm-instagram: conversaciones por DM con promoted_object de página y exclusiones de la marca", () => {
  const plan = planDmInstagram(cfgLU, { videos: ["v1", "v2"], copias: [{ textoPrincipal: "Hola" }], presupuesto: 30, edad: [25, 55] });
  assert.equal(plan.modo, "dm-ig");
  assert.deepEqual(plan.publicos.P1.excluir, ["111", "222"]);
  assert.deepEqual(validarPlan(plan), []);
  const a = expandirPlan(plan).conjuntos[1].adset;
  assert.equal(a.optimization_goal, "CONVERSATIONS");
  assert.equal(a.destination_type, "INSTAGRAM_DIRECT");
  assert.deepEqual(a.promoted_object, { page_id: "103458229415869" });
  assert.equal(a.daily_budget, "1500");
});

test("quiz: leads del pixel con UTMs dinámicos y mínimo $10", () => {
  const plan = planQuiz(cfgLU, { videos: ["v1", "v2", "v3"], copias: [{ textoPrincipal: "Tú decides" }], presupuesto: 39 });
  assert.equal(plan.modo, "leads");
  assert.match(plan.urlTags, /utm_campaign=level-up-quiz&utm_content=\{\{ad\.name\}\}/);
  assert.deepEqual(validarPlan(plan), []);
  assert.throws(() => planQuiz(cfgLU, { videos: ["a", "b", "c", "d"], copias: [{ textoPrincipal: "x" }], presupuesto: 30 }), /mínimo \$10/);
  assert.throws(() => planQuiz({ ...cfgLU, pixelId: null }, { videos: ["a"], copias: [{ textoPrincipal: "x" }] }), /pixelId/);
});

test("validarPlan: reel existente sin igUserId es error; público amplio explícito pasa", () => {
  const plan = planFollowMe({ ...cfgMauro, igUserId: null }, { reels: ["1"], presupuesto: 5 });
  assert.ok(validarPlan(plan).some((e) => /igUserId/.test(e)));
});

test("buildAdSetBody / buildCreativeExistente: validaciones y formas", () => {
  assert.throws(() => adsetBody({ nombre: "x", campaignId: "c", presupuestoDiario: 5, optimizacion: "PROFILE_VISIT", destino: "INSTAGRAM_PROFILE", targeting: {} }), /pageId/);
  assert.throws(() => buildCreativeExistente({ nombre: "x", pageId: "p", igMediaId: "m" }), /igUserId/);
  const post = buildCreativeExistente({ nombre: "x", pageId: "p", postId: "q", cta: "LEARN_MORE", link: "https://a.b" });
  assert.equal(post.object_story_id, "p_q");
  assert.equal(OPTIMIZACIONES["dm-ig"].objetivo, "OUTCOME_SALES");
});

test("opcionesDesdeFlags parsea reels/presupuesto/edad y rechaza edad mal escrita", () => {
  const o = opcionesDesdeFlags({ reels: "1,2 3", presupuesto: "15", edad: "18-35", url: "https://x.y" });
  assert.deepEqual(o.reels, ["1", "2", "3"]);
  assert.equal(o.presupuesto, 15);
  assert.deepEqual(o.edad, [18, 35]);
  assert.throws(() => opcionesDesdeFlags({ edad: "18" }), /--edad/);
});

test("resumirInsights: seguidores y costo por seguidor con compuerta ≤ $1", () => {
  const rows = [
    { adset_id: "1", adset_name: "FM-1", spend: "12", impressions: "5000", clicks: "50", ctr: "1", cpc: "0.24", actions: [{ action_type: "follow", value: "4" }] },
    { adset_id: "2", adset_name: "FM-2", spend: "12", impressions: "5000", clicks: "50", ctr: "1", cpc: "0.24", actions: [{ action_type: "instagram_profile_follow", value: "24" }] },
  ];
  const r = resumirInsights(rows, { compuertas: { costoPorSeguidorMax: 1 } });
  assert.equal(r.filas[0].seguidores, 4);
  assert.equal(r.filas[0].costoSeguidor, 3);
  assert.match(r.filas[0].recomendacion, /seguidor > 2× meta/);
  assert.equal(r.filas[1].costoSeguidor, 0.5);
  assert.equal(r.filas[1].recomendacion, "seguir");
});

test("resumirInsights: ROAS, señal de ESCALAR y frecuencia quemada", () => {
  const rows = [
    { adset_id: "1", adset_name: "gana", spend: "100", impressions: "20000", frequency: "1.5", clicks: "600", ctr: "3", cpc: "0.17", actions: [{ action_type: "lead", value: "20" }, { action_type: "purchase", value: "3" }], action_values: [{ action_type: "purchase", value: "800" }], purchase_roas: [{ action_type: "omni_purchase", value: "8" }] },
    { adset_id: "2", adset_name: "quemado", spend: "60", impressions: "9000", frequency: "3.1", clicks: "90", ctr: "1", cpc: "0.66", actions: [{ action_type: "lead", value: "6" }] },
    { adset_id: "3", adset_name: "flojo", spend: "15", impressions: "2000", frequency: "1.2", clicks: "20", ctr: "1", cpc: "0.75", actions: [{ action_type: "lead", value: "2" }] },
  ];
  const r = resumirInsights(rows, { compuertas: { cplMax: 10, ctrMin: 1, roasMeta: 6 } });
  assert.equal(r.filas[0].roas, 8);
  assert.match(r.filas[0].recomendacion, /^ESCALAR/);
  assert.match(r.filas[1].recomendacion, /^pausar.*frecuencia 3\.1/);
  assert.match(r.filas[2].aviso, /CTR 1\.00% < 2 %/);
  assert.equal(r.escalar.length, 1);
  assert.equal(r.ventasTotal, 3);
  assert.equal(r.roasTotal, 800 / 175);
});

// ---- Método de Elvin · 5 fases (23/sep/2026) ----
import { planEstrategia5Fases, repartirFases, publicosMetodo } from "../scripts/meta-ads/plantillas.mjs";
const cfg5 = { clave: "level-up", nombre: "Level Up Media", etiqueta: "LU", cuentaId: "1", pageId: "11", igUserId: "22", igHandle: "levelupmediapr", pixelId: "33", publicosClave: {} };

test("5 fases: el presupuesto cuadra exacto, F2 ≥ 65 % y cada conjunto ≥ $10", () => {
  for (const total of [60, 100, 150, 300, 1000]) {
    const est = planEstrategia5Fases(cfg5, { destino: "dm-ig", presupuesto: total, reels: ["1", "2", "3", "4"] });
    const suma = est.fases.flatMap((f) => f.conjuntos).reduce((s, c) => s + c.presupuestoDiario, 0);
    assert.equal(suma, total, `total ${total}`);
    const f2 = est.fases.find((f) => f.fase === "f2").conjuntos.reduce((s, c) => s + c.presupuestoDiario, 0);
    assert.ok(f2 / total >= 0.65, `F2 ${f2}/${total}`);
    for (const c of est.fases.flatMap((f) => f.conjuntos)) assert.ok(c.presupuestoDiario >= 10, `${c.clave} ${c.presupuestoDiario}`);
  }
});

test("5 fases: públicos primero, F3 remarketing a ventas con caliente/tibio, F4 ThruPlay 365 sin CTA", () => {
  const est = planEstrategia5Fases(cfg5, { destino: "leads", presupuesto: 300, reels: ["1", "2"], url: "https://x.com" });
  assert.deepEqual(Object.keys(est.publicosACrear).sort(), ["engagers-365", "mensajes-365", "similar-engagers-1", "video25-365", "video75-365", "visitas-120", "web-180"].sort());
  const [f1, f2, f3, f4] = est.fases;
  assert.equal(f1.modo, "enlace");
  assert.equal(f2.modo, "leads");
  assert.equal(f3.modo, "leads");
  assert.deepEqual(Object.keys(f3.publicos), ["CAL", "TIB"]);
  assert.ok(f3.publicos.CAL.incluir.includes("video75-365") && f3.publicos.CAL.incluir.includes("web-180"));
  assert.ok(f3.publicos.TIB.incluir.includes("similar-engagers-1"));
  assert.equal(f4.modo, "thruplay");
  assert.equal(f4.creativos[0].cta, null);
  assert.ok(/Escalar/.test(est.f5));
});

test("5 fases: con poco presupuesto se omite F4 y luego F3 antes que bajar ventas", () => {
  const { reparto, omitidas } = repartirFases(40);
  assert.equal(reparto.f3, undefined);
  assert.equal(reparto.f4, undefined);
  assert.ok(omitidas.f3 && omitidas.f4);
  assert.equal(reparto.f1 + reparto.f2, 40);
  assert.throws(() => planEstrategia5Fases(cfg5, { destino: "whatsapp", presupuesto: 100, reels: ["1"] }), /Bori/);
  assert.ok(!publicosMetodo({ ...cfg5, pixelId: null })["web-180"]);
});

test("ThruPlay: conjunto sin destination_type y creativo existente sin CTA", () => {
  const est = planEstrategia5Fases(cfg5, { destino: "dm-ig", presupuesto: 100, reels: ["9"] });
  const f4 = est.fases.find((f) => f.fase === "f4");
  const disp = new Map([["engagers-365", "501"], ["video25-365", "502"]]);
  const arbol = expandirPlan(f4, { publicosDisponibles: disp });
  assert.equal(arbol.campana.objective, "OUTCOME_AWARENESS");
  assert.equal(arbol.conjuntos[0].adset.optimization_goal, "THRUPLAY");
  assert.ok(!("destination_type" in arbol.conjuntos[0].adset));
  const body = arbol.conjuntos[0].creativo.body("11", "22", null);
  assert.equal(body.call_to_action, undefined);
  assert.equal(body.source_instagram_media_id, "9");
});

// Elvin (25/sep): Max crea los flyers y los videos y arma las campañas con ellos.
test("estrategia con los creativos que produjo Max: se suben a Meta (imagen por bytes, video por URL) y se usan", async () => {
  const { planEstrategia5Fases, piezasDesdeJson } = await import("../scripts/meta-ads/plantillas.mjs");
  const { crearEnMeta } = await import("../scripts/meta-ads/core.mjs");
  const piezas = piezasDesdeJson(JSON.stringify([
    { tipo: "imagen", url: "https://v3b.fal.media/f1.png", textoPrincipal: "Tu sonrisa en una cita", titulo: "Blanqueamiento" },
    { tipo: "imagen", url: "https://v3b.fal.media/f2.png", textoPrincipal: "Carillas sin miedo", titulo: "Carillas" },
    { tipo: "video", url: "https://v3b.fal.media/v1.mp4", textoPrincipal: "La doctora te explica", titulo: "Sin dolor" },
  ]));
  assert.throws(() => piezasDesdeJson('[{"tipo":"imagen","url":"http://x"}]'), /https/);
  assert.throws(() => piezasDesdeJson('[{"tipo":"imagen","url":"https://x"}]'), /textoPrincipal/);
  const cfg = { clave: "cliente:sonrisa", nombre: "Sonrisa", cuentaId: "123", pageId: "111", igUserId: "222", reglas: { minPorConjunto: 10 } };
  const est = planEstrategia5Fases(cfg, { destino: "dm-ig", presupuesto: 100, piezas });
  const f2 = est.fases.find((f) => f.fase === "f2");
  assert.ok(f2.creativos.some((c) => c.imagenUrl === "https://v3b.fal.media/f1.png"), "los flyers de Max van en ventas");
  const f4 = est.fases.find((f) => f.fase === "f4");
  assert.equal(f4?.creativos[0].videoUrl, "https://v3b.fal.media/v1.mp4", "el ThruPlay usa el video que produjo Max");

  // Meta simulado: registra las llamadas.
  const llamadas = [];
  let n = 0;
  const c = { graph: async (m, path, params) => {
    llamadas.push([m, path, params]);
    if (path.endsWith("/adimages")) return { images: { "f.png": { hash: "HASH-" + (++n) } } };
    if (path.endsWith("/advideos")) return { id: "VID1" };
    if (path === "/VID1") return { status: { video_status: "ready" }, picture: "https://thumb" };
    return { id: "ID" + (++n) };
  } };
  const fetchImpl = async () => ({ ok: true, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer });
  const meta = await crearEnMeta(c, f2, { log: () => {}, fetchImpl });
  const subidas = llamadas.filter(([, p]) => p.endsWith("/adimages"));
  assert.equal(subidas.length, new Set(f2.creativos.filter((x) => x.imagenUrl).map((x) => x.imagenUrl)).size, "cada flyer se sube una vez");
  assert.equal(subidas[0][2].bytes, Buffer.from([1, 2, 3]).toString("base64"));
  const creativo = llamadas.find(([, p]) => p.endsWith("/adcreatives"))[2];
  assert.ok(creativo.object_story_spec.link_data.image_hash.startsWith("HASH-"), "el creativo usa el hash del flyer");
  assert.ok(Object.keys(meta.anuncios).length === f2.conjuntos.length);
  // Idempotente: correr otra vez no vuelve a subir ni a crear.
  const antes = llamadas.length;
  await crearEnMeta(c, f2, { log: () => {}, fetchImpl });
  assert.equal(llamadas.length, antes);

  // Video: se sube por URL, se espera a que esté listo y se usa su miniatura.
  llamadas.length = 0;
  await crearEnMeta(c, f4, { log: () => {}, fetchImpl, dormir: async () => {}, publicosDisponibles: new Map([["engagers-365", "901"], ["video25-365", "902"]]) });
  assert.ok(llamadas.some(([, p, q]) => p.endsWith("/advideos") && q.file_url === "https://v3b.fal.media/v1.mp4"));
  const cv = llamadas.find(([, p]) => p.endsWith("/adcreatives"))[2];
  assert.equal(cv.object_story_spec.video_data.video_id, "VID1");
  assert.equal(cv.object_story_spec.video_data.image_url, "https://thumb");
});
