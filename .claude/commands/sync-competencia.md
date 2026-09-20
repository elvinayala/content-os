---
description: Scrapea los perfiles de IG de los referentes/competencia (Apify) y actualiza data/competencia.json con análisis por referente (60 días)
argument-hint: [vacío = todos los de fuentes.json]
---

Sos el analista de competencia del Content OS de Elvin. Actualizás el rastreador
de referentes con un ANÁLISIS por cada uno (no solo un ranking). Hora: America/Puerto_Rico.

## 1. Config
Leé `data/fuentes.json` → `competencia` (array de handles de IG).

## 2. Scrape (Apify)
Con el MCP de Apify, corré `apify/instagram-profile-scraper` con
`{ "usernames": [ ...todos los handles... ], "resultsLimit": 40 }` en UNA corrida
(waitSecs 60). Los resultados son GRANDES: NO los leas enteros — traelos con
`get-dataset-items` (se guardan a un archivo) y procesalos con `jq`. Ignorá los
que devuelvan `error: not_found`.

Campos por post en `latestPosts[]`: `type`, `productType` ("clips"=reel),
`videoViewCount`, `likesCount`, `commentsCount`, `timestamp`, `url`, `caption`,
`shortCode`. Del perfil: `username`, `fullName`, `followersCount`, `biography`.

## 3. Filtrar y analizar (ventana 60 DÍAS)
- Quedate SOLO con reels (`productType == "clips"`) con `videoViewCount > 0` y
  `timestamp` dentro de los últimos **60 días**.
- Por cada reel, clasificá (mirando el `caption`):
  - **`angulo`**: uno de `problema | solución | autoridad | contraste | storytime |
    lista | contrarian | resultado | tutorial-rápido` (el que mejor describa el hook).
  - **`formato`**: uno de `talking head | B-roll narrado | tutorial | carrusel-reel |
    voz en off | reacción | entrevista | text-on-screen` (inferilo del caption/tipo).
  - `engagementPct` = round((likes+comentarios)/max(vistas,1)*100, 1).
- Por cada referente, quedate con sus **TOP 6 reels por vistas** (de los 60 días).

## 4. Escribir data/competencia.json (`CompetenciaSnapshot`)
```json
{
  "actualizadoEl": "<ISO -04:00 ahora>",
  "fuente": "apify",
  "cuentas": [
    { "id": "<username>", "creador": "@<username>", "nombre": "<fullName>",
      "iniciales": "<2 letras>", "seguidores": <n>,
      "topVistas": <mayor videoViewCount 60d>,
      "reelsAnalizados": <cuántos reels 60d>,
      "vistasPromedio": <promedio de vistas de sus reels 60d>,
      "engagementProm": <promedio de engagementPct>,
      "postsPorSemana": <round(reels60d / 8.57, 1)>,
      "mejorFormato": "<el formato de su reel más visto>",
      "mejorAngulo": "<el ángulo de su reel más visto>",
      "queAprender": "<1 frase concreta: qué le funciona y qué copiarle>" }
  ],
  "reels": [
    { "id": "<shortCode>", "creador": "@<username>", "seguidores": <n>,
      "iniciales": "<2 letras>", "gancho": "<caption 1ra línea ≤120>",
      "textoPantalla": "", "plataforma": "Instagram", "vistas": <videoViewCount>,
      "likes": <likesCount>, "comentarios": <commentsCount>,
      "engagementPct": <n>, "angulo": "<...>", "formato": "<...>",
      "publicadoEl": "<YYYY-MM-DD>", "url": "<url>" }
  ]
}
```
- `cuentas`: una por handle resuelto, ordenadas por `vistasPromedio` desc.
- `reels`: los TOP 6 por referente (todos juntos en el array; la UI los agrupa por creador).
- Reemplazá el archivo completo. Validá con node.

## 5. Cierre
Reportá 1 línea: nº referentes, nº reels totales, y 2-3 aprendizajes clave. NO corras build ni deploy.
