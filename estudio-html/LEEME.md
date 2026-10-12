# Estudio de video en HTML · Hyperframes (12/oct/2026)

Elvin vio el carrusel de @soyenriquerocha ("Motion con Opus 5.5": Remotion + Hyperframes + Brag) y pidió tenerlo todo,
mejorado. Esta carpeta es el **segundo motor** de video, al lado de Remi (`motion/`, Remotion):

| Motor | Cuándo |
|---|---|
| **Remi / Remotion** (`motion/`) | Todo lo de marca: fábrica de anuncios, testimonios, motion de clientes, **lotes desde una tabla** (`remi.mjs lote`). Renderiza en la nube (Railway). |
| **Hyperframes** (esta carpeta) | Cuando el video sale de HTML/CSS real: una landing, la propia app, una pieza con la lista de tomas exacta. Renderiza en la Mac (6 s ≈ 11 s). |
| **Brag** (plugin de Claude Code) | Video de lanzamiento de 20 s de un proyecto o una web en un comando. Usa Hyperframes por debajo. Ver la skill `lanzamiento`. |

- Instalado: `hyperframes@0.8.150` fijo en `package.json` (Node ≥ 22, ffmpeg). Skills de Hyperframes para Claude en
  `~/.claude/skills/hyperframes*` y `product-launch-video` (`npx hyperframes skills update …`).
- **Proyecto nuevo:** `cd estudio-html && npx hyperframes init <nombre> --example blank --non-interactive --resolution landscape|portrait|square`,
  luego quitarle el script `publish` de su `package.json` (ver abajo). Ejemplo funcionando: `ejemplo-lu/` (6 s, marca Level Up).
- **Revisar y renderizar:** `npm run check` (lint + layout + movimiento + contraste) y `npm run render -- -o salida.mp4`.
- **Privacidad:** siempre con `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1` (ya va en los scripts). **Nunca `hyperframes publish`**:
  sube el proyecto a los servidores de HeyGen. Los videos se entregan como siempre: `node motion/scripts/entregar.mjs <mp4> --marca … --titulo …`.
- Los renders (`*.mp4`) y `node_modules` no van a git ni a Vercel/Railway.
- **Ojo al actualizar:** `npx hyperframes skills update` reescribe `~/.claude/skills/hyperframes` y `product-launch-video`. Sus
  descripciones se acotaron a mano (12/oct) para que no se apropien de "cualquier video" y le quiten el trabajo a Remi;
  después de actualizar, volver a acotarlas.
