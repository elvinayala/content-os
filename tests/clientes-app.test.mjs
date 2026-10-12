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


test("recomendación: umbrales de Elvin y anuncio listo para escalar", async () => {
  const { numerosDe, salud, recomendar, anuncioParaEscalar } = await import("../lib/clientes-app/resultados-reglas.ts");
  const n = (spend, leads, extra = {}) => numerosDe({ spend: String(spend), impressions: "5000", actions: [{ action_type: "lead", value: String(leads) }], ...extra });
  // Todo bien: CTR único 2.5, frecuencia 1.4, $1.50 por resultado → "vas bien"
  const bien = n(30, 20, { unique_ctr: "2.5", frequency: "1.4" });
  assert.deepEqual(salud(bien), { ctrUnico: "bien", frecuencia: "bien", costo: "bien" });
  assert.equal(recomendar(bien, [])[0].tipo, "bien");
  // $2-5: sin alerta de costo
  const medio = n(60, 20, { unique_ctr: "2.5", frequency: "1.4" });
  assert.equal(salud(medio).costo, "normal");
  assert.equal(recomendar(medio, [])[0].tipo, "bien");
  // > $5, CTR único < 2 y frecuencia > 1.8 → alertas en ese orden, máximo 2
  const mal = n(120, 20, { unique_ctr: "1.4", frequency: "2.1" });
  assert.deepEqual(salud(mal), { ctrUnico: "alerta", frecuencia: "alerta", costo: "alerta" });
  assert.deepEqual(recomendar(mal, []).map((r) => r.tipo), ["costo", "ctr"]);
  // Ganador: ≥ 10 resultados, ≥ $15, < $2, CTR único ≥ 2, frecuencia ≤ 1.8
  const ganador = { nombre: "Video mascotas", numeros: n(18, 12, { unique_ctr: "3", frequency: "1.2" }) };
  const quemado = { nombre: "Flyer viejo", numeros: n(18, 12, { unique_ctr: "3", frequency: "2.4" }) };
  const pocos = { nombre: "Nuevo", numeros: n(5, 4, { unique_ctr: "3", frequency: "1.1" }) };
  assert.equal(anuncioParaEscalar([quemado, pocos, ganador])?.nombre, "Video mascotas");
  assert.equal(anuncioParaEscalar([quemado, pocos]), null);
  // Con alertas y ganador: la alerta más importante + el escalar
  assert.deepEqual(recomendar(mal, [ganador]).map((r) => r.tipo), ["costo", "escalar"]);
  assert.ok(recomendar(bien, [ganador])[0].texto.includes("listo para escalar"));
});

test("entregables: solo plan, creativos y videos, con su tipo de archivo", async () => {
  const { archivoValido, esTipoEntrega, nombreVisible, avisoEntrega } = await import("../lib/clientes-app/entregas-reglas.ts");
  assert.equal(esTipoEntrega("creativo"), true);
  assert.equal(esTipoEntrega("documento"), false);
  assert.equal(archivoValido("plan", "application/pdf", "plan.pdf"), true);
  assert.equal(archivoValido("plan", "text/html", "x.html"), false);
  assert.equal(archivoValido("creativo", "image/png", "flyer.png"), true);
  assert.equal(archivoValido("creativo", "video/mp4", "x.mp4"), false);
  assert.equal(archivoValido("video", "video/quicktime", "x.mov"), true);
  assert.equal(archivoValido("video", "", "x.mov"), true);
  assert.equal(archivoValido("video", "image/svg+xml", "x.svg"), false);
  assert.equal(nombreVisible("plan_marketing_v2.pdf"), "plan marketing v2");
  assert.equal(avisoEntrega("creativo", 3).titulo, "🎨 Tienes 3 creativos nuevos");
});

