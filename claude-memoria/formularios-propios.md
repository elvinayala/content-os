---
name: formularios-propios
description: Typeform propio en Pulse → Formularios (26/sep/2026); onboarding y encuesta de LU duplicados; falta que los closers usen el link nuevo y cancelar Typeform
metadata:
  type: project
---
26/sep/2026: Elvin pidió su propio Typeform para cancelar la suscripción, con el estilo del onboarding de LU.
Quedó en prod: Pulse → Formularios (editor sin código) + páginas públicas /f/<slug>.

- **Onboarding LU** = levelupmedia.vercel.app (ahora sale de Pulse → Formularios). Se le agregó lo que tenía
  el Typeform y faltaba en nuestra versión: botón final para agendar el onboarding con Jessica
  (calendly.com/jessica-levelupmediapr/onboarding).
- **Encuesta de satisfacción** = levelupmedia.vercel.app/f/encuesta-level-up. Los agentes de n8n (Setting v5,
  Onboarding v5 + 2 apagados) ya mandan este link en vez del Typeform UDjwQkKP.
- **Historial de Typeform**: 525 respuestas en ~/Documents/Archivo Typeform/2026-09-26/ + Storage.
  La encuesta UDjwQkKP está en OTRA cuenta de Typeform (6siljlqvh7z) y sus respuestas no se pudieron bajar.

**Why:** ahorrar la suscripción y tener las respuestas en casa, sin depender de Typeform.

**How to apply:** hasta cancelar hay que confirmar que los closers ya no mandan el link de Typeform (el 25/sep
todavía entraron respuestas allá). También hay que revisar si la otra cuenta (6siljlqvh7z) se paga, y bajar sus
respuestas desde la UI si importan. Detalle técnico en CLAUDE.md §Formularios propios.
Ver [[pulse-crm]], [[leads-crm]], [[n8n-level-up]].

**26/sep (tarde):** avisado por DM de Slack (desde la cuenta de Elvin, firmado Claude): Aure y Nahuel les dicen a
los closers que solo se usa levelupmedia.vercel.app; **Aure cancela la membresía de Typeform** cuando verifique (y
la otra cuenta 6siljlqvh7z si se paga); Jessica sabe dónde ver las respuestas. Formularios ahora lo ven admin/editor +
Jessica y Nahuel (`puedeFormularios`, override FORMULARIOS_ACCESO). Commit e2875d2 subido a GitHub.
