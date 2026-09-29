---
name: gasto-ia-modelos
description: Qué modelo usa cada agente y cada llamada del servidor; Opus solo para diseño/desarrollo/planeación, Sonnet/Haiku para lo breve
metadata:
  type: feedback
---

Elvin (28/sep/2026, mirando la consola de Anthropic): "mira a ver si necesita Opus 5.5 para todo o si
puede manejarse con Sonnet. Diseño, desarrollo, planeación, comenzar estructuras, definir planes: eso no
lo vamos a escatimar. Pero hay cosas breves que se pueden automatizar para Sonnet."

**Why:** Nico gastaba Opus 5.5 en TODO — $22.25 en un solo día (26 corridas) contra $1.00 de Max, que ya
elegía modelo por tarea.

**How to apply:** antes de agregar cualquier llamada a un modelo, preguntarse si es criterio/creación
(Opus) o clasificación/extracción/resumen/trámite (Sonnet o Haiku), y dejarlo con override por variable de
entorno. Clasificadores: `scripts/nico-gasto.mjs` y `scripts/max-gasto.mjs` (puros, con tests).
Costo real por agente y día: `/ritmo/agentes`. Relacionado: [[nico-vibecoder]], [[meta-ads-agente]].
