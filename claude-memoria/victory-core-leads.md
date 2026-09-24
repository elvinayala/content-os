---
name: victory-core-leads
description: Cliente Néstor Nazario / Victory Core Property Services (limpieza de oficinas B2B, Fayetteville NC) — scrapper de leads simple (Claude + Apify + JSON), $500 setup + $147/mes, sin app ni DB; qué es, dónde vive, qué falta de Néstor
metadata:
  type: project
---

**Cliente:** Néstor Nazario Robles · **Victory Core Property Services** (limpieza de oficinas B2B, 100% virtual, arranca de cero en Fayetteville, NC). Vendido por AI Borinquen como "Asistente chat (scrapper)": **$500 setup + $147/mes**; lo corremos nosotros. NO es chat: solo descubre → perfila → busca decisor → califica (ICP) → entrega hot/qualified en CSV o su CRM. No llama, no escribe, no seguimiento, no precios (Néstor y sus vendedores manejan los leads).

**Decisión de Elvin (17-sep-2026):** *simple*. Yo había planeado un repo Next+Postgres clonado de Plagas PR y me frenó ("es un simple scrapper de Claude con Apify y ya"). Se hizo como `/prospectar`: slash command + `config.json` + JSON + scripts node sin deps. Mantenerlo así.

**Dónde vive (repo AGENTE CONTENIDO):** `.claude/commands/victory-leads.md` (`correr | estado | exportar | recalcular`), `data/victory-core/{config.json,cuentas.json,exports/}`, `scripts/victory-core/{ingerir,contactos,puntuar,exportar}.mjs`, fixtures en `tests/fixtures/victory-core/`, docs en `vault/proyectos/victory-core/{README,mensaje-nestor}.md`. Todo el criterio (territorios, industrias/búsquedas, exclusiones, taxonomía de decisores, ICP, pesos, umbrales, presupuesto $5/corrida–$40/mes, CRM) vive en `config.json`.

**Actores Apify:** `compass/crawler-google-places` (discovery, countryCode us), `braveleads/leads-finder-linkedin-apollo-leads-generator` (decisores por dominio, $0.002/lead), opcional `vulnv/email-validator`. ⚠️ El verificador `sumitr_mardy/email-verifier` necesita relay SMTP (Apify bloquea puerto 25) — no usarlo. ⚠️ Si Apify dice "Monthly usage hard limit exceeded" no es crédito: es el tope en Settings → Limits (pasó 17-18 sep; Elvin lo subió). **1ª corrida real 18-sep-2026:** 80 lugares property-mgmt → 62 cuentas → 1 HOT + 3 QUALIFIED (ISC seguros 8 oficinas, C&S, Block, Riddle) entregados en la hoja del día; ~5 % de rendimiento porque esa industria son casi todos realtors/PM residenciales. Para 20-25/día hay que scrapear ~400 lugares/día o entregar también nurture con contacto — pendiente decidir con Néstor. Costo ≈ $1/corrida.

**Scripts (todo en `scripts/victory-core/`):** ingerir (Maps→cuentas), sitios (baja webs), perfil (aplica perfiles de Claude), contactos (braveleads→decisores, mejores 3 por rol), puntuar (ICP), exportar (tope diario + CSV/Pipedrive/webhook), hoja (CSV para Néstor). braveleads exige `maxResults>=100` y devuelve `organizationSize`. Property managers se dimensionan por `nLocations`, no por nómina.

**Regla del manual de Néstor:** nunca inventar datos; cada campo con fuente/fecha/estado (verificado/conocido/estimado/desconocido); teléfonos nunca "verificado" en el piloto; rango de contrato solo con evidencia de tamaño.

**Entrega (decisión de Elvin 17-sep):** DIARIA a las 6 AM, 20-25 leads/día (`config.entrega`), tarea programada `victory-leads-diario` (cron 0 6, corre con la app abierta). Lugar donde Néstor los ve: carpeta Drive "Victory Core — Leads diarios" (id 1SF57v4ATxl1tfbBSNK9EO87zg1FgvgGL, adapter `drive`, una Google Sheet por día vía Drive MCP) — falta compartirla con su email. Fayetteville sola se agota en semanas a ese ritmo → ampliar `config.territorios`.

**Decisión final de Elvin (18-sep, tarde): la demo/entrega a Néstor es SOLO Google Sheet en la carpeta de Drive — NADA de Pipedrive.** Probé un pipeline "Victory Core — Leads" en el Pipedrive de AIB y lo borré completo (deals, personas, orgs, pipeline) el mismo día; `lib/pipedrive.ts` quedó intacto. Adapter `drive`, hoja por día. Limitación del conector de Drive: no puede editar una hoja existente, por eso es una hoja nueva por día dentro de la carpeta.

**Canal de pedidos de Néstor (18-sep):** hoja "Solicitudes" en la misma carpeta (id 13fKYVuxI6qzdxV8jMxWNi7IN4IAbUp71-yBdrusmFXs); la tarea diaria la lee antes de correr (Drive `read_file_content` devuelve la tabla), aplica lo que es config (`config.solicitudes.atendidas` = registro; el conector NO puede editar la hoja), CRM/desarrollo → DM a Carilin, confirmación a Néstor por Gmail cuando exista `config.cliente.email`. Guía "LÉEME — Cómo funciona tu agente de leads" (Google Doc) en la carpeta. Mensaje final en vault/proyectos/victory-core/mensaje-nestor.md.

**CRM (Néstor elige):** Pipedrive ~$14/mes (adapter listo: `PIPEDRIVE_VICTORY_TOKEN`, etapa "Lead calificado"), CRM propio vía webhook (`config.crm.webhookUrl`), o plan $247/$297 con GHL incluido (adapter no hecho). Mientras: CSV por corrida.

**Entrega (18-sep-2026):** Elvin decidió ENTREGARLE el desarrollo a Néstor para que lo corra con su propio Apify/Drive. Paquete autocontenido con git en `~/Documents/Claude/Projects/victory-core-leads/` (+ `victory-core-leads.zip` al lado): scripts, config sin nuestros ids, comando, README de instalación (Node 20 + Claude Code + conectores Apify/Drive + CRM opcional), fixtures y `npm test`. Mientras tanto nosotros seguimos corriendo la tarea diaria con **tope duro $2.50/día** (`config.presupuesto.diarioUsd`; 2 runs Maps × $1 + contactos $0.40). Si se cambia algo en el repo AGENTE CONTENIDO hay que replicarlo en el paquete.

**Falta de Néstor:** doc de segmentación, territorio confirmado, CRM + API key, roles decisor aceptados, idioma del brief, pago. Mensaje listo en `vault/proyectos/victory-core/mensaje-nestor.md`.
