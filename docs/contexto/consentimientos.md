## Consentimientos y casillas legales (24/oct/2026)

Elvin: "No quiero que mi sitio web sea demandado" → skill `legal-sitio-web` (puntos 4 y 5). Auditoría de la fase 1 en
las notas de la sesión (`legal-formularios-fase1.md`). Las **páginas** `/terminos`, `/privacidad`, `/privacidad/equipo`,
`/cookies`, `/reembolsos` y `/accesibilidad` viven en `app/(legal)/`; su versión, fecha, ruta y el texto de las casillas
salen de UNA fuente, `lib/legal/versiones.ts` (`RUTAS_LEGALES`, `VERSION_DOCUMENTOS` y la versión de cada casilla se
derivan de ahí). Al cambiar el texto de una página, sube su versión allí.
- **Un solo registro** (unión del 24/oct/2026): `lib/legal/consentimiento.ts` (`registrarConsentimiento`/`aceptoVersion`,
  usados por Ritmo, la app de clientes LU, el Portal AutoFlow y los avisos push) escribe y lee `legal_consentimientos`.
  Mapeo: `terminos_app`→`terminos`, `privacidad_app`→`privacidad`, `privacidad_empleado`→`privacidad_equipo`,
  `avisos_push`→`avisos_push`, `grabacion_llamada_ia`→`grabacion_ia` (aviso de grabación, distinto de `llamadas_ia`,
  que es el permiso TCPA). Ahí `persona` es el correo o `cliente:<itemId>` / `portal:<slug>:<quien>`, sin `referencia`.

- **Reglas puras** `lib/consentimientos/reglas.ts` (tests `tests/consentimientos.test.mjs`): tipos (`terminos`,
  `privacidad` obligatorias; `marketing_sms`, `marketing_email`, `llamadas_ia` opcionales; `cookies`), el texto exacto de
  cada casilla (`casillaDe`, con el nombre de la marca), `VERSION_DOCUMENTOS` y `ENTIDAD_LEGAL` (de `lib/legal/versiones.ts`),
  normalización de la persona (e-mail → teléfono E.164 → `ref:<referencia>`) y `filasAceptacion`. El servidor guarda
  SU texto de la casilla, nunca el que mande el navegador (`aceptadasValidas` solo acepta tipos ofrecidos).
- **Tabla** `legal_consentimientos` (`lib/consentimientos/schema.ts`, migración `drizzle/0045_consentimientos.sql`,
  `legal_*` en `tablesFilter`): SOLO DE AGREGAR. Triggers: UPDATE/DELETE/TRUNCATE dan error (revocar = fila nueva
  `accion = 'revoco'`) y `created_at` lo pone siempre la base. Índice único (referencia, tipo, acción, versión): el
  guardado a medias y el envío final del mismo token no duplican. Guardar mínimo 5 años (TCPA).
- **Servidor** `lib/consentimientos/repo.ts`: `registrarConsentimientos({ casillas, aceptadas, email, telefono, origen,
  referencia, headers })` (IP y navegador de los headers), `revocarConsentimiento`, `consentimientosDe`,
  `tieneConsentimiento(contacto, tipo)` → **consultarlo antes de mandar marketing automático** (SMS/WhatsApp/IA).
- **Componente** `components/consentimientos/casillas.tsx`: `<CasillasConsentimiento>` (casillas nativas con label,
  ninguna marcada, enlaces en otra pestaña, error con `role="alert"`, color por `--consentimiento-acento`) y
  `<PieLegal>`. Reutilizable en el Portal AutoFlow y la app de clientes LU (pasarle `casillasDe({ marca, marketing })`).
- **Formularios /f/**: las casillas van en la **bienvenida** (antes de cualquier dato, por los guardados a medias);
  "Empezar" no sigue sin términos y privacidad. `casillasFormulario(f)` (en `lib/formularios/reglas.ts`) las calcula
  en el servidor: `config.legal.marketing` o, si no dice, las de su acción (`leads-closers-lu` → SMS + e-mail).
  Pulse → Formularios → Ajustes tiene los switches de marketing. `/api/f/[slug]` rechaza el envío sin las
  obligatorias (422 `consentimiento: true` → el formulario vuelve a la bienvenida), no guarda a medias sin ellas y
  escribe las filas con `referencia = form:<slug>:<token>` y `origen = /f/<slug>`.
- **Accesibilidad del formulario** (mismo cambio): campos con `aria-labelledby` a la pregunta, opciones con
  `aria-pressed` en un `role="group"`, foco visible, `title` al iframe de Calendly. Queda el auto-avance al elegir.
- Pendiente: que el contrato de AIB (`/contrato`) y el Portal escriban también sus filas; respetar
  `tieneConsentimiento` en cualquier envío automático futuro.

## Decisiones abiertas de Elvin (24/oct/2026)

Para publicar se neutralizó todo "[PENDIENTE ELVIN …]" (componente `Pendiente` borrado): foro = tribunales de PR,
prevalece el español, contacto = info@levelupmediapr.net (LU/EA Market) · hola@aiborinquen.co (AIB) ·
hola@resueltopr.com (Resuelto), retención = "el tiempo necesario para los fines descritos y lo que exija la ley". Lo
que no se pudo neutralizar se quitó. Queda por decidir (y subir la versión en `lib/legal/versiones.ts` al cambiarlo):

- **Content OS** (`app/(legal)/`): dirección física de EA Market LLC (quitada); tope de responsabilidad (quitado);
  ¿EA Market LLC cubre todas las marcas? (`ENTIDAD_LEGAL`); correo propio de privacidad/legal y de RR.HH. (hoy
  info@levelupmediapr.net); plazos de respuesta a derechos y de devolución (quitados); retención por tipo de dato
  (clientes, grabaciones, leads, expedientes y ponches, registro de seguridad); cómo se avisa la grabación en las
  llamadas con closers (Fathom); confirmar la lista de proveedores de /privacidad; versión en inglés.
- **Reembolsos LU/AIB**: la página remite al acuerdo firmado. ⚠️ El contrato de AIB (`lib/aib-contratos/documento.ts`,
  cláusula 7) dice "no reembolsables salvo incumplimiento grave verificado mediante dictamen técnico", y /reembolsos
  ahora dice "siempre reembolsamos si el servicio está defectuoso o no cumple lo anunciado": alinear el contrato. El
  acuerdo de LU es un PDF fuera del repo: definir días para pedir reembolso, permanencia mínima y prorrateo.
- Casillas de marketing por formulario (`lib/formularios/reglas.ts`).
- **1000X** (`demos/richy-elvin-trading/`): ⚠️ CRÍTICO, con abogado: ¿la licencia del bot / la sala requieren registro
  CFTC/NFA (CTA) o exención? (cláusula quitada); correo público (no hay: hoy dice "el canal de contacto de esta página"
  y los botones son `#`); dirección; procesador de pagos; qué pasa tras los 12 meses de la licencia y pagos a plazos;
  reembolso de sistema_completo y bot_licencia (secciones quitadas; DACO pide días visibles); reembolso al expulsar de
  la comunidad; tope de responsabilidad; lista exacta de datos y proveedores.
- **Resuelto** (`vault/proyectos/plomeria-pr/kit/landing/`): nombre legal de la entidad (el pie dice solo "Resuelto ·
  Puerto Rico") y dirección; devolución del depósito si cancela el cliente y materiales especiales; plazo para reclamar
  (DACO pide días visibles); piezas compradas no instaladas; exclusiones de la garantía de destapes; cancelar o
  reprogramar citas; límite de responsabilidad y seguro; plazos de respuesta y devolución; plazo para borrar leads y
  aplicaciones.
