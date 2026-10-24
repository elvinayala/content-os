# Remi · "Hazlo como este video" (referencias en video)

Elvin (o Max, o un cliente) pasa un Reel, TikTok, YouTube o un MP4 que le gusta. Remi lo **mira**, saca su
lenguaje (ritmo, cortes, paleta, tipo de movimiento, transiciones, audio) y arma un guion de NUESTRA fábrica con
ese lenguaje y la marca de quien lo pide. Se copia el **lenguaje**, nunca el contenido, los textos, las caras, la
música ni los logos de la referencia.

Motor: `motion/referencias/vision/` (de Motion Architect, MIT; ver `docs/oficio/NOTICES.md`). Corre en la Mac:
yt-dlp baja el video, ffmpeg saca cuadros por cambio de escena y trae los subtítulos si existen. Nada se sube.

## 1. Mirar el video
```bash
cd motion
python3 referencias/vision/setup.py --check                       # 0 = listo (ffmpeg + yt-dlp)
python3 referencias/vision/analyze.py "<url-o-mp4>" --engine local --no-whisper --out-dir <scratchpad>/ref
```
- Imprime las rutas de los cuadros (`frame_0001.jpg`, con su segundo): **léelos con Read**. Así se ve el video.
- Movimiento fino (para medir easing o un efecto): `--start 0:03 --end 0:06 --fps 8 --detail token-burner`.
- Cortes exactos:
  `ffmpeg -i <mp4> -vf "select='gt(scene,0.3)',showinfo" -vsync vfr <dir>/cut_%03d.jpg 2>&1 | grep -o "pts_time:[0-9.]*"`
- **Instagram** a veces pide sesión: agrega `--cookies-from-browser chrome` (usa la sesión del Chrome de la Mac).
- Siempre `--engine local` (sin Gemini). Transcribir el audio es opcional y necesita una llave en
  `~/.config/motion-architect/.env`; para analizar movimiento bastan los cuadros.
- Varios videos o muy largos: el subagente **`remi-referencia`** (uno por video, en paralelo).
- Los cuadros van al scratchpad, nunca a `motion/public/` ni al repo.

## 2. La ficha (motion spec)
Se guarda en `data/motion/referencias/<slug>.json`:
```json
{
  "fuente": "url o ruta", "duracion_s": 14.2, "formato": "9:16",
  "cortes_s": [0, 1.8, 3.1, 5.0], "seg_por_escena": 1.6,
  "ritmo": "rápido: escenas de 1.2–2 s, cortes en el beat",
  "paleta": ["#0E0E10 aprox.", "#F2F2F2", "#C6FF3D"],
  "tipografia": "grotesk pesada, mayúsculas, tracking apretado",
  "movimientos": ["texto entra por máscara de abajo", "zoom lento sobre producto", "tarjetas en stagger"],
  "easing_percibido": "ease-out fuerte, sin rebote",
  "transiciones": ["corte duro", "whip-pan"],
  "audio": "beat electrónico ~120 bpm, SFX en cada corte",
  "lo_que_hace_que_funcione": "una palabra por beat y contraste brutal",
  "traduccion": { "estilo": "impacto", "escenas": ["gancho", "lista", "numero", "cierre"], "musica": "…", "sfx": ["…"] }
}
```
No inventar: lo que no se ve va como `"N/A"`; los hex son aproximados y se dice.

## 3. Traducirla a la fábrica (lo importante)
La referencia NO se programa a mano: se escoge lo más cercano de lo que ya existe y, si falta algo de verdad,
se agrega a la fábrica (escena o estilo nuevo en `escenas.tsx`/`estilos.tsx`), así le sirve a todos los videos.

| Lo que se ve en la referencia | En la fábrica |
|---|---|
| Mayúsculas gordas, bloques de color, cortes secos, rápido | `estilo: "impacto"` |
| Revista: itálica, a la izquierda, números 01·02, calmado | `estilo: "editorial"` |
| Mucho aire, subrayado que se dibuja, fundidos lentos | `estilo: "minimal"` |
| Stickers, rebotes, iris circular, puntos | `estilo: "pop"` |
| Consola, cuadrícula, glitch, datos | `estilo: "tecno"` |
| Lanzamiento con halo, píldoras, barridos, brillo | `estilo: "neon"` |
| Una palabra o frase por golpe | `gancho` (y `*resaltado*`) |
| Número que sube / antes y después | `numero` · `comparativa` · `dato` |
| Lista de dolores o beneficios | `lista` · `pasos` · `roles` |
| Producto o app en pantalla | `pantalla` · `navegar` (captura REAL) |
| Teléfono, chats, llamadas | `notificaciones` · `chat` · `llamada` · `voz` · `agenda` |
| Personas hablando a cámara | `clip` · `collage` (rápido/calmado) · `cita` |
| Toma cinematográfica de fondo | `tomas` (Higgsfield, sin caras ni logos) |

- **Ritmo:** `seg_por_escena` manda la `dur` de cada escena (30 fps: 1.5 s = 45 frames). Si se oye el beat,
  `frames_por_beat = 1800 / bpm` y los cortes caen en múltiplos de eso.
- **Paleta:** la de la referencia solo inspira; los colores del video final son los de la marca o el cliente.
- **Música:** se describe el estilo y los BPM para `audio.mjs musica "…"`; nunca se baja la pista de la referencia.
- **Sonido:** librería CC0 en `public/sfx/` (`<Sfx src="sfx/impact/impactSoft_medium_001.ogg" />`); índice y
  qué tan "agudo" es cada uno en `docs/oficio/sfx-library.md`. Uno por evento importante, no por cada cosa que se mueve.

## 4. Antes de renderizar
Storyboard corto (escena · dur · texto · movimiento · transición · sonido; plantilla en `docs/oficio/storyboard.md`)
y luego el flujo normal: guion → `tsc` → render → hoja de contacto → revisión con `docs/oficio/review.md`.
En la entrega se dice qué se tomó de la referencia ("ritmo de 1.5 s y cortes secos del Reel de X").
