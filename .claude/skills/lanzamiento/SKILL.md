---
name: lanzamiento
description: Video de lanzamiento de 15–25 s de una plataforma nuestra (Ritmo, Pulse, Leads, Bori, 1000X, la app de clientes…), de una función nueva o de la web de un cliente o prospecto, con la marca real, música y el texto para publicar. Es el /brag de la casa con las reglas de Elvin. Usar cuando pidan "video de lanzamiento", "/brag", "presenta esta plataforma", "anuncia esta función", "un video de la web de X" o "tabla de clientes → un video por cada uno".
---

# Lanzamientos · el /brag de la casa (12/oct/2026)

Elvin vio a @soyenriquerocha ("Motion con Opus 5.5": Remotion + Hyperframes + Brag) y pidió tenerlo todo, mejorado.
Las tres piezas están instaladas; esta skill decide cuál usar y le pone NUESTRAS reglas. Brag solo no sabe de marcas,
registro, datos verificados ni de no enseñar datos de clientes: aquí sí.

## 1. Qué motor
| Pedido | Motor | Cómo |
|---|---|---|
| Lanzar una plataforma o función nuestra (código en este repo o en `~/bori-demo`, `~/ritmo-demo`…) | **Brag** (`/brag-slim`, plugin instalado) con Hyperframes | Seguir sus pasos (inspeccionar → `brag-plan.md` → construir → revisar → render) con las reglas de §2. Trabajar en `estudio-html/<slug>/`, no en la raíz del repo. |
| Video de la **web** de un cliente o prospecto | **Brag** con la URL, o el workflow `product-launch-video` de Hyperframes | Captura la web real (logo, colores, fuentes, textos) y anima eso. |
| Pieza de marca (anuncio, testimonio, motion de cliente) | **Remi** (`motion/`, skill `motion-graphics`) | La fábrica: guion en JSON → nube. |
| **Muchos videos iguales con datos distintos** (bienvenida a cada cliente, un video por servicio, por pueblo…) | **Remi en lote** | `node scripts/remi.mjs lote <tabla.csv | URL de Sheets> --plantilla <guion.json> [--id-columna <col>] --probar` y luego sin `--probar`. Plantillas en `data/motion/plantillas/` (`{{Columna}}`, `{{Columna|defecto}}`). |
| La lista de tomas exacta y en HTML (control total) | **Hyperframes** directo | `estudio-html/LEEME.md`. |

## 1b. Si eres Max (o cualquier agente en la nube, sin navegador ni permiso para crear archivos)
Brag no está en tu contenedor. Haces lo mismo así:
- **Lote:** `node scripts/remi.mjs lote "<link de Google Sheets>" --plantilla data/motion/plantillas/<x>.json --id-columna <col> --probar`
  (o las filas pegadas: `node scripts/remi.mjs lote - --plantilla '<JSON>' … <<'CSV' … CSV`). SIEMPRE primero `--probar`;
  si sale limpio, lo mismo sin `--probar` con `--cliente <slug> --proponer` o `--entregar --marca <m>`.
- **Lanzamiento:** lee `estudio-html/ritmo-lanzamiento/index.html` (ejemplo que funciona), escribe TU composición (misma
  estructura: `data-composition-id="main"`, cada escena un `.clip` con `data-start`/`data-duration`, un timeline de GSAP en
  pausa en `window.__timelines["main"]`, imágenes como `assets/<nombre>`) y renderízala en la nube:
  `node scripts/remi.mjs html --id <id> --asset logo.png=<url> --asset musica.mp3=repo:<ruta> … --cliente <slug> --proponer <<'HTML' … HTML`
  (~30–60 s). Revisa el resultado antes de proponerlo.

## 2. Reglas de la casa (no se negocian)
1. **Registro:** Level Up, Bori, Ritmo, 1000X → tuteo de Puerto Rico. AI Borinquen en anuncios → de usted. Nunca voseo,
   nunca "gratis", nunca prometer ingresos. 1000X: SIMULACIÓN + aviso de riesgo.
2. **Nada inventado.** Números, testimonios y casos solo los verificados (`vault/estilo/<marca>.md`, `demos/kit-propuestas/testimonios.json`).
   Level Up: piezas sin precio. AI Borinquen no es solo "contestar mensajes" (agentes personalizados, capacitación, digitalización).
3. **Nunca datos reales en pantalla.** Las plataformas internas (Pulse, Leads, Ritmo, la app de clientes) tienen clientes, salarios
   y teléfonos: grabar SIEMPRE en una copia con datos ficticios (`~/ritmo-demo` puerto 3140, `~/bori-demo` puerto 3150) o con
   datos marcados como ejemplo. Nunca producción.
4. **Marca real:** logos de `public/marcas/` y `motion/public/marcas/`; el de un cliente, de SU web o su ficha. Sin logo real, sin logo.
5. **Música:** la nuestra (`node motion/scripts/audio.mjs musica "<estilo, BPM, sin voz>" --seg 30`, normalizar a −15 LUFS).
   Las pistas que trae Brag (ende.app) no tienen licencia documentada: solo para borradores internos, nunca en algo que se publique o se pauta.
6. **Privacidad:** Hyperframes siempre con `HYPERFRAMES_NO_TELEMETRY=1 DO_NOT_TRACK=1`. **Nunca `hyperframes publish`** (sube el
   proyecto a HeyGen) ni letsbrag.app (manda la web a un tercero).
7. **Formato:** 16:9 para presentar y YouTube, 9:16 para reels; AI Borinquen en anuncios solo 16:9. 18–22 s es el punto.

## 3. Revisar antes de entregar
Cuadros de cada escena y de mitad de cada transición (`ffmpeg -ss <t> -frames:v 1`): nada cortado, texto legible el tiempo
suficiente (~0,3 s por palabra), contraste, logo fiel, acentos bien. En Hyperframes, `npm run check` sin errores.

## 4. Entregar
```bash
node motion/scripts/entregar.mjs <video.mp4> --marca <level-up|ai-borinquen|bori|ritmo|1000x> --titulo "…" --formato "lanzamiento 16:9 · 20 s"
```
Queda en la bandeja de Entregas (y suma a Remi en el Equipo digital). Mandarle el MP4 y el texto para publicar (1–3 frases,
del mismo tono, sin "estamos emocionados de anunciar") a Elvin. **Publicar o pautar lo decide Elvin.**
