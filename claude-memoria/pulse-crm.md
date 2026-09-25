---
name: pulse-crm
description: "Pulse = el CRM propio (/pulse) que reemplaza a Monday ($800/mes); estado al 20/sep/2026, qué falta de Elvin (Supabase + token de Monday) y decisiones de diseño"
metadata: 
  node_type: memory
  type: project
  originSessionId: c764d2b1-b364-4884-bc3e-923a3b76fe6d
  modified: 2026-09-20T22:39:15.020Z
---

**Pulse** (`/pulse` en Content OS) es el clon de Monday que Elvin pidió el 20/sep/2026 para
dejar de pagar ~$800/mes. Monday solo lo usaban Jessica (onboarding) y Carilin (operaciones)
para la ficha de clientes que pagan; Pipedrive sigue siendo el CRM de leads.

**Lo que hay en Monday** (cuenta level-up-media-company.monday.com, logueada en Chrome):
3 tableros reales — LEVEL UP MEDIA (7784685790, ~868 items, 37 columnas, grupo OFFBOARDED
con 736), AI BORINQUEN (18399101258, ~30), Asignación de Estrategas (9506323087, 134).
El resto (Leads, Cuentas, Acuerdos, Actividades) es plantilla vacía.

**Decisiones**: nombre en inglés "Pulse" (runner-up Tuesday); Supabase Postgres + Storage
(PGlite embebido como fallback local sin DATABASE_URL); usuarios con clave propia (tabla
`pulse_users`, scrypt, cookie HMAC); migración por la GraphQL API de Monday con token.
Modelo genérico (values jsonb) para que ellas agreguen columnas sin código.

**Estado (20/sep/2026, noche)**: EN PRODUCCIÓN en https://content-os-chi-seven.vercel.app/pulse
con Supabase (proyecto `pulse-crm`, org eamarket, ref wamlxgbakjusjkoeuzjl, us-west-2, bucket
`pulse`). Migrados los 3 tableros: LEVEL UP MEDIA 917 · AI BORINQUEN 94 · Estrategas 508
(las PROPUESTAS de Monday eran links a Drive → quedaron como link). Repo en GitHub
`elvinayala/content-os` (remote origin por SSH). Claves provisorias: admin Elvin, Jessica y
Carilin = `pulse-dev` → **cambiarlas en /pulse/configuracion** antes de avisarles.
**Rollout (decidido 20/sep, DM enviado a Carilin ese día)**: lun 21–mar 22 para aprender;
**desde mié 23/sep/2026 Pulse es el único CRM**; Monday solo consulta hasta 30/sep y se cancela.
Roles: Elvin admin · **Carilin editora** (todo menos eliminar tableros/tocar admins; da de alta
gente) · Jessica y Ángela Morales (PM AIB, angela.morales@aiborinquen.co) miembros. Carilin
organiza la reunión con Jessica y el personal de Monday y reparte accesos. Jessica en Monday
usaba jessicalevelupmedia@gmail.com. Los 24 usuarios importados no tienen clave (no entran).
**Falta**: que Elvin cambie su clave `pulse-dev`, seguimiento a Carilin, cancelar Monday el 30/sep.
**HR (21/sep)**: HR LEVEL UP MEDIA (57), HR AI BORINQUEN (24) y Solicitudes HR (4) migrados y
**privados solo para Aure** (aure@levelupmediapr.net, miembro, clave provisional Aure-Pulse-2026;
DM enviado 20/sep). Tableros privados = `pulse_boards.privado` + `pulse_board_members`; admins
siempre ven todo; se administra en ⋯ → Acceso del tablero. Carilin (editora) NO ve HR.
**Seguridad (21/sep)**: HSTS/CSP, bloqueo 5 intentos/15 min, sesiones se cierran al cambiar clave/rol,
log de seguridad en /pulse/configuracion, respaldo diario a Storage (respaldos/). Pendiente de Elvin:
rotar el token de Slack expuesto en n8n; clave mínima ahora 8 (las provisorias pulse-dev siguen valiendo).
Gotcha: postgres.js re-serializa strings JSON → pasar objetos (sql.json) en los scripts.

