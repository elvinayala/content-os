---
name: bori-crm
description: CRM de Bori (15/sep/2026) — decisión (propio, no GHL), qué hay construido, el puente de WhatsApp para Timelines.ai/Zapier y la fase 2 pendiente
metadata:
  type: project
---

**Decisión de Elvin (15/sep/2026):** Bori tiene CRM propio, incluido en **Pro y Agencia**, en vez de subcuentas de GHL. Razones: los leads nacen de campañas que Bori publicó (cierra costo por lead → cierre), promesa "todo en un solo lugar", sin margen regalado a GHL. GHL queda como posible conector futuro para Agencia, no como base.

**Construido y en producción (commit del 15/sep):** tablero por columnas con drag & drop, etapas editables, tarjeta de lead (WhatsApp, valor, próxima acción, asignado, notas del equipo con autor), + Lead, importar CSV, KPIs (seguimientos hoy/vencidos, ganados, valor). **Puente universal:** `POST https://www.heybori.ai/api/crm/webhook/<token>` por usuario (se ve en CRM → Conectar WhatsApp). Elvin usa **Timelines.ai** (WhatsApp → CRM) con Pipedrive; en Timelines: Integrations → Webhooks → New message → pegar la URL. Mapeo tolerante (contact/message, phone/name/message, from/body, wa_id/pushname). **Instagram/Messenger:** sin teléfono, el @usuario o sender_id es la llave (`handle`); ManyChat External Request + `?fuente=instagram`; lo crudo queda en `meta.raw` para afinar con el primer payload real.

**Fase 2 (no hecha):** WhatsApp Cloud API propia (captura sin Timelines), Meta Lead Ads (`leads_retrieval` en App Review), recordatorio diario de seguimientos por WhatsApp, leads en el dashboard junto a gasto (costo por lead). Código: `crm.js` (puro), endpoints en `server.js`, ver TRASPASO.md. Relacionado: [[bori-backend-real]], [[bori-plan-crecimiento]].
