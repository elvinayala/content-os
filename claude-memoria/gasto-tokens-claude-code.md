---
name: gasto-tokens-claude-code
description: "Optimizar tokens de Claude Code sin bajar calidad; línea base 19/oct, qué se hizo y cómo medir después"
metadata:
  node_type: memory
  type: project
  originSessionId: c5916682-d106-4eab-a101-a8c7b8f29a4d
  modified: 2026-10-19T19:09:37.111Z
---

Elvin (19/oct/2026): "estoy gastando demasiados tokens… no podemos sacrificar calidad, pero sí optimizar". Medido con
`node scripts/uso-claude.mjs [días]` (transcripciones de la Mac, ponderado por costo): 7 días = 1,470M equivalentes,
96 % Opus; **66 % workflows multiagente** (4 sesiones lanzaron 735 subagentes de ~120K de contexto cada uno), **31 %
llamadas con > 300K de contexto** (sesiones que llegaban a 990K) y CLAUDE.md costaba 73K tokens en cada llamada.

Hecho: CLAUDE.md → índice de 3.5K + `docs/contexto/<área>.md` (commit 0eb24cc4); vuelve el aviso de costo antes de un
workflow (se quitó `skipWorkflowUsageWarning`); `CLAUDE_CODE_AUTO_COMPACT_WINDOW=400000` en `~/.claude/settings.json`.
Elvin NO eligió pasar los workflows a Sonnet (`CLAUDE_CODE_WORKFLOW_SUBAGENT_MODEL`): la calidad manda.

**Why:** se le acababa la cuota semanal; la mayor parte se iba en fan-out de workflows y en contexto arrastrado.
**How to apply:** antes de proponer un workflow, estima cuántos agentes y empieza chico; una sesión por tarea (no seguir
temas nuevos en sesiones de 500K+); detalle nuevo va a `docs/contexto/`, nunca a CLAUDE.md; ~26/oct correr
`node scripts/uso-claude.mjs 7` y comparar con la línea base. Pendiente: MEMORY.md pesa 8.7K tokens por llamada. Ver [[gasto-ia-modelos]].
