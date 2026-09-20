---
fecha: 2026-09-18
fuente: agente
unidad: level-up
tags: [meta-ads, campaña, diagnostico, coaches, quiz-funnel]
estado: MONTADA EN BORRADOR en Ads Manager (19/sep/2026) — Elvin sube los 3 videos y publica
---

# Campaña Meta · LU · Diagnóstico de Crecimiento · Coaches/Agencias

Primer encargo del **agente de Meta Ads** (`/meta-ads`, `scripts/meta-ads.mjs`). Manda tráfico
pagado al quiz funnel `https://class.levelupmediapr.net/crecimiento` para que completen el
Diagnóstico (Lead en Pipedrive pipeline 12 + WhatsApp). Nicho nuevo para LU: **infoproductores,
coaches, mentores, dueños de agencias y de negocios digitales** (viven en Instagram).

Plan ejecutable: `data/meta-ads/campanas/level-up-diagnostico-2026-09.json`.

## Verificado en vivo (18/sep)
- Landing `/crecimiento` responde con el pixel **Level Up Media PR `27706808412306198`** y dispara
  `PageView`, `Lead` (captura), `DiagnosticoCompletado` (custom) y `Contact` (clic a WhatsApp).
  Lee UTMs + `fbclid` y los manda a Pipedrive. Sin CAPI todavía (fase 2).
- Cuenta publicitaria **Level Up Official 2025 `2010206776851`**, negocio Level Up Media
  `100872629602980`. Token: usuario del sistema con la app Hey Bori → `META_ADS_TOKEN`.

## Estructura (decisiones de Elvin, 18/sep)
- Objetivo **Leads** optimizando al evento `Lead` del pixel. **ABO**: presupuesto por conjunto.
- **1 creativo por conjunto, $13/día** (mínimo $10). 3 creativos (videos de Elvin) × 3 grupos de
  públicos = **9 conjuntos = $117/día** (tope $120). PR, 25-55, ubicaciones **Instagram**
  (reels, historias, feed, explorar, perfil).
- Grupos: **A Frío** (intereses coaching/marketing digital/emprendimiento/cursos/agencias +
  Advantage+ audience; excluye clientes y leads del quiz) · **B Similares 1 %** (clientes alto
  valor, agendados, video 50 %+, engagers IG/FB; excluye clientes) · **C Caliente** (web 180d,
  engagers 365d, agendaron-no-compraron, solo agendaron, leads del quiz; excluye clientes).
- Los públicos se **reusan** de los que ya existen en la cuenta (inventario con `publicos`); se
  crean solo los que falten (`crear-publicos`). Las listas (clientes / agendaron-no-compraron /
  solo-agendaron) salen de Pipedrive (won + pipeline CLOSERS 15) y se suben hasheadas.
- Anuncios en **borrador** con video marcador (`⚠ reemplazar video`): Elvin sube sus 3 videos.
- Link con UTMs dinámicos: `utm_source=meta&utm_medium=paid&utm_campaign=lu-diagnostico&utm_content={{ad.name}}&utm_term={{adset.name}}`
  → en Pipedrive se ve qué video y qué público trajo cada lead.

## Copys (tuteo PR, sin "gratis", números solo como casos de clientes)
- **V1 · Contenido sin estructura** — "Publicas todos los días y no te escribe nadie. No es el
  algoritmo…" → diagnóstico de 1 minuto → plan de 14 días. Título: *Audita tu negocio en 1 minuto y
  recibe tu plan de 14 días*.
- **V2 · Lanzamientos/referidos → sistema (caso Yadiel $5K→$40K)** — "Un lanzamiento al año no es
  un negocio, es una apuesta…". Título: *¿Qué te falta para tu meta? Audítalo en 1 minuto*.
- **V3 · ¿Cuántos clientes te faltan?** — promesa exacta del titular de la landing (números →
  cuello de botella → plan). Título: *Descubre qué frena tu crecimiento en 1 minuto*.
