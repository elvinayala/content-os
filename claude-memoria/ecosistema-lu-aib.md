---
name: ecosistema-lu-aib
description: Proyecto "ecosistema" (sep/2026): cablear ManyChat + ActiveCampaign + Calendly + Pipedrive para que todo lead quede en un circuito automático; plan de 4 semanas en vault/proyectos/ecosistema/
metadata:
  type: project
---

El 18/sep/2026 Elvin dijo estar **ansioso y estresado desde hace meses** porque Level Up y
AI Borinquen no tienen un ecosistema tipo Hormozi/Ramiro ("entras y no sales"). Pidió plan +
estrategia. Plan escrito en `vault/proyectos/ecosistema/plan-ecosistema.md`.

**Decisiones del plan:**
- Email = **ActiveCampaign** (ya pagado, $79, cuenta de LU desde jul/2026), NO MailChimp aunque
  Elvin lo mencionó. Una cuenta, dos marcas separadas por lista + tag `marca`.
- ManyChat tiene cuentas para ambas marcas, sin flujos. 3 automatizaciones: abridores
  rotativos (Randomizer, 6 variantes/marca), keyword en comentarios (pide email antes del link),
  seguimiento de agenda (+2h/+24h/+72h con corte cuando Calendly avisa).
- ⚠️ El trigger "Follow to DM" de ManyChat (saludo al seguidor nuevo) existe pero está en BETA de
  Meta: 1 vez por seguidor, 1 por persona/semana entre cuentas, y en 2026 no dispara confiable.
  Se deja encendido pero el ecosistema se construye sobre puertas de interacción: historia
  "responde 👋" (Story Reply), keyword en reels, Ref URL en bio, ice breakers, Share to DM.
- Los abridores y secuencias usan SOLO los ángulos núcleo ya definidos (6 LU / 8 AIB en
  vault/estilo/) — Elvin lo pidió explícito el 18/sep. En LU se enruta por avatar (servicios vs coach).
- Pipedrive = fuente de verdad de la etapa; AC y ManyChat obedecen vía webhooks en la app.
- Fase 1 (lo nuevo, prioridad de Elvin): bienvenida 5 emails, newsletter semanal jueves 8 AM
  ("El Sistema" LU / "Tu equipo digital" AIB, nombres propuestos), lead→agenda, pre-llamada.
  Fase 2: no-show, no-compró, cliente, ex-cliente, inactivo.
- Orden: Level Up completo primero (sem 1-3), AIB se copia en semana 4.

**Why:** es la fuente de estrés #1 de Elvin ahora; los mentores llevan meses señalando que no
usa la base de datos ([[elvin-ceo-perfil]]).
**How to apply:** cualquier pieza nueva (reel, funnel, historia) debe nacer con keyword +
entrega + tag de origen; no proponer herramientas nuevas, cablear las que hay. Ver también
[[quiz-funnels-clickfunnels]]
(hay que publicarlos).

**Auditoría ManyChat AIB (18/sep/2026, en su Chrome):** el plan está EXPIRED (Free, 25
contactos, no envía). El trigger de seguidor nuevo SÍ existe y sigue disparando (contactos
cada pocas horas, 11,780 total, tags Nuevo Seguidor Marzo 7,828 / Junio 1,800). Mensajes
enviados en Pro: 924, ~65% abiertos. **2,444 conversaciones sin leer**: el flujo termina en el
primer mensaje. Level Up es otro login (no está bajo el de AIB, que tiene Scrubs & More y
Master Painting & Roofing). Acción: renovar Pro + archivar visitantes muertos.

**Reglas de voz de Elvin para DMs (ManyChat):** todo en minúscula, sin puntos, frases de
WhatsApp; error ortográfico o acento faltante en ~1 de 4 variantes (nunca en pitch ni link);
Randomizer en cada mensaje; DOLOR PRIMERO (msg 1 "a que se dedica tu negocio", msg 2 saca el
dolor); SIN DOLOR NO SE PROPONE CITA; una variante "soy yo elvin, el ceo, o pensabas q era un
bot"; audios grabados por Elvin según situación; MÁXIMO 4-5 automatizaciones (A1 entrada+dolor,
A2 pitch+link+seguimiento hasta agendar, A3 agendó→que entre, A4 no-show, A5 show). El pitch
textual de Elvin está en el plan §2.4. AIB: preguntar cuántos leads/mes y por dónde llegan;
tocar agentes personalizados y recepcionista de IA.

