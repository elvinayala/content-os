---
name: leads-crm
description: Leads = CRM de clientes potenciales dentro de Pulse que reemplaza a Pipedrive (26/sep/2026); esencia Pipedrive, Timelines como puente de WhatsApp, historial de Pipedrive archivado en Excel (NO cargado)
metadata:
  type: project
---

Pipedrive cuesta ~$900/mes (LU ~$600, AIB ~$300). El 26/sep/2026 Elvin aprobó reemplazarlo con **Leads
dentro de Pulse** (`/pulse/leads`), autorizando semana 1 y 2 "sin ningún miedo". Primero Level Up.

**Reglas de Elvin:** tiene que tener "la raíz y la esencia de Pipedrive" (columnas, arrastrar, embudos,
botones) pero limpio, simple y muy fácil de usar. **El historial (~20K leads) NO se carga en Pulse**: queda
archivado en Excel (`~/Documents/Archivo Pipedrive/2026-09-26/` + copia en Supabase `pulse/archivo-pipedrive/`)
— "no se puede perder". WhatsApp sigue por **Timelines.ai** (GoHighLevel descartado). Marcas nunca mezcladas.

**Estado:** módulo + puente + cables de Calendly/quiz LU en producción; Leads arranca vacío con los 6 embudos
reales de LU. **27/sep:** embudos = copia EXACTA de los 11 de Pipedrive LU; entrada para Zapier (`/api/leads/entrada`)
probada en prod; cuentas creadas (Luis setter; Roger, Laura, Joaquín closers; Nahuel director comercial; Ana y
Dilan chatters; Aure) con links de 72 h a Leads. Santiago ya no está. **Timelines LU CONECTADO (26/sep)**: token en .env.local + Vercel, número +1 787-409-2812 (Level Up Media),
webhooks 30187/30188 sin errores; probado con conversación real (lead + historial en ambos sentidos). Clientes
actuales de Pulse (todo menos OFFBOARDED) NO entran como lead (pedido de Elvin); ex-clientes sí. **Falta de Elvin:** OK para mandar los links por Slack. **Zaps HECHOS (26/sep):** los 4 de clases (LUM Class Diego 360078172 v8,
FRANKIE 363181220 v4, VC 347784257 v7, CLICKFUNNELS - PIPEDRIVE 302982861 v2 = CF CLASS) tienen paso 4 Webhooks
POST → /api/leads/entrada, en paralelo a Pipedrive; name = "Data Contact Name" (el first/last sale vacío); probados
y publicados, leads de prueba borrados. Los 60 runs retenidos son del "Daily Executive Email Digest to Slack" (app
desconectada), no de las clases.
**Semana 3:** mover prospección/demos/dashboards, correr en paralelo 1 semana y cancelar Pipedrive LU; AIB después.
Detalle técnico en CLAUDE.md §Leads. Ver [[pulse-crm]], [[closers-lu-calendly]], [[ecosistema-lu-aib]].
