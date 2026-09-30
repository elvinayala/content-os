import assert from "node:assert/strict";
import { test } from "node:test";

import { firmarCookieCliente, leerTokenCliente, tokenCliente, verificarCookieCliente } from "../lib/clientes-app/acceso.ts";

const S = "secreto-de-prueba";
const ITEM = "3e8ff88e-1e1d-4360-a690-924e873e1e1c";
const OTRO = "b8631063-13ae-4d0c-8d9f-c6025413e711";

test("link personal: ida y vuelta", async () => {
  const k = await tokenCliente(ITEM, 1, S);
  assert.ok(k?.startsWith(`${ITEM}.1.`));
  assert.deepEqual(await leerTokenCliente(k, S), { itemId: ITEM, version: 1 });
});

test("link: no sirve con otro secreto, otro item u otra versión", async () => {
  const k = await tokenCliente(ITEM, 1, S);
  assert.equal(await leerTokenCliente(k, "otro-secreto"), null);
  assert.equal(await leerTokenCliente(k.replace(ITEM, OTRO), S), null);
  assert.equal(await leerTokenCliente(k.replace(`${ITEM}.1.`, `${ITEM}.2.`), S), null);
  assert.equal(await leerTokenCliente("basura", S), null);
  assert.equal(await leerTokenCliente(k, undefined), null);
  assert.equal(await tokenCliente("no-es-uuid", 1, S), null);
  assert.equal(await tokenCliente(ITEM, 0, S), null);
});

test("cookie: válida, vencida, alterada", async () => {
  const ahora = Date.parse("2026-09-29T12:00:00Z");
  const c = await firmarCookieCliente({ itemId: ITEM, version: 3 }, S, ahora);
  assert.deepEqual(await verificarCookieCliente(c, S, ahora), { itemId: ITEM, version: 3 });
  assert.equal(await verificarCookieCliente(c, S, ahora + 91 * 864e5), null);
  const [i, , e, f] = c.split(".");
  assert.equal(await verificarCookieCliente(`${i}.4.${e}.${f}`, S, ahora), null);
  assert.equal(await verificarCookieCliente(c.replace(ITEM, OTRO), S, ahora), null);
  assert.equal(await verificarCookieCliente(c, "otro", ahora), null);
});

test("la cookie no se puede armar con la firma del link", async () => {
  const k = await tokenCliente(ITEM, 1, S);
  const firma = k.split(".")[2];
  assert.equal(await verificarCookieCliente(`${ITEM}.1.9999999999.${firma}`, S), null);
});

test("etapa: del grupo y el Progreso de Pulse", async () => {
  const { etapaDe, pasoActual } = await import("../lib/clientes-app/etapa.ts");
  assert.equal(etapaDe("ONBOARDING & SETUP", "Onboarding incompleto"), "onboarding");
  assert.equal(etapaDe("ONBOARDING & SETUP", "Configurar Cuenta Publicitaria"), "configuracion");
  assert.equal(etapaDe("ONBOARDING & SETUP", "Onboarding Completado"), "configuracion");
  assert.equal(etapaDe("ONBOARDING & SETUP", "SET UP LISTO"), "estrategia");
  assert.equal(etapaDe("ANÁLISIS Y ESTRATEGIA", null), "estrategia");
  assert.equal(etapaDe("CLIENTE ACTIVO", "Onboarding Completado"), "campanas");
  assert.equal(etapaDe("PROGRAMA ACCELERATOR"), "campanas");
  assert.equal(etapaDe("Inner Circle"), "campanas");
  assert.equal(etapaDe("OFFBOARDED", "SET UP LISTO"), "baja");
  assert.equal(etapaDe("CLIENTE ACTIVO", "Decidió no continuar"), "baja");
  assert.equal(pasoActual("campanas"), 3);
  assert.equal(pasoActual("baja"), -1);
});

