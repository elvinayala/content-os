## Leads — el CRM de clientes potenciales que reemplaza a Pipedrive (`/pulse/leads`, 26/sep/2026)

Pipedrive cuesta ~$900/mes (LU ~$600 + AIB ~$300). Decisión de Elvin: **Leads dentro de Pulse** (mismas
cuentas y base) pero en tablas propias `leads_*`, separadas de las fichas de clientes, con **la esencia de
Pipedrive**: embudos con etapas en columnas, arrastrar entre etapas, zonas **GANADO / PERDIDO** al arrastrar
(perdido pide motivo), puntito de seguimiento (rojo vencido · verde hoy · ámbar sin seguimiento), tarjeta
roja si está estancada (`diasEstancado` por embudo), vistas **Embudo · Lista · Actividades**, selector de
embudo, "+ Lead", buscador y filtro por dueño. Ficha (`/pulse/leads/<marca>/<id>`): barra de etapas
clickeable, Ganado/Perdido/Reabrir, resumen editable, **WhatsApp · Nota · Seguimiento** y el historial
(conversación de WhatsApp + notas + cambios). Cada marca aparte (`marca` level_up | ai_borinquen); Level Up
arranca con sus 6 embudos reales de Pipedrive (`SEMILLA` en `lib/leads/reglas.ts`), vacíos: **el historial NO
se carga** (Elvin: archivado en Excel). Acceso: admin/editor de Pulse todo; el resto por `leads_acceso`
(todos | solo sus leads).
- **Puente de WhatsApp = Timelines.ai** (sigue siendo el que tiene los números): `POST /api/leads/timelines
  ?marca=level-up&s=LEADS_WEBHOOK_SECRET` (público en proxy; Timelines no firma → secreto en la URL; contesta
  ya y procesa con after(); lector tolerante `leerTimelines` porque Timelines no publica el esquema; lo crudo
  queda 14 días en `leads_webhook_log`). Envío por su API (`lib/leads/timelines.ts`, token
  `TIMELINES_TOKEN_LU|AIB`; **LU conectado 26/sep**: número +1 787-409-2812, webhooks 30187/30188, token en
  .env.local y Vercel; probado con conversación real). **Clientes actuales NO entran como lead** (Elvin, 26/sep):
  `clienteActual()` busca el teléfono (últimos 10 dígitos) en el tablero de clientes de la marca en Pulse
  (level-up-media / ai-borinquen), cualquier grupo menos OFFBOARDED → `ignorado:cliente-actual`; ex-clientes sí entran. **Un solo lead abierto por teléfono y marca** (índice único parcial): dos
  mensajes seguidos no duplican. Conectar: `node scripts/leads-timelines.mjs cuentas|webhooks|conectar lu`.
  Tabla `leads_whatsapp` = qué número alimenta qué embudo y dueño (sin fila → embudo "WhatsApp").
- **Embudos = copia EXACTA de los 11 de Pipedrive LU** (27/sep, `SEMILLA.level_up`, mismos nombres/etapas, por
  uso): WHATSAPP (entra por Timelines), LUM CLASS DIEGO / FRANKIE / VALENTINA CONTRERAS / CF CLASS (entraban por
  **Zapier**), CLOSERS (Calendly), LUM DIAGNÓSTICO DE CRECIMIENTO (quiz), y sin uso: LUM DELIVERY, WHATSAPP NEW
  LUM, Bori · Seguimiento, SHADOW. Búsqueda de embudo/etapa por nombre tolerante (`clave()`).
- **Grupos de WhatsApp** (27/sep, Elvin): el grupo que se arma al agendar (closer + setter + administración) NO es lead.
  Timelines manda `chat.is_group` → `registrarGrupo`: una tarjeta por grupo (`origen: "grupo"`, llave `chat_id`, sin
  teléfono) en la etapa **"Grupos"** del embudo (era "Grupos de Whatsapp" de Pipedrive; se crea si falta), que el tablero
  dibuja angosta, al final y fuera de los totales (`esEtapaGrupos`). **Equipo ≠ lead**: teléfonos de las fichas de Ritmo +
  `LEADS_TELEFONOS_EQUIPO` + la tabla **`leads_numeros_equipo`** (migración 0043) → `ignorado:equipo`. Esa tabla se llena con el botón
  **"Es del equipo"** de la ficha del lead (dirección o director de ventas; `marcarDelEquipo`: guarda los últimos 10 dígitos y saca
  de Leads, a la papelera, los leads de WhatsApp con ese número en las dos marcas). El 1/oct se sacaron Aure, Laura, Ana Cecilio,
  Luis, Valentina (setter) y Roger: el equipo de ventas no tiene ficha en Ritmo, así que solo esta lista los reconoce.
