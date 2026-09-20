---
fecha: 2026-08-27
fuente: granola
unidad: level-up
tags: [reunión, carilin, clientes, autoflow, twilio, churn, impuestos, calidad]
---

# Gestión de asistentes y clientes — Aida Piñera y Vagón PR (27/08)

**Resumen:** Operativa con [[carilin]]. Tres frentes: la **transición del
desarrollador David**, un **fallo de calidad grave del asistente de chat de Aida
Piñera** que dejó leads calientes sin cerrar, y el caso Twilio de Vagón PR. Más
impuestos de Colombia y el canal de bajas.

## Aida Piñera (estética) — fallo de calidad del asistente

Revisión de conversaciones en [[crm-ghl]] mostró errores graves en producción:

- Responde repetidamente *"Hola, Mildred"* sin avanzar la conversación.
- Manda el mismo párrafo varias veces seguidas.
- Respuestas demasiado largas; deben ser cortas y conversacionales.
- **Lead de remoción de microblading lista para comprar y nunca se cerró.**
- La cuenta tiene **casi 100 leads y solo se revisaron cuatro**; Aida no está llamando
  ni revisando conversaciones.
- El cliente no quiere calendario integrado (agenda manual); lo ideal sería conectarlo.

**Regla que sale:** el asistente debe **pasar pruebas de entrega antes de salir al
cliente** — errores como respuestas repetidas no deben llegar a producción
([[estabilidad-producto]]).

## Vagón PR — asistente de voz (Twilio)

Clientes reportan que las llamadas no entran al asistente; Elvin y David sí pueden
llamar. Soporte de Twilio confirma que **el problema es del proveedor del cliente**,
no de Twilio ni del sistema. El número ya fue transferido a la cuenta del cliente.

**Política a reforzar:** no transferir un proyecto hasta confirmar si el cliente toma
mensualidad de mantenimiento. Si no la toma, se entrega funcionando y **el cliente
asume la responsabilidad futura**.

## Transición de asistente (David / Carlos)

Entra persona nueva y se le pasan los proyectos de David gradualmente. **David se
queda solo con la cuenta de Carlos durante el empalme** (proyecto grande, David está
desde el inicio; cualquier fallo ahí sería crítico). Una vez terminado, se evalúa su
salida. Nuevo asistente ya identificado, pendiente si entra mañana o el lunes.

## Impuestos Colombia

Retenciones del año pasado sin declarar: **junio COP $1,706,000 (~USD $560)** en 3
cuotas (ago/sep/oct); **julio COP $1,430,000** pendiente de aprobación DIAN. No se
puede pagar con tarjeta de banco exterior — va por nómina.
**Directiva: pagar todo mensual, sin acumulaciones ni multas.** Este año sí se
presentan mensualmente; se espera saldo a favor a fin de año.

## Canal de bajas ([[churn]])

Se crea canal de Slack para la lista de bajas: María sube la lista, y en el hilo queda
el resultado de cada llamada de Liz — **si contestó, razón de salida, si está molesto,
si quiere comprar algo**. Mismo formato que renovaciones.

## Revisión de julio con tráficos

Pendiente terminar. Errores recurrentes: **públicos de remarketing sin actualizar
(algunos llevan un año)**, creativos sin renovar en más de 3 meses, errores de
[[segmentacion-geografica]].

## Acciones

- **Elvin:** confirmar ingreso del nuevo asistente.
- **Carilin:** enviar correcciones del asistente y mensaje a Aida (leads sin atender,
  ¿está llamando?); escalar Twilio al desarrollador de Vagón PR; enviar el documento
  de retenciones a [[aure]].
- **Equipo:** crear el canal de Slack de bajas.

## Conexiones

[[level-up]] — [[carilin]] — [[autoflow]] — [[estabilidad-producto]] — [[churn]] —
[[crm-ghl]] — [[segmentacion-geografica]]
