# Resuelto · Qué pasa cuando un plomero escribe (y qué haces tú)

**Vigente desde el 21/sep/2026, noche.** Los anuncios están prendidos. Este es el flujo real, de punta a punta, y tu checklist diario. Léelo una vez; después solo usa la sección 4.

## 0. Quién hace qué (decisión de Elvin, 21/sep)

**Yaileen** (Head of Team Scaling en Level Up) toma el rol de entrevistar y contratar plomeros. **Bono: $25 por cada plomero contratado y firmado** (definido por Elvin 21/sep; se paga al firmar el acuerdo). **Aure** coordina y da seguimiento. Enviado a Aure por Slack el 21/sep con el canvas https://levelupmediaespacio.slack.com/docs/T07V7MUDA9H/F0C3F8YNNF8. Accesos YA dados (21/sep, por API): usuaria de GHL `h38dHpLts7bkmKkjuduq` (yaileenjimenez@gmail.com, rol user) · Elvin admin `f1vjZhmzX1KHCj5zz7Ul` (resueltoapp.pr@gmail.com) · invitación a Zernio (member, vence 28/sep) · decks en `https://agente-production-684f.up.railway.app/equipo/entrevista-{plomeros,contratistas}-k7m2p9.pptx` (ruta no enlazada, noindex; los .pptx viven como .b64 en `agente/portal/equipo/` porque el CLI de Railway no sube binarios). Calendarios de GHL creados con Yaileen como miembro: ver `agente/data/ghl-calendarios.json`.

## 1. Los dos caminos de entrada

| Camino | Qué ve el plomero | Quién lo atiende | Dónde cae |
|---|---|---|---|
| **Anuncio → WhatsApp** (campaña WhatsApp · Sprint 1) | Toca el anuncio, se abre WhatsApp con Resuelto, saludo + 3 botones | **El agente** (Claude, 24/7, contesta en ~10 s) | Inbox de Zernio + **GHL → pipeline Candidatos → Aplicó** |
| **Anuncio → resueltopr.com/plomeros** (campaña Leads · Sprint 1) | Landing con calculadora del 65 %, llena el formulario | Nadie en vivo — el formulario registra | **GHL → pipeline Candidatos → Aplicó** (con tag `plomero` + `candidato`) |

Los dos terminan en el mismo lugar: **GHL, pipeline Candidatos**. Ese tablero es tu única pantalla de trabajo.

## 2. Qué hace el agente solo (camino WhatsApp)

1. Detecta que es plomero (no cliente) en los primeros mensajes.
2. Explica el trato en 4 líneas: 65 % de la mano de obra · pago los viernes con estado de cuenta · materiales reembolsados +10 % · $0 de publicidad · cero cuotas.
3. Dice las dos reglas duras de frente: el cliente que llega por Resuelto es de Resuelto; nunca cobra directo.
4. Lista requisitos: licencia vigente (oficial/maestro), colegiación, vehículo, herramientas, seguro, antecedentes penales.
5. Pide: nombre, WhatsApp, municipio, nivel y número de licencia, vehículo/herramientas, disponibilidad.
6. **Desde el primer mensaje** la persona ya existe como contacto en GHL (tag `whatsapp-entrante`), y en cuanto el agente detecta que es plomero crea la tarjeta en **Candidatos → Aplicó** (nombre "WA · [nombre]") aunque la persona no siga escribiendo — así Yaileen puede darle seguimiento a los que abandonan a mitad (cambio del 21/sep, 11 PM, tras notar que dos conversaciones de prueba no aparecían).
7. **Registra** → contacto en GHL (tags `plomero-candidato` + nivel de licencia) + tarjeta en Candidatos con nota resumen + te manda un WhatsApp al 787-951-7579 con los datos.
8. Ofrece 2 horarios para la videollamada de 20 min y la deja acordada.
9. Si preguntan cuánto trabajo hay, es honesto: arrancando, 1–2 trabajos/día por zona.
10. Si algo se sale del libreto (agresivo, pide hablar con una persona, pregunta legal), **escala**: te avisa y se calla 3 h para que contestes tú desde el inbox de Zernio.

