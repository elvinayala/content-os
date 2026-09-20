---
proyecto: Quilla
tipo: stack
fecha: 2026-09-15
estado: borrador v1
relacionado: "[[proyectos/quilla/plan-maestro]] · [[perfil-ceo]] · [[proyectos/quilla/sistema-aplicacion-scoring]] · [[proyectos/quilla/plataforma-creadores]] · [[proyectos/quilla/onboarding-y-operacion]] · [[proyectos/quilla/organigrama-y-kpis]] · [[proyectos/quilla/plan-financiero]]"
---

# Tecnología · Stack de Quilla

> **Tesis del documento:** Quilla no construye software en el año 1. Compra lo que existe, lo configura con la misma receta que ya funcionó en Resuelto (sub-cuenta de GHL propia, web estática en Netlify, WhatsApp por GHL) y guarda el conocimiento en este vault. Lo único "propio" es el know-how y los agentes IA internos del Content OS de Elvin, que se usan puertas adentro. Todo lo que aquí es `[DATO]` se confirma al abrir las cuentas.

---

## 1. Principio: separación total de las agencias de Elvin

Quilla es una empresa nueva e independiente. Nada de Level Up Media, AI Borinquen ni Shadow Operator aparece en su stack, y nada de Quilla vive dentro del stack de ellas.

| Qué | Quilla tiene el suyo propio | Por qué |
|---|---|---|
| Entidad y banco | LLC propia, cuenta bancaria propia, Stripe propio | Contabilidad limpia; el rev share se concilia contra una sola cuenta |
| Dominio y correo | `quillagroup.com` (recomendado) + `quillahq.com` (redirige); Google Workspace propio `[DATO]` | Nada sale de un correo de las agencias |
| Slack | Workspace propio de Quilla | Los creadores entran como invitados externos a su canal; nunca al Slack de las agencias |
| GHL | Sub-cuenta propia (no la de AIB ni la de Resuelto) | Pipelines, contactos, workflows y WhatsApp aislados |
| DocuSign | Cuenta propia | Los contratos con creadores y marcas no se mezclan con otros clientes |
| Apify, Netlify, Skool | Cuentas propias o, al inicio, equipo separado dentro de la cuenta con facturación propia `[DATO]` | Facturación y accesos trazables |
| Vault | Carpeta `vault/proyectos/quilla/` dentro del repo del Content OS | Único punto compartido; es conocimiento interno, no producto |

**Lo único que se reusa:** el know-how (recetas de GHL, kit de landing, prompts de auditoría) y los **agentes IA internos** (Jarvis y skills), operados por el equipo de Quilla y sin exponer las marcas de las agencias en ningún entregable (ver [[proyectos/quilla/organigrama-y-kpis]] §7).

---

## 2. Stack por función

