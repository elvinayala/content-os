## Lola — la Creadora de Contenido con IA (20/sep/2026)

El puesto que faltaba: Sofi coordina, Cami idea, Lauti escribe, Facu publica, **Lola produce**
(flyers/artes, videos con Higgsfield, guiones a pedido). Cerebro: `vault/ceo/cerebro-lola.md`
(modelos por defecto, tope de créditos 3 img / 2 videos por pedido, reglas de marca, cómo
entrega). Comando `/crear-contenido <pedido>` (usa el MCP de Higgsfield de la app) y
`/crear-contenido atender` (vacía `data/pedidos-lola.json`; tarea `lola-atender-pedidos` cada
30 min). Entregas: `tipo: "arte"` (nuevo en `TipoEntrega`, con `imagenUrl`; la bandeja lo
muestra) o `anuncio`/`guion`, `agente: "Lola"`. Bot de Telegram `PUENTE_BOT=lola`
(`TELEGRAM_BOT_TOKEN_LOLA`, modo seguro: Read/Edit/Write + `scripts/higgsfield.mjs` +
`validar-voz`); renderiza directo si hay sesión (`node scripts/higgsfield.mjs login` una vez en la
Mac), si no encola. **Lola vive en Railway** (servicio `lola` del proyecto `puente-telegram`, `Dockerfile.puente`, volumen
`/estado`, variables por referencia `${{max.VAR}}` incl. `HIGGSFIELD_OAUTH_JSON`, así que renderiza
directo sin la Mac; deploy `npx @railway/cli up --service lola --detach`). El plist de la Mac queda
como respaldo, descargado. Lola nunca le manda nada a nadie que no sea Elvin. Está en el roster de
`lib/equipo.ts`. **Guía de flyers de Elvin (26/sep)**: "flyers de calidad, de pocas palabras: un título, bullets de
beneficio, CTA claro, que resalte el producto; minimalista, elegante, Nano Banana Pro" → `node scripts/fal.mjs flyer
--marca <m> --titulo … --bullets 'a|b|c' --cta … --producto … [--foto url] [--logo url]` (valida el copy antes de
gastar: ≤ 8 / 3×6 / 4 palabras, sin "gratis", voseo ni promesas de ingreso; el logo REAL va como última referencia;
prompt puro en `scripts/fal/flyer.mjs`, tests `tests/fal-flyer.test.mjs`, base = el prompt de flyers de Bori). Kits
con logo público en `public/marcas/` (level-up, ai-borinquen, bori, resuelto; isla-run sin logo aprobado): marca sin
kit = sin logo, nunca inventado. Cerebro §3b. Tope por pedido 8 imágenes / 3 videos; lo que viene de otro agente de
parte de Elvin se entrega completo en una vuelta.
