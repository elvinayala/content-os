---
name: meta-ads-agente
description: Agente de Meta Ads del portafolio (18/sep/2026) — motor Marketing API con token de usuario del sistema, IDs de cuentas/pixeles por marca, reglas de Elvin para estructurar campañas (1 creativo por conjunto, ≥$10/día, tope $120, muchos públicos) y estado de la campaña LU Diagnóstico
metadata:
  type: project
---

Elvin pidió (18/sep/2026) un **agente de anuncios de Meta para todo su portafolio**. Se construyó
`/meta-ads` + `scripts/meta-ads.mjs` + `scripts/meta-ads/core.mjs` (builders portados de Bori
`meta.js`, Graph v25.0, todo PAUSED, ABO) + `data/meta-ads/portafolio.json`.

**Motor elegido:** Marketing API con **token de usuario del sistema** (Business Settings → Usuarios
del sistema → token con la app Hey Bori 27337036735966798, permisos ads_management/ads_read/
business_management/pages_show_list/pages_read_engagement). `META_ADS_TOKEN` (negocio Level Up
Media 100872629602980) y `META_ADS_TOKEN_AIB` (negocio 492090353646087) en `.env.local`. Chrome
solo para verificar/subir videos. Yo nunca genero ni pego tokens.

**IDs:** LU cuenta Level Up Official 2025 `2010206776851`, pixel limpio Level Up Media PR
`27706808412306198` (NO 943949588521782 ni 885023842490900). AIB cuenta `1114829350772277`,
pixel `2203459307257468`, campaña Juliana borrador `120248911627010250`. Shadow y Resuelto sin
cuenta/pixel documentados.

**Cómo quiere Elvin las campañas (textual, 18/sep):** Leads por pixel; "cada conjunto un creativo
con mínimo 10 diario"; testear 3 creativos × MUCHOS públicos (visitantes web, agendaron-no-compraron,
solo agendaron, lista clientes alto valor, similares de esas, de video, de interacción FB/IG);
"tenemos públicos de más, verifícalos" (reusar antes que crear); foco Instagram; nicho nuevo LU =
infoproductores/coaches/mentores/dueños de agencias y negocios digitales; empezar 3 conjuntos y
duplicar a otros públicos; **máximo $120/día en total**. Él tiene los videos: todo en borrador y
él los sube. "Quick Connects" en su dictado = *quiz funnel*.

**Inventario LU (18/sep, leído en Ads Manager):** 55 públicos personalizados + 22 similares, guardados en `data/meta-ads/publicos-level-up.json` y mapeados en `portafolio.json`. NO hay públicos de web/pixel ni listas de agendados; listas de clientes obsoletas. Chrome de Elvin (Browser 1) entra a Business Settings de Level Up Media sin 2FA; no había usuarios del sistema.

**Portafolio correcto de LU = LEVEL UP MEDIA PR (989015235153696)**, dueño de la cuenta Level Up Official 2025; pide 2FA. El portafolio "Level Up Media" (100872629602980) solo tiene la app Hey Bori y NO tiene cuentas publicitarias → el token de sistema hecho ahí (content-ads) no sirve; hay que crear usuario del sistema + agregar una app en LEVEL UP MEDIA PR. Campaña LU Diagnóstico montada a mano en borrador el 19/sep/2026 (campaña 52606426074997, 9 conjuntos $13, video marcador; Elvin sube videos y publica). Ads Manager 2026: sin ubicaciones manuales; Escape/Cerrar abre '¿Publicar borradores?' → siempre Cerrar.

**Regla de Elvin (19/sep/2026) para el DWY/quiz de coaches: mercado NUEVO — NO usar similares ni retargeting de la base vieja (doctores/negocios tradicionales); excluir engagers 365 FB/IG y listas de clientes; solo fríos (intereses negocio, Advantage+ puro, creadores de contenido). Los públicos propios del nicho se crean después con el pixel del quiz.**

