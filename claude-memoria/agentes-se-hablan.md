---
name: agentes-se-hablan
description: Cómo se comunican Sofi/Nico/Max/Lola entre sí (buzón /api/agentes + scripts/agentes.mjs, ⟳ SEGUIR desde 26/sep) y con el equipo humano (DM de Slack con el bot); reglas y trampas
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

**26/sep/2026 — terminan lo que empiezan.** Elvin: "Nico le pide diseño a Lola… no se entienden… después que
las hace no las termina". Causa real: la respuesta de otro agente NO despertaba a Claude (ahorro de tokens del 21/sep),
así que el pedido moría (26/sep: Nico preguntó a Lola por el leaderboard de Aure #44, Lola contestó #45, nadie le
cerró a Aure; 24/sep: tanda 2 de ISLA "espera OK" sin dueño). Arreglo: cada `mensaje` lleva ⟳ SEGUIR [origen·n] y
la respuesta despierta al que pidió (`continuarTrabajo`), que entrega al origen (Telegram de Elvin / agente / solicitud
de Carilin-Aure en solo lectura). Otro bug: `atendido` fallaba con "agente-desconocido" al responder a aure/carilin
(no tienen buzón) — arreglado. Sofi/Lola/Max corren desde un clon de GitHub (`agente-nube.sh`). Nico sigue sin
poder desplegar/leer Resuelto: su RAILWAY_API_TOKEN no incluye ese proyecto (lo tiene que dar Elvin).

Relacionado: [[sofi-coordinadora]], [[nico-vibecoder]], [[lola-creadora-ia]], [[meta-ads-agente]].
