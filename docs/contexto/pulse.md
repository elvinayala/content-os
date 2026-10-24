## Pulse — el CRM que reemplaza a Monday (`/pulse`)

Clon simplificado de Monday.com (ahorra ~$800/mes) para lo único que Level Up usaba ahí:
la ficha de cada cliente que paga. Lo usan Jessica (onboarding) y Carilin (operaciones);
Pipedrive sigue siendo el CRM de leads. Modelo **genérico tipo Monday**: tableros → columnas
(13 tipos: text, long_text, number, status, dropdown, date, people, checkbox, link, email,
phone, file, relation) → grupos → items con `values jsonb {[columnId]: valor}`. Jessica y
Carilin agregan columnas/etiquetas/grupos desde la UI sin código.

- **Stack**: Postgres (Supabase; sin `DATABASE_URL` cae a **PGlite** embebido en `./.pulse-db`,
  solo dev) + Drizzle (`lib/pulse/schema.ts`, migraciones en `drizzle/`, `npm run db:generate|
  db:migrate|db:studio`). Archivos en Supabase Storage (bucket privado `pulse`; en local van a
  `.pulse-db/archivos/` y se sirven por `/api/pulse/archivo/[id]`).
- **Auth propia**: tabla `pulse_users` (email + clave scrypt, rol admin|miembro), cookie
  `pulse-session` firmada HMAC (`lib/pulse/session.ts`, verificable en `proxy.ts` sin DB). La
  cookie CEO también entra como `PULSE_ADMIN_EMAIL`. Login en `/pulse/login`; usuarios en
  `/pulse/configuracion` (solo admin). Los usuarios importados de Monday llegan inactivos hasta
  que un admin les pone clave.
- **UI** (`components/pulse/`): tema claro `.pulse` (globals.css; ¡`className="pulse"` en todo
  `*Content` que portalea!), `board-provider.tsx` = store cliente con edición **optimista +
  rollback** (sin `revalidatePath` por celda; `refresh()` solo en cambios estructurales),
  `board-table.tsx` virtualizada (`@tanstack/react-virtual`, OFFBOARDED arranca colapsado),
  `cell.tsx` (un editor por tipo), kanban con `@dnd-kit`, tarjetas, panel del item por `?item=`
  con actividad + comentarios (`pulse_activity`), filtros/orden/agrupar client-side.
- **Server actions**: `app/pulse/(app)/[board]/actions.ts` (verifican `usuarioActual()`, validan
  con `lib/pulse/valores.ts`, devuelven `{ ok, ... }`); data access en `lib/pulse/repo.ts`.
- **Migración**: `npm run pulse:migrar -- [--dry-run] [--board <id>] [--sin-archivos]` con
  `MONDAY_TOKEN` (GraphQL 2025-01, `items_page` paginado, colores por `var_name`, personas por
  email, relaciones en 2ª pasada, PDFs a Storage; idempotente por `monday_id`). Tableros:
  LEVEL UP MEDIA 7784685790 → `/pulse/level-up-media`, AI BORINQUEN 18399101258, Asignación de
  Estrategas 9506323087. Mapeo puro y testeado en `scripts/pulse/monday-mapeo.mjs`
  (`tests/pulse-valores.test.mjs`). Reporte en `data/pulse-migracion.json`.
- **Puente a n8n/NocoDB** (`lib/pulse/puente-n8n.ts`): los agentes de n8n de Level Up leen la tabla
  `clientes` de NocoDB, que antes alimentaba Monday. Pulse avisa cada cambio de LEVEL UP MEDIA /
  Asignación de Estrategas al webhook `pulse-cliente` (after(), `PULSE_N8N_SECRET`, `N8N_URL`) y
  expone `GET /api/pulse/n8n/clientes` para la corrida nocturna. El workflow lo genera
  `scripts/n8n-sync-pulse.mjs`. `PULSE_N8N_MODO=real` para escribir; si no, simulación.
