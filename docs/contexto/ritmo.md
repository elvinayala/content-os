## Ritmo — asistencia y desempeño del equipo (`/ritmo`, 25/sep/2026)

Elvin: medir **asistencia, cumplimiento y resultados por puesto sin vigilar** (nada de capturas/GPS/
teclado). App **aparte de Pulse** (su nombre, su link, tema `.ritmo` en globals.css: azul tinta + verde (pulso) + coral (calor), el logo va de verde a coral,
PWA propia `app/ritmo/manifest.webmanifest`), pero por dentro usa **las mismas cuentas, cookie
`pulse-session` y base de Pulse** (tablas `desempeno_*`, migración `0008_desempeno.sql`, schema en
`lib/desempeno/schema.ts`). Entrada propia en `/ritmo/entrar` (reusa `loginPulseAction`, que ahora
acepta `desde=/ritmo…`). **Dominio oficial: `https://ritmo.levelupmediapr.net`** (26/sep; CNAME `ritmo` →
`cname.vercel-dns.com` + TXT `_vercel` en Network Solutions, verificado en Vercel); `ritmo-eamarket.vercel.app` sigue
funcionando. En `proxy.ts`, `ritmo.*`/`ritmo-*` → `/ritmo` y cualquier ruta ajena vuelve a Ritmo.

- **Hoy** (`/ritmo`): círculo grande = ponche (hora del servidor + IP). Horario flexible (varios
  tramos al día; un tramo < 16 h se cierra normal aunque pase la medianoche). Al salir: bloqueos
  (opcional) + lo que el sistema no ve (`manual` del puesto, p. ej. reuniones con clientes). Salida
  olvidada → la persona pone la hora y su líder la confirma (`correccion: pendiente`).
- **Equipo** (`/ritmo/equipo`, `/ritmo/equipo/[persona]`): por departamento — presentes, sin marcar,
  terminadas/vencidas, 🟢🟡🔴 de la semana; ficha con KPIs vs meta, 7 días y bloqueos. Permisos:
  admin/editoras todo, el líder su gente, cada quien a sí mismo (`puedeVer` en `lib/desempeno/reglas.ts`).
- **Ajustes** (`/ritmo/ajustes`, admin/editoras): perfiles (puesto, líder, horario PR, días, contrato,
  ingreso; `desde` = día de activación, antes no cuenta), metas/pesos por puesto (`desempeno_metas`) y
  botón que crea el tablero **Producción** en Pulse (`/pulse/produccion`).
- **Reglas** (puras, `tests/desempeno.test.mjs`): puestos y KPIs en `PUESTOS`; asistencia (tolerancia
  15 min, tarde 85/70/50, salida temprana solo si no completó horas); KPIs de Producción en ventana
  móvil de 7 días desde `pulse_activity` del Estado (responsable → "En revisión"; quien pidió →
  "Listo" o "Cambios" = revisión); score = 20 % asistencia + 80 % KPIs **conectados**; 🟢 ≥ 90, 🟡 ≥ 75.
  Fuentes conectadas hoy: `produccion` y `manual`. **KPIs reportados (28/sep, Elvin; "lo demás quítalo por ahora")**: se anotan
  al marcar salida, número + detalle de texto (`desempeno_reportes.detalles`, migración 0036; ficha de la persona los muestra):
  **Estratega Digital** (así se llama el puesto desde el 30/sep) = reuniones con clientes (con quiénes) · campañas realizadas · planes/investigaciones/creativos APROBADOS listos
  para ejecutar; **Project Manager (Jessica y Ángela, 30/sep)** = onboardings · conversaciones con clientes que respondieron (llamada o
  chat) · casos solucionados · clientes contactados; **AI Engineer (Garrys, 30/sep)** = proyectos nuevos comenzados (AutoFlow,
  sistema nuevo, agente personalizado) · reuniones de onboarding · soporte a sistemas;
  **Diseñador** = flyers/creativos aprobados (cuántos por negocio) · otros diseños; **Coordinadora de Retención y Alianzas (Lis, 30/sep)** =
  referidos conseguidos · conversaciones de seguimiento con potenciales · clientes de churn contactados · de esos, con los que
  conversó · proyectos especiales de EA Market LLC · contactos para alianzas/colaboradores/creadores · reuniones agendadas de
  seguimiento de ventas · cash collected cerrado (US$) · ventas de Bori. **Lis no poncha** (puesto `soloReporte`): en Hoy, en lugar
  del círculo, tiene **"Mi reporte del día"** siempre a la vista (`components/ritmo/reporte-diario.tsx`, `guardarReporteDiaAction`,
  hoy o ayer, se corrige reemplazando; `errorReporteDia` exige todos con número); su "asistencia" = si reportó (hoy queda
  pendiente); si a las 6:45 PM no lo ha llenado, el cron `recordatorio` se lo pide. Nacen con peso 0 (se miden, no puntúan)
  hasta que les pongan meta y peso en Ajustes (`KPIS_REPORTADOS` en `lib/desempeno/reglas.ts`). **Videógrafo (Derek Toro, 12/oct, Elvin: "sin ponchar… viaja
  la isla y pone trabajo realizado, negocio, pueblo, cantidad de videos, hora y día")**: puesto `videografo` (`soloReporte` +
  `trabajos`); en Hoy, en vez del círculo, **Mis trabajos** (`components/ritmo/mis-trabajos.tsx`, `app/ritmo/trabajos-actions.ts`):
  no ve la sección Empresa/Quiénes somos (`sinEmpresa`, 19/oct); uno por negocio, hasta 7 días atrás, pueblo de la lista de los 78 (`trabajos-reglas.ts` puro + tests `tests/trabajos.test.mjs`).
  Tabla `desempeno_trabajos` en SQL directo (`lib/desempeno/trabajos.ts`, papelera); cada cambio rehace su reporte del día
  (trabajos · videos · negocios + detalle) → Equipo, Ranking, reporte a RR.HH. y recordatorio de las 6:45 PM. La vista maestra
  (Yaileen, Carilin…) le anota o borra trabajos desde su ficha en Equipo. Se da de alta en Personas → Nuevo empleado → Videógrafo. Fase 2: Meta (registro de actividad), n8n (alertas
  y "Revisado"), NocoDB (reportes), Chatwoot, Slack → `desempeno_metricas` (una fila por persona/día/KPI).
