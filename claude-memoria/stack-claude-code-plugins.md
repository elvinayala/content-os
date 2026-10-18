---
name: stack-claude-code-plugins
description: "Plugins/herramientas de Claude Code que Elvin pidió instalar el 17/oct/2026 (claude-mem, context-mode, gstack, Orca) y su estado"
metadata:
  node_type: memory
  type: reference
  originSessionId: c8ec1185-e320-4f91-a347-db156415b10e
  modified: 2026-10-18T01:53:55.090Z
---

17/oct/2026, Elvin pidió el "stack" del carrusel de @soyenriquerocha ("no olvides nada y no queme tokens"):

1. **claude-mem** (thedotmack) — plugin user scope, v14.0.1. Memoria entre sesiones. Proveedor local `claude` con Haiku 4.5 (lo más barato), datos en `~/.claude-mem/` (settings.json ahí). NO usar `npx claude-mem install` (ofrece CMEM Pro hospedado = datos fuera). `<private>` excluye texto sensible. Convive con esta memoria de archivos [[tablero-contenido]].
2. **context-mode** (mksglu) — plugin user scope, v1.0.169. Saca lo pesado del contexto para gastar menos tokens.
3. **gstack** (garrytan) — skills en `~/.claude/skills/gstack`; requiere Bun (instalado por brew, 1.4.3). El `./setup` lo tiene que correr Elvin (el modo auto lo bloqueó). NO se agregó a CLAUDE.md la sección que pide su README ("nunca usar claude-in-chrome"): Elvin usa Chrome y el navegador de la app.
4. **Orca** (stablyai) — app de Mac por `brew install --cask stablyai/orca/orca`; varios Claude en worktrees.

Binario del CLI de Claude (no está en PATH): `~/Library/Application Support/Claude/claude-code/<versión>/<hash>/claude.app/Contents/MacOS/claude`.
