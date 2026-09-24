---
name: plan-de-guerra-q4
description: El plan de guerra Q4 2026 aprobado por Elvin el 18/sep — holding IA Market, portafolio (2 motores, 3 productos, 1 piloto, 5 congelados con trigger), 5 jugadas, 3 contrataciones, reglas de operación; qué se construyó y cómo aplicarlo
metadata:
  type: project
---

**Qué es:** el 18/sep/2026 Elvin, drenado por 13 proyectos vivos (6 abiertos entre el 4 y el
18/sep), pidió "un plan estratégico de guerra definitivo". Se aprobó y vive en
`vault/ceo/plan-de-guerra-2026Q4.md`; el portafolio en `data/portafolio.json` + `/ceo/portafolio`;
las ideas nuevas en `vault/ideas/`.

**Diagnóstico que aceptó:** el cuello de botella es él como único cerebro (60 tareas a su
nombre); Level Up es un balde con hueco (churn 115% en junio, CAC $1,546, ventas nuevas $26–27K);
AI Borinquen no tiene problema de producto sino de demostración (3 cierres/mes, 50% no-show).

**Estructura:** IA Market (holding) → MOTORES Level Up + AIB · PRODUCTOS Bori, Cortex, Shadow
(= departamento de marketing del holding) · PILOTO Resuelto (compuerta 15/nov: ≥3 plomeros y
≥30 trabajos) · CONGELADOS Quilla, Contigo PR, Staff Agency, 1000X, Ventaja (cada uno con
trigger escrito) · servicios compartidos: Estudio, Revenue, Tech, Finanzas.

**Decisiones de Elvin (18/sep):** congelar todo lo nuevo salvo Resuelto; **ninguna empresa nueva
hasta el 12/dic**; caras orgánicas = micro-influencers y clientes-creadores (NO teleprompter; "ya
tengo otras caras pero no venden"); Daren queda solo para anuncios guionados en 1 día de
grabación mensual; presupuesto nuevo fijo $3.7–4.9K/mes: setter boricua AIB (100 % comisión, 10 % por venta, sin base), Head de Crecimiento Bori
($1.8–3K), $1.5K creadores (paquete 3 reels $500–700, 2–3 creadores, 6–9 reels/mes). **La
coordinación de producción NO se contrata: la hace Sofi (agente)** — `/coordinar-produccion`
(tarea `sofi-coordinacion-produccion`, 7:30 AM lun–sáb) con `data/estudio.json` como memoria y
`data/calendario.json` (56 piezas de octubre, origen "estudio") como calendario; solo le escribe a
Elvin por DM, nunca a caras/creadores. Caras: Elvin (Shadow), Daren (ads LU), Frankie Jay (orgánico
LU, UNA persona), Yulianna (AIB), Bryan Vega (caso), Bori el coquí. Valentina ya no crea contenido
(tarea `lote-valentina-semanal` pausada). Docs del Estudio en `vault/proyectos/estudio/`. No se contrata COO/director de ventas/diseñadores/
videógrafo; no se gastan los $40K de Quilla.

**Las 5 jugadas:** (1) cerrar el balde de LU — no escalar pauta hasta churn <8%/mes; (2) el
Estudio — 14 piezas/sem (LU 5 · AIB 4 · Shadow 4 · Bori 1); (3) **AIB vende con MVP** — definición de Elvin (18/sep): "vender sistemas con MVP" = el
prospecto recibe algo que puede tocar: presentación .pptx personalizada, landing (rediseño o
nueva), su agente de chat y voz, y un recorrido "por dentro" del sistema (CRM/agenda/agentes,
simulado con su flujo; NO construir la plataforma). Fábrica de MVPs `/demo-cliente`
(`scripts/demo-cliente/demo.mjs`, plantillas `demos/_plantilla-autoflow/`, deck con pptxgenjs,
endpoint central `app/api/demo-webcall` para la voz de Retell, deploy a Netlify por zip, nota en
Pipedrive AIB); primer MVP real: Skin Clinic PR (`data/demos/skin-clinic-pr/`); compuerta 10
MVPs al 15/oct; (4) Bori/Cortex
en piloto automático (Bori se explota solo tras activación ≥40%); (5) Shadow: viable, Skool $55 +
consultoría $3,500; oct 50 posts → nov Skool fundadores → ene cohorte 1.

**Sistema operativo de Elvin:** lunes scoreboard 30 min, viernes revisión CEO 1 h, 1 día de
grabación/mes, aprueba solo >$5K/contrataciones/estrategia/contratos de creadores, cierre 8 PM.
Las tareas de `data/tareas.json` se reasignaron por rol el 18/sep (quedan 9 con Elvin).

**How to apply:** si Elvin propone algo nuevo antes del 12/dic, recordarle la regla y mandarlo a
`vault/ideas/` con trigger; cualquier trabajo de venta de AIB pasa por la Fábrica de MVPs; el Core
(`app/borinquen`) NO se vuelve SaaS multi-tenant este trimestre; el board meeting mide las
compuertas (15/oct, 15/nov, 12/dic). Ver [[elvin-ceo-perfil]], [[micro-influencers-pr]],
[[bori-plan-crecimiento]], [[quilla-holding-creadores]] (congelada), [[plomeria-pr-vision]] (piloto).