**Lo que el agente NO hace todavía:** no crea el evento de la entrevista en un calendario real (dice la hora acordada y la deja anotada en la tarjeta de GHL; el calendario de GHL se activa cuando tú entres como usuario de la sub-cuenta, ver §5). Tú confirmas la hora con un mensaje.

## 3. Cómo se ve en GHL

`app.gohighlevel.com` → sub-cuenta **Resuelto Home Services LLC** → Opportunities → pipeline **Candidatos**.

Etapas: **Aplicó** → Entrevista agendada → Documentos verificados → Activo (o Descartado). El agente y el formulario ponen todo en **Aplicó**; el resto lo mueves tú arrastrando la tarjeta. Cada tarjeta tiene el contacto, la nota con licencia/municipio/equipo/disponibilidad y la conversación (si vino por WhatsApp, el historial está en el inbox de Zernio; en GHL queda la nota).

## 4. Rutina de Yaileen (15 minutos, 2 veces al día)

**Mañana (9 AM) y tarde (5 PM):**
1. Abre GHL → Candidatos → columna **Aplicó**. Cada tarjeta nueva = un plomero que aplicó.
2. Criba en 30 segundos por tarjeta con la nota: ¿licencia oficial/maestro? ¿vehículo + herramientas? **Reclutamos en TODO Puerto Rico (decisión de Elvin, 21/sep 23:10): el municipio nunca descarta.** Solo va a **Descartado** el que no tiene licencia ni piensa sacarla.
3. Los que pasan: escríbeles por WhatsApp desde el **inbox de Zernio** (zernio.com → Inbox) confirmando la videollamada: *"[Nombre], soy Elvin de Resuelto. Confirmo tu videollamada el [día] a las [hora]. Te mando el link por aquí 10 min antes. Ten a mano foto de tu licencia y de la guagua."* Mueve la tarjeta a **Entrevista agendada**.
4. Antes de cada entrevista: abre `kit/entrevista/entrevista-plomeros.pptx` (16 slides, guion en las notas). Son 20 min: descubrimiento → problema → cómo funciona → sus números → reglas → objeciones → cierre en 2 opciones.
5. Después de la entrevista: pide licencia + colegiación + antecedentes por WhatsApp → **Documentos verificados**. Cuando firme el acuerdo (borrador en `kit/contrato-plomero-borrador.md`, pendiente del abogado) → **Activo** y me avisas para darlo de alta en `agente/data/territorios.json` y que empiece a recibir trabajos.

**Regla de velocidad:** un plomero que aplica y no oye de nadie en 48 h se enfría. La meta es tarjeta nueva → tu WhatsApp de confirmación en < 24 h.

## 5. Lo que te avisa y dónde

- **Telegram @Nina_resueltoCM_bot** (desde 22/sep) por cada candidato registrado, contratista y escalación — sin límite de ventana. También llega copia al WhatsApp 787-951-7579 cuando Meta lo permite (ventana de 24 h).
- **GHL** ya tiene usuarios (Yaileen + Elvin) y los 3 calendarios creados (21/sep). Falta: que el agente use el calendario `Entrevista` al agendar (hoy solo anota la hora en la tarjeta) — siguiente mejora de código.

## 6. Pendientes que mejoran esto (ninguno bloquea)

1. ~~Usuario en GHL~~ hecho 21/sep. Pendiente: conectar `agendar` del agente al calendario Entrevista de GHL.
2. ~~Telegram~~ hecho 22/sep (@Nina_resueltoCM_bot).
3. **Rotar la ANTHROPIC_API_KEY** que pasó por el chat.
4. **Verificación del negocio en Meta** (documentos de la LLC) → quita el "Sending limited" y aprueba el nombre visible "Resuelto".
5. Abogado: acuerdo de plomero definitivo.

## 7. Qué está probado (21/sep, 22:30)

- Plomero simulado por el chat web: el agente explicó el trato, pidió datos, registró, ofreció 2 horarios, agendó → contacto en GHL con tags `plomero-candidato` + `oficial` y tarjeta P-001 en Candidatos → Aplicó, con nota. Borrado después.
- WhatsApp real (tu mensaje "calentador roto en San Juan"): respuesta en 9 s, tono correcto, preguntas de diagnóstico.
- Perfil de WhatsApp: foto = logo naranja de Resuelto, "about" y descripción de marca, web y correo (vía API de Zernio).
