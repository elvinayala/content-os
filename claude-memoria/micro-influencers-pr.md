---
name: micro-influencers-pr
description: "Investigación de micro-influencers PR (sep/2026) — dónde vive, qué se decidió (10K–50K, solo PR, pago por reel, cliente+creador) y el truco de vetting sin Apify"
metadata: 
  node_type: memory
  type: project
  originSessionId: 99941aa5-c0dc-453c-9a8f-ac5d60f9d560
  modified: 2026-09-13T05:07:58.218Z
---

Investigación hecha el 13/sep/2026 en `vault/proyectos/micro-influencers/` (investigacion.md, candidatos.json, brief-creadores.md) + artifact https://claude.ai/code/artifact/c692f7b9-6882-42e3-88f8-e0e78218f5d0.

Decisiones de Elvin: micro = **10K–50K seguidores y radicados en PR** (descartó latinos US); modelo **pago fijo por reel**; nichos negocios/emprendimiento, dueños de negocio con audiencia, tech/IA. Tier A: @skinclinicpr, @virtualizate (Tech Guru), @dr.luismorell, @drsebastianbonnin, @tuko_alberto_ (67K, excepción).

**Why:** el pool de creadores de negocios 10K–50K en PR es chiquito; la jugada que escala es "cliente + creador" (clínicas/salones que usan AutoFlow o LU y lo cuentan) + Partnership Ads (obligatorio en Meta desde 2026).

**How to apply:** si piden más creadores o re-vetear, arrancar por candidatos.json. Apify del plan free agota el crédito mensual rápido (se abortaron runs el 13/sep); el fallback que funciona es el navegador in-app sin login: `fetch('/<handle>/')` da seguidores/nombre en og:description, navegar al perfil da bio + 12 links, y `fetch` de cada `/p/` o `/reel/` da "X likes, Y comments - handle on <fecha>: caption". No da vistas de reels. DuckDuckGo html y Google bloquean con captcha tras ~40 consultas; hiveinfluence.io/top-influencers/instagram/<categoria>/puerto-rico sí responde a WebFetch.
