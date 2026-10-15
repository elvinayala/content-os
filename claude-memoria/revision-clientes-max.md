---
name: revision-clientes-max
description: Revisión de cuentas de clientes LU por Max (v2 15/oct) — resumen claro al estratega + caso en Ritmo que marca ejecutado/por qué; dos veces al mes si acuerdo ≥ $3K Y pago inicial ≥ $1.5K
metadata:
  node_type: memory
  type: project
  originSessionId: b1c0115b-5f57-4bd7-92f4-32fd5b54804a
  modified: 2026-10-15T22:29:07.710Z
---

15/oct/2026, Elvin pidió que Max revise clientes con su skill, y el mismo día la v2: "tenemos que saber si lo hicieron".

- **Cadencia**: acuerdo ≥ $3,000 **y** pago inicial ≥ $1,500 → dos veces al mes; lo demás mensual (29 / 67 al 15/oct). Carilin verifica los montos en Pulse ANTES de arrancar (Max le escribió desde la cuenta de Elvin el 15/oct). La revisión está **en pausa** (`pausa` en `data/meta-ads/revisiones/estado.json`) hasta que ella confirme.
- **Resumen** (al estratega): costo por resultado máx/mes/7d/hoy → costo alto vs CTR (🔴 reemplazar ya / 🟠 revisar / 🟡 rotar) → 🚀 escalar (< $1 surf/vertical/horizontal; ≤ $2 con CTR alto, evaluar) → 📐 estrategia de 5 fases (8-12 campañas) → 🔁 frecuencia > 1.8.
- **Seguimiento**: Ritmo → Cuentas (`/ritmo/cuentas`): cada punto se marca Ejecutado o No + por qué; dirección de tráfico = María del Carmen (maria.valencia@), Juan Diego Guzman (juan.guzman@, NO Juan David) y Carilin: cierra "ya está bien" o pide optimización. Recordatorio a 2 días hábiles, aviso a la dirección a 4.
- **Para prender**: quitar `pausa` del estado.json y poner `REVISION_CUENTAS=on` en Vercel (antes: vista previa, solo Elvin ve los casos). Caso de prueba #1 (Magdalys, vista previa) creado el 15/oct.
- Interpretaciones a confirmar con Elvin: "selfies" = escalado **surf**; "CTR alto" = ≥ 3 %; CTR = `unique_ctr`.

**Why:** Elvin quiere saber que los estrategas ejecutan lo que se pide y tener las cuentas flojas visibles en Ritmo.
**How to apply:** cambios de criterio → reglas puras (`scripts/meta-ads/revision.mjs`, `lib/desempeno/optimizaciones-reglas.ts`) + tests. Relacionado: [[meta-ads-agente]], [[ritmo-desempeno]], [[cuentas-meta-onboarding]].