| Función | Herramienta | Por qué | Costo/mes | Fase |
|---|---|---|---|---|
| Web y landing de Quilla | HTML estático en **Netlify** + dominio propio | Misma receta que Resuelto: rápido, sin servidor, deploy en minutos, SSL incluido. La landing premium de YouTube Ads vive aquí | $0–19 `[DATO]` + dominio ≈ $15/año | Día 1–30 |
| Aplicación y scoring de creadores | **Kit estático** (formulario de 5 pasos + scoring en el navegador) → **webhook a GHL** | Se especifica ahora (ver [[proyectos/quilla/sistema-aplicacion-scoring]]); PASO 02 lo construye. Sin backend: el score viaja como custom field | Incluido en Netlify | Día 1–30 (spec), PASO 02 (build) |
| CRM, email, calendario, pipelines, workflows | **Sub-cuenta de GoHighLevel** | Un solo lugar para creadores, marcas, agenda del Scout y automatizaciones. Ya la conocemos por Resuelto y AutoFlow | $97–297 según plan de la agencia `[DATO]` | Día 1–30 |
| WhatsApp | **WhatsApp por GHL** (GHL como Tech Provider) | Sin instalar el número en la app; conversaciones y workflows en el mismo CRM | ≈ $10/mes + costo por conversación de Meta `[DATO]` | Día 31–60 |
| E-firma | **DocuSign** | Estándar que reconocen abogados y marcas; plantillas por tipo de contrato; auditoría de firma | $25–45 `[DATO]` | Día 1–30 |
| Pagos | **Stripe**, una cuenta por venture (a nombre del venture o del creador, Quilla como administrador financiero) | Cada venture cobra por separado: el ledger se concilia contra un solo extracto por venture | 2.9 % + $0.30 por transacción | Por venture, desde la etapa 7 |
| Ledger de rev share | **Google Sheets** (una hoja por venture + consolidado) | Al inicio no hace falta más; la fórmula del neto está escrita y es auditable por el creador | Incluido en Workspace | Desde el primer contrato |
| Funnels de creadores | **GHL** por defecto (landing, formulario, checkout, email, WhatsApp) | Un operador, una herramienta, un login por venture | Incluido en la sub-cuenta (sub-cuenta extra por venture solo si el creador lo exige `[DATO]`) | Por venture |
| Comunidades | **Skool** | Cobro y comunidad en una pieza; el creador es owner | $99/mes por comunidad `[DATO]` (se carga al neto del venture) | Por venture (playbook 5b) |
| Cursos / funnels complejos | **Kajabi** o **ClickFunnels** solo si hace falta | Solo cuando GHL no cubre (por ejemplo, área de miembros con video pesado). Decisión por venture, con costo cargado al neto | $149–199 `[DATO]` | Nunca por defecto |
| Auditoría de audiencia | **Apify** (`instagram-profile-scraper` y afines) + análisis con Claude | Datos reales del perfil público; el análisis se hace con el agente y se redacta en 2 páginas | $49 plan + consumo `[DATO]` | Día 1–30 |
| Comunicación | **Slack** propio | Canales por venture, invitados externos, brief diario | $0–8.75/usuario `[DATO]` | Día 1 |
| SOPs y memoria | **Este vault** (markdown con wikilinks) | Compatible con Obsidian, lo lee Jarvis, lo versiona git | $0 | Día 1 |
| IA | **Claude** (Jarvis + skills del Content OS de Elvin) | Auditorías, guiones de venta, ideas, análisis de competidores; uso interno | Costo de API ≈ $100–200 `[DATO]` | Día 1 |
| Analítica web | Analítica de Netlify o GA4 `[DATO]` | Tráfico a landing y a funnels de ventures | $0–9 `[DATO]` | Día 31–60 |
| YouTube Ads | Google Ads (cuenta propia de Quilla) | Único canal pagado de adquisición | $1,800/mes de pauta desde el mes 2 (no es costo de stack) | Día 31–60 |

---

## 3. Arquitectura de datos en GHL

### 3a. Pipeline "Creadores"

Etapas exactas (en este orden), con quién mueve la oportunidad:

| Etapa | Cómo entra | Quién la mueve | Automatización |
|---|---|---|---|
| **Empezó aplicación** | Webhook del kit al completar el paso 1 (nombre + handle + email) | Automático | Workflow: recordatorio a las 24 h y a las 72 h si no completó |
| **Aplicó** | Webhook al completar el paso 5; llega el score | Automático | Si score ≥ 70 → "Calificado · agendar"; si 45–69 → "Revisión humana"; si < 45 o gate de rechazo → "No califica" |
| **Revisión humana** | Score 45–69 | Scout (SLA 24 h) | Tarea al Scout; email interno |
| **Calificado · agendar** | Score ≥ 70 o revisión aprobada | Automático / Scout | Email + WhatsApp con link al calendario de 20 min del Scout |
| **Llamada agendada** | Reserva en el calendario | Automático | Recordatorios a 24 h y 1 h; si no asiste → "No show" |
| **Propuesta** | Head of Monetization la envía | Head of Monetization | Tarea de seguimiento a los 7 días |
| **Firmado** | DocuSign completado | Ops/Finance | Tag `creador-firmado`; crea tarea "kickoff en 5 días"; notifica a Elvin como `saber` |
| **No califica** | Score < 45, gate de rechazo o decisión humana | Automático / Scout | Email neutro de cierre (sin promesas de "más adelante") |
| **No show** | No asistió a la llamada | Automático | Workflow de reagenda (2 intentos); después de eso → "No califica" con motivo `no-show` |

### 3b. Pipeline "Partnerships"

| Etapa | Qué significa | Quién la mueve |
|---|---|---|
| **Brief** | Un negocio llenó el brief del roster concierge (objetivo, categoría, presupuesto orientativo, plazo) | Automático (formulario) |
| **Propuesta** | Partnerships Lead armó match a mano y envió propuesta con paquete 3/6/12 | Partnerships Lead |
| **Negociación** | Hay ida y vuelta sobre alcance, precio o creador | Partnerships Lead |
| **Firmado** | DocuSign completado y 50 % de anticipo cobrado | Ops/Finance |
| **En curso** | Producción y publicación activas; reporte mensual de medición | Partnerships Lead |
| **Renovación** | Faltan 30 días para el fin del paquete; se propone el siguiente | Partnerships Lead (workflow crea la tarea) |

