---
name: ave-estilo-referencias
description: "Lo aprendido de los 4 anuncios editados profesionalmente (Franky J ×2, Yulianna, Valentina) — la base a la que SIEMPRE debe parecerse el AI Video Editor, y lo que cambia por marca"
metadata: 
  node_type: memory
  type: project
  originSessionId: 11dd585d-9f78-448a-bf8a-62785c9be54f
  modified: 2026-09-17T12:45:47.393Z
---

Elvin entregó 4 referencias (sep/2026, en `~/ai-video-editor/samples/references/`; análisis completo en
`docs/estilo-referencias.md` del repo). Regla: **todo lo que entregue AVE debe parecerse a estas ediciones**.

**Base común (preset PRO):** encuadre fijo (cara 22–27 % del alto, sin zoom continuo); jump cuts por
frase (36–41/min en anuncios; 13/min cuando hay overlays) escondidos con **blur punch** 3–6 frames;
captions en 2 niveles: frase pequeña en minúscula centrada al pecho con fundido + **bloque de énfasis
grande en negrita con sombra dura** cada 8–12 s; colores: **rojo = dolor, verde = dinero/resultados,
acento de marca = promesa/método, blanco = nombres**; números siempre grandes (Valentina en cajas oscuras
sobre la cabeza; Franky 4 con cálculo apilado "$200 × 20 = $4,000" en verde); b-roll a pantalla completa
2–4 s (paper-tear, flash/glitch, whip-blur), **máximo 20 %** por regla de Elvin; overlays 3D flotantes
(calendarios, robot, saco de dinero, reloj, lluvia de billetes); CTA "haz clic en el enlace" + cursor o
pastilla roja "LINK AQUÍ ABAJO"; música siempre (−16 a −26 LUFS integrados).

**Por marca:** Level Up = letra Impacto (Montserrat Black mayúsculas), acento dorado #F8D30E, mundo
"dinero" (fajos, saco 3D, calendario, reloj, gente de negocio). AI Borinquen = Moderno (bold minúscula
tipo Poppins) o Impacto, verde/azul del logo + mucho blanco, mundo "tecnología" (robots, mascota
caricatura, neón cyan/violeta, mockups de WhatsApp). Clínicas/doctores = mundo "serio" (foto editorial).

**SFX (feedback de Elvin 17/sep: "no lo estabas considerando"):** las referencias usan efectos pocos y en
momentos clave: caja registradora/"cachín" al salir dinero o cifras, whoosh en transiciones rápidas y
entradas de b-roll, pops en cifras, ding en el CTA. Implementado en `ave/brain/sfx.py` con librería
generada (`assets/sfx/`, ElevenLabs SFX v2 vía fal, uso comercial), tope por minuto y prioridad CTA > dinero.

**Implementado (17/sep):** 3 letras (impacto/moderno/elegante), acento desde logo, tono money verde,
mundos de b-roll con prompts propios, banco de imágenes por cliente reutilizable, tope 20 %.
**Pendiente (módulo motion):** cajas de números, cálculo apilado, íconos 3D flotantes, lluvia de
billetes, paper-tear/glitch, cursor del CTA, logo neón. Ver [[ai-video-editor]].

**Nicho profesional (Elvin 18/sep):** «en el área médica no puedes poner ritmos pegajosos… médicos, abogados, oficinas:
conservador, neutral, profesional, ritmos secos y suaves; las caricaturas no son para todo el mundo; identifica el nicho».
→ el análisis detecta `formalidad`; conservador = preset PRO_SERIO (sin blur punch, sin SFX, sin lluvia de dinero/íconos/B/N,
fotos editoriales, Poppins, música seria −14 dB) y mundo serio aunque el cliente tenga branding llamativo.

**Estándar único (Elvin 18/sep):** «las mismas letras estándar, profesionales, elegantes; no cambies cada vez que ves
una toma nueva; usa siempre las referencias». Una sola tipografía por defecto para todo cliente y nicho (Inter SemiBold
pequeña + Montserrat Black énfasis, la de las referencias); modo sobrio solo cambia colores/ritmo/efectos. El agente no
elige letras; solo un admin las fija a mano. Mirar frames del final antes de decir "listo".