- **Tarjeta** (27/sep): "Llegó hoy 9:46 AM" (`horaLlegada`, hora PR) + negocio o nicho. El nicho lo saca Claude
  (`lib/leads/nicho.ts`, `claude-opus-5` effort low, `LEADS_NICHO_MODEL`) de los primeros mensajes entrantes de WhatsApp
  (desde `/api/leads/timelines`, máx. 3 intentos, espera si solo dijo "hola"); queda en `datos.nicho` y `negocio` si lo
  nombra (nunca pisa lo escrito). Manito (cursor-pointer) en las tarjetas.
- **Exportar a Excel como Pipedrive** (28/sep): botón **Exportar** en la barra (Embudo · Lista · Actividades) → CSV con ; y BOM
  (`/pulse/leads/<marca>/exportar?embudo=<id|todos>&estado=abierto|ganado|perdido|todos&dueno=&q=`): este embudo (lo que ves o
  todo) o todos los embudos; respeta dueño y búsqueda; sin tope (hasta 50K); sin grupos de WhatsApp; 20 columnas (nombre, negocio,
  teléfono +1, e-mail, embudo, etapa, estado, valor, dueño, agendó, origen, nicho, etiquetas, motivo de pérdida, próxima actividad,
  último mensaje, días en la etapa, creado, cerrado, ID) en hora de PR; fórmulas neutralizadas. **Elvin exporta directo; Nahuel y
  Aure** (`EXPORTAR_CON_OK`, override `LEADS_EXPORTAR`) tienen el botón pero **cada exportación espera el OK de Elvin**
  (`pedirExportacionAction` → tabla `leads_exportaciones`, migración 0033 → `notificarCEO`; Elvin aprueba en
  `/pulse/leads/exportaciones`; al aprobar, DM del bot con el link; se baja UNA vez y en 24 h con `?solicitud=<id>`, solo quien la
  pidió). Nadie más exporta. Cada exportación queda en el registro de seguridad. Puro en `lib/leads/exportar.ts` (tests
  `tests/leads-exportar.test.mjs`), servidor `lib/leads/exportaciones.ts`, `tratosParaExportar` en repo.
- **Equipo de ventas** (`/pulse/leads/<marca>/equipo`, botón **Equipo** en la barra; 28/sep): el **director de ventas** de la marca
  (perfil de Ritmo `director_ventas`: Nahuel en Level Up), las editoras y Elvin dan/cambian/quitan el acceso a Leads (todos los
  leads | solo sus leads) a cuentas activas de Pulse; no a quien es "solo Ritmo" (eso lo abre Yaileen/RR.HH. en Ritmo → Ajustes) ni
  a bloqueados. Marca "todavía no creó su clave". Cada cambio → registro de seguridad + aviso a Elvin si no lo hizo él. Puro en
  `lib/leads/equipo.ts` (tests `tests/leads-equipo.test.mjs`), datos `lib/leads/equipo-datos.ts`, `accesoEquipoLeadsAction`.
- **Reparto por embudo** (30/sep, Elvin: "como el round robin de Pipedrive"): en **Editar embudo** → "¿Quién recibe los leads
  nuevos?" = Nadie · Una persona · **Rotación** (round robin, en el orden marcado) entre quien tiene `leads_acceso` de la marca
  (`equipoReparto`). Lo aplica `crearTrato` solo a leads que llegan SIN dueño (no manuales ni grupos; el setter del link o el
  número de WhatsApp con dueño mandan); `leads_embudos.reparto` + `reparto_turno` (migración 0042) sube atómico en el UPDATE.
  Puro en `lib/leads/reglas.ts` (`duenoPorReparto`, tests `tests/leads-reparto.test.mjs`); el tablero muestra "Rotación: A → B".
- **Mover columnas** (1/oct, Elvin: "arrastrarlas de lado a lado… sin fricción"): el encabezado de cada etapa se agarra y se suelta
  sobre otra columna (`useDraggable` id `col:<etapa>` en el mismo DndContext de las tarjetas; la de Grupos no se mueve); optimista y
  `reordenarEtapasAction` → `reordenarEtapas` (exige todas las etapas del embudo). Dirección y director de ventas (`puedeOrdenar`).
- **Filtro de fecha y búsqueda** (1/oct): "Hoy/Ayer/Semana/Mes" = llegó en ese rango **o** tiene cita/seguimiento en ese rango
  (`condFecha`, para que CLOSERS + Hoy enseñe las citas del día). La búsqueda filtra el embudo abierto y una franja enseña lo
  que coincide en los **otros** embudos de la marca (`buscarEnMarca`, `components/leads/otros-resultados.tsx`).
