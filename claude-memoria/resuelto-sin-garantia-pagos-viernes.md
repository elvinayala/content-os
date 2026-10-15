---
name: resuelto-sin-garantia-pagos-viernes
description: 14/oct/2026 — Resuelto YA NO ofrece garantía de 12 meses (solo destapes 30 días); a los plomeros se les paga todo completo los viernes (piezas incluidas, ya no en 48 h); calculadora de precios de Aure en prod
metadata:
  type: project
---

Pedido de Aure a Elvin (14/oct/2026), hecho el mismo día:

1. **Sin garantía de 12 meses / 1 año** en app, agente, landing (resueltopr.com), propuestas, contratos y anuncios. `menu.json garantia_meses = 0`. Solo los **destapes** mantienen **30 días** (regla de Elvin del 30/sep). Re-trabajos sin costo quedan **a criterio del equipo** (portal → "Re-trabajo sin costo"). Copy de reemplazo: "pagas al terminar" — salvo trabajos grandes (cisterna, solar), que llevan depósito al agendar: ahí solo "Plomero licenciado de tu zona".
   - **Why:** decisión de negocio (Aure/Elvin); prometer 12 meses era una carga.
   - **How to apply:** nunca escribir "12 meses de garantía" ni "garantía por escrito" en piezas de Resuelto. Los 10 anuncios activos se cambiaron con `kit/anuncios/quitar-garantia.mjs` (registro en `data/meta-ads/campanas/resuelto-sin-garantia-2026-10-14.json`). Los anuncios PAUSADOS y otros flyers/gráficos viejos (g-inodoro, g-bomba, c2-promesa, f02…) todavía la tienen: arreglarlos antes de reactivarlos. Fuentes ya limpias: `flyers-clientes-regiones/{generar,familia}.mjs`, `videos/resuelto-clientes-15s.mp4`.
2. **Plomeros: pagos completos y únicamente los viernes** (comisión 65 % + piezas 100 % + 10 % juntas). Se quitó el reembolso de piezas en 48 h del contrato (`kit/afiliacion/generar.py` → plantillas de Firmas), de la app, del agente y del cálculo (`cuenta-plomero.ts`: `aPagar` = comisión + piezas; "Marcar pagado" marca también las piezas).
3. **Calculadora de precios** para Aure (pedido #258/#324 de Nico, que la hizo pero no podía desplegar): `https://app.resueltopr.com/calcular-precio?k=c8a936375188654c31cfb5b6` (link privado). Menú → precio; fuera del menú → "cotización personalizada" con preguntas al cliente (decisión de Elvin, no inventar fórmula).

Relacionado: [[plomeria-pr-vision]], [[resuelto-como-vender]], [[resuelto-presupuesto-ads]].
