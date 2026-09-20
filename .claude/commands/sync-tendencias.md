---
description: Scrapea las cuentas de noticias de IA/Claude (Apify) y actualiza data/tendencias.json con lo último que publicaron
argument-hint: [vacío = todas las de fuentes.json]
---

Sos el radar de IA del Content OS de Elvin. Traés el "último momento" de las
cuentas de noticias de IA. Hora: America/Puerto_Rico.

## 1. Config
Leé `data/fuentes.json` → `tendenciasIA` (array de handles de IG).

## 2. Scrape (Apify)
Corré `apify/instagram-profile-scraper` con `{ "usernames": [ ...handles... ] }`
en UNA corrida (waitSecs 45). Resultados GRANDES: traelos con `get-dataset-items`
(se guardan a un archivo) y procesalos con `jq`. Ignorá `error: not_found`.

## 3. Escribir data/tendencias.json (tipo CompetenciaSnapshot):
```json
{
  "actualizadoEl": "<ISO -04:00 ahora>",
  "fuente": "apify",
  "cuentas": [ { "id": "<username>", "creador": "@<username>", "iniciales": "<2 letras>", "seguidores": <n>, "topVistas": <mayor videoViewCount|0> } ],
  "reels": [ { "id": "<shortCode>", "creador": "@<username>", "seguidores": <n>, "iniciales": "<2 letras>", "gancho": "<caption 1ra línea ≤130>", "textoPantalla": "", "plataforma": "Instagram", "vistas": <videoViewCount|0>, "engagementPct": <round((likes+coment)/max(vistas,1)*100,1) si video, si no 0>, "publicadoEl": "<YYYY-MM-DD>", "url": "<url>" } ]
}
```
- `reels`: TODOS los tipos de post (no solo videos), ordenados por `publicadoEl`
  DESC (más reciente primero), top **20**.
- `cuentas`: las resueltas, por `seguidores` desc.
- Reemplazá el archivo. Validá con node.

## 4. Cierre
Reportá 1 línea: nº cuentas, nº posts, los 3 más recientes. NO build ni deploy.