- **Audios, fotos y documentos de WhatsApp** (9/oct, Elvin: "vemos lo que se escribe pero no los audios"): Timelines los
  manda en `message.attachments` con un link que **vence a los 15 min**. `leerTimelines` los lee (`adjuntos`, `fecha` = hora
  real del mensaje); un audio solo ya no se descarta como "vacío" (antes se perdían ~20 al día y, si era el primer mensaje, ni
  se creaba el lead). Audio/foto/documento ≤ 16 MB se copian al llegar a Storage `pulse/leads/<marca>/<mes>/<uid>-<n>.<ext>`
  (`lib/leads/adjuntos.ts`, `meta.adjuntos[n].ruta`); los videos no. La ficha los reproduce por
  `/api/pulse/leads/adjunto/<historialId>/<n>` (permisos del lead; lo no guardado se pide fresco a Timelines por
  `GET /messages/<uid>`). Recuperación de 14 días: `/api/cron/leads-adjuntos-recuperar` (a mano, CRON_SECRET; 9/oct metió
  820 mensajes sin tocar no leídos). Tests `tests/leads-adjuntos.test.mjs`.
- **Vigía del WhatsApp** (9/oct, tras el 6/oct: el plan de Timelines de AIB perdió la API y no entró un lead en ~20 h):
  `/api/cron/leads-vigia` cada 30 min → API/plan (401/403), número conectado, webhooks a Leads y silencio ≥ 3 h de 9 AM a
  9 PM PR. Avisa por el **Telegram de Nico** (`notificarPorNico`, `TELEGRAM_BOT_TOKEN_NICO` en Vercel) una vez por problema
  y otra al recuperarse; estado en `leads_webhook_log` (fuente "vigia"). Reglas puras `problemaTimelines`/`decisionVigia`.
- **Exportaciones con Nico** (9/oct): el pedido de Nahuel/Aure le llega a Elvin por el bot de Nico con un código; aprueba con
  `ok exp <código>` / `no exp <código>` en ese Telegram (el puente llama `POST /api/leads/exportaciones/decidir`, CRON_SECRET)
  o `nico ok exp <código>` en Slack. `/solicitudes` de Nico también las lista.
- **Nombre de la cita manda** (14/oct, Ruth del Valle salía como "Experience Innovation Claro Dealer"): al agendar en Calendly, un lead de WhatsApp toma el nombre que la persona escribió y el del perfil pasa a negocio si estaba vacío (`renombrePorAgenda`, `nombreManda` en `ingestarLead`; tests `tests/leads-renombre.test.mjs`).
- **Embudo SEGUIMIENTO de Lis** (20/oct, Elvin): los que fueron a llamada con un closer y NO compraron, uno por
  marca (el "Seguimiento" vacío de LU se renombró; el de AIB se creó). Columnas: Por revisar · Caliente · Tibio ·
  Frío · Nueva cita · Descansando (15-30 días) · Mensaje final (ganado/perdido siguen siendo el estado). Dueña: Lis
  (`LEADS_SEGUIMIENTO_EMAIL`); los closers no escriben antes que ella. **Fathom → SEGUIMIENTO automático**: en
  `/api/fathom`, cada llamada de cierre (Roger/Laura, primer intento) corre `seguimientoDesdeFathom` en `after()`:
  Sonnet (`LEADS_SEGUIMIENTO_MODEL`) lee resumen + transcripción → si no compró, mueve el lead que ya existía (por
  email del invitado o teléfono, en cualquier marca; si ya está ganado o es cliente, nada) o lo crea, en la columna
  de su temperatura, con `datos.seguimiento` (closer, servicio, objeción, feedback, próximo paso, presión, link) +
  nota en el historial + actividad "whatsapp" **"1ª llamada: indagar la objeción real"** para Lis al otro día hábil
  (L-V, 10 AM) y la cita del closer ya pasada queda hecha (no sale "Vencido"). **Su nota manda** (`notaAction` →
  `trasNotaDeSeguimiento`): una nota en un lead con ese contacto pendiente lo cierra y agenda el próximo — "no
  responde/no contestó/buzón" → "Volver a llamar" al otro día (hasta 3 veces); si habló, "Seguimiento <temp>"
  (caliente 1 día, tibio 3, frío 7). La tarjeta dice "Llamada hoy · Laura" en vez de "Llegó…"; filtros por closer
  (primer nombre) y por servicio (`?closer=`, `?servicio=`). Un lead abierto de SEGUIMIENTO no sale a otro embudo
  salvo por su dueña, `LEADS_SEGUIMIENTO_PUEDEN` (Nahuel) o admin/editor (`bloqueoSeguimiento` en actions.ts; Laura
  sacó a Edgar el 20/oct). Registro en
  `leads_webhook_log` (fuente fathom, evento seguimiento). La ficha muestra el bloque "Seguimiento"
  (`components/leads/seguimiento.tsx`). Arena: un lead en SEGUIMIENTO cuenta como "se presentó"
  (`resultadoCita(…, embudo)`). Excel de Lis (jun–oct, 470 filas) importado el 20/oct: CERRÓ no entra, sin estado
  de antes de septiembre → perdido en "Mensaje final", el resto en su temperatura; industria y objeción por Haiku.
  **Columnas que cierran** (`estadoDeEtapa`): "Seguimiento ganado/perdido" marcan el lead ganado/perdido al
  arrastrarlo ahí, el tablero las muestra con sus leads cerrados y sacarlo de ahí lo reabre; cerrar como perdido desde
  la ficha lo manda a esa columna. Fathom: "definitivamente no" → Seguimiento perdido. **Qué ofrecerle**
  (`recomendar`): DFY ($3,000–$4,000+) a quien factura $10K+/mes, o profesional/dueño con capacidad que quiere
  escalar; Bori Pro $99 / Agencia $249 al emprendedor sin capacidad; marca sobreventa (DFY a quien no califica) o
  "se quedó corto" (solo Bori a quien sí), y el trato que debe dar Lis (descuento, financiamiento, plan de pago).
  Prioridad: ⭐ alta (califica DFY: salud/abogado o $10K+) · 🔥 súper ($20K+/mes) → aviso a Elvin por
  `notificarCEO` con el link de la ficha. También guarda la razón específica de por qué no cerró.
  Código: `lib/leads/seguimiento{,-reglas}.ts`, tests `tests/leads-seguimiento.test.mjs`.
