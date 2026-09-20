# Auditorías interactivas (quiz funnels) · ClickFunnels 2.0

Dos "diagnósticos" que replican la arquitectura de la auditoría de Content Capital
(captura de lead ANTES de la primera pregunta → 4 pasos temáticos, 9 preguntas +
1 paso condicional de 2 → pantalla de carga → resultado con números del usuario,
plan borroneado con candado y CTA a WhatsApp + barra sticky). Copy 100% en tuteo PR.

| Marca | Archivo local | Funnel CF 2.0 | Página | Preview |
|---|---|---|---|---|
| Level Up Media · "Diagnóstico de Crecimiento" | `level-up/index.html` | `NzxGPd` · path `/diagnostico-crecimiento` | `/crecimiento` (page `qDdlPK`) | https://myworkspace2d96f.myclickfunnels.com/diagnostico-crecimiento?preview=true |
| AI Borinquen · "Diagnóstico de Automatización con IA" | `ai-borinquen/index.html` | `NEWQxr` · path `/diagnostico-automatizacion` | `/automatizacion` (page `mkVGop`) | https://myworkspace2d96f.myclickfunnels.com/diagnostico-automatizacion?preview=true |
| 1000X · "Diagnóstico de Trader" | `1000x/index.html` | — (sin crear) | — | http://localhost:8794/1000x/ |

Workspace: `myworkspace2d96f.myclickfunnels.com`, site `jQQnLZ`. Ambos funnels están en
**test mode, sin publicar** (Elvin publica y asigna dominio, p. ej. class.levelupmediapr.net).

## Cómo se actualiza el código en ClickFunnels

