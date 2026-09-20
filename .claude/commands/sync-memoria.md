---
description: Alimenta la memoria compuesta — ingesta reuniones (Granola), llamadas y chats (Slack) nuevos, y extrae/enriquece las ENTIDADES (clientes, personas, temas, objeciones) como notas conectadas en vault/entidades/
argument-hint: [vacío = desde el cursor | "backfill" = reprocesar todo el vault existente]
---

Sos el **bibliotecario** de la memoria compuesta de Elvin. Corré DESPUÉS de
`/sync-vault` (que ya baja reuniones y el día de Slack a vault/reuniones/ y
vault/slack/). Tu trabajo NO es reescribir esas notas: es construir la **capa de
entidades** que las conecta y acumula contexto. Hora America/Puerto_Rico.

## 1. Qué procesar
- Normal: las notas de vault/reuniones/ y vault/slack/ **creadas/modificadas desde
  el último run** (compará contra `vault/.sync.json` → agregá clave `ultimaMemoria`).
- `backfill`: TODAS las notas de vault/reuniones/ + vault/slack/ (primera vez).
También leé objeciones ya extraídas de Zoom si hay snapshot (`data/*zoom*` o
`lib/zoom.ts`), y el cerebro en vault/ceo/.

## 2. Extraer entidades
De cada nota, identificá las ENTIDADES mencionadas (ya suelen venir como
[[wikilinks]]):
- **Clientes** (ej. Coralis, RK Automatic, Yaritza Amaral, Advanced Medical Billing…)
- **Personas del equipo/ecosistema** (Aure, Carilin, Juan Diego, estrategas…)
- **Temas** recurrentes (AutoFlow, precio, onboarding, churn, estabilidad, IA…)
- **Objeciones** ("está caro", "lo hago yo"…)
- **Wins / casos** (Tinos $30K→$100K, el terapista…)

## 3. Escribir/enriquecer vault/entidades/<slug>.md  (MERGE, NUNCA overwrite)
Una nota por entidad. Slug = nombre en kebab-case sin tildes (ej.
`yaritza-amaral.md`, `autoflow.md`, `objecion-esta-caro.md`). Estructura:
```
---
fecha: <YYYY-MM-DD del último toque>
fuente: memoria
unidad: <marca principal o ecosistema>
tags: [entidad, <cliente|persona|tema|objecion|caso>]
---
# <Nombre>

**Qué es:** <1-2 líneas>

## Resumen acumulado
<lo que sabemos, se va engordando en cada run — MERGE, no borres lo previo>

## Línea de tiempo
- <YYYY-MM-DD> — <qué pasó> ([[reunión o nota fuente]])
- ...

## Conexiones
[[otra-entidad]], [[otra-entidad]] — relación en 1 línea.
```
Reglas: si la nota ya existe, **agregá** las líneas nuevas a "Línea de tiempo" y
actualizá "Resumen acumulado" sin borrar lo viejo (dedup por fecha+hecho). Usá
[[wikilinks]] a otras entidades y a las notas fuente. Actualizá `fecha`.

## 4. Cursor + índice + deploy
- Actualizá `vault/.sync.json` con `ultimaMemoria: <ISO -04:00>`.
- Agregá las entidades nuevas a la sección correspondiente de `vault/indice.md`.
- Corré `bash scripts/deploy-snapshots.sh`.

Reportá: cuántas entidades nuevas y cuántas enriquecidas. NUNCA borres contexto
acumulado (MERGE estricto) ni dejes frontmatter inválido.
