---
name: isla-run-series
description: "ISLA Run Series — marca premium de carreras por municipio en PR con socios; 1.ª edición Cabo Rojo 5K dom 13/dic/2026; piloto aprobado como excepción al plan de guerra (23/sep/2026); números, compuertas y plataforma por construir"
metadata:
  node_type: memory
  type: project
  originSessionId: 45153427-3c0f-4846-aaff-8b0d42a522b2
  modified: 2026-09-23T19:41:26.091Z
---

El 23/sep/2026 Elvin pidió planear **ISLA Run Series**: una marca premium de carreras con una ciudad
cada 3–4 meses. La 1.ª edición es **ISLA Cabo Rojo 5K**, con fecha recomendada **dom 13/dic/2026 a
las 6 AM**. Hay **socios de negocio** y el **Municipio de Cabo Rojo ya está a bordo** (ambulancias y
policía).

**Cómo entra al plan de guerra:** es una *excepción con operador* a "ninguna empresa nueva hasta el
12/dic" ([[plan-de-guerra-q4]]):
- Los socios la operan (director de carrera).
- Elvin solo aprueba presupuesto, precios, marca y compuertas (~1 h/sem).
- Claude y los agentes ponen plataforma, contenido (Sofi/Lola) y pauta (Max, en pausa).
- En el portafolio es la unidad `isla-run` (piloto, compuerta 1/nov: ≥900 inscritos).

**Números que le mostré:**
- Variable ~$15 por corredor; fijo ~$37K.
- Con sus precios ($20/25/30/35) el equilibrio está en ~2,650 corredores.
- Recomendé $25/30/35/40 + cargo por servicio ~$2.50 (equilibrio en ~2,000), tope de 2,500 con
  waitlist, auspicios de $15–20K y pedirle al municipio más cosas en especie.
- Estado de aprobación de estos números: ver el plan.

**Pagos:** Stripe + ATH Móvil + cargo por servicio al corredor (lo eligió él).

**Plataforma (MVP construido 23/sep, local, sin deploy ni commit):** repo `/Users/elvinayala/isla-run`
(Next 16 + Drizzle + PGlite en dev / Supabase en prod + Stripe Checkout + Resend), multi-ciudad
(contenido en `content/eventos/*.ts`, operativo en DB). Landing, inscripción en 4 pasos con relevo y
tutor para menores, escalones sin sobreventa (FOR UPDATE + holds), cupones, referidos (`/r/CODIGO`,
cada corredor recibe el suyo), bib en orden de pago (0001–0500 Fundadores), página de gracias con QR,
admin (KPIs, CSV completo/timing/camisas/base, códigos, evento/precios, check-in con rol staff).
Probado de punta a punta en dev con `ISLA_PAGOS_DEMO=1` (preview `isla-run`, puerto 3130). Checklist
de lanzamiento en su README. Falta: ATH Móvil (fase 1b), Stripe/Supabase/Resend reales, relevo legal.
Gotcha: el botón Siguiente/Pagar necesita `key` distinta o React lo reutiliza y envía el form.

**Docs:**
- `vault/proyectos/isla-run/` (plan-maestro.md, marca.md).
- PDF de gestiones y permisos (`isla-cabo-rojo-5k-gestiones.pdf`, generador en
  `scripts/isla-run/gestiones-pdf.py`).

**Why:** Elvin pidió un plan que convierta ISLA en marca recurrente (base de datos de corredores,
auspiciadores recurrentes, contenido), no en una página para un solo 5K. También pidió un PDF con
todo lo que él y sus socios tienen que solicitar y gestionar.

**How to apply:**
- Todo trabajo de ISLA va con la marca y las cuentas de ISLA (entidad separada).
- Lo operativo se lo asignas a los socios / director de carrera, no a Elvin.
- Contenido y copy en tuteo PR ([[voz-espanol-pr-tuteo]]).
- Antes de abrir inscripciones, verifica precios, fecha y premios en la landing en producción
  ([[verificar-antes-de-activar]]).
