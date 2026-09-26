---
name: n8n-level-up
description: El n8n de Level Up (n8nv2.levelupmediapr.net) y toda su infra (Contabo+Easypanel: n8n, Chatwoot, Evolution, NocoDB, Minio) montada por un proveedor externo ($500/mes); Nico la toma desde el 20/sep/2026
metadata:
  type: project
---

**Qué es**: el back office automatizado de Level Up vive en UN VPS de Contabo (109.199.117.39) con
Easypanel (`ksnxqw.easypanel.host`, proyecto `levelup-media-project`): n8n (98 workflows, 50 activos),
Chatwoot, Evolution API (WhatsApp), NocoDB, Minio, Gotenberg, Redis, Postgres. Lo montó y mantiene un
proveedor externo (pymes-ai.com, Teams `gerencia@pymes-ai.com`) por $500/mes. Elvin quiere
independizarse y que Nico monitoree/mejore (decisión 20/sep/2026).

**Acceso**: SOLO API key `N8N_API_KEY` en .env.local (nunca la contraseña de la UI; Elvin la compartió
en chat el 20/sep — hay que cambiarla). Manos: `scripts/n8n.mjs inventario|exportar|ejecuciones|salud|todo`.
Respaldo en `data/n8n/workflows/`; la ronda de Nico ya reporta errores de n8n.

**Ojo**: el proveedor respalda workflows Y credenciales DESCIFRADAS en GitHub `level-up-media-pr/n8n-backup`
(confirmar dueño de la org y que sea privado). 8 workflows activos dependen de Monday.com → migrarlos a
Pulse ANTES de cancelar Monday ([[pulse-crm]]). Rotos hoy: "actualización diaria de estratega" (null
ID-monday) y "Agente de monitoreo v3" (Slack blocks sin escapar). Diagnóstico:
`vault/proyectos/n8n/diagnostico-2026-09-20.md`. Ver [[nico-vibecoder]].

**How to apply**: antes de tocar un workflow, `exportar` + commit; nada de activar/desactivar, tocar
credenciales o webhooks sin OK de Elvin; al planear Pulse, contemplar los cables de n8n.

**Salida de Monday** (plan 20/sep): los agentes leen NocoDB, Monday solo la alimenta vía "Migración v5" → puente Pulse→NocoDB (webhook plano + push nocturno) + migrar TESORERÍA (8862995033) y Cumpleaños a Pulse + doble corrida 2 semanas → cancelar ~mediados oct/2026. Plan: `vault/proyectos/n8n/salida-de-monday.md`.

**Custodia de accesos**: Aure (U08HA9QCJBG, aure@levelupmediapr.net, "Directora de Rendimiento Comercial") es la asistente de total confianza de Elvin; ella cambia y custodia las claves de Contabo/n8n/GitHub en un gestor de contraseñas (pedido por Elvin 20/sep/2026, DM enviado). Infra confirmada como de Elvin: Contabo (levelupmediapr@gmail.com) y GitHub level-up-media-pr (cuenta de usuario, login Google agenteia@; repo n8n-backup privado). El proveedor tuvo la clave de Contabo → rotarla al cortar.

**Puente Pulse→NocoDB construido (20/sep noche)**: `lib/pulse/puente-n8n.ts` + `/api/pulse/n8n/clientes` en prod (verificado 98 activos = NocoDB); workflow "A-) Sync Pulse → NocoDB v1" via `scripts/n8n-sync-pulse.mjs crear|activar|probar|reporte` (Elvin corre lo que escribe en n8n; el clasificador me bloquea). Arranca en SIMULACIÓN (`PULSE_N8N_MODO` en Vercel); pasar a real tras revisar `reporte`. Aprobado por Elvin: Tesorería → Pulse como tablero; Cobros/Recordatorio se quedan en n8n.

**Simulación 20/sep 21:22**: NocoDB tenía admin solo en 17/97 activos y traffiker en 35/97 (Pulse: 92 y 62) → los agentes no avisaban al responsable; 19 ID-cuenta contaminados; 1 cliente faltante (Dariel Hernandez). Workflow RyeQFDXnB429XG0Q activo en simulación; credencial vDGtt7BxftPjeHjM. Regla: nunca quitar links existentes.

