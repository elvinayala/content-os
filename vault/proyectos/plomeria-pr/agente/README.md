# Agente de Resuelto

Un solo cerebro (Claude) para todos los canales: **WhatsApp**, **Instagram DM**, **Facebook Messenger** y el **chat de las dos landings**. Cotiza con el menú, verifica cobertura por municipio, consulta el calendario del plomero, agenda, genera links de pago, lee fotos y PDFs, transcribe audios, registra plomeros candidatos y escala a un humano cuando hace falta.

Es un servicio propio de Resuelto Home Services LLC. No depende de las agencias.

## Cómo está armado

```
src/
  index.ts            servidor (webhooks Meta + Stripe, /api/chat del widget, admin)
  agente.ts           bucle de herramientas con Claude (claude-opus-5)
  prompt.ts           system prompt estable (se cachea) + menú + territorios
  herramientas.ts     11 herramientas: definición para Claude + ejecución
  almacen.ts          contactos, conversaciones, trabajos, candidatos (JSON → luego Postgres)
  canales/whatsapp.ts facade WhatsApp → zernio.ts (default) o whatsapp-meta.ts (Cloud API directa)
  canales/meta.ts     Instagram + Messenger
  integraciones/      calendario (Google), cobros (Stripe + ATH Móvil), crm (GoHighLevel), media (fotos/audio/PDF)
  cli.ts              chat de prueba en la terminal
data/menu.json        el menú de precios (edítalo aquí; el agente lo lee al arrancar)
data/territorios.json territorios, municipios y plomeros con su calendario
widget/resuelto-chat.js  burbuja de chat para las landings
```

**Todo funciona sin integraciones configuradas** (modo simulado): el agente cotiza, agenda en su registro interno y te avisa por consola. A medida que pones credenciales en `.env`, cada pieza se vuelve real. Así puedes probarlo hoy y conectar Meta mañana.

## Arrancar en local (10 minutos)

```bash
cd agente
cp .env.example .env         # pon al menos ANTHROPIC_API_KEY
npm install
npm run chat                 # habla con el agente en la terminal
npm run dev                  # servidor en http://localhost:3100
```

Prueba en la terminal: *"Hola, tengo el fregadero tapado en Caguas"* y luego *"Soy plomero, quiero trabajar con ustedes"*.

## Conectar cada canal

### 1. WhatsApp por Zernio (default, sin app de Meta)

El número **939-247-9234** vive solo en la Cloud API (no se instala WhatsApp en la línea) y se conecta
desde el dashboard de Zernio: gratis (2 cuentas / 10K mensajes), con inbox web para que un humano tome el
chat. El agente corre en Railway (proyecto `resuelto`, servicio `agente`, dominio
`https://agente-production-684f.up.railway.app`).

1. Activa la línea (Meta manda un código por SMS/llamada). **No instales WhatsApp ni WhatsApp Business con
   ese número.**