test("bitácora: valida lo del modelo y mezcla lo entregado", async () => {
  const { limpiarEntradas, entradasDeEntregas, lineaDeTiempo } = await import("../lib/clientes-app/bitacora-reglas.ts");
  const hoy = "2026-09-30";
  const r = limpiarEntradas(
    {
      entradas: [
        { fecha: "2026-09-12", texto: "Lanzamos tu campaña de ventas por WhatsApp con 3 flyers - SR" },
        { fecha: "2026-10-05", texto: "Esto es del futuro y no va" },
        { fecha: "12/09", texto: "Fecha mal escrita" },
        { fecha: "2026-08-03", texto: "Ajustamos el presupuesto a $350 al mes" },
        { fecha: "2026-08-03", texto: "Creamos la campaña para que más gente conozca tu negocio" },
        { fecha: "2026-09-12", texto: "Lanzamos tu campaña de ventas por WhatsApp con 3 flyers" },
      ],
    },
    hoy,
  );
  assert.deepEqual(r.map((e) => e.texto), ["Lanzamos tu campaña de ventas por WhatsApp con 3 flyers", "Creamos la campaña para que más gente conozca tu negocio"]);
  assert.deepEqual(limpiarEntradas(null, hoy), []);
  const ent = entradasDeEntregas([
    { tipo: "creativo", creadoAt: "2026-09-29T15:00:00Z" },
    { tipo: "creativo", creadoAt: "2026-09-29T16:00:00Z" },
    { tipo: "plan", creadoAt: "2026-09-20T15:00:00Z" },
  ]);
  assert.ok(ent.some((e) => e.texto === "Te entregamos 2 creativos nuevos."));
  const t = lineaDeTiempo(r, ent);
  assert.equal(t[0].fecha, "2026-09-29");
  assert.equal(t.at(-1).fecha, "2026-08-03");
});

test("referidos: validación y estado en palabras del cliente", async () => {
  const { validarReferido, estadoReferido } = await import("../lib/clientes-app/referidos-reglas.ts");
  assert.ok("error" in validarReferido({ negocio: "", contacto: "Ana", telefono: "7875551234" }));
  assert.ok("error" in validarReferido({ negocio: "Pizzería", contacto: "Ana", telefono: "555" }));
  const ok = validarReferido({ negocio: "  Pizzería  Don Pepe ", contacto: "Ana", telefono: "(787) 555-1234", nota: "" });
  assert.deepEqual(ok, { ok: { negocio: "Pizzería Don Pepe", contacto: "Ana", telefono: "7875551234", nota: "" } });
  assert.equal(estadoReferido("ganado").tono, "ganado");
  assert.equal(estadoReferido("abierto").texto, "En conversación");
});

test("reunión de estrategia: quién califica, horarios y aviso", async () => {
  const { esAltoValor, validarSolicitud, textoHorario, mesPR, textoAvisoEquipo } = await import("../lib/clientes-app/reunion-reglas.ts");
  assert.equal(esAltoValor({ marcadoAlto: false, montos: [3000] }), true);
  assert.equal(esAltoValor({ marcadoAlto: false, montos: [2999, undefined, null] }), false);
  assert.equal(esAltoValor({ marcadoAlto: true, montos: [] }), true);
  const hoy = "2026-09-30"; // miércoles
  assert.ok("error" in validarSolicitud({ opciones: [], tema: "" }, hoy));
  assert.ok("error" in validarSolicitud({ opciones: [{ fecha: "2026-09-30", hora: "10:00" }] }, hoy)); // hoy no
  assert.ok("error" in validarSolicitud({ opciones: [{ fecha: "2026-10-03", hora: "10:00" }] }, hoy)); // sábado
  assert.ok("error" in validarSolicitud({ opciones: [{ fecha: "2026-10-30", hora: "10:00" }] }, hoy)); // > 21 días
  assert.ok("error" in validarSolicitud({ opciones: [{ fecha: "2026-10-01", hora: "20:00" }] }, hoy)); // hora fuera
  const ok = validarSolicitud({ opciones: [{ fecha: "2026-10-01", hora: "10:00" }, { fecha: "2026-10-01", hora: "10:00" }, { fecha: "", hora: "" }, { fecha: "2026-10-02", hora: "14:30" }], tema: "  ver  resultados " }, hoy);
  assert.deepEqual(ok, { ok: { opciones: [{ fecha: "2026-10-01", hora: "10:00" }, { fecha: "2026-10-02", hora: "14:30" }], tema: "ver resultados" } });
  assert.equal(textoHorario({ fecha: "2026-10-01", hora: "14:30" }), "jueves, 1 de octubre, 2:30 PM");
  assert.equal(mesPR(new Date("2026-10-01T03:00:00Z")), "2026-09"); // 11 PM del 30/sep en PR
  assert.ok(textoAvisoEquipo({ negocio: "X", contacto: "Y", opciones: [{ fecha: "2026-10-01", hora: "09:00" }], tema: "", linkFicha: "https://x" }).includes("9:00 AM"));
});
