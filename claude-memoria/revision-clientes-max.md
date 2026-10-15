---
name: revision-clientes-max
description: "Max le manda a Elvin la revisión de anuncios de cada cliente de LU (15 días si acuerdo ≥ $3,000 o pagó ≥ $1,500 de una; 30 los pequeños) con su método fijo"
metadata:
  node_type: memory
  type: project
  originSessionId: b1c0115b-5f57-4bd7-92f4-32fd5b54804a
  modified: 2026-10-15T21:57:17.336Z
---

15/oct/2026, Elvin: "que Max me ayude a revisar clientes, tenga mi skill y me envíe reporte para entrar a la reunión con la data o ya saber qué ajustar".

- **Cadencia**: CLIENTE ACTIVO de Pulse con acuerdo ≥ $3,000 o Pago Inicial ≥ $1,500 → cada 15 días; el resto (paquetes pequeños) → cada 30. 96 clientes al 15/oct: 67 + 29.
- **Orden fijo del reporte**: costos máximo → último mes → 7 días → hoy · lo que funcionó · caros (se cambia el CREATIVO, no la campaña) · qué escalar (con su OK) · flyers/videos con CTR único < 2 % → reemplazar y rotar · frecuencia > 1.8 (en esta revisión el tope es 1.8, no el 2.5 del cerebro).
- **Cómo**: skill `.claude/skills/revision-clientes`, `scripts/revision-clientes.mjs` (lista | cliente | hoy --enviar), tanda L-V 7:30 AM PR desde el puente de Max por su Telegram (≈ 8/día, sin costo de IA). Detalle en CLAUDE.md y cerebro de Max §23.
- CTR elegido = `unique_ctr` ("CTR único (todos)"); si Elvin quiso el de clics en el enlace, se cambia en `scripts/meta-ads/revision.mjs`.
- 6 cuentas no se leen (no compartidas con el portafolio Level Up con acceso a anuncios, p. ej. Quiroplaza) y 2 sin ID: el reporte lo dice.

**Why:** Elvin revisa cada cliente antes de sus reuniones y no quiere armar la data a mano.
**How to apply:** cualquier cambio de criterio de Elvin (umbrales, orden, cadencia) va en las reglas puras + tests, no en el prompt. Relacionado: [[meta-ads-agente]], [[cuentas-meta-onboarding]], [[carilin-revision-clientes]].