test("resultados: leads + mensajes, costo por resultado y ROAS solo con ventas", async () => {
  const { numerosDe, sumar, serieDiaria, mejoresAnuncios, esErrorDeToken } = await import("../lib/clientes-app/resultados-reglas.ts");
  const fila = {
    spend: "100.50",
    reach: "5000",
    impressions: "9000",
    clicks: "210",
    actions: [
      { action_type: "lead", value: "12" },
      { action_type: "onsite_conversion.messaging_conversation_started_7d", value: "8" },
    ],
  };
  const n = numerosDe(fila);
  assert.equal(n.resultados, 20);
  assert.equal(n.costoResultado.toFixed(3), "5.025");
  assert.equal(n.roas, null);
  const conVentas = numerosDe({ spend: "50", actions: [{ action_type: "purchase", value: "3" }], action_values: [{ action_type: "purchase", value: "300" }] });
  assert.equal(conVentas.ventas, 3);
  assert.equal(conVentas.roas, 6);
  assert.equal(conVentas.costoResultado, null);
  const vacio = numerosDe({});
  assert.equal(vacio.inversion, 0);
  assert.equal(vacio.costoResultado, null);
  const t = sumar([fila, fila]);
  assert.equal(t.resultados, 40);
  assert.equal(t.inversion, 201);
  assert.deepEqual(serieDiaria([{ date_start: "2026-09-02", spend: "5" }, { date_start: "2026-09-01", spend: "3" }]).map((x) => x.fecha), ["2026-09-01", "2026-09-02"]);
  const ads = mejoresAnuncios([
    { ad_id: "a", ad_name: "A", spend: "10", actions: [{ action_type: "lead", value: "2" }] },
    { ad_id: "b", ad_name: "B", spend: "10", actions: [{ action_type: "lead", value: "5" }] },
    { ad_id: "c", ad_name: "C", spend: "0", actions: [{ action_type: "lead", value: "9" }] },
    { ad_id: "d", ad_name: "D", spend: "10" },
  ]);
  assert.deepEqual(ads.map((a) => a.id), ["b", "a"]);
  assert.equal(esErrorDeToken(190), true);
  assert.equal(esErrorDeToken(100), false);
});

test("archivos: carpeta desde el link, tipos y agrupado", async () => {
  const { carpetaDeUrl, tipoDe, agrupar, tipoSubidaPermitido } = await import("../lib/clientes-app/archivos-reglas.ts");
  assert.equal(carpetaDeUrl("https://drive.google.com/drive/folders/14987xnSObsgaOInpyXaiYf71hl2L0djS?usp=drive_link"), "14987xnSObsgaOInpyXaiYf71hl2L0djS");
  assert.equal(carpetaDeUrl("https://drive.google.com/drive/u/1/folders/abcDEF123456789"), "abcDEF123456789");
  assert.equal(carpetaDeUrl("https://docs.google.com/document/d/1mqg7RH5YXatbTwQfsYWDLCQGjrKHMzcv/edit"), null);
  assert.equal(carpetaDeUrl(null), null);
  assert.equal(tipoDe("image/png"), "imagen");
  assert.equal(tipoDe("video/mp4"), "video");
  assert.equal(tipoDe("application/vnd.google-apps.document"), "documento");
  const g = agrupar([
    { id: "1", nombre: "a", mime: "image/png", bytes: 1, fecha: "2026-09-01T00:00:00Z", carpeta: "03 Creativos" },
    { id: "2", nombre: "b", mime: "image/png", bytes: 1, fecha: "2026-09-05T00:00:00Z", carpeta: "03 Creativos" },
    { id: "3", nombre: "c", mime: "application/pdf", bytes: 1, fecha: "2026-09-02T00:00:00Z", carpeta: "" },
    { id: "4", nombre: "d", mime: "application/pdf", bytes: 1, fecha: "2026-09-02T00:00:00Z", carpeta: "01 Branding" },
    { id: "5", nombre: "atajo", mime: "application/vnd.google-apps.shortcut", bytes: 0, fecha: "2026-09-02T00:00:00Z", carpeta: "01 Branding" },
  ]);
  assert.deepEqual(g.map((x) => x.carpeta), ["Branding", "Creativos", "Tu carpeta"]);
  assert.deepEqual(g[1].archivos.map((x) => x.id), ["2", "1"]);
  assert.equal(g[0].archivos.length, 1);
  assert.equal(tipoSubidaPermitido("video/quicktime", "x.mov"), true);
  assert.equal(tipoSubidaPermitido("text/html", "x.html"), false);
});
