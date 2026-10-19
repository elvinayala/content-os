## Formularios propios — el reemplazo de Typeform (`/pulse/formularios`, 26/sep/2026)

Elvin: "quiero hacer mi propio Typeform… para descartar esa suscripción", con el estilo del onboarding de LU.
**Plataforma**: formularios de una pregunta por pantalla (`/f/<slug>`, públicos en `proxy.ts`) que se crean y
editan en **Pulse → Formularios** (admin/editor): preguntas (texto, largo, e-mail, teléfono, número, opción,
varias, sí/no, escala 0-10, link, redes), condiciones ("mostrar solo si…"), bienvenida (con `*resaltado*`),
pantalla final (`{nombre}` + botón con link, p. ej. Calendly), temas (Level Up · AI Borinquen · Claro · Noche +
color de acento + logo), abrir/cerrar, duplicar, archivar, respuestas con búsqueda y **Excel (CSV)**, vista previa
(`?vista=previa`, no guarda). Tablas `form_formularios` / `form_respuestas` (migración 0017, token por navegador =
sin duplicados; guarda copia de las preguntas). La respuesta SIEMPRE se guarda primero; la **acción**
`pulse-onboarding-lu` después crea/completa la ficha en LEVEL UP MEDIA (`altaDesdeFormulario` con las preguntas del
formulario) y abre expediente a Max; si falla queda marcada "No creó la ficha". Código: `lib/formularios/
{reglas,semillas,schema,repo}.ts` (reglas puras, tests `tests/formularios.test.mjs`), `components/formularios/`,
`app/f/[slug]`, `app/api/f/[slug]`, `app/pulse/(app)/formularios/`. CSS `.formulario` con variables `--f-*`.
- **Duplicados de Typeform** (semillas, `SEMILLAS`): `onboarding-level-up` (= levelupmedia.vercel.app; la página
  `/onboarding/level-up` ahora lee este formulario y postea a `/api/f/onboarding-level-up`; se le sumó el botón del
  Typeform para **agendar el onboarding con Jessica** en Calendly) y `encuesta-level-up`
  (levelupmedia.vercel.app/f/encuesta-level-up, la encuesta `UDjwQkKP` que mandan los agentes de n8n; los 4
  workflows que la tenían ya apuntan al link nuevo). Links de LU salen por `levelupmedia.vercel.app/f/…`.
- **Archivo de Typeform** (antes de cancelar, $0): `node scripts/typeform-archivo.mjs` → JSON + Excel en
  `~/Documents/Archivo Typeform/<fecha>/` y Storage `pulse/archivo-typeform/2026-09-26/` (525 respuestas del
  onboarding). La encuesta `UDjwQkKP` vive en OTRA cuenta de Typeform (subdominio 6siljlqvh7z): sus respuestas
  no se pueden bajar con `TYPEFORM_TOKEN`. `/api/pulse/typeform` queda de respaldo hasta cancelar.

- **Agenda de closers en 2 pasos** (26/sep, Elvin: "aunque no se agende, los datos que lleve me los dé"; decidió NO
  clonar Calendly: 11 asientos ≈ $180-220/mes vs. el riesgo en 200+ citas/mes): `/f/agenda-roger` y
  `/f/agenda-level-up` (Laura) en `lib/formularios/semillas-agenda.ts`. Paso 1 = las 10 preguntas del evento
  "VIDEOLLAMADA POR ZOOM" (opciones EXACTAS de Calendly en `opciones`, cómo se ven en `etiquetas`) + nombre/WhatsApp/
  e-mail; `config.parciales` guarda en cada paso desde que hay e-mail o teléfono válido (`estado: parcial`, migración
  0023). Paso 2 = `config.calendly.url` embebido (widget.js) con pre-llenado por el link (`name`, `email`, `a1…a10` con
  `%20`; cada pregunta dice su `calendly: "aN"`) y "Agendó" al recibir `calendly.event_scheduled`. Acción
  `leads-closers-lu` (`leadFormularioAgenda` en `lib/leads/cables.ts`): lead en CLOSERS «Sin agendar» (etapa creada al
  principio), dueño = setter del `?utm_source=` (los setters mandan el link con su nombre), seguimiento "llenó y no
  agendó" a la hora; al agendar, el webhook de Calendly lo mueve a «Llamada agendada» y lo pasa al closer
  (`forzarDueno`). ⚠️ Calendly NO pre-marca opciones que en su configuración terminan en espacio ("En un mes ",
  "Punto equilibrio ", "5% de la facturacion total "…): hay que quitarles el espacio en Calendly.