- **Cuentas publicitarias del onboarding** (12/oct): `lib/pulse/cuentas-meta.ts` verifica con `META_ADS_TOKEN` (app Hey Bori) que Bori lea el
  "Id cuenta publicitaria" de cada ficha de LU (CLIENTE ACTIVO, ONBOARDING & SETUP, ANÁLISIS Y ESTRATEGIA): al crearse la ficha, cada hora en las
  nuevas/con problema y a las 7 AM PR en todas (`/api/cron/cuentas-meta`, `?completo=1`, `?avisar=0`). Estados `ok · sin-id · sin-permiso · no-existe ·
  pago · inactiva` (reglas puras en `cuentas-meta-reglas.ts`, tests `tests/cuentas-meta.test.mjs`); escribe nota en la ficha solo al cambiar y manda un DM
  a quien le toca (proceso de Carilin, 12/oct): cuenta **no compartida** → Jessica (`PULSE_CUENTAS_AVISAR`; en el onboarding el cliente nos
  da permiso de socio en el portafolio "Level Up" 836808821982174); **sin ID, ID malo, pago o cuenta caída → el estratega asignado** en Asignación
  de Estrategas (DM por su `slack_id` de Ritmo; él pone el ID: Jessica no tiene acceso a ningún administrador de anuncios); cliente sin estratega → Jessica (ella asigna estrategas) con Carilin en copia (`PULSE_CUENTAS_SIN_ESTRATEGA`). `repartirAvisos` puro + tests. Lunes = recordatorio. Las asignaciones sin el vínculo «Nombre del cliente» (81 de 104) se emparejan por nombre (`emparejaAsignacion`); antes de la reunión de onboarding no se avisa que falta el ID (`onboardingHecho`); el selector de relación muestra/busca «Nombre · Negocio».
- **Seguridad** (`lib/pulse/seguridad.ts`, 21/sep): cookie `userId.exp.iat.hmac` (14 días) y
  `pulse_users.sesiones_desde` — cambiar clave/rol o desactivar cierra las sesiones; bloqueo 15 min
  tras 5 intentos fallidos (`intentos_fallidos`/`bloqueado_hasta`) + límite 10/min por IP; scrypt
  de sacrificio anti-enumeración; clave ≥ 8; `pulse_security_log` (se ve en /pulse/configuracion,
  solo admin); `secretoValido()` (timing-safe) para n8n/cron; cabeceras HSTS/CSP/X-Frame en
  `next.config.ts` (CSP solo en /pulse; si se agrega un CDN hay que sumarlo a `img-src`/`connect-src`);
  respaldo diario `api/cron/pulse-respaldo` (8:30 UTC) → Storage `pulse/respaldos/YYYY-MM-DD.json`,
  conserva 30, sin password_hash.
- **Typeform de onboarding → Pulse** (24/sep): el cliente paga, llena el "ONBOARDING TYPEFORM"
  (`vlfCgUUP`) y el webhook `POST /api/pulse/typeform` (firma `Typeform-Signature` con
  `TYPEFORM_WEBHOOK_SECRET`, público en `proxy.ts`) crea la ficha en LEVEL UP MEDIA → ONBOARDING & SETUP
  (nombre del contacto, Empresa, Teléfono, E-mail, Pueblo) y deja TODAS las respuestas como comentario,
  firmado por el usuario de sistema "Typeform (automático)". Si ya existe por e-mail/teléfono completa
  solo lo vacío; idempotente por token. Mapeo puro en `lib/pulse/typeform.ts` (tests), alta en
  `lib/pulse/alta-typeform.ts`. `scripts/typeform.mjs webhook|webhooks|importar --desde … [--real]|probar`
  (necesita `TYPEFORM_TOKEN`; `?prueba=1` / sin `--real` escribe en el tablero Demo).
