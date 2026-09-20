---
fecha: 2026-07-16
fuente: memoria
unidad: level-up
tags: [entidad, tema]
---
# Error de método de pago (Meta) — ads off

**Qué es:** Falla operativa recurrente en [[level-up]]: anuncios de clientes que se
**apagan solos por error en el método de pago** de Meta. Riesgo de churn silencioso
(cliente paga estrategia pero sus ads no corren).

## Resumen acumulado
Patrón detectado en la ronda de CSM del 15-16/07: varios clientes con los anuncios
**off** por el mismo motivo en pocos días. El equipo los persigue por Slack para
ayudarles a **reconfigurar un método de pago nuevo** y reactivar. Es un problema
sistémico (no un caso aislado): cada día apagado es presupuesto y resultados perdidos,
y alimenta la cubeta "resultados" del [[churn]] ("no veo retorno" cuando en realidad los
ads estaban apagados). Candidato a automatizar la detección/alerta.

## Línea de tiempo
- 2026-07-15 — Premium Energy (Derick Hernandez) con ads pausados por error de pago
  ([[2026-07-15]]).
- 2026-07-16 — Ivan Torres (VIP Auto Servicio), David Castillo (Óptica Barrio Obrero) y
  Roberto Rivera/Nilza (Huellas), todos off por el mismo error ([[2026-07-16]]).

## Conexiones
[[churn]] — cubeta "resultados": ads apagados se leen como "no funciona".
[[estabilidad-producto]] — hermano operativo del lado de Borinquen (fallas que erosionan
confianza). [[level-up]].
