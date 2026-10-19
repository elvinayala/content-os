## El ecosistema de email (ActiveCampaign)

**Cada marca tiene SU cuenta de AC y nunca se mezclan (Elvin, 23/sep):** Level Up =
`ACTIVECAMPAIGN_URL/KEY` (levelupmediapr17748); AI Borinquen = `ACTIVECAMPAIGN_URL_AIB/KEY_AIB`
(sin eso, todo lo de AIB es no-op). Igual con Calendly: el de LU va a `/api/calendly`, el de AIB a
`/api/aib/calendly`. `lib/activecampaign.ts` (`upsertContacto` v3: contacto + tags de contexto →
lista → tags `etapa:*`; `crearCampana` v1: newsletter como borrador o programado);
listas por marca en `AC_LISTA_LU|AIB|SO` (las crea `scripts/activecampaign.mjs setup`). Cables:
quiz (`/api/auditoria` → `origen:quiz`, `quiz:*`, `avatar:*`), Calendly (`/api/calendly` →
`origen:calendly`, `etapa:agendo|reagendo|cancelo`, marca por `CALENDLY_MARCA_AIB_REGEX`) y
aprobar newsletter (`/api/aprobar-entrega` → campaña programada jueves 8 AM PR; `NEWSLETTER_AUTO=draft`
para borrador). Blueprint en `data/email-ecosistema/blueprint.json`; copy de las secuencias en
`vault/proyectos/ecosistema/emails/<marca>/` (+ `data/email-ecosistema/<marca>.json` y la bandeja);
tarea `newsletter-semanal` (miércoles 9 AM, `/newsletter-semanal`). Las automatizaciones (secuencias)
se montan en la UI de AC: pasos en `vault/proyectos/ecosistema/emails/README.md`.