### 3c. Custom fields del contacto creador

| Campo | Tipo | Origen |
|---|---|---|
| `handle_principal` | Texto | Kit |
| `plataforma_principal` | Lista (IG / TikTok / YouTube / otra) | Kit |
| `seguidores_principal` | Número | Kit |
| `seguidores_total` | Número | Kit |
| `engagement_declarado` | Número (%) | Kit |
| `meses_publicando` | Número | Kit |
| `audiencia_pr_hispana_pct` | Número (%) | Kit |
| `credibilidad_fuerte` | Sí/No + texto (TV / radio / profesión) | Kit |
| `arquetipo` | Lista (Autoridad / Entretenimiento / Artista / Lifestyle / Educativo) | Kit + revisión |
| `dispuesto_rev_share` | Sí/No | Kit (gate) |
| `horas_semana` | Número | Kit (gate) |
| `escandalo_activo` | Sí/No + nota | Revisión humana |
| `score` | Número 0–100 | Kit |
| `banda_score` | Lista (llamada / revisión / no califica) | Automático |
| `modelo_sugerido` | Lista (management / monetizacion / partnerships / business-building) | Kit + Head of Monetization |
| `fuente` | Lista (youtube-ads / referido / networking / scout) | Kit o manual |
| `referido_por` | Texto | Manual |
| `tier` | Lista (1 / 2) | Scout (para el bono) |
| `auditoria_url` | Texto (link al vault o PDF) | Head of Monetization |
| `fecha_firma` | Fecha | Ops/Finance |
| `venture_activo` | Texto (nombre del venture) | Head of Monetization |

**Tags:** `creador`, `creador-firmado`, `marca`, `partnership-activo`, `referidor`, `prueba` (para leads de prueba; se borran antes de reportar).

---

## 4. Setup de la sub-cuenta GHL paso a paso

Misma receta que en Resuelto (ver ESTADO de ese proyecto). Lo ejecuta Ops/Finance con apoyo de Claude; Elvin solo hace los pasos marcados como suyos.

| # | Paso | Quién | Detalle |
|---|---|---|---|
| 1 | Crear la sub-cuenta `Quilla Group LLC` en la agencia de GHL | Elvin (5 min) | Con el correo de Quilla, no el de las agencias. Zona horaria America/Puerto_Rico |
| 2 | Agregar a Elvin como único usuario humano de la sub-cuenta | Elvin | Rol admin. Nadie más entra por login; el equipo opera vía integración y vía accesos que se abren después por rol |
| 3 | Crear la integración privada "Agente Quilla" | Claude | Scopes: contacts, opportunities, calendars, conversations, workflows, custom fields. El token va a `.env` del kit, nunca al repo |
| 4 | Crear los 2 pipelines con las etapas exactas de §3 | Claude (script) | Igual que `ghl-pipelines` de Resuelto; los IDs se guardan en `data/quilla/ghl-*.json` |
| 5 | Crear los custom fields y tags de §3c | Claude (script) | — |
| 6 | Crear 2 calendarios: "Llamada con creador · 20 min" (Scout) y "Kickoff · 90 min" (Head of Monetization) | Claude (script) | Requiere que el usuario exista (paso 2) |
| 7 | Conectar el dominio de correo (`quillagroup.com`) para envío | Elvin (DNS, 10 min) | SPF/DKIM/DMARC en el registrador |
| 8 | Configurar WhatsApp por GHL | Elvin (compra) + Claude (config) | Business Manager de Quilla + verificación del negocio + número dedicado nuevo. **El número NO se instala en la app de WhatsApp**; vive en GHL |
| 9 | Crear los workflows del pipeline "Creadores" (recordatorios, scoring → etapa, no-show, cierre neutro) | Claude | Se prueban con 3 contactos con tag `prueba` |
| 10 | Conectar el webhook del kit de aplicación a GHL | Claude (PASO 02) | Función de Netlify → API de GHL, igual que `/api/lead` de Resuelto |
| 11 | Conectar el formulario de brief del roster concierge al pipeline "Partnerships" | Claude | Mismo patrón |
| 12 | Prueba end-to-end con 3 aplicaciones ficticias (una por banda de score) | Ops/Finance | Se verifica etapa, campos, correos, WhatsApp y calendario. Se borran los contactos `prueba` |

