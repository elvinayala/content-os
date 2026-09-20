---
fecha: 2026-05-06
fuente: granola
unidad: ai-borinquen
tags: [desarrollo, problemas-tecnicos, clientes, voz]
---
# Desarrollo — problemas técnicos de agentes de voz (David IA)

Revisión técnica de agentes de voz con David: fallos en Crystal Law, migración de plataforma y voces propias.

## Señales / decisiones
- **Crystal Law:** agente colgando llamadas ("hola, soy Óscar" y cuelga). No pasaba con el agente anterior. Evaluar migración a Retell (workflows simple/multiagéntico/expresivo).
- **Sonia:** agente posiblemente desconectado (llamadas de 2 min); pendiente call forwarding.
- Crear 3 voces puertorriqueñas con ElevenLabs (empezar clonando la voz de Elvin).
- Migrar clientes antiguos sin CRM a Go High Level; descontinuar YCloud para nuevos.
- Sitio demo: contador de llamadas en vivo, garantía cambia de 100 a 15 días, "equipo boricua de 10 personas".

## Action items
- Prioridad 1: resolver Crystal Law (investigar Retell, costos/workflows).
- David → Elvin: enviar guión para clonación de voz.
