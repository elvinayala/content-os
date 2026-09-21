---
description: Pipeline de creadores para colaboraciones — veta con Apify los @handles que Elvin/Lis agregan (por Telegram o a mano), los puntúa con el criterio de Elvin y mantiene el tablero data/creadores.json; "tabla" arma la tabla del viernes para su OK
---

# /creadores — vetar y mover el pipeline de creadores

Argumento: `$ARGUMENTS` = `vetar` (default: procesa todos los `por-vetar`) · `vetar @a @b` ·
`tabla` (la tabla del viernes) · `buscar <nicho|hashtag|municipio>` (descubrir candidatos nuevos).

## Contexto
Elvin (21/sep/2026): "hay creadores que tú no estás encontrando: 10–15K seguidores pero con
engagement orgánico bueno, hablan bonito, tienen estilo. No podemos subestimarlos." El ojo de
Elvin está codificado en `scripts/creadores.mjs puntuar` (engagement mediano, alcance de reels,
conversación, actividad, tamaño 8–100K, PR). El tablero es `data/creadores.json`
(`por-vetar → vetado → contactado → cotizado → aprobado → publicado`, o `descartado`).
Lis es la coordinadora de colaboraciones (piloto desde el 22/sep); Elvin aprueba las cotizaciones.

## vetar
1. `node scripts/creadores.mjs lista por-vetar` → handles pendientes (o los que vienen en el argumento).
2. Con el MCP de Apify corré `apify/instagram-profile-scraper` con `{ "usernames": [...] }` (todos en
   UNA corrida, waitSecs 45; ~$0.003 por perfil). Los ítems son grandes: bajalos con
   `get-dataset-items` a archivo y guardá cada perfil en `data/creadores/raw/<handle>.json`
   (con `jq` desde el archivo; no los leas enteros en contexto).
3. `node scripts/creadores.mjs puntuar data/creadores/raw/<handle>.json …` → imprime el resumen por
   creador y actualiza el tablero (vetado / descartado).
4. Mirá con tu criterio lo que los números no ven (abrí 2–3 posts de los Tier A/B): ¿habla bonito,
   tiene estilo propio, su audiencia es dueños de negocio de PR? Anotalo con
   `node scripts/creadores.mjs estado @h vetado --nota "…"` si cambia la lectura.
5. Avisá por Telegram (`node scripts/telegram-bot.mjs enviar "…"`) con UNA línea por creador
   (`@handle · seg · ER · Tier · alerta`) y a Lis por Slack (`node scripts/agentes.mjs slack Lis "…"`)
   solo los Tier A/B con el siguiente paso: contactar.

## tabla
`node scripts/creadores.mjs tabla-viernes` → mandáselo a Elvin por Telegram tal cual. Si no hay
cotizaciones, decile cuántos hay contactados y a quién le falta respuesta.

## buscar
Descubrir candidatos que nadie propuso todavía. Con Apify `apify/instagram-hashtag-scraper` o
`apify/instagram-scraper` (search por hashtag/lugar: `#emprendedorespr`, `#negociospr`,
`#puertorico` + nicho, municipios), traé los autores de los posts con más interacción relativa,
filtrá 8K–100K seguidores y agregalos con `node scripts/creadores.mjs agregar @… --por sistema
--nota "hashtag X"`. Después corré `vetar`. Tope: 20 candidatos por corrida.

## Reglas
- Nunca contactar a un creador desde acá: eso lo hace Lis (o Elvin). Este comando solo veta y ordena.
- No inventar números: si Apify falla para un perfil, dejalo en `por-vetar` con nota del error.
- Tuteo de Puerto Rico en todo lo que se manda.
