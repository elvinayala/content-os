## Pipeline de creadores para colaboraciones (`/creadores`, 21/sep/2026)

Elvin identifica creadores a ojo (10–15K seguidores con engagement orgánico real) y quiere un flujo
constante sin depender de él. `scripts/creadores.mjs` (`agregar @h --por --marca --nota` ·
`puntuar <raw.json>` · `lista [estado]` · `estado @h <estado> [--precio --formato --nota]` ·
`tabla-viernes`) mantiene el tablero `data/creadores.json` (`por-vetar → vetado → contactado →
cotizado → aprobado → publicado | descartado`); `puntuar` es el criterio de Elvin en 100 puntos sobre
la mediana de los últimos 12 posts (engagement, alcance de reels, conversación, actividad, tamaño
8–100K, PR; Tier A ≥ 70 / B ≥ 50 / C ≥ 35). `/creadores vetar|tabla|buscar` usa el MCP de Apify
(`apify/instagram-profile-scraper`, raw en `data/creadores/raw/`). Atajo en cualquier bot de Telegram:
`creador @a @b nota` → entra a por-vetar sin Claude. Tarea `creadores-vetar-diario` 8 AM lun–sáb
(viernes + tabla). Lis es la coordinadora (contacta, negocia, cotiza); Elvin aprueba la tabla del viernes.
Doc: `vault/proyectos/bori-crecimiento/pipeline-creadores.md`.
