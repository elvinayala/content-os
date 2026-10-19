---
name: trabajo-fuera-de-tmp
description: "Muestras, scripts y worktrees de trabajos largos van en ~/bori-trabajo (u otra carpeta del home), nunca en /private/tmp: un reinicio de la Mac lo borra"
metadata:
  node_type: memory
  type: feedback
  originSessionId: f903cebd-d0d1-42f4-8fcd-b06da4b4ddc6
  modified: 2026-10-19T01:06:47.071Z
---

El 18/oct/2026 un reinicio de la Mac borró `/private/tmp/claude-501/` con las finales aprobadas del flyer de la Outlander, los scripts del diseño y las 18 worktrees de los arreglos de Bori. Las ramas quedaron a salvo en git, y la receta se recuperó del journal del workflow (`~/.claude/projects/.../subagents/workflows/<id>/journal.jsonl`).

**Why:** perder trabajo pagado (generaciones de fal) y aprobado por Elvin cuesta dinero y tiempo.

**How to apply:** en trabajos de varias horas (workflows, worktrees, muestras de imagen o video), usa una carpeta del home que no se borre, como `~/bori-trabajo/` (flyers en `~/bori-trabajo/flyers/`, worktrees en `~/bori-trabajo/wt/`). El scratchpad sirve solo para lo desechable. Relacionado: [[bori-flyers-venta]].
