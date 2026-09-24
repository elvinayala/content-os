---
proyecto: ISLA Run Series
tipo: plan-maestro
actualizado: 2026-09-23
estado: piloto (excepción al plan de guerra, aprobada 23/sep/2026)
tags: [isla-run, carreras, eventos, piloto, cabo-rojo]
---

# ISLA Run Series: plan maestro

ISLA es una marca premium de carreras en Puerto Rico, con una ciudad cada 3–4 meses. No es "un 5K".
La 1.ª edición es **ISLA Cabo Rojo 5K**, el **domingo 13/dic/2026 a las 6:00 AM**.

- Documento operativo (con checklist, cronograma, presupuesto, auspicios y premios):
  [isla-cabo-rojo-5k-gestiones.pdf](isla-cabo-rojo-5k-gestiones.pdf). Se regenera con
  `python3 scripts/isla-run/gestiones-pdf.py <salida.pdf>`.
- Identidad: [[proyectos/isla-run/marca]].

## Cómo encaja en el plan de guerra
Es una **excepción con operador** a "ninguna empresa nueva hasta el 12/dic" ([[ceo/plan-de-guerra-2026Q4]]):
- La operan **los socios** (uno es el director de carrera) junto al **Municipio de Cabo Rojo**, que ya
  está a bordo con ambulancias y policía.
- **Elvin** solo aprueba presupuesto >$5K, precios, marca y compuertas (~1 h/sem).
- **Claude + agentes:**
  - Plataforma y soporte: Claude y Nico.
  - Contenido: Sofi y Lola.
  - Pauta: Max, en pausa hasta que Elvin active.
  - Reporte semanal de inscritos.
- **Entidad separada** (LLC propia con los socios): Stripe, Meta, dominio y data de corredores propios.

## Números (estimados; se reemplazan con cotizaciones)
- Variable ≈ **$15/corredor**: camisa $6.50 · medalla $4 · chip/timing $3.50 · agua $0.75 · bolsa $0.25.
- Fijo ≈ **$36,900**, incluidos $5K de premios, $8K de pauta y 10 % de contingencia. El municipio
  puede ahorrar $5–8K en especie (tarima, sonido, baños, limpieza, vallas).
- Los precios originales ($20/25/30/35) ponen el equilibrio en ~2,650 corredores.
  **Recomendado: $25/30/35/40 + cargo por servicio ~$2.50**, con equilibrio en ~2,000.
- **Tope: 2,500 con lista de espera · base: 1,800.**
- Auspicios, meta $15–20K:
  - Presentador (1): $7.5–10K.
  - Oficial (3): $2.5K.
  - Hidratación (2): $1K + producto.
  - Local (10): $500.
  - Logos cerrados el 30/oct.
- Premios, $5K:
  - General M/F: $800/400/200.
  - Master 40+: $300 c/u.
  - Mejor caborrojeño/a: $200 c/u.
  - **Club con más inscritos: $500.**
  - Adaptada: $200 c/u.
  - Sorteo entre los que terminan: $300.

## Compuertas
| Fecha | Condición | Acción |
|---|---|---|
| 15/oct | ≥300 inscritos | confirmar proveedores |
| 1/nov | ≥900 inscritos | orden de medallas (si no: formato lean) |
| 8/nov | tallas reales | orden de camisas (+10 %); camisa garantizada solo antes del 8/nov |
| 13/dic | carrera | P&L real → decisión ISLA #2 |

## Diferenciadores
- **Medallas que encajan:** cada ciudad es una pieza del mapa de PR.
- **Pasaporte ISLA** para quien corra toda la serie.
- **Link de referido para cada inscrito**, con leaderboard.
- **Premio al club** con más inscritos.
- **Preventa de la próxima ciudad** solo para los que corrieron.
- **Fundadores:** primeros 500, bib #0001–0500.
- **Contenido:** sesión de foto/video previa (Faro, salinas, Boquerón) y fotos por bib.

## Plataforma (repo propio, por construir)
- **Repo:** `/Users/elvinayala/isla-run`. Next.js 16 + Supabase Postgres + Drizzle + Stripe +
  Resend, en Vercel con dominio propio. ATH Móvil entra en la fase 1b.
- **Multi-ciudad:** tablas `events`, `price_tiers`, `runners` (base permanente),
  `registrations`, `coupons`, `referral_codes`, `sponsors`, `waitlist` y `admin_users`.
  - El contenido de cada ciudad vive en `content/events/<slug>.ts`.
- **Precio escalonado sin sobreventa:** holds de 30 min dentro de una transacción con lock.
- **Admin:**
  - KPIs y tabla de inscritos.
  - CSV completo, CSV para el timing y CSV de camisas por talla.
  - Cupones y referidos.
  - Modo check-in para el recogido de paquetes.
- **Fases:**
  1. MVP para abrir el **8/oct**.
  2. 1b: ATH Móvil, referidos por corredor y clubes.
  3. 2: check-in con QR, waitlist y transferencias.
  4. 3: resultados, fotos y preventa.

## Pendiente de Elvin / socios (esta semana)
1. Acuerdo de socios + director de carrera.
2. Fecha (13/dic) y ruta con el municipio (carta con todos los pedidos).
3. Cotizaciones: timing, medallas, camisas y seguro.
4. LLC, EIN, banco y Stripe de ISLA.
5. Abogado: relevo, términos y privacidad antes del 8/oct.
6. Aprobar precios y tope.
7. Aprobar la identidad ([[proyectos/isla-run/marca]]).
