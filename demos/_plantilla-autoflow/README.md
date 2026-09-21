# Plantilla AutoFlow — Fábrica de MVPs

Base de la demo personalizada que genera `scripts/demo-cliente/demo.mjs` para cada
prospecto de AI Borinquen (jugada 3 del plan de guerra Q4 2026).

- `chat.html` — copia congelada del demo de Glenn International (WhatsApp look-alike). El
  script reemplaza: título, colores, avatar, tarjeta del negocio, `intents[]`, `fallback`,
  `leadReply`, el saludo y todas las menciones del nombre.
- `voz.html` — copia congelada del orbe de voz de Glenn. El script reemplaza: `RETELL`
  (agentId + endpoint central `/api/demo-webcall` del Content OS), `ASSISTANT`, el bloque
  de conocimiento hablado (`respond()`/`greeting()`), textos de la página y colores.
- `propuesta.html` — página nueva con tokens `{{...}}`: dolor, resumen, resultados, la
  comparativa de Laura ($58K vs ~$9,500), los 3 niveles y el CTA a WhatsApp de AIB.

No edites estas copias a mano para un cliente: corre el script. Si mejoras la plantilla,
mejoras todas las demos futuras.

Módulos agregados el 18/sep (definición de MVP de Elvin):
- `landing.html` — landing del negocio (rediseño o nueva) con tokens `{{...}}`; el WhatsApp del
  negocio (o el de AIB si no hay) como CTA; preview del chat en el "teléfono".
- `sistema.html` — recorrido "por dentro" en 4 pasos (embudo → conversaciones → agenda →
  agentes) con datos de ejemplo generados por Claude. Es una simulación del flujo del cliente,
  no la plataforma real.
- El deck `.pptx` no tiene plantilla HTML: lo arma `deck()` en el script con pptxgenjs.

Portal AutoFlow (21/sep/2026): el sitio estático sigue siendo el "toque" del prospecto, pero lo vivo
(llamadas reales transcritas, leads del chat, solicitar cambios) vive en Content OS:
`/portal/<slug>?k=<token>` (`app/portal`, `lib/portal/`). Tokens nuevos en las plantillas:
`{{PORTAL_CARD}}` (propuesta), `{{PORTAL_BANNER}}`, `{{RESPUESTA}}`, `{{SIN_RESPONDER}}` (sistema: ya
no hay "10 s" ni "0 sin responder" inventados) y `{{P_*}}`/`{{GARANTIA}}` (precios desde `PRECIOS`
en el script). `chat.html` avisa cada mensaje/lead a `/api/demo-lead`; `voz.html` manda el `slug` a
`/api/demo-webcall` para que la llamada quede en el portal. Comando: `demo.mjs portal <slug>`.
