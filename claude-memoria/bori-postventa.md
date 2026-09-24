---
name: bori-postventa
description: "Ruta post-venta de Bori (19/sep/2026): Ángela (project manager) es la dueña de todo cliente nuevo hasta que publica; traffickers de respaldo; closers NO son paso obligatorio; un solo WhatsApp de soporte; plan en artifact"
metadata:
  type: project
---

Decisión de Elvin (19/sep/2026): después del pago, **Ángela (project manager)** atiende y acompaña a todo cliente de Bori hasta que publica su primer anuncio (o descarga si su plan no publica). Respaldo: un trafficker del equipo (ambos saben de tráfico). **Los closers no acompañan ni son un paso obligatorio**: no se condiciona el proceso a que pregunten nada; averiguar si la página del cliente es propia o de agencia (Business Portfolio) es tarea de Ángela al recibirlo (recomendación al closer, no requisito).

Plan completo (mensajes de bienvenida A/B, ruta día 0→30, canal único, documentos, qué construir): https://claude.ai/code/artifact/96eb5333-b37d-4134-a702-41b7873117cd

**Why:** de 29 cortesías 21 nunca abrieron y de 18 que pagan 1 publicó; Yesebel se fue por "falta de seguimiento". No había proceso de post-venta: el que vendía a veces respondía, a veces no.

**How to apply:** lo que falta construir en Bori (ficha automática en Slack `#bori-clientes` al pagar, lista de la ruta en Equipo, sección "Primeros pasos" con 3 documentos, ficha del cliente). Pendiente de Elvin: número de WhatsApp de soporte (`WHATSAPP_SOPORTE` en Railway) y email de Ángela para darle rol staff. Ver [[bori-backend-real]], [[bori-plan-crecimiento]], [[hey-bori-meta-app]].

**Canales (19/sep/2026, corrección de Elvin):** DOS. `#bori-clientes` (privado, C0C2YN5199B, lo creó Elvin; miembros Lis, Aure, Bárbara, Elvin; falta Ángela) recibe la ficha de cada cliente que paga (cualquier plan). Un canal de **bugs** aparte (con el desarrollador, soporte y quien atienda clientes: Lis, Ángela, Aure) recibe fallos/regresiones/proveedor caído; mientras Elvin no lo cree, apunta al viejo `#bori-clientes-y-bugs-archived` (C0BSG21NECV). Bori postea con `SLACK_BOT_TOKEN` (bot @Command Center U0BFPB0SSP4) + `SLACK_CANAL_CLIENTES` / `SLACK_CANAL_BUGS`; **el bot tiene que estar invitado** (`/invite @Command Center`) en cada canal privado o no puede postear. Respaldo: webhooks. `PM_NOMBRE=Ángela`. Ángela NO está en Slack todavía (buscada 19/sep); Aure debe agregar al personal. Railway CLI ya autenticado en la Mac: `npx @railway/cli link --project believable-amazement` + `--service bori`.

**Rol trafficker (20/sep/2026):** `trafficker.js`. Cuenta de equipo de Level Up con plan Agencia sin pago, 300 créditos renovables cada 30 días, Meta propio (publican en pausa en cuentas de clientes de la agencia), CRM, espacios por cliente, y "Clientes Bori" (empuje + activación). Sin Planes/regalos/facturación/avatar. Se crean con `POST /api/admin/crear-trafficker {email,name}` desde la sesión del dueño (devuelve contraseña temporal una vez); entran por www.heybori.ai/app. Elvin pasa los emails y se crean uno a uno.

**Estructura de atención (21/sep/2026, Elvin: "no quiero convertir esto en un servicio"):** tres capas y
ningún chat 1:1 abierto — (A) **Canal de WhatsApp "Bori"** (Canal, no grupo ni difusión: los clientes no
pueden escribir; Lis publica, Aure lo monta, Ángela/Elvin admins); (B) la app (chat de Bori 24/7, guías,
Reto, "¿Algo no funciona?"); (C) UN WhatsApp Business de soporte con horario, triage de Lis, onboarding a
Ángela, bugs a Equipo → Fallos. Solo el plan Agencia tiene 1:1 humano. Doc: `vault/proyectos/
bori-crecimiento/estructura-cliente-bori.md` (incluye guion de triage para Lis y textos del canal).
Pedido a Aure por Slack el 21/sep (número + canal para el miércoles). Pendiente: Nico agrega
`CANAL_WHATSAPP` a la app cuando Aure entregue el enlace; la ruta y el guion de triage se le enviaron a Lis el 21/sep (DM desde la cuenta de Elvin).

**Puesto #2 definitivo (21/sep tarde, Elvin): Coordinadora de Colaboraciones y Crecimiento**, no "head de
crecimiento" ni creadora. Sabe de marketing, perfil de creadora, pero su trabajo es COORDINAR: buscar,
vetar, entrevistar, negociar y cotizar creadores/influencers, y llegar cada viernes con 3 ofertas
cotizadas para que Elvin apruebe; luego coordina producción, medición y los proyectos de crecimiento
(referidos, Canal, bienvenida). Base $1,500–2,500 + $100/colab + $10/pagante por código + 2 % MRR nuevo.
Doc: `vault/proyectos/contrataciones/coordinadora-colaboraciones-bori.md` (v3, reemplaza las anteriores).

**Pipeline de creadores (21/sep noche):** Elvin identifica creadores a ojo (10–15K con buen engagement
orgánico) y no quiere subestimarlos → sistema: `scripts/creadores.mjs` (agregar/puntuar/lista/estado/
tabla-viernes; el criterio de Elvin en 100 puntos sobre la mediana de 12 posts), tablero
`data/creadores.json`, comando `/creadores vetar|tabla|buscar` (Apify, funciona de nuevo desde el 21/sep),
atajo por Telegram `creador @handle …` en cualquier bot (sin Claude), tarea `creadores-vetar-diario` 8 AM.
**Lis = Coordinadora de Retención y Alianzas · EA Market desde el 22/sep** (puesto híbrido del holding, no de
una empresa: retención 30 % · seguimiento 25 % · soporte a closers 20 % · colaboraciones con creadores 25 %;
la dedicación sube o baja según la necesidad de EA Market). **Base se queda en $750** + incentivos por
resultado: $25–50 por colaboración lograda (según tamaño), $50 por venta propia de Bori que cierra en su
seguimiento sin pasarla a un closer, $25 por cliente retenido 30 días, **$250 cuando las ventas por su
seguimiento pasan de $25K en el mes** (+$250 por cada $25K extra), computadora. Reevaluar 6/nov (meta:
4 colabs en octubre). Acuerdo: `vault/proyectos/contrataciones/acuerdo-lis-ea-market.md`. Doc: `pipeline-creadores.md`.

**Seguimiento (23/sep):** Aure se reúne con Lis durante el día de hoy para explicarle el puesto nuevo; el
énfasis es el **manual de colaboraciones de Bori** (arranca ya; meta octubre: 4 colaboraciones publicadas)
y el acuerdo nuevo. Después coordina reunión **Lis ↔ Elvin** para repasar el plan de creadores. Tarea
programada `seguimiento-lis-colaboraciones` (**9 AM y 2 PM**, no 5 AM) persigue a Aure/Lis hasta que la
reunión ocurra, el tablero de creadores tenga 10+ y haya fecha con Elvin; solo avisa a Elvin si hay
novedad real. PDFs de los 3 documentos en `vault/proyectos/contrataciones/pdf/` (los adjunta Elvin: el
bot de Slack no tiene `files:write`).
