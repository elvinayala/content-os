---
fecha: 2026-07-21
fuente: memoria
unidad: ai-borinquen
tags: [entidad, tema]
---
# Estabilidad del producto (Railway / crash-loop)

**Qué es:** El incendio técnico abierto de [[ai-borinquen]]: los servicios `ai-borinquen-voz` y `bori` entraron en **crash-loop de días en Railway**. Prioridad #1 de producto — bloquea conectar más clientes.

## Resumen acumulado
La tesis de Elvin es *"el que haga un producto 100% validado que funciona, no tiene competencia"* — por eso **estabilizar es prioridad #1 antes de escalar ventas**. En julio, el agente de voz de AIB (`ai-borinquen-voz`) y el servicio `bori` entraron en un loop de crashes en Railway que se extendió por días y bloquea la prueba de voz outbound con el cliente [[Kevin]]. Contexto técnico: deploy vía Railway → GitHub (repo `dashboard-ventas-ea-market-llc`, root `voice-agents`, branch `reel-studio`, vars `RETELL_API_KEY` + `RETELL_FROM_NUMBER`); Retell insiste con endpoints deprecados y [[Vapi]] avisa que las URLs de grabación pedirán auth desde el 15/07. En paralelo, el deploy de producción del Command Center (`content-os`) falló en Vercel (10/07) y quedó viejo. Es un freno interno que alimenta la objeción "se nota que es un robot / esto no funciona".

## Línea de tiempo
- 2026-07-10 — `bori` crashea de madrugada (1:23 AM) y `ai-borinquen-voz` entra en **loop de crashes** todo el día (múltiples horas); bloquea la prueba con [[Kevin]]; deploy de `content-os` falla en Vercel ([[2026-07-10]]).
- 2026-07-11 — `ai-borinquen-voz` vuelve a crashear (~2:30 PM); el fallo de Railway ya lleva 24h+; deploy del Command Center sigue pendiente ([[2026-07-11]]).
- 2026-07-12 — **Crash-loop x2**: `ai-borinquen-voz` (02:39 AM) y `bori` (03:01 AM) caídos a la vez el fin de semana ([[2026-07-12]]).
- 2026-07-18 — Primer paso sistémico: con [[alejo]] se decide implementar **PostHog** para
  métricas de agentes (arranca el lunes) ([[2026-07-18-alejo-mentoria-ia]]).
- 2026-07-21 — La estabilidad se vuelve **disciplina de medición**: *"el problema no está en la
  creación de los agentes… es que no estamos midiendo nada"*. Se define el dashboard de
  observabilidad por asistente (latencia ideal ~1,300-1,400 ms, costo/minuto, duración, errores,
  desvíos a humano, guardrails) que los devs revisan a las **8 AM diario** — dejar de depender
  del feedback del cliente para enterarse de fallos ([[2026-07-21-carilin-revision-clientes]]).

## Conexiones
[[autoflow]] — es el producto que está inestable; hasta estabilizarlo no se conectan clientes nuevos. [[churn]] — un producto que falla alimenta bajas y objeciones. Bloquea la prueba con el cliente Kevin ([[2026-07-07-general-aib]]). Prioridad reforzada en [[perfil-ceo]].
