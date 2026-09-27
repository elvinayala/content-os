---
name: remi-motion
description: Remi, el Motion Designer (27/sep/2026) — motion graphics por prompt con Remotion en motion/, /motion, primer video Recepcionista AI de AIB
metadata:
  type: project
---

Elvin pidió (27/sep/2026) videos de motion graphics por prompt ("showreel de 15 s a tope"); primer encargo: presentar la **Recepcionista AI de AI Borinquen** con el coquí de Bori animado. Se creó **Remi, el Motion Designer**, aparte de Lola (Lola = IA generativa fal/Kling, deforma logos; Remi = código → MP4 con logos y colores reales).

- Taller: `motion/` (proyecto Remotion propio, excluido del tsconfig de Next y de los deploys). Kit reutilizable en `motion/src/kit/`, coquí por capas en `motion/src/marcas/Coqui.tsx` (formas exactas del logo-color.svg).
- Audio por prompt: `motion/scripts/audio.mjs musica|sfx` (fal: stable-audio-25 y ElevenLabs sfx v2, ≥ 0.5 s). Entrega: `motion/scripts/entregar.mjs` → Storage `pulse/motion/<fecha>/` (link firmado 1 año) + `data/entregas.json` (agente Remi, modelo remotion).
- Comando `/motion <prompt>`; cerebro `vault/ceo/cerebro-remi.md`. Render de 15 s ≈ 40 s en la Mac.
- **Ojo registro:** los ANUNCIOS de AIB van DE USTED; orgánico en tuteo. El video tiene prop `registro` y dos composiciones (`AibRecepcionista` = usted, `AibRecepcionistaTu`).
- **Bori ≠ AI Borinquen (corrección de Elvin, 27/sep):** Bori = agencia de marketing en una sola plataforma (heybori.ai, coquí cobre en la hoja). AI Borinquen = agentes de IA de voz y chat, especializada en agentes personalizados (coquí de CIRCUITOS verde/azul, neón #2BFF88, Outfit; `public/marcas/ai-borinquen-logo-dark.png`). El 1er corte usó el coquí de Bori por error; se rehizo con `CoquiAib`.
- **Logo v2 de AI Borinquen (aprobado por Elvin 27/sep):** recreado en vector (no existía el original) en `vault/proyectos/ai-borinquen/marca/` (generador + SVG + PNG + LEEME); en motion `CoquiAibVector` lo anima por piezas. Falta pasar flyers de Lola y páginas de AIB al v2.
- **Fábrica de anuncios (27/sep):** 16 anuncios de lanzamiento (LU 6 · Bori 5 · AIB 5, verticales y horizontales, 15-25 s) como guiones en datos en `motion/src/fabrica/anuncios.ts`; render con `render-fabrica.sh`, revisión con `hoja.mjs`. Elvin pidió producir de corrido sin aprobar guiones.
- Higgsfield (plan Ultra, ~8.7K créditos) tiene flujo `video-editing` (Higgsedit: motion por código en su sandbox); NO vi export .aep de After Effects en el MCP. "Motion" del registro = analítica de creativos de Meta (motionapp.com), no hace videos. Adobe (`animate_design`) y HyperFrames existen, sin conectar.
- **Skill `motion-graphics` (27/sep):** `.claude/skills/motion-graphics/SKILL.md` = el método completo (fábrica, escenas, temas, audio, pantallas reales en copias demo, Higgsfield, reglas de copy, render/revisión/entrega). Elvin: es **contenido premium para clientes** y Max (futuro estratega digital) lo aplicará → enseñado en `vault/ceo/cerebro-max.md` §22. Paquete descargable en `vault/proyectos/motion/motion-graphics-skill.zip`.
- Fase 2 pendiente: bot de Telegram / buzón de agentes para Remi (Railway necesitaría Chrome).

**How to apply:** pedidos de "motion", "logo animado", "video de lanzamiento" → /motion (Remi), no Lola. Ver [[lola-creadora-ia]], [[bori-marca]], [[voz-espanol-pr-tuteo]].