- **Calibración**: el score solo lo ve admin (vista previa) hasta `DESEMPENO_SCORE=on`.
- **Avisos** `app/api/cron/ritmo` (`?tarea=digest` L-V 9:30 AM PR a Carilin/`RITMO_AVISO_A` y a cada
  líder; `?tarea=semanal` lunes 8 AM a Elvin): en simulación hasta `DESEMPENO_AVISOS=real`; `?dry=1`
  nunca manda. El monitor viejo de Slack (`/ceo/equipo-actividad`) redirige a Ritmo.

### Ritmo · Personas (RR.HH.) y canal ético (25/sep/2026)

- **Vista maestra** = admin/editoras (Elvin, Carilin, Aure) **+ RR.HH.** por `RITMO_RRHH` (emails; Yaileen).
  `lib/desempeno/sesion.ts` → `usuarioRitmo()` / `requiereMaestro()`. Los líderes NO ven la maestra.
- **Personas** (`/ritmo/personas`, `/ritmo/personas/[id]`): ficha SOLO de operaciones con sueldo fijo
  (`desempeno_fichas`; "Crear ficha" desde la lista): foto, teléfono y alterno, ciudad/país, documento,
  salario mensual USD; documentos por categoría (identificación, contrato, certificaciones, entrenamiento
  con videos, nómina, otros) en el bucket privado `pulse/ritmo/<userId>/…`, subidos DIRECTO del navegador
  con URL firmada (`prepararSubida` → PUT → `confirmarSubidaAction`; en local pasa por el servidor);
  se abren por `/ritmo/archivo/[id]` y `/ritmo/foto/[userId]` (maestra o la propia persona, con bitácora).
  El empleado ve su ficha ("Mi ficha") y puede subir sus documentos (no nómina).
- **Tiempo libre** (`lib/desempeno/rrhh.ts`, tests `tests/rrhh.test.mjs`): **8** días/año acumulados por mes
  desde el ingreso, se solicitan a los 12 meses; enfermedad **5**/año con certificado (si no → vacaciones);
  maternidad **30** por evento (subidos el 27/sep, antes 7/3/15); lo que no alcance = sin paga. **Tope de 8 días acumulados** y se cuenta desde las **últimas vacaciones** (30/sep, Elvin: "lo más
  que han podido acumular son ocho días"; `desempeno_fichas.ultimas_vacaciones`, migración 0041, "Últimas vacaciones (día que volvió)"
  en la ficha; `saldos(…, ultimasVacaciones)`). RR.HH. registra las ausencias. **17/oct (Elvin):** la enfermedad se cuenta por **período de 12 meses
  desde el ingreso** (`periodoEnfermedad`; se renueva en el aniversario, no el 1/ene); solicitud nueva **"Cita médica"** (`cita_medica`):
  al firmarse registra enfermedad certificada y se descuenta del cupo (lo que pase, a vacaciones/sin paga); los días que quedan y la
  fecha en que se renuevan salen en Solicitudes y Mi ficha. **Vacaciones con mínimo 60 días de anticipación** (`errorAnticipacion`,
  `primerDiaVacaciones`; al crear, no al aprobar las que ya estaban). Comunicado fijado en Noticias. Tests en `tests/rrhh.test.mjs`. **19/oct (María pidió 2 h y le contó el día):** la cita médica
  va **por horas** ("¿Cuánto tiempo?": 1, 2, 3, 4, 6 h, día completo o más de un día; `redondearDias` = 1/8 de día para cita y
  enfermedad, medio día para lo demás; `duracionTexto` → "2 h"; **24/oct (Jessica, 2 h de permiso que se cobraron como día de vacaciones):** el permiso y la ausencia personal también van por horas, `POR_HORAS`); en el Calendario sale con sus horas y **no cuenta como fuera**
  (`cuentaFuera`; las vacaciones de medio día sí siguen contando para la regla de estrategas). Aviso de 12 meses:
  banner en Hoy/ficha + cron `?tarea=aniversarios` (diario 9 AM PR, a la persona y a RR.HH./Carilin).
- **Nómina estimada** del mes siguiente: salario + ajustes (`desempeno_ajustes`) − días sin paga.
- **Solicitudes** (`/ritmo/solicitudes`, `desempeno_solicitudes`, `lib/desempeno/solicitudes.ts`): día libre,
  vacaciones, permiso programado, carta/documento u otra petición → su **supervisor** (lider_id) aprueba (o
  Elvin) → **RR.HH.** firma (la maestra). RR.HH. NO se salta al supervisor (`puedeDecidir`). Al firmar un día
  libre/vacaciones/permiso con días se registra la ausencia sola. Numerito de pendientes en el menú; avisos
  por Slack (bot) solo con `DESEMPENO_AVISOS=real`.
- **Empresa** (`desempeno_perfiles.empresa`: `level_up` | `ai_borinquen`): misma plataforma, separado. La
  pone RR.HH. (Ajustes o alta); al empleado NUNCA se le pregunta ni ve la etiqueta. Filtro en Equipo y
  Personas; etiqueta coral "AI BORINQUEN" en la vista maestra.
- **Alta de empleado nuevo** (al firmar contrato; `lib/desempeno/alta.ts`): Personas → "Nuevo empleado"
  (nombre, correo, empresa, puesto, supervisor, ingreso, salario) → link de bienvenida (72 h). La persona
  crea su clave y llena su ficha en `/ritmo/bienvenida` (foto, teléfonos, ciudad/país, documento, contacto
  de emergencia, identificación obligatoria, contrato firmado). Mientras no la complete
  (`fichaPendiente`: sin `completada_at` ni teléfono), el layout la trae ahí.
- **Comunicación ENCENDIDA (26/sep, `DESEMPENO_AVISOS=real`)**, siempre desde el bot Command Center
  (`lib/desempeno/avisar.ts`): solicitudes (al supervisor, a RR.HH. y al empleado cuando se decide),
  digest L-V 9:30 AM a `RITMO_AVISO_A` (Carilin + Yaileen) con lo de ayer + solicitudes por firmar + fichas
  sin completar, recordatorio L-V 6:45 PM a quien sigue con la entrada abierta, aniversario de 12 meses
  y resumen semanal a Elvin. El bot no busca por correo: cada perfil tiene `slack_id` (se busca solo por
  nombre al guardar/alta; "sin Slack" en Ajustes = ponerlo a mano).
