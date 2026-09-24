---
name: sofi-coordinadora
description: "Sofi es la Coordinadora de Producción (agente, no humana) del Estudio de Elvin — su cerebro (vault/ceo/cerebro-sofi.md), sus rutinas (diaria 7:30, locación mensual con Aure, ciclo de ángulos, check-in cada 2–3 días), las reglas de guion de Elvin (50/20/20/10, 8+2, enemigo, doble CTA) y los ángulos/avatares por cara"
metadata: 
  node_type: memory
  type: project
  originSessionId: 10b36ca7-9ca3-47ce-98f7-ae02e8443893
  modified: 2026-09-19T17:30:43.213Z
---

**Decisión de Elvin (18/sep/2026, noche):** la coordinación de producción NO se contrata; la hace
**Sofi** como agente líder, "clonada" de su criterio. Elvin escribe los guiones y decide el
marketing: **es lo único que aprueba**; después de aprobar guiones, todo tiene que correr sin él
("eso no puede fallar").

**Dónde vive:** cerebro `vault/ceo/cerebro-sofi.md` (lo carga `systemSofi()` en `lib/sofi.ts` y lo
leen `/coordinar-produccion` y `/fabrica-contenido`); memoria de trabajo `data/estudio.json`
(día de grabación, locaciones, contactos, caras, creadores, contrataciones, compuertas,
pendientesElvin, comunicacion, cicloAngulos, lotes, bitacora); calendario `data/calendario.json`
(56 piezas de octubre, `origen:"estudio"`, en BORRADOR hasta que Elvin apruebe S1). Tarea
programada `sofi-coordinacion-produccion` 7:30 AM lun–sáb (lunes "semana"; primer día hábil:
locación + ciclo de ángulos).

**Rutinas que no pueden fallar:** (1) DM diario a Elvin con lo que falta y de quién; (2) **locación
mensual**: 3 opciones en PR con precio/link/fecha, alternando estudio y Airbnb, ideas frescas de vez
en cuando (NY, California, Medellín, eventos PR); Elvin elige; **Sofi le escribe a Aure por Slack
(DM D08TBNYN95Z) para que pague y coordine al videógrafo** (candidato Cristian); confirma a 7 días y
48 h; si Elvin no va, Aure le pasa al videógrafo "tomas con cuidado, repetir lo que no sirva, cautela:
Elvin dijo así"; (3) micro-influencers $1,500/mes; (4) **ciclo de ángulos mensual**: preguntar de qué
ángulo/anuncio vinieron las ventas, repetir los que venden, cambiar los que no; (5) check-in con Elvin
cada 2–3 días sin insistir; WhatsApp cuando él dé el canal (mientras, vía Aure); (6) sugerir ideas
(ángulos, formatos, lugares, eventos) con criterio de ventas.

**Reglas de guion (todas las marcas):** mezcla **50 problema / 20 solución / 20 producto / 10
mentalidad**; **de cada 10 guiones, 8 con GANCHO→PROBLEMA→SOLUCIÓN→PRUEBA→CTA y 2 libres** (viral
o ventas); **cada pieza ataca un enemigo**; **doble CTA** ("Comenta PALABRA" + "escríbenos/agenda
por el enlace"); "gratis" solo en títulos de copy, nunca en CTA; machacar los mismos temas; ángulos
claros por cara o preguntar.

**Caras y avatares:** Daren (LU) = Done With You "de $5K a $20K/mes" (coaches/digitales), ads con
teleprompter; **Frankie Jay** (LU, una persona) = salud, contratistas, negocios tradicionales,
dueños 40–65; enemigos LU: botón azul, sin estrategia, referidos. Yulianna (AIB) = agentes
personalizados, digitalizar, no responder a tiempo, recepcionista de IA, no contratar por contratar,
crecer sin contratar; enemigos AIB: responder tarde, no calificar, sin sistemas, tareas repetitivas,
pagar de más por secretaria. Elvin (Shadow) = tesis "no tienes que mostrar tu cara… tus primeros
$10K/mes haciendo lo mismo que yo" + los 6 ángulos con "ataque de temporada" (creador que no sabe
vender su audiencia, sin nombrar Quilla). Bori = "la agencia de $2–5K en una app desde $99", Pro
$99 nunca "desde $39". Valentina ya no crea contenido (tarea pausada).

**Lotes del 19/sep en la bandeja:** Daren 10 · Frankie Jay 10 · Yulianna 10 · Shadow 8 · Bori 6.

**How to apply:** cualquier pieza nueva respeta 8+2, mezcla y enemigo; Sofi solo escribe a Elvin
(contenido) y a Aure (logística); nunca marcar hecho sin confirmación. Ver [[plan-de-guerra-q4]],
[[elvin-ceo-perfil]], [[circuito-contenido-equipo]], [[no-enviar-sin-aprobar]].

**Telegram (decisión 18/sep noche):** "todas las comunicaciones de mi agente serán por mi Telegram
directo" (Slack tiene demasiados grupos). Código listo: `lib/telegram.ts`, `lib/notificar-ceo.ts`
(`notificarCEO` = Telegram + espejo Slack), webhook `app/api/telegram/route.ts` (secreto, solo el
chat del CEO, responde con Sofi y espeja `[Telegram] …` a Slack), `scripts/telegram-bot.mjs
quien|setup|test|enviar`; la ronda de Sofi y el board meeting ya lo usan. **Faltan 3 valores de
Elvin**: `TELEGRAM_BOT_TOKEN` (BotFather), `TELEGRAM_CEO_CHAT_ID` (`quien`), y ponerlos con
`TELEGRAM_WEBHOOK_SECRET` en Vercel + `setup`. Pasos en `vault/proyectos/estudio/telegram-conexion.md`.