- **Onboarding propio de Level Up** (24/sep, reemplaza al Typeform): **`https://levelupmedia.vercel.app`**
  (raíz = formulario por rewrite; en ese dominio y en `bienvenida-levelup` cualquier otra ruta vuelve al
  formulario, nunca a un login) → `/onboarding/level-up` (público en `proxy.ts`). Lo manda el CLOSER al cerrar. Una pregunta por pantalla, marca LU (negro +
  `#f5ce1a`, Sora/Inter, estilos `.onboarding-lu` en globals.css), borrador en localStorage. Preguntas y
  validación compartidas en `lib/onboarding/level-up.ts` (`columna` = título de la columna en Pulse;
  `ETIQUETA_VISIBLE` muestra bien escritas las etiquetas del CRM). `POST /api/onboarding/level-up`
  (límite por IP, campo trampa, `?prueba=1` + `x-prueba: CRON_SECRET` → Demo) → `altaOnboarding`
  (`lib/pulse/alta-typeform.ts`, compartida con el Typeform): convierte cada respuesta al tipo de su
  columna (status/dropdown por etiqueta, número, link), crea en ONBOARDING & SETUP o completa lo vacío.
- **Próximo nivel** (24/sep, sin cambios bruscos):
  - **Ocultar** columnas y etiquetas (`settings.oculta`, `columnaVisible`/`etiquetaElegible` en
    `lib/pulse/types.ts`): no se borran, salen del tablero/pickers; "Ocultas (n)" en la barra las
    muestra; en la ficha van en "Columnas ocultas". En LU se ocultaron STATUS REVISIÓN, Encuesta,
    Tipo, 6 etapas de Progreso sin uso y "Otro" en Razón de Baja.
  - **Automatizaciones** tipo Monday (tabla `pulse_reglas`, menú ⚡ del tablero; solo admin/editor):
    cuando valor/grupo (con excepciones) → mover, fecha +N días, poner valor/persona, **exigir**
    un campo (p. ej. razón de baja al pasar a OFFBOARDED: el cliente abre `RequisitoDialog` y
    reintenta) o avisar por Slack. Lógica pura en `lib/pulse/automatizaciones.ts` (tests),
    ejecutor en `lib/pulse/motor-reglas.ts`; sin cascadas entre reglas.
  - **Mi día** (`/pulse/mi-dia`, `lib/pulse/mi-dia.ts` puro + `mi-dia-datos.ts`): clientes nuevos
    del formulario, onboardings detenidos +48 h, seguimientos de 10 días y reportes de la semana;
    "✓ Hecho" queda en `pulse_activity.after.hecho` y "Reporte enviado" recalcula el próximo.
    Cron `api/cron/pulse-mi-dia` lun–vie 8 AM PR → DM **desde el bot Command Center** (nunca
    desde la cuenta de Elvin) a `PULSE_MI_DIA_DESTINOS` (default jessica, carilin); `?prueba=1`
    solo a Elvin. IDs de Slack conocidos en `lib/pulse/slack-dm.ts` (el bot no tiene
    `users:read.email`; override `PULSE_SLACK_IDS`).
  - **⌘K** (`components/pulse/buscador-global.tsx`): clientes de los tableros visibles por nombre,
    empresa, e-mail o teléfono (también dígitos pegados) + navegación; desde el 1/oct también **leads** de las marcas con
    acceso (`buscarLeadsGlobalAction` → `buscarEnMarca`, respeta "solo mis leads"). **Vistas guardadas** por
    persona (`pulse_vistas`, popover "Vistas"). **Celular**: arranca en tarjetas, barra con "Más".
  - **Preguntarle al CRM** (`/pulse/preguntar`, también desde ⌘K con `?q=`): agente con tools
    (`buscar` → `consultar()` puro en `lib/pulse/preguntar.ts`, tests; `responder` con ids + nota)
    en `lib/pulse/preguntar-ia.ts` (`claude-opus-5`, effort low, fallbacks del servidor; override
    `PULSE_PREGUNTAR_MODEL`/`_EFFORT`). Solo aplana los tableros que la persona puede ver y solo
    devuelve ids de esos tableros; tope 8 preguntas/min por persona. ~15 s por pregunta.
  - Dev local usa `DATABASE_URL_DIRECT` (pooler de sesión): el de transacciones dejaba consultas
    trabadas en "ClientRead" desde la Mac. Prod sigue con `DATABASE_URL` (6543).
