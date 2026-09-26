---
name: ai-video-editor
description: "AI Video Editor (`ave`) — repo propio en ~/ai-video-editor, cerebro Claude + brazos FFmpeg; estado, decisiones y gotchas del MVP (16/sep/2026)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 11dd585d-9f78-448a-bf8a-62785c9be54f
  modified: 2026-09-17T13:44:33.199Z
---

**AI Video Editor → AI Creative Editor**: agente que convierte footage raw (talking-head, reels,
ads, VSL) en video 80–95 % terminado; el humano supervisa. Métrica: tiempo humano ahorrado.
Repo propio: `~/ai-video-editor` (Python 3.12 + uv, paquete `ave`, CLI `uv run ave …`).
Plan aprobado: `~/.claude/plans/proyecto-ai-video-editor-effervescent-pnueli.md`. Leer `CLAUDE.md` y
`docs/adr/` del repo antes de tocar nada.

**Decisiones (16/sep/2026):**
- Motor: **FFmpeg** por subprocess, render por stages con caché; DaVinci solo como carril premium vía
  OTIO (Resolve 21.1 movió Python a Studio $295; sin API de keyframes). CapCut descartado (sin API, no
  exporta sin GUI). Remotion/HyperFrames reservados para captions premium.
- STT: **WhisperX local** (large-v3, alineación forzada), fallback fal.ai Whisper (key de Bori) y
  ElevenLabs Scribe. Nunca gpt-4o-transcribe.
- Cerebro: `claude-opus-5` con `messages.parse` (structured output sobre índices de palabra); ≈$0.04
  por video de 35 s. Reencuadre con YuNet de OpenCV (Apache; MediaPipe opcional), no YOLO (AGPL).
- **El editor de Bori NO se usa como base** (solo zooms+captions, sin cortes/audio/reencuadre, 2 de 17
  clientes lo usaron). Se portaron 3 reglas: ritmo de zooms, keyword pop, corte alineado a palabra.
  Cuando `ave` demuestre calidad, Bori pasa a consumirlo como servicio (fase 5).

**Estado MVP (16/sep/2026, fin de sesión 1):** `ave edit` corre de punta a punta con WhisperX real +
Claude sobre un talking-head sintético (TTS Paulina, 34 s → 30 s): corta exactamente las 4 muletillas/
repeticiones, 19 captions con keyword pop, 4 zooms, QA 100, ~19 s de render, ~$0.04 de LLM.
39 tests. **UI local**: `uv run ave web` → http://127.0.0.1:8765 (FastAPI, `ave/web/app.py`); acceso
de doble clic en `~/Desktop/AI Video Editor.command`; launch.json `ave-web` en AGENTE CONTENIDO/.claude.
Caras: **YuNet (OpenCV)** por defecto — MediaPipe 1.0.1 aborta en macOS (Metal) y quedó
opcional en subproceso. Pendiente: **video real de Elvin** en `samples/` (Hito A/B de evaluación),
calibrar umbrales con audio boricua, agrupación de captions más semántica, música automática (fase 2),
multicam (fase 3), aprendizaje de DNA (fase 4), Bori como cliente (fase 5). Sin commits todavía.

**Sesión 2 (16/sep/2026, noche):** Elvin subió su video real (IMG-4590, 4K, 101 s, ad de coaches) y
un anuncio editado profesionalmente (`samples/references/franky-j-ads-sept.mp4`) como modelo. Medido
con `ave analyze-ref`: encuadre fijo, ~40 cortes/min con **blur punch** de 3–6 frames, captions
minimalistas en minúscula centrados + **bloques de énfasis** (rojo=dolor, amarillo=solución), b-roll
10–15 %. Implementado como preset `pro_minimal` (default en LEVEL_UP_ADS/AI_BORINQUEN_ADS/
ELVIN_PERSONAL/EDUCATIONAL; el estilo agresivo quedó en `TIKTOK_BOLD`), transiciones blur punch,
b-roll con tarjetas tipográficas (imágenes IA cuando haya `FAL_API_KEY`), Claude delimita el contenido
útil (`keep_until_idx`: dejó fuera la charla con el editor). **Revisiones**: `ave revise <id> "nota"` y
panel en la web → Overrides → recompone desde el análisis cacheado (v2 en 90 s). 44 tests.
Lo que Elvin pidió y falta: íconos 3D flotantes y transición de papel rasgado (módulo motion),
música automática, imágenes IA reales (pegar FAL key).