- **Ritmo reemplaza al agente de RR.HH. de n8n** ("SofIA" + "Procesar Vacaciones", APAGADOS el 26/sep
  con OK de Elvin: leían Monday y avisaban a Luis). `node scripts/n8n.mjs desactivar|activar <id>`.
- **Seguridad (revisión 26/sep)**:
  - **`solo_ritmo`** (`desempeno_perfiles`): quien entra por Ritmo (alta, o perfil creado a alguien sin clave)
    NO usa Pulse. `requiereUsuario()` de Pulse, `boardsVisibles`/`puedeVerBoard`, Leads (`accesoLeads`) y el
    layout de Pulse lo bloquean; Ritmo usa `requiereCuenta()`. Lo cambian la dirección y RR.HH. en Ajustes
    ("También puede entrar a Pulse"; desde el 28/sep RR.HH. también, y como es sensible espera el OK de Elvin). Yaileen (RR.HH.) = solo Ritmo (perfil inactivo, sin ponche).
  - **Links de acceso** (`lib/desempeno/acceso.ts`): exigen perfil activo en Ritmo; RR.HH. solo para quien
    NO tiene clave (resetear clave = admin/editoras); `estaBloqueado` (Juan David + `RITMO_BLOQUEADOS`) no
    recibe link, alta ni aparece en listas. El alta no reutiliza cuentas que ya tienen clave.
  - **Archivos**: tipos permitidos por categoría y por extensión (`tipoPermitido`; nada de html/svg/js), el
    tipo que se guarda y se sirve sale de la extensión, lo que no es foto/PDF/video se descarga, URL firmada de
    5 min, `nosniff` + CSP sandbox en el servido local.
  - **Cabeceras**: `/ritmo/*` con la misma CSP estricta, `X-Frame-Options: DENY` y Permissions-Policy de Pulse.
  - **Slack**: el texto de empleados va escapado (`esc` en `avisar.ts`/`avisos.ts`) — sin menciones ni links falsos.
- **Segundo paso de la vista maestra** (26/sep, `lib/desempeno/dos-pasos.ts` + `totp.ts` puro, tests `tests/totp.test.mjs`):
  Elvin, Carilin, Aure y RR.HH. entran con un código de Google/Microsoft Authenticator (`/ritmo/verificar`, QR la
  primera vez; secreto cifrado AES-GCM en `desempeno_dos_pasos`, migración 0016). Dispositivo recordado 30 días (cookie
  `ritmo-2fa`, se invalida si cambia la clave/sesiones), 5 fallos = 15 min. Sin el segundo paso no hay vista maestra ni
  se decide nada (`usuarioRitmo().falta2fa`). Teléfono perdido: "Reiniciar" en Ajustes (admin) o
  `node scripts/ritmo-2fa.mjs estado|reset <email>`.
- **Tope de archivos**: foto 10 MB, documentos 25 MB, videos de entrenamiento 50 MB (`limiteBytes` en `fichas.ts`), verificado
  con el tamaño REAL en Storage al confirmar (si se pasa, se borra). El bucket `pulse` está en 50 MB: es el tope del plan
  de Supabase; videos más grandes = plan Pro o comprimirlos.
- **Carreras** (`/ritmo/carreras`, 26/sep; tablas `desempeno_vacantes` y `desempeno_postulaciones`, migración 0018;
  reglas puras en `lib/desempeno/carreras-reglas.ts`, tests `tests/carreras.test.mjs`, datos en `lib/desempeno/carreras.ts`):
  RR.HH./maestra publica vacantes cuando surge una oportunidad (título, empresa —solo la ve la maestra—, departamento,
  modalidad, descripción, requisitos, salario opcional, bono por referido, abierta/pausada/cerrada). Cualquiera del
  equipo **aplica** (crecer o cambiar de puesto; una vez por vacante, solo RR.HH. lo ve) o **refiere** a alguien
  (nombre + correo o teléfono, por qué; sin auto-referirse ni duplicados). RR.HH. mueve cada caso (recibida → en revisión
  → entrevista → seleccionado → onboarding completo | no seleccionado | retirada). **Bono**: referido + onboarding
  completo → US$100 (o el de la vacante) entra solo como ajuste a la nómina del mes siguiente del que refirió, una sola
  vez (`bono_ajuste_id`). Avisos por Slack a RR.HH. (nuevo caso) y a la persona (cada cambio). Pestaña "Carreras" con
  punto verde si hay vacantes de los últimos 7 días (en el teléfono de la maestra se entra desde Hoy).
