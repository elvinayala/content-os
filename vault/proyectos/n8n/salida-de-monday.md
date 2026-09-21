# Dejar de pagar Monday sin apagar los agentes (plan, 20/sep/2026)

Pregunta de Elvin: "¿si dejamos de pagar Monday se apagan los agentes de n8n?" Respuesta corta:
**hoy sí, en ~1 semana de trabajo de Nico no.** Monday cuesta ~$800/mes; Pulse ya tiene los 3
tableros grandes migrados. Falta cablear.

## Cómo funciona hoy (lo que descubrí en los JSON)

```
Monday (LEVEL UP MEDIA · Asignación de Estrategas · Cumpleaños)
   │ 17 webhooks (crear item, cambiar nombre/empresa/email/teléfono/ID cuenta/estratega/personas,
   │  mover a grupo CLIENTE ACTIVO, cumpleaños/ID-slack) + sync diario 5 AM
   ▼
n8n "A-) Migración de datos de monday v5"  (117 nodos)
   ▼
NocoDB  ── tabla clientes (mom1ynk05ap3m1l): ID-monday, nombre, empresa, ID-cuenta-publicitaria,
        │   email, telefono, industria→, admin→, traffiker→, fecha-inicio-campaña, doble-verificacion
        ├── tabla equipo (m0uib6kq4i1gelp): nombre, ID-monday, ID-slack, ID-columna-cumpleaños
        └── tabla industrias (mur2zaymbw5791i)
   ▼
TODOS los agentes (onboarding v5, monitoreo v3, lector de seguimientos, alertas de fases,
bienvenida, PDFs, encuestador, supervisor…) leen NocoDB. NO leen Monday.
```

**Conclusión clave**: los agentes dependen de NocoDB, no de Monday. Monday es solo el *alimentador*.
Reemplazar el alimentador = Pulse → NocoDB. Los agentes ni se enteran.

Excepciones (leen Monday directo):
- **Agente Cobros** (9 AM) y **Recordatorio 60-90 días** → tablero **TESORERÍA** (8862995033,
  338 items) → Slack #office-9-agenteia-tesoreria. Ese tablero **NO está en Pulse**.
- **Procesar Vacaciones** (tool del Agente RH, dormido) → tableros HR LEVEL UP MEDIA (57) y
  Solicitudes HR (4). No están en Pulse.
- **actualización diaria de estratega** y **Agente supervisor** → leen el item de Monday por
  `ID-monday` para sacar el estratega asignado. Con el puente Pulse→NocoDB sobran (el estratega ya
  llega a NocoDB).
- Copias viejas/inactivas de MetricMan/Levelito leen el tablero directo: se archivan.

## Lo que Pulse ya tiene a favor

- Cada item migrado guarda su `monday_id` → **es la misma llave `ID-monday` que usa NocoDB**. El
  puente no rompe nada existente: mismos IDs.
- LEVEL UP MEDIA (917), Asignación de Estrategas (508) y AI BORINQUEN ya viven en Pulse con las
  columnas que NocoDB necesita (Empresa, Id cuenta publicitaria, E-mail, Teléfono, Industria,
  Personas, Asignación de Estrategas, grupo).

## Plan (orden, ~5-6 días de Nico)

1. **Puente Pulse → NocoDB** (2 días). En Pulse, al guardar un item de `level-up-media` o
   `asignacion-de-estrategas` (server actions), disparar `POST n8nv2…/webhook/pulse-cliente` con un
   payload plano: `{ idMonday, nombre, empresa, idCuenta, email, telefono, industria, adminIdMonday,
   traffikerIdMonday, activo }`. Nuevo workflow n8n **"A-) Sync Pulse → NocoDB v1"** (copia los nodos
   NocoDB de Migración v5, sin los de Monday) hace el upsert por `ID-monday`. Items nuevos creados en
   Pulse usan `pulse:<id>` como ID-monday. Más un **push completo nocturno** (5 AM, igual que hoy)
   para que nada quede desincronizado.
2. **Equipo** (½ día): tablero Cumpleaños (48 items: persona, fecha, ID-slack, rol) → tablero
   `equipo` en Pulse (o columna "ID Slack" en usuarios). Mismo puente → tabla `equipo` de NocoDB.
3. **Tesorería** (1 día): `npm run pulse:migrar -- --board 8862995033` (el script ya lo soporta) →
   `/pulse/tesoreria`. Pulse expone `GET /api/pulse/tablero/<slug>` con token de solo lectura;
   Cobros y Recordatorio 60-90 pasan de la query GraphQL de Monday a ese endpoint (mismo JSON
   de salida hacia Slack). Alternativa más simple: reescribir esos 2 como tarea programada del
   Content OS que lee Pulse y postea a Slack (son 10 nodos cada uno).
