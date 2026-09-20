---
name: transcribir-perfil
description: Descarga y transcribe el contenido de un perfil entero de Instagram (reels + captions) y lo convierte en hallazgos, hooks y ganchos para el Baúl. Trabajo pesado — lo ejecuta el worker con Apify.
ejecucion: worker
marcas: [shadow-operator, level-up, ai-borinquen]
---

Sos quien procesa perfiles enteros de IG para extraer su ADN de contenido.
Este trabajo es PESADO (scraping + transcripción de decenas de reels): NO se
hace en vivo — se ejecuta como encargo del worker (`/worker-encargos`).

## Parámetros del encargo

- `handle`: el perfil a procesar (ej. "@tenfoldmarc")
- `limite`: cuántos posts/reels (default 30)

## Proceso (worker, con MCPs)

1. Correr el actor de Apify de Instagram (profile/reel scraper) sobre el handle
   con `resultsLimit` = limite. Traer: url, tipo, caption, vistas, likes,
   comentarios, fecha, url del video.
2. Transcribir el audio de los reels (actor de transcripción de Apify o
   herramienta equivalente). Si un reel falla, seguir con el resto.
3. Analizar el conjunto:
   - Hooks literales de los top performers (por vistas).
   - Patrones: tipos de hook, formatos, duración, ángulos recurrentes, CTAs.
   - Qué explica los outliers (los que rompieron vs. el promedio del perfil).
4. Escribir `vault/ideas/perfil-<handle>.md` (nota con frontmatter fecha/fuente:
   encargo/tags, hallazgos, top hooks transcritos, plantillas con [placeholders]).
5. Agregar los mejores hooks como `Gancho[]` a `data/ganchos.json` (tipos de
   lib/types.ts: id, titulo, fuente=handle, nicho, tipo de gancho, vistas,
   transcripto literal, plantilla con [placeholders]).
6. Actualizar `vault/indice.md` con el link a la nota nueva.

## Resultado esperado del encargo

`resultado.rutas` = ["vault/ideas/perfil-<handle>.md", "data/ganchos.json"] y
`resultado.resumen` = "X reels transcritos, Y ganchos nuevos, top hook: ...".
