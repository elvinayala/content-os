---
name: plan-listo-alerta
description: 19/oct — "PLAN LISTO | Negocio | …" en #office-5-revision-estrategica = alerta a Elvin por Telegram con datos de Pulse; el canal es también el de Leo
metadata:
  type: project
---

19/oct/2026, Elvin: los estrategas suben en #office-5-revision-estrategica (C0C3SKWHZ50) el plan completo de un cliente nuevo para que él o Carilin lo aprueben; quiere alerta por Telegram con dueño, negocio, pago inicial, etc.

- Ese canal ES el del Director Creativo (Leo revisa cada pieza), así que solo avisa el mensaje principal que empieza con **"PLAN LISTO | Negocio | …"** (o dice "plan completo" / "listo para arrancar"). Piezas sueltas no.
- Código: `lib/estrategia/plan-listo{,-reglas}.ts`, gancho en `app/api/slack-eventos` (rama del director). Acuse en el hilo.
- 19/oct: avisado en el canal (Max, desde el bot, mencionando a Carilin) con el formato y el ejemplo. Avisos al canal de Leo van por el bot: un mensaje de persona dispara a Leo y la frase "plan listo para" dispararía una alerta falsa.

**Why:** Elvin quiere enterarse en el momento en que un cliente nuevo está listo para salir, sin leer el canal.
**How to apply:** si cambia la señal o los datos de la alerta, tocar las reglas puras + tests. Relacionado: [[director-creativo-slack]], [[revision-clientes-max]].
