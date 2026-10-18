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

**Revisión "editor de Hollywood" (26–27/sep/2026, pedida por Elvin)**: 3 revisores (sonido/imagen/títulos) midieron renders reales vs referencias → reglas de oficio en el código (detalle en CLAUDE.md de Cortex): gancho arranca con la voz (piso de ruido por toma), audio exacto por clip, ganancia lineal, ducking sin bombeo, pistas a −18 LUFS; encuadre por plano en coordenadas de ventana (1:1 arreglado), tope de resolución 2×, cara centrada; cifras que parten la frase, texto de cifra solo literal, sin repetir; correcciones: nombres propios solo con contexto y nunca "otra forma de lo que dijo". EN PROD. 27/sep Elvin decidió: SIN imágenes de IA cuando el cliente manda tomas propias; «lo demás decide tú» → color igualado entre tomas (técnico, topes suaves), subtítulos quemados detectados (no se duplican), cortes de escala para el ritmo. Todo EN PROD.

**6/oct/2026 — imágenes, logo y deploy liviano:** Cortex recibe imágenes (logo → cierre de ~2 s al final; fotos → tomas de apoyo propias, IA apagada) y el editor manual deja cambiar una imagen de IA por la foto del cliente (subir o escoger del banco; el baúl sigue solo admin). **Deploy:** la red de la Mac cortaba subidas grandes (BadRecordMac en ~15 intentos); la música (~90 MB) se movió al volumen `/data/music-lib` (enlazada en entrypoint) y cada deploy sube ~15 MB — una pista nueva hay que copiarla también a `/data/music-lib`. María avisada en #cortex-bori-edit-videos.

**Auditoría 9/oct (Elvin: "siguen los mismos problemas")**: la causa casi nunca era el síntoma sino ESTADO PEGADO o
mal interpretado: (1) música re-elegida en cada nota (excluía la anterior), (2) volumen absoluto que pisaba la
calibración por pista, (3) dirección del b-roll deducida del número → «más» apagaba, (4) letra que ya estaba = no-op,
(5) «baja un poco» → position bottom → letra al 45 %, (6) notas rehacían desde cero y borraban lo manual,
(7) Level Up es AGENCIA: ajustes de un video se volvían regla de todos, (8) restore_ranges no llegaba al cortador,
(9) Cloudflare corta subidas >100 MB (spinner eterno). Todo con pruebas en tests/test_revision_repetidas.py y sección
en el CLAUDE.md de Cortex. Antes de "arreglar" un pedido repetido: medir versión por versión qué cambió de verdad
(script medir: broll/subtítulos/música por timeline.vN.json) y mirar cuadros reales, no confiar en los overrides.

- 9/oct (noche): **música** = sorteo SOLO entre las pistas de Elvin, con más peso para las que encajan con el contenido y sin repetir la reciente (`MU.elegir`, `_rng`). **Banderas PR/EE. UU.** al decir "Puerto Rico"/"Estados Unidos" (vertical): 3 franjas como Yulianna, sacadas de su referencia (`assets/motion/banderas/`, ojo: `.mp4` excluidos en git/docker/railway salvo esa carpeta); "quita la bandera" en revisión = `sin_banderas`.
- 11/oct: "como Drazo" (reel de @davidmadrazo.ia): **cortes del bruto en rojo** con devolver de un clic (`/api/project/{pid}/cortes|devolver`), **progreso con resultados** (`logros` en /status) y **revisión como chat** que confirma antes del render (`/entender` + `/revise` con `propuesta=1`). Módulo `ave/web/cortes.py`. Para ver la UI sin login: maqueta con las funciones reales del index.html y datos de un proyecto (no se puede inyectar sesión en el navegador).
- 12/oct: **cada negocio = carpeta** (Elvin): en Cortex se escoge el negocio de la lista de Pulse (obligatorio) y el branding (logo/letra) se pide UNA vez; carpetas hijas de level-up-media heredan acceso y reglas. **Subtítulos esquivan el producto** (analysis/producto.json, nunca < 80 % de tamaño). **Voz aislada sin el 10 % del original** en grabaciones sucias (traía el viento). El endpoint mínimo /api/pulse/n8n/negocios de content-os quedó en GitHub sin publicar (había trabajo sin guardar de otra sesión); Cortex usa /clientes mientras tanto.
- 13/oct: **voz aislada = cama filtrada solo mientras habla** (audio.py `mezcla_original`/`es_cama_filtrada`/`ganancia_habla`): con 0 % del original el aislador deformaba palabras (Mister iPhone seg. 12: «celulares»→«solares»); con 10 % crudo volvía el viento. Sucia 22 %, algo sucia 15 % (highpass 150 + afftdn, solo en el habla); limpia 10 % crudo. Verificar con transcripción del tramo, no solo con niveles.