**Feedback de Elvin (16/sep noche):** (1) "no toques el color/contraste del video, solo edita" → la causa
era HDR HLG de iPhone sin tonemap; ahora `color_prep()` hace HDR→SDR fiel (hable @100 nits) y nada más;
nunca agregar corrección creativa de color. (2) ruidos de fondo → denoise fuerte + compuerta entre
palabras. (3) pidió velocidad 0.8/0.9/1.1/1.2 → `--speed` + selector web + override en revisiones.

**FAL key activa (16/sep noche):** Elvin creó una key nueva en fal y la puso en `.env` (69 chars). B-roll IA
verificado en su video (v5/v6): flux-schnell, prompts concretos con personas latinas. Elvin usa la web en
paralelo (le dio a "Limpia el ruido de fondo" mientras yo corría una revisión por CLI → se pisaron; ahora hay
candado por proyecto). Historial del proyecto real: v2 rápido/sin zooms, v3 denoise, v4 (web) denoise,
v5 imágenes IA, v6 imágenes regeneradas.

**Sesión 3 (16/sep, madrugada):** multi-toma (varias tomas → una edición; transcripción por toma porque
Whisper suprime repeticiones; dominio global con `boundaries`) y **nueva UI** premium (negro grafito +
ámbar, Inter Tight, galería con miniaturas, dropzone multi-toma, stepper, versiones, KPIs, chips de
revisión) en `ave/web/static/index.html`. Elvin pidió "minimalista y futurista, que se vea top, sin
cambios bruscos". 49 tests.

**Feedback de Elvin (17/sep):** nada de estilos de marca visibles ("nada de level up ads, elvin personal");
el agente elige solo y SIEMPRE parte de la calidad de la referencia profesional. Implementado: `dna_id=auto`
→ base `PRO` + `pick_dna(content_type)` (PRO / PRO_VSL / PRO_EDU / PRO_PODCAST); la web solo tiene un
control pequeño Auto | Reel/Ad | VSL | Educativo | Podcast. También pidió poder eliminar proyectos (hecho).

**Sesión 4 (17/sep):** workflow con clientes construido y probado: login con roles (admin/editor con
clientes asignados), clientes con **link público de subida** `/u/<token>`, carpeta local vigilada, API Drive
(sin credenciales aún), cola automática, `ave watch` cada 30 min, postproceso (estado, **registro**
SQLite con negocio/tipo/costo por versión, Slack), aprobación en la plataforma, vistas Cola/Registro/Admin.
Servicios launchd instalados (`com.ave.web` siempre, `com.ave.watch` 30 min; logs en ~/Library/Logs/ave-*.log).
Datos de prueba limpiados: el primer acceso de Elvin crea el admin. Falta: URL pública (túnel/dominio) para
clientes externos; Slack canal (`SLACK_AVE_CANAL` vacío); Drive API (cuenta de servicio).