- **Equipo digital** (`/ritmo/agentes`, 26/sep; tabla `desempeno_agentes_reportes`, migración 0019; puro en
  `lib/desempeno/agentes-ia.ts` + tests `tests/agentes-ia.test.mjs`; datos `lib/desempeno/agentes-reportes.ts`):
  Elvin: "que mis agentes al final del día hagan un reporte… comparar cómo producen los empleados digitales contra
  los humanos". Solo **admin/editoras con 2 pasos** (Elvin, Carilin, Aure; RR.HH. no). Registro `AGENTES_IA`
  (Sofi, Nico, Max, Lola, Iris, Leo) con su puesto humano equivalente. Entra por `POST /api/ritmo/agentes`
  (CRON_SECRET; público en proxy) o `node scripts/agentes.mjs reporte --resumen … --tareas N --entregables "a|b"
  --bloqueos …`. El **puente** (`telegram-puente.mjs`: `sumarJornada` + `cierreLoop`) mide solo corridas,
  minutos y costo real de IA (delta por sesión) y a las 6:30 PM PR (`CIERRE_HORA`) le pide al agente su cierre y
  manda las métricas; día sin actividad = "Sin actividad hoy". Leo suma 1 tarea por pieza revisada
  (`/api/slack-eventos`); Iris hace su cierre en su ronda (`.claude/commands/iris.md` §6). Comparación 7 días por día
  activo: humanos = horas del ponche, tareas del tablero Producción, costo = salario ÷ 21.7; "—" si falta el dato.
  **Oficina virtual** (28/sep, Elvin: "una oficina: cada uno su cubículo, su computadora… un área con TV, una sala de ping
  pong"): arriba de `/ritmo/agentes`, a lo ancho (`components/ritmo/oficina.tsx`): open space con un cubículo por agente (la
  pantalla = 1.ª idea de su reporte, `pantalla()`; burbuja con lo último que dijo en el buzón, `ultimosMensajes` + `burbuja()`),
  sala con TV (tareas, minutos y costo de hoy) y sofá, y ping pong; `estadoOficina()`: trabajó hace < 15 min = en su computadora,
  trabajó hoy = en su escritorio, nada hoy = descansando (los 2 primeros al ping pong, el resto al sofá). Tocar = panel con el
  reporte completo. Se refresca cada minuto. **Ala ejecutiva** (Elvin: "Carilin y Aure le piden a los agentes, yo apruebo"): oficina
  del **CEO** (la más grande, aura dorada, pizarra con lo que espera su OK, monitor grande, sofá), la de **Aure** pequeña al lado y
  la de **Carilin** (Directora de Operaciones) lejos, junto a la sala; cada quien aparece (silueta) solo mientras mira la página
  (`desempeno_presencia`, migración 0035, < 2 min), si no la silla queda vacía. Debajo, "Hoy, uno por uno" y la tabla de 7 días
  van compactas (Elvin: "más pequeño, más friendly").
  **Ping pong con marcador** (a 11, "va ganando X") y **Rincón del café**: "☕ Invitar a un café" abre un chat con el agente
  (mensaje a su buzón `agentes_mensajes` con la marca `MARCA_CAFE`; su respuesta sale en la conversación al refrescar). Misma
  regla que el buzón: Elvin habla con Sofi, Nico, Max o Lola; Carilin y Aure solo con Nico (va por su flujo con el OK de Elvin).
  **Sofi y Leo medidos en Vercel** (28/sep): `sumarUsoIA` suma corrida, tiempo y costo real (`costoDeUso` × `PRECIOS_MTOK`) de
  cada respuesta de Sofi (Slack, Telegram, /pedir) y cada revisión de Leo. **La Mac ya no firma como Sofi** (28/sep):
  `agentes.mjs` sin `PUENTE_BOT`/`AGENTE` = "mac" ("Claude (Mac)"); en Railway el servicio de Sofi (sin PUENTE_BOT) sigue
  siendo Sofi por `RAILWAY_SERVICE_NAME`; una rutina de Sofi en la Mac pone `AGENTE=sofi`.
  **Trabajo de un agente hecho desde la Mac** (una sesión de Claude trabajando como Max, Lola, Remi…; Elvin 28/sep: "que Remi,
  Lola y cualquier agente reporte lo de la Mac"): no pasa por su bot → `node scripts/reportar-mac.mjs <agente> "qué hiciste"
  --tareas N --entregables "a|b"` al terminar (se AÑADE al reporte del día; dentro de un bot, `PUENTE_BOT`, no hace nada para no
  duplicar el cierre). Remi lo hace solo al entregar (`motion/scripts/entregar.mjs`, `remi.mjs --entregar|--proponer`); los
  comandos de Lola (`/crear-contenido`, `/atender-pedidos`) y Max (`/meta-ads`) lo piden al final. Remi está en `AGENTES_IA`
  (se compara con Editor de video).
- **Noticias** (`/ritmo/noticias` + las últimas 3 en Hoy, 26/sep; tabla `desempeno_noticias`, migración 0020;
  `lib/desempeno/noticias.ts`, categorías en `noticias-tipos.ts`): logros del equipo (con persona → le avisa por Slack),
  noticias, comunicados (se pueden fijar arriba) y causas benéficas. Publica/fija/borra la vista maestra; lo ve todo el
  equipo. Breve a propósito (sin comentarios ni reacciones). **Por empresa (17/oct)**: cada noticia es para "todas", `level_up` o `ai_borinquen`
  (`desempeno_noticias.empresa`, migración 0044_noticias-empresa; `noticiaVisible` en `noticias-tipos.ts`, tests `tests/noticias.test.mjs`):
  cada empleado ve las de todos + las de su empresa (o `tambien_en`), la maestra todas con su etiqueta; un logro de alguien puesto "para
  todos" queda para la empresa de esa persona. **Dueña: Yaileen** (comunicados, causas benéficas); Carilin le pasa ≥ 1 logro a la semana. En Hoy la maestra tiene accesos directos (Equipo, Personas,
  Agentes, Carreras, Noticias, Solicitudes): en el celular no caben todas las pestañas.
- **Bienestar** (`/ritmo/bienestar` + tarjeta en Hoy, 26/sep; tabla `desempeno_bienestar`, migración 0021; puro en
  `lib/desempeno/bienestar-reglas.ts` + tests `tests/bienestar.test.mjs`): la parte wellness (~15 %), voluntaria, privada y
  **fuera del score**. Pausa activa de ~5 min guiada (7 rutinas de escritorio, una por día, temporizador; al terminar se
  marca sola), anotar ejercicio (meta OMS 150 min/semana; pausas cuentan; tope 600 min/día), energía del día (1-5) y reto
  del equipo (solo agregados; la energía la ve la maestra solo con ≥ 5 respuestas). **Comunidad** (migración 0022, tablas
  `desempeno_bienestar_social|posts|reacciones`): opcional — solo quien se une aparece y solo quien se une la ve (la
  maestra también, para moderar): tablero de la semana (minutos, activo hoy), actividad del grupo, mensajes ≤ 280 con
  reacciones 💪🔥👏 (una por persona). La energía nunca sale ahí. Salir = desaparece de inmediato. **Red social (27/sep, Elvin: "que sea como una red social… escribirle a los
  compañeros, interactuar los logros, comentarle")**: la Comunidad va PRIMERO en Bienestar; publicar al grupo o "Para"
  un compañero (saludo → DM del bot con el mensaje), **comentarios** (`desempeno_bienestar_comentarios`, ≤ 200, aviso al
  autor), reacciones 💪🔥👏❤️ y **logros automáticos** (`tipo: logro`, `clave` única por semana: meta de 150 min y 5 días
  de pausa seguidos, `logrosDeLaSemana` + `revisarLogros` tras anotar) que el equipo aplaude y comenta. Migración 0026.
  Chatbot: Elvin lo planteó el 26/sep;
  se dejó para después de ver 2-3 semanas de preguntas reales a RR.HH.
- **Viajes** (`/ritmo/viajes`, 27/sep; tablas `desempeno_viajes_plan` y `desempeno_viaje_anual`, migración 0025; puro en
  `lib/desempeno/viajes-reglas.ts` + tests `tests/viajes.test.mjs`; datos `lib/desempeno/viajes.ts`): **OCULTO al equipo —
  solo Elvin (admin con 2 pasos) lo ve** hasta que él decida abrirlo (página, acceso en Hoy y acciones). Planificar
  vacaciones (local · dentro del país · internacional, destino/fechas/presupuesto, cuenta regresiva) y "Pedir estas
  vacaciones" → solicitud normal. **Viaje del año por mérito** (pasajes + hospedaje hasta un tope): califica quien tiene
  ≥ 6 meses, ≥ 20 días marcados e índice ≥ 90 (40 % asistencia + 60 % desempeño; sin score, solo asistencia); la
  dirección escoge al ganador entre los que califican (validado en el servidor) → Noticia fijada + aviso. Para abrirlo al
  equipo: volver a poner la tarjeta en Hoy, la pestaña en `nav.tsx` y cambiar los gates `rol === "admin"`.
- **Ponche de la dirección** (27/sep): Elvin, Carilin y Aure (admin/editoras) ven en Hoy el mismo ponche que todos, con la
  nota "no tienes que marcar"; es opcional (`estadoPonche(id, opcional)` + `entrarAction` sin perfil). Sin perfil sus
  ponches no salen en Equipo, recordatorios ni reportes (todo eso sale de `desempeno_perfiles`).
- **Empresa** (`/ritmo/empresa`, 27/sep, Elvin: "van a entrar… una plataforma completamente vacía"): Quiénes somos · El
  equipo (directorio en vivo de los perfiles activos, cada empleado ve solo su empresa, iniciales sin foto) · Recursos ·
  Políticas · Preguntas. Tabla `desempeno_empresa` (migración 0027; `empresa` todas|level_up|ai_borinquen, `publicado`),
  editable por la dirección (Elvin, Carilin, Aure; lápiz / "Agregar", formato sencillo sin HTML: viñetas, **negrita**, [link](url)).
  **28/sep (Elvin):** la madre es **EA Market LLC**; cada empleado ve SOLO su empresa (el texto de LU no nombra a AIB ni al revés;
  test en `tests/empresa.test.mjs`) y solo admin/editoras ven las dos (RR.HH. no). LU nace en 2024 (Elvin en marketing y ventas
  desde 2021) y su visión es **AI first** (marketing digital 100 % con IA → empresa de tecnología); AIB nace en 2026 porque los
  dueños no contestaban sus mensajes y hoy digitaliza los negocios de PR con agentes personalizados.
  Semillas solo con datos confirmados (`SEMILLAS_EMPRESA` en `lib/desempeno/empresa-reglas.ts`, tests
  `tests/empresa.test.mjs` verifican que las políticas cuadren con `POLITICA`/`BONO_REFERIDO`); **Misión y Valores de LU
  son BORRADOR** hasta que Elvin los apruebe. Pestaña en escritorio + tarjeta "Conoce la empresa" en Hoy.
- **Seguridad del ponche** (27/sep, Elvin: "que no puedan evadir o engañar el sistema"): solo se poncha (entrada, salida,
  almuerzo) desde una **computadora registrada y aprobada** (`desempeno_dispositivos`, migración 0028; cookie httpOnly
  `ritmo-equipo` de 400 días con token → sha256 en la base; huella del navegador + red para reconocerla si borran cookies) y
  desde una **red aprobada** (IPv4 exacta, IPv6 por prefijo /64: `redDe`). La primera computadora queda aprobada al
  registrarla con su red; una segunda (laptop + desktop), un reemplazo o una red nueva → **RR.HH. (Yaileen) autoriza** en
  `/ritmo/seguridad` (aviso por Slack). Teléfonos/tablets no se registran ni ponchan. **Desde el 29/sep tampoco la app instalada ni el iPad** (Safari se presenta como Mac): `pistaEquipo()` en el navegador + `noEsComputadora()` en el servidor, para TODOS (también la dirección y aunque el modo sea "aviso"); en el teléfono/app, Hoy muestra `FueraDeComputadora` (con ponche manual) en vez del círculo. Fuera de su computadora: **ponche
  manual** (`desempeno_ponche_manual`, hasta 3 días atrás, con motivo) que RR.HH. autoriza (crea la entrada o cierra la
  abierta; `manual_por`). La dirección (admin/editoras) queda fuera. `RITMO_SEGURIDAD` = on (default) | aviso | off.
  Reglas puras `lib/desempeno/seguridad-reglas.ts` (tests `tests/seguridad-ponche.test.mjs`), servidor `seguridad.ts`,
  UI `components/ritmo/seguridad.tsx`. Solo bloquea el PONCHE: el resto de Ritmo se abre desde cualquier lado.
- **Almuerzo** (27/sep): 1 hora que escoge cada quien entre las **11:00 AM y las 2:00 PM PR**; "Salir a almorzar" cierra el
  tramo con `motivo_salida = almuerzo` y volver = entrar (el tiempo de almuerzo no cuenta como horas). Una vez al día;
  más de 65 min se pinta en ámbar (`duracionAlmuerzo`).
- **Arena · ventas** (`/ritmo/arena`, 27/sep; diseño `vault/proyectos/ritmo/arena-ventas.md`; puro en `lib/ventas/reglas.ts` +
  tests `tests/ventas.test.mjs`; datos `lib/ventas/datos.ts`; acciones `app/ritmo/arena-actions.ts`; migración 0030, tablas
  `desempeno_ventas_diario|goals|bonos|alias`): closers, setters y chatters de LU y AIB (puestos `closer|setter|chatter|
  director_ventas` en `PUESTOS`, `sinPonche`: no ponchan, no salen en Equipo; su Hoy = **Mi marcador**). Ventas = la pestaña del
  mes de la hoja de tesorería por el mismo Apps Script del resumen del día (`VENTAS_SCRIPT_URL`; sin él la Arena dice "no está
  conectada"), columnas buscadas por nombre (fecha, tipo, monto cobrado, método/pasarela, closer, setter, chatter, valor neto),
  caché 5 min. **Comisiones de Nahuel** (mes completo, sobre cobrado − pasarela: Stripe/PayPal/ATH 3.5 %, Klarna y FanBasis 4.5 %): closer
  7 %, con show-up ≥ 60 % → 8/9/10 % con cierre ≥ 25/30/35 % (show-up y citas del diario del closer; cierres = ventas nuevas de la
  hoja); setter 4 % de lo que agendó; chatter 4 %, 5 % con > 200 agendas propias (de Leads `agendo_por`, si no del diario).
  Carrera por rol (cash collected, sin comisiones), metas del equipo (`METAS`: LU $150K total / $100K nuevas / $35K semana; AIB
  $30K), alerta roja/ámbar del día, meta personal, diario (hoy o ayer). Comisión privada: cada quien la suya; el director de
  ventas y la dirección (Leads: AIB solo Elvin/Aure) ven la tabla de todos. **Bonos**: el director los crea → SOLO Elvin autoriza
  → el director marca ganador → Elvin aprueba el pago (ajuste de nómina si tiene ficha). Nombres de la hoja ≈ Pulse por
  `mismaPersona` (primer nombre + resto en orden); si no cuadra, fila en `desempeno_ventas_alias`. **28/sep (Nahuel):** la 2.ª
  cuota comisiona (para quien sale en su fila); el **show-up de los closers sale del CRM** (Leads → CLOSERS: etapa del lead tras
  cada cita; "Llamada agendada" ya pasada = sin marcar, se le recuerda; sin citas marcadas → diario; `resultadoCita` +
  `citasDelMes`); **Laura vende en las dos marcas** (`desempeno_perfiles.tambien_en`, migración 0031, "También vende en" en
  Ajustes); Joaquín es **setter** (Elvin, 28/sep; antes estaba como closer). Pendiente: la planilla de Excel de Nahuel para las agendas de los chatters.
  **KPIs del diario por puesto (Elvin, 28/sep; `KPIS_VENTAS`, `desempeno_ventas_diario.kpis`, migración 0037)**: setter =
  llamadas realizadas · conectadas · agendadas · show · no show; chatter (Ana Cecilio, Dilan) = conversaciones (personas que
  hablaron contigo) · pases (le sacaste el número y lo pasaste a llamada) · citas agendadas · show · no show; closer (Laura,
  Roger; Paola por dar de alta) = demos · cerradas · no cerradas + cash collected de la hoja. Cada quien los anota en
  Mi diario (con "Este mes"); el director y la dirección ven "KPIs del equipo · este mes" por puesto. Los campos viejos
  (conversaciones/agendas/presentaron) se llenan desde estos (`camposViejos`) para la comisión y el show-up de respaldo.
  **Planilla de chatters en Ritmo (6/oct, Elvin: "me gustaría que tenga todo esto Ritmo")**: el diario del chatter trae TODO lo de
  `planilla_chatters_levelup.xlsx` (Drive): conversaciones, calificaron, no califica, seguimiento, mitad de conversación, propuesta
  de agenda, link enviado, derivados (= `pases`), agendas, show, no show y **ventas/collections atribuidas (US$, `dinero`)**; los %
  (calificado, agenda, mitad, propuesta, link; conexión del setter; close rate) salen solos (`TASAS_VENTAS`/`tasasVentas`). Se cargó
  su historial (Ana 9/4–10/5, Dilan 9/21–10/3; cuadra con el Resumen: Ana 645 conv · $50,496 · $37,896) sin pisar lo ya anotado en
  Ritmo. **Rangos** en Mi diario, KPIs del equipo y Ranking: Hoy · Ayer · 7 días · 30 días · Este mes · Mes pasado (`?r=`,
  `rangoFechas`); comisiones y carrera siguen siendo del mes. La planilla de setters ("Producción Setters") no se ha pasado.
  **Pase entre dominios** (`/api/pase?a=ritmo|leads|pulse` → `/api/pase/recibir`, `lib/pulse/pase.ts`, tests `tests/pase.test.mjs`):
  Leads, Ritmo y Pulse son dominios distintos y la cookie no viaja; Roger y el equipo caían en el CRM al ir a Ritmo (el proxy de
  `leads.*` mandaba todo /ritmo a Leads). Ahora "Ir a Ritmo" (Pulse) y "Leads/Pulse" (Ritmo) firman un pase de 60 s y un solo uso
  (nonce en `pulse_security_log`) y la persona llega con su sesión; en `leads.*`, /ritmo → el pase. Solo con sesión real de Pulse.
  **Arena rediseñada (6/oct, Elvin: "muy simple, no se ve pro… más visual, animada, interactiva")**: piezas vivas en
  `components/ritmo/arena-vivo.tsx` (números que cuentan, anillos, avatares por nombre, mini-gráficas, barras con meta, podio,
  confeti; todo respeta prefers-reduced-motion; CSS `.arena-*` en globals.css): marcador del equipo con el selector de rango
  global arriba · Mi marcador (anillo de la meta personal + escalera de comisión) y Mi diario (−/+, % en vivo, confeti) primero
  para el vendedor · Pulso del diario por puesto (`pulso` en `armarArena`, suma por día) · Carrera con podio y pestañas ·
  Ranking con barras vs `METAS_DIARIAS` · KPIs del equipo como mapa de calor. Avisado el equipo por DM (Laura = Slack Connect:
  borrador para que Elvin lo mande).
  **Cierres por industria y género (14/oct, Elvin: "para saber qué closer es el mejor, con qué industria y si es hombre o mujer")**:
  en Mi diario, por cada "cerrada", el closer marca la industria (`INDUSTRIAS_CIERRE`, 14 grupos sacados de Pulse) y hombre/mujer
  (obligatorio si hay cierres; `limpiarCierres`); se guarda en `desempeno_ventas_diario.cierres` (migración 0044). El director y la
  dirección ven la tabla "Cierres por industria y género" por closer en el rango (`resumenCierres`, tests en `tests/ventas.test.mjs`).
  Solo cierres, no demos por industria: el close rate por industria pediría marcar también las demos.
  **Tesorera (María García, 14/oct, Elvin: "debe subir las ventas del día en Ritmo")**: al marcar salida reporta en US$ ventas nuevas,
  cobros de cuotas, mensualidades/recurrentes, renovaciones/upsells y reembolsos, con el detalle de quién (`KPIS_REPORTADOS.tesoreria`;
  el formulario de salida ya acepta montos con centavos, antes recortaba a 50). Mientras la hoja de ventas no esté conectada, el resumen
  de las 8:30 PM toma de ahí las ventas de la marca de la tesorera (`ventasDesdeTesoreria`, `ventasDeReporte`); si no ha reportado, lo dice.
  **Registro de ventas de la tesorera en la Arena (19/oct, Elvin: "María García sube ahí las ventas… del closer que sea")**: María
  (puesto `tesoreria`) entra a la Arena SOLO de su empresa (`accesoArena` → `tesoreria`/`registra`; sin comisiones, diario, bonos ni
  pulso) y registra cada cobro: tipo (nueva venta · referido · recurrente · pago de balance), cliente, quién vendió y quién agendó
  (opcional), fuente/UTM, enlace del anuncio (nueva venta), de quién vino (referido), cash collected (0 vale) y total del acuerdo,
  método de pago. Tabla `desempeno_ventas_registro` (SQL directo, `lib/ventas/registro.ts`; puro en `registro-reglas.ts`, tests
  `tests/registro-ventas.test.mjs`); hasta 45 días atrás. **Con ventas registradas en el mes, la Arena cuenta con ellas en vez de la
  hoja** (`aTransacciones`: nueva/referido = venta nueva; neto − pasarela; quien agendó = chatter si lo es, si no setter). La dirección
  también registra; el director lo ve. El resumen de las 8:30 PM todavía no lee este registro.
    **Ranking de ventas** (30/sep, Elvin; sección `#ranking` de la Arena, solo director/dirección: Nahuel, Aure, Elvin): promedio por
  día con diario vs. `METAS_DIARIAS` — setter 125 llamadas (rojo < 100), 30 conectadas, 3–5 agendas; chatter 20–30 conversaciones
  (mín. 15), 5–10 pases, 3–5 agendas — y close rate de closers (`CLOSE_RATE`: < 20 % rojo, 20–30 amarillo, 30 súper, 40 élite =
  candidato a bono), con nivel y recomendaciones (`rankingVentas` en `lib/ventas/reglas.ts`, tests en `tests/ventas.test.mjs`).
  **Metas del director (30/sep, Elvin)**: Nahuel (LU) tiene escalones de **$50K / $75K / $100K en ventas NUEVAS cobradas en el mes**
  (solo New Sale; nada de renovaciones, upsells, mensualidades ni lo que cobra tesorería). Es referencia, no tarea: una línea
  pequeña al pie de "Meta del equipo" en la Arena (`ESCALONES_DIRECTOR` + `escalones` en `lib/ventas/reglas.ts`) con cuánto falta
  para la siguiente; sin la hoja conectada solo muestra las metas.
- **Calendario de ausencias** (`/ritmo/calendario`, 28/sep; puro en `lib/desempeno/calendario-reglas.ts` + tests
  `tests/calendario.test.mjs`, datos `lib/desempeno/calendario.ts`): mes en cuadrícula + lista de quién está fuera (ausencias
  aprobadas + solicitudes en curso con borde punteado). Elvin: "los estrategas no se pueden ir dos a la vez" → `TOPE_FUERA`
  (`estratega: 1`, por empresa): si ya hay uno APROBADO en esas fechas, no se puede pedir (el formulario lo avisa en vivo con
  `revisarFechasAction`) ni aprobar; si solo hay otro pedido en curso, se avisa. Días con choque en rojo. El motivo (vacaciones,
  enfermedad…) solo lo ve la vista maestra; el resto ve "Fuera"/"Pedido" de su empresa. Link en Solicitudes y en Hoy (maestra).
- **Cambios con aprobación de Elvin** (28/sep, Elvin: "editar manual con aprobación mía"; `lib/desempeno/cambios-reglas.ts` puro +
  tests `tests/cambios.test.mjs`, `cambios.ts`, tabla `desempeno_cambios`, migración 0032): cuando Carilin, Aure o RR.HH. guardan en
  Ajustes o en la ficha, lo **sensible** (puesto, empresa, también-vende-en, supervisor, activo, acceso a Pulse, contrato, salario)
  queda **pendiente** y a Elvin le llega `notificarCEO`; lo menor (horario, días, teléfono, notas) se aplica ya. Perfil nuevo = todo
  espera. Elvin aprueba/rechaza en Ajustes → **Por aprobar** (se aplica sobre cómo está HOY la persona) y quien lo pidió recibe
  el aviso por Slack. Elvin (admin) aplica directo. El alta de empleado nuevo sigue directa. Puesto nuevo **Tesorera**
  (`tesoreria`, Finanzas: María García); Ajustes ya no arranca en "estratega" (así quedó mal María).
- **Cambios menores sin Nico** (29/sep, Elvin: "que Yaileen pueda hacer cambios menores manualmente"): en Ajustes, la
  vista maestra **crea puestos** (pestaña Puestos → `crearPuestoAction`; tabla `desempeno_puestos_extra` creada en runtime
  por `lib/desempeno/puestos-extra.ts`, id `p_<slug>`, nacen sin KPIs; `usuarioRitmo()` los registra en `PUESTOS` con
  `registrarPuestosExtra`) y **corrige el nombre** de una persona directo (`datos.cambiarNombre`, evento "nombre"). Asignar
  el puesto sigue siendo sensible (espera a Elvin).
- **Alerta de las 10 AM y KPIs obligatorios** (29/sep, Elvin): cron `/api/cron/ritmo?tarea=sin-ponche` (L-V 10 AM PR, `0 14 * * 1-5`)
  → a RR.HH. (`avisarRrhh`, Yaileen) la lista de quien no ha marcado entrada (le tocaba, sin ausencia aprobada) para que les
  pregunte directo si están trabajando o necesitan ayuda para entrar. Y **no se marca la salida sin los KPIs del día**
  (`faltanEnSalida`, puro + test): cada KPI manual del puesto necesita un número (0 vale) y el detalle si es > 0; lo
  reportado en una salida anterior de hoy cuenta. El almuerzo no pide nada.
- **Claves sin depender de Elvin y ponche sin la red** (30/sep, Elvin: "Yaileen puede hacer ajustes… la app se está haciendo
  dependiente de mí"): **Cambiar mi clave** (`/ritmo/clave`, llave del encabezado, `cambiarMiClaveAction`: clave actual + nueva,
  cierra las otras sesiones) para todos; y en Ajustes, si la persona ya tiene clave, **"Olvidó su clave: link para una nueva"**
  (`linkAccesoAction(userId, true)`) — RR.HH. también, solo para miembros (nunca admins/editoras); el link limpia los intentos
  fallidos. **La red ya no bloquea el ponche** (`decisionPonche` → `redNueva`, evento `ponche-otra-red`): el 29-30/sep casi todos
  pidieron ponche manual porque la IP de la casa cambia (VPN, hotspot, apagón, el proveedor la rota); lo que manda es la
  computadora registrada y aprobada (teléfono, tablet y app siguen fuera). Pero (Elvin: "tienen CRM y datos; no se pueden
  conectar de cualquier wifi"): cada quien declara su **Wi-Fi principal** en Hoy (`desempeno_perfiles.wifi_principal`,
  migración 0040, `guardarWifiAction`), una red nueva **avisa a RR.HH.** (`avisarRedNueva` con `after()`: una vez por red y
  máx. 1 por persona al día; se aprueba en Seguridad y no vuelve a avisar) y la persona ve el recordatorio de proteger los
  datos (`AvisoRedNueva` + toast `TEXTO_RED_NUEVA`).
- **Ranking y reportes** (30/sep, Elvin: "por la mañana ver lo de ayer… y mensual un ranking hasta el 100 con lo bueno, lo malo y
  qué mejorar"): `/ritmo/ranking` (vista maestra; en "Más" y en Hoy) con **Ayer** (último día laborable: entrada · almuerzo · salida,
  TODOS los KPIs con su detalle y bloqueos, por departamento, sin hacer clic) y **Mes** (índice 0-100 = 30 % asistencia · 20 %
  constancia de KPIs · 50 % producción vs. el mejor de su mismo puesto; sin KPIs = solo asistencia; bueno/malo/mejorar). Puro en
  `lib/desempeno/ranking.ts` (tests `tests/ranking.test.mjs`), adaptador `ranking-datos.ts`. **Racha baja** = 3+ días laborables
  seguidos sin marcar, > 30 min tarde o sin KPIs → alerta en Ranking, en el "Reporte de hoy" de Equipo y en el reporte diario
  (`?tarea=reporte`, L-V 7:30 PM PR a RR.HH.; `lib/desempeno/reporte-dia.ts`). Mensual: `?tarea=ranking-mes` (día 1, 9 AM PR) →
  RR.HH. + Carilin. Equipo: gráfica de KPIs por persona (`components/ritmo/grafica-persona.tsx`) y **sin horas trabajadas** (solo
  entrada, almuerzo y salida; `DiaPersona.almuerzo`).
- **Alertas de rendimiento** (30/sep, Elvin: "no catalogues baja producción un día malo; busca rachas"): día malo = sin marcar,
  > 30 min tarde, sin KPIs/en 0, o **baja producción** (< 50 % de la mediana de SUS días con producción; necesita 5 días de historia).
  🟡 = 2+ días malos seguidos · 🔴 = 4+ días malos en el mes (`alertaRendimiento` en `lib/desempeno/ranking.ts`, tests). Salen en
  Ranking → Ayer y en el reporte de las 7:30 PM a RR.HH. (Yaileen, todas); a **Carilin** le llega un DM solo el día que nace la
  alerta: amarillas y rojas de Project Managers (Jessica, Ángela) y estrategas, rojas de cualquiera (`vaACarilin`).
- **Ficha completa de todos** (28/sep, Elvin: "todo el mundo debe tener todos los datos llenos, incluyendo fotos"):
  `faltantesFicha` (puro, `lib/desempeno/ficha-completa.ts` + tests) = foto, teléfono, ciudad y país, documento, contacto de
  emergencia, identificación y contrato. Aviso ámbar en Hoy con lo que falta → `/ritmo/bienvenida`, que ya no es solo para
  nuevos: sirve para "completa lo que falta" (pre-llenado con lo que había); ahora exige foto y contacto de emergencia. Se le
  creó ficha vacía a todo perfil activo que no tenía (12 personas, 28/sep) → al entrar, Ritmo los lleva a completarla.
- **Mi día · Google Calendar** (28/sep, Elvin: "que conecten el calendario de su correo corporativo… y lo anoten ahí mismo";
  puro en `lib/desempeno/google-cal-reglas.ts` + tests `tests/google-cal.test.mjs`, servidor `lib/desempeno/google-cal.ts`, tabla
  `desempeno_google`, migración 0034): cada persona toca "Conectar" en Hoy (`/ritmo/google/conectar` → Google → `/ritmo/google/volver`,
  state firmado + misma sesión), ve lo de hoy de su calendario principal (sin cancelados ni rechazados, con link de Meet) y **Anota**
  eventos o recordatorios de todo el día en SU calendario (`anotarCalendarioAction`). Solo se guarda el refresh token cifrado; se
  desconecta cuando quiera (revoca). **Necesita la app de Google** (`GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` en Vercel; Calendar
  API activada; redirect `https://ritmo.levelupmediapr.net/ritmo/google/volver`); sin ellas la tarjeta no sale.
- **App en el teléfono + push, sin App Store** (29/sep, Elvin: "apps sin App Store ni Play Store con push"): PWA + Web Push
  (VAPID, sin Firebase). Manifest `app/ritmo/manifest.webmanifest/route.ts` (íconos PNG de `app/ritmo/iconos/[archivo]` —
  192/512/maskable/badge, estáticos en el build— + `app/ritmo/apple-icon.tsx`, todo desde `iconos/dibujo.tsx`), service worker
  `public/ritmo/sw.js` (scope `/ritmo`, público en proxy, `Service-Worker-Allowed` en next.config; NO cachea páginas: datos
  sensibles), suscripciones en `desempeno_push` (migración 0038, columna `app` para reusar en la app de clientes de LU),
  envío en `lib/push/enviar.ts` (borra 404/410) y **todo aviso de `avisarPersona`/`avisarCorreo`/`avisarRrhh` sale además
  como push** (texto de Slack → título/cuerpo/ruta con `lib/push/texto.ts`, puro, tests `tests/push.test.mjs`). Pantalla
  **`/ritmo/app`** (ícono 📱 del encabezado): guía por plataforma (iPhone: Safari → Compartir → Agregar a inicio, iOS 16.4+;
  dentro de WhatsApp/IG → "ábrelo en Safari/Chrome"; Android: botón Instalar), Activar / Enviar prueba / Desactivar, y sus
  teléfonos; tarjeta en Hoy solo en el celular mientras falte algo (se esconde 7 días). Ruta `POST /ritmo/push`
  (suscribir|quitar|probar; también la usa el SW en `pushsubscriptionchange`). En Equipo, 📱 junto a quien ya la tiene.
  Env: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (si cambian, todos reactivan). Bori móvil
  (`~/bori-demo`) se instala pero aún NO tiene push: copiar este patrón.
- **Canal ético** (`/ritmo/etica`, `desempeno_etica`): cualquiera reporta, anónimo por defecto; la bandeja
  y el aviso por Telegram (sin el contenido) son SOLO para Elvin (admin).