**13/oct (Elvin: «el logo pegado así no», «siempre por lo menos 10 % de b-roll», «habilidades de motion»):** cierre = logo limpio
(`brand.logo_transparente`) + motion de Remi (`cierre._cierre_remi`, fallback ffmpeg), sin la industria de Pulse, CTA «Llama al <tel>»;
b-roll mínimo 10–20 % (composer completa con IA si las tomas del cliente no alcanzan); `_ajustar_al_tope` acorta parejo y quita la
más amontonada (antes borraba una toma entera y dejaba huecos de 25 s); transición `whip` en 1 de cada 3 imágenes de IA;
`apply_dna_patch` ignora un campo inválido en vez de tumbar la revisión. Ojo al revisar por script: «en todo el video» = ratio 1.0.
**13/oct · comparación medida v8 Mister iPhone vs Hector/Yulianna (`ave analyze-ref`):** el blur del corte iba dentro del
segmento, ANTES de los subtítulos → la frase quedaba nítida sobre el fondo borroso y medía 3.7 cuadros (refs 7.6–8.7). Ahora
`expr.blur_cortes` lo aplica en el paso final después de `subtitles` y escala `frames` (medido a 24 fps) al fps de salida →
7.9 cuadros. Lo que falta y NO se arregla en edición: cara 17 % del alto vs 22 % Hector / 30 % Yulianna y encuadre «fijo»
(las tomas del cliente vienen abiertas, cara 6 %; Cortex ya amplía 2.2× y más se ve borroso) → es de grabación.
OJO al medir: el medidor de nitidez lo dominan las letras; y `timeline.ai.json` es la versión vigente (una revisión
global como velocidad no escribe timeline.vN.json).
**13/oct · 6 letras (María: «algo más suave y delicado que la elegante»):** `brand.LETRAS` suma delicado (Montserrat
Light/Medium), clasico (Cormorant Garamond Medium/SemiBold) y suave (Poppins Regular/SemiBold); TTF de fontsource (OFL),
nombres únicos por peso para libass. El chat las entiende en `revise.sanear` («suave» solo si habla de letra/subtítulos:
«música más suave» no cambia la tipografía). La v1 sigue en el estándar (moderno); las nuevas son para revisiones/branding.
**13/oct · pedidos de María (tarde):** (1) «logo y letra» junto al negocio escogido = cambiar logo/letra/color de un negocio
CON branding (`abrirBranding(n, editar)`); el cierre usa el color de fondo del logo si es de marca (`brand.fondo_de_logo`,
LUA rosado #D59898) y `logo_transparente` quita franjas de borde y huecos de letras del color de fondo. Logo de LUA cambiado
en prod (`/data/brand`, persistente). (2) Mister iPhone 12–16 s «distorsionado» = el AISLADOR con IA (soplido de banda ancha,
armónicos borrados); «voz natural» → `denoise light` = sin aislador (`necesita_aislar`); v12 así. Lo «lento» = 0.9× que pidió
Elvin (v9). (3) Mood de música `elegante` (4 pistas fal stable-audio-25, sin batería, `/data/music-lib/elegante-*.mp3` +
music.json con lufs medido): se prefiere sola con mundo serio o letra elegante/delicado/clasico (`elegir(delicada=)`).
**14/oct · las 6 piezas de Cortex (Elvin: «Claude director, las demás solo trabajan»):** Claude (Opus 5.5, decide todo) ·
Whisper (fal, `AVE_STT=fal`; WhisperX local no instalado) · **Silero VAD** (`ave/analyze/vad.py`, ONNX sin torch,
`assets/models/silero_vad.onnx`; `Envelope.voz` filtra en `cuts.build_keep_ranges`: volumen sin voz no es habla, las
palabras de Whisper siempre se protegen; `AVE_VAD=0` lo apaga) · **Apple Vision** (solo macOS → trabajador en la Mac:
`scripts/vision-mac/{caras.swift,trabajador.py}` + launchd `com.eamarket.cortex-vision`, config `~/.config/cortex-vision.env`,
clave `AVE_VISION_SECRETO` en Railway; endpoints `/api/vision/*`; latido < 90 s; sin Mac → YuNet; calibre alto×0.91 =
face_size de YuNet, medido) · Remotion (Remi, solo el cierre) · FFmpeg (todo lo demás; CRF 18 → 21: −39 % peso, VMAF 95.7).
Prueba de punta a punta OK (QA 100). Log de la Mac: `~/Library/Logs/cortex-vision.log`.
**14/oct · Remotion en todo el motion (Elvin: «pon Remotion también en todo»):** cifras/contadores, anillo de %, íconos 3D,
cursor y lluvia salen de Remi como capas TRANSPARENTES (VP9 alpha): composición `CortexCapa` (content-os
motion/src/cortex/CortexCapa.tsx), Remi `POST /capas` con cola propia y bundle en caché por árbol de motion/; Cortex
`ave/motion/remotion.py` (especificaciones → pedir en un hilo al empezar el render → FFmpeg las pone con `-c:v libvpx-vp9`
antes de subtítulos; el ASS no dibuja esas cifras pero las usa para acomodar subtítulos). Respaldo: lo que no llegue en
`AVE_REMOTION_ESPERA` (240 s) se dibuja como antes; `AVE_MOTION_REMOTION=0` apaga. Medido: +35 s con caché, ~130 s si Remi
recién reinició. Subtítulos/cortes/b-roll/audio siguen en FFmpeg (estándar Yulianna). ~$0.01 de licencia por capa.
**14/oct · TopChiro (María):** BUG del editor: `src_start/src_end` de las palabras están en el tiempo GLOBAL (tomas seguidas,
offset = suma de duraciones previas) y `recompute` del editor los leía como tiempo de la toma → al recortar se perdían todas las
palabras desde la toma 2 (115 → 15). Arreglado en editor.html (usa la posición en la toma) + red de seguridad en
`edicion_manual.aplicar` (`subtitulos_perdidos` → `remapear_subtitulos` desde el timeline anterior). Silero `aire` 0.25 → 0.10 s:
con 0.25 cada unión entre tomas quedaba con ~0.75 s callados. TopChiro v6 = recortes de María + subtítulos recuperados.

**14/oct — estándar igual para todos (Elvin: «que María, yo y el que use el editor tengamos las mismas funciones; que funcione igual si lo pido desde la Mac o lo piden ellos»):** las reglas aprendidas se habían contaminado: una corrección de admin (o la misma en 2 negocios) se volvía GLOBAL (quedaron «b-roll 0 %» de TopChiro, la letra de LUA, broll.kinds=ai_image para todos) y la carpeta level-up-media heredaba speed 1.1 + música seria a todos sus negocios. Arreglo (`ave/reglas.py`, commit 6dcfe2b): una corrección solo queda en SU negocio sin importar el rol; global/agencia solo lo DICTADO en la vista Reglas (`origen.tipo == "manual_admin"`); `captions.*` (salvo emphasis_per_minute) nunca es regla (es la letra del negocio); `broll.ratio` de regla con tope 0.10–0.25. Se pausaron 43 reglas en prod (respaldo `/data/data/reglas.json.antes-14oct`). Diferencias de rol que quedan (solo admin): usuarios, clientes, baúl, cola, gestionar reglas; María usa `entrega_lum` (editor, nombre Carilin). Lección: antes de culpar al pedido, revisar `patch_para(<negocio>)` en prod.

**14/oct (tarde):** (1) **Música del editor**: `/api/project/{pid}/musica` pasaba el volumen YA calibrado y `music_para` lo calibraba otra vez → cada elección bajaba ~11 dB (TopChiro −50 dB). Arreglo `MU.nivel_base()` + tests. (2) **Botón del cierre**: `Cliente.cta_cierre`, botón «botón final» en el editor, campo `cierre_cta` en revisiones; se guarda en el negocio. El cierre de respaldo (sin Remi) ahora también lleva el botón (`pastilla_cta`). En Remotion `textoCta` contrasta con el acento (LUA salía blanco sobre blanco). (3) **Remi se colgó 40 min** al empaquetar dos trabajos a la vez tras un commit → `empaquetar` serializado (79bf95b); si un cierre sale «Remi no terminó a tiempo», mirar `railway logs --service remi`. (4) **Testimonio**: nombre/palabra clave gigante DETRÁS de la cabeza = Remotion `detras` (Anton ×1.45 alto, a la altura de la coronilla: `cy − 0.7·h` de meta.face) + máscara MODNet (`ave/analyze/recorte.py`, modelo en `<datos>/models/modnet.onnx`, se baja solo) compuesta en `final()`; sin máscara no se pone. `lavado` (light leak) en 2 palabras fuertes; rótulo pasó al final antes del CTA; `testimonio.json` ahora trae `grandes`. Falta: b-roll con diseño (tarjeta 3D con fotos del cliente).

**14/oct (noche) — meta de Elvin: ≤ 3-4 versiones por video.** Línea base medida: 9.3 versiones/video (semana al 14/oct, 5 de 15 en meta). Causas en octubre: texto de subtítulos mal oído (~38, una palabra por versión), música (~35, la subía 13 de 17), b-roll (~31), letra/tamaño (~25). Hecho: vocabulario aprende de las ediciones a mano (`cambios_de_texto`), línea 🔎 «palabras a revisar» en la v1 (`para_revisar`), música +1.5 dB por defecto y `gain_sano` (tope −12/+8), el mood que escoge en el editor queda como `_opts.music_mode` del negocio, tamaño de subtítulos = regla del negocio con topes, aviso de tomas con voz sin usar (`ave/qa/entrega.py`), reporte semanal `ave/reporte_revisiones.py` (lunes 8 AM PR a Elvin por Slack, `/api/reporte/revisiones`, `AVE_REPORTE=0` lo apaga). Próximo paso si no baja: medir qué b-roll cambia a mano.

**15/oct — toma larga con guion (María: Derek/R Electric graba el guion entero de corrido con teleprompter):** `ave/brain/guion.py` (puro + `reconstruir` con Claude, caché analysis/guion.txt): una versión por frase, en orden, entre intentos casi igual de completos (−0.1) gana el ÚLTIMO, nunca parte frases en comas (mezclaba intentos), corta tropiezos de 3+ palabras dentro de la frase. Se activa si `opts.guion` viene con videos con voz (campo «Guion (opcional)» en la web y en el link público; el mismo campo de Nico sirve para TTS cuando NO hay audio) o si `es_toma_larga` (1 fuente ≥ 45 s con 5-gramas repetidos). Sustituye los cortes de repetición del LLM (solo deja cut_filler). Derek v2: 110 s → 37.7 s, 10/10 frases. Ojo: la v1 de ese video ya había salido casi igual por el LLM; el valor es que ahora es determinista y respeta el guion pegado. Lección del día: el repo de Cortex en la Mac se había desfasado de GitHub (commits de Nico): `git fetch` + rebase antes de desplegar.

**15/oct (noche) — auditoría completa vs Yulianna/Daren (Elvin: «dime qué necesitas para llegar a esa calidad»; los clientes se quejan):** workflow de 13 agentes (6 dimensiones + verificador escéptico c/u). Diferencia ≈ 55 % código · 30 % material · 15 % proceso. Evidencia en scratchpad `ref/auditoria/<dimension>/` (se borra con la sesión). Arreglado ese día y verificado: (1) **centrado** — `smooth_track(..., ventana=)` sigue la cara SIN retraso (gaussiana centrada) en recortes horizontal→vertical + zoom anclado al centro de la ventana: Pitipuá 13.6 % → 3.0 % (ref 1.1–1.7 %); (2) **música en lazo cerrado** — `Music.voz_sobre_musica_db` (PRO 12, PRO_SERIO 17, TESTIMONIO/EDU 13, VSL 16), `calibrar_musica` renderiza la música sola y la mide bajo el habla (K-weighting propio); «súbele X %» mueve el objetivo; el slider del editor lo pone en None (absoluto). Verificado 12.0 dB en la mezcla; (3) SFX nivelados contra lo que suena (`ganancia_sfx`), swish 1/2/3/6 regenerados sin graves; swish en ~mitad de cortes + tick en énfasis; (4) `ave/qa/vs_referencia.py`: línea 📏 en cada aviso (centrado, efectos, b-roll, música, LUFS); `analyze_reference` mide `face_cx_desvio`. 10 pistas nuevas (nec_*/ale_*, ElevenLabs Music v2.5, en /data/music-lib). Voces: Eleven v4/v4 Turbo/Qwen3 (diseñada fija en assets/brand/_voces o clonada del negocio) por fal. Las revisiones (version>1) NO recalculan el encuadre (reusan el timeline): los arreglos de encuadre solo aplican a ediciones nuevas.
**Pendiente (fase 1, ~3 días):** criterio de efectos (contador «views» fijo, lluvia de billetes sobre precios, B/N en el 1er segundo, botón del cierre vs verbo dicho), v1 siempre Inter + borrar reglas de letra viejas, blur de corte encima del b-roll, exportar a 24 fps si la cámara es 23.976, imagen repetida. **Fase 2 (2-3 sem):** palabras pegadas a la voz real (silencios 3-10/min vs 0 en refs), subtítulos que no fallan (cobertura 100 %, nombres de la ficha, palabra grande 1-2 palabras e interlineado apretado, contraste ≥3:1), EQ de voz + de-esser, cámara A/B y zoom lento, color entre tomas, b-roll pegado a su palabra, revisión de entrada que frena material malo. **Decisiones de Elvin pedidas:** igualar color, «serio» sin silencios + cuánta palabra grande en médicos, letras alternativas solo en revisiones, lluvia de billetes solo con ingresos, cierre 1-1.5 s, prueba de oído 20 min; presupuesto stock (Envato/Storyblocks) + kit luz/mic; del equipo: originales, guía de grabación, ficha, guion, 8-12 clips, María dueña de la v1.

**16/oct — «nivel profesional» EN PROD (Elvin: «te autorizo a mejorar todo»):** 7 frentes en ramas `mejora/*` (worktrees ~/cortex-wt/) integrados en main (cb9a803 → fixes). **Flujo en dos fases** (idea de Elvin): `EditOptions.fase` 'corte' (paso 1: sin capas, Slack «✂️ Corte limpio listo para aprobar») → `/api/project/{pid}/aprobar-corte` / `pipeline.aprobar_corte` → paso 2 sobre el mismo corte (`brain/dos_fases.py`); web por defecto en corte con «Saltar a edición completa»; el cliente nunca ve el corte. Silencios/voz (tiempos pegados a la voz, EQ hacia refs + de-esser), subtítulos (`brain/cobertura.py` cobertura 100 %, ficha con dueño/pueblo/productos, palabra grande 1-2, contraste ≥3:1, v1 Inter), cámara (FACE_Y ~0.225, A/B y zoom lento, fps de cámara 24/25, color de piel igualado), efectos (dinero solo con dinero: billetes/monedas/fajo/contador + tarjeta de «oferta» para precios; nada de color en 2 s; cierre ~1.5-2 s con verbo dicho; serio sin caricaturas), b-roll (pegado a su palabra, sin repetir, tarjetas Remotion `CortexTarjeta`), entrada (`analyze/entrada.py` avisos), música rotada entre negocios. Remotion en content-os main (CortexCapa monedas/fajo/oferta/tarjeta + CortexTarjeta). Prueba final (4 videos, ambas fases): música 12 dB (serio 17) ✓, cobertura 0-2 palabras ✓, Inter ✓, centrado 3.1-3.5 % (rcpro 6.9 / dra 5.6 por material), silencios 0-3.8/min. **Pendiente**: b-roll <10 % en serio (TopChiro 7 %: la 1.ª tarjeta cuenta para el tope y luego…), silencios a 0 en todos, «Saltar a edición completa» por negocio para el link del cliente. Ojo deploy: `railway up` falla a veces con BadRecordMac → reintentar; `git rebase` sobre ramas con merges las aplana → NO usar, usar merge/ff.
**16/oct (tarde) — afinado, EN PROD:** `silence.nucleo_voz` (volumen dentro de palabra = voz solo a ≤0.6 s de voz de Silero; el ambiente de un local ya no), `cuts.HUECO_EN_PALABRA` (silencio ≥1 s dentro de palabra estirada se corta), b-roll llega al 10 % (pieza recortada en `place_broll`; `_ajustar_al_tope(piso=)`), encuadre: `faces.x_de_clip` (cara por clip de las detecciones crudas en verticales), Apple Vision a 5 fps, seguimiento horizontal σ 0.28 s / zona 1.5 %, zoom mínimo que centra (`z_centro`, `zmin` en camara.limites), fallback a muestras de ojos si el track no tiene cara. Resultado: Pitipuá y TopChiro ✓ en todo (centrado 2.1/2.4 %, silencios 0); doctora 5.2 % (se mueve dentro del plano: falta seguir dentro del clip en verticales); RC Pro 7.8 % (gafas oscuras + mano: el detector toma la mano). Script de prueba en el servidor: /data/prueba_final.py (CASOS → prueba-final-<x>, Slack apagado) + /data/medir_final.py, /data/clip_cx.py.

**17/oct — cacería de bugs + María (#331 logo, #332 subida), EN PROD:** (1) **Cierre**: el fondo sale de CADA pixel del logo (`fondo_para_logo`/`invisibles`), no del promedio (Pitipuá: letras gris carbón desaparecían sobre el cuadro oscurecido); `Cierre.fondo` auto|claro|oscuro, campo `cierre_fondo` en revisiones, botón «fondo final» en el editor, `Cliente.cierre_fondo` guardado por negocio; `velo_cierre` (crema 0.86 sobre el cuadro). Las correcciones de palabras y el cierre ya van ENCIMA de la edición a mano (`textos_sobre_manual`, `es_global` acepta caption_edits). (2) **Subida** (`/static/subir.js` para panel y link): pedazo crudo `PUT /api/subida/raw` (y `/upload/<token>/raw`), id fijo por toma (nombre+tamaño+fecha) + `/estado` = sigue donde se quedó, reaprovecha lo subido con id viejo por huella del 1er MB, 3 tomas a la vez, `/espacio` antes de empezar (corre `disco.liberar` si no cabe; 507 claro si se llena), partes 48 h. (3) **Remi colgado 30 h** (cola 10, `spawn EAGAIN`): el atajo PID 1 de node no recogía los huérfanos de Chrome → `tini -s` en Dockerfile.remi + vigía por trabajo que reinicia (content-os 68136d2); Cortex pregunta `/salud` antes de esperar el cierre (`remi_libre`). (4) **Bug grave**: alguien con shell borró `final.mp4` de 2 proyectos aprobados de Pitipuá y `recuperar_huerfanos` los rehízo desde cero (perdió la v2 a mano que el cliente aprobó; meta.version volvió a 1). Se restauró desde `timeline.human.json` (v3 = su edición + Cupey/filete + fondo claro). NUNCA borrar final.mp4 para forzar render. Arreglo de raíz en la rama fix/ciclo. (5) Cacería: workflow de 27 agentes → 88 hallazgos, 78 verificados (70 confirmados) en subida/ciclo, cierre, seguridad, voz, revisión, composer, front, procesos (pids ~1000 en el contenedor); arreglos en 8 ramas `fix/*` (worktrees en el scratchpad). Borrar proyectos de prueba en prod lo bloqueó el clasificador: pedir OK a Elvin; el disco se recupera con `disco.liberar` (caché regenerable).
**18/oct (madrugada) — release de la cacería LISTO, SIN desplegar:** rama `integra/bugs-17oct` (GitHub elvinayala/cortex, 255e6a5) = 8 ramas fix/* + arreglos de la revisión cruzada; 756 pruebas, e2e local v1→revisión→a mano OK. Al desplegar: todos vuelven a iniciar sesión (cookie firmada con la sal), imagen con `tini -s`, `AVE_ENLAZAR_FINALES` apagado, chequear `.instantanea`/`.lock` antes. Pendiente: OK de Elvin, `/cso` (sin cuota de subagentes hasta el 21/oct), broll_imagen HEIC por `normalizar_imagen`, copias `.instantanea` sin dueño de antes del 17/oct.
**18/oct 2:06 PM — release de la cacería EN PROD** (main ab1487c, lo desplegó Elvin: el clasificador bloquea que yo despliegue a prod; pedirle el comando). Verificado: health 200, PID 1 = tini, columna `owner` en jobs, sin errores al arrancar. María avisada (re-login). Pendiente: `/cso` con subagentes (cuota vuelve el 21/oct).