**Tiempo estimado:** 2 sesiones de trabajo de Claude + 30 min de Elvin repartidos en los pasos 1, 2, 7 y 8. Meta: listo el día 20 (ver [[proyectos/quilla/roadmap]]).

---

## 5. Ledger de rev share

Una hoja de Google Sheets por venture (`ledger-<venture>`) y una hoja consolidada (`ledger-quilla`) que suma todas. La fórmula del neto es la del contrato y no cambia sin adenda.

**Columnas de la hoja por venture (una fila por mes):**

| Columna | Qué es | Fuente |
|---|---|---|
| Mes | AAAA-MM | — |
| Ingreso bruto | Cobros del mes | Stripe (export) + Skool (export) |
| Reembolsos | Devoluciones del mes | Stripe |
| Procesamiento de pagos | Comisiones de Stripe/Skool | Stripe / Skool |
| Pauta publicitaria | Gasto en ads del venture (adelantado por Quilla) | Google Ads / Meta Ads (export) |
| Comisiones de vendedores / setters | Pagadas a contratistas por ventas del mes | Hoja de comisiones |
| Costos directos acordados | Solo los que están por escrito en el contrato o adenda (p. ej., Skool, Kajabi, logística D2C) | Facturas |
| **Ingreso neto** | Bruto − reembolsos − procesamiento − pauta − comisiones − costos directos | Fórmula |
| % del creador | Según contrato (50 % base; 40/60–60/40 tras revisión a los 12 meses) | Contrato |
| Share del creador | Neto × % | Fórmula |
| Share de Quilla | Neto − share del creador | Fórmula |
| Pauta pendiente de recuperar | Saldo de pauta adelantada aún no cubierta por el neto | Fórmula acumulada |
| Fecha de pago | Día en que se pagó al creador | Ops/Finance |
| Referencia de pago | ID de transferencia | Ops/Finance |
| Conciliado por | Iniciales | Ops/Finance |
| Notas | Cualquier ajuste, con link a la adenda | — |

**Quién lo llena:** Ops/Finance, entre el día 1 y el día 7 de cada mes, con los exports del mes anterior. El operador del venture valida el gasto en pauta; el Head of Monetization valida las comisiones.

**Cuándo se concilia:** en la mensual de P&L del día 8. Se comparan las columnas contra los extractos; si hay diferencia > 1 %, no se paga hasta resolverla.

**Cómo se paga:** transferencia bancaria (ACH) al creador el **día 10** de cada mes, junto con el reporte de 1 página (ver [[proyectos/quilla/onboarding-y-operacion]] §8) y el extracto del ledger del mes. Si la pauta adelantada supera el neto del mes, el share es $0 y el saldo de pauta pendiente se muestra en el reporte; no se le cobra al creador. El creador puede pedir los exports de Stripe/Skool en cualquier momento.

---

## 6. Seguridad y accesos

| Recurso | Elvin | Ops/Finance | Head of Monetization | Operador | Scout | Partnerships Lead | Creador |
|---|---|---|---|---|---|---|---|
| GHL (login) | Admin (único usuario humano al inicio) | Usuario cuando haya 3 ventures `[DATO]` | Vía integración / vistas compartidas | Vía integración | Calendario + pipeline Creadores (usuario limitado) `[DATO]` | Pipeline Partnerships (usuario limitado) `[DATO]` | Ninguno |
| DocuSign | Owner | Enviar y archivar | Ver | — | — | Enviar (plantilla partnership) | Firmante |
| Stripe del venture | — | Administrador financiero | Ver | Ver | — | — | Propietario |
| Skool | — | — | Admin | Admin | — | — | Owner |
| Google Ads / YouTube Ads | Owner | Facturación | Admin | Admin (por venture) | — | — | Ninguno |
| Netlify y dominio | Owner | — | — | Deploy (por venture) | — | — | Ninguno |
| Slack | Owner | Admin | Miembro | Miembro | Miembro | Miembro | Invitado externo en su canal |
| Vault (repo) | Owner | Escritura | Escritura | Escritura (carpeta del venture) | Lectura | Lectura | Ninguno |
| Cuentas del creador (IG/TikTok/YouTube) | — | — | Colaborador / gestor por rol | Colaborador por rol | — | — | Propietario |

