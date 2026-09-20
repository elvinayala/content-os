---
description: Sincroniza las reuniones de Granola del día → data/granola-hoy.json (Mi día en el Command Center) + pendientes a tareas + deploy
---

Sos el Orquestador. Esta corrida destila las reuniones de Granola de HOY de Elvin
y las deja en el Command Center. Granola es la fuente MÁS importante: recoge el
criterio de Elvin en crudo (decisiones y pendientes de CEO). Corré en hora
**America/Puerto_Rico** (UTC-4). Es liviana — pensada para correr seguido (cada
~30 min) y mantener el dashboard casi en tiempo real.

## 1. Leer las reuniones de hoy

1. Con el MCP de Granola, `list_meetings` con `time_range: "custom"`,
   `custom_start` = hoy (YYYY-MM-DD), `custom_end` = mañana. Quedate con las de HOY.
2. Si NO hay reuniones hoy: no borres el snapshot de un día anterior si su `fecha`
   es hoy; si el snapshot es viejo, escribí uno con `reuniones: []` y
   `resumenDia: "Sin reuniones registradas hoy todavía."`. Deploy y terminá.
3. Con `query_granola_meetings` (pasando los `document_ids` de las reuniones de
   hoy) pedí: (a) resumen de cada reunión en 1-2 líneas, (b) las decisiones de
   CEO tomadas, (c) los pendientes/action items con quién los hace. Sé concreto.

## 2. Escribir `data/granola-hoy.json` (`GranolaSnapshot`)

Reemplazo COMPLETO con:
- `actualizadoEl` = ahora ISO -04:00, `fecha` = hoy.
- `resumenDia` = 1 frase de qué hizo hoy (las reuniones clave).
- `reuniones[]`: `{ id, titulo (legible), hora "HH:MM", resumen }` — una por reunión.
- `decisiones[]`: strings, las decisiones de CEO de hoy.
- `pendientes[]`: `{ quien, que, reunion }` — los action items abiertos.
Validá contra el tipo `GranolaSnapshot` en `lib/types.ts` antes de escribir.

## 3. Cruzar con tareas (MERGE + RUTEAR POR ROL, no overwrite)

**Leé primero `vault/ceo/organigrama.md`** — Elvin (CEO) DECIDE y se entera, NO
ejecuta la operativa. Cada pendiente va al **rol correcto**, no por default a Elvin:
- Cobros / pagos / cliente moroso → **tesorera** (Yaileen AIB, Maria LUM).
- Cliente molesto / en riesgo / CSM → **Carilin (Ops)** o el CSM (Ana en AIB).
- Revisar/corregir creativos, edición, ads → **Maria del Carmen (creativo)** o Daren.
- Tráfico/campañas → **Juan Diego**. Publicar en redes → **Heidy**.
- Citas personales de Elvin, decisiones estratégicas, grabaciones propias → **Elvin**.

Sumá a `data/tareas.json` (`TareasSnapshot`) cada compromiso concreto si no está ya:
`titulo`, `detalle`, `origen: "Granola"`, `unidad` inferida, `responsable` = **la
persona del rol** (no Elvin salvo que sea suyo de verdad), `estado: "pendiente"`,
y el campo **`paraCeo`**: `"hacer"` si la ejecuta Elvin, `"decidir"` si necesita su
decisión (poné también `requiereCEO: true`), `"saber"` si es del equipo pero Elvin
debe enterarse. NO le pongas a Elvin como responsable algo que tiene dueño por rol,
aunque él lo haya dicho en la reunión. No dupliques.

Si en las reuniones hay una **decisión estratégica** clara de CEO (churn,
reactivación, ventas, contrataciones grandes, cambios de rumbo), considerá
agregarla/actualizarla en `data/prioridades.json` con la regla de la sección 1e
de `/brief-ceo` (merge, no overwrite).

## 4. Deploy

Corré `bash scripts/deploy-snapshots.sh` para que aparezca en la nube. Si falla,
reportalo pero no reintentes en loop.

## 5. Cierre

Respondé en 3-4 líneas: cuántas reuniones de hoy, decisiones y pendientes
capturados, qué tareas nuevas sumaste, y si el deploy salió bien.
