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
reales de LU. **Falta de Elvin:** token de Timelines (Public API) para conectar un número de prueba; dar
cuentas de Pulse a setters/closers (Santiago Villarreal, Ana Cecilio, Roger, Laura…) + `leads_acceso`.
**Semana 3:** mover prospección/demos/dashboards, correr en paralelo 1 semana y cancelar Pipedrive LU; AIB después.
Detalle técnico en CLAUDE.md §Leads. Ver [[pulse-crm]], [[closers-lu-calendly]], [[ecosistema-lu-aib]].
