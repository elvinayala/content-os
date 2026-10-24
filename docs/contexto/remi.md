## Remi — el Motion Designer (`/motion`, 27/sep/2026)

Elvin: "videos de motion por prompt… como un showreel, a tope". Lola hace IA generativa (deforma
logos y textos); **Remi anima por código** con **Remotion** (React → MP4) y los logos/colores
reales. Taller en **`motion/`** (proyecto aparte con su `package.json`; excluido del `tsconfig` de
Next, de `.vercelignore` y `.railwayignore`): `src/marcas/` (paleta + fuentes; `Coqui.tsx` = el
coquí de Bori por capas con las formas exactas de `logo-color.svg`; `aib.ts` + `CoquiAibVector.tsx` = el **logo v2 de AI Borinquen** (rebranding aprobado 27/sep, vector recreado del PNG viejo) animado por piezas desde `aib-logo.json`, que emite `vault/proyectos/ai-borinquen/marca/logo-generador.py` — ver su `LEEME.md`). **Bori ≠ AI Borinquen**: Bori = agencia de marketing en una plataforma (coquí cobre); AIB = agentes de IA de voz y chat a la medida (coquí de circuitos) — nunca mezclar, `src/kit/` (fx, texto cinético,
teléfono/chat/llamada/calendario/contador), `src/videos/<Video>.tsx` + `.audio.ts`, `src/Root.tsx`.
Audio por prompt: `node motion/scripts/audio.mjs musica|sfx "<prompt>"` (fal: stable-audio-25 /
ElevenLabs sfx v2). Revisión obligatoria con `remotion still` + hoja de contacto antes de entregar.
Entrega: `node motion/scripts/entregar.mjs <mp4> --marca --titulo` → Storage `pulse/motion/<fecha>/`
(link firmado 1 año) + `data/entregas.json` (`agente: "Remi"`, `modelo: "remotion"`). Render de 15 s
≈ 40 s en la Mac (`cd motion && npx remotion render src/index.ts <Id> out/<x>.mp4`; `npm run studio`
para previsualizar). Primer video: `AibRecepcionista` (anuncio, **de usted**) y `AibRecepcionistaTu`
(orgánico), 15 s 16:9. Cerebro `vault/ceo/cerebro-remi.md`. Fase 2: bot de Telegram/buzón.
**Fábrica de anuncios (27/sep):** `motion/src/fabrica/` — cada anuncio es un guion en datos (`anuncios.ts`: marca,
9:16|16:9, escenas tipadas en `tipos.ts`) que dibujan `escenas.tsx` + `temas.tsx` (Level Up / Bori / AI Borinquen,
cada uno con su logo, fuente, registro y música). 16 anuncios de lanzamiento (LU 6 · Bori 5 · AIB 5).
`motion/scripts/render-fabrica.sh [ids]` → `motion/out/fabrica/`; `node motion/scripts/hoja.mjs <id>` = hoja de
contacto para revisar. Audio de marca en `motion/public/audio/<marca>-musica.mp3` (fal, normalizado).
**Remi en la nube (27/sep):** servicio `remi` en Railway (`Dockerfile.remi` + `scripts/remi-nube.sh` +
`motion/servicio/servidor.mjs`, https://remi-production-6765.up.railway.app, `REMI_SECRETO`): baja GitHub, renderiza con
Chrome headless y sube a Storage. `node scripts/remi.mjs render <id>|--guion <json> [--entregar --marca …]`. Guiones en
JSON por la composición universal `Motion` (+ tema de cliente desde JSON: `src/fabrica/cliente.tsx`), así Max produce
motion sin editar código (Max tiene `remi.mjs` y `meta-ads/subir-videos.mjs` en su puente y `REMI_URL/REMI_SECRETO` en Railway). **Paquete (28/sep): clientes de
LU con acuerdo ≥ $3,500 PAGADO COMPLETO de una reciben 2 MOTION GRAPHICS** (en plazos: hasta que termine de pagar) — `remi.mjs render --guion … --cliente <slug>` (marca desde `ficha.marca`
del expediente) `--proponer` (a #max-aprobaciones → Drive + canal). Licencia Remotion: Company License (Automators $100/mes mín.). **Estilos (28/sep)**: `motion/src/fabrica/estilos.tsx` — neon · editorial · impacto · minimal · pop · tecno = plantilla (resaltado, bullets, transiciones, fondo, cierre) + ritmo; la marca fija letra (1 + acento opcional), colores y logo. Campo `estilo` del guion; sin él remi.mjs usa el menos usado entre los permitidos de esa marca (`ficha.marca.estilos` / `ESTILOS_MARCA`) sin repetir en el pedido (skill §1b). Motion de clientes: logo por capas (`logoCapas`), motivo `fibras` y escena `retrato` con sus fotos reales. Skill `.claude/skills/motion-graphics/SKILL.md`; ojo `railway.json` fija el
startCommand del puente para todo el proyecto → la imagen de Remi trae un atajo `scripts/telegram-puente.mjs`.

**Tres motores de video (12/oct, Elvin tras ver "Motion con Opus 5.5"):** Remi/Remotion (lo de marca, nube) +
**lotes** `remi.mjs lote <tabla> --plantilla <guion.json>` (un video por fila; `scripts/remi/lote.mjs`, plantillas en
`data/motion/plantillas/`) · **Hyperframes** (HeyGen, video desde HTML) en `estudio-html/` (fijo 0.8.150, sin telemetría,
nunca `publish`) · **Brag** (plugin de Claude Code, lanzamientos de 20 s). Cuál usar y las reglas: skill `lanzamiento`.

**Lo de Motion Architect (23/oct, Elvin: "coge lo que no tenemos y añádelo a lo que ya tenemos"):** repo
`Hainrixz/motion-architect` (MIT, Remotion igual que nosotros) — NO se instaló como plugin (su `/motion` chocaba con el
nuestro y su agente no sabe nuestras reglas); se tomaron solo las piezas que faltaban: **referencias en video**
("hazlo como este Reel": `motion/referencias/vision/` + yt-dlp en la Mac + subagente `remi-referencia` → ficha en
`data/motion/referencias/<slug>.json` traducida a estilo + escenas; método en `motion/docs/referencias.md`), **260 SFX
CC0** (Kenney) en `motion/public/sfx/` (`<Sfx src="sfx/…ogg">`, índice `docs/oficio/sfx-library.md`), **oficio de
motion** en `motion/docs/oficio/` (principios + checklist de revisión, tonos ↔ estilos, storyboard, vocabulario,
estándares, audio al beat) y el **formato 4:5** (1080×1350, feed de IG) en la fábrica y en el servicio de la nube.
Copia del repo en `~/motion-architect` (solo consulta). Licencias en `motion/docs/oficio/NOTICES.md`.
