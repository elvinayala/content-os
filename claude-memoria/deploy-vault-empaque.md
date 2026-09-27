---
name: deploy-vault-empaque
description: 27/sep/2026 — el deploy de Vercel falló por ENOSPC porque next.config metía TODO vault/ (~194 MB de videos/zips) en cada función; ahora solo vault/**/*.md
metadata:
  type: project
---
`outputFileTracingIncludes` en `next.config.ts` tenía `"./vault/**"` para todas las rutas: con el kit de Resuelto (videos, zips, PDFs) el vault pesaba ~194 MB sin node_modules, y cada función cargaba eso → deploy "Deploying outputs…" 8 min y ENOSPC (27/sep), además de arranques lentos (Ritmo "se queda pensando" al cambiar de tab).

**Why:** la app en runtime solo lee notas `.md` del vault (lib/vault.ts, cerebros de Sofi/Leo, memoria).
**How to apply:** el trace quedó en `./vault/**/*.md` (~2 MB) + excludes de `vault/**/node_modules` y `.netlify`. Si alguna función nueva necesita leer otro tipo de archivo del vault, agrégalo por ruta específica, nunca `vault/**` completo. Los medios pesados van a Storage o `public/`, no al vault. Ver [[ritmo-desempeno]].
