## Consentimientos y casillas legales (24/oct/2026)

Elvin: "No quiero que mi sitio web sea demandado" → skill `legal-sitio-web` (puntos 4 y 5). Auditoría de la fase 1 en
las notas de la sesión (`legal-formularios-fase1.md`). Las **páginas** `/terminos`, `/privacidad`, `/cookies`,
`/reembolsos` y `/accesibilidad` las hace otra sesión; aquí solo se enlazan (`RUTAS_LEGALES`).

- **Reglas puras** `lib/consentimientos/reglas.ts` (tests `tests/consentimientos.test.mjs`): tipos (`terminos`,
  `privacidad` obligatorias; `marketing_sms`, `marketing_email`, `llamadas_ia` opcionales; `cookies`), el texto exacto de
  cada casilla (`casillaDe`, con el nombre de la marca), `VERSION_DOCUMENTOS` y `ENTIDAD_LEGAL` ([PENDIENTE ELVIN]),
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