1. Editar `<marca>/index.html` (es el archivo fuente, previsualizable con
   `python3 -m http.server 8794 -d demos/auditorias` → http://localhost:8794/level-up/).
2. Regenerar el snippet: todo lo que está entre `<!-- CF:INICIO -->` y `<!-- CF:FIN -->`
   ```bash
   awk '/<!-- CF:INICIO -->/{f=1;next}/<!-- CF:FIN -->/{f=0}f' level-up/index.html > level-up/cf-snippet.html
   LANG=en_US.UTF-8 pbcopy < level-up/cf-snippet.html      # OJO: sin LANG UTF-8 pbcopy rompe los acentos
   ```
3. En CF: Editor de la página → elemento "Custom JS/HTML" → ⋮ → Settings → **Open Code Editor**
   → Cmd+A, Cmd+V → cerrar → **Save**. (El editor es CodeMirror 5 dentro de un iframe; pegar
   por portapapeles es exacto, escribir carácter por carácter agrega auto-indentación.)

El snippet ya incluye el `<link>` de Google Fonts y un script que quita el ancho/padding
de los contenedores de CF (`.lu-audit-bleed` / `.ab-audit-bleed`) para que la página sea
full-bleed oscura.

## Configuración (bloque `CONFIG` al inicio del `<script>` de cada archivo)

- `whatsapp`: número destino del CTA sin `+` (LU `17874092812`, AIB `19393040491`). El
  mensaje prellenado lleva nombre, negocio, cuello/oportunidad principal, brecha o nivel y score.
- `endpoint` + `marcaId`: URL del endpoint que escribe en **Pipedrive**
  (`https://content-os-chi-seven.vercel.app/api/auditoria`, código en
  `app/api/auditoria/route.ts`). Se llama 2 veces: al capturar el lead (evento `lead`) y al
  terminar (evento `resultado`, con el `dealId` que devolvió la primera llamada).
- `umbralMeta` (LU: factura ≥ $10K muestra el paso "Tu meta") / `umbralEquipo` (AIB: equipo ≥ 2
  muestra "Tu operación").
- `loaderMs`: duración de la pantalla de carga.

## Pipedrive (conectado el 12/sep/2026)

`app/api/auditoria/route.ts` (público, exento del login en `proxy.ts`) usa los tokens
`PIPEDRIVE_LEVELUP_TOKEN` / `PIPEDRIVE_AIB_TOKEN` (ya en Vercel) y por cada lead:

1. Busca la persona por email; si no existe la crea (nombre, email, WhatsApp) con la
   organización = nombre del negocio.
2. Crea el deal "Diagnóstico de … — {negocio}" en el stage de NEW LEAD:
   - Level Up (cuenta levelupmedia2): pipeline 12 **LUM DIAGNÓSTICO DE CRECIMIENTO** →
     stage 122 "NEW LEAD / DIAGNÓSTICO" (cambiar con env `PIPEDRIVE_LEVELUP_STAGE_DIAGNOSTICO`).
   - AI Borinquen (cuenta aiborinquen, separada): pipeline 3 **DIAGNÓSTICO DE AUTOMATIZACIÓN** →
     stage 33 "NEW LEAD / DIAGNÓSTICO" (env `PIPEDRIVE_AIB_STAGE_DIAGNOSTICO`).
   Ambos pipelines tienen los mismos stages que los demás (CALLED 1X-3X, APPOINTMENT SET,
   NO SHOW, FOLLOW UP, CLOSED, DON'T QUALIFIED); los creé el 12/sep/2026.
3. Nota "empezó el diagnóstico" con WhatsApp/email/UTMs. Si abandona, igual queda.
4. Al terminar, segunda nota (fijada al deal) con el diagnóstico completo: cuello u
   oportunidad principal, score, brecha/clientes/leads (LU) o perdidas/ingresos en
   riesgo/horas/procesos (AIB) y todas las respuestas.

Si vuelve a hacer el diagnóstico con el mismo email, reutiliza el deal abierto (no duplica).
Los eventos `lu:progreso`/`lu:resultado` y hooks `window.LU_AUDIT.*` siguen disponibles.

## Logo de Level Up

El logo real (cohete + barras + LEVEL UP MEDIA) se limpió a partir del PNG de 1600 px de
`levelupmedia.info` (bordes dentados → suavizados, fondo blanco → transparente, mismo diseño):

- `level-up/assets/level-up-logo-dark@full.png` — versión para fondo oscuro (negro → blanco cálido, dorado igual). Es la que usa el funnel.
- `level-up/assets/level-up-logo-light@full.png` — versión original (negro) para fondos claros.
- Servidas optimizadas desde el Content OS: `public/marcas/level-up-logo-dark.png` (header, 96 px de alto),
  `level-up-icon-dark.png` (barra sticky) y `level-up-logo-light.png`. Vercel las sirve sin login
  (el proxy exime `.png`).

## Level Up: dominio y CTA

Funnel `NzxGPd` con dominio **class.levelupmediapr.net** → URL pública (cuando se publique):
`https://class.levelupmediapr.net/diagnostico-crecimiento`. El CTA del resultado va a WhatsApp
(`CONFIG.siguiente` vacío). Si algún día se quiere un paso 2 (video/agenda), poner la ruta en
`CONFIG.siguiente` y el CTA pasa a ese paso con `?nombre&cuello&score&brecha&deal`.
El bloque de prueba social usa casos reales del vault (Tinos, Coralis, RK Automatic, Dr. Bryan Vega),
sin citas inventadas.

## Logo y pie de AI Borinquen

Logo real (coquí) tomado del PNG de `aiborinquen.co` (GHL), limpiado igual que el de Level Up:
fondo transparente, texto negro → claro, tagline ilegible recortada. Fuente en
`ai-borinquen/assets/ai-borinquen-logo-dark@full.png`; servido en
`public/marcas/ai-borinquen-logo-dark.png`. Ambos quizzes tienen el mismo pie:
logo + etiqueta + línea de marca a la izquierda, "Contacto" (WhatsApp + email) a la derecha.
Contactos: LU wa.me/17874092812 · info@levelupmediapr.net; AIB wa.me/19393040491 · aiborinquen@gmail.com.

## Tráfico de Instagram, pixel y badge (Level Up)

- El funnel ya responde público en `https://class.levelupmediapr.net/diagnostico-crecimiento`
  (el "Test" de la lista de CF es solo el modo de pagos). Badge "Powered by ClickFunnels" oculto
  desde Funnel Settings.
- **Pixel de Meta dedicado**: conjunto de datos **Level Up Media PR** (ID `27706808412306198`),
  del portafolio comercial LEVEL UP MEDIA PR / cuenta publicitaria Level Up Official 2025
  (2010206776851), que es de donde salen los anuncios. Estaba sin integraciones ni eventos.
  NO se usa el de Frankie (Jay Pixel 943949588521782) ni el general "Funnel Level Up Media Pixel"
  (885023842490900, 3.3K eventos/28 días, lo usan otros funnels). Código base en Funnel Settings → Head Code. El quiz dispara
  `Lead` (captura), `DiagnosticoCompletado` (custom: cuello, score, brecha) y `Contact` (clic a WhatsApp).
- Link para la bio y copy de historias/reel en `vault/proyectos/level-up/instagram-diagnostico.md`.

## Scoring

- **Level Up** (0–100, 6 factores): leads, inversión, conversión (cierres/leads), facturación,
  brecha meta/actual, capacidad. Cálculos: brecha = meta − facturación; clientes extra =
  brecha / ticket; leads necesarios = clientes extra / conversión. Cuello detectado por reglas
  (sin fuente/inversión → "Sin sistema"; leads < 50 → "Falta de leads"; conversión < 10% →
  "Baja conversión"; leads ≥ 120 y conv < 20% → "Seguimiento"; orgánico/referidos sin
  inversión → "Inconsistente"; score ≥ 70 → "Listo para escalar").
- **AI Borinquen** (Nivel de automatización 0–100): tiempo de respuesta, quién hace
  seguimiento, horas repetitivas, llamadas perdidas, canal, carga (volumen vs. manual).
  Oportunidades perdidas = leads × penalización por respuesta + por seguimiento + llamadas
  perdidas; ingresos en riesgo = perdidas × (facturación / leads); horas recuperables = horas
  semana × 4.3; procesos automatizables = reglas disparadas (respuesta, seguimiento, agenda,
  llamadas, admin, CRM).

## AI Borinquen en vivo
- URL pública: https://auditoria.aiborinquen.co/automatizacion (dominio CF YDXgQD, funnel NEWQxr).
- Snippet vigente: hash 2783321725 (69923 unidades UTF-16).

## Pixel de Meta (AI Borinquen)

- Conjunto de datos limpio **AI Borinquen Auditoría** (ID `2203459307257468`), creado el 13/sep/2026 en el
  negocio "AI Borinquen Agency Ads" (492090353646087) y conectado a la cuenta publicitaria AI BORINQUEN
  (1114829350772277). No se tocan PIXEL NASBU, "ai borinquen voz" ni los "Event Data" vacíos.
- Código base en Funnel Settings → Head Code del funnel `NEWQxr` (copia en `ai-borinquen/meta-pixel-head.html`).
- El quiz dispara `Lead` (captura), `AuditoriaCompletada` (custom: oportunidad, nivel, perdidas, procesos) y
  `Contact` (clic a WhatsApp). Verificado en vivo el 13/sep: PageView + los 3 eventos llegan con ese ID.

## Acento coral (AIB, 13/sep/2026)
Elvin pidió un detalle que diferencie del negro+verde típico sin robarse el show. Token `--warm: #ff8a5b` (coral
flamboyán). Regla: **verde = solución y botones; coral = lo que se escapa** (pérdidas en el diagnóstico y KPIs,
badge "Principal oportunidad detectada", contador n/N, punta de la barra de progreso, estrellas del testimonio,
punto del bullet y del pie, icono de "Tu camino recomendado", brillo secundario del hero). Datos de entrada en
blanco (`b.fact`), nombre del negocio en verde (`b.ok`). En el hero (13/sep, segunda pasada porque "apenas se veía"): etiqueta coral "Auditoría de IA · Puerto Rico", "1 minuto" en coral en H1 y sub2, línea superior teal→verde→coral en la tarjeta del formulario, checkbox coral y brillo coral grande arriba a la derecha. Snippet vigente hash 3298644263.

## Shadow Operator · Auditoría de Negocio Digital (13/sep/2026)

- Fuente: `demos/auditorias/shadow-operator/index.html`. Funnel CF `NzxGvR`, página `GvxzRr`, path `/negocio-digital`
  (funnel path `/auditoria-shadow`). URL: https://myworkspace2d96f.myclickfunnels.com/negocio-digital (sin dominio propio aún).
  Badge oculto. Snippet vigente hash 361298771.
- **Marca (no había branding):** carbón neutro `#0f1115` + papel `#f2efe8` + marcador amarillo `#ffe14d` (acento, botones,
  `<mark>` en el H1) + tinta azul bolígrafo `#5b8cff` (eyebrow, barras de fundamentos, "$10K al mes"). Fuentes Bricolage
  Grotesque (títulos), Inter, JetBrains Mono, Caveat (nota manuscrita = guiño al carrusel "libreta"). Hero con papel rayado.
- **Modelo:** los 4 fundamentos de Elvin (nicho, oferta, contenido, estrategia) puntuados 0-100; el más bajo (o el declarado
  si está a ≤12 puntos) es el "fundamento flojo". Matemática de $10K: clientes = 10K/ticket; conversaciones = clientes/tasa de
  cierre (1 de 5 si no vende); "conversaciones que te faltan". Paso condicional "Tu sistema" solo si ya vende (≥ $500/mes).
  Ticket opcional (asume $1,500). Captura pide @instagram en vez de empresa.
- **CTA:** DM de Instagram (`ig.me/m/shadowoperator.elvin`) con palabra clave PLAN, porque el embudo de Shadow cierra por DM.
  `CONFIG.whatsapp` vacío; si se llena, el CTA pasa a WhatsApp con mensaje prellenado.
- **Pipedrive:** cuenta de Level Up, pipeline 14 "SHADOW · AUDITORÍA NEGOCIO DIGITAL", stage 136 (NEW LEAD / AUDITORÍA →
  DM ENVIADO → RESPONDIÓ → LLAMADA AGENDADA → NO SHOW → FOLLOW UP → COMUNIDAD $55 → CONSULTORÍA CERRADA → NO CALIFICA).
  `marcaId: 'shadow-operator'` en `app/api/auditoria/route.ts`. Verificado de punta a punta el 13/sep.
- Sin pixel de Meta aún (crear uno en el negocio que use Shadow cuando corra pauta).

## 1000X · Diagnóstico de Trader (20/sep/2026)

- Fuente: `demos/auditorias/1000x/index.html` (id raíz `#x-audit`, bleed `.x-audit-bleed`, global `window.X_AUDIT`).
  Preview: http://localhost:8794/1000x/. **Sin funnel en CF todavía** (crear con el flujo de arriba; el snippet está en
  `1000x/cf-snippet.html`).
- **Marca:** la de 1000X (`demos/richy-elvin-trading/brand/`): VOID `#050807`, CHARCOAL `#0A0F0C`, PHOSPHOR `#00FF87`
  solo como acento, GHOST `#E6F2EB`, STATIC `#5C6662`; IBM Plex Mono (títulos, números, eyebrows con `>`), IBM Plex Sans
  (cuerpo); esquinas 6px; rejilla + scanlines en el hero; tarjetas con barra de terminal; el mark SVG en el footer.
  Nunca caras. Nunca prometer retornos (disclaimers en optin, legal y footer; la matemática dice "ejemplo hipotético").
- **Modelo:** 4 pilares (estructura, ejecución, riesgo, sistema) 0-100; el más bajo (o el declarado si está a ≤12 puntos y
  <75) es el "pilar flojo". Perfiles: `SIN_MAPA` (estructura), `IMPULSIVO` (ejecución), `APOSTADOR` (riesgo),
  `INTERMITENTE` (sistema), `RECLUTA` (nunca operó), `OPERADOR` (score ≥ 80, texto y plan de escalar). Matemática con la
  estrategia de la casa (1:2, break even a 1R): riesgo por trade en $ (capital × %), una mala semana (5 stops), acierto
  mínimo con 1:2 (33%), drawdown tras 10 stops seguidos (compuesto), expectativa a 45% de acierto (+0.35R, hipotético).
  Paso condicional "Tu sistema" (journal + horas de pantalla) solo si lleva ≥ 6 meses. Cuenta de fondeo = $50K para el cálculo.
- **CTA:** `CONFIG.calendly` (el embudo de 1000X cierra por llamada). Si está vacío y hay `CONFIG.whatsapp`, pasa a
  WhatsApp con mensaje prellenado (perfil, score, pilar, riesgo/trade). **Ambos vacíos por ahora → Elvin decide.**
  `CONFIG.instagram` muestra el @ en el footer si se llena. Pixel: `Lead` al capturar, `DiagnosticoCompletado` (custom) y
  `Schedule` al clic del CTA (sin pixel instalado aún).
- **Pipedrive:** `marcaId: '1000x'`; usa `PIPEDRIVE_1000X_TOKEN` + `PIPEDRIVE_1000X_STAGE_DIAGNOSTICO` (cuenta propia de
  Richy & Elvin Trading, no la de LU). Sin token el endpoint responde 503 y el quiz sigue igual. ActiveCampaign solo si
  existe `AC_LISTA_1000X`.
