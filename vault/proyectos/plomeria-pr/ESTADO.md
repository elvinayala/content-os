---
proyecto: Resuelto
tipo: estado-maestro
actualizado: 2026-09-21
---

# Resuelto · Estado del proyecto y cómo empezamos

**Fecha:** 13 de septiembre de 2026 · **Fase:** construido, listo para conectar y lanzar Fase 0.

## 1. Qué es Resuelto (en 5 líneas)

Marca de servicios para el hogar en Puerto Rico. Empieza con **plomería con precio fijo** y una **División de Proyectos** (baños, cocinas, pisos, puertas/ventanas, remodelación, piscinas, exteriores, poda). Resuelto consigue el cliente, cotiza, vende, cobra y garantiza; **plomeros licenciados y contratistas Verified ejecutan** (65% de mano de obra el plomero; el contratista recibe su costo de ejecución y Resuelto retiene 25%). Sin empleados de marketing: Claude es la agencia, Bori los anuncios, GHL (Social Planner) el orgánico, un agente de IA la atención por WhatsApp. Entidad: **Resuelto Home Services LLC** (por constituir).

## 2. Todo lo que existe (links y carpetas)

### En vivo
| Qué | Link | Estado |
|---|---|---|
| Web oficial (clientes) | https://resueltopr.com | ✅ viva |
| Página de plomeros | https://resueltopr.com/plomeros | ✅ viva |
| Página de contratistas | https://resueltopr.com/contratistas | ✅ viva |
| Dominio `resueltopr.com` | https://resueltopr.com (+ www) · SSL Let's Encrypt · HTTPS forzado | ✅ conectado 14/sep/2026 |
| **Meta · portafolio Resuelto Home Services LLC** (18/sep) | business `157965986805918` · cuenta publicitaria `act_1564735818086768` (AST, USD, Visa •7932, **límite de gasto $50/día impuesto por Meta a cuenta nueva**) · página Resuelto PR `1278171838721301` + Instagram vinculado (21/sep) · pixel `28140823722265213` · **2 campañas PUBLICADAS 21/sep ~22:30 AST** ($65/día pedidos, ABO): Leads · Sprint 1 (L1 video con audio $18 + L2 flyer $12, Advantage+ PR 25+, Lead web) y WhatsApp · Sprint 1 (W1 video con audio $21 + W2 flyer $14, Hombres 30+, destino 939-247-9234). Ubicaciones Advantage+ (el 9:16 no sale en feed de IG; lo cubren los flyers). IDs en `agente/.env`, detalle en `campana-ads-reclutamiento.md` | ✅ en revisión de Meta; vigilar que pasen a Activo y pedir subida del límite de $50 cuando haya historial |
| Brand kit (canvas editable) | https://claude.ai/code/artifact/98ae2976-ef03-468a-b75c-e5d86d605a73 | ✅ |
| **Formularios → GHL** (`/api/lead`, función Netlify, 14/sep) | plomeros → pipeline Candidatos·Plomeros/Aplicó · contratistas → Contratistas/Aplicó · lista de espera → tag cliente+lista-espera; campos personalizados llenos | ✅ probado con 3 leads de prueba (tag `prueba`) |
| Landing oficial (artifact) | https://claude.ai/code/artifact/815f72db-7192-4096-a5e3-f733e3bf4b2e | ✅ |
| Landing plomeros (artifact) | https://claude.ai/code/artifact/a99dda50-7d24-4c25-9ad1-b0e9a1f0ca22 | ✅ |
| Flyers publicados (para Bori/Meta) | https://resueltopr.com/flyers/<archivo>.png | ✅ 24 piezas |
| **Videos animados de reclutamiento** (15 s, vertical) | https://resueltopr.com/videos/resuelto-plomeros-15s.mp4 · https://resueltopr.com/videos/resuelto-contratistas-15s.mp4 | ✅ 2 piezas (13/sep) |

