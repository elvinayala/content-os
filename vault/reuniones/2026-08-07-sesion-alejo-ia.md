---
fecha: 2026-08-07
fuente: granola
unidad: ai-borinquen
tags: [reunión, alejo, ia, arquitectura, agentes, rag, white-label, legal]
---

# Sesión Alejo IA — arquitectura de agentes y white label (07/08)

**Resumen:** Consultoría técnica con [[alejo]] sobre dos casos reales. **Cliente 1**
([[all-in-movement]] / red de mercadeo fusionada con la comunidad de Cristín D'Clario):
Alejo tumba la idea de dos agentes y recomienda **uno solo con lógica de estados por
tags**. **Cliente 2** (universidad cristiana que quiere revender su app de citas por voz
como **white label**): Alejo frena el desarrollo hasta responder las preguntas de
propiedad, financiamiento y soporte — y advierte de las implicaciones legales de la voz
con IA.

## Decisiones

- **Un solo agente, no dos** (Cliente 1). Un único webhook evita complejidad de
  enrutamiento; dos agentes = más puntos de falla y más costo operativo.
- **Lógica de estados por tags**: número + evento + estado de inscripción habilita
  distintas herramientas. Un inscrito al evento X tiene habilitadas A, B, C; alguien solo
  preguntando tiene inscripción y calendario. Equivale a varios agentes lógicos dentro de
  uno, con un "switch".
- **El asistente NO cierra ventas** — solo informa, recuerda reuniones y guía al usuario.
  El cierre lo hace el equipo humano.
- **Escalabilidad escalonada**: más workers según demanda, se cobra por capacidad usada y
  no fija. Se valida con **pruebas de estrés antes del lanzamiento** (simulando miles de
  conversaciones).
- **CRM propio por número de teléfono como ID único.** El usuario puede estar en varios
  eventos a la vez; se almacena por evento + usuario.
- **RAG acumulativo del historial** de todas las conversaciones del usuario → respuestas
  contextualizadas (*"en el evento X tratamos esto, acá lo ampliamos"*). Es lo que da la
  experiencia de vendedor que se acuerda del cliente, y sirve para remarketing/segmentación.
- **Cliente 2: no desarrollar desde cero.** Alejo sugiere explorar **CRM open source
  adaptado**. Y la regla comercial: **llegar con propuestas concretas, no solo con
  preguntas**, para no perder al cliente.

## Preguntas abiertas del Cliente 2 (universidad → white label)

Sin estas respuestas no se avanza: ¿quién financia el desarrollo? ¿quién es dueño del
producto y del código? ¿cuántas universidades esperan vender, hay validación de mercado?
¿cuánto presupuesto y en qué tiempo? ¿quién da **soporte nivel 1** a los clientes finales?

⚠️ **Legal:** las llamadas de voz con IA requieren **declaración explícita** según
jurisdicción.

## Acciones

- **Carilin:** enviar a Alejo el documento de preguntas del Cliente 2 + las notas de la
  reunión previa, para que revise el alcance antes de la siguiente reunión.
- **Alejandro:** confirmar disponibilidad para la reunión del martes (Carilin coordina con
  el equipo 8 a 5 hora Colombia; Alejo confirma si puede o prefiere 6 PM).
- **Equipo:** agendar reunión Elvin + Carilin + Alejo para jueves o viernes, después de la
  del martes.
- **Carilin:** compartir con Alejo la estructura del agente del Cliente 1 para **double
  check antes del lanzamiento**.

## Contexto del Cliente 1

Red de mercadeo fusionada con la comunidad de Cristín D'Clario. Lanzamiento con evento
grande y después operación continua y cíclica, con **eventos recurrentes** y speakers
propios (no un lanzamiento único). Dos vertientes en la plataforma: **espiritualidad y
comunidad** (contenido constante, cápsulas, videos) y **negocio y monetización** (proceso
de entrada, equipo de cierre).

## Conexiones

[[alejo]] — [[all-in-movement]] — [[autoflow]] — [[ai-borinquen]] — [[carlos-caban]] —
[[estabilidad-producto]]
