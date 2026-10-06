---
name: angelo-quality-care
description: "Ángelo (chat + voz) de Quality Care Physicians/Angelorum — \"el AutoFlow del Dr. Heredia\"; repo ~/autoflow-quality-care, Retell, troncal SIP; Carilin publica en Cloudflare sin GitHub"
metadata:
  node_type: memory
  type: project
  originSessionId: aa2a9e04-3ffd-40f6-bdcb-50f9e2d3d558
  modified: 2026-10-06T22:18:19.006Z
---

Elvin le dice "el doctor Heredia" a este proyecto: Juan C. Heredia es el administrador de **Quality Care Physicians IPA 350 / Angelorum** (cliente AIB, contrato $3,500 chat + voz + CRM). Repo `~/autoflow-quality-care` (GitHub `elvinayala/autoflow-quality-care`), Worker de Cloudflare, voz en Retell (`agent_7be94f38b8988350cf0cef1ec6`, número de entrada +1 787-665-9913), sub-cuenta GHL `LgohVWuoPLlCUSITy3Ms`. Estado de entrada: `docs/ESTADO-DEL-PROYECTO.md`.

**Carilin desarrolla el chat con su propio Claude y publica directo a Cloudflare sin subir a GitHub** (pasó 22, 23, 28/sep y 2–6/oct). Antes de publicar o sincronizar Retell desde la Mac: bajar el bundle de prod (`/workers/scripts/autoflow-quality-care/content/v2` con `npx wrangler auth token`) y compararlo por módulo contra un `wrangler deploy --dry-run`; si difiere, portarlo al repo primero. `lib/voz.js` (prompt/herramientas de Retell) NO viaja en el bundle: solo existe en el repo.

**Why:** dos veces lo publicado no estaba en GitHub; publicar o sincronizar desde la Mac habría borrado su trabajo.

**How to apply:** el comando `scripts/sync-retell.mjs` y las pruebas contra `/voz/agendar` me los bloquea el clasificador → se los paso a Elvin; yo publico la versión del agente (`publish-agent`) y apunto el número (`update-phone-number`, `inbound_agents`) después.

Decisiones (oct/2026): modo **solicitud** en chat y voz (Juan, 24/sep); Ángelo contesta TODAS las llamadas del 787-270-4747 por **troncal SIP** de la central (Cloud PBX) → `sip:+17876659913@sip.retellai.com` puerto 5060 TCP; transfiere al **787-883-6718** (no se desvía) con la extensión por DTMF (`cold_transfer_mode: sip_invite`), una herramienta por departamento según el PDF de extensiones. Pendiente al 6/oct: llamada de prueba (Carilin o Ana) y que el proveedor configure el troncal. Relacionado: [[autoflow-zernio-canales]] (médicos = Meta oficial, no Zernio).
