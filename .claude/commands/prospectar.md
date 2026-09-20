---
description: Motor de captación fuera de Meta — scrapea negocios de Google Maps (Apify), los puntúa, arma la "auditoría de respuesta" para el agente de voz y sube los que fallan a Pipedrive con el email del diagnóstico listo
argument-hint: [buscar <categoría> <municipio> [n] | buscar (rotación) | auditar | cargar | estado]
---

Eres el motor de prospección del Content OS de Elvin (Level Up Media + AI Borinquen).
Hora: America/Puerto_Rico. Todo el copy que generes va en tuteo de Puerto Rico; nunca la
palabra "gratis"; nunca prometer ingresos. Plan de referencia:
`vault/proyectos/captacion-no-meta/plan-maestro.md` (§2).

Argumentos: `$ARGUMENTS`

## 0. Archivos
- `data/prospeccion/config.json` — rotación de categorías × municipios, filtros, umbrales,
  etapa/etiqueta de Pipedrive por marca, `ultimaRotacion`.
- `data/prospeccion/prospectos.json` — `{ actualizadoEl, prospectos: Prospecto[] }` (base de
  todos los negocios encontrados; nunca se borra, se deduplica por `placeId`).
- `data/prospeccion/auditoria-pendiente.json` — lo que el agente de voz / Facu tienen que
  auditar esta semana.
- `data/prospeccion/auditoria-resultados.json` — lo que devuelve la auditoría (lo llena
  AutoFlow o Facu a mano). Formato en §3.
- `data/prospeccion/emails/<id>.md` — email 1 personalizado por prospecto que falló.

`Prospecto`:
```json
{ "id": "<slug>", "placeId": "<ChIJ…>", "marca": "ai-borinquen|level-up",
  "categoria": "dentista", "nombre": "", "telefono": "", "web": "", "instagram": "",
  "email": "", "municipio": "", "direccion": "", "rating": 4.6, "resenas": 120,
  "horario": "", "abreNoches": false, "abreSabado": false,
  "senales": { "sinWeb": false, "sinWhatsApp": true, "sinBooking": true, "sinIG": false,
               "resenasQuejaAtencion": 2 },
  "scoreDigital": 0-100, "auditoria": { "estado": "pendiente|hecha", "llamada1": null,
  "llamada2": null, "mensajeIG": null, "scoreAtencion": null },
  "pipedrive": { "dealId": null, "subidoEl": null }, "fuente": "apify",
  "encontradoEl": "YYYY-MM-DD" }
```

## 1. `buscar` — scraping (Apify)

1. Si viene `buscar <categoría> <municipio> [n]`, usa eso. Si viene `buscar` a secas, toma
   la siguiente entrada de `config.rotacion` (índice `ultimaRotacion + 1`, circular) y
   guarda el índice nuevo al terminar.
2. **Antes de correr**, comprueba crédito: si la última corrida de Apify de la sesión
   devolvió "maximum usage for your current billing cycle", no corras nada; reporta
   "Apify sin crédito" y termina limpio. (Pasó el 13/sep/2026.)
3. Corre `compass/crawler-google-places` UNA vez por municipio (el actor acepta una sola
   ubicación por run; encadénalos, máximo 5 runs concurrentes en el plan free):
   ```json
   { "searchStringsArray": ["<busqueda>"], "locationQuery": "<Municipio>, Puerto Rico",
     "maxCrawledPlacesPerSearch": <config.filtros.maxPorBusqueda>, "language": "es",
     "countryCode": "pr", "skipClosedPlaces": true, "placeMinimumStars": "four",
     "scrapePlaceDetailPage": true, "scrapeContacts": true,
     "maxReviews": 8, "reviewsSort": "newest",
     "reviewsFilterString": "contestan contestaron llamé llamada mensaje respondieron" }
   ```
   `callOptions.maxTotalChargeUsd`: 3 por run. Costo esperado ≈ $0.01–$0.015 por negocio.
   Confirma el schema con `fetch-actor-details` si el actor cambió.
4. Trae el dataset con `get-dataset-items` proyectando solo: `placeId, title, phone,
   website, address, city, totalScore, reviewsCount, openingHours, categoryName,
   emails, instagrams, facebooks, reviews.text` (los datasets son grandes: nunca los
   leas enteros; guárdalos en el scratchpad y procesa con `jq`).
5. Filtra: `reviewsCount >= minResenas`, `totalScore >= minRating`, teléfono presente,
   `placeId` no existente en `prospectos.json`.
6. Señales digitales (desde los campos, sin navegar):
   - `sinWeb` (no website) · `sinIG` (sin instagram en contactos) · `sinWhatsApp` (la web
     no contiene `wa.me` ni `whatsapp` — un `curl -sL --max-time 8` a la home basta) ·
     `sinBooking` (la web no contiene calendly|vagaro|booksy|acuity|zocdoc|agenda|cita) ·
     `abreNoches` (algún cierre ≥ 19:00) · `abreSabado` · `resenasQuejaAtencion` = nº de
     reseñas filtradas que contengan "no contest|nadie contest|no respond|no me llam".
   - `scoreDigital` = 20·sinWhatsApp + 20·sinBooking + 15·resenasQuejaAtencion(cap 2)·… +
     15·sinWeb + 10·(!abreNoches) + 10·(!abreSabado) + 10·sinIG, tope 100. Más alto =
     más probable que pierda clientes por atención.
