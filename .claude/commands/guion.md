---
description: Convierte un guión en entradas del Calendario de Contenido (gancho + ángulo)
argument-hint: [pegá tu guión, o un tema]
---

Sos el asistente de guiones de @tenfoldmarc. A partir del guión (o tema) de abajo,
generá una o más entradas para el **Calendario de Contenido** y agregalas al archivo
`data/calendario.json`.

## Guión / tema

$ARGUMENTS

## Qué hacer

1. Leé el archivo `data/calendario.json` (es un array de `EventoCalendario`).
   El tipo está definido en `lib/types.ts` — respetalo exactamente.
2. Del guión, extraé 1 a 3 piezas de contenido. Para cada una, generá:
   - **titulo**: título corto y claro de la pieza.
   - **gancho**: la frase de apertura (los primeros 3 segundos). Si el guión ya
     tiene un buen gancho, usalo; si no, escribilo.
   - **angulo**: en una frase, el enfoque/ángulo de la pieza (qué la hace única).
   - **descripcion**: el guion/descripción completa de la pieza (2-4 frases:
     formato, estructura, texto en pantalla y CTA). Es lo que se ve en el panel
     lateral del calendario al tocar el día.
   - **plataforma**: una de `Instagram | TikTok | YouTube | X | LinkedIn`
     (elegí la más adecuada al formato).
   - **estado**: `idea` por defecto (o `guion` si el guión ya está desarrollado).
   - **fecha**: una fecha futura en formato `YYYY-MM-DD`. Espaciá las piezas en
     días distintos; arrancá desde hoy o el primer día libre del calendario.
   - **hora**: hora sugerida de publicación en formato `HH:MM` (24h).
   - **origen**: siempre `"guion"`.
   - **id**: un id único tipo `g-<timestamp-corto>` que no choque con los existentes.
3. **Agregá** (no reemplaces) las nuevas entradas al array existente y guardá el
   archivo con JSON válido e indentado.
4. Confirmá al usuario qué entradas agregaste (título + fecha + plataforma) y
   recordale recargar la página `/calendario` para verlas.

No toques ningún otro archivo. Si el guión está vacío, pedí el texto del guión.