2. [zernio.com](https://zernio.com) → Connections → tarjeta **WhatsApp** → **+ Connect** → **Use my own
   number** → login de Facebook con el portafolio *Resuelto Home Services LLC* → crea un WABA nuevo →
   escribe el número → código SMS. En la ventana de Meta **no** elijas "Connect existing WhatsApp Business
   app account" (eso es coexistencia y te ata al teléfono).
3. Dashboard → **API keys** → `ZERNIO_API_KEY`. Connections → WhatsApp → el id de la cuenta →
   `ZERNIO_ACCOUNT_ID`.
4. Dashboard → **Webhooks** → nuevo: URL `https://agente-production-684f.up.railway.app/webhook/zernio`,
   eventos `message.received` y `message.sent`, y un secreto inventado por ti → `ZERNIO_WEBHOOK_SECRET`.
   (Lo mismo por API: `POST /v1/webhooks/settings`.) El botón "Test" tiene que devolver 200.
5. Variables en Railway (dashboard del servicio `agente` o `railway variables --set`): `ANTHROPIC_API_KEY`
   (key propia de Resuelto), `ZERNIO_API_KEY`, `ZERNIO_ACCOUNT_ID`, `ZERNIO_WEBHOOK_SECRET`,
   `TELEGRAM_BOT_TOKEN` + `COORDINADOR_TELEGRAM_CHAT_ID` (avisos de escalación) y `PORTAL_SECRETO`.
   `GET /health` debe decir `"whatsapp":"zernio"` e `integraciones.whatsapp: true`.
6. Perfil del número (Connections → WhatsApp → Business Profile): foto `kit/perfiles/avatar-naranja.png`,
   nombre "Resuelto", descripción "Plomería con precio fijo en Puerto Rico".

**Cómo se reparten humano y agente.** Si alguien contesta desde el inbox de Zernio (evento `message.sent`
con `sentVia: human`) o el agente escala con `escalar_a_humano`, el agente calla en esa conversación
`HUMANO_HORAS` (3 por defecto) contadas desde la última actividad humana y luego retoma solo; el link
`/admin/liberar/:id` del aviso lo devuelve antes. Los envíos a alguien que nunca nos escribió (ofertas a
plomeros, recordatorios) salen como *utility* por Meta Direct Send; si Meta lo rechaza, hace falta una
plantilla aprobada (Connections → WhatsApp → Settings → Templates).

**Plan B: Cloud API directa** (`WA_PROVEEDOR=meta`, código en `src/canales/whatsapp-meta.ts`):
1. [developers.facebook.com](https://developers.facebook.com) → Crear app → tipo **Business** → agregar producto **WhatsApp**.
2. En WhatsApp → API Setup: agrega el número de Resuelto (o usa el de prueba). Copia el **Phone number ID** → `WA_PHONE_NUMBER_ID`.
3. Business Settings → System Users → crea uno con rol Admin → Generate token con permisos `whatsapp_business_messaging` y `whatsapp_business_management`, sin expiración → `WA_TOKEN`.
4. App Settings → Basic → **App Secret** → `META_APP_SECRET`.
5. WhatsApp → Configuration → Webhook: URL `https://TU-DOMINIO/webhook/meta`, Verify token = `WA_VERIFY_TOKEN`. Suscribe el campo **messages**.

### 2. Instagram y Messenger
1. En la misma app → agregar producto **Messenger**. Conecta la página de Facebook de Resuelto (que tiene vinculada la cuenta profesional de Instagram).
2. Genera el **Page Access Token** → `PAGE_ACCESS_TOKEN`. El ID de la cuenta de IG → `IG_ACCOUNT_ID`.
3. Webhooks: para **Instagram** suscribe `messages` y `messaging_postbacks`; para **Page (Messenger)** igual. Misma URL `/webhook/meta`.
4. Instagram → Settings → Privacy → Messages → permitir acceso a la API de mensajería.

### 3. Google Calendar (agenda de cada plomero)
1. Google Cloud → proyecto → habilitar **Google Calendar API** → crear **cuenta de servicio** → clave JSON → pegar el JSON en una línea en `GOOGLE_SERVICE_ACCOUNT_JSON`.
2. Crea un calendario por plomero en el Google Calendar de Resuelto. Compártelo con el email de la cuenta de servicio con permiso **Hacer cambios en eventos**.
3. Pon el **ID del calendario** en `data/territorios.json` en el plomero correspondiente. El plomero lo ve en su celular (le compartes el calendario a su Gmail con permiso de solo lectura).

### 4. Cobros
- **Stripe** (tarjeta): `STRIPE_SECRET_KEY`. Webhook a `/webhook/stripe` con el evento `checkout.session.completed` → `STRIPE_WEBHOOK_SECRET`. Al pagar, el trabajo pasa a "cobrado" y el cliente recibe la confirmación con la garantía.
- **ATH Móvil Business**: no tiene API pública de links; el agente da el handle y la referencia (`ATH_MOVIL_BUSINESS`). El Coordinador confirma el pago y marca el trabajo desde el CRM.

### 5. CRM (GoHighLevel)
Settings → Private Integrations → token con permisos de contactos, oportunidades y notas → `GHL_TOKEN`. `GHL_LOCATION_ID` de la sub-cuenta de Resuelto. Crea el pipeline "Trabajos" con etapas Agendado → Completado → Cobrado → Reseña y pon los IDs.

### 6. Audios
Claude lee fotos y PDFs directamente. Para notas de voz se usa Whisper (OpenAI): `OPENAI_API_KEY`. Sin la clave, el agente le pide al cliente que escriba.

### 7. Widget en las landings
En `index.html` y `plomeros/index.html`, antes de `</body>`:
```html
<script src="https://agente.resueltopr.com/widget.js" defer></script>
```
Pon el dominio de las landings en `CORS_ORIGENES`.

## Desplegar

Railway, proyecto `resuelto` · servicio `agente` (`Dockerfile` + `railway.toml`, healthcheck `/health`,
volumen en `/app/data/estado` para que el estado sobreviva a los deploys). Desde esta carpeta:

```bash
npx @railway/cli up --detach          # build + deploy
npx @railway/cli logs                 # logs del servicio
npx @railway/cli variables --set "X=Y"  # variables (secretos: mejor desde el dashboard)
```

Dominio actual `https://agente-production-684f.up.railway.app` (`URL_PUBLICA`); `agente.resueltopr.com`
cuando se quiera (CNAME en Netlify DNS + `railway domain`). Un solo proceso aguanta cientos de
conversaciones al día; cuando haya 3+ plomeros, mueve `data/estado/*.json` a Postgres cambiando solo `almacen.ts`.

Tests: `npm run build && node --test tests/*.mjs` (canal Zernio + humanizador).

**Probar el cerebro real sin ensuciar producción:** una simulación con las variables de Railway (`railway run`) escribe de verdad en GHL y manda avisos por Telegram (pasó el 22/sep: 2 contactos falsos, etiquetados `prueba`). En el script de prueba, borra `GHL_TOKEN`, `TELEGRAM_BOT_TOKEN`, `COORDINADOR_WHATSAPP` y `ZERNIO_API_KEY` de `process.env` ANTES de importar `dist/`.

## Operar

- `GET /admin/estado` — trabajos, candidatos y lista de espera.
- Cuando el agente escala, avisa por Telegram (`COORDINADOR_TELEGRAM_CHAT_ID`) y/o WhatsApp (`COORDINADOR_WHATSAPP`) con un link `/admin/liberar/:id`. Mientras la conversación está escalada, el agente no responde (el humano contesta desde el inbox de Zernio). Al abrir el link, o pasadas `HUMANO_HORAS`, el agente retoma.
- Para cambiar precios: edita `data/menu.json` y reinicia. Para abrir un territorio: pon `"estado": "activo"` y agrega el plomero con su `calendar_id`.

## Cómo piensa el agente

El system prompt está en `src/prompt.ts`. Fija la voz (tuteo PR), las reglas de negocio (35/65 no se menciona al cliente; fee $19 siempre en la misma frase; el cliente le paga a Resuelto; materiales confirmados antes), los dos flujos (cliente / plomero candidato) y las condiciones de escalación. Usa `claude-sonnet-5` con esfuerzo `medium` (rápido y barato para chat); `MODELO=claude-opus-5` y `ESFUERZO=high` si quieres más finura en la conversación. El prompt se cachea, así que las conversaciones largas cuestan poco.

Los precios y la cobertura **nunca** salen de la cabeza del modelo: siempre pasan por `buscar_precio` y `verificar_cobertura`, que leen los JSON. Si cambias un precio en el JSON, el agente lo usa de inmediato.

---

# Publicar en redes

`src/publicar.ts` publica en **Instagram** (feed y stories) y en la **página de Facebook** usando la misma app de Meta que el agente de DMs. Un solo setup para las dos cosas.

```bash
npm run publicar -- --listar          # la cola y qué toca hoy
npm run publicar -- --previsualizar   # el texto exacto que se publicaría
npm run publicar -- --hoy             # publica lo que toca (y lo atrasado)
npm run publicar -- --id p01          # publica una pieza suelta
npm run publicar -- --hoy --seco      # simula, no llama a Meta
```

El calendario vive en `data/calendario-publicaciones.json`: fecha, destinos, imagen y texto. Cada pieza publicada queda marcada con su id de Meta, así que correr el comando dos veces no duplica nada.

**Las imágenes las descarga Meta por URL**, así que tienen que estar en un sitio público. Ya están copiadas en `kit/landing/flyers/`, o sea que se despliegan con la web y quedan en `https://resueltopr.com/flyers/…`. Si publicas la web en otro dominio, cambia `base_url` en el JSON o pon `BASE_PIEZAS` en el `.env`.

## Lo que hace falta en Meta (10 minutos, una sola vez)

En la **misma app** de developers.facebook.com que usas para WhatsApp:

1. La cuenta de Instagram tiene que ser **profesional** (Business o Creator) y estar **vinculada a la página de Facebook** de Resuelto. Se hace desde la app de Instagram: Configuración → Cuenta → Herramientas de negocio.
2. Agrega el producto **Instagram** a la app y conecta la página.
3. Genera el Page Access Token con estos permisos: `instagram_basic`, `instagram_content_publish`, `pages_manage_posts`, `pages_read_engagement` → `PAGE_ACCESS_TOKEN`.
4. Copia el **ID de la cuenta de Instagram** (`IG_ACCOUNT_ID`) y el **ID de la página** (`FB_PAGE_ID`). Los ves en Graph API Explorer con `me/accounts?fields=id,name,instagram_business_account`.

Como publicas en **tus propias cuentas**, no hace falta App Review: basta con que seas admin de la app y de la página.

## Límites que conviene saber

- Instagram: 50 publicaciones por cuenta cada 24 horas vía API. De sobra.
- Las **stories no aceptan stickers de link por API**. La story se publica, pero el sticker con el link se lo pones tú desde el celular (10 segundos).
- **TikTok no está**: su Content Posting API exige revisión y auditoría de la app. Por ahora TikTok se sube a mano.
- Los **carruseles y reels** también son posibles con la Graph API; si los quieres, se añaden a `publicar.ts` (`media_type: CAROUSEL` / `REELS` con `video_url`).

## Automatizarlo

Cuando esté conectado, se puede dejar corriendo con una tarea programada diaria que ejecute `npm run publicar -- --hoy` a las 9:00 AM. Así solo tienes que mantener el JSON del calendario.

---

# Portal de proveedores y despacho en tiempo real

Cuando un trabajo de plomería se agenda o un proyecto se cierra (contrato del cliente + depósito), el sistema crea una **oferta** y la anuncia por WhatsApp a todos los proveedores elegibles: misma categoría y mismo territorio. **El primero que acepta se lo lleva.** Acepta respondiendo `ACEPTO OF-0001` por WhatsApp o desde el portal. Al aceptar recibe los datos del cliente y su **orden de trabajo para firmar**. Si nadie acepta en el tiempo límite (30 min plomería, 4 h proyectos), se avisa al Coordinador para asignarlo a mano.

- **Proveedores**: `data/proveedores.json` (plomeros y altas manuales) + contratistas en estado `verified`/`preferido` del almacén, automáticamente.
- **Portal**: `GET /proveedores?p=<id>&k=<firma>`. El enlace es un enlace mágico firmado (sin contraseñas) que va en cada alerta de WhatsApp. Muestra ofertas disponibles con cuenta regresiva, botón "Aceptar", y sus trabajos con el estado del contrato.
- **Despacho**: `src/despacho.ts`. Ofertas en `data/estado/ofertas.json`. Timers en memoria que se reanudan al arrancar.
- **Contrato por trabajo**: `src/contratos.ts` genera la orden con marca (partes, alcance, pago o hitos, reglas, garantía, abandono). El abogado fija el texto definitivo.
- **Firma**: `src/integraciones/docusign.ts` (JWT Grant, sobre con el HTML, firma embebida desde el portal, webhook Connect en `/webhook/docusign`). **Sin credenciales funciona en modo simulado**: guarda el contrato en `data/estado/contratos/` y lo marca pendiente. Alternativa gratis ya incluida en GoHighLevel: Documents & Contracts con e-firma; si prefieres no pagar DocuSign, se cambia en un solo archivo.
- **Admin**: `GET /admin/ofertas` (todas + proveedores) · `POST /admin/ofertas/:id/asignar {proveedorId}` (a mano) · `POST /admin/proyectos/:id/cerrar {pagoContratista, precio, hitos, resumen, inicio}` (cierre de proyecto → oferta a contratistas; lo llamará la app del cotizador).

Prueba simulada verificada: oferta → aviso a Luis → Luis acepta → segundo intento rechazado ("Ya es tuyo") → trabajo asignado → contrato generado.

## La app en el celular (PWA + push)

El portal `/proveedores` **es la app**: se instala en la pantalla de inicio (Android y iPhone) y recibe **notificaciones push** cuando sale un trabajo en la zona del proveedor. Tocar la notificación abre la oferta; un toque más y la acepta.

- `portal/manifest.webmanifest` + `portal/sw.js` (service worker: recibe la push, abre la oferta al tocarla, cache mínimo).
- `src/push.ts`: suscripciones por proveedor (`data/estado/push.json`) y envío con Web Push (VAPID). Sin claves → modo simulado.
- Claves: `npx web-push generate-vapid-keys` → `VAPID_PUBLIC`, `VAPID_PRIVATE` en el `.env`.
- iPhone: la push solo funciona con la app **añadida a la pantalla de inicio** (iOS 16.4+); la app se lo explica al usuario. Por eso la alerta de WhatsApp se manda siempre en paralelo: es la red de seguridad.
- Cuando haga falta estar en App Store / Play Store: se envuelve esta misma PWA con **Capacitor** (el estándar de Elvin: PWA + Capacitor, nunca React Native) y la push pasa por APNs/FCM sin reescribir nada.

**Demo local:** `.claude/launch.json` → `resuelto-agente` (puerto 3110). Datos de muestra en `data/estado/ofertas.json` (marcados [DEMO]). Enlace de Luis: `http://localhost:3110/proveedores?p=luis&k=<firma>` (la firma sale de `PORTAL_SECRETO`; en dev, `464b4c216800c7619dc0647b`). Para limpiar la demo: borra `data/estado/ofertas.json`.

---

# App del cotizador (tablet) · Fase 5

`GET /cotizar?c=<cotizador>&k=<firma>` (enlace mágico por cotizador; los enlaces salen en `GET /admin/cotizadores`). Corre en el mismo Express.

**Flujo en la propiedad:** elige la visita → fotos y notas → **"Que la IA proponga el alcance"** (Claude mira las fotos y sugiere partidas del Cost Book con cantidades y alertas) → ajusta partidas y cantidades → **el motor calcula** costo, precio recomendado, mínimo sin aprobación y piso → slider de precio acotado a la política → "Generar propuesta" (documento con marca al cliente por WhatsApp; si el precio está bajo el mínimo, pide aprobación al Coordinador con un enlace firmado) → "El cliente aceptó" (contrato de mejoras al hogar + link de depósito del 40%) → **depósito recibido** (webhook de Stripe con `metadata.proyectoId`, o confirmación manual para ATH Móvil/transferencia) → **CERRADO** → sale la oferta a los contratistas verificados y el Coordinador recibe el resumen con la comisión del cotizador (2.5%).

**Control de precio, técnico y no escrito:** el cotizador nunca teclea un precio final libre; mueve un slider entre el piso del 20% y el recomendado +15%. Bajo el mínimo del tramo, la propuesta se guarda en `aprobacion-pendiente` y no se puede cerrar. Bajo el piso, el motor bloquea.

**El Cost Book se construye solo:** cada costo que el cotizador teclea en una partida no validada se guarda como muestra (`POST /api/cotizador/muestra`). Con 3 muestras dentro del 25% de desviación, la partida queda validada con la mediana y el costo aparece precargado la próxima vez.

**Documentos del cliente:** `/propuesta/:id?k=` y `/propuesta/:id/contrato?k=` (enlaces firmados, sin login). El cliente nunca ve costos unitarios ni márgenes. El contrato lleva el número de registro DACO de Resuelto (`RESUELTO_DACO`) y sus cláusulas las fija el abogado.

**Prueba verificada (simulado):** contexto → calcular ($8,300 → $11,067 recomendado) → propuesta → aprobación por enlace → contrato + depósito $4,600 → depósito confirmado → CERRADO → oferta OF-0005 a contratistas (sin elegibles aún → aviso al Coordinador).

---

# QA + Recovery (Fase 8) y Tablero (Fase 7)

**Encuesta post-visita automática.** Cada 30 min el servidor busca propuestas de hace 24 h+ sin cerrar y el agente abre por WhatsApp la encuesta de QA (las 13 preguntas de Elvin agrupadas en 3–4 mensajes, tono de QA: "no soy el cotizador que te visitó"). Las respuestas se guardan con `registrar_encuesta`. **Nunca ofrece descuentos**: si hay señal (precio, comparando, financiamiento, fecha, aún decidiendo) el proyecto entra a la **cola de Recovery** para que un humano lo llame en 24 h; si hay problema con el representante, alerta al Coordinador. `src/encuestas.ts`.

- `GET /admin/recovery` cola ordenada por precio · `POST /admin/recovery/:id/llamada {resultado, nota}` registra la llamada · `POST /admin/encuestas/revisar` fuerza el barrido.
- **Comisión**: 2.5% al cotizador, o **2% + 0.5% a Recovery** si el proyecto se marcó `recuperado` antes de cerrar. Sale en el aviso de cierre.
- `ENCUESTA_HORAS` (24 por defecto) en `.env`.

**Tablero** `GET /admin/dashboard`: embudo completo, por cotizador (mes / total): visitas, realizadas, propuestas, cierres, close rate, GMV, ticket, depósitos, margen, aprobaciones pedidas, promedios de la encuesta, puntualidad, recovery/recuperados; por categoría; motivos de pérdida; cola de Recovery. `src/dashboard.ts`. Nada se reporta a mano.

**Prueba verificada con la API real:** propuesta de 30 h → cron abre encuesta → cliente responde en 2 mensajes → agente pregunta lo que falta, registra (profesional 5/5, comparando con $11,900, quiere financiamiento), NO ofrece descuento, avisa que Recovery llama mañana → cola de Recovery → llamada registrada como recuperado → comisión partida.
