---
name: the-architect-plugin
description: 23/oct/2026 instalado The Architect (Hainrixz) para planear apps/plataformas nuevas antes de programar; cuándo usarlo y costo
metadata:
  node_type: memory
  type: reference
  originSessionId: 97c9d7ba-90ed-4042-b1fc-fcc67da7ddb7
  modified: 2026-10-24T03:39:08.436Z
---

Plugin `the-architect@soyenriquerocha` v2.6.0 (github.com/Hainrixz/the-architect), scope user, instalado el 23/oct/2026
a pedido de Elvin ("para cuando vaya a crear una app o plataforma, salir de la mejor forma"). Revisado antes: solo
markdown, sin hooks/MCP/scripts.

- `/the-architect:architect` — entrevista en 4 fases → bundle (blueprint.md, epics, tasks.json, CLAUDE.md/settings del
  proyecto nuevo) con criterios de aceptación y comando de verificación por paso. No escribe código.
- `architect-quick` (3 preguntas), `architect-brownfield` (repo existente), `architect-next` (siguiente tarea),
  `architect-audit`, `architect-refresh` (re-verifica versiones).
- Costo: ~2K tokens fijos por sesión; una corrida completa ~100K+ (writer ~40K + validator ~55K, ambos Opus).
- Complementa a gstack (`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/spec`): esos revisan/aterrizan la
  idea; Architect produce el plano de construcción. Regla de uso en ~/.claude/CLAUDE.md (tabla de gstack).

Related: [[stack-claude-code-plugins]] [[gasto-tokens-claude-code]]
