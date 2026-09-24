---
name: director-creativo-slack
description: Agente Director Creativo de Level Up en Slack (22/sep/2026) — revisa flyers/guiones/hooks/CTAs con el prompt de Elvin; falta que Elvin cree el canal, dé files:read e invite el bot
metadata:
  type: project
---

Elvin (22/sep/2026): la revisión de flyers, scripts y guiones le quita mucho tiempo → pidió un
agente en Slack donde "los muchachos" envían lo que él revisaba, con SU prompt (método de 5 fases,
afinar ≠ reescribir, formatos FLYER/GUION) y con la puerta abierta a recomendaciones generales de
Claude "por encima de la mía". Construido y desplegado: cerebro `vault/ceo/cerebro-director-creativo.md`
(prompt de Elvin tal cual arriba; abajo reglas de Slack, "💡 Nota del director" máx. 1, y REGLAS
APRENDIDAS que solo crecen con su OK), `lib/director-creativo.ts`, rama en `app/api/slack-eventos`.

**Probado en vivo:** la 1ª versión inventó prueba social ("ha atendido pacientes que…") y
justificaba cambios → se agregó "cero datos nuevos, lo que falte va como [FALTA: …]" y "no
expliques tus cambios". Si vuelve a pasar, reforzar ahí, no en el prompt de Elvin.

**EN VIVO (22/sep 11 PM):** se llama **Leo · Director Creativo** (avatar 3D estilo Sofi en
public/marcas/leo/, nombre y foto por mensaje con `chat:write.customize`; Command Center no se
renombra porque lo comparten Sofi y los avisos). Canal **#office-5-revision-creativa**
(C0C3SKWHZ50, privado). 1ª revisión real: María del Carmen, 4 flyers, respondió en 23 s.
Gotcha: Slack no mandaba eventos a /api/slack-eventos hasta que Elvin configuró Event
Subscriptions (URL content-os-chi-seven + message.groups).
Pendiente mío: tarea que junte los `📌 FEEDBACK CANDIDATE` y se los pase a Elvin para aprobar.
Ver [[no-enviar-sin-aprobar]] (aquí Elvin sí autorizó que el agente le responda al equipo).