- **Entrada para Zapier/formularios**: `POST /api/leads/entrada?marca=level-up&embudo=<id|nombre>&s=
  LEADS_WEBHOOK_SECRET[&etapa=…]` (JSON o form, campos tolerantes, sin duplicar, `moverSiExiste:false`).
- **Equipo con acceso a Leads LU** (cuentas miembro de Pulse, `leads_acceso` todos): Luis Fernández (setter),
  Roger Arteaga, Laura Bernal (closers), Joaquín La Valle (setter), Nahuel Tissera (director comercial), Ana Cecilio y
  Dilan Torres (chatters); Aure (editor). Santiago Villarreal ya no está. Se les da la clave con el link de
  acceso de Ritmo + `&d=leads` (`linkDeAcceso`, 72 h) → crean su clave y caen en /pulse/leads.
- **AI Borinquen (27/sep)**: copia exacta de sus 4 embudos de Pipedrive (`SEMILLA.ai_borinquen`: WHATSAPP, RECUPERACIÓN
  2026, DIAGNÓSTICO DE AUTOMATIZACIÓN, Bori · Seguimiento); Timelines AIB conectado (`TIMELINES_TOKEN_AIB` en .env.local
  y Vercel, número +1 939-304-0491, webhooks 30214/30215) y el quiz de AIB entra a "Diagnóstico de Automatización"
  (`leadQuiz({ marca })`). Acceso: Aure y Luis Fernández. Los leads abiertos de Pipedrive AIB NO se cargaron (pendiente
  de decisión de Elvin); Pipedrive AIB sigue en paralelo.
- **Semana 2 (en paralelo con Pipedrive)**, `lib/leads/cables.ts`: Calendly de LU → embudo Closers
  (agendó/reagendó/canceló; onboarding = GANADO; la cita queda como actividad "llamada" del closer a la hora de la
  cita vía `agendarLlamadaSistema`, se mueve si reagenda y se quita si cancela; el 26/sep se cargó la agenda futura: 10 citas) y quiz de LU → "Diagnóstico de Crecimiento" (el quiz nunca
  mueve a un lead que ya existe). AIB y el resto de escritores de Pipedrive (prospección, fábrica de demos,
  dashboards) siguen en Pipedrive hasta la semana 3.
- **Archivo de Pipedrive** (costo $0, por API): `node scripts/pipedrive-archivo.mjs lu|aib` → JSON + Excel en
  `~/Documents/Archivo Pipedrive/<fecha>/` (fuera del repo) y copia en Supabase Storage privado
  `pulse/archivo-pipedrive/2026-09-26/` (LU: 14,713 tratos, 14,837 personas, 26,538 notas, 31,630 actividades;
  AIB: 5,310 / 5,311 / 10,269 / 11,019).
- Código: `lib/leads/{schema,reglas,repo,pagina,cables,timelines}.ts`, `app/pulse/(app)/leads/`,
  `components/leads/`, migraciones 0013-0014, `tests/leads.test.mjs`. Probar local sin clave:
  config `content-os-abierto` (puerto 3011, CEO_PORTAL_PASSWORD vacío = modo abierto de dev).
