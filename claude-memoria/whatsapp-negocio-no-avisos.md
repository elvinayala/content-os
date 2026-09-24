---
name: whatsapp-negocio-no-avisos
description: Nunca usar el WhatsApp del negocio (Zernio/Cloud API) para avisos internos a Elvin o al equipo — así Meta bloqueó a Resuelto por SCAM
metadata:
  type: feedback
---

Los avisos internos (candidatos, escalaciones, alertas) van por **Telegram o Slack**, NUNCA por el número de
WhatsApp del negocio (plantillas ni texto libre al número de Elvin).

**Why:** 23/sep/2026, 8:46 PM — Meta marcó la WABA de Resuelto (939-247-9234) con ACCOUNT_VIOLATION tipo SCAM:
el agente le había mandado 35 avisos a Elvin en 2 días (plantilla aviso_equipo_resuelto) con nombres, licencias y
teléfonos de candidatos, y él contestó 1. El último salió 5 min antes del bloqueo. Elvin lo identificó.

**How to apply:** en cualquier agente de WhatsApp (Resuelto, Bori, AutoFlow de clientes) el WhatsApp del negocio
solo le habla a quien le escribió primero. Revisar que `avisarCoordinador`/escalaciones no usen el canal WA.
Relacionado: [[plomeria-pr-vision]], [[bori-agente]].

**Protección construida (23/sep, noche):** `agente/src/canales/salud-wa.ts` — vigilante cada 10 min (Zernio
`/accounts?platform=whatsapp` → businessStatus/metaStatus/calidad), modo caído (Telegram a Elvin + Slack a Yaileen,
el agente no envía y pasa a Yaileen a cada persona que escribe), candado (nunca iniciar a internos, tope 40
iniciados/día), `GET /salud/whatsapp` (503 si caído) en la ronda de Nico, `POST /admin/salud-wa/resuelto` al
recuperar. Campaña "Plomeros · WhatsApp · Sprint 1" (120255016399820029) PAUSADA por mí esa noche; Elvin reactiva.
Copiar el patrón a Bori cuando conecte su número.

**Estado 24/sep/2026 (madrugada):** Meta desactivó el NEGOCIO Resuelto para WhatsApp ("Condiciones de uso
aceptable", permanente) — ninguna WABA nueva del portafolio funciona (una creada al intentar conectar nació
inhabilitada por "Política de comercio"). Apelación enviada (24–48 h). NO crear portafolio nuevo (evasión → riesgo
al Facebook de Elvin y las agencias). Número nuevo comprado en Zernio: 787-956-1111 (perfil "Resuelto WhatsApp",
$3/mes), sin conectar hasta que liberen. Mientras: reclutamiento por Messenger + IG DM (agente contesta vía Zernio,
pide teléfono), campaña 120255088992780029 en pausa, web con cfg.chat → m.me. Flyers: NUNCA número ni "WhatsApp".
Ads de reclutamiento: categoría especial EMPLOYMENT obligatoria (sin género, 18–65).