**Regla de Elvin (18/sep):** automatizaciones CORTAS y encadenadas (3-5 mensajes, luego
"Iniciar otra automatización" o sigue el humano); la IA sin frases de robot.
**Construido 18/sep/2026 en ManyChat de Level Up (Pro, login aparte del de AIB):** 3
automatizaciones: "Saluda nuevo seguidor" (A1: abridor + IA dolor + IA pitch → Iniciar A2),
"A2 link y acompanamiento LU" (link → 1 min → 3 min → 2 h → Iniciar A3) y "A3 seguimiento
agenda LU" (recordatorio → 22 h → cierre + tag no agendo). A2/A3 publicadas sin trigger; A1 (abridores exactos de Elvin → IA saca negocio/dolor → condición "sin dolor" →
IA pitch → condición acepta → link Calendly `levelupmediapr/entrevistas-clone?utm_source=manychat`
→ 1 min → 3 min → 2 h → 22 h con corte por campo `Agendo`). **Guardada como borrador, NO
publicada**: Elvin prueba con Vista Previa y da "Actualizar". Detalle en el plan §Bitácora.
Gotchas: el canvas (constructor de flujos) no renderiza en Chrome para esa cuenta → usar
"Constructor Básico"; el `type` de la extensión se come letras en textareas de ManyChat → usar
form_input; los AI Steps pueden pedir el add-on "Manychat AI" al publicar.

**Regla de Elvin (18/sep noche):** ≥25 abridores distintos y en aleatorio real (Meta marca spam
si repite). **Restricción ManyChat/Meta:** el saludo al seguidor nuevo solo sale "como Respuesta
privada" y después nada hasta que la persona conteste → el AI Step va en una automatización
aparte disparada por "Respuesta predeterminada" con condición tag "esperando respuesta" (A1b).
A1 quedó con 3 aleatorizadores anidados (3×10, "azar cada vez" ON) → 29 mensajes privados;
textos en data/manychat/abridores-level-up.json. Aleatorizador admite hasta 12 ramas.
A1b = "Instagram Default Reply" (Básico → Respuesta predeterminada), borrador: nodo inicial
solo con Retraso 3 s (truco: el básico exige mensaje inicial) → condición tag → quitar tag →
AI dolor → AI pitch → Iniciar A2. Falta que Elvin publique A1 (Actualizar) y A1b (Publicar).
**Operación (18/sep):** "mitad automatización, mitad humano": el chat de Instagram (setter) se
apodera de las conversaciones con audios y follow-up manual; meta 5-10 agendas de Instagram.
Manual en vault/proyectos/ecosistema/manual-chat-instagram.md; Aure (Slack U08HA9QCJBG,
Directora Comercial) es el puente con el chat. Mensajes a Aure: siempre como borrador de Slack.
**Regla (19/sep): SIEMPRE la misma voz en Instagram = Elvin.** Saludos, IA, audios automáticos y
el chat humano hablan como Elvin; el chat reenvía los audios de Elvin, nunca graba con su voz ni
se presenta como otra persona. Banco de 5 audios (por qué la llamada, no agendaste, ya agendaste,
nos vemos mañana, se te complicó) → m4a → ManyChat "Más → Audio" (m4a/wav/aac, 25 MB).


