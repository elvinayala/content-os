---
name: ambc-360
description: "AMBC 360 — plataforma de operaciones de la Dra. Yaritza Amaral (Advanced Medical Billing), repo ~/ambc-operaciones; sin PHI; go-live 2/nov/2026"
metadata:
  node_type: memory
  type: project
  originSessionId: b257cd66-46ca-40d9-a17c-1a26dc4f9bb8
  modified: 2026-10-13T18:31:40.551Z
---

**AMBC 360** = la plataforma de operaciones que pidió la Dra. Yaritza Amaral (Advanced Medical Billing & Consulting, cliente LU/AIB) el 6/oct/2026: aparte del CRM de GHL, "tipo Trello", visión 360° de credenciales, facturación, calidad, adiestramiento, administrativo y del desempeño de sus contratistas. Criterio de aceptación = su *Checklist CRM – AMBC para Level Up* (9/oct, 11 secciones). Construida el 13/oct en `~/ambc-operaciones` sobre la plantilla "agente-interno" de Plagas (org_id en todo, para poder ponerla bajo AI Core). Go-live: lunes 2/nov (ella extendió los contratos de sus contratistas hasta el 31/oct).

Decisiones de Elvin (13/oct): plataforma propia (no GHL ni Pulse), **sin PHI** (referencia interna de AMBC; validador `lib/dominio/sin-phi.ts`), todo de una vez sin prototipo, hosting Railway junto a Plagas/AI Core.

**Why:** los datos de un cliente no se mezclan con los de EA Market ([[pulse-autorizacion]]) y el checklist exige exportación completa, bitácora inmutable, segregación de funciones y alertas que nunca se cierran solas.

**How to apply:** antes de tocarla, leer `CLAUDE.md` y `TRASPASO.md` del repo. Reglas duras: sin PHI, bitácora inmutable, ninguna alerta se cierra sola, sin juicios de desempeño hasta línea base aprobada por AMBC, nada se le escribe a la clienta sin OK de Elvin o Carilin. `npm run aceptacion` nunca contra producción. Pendientes al 13/oct: deploy (necesita OK de Elvin), SOP maestros de AMBC, PDF de la propuesta del 11/jun, postura del BAA, pruebas con Aimée 27–29/oct, capacitación 29–30/oct. Entidad: `vault/entidades/yaritza-amaral.md`. Relacionado: [[plagas-puerto-rico]], [[elvin-aib-core-vision]], [[nico-vibecoder]].
