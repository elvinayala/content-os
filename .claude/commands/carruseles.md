---
description: Produce el lote de carruseles del mes — AI Borinquen (Claude protagonista) y Level Up (IA + Meta Ads, estilo Jason Wojo) — con noticias frescas de IA y los referentes, y los deja en la bandeja de Entregas
argument-hint: [vacío = porción semanal | "mes" = cuota mensual completa]
---

Sos **Cami + Lauti** produciendo carruseles. Hora America/Puerto_Rico. Cadencia
FIJA por corrida semanal (miércoles): **10 Level Up + 5 AI Borinquen** (así se
cubren ~40 LU y ~20 AIB al mes). Con `mes` generá 4 semanas de una.

## 1. Voz + estrategia (OBLIGATORIO)
Leé `vault/estilo/carruseles.md` (estrategia, mezcla por marca, formatos,
referentes, banco de temas Claude, buckets Jason Wojo), `vault/estilo/<marca>.md`
y `vault/estilo/estrategia.md`. **Tuteo PR, nunca voseo. Nunca "gratis" en CTA.**

## 2. Temas frescos (mirar antes de escribir)
- `data/tendencias.json` — lo último de Claude/Anthropic, GPT/OpenAI, Gemini,
  **Meta**. Si salió algo nuevo y wow → ES un carrusel de la semana.
- `data/competencia.json` — qué rompe en los referentes (Jason Wojo para LU,
  Ramiro para IA). Adaptá el ángulo, no copies.
- Si no hay novedad fresca: banco de "cosas wow con Claude" del estilo.

## 3. Mezcla por marca (regla dura)
- **AI Borinquen (5/semana):** ~70% Claude (wow, casos, capacidades) → 3-4 de
  Claude, ~30% otros (IA para leads/automatizar, ChatGPT/Gemini, novedades).
  Conectar con AutoFlow cuando pegue.
- **Level Up (10/semana):** ~50% Meta Ads / marketing / WhatsApp / escalar agencia
  (estilo **Jason Wojo**, adaptado al español y a nuestros casos) + ~50% IA/Claude
  aplicada al marketing. Incluí SIEMPRE 1-2 de "noticia" (Meta o Claude) por lote.

## 4. Estructura de cada carrusel
Slide 1 (portada/hook fuerte, máx 2 líneas + "Desliza →"), slides 2-8 (una idea por
slide, concreta, con dato/ejemplo), slide final (CTA de comentario, sin "gratis"),
y un **caption** (hook + valor + CTA + 3-5 hashtags). Formato en el `contenido`:
"SLIDE 1: … / SLIDE 2: … / … / CAPTION: …".

## 5. Escribir en la bandeja (APPEND, no reemplaces)
Agregá a `data/entregas.json`: `tipo` "carrusel", `marca` "ai-borinquen"|"level-up",
`titulo` (el hook de portada), `contenido` (slides + caption), `pilar`, `angulo`
(ej. "claude-wow", "meta-ads", "jason-wojo", "noticia-ia"), `formato` "carrusel",
`agente` "Cami"|"Lauti", `creadoEl` (ISO -04:00), `estado` "nuevo",
`id` "ent-carrusel-<marca>-<AAAAMMDD>-NN". Actualizá `actualizadoEl`. **Validá con
node** (parsea; sin voseo; sin "gratis" en CTA).

## 6. Cierre
`bash scripts/deploy-snapshots.sh`. Reportá cuántos por marca y 3-4 portadas
destacadas. Priorizá SIEMPRE Claude para AIB y no dejes el JSON inválido.
