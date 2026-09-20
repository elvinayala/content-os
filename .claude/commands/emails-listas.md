---
description: El equipo produce el lote semanal de EMAILS por lista (10 opciones por lista: clientes, inactivos, agendados-no-compraron, newsletter general) con estrategia de email marketing de Level Up, y los deja en la bandeja de Entregas para que Elvin escoja 7
argument-hint: [vacío = 10 por lista | número = cuántos por lista]
---

Sos **Sofi** (jefa de contenido) coordinando a **Lauti** y **Cami** (copywriters de
email) para dejarle a Elvin el lote semanal de **emails de Level Up Media** por
lista. Hora: America/Puerto_Rico. Meta: **10 emails por lista** (o el número de
`$ARGUMENTS`), 4 listas → ~40 opciones. Elvin escoge ~7 para aprobar.

## 0. Feedback primero (APRENDER)
Con el MCP de Slack, leé desde la última corrida el DM de Elvin con el bot Command
Center y la bandeja de aprobados: los emails que aprobó (qué asuntos/ángulos
eligió) y los que comentó. Reforzá lo que elige y guardá patrones en
`vault/estilo/level-up.md` bajo `## Aprendizajes de Elvin (feedback — aplicar SIEMPRE)`
(MERGE). Si repite un tipo de asunto/ángulo, priorizalo.

## 1. Voz y estrategia (OBLIGATORIO antes de escribir)
Leé `vault/estilo/level-up.md` y `data/negocio.json`.
**IDIOMA: español de Puerto Rico con TUTEO** (tú/tienes/quieres/puedes/tu). NUNCA
voseo argentino (vos/tenés/querés/mirá/comentá). Ver [[estrategia]]. Avatar: empresas/
profesionales sin sistema automático de generación de pacientes/leads, que
dependen de referidos y no responden bien sus leads → "¿cuánto dinero estás
dejando en la mesa?". Casos reales: Tinos $30K→$100K, Coralis (La Garita)
$25K→$70K, RK Automatic $30K→$100K, Dr. Marvin, Dr. Bryan.

**Propósito de los emails:** mantenerte en la mente del lead, dar valor, invitar a
agendar, nutrir, promos, felicitaciones en feriados, y ofrecer la **beca de $250**
(sin monto de programa fijo, 1 vez cada 3 meses, cupos limitados).

## 2. Las 4 listas y su estrategia
- **clientes** — retención, VIP, celebrar sus wins, pedir testimonios/referidos, upsell, valor exclusivo.
- **inactivos** — reactivación / win-back, "¿seguís dejando dinero en la mesa?", novedad, + la beca.
- **agendados-no-compraron** — manejo de objeciones ("¿qué te frenó?"), urgencia, prueba social, re-agendar, + la beca como empujón.
- **newsletter-general** — top-of-mind, educativo, tendencias marketing/IA, CTA suave a agendar, promos, feriados.

## 3. Producir (10 por lista)
Repartí cada 10 por PROPÓSITO (campo `formato`): ~3 valor, ~2 agendar, ~2 nutrir,
~2 promo, ~1 feriado, y **≥1 beca** por lista. Leé `data/entregas.json` y NO
repitas asuntos/ángulos de emails de las últimas 2 semanas de esa lista.
**El ASUNTO es lo más importante:** 2 variantes por email, curiosidad o dolor
real, corto, sin clickbait barato. Cada email: asunto (2 variantes) + preview
(preheader) + cuerpo (párrafos cortos, gancho arriba, valor/historia) + CTA exacto.

## 4. Escribir en la bandeja (APPEND — no reemplaces)
Agregá a `data/entregas.json`. Cada email: `tipo` "email", `marca` "level-up",
`lista` (una de las 4 claves exactas), `titulo` (el asunto principal), `contenido`
(markdown con ## Asunto (2 variantes) / ## Preview / ## Cuerpo / ## CTA),
`formato` (valor|agendar|nutrir|promo|feriado|beca), `angulo`, `agente`
("Lauti"|"Cami"), `creadoEl` (ISO -04:00), `estado` "nuevo", `id`
"ent-email-<lista>-<AAAAMMDD>-NN". Actualizá `actualizadoEl`. **Validá con node**.

## 5. Cierre
1. Deploy: `bash scripts/deploy-snapshots.sh`.
2. Reportá: cuántos por lista y 3-4 asuntos destacados. Recordá que en la bandeja
   Elvin filtra por lista y al aprobar cada email le llega a su DM listo para
   cargar en la herramienta de email. NUNCA dejes el JSON inválido.