Texto completo en el plan JSON.

## Cambio de estrategia (19/sep/2026, decisión de Elvin): mercado NUEVO, sin mezclar con el viejo
Elvin: "venimos de 2 años atacando negocios tradicionales/salud; el DWY para coaches/creadores es un
mercado nuevo, no quiero mezclar el público viejo". Por eso se **quitaron los similares y el retargeting**
(sembrados con doctores/clínicas) y los 9 conjuntos quedaron 100 % fríos hacia gente nueva:

| Grupo | Público | Tamaño est. | Conjuntos |
|---|---|---|---|
| **A · Frío intereses negocio** | Entrepreneurship · Digital marketing · Online advertising · Coaching + Advantage+ | ~1M | A-V1/2/3 |
| **D · Advantage+ puro** | sin intereses ni públicos; Meta aprende del video + evento Lead | 2.0–2.3M | D-V1/2/3 |
| **E · Frío creadores** | Creadores de personalidades de internet (comportamiento) · Social media marketing · Marketing de contenidos · Desarrollo personal (+ Massive Open Online Course en E-V1) | ~0.95–1.1M | E-V1/2/3 |

**Exclusiones en los 9** (para forzar gente nueva): clientes_meta_ads.csv · LISTA DE CLIENTES ALTO VALOR ·
365 level up interacción FB · instagram 365. Advantage+ audience queda activo (expande, pero respeta exclusiones).
Ubicaciones: la cuenta ya no permite manuales (Meta 2026); con video 9:16 la entrega cae casi toda en reels/historias IG.

**Fase 2 (con el mercado nuevo, no con el viejo):** a las 3-4 semanas crear públicos propios del nicho — visitantes
de /crecimiento (pixel), evento Lead del quiz, engagers IG de estas campañas — y de ahí retargeting + similares 1 %.
Nada de las listas viejas.

## Compuertas y fase 2
- Día 5-7 (≥ $60 por conjunto): pausar CPL > 2× mediana, CTR < 1 % con ≥ 1,000 impresiones o $20+
  sin leads. Ganador = menor CPL con ≥ 5 leads → duplicar a públicos nuevos (similares 3-5 %,
  intereses set 2, video 25 %+, seguidores IG) manteniendo ≤ $120/día.
- Escalar +10-20 %/día solo con CPL ≤ $10 tres días seguidos. Pasar la optimización a `Contact`
  con ≥ 50 leads/semana. Nunca subir presupuesto sin OK de Elvin.

## Inventario de públicos (leído de Ads Manager el 18/sep, 55 personalizados + 22 similares)
Detalle completo: `data/meta-ads/publicos-level-up.json`. Mapeo en `portafolio.json → publicosClave`.

| Grupo | Se REUSA (ya existe) | Se CREA por API |
|---|---|---|
| Exclusión | clientes_meta_ads.csv `6950438101193`, LISTA CLIENTES ALTO VALOR `6854406130393` | leads-quiz (evento Lead del pixel) |
| B · Similares 1 % | (PR,1 %) clientes_meta_ads `6950628999793` (20-24K), (PR,1 %) ALTO VALOR `6854412364993` (20-24K), (PR,1 %) IG engagers `6884303633993` | similar-video50-1 (desde VIDEO PUBLICO 50 %+ `6717224745793`) |
| C · Caliente | 365 level up interacción FB `6917880872593` (31-36K), instagram 365 `6917880965593` (21-25K), VIDEO 50 %+ `6717224745793` (33-38K), 75 % video lum `6884302883393` (17-20K) | web-180d y leads-quiz (pixel `27706808412306198`) |
| Fase 2 | (PR,3 %) ALTO VALOR `6884305660393` (59-69K), tibio 15 % 365d `52507635995997` (148-174K) | agendaron-no-compraron + solo-agendaron (listas de Pipedrive) y su similar 1 % |

