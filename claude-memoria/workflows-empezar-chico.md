---
name: workflows-empezar-chico
description: Regla de Elvin (23/oct/2026) — todo workflow multiagente arranca chico y escala solo si la calidad lo pide
metadata:
  node_type: memory
  type: feedback
  originSessionId: c8ec1185-e320-4f91-a347-db156415b10e
  modified: 2026-10-24T03:28:38.593Z
---

Todo workflow / fan-out de subagentes arranca CHICO (orientativo: 10–40 agentes, por fases) y se agregan más
solo si el resultado lo necesita. La calidad no se sacrifica: si hace falta más, se agrega sin pedir permiso.

**Why:** 23/oct, medido con `node scripts/uso-claude.mjs 7`: 76 % del gasto semanal fueron workflows; uno solo de
Bori lanzó 324 subagentes = 400M tokens (43 % de la semana). Elvin: "empieza los workloads chicos. Sin sacrificar la
calidad, si tienes que agregar más, lo haces."

**How to apply:** fase 1 pequeña → revisar qué falta → fase 2 solo con lo que falta; nunca un subagente por archivo
o por ítem cuando un agente puede cubrir un grupo; al lanzar, decir en una línea cuántos agentes y por qué. Ver
[[gasto-tokens-claude-code]] y [[gasto-ia-modelos]].
