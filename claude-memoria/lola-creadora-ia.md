---
name: lola-creadora-ia
description: Lola = la Creadora de Contenido con IA (flyers, artes, videos Higgsfield, guiones a pedido); el puesto de producción que faltaba en el equipo de Sofi
metadata:
  type: project
---

Creada el 20/sep/2026. Elvin: "¿quién me crea los artes, los guiones? Necesito flyers, contenido
en Higgsfield; esa tiene que ser la especialidad". Equipo: Sofi coordina · Cami idea · Lauti
escribe · Facu publica · **Lola produce** · Nico plataformas · Max ads.

- Cerebro `vault/ceo/cerebro-lola.md`; comando `/crear-contenido`; cola `data/pedidos-lola.json`;
  tarea `lola-atender-pedidos` (30 min); tipo de entrega nuevo `arte` (imagenUrl).
- Higgsfield: MCP de la app (este chat) o `scripts/higgsfield.mjs` (OAuth, sesión en
  `data/higgsfield-auth.json`) para el bot. Plan Ultra, ~8,700 créditos al 20/sep; un flyer
  gpt_image_2_5 = 1 crédito. Primer flyer real: AIB ángulo A (`arte-lola-aib-01`).
- Bot Telegram **@Lola_contentAI_bot** (`PUENTE_BOT=lola`) — **en Railway desde el 20/sep/2026**
  (servicio `lola`, proyecto `puente-telegram`, volumen `/estado`, vars por referencia a `max`,
  Higgsfield OAuth ya cargado: `higgsfield.mjs quien` responde con créditos). Funciona con la Mac
  apagada (pedido de Elvin). Plist de la Mac descargado (respaldo). Pendiente compartido: el
  VERCEL_TOKEN de Railway está roto → lo que Lola deja en data/ desde Railway no llega a prod hasta
  que Elvin ponga uno nuevo.

**How to apply:** pedidos de flyers/artes/videos/guiones → Lola (`/crear-contenido`), con las
reglas de su cerebro (tope de créditos, tuteo, sin "gratis", enemigo no cliente, solo a Elvin).
Relacionado: [[sofi-coordinadora]], [[nico-vibecoder]], [[meta-ads-agente]].

**25/sep/2026 — Lola crea con fal.ai, ya no con Higgsfield** (Elvin: "para Lola y Max, utiliza fal.ai"; Higgsfield
quedó en periodo de gracia con límite diario). Manos: `node scripts/fal.mjs imagen "<prompt>" --ar 4:5|9:16 [--ref
url]` (Nano Banana Pro; --ref conserva logo/producto/cara) y `video "<movimiento>" --img <url> --dur 5|10` (Kling 2.1
Pro por cola). Llave FAL_API_KEY (la de Bori) en .env.local y Railway (max directo, lola por ${{max.FAL_API_KEY}}).
Tope sin OK: 3 imágenes / 2 videos por pedido.
