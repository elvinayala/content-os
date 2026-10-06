---
name: autoflow-zernio-canales
description: "AutoFlow usa Zernio SIEMPRE como única API de canales (número, WhatsApp, IG/FB, SMS, llamadas→Retell por SIP), EXCEPTO clientes médicos (HIPAA), que van por Meta oficial en GHL + Retell"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d3473229-c18c-40be-adad-cdb16afcaf49
  modified: 2026-10-06T03:00:56.209Z
---

Regla de Elvin (5/oct/2026): "solamente para los clientes médicos, por lo de HIPAA, tenemos que tener
precaución; con los demás nos vamos por ahí [Zernio] siempre".

- **No médico** → Zernio sin preguntar: número comprado/portado en Zernio (comprar = gasto, OK de Elvin),
  WhatsApp registrado por API, DMs/comentarios de IG/FB por su bandeja (un perfil por cliente), SMS, y el
  número enlazado a Retell por SIP trunk (el cerebro de voz sigue en Retell). GHL queda para pipeline y
  calendario. Llave: `AIB_ZERNIO_API_KEY` (cuenta de AIB; nunca la de Resuelto, equipo aparte).
- **Médico** (consultorio, clínica, laboratorio, dental, terapia, salud mental, todo lo que toque datos de
  pacientes) → NUNCA Zernio: Meta oficial dentro de GHL (o GoGHL) y número/voz en Retell. Ningún dato de
  pacientes en Slack/Telegram. En duda → tratarlo como médico y preguntar.

**Why:** Zernio no menciona HIPAA ni ofrece BAA en su documentación; para el resto, una sola API simplifica y
abarata (número ~$3/mes PR, voz $0.01/min).

**How to apply:** en `/autoflow` §4 y cerebro de Nico §8. Ángelo/Quality Care (médico) no se toca. Pendiente
5/oct: Elvin tiene que crear la cuenta de Zernio de AIB y pasar la API key. Relacionado: [[aib-onboarding-agente]], [[voz-stack-2026]].
