---
name: avisos-desde-slack-elvin
description: "Avisos al equipo de lo que hicieron los agentes → desde la cuenta de Slack de Elvin (Slack MCP) pero firmados/acreditados al agente (\"— Nico\"), no desde el bot"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0ac3fded-abe3-4c7a-8583-b071afe56deb
  modified: 2026-09-25T02:15:04.326Z
---

Cuando Elvin pide avisarle al equipo algo que hizo un agente ("avisa a Aure y a Nahuel" que Fathom →
Slack ya está), el DM sale **desde la cuenta de Slack de Elvin** (herramienta `slack_send_message`
del Slack MCP, que escribe como él, U08U9777PUY), tuteo PR, pero **firmado por el agente que lo hizo**
y dándole el crédito **una sola vez** (Elvin: "que no mencionen a Nico muchas veces, una vez y ya"):
o una mención en el texto ("…lo dejó listo Nico") o la firma al final ("— Nico"), no las dos.

**Why:** 24/sep/2026 mandé el aviso de Fathom con el bot Command Center firmado "— Nico". Elvin:
"que salga desde mi Slack… pero que lo firme Nico, que le dé el crédito a Nico". Viene del jefe (pesa
más) y el equipo aprende que los agentes son quienes hacen el trabajo.

**How to apply:** el bot (`scripts/agentes.mjs slack`) queda para lo que el agente hace por su cuenta
(acuses de solicitudes, "Listo ✅" de Nico en #nico-desarrollo). Avisos que Elvin manda a dar → su
cuenta + firma del agente. Sigue aplicando verificar al destinatario antes
([[slack-equipo-verificar]]) y no enviar contenido sin su OK ([[no-enviar-sin-aprobar]]).

**Automáticos → siempre el bot (24/sep/2026):** los avisos recurrentes que manda el sistema solo (p. ej. el
resumen "Mi día" de Pulse a Jessica y Carilin, lun–vie 8 AM) salen del bot **Command Center**
(U0BFPB0SSP4), NUNCA de la cuenta de Elvin. Elvin: "que no le llegue nada desde mi cuenta a ellas".
