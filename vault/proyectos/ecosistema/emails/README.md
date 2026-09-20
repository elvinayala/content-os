---
fecha: 2026-09-19
fuente: manual
unidad: ecosistema
tags: [ecosistema, email, activecampaign, setup]
estado: copy en borrador (40 emails) · cables por código · faltan API key + montar automatizaciones en la UI
---

# Ecosistema de email (Level Up + AI Borinquen) — cómo queda y cómo se enciende

## Qué hay (todo en borrador, nada enviado)
- **Copy completo** por marca en esta carpeta: `bienvenida` (5), `lead-agenda` (4),
  `pre-llamada` (3, la de mayor ROI), `no-show` (3), `no-compro` (4) y `newsletter` #1.
  Los 40 también están en la bandeja `/ceo/entregas` (`para: ActiveCampaign`) para aprobar.
- **Blueprint** (`data/email-ecosistema/blueprint.json`): listas (LU, AIB, SO), tags estándar
  (`marca:*`, `origen:*`, `etapa:*`, `avatar:*`, `quiz:*`), campos, cada automatización con su
  trigger/salida/días, los cables y los KPIs.
- **Cables en la app (ya en código, se activan con la API key):**
  - Quiz funnel → AC (`app/api/auditoria`): lista de la marca + `origen:quiz` + `quiz:lead|resultado`
    + `quiz-principal:<cuello>` + `avatar:*` en LU.
  - Calendly → AC (`app/api/calendly`): `origen:calendly` + `etapa:agendo|reagendo|cancelo` +
    `agendo-por:<utm_source>`. La marca se infiere por evento/closer (`CALENDLY_MARCA_AIB_REGEX`).
  - Aprobar newsletter → AC (`app/api/aprobar-entrega`): crea la campaña **programada jueves
    8:00 AM PR** (`NEWSLETTER_AUTO=draft` para que quede en borrador).
- **Script** `scripts/activecampaign.mjs`: `estado`, `setup` (crea listas/tags/campos e imprime
  `AC_LISTA_*`), `contacto` (prueba), `newsletter <lu|aib> [fecha hora]` (campaña desde la bandeja).
- **Tarea semanal** `newsletter-semanal` (miércoles 9 AM): Sofi deja los 2 newsletters en la bandeja.

## Cómo se enciende (30 minutos, en orden)
1. **API key**: ActiveCampaign → Settings → Developer → copiar URL y Key →
   `.env.local` (`ACTIVECAMPAIGN_URL`, `ACTIVECAMPAIGN_KEY`) y Vercel (Production).
2. `node scripts/activecampaign.mjs setup` → crea las 3 listas, los tags y los campos, e
   imprime `AC_LISTA_LU/AIB/SO` → pegarlos en `.env.local` y Vercel → `npx vercel --prod --yes`.
3. **Dominio de envío + DKIM por marca** en AC (Settings → Advanced → Domains):
   `levelupmediapr.net` y `aiborinquen.co`. Sin esto, los emails caen en spam. (Jessica)
4. **Automatizaciones en la UI de AC** (no se crean por API). Por marca, 3 para arrancar:
   - *Bienvenida*: trigger "se suscribe a la lista" → espera 0/2/4/7/10 días → los 5 emails de
     `bienvenida.md` (en LU, condición por tag `avatar:coach` en los emails 2 y 4) → salida si
     tag `etapa:agendo` o `etapa:cliente`.
   - *Lead → agenda*: trigger "termina Bienvenida sin `etapa:agendo`" o tag `no-agendo` → 0/1/3/6.
   - *Pre-llamada*: trigger tag `etapa:agendo` → email al instante, email 24 h antes (usar el
     campo de fecha de la cita o "espera 1 día"), SMS/WhatsApp 1 h antes (Twilio ya migrado).
   No-show y no-compró se montan en fase 2 cuando exista el webhook Pipedrive → AC.
5. **ManyChat → AC**: integración nativa; mapear email/WhatsApp y los tags `marca`, `origen`,
   `dolor`, `no-agendo` (Jessica, con el plan §2).
6. **Probar de punta a punta** con un lead ficticio: quiz → entra a la lista con tags → recibe
   bienvenida día 0; agenda en Calendly → tag `etapa:agendo` → recibe pre-llamada; aprobar el
   newsletter #1 en la bandeja → aparece programado en AC para el jueves.

## Regla de oro
Toda pieza nueva (reel, historia, funnel) nace con **keyword + entrega + tag de origen**; si no
captura identidad ni etiqueta, no es parte del ecosistema, es un post. Cadencia por persona ≤ 2
emails/semana. Pipedrive es la fuente de verdad de la etapa; AC obedece.