**Sesión 5 (17/sep):** analizadas 4 referencias → [[ave-estilo-referencias]]. Construido: 3 letras
(impacto/moderno/elegante), branding por cliente (logo → paleta → acento; mundo del b-roll caricatura/serio/
tecnología/dinero/lifestyle; banco de imágenes por cliente reutilizable; tope 20 %), tono verde para dinero.
Clientes reales creados en la plataforma: `ai-borinquen` (mundo tecnología, banco con 4 imágenes) y
`level-up-media` (dorado #F8D30E, mundo dinero). Video real de Elvin re-editado como Level Up = v7.

**Sesión 6 (17/sep):** nombre de producto **Cortex** (Elvin: "AVE se ve feísimo"; el paquete sigue `ave`).
**SFX** (`assets/sfx/`, 12 efectos ElevenLabs SFX v2 vía fal; cash en dinero, ding en CTA, whoosh en b-roll;
tope por minuto) y **música de fondo** (`assets/music/`, 12 pistas × 6 moods ElevenLabs Music vía fal,
−18 LUFS, BPM con librosa; `brain/music.py::elegir` por tipo/mundo/energía; selector en la web con
preview + subir la propia; revisión "otra música / más seria / urbana / sin música"). Primer intento (−22 dB + sidechaincompress) dejó la música inaudible (14 dB bajo el ruido de sala) y el
compresor reaccionaba al ruido: ahora ganancia −6 dB y **ducking por envolvente de palabras** (asendcmd);
video real = v11: música −25 dB en huecos / −33 bajo voz, mezcla −14.7 LUFS. 56 tests.

**Sesión 7 (17/sep):** Elvin entregó la edición profesional del MISMO video (Daren) y dijo que mis ediciones
eran mediocres → [[ave-daren-referencia-detalles]]. Construido el paquete de motion (encuadre cerrado
automático, callouts de cifras con pop y contador, lluvia/pila de billetes, personas verdes, B/N de mood,
glitch RGB, cursor+clic, listas con foto e ítems rojos uno por vez, SFX medium) y validado lado a lado con la
referencia (v12→v18 del video real). Lección: **siempre comparar frame a frame contra la referencia antes
de entregar**; medir (tamaño de cara, niveles) en vez de suponer.

**Sesión 8 (17/sep):** tipografía 3D (extrusión ASS), íconos 3D flotantes, papel rasgado, tarjetas de color con objeto
3D. Elvin vio v19 y el "$20,000" tapaba la cara → regla dura de callouts bajo la barbilla + caption sin la cifra +
fajos que nacen bajo la cifra (v20–v23, comparados lado a lado). Test de regresión en `tests/test_brain.py`. 57 tests.

**Estándar mínimo (17/sep):** Elvin exigió que el nivel Daren aplique a TODO video (él, Carilin, cualquiera con acceso):
pipeline coacciona DNAs viejos a `auto`, cara siempre analizada (también vertical), `validate` rechaza cifra sobre la
cara, probado por el intake con un vertical. **URL fija: https://edit.heybori.ai** (túnel Cloudflare `cortex`; heybori.ai movido a Cloudflare el 17/sep, Elvin cambió los
nameservers en GoDaddy a mano porque el classifier bloquea escribir en GoDaddy/Cloudflare). Usuario de Carilin: `entrega_lum`
(editor, level-up-media), credenciales enviadas por Slack DM. Cortex vive en la Mac de Elvin: encendida = link vivo.

**Generalización (17/sep):** Elvin: «no siempre son 5 mil o 20 mil; cualquier cifra o ángulo». El LLM ahora decide
`numbers` (cualquier cifra hablada → display) y `visual_beats` (ícono/lluvia/cursor por significado; schema 4); reglas
por palabra solo de respaldo; `fallback_numbers` atrapa cifras no marcadas. Ojo: alguien borró desde la plataforma el
proyecto original (20260916-221112-img-4590-1) a las 14:55; el original sigue en ~/Downloads/IMG_4590.mov y el proyecto
vivo ahora es `20260917-145921-level-up-media-coaches-4590` (v3). 62 tests.