**Email construido (19/sep/2026):** `lib/activecampaign.ts` + cables quiz/Calendly/aprobar-newsletter
en la app (no-op hasta pegar `ACTIVECAMPAIGN_URL/KEY` + `AC_LISTA_*` en .env.local y Vercel);
`scripts/activecampaign.mjs setup|estado|contacto|newsletter`; blueprint en
`data/email-ecosistema/blueprint.json`; **40 emails en borrador** (bienvenida 5, lead→agenda 4,
pre-llamada 3, no-show 3, no-compró 4, newsletter #1 × 2 marcas) en
`vault/proyectos/ecosistema/emails/<marca>/` y en la bandeja (`para: ActiveCampaign`); newsletter
automático: tarea `newsletter-semanal` (mié 9 AM) → bandeja → al aprobar, campaña programada jueves
8 AM en AC. Las automatizaciones se montan en la UI de AC (README en esa carpeta). Pendiente de
Elvin: API key de AC, `setup`, DKIM por marca, montar 3 automatizaciones por marca (Jessica), ManyChat→AC.
ManyChat ya está renovado (Elvin, 19/sep).


**19/sep/2026:** ManyChat de **Level Up** ya tiene el saludo automático a seguidores nuevos (Follow-to-DM) ACTIVO y funcionando — confirmado por Elvin. La campaña Follow Me (vault/proyectos/level-up/campana-follow-me-meta.md) alimenta esa puerta; no pedirle a Elvin que lo active.
**ActiveCampaign (21/sep/2026):** cuenta levelupmediapr17748 reactivada y pagada; API en
.env.local + Vercel, deploy hecho, setup corrido (listas 8/9/10). Tiene 2,484 contactos de julio
en listas 5/6/7 (ya etiquetados por etapa). BLOQUEO: dominio levelupmediapr.net "Not
authenticated" (DKIM/SPF) → DNS en domain.com, lo hace Elvin a mano (modal Entri no automatizable).
Al Nico/ronda: si AC devuelve 503 tras reactivar, reintentar; el conteo por tagid tarda en refrescar.
**21/sep tarde — las 10 automatizaciones YA están montadas sin Jessica** (Elvin: "ya pagué completa,
deja el ecosistema listo" / "sin Jessica"): armadas con el asistente de IA de AC + emails
reemplazados por API (`scripts/activecampaign/cargar-secuencia.mjs`). IDs: 3-7 LU (bienvenida,
lead-agenda, pre-llamada, no-show, no-compro), 8-12 AIB en el mismo orden. Triggers por tag
segmentados por lista (LU 4-7 / AIB 9-12). Gotchas: campañas del asistente nacen `status:0`
(draft) → PUT campaigns/{id} {status:1,type:"single",seriesid}; campaignMessages con
messageid:0 → PUT campaignMessages/{id}; el asistente a veces cambia el trigger a "daily";
la instancia se satura con llamadas en paralelo → una a la vez. Los contactos viejos (listas
5/6/7) quedaron etiquetados solo parcialmente (job cortado). **Las 10 ACTIVAS y probadas e2e (21/sep 4:30 PM):
contacto en lista LU → Bienvenida → email 1 salió en 1 min.** Falta DNS (Elvin): LU en domain.com
CNAME `em-4160056`→`cmd.emsend1.com` (los DKIM ya están); AIB en GoDaddy 3 CNAME (acdkim1/2 +
em-4160056) + clic al email de verificación en hola@aiborinquen.co. Después: ManyChat→AC nativo.

**ManyChat — dos logins distintos (22/sep/2026):** la cuenta de **Level Up (fb4101136)** NO está en
el login `eayalaperez@pucpr.edu`, que es el que tiene el Chrome de Elvin: ahí solo salen Scrubs &
More PR, **AI BORINQUEN (fb4115932)** y Master Painting & Roofing (fb2966097), y cualquier URL de
fb4101136 redirige. Para tocar A1/A2/A3 de LU hay que iniciar sesión con el otro correo (pedírselo
a Elvin; nunca escribir credenciales por él). La cuenta AIB corre todavía el **"Flujo Seguidores
nuevos" viejo** (LIVE, 9,193 ejecuciones, 2+ abridores) — no el de 25+ aleatorios.

**22/sep noche (con OK de Elvin):** 27 emails re-subidos sin huecos (verificado leyendo AC: 38/38
limpios), recordatorios 2-3 de pre-llamada neutros en el tiempo, campos CITA_FECHA/ISO/CLOSER/ZOOM
(ids 19-22) creados, código desplegado (after() + tags antes de lista + reintentos + campos de cita).
La API de AC NO pausa automatizaciones (PUT status responde 200 y no cambia): se hace en la UI.
Sigue pendiente (necesita que Elvin entre a AC en Chrome): bienvenida que excluya etapa:agendo /
origen:calendly, pre-llamada AIB que no coja leads LU, esperas "hasta CITA_ISO −1 día / −1 h", y
recuperar las agendas futuras (tags + lista) sin reenviar a quienes ya tuvieron llamada.

**Regla de Elvin (22/sep): Level Up y AI Borinquen NO se mezclan.** El Calendly conectado
(org levelupmediapr@, closers Roger y Juan David @levelupmediapr.net) es SOLO de Level Up; AIB
tiene su propio Calendly (calendly.com/aiborinquen), todavía sin conectar. Yo había clasificado
"closer Juan David → AIB" y metí 5 leads de LU (incl. vicente@vicentebaez.com, cliente LU) en la
lista/secuencias de AIB → corregido en código (marca solo por tipo de evento, nunca por closer) y
limpiados por API. Elvin cree que cada marca tiene su propia cuenta de AC; la única que existe
en el repo es levelupmediapr17748 (dos listas). Preguntarle antes de asumir.

**23/sep — CORRECCIÓN DE ELVIN: cada marca tiene su propio Calendly Y su propia cuenta de AC.**
Yo había montado AIB (lista 9 + automatizaciones 8-12) DENTRO de la cuenta de LU porque solo tenía
esa; eso causó que agendas de LU cayeran en "AIB · Pre-llamada". Código ya separado por marca
(`ACTIVECAMPAIGN_URL_AIB/KEY_AIB`; sin ellas AIB no escribe en ningún AC). Falta: que Elvin pase la
cuenta de AC de AIB, montar ahí lo de AIB, y apagar/borrar las automatizaciones 8-12 y la lista 9
de la cuenta de LU (UI). Emails bloqueados desde 22/sep 12:54 PM por dominio sin autenticar.

