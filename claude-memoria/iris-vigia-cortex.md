---
name: iris-vigia-cortex
description: "Iris = la vigía de Cortex (editor de video): revisa el canal de Slack cada ~20 min, responde a los estrategas, diagnostica y arregla o se lo deja servido a Nico, sin esperar a Elvin"
metadata: 
  node_type: memory
  type: project
  originSessionId: 11dd585d-9f78-448a-bf8a-62785c9be54f
  modified: 2026-09-21T00:00:00.000Z
---

Creada el 21/sep/2026 por pedido de Elvin, justo después de que María del Carmen tuvo que pedir
b-roll **4 veces** en Slack sin que Cortex lo ejecutara (un `disable_broll` de una revisión
vieja había quedado pegado — ver [[ai-video-editor]]). Pedido textual: *"eso no puede repetirse…
hacer un agente con nombre, identidad y todo, para manejarlo desde Telegram, que esté en Slack,
si ve algo así me diga o lo arregle él, o le diga a Nico para arreglo inmediato sin depender de
mí."*

- **Reparto con Nico**: Nico ve TODAS las plataformas 1 vez al día; Iris ve SOLO el canal de
  edición de Cortex (`#cortex-bori-edit-videos`, C0C3QNXLD32) casi en tiempo real (cada 20 min).
  Si Iris no puede resolver algo sola, se lo deja servido a Nico en `data/nico-bitacora.json`
  con el prefijo `[Iris → Nico]` — nunca espera a que Elvin lo note.
- Cerebro `vault/ceo/cerebro-iris.md` · ronda `.claude/commands/iris.md` · cursor
  `data/iris-cursor.json` (último mensaje procesado del canal) · bitácora
  `data/iris-bitacora.json`.
- **Tarea programada** `iris-vigilancia-cortex` (`*/20 * * * *`, sin restricción de horario):
  corre mientras la app de Claude Code esté abierta, como el resto de las tareas programadas
  (worker-encargos, brief-ceo-diario, etc.) — no es un servicio aparte en Railway.
- **Telegram**: por ahora usa el bot COMPARTIDO de Sofi (`scripts/telegram-puente.mjs`), comando
  `/iris <texto>` (o `/iris` sola para correr su ronda ya). No necesitó un bot nuevo de
  @BotFather para esto — decisión deliberada para no depender de otra acción manual de Elvin. Si
  más adelante Elvin quiere una identidad de Telegram propia y separada (como Nico), el patrón
  ya existe: crear el bot en @BotFather → `TELEGRAM_BOT_TOKEN_IRIS` → `PUENTE_BOT=iris`.
  `scripts/nico-ronda.mjs enviar "<texto>" iris` ya soporta mandarlo con ese token si existe.
- Solo le avisa a Elvin (Telegram + espejo Slack) cuando arregló un bug de código real, algo
  quedó pendiente de su decisión, o es crítico — nunca por cada ticket resuelto (silencio =
  respuesta correcta cuando no hay caso).
- Prohibido (igual que Nico): borrar datos, tocar cobros, escribirle a un cliente final,
  redeploy con renders en cola, secretos.

**How to apply:** si aparece otra queja de "pedí X veces y no pasó nada" en el canal de Cortex,
Iris ya debería estar tomándola sola en su próxima corrida (máx 20 min de retraso). Si Elvin
pregunta por el estado de un caso ahí, puede escribirle directo por Telegram con `/iris`.
Relacionado: [[nico-vibecoder]], [[ai-video-editor]], [[cortex-coaching-grabacion]].
