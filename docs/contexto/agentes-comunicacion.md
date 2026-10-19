## Los agentes se hablan entre sí y con el equipo (20/sep/2026)

Elvin: "Sofi le pide algo a Nico, Max le pide algo a Nico, y con mi equipo personal también".
**Buzón compartido** `app/api/agentes/route.ts` (tabla `agentes_mensajes` en la base de Pulse,
auth `CRON_SECRET`, público en `proxy.ts`) — el único punto común entre los contenedores de
Railway y la Mac. **Herramienta** `scripts/agentes.mjs` (identidad = `PUENTE_BOT`, sin él = Sofi):
`mensaje <sofi|nico|max|lola> "…"` · `buzon` · `atendido <id> "respuesta"` (la respuesta vuelve al
buzón del que preguntó) · `historial` · `equipo` (directorio Slack) · `slack <nombre> "…"` (DM por
Slack con el bot Command Center, firmado; el bot SÍ puede escribirle directo a cualquiera del
equipo) · `elvin "…"` (Telegram del bot + espejo Slack). El puente (`buzonLoop`, cada 20 s) atiende
lo que le llega como un mensaje de Telegram — en serie con Telegram (`enSerie`, una sola sesión de
Claude por agente) — y cierra/responde solo si Claude no lo hizo. Todo se espeja al DM de Slack de
Elvin como `[Agentes] X → Y`. Reglas de comunicación en el sufijo `COMUNICACION` de todas las
personas: libre entre agentes y con Elvin; al equipo humano solo lo que el cerebro de cada uno
permite; nunca a clientes; nunca secretos.

**Terminan lo que empiezan (26/sep/2026).** Elvin: "Nico le pide diseño a Lola… no se entienden… después que las
hace no las termina". Cada `agentes.mjs mensaje` lleva **⟳ SEGUIR [origen·n]** (el origen real del trabajo lo pone el
puente en `AGENTE_ORIGEN`: `telegram` · `buzon:<id>:<de>` · `solicitud:<id>:<de>` · `aprobada:<id>:<de>` · `slack`);
la **respuesta despierta al que pidió** (`continuarTrabajo` en el puente), que termina y entrega al origen: Elvin por
Telegram, el agente que lo pidió (cierra su pedido), o el diagnóstico actualizado de una solicitud de Carilin/Aure
(solo lectura hasta el OK; `PARA AURE: …` se le manda en su hilo). Un pedido que delegó queda abierto hasta esa
respuesta. Topes: profundidad 3 y `AGENTES_CONTINUAR_MAX_DIA` (20). `--sin-seguir` = aviso sin respuesta. Si una
corrida se queda sin pasos (`error_max_turns`) sigue una vez sola (`correrYTerminar`). Lógica pura en
`scripts/agentes-seguir.mjs` (tests). `atendido` ya no falla con "agente-desconocido" al cerrar solicitudes del equipo.
**Sofi, Lola y Max corren desde un clon de GitHub** (`scripts/agente-nube.sh`, `Dockerfile.puente`, llave
`GIT_SSH_KEY_B64` por referencia a nico): bajan content-os antes de cada pedido y suben solo `data/` y `vault/`
(antes su copia era la de su último deploy: "el kit de marca no existe") y deploy-snapshots ya no sube código viejo.