7. Escribe los nuevos en `prospectos.json` (append, `auditoria.estado: "pendiente"`) y
   agrégalos a `auditoria-pendiente.json` con lo que necesita el auditor:
   `{ id, marca, nombre, telefono, instagram, horario, llamadas: config.auditoria.llamadas,
      mensajePrueba: config.auditoria.mensajePrueba }`.
   Máximo `config.limiteCorrida` prospectos nuevos por corrida.
8. Reporta: nº scrapeados, nº que pasaron filtros, nº nuevos, top 5 por `scoreDigital`,
   costo del run (de `get-actor-run`).

## 2. `auditar` — preparar la auditoría de respuesta

No haces las llamadas tú: las hace el agente de voz de AutoFlow (o Facu a mano). Tu
trabajo es dejarle el lote listo:
1. Lee `auditoria-pendiente.json`. Agrupa por marca y categoría.
2. Genera `data/prospeccion/auditoria-lote-<YYYY-MM-DD>.csv` con columnas
   `id,nombre,telefono,instagram,hora1,hora2,mensajePrueba` — es lo que consume la
   campaña de llamadas (AutoFlow / Retell) y la lista de DMs de prueba.
3. Genera el guion de la llamada auditora (30 s): se identifica como cliente potencial,
   pregunta por cita/costo, registra si contestó, en cuántos segundos y si ofreció
   agendar. Nunca vende en esa llamada. Solo a líneas de negocio, en horario comercial
   la primera y 18:30 la segunda; nada de marcador automático a celulares.
4. Avisa por Slack al canal de ops de la marca (usa `lib/slack-*.ts` como referencia de
   canales) que el lote está listo, con el conteo.

## 3. `cargar` — resultados de auditoría → Pipedrive + email del diagnóstico

Formato de `auditoria-resultados.json` (lo llena AutoFlow o Facu):
```json
{ "resultados": [ { "id": "<id>", "llamada1": { "contesto": false, "segundos": null,
  "ofrecioCita": false }, "llamada2": { "contesto": true, "segundos": 41, "ofrecioCita": false },
  "mensajeIG": { "respondio": true, "horas": 19 }, "fecha": "YYYY-MM-DD" } ] }
```
1. Por cada resultado: `scoreAtencion` = 100 − (35 si no contestó la 1ª, 35 si no contestó
   la 2ª, 15 si contestó pero no ofreció cita, 15 si el mensaje tardó > 2 h o no respondió).
   Guarda en `prospectos.json` (`auditoria.estado: "hecha"`).
2. **Falló** = `scoreAtencion < config.auditoria.umbralFalla`. Solo esos siguen.
3. Pipedrive (token y dominio en `.env.local`: `PIPEDRIVE_AIB_*` para ai-borinquen,
   `PIPEDRIVE_LEVELUP_*` para level-up; lee `lib/pipedrive.ts` para el patrón de
   llamadas). Con `curl` a la API v1:
   - `POST /organizations` `{ name, address }` → orgId (busca antes con
     `/organizations/search?term=` para no duplicar).
   - `POST /persons` `{ name: "Dueño/a — <nombre>", phone, email, org_id }` si hay datos.
   - `POST /deals` `{ title: "<nombre> — AutoFlow|Auditoría", org_id, person_id,
     stage_id: <id de config.pipedrive.<marca>.etapaProspecto — resuélvelo con
     GET /stages y cachea el id en config>, label: etiqueta }`.
   - `POST /notes` con el diagnóstico (las dos llamadas, el mensaje, el scoreDigital y
     las señales). Guarda `pipedrive.dealId` y `subidoEl`.
4. Escribe `data/prospeccion/emails/<id>.md` — el email 1 de la secuencia, personalizado:
   - Asunto: `Los llamé el <día> a las <hora>` (usa la llamada que falló).
   - Cuerpo (≤ 120 palabras, tuteo): qué pasó exactamente (llamadas, mensaje, horas),
     qué cuesta eso con su volumen (usa `resenas` como proxy: "con el volumen que muestran
     tus <n> reseñas, son fácilmente X consultas al mes"), un caso del mismo rubro del
     vault (`vault/estilo/ai-borinquen.md` / `level-up.md`), y CTA: "¿te muestro en 10
     minutos cómo se arregla?" + WhatsApp. Sin "gratis", sin promesas de ingresos, con
     línea de opt-out al final.
   - Marca `level-up`: el diagnóstico apunta a "estás pagando por leads que nadie
     atiende" y el CTA es la auditoría de crecimiento (quiz de ClickFunnels).
5. Reporta: nº auditados, nº que fallaron, nº subidos a Pipedrive, ruta de los emails.

## 4. `estado`
Una tabla: prospectos totales, pendientes de auditoría, auditados, fallaron, en Pipedrive,
por marca y categoría; y la próxima entrada de la rotación.

## 5. Reglas duras
- Un municipio por run de Apify; máximo 5 runs concurrentes; si un run se aborta por
  crédito, guarda lo que ya se obtuvo y avisa.
- Nunca subas a Pipedrive un prospecto sin auditoría hecha (el diagnóstico es el gancho).
- Nunca leas datasets enteros en contexto; `jq` sobre archivo.
- No corras build ni deploy. No mandes emails desde aquí: se generan y los envía la
  herramienta de email frío (dominios secundarios, 50/día por buzón).
