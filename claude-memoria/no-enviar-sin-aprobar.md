---
name: no-enviar-sin-aprobar
description: "NUNCA mandar contenido a Heidy / creadores / Slack sin que Elvin lo apruebe él mismo; \"envíalos\" no es aprobación"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
  modified: 2026-09-18T18:23:59.484Z
---

Nunca disparar `/api/aprobar-entrega` ni postear contenido a Slack (Heidy,
Valentina, canales) por mi cuenta. Elvin aprueba pieza por pieza desde la
bandeja `/ceo/entregas`. Un "envíalos" en el chat se interpreta como "déjalos en
la bandeja / muéstramelos", no como aprobación.

**Why:** 18/09/2026 mandé 19 piezas de Shadow a Heidy interpretando "envíalos"
como enviar; Elvin: "no envíe a Heidi sin yo aprobar". El webhook no se puede
deshacer.

**How to apply:** producir → validar voz → dejar en `estado: "nuevo"` →
desplegar → decirle que están en la bandeja. Si pide explícitamente "mándaselo a
Heidy" con nombre, confirmar una vez antes. Relacionado: [[circuito-contenido-equipo]].
