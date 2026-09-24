---
name: bori-backend-real
description: Bori (heybori.ai) — dónde vive, cómo se trabaja y las trampas que ya rompieron producción
metadata:
  node_type: memory
  type: project
  originSessionId: f903cebd-d0d1-42f4-8fcd-b06da4b4ddc6
  modified: 2026-09-01T02:22:10.931Z
---

**Bori / "Hey Bori"** = SaaS de creativos con IA + publicación en Meta Ads. **En vivo
con clientes pagando.** Producción: **www.heybori.ai**.

- Código: `~/Documents/Claude/Projects/ai borinquen plataforma/` — **Express** de un solo
  archivo (`server.js`) + SPA de un solo archivo (`public/index.html`) con el **JS inline**,
  más ~30 módulos puros con tests propios.
- Deploy: **push a `main` → Railway** (~2 min, no avisa cuándo terminó).
- Datos Postgres · archivos Cloudflare R2 (`bori-media`) · cobros **Stripe LIVE**.
- ⚠️ NO es `app/borinquen/` del repo AGENTE CONTENIDO (esa es [[bori-superplataforma]]).

**Antes de tocar el repo, leer `TRASPASO.md` en su raíz** — tiene el mapa completo.

**Las tres trampas que ya rompieron producción:**
1. **JS inline del front**: un error de sintaxis mata la app entera (pasó, 2.5h caída).
   `test/frontend.test.js` lo ataja. Correr `npm test` siempre antes de push.
2. **Postgres tiene TRES lugares** para cada campo nuevo: SCHEMA + `migrate()` en `db.js`,
   `rowToUser` y el mapa `COL` en `store.pg.js`. Faltar uno = el dato se pierde en silencio.
3. **Cobrar antes de entregar regala créditos** cuando algo falla. Patrón correcto:
   `chequeos()` → `puedePagar()` → trabajo → `cobrar()`. Si mueves un cobro, revisa que el
   `catch` no tenga un `refund` (se quitaron 11 por eso).

**Trampa 4 (15/sep/2026):** el `SCHEMA` de db.js corre ANTES que `migrate()`; un índice sobre una columna que solo agrega la migración tumba el arranque en prod (pasó: 502 unos minutos). Columnas nuevas + sus índices van en `migrate()` tras el ALTER. Tras tocar db.js, verificar `/api/status`=200 antes de dar por bueno el deploy.

**Trampa 5 (16/sep/2026):** el bucket R2 `bori-media` NO tiene CORS → la subida directa de creativos (PUT prefirmado desde www.heybori.ai) falla para todos; el front cae a subida por servidor (≤10 MB). El token de R2 en Railway es de objetos y no puede poner la regla (`Access Denied`). **Pendiente de Elvin:** en Cloudflare → R2 → bori-media → Settings → CORS: origen `https://www.heybori.ai`, métodos PUT/GET/HEAD, headers `*`. Luego `POST /api/admin/r2-cors` confirma.

**Cómo se trabaja aquí:** cada arreglo con su test (escrito para fallar si alguien revierte
el arreglo); comentarios que explican **por qué**, con el caso real que lo motivó; verificar
contra el sistema vivo (curl/DB/logs) antes de afirmar nada. Nunca se implementó un endpoint
que reembolse dinero — eso se hace en Stripe.

**Estado 27/ago/2026:** 57 usuarios · 12 pagando (7 Pro $99, 5 Starter $39) · 24 cortesías ·
**0 cancelaciones** · MRR ~$810 · 1013 tests. Meta App Review **aprobada** (5 permisos,
21/ago) → ver [[hey-bori-meta-app]]. Stripe live con Customer Portal activo.

**Pendiente de Elvin:** borrar `OWNER_BOOTSTRAP_PASSWORD` de Railway; configurar correo
transaccional (hoy "olvidé mi contraseña" no funciona). **Sin construir:** Google/TikTok Ads
(el toggle dice "llega pronto"), optimización automática 24/7.

**13/sep/2026:** los números de planes salen de `planes.js` (`/api/plans` + landing rellenada
por el server); nunca escribirlos a mano en HTML. **Prueba gratis de 7 días construida pero
APAGADA** (`prueba.js`): Elvin la activa cuando quiera poniendo `PRUEBA_7D_TOKEN` en Railway y
usando el enlace `/app?signup=1&plan=Starter&prueba=<token>` solo en el anuncio; nadie más la ve.

Voz del producto: tuteo de Puerto Rico, ver [[voz-espanol-pr-tuteo]].

**Editor de video, uso real (13/sep/2026):** de 17 clientes que pagan, solo 2 lo probaron (una vez cada uno, jul/ago), ninguno volvió — ver `/api/admin/uso-usuarios`. Se mejoró el motor (ritmo sobre el habla en vez de reloj fijo cada 8s, keyword pop dorado en subtítulos, edicion.js commit 1a185b5) pero el problema puede ser de descubribilidad/onboarding, no solo de calidad del resultado — investigar antes de invertir más ahí.

**Monitor de fallos (16/sep/2026):** `fallos.js` + tabla `fallos`. Todo error (navegador vía `reportarFallo`/window.onerror → `POST /api/fallos`; servidor vía `registrarFallo`) queda guardado con huella, usuario y estado. El dueño lo ve en **Equipo → Fallos** y marca "arreglado" con nota: ese panel es el récord oficial de bugs → **cuando arregles algo reportado por un cliente, márcalo ahí (o anótalo con "+ Anotar fallo" si vino por WhatsApp)**. Avisos a Slack requieren `ALERTA_WEBHOOK_URL` en Railway (el 16/sep NO estaba puesta: panel dice "apagados"). Regresiones (huella arreglada que vuelve) avisan aparte.

**Railway (19/sep/2026):** el servicio de heybori.ai es proyecto `believable-amazement` → servicio `bori` (NO `aiborinquen-plataforma/app`, ese es otro producto). CLI autenticado; variables con `npx @railway/cli variables --service bori --set K=V --skip-deploys` y `redeploy --service bori --yes`.

**19/sep/2026 — "Editar con IA" ahora lo hace Cortex:** `render-worker.js` delega a https://edit.heybori.ai (`/api/v1/edit`,
`X-Cortex-Key`), sin HyperFrames/Chrome; cobro/refund/Baúl intactos; tope 3 min; modal simplificado. Vars en Railway
(proyecto **believable-amazement**, servicio `bori` = www.heybori.ai; NO `aiborinquen-plataforma`, ese es app.aiborinquen.co):
`CORTEX_URL`, `CORTEX_API_KEY`. Sin ellas el botón queda en demo. Ver TRASPASO.md → render-worker.js.
⚠️ Trampa 6: otra sesión de Claude que trabajaba en el mismo repo hizo commit+push de mis archivos a medio hacer
(a7071af, 19/sep 17:02) → cuando hay varias sesiones en el repo de Bori, commitear rápido lo propio o trabajar en rama.
`test/infra.test.js` falla en local por red (archivo_vacio) también en commits anteriores: no es regresión.
