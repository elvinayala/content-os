---
name: bori-flyers-venta
description: "Flyers de Bori = Nano Banana Pro con estructura fija de venta (foto del producto + título + CTA + beneficios); nunca flyers malos, sin detalles de IA ni íconos genéricos"
metadata:
  node_type: memory
  type: feedback
  originSessionId: f903cebd-d0d1-42f4-8fcd-b06da4b4ddc6
  modified: 2026-10-18T00:14:29.644Z
---

Elvin, 17/oct/2026, tras la queja del vendedor de Mitsubishi (Tu Vendedor Con Propósito: la IA le cambió la Outlander blanca por una SUV gris y hasta por un BMW): "con Nano Banana Pro no debe haber forma de crear malos flyers". El flyer de Bori se genera con **Nano Banana Pro** (fal `nano-banana-pro/edit`) a partir de una **estructura simple** que se le pide al cliente: **foto del producto**, **título**, **CTA** ("cartuchón" en su dictado) y **beneficios**. Simple, minimalista, elegante, profesional, **siempre premium y enfocado en venta**; **sin detalles de IA** y **sin íconos genéricos**.

**Why:** un flyer malo (producto cambiado, texto inventado, look de IA) le cuesta clientes a Bori; el vendedor canceló por eso. Elvin no quiere un compositor por código como camino principal: quiere la calidad de Nano Banana Pro bien guiada.

**How to apply:** en Bori (y en Lola/Max, ver [[lola-creadora-ia]]), todo flyer de producto exige la foto real y la usa como referencia; el texto es exactamente el que el cliente dio (validado: título corto, ≤3 beneficios, CTA corto, sin "gratis"); el prompt prohíbe íconos, emojis, clip-art, texto extra y otras marcas. Hay un compositor "foto tal cual" hecho por código en la rama `fix/foto-tal-cual` (commit bd7c803), no en producción, que queda solo de respaldo. Relacionado: [[bori-backend-real]].