### Marca · `kit/`
- `kit/logo/` — logo horizontal y apilado (azul/blanco, PNG transparente), ícono solo, **SVG vectoriales** para imprenta.
- `kit/perfiles/` — `avatar-naranja.png` (perfil de todas las redes), `portada-facebook.png`, 4 portadas de destacadas.
- `kit/brand-kit-resumen.md` — paleta C1–C7 (C1 #0F3D5E, C2 #F2621F, C3 #FBF7F0), Sora + DM Sans, T1–T8, voz V1–V6, CSS base, prompt para Claude Design.
- `kit/brief-de-marca.md` · `kit/brand-canvas/` (fuente del canvas).

### Flyers (24)
- **Reclutamiento de plomeros** `kit/flyers/` (5): 01 $1,950 semanal · 02 el trato · 03 buscamos 10 · 04 story · 05 ad Meta.
- **Reclutamiento de contratistas** `kit/flyers-contratistas/` (5): k1 vendemos el proyecto · k2 $9,000/$12,000 · k3 Verified · k4 story · k5 ad Meta.
- **Clientes** `kit/flyers-clientes/` (14): c1 menú de precios ⭐ · c2 promesa · c3 destape $149 · c4 cisterna · c5 story emergencia · c6 ad Meta · c7 volante impreso · c8 el problema · c9 sin sorpresas · c10 calentador · c11 factura de agua · c12 B2B condominios/Airbnb · c13 arréglalo tú · c14 guía de cisterna.
- Todos copiados en `kit/landing/flyers/` → URL pública para Meta.

### Videos (2) · `kit/videos/`
- `resuelto-plomeros-15s.mp4` — gancho "¿Cansado de buscar clientes?" → "Tú haces la plomería. Nosotros hacemos el resto." → contador $1,950/semana → 3 ticks → CTA WhatsApp.
- `resuelto-contratistas-15s.mp4` — "¿Cotizas gratis y el cliente 'lo va a pensar'?" → "Nosotros vendemos el proyecto. Tú lo ejecutas." → $9,000 tu pago / $12,000 lo cierra Resuelto → 3 ticks → CTA Resuelto Verified.
- 1080×1920 · 30 fps · sin audio (Meta/Reels ponen música o se agrega en Bori). Guiones editables `*.edit.jsx` (Higgsedit) junto a los mp4; copiados a `kit/landing/videos/` → URL pública.

### Servicios y precios
- `kit/menu-de-servicios.md` + `agente/data/menu.json` — menú de plomería en 3 niveles (pequeño $69–199 · mediano $200–499 · grande $500+), fee $19, emergencia +$99, materiales costo+20%.
- `agente/data/categorias-proyectos.json` — 8 categorías de proyectos con rangos, preguntas, permisos, cross-sell.
- `agente/data/costbook.json` — Cost Book: estructura completa, **costos en blanco** (se levantan con contratistas).
- `agente/data/territorios.json` — 8 territorios (T1 Metro Norte … T8 Este).

### Estrategia y planes
- `RESUMEN.md` (1 página) · `plan-maestro.md` + PDF · `plan-operativo-30-dias.md` + PDF · `decisiones.md` (D1–D6) · `HOY.md` (checklist) · `modelo-operativo-agencia.md` (Claude + Bori + GHL) · `plan-expansion.md` (A/C 2º, electricidad 3º, techos 4º; la recurrencia vale 10–13× vs 5–8×).
- División Proyectos `proyectos/`: `plan-division-proyectos.md` (12 fases, DACO) · `resuelto-verified.md` · `campana-contratistas.md` · `cotizador-manual.md` · `garantia-resuelto.md`.
- **Feed de Instagram (14/sep):** `plan-feed-instagram.md` — los 12 posts previos a los anuncios en orden (tablero navy/crema), captions y hashtags listos, stories, bio, publicación por **Social Planner de GHL** (Zernio descartado). Piezas nuevas en `kit/feed/` (presentación, garantía, carrusel de 4 pasos, portadas de reels) + `grid-preview.jpg`; 3er reel `kit/videos/resuelto-clientes-15s.mp4` (cliente: precios antes de ir).
- **Sprint de anuncios de reclutamiento (borrador listo para montar):** `campana-ads-reclutamiento.md` — 2 Campañas Relámpago de Bori a WhatsApp, $50/día × 7 días ($30 plomeros / $20 contratistas), creativos, copys, saludo/botones, calendario, umbrales, reglas de decisión y los 4 comandos exactos.
- Campañas: `kit/campana-reclutamiento.md` (plomeros) · `kit/campana-clientes.md` (clientes; se prende con 5 plomeros) · `kit/ads-google-meta.md` · `kit/guiones-reels-lanzamiento.md`.
- **Presentación de entrevista/cierre** (13/sep): `kit/entrevista/entrevista-plomeros.pptx` y `entrevista-contratistas.pptx` — 16 slides cada una con el guion del cerrador en las notas del presentador (descubrimiento → problema → cómo funciona → dinero con sus números → reglas → objeciones → fundadores → cierre en 2 opciones). Se regeneran con `node kit/entrevista/build.js`.
- Operación: `kit/contrato-plomero-borrador.md` (para el abogado) · `kit/flujo-bori-whatsapp.md` · `kit/hoja-trabajos.csv` · `kit/perfil-coordinador-ops.md` · `kit/checklist-72h.md`.

### Software · `agente/` (Node + TypeScript, `claude-opus-5`) · demo local `http://localhost:3110`
| Pieza | Qué hace | Estado |
|---|---|---|
| Agente de WhatsApp (`src/agente.ts`, `prompt.ts`, `herramientas.ts`) | 4 flujos: cliente plomería, dueño con proyecto, plomero candidato, contratista candidato. 16 herramientas. Solo WhatsApp (IG/Messenger redirigen). Lee fotos/PDF, transcribe audio | ✅ probado con API real |
| Despacho en tiempo real (`despacho.ts`, `proveedores.ts`) | Trabajo cerrado → oferta a proveedores elegibles → **el primero que acepta se lo lleva** → contrato del trabajo (DocuSign, modo simulado) → si nadie acepta, Coordinador | ✅ probado |
| **App de proveedores** (`portal/proveedores.html`, `sw.js`, `manifest`, `push.ts`) | PWA instalable en celular con **push**; aceptar con un toque; alerta también por WhatsApp | ✅ demo con datos [DEMO] |
| **App del cotizador** (`portal/cotizador.html`, `cotizador-app.ts`, `cotizador.ts`, `propuestas.ts`) | Fotos → IA sugiere alcance → motor de precio (recomendado/mínimo/piso 20%) → propuesta y contrato con marca → depósito → CERRADO → oferta a contratistas. Alimenta el Cost Book | ✅ probado e2e |
| QA + Recovery (`encuestas.ts`) | Encuesta a 24 h por el agente, cola de Recovery, comisión 2%+0.5% | ✅ probado con API real |
| Tablero (`dashboard.ts`) `/admin/dashboard` | Embudo, por cotizador, por categoría, motivos de pérdida, Recovery | ✅ |
| Publicador orgánico (`publicar.ts`) + cola `data/calendario-publicaciones.json` | 21 piezas con copy listas; IG/FB por Graph API; respaldo del Social Planner de GHL | ✅ modo seco |
| Cliente de Bori (`bori.ts`) | Login con usuario de Resuelto, subir creativos, Campaña Relámpago a WhatsApp en pausa | ✅ verificado contra heybori.ai (401 sin sesión) |
| Integraciones | Google Calendar, Stripe + ATH Móvil, GoHighLevel, Whisper, DocuSign, Web Push | ✅ código; **sin credenciales** |
| Datos demo | `agente/data/estado/` (ofertas, proyectos PR-0001/0002, contratos, propuestas) | borrar antes de producción |

## 3. Lo que hemos hecho (4 al 13 de septiembre)
Investigación de mercado y marco legal (Ley 59-2022 plomería, DACO contratistas) → plan maestro y operativo → nombre, dominio, marca completa → 3 landings desplegadas → 24 flyers → agente de WhatsApp → plataforma de despacho + app de proveedores → División Proyectos completa (Cost Book, motor de precio, app del cotizador, Verified, QA/Recovery, tablero, garantía) → modelo operativo sin empleados (Claude + Bori + GHL).

## 4. Dónde estamos
Todo el sistema está **construido y probado en simulado**. Nada está conectado a cuentas reales: no hay WhatsApp, no hay LLC, no hay credenciales de Meta/GHL/Stripe/DocuSign, el dominio no apunta a la web, y `proveedores.json` tiene a Luis con datos de relleno.

> **Portal de operación + app del plomero (23/sep):** `PORTAL-OPERACION.md` — `/portal` con usuario y clave: buscar cliente → ficha con trabajos, fotos, comentarios del plomero, historial permanente y garantía (botón para abrirla); plomeros y equipo. Link corto `app.resueltopr.com/a/<id>/<código>` y la app instalada ya recuerda la llave.

> **Listos para dar trabajo (22/sep):** `PLAN-LISTOS-PARA-TRABAJOS.md` — app del plomero v2 en producción (ciclo en camino → fotos → terminé → cobro, Mi semana), panel `/admin/plomeros` para dar de alta, cobertura real por plomero activo; bloqueos de Elvin: cobro (ATH/Stripe), presupuesto de clientes, Google Ads/GBP, seguro.

> **Nina, Community Manager (21/sep):** `NINA-COMMUNITY-MANAGER.md` — agente propio en Railway que publica 1×/día por Zernio (mezcla 50/20/20/10, post/carrusel/reel, feriados PR+EE. UU.) y reporta por Telegram. Falta: conectar IG/FB en Zernio + bot de Telegram.

> **Operación diaria (desde 21/sep):** `OPERACION-RECLUTAMIENTO.md` — qué pasa cuando un plomero escribe, dónde cae (GHL → Candidatos), la rutina de 15 min 2×/día y los avisos. Léelo antes que nada.

> **Reclutamiento: TODO Puerto Rico** (Elvin, 21/sep). Los 8 territorios siguen mandando para clientes (cobertura activa/pronto), pero cualquier plomero licenciado de cualquier municipio se entrevista y se contrata. El agente ya lo sabe (prompt) y el playbook de Yaileen también.

## 5. Qué falta para poder hacer publicidad (en orden, y quién)

| # | Qué | Quién | Desbloquea |
|---|---|---|---|
| 1 | ~~DNS en GoDaddy~~ **Hecho 14/sep**: A `@` → 75.2.60.5, `www` alias, SSL emitido | — | `resueltopr.com` carga la web oficial |
| 2 | **Número de WhatsApp — CONECTADO 21/sep (noche)**: 939-247-9234 activo, WABA `2594942544291294` en el portafolio Resuelto (creada vía Embedded Signup de Zernio, sin app en el teléfono), cuenta Zernio `6ab1d60b8d284ffb212a4531`, método de pago de WhatsApp conectado (Visa •7932), estado "Sending limited" solo por la verificación del negocio (pendiente, no bloquea chats iniciados por el cliente). Nombre visible en revisión | ✅ | Todos los botones de WhatsApp llevan a un número real |
| 3 | **Datos de Luis**: municipio, licencia (número/nivel), vehículo, herramientas, WhatsApp, email | Elvin, 5 min | Territorio de lanzamiento, `proveedores.json`, la primera alerta real |
| 4 | **Cuentas de redes creadas** (IG/FB/TikTok/YouTube @resueltopr) con perfil y bio | Elvin (dijo que ya) | Publicar |
| 5 | **Orgánico por Zernio con Nina** (decisión 21/sep; reemplaza al Social Planner de GHL): Elvin conecta Instagram + Facebook en zernio.com → Connections; Nina publica sola 1×/día | Elvin, 5 min | Feed vivo sin tocar nada |
| 6 | **Meta / WhatsApp por Zernio — HECHO 21/sep**: WABA creada, webhook `Agente Resuelto (Railway)` (id `6ab1db310742626d77bad4a6`, eventos message.received + message.sent, HMAC verificado 200/401). Queda: verificación del negocio (documentos de la LLC) para quitar el "Sending limited" y aprobar el nombre visible | — | WhatsApp real; el agente entra por `/webhook/zernio` |
| 7 | **Bori**: usuario `marketing@resueltopr.com`, habilitar anuncios, conectar Meta desde ese usuario | Elvin, 15 min | Que yo monte campañas en pausa |
| 8 | **Abogado**: LLC + encuadre Ley 59 + registro DACO + contratos (plomero, contratista, cliente) | Elvin agenda | Banco, Stripe, ATH Móvil Business, seguro, y vender legalmente |
| 9 | **Agente en Railway — COMPLETO 21/sep**: Zernio ✅ · Anthropic ✅ · **GHL ✅** (crea contacto + oportunidad en Candidatos/Contratistas + nota al registrar) · avisos por WhatsApp al 787-951-7579 (`COORDINADOR_WHATSAPP`, sujeto a ventana de 24 h) · perfil de WhatsApp con logo. Opcional: `TELEGRAM_BOT_TOKEN` + `COORDINADOR_TELEGRAM_CHAT_ID` para avisos sin ventana | — | Todo el sistema en producción |
| 10 | **GoHighLevel** — **hecho 14/sep + 21/sep**: sub-cuenta `Resuelto Home Services LLC` (id `GzQT638S6w7qi4dnZoU9`), integración privada "Agente Resuelto", 4 pipelines, 15 campos, 14 etiquetas; **usuarios**: Yaileen (user, entrevista y contrata plomeros, bono $25/firmado) y Elvin (admin); **3 calendarios creados** (Plomería Metro 2 h · Visita cotización 60 min · Entrevista 20 min, IDs en `agente/data/ghl-calendarios.json`). Agente conectado (contactos + oportunidades + notas). Falta: que el agente agende en el calendario Entrevista | Claude | CRM, agenda y reclutamiento en un solo lugar |

**Para publicar orgánico** bastan 4 y 5 (el 1 ya está) (dos horas de tu parte). **Para anuncios en Bori** hacen falta además 6 y 7. **Para vender** hace falta 8.

## 5b. Arquitectura decidida (14/sep/2026 · WhatsApp cambiado el 21/sep)

**WhatsApp (21/sep): el número 939-247-9234 se conecta por Zernio** (envoltorio de la Cloud API: Embedded Signup desde su dashboard, gratis 2 cuentas / 10K mensajes, inbox web para que un humano tome el chat) → webhook `message.received` → **el agente propio en Railway** (`agente/`, Node + Claude `claude-sonnet-5`, canal `src/canales/zernio.ts`; Meta directa queda como plan B en `whatsapp-meta.ts`). Si un humano contesta desde el inbox, el agente calla 3 h y retoma. Motivo del cambio: es lo más simple (sin app de Meta ni verificación del negocio, que exige la LLC), el agente ya estaba hecho con 16 herramientas, y Zernio sirve de piloto para el chat de los clientes de AutoFlow ($6/mes por cuenta a partir de la 3ª). Decisión de Elvin tras ver el carrusel de @soyenriquerocha (Claude Code + Zernio).

**CRM y agenda en GHL** (sub-cuenta propia de Resuelto): el agente mueve oportunidades en los pipelines por API (`GHL_TOKEN`). Calendarios de GHL = agenda real de trabajos (ventanas de 2 h, cupos por plomero), visitas de cotización y entrevistas. La web sigue en Netlify; sus botones hablan con GHL. IDs en `agente/data/ghl-*.json` y `agente/.env`.

## 6. Próximos pasos
1. Plan de marketing de Fase 0 en `marketing-fase-0.md` (reclutamiento de plomeros y contratistas); las piezas de la cola reciben fecha real cuando Elvin confirme el día de arranque.
2. Elvin hace 1–5 del cuadro; Claude publica el primer post de plomeros el mismo día.
3. Elvin hace 6–7; Claude monta el sprint de `campana-ads-reclutamiento.md` en Bori (en pausa, 4 comandos) y Elvin lo activa el día 1 a las 8 AM.
4. Con 3 plomeros y 2 contratistas Verified → arranca Fase 1 (clientes de plomería) con `kit/campana-clientes.md`.