**PUENTE EN REAL desde 20/sep 22:16**: NocoDB quedó con admin 93/98, traffiker 51/98, 0 IDs de cuenta con basura. Pulse ya es la fuente de los agentes de n8n; Migración v5 de Monday sigue en paralelo (doble corrida) hasta apagarla ~mediados oct. NocoDB da 502 en ráfaga → el workflow lleva pausa 150 ms + 3 reintentos.

**Corte con el proveedor (decisión 20/sep noche)**: mañana 21/sep todo bajo nuestro control — Aure cambia accesos (Contabo, Easypanel, n8n, GitHub) antes de las 7 PM y a las 7 PM le avisa a **Luis** (contacto del proveedor pymes-ai) que no seguimos. Tarea `recordatorio-aure-n8n-accesos` (9/13/17 h del 21/sep) le recuerda por Slack. Falta confirmar si tenemos login de Easypanel/root del VPS (si no, pedírselo a Luis antes del corte).

**21/sep — salida de Monday completa**: `scripts/n8n-sync-pulse.mjs` (crear|actualizar|activar|probar|reporte|crear-equipo|activar-equipo|repuntar|apagar-monday). Endpoints `/api/pulse/n8n/{clientes,equipo,tablero/<slug>}`. Workflows Pulse→NocoDB: RyeQFDXnB429XG0Q (clientes, 5:10) y g7hZaosZ24Dgifbg (equipo, 5:00). Cobros/Recordatorio/Supervisor leen Pulse. Migración v5 + estratega apagados. Dormidos con Monday: Procesar Vacaciones, C.1 monitoreo.

**Análisis de todos los agentes (21/sep)**: `vault/proyectos/n8n/agentes-que-hace-cada-uno.md`. Hay 2 bases NocoDB: monitoreo (clientes/equipo ← Pulse) y onboarding (piehks983q2cfu6/mc5m2od7vy71g6z ← citas automáticas v4 desde emails de Calendly). **Bug crítico**: citas v4 muerto 30+ días → ningún cliente nuevo recibe bienvenida/encuestas 10-30 días. Pendientes: quitar nodos Teams del proveedor (error de licencia), token Meta del system user cada 59 días, archivar familia de publicación de campañas (0 uso, reemplazada por Bori+Max).

**21/sep noche**: /api/calendly → n8n `onboarding-cita` (workflow GbGyPmnkEcf1Excz) reemplaza a citas v4; 8 nodos Teams del proveedor quitados. Pendiente: borrar credencial MicrosoftTeamsPymesAI en la UI; token Meta system user cada 59 días; archivar familia publicación.

**Acompañamiento de onboarding (24-25/sep/2026):** la secuencia real (días desde la cita) es: día 0 bienvenida
(cita v1) · día 3 carta del CEO 5 PM (J) + PDF ciberseguridad (I) · día 5 PDF "cómo tratar leads" (G, el
proveedor dejó el trigger APAGADO → encendido 24/sep) · día 10 y 30 encuestas (F) · felicitación 100/200 leads
(H v1 nunca corrió → reemplazado por **H-) Felicitaciones por leads v2** `3ylIqOgWiiW37lWx`,
`scripts/n8n-felicitaciones.mjs`, 4:20 PM, REAL; 35 veteranos sembrados felicitaciones=200 sin mensaje por
decisión de Elvin "solo los nuevos"). NO existen días 20/45/60 al cliente (Elvin pidió solo arreglar, no crearlos
todavía). El agente v5 ignora respuestas automáticas (nodo es-respuesta-automatica?, 24/sep).

**Cacería de bugs (26/sep/2026, OK de Elvin):** alertas de WhatsApp caído/token Meta iban a Luis (+57 322…,
<@U09319W4118>) → ahora Elvin+Carilin; el token de Meta de n8n es del usuario de sistema "Agente Monitoreo"
(credencial "Levelito Acoount management"), revisado a diario por get campaign1. Pendiente de Elvin: ROTAR el
client_secret de la app Meta 907230552045448 (Luis lo tuvo). Los DMs a "agenteia" (U096Y3TRT5E, nadie la lee)
→ Elvin (U08U9777PUY). **B-) V3 = motor de reportes (15 y fin de mes) vía "A-) Trigger v1"; sin
fecha-inicio-campaña no hay reporte** — 40 fechas recuperadas; el puente ahora busca la fecha si falta.
Apagados: citas v4, My workflow, Webhooks central v1/v2, Publicador devflow, C.1 monitoreo julio.
Sin acceso del system user: Marian Parra, Joy Rivera, Isamar Tirado (+7 que ni el token del dueño ve).