**Contrataciones (19/sep):** Head de Crecimiento Bori → rol completo en
`vault/proyectos/contrataciones/head-crecimiento-bori.md`, enviado al DM de Elvin (lo publica él).
Setter puertorriqueño/a AIB → rol completo en `setter-puertorriqueno-aib.md`; enviado por Slack a
**Yaileen (U08Q51UFLSH, dueña, "Head of Team Scaling") y Aure (U08HA9QCJBG, apoyo)** DESDE LA
CUENTA DE ELVIN (el bot no tiene scope `im:write`), firmado "— Sofi"; tarea `seguimiento-setter-pr`
(9:00 AM lun–sáb, `/seguimiento-contratacion`) insiste a diario hasta que digan "listo" (hitos:
publicada 22/sep → entrevistas 25–26 → prueba 29–30 → arranque 6/oct) y reporta a Elvin.

**Recordatorio pedido por Elvin (19/sep):** cuando se hable de AI Borinquen, hacer el **plan
"Dragon Chat" con Liz** (asistente de AIB; tiene el WhatsApp de AIB y ~5,000 contactos): rescatar
y nutrir toda la base por WhatsApp, subir a llamada, promociones. Nota en
`vault/ideas/dragon-chat-liz-aib.md`; también en `data/estudio.json` → pendientesElvin. Confirmar
qué herramienta es "Dragon Chat".
**Setter PR — pago (corrección 19/sep):** sin base, 100 % comisión = 10 % de cada venta que origine; 2 días de prueba pagados. Avisado a Yaileen y Aure en el hilo.

**Control remoto por Telegram (19/sep):** Elvin quiere hablarle a TODOS sus agentes por Telegram y
pedirles cualquier cosa desde el celular "como si estuviera hablando por Claude". Construido:
`scripts/telegram-puente.mjs` (long polling en la Mac → `claude -p` en el repo, sesión por día,
`/sofi` `/jarvis` `/estado` `/nuevo`, espejo a Slack, `PUENTE_MODO=seguro|total` en .env.local —
el default `seguro` lo agrega Elvin a mano si quiere cambiarlo); plist en `scripts/launchd/`, lo
instala Elvin con launchctl (el classifier bloquea instalar servicios y tocar .env.local desde
scripts). CLI de Claude Code instalado en `~/.npm-global/bin/claude` (npm prefix → ~/.npm-global).
Con el puente corriendo, el webhook de Vercel (`/api/telegram`) queda de respaldo, sin registrar.

**Marriott (19/sep):** Elvin tiene el pase Marriott con ~70 % de descuento, código de tarifa
**MMP**, válido en PR y el mundo. Sofi propone hoteles Marriott (o estudios/Airbnb) con fecha;
Elvin verifica el precio con el código y decide. Las opciones de locación del mes se mandan SIN
esperar a que él fije fecha (se proponen 3 con fecha sugerida). Pendiente suyo: conectar Telegram.

**Puente en Railway (19/sep):** proyecto `puente-telegram`, servicio `puente`, volumen `/estado`,
`Dockerfile.puente` (Node 22 + Claude Code CLI + vercel), `RAILWAY_DOCKERFILE_PATH` en variables,
`.railwayignore` (sin medios ni node_modules anidados: sube ~11 MB). Variables ya puestas:
ANTHROPIC_API_KEY, SLACK_BOT_TOKEN, CRON_SECRET, RETELL, NETLIFY, PIPEDRIVE_*, CEO_SLACK_ID,
PUENTE_MODO=seguro, CONTENT_OS_URL. **Conectado 19/sep:** bot `@eamarket_sofi_bot`, chat id de Elvin `8771242182` (ambos ya en
Railway). Falta `VERCEL_TOKEN` (y ACTIVECAMPAIGN_* después). Sync de data/: `app/api/snapshot` + `scripts/sync-data.mjs`
(pull antes de trabajar en Mac y Railway; deploy-snapshots hace pull antes de subir). El servicio
launchd de la Mac quedó descargado (respaldo). Guía: `vault/proyectos/estudio/telegram-botfather-pasos.md`.
Limitación: desde Railway no hay MCPs de escritorio (Slack MCP, Granola, navegador); sí todo lo que va
por tokens/scripts.

**Identidad visual de Sofi (19/sep):** 3 estilos generados (3D = avatar del bot, vector, editorial) en
`public/marcas/sofi/`; guía y prompt base en `vault/proyectos/estudio/sofi-identidad-visual.md`.
Personaje fijo: boricua 30s, bun de rizos, aros dorados, cuello tortuga negro, headset, terracota +
carbón. La foto de perfil del bot la pone Elvin en BotFather (`/setuserpic`). Sofi ya se presentó a
Aure por DM (19/sep). **Deploy desde Railway:** funciona con VERCEL_TOKEN + `.vercel/project.json`
(que ahora viaja en `.railwayignore`); el bot tiene reglas duras de no tocar deploy/infra y máx 20
turnos (un intento suyo de "arreglar" el deploy costó $5.6). El token de Slack de LU no tiene
`files:write` → Sofi no puede mandar imágenes por Slack.

**Agente vibecoder (19/sep, se construye en otra sesión):** Elvin pidió un agente tipo Sofi pero para
desarrollo (ajustes/mejoras/bugs de Bori y productos) que lo reemplace en el trabajo diario de código.
Debe nacer integrado: mismo bot de Telegram con prefijo propio (`/dev`), reglas de `bori-backend-real`
y `elvin-aib-core-vision`, reporte por Telegram, tope de turnos/costo. Nota en `vault/ideas/agente-vibecoder.md`.
