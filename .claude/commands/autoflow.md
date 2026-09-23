---
description: Nico arma un AutoFlow completo para un cliente (agente de chat y/o voz + subcuenta de GoHighLevel con pipeline, custom fields y calendario + WhatsApp por GHL o Zernio), de punta a punta, avisándole a Elvin cada ~12 min
argument-hint: <cliente/negocio> [chat|voz|ambos] [notas: web, IG, servicios, horario, WhatsApp…]
---

# /autoflow — la fábrica de AutoFlow (Nico)

AutoFlow = el servicio de atención al cliente con IA de AI Borinquen: un agente de **chat**
(WhatsApp/IG/FB) y/o de **voz** que contesta, califica, agenda y escribe todo en el **CRM del
cliente en GoHighLevel** (su subcuenta: pipeline, custom fields, calendario). GHL es el centro.

Pedido: $ARGUMENTS

## 0. Antes de empezar (5 min, sin gastar)

1. Lee `~/autoflow-quality-care/docs/SOP-AutoFlow.md` (v3; en la nube
   `/estado/repos/autoflow-quality-care/docs/SOP-AutoFlow.md`) completo: arquitectura, checklist de go-live, política Meta vs GoGHL y el registro
   de fallas. **Es la ley.** Y `docs/ghl-subcuenta.md` para la parte de GHL.
2. La plantilla es **Ángelo** (`autoflow-quality-care`, en GitHub): Claude + GHL + Retell, y el
   mismo código corre en **Railway** (`npm start` → `server.mjs`, default para clientes nuevos) o
   en Cloudflare (solo Ángelo). SOP §1b. Todo lo que cambia por cliente vive en `cliente.config.js` + `conocimiento/`. Ojo: está
   hecha para una **oficina médica** (MEDICOS, SEDES, PLANES, referidos). Para otro giro, adapta
   `conocimiento/` y los imports de `lib/agente.js`, `lib/respuestas.js`, `lib/voz.js` a los datos
   de ESE negocio — sin romper las reglas del SOP §4.
3. Si falta un dato que solo Elvin tiene (nombre legal, email del dueño, qué canal quiere), UNA
   pregunta con opciones y sigue con lo demás mientras contesta.

## 1. Investigar al cliente (subagente sonnet)

Web, Instagram, Google Maps: servicios, precios públicos (si los hay), horario, dirección(es),
preguntas frecuentes, tono. Resultado: el borrador de `conocimiento/` **solo con datos reales**.
Regla del SOP: si un dato no está en `conocimiento/`, el agente escala; no adivina.

## 2. El repo del cliente

Copia la plantilla (sin `node_modules`, `.dev.vars`, `.wrangler`, `.datos`, `retell.ids.json`,
`conocimiento/` de QCP) a `~/autoflow-clientes/<slug>/` (en la nube: `/estado/clientes/<slug>/`),
`git init`, y llena `cliente.config.js` + `conocimiento/`. Pídele a Elvin el repo
`github.com/new?name=autoflow-<slug>&visibility=private` (tú no puedes crearlo) y súbelo ahí.
Sesiones aisladas por cliente (cada servicio tiene su propio volumen).

## 3. GoHighLevel (el centro)

1. **Subcuenta** — `scripts/crear-subcuenta.mjs` (parametrízalo: nombre, dirección, zona
   `America/Santo_Domingo` para PR, email). **Cobra en el plan de agencia → primero `--dry-run`
   y pídele el OK a Elvin con el resumen** (es la única pausa obligatoria de todo el flujo).
   Token: `GHL_AGENCY_TOKEN` (agencia, no subcuenta).
2. **Token de la subcuenta** (Private Integration de la subcuenta) → secreto del Worker.
3. **Pipeline** — la API v2 NO crea pipelines: créalo desde un snapshot si existe, si no déjale a
   Elvin los 2 min de pasos exactos (nombres idénticos a `cliente.config.js`).
4. **Custom fields + calendarios** — `scripts/provisionar-ghl.mjs` (verifica nombres de etapas).
5. **Flujos "Customer Replied"** (uno por canal) → webhook `/webhook/ghl?token=` (SOP §6 de
   ghl-subcuenta). Solo si el cerebro va en Cloudflare: antes, excepción de WAF para `/webhook/*`.
   Con Zernio, el WhatsApp NO usa este flujo (entra directo a `/webhook/zernio`).

## 4. El canal de WhatsApp — escoge lo más fácil para ESE cliente

| Opción | Cuándo | Cómo |
|---|---|---|
| **Meta oficial dentro de GHL** | El cliente tiene Business Manager sano y puede verificar | Conectar en GHL → Integraciones. Es el default del SOP. |
| **Zernio** | Quiere salir hoy, número nuevo o Meta trabado | Ya está en la plantilla: `CANAL_MODO=zernio` + `ZERNIO_API_KEY`/`ZERNIO_ACCOUNT_ID`/`ZERNIO_WEBHOOK_SECRET`, webhook `/webhook/zernio` (SOP §5.1). |
| **GoGHL (QR)** | La oficial falló tras el checklist del SOP §5 | `CANAL_MODO=goghl` + `GHL_CONVERSATION_PROVIDER_ID` (SOP §5). |

Recomiéndale una a Elvin en una línea con el porqué; si no contesta en 10 min, sigue con la
recomendada.

## 5. Voz (si aplica)

`scripts/sync-retell.mjs` de la plantilla (LLM de Retell + agente + número, idempotente, ids en
`retell.ids.json`) con las rutas `/voz/*` del Worker. **Nunca edites el prompt de un agente de
voz que ya atiende clientes reales sin OK** (cerebro §3). Número nuevo = gasto → OK de Elvin.

## 6. Desplegar y probar (nada se marca sin probar)

**Railway (default):** proyecto `autoflow`, servicio `autoflow-<slug>` (`npx @railway/cli add` /
`up --service autoflow-<slug> --detach` desde la carpeta del cliente), volumen en `/app/.datos`,
variables con `railway variables --service autoflow-<slug> --set` (nunca las imprimas), dominio
con `railway domain`. Cloudflare solo si Elvin lo pide (necesita `CLOUDFLARE_API_TOKEN`). Corre `npm run verificar` y `npm run evals`; prueba el demo `/api/chat`
de punta a punta (pregunta → respuesta → contacto + oportunidad + cita en GHL). Checklist de
go-live del SOP §2, los 8 puntos.

## 7. Entregar

- Portal AutoFlow del cliente: `node scripts/demo-cliente/demo.mjs portal <slug>`.
- Agrega la plataforma a `data/plataformas.json` (repo, prod, salud, deploy, logs, crítico: sí).
- Bitácora (`data/nico-bitacora.json`) y a Elvin: qué quedó vivo, links, qué falta del cliente
  (conectar su WhatsApp, verificar Meta, etc.). **Nunca le escribes al cliente**: le dejas a Elvin
  el texto listo.

## Modelos (economía)

Tú (Opus 5.5) diseñas, decides y escribes lo delicado (prompt del agente, lógica de calendario).
Subagente **sonnet**: investigar al cliente, copiar/renombrar archivos, llenar tablas de
conocimiento. **haiku**: leer logs y respuestas de API largas. **fable**: solo si un bug resiste dos
intentos o la arquitectura del cliente sale de la plantilla. El agente del cliente en producción:
el modelo y `EFFORT` que ya usa la plantilla, salvo que el cliente necesite más razonamiento.
