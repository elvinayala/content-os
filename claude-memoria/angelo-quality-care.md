---
name: angelo-quality-care
description: "Ángelo (chat + voz) de Quality Care Physicians/Angelorum — \"el AutoFlow del Dr. Heredia\"; repo ~/autoflow-quality-care, Retell, troncal SIP; Carilin publica en Cloudflare sin GitHub"
metadata:
  node_type: memory
  type: project
  originSessionId: aa2a9e04-3ffd-40f6-bdcb-50f9e2d3d558
  modified: 2026-10-13T22:27:11.572Z
---

Elvin le dice "el doctor Heredia" a este proyecto: Juan C. Heredia es el administrador de **Quality Care Physicians IPA 350 / Angelorum** (cliente AIB, contrato $3,500 chat + voz + CRM). Repo `~/autoflow-quality-care` (GitHub `elvinayala/autoflow-quality-care`), Worker de Cloudflare, voz en Retell (`agent_7be94f38b8988350cf0cef1ec6`, número de entrada +1 787-665-9913), sub-cuenta GHL `LgohVWuoPLlCUSITy3Ms`. Estado de entrada: `docs/ESTADO-DEL-PROYECTO.md`.

**Carilin desarrolla el chat con su propio Claude y publica directo a Cloudflare sin subir a GitHub** (pasó 22, 23, 28/sep y 2–6/oct). Antes de publicar o sincronizar Retell desde la Mac: bajar el bundle de prod (`/workers/scripts/autoflow-quality-care/content/v2` con `npx wrangler auth token`) y compararlo por módulo contra un `wrangler deploy --dry-run`; si difiere, portarlo al repo primero. `lib/voz.js` (prompt/herramientas de Retell) NO viaja en el bundle: solo existe en el repo.

**Why:** dos veces lo publicado no estaba en GitHub; publicar o sincronizar desde la Mac habría borrado su trabajo.

**How to apply:** el comando `scripts/sync-retell.mjs` y las pruebas contra `/voz/agendar` me los bloquea el clasificador → se los paso a Elvin; yo publico la versión del agente (`publish-agent`) y apunto el número (`update-phone-number`, `inbound_agents`) después.

Decisiones (oct/2026): modo **solicitud** en chat y voz (Juan, 24/sep); Ángelo contesta TODAS las llamadas del 787-270-4747 por **troncal SIP** de la central (Cloud PBX) → `sip:+17876659913@sip.retellai.com` puerto 5060 TCP; transfiere al **787-883-6718** (no se desvía) con la extensión por DTMF (`cold_transfer_mode: sip_invite`), una herramienta por departamento según el PDF de extensiones. Pendiente al 6/oct: llamada de prueba (Carilin o Ana) y que el proveedor configure el troncal.

**13/oct:** el 787-665-9913 NO está en el Twilio de Elvin (única cuenta "My first Twilio account", login elvin@levelupmediapr.net, solo tiene el 787-417-8125 = caller ID de prospección de AIB/Emilio, NO usarlo para Ángelo); vive en otra cuenta (trunk "landing-aiborinquen", jul/2026) que nadie tiene a mano → por eso la prueba daba "ocupado". Twilio sin números PR disponibles; un número nuevo en el trunk "AI Borinquen — Retell" exige contraseña SIP (Twilio pide IP **y** credencial) → lo pone Elvin, no yo. Plan: la central de la clínica manda SIP directo a Retell (no necesita Twilio para entrar) y las transferencias salen por la central (pedir su dirección SIP). Arreglado y publicado (v4): la voz no sabía la fecha (buscaba 2024) → ahora usa `{{current_time_America/Puerto_Rico}}` y `{{current_calendar_…}}` de Retell. Elvin escogió (13/oct) ir por los dos caminos a la vez: (1) la central de la clínica directo a Retell, que es lo definitivo y lo coordina Carilin con Juan, y (2) un número 787 en Telnyx para probar ya, que lo compra Elvin y él pone la contraseña SIP. Retell se prueba por texto en el dashboard (Test LLM → Manual Chat) sin crear citas. Relacionado: [[autoflow-zernio-canales]] (médicos = Meta oficial, no Zernio).

**14/oct:** proveedor de la central = **Cloud PBX Central, Juan Robaina (787-488-0080)**; Carilin le mandó los pasos (troncal a Retell + cómo transferir: directo por SIP a la extensión o por el 883-6718 con tonos). Juan Heredia confirmó extensiones (3000 solo Angelorum; Comerío 4000/4001, Corozal 5000, Naranjito 6000, Vega Alta 2001/2004) — ya estaban así en `lib/voz.js`; los referidos NO se transfieren, se envían a la coordinadora. Twilio de Elvin: trunk nuevo "Angelo Quality Care - Retell" (termination `angelo-qc-retell.pstn.twilio.com`, solo IP ACL `retell-sbc` con los 5 rangos de Retell, origination `sip:sip.retellai.com;transport=tcp`) listo SIN número: el Buy lo bloquea el clasificador → lo da Elvin; luego importarlo en Retell (`import-phone-number`, sin credenciales) apuntando a Ángelo v4.
