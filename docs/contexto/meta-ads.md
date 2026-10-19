## El agente de Meta Ads (`/meta-ads`)

Media buyer del portafolio (Level Up, AI Borinquen, Shadow Operator, Resuelto) sobre la
**Marketing API v25** con los patrones de producción de Bori (todo `PAUSED`, ABO,
`instagram_user_id`, `promoted_object` con pixel). Cerebro: `.claude/commands/meta-ads.md`;
manos: `scripts/meta-ads.mjs <marca> cuentas|publicos|videos|intereses|pixel|crear|
crear-publicos|subir-lista|arbol|resultados|campanas|pausar`; builders puros en
`scripts/meta-ads/core.mjs` (tests: `npm test`). Config por marca en
`data/meta-ads/portafolio.json` (cuenta, página, IG, pixel, compuertas, `publicosClave`);
planes de campaña en `data/meta-ads/campanas/*.json` (idempotentes: guardan los ids de Meta).
Token = el largo del dueño conectado en Bori, copiado con `scripts/meta-ads/token-desde-bori.mjs`
(lo corre Elvin; ~60 días; ve las 72 cuentas) → `META_ADS_TOKEN` en `.env.local` y en Railway
(`puente`, `nico`). **Plantillas** (`scripts/meta-ads/plantillas.mjs`): `plantilla <marca>
follow-me|trafico-url|dm-instagram|quiz --reels a,b --videos a,b --presupuesto N --edad 18-35 --url …`
→ plan JSON + campaña EN PAUSA en ~10 s (reels existentes por `source_instagram_media_id`; perfil
IG = PROFILE_VISIT/INSTAGRAM_PROFILE; DM = CONVERSATIONS/INSTAGRAM_DIRECT). Por Telegram:
**Max**, el media buyer con bot propio (`PUENTE_BOT=max`, servicio `max` en Railway, token
`TELEGRAM_BOT_TOKEN_MAX`, cerebro `vault/ceo/cerebro-max.md`, guía `vault/proyectos/estudio/
telegram-max-pasos.md`): lenguaje natural → plantilla; solo puede Read/Grep + `node scripts/meta-ads.mjs`.
Rutinas de Max (tareas programadas): `max-reporte-semanal` (lunes 8 AM, `/reporte-max semanal`),
`max-alertas-escalar` (mar/jue/sáb 8:30, `/reporte-max alertas`), `max-trazabilidad-aure` (vie/lun 9 AM,
`/trazabilidad-aure`: le pide a Aure por Slack ventas↔anuncio de LU/AIB y registra en
`data/meta-ads/trazabilidad.json`). Meta del método: $100K→$300K con ROAS 6-8x, renovar creativos cada
10 días, analizar cada 3-7, escalar ganadores 10-20 %; `resultados` marca ESCALAR/pausar/CTR<2 %.
Atajo sin tokens en cualquier bot: `/ads plantilla|resultados|campanas|arbol|pausar <marca> …`. **23/sep/2026 — Max completo:** `estrategia` = el **Método 5 Fases** de Elvin (públicos primero → F1 tráfico ~10 % · F2 ventas ≥70 % · F3 remarketing ventas caliente/tibio · F4 ThruPlay 365 · F5 escalar), todo EN PAUSA en ~1 min (`plantillas.mjs` → `planEstrategia5Fases`, tests en `tests/meta-ads.test.mjs`); `escalar <adsetId> [--pct] [--ok]` (propone; `--ok` solo tras el sí de Elvin, ≤ 20 %); `competencia "<términos>"` + skill `espiar-competencia` (Biblioteca de Anuncios vía Apify `apify/facebook-ads-scraper`, ranking por días activos + variantes en código, `scripts/meta-ads/competencia.mjs`, necesita `APIFY_TOKEN`). **Max es el trafficker de los clientes de AI Borinquen en Bori** (heybori.ai → Estratega → modo "Max · trafficker": Sonnet 5, ficha de onboarding por espacio de cliente, mismo método, flyers Nano Banana, pedido de videos a la PM); cerebro §1b/§10/§11. **24/sep/2026 — Max = Marketing Strategy & Creative Operator** (spec de Elvin): CMO + media buyer + estratega creativo/de embudos; cadena entender → investigar → diagnosticar → embudo → estrategia → producir → medir → optimizar/escalar; 3 embudos (WhatsApp · Landing con calidad de data del pixel · Crecimiento IG ≤ $1/seguidor, hasta 10 conjuntos) con criterio de selección; matemática comercial (meta − actual ÷ ticket); optimiza desde el creativo, más allá del ROAS (CTR único < 2 % malo); MANTENER/APAGAR/ITERAR/ESCALAR/NUEVO TEST; pepitas de Carilin/traffickers/estrategas (cerebro §0, §1a, §2b, §12-§16; en Bori, ficha ampliada con ticket, facturación actual/meta, capacidad y resúmenes de onboarding/llamada de venta). Reglas:
nunca activar ni subir presupuesto por API, 1 creativo por conjunto ≥ mínimo de la marca ($10; Mauro $5),
tope diario por campaña, tuteo PR, sin "gratis", sin promesas de ingreso. Traffickers de Level Up
usan **Bori** (rol `trafficker`, `POST /api/admin/crear-trafficker` como dueño).
