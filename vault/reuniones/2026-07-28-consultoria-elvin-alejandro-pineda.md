---
fecha: 2026-07-28
fuente: granola
unidad: ai-borinquen
tags: [consultoria, tecnico, meta, escalabilidad, modelos-ia]
---

# Consultoría Elvin (Alejandro Pineda Alvarez)

**Resumen:** Primera sesión de consultoría con Alejandro Pineda: comunicación de bloqueos de Meta a clientes, un caso de conflicto reportado entre el agente de WhatsApp y las campañas, y una conversación de fondo sobre escalabilidad de la plataforma (500K usuarios) y estrategia de modelos IA (no casarse con un solo modelo).

## Decisiones

- **Doble frente para bloqueos de Meta:** comunicar de forma clara sin que el cliente culpe a la empresa, Y resolver activamente aunque el problema sea de Meta. Crear checklist paso a paso de desbloqueo y documentar errores recurrentes como práctica estándar.
- **Escalabilidad a 500K usuarios** requiere revisar primero arquitectura de BD, infraestructura en la nube y límites de tokens de API; separar ambientes de producción y pruebas.
- **Estrategia de modelos:** rotar según la tarea en vez de casarse con uno solo (ej. Sonnet para informes rápidos en vez de Opus — 30 seg vs 10 min). Modelos open source (Ollama, Qwen, LLaMA) corren localmente; Kimi 3 necesita servidor externo.
- **Cadencia acordada:** dos sesiones semanales — una con el equipo dev, otra con Elvin. Próxima sesión jueves, preferiblemente 7 PM.

## Acciones

- **Elvin:** enviar resumen de temas para el jueves (incluir accesos necesarios).
- **Elvin:** recopilar más detalles del cliente con el problema de campañas/WhatsApp — confirmar si el número fue bloqueado por Meta antes de asumir conflicto con la API.

## Entidades clave

- [[alejandro-pineda]] — consultor técnico, primera sesión formal.

## Conexiones

[[ai-borinquen]] — [[alejandro-pineda]] — [[escalabilidad-plataforma]] — [[meta-bloqueos]]
