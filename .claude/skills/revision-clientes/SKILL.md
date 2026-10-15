---
name: revision-clientes
description: La revisión de anuncios de un cliente de Level Up con el método de Elvin — costos en máximo → último mes → 7 días → hoy, qué funcionó, qué está caro (se optimiza desde el creativo, no desde la campaña), qué escalar, flyers y videos con CTR único < 2 % para reemplazar y rotar, y frecuencia > 1.8. Usar cuando pidan "revisa a <cliente>", "tengo reunión con <cliente>", "cómo van los anuncios de <cliente>", "revisión de clientes" o "a quién le toca revisión".
ejecucion: live
marcas: [level-up, clientes]
---

Eres Max (o quien haga la revisión por él). Esta es la skill de Elvin para revisar clientes; él la usa para entrar a la
reunión con la data del cliente o ya sabiendo qué ajustar (15/oct/2026).

## Quién y cada cuánto
- Clientes en **CLIENTE ACTIVO** de LEVEL UP MEDIA (Pulse), con pauta (no los de solo landing page).
- **Cada 15 días**: acuerdo de **$3,000 o más** (columna "Acuerdo de Pago") o que **pagó $1,500 o más de una**
  ("Pago Inicial"). **Cada 30 días**: los paquetes pequeños.
- La tanda sale sola de lunes a viernes a las **7:30 AM PR** por el Telegram de Max (≈ 8 por día; los atrasados
  primero, después los de acuerdo más grande). `node scripts/revision-clientes.mjs lista` dice a quién le toca.

## Cómo se revisa (en este orden, siempre)
1. **Costos**: máximo → último mes → 7 días → hoy (gasto, resultados del objetivo, costo por resultado, CTR único,
   frecuencia). Si el costo de la semana se movió ±15 % vs. el mes, se dice. Anuncios activos sin gasto hoy = revisar
   pago/saldo/entrega.
2. **Lo que ha funcionado** (máximo): creativos con volumen, costo ≤ mediana de la cuenta y CTR único ≥ 2 %.
3. **Costos elevados** (último mes, activos): costo ≥ 1.5× la mediana o sin resultados con $15+. **Se optimiza desde el
   creativo, no desde la campaña**: la acción es cambiar el creativo, no tocar públicos ni presupuesto.
4. **Qué escalar**: gana en el mes **y** sigue ganando esta semana, CTR ≥ 2 %, frecuencia ≤ 1.8. Escalar = +10-20 %
   o duplicar a público nuevo, **siempre con el OK de Elvin** (`meta-ads.mjs … escalar <adsetId> --pct 15` deja la
   propuesta en #max-aprobaciones).
5. **Flyers y videos**: CTR único < 2 % → pedir el reemplazo y rotarlos. Los que todavía pasan pero cayeron 25 %+ en 7
   días "se están cansando": tener el relevo listo.
6. **Frecuencia**: tope **1.8** en el último mes por anuncio activo → rotar el creativo o abrir el público.
7. **Qué ajustaría**: máximo 4 acciones; creativos nuevos máximo 3 por revisión (primero los que no enganchan, después
   los caros), con el ángulo del que funciona.

Notas: la unidad es el **creativo** (el mismo flyer en 3 conjuntos es uno; el mismo video publicado en FB e IG el mismo
día, también). CTR = **CTR único** de Meta (`unique_ctr`). El resultado es el del objetivo de la campaña (conversaciones,
leads, compras…). Reglas puras y probadas en `scripts/meta-ads/revision.mjs` (tests `tests/revision-clientes.test.mjs`).

## Cómo correrla
- Un cliente ya (antes de una reunión): `node scripts/revision-clientes.mjs cliente "<nombre | negocio | cuenta>"`
  (`--enviar` se lo manda a Elvin por Telegram y lo marca revisado).
- La tanda del día: `node scripts/revision-clientes.mjs hoy` (ver) · `hoy --enviar` (una sola tanda por día).
- Al contestarle a Elvin: el reporte tal cual + 1-2 líneas de criterio tuyo si ves algo que las reglas no ven
  (p. ej. el ángulo detrás de los ganadores, un cliente que empezó hace poco y todavía aprende).

## Reglas duras
- Solo lectura: la revisión no pausa, no cambia presupuestos, no prende nada.
- Solo a Elvin. Nada al cliente ni al equipo sin su OK (el estratega se entera por Elvin o por lo que él apruebe).
- Si Meta no deja leer la cuenta, el reporte lo dice: hay que compartirla con el portafolio Level Up
  (836808821982174) con acceso a anuncios. Sin ID en Pulse, también.
- Nunca inventar números ni ángulos.
