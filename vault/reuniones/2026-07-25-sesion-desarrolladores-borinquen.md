---
fecha: 2026-07-25
fuente: granola
unidad: ai-borinquen
tags: [reunión, desarrollo, técnico, arquitectura, meta]
---

# Sesión Técnica — Alejo + Desarrolladores Borinquen

**Resumen:** Consultoría técnica entre Alejo (AI engineer senior contratado) y el equipo dev de Borinquen (David, Juan David, con Ana de soporte). Foco: diagnosticar bloqueos recurrentes con Meta/WhatsApp para agentes conversacionales. Conclusión central: la mayoría de errores de Meta NO son culpa del equipo sino restricciones de portafolio del cliente. La documentación de Meta es pésima. El problema real es de proceso y comunicación, no técnico. Se validó la arquitectura actual (Cloudflare Workers + GoHighLevel) y se acordó centralizar desarrollos, mejorar observabilidad y documentar errores con paso a paso.

## Decisiones

- **Documentación de errores:** armar catálogo de errores Meta (código → causa → solución) con paso a paso en vez de grupo informal.
- **Checklist pre-venta:** validar configuración de portafolio del cliente ANTES de conectar agente.
- **Arquitectura validada:** mantener Meta → Cloudflare Workers (JS) → GoHighLevel; el patrón es tirar de Meta a worker propio, no usar CRM como intermediario del flujo.
- **Observabilidad mejorada:** adoptar PostHog (en lugar de solo console.log) para trackear input/output y errores; evaluar Evals (auditoría automática de respuestas vs. reglas de negocio).
- **Comunicación con cliente mejorada:** cuando surja error, explicar que es restricción de portafolio del cliente (no culpa de plataforma) y dar plan de acción claro con pasos.
- **Alejo como consultor recurrente** para desbloqueos; centralizar desarrollo, no dispersarse.

## Acciones

- **David + Juan:** crear catálogo de errores Meta (código → causa → solución).
- **David + Juan:** crear checklist de configuración de portafolio para validar antes de conectar.
- **David + Juan:** unificar forma de visualizar/trackear errores en Cloudflare.
- **Juan:** investigar PostHog y Evals.
- **Equipo + directivas:** definir proceso para solicitar accesos a portafolios (requiere aprobación directiva).
- **Equipo:** resolver caso pendiente de [[hector-casas]] (método de pago asociado al WhatsApp).
- **Elvin:** enviar nuevo enlace Zoom para continuar (llamada se cortó).

## Entidades Clave

- [[alejo]] — mentor técnico/AI engineer senior; diagnóstico: problema es de proceso y comunicación, no técnico; recomienda usar Alejo como consultor recurrente.
- [[david]] — desarrollador Borinquen; expuso bloqueos con Meta y caso del método de pago.
- [[juan-david-guzmman]] — desarrollador Borinquen; explicó Cloudflare Workers, preguntó sobre PostHog/Evals.
- **Ana (Ana Miriam)** — soporte/enlace clientes; asistió para entender proceso técnico.
- [[elvin-ayala]] — coordinó sesión, presentó a Alejo, definió objetivo.
- [[meta-whatsapp-coexistencia]] — tema — mayor dolor; restricciones de portafolio, documentación pésima, errores no documentados.
- [[gohighlevel]] — CRM intermediario actual; validado como conexión segura y ágil.
- [[cloudflare-workers]] — backend actual (JS), robusto pero débil en observabilidad.
- [[n8n]] — herramienta previa; Alejo confirma que escala (+10k conversaciones) y más fácil para trackear errores (determinístico).
- [[chatwoot]] — CRM open-source; Alejo lo usaba solo para visualización de conversaciones en VPS.
- [[posthog]] — herramienta de tracking; Juan apenas empieza a explorar.
- [[evals]] — modelos de auditoría de conversaciones vs. reglas de negocio.
- [[hector-casas]] — caso bloqueado por método de pago asociado; soluciones probadas sin éxito.
- [[restriccion-portafolio-cliente]] — objeción — causa raíz de la mayoría de errores.

## Frases de Elvin

- "Es como mi receta: mira, yo hago esto así, así, así, así. Eso es un skill."
- "Alejo es un desarrollador ya experimentado... más allá de ser un conocedor, también conoce la industria."
- "Lo que queremos es tener claridad, que puedan resolver bloqueos, que puedan resolver cosas que sean repetitivas... y ayudarnos entre [todos]."
- "Ya instalé el de skill... la estructura de guiones que yo uso, la de hacer los flyers, todo eso ya los convertí en skill."

*Nota: Alejo aporta el mayor peso estratégico. Sus frases clave: "La documentación de Meta es una mierda"; "Nunca es cuál es la arquitectura, sino qué es lo que vas a hacer"; "Lo más importante no son los errores, sino cómo se lo comunicamos al cliente."*

## Decisiones Técnicas / Producto

- **Arquitectura confirmada:** Meta → Webhook propio (Cloudflare, JS) → GoHighLevel (para redes, oportunidades, calendario, visualización); CRM no es intermediario del flujo.
- **Multimedia (audios/imágenes):** workaround actual es delay 1-2 seg antes de mandar al webhook para que llegue la URL y poder transcribir.
- **Observabilidad:** pasar de console.log a PostHog + Evals como guardarraíles que auditan respuestas del agente.
- **Memoria multicapa (referencia Alejo, futuro):** base relacional (IA vs usuario) + embeddings por fase del usuario + base vectorial. Agentes actuales Borinquen NO lo necesitan todavía.
- **Stack referencia Alejo:** Python (Flask) en Google Cloud (GCP): VPS, workers, bases de datos.
- **Casos borde Meta:** crear portafolio/número nuevo e iterar; si persona/razón social está taggeada por Meta, cambiar identidad del negocio, no insistir.
- **Conexión no oficial:** parche actual; arriesga número de WhatsApp del cliente (posible bloqueo).

## Conexiones

[[ai-borinquen]] — plataforma; [[alejo]] — consultor; [[meta-whatsapp]] — integraciones críticas.