4. **RH** (½ día, baja prioridad): migrar HR + Solicitudes HR a Pulse; el Agente RH está dormido,
   puede esperar.
5. **Doble corrida 2 semanas**: Monday sigue encendido pero **Pulse es la fuente**; cada noche Nico
   compara NocoDB contra Pulse y reporta diferencias en la ronda.
6. **Apagar**: borrar los 17 webhooks de Monday, desactivar "Migración v5", archivar copias, cancelar
   Monday. Fecha objetivo: **mediados de octubre 2026** si el paso 1 arranca esta semana.

## Qué NO hacer

- Cancelar Monday antes del paso 5: se apaga el onboarding automático de clientes nuevos, las alertas
  de fases, cobros y bienvenida.
- Reescribir los agentes fuera de n8n ahora: no es el momento (plan de guerra: estabilidad primero).
  Cuando el proveedor esté fuera y todo corra con Pulse, se evalúa agente por agente.
- Tocar NocoDB a mano: es la base de la que viven los agentes.

## Decisiones que necesito de Elvin

1. ¿Tesorería se migra a Pulse (recomendado: un tablero más, Carilin lo usaría igual que en Monday)?
2. ¿Los 2 workflows de tesorería se quedan en n8n o se reescriben en Content OS? (recomiendo n8n
   por ahora: menos cambios a la vez).
3. ¿Quién es el dueño de NocoDB/Easypanel? (lo confirma mañana con el proveedor).

## Estado (20/sep/2026, noche)

- ✅ **Paso 1 construido**: `lib/pulse/puente-n8n.ts` (Pulse avisa cada cambio con `after()` y expone
  `GET /api/pulse/n8n/clientes` con `x-pulse-secret`), enganchado en las server actions de Pulse y
  desplegado en prod. Verificado: 917 clientes, 98 activos = las 98 filas de NocoDB; admin/traffiker
  salen con el mismo `ID-monday` que usa la tabla `equipo`.
- ✅ Workflow **"A-) Sync Pulse → NocoDB v1"** generado por `scripts/n8n-sync-pulse.mjs` (27 nodos:
  webhook + nocturna 5:10 → normalizar → buscar por ID-monday → crear/actualizar/borrar → links
  traffiker/admin/industria → fecha de la primera campaña Level Up desde Meta). Se crea con
  `node scripts/n8n-sync-pulse.mjs crear` (lo corre Elvin: el clasificador no me deja escribir en n8n).
- **Modo simulación** (`PULSE_N8N_MODO=simulacion` en Vercel): n8n recibe todo pero no escribe;
  `node scripts/n8n-sync-pulse.mjs reporte` muestra qué haría (el diff de la doble corrida).
  Pasar a real = `PULSE_N8N_MODO=real` en Vercel + redeploy.
- Pendiente: Cumpleaños/equipo (paso 2), Tesorería (paso 3 — aprobado por Elvin: tablero en Pulse,
  cobros se quedan en n8n), doble corrida 2 semanas, apagar webhooks de Monday.
- Dato: en NocoDB hay filas con `ID-cuenta-publicitaria` contaminado (ej. Edgar Lugo tenía texto de
  pagos); Pulse trae el id correcto → la primera corrida real lo corrige.

## Primera simulación completa (20/sep/2026 21:22, ejecución 60863 de n8n)

Se mandaron los 917 clientes de Pulse por el webhook en simulación. n8n decidió:
- **819 nada** (no activos, sin fila) · **97 actualizar** · **1 crear** (Dariel Hernandez: activo en
  Monday/Pulse pero NocoDB nunca lo recibió) · 0 borrar. 70 de los 97 sin cambios de campos.
- **ID-cuenta-publicitaria**: 19 filas de NocoDB tienen basura ("NUEVO ACUERDO 27 DE FEBRERO…",
  "PAGÓ $1000…") — el flujo del proveedor leía la columna equivocada. Pulse trae el id real.
- **Emails**: 7 con espacios o duplicados ("a@x.com - a@x.com"); Pulse los trae limpios.
- **El hallazgo grande**: en NocoDB solo **17 de 97** clientes activos tienen `admin` (account manager)
  y **35 de 97** tienen `traffiker`. Pulse trae 92 y 62. O sea, los agentes de alertas no podían
  avisar al responsable en el 80 % de los casos. El puente lo corrige en la primera corrida real.
- Regla agregada al workflow: si Pulse no trae persona/industria, el link existente en NocoDB se
  respeta (nunca se quita). Solo se pone o reemplaza con valor.
- Tiempo: ~90 s para 917 clientes (917 consultas a NocoDB). OK para la nocturna.