- **Tesorería LU · Métricas del mes** (`/pulse/tesoreria-mensual`, 26/sep): tablero PRIVADO para María García
  (tesorera, maria@) + Carilin y Aure, **solo Level Up** (una fila por mes): ventas nuevas/recurrentes,
  reembolsos, activos inicio/cierre, bajas, cobros pendientes, estado y reporte adjunto. **Se calculan solos**
  (columnas `number` con `settings.formula`, `lib/pulse/formulas.ts` puro + tests; `repo.recalcularItem` tras cada
  `actualizarValorAction`; la celda es de solo lectura con ƒ): ingresos totales = nuevas + recurrentes · netos =
  totales − reembolsos · churn = bajas ÷ activos al inicio × 100 · ticket = ingresos ÷ activos al cierre · LTV =
  ticket ÷ churn. Dato faltante = celda vacía (reembolsos sin nada → poner 0). Script
  `scripts/pulse/crear-tablero-tesoreria.mjs`. El tablero TESORERIA (cobros) sigue aparte.
- **Acuerdo firmado automático** (27/sep, `lib/pulse/contratos.ts` puro + tests `tests/pulse-contratos.test.mjs`,
  `lib/pulse/contratos-slack.ts`): al crearse una ficha en LEVEL UP MEDIA (`altaOnboarding` → after()), Pulse lee
  **#office-2-ventas-contrato** (`SLACK_CONTRATOS_CHANNEL_ID`, default C08SV6GJLPQ, privado: el bot Command Center
  tiene que estar invitado), empareja la venta por correo/teléfono (o nombre + apellido), baja el PDF del hilo y lo sube
  a la columna file **"Acuerdo firmado"** (usuario de sistema "Contratos (automático)", comentario con el link de la
  venta). Si no hay venta o PDF → comentario ⚠️ y DM del bot a Jessica (`PULSE_CONTRATOS_AVISAR`) UNA vez; si el PDF no
  menciona al cliente (pasó: el de Joel se llamaba "Edgar_Rosado") lo adjunta pero avisa "revísalo". Cron
  `/api/cron/pulse-contratos` cada hora 8 AM–8 PM PR: fichas de los últimos 14 días sin acuerdo; cuando llega, lo
  adjunta y le avisa a Jessica. Fichas anteriores a `PULSE_CONTRATOS_AVISOS_DESDE` (27/sep) no generan avisos.
  `?avisar=0` = pasada sin avisos, `?dias=N`. "Firmado" = hay PDF del contrato en el hilo (no se lee la firma).
- **Bloqueos por persona** (`pulse_board_bloqueos`, migración 0024): un tablero público que alguien NO ve
  (`boardsVisibles`/`puedeVerBoard`, afecta sidebar, ⌘K, Preguntarle al CRM y archivos; admins no se bloquean).
  María García tiene bloqueado AI BORINQUEN. Sin UI todavía: se agrega por SQL.
  **Quién entra a un tablero privado** (24/oct, Aure): menú del tablero → "Acceso…" (admin: todo) o "Quién puede
  verlo…" (editoras, solo en privados que ya ven: no lo vuelven público ni se quitan a sí mismas). Yaileen: HR LEVEL UP
  MEDIA y Solicitudes HR (24/oct).
- **SOPs** (27/sep, pedido de Elvin, prioridad hasta el vie 2/oct): tableros **SOPs · Level Up** (público) y **SOPs · AI
  Borinquen** (privado), primeros en la barra; un grupo por departamento con su "SOP principal" (responsable Carilin o
  Aure), estados Por hacer → Rehaciendo → En revisión → Publicado; publicar EXIGE "Reunión con el departamento" y "Fecha de
  revisión" y pone "Próxima revisión" a 90 días (regla ⚡). Script `scripts/pulse/crear-tableros-sop.mjs`. Recordatorio
  `/api/cron/sop-recordatorio` 9 AM PR del 28/sep al 2/oct (`SOP_RECORDATORIO_DESDE/HASTA`): DM del bot a Carilin y Aure
  con su progreso real; si ya contestaron en el DM → solo estatus; si publicaron todo → nada (`lib/pulse/sop-mensajes.ts`
  puro + tests, `sop-recordatorio.ts`). `?dry=1` / `?prueba=1` (a Elvin).