**Yulianna ADS Sept 2 = favorita de Elvin y ESTÁNDAR POR DEFECTO (18/sep):** «estilo que debes siempre usar de primera;
graba bien los detalles». Detalles medidos (docs/estilo-referencias.md §Yulianna): frase pequeña fina Inter Light muy
apretada, 1–3 palabras cada 0.2–0.5 s, al pecho (y≈0.56); palabra grande Inter Black apretada en minúscula, blanca,
sombra dura + extrusión oscura; TODO blanco (jerarquía por tamaño, no color); tarjetas de rejilla morada con objetos 3D,
robot 3D en PiP, anillo de % animado, logo neón, testimonio; música −26 LUFS muy baja; blur punch entre tomas. Corrige la
nota anterior: el default ya NO es Montserrat mayúscula (ese es `impacto`, solo si un admin lo fija). Pop, eco,
tarjetas de rejilla morada y anillo de % implementados el 18/sep; faltan logo neón y PiP del robot.

**20/sep/2026 — Reglas (Elvin: «cada corrección → regla; reglas concretas de la referencia; si no conocen mi
estilo, pregúntame»):** `ave/reglas.py` tiene la REFERENCIA en 12 reglas con números (el preset PRO las cumple
por test) y `data/reglas.json` con las aprendidas: toda edición manual en /editor y toda nota de revisión se
convierte en regla del negocio (activa al instante) y en global si la hace un admin (Elvin) o se repite en 2
negocios. Vista Reglas en la web (pausar/quitar/dictar). Negocio nuevo sin industria ni reglas → Cortex PREGUNTA
(aviso + Slack) antes de generar. Trampa: una prueba de Elvin también crea reglas globales → quitarlas en Reglas.

**20/sep/2026 — Acabado de letras medido en Yulianna (Elvin: «la letra estándar puede mejorar, te dejé referencia»):**
la frase pequeña NO es fina: peso medio (Inter SemiBold 0.047, spacing −3.5), relleno blanco→gris claro y sombra suave;
el énfasis Inter Black 0.078, spacing −5, degradado blanco→gris POR LÍNEA + extrusión negra dura + sombra suave; la
pequeña pegada a la grande. libass no tiene degradados → `grad_bands` (copias con \clip). Banco de pruebas en segundos:
`scratchpad/tipo/harness.py` (quema el ASS sobre un fotograma). Regla: antes de decir "listo" comparar recorte de la
referencia vs el nuestro a tamaño real. Los proyectos viejos conservan su letra hasta una revisión (el timeline guarda el
estilo). Dominio corto del cliente: ver.heybori.ai/<negocio>-xxxx (CNAME al túnel cortex-rw, AVE_VER_URL en Railway).

**20/sep/2026 (noche) — más feedback de Elvin, ya implementado como regla:** «dale suave con el rojo: color en un 5–10 % de
las letras, máximo 15 %; manéjate con blanco y negro, color solo para lo impactante» → `captions.color_ratio_max=0.08`
(`limitar_color`: quedan en color los énfasis junto a cifras, luego dinero > dolor > acento; el resto blanco). «Los emojis
y los íconos no van acorde; por el momento déjalos fuera» → `motion.icons=false` en todos los presets (íconos 3D y
lluvia de personitas apagados; los fajos de dinero siguen). «Los subtítulos a veces salen en la cara del doctor» → el
bloque de subtítulos se ancla bajo la barbilla con `meta.face` (`py_for` en captions_ass). Gustos por negocio (música,
velocidad) nunca se vuelven reglas globales. Cambiar la canción = un clic en la tarjeta Música del proyecto.

**Música prioritaria (Elvin 20/sep):** mandó 6 audios (5 únicos; 3.º y 6.º idénticos) → `assets/music/prio_*.mp3` en calidad
original, marcados `prioridad: true` en `music.json` (energico ×2, moderno, cinematico, motivador). `MU.elegir` los usa
SIEMPRE primero (por mood del tipo/energía del video); la música a medida solo si se pide «medida». En los selectores
aparecen como «★ Prioritarias (Elvin)». Regla en REFERENCIA. Deploy con mp3 grandes: `railway up` puede cortarse
(BadRecordMac) y dejar el deploy en INITIALIZING → relanzar `up`.

**21/sep — segunda queja «letras encima de la cara» (Dr. Marini):** la causa real era que el bloque se CENTRABA en
0.56 H, así que un énfasis de 3 líneas trepaba hasta la boca. Ahora se ancla por arriba (top ≥ pecho 0.53 H o piso de la
cara + margen) y crece hacia abajo; si no cabe, se escala. Verificado en el render real (v16). Lección: para bloques de
texto de altura variable, anclar el borde que importa (el de arriba), no el centro.
