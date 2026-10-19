## Director Creativo de Level Up en Slack (22/sep/2026)

Elvin: "algo que me quita mucho tiempo: revisión de flyers, scripts y guiones". El equipo sube la
pieza (flyer en imagen/PDF, guion, hooks, CTA) al canal `SLACK_DIRECTOR_CHANNEL_ID` y el bot de
Slack de siempre (mismo `/api/slack-eventos` que Sofi) responde en el hilo con el criterio de Elvin.
Cerebro: `vault/ceo/cerebro-director-creativo.md` — arriba el prompt de Elvin TAL CUAL (método de 5
fases, afinar ≠ reescribir, formatos FLYER/GUION, recomendaciones 0-2), abajo cómo opera en Slack,
la "💡 Nota del director" (máx. 1, criterio propio: políticas de Meta, zonas seguras, legibilidad…)
y **REGLAS APRENDIDAS** (vacía: solo entra lo que Elvin aprueba). Si Elvin corrige en el hilo
(su id = `CEO_SLACK_ID`), el agente aplica la corrección y cierra con `📌 FEEDBACK CANDIDATE`.
Lógica en `lib/director-creativo.ts` (`claude-opus-5`, adaptive thinking, effort high, cerebro
cacheado, fallback de servidor ante rechazos; override `DIRECTOR_MODEL`). Regla dura: cero datos
nuevos — lo que falte va como `[FALTA: …]`. Setup: scope `files:read` en la app de Slack
(para abrir los adjuntos), invitar el bot al canal, `message.channels` (o `message.groups` si es
privado). Video no lo ve: pide guion o frame.
