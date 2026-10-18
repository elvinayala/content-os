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
3. **gstack** (garrytan) — skills en `~/.claude/skills/gstack`; requiere Bun (instalado por brew, 1.4.3). Elvin corrió `./setup` el 17/oct: 55 comandos, v1.91.131. Cada comando carga sus instrucciones al usarlo (10K–34K tokens: /design-review 34K, /office-hours 24K, /review 20K, /cso 4.5K, /careful 1.3K); la lista de nombres va en cada sesión. Instaló un Stop hook (timeline); se saltaron los hooks de plan-tune y el guard de credenciales pre-push. Sin Docker → /cso solo estático; navegador = el de gstack (no Aside). NO se agregó a CLAUDE.md la sección que pide su README ("nunca usar claude-in-chrome"): Elvin usa Chrome y el navegador de la app.
4. **Orca** (stablyai) — instalada 17/oct en /Applications/Orca.app (v1.4.229, brew cask); varios Claude en worktrees. La 1.ª descarga se trabó; la 2.ª tardó ~30 min.

Binario del CLI de Claude (no está en PATH): `~/Library/Application Support/Claude/claude-code/<versión>/<hash>/claude.app/Contents/MacOS/claude`.

Reglas de cuándo usar gstack solo: `~/.claude/CLAUDE.md` (global, solo en la Mac; NO en el CLAUDE.md del repo porque los agentes de Railway leen ese y no tienen gstack).