**Producción en Railway (17–18/sep):** Elvin no quiere depender de su Mac → Cortex corre en Railway (proyecto `cortex`,
volumen /data, STT fal, música FLAC, túnel Cloudflare `cortex-rw` dentro del contenedor → https://edit.heybori.ai).
Detalles y comandos en CLAUDE.md del repo. Lección: un redeploy mató el primer video de Carilin (4 tomas) a mitad de
render → ahora hay `pending.json` + recuperación automática; no deployar con renders en curso. Bug encontrado en prod:
dos b-roll con id `b1` (la foto forzada de la lista) → el segundo borraba el .mov del primero; corregido con renumerado.
Mac ya sin servicios launchd de Cortex.

**Workflow definido (18/sep):** admin crea clientes/usuarios; estratega digital (Elvin: no decir "tráfico"; son "estrategas digitales") = usuario editor con sus clientes (Puerta A: sube en
la web); cliente = link `/u/<token>` sin cuenta (Puerta B, vigilante cada 2 min); avisos en Slack #cortex-bori-edit-videos
(bot `command_center`); revisión/aprobación por el tráfico; entrega = descarga. Drive descartado como entrada. Modo
conservador automático para nichos profesionales (PRO_SERIO). Papelera 7 días en vez de borrar.

**18/sep (tarde) — estándar Yulianna completo en producción:** letra Inter Black apretada + Inter Light, pop, eco,
tarjetas de rejilla morada con objeto 3D, anillo de %; encuadre con aire (cara a 0.30 del alto); cifras debajo del
subtítulo (y≥0.67); render falla si libass sustituye fuentes; papelera 7 días. Valle Médica entregado v4 (QA 100).
Lección dura del día: Elvin vio una v2 con caricatura+música enérgica+subtítulos desbordados y se enojó mucho
(«porquería, póngase serio»): NUNCA avisar "listo" sin mirar frames del final; comparar con la referencia.

**Gotchas:** structured outputs de la API rechazan modelos con `default` en listas ("Schema is too
complex") → modelos LLM sin defaults + conversión. Homebrew instalado el 16/sep/2026 (Elvin tecleó la contraseña). FFmpeg = **`ffmpeg-full` 9.0.1**
(keg-only en `/opt/homebrew/opt/ffmpeg-full/bin`; la fórmula `ffmpeg` normal NO trae libass). FFmpeg 8+
quitó `-filter_complex_script` → `run.filter_script_args()` usa `-/filter_complex`. `FAL_API_KEY` local de
Bori está vacía (vive en Railway) → sin fallback cloud hasta que pegue una key.
`uv sync` cacheó un wheel vacío antes de existir `ave/`: `uv sync --reinstall-package ave`. Rutas
siempre absolutas (ffmpeg corre con cwd en el workdir). Ver [[tablero-contenido]], [[bori-backend-real]],
[[voz-espanol-pr-tuteo]].

**18/sep (noche):** música A MEDIDA por defecto (`ave/audio/score.py`, numpy: pads Am·F·C·G / sobrio C·G·Am·F, kick/clap/
bajo desde el corte tras el gancho ≥2.8 s, ticks acelerando en contadores, pop por ítem, kick+acorde en CTA, fade;
−18 LUFS) según el spec que Elvin pasó de su ad de plomería; la librería queda para moods pedidos. Velocidad automática
por ritmo (<112 ppm → 1.15×, <135 → 1.1×) + `recomendaciones.json` → «💡 Para el estratega» en Slack. Valle Médica v5.

**19/sep:** Elvin quiere que su asistente **Lis Acevedo** (Slack U0BDGC8KGH4, lis.acevedo@levelupmediapr.net) use Cortex
y lo afine. Usuario admin provisional `lis` en Railway; credenciales y plan de 7 pruebas enviados por DM. (Error del
19/sep: se envió primero a "Liz García", cuenta gmail ajena; contraseña rotada y usuario borrado.) Elvin insiste: TODO sale por
defecto con el estándar de las referencias (Yulianna ADS Sept 2 primero; ver ave-estilo-referencias) — no cambiar.
Feedback de Liz → corregir y responderle por Slack.

**19/sep — Baúl global de b-roll** (pedido de Elvin: «crea 50–100 imágenes por nicho, serio y caricaturas jocosas, y
siempre usa lo que tienes»): `ave/baul.py`, 20 nichos × serio/caricatura generados en el servidor (volumen
/data/broll-baul), vista Baúl en la web para subir/generar/quitar; `build_broll` busca banco del cliente → baúl → genera.

**20/sep — referencia por proyecto:** campo «Video de referencia» en Nuevo proyecto; se mide + se mira (visión) → parche de DNA
sobre el estándar sin bajar el piso (letra, cifras, tope 20 %). `ave/analyze/referencia.py`.

**20/sep/2026 — OpenCut evaluado y descartado; editor manual DENTRO de Cortex.** Elvin preguntó si OpenCut
(github OpenCut-app/OpenCut, 90K estrellas) nos mejoraba: verificado en el código que el rewrite en Rust no tiene
nada publicado (MCP/headless = roadmap, issue #811 con 0 tareas) y el clásico está archivado, sin auto-edición ni
modo servidor. Decisión de Elvin: «seguimos con Cortex, pero quiero una UI de edición manual dentro de Cortex».
Hecho: `/editor/{pid}` (botón «✎ Editar a mano» en el proyecto) — timeline con pistas, preview con proxy con
audio, remapeo automático al cortar tomas, guardar = versión nueva renderizada con caché + feedback IA→humano.
Backend `ave/edicion_manual.py`. Desplegado en edit.heybori.ai. Si aparece una UI de retoque, es ESTA, no OpenCut;
OpenCut queda en vigilancia (cuando publique Editor API/headless de verdad, podría abrir nuestro timeline.json).

**20/sep/2026 — Producto y marca.** Elvin pidió que Cortex sea "una experiencia", vendible más adelante. Hecho en
tres capas: A (home a todo el ancho: + Nuevo en drawer, pulso con números vivos, "ahora mismo", lista con filtros),
B (antes→después, momentos con fotogramas bajo el video, comparar con el original, actividad), C (página de
aprobación del cliente sin login `/ver/<negocio>-xxxx` y subida con marca + tips `/subir/<negocio>-xxxx`). Marca:
Elvin rechazó negro+ámbar («básico, no me dice nada») y eligió la dirección **A "Señal"**: grafito frío + índigo
#7d7dff + menta #5fe3c2 + blanco, wordmark «cortex» minúscula con mark de arco. Quiere links «serios, breves y
profesionales» (nada de tokens largos). Menos texto en pantalla, explicaciones en tooltips.

**23/sep/2026 — Taller (pedido de Elvin: «un cuadro al que le pueda hablar»).** Además del pipeline de reels,
Cortex ahora hace **tareas sueltas** de edición hablándole normal: «quítale los silencios largos con ritmo
natural y aplícale el LUT que está en la misma carpeta». `ave/taller.py`: Claude → plan de pasos → FFmpeg.
Entra por la pestaña **Taller** de edit.heybori.ai (arrastras el video + LUT/música, o das una ruta del
servidor; botón 🎤 dicta en es-PR) o por `ave taller "<petición>" --video <ruta>` en la terminal (ahí sí ve
rutas y carpetas locales de la Mac). Ops: silencios, recortar, unir, velocidad, LUT, color, aspecto, girar,
audio (normalizar/limpiar/volumen), música con ducking, mudo, extraer audio, exportar. Si falta un dato
pregunta; si piden subtítulos/b-roll manda a "+ Nuevo".

**23/sep/2026 — Opus 5.5.** Elvin pidió que el agente de edición use Claude Opus 5.5: `AVE_MODEL=claude-opus-5-5` en
`.env` y en Railway, default en `ave/config.py`, precio $4/$20 en `jobs/costs.py`. Verificado en local y en prod
(análisis de habla 16 s, revisión 8.5 s, taller). Todas las llamadas fijan effort explícito (5.5 default = medium).

**Voz en off + tomas de apoyo (25/sep/2026, pedido de María del Carmen, EN PROD):** si entre lo subido hay audios (nota de voz WhatsApp/mp3/m4a/wav), la voz es el guion y los videos son apoyo → `ave/ingest/voz.py` comprime pausas, corta planos de ~3 s y Opus 5.5 asigna toma por frase; base `input/voz_base_<aspecto>.mp4` y sigue el pipeline normal. Con tomas reales, b-roll IA apagado (capa por encima de las reglas aprendidas; una revisión lo puede pedir). Panel, link del cliente e intake aceptan audio. Avisado a María en el hilo de #cortex-bori-edit-videos. Pendiente general (no de voz): la transcripción oye mal nombres de negocio ("Valle América" por Valle Médica); hoy se corrige con una revisión.

**Revisión a fondo (25/sep/2026, pedida por Elvin: «ve a los detalles, esto tiene que estar afinado»)**: 3 revisores + datos de prod → ~25 bugs arreglados y desplegados (detalle en CLAUDE.md de Cortex, sección «Revisión a fondo»). Los que más pesaban: música ~6 dB más alta en todos los videos (ducking al filtro equivocado), picos +0.9 dBTP (QA 0 en 2 videos de Bori), 2 videos sin audio reintentándose cada 2 min desde el 19/sep (8,731 jobs), revisiones que congelaban la letra vieja, editores que podían ver/escribir fuera de sus clientes. Corrección automática de transcripción (nombre del negocio, etc.) EN PROD. Elvin aprobó la música más baja (25/sep: «déjala así»); María avisada de los cambios en #cortex-bori-edit-videos.