Hallazgos: **no hay ningún público de sitio web ni de leads** (nunca se usó el pixel para públicos);
**no hay lista de agendados**; las 3 listas de clientes están obsoletas (< 1.000, coincidencia
reducida) → Elvin debería re-subir la lista de clientes actualizada. Hay decenas de públicos de
clientes de la agencia (Frankie, doctores, Alondra…) que NO se usan para LU.

## Landing adaptada (18/sep, pendiente de re-pegar en CF)
`demos/auditorias/level-up/index.html` → `cf-snippet.html` regenerado: eyebrow "Para coaches,
mentores, infoproductores y dueños de agencias en Puerto Rico" que solo aparece con
`utm_campaign=lu-diagnostico` (o `coach` en utm_content/term); `eventID` estable por visita en
`Lead` y `DiagnosticoCompletado` + `fbp`/`fbc` en el tracking (base para CAPI). Verificado en
local (http://localhost:8794/level-up/?utm_campaign=lu-diagnostico). Falta pegar en CF (README).

## Montada en Ads Manager (19/sep/2026, a mano desde el Chrome de Elvin)
Portafolio correcto = **LEVEL UP MEDIA PR (989015235153696)** (no "Level Up Media" 100872629602980, que
solo aloja la app Hey Bori y no tiene cuentas). Campaña **52606426074997** en Level Up Official 2025,
todo en **Borrador** (no publicado). Link: https://adsmanager.facebook.com/adsmanager/manage/adsets?act=2010206776851&business_id=989015235153696&selected_campaign_ids=52606426074997

| Conjunto | Público | Anuncio (copy) | Ad set ID |
|---|---|---|---|
| C-V1 | 365 level up interacción FB · instagram 365 · VIDEO 50%+ · 75% video lum | V1 | 52606427133397? |
| C-V2 / C-V3 | idem | V2 / V3 | — |
| B-V1/2/3 | Similar 1% clientes_meta_ads · Similar 1% LISTA ALTO VALOR · Similar 1% instagram level up | V1/V2/V3 | — |
| A-V1/2/3 | Intereses: Entrepreneurship, Digital marketing, Online advertising, Coaching + Advantage+ | V1/V2/V3 | — |

Común a los 9: objetivo Clientes potenciales, ABO **$13/día** (total $117), sitio web, pixel **Level Up Media PR
27706808412306198**, evento **Cliente potencial (Lead)**, PR, edad mínima 25, exclusión clientes_meta_ads +
LISTA DE CLIENTES ALTO VALOR, ubicaciones Advantage+ (Meta ya no deja manual en esta cuenta), video
**marcador "Level Up AD"** en cada anuncio (nombre `⚠ SUBIR VIDEO`), copy + título + descripción por versión,
CTA "Ver detalles", URL con UTMs `utm_source=meta&utm_medium=paid&utm_campaign=lu-diagnostico&utm_content=V#&utm_term=<conjunto>`,
mejoras de IA / traducción / contenido relacionado apagados, complemento del navegador "Ninguno".

**Elvin:** reemplazar el video en los 9 anuncios (Contenido multimedia → Cambiar selecciones), revisar y
"Revisar y publicar" cuando quiera. ⚠ El botón lo publica junto con los otros ~45 borradores pendientes de la
cuenta: revisar la lista antes de confirmar.

## Pendientes
1. Elvin: generar `META_ADS_TOKEN` (usuario del sistema, app Hey Bori) → `.env.local`.
2. `node scripts/meta-ads.mjs level-up cuentas` (pageId/igUserId) → `publicos --json` (confirma el inventario leído a mano).
3. `crear-publicos … ` (web-180d, leads-quiz, similar-video50-1). Listas de Pipedrive = fase 2.
4. `crear … --dry-run` → `crear` → `arbol` → Elvin sube los 3 videos y publica.
5. Landing: eyebrow por `utm_campaign=lu-diagnostico` + `event_id` en los `fbq` (base CAPI) —
   editar `demos/auditorias/level-up/index.html` y re-pegar en CF con OK de Elvin.
