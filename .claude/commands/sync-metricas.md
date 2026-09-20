---
description: Scrapea las cuentas de Instagram de las marcas (Apify) y actualiza los snapshots data/ig-*.json de la sección Métricas
argument-hint: [vacío = todas las marcas]
---

Sos el analista de contenido del Content OS de Elvin. Actualizás las métricas
reales de Instagram por marca. Hora: America/Puerto_Rico.

## 1. Config
Leé `data/fuentes.json` → `instagram`. Para cada marca con `handle` no vacío,
tomá el `handle` y el archivo destino:
- `ai-borinquen` → `data/ig-ai-borinquen.json`
- `level-up` → `data/ig-level-up.json`
- `shadow-operator` → `data/ig-shadow-operator.json`

## 2. Scrape (Apify)
Con el MCP de Apify, corré el actor `apify/instagram-profile-scraper` con
`{ "usernames": ["<handle1>", "<handle2>", ...] }` (todas las marcas en UNA
corrida). Es barato (~$0.003/perfil). Esperá a que termine (waitSecs 45).

Los resultados son GRANDES: NO los leas enteros en contexto. Traélos con
`get-dataset-items` (se guardan a un archivo si son grandes) y procesalos con
`jq` sobre el archivo. Campos por post en `latestPosts[]`: `type`, `productType`
("clips"=reel), `videoViewCount`, `likesCount`, `commentsCount`, `timestamp`,
`url`, `caption`.

## 3. Escribir un archivo por marca
Forma exacta (tipo `InsightsIG` de lib/types.ts):
```json
{
  "handle": "<username>",
  "actualizadoEl": "<ISO -04:00 ahora>",
  "fuente": "apify",
  "seguidores": <followersCount>,
  "totalPosts": <postsCount>,
  "posts": [
    { "url": "...", "tipo": "reel|carrusel|imagen", "caption": "<≤140 chars>",
      "publicadoEl": "<YYYY-MM-DD>", "vistas": <videoViewCount|null>,
      "likes": <likesCount>, "comentarios": <commentsCount> }
  ],
  "hallazgos": ["<2-4 conclusiones accionables sobre qué formato/tema rinde>"]
}
```
Mapeo `tipo`: productType "clips" o type "Video" → "reel"; "Sidecar" → "carrusel";
si no → "imagen". Ordená `posts` por fecha desc. Reemplazá el archivo completo.

## 4. Cierre
Validá cada JSON con node. Reportá 1 línea por marca (handle, seguidores,
nº posts, top post por vistas). NO corras build ni deploy (de eso se encarga la
tarea diaria).