**Reglas duras:**
- **El creador nunca entrega contraseñas.** Todo acceso a sus cuentas se da por rol (Meta Business Suite como colaborador, YouTube Studio como editor, Skool como admin). Si un creador ofrece su contraseña, se rechaza y se le explica cómo dar acceso por rol.
- **Nada de tokens en el repo.** Van a `.env` local y a las variables de entorno de Netlify. Se rotan al salir cualquier persona del equipo.
- **2FA obligatorio** en GHL, DocuSign, Stripe, Google Ads, Slack y Netlify.
- **Salida de una persona:** Ops/Finance revoca todos los accesos el mismo día, rota los tokens de integración y lo registra en `decisiones.md`.
- **Datos del creador y de sus clientes:** viven en el Stripe y el CRM del venture; al cierre del venture se comparten 50/50 (ver [[proyectos/quilla/contratos]]). No se cruzan listas entre ventures ni con las agencias de Elvin.

---

## 7. Costo mensual total por fase

Solo stack (no incluye nómina, pauta ni producción). Todo `[DATO]` hasta abrir las cuentas.

| Fase | Herramientas activas | Costo/mes estimado |
|---|---|---|
| **Días 1–30** (setup) | Netlify + dominio, sub-cuenta GHL, DocuSign, Apify, Slack, Workspace, Claude API | ≈ $300–400 `[DATO]` (setup inicial de GHL y herramientas presupuestado en $500 una sola vez) |
| **Días 31–90** (adquisición encendida + primer venture) | Lo anterior + WhatsApp por GHL + analítica + Stripe del primer venture (variable) + Skool si el playbook es comunidad | ≈ $400–550 `[DATO]` |
| **Meses 4–12** (2–3 ventures) | Lo anterior + Skool/Kajabi por venture si aplica (se cargan al neto de cada venture, no a Quilla) + posible sub-cuenta GHL extra por venture | ≈ $450–700 `[DATO]` a cargo de Quilla; el resto al neto de los ventures |

Coincide con la línea "GHL + Netlify + Apify + DocuSign + Slack ≈ $400" del plan financiero base (ver [[proyectos/quilla/plan-financiero]]). Cualquier herramienta nueva por encima de $50/mes la aprueba Ops/Finance dentro de su alcance; por encima de $300/mes se lleva al lunes de operaciones.

---

## 8. Lo que NO se construye a medida en el año 1

| Tentación | Por qué no | Qué se usa en su lugar |
|---|---|---|
| Plataforma propia de creadores (marketplace self-serve) | Es la Fase 2 y tiene compuerta: ≥ 25 creadores en roster y ≥ 30 briefs/mes. Sin eso, es software sin usuarios | Roster concierge: hoja curada + formulario de brief en GHL + match a mano (ver [[proyectos/quilla/plataforma-creadores]]) |
| CRM propio o base de datos propia | GHL ya tiene contactos, pipelines, calendario, email, WhatsApp y workflows. Lo aprendimos en Resuelto y AutoFlow | Sub-cuenta GHL |
| Backend para el scoring | El score se calcula en el navegador y viaja por webhook; no hay lógica secreta que proteger | Kit estático + custom fields |
| App o portal para el creador | El creador necesita un reporte al mes y un canal de Slack, no un dashboard | Reporte de 1 página + canal `#v-<handle>` |
| Sistema de pagos o split automático | Stripe Connect y similares agregan complejidad y compliance para un volumen de 2–3 ventures | Stripe por venture + ledger en Sheets + pago manual el día 10 |
| Área de miembros propia para cursos | GHL cubre lo básico; si no, Kajabi por venture | GHL o Kajabi (solo si hace falta) |
| Agente de IA público (chat en la landing, "asesor de creadores") | Expone tecnología sin necesidad; el funnel es aplicación → llamada humana | Aplicación de 5 pasos + Scout |
| Herramienta propia de auditoría de audiencia | Apify + Claude ya lo hacen; lo que vale es el criterio de las 2 páginas, no el software | Apify + skill interna + plantilla |
| Integración a medida con YouTube Ads o Meta | Google Ads tiene su UI y sus exports; no hay volumen que justifique API | Cuenta de Google Ads + export mensual al ledger |
| Dashboard consolidado en tiempo real | Lo que se decide se decide el lunes y el día 8, no en tiempo real | Hoja consolidada + tablero semanal en Slack |

**Regla:** si al final del año 1 hay ≥ 5 creadores firmados, ≥ 2 ventures con ingresos y el equipo pierde más de 10 h/semana en tareas manuales que una herramienta resolvería, se abre la conversación de construir. Antes, no. La decisión la toma Elvin en la trimestral del mes 12 con datos, no con deseo (ver [[proyectos/quilla/roadmap]]).
