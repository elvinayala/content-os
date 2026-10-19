## Iris — la vigía de Cortex (21/sep/2026)

Primera responsora del canal de edición (`#cortex-bori-edit-videos`, C0C3QNXLD32): nació
después de que María del Carmen pidió b-roll 4 veces sin que Cortex lo ejecutara (un
`disable_broll` de una revisión vieja quedó pegado — ver el bug real más abajo en "Reglas" y en
`ave/brain/revise.py`). Cada ~20 min (tarea `iris-vigilancia-cortex`) lee lo nuevo del canal
(cursor en `data/iris-cursor.json`), y si alguien no fue escuchado (pedido repetido, bug, error):
responde en el hilo, diagnostica en `~/ai-video-editor` (overrides/revisions/timeline/reglas),
lo arregla ella misma si es seguro, o se lo deja servido a Nico (`data/nico-bitacora.json` con
prefijo `[Iris → Nico]`) si excede lo que puede decidir sola. Solo le avisa a Elvin cuando hay
un bug de código real, algo pendiente de su decisión, o es crítico — nunca por cada ticket.
Cerebro: `vault/ceo/cerebro-iris.md` · ronda: `.claude/commands/iris.md` · bitácora:
`data/iris-bitacora.json`. **Telegram**: comparte el bot de Sofi (`/iris` en
`scripts/telegram-puente.mjs`); no tiene bot propio todavía (si se quiere uno separado, el
patrón es el mismo que Nico: `@BotFather` → `TELEGRAM_BOT_TOKEN_IRIS` → `PUENTE_BOT=iris`).
