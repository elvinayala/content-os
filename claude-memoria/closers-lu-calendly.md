---
name: closers-lu-calendly
description: Closers de Level Up y la integración Calendly→Pipedrive CLOSERS (pipeline 15); Laura sin asiento vía alias; Nahuel pide los cambios del CRM
metadata:
  node_type: memory
  type: project
  originSessionId: 5e4e2425-3586-4e9f-a693-e3b37cdd917e
  modified: 2026-09-23T00:39:59.620Z
---

Calendly (org Level Up) → `/api/calendly` → Pipedrive LU pipeline **CLOSERS (15)**, EN VIVO desde 16/sep/2026
(excluye Onboarding). Closers: **Juan David** y **Roger Arteaga** (usuarios de Pipedrive, dueños de sus deals) y
**Laura** (medio tiempo, 22/sep/2026) SIN asiento en Pipedrive ni Calendly por decisión de Elvin: toma el
calendario "Level Up Media"; `CALENDLY_CLOSER_ALIAS` pone Closer (Calendly) = Laura, el deal queda de Level Up
Media, filtro guardado "CLOSERS · Laura" (id 106037). Si Laura consigue email/asiento: invitarla y mapear.

**Nahuel Tissera** (director comercial / jefe de ventas) es quien pide cambios del CRM por Slack.

**How to apply:** un closer nuevo sin asiento = alias + filtro; con asiento = usuario de Pipedrive con el mismo
email que en Calendly (el cruce es automático).

**Aviso de citas en Slack (24/sep/2026):** cada cita va al Slack DE SU MARCA — LU → #office-10-lum-calls
(bot Command Center del Slack de LU) y AIB → #borinquenia-calls del Slack de AI Borinquen (webhook
entrante del "Command Center" de ese workspace, `SLACK_AIB_CALLS_WEBHOOK`). Regla de Elvin: nunca mezclar
Slacks/Calendlys/ACs entre marcas. `lib/aviso-llamadas.ts`.
