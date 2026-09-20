---
fecha: 2026-09-03
fuente: granola
unidad: ai-borinquen
tags: [reunión, claude, autoflow, onboarding, ana-milena, procesos]
---

# Claude Pro y construcción de agentes — Ana Milena (03/09)

**Resumen:** Sesión de método con Ana Milena sobre cómo construir asistentes
[[autoflow]] con Claude Pro: primero el proyecto con TODO el contexto del negocio,
después la subcuenta de [[crm-ghl]], después los agentes, y solo al final la API de
Anthropic. También se define cómo repartir los onboardings cuando entre gente nueva.

## Decisiones

- **Orden fijo del build:** proyecto en Claude (con SOP, info de [[autoflow]],
  servicios/productos/web del cliente) → subcuenta en GoHighLevel → agentes (chat o
  voz, uno a la vez) → comprar la API en Anthropic Console → conectar el demo.
- **Regla de contexto:** *nunca dar información a medias* — si el material del
  cliente no está completo, no se arranca.
- **Uso de modelos por tarea** para no quemar créditos: Haiku para planificar y
  cargar contexto inicial, **Opus para construir el asistente**, Sonnet para
  preguntas rápidas. Si se acaban los créditos Pro, pedir permiso a Gary antes de
  comprar más (solo si el proyecto es urgente).
- **Sin API conectada el asistente es un bot genérico sin memoria.** Con la API
  (+ Cloudflare) tiene memoria y capacidades completas.
- **Reparto de onboardings:** Ana Milena sigue con todos por ahora; cuando entre la
  persona nueva, esa toma los de marketing y **Ana Milena queda solo con asistentes**.
  Si la carga se vuelve insostenible, avisar a Karen.

## Acciones

- **Ana Milena:** apoyarse en Juan David o [[alejo]] para dudas técnicas (Alejo tiene
  sesión semanal de preguntas).
- **Marilyn:** enviar hoy el acuerdo nuevo a Ana Milena para revisión.
- **Equipo:** seguir aprendiendo herramientas más allá del flujo actual.

## Conexiones

[[ai-borinquen]] — [[autoflow]] — [[crm-ghl]] — [[alejo]] — [[onboarding-auditoria]]
