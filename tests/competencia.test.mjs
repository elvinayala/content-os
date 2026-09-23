import { test } from "node:test";
import assert from "node:assert/strict";
import { urlBiblioteca, normalizar, gancho, senales, rankear, resumen, destinoDe, buscarEnBiblioteca } from "../scripts/meta-ads/competencia.mjs";

const AHORA = Date.parse("2026-09-23T12:00:00Z");
const item = (o) => ({
  pageName: "Taíno Plumbing LLC", pageID: "1", adArchiveID: String(Math.random()), collationCount: 1,
  publisherPlatform: ["FACEBOOK", "INSTAGRAM"], startDateFormatted: "2026-06-25T07:00:00.000Z",
  snapshot: { displayFormat: "IMAGE", ctaType: "CALL_NOW", title: "Llama ahora", body: { text: "Una tubería tapada puede provocar un problema.\nLlámanos al 787-423-8448. Destape desde $149 con garantía." } },
  ...o,
});

test("urlBiblioteca arma la búsqueda por término y por página", () => {
  const u = new URL(urlBiblioteca({ termino: "plomero", pais: "PR" }));
  assert.equal(u.searchParams.get("q"), "plomero");
  assert.equal(u.searchParams.get("country"), "PR");
  assert.equal(u.searchParams.get("active_status"), "active");
  const p = new URL(urlBiblioteca({ pageId: "123" }));
  assert.equal(p.searchParams.get("view_all_page_id"), "123");
  assert.equal(p.searchParams.get("q"), null);
});

test("normalizar saca días activo, variantes, formato y destino", () => {
  const a = normalizar(item({ collationCount: 4 }), AHORA);
  assert.equal(a.dias, 90);
  assert.equal(a.variantes, 4);
  assert.equal(a.formato, "IMAGE");
  assert.deepEqual(a.plataformas, ["facebook", "instagram"]);
  assert.equal(destinoDe(a), "llamada");
});

test("gancho = primera línea con sustancia; señales detectan precio, garantía y llamada", () => {
  assert.equal(gancho("🔥\nUna tubería tapada puede provocar un problema.\nMás"), "Una tubería tapada puede provocar un problema.");
  const s = senales("Destape desde $149 con garantía. Llámanos hoy al 787-000-0000, quedan 2 cupos");
  assert.ok(s.some((x) => x.startsWith("precio $149")));
  assert.ok(s.includes("garantía"));
  assert.ok(s.includes("pide llamada"));
  assert.ok(s.includes("urgencia/escasez"));
});

test("rankear: los de más días y variantes arriba, deduplica, excluye la marca propia y plantillas vacías", () => {
  const items = [
    item({ pageName: "Nuevo", startDateFormatted: "2026-09-20T07:00:00.000Z", snapshot: { displayFormat: "VIDEO", ctaType: "WHATSAPP_MESSAGE", body: { text: "Anuncio de 3 días con gancho largo" } } }),
    item({ pageName: "Veterano", collationCount: 6 }),
    item({ pageName: "Veterano", collationCount: 2, startDateFormatted: "2026-08-01T07:00:00.000Z" }), // mismo gancho → dedup
    item({ pageName: "Resuelto PR" }),
    item({ pageName: "SerVio", snapshot: { displayFormat: "DCO", title: "{{product.name}}", body: { text: "{{product.brand}}" } } }),
  ];
  const r = rankear(items, { ahora: AHORA, excluirPaginas: ["Resuelto PR"] });
  assert.equal(r[0].pagina, "Veterano");
  assert.equal(r[0].variantes, 6);
  assert.equal(r.filter((a) => a.pagina === "Veterano").length, 1);
  assert.ok(!r.some((a) => a.pagina === "Resuelto PR"));
  assert.ok(!r.some((a) => a.pagina === "SerVio"));
  assert.equal(r.at(-1).pagina, "Nuevo");
});

test("resumen es corto y trae el top con gancho", () => {
  const r = rankear([item({ collationCount: 3 }), item({ pageName: "Otro", snapshot: { displayFormat: "VIDEO", ctaType: "WHATSAPP_MESSAGE", body: { text: "¿Se te tapó el fregadero otra vez?\nEscríbenos por WhatsApp" } } })], { ahora: AHORA });
  const t = resumen(r, { termino: "plomero" });
  assert.match(t, /COMPETENCIA · "plomero"/);
  assert.match(t, /1\. Taíno Plumbing LLC · 90 días · 3 var/);
  assert.match(t, /Gancho: "¿Se te tapó el fregadero otra vez\?"/);
  assert.ok(t.length < 3000);
});

test("buscarEnBiblioteca exige token y manda startUrls + tope de gasto", async () => {
  await assert.rejects(() => buscarEnBiblioteca({ terminos: ["x"] }), /APIFY_TOKEN/);
  let visto;
  const fetchImpl = async (url, init) => { visto = { url, body: JSON.parse(init.body), auth: init.headers.Authorization }; return { ok: true, text: async () => "[]" }; };
  const out = await buscarEnBiblioteca({ terminos: ["plomero", "destape"], token: "t", fetchImpl, max: 20 });
  assert.deepEqual(out, []);
  assert.match(visto.url, /apify~facebook-ads-scraper\/run-sync-get-dataset-items/);
  assert.match(visto.url, /maxTotalChargeUsd=0.5/);
  assert.equal(visto.body.startUrls.length, 2);
  assert.equal(visto.body.resultsLimit, 20);
  assert.equal(visto.auth, "Bearer t");
});
