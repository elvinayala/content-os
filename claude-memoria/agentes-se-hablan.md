---
name: agentes-se-hablan
description: Cómo se comunican Sofi/Nico/Max/Lola entre sí (buzón /api/agentes + scripts/agentes.mjs) y con el equipo humano (DM de Slack con el bot); reglas y trampas
metadata:
  type: project
---

Pedido de Elvin (20/sep/2026): "los agentes se tienen que poder hablar entre sí y con mi equipo".

- Buzón: `POST/GET /api/agentes` (tabla `agentes_mensajes` en Supabase/Pulse, CRON_SECRET).
  CLI `scripts/agentes.mjs` (mensaje · buzon · atendido · historial · equipo · slack · elvin).
  Cada puente lo revisa cada 20 s (`buzonLoop`) y atiende con su persona, en serie con Telegram.
- Probado 20/sep: Sofi → Nico → respuesta a Sofi; Sofi le mandó un DM real a Aure (logística
  oct) con el bot Command Center — **el bot puede escribir DMs directos a cualquier miembro**
  (chat.postMessage con user id funciona; `conversations.open` no, falta im:write; el bot NO
  puede crear canales).
- Trampa: Claude a veces cierra el mensaje con `atendido <id> "…"` (que ya responde) → el puente
  verifica el estado antes de cerrar para no duplicar.
- Reglas: a Elvin y entre agentes libre; al equipo humano solo lo que permite el cerebro (Sofi:
  Aure/Carilin logística; Max: Aure trazabilidad; Nico/Lola: nada sin OK); nunca clientes.
- Pendiente detectado por Sofi (20/sep): `data/estudio.json` perdió cambios escritos desde el
  puente (posible pisada por sync-data pull / git pull; agravado por VERCEL_TOKEN inválido en
  Railway). Nico lo tiene en su buzón (#5).

Relacionado: [[sofi-coordinadora]], [[nico-vibecoder]], [[lola-creadora-ia]], [[meta-ads-agente]].
