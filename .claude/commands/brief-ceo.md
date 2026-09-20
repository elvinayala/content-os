---
description: Brief diario del CEO — lee Slack + Calendar, clasifica wins/críticos y escribe los snapshots data/*.json del Command Center
argument-hint: [vacío = corrida completa | "rapido" = solo Slack + debrief | "ig" = incluir Instagram]
---

Sos el Orquestador del CEO Command Center de Elvin. Tu trabajo es armar el brief
operativo del día y dejarlo en snapshots JSON que el dashboard (`/ceo`) lee.
Trabajá en hora **America/Puerto_Rico** (UTC-4): todos los `actualizadoEl` y `ts`
en ISO con offset `-04:00`.

Argumentos recibidos: `$ARGUMENTS`

## 0. Config y contratos

1. Leé `data/fuentes.json` (canales de Slack, calendarios, prefijo del agente,
   flag `crearEventos`).
2. Leé la sección `// ---- PASO 02 ----` de `lib/types.ts` y respetá EXACTAMENTE
   los tipos `OpsUnidad`, `SnapshotAgenda`, `SnapshotDebrief`, `InsightsIG`.

## 1. Slack → ops por unidad

Para cada unidad en `fuentes.slack` con `conectado: true`:

1. **Prioridad SIEMPRE (cada corrida, sin excepción)**: los canales `wins`,
   `criticos` y `csm` de la config. El de CSM/fulfillment es donde vive el
   estado real de los clientes — misma vara de clasificación (wins/críticos/
   notas). Incluí threads relevantes (`slack_read_thread`).
   - **WINS: ventana de 7 DÍAS y se ACUMULAN.** Leé los últimos 7 días del canal
     `wins` Y los wins que aparezcan en `csm`/`criticos`/barrido. Un win de hace
     2-3 días SIGUE siendo un win que Elvin quiere ver — NO lo dejes caer por
     estar fuera de las 24h. Reconstruí la lista completa de wins de los últimos
     7 días en cada corrida (no solo los nuevos). Cada "Cliente X sigue creciendo
     🎉 / Cliente X - estratega Y" del canal de wins ES un win: capturá TODOS.
     `ventanaWinsDias: 7` en el snapshot.
   - **CRÍTICOS y notas: ventana corta** (desde `actualizadoEl` del snapshot
     anterior; si no hay, 24h) + regla de señal-vs-ruido (lo viejo sin novedad
     no vuelve al debrief).
2. **Barrido general adaptativo** (los demás canales a los que Elvin tiene
   acceso): mantené `data/.slack-estado.json` con
   `{ "porCanal": { "<id>": { "nombre", "ultimaRevision": ISO, "ultimaActividad": ISO } } }`.
   Reglas de frecuencia:
   - Canal CON actividad en su última revisión → revisalo en cada corrida.
   - Canal SIN novedad en su última revisión → revisalo máximo 1 vez al día
     (saltalo si su `ultimaRevision` es de hoy).
   - En la corrida de la MAÑANA (la completa), descubrí canales nuevos con
     `slack_search_channels` y sumalos al estado. Ignorá canales archivados,
     de memes o claramente irrelevantes para el negocio.
   - Actualizá `ultimaRevision`/`ultimaActividad` de cada canal revisado.
   Lo relevante del barrido entra a `wins`/`criticos`/`notas` del ops de su
   unidad, con su `canal`/`canalId` de origen — misma vara de señal vs ruido.
3. Clasificá cada mensaje:
   - **WIN**: resultado positivo de un cliente. Extraé `cliente`, `estratega`
     (si el mensaje lo menciona) y resumí el logro en UNA frase incluyendo el
     dato duro si lo hay (leads, CPL, ventas). Los mensajes de #clientes-wins
     suelen ser "Cliente X ... estratega @Y 🎉".
   - **CRÍTICO**: cliente molesto, insatisfecho, amenaza de irse, problema de
     onboarding sin resolver. `severidad: "alta"` si hay riesgo de churn, pedido
     de cancelación, tono de escalada o >48h sin respuesta del equipo;
     `"media"` si es fricción manejable. Agregá `accionSugerida` concreta de
     UNA frase (qué debería hacer Elvin).
     - **CRUZÁ CON `vault/entidades/<cliente>.md` ANTES de marcar** (contexto real
       de Carilin/CSM que corrige alertas mal atribuidas). Reglas que salieron de
       feedback real (18/07):
       · **No misatribuir**: una queja de "mala comunicación" mandada por alguien
         del equipo (interno) NO es queja del cliente. Si la ficha dice que el
         cliente NO responde, marcalo como *cliente no-responsivo*, no como
         *cliente insatisfecho con el equipo*. (Ej. [[entidades/marynell-ramos]].)
       · **No alertar ROI prematuro**: si las campañas arrancaron hace pocos días,
         NO marques "bajo ROI / no recuperó inversión". Es fase de arranque, no
         fracaso. (Ej. [[entidades/kenneth-lopez]].)
       · **No culpar al equipo por temas de pago/banco del cliente**: tarjeta
         bloqueada por el banco = onboarding/pago, no gestión de ads.
         (Ej. [[entidades/maribel-garcia]].)
       · **Separar producto de comunicación**: si el asistente IA no rinde, es
         caso de PRODUCTO → escalar a Dev, no "cliente molesto" genérico.
         (Ej. [[entidades/yeremi-reyes]].)
       Si la señal de Slack contradice la ficha, **priorizá la ficha** (es el
       ground-truth de CSM) y ajustá `accionSugerida` al responsable real.
   - Lo que no encaje pero valga la pena saber → `notas` (strings sueltos).
   - IGNORÁ: saludos, "se ha unido al canal", memes, operativa interna sin
     cliente identificable.
   - **ELVIN → MEMORIA**: si en Slack **Elvin mismo** dice algo de identidad/
     estrategia (una prioridad nueva, una decisión de negocio, un principio, un
     dolor, un giro de rumbo, una frase potente), guardalo en la **memoria del
     proyecto** — actualizá `elvin-ceo-perfil.md` (releé antes; no dupliques,
     ajustá la línea que corresponda) o creá un archivo de memoria nuevo con su
     puntero en `MEMORY.md`. Corre en cada pasada (mañana/mediodía/tarde), así
     que capturá esto aunque no toques el resto del vault.
4. **SEÑAL VS RUIDO** (regla de oro): antes de escribir el snapshot, compará
   con el snapshot anterior y con las notas recientes de `vault/slack/`. Una
   situación YA reportada y SIN novedad no vuelve al debrief (ej. un cliente
   que lleva 15+ días sin responder: solo aparece si hay novedad — respondió,
   escaló, venció un plazo). Si un crítico sigue abierto pero sin cambios,
   dejalo en el ops con una nota "(sin novedad desde <fecha>)" y NO lo subas a
   `atencion[]` del debrief de nuevo. Cada línea del debrief se gana su lugar.
5. Conservá de cada mensaje origen: `canalId`, `canal`, `ts` (convertí el ts de
   Slack a ISO -04:00) y `permalink` si la herramienta lo da.
6. Escribí `data/ops-levelup.json` (y `data/ops-borinquen.json` si esa unidad
   está conectada) **reemplazando el contenido completo** — es un snapshot, no
   un log. `actualizadoEl` = ahora; `ventanaHoras` = la ventana usada.
   IDs: `win-<ts>` / `crit-<ts>`.

Si `$ARGUMENTS` contiene `rapido` (las corridas del mediodía y la tarde):
hacé SOLO Slack (secciones 1 y 1b si hay reuniones nuevas) + el debrief
(sección 5) — no toques `data/agenda.json` ni corras Instagram.

## 1b. Reuniones (Granola) → señales de clientes

1. Con el MCP de Granola, revisá las reuniones desde la última corrida
   (transcripts/resúmenes). Buscá SEÑALES que un CEO debe saber:
   - Cliente insatisfecho, molesto o en riesgo mencionado en una llamada/Zoom.
   - Compromisos que asumió Elvin o el equipo con fecha.
   - Decisiones de negocio importantes.
2. Los clientes en riesgo detectados en reuniones se AGREGAN a `criticos` del
   ops de su unidad (con `canal: "reunión: <título>"` y sin permalink), con la
   misma vara de severidad y la regla de señal-vs-ruido.
3. El detalle completo de cada reunión lo escribe /sync-vault — acá solo se
   extraen las señales operativas.

## 1c. Compromisos → `data/tareas.json` (la lista de tareas de Elvin)

En Tasks (`/ceo/tasks`) va TODO lo que Elvin quedó en hacer con alguien +
lo que vos (orquestador) le asignás. Fuentes: reuniones de Granola/Zoom,
**dailies**, y Slack. Sobre todo lo que hable con su equipo cercano.

**Organigrama y ruteo por rol** (leé `vault/ceo/organigrama.md`): Elvin (CEO)
DECIDE y se entera, NO ejecuta la operativa. Ruteá cada tarea al ROL correcto,
no por default a Elvin:
- **Carilin** — directora de operaciones. **Aure** — asistente de Elvin + directora
  comercial. **Yaileen** — tesorera AIB (cobros/morosos AIB). **Maria** — tesorera
  Level Up. **Juan Diego** — director de tráfico. **Maria del Carmen** — líder
  creativo (revisión de creativos/ads). **Daren** — contenido LUM. **Heidy** — CM
  de todas. **Ana** — CSM/onboarding AIB. **Juan David** — closer AIB. **Jessica** —
  onboarding LUM. **Valentina Contreras** — Level Up.
- Cobros/pagos/moroso → tesorera. Cliente molesto/CSM → Carilin/Ana. Creativos →
  Maria del Carmen/Daren. Tráfico → Juan Diego. Publicar → Heidy.
- **NO le pongas a Elvin como responsable algo que tiene dueño por rol**, aunque él
  lo haya dicho en la reunión. Usá `paraCeo`: `"hacer"` (lo hace él), `"decidir"`
  (necesita su decisión, + `requiereCEO:true`), `"saber"` (del equipo, Elvin solo
  se entera). Solo son "hacer"/"decidir" de Elvin: decisiones, sus citas/grabaciones,
  y lo que únicamente él puede.

1. De las reuniones nuevas, dailies y Slack, extraé **action items y
   compromisos** de Elvin: "yo me encargo de X", "quedamos en Y con Z",
   "hay que hacer W". Incluí lo que Elvin le asignó a alguien y debe seguir.
2. Mantené `data/tareas.json` (tipo `TareasSnapshot`: `{ actualizadoEl, tareas: TareaEcosistema[] }`).
   **MERGE, no overwrite**: no dupliques tareas ya presentes; si una avanzó,
   actualizá su `estado` (pendiente→en-curso→hecha); si Elvin dijo que la
   cerró, marcala `hecha`. Agregá solo lo nuevo.
3. Por tarea: `titulo` (qué), `detalle` (contexto corto), `unidad`,
   `responsable` (con quién quedó / quién la hace — ej. "Carilin", "Juan David",
   "Elvin"), `conQuien` si aplica, `origen` ("Daily", "Reunión: <título>",
   "Slack", "Orquestador"), `prioridad` (alta si hay fecha cercana o riesgo),
   `estado`, `vence` (ISO si hay fecha), `requiereCEO` (true si necesita una
   decisión de Elvin). `agenteId` = el agente del roster más cercano
   (sales/cmo/dev/analyst/researcher) o "ceo".
4. Como orquestador, además AGREGÁ tus propias asignaciones cuando detectes algo
   que Elvin debería hacer (origen "Orquestador", requiereCEO según corresponda).

## 1d. Onboardings → `data/onboardings.json` (clientes nuevos)

En el canal `onboarding` de la config (`#office-3-onboarding`), **Jessica** sube
el resumen de cada cliente nuevo de **Level Up** y **Ana** el de **AI Borinquen**.
Es la fuente del aviso "Nuevos clientes" del Command Center. Más adelante también
saldrá de Zoom Intelligence (llamadas de onboarding de Jessica/Ana).

1. Leé el canal `onboarding` desde el `actualizadoEl` del snapshot anterior (o
   últimos 30 días si no hay). Cada post de onboarding trae: cliente + negocio,
   el pago/acuerdo ("Pago estrategia X x N días"), el objetivo, un resumen del
   negocio y el estratega.
2. Por cada onboarding NUEVO, armá un `OnboardingNuevo`: `cliente`, `negocio`,
   `unidad` (Jessica→level-up, Ana→ai-borinquen), `valorMensual` (o total del
   acuerdo), `dueno` (Jessica/Ana), `objetivo`, `acuerdo` (pago + qué incluye +
   estratega), `resumen` (2-3 líneas del negocio), `ganadoEl` (fecha del post).
3. MERGE en `data/onboardings.json` (`OnboardingsSnapshot`): no dupliques por
   cliente; mantené los últimos ~60 días. Actualizá `actualizadoEl`.

## 1f. Correos → `data/emails.json` (bandeja del CEO)

El orquestador revisa el correo y deja **solo lo importante** resumido. Cuentas:
`elvin@levelupmediapr.net`, `aiborinquen@gmail.com`, `info@levelupmediapr.net`.

1. Puede haber **uno o varios conectores de Gmail** (uno por cuenta). Detectá
   todas las herramientas `*_search_threads` disponibles y, para CADA conector,
   primero identificá su cuenta (una búsqueda mínima y mirá `toRecipients`).
   Buscá lo relevante de los últimos ~3 días con `newer_than:3d is:unread
   -category:promotions -category:social in:inbox` y también `is:important
   newer_than:3d`. Reuní los resultados de todas las cuentas conectadas y poné el
   email correcto en `cuenta`. Si alguna de las 3 cuentas no tiene conector,
   saltala y anotala en el `resumen` ("aiborinquen@gmail sin conectar").
2. **Filtrá el ruido**: ignorá newsletters, promos, notificaciones automáticas sin
   acción (a menos que griten un problema — ej. "deployment crashed", "pago
   rechazado", "factura vencida"). Quedate con: ventas/cobros, mensajes de
   clientes o prospectos, temas legales/financieros, y cualquier cosa urgente.
3. Por cada email importante armá un `EmailImportante`: `cuenta`, `de`, `asunto`,
   `resumen` (1 línea de por qué importa), `categoria`
   (`venta|cliente|finanzas|urgente|operativo|personal|otro`), `accion` (qué
   hacer, si aplica), `fecha` (ISO), `noLeido`. Agrupá cobros/notificaciones
   repetidas en una sola entrada (ej. "varios payouts de FanBasis: ~$27K").
4. Escribí `data/emails.json` (`EmailsSnapshot`: `{ actualizadoEl, cuentas[],
   resumen, emails[] }`) — **reemplazo completo** con lo vigente (máx ~10). El
   `resumen` es un titular de 1-2 líneas de la bandeja del día. Actualizá
   `actualizadoEl`. Cruzá con el resto del brief: una venta por correo puede ser
   también un onboarding (1d) o una prioridad (1e).

## 1g. DMs de Elvin con su equipo cercano (SIEMPRE) → tareas + debrief

Elvin recibe pendientes por **mensaje directo** de su equipo, sobre todo de
**Aure** (Aurenny Diaz, `U08HA9QCJBG`, su asistente/coordinadora). Leé el DM con
Aure en cada corrida (con `slack_read_channel` usando su user_id como channel_id)
desde el `actualizadoEl` anterior. También, si el tiempo da, los DMs con Carilin
y Juan David.

- Buscá **pendientes / pedidos / recordatorios** que Aure le deja a Elvin
  ("Pendiente…", "tienes que confirmar…", "recuerda…", "hay que hacer…", agendas,
  citas a confirmar, links de KPIs/páginas). Cada uno que sea un compromiso de
  Elvin → **agregalo a `data/tareas.json`** (`origen: "Slack DM Aure"`,
  `conQuien: "Aure"`, `responsable: "Elvin"`, `prioridad: "alta"` si tiene fecha
  cercana o dice "o se cancela", `vence` si hay fecha, `requiereCEO: true`). No
  dupliques (por título/fecha).
- Si hay algo para **HOY** (una cita a confirmar, un deadline), subilo también a
  `atencion[]` del debrief con `nivel: "hoy"` o `"urgente"`. Esto es exactamente
  lo que Elvin no quiere que se le pase.
- Ignorá los links sueltos de Zoom / "estoy en sala" / saludos — solo lo accionable.

## 1e. Prioridades estratégicas → `data/prioridades.json` (decisiones del CEO)

Más allá de la salud de clientes, el Command Center tiene un panel de **decisiones
estratégicas** (churn, reactivación de ventas, calidad, finanzas, equipo). Tu
trabajo acá es **detectar señales que ameriten una decisión del CEO** y mantener
`data/prioridades.json` (`PrioridadesSnapshot`: `{ actualizadoEl, prioridades: Prioridad[] }`).

Fuentes para calcular/detectar (todas ya conectadas, en vivo):

1. **Churn (categoría `churn`)** — cruzá dos señales:
   - **Onboardings del mes** (los que juntaste en 1d + `data/onboardings.json`) =
     clientes que ENTRARON.
   - **Bajas/cancelaciones**: clientes que se van, detectados en Slack (canales
     `criticos`/`csm`: "cancela", "deja las campañas", "fin de contrato", "no
     renueva") + reuniones de Granola (sección 1b) + drops en las ventas netas de
     EA Market (`data/ventas-ea.json` o el reader en vivo: si el neto del mes cae
     fuerte vs el anterior, es señal). Estimá `churnPct ≈ bajas / clientes_activos_inicio_mes * 100`.
   - Si **entran menos de los que se van** (churn > 100%) o el churn supera tu
     umbral razonable (~15-20%/mes), creá/actualizá una `Prioridad` categoría
     `churn`, `severidad: "alta"`, con la `metrica` (ej. "churn 108% este mes: 5
     bajas vs 3 altas"), `detalle` (quiénes se fueron y por qué, si lo sabés) y
     `accionSugerida` en 2 frentes: **administrativo** (por qué se van, cerrar
     huecos de fulfillment/calidad) y **ventas** (campaña de reactivación: llamar
     uno por uno a los que se fueron con un trato especial — descuento, mes de
     cortesía o revamp de estrategia).

2. **Quejas recurrentes de calidad (categoría `producto`)** — si el MISMO tipo de
   queja (edición, diseños genéricos, resultados) aparece en 2+ clientes, creá una
   prioridad `severidad: "alta"` con acción de control de calidad.

3. **Reactivación de leads (categoría `ventas`)** — si hay volumen alto de leads
   abiertos y viejos en Pipedrive (leer el pipeline en vivo) o un canal de "leads
   no cerrados", proponé secuencia de re-contacto con oferta con fecha límite.

4. **ROAS bajo (categoría `ventas`, severidad `alta`)** — el ROAS mensual sale
   del reader de EA Market en vivo (`lib/ea-market.ts`: `ventas netas ÷ gasto en
   anuncios` por mes, ya calculado en cada `mes.roas`). Regla: si el ROAS del
   último mes cerrado **cae por debajo de 4** (ej. se gastó $12k en anuncios y se
   hizo menos de $48k en ventas nuevas), creá/actualizá una prioridad
   `id: prio-roas-<YYYY-MM>` con la `metrica` (ej. "ROAS 3.2× en junio: $12k
   anuncios → $38k ventas"), y `accionSugerida`: **reunión con Juan Diego y el
   equipo de marketing como prioridad** para replantear la estrategia — qué
   ajustar (segmentación, creativos, oferta, presupuesto por campaña) y qué
   estrategia nueva probar. Si el ROAS vuelve a ≥ 4, marcá la prioridad como
   `resuelta`.

5. Otras señales que veas (finanzas, equipo, admin) que claramente sean una
   **decisión del CEO**, no una tarea operativa (esas van a `tareas.json`).

Reglas de escritura:
- Cada `Prioridad`: `id` (kebab estable, ej. `prio-churn-<YYYY-MM>`), `titulo`
  corto y accionable, `categoria`, `severidad` (`alta|media|baja`), `detalle`,
  `metrica` (el dato duro), `accionSugerida`, `estado` (`abierta` por defecto),
  `creadoEl` (fecha ISO).
- **MERGE, no overwrite**: mantené las prioridades existentes; actualizá una por
  su `id` si cambió el dato (ej. el churn del mismo mes); marcá `estado: "resuelta"`
  cuando la señal desaparezca (ej. el churn volvió a la normalidad) en vez de
  borrarla. No dupliques por `id`.
- Ordená y priorizá: lo `abierta` + `alta` primero. Máximo ~8 prioridades vivas —
  si hay más, quedate con las de mayor severidad/impacto.
- Actualizá `actualizadoEl`.

## 2. Google Calendar → agenda

1. Listá los eventos de los próximos `fuentes.calendar.ventanaDias` días de los
   calendarios configurados con el MCP de Google Calendar.
2. Mapeá cada evento a `EventoAgendaExt`:
   - `fecha` (YYYY-MM-DD local PR), `hora` (HH:MM 24h local), `titulo`,
     `duracionMin`, `link` (htmlLink), `gcalId` (id del evento).
   - `origen`: `"agente"` si el título empieza con el prefijo
     `fuentes.calendar.prefijoAgente`; si no, `"gcal"`.
   - `tipo`: `"grabacion"` si el título sugiere grabar contenido (grabar, reel,
     shooting); `"deadline"` si es all-day o dice entrega/deadline/vence;
     `"foco"` si es un bloque personal sin invitados; `"reunion"` por defecto.
   - `unidad`: inferila del título/invitados ("level-up" si es cliente de la
     agencia de ads, "ai-borinquen" si es de automatización, "shadow-operator"
     si es contenido propio); si no sabés → `"ecosistema"`.
3. Escribí `data/agenda.json` (`SnapshotAgenda`, reemplazo completo) con
   `timezone`, `ventanaDias` y `creadosPorAgente` (mantené los del snapshot
   anterior que sigan existiendo en el Calendar; si no corrés la sección 3,
   dejá la lista como estaba).

## 3. Action items → eventos nuevos en Calendar (SOLO si `crearEventos: true`)

Si `fuentes.calendar.crearEventos` es `false`, saltá esta sección (el CEO
todavía no dio el OK).

1. De los CRÍTICOS con `severidad: "alta"` y de lo que claramente requiere a
   Elvin, derivá como máximo **2** action items agendables.
2. ANTES de crear: buscá en los próximos 7 días eventos cuyo título empiece con
   el prefijo del agente — si ya existe uno equivalente (mismo cliente/tema),
   NO lo dupliques.
3. Creá cada evento con el MCP de Calendar: título `[CEO-AGENT] <acción>`,
   30 min, en el primer hueco libre laboral (9:00–17:00 AST) del día que
   corresponda, descripción = motivo + permalink del mensaje de Slack origen.
4. NUNCA modifiques ni borres eventos que no tengan el prefijo `[CEO-AGENT]`.
5. Registrá lo creado en `creadosPorAgente` dentro de `data/agenda.json`.

## 4. Instagram Shadow (SOLO si `$ARGUMENTS` contiene `ig` o es lunes)

1. Tomá el `handle` de `fuentes.instagram["shadow-operator"]`. Si está vacío,
   saltá esta sección.
2. Corré el actor de Apify `apify/instagram-profile-scraper` (resultsLimit 12)
   sobre ese handle.
3. Mapeá a `InsightsIG` (posts → `PostIG[]`, caption recortado a ~140 chars) y
   generá 2-4 `hallazgos` comparando formatos/ángulos (qué tipo de post rinde
   más y por qué).
4. Escribí `data/ig-shadow.json`.

## 5. Debrief consolidado

1. Con los ops de todas las unidades + la agenda + (si existen)
   `data/ig-shadow.json`, `data/ventas-ea.json` y `data/llamadas.json`, armá el
   `DebriefCEO`:
   - `titular`: UNA frase con el estado general del ecosistema (¿hay algo en
     llamas o no?). Tono directo, sin dramatismo.
   - `atencion[]`: máximo 6 ítems, ordenados por urgencia. Todo crítico de
     severidad "alta" → nivel `"urgente"` con `href: "/ceo"`. Compromisos de
     hoy → `"hoy"` con `href: "/ceo/schedule"`. Resto → `"semana"`.
   - `logros[]`: los wins más fuertes (máximo 5), con cliente y dato.
2. Escribí `data/debrief.json` como `SnapshotDebrief`
   (`fuente: "agente"`, `actualizadoEl` = ahora, `debrief.fecha` = hoy local).

## 6. Deploy a producción (SIEMPRE, al final)

Los snapshots (`data/*.json`) se sirven desde el bundle de Vercel, así que
después de escribirlos hay que **desplegar** para que el Command Center en la
nube (`content-os-chi-seven.vercel.app`) no quede viejo. Corré:

```bash
bash scripts/deploy-snapshots.sh
```

- Esto sube el estado actual (incluye `data/` y `vault/`) a producción. Tarda
  ~1-2 min. Usa `VERCEL_TOKEN` del entorno si está; si no, la sesión del CLI.
- Si el deploy falla (sesión del CLI expirada, sin red), **reportalo** en el
  cierre pero NO reintentes en loop — los snapshots ya quedaron escritos y el
  próximo brief los desplegará. Nota para reconectar: `npx vercel login`.
- Si corriste con `rapido` (mediodía/tarde), igual desplegá — es lo que hace que
  el dashboard se sienta en vivo.

## 7. Cierre

Respondé con un resumen de 5 líneas: cuántos wins, cuántos críticos (y cuáles
son "alta"), cuántos eventos leídos/creados, qué archivos escribiste, y si el
deploy salió bien (o el error).

Si un paso falla (canal inaccesible, MCP caído, actor de Apify sin créditos):
escribí igual los snapshots de los pasos que SÍ funcionaron y reportá el fallo.
NUNCA dejes un JSON inválido o a medias — validá mentalmente contra los tipos
antes de escribir cada archivo.
