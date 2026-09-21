---
fecha: 2026-09-21
fuente: manual
unidad: ai-borinquen
tags: [ecosistema, pre-llamada, whatsapp, dragon-chat, show-rate]
estado: LISTO para cargar en Dragon Chat (Liz) · los emails hermanos viven en emails/ai-borinquen/pre-llamada.md
---

# AI Borinquen · Pre-llamada por WhatsApp (Dragon Chat)

**Objetivo:** subir el show rate de ~50 % a 65 %+ y que el prospecto llegue a la llamada habiendo
tocado su MVP y sabiendo quiénes somos. **Canal:** WhatsApp desde Dragon Chat (lo opera Liz),
firmado por **Alexis Pérez, fundador y CEO** (nombre de Elvin para AIB; nunca da la cara, la cara
son los creadores). **Trigger:** el webhook de Calendly crea el deal en CLOSERS → ese mismo día
entra en la lista de agendados. **Regla:** tuteo PR, minúsculas y frases cortas como WhatsApp,
nunca "gratis", nunca prometer ingresos, sin frases de robot.

Los `[CORCHETES]` se completan por prospecto. `[CREADOR]` = quien apareció en el anuncio por el
que agendó (`utm_content` de Calendly: yulianna · ed · luisa; si no se sabe, Yulianna).

## La lista diaria de agendados
Cada mañana Liz saca de Pipedrive (pipeline CLOSERS, etapa "Llamada agendada") los que agendaron
en las últimas 24 h con: nombre, negocio, fecha/hora, closer, `Agendó (utm_source)`, creador
(`utm_content`) y el **link del portal** (lo pone el setter cuando corre `demo.mjs todo`; queda en la
nota fijada del deal). Sin portal a las 24 h → el setter lo hace antes de mandar el toque 4.

## La secuencia

### T0 · Al agendar (dentro de la hora)
> hola [NOMBRE], soy Alexis Pérez, fundador de AI Borinquen 🇵🇷
> quedó tu demo el [DÍA] a las [HORA] con [CLOSER]
> antes de la llamada te voy a mandar tu negocio ya montado para que lo pruebes: un asistente que contesta por [NEGOCIO] por chat y por voz
> ¿por dónde te llegan hoy la mayoría de tus clientes: whatsapp, instagram o llamadas?

*(la pregunta abre conversación y le da al setter el dato para el MVP; si contesta, seguir en humano)*

### T0 + 10 min · Video del creador
Adjuntar el video de 30–45 s de `[CREADOR]` (vertical, celular, sin guion rígido):
> "hola [NOMBRE], soy [CREADOR]. vi que agendaste después de ver mi video. te cuento algo rápido: yo tampoco creía que un asistente de IA pudiera atender como una persona hasta que lo probé con un negocio de aquí. antes de tu llamada te van a mandar el tuyo ya montado; pruébalo como si fueras tu cliente. nos vemos."

Texto que acompaña:
> te dejo a [CREADOR], que fue quien te trajo hasta aquí 👆

### T0 + 2 h · Quiénes somos
> [NOMBRE], para que sepas con quién vas a hablar: somos AI Borinquen, 100 % de puerto rico. instalamos agentes de inteligencia artificial que contestan, precalifican y agendan por los negocios de la isla, y enseñamos a los dueños que quieren aprender a hacerlo ellos
> nuestra visión es simple: que ningún negocio de aquí pierda un cliente por no contestar a tiempo
> aquí te dejo quiénes somos y a quién hemos ayudado, 2 minutos: [LINK CONÓCENOS]

*(Conócenos = `demos/ai-borinquen-conocenos/` publicada en Netlify; incluye el video de 90 s cuando exista)*

### T0 + 24 h · Tu negocio ya está montado (el toque que más pesa)
> [NOMBRE], ya tienes tu negocio montado 👇
> [LINK DEL PORTAL]
> ahí está [ASISTENTE], el asistente de [NEGOCIO]. escríbele como si fueras un cliente tuyo y, si puedes, llámalo desde el botón de voz. lo que hables con él queda grabado y transcrito en tu portal
> en la llamada lo revisamos y te decimos qué haríamos primero

### T−1 día · Casos + pregunta que compromete
> [NOMBRE], mañana a las [HORA] es tu demo con [CLOSER]
> dos clientes de aquí para que veas de qué hablamos:
> • teo, terapista (mano santa pr): respondía el 20 % de sus leads, hoy responde en segundos y agenda solo
> • milton, caribe paint: "pensé que la implementación sería mucho más complicada, pero ha sido bastante fácil"
> una pregunta para llegar con el pie derecho: ¿qué es lo primero que quieres que el asistente resuelva en [NEGOCIO]?

*(adjuntar el video-testimonio de Teo o Milton cuando esté grabado; mientras, captura del texto)*

### T−1 h · Recordatorio
> [NOMBRE], en 1 hora es tu demo con [CLOSER] 👋
> si se te complica, contéstame y la movemos. mejor moverla que perderla

### T+15 min si no entró (no-show, tono cero reproche)
> [NOMBRE], te esperamos y no pudiste entrar, tranquilo. ¿qué día te viene mejor? te paso dos horarios: [OPCIÓN 1] o [OPCIÓN 2]
> tu portal sigue vivo por si quieres seguir probando: [LINK DEL PORTAL]

### T+1 h si entró (post-llamada)
> [NOMBRE], gracias por el tiempo. resumen de lo que hablamos: [RESUMEN DEL CLOSER, 2 LÍNEAS]
> tu portal queda abierto; cualquier cambio que quieras ver en [ASISTENTE] lo pides desde el botón "solicitudes" y te avisamos cuando esté
> siguiente paso: [LO QUE ACORDARON]

## Ruteo de la vía (lo hace el setter antes del toque de las 24 h)
Preguntas: ¿cuántos leads te llegan al mes y por dónde? · ¿quién responde hoy? · ¿quieres que lo
montemos nosotros o aprender a hacerlo tú? · ¿negocio físico o digital?
- Volumen y quiere delegar → **Vía A · Implementación** (deck `demo.mjs deck <slug>`).
- Poco volumen, quiere aprender, o digital → **Vía B · Academia AIB** (deck `--via capacitacion`).
Campo `Vía` en el deal de Pipedrive. El closer presenta UNA vía.

## Medición semanal (scoreboard AIB)
agendados · toques enviados (T0/T24/T−1) · con portal antes de la llamada · show % · cierres por
vía. Meta 30 días: show 65 %, 80 % con portal antes de la llamada.