- **AI Borinquen cerrado** (27/sep, Elvin: "lo de Borinquen lo maneja Aure; más nadie"): tableros AI BORINQUEN y SOPs AIB
  privados (Aure, Carilin, Ángela, Ana Milena, Adamay, Garrys, Luis, Yaileen); Leads AIB solo con fila en `leads_acceso` (las
  editoras no entran solas: `accesoLeads`/`marcasConAcceso`) = Aure, Carilin, Luis, Yaileen. Yaileen ya no es solo_ritmo.
  Jessica no ve AIB. **Carilin = mismo acceso que Aure** (28/sep, Elvin: "Carilin puede ver todo, incluso recursos humanos"):
  mismos tableros privados (también HR y Solicitudes HR) y Leads de las dos marcas; lo que se le dé a Aure, también a Carilin.
- **Rediseño nivel SaaS** (27/sep, Elvin: "una plataforma de San Francisco… que digan wow"): tema `.pulse`
  refinado (fondo #fcfcfd, texto #1b1c1f, bordes #e5e5ea, `.superficie`, `.esqueleto` + `(app)/loading.tsx`),
  pills de status suaves (tinte + punto, `status-pill.tsx`), ícono por tablero (`icono-tablero.tsx`, por nombre),
  sidebar Inicio · Buscar (⌘K) · Mi día · Preguntar + grupos Ventas/Tableros. **Inicio** (`/pulse`): saludo,
  KPIs vivos (`numerosInicio`: activos, onboarding, nuevos del mes, cartera), "Tu día", actividad reciente del
  equipo (`actividadReciente`, sin usuarios de sistema) y espacios de trabajo. Login en pantalla dividida con
  panel de marca ilustrativo (sin datos reales).
  **Últimos clientes** en el Inicio (`ultimosClientes` en repo, puro en `lib/pulse/ultimos-clientes.ts` + tests): los 6
  más recientes de LU/AIB visibles (sin bajas ni "(copy)"), cuánto pagó (Pago Inicial → venta de Slack → Acuerdo de
  Pago; cuotas se multiplican), nicho (Industria; si es "Otro", lo del formulario), cuándo pagó (Fecha del pago
  inicial → fecha de la venta en Slack, `ventaTs`) y onboarding (= ficha creada). ≥ $3,000 = "Alto valor" dorado.
- **Protección de datos** (27/sep, Elvin: "que nadie pueda eliminar data de un solo click, y copia de seguridad
  fuera y en varios lugares"):
  - **Papelera universal** (migración 0029, `pulse_papelera`): trigger `papelera_guardar` AFTER DELETE en TODAS las
    tablas de public (hoy 58; `pulse_papelera_proteger()` pone el trigger en tablas nuevas y la corre el respaldo diario)
    copia la fila borrada, venga de la app, un script, una cascada o un agente; TRUNCATE bloqueado. Lo borrado en una
    transacción = un **lote** (mismo `borrado_at`) que se restaura junto (`lib/pulse/papelera.ts`, puro en
    `papelera-reglas.ts` + tests). `borrarComo(userId, fn)` marca quién borró (`app.usuario`). Los archivos NO se borran:
    `borrarArchivos` los mueve a `papelera/<día>/<ruta>` en Storage y `restaurarLote` los trae de vuelta. 90 días y se purga
    (solo si ese día la base quedó copiada fuera).
  - **Pantalla**: toast **Deshacer** 15 min al borrar fichas/archivos (el que borró; `deshacerBorradoAction`); borrar un
    tablero exige escribir su nombre; ≥ 10 fichas exige escribir ELIMINAR; quitar un archivo pide confirmación; borrar una
    columna ya NO vacía sus valores (se quedan en `values` y vuelven al restaurarla). **Papelera y respaldos**
    (`/pulse/papelera`, solo admin: guarda también nómina y canal ético) con restaurar por lote y el estado de los 3 respaldos.
  - **Respaldo diario** (`/api/cron/pulse-respaldo`, 4:30 AM PR, `lib/respaldo/respaldo.ts`): TODA la base (60 tablas, menos
    `leads_webhook_log`) en JSON → gzip → AES-256-GCM con `RESPALDO_CLAVE` (`lib/respaldo/cifrado.ts`, tests) en
    **Supabase** `respaldos/base/<día>.json.gz.enc` (30 días) y **Vercel Blob privado** `respaldos-ea-market` (otro
    proveedor; `base/` 60 días + `archivos/<ruta>.enc` incremental, sin motion/). Verifica bajando la copia de Blob,
    descifrándola y contando filas; si algo falla → `notificarCEO` + evento `respaldo_fallido`. Estado en
    `respaldos/estado.json`. **La Mac** (`scripts/respaldo.mjs local`, launchd `com.iamarket.respaldo` 1 PM o al
    despertar) copia la base directo de Postgres (sin depender de Vercel) + archivos en `~/Respaldos EA Market/` (90 días;
    fuera de Documents porque launchd no tiene permiso ahí) y deja `respaldos/estado-mac.json`.
  - **Restaurar**: `node --env-file=.env.local scripts/respaldo.mjs listar | abrir <fuente> [--salida x.json] |
    restaurar <fuente> [--tabla a,b] [--real]` (fuente = ruta · `supabase:<día>` · `blob:<día>`); solo inserta lo que falta
    por la llave de cada tabla, nunca pisa. Probado de punta a punta el 27/sep. **Sin `RESPALDO_CLAVE` los respaldos no
    se abren**: está en `.env.local` y en Vercel (Production); Elvin debe guardarla también en su gestor de claves.
- **Doble capa y accesos separados** (28/sep, Elvin: "proteger Pulse… nunca mezclar datos, nunca mezclar accesos"; puro en
  `lib/pulse/acceso-reglas.ts` + tests `tests/pulse-acceso.test.mjs`): `tipoAcceso` = **completo** (dirección y operaciones: ven
  tableros) · **solo_leads** (perfil de Ritmo closer/setter/chatter/director_ventas: solo Leads y Formularios si los tiene; sin
  tableros en `boardsVisibles`/`puedeVerBoard`, Inicio → /pulse/leads, barra recortada) · **solo_ritmo**. Todo el que es
  *completo* confirma con el **código de su app autenticadora** (`/pulse/verificar`, la MISMA verificación de Ritmo:
  `desempeno_dos_pasos` + cookie `ritmo-2fa` 30 días): lo exige el layout, `requiereUsuario()` y `usuarioVerificado()` (route
  handlers de archivos/CSV/exportar y actions de Leads/Formularios). `PULSE_2FA=off` lo apaga (en dev viene apagado; en prod,
  encendido). Alertas a Elvin (`alertarElvin`): intento con correo sin cuenta, cuenta vetada o desactivada, bloqueo por 5 claves
  malas, y cuenta nueva con correo fuera de la empresa (`avisarCuentaFuera`, en Pulse y en el alta de Ritmo). **Entrada del equipo
  de ventas: `/ventas`** (pública en proxy; mismas cuentas, cae en /pulse/leads). Botón **Ir a Ritmo** en el Inicio y la barra de
  Pulse (misma sesión) y **Pulse/Leads** en el encabezado de Ritmo. **Dominio serio: `leads.levelupmediapr.net`** (29/sep:
  CNAME `leads` → `cname.vercel-dns.com` + TXT `_vercel` en Network Solutions, verificado en Vercel; `LEADS_URL` en Production). En ese host la raíz es /ventas y todo lo que no sea Leads
  vuelve a Leads (proxy); `LEADS_URL` apunta ahí los botones de Ritmo.
  **Puente Ritmo → Slack** (`components/ritmo/boton-slack.tsx`): botón en el encabezado de Ritmo que abre la app de Slack del
  espacio de su empresa (`slack://open?team=`; si no la tiene, app.slack.com). LU = T07V7MUDA9H (levelupmediaespacio), AIB =
  T09LARF90H3 (aiborinquen); la dirección ve los dos.
- **Seed** de prueba: `npm run db:seed` (admin + Jessica + Carilin, clave `pulse-dev` sin env,
  tablero Demo). Env: ver bloque Pulse en `.env.example`.