**Campaña 2 (19/sep/2026): LU · DWY · DM Instagram · Ventas, id 52606443414397, borrador: objetivo Ventas → destino manual solo Instagram, 'maximizar conversaciones' (no conversiones: ManyChat nutre 2-3 días y agenda), ABO 2×$15, mismo público Advantage+ con exclusiones, plantilla rompehielos 'LU DWY · Rompehielos cuello de botella' (3 botones = cuello de botella → keyword ManyChat). Nota: vault/proyectos/level-up/campana-dwy-dm-instagram-meta.md.**

**Campaña 3 (19/sep/2026): LU · Follow Me · Tráfico a perfil IG, id 52606445694197, borrador: 5 conjuntos × $10, destino solo perfil IG, optimiza visitas al perfil; métrica personalizada existente 'costo por seguidor' (Matías) + 'Seguimientos de Instagram', preset de columnas 'Follow Me · $1 por seguidor' (10243910550241178); meta ≤$1/seguidor. Orden de Elvin: Follow Me primero → DM Instagram → quiz. Nota: vault/proyectos/level-up/campana-follow-me-meta.md.**

**Mauro (artista, 19/sep/2026), cuenta `503566678495233`, página Mauro PR, IG @_mauropr:** dos campañas de Tráfico en borrador, $25/día repartidos a mi criterio → Follow Me `120249301190310470` (FM-1/FM-2 × $7,50, destino solo perfil IG, meta ≤$1/seguidor) + Tráfico a YouTube `120249301216840470` (YT-1/YT-2 × $5, clics en el enlace a https://youtu.be/J9AxsDIkhOw, CTA "Ver más"). Solo reels existentes (18 y 17 sep) vía "Usar publicación existente"; FB posts siguen manuales. Esta cuenta tampoco tiene ubicaciones manuales; la página por defecto era "EDR Aluminum" → cambiar a Mauro PR en cada anuncio. **Regla Mauro: público joven, tope 35 años** (corregido a 18–35 el 20/sep tras publicarse con 18+). Truco UI: el tope de edad solo aparece al pasar a 'opciones de público original' y apagar 'Elegir el público de cada contenido del anuncio'. Nota: vault/proyectos/mauro/campanas-meta-follow-me-youtube.md.

**Columnas "costo por seguidor" (20/sep/2026):** la métrica personalizada es POR CUENTA (no se comparte): existe en LU (Matías), y la creé en Mauro y AIB (`Importe gastado ÷ Seguimientos de Instagram`, formato Divisa, acceso "todas las personas con acceso a la cuenta"). Preset de columnas en las 3 cuentas con el mismo orden: Entrega, Resultados, Costo por resultado, Alcance, **Seguimientos de Instagram, costo por seguidor**, Importe gastado, Presupuesto, Impresiones, Clics en el enlace, CTR, CPC. Nombres: LU "Follow Me · $1 por seguidor" (10243910550241178, reconstruido), Mauro "Tráfico · costo por seguidor" (10243922680544428), AIB "Tráfico · costo por seguidor" (10243922834868286). Truco UI: el drag-and-drop del diálogo no responde; para ordenar hay que quitar columnas y volver a marcarlas en el orden deseado (se agregan al final). Dato AIB: "advantage IA" 7,104 visitas a $0.02 pero solo 36 seguidores → $4.23/seguidor; visita barata ≠ seguidor barato.

**MOTOR POR API EN MARCHA (21/sep/2026).** Token = el largo del dueño conectado en Bori (levelupmediapr@gmail.com), copiado con `node scripts/meta-ads/token-desde-bori.mjs` — lo corre ELVIN (lee la DB de Bori por la URL pública de Railway y descifra con SECRETS_KEY); el clasificador de permisos me bloquea leer/escribir secretos de producción y a veces hasta correr el CLI, `git push` o `railway up`: cuando pase, darle el comando a Elvin con Run. Un solo token ve 72 cuentas (LU, AIB, Mauro act_503566678495233, Resuelto act_1564735818086768 y clientes); dura ~60 días (error 190 → re-correr el script). También está en Railway (`puente`, `nico`). `META_ADS_TOKEN_AIB` ya no existe. Plantillas probadas contra Meta (creé y borré campañas "API TEST"): `plantilla <marca> follow-me|trafico-url|dm-instagram|quiz` en ~10 s. Aprendizajes de la API: age_max no se acepta con Advantage+ (público original), VIEW_INSTAGRAM_PROFILE exige `link` (URL del perfil), reel existente = `source_instagram_media_id` + `instagram_user_id` (Mauro IG 17841404146064202), IG follows no salen en `actions` de insights (la columna de Ads Manager sí). Telegram: **Max** = bot propio del media buyer (PUENTE_BOT=max, servicio `max` creado en Railway el 21/sep con volumen y variables por referencia a `puente`; falta que Elvin cree el bot en BotFather y ponga TELEGRAM_BOT_TOKEN_MAX + `railway up --service max`); persona `max` en telegram-puente.mjs con permisos Read/Grep + `Bash(node scripts/meta-ads.mjs*)` solamente; cerebro vault/ceo/cerebro-max.md. `/ads …` sigue como atajo sin tokens en todos los bots. Bori: rol trafficker ya en prod (`POST /api/admin/crear-trafficker` como dueño; Elvin manda emails).

**Max con el método de Elvin (21/sep/2026, brief textual).** Meta: escalar el portafolio de $100K a $300K/mes con ROAS positivo 6-8x; "si no identificas anuncios para escalar, no sirves como media buyer". Marketing simple pensado como ECOSISTEMA de anuncios: renovar creativos cada 10 días, analizar cada 3-7 días, escalar ganadores 10-20 %, matar rápido (CTR < 2 % = no engancha; el ROAS mata todo; el costo por seguidor no lo define todo; costo ≠ valor: el video caro puede traer la venta). Embudos vivos: Instagram/Follow Me (solo IG, $1/seguidor, sobre reels ganadores; ManyChat escribe a seguidores nuevos → agenda Calendly), WhatsApp, quiz (pronto VSL oculto al final), DM IG. Max debe RECOMENDAR siempre sin limitarse (webinar cada 30 días, lanzamiento, evento presencial, VSL, retargeting), pedir buen contenido y ángulos, identificar anuncios y ángulos ganadores, y aprender de Hormozi, Iman Gadzhi, Nick Shackelford (Elvin dijo "Nick Setting" — confirmar) y Ramiro Cubría, siempre lo más tech (marketing + IA). Trazabilidad ventas↔anuncio de LU y AIB la lleva Aure (asistente): Max le pregunta por Slack los viernes e insiste el lunes. Rutinas creadas como tareas programadas: max-reporte-semanal (lun 8 AM), max-alertas-escalar (mar/jue/sáb 8:30), max-trazabilidad-aure (vie/lun 9 AM). Cerebro completo: vault/ceo/cerebro-max.md.

**Max + Higgsfield (21/sep/2026).** Elvin quiere que Max genere creativos en Higgsfield (plan Ultra, ~8.7K créditos) — sobre todo el Ad Multiplier del Marketing Studio ("traducir" un anuncio ganador a N versiones con otra persona/producto/fondo/texto). El conector de claude.ai no sirve para `claude -p` en Railway, así que hice `scripts/higgsfield.mjs`: cliente propio del MCP oficial (https://mcp.higgsfield.ai/mcp) con OAuth PKCE (registro dinámico en clerk.higgsfield.ai; el flujo device_code está reservado a los agentes de Higgsfield) + refresh (offline_access). `login` se hace UNA vez en la Mac (abre el navegador; 20 min; tolera enlaces viejos), guarda `data/higgsfield-auth.json` (gitignored) y `exportar` imprime el comando para subirla a Railway como `HIGGSFIELD_OAUTH_JSON` (hecho en el servicio `max`; en Railway la renovación se guarda en /estado). Comandos: quien, tools, esquema, call, imagen, video, esperar, subir, modelos, flujo. Marketing Studio sin widget: marketing_studio_v2_presets/costs/avatars/create. Regla: Max propone qué/cuántas/costo y NO gasta créditos sin OK explícito de Elvin (lotes 1-3). Cerebro §9.

**Estado:** plan `data/meta-ads/campanas/level-up-diagnostico-2026-09.json` (9 conjuntos × $13,
3 copys) listo; falta el token de Elvin para inventariar públicos y montarla. Landing `/crecimiento`
verificada con pixel y eventos. Nota: `vault/proyectos/level-up/campana-diagnostico-meta.md`.

**How to apply:** cualquier campaña nueva de cualquier marca pasa por `/meta-ads plan` → OK de
Elvin → `crear` en pausa. Ver [[quiz-funnels-clickfunnels]], [[voz-espanol-pr-tuteo]],
[[hey-bori-meta-app]].

**23/sep/2026 — Max completo (pedido de Elvin):**
- **Método 5 Fases** en código: `node scripts/meta-ads.mjs <marca> estrategia --destino dm-ig|leads|enlace --presupuesto N --reels …` → públicos primero (interacción 365, video 75/25, mensajes, visitas 120, web 180, similar 1 %) + F1 tráfico ~10 % · F2 ventas ≥70 % · F3 remarketing ventas (caliente/tibio) · F4 ThruPlay 365, EN PAUSA (~1 min). A $100: F1 10 · F2 67 · F3 13 · F4 10; con poco presupuesto cae F4 y luego F3, F1 nunca. F5 = `escalar <adsetId> --pct 15` (propone) y `--ok` SOLO tras el sí explícito de Elvin (≤ 20 %). Elvin cambió la regla del 21/sep: mover presupuesto = pedir permiso, no prohibido.
- **Espiar la competencia** (hábito de Elvin: sacar 1-3 cosas, no copiar la estrategia): skill `espiar-competencia` + `meta-ads.mjs competencia "<términos>"` (Apify `apify/facebook-ads-scraper`, ~$0.15/búsqueda; 30+ días activo = funciona, variantes = lo escalaron). **Falta `APIFY_TOKEN`** en `.env.local`, Railway `max` y Railway `bori` (Elvin lo crea en Apify → Settings → API). En la Mac se puede usar el MCP de Apify + `competencia resumir <json>`.
- **Max = trafficker de los clientes de AI Borinquen en Bori** (heybori.ai → Estratega → "Max · trafficker", EN PROD 23/sep, commit 77f636d): Sonnet 5 rápido (~70 s por estrategia completa, probado local con cliente de prueba), ficha de onboarding POR espacio de cliente (`users.memoria.clientes[clienteId].ficha`, herramienta `guardar_ficha`), `espiar_competencia`, `solicitar_videos` (a la PM por Slack #clientes; Max nunca le escribe al cliente), `disenar_campana` con reparto exacto del método, flyers con Nano Banana. Solo dueño y staff/traffickers (`canEstratega`). Trafficker selecciona la cuenta del cliente en Conexiones; Max la confirma antes de montar. Pendiente: similares/web/lista de alto valor en el motor de Bori (hoy se agregan a mano en Ads Manager) y avisos proactivos de escalar para clientes.
- Trampa: persona de Max en `telegram-puente.mjs` es un string con comillas dobles → nunca meter `"` sin escapar (23/sep tumbó el arranque con ReferenceError aunque `node --check` pasó).

**24/sep/2026 — Max = Marketing Strategy & Creative Operator + VIVE EN SLACK.** Spec de Elvin en
cerebro §0/§1a/§2b/§12-§17 (3 embudos, matemática comercial, optimizar desde el creativo, CTR único
< 2 % malo, MANTENER/APAGAR/ITERAR/ESCALAR/NUEVO TEST, pepitas de Carilin/traffickers). Slack:
#max-aprobaciones (Elvin o Carilin: ok/no/publica <id>); Max NUNCA le escribe al cliente — el servidor
publica lo aprobado; clientes = invitados single-channel de Slack en canal vinculado; activar campañas
por API SOLO con `meta-ads.mjs … activar --item <id>` aprobado. #max-aprobaciones = C0C56TTPB88 (lo
creó Elvin; SLACK_MAX_CHANNEL_ID en Vercel). Elvin: NINGÚN canal de cliente todavía
(MAX_CANALES_CLIENTES vacío = lista blanca), onboarding automático apagado (MAX_ONBOARDING=on), y límites
con clientes: solo negocio, nada personal (revisarParaCliente bloquea credenciales/promesas/gratis/voseo,
marca ⚠ dinero/personal/otros clientes). Costo estimado 1.ª semana por cliente ≈ $20-30 de Claude
(API key, sin --model) + ~10-20 créditos Higgsfield en flyers (+90-140 por video Marketing Studio). "max o carilin" para publicar lo interpreté como Elvin o Carilin.
**24/sep noche — arranque por Fathom:** el disparador real de Max es la reunión de onboarding de Jessica
(U08SN35L2UX) en Fathom → /api/fathom (esOnboarding por título o grabada por Jessica) → expediente con
resumen/tareas/transcripción + hilo en #max-aprobaciones pidiéndole a Jessica su resumen + Max arranca.
Aprueban Jessica, Carilin o Elvin; publicar solo Elvin/Carilin. Webhook por cuenta: `fathom.mjs crear
--cuenta jessica` (FATHOM_API_KEY_JESSICA → FATHOM_WEBHOOK_SECRET_JESSICA). Pendiente: la API key de
Fathom de Jessica; el registro de /api/fathom está vacío (el webhook de Elvin nunca entregó nada).
Probado en prod con ?prueba=1&max=1 (expediente "prueba-fathom" y mensaje 🧪 en el canal).
**Fathom es cuenta de EQUIPO (Elvin, 24/sep):** no hace falta llave de Jessica: `FATHOM_API_KEY=<la de Elvin>
node scripts/fathom.mjs crear --equipo` (shared_team_recordings → FATHOM_WEBHOOK_SECRET_EQUIPO) — pendiente
que Elvin lo corra; Jessica debe compartir sus grabaciones con el equipo. Al canal de Aure solo van las
llamadas de Elvin (FATHOM_SLACK_EMAILS). Programados por el bot (firmados Max) para el 25/sep: Carilin
7:30 AM (Q0C4ANAQ9AS, DM D0C33M73V5Y) y Jessica 8:00 AM (Q0C4CHA3DEW, DM D0BFMAR99V4) con instrucciones
de Fathom y el porqué; cancelar con chat.deleteScheduledMessage.
**Corrección de Elvin (24/sep noche):** del Fathom de equipo SOLO entran las llamadas etiquetadas de onboarding
(título "Onboarding · <Negocio>") → Max; todo lo demás se descarta sin guardar y NADA del equipo sale en
#office-2-resumendellamadas (ese canal sigue solo con las llamadas de Elvin, #29). El pedido de Roger/Laura
en el canal fue un error suyo y se revirtió.
**Webhook de equipo CREADO (24/sep noche):** Fathom webhook id 6fyy5yK5eWmSiy6H (shared_team_recordings +
transcripción) → /api/fathom, secreto FATHOM_WEBHOOK_SECRET_EQUIPO en Vercel, redeploy hecho. Falta: que Jessica
grabe y COMPARTA sus onboardings con el equipo, titulados "Onboarding · <Negocio>" (mensajes programados 25/sep).
**Prueba de punta a punta (24/sep 22:40):** onboarding ficticio "Sonrisa Dental Caguas" (/api/fathom?prueba=1&max=completo
+ /api/max buzon-prueba) → Max leyó expediente + resumen simulado de Jessica y subió el #1 (PRUEBA) plan completo a
#max-aprobaciones en 2 min 11 s por **$0.82** (costo REAL; mi estimado de $5-7 por plan era alto). Arreglado tras la
prueba: filtro de voseo marcaba "sabes/haces"; alerta de dinero saltaba en todo plan. Mensajes reprogramados 25/sep
(bot, firmados Max): Carilin guía completa 7:30 (Q0C46HJ4S75) + tarea Fathom/Jessica 7:31 (Q0C47N8FEBF), Jessica
breve 8:00 (Q0C4EN9FMED).
