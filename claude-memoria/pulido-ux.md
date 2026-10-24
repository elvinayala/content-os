---
name: pulido-ux
description: "24/oct/2026 regla de Elvin — toda app lleva estados de carga, vacíos y hover/foco (skill pulido-ux); ronda en 7 plataformas"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 97c9d7ba-90ed-4042-b1fc-fcc67da7ddb7
  modified: 2026-10-24T04:12:46.046Z
---

Elvin (24/oct/2026): todas las plataformas llevan los 3 detalles que hacen ver profesional una app hecha con IA:
estados de carga (skeleton/carga discreta + animación de entrada), estados vacíos (por qué está vacío + qué hacer)
y hover/foco/presionado. Skill de usuario `~/.claude/skills/pulido-ux/` + fila en ~/.claude/CLAUDE.md.

**Why:** "son esos pequeños detalles lo que diferencian tu app"; lo vio en un reel y lo quiere en todo.

**How to apply:** al crear o terminar cualquier pantalla, aplicarlo sin que lo pida. Se ajusta, no se rediseña
([[plantilla-manda]]). El 24/oct se corrió una ronda legal + UX en ramas `pulido-legal-ux-2026-10-24` (sin push ni
deploy) para Content OS, Bori, Cortex, AIB Core, ISLA Run, landings de Resuelto/1000X y la app 1000X; worktrees
externos en ~/bori-trabajo/pulido-legal-ux/. Segunda ronda lanzada el mismo día: AMBC 360 (en copia ~/bori-trabajo/pulido-legal-ux/ambc +
parche, porque su repo no tiene commits), AIB SaaS, Quality Care y dashboard de ventas. Rutas legales fijas en Content OS:
/terminos, /privacidad, /reembolsos, /cookies; el consentimiento (lib/consentimientos) lo hace la sesión de /f/. Relacionado: [[legal-sitio-web]].

**Estado al cierre del 24/oct/2026 (ronda legal + UX):** EN VIVO → 1000X app (fuente real de prod en
~/1000x-produccion, NO en 1000x-fuente; respaldo pre-cambio ahí mismo), AIB Core piloto (aicore-piloto),
Ángelo/Quality Care (Worker + Netlify), Closer Lab (rama staff-agency → Railway) y AI Borinquen Salud (Railway).
LISTO SIN PUBLICAR (el modo auto bloquea deploys delegados; Elvin aprueba o publica con DEPLOY-PENDIENTE.md /
docs/contexto/consentimientos.md): Content OS (rama worktree-agent-af3189d862b544f7f, HEAD f24e8849 revisado, migración 0045 antes del push),
Cortex (137be7f, revisado; antes rotar AVE_SECRET), Bori (04af6b4 revisado — arrastra 45 commits de pendiente-flyers + MALLOC_ARENA_MAX=2), AIB SaaS (token de
Supabase vencido en app/.env.supabase.local; migración 014 antes). Sin producción: ISLA Run (main local),
La Granja, Resuelto (Netlify bloqueado). AMBC: parche aplicado al original, go-live 2/nov.
