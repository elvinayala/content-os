## Revisión de cuentas de clientes por Max + seguimiento en Ritmo (15/oct/2026)

Elvin: "que Max me ayude a revisar clientes… tenemos que saber si lo hicieron". Skill `.claude/skills/revision-clientes`
(cerebro de Max §23). Clientes = CLIENTE ACTIVO de LEVEL UP MEDIA con pauta (`GET /api/max?revision=1` →
`lib/max/revision-clientes.ts`: acuerdo, pago inicial, cuenta publicitaria, estratega). **Cadencia**: acuerdo ≥ $3,000 (con
cualquier pago inicial) → dos veces al mes; acuerdos menores → mensual (Carilin verifica los montos en Pulse). **Resumen** (corto, con
espacios y pocos emojis): costo por resultado máx · mes · 7 días · hoy → 🔴 costo alto + CTR < 2 % (reemplazar ya) · 🟠 costo
alto con buen CTR · 🟡 CTR < 2 % → 🚀 escalar (conversación < $1: surf/vertical/horizontal; ≤ $2 con CTR ≥ 3 %: evaluar) →
📐 estrategia de 5 fases (8-12 campañas: F1 tráfico IG + ThruPlay · F2 ventas 3-4 de video/flyers/carrusel · F3 remarketing
≥ 2 · F4 ThruPlay 365; la fase sale del nombre "FASE N" o del objetivo/público) → 🔁 frecuencia > 1.8. Reglas puras en
`scripts/meta-ads/revision.mjs` (tests `tests/revision-clientes.test.mjs`); script `scripts/revision-clientes.mjs lista |
cliente "<nombre>" [--enviar] [--caso] | hoy [--enviar]` (solo lectura de Meta; una tanda por día; `pausa` en
`data/meta-ads/revisiones/estado.json` la detiene). **Solo los lunes** (Elvin: "no quiero un revolú todos los días"), por grupos
fijos y parejos guardados en el estado (`asignarGrupos`): 2×/mes = Grupo A (1.º y 3.er lunes) o B (2.º y 4.º); mensual = Grupo
1-4; 5.º lunes no hay (~36 cuentas por lunes). El puente de Max corre `lunes --enviar` los lunes y `seguimiento` L-V a las
7:30 AM PR (`revisionLoop`, `REVISION_HORA`, `REVISION_CLIENTES=off`).
**Seguimiento en Ritmo** (`/ritmo/cuentas`): cada resumen con algo que hacer abre un **caso** (`desempeno_optimizaciones`, SQL
directo en `lib/desempeno/optimizaciones.ts`; reglas puras `optimizaciones-reglas.ts`, tests `tests/optimizaciones.test.mjs`)
vía `POST /api/max {accion:"revision-caso"}` (el estratega sale de Pulse, no del script). El estratega marca cada punto
**Ejecutado** o **No se hizo + por qué**; la **dirección de tráfico** (`RITMO_DIRECTORES_TRAFICO`: maria.valencia@,
juan.guzman@, carilin@ + admin/editoras) ve todo y el cumplimiento por estratega (marcó / ejecutó, 30 días), cierra
("Ya está bien") o **pide optimización** (DM al estratega). Una revisión nueva reemplaza al caso abierto. Cada estratega recibe UN mensaje el lunes con
todas sus cuentas (`revision-avisar` → `avisarRevisiones`); plazo el **miércoles**; `revision-seguimiento`: jueves
recordatorio al estratega, viernes aviso a la dirección. En Hoy, debajo del ponche, **"Tus prioridades de hoy"**
(`components/ritmo/prioridades.tsx`, `prioridadesDe`: sus cuentas, por dónde empezar, plazo). Tarjeta en Hoy, acceso "Cuentas" (maestra),
pestaña en escritorio. **Encendido con `REVISION_CUENTAS=on`** (Vercel); antes es vista previa: casos `simulacion`, solo Elvin
(admin) los ve y nadie recibe nada. 15/oct: en pausa hasta que Carilin verifique los montos (le escribió Max desde la cuenta de
Elvin); con los montos de ese día: 50 dos veces al mes, 46 mensual; 6 cuentas sin permiso de lectura y 2 sin ID.