**How to apply:** cualquier pedido sobre "el CRM", "Monday", "clientes de Level Up" o
"Pulse" va acá; detalle técnico en la sección Pulse de CLAUDE.md. El browser pane no dispara
`keydown Enter` en React (usar evento sintético al probar inputs).

**⚠️ n8n depende de Monday** (20/sep/2026): 7 workflows activos (onboarding, cobros, recordatorios) se alimentan de Monday vía NocoDB. NO cancelar Monday hasta cerrar el puente Pulse→NocoDB y migrar TESORERÍA; ver [[n8n-level-up]] y `vault/proyectos/n8n/salida-de-monday.md`.

**21/sep/2026**: Tesorería (338) y Cumpleaños (48) también en Pulse; n8n ya lee TODO de Pulse (puente clientes+equipo a NocoDB, Cobros/Recordatorio/Supervisor repuntados, Migración v5 apagada). Monday se puede cancelar; hay que avisar al equipo que Pulse es el tablero oficial.

**Roles (22/sep/2026)**: Elvin admin (único con todo). **Carilin y Aure editoras por igual**
(`lib/pulse/permisos.ts`): agregan miembros y claves, editan todo, ven el registro de seguridad;
NO exportan (Pulse no tiene export), no crean editores/admins, no eliminan tableros ni columnas,
no quitan etiquetas en uso, máx. 20 elementos por borrado, no eligen quién entra a privados.
Lo raro le llega a Elvin por Telegram/Slack (`alertarElvin`, anti-spam 15 min). HR sigue privado:
Aure (los 3) y Ángela (HR AIB); Carilin NO ve HR salvo que Elvin lo pida.
Lección: antes de desactivar gente en masa, confirmar con Elvin — el 22/sep desactivé 13 por
pedido suyo y hubo que revertir (Carilin ya los tenía configurados); desactivar borra la clave.

**Typeform → Pulse (24/sep/2026)**: el "ONBOARDING TYPEFORM" (vlfCgUUP, cuenta 6siljlqvh7z) que antes
creaba el cliente en Monday ahora lo crea en Pulse vía /api/pulse/typeform. EN VIVO desde 24/sep: webhook
"pulse" registrado (TYPEFORM_TOKEN en .env.local); importados Daniel Ortiz (nuevo) y Miguel Santiago
(ya existía). Los 2 webhooks de Monday en el form siguen ON (se apagan solos al cancelar Monday).

**Onboarding propio (24/sep/2026)**: https://levelupmedia.vercel.app (link definitivo; bienvenida-levelup queda como alias)
reemplaza al Typeform: 21 preguntas con marca LU, llena Empresa/Teléfono/E-mail/Pueblo/Industria/
Presupuesto/Id cuenta/Contenido/Vendedor en LEVEL UP MEDIA → ONBOARDING & SETUP; resto en comentario.
El link lo manda el CLOSER al cerrar la venta (no Jessica); Jessica recibe la ficha llena y hace el onboarding. Jessica y Carilin avisadas (y corregidas) por Slack ese día (Jessica = U08SN35L2UX). El Typeform sigue de respaldo.
Gotcha Slack: nunca poner un link entre **negritas** en mensajes de Slack — los asteriscos quedan pegados al URL y el link se rompe (le pasó a Jessica el 24/sep).

**24/sep/2026 — próximo nivel EN PROD** (5 partes aprobadas por Elvin): ocultar columnas/etiquetas (no borrar), automatizaciones configurables (⚡, tabla pulse_reglas, exigir razón de baja al pasar a OFFBOARDED), Mi día + DM 8 AM lun–vie a Jessica y Carilin DESDE EL BOT (nunca desde la cuenta de Elvin), ⌘K + vistas guardadas + celular, y "Preguntarle al CRM" (/pulse/preguntar, Opus 5 effort low, ~15 s, solo tableros visibles). Datos: 17 onboardings detenidos +48 h al arrancar. Detalle en CLAUDE.md → Pulse → Próximo nivel.
