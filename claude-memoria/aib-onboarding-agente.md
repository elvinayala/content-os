---
name: aib-onboarding-agente
description: "Onboarding de AI Borinquen por WhatsApp (Zernio) — se dispara desde el Calendly de AIB (NO el de Level Up, NO el tablero de Pulse); estado y qué falta para salir en real"
metadata:
  node_type: memory
  type: project
  originSessionId: e7db03bf-54ec-46dd-b9d2-76c3b45e44de
  modified: 2026-09-23T21:39:01.549Z
---

Agente de onboarding de AI Borinquen (lib/aib-onboarding/, deploy 23/sep/2026, en SIMULACIÓN).

Regla de Elvin (23/sep): funciona IGUAL que el de Level Up — **quien agenda el onboarding en el Calendly
de AI Borinquen ya es cliente**. El Calendly de AIB es una cuenta distinta al de Level Up. La primera versión
leía el tablero AI BORINQUEN de Pulse: descartada (se borraron los 18 registros simulados).

- Entrada: webhook `/api/aib/calendly` (invitee.created de eventos que matchean `AIB_CALENDLY_ONBOARDING_REGEX`,
  default "onboarding") → registra + bienvenida al momento. Solo cuenta "VIDEOLLAMADA ONBOARDING" (Carilin,
  Consuegra, Ángela); "Bienvenida y Configuración BORI" NO (es de Bori, otra cosa — Elvin 23/sep). Cancelar no lo saca; reagenda no repite.
- Cron 10 AM PR relee las citas por API (red) y manda encuestas de 10 y 30 días. Escala a Ángela.
- 23/sep: Calendly de AIB CONECTADO — token propio con scope webhooks (`CALENDLY_TOKEN_AIB`) + webhook a
  /api/aib/calendly + `AIB_CALENDLY_WEBHOOK_SIGNING_KEY`, en .env.local y Vercel. 1ª simulación: 9 clientes registrados.
  (El token de ~/ai-borinquen-voz no sirve para webhooks.) Falta para real: número nuevo en Zernio + `AIB_ZERNIO_ACCOUNT_ID`,
  plantillas, `AIB_ONBOARDING_MODO=real`, `ANGELA_SLACK_ID`, [POR CONFIRMAR] de la guía.

- Número (23/sep): NO usar el de Bori (939-250-8393, es de Bori — "otra cosa"). Zernio VENDE números (Telnyx,
  `POST /v1/phone-numbers/purchase`): PR local $5/mes, instantáneo, apto WhatsApp (Resuelto ya compró +1 787-956-1111
  así). El equipo de Zernio con key en Railway es de RESUELTO → no comprar ahí; AIB necesita su propia cuenta de
  Zernio (la crea Elvin; sirve también para Bori). Plantillas se crean recién con el número conectado a la WABA de AIB.

**Why:** Elvin quiere el mismo modelo mental en las dos agencias: la cita de onboarding define al cliente.
**How to apply:** nunca volver a tomar clientes de AIB desde Pulse ni desde el Calendly de Level Up.
Relacionado: [[n8n-level-up]], [[aib-reestructuracion-ventas]].
