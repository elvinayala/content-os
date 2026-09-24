---
name: circuito-contenido-equipo
description: "Cómo el equipo (Valentina, Juan Diego) pide contenido y cómo se aprueba y se les envía — login /pedir, Slack two-way, y el circuito de Valentina"
metadata: 
  node_type: memory
  type: project
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
---

Acceso del equipo de contenido al Content OS (deployado en content-os-chi-seven.vercel.app):

**Login scopeado** — password `CONTENIDO_PORTAL_PASSWORD` (=`contenido-tenfold-26`) da acceso SOLO a `/pedir` (chat con Sofi). El password de CEO (`CEO_PORTAL_PASSWORD`) da acceso total. Roles en `lib/auth.ts` (COOKIE_CONTENIDO/sesionContenidoValida), ruteo en `proxy.ts`, dual-password en `app/login/actions.ts`.

**Sofi (cerebro compartido)** en `lib/sofi.ts` (`responderSofi`, `systemSofi`, `pasarPedidoASlack`) — la usan el chat web `/api/pedir-chat` y el bot de Slack. Modelo claude-sonnet-5.

**Slack two-way** — `app/api/slack-eventos/route.ts`: el equipo le escribe a Sofi por DM al bot **Command Center** (team LEVEL UP MEDIA, bot user U0BFPB0SSP4) y responde. Verifica firma (SLACK_SIGNING_SECRET), ackea rápido y procesa con `after()` (Slack exige <3s). Es ruta pública en proxy.ts. Requiere en la app de Slack: Event Subscriptions → `message.im` (+ `app_mention` si quieren menciones, necesita scope app_mentions:read), Messages Tab habilitado en App Home, y reinstalar.

**Valentina = creadora UGC de Level Up Media con AVATAR FIJO:** coaches/mentores/agencias en $3-10K/mes que quieren $20-50K/mes. TODO su contenido usa posicionamiento CONSULTORÍA (nunca "somos una agencia"; "te instalamos todo contigo 1:1"; paquete: auditoría 1:1 + sesiones grupales semanales + sesión 1:1 con Elvin), ángulo permanente "no saben estructurar su contenido orgánico" (+frases literales "tus ángulos ganadores", "estrategia de comunicación"), siempre "potenciamos con anuncios y estrategia probada ($100K/mes)". Casos: Coralis La Garita $25K→$70K, RK Automatic $30K→$100K, Tinos. Reglas de CTA: nunca "gratis"; orgánico="Comenta X", ads="haz click en el enlace abajo y agenda una llamada". Elvin aprueba concreto+números+casos; descarta abstracto/meta. Todo documentado en vault/estilo/level-up.md (sección VALENTINA) y estrategia.md.

**Circuito de Valentina** (closer+creadora UGC Level Up, Slack `U08CZV7EL2C` `@valentina`): el equipo produce **10 guiones + 6 ganchos semanales** (`/guiones-valentina`, tarea `lote-valentina-semanal` lunes 7AM) marca level-up, `para:"Valentina"`, → bandeja de Entregas (`/ceo/entregas`). Al **Aprobar**, `app/api/aprobar-entrega/route.ts` rutea por el campo `para`: si matchea un creador de `lib/creadores.ts` → DM directo a esa persona con el bot ("listo para grabar; respondé 'lista' o 'necesito revisión: …'"); si no, va al webhook general de Heidy. Las revisiones que Valentina pide por DM las levanta `/guiones-valentina` en su paso 0 (feedback → vault/estilo/level-up.md).

Ver [[organigrama-equipo]] para quién pide qué. Secrets solo en .env.local + Vercel, nunca en el repo.
**⚠️ 18/sep/2026 — Valentina YA NO crea contenido** (Elvin). Sigue como closer. El circuito de
`/guiones-valentina` y la tarea `lote-valentina-semanal` deben pausarse (pendiente de que Elvin
confirme). Las caras de Level Up son **Daren (anuncios) y Frankie Jay — UNA persona — (orgánico + su embudo)**; AIB = Yulianna;
Shadow = Elvin; Bori = el coquí. Detalle en `vault/proyectos/estudio/caras-y-angulos.md`.
