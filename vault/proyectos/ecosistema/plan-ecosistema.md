---
fecha: 2026-09-18
fuente: manual
unidad: level-up, ai-borinquen
tags: [ecosistema, email-marketing, activecampaign, manychat, pipedrive, calendly, proyecto]
estado: plan aprobado por escribir → en ejecución
---

# Ecosistema (Level Up + AI Borinquen): "entras y no sales"

**El problema que Elvin nombró (18/sep):** ansiedad porque no hay ecosistema. Hay piezas
sueltas (Calendly, Pipedrive, ActiveCampaign, ManyChat, quiz funnels, historias) pero nadie
que entra queda *atrapado* en un circuito que lo siga solo. Referencia: Hormozi, Ramiro.

**La definición que vamos a usar:** un ecosistema es un circuito donde **toda entrada
captura identidad** (email + WhatsApp), **etiqueta origen e intención**, y **cae en una
automatización cuyo único trabajo es mover a la persona al siguiente paso**, sin que un
humano se acuerde. Y donde el que sale (no agenda, no show, no compra, se va) **vuelve a
entrar** por otra puerta. Si una pieza no captura identidad o no etiqueta, no es parte del
ecosistema, es un post.

---

## 0. Lo que YA existe (no se reconstruye, se cablea)

| Pieza | Estado | Dónde |
|---|---|---|
| ActiveCampaign (LU) | Cuenta activa desde jul/2026, plan $79 (3 usuarios: Elvin, Carilin, Jessica). Listas cargadas a mano, campañas sueltas. Twilio migrado (SMS/WhatsApp). | [[entidades/email-marketing]] · [[reuniones/2026-07-13-tutorial-email-marketing]] |
| ManyChat | Cuentas creadas para ambas marcas. Sin flujos vivos. | — |
| Calendly → Pipedrive CLOSERS | **En vivo.** Cada cita cae como deal en "Llamada agendada" con closer, UTM, reagendas y cancelaciones. | `app/api/calendly/route.ts` · [[nabus-director-comercial]] |
| Quiz funnels (Diagnóstico de Crecimiento LU / Diagnóstico de Automatización AIB) | Construidos en ClickFunnels 2.0, conectados a Pipedrive (pipelines 12 y 3). **Sin publicar.** | `demos/auditorias/README.md` |
| Embudo de DM por historias | Diseñado (6 formatos, copy listo). Manual: Elvin contesta el DM. | [[proyectos/embudo-dm-historias]] |
| Emails semanales por lista | El equipo (Sofi/Lauti/Cami) produce ~40 opciones/semana en 4 listas; Elvin aprueba 7; Jessica los carga. | `/emails-listas` |
| Pipedrive | 2 cuentas (levelupmedia2 y aiborinquen). Pipelines: CLOSERS, diagnósticos, etc. Es la **fuente de verdad del estado del deal**. | `lib/agencias.ts` |

**Diagnóstico en una línea:** tenemos captura (Calendly, quiz) y tenemos CRM, pero
**ninguna captura dispara una secuencia**, y **nada de lo que pasa en el CRM cambia lo
que le llega a la persona**. Ese es el hueco. No es "montar MailChimp"; es cablear.

> Decisión: **ActiveCampaign, no MailChimp.** Ya está pagado, tiene automatizaciones
> reales (MailChimp es más débil ahí), tiene SMS/WhatsApp y API. Una sola cuenta para las
> dos marcas, separadas por **lista + tag `marca`** y con dominio de envío propio por marca
> (levelupmediapr.net / heybori.ai o el de AIB). Cuando pasemos de ~2,500 contactos se
> revisa el plan.

---

## 1. La arquitectura (igual para las dos marcas)

```
ENTRADAS                    CAPTURA + ETIQUETA            NUTRICIÓN            VENTA           SALIDA → REENTRADA
─────────                   ──────────────────            ─────────            ─────           ──────────────────
Reel "comenta X"  ─┐                                                                          
Historia botón DM  ├─ ManyChat ─► pide email/WhatsApp ─► ActiveCampaign ─► secuencia ─► Calendly ─► Pipedrive
Seguidor nuevo    ─┘   (abridores)   tags: marca/origen/intención   (bienvenida)   (agenda)   (CLOSERS)
Quiz funnel (CF)  ────────────────────────────────────► AC + Pipedrive ─► lead→agenda ──┘        │
Lead Ad (Meta)    ────────────────────────────────────► AC + Pipedrive ─► lead→agenda ──┘        │
Calendly directo  ────────────────────────────────────► AC (tag agendó) ─► pre-llamada ──────────┘
                                                                                                  ▼
                                                    Pipedrive cambia stage ─► tag en AC ─► lista nueva:
                                                    no-show · agendó-no-compró · cliente · ex-cliente · inactivo
                                                                    └─► cada lista tiene SU secuencia y vuelve al circuito
```

Reglas del sistema:

1. **Una identidad, un contacto.** Todo entra a ActiveCampaign por email (y WhatsApp como
   campo). ManyChat y Pipedrive guardan el mismo email. Sin email no hay secuencia, así que
   **ManyChat pide el email antes de dar el link**.
2. **Cuatro tags en cada contacto:** `marca:lu|aib`, `avatar:servicios|coach` (solo LU), `origen:reel|historia|seguidor|quiz|leadad|calendly|referido`,
   `etapa:lead|agendo|noshow|no-compro|cliente|ex-cliente|inactivo`. La `etapa` la manda
   Pipedrive, no una persona.
3. **Una secuencia por etapa, y solo una activa a la vez.** Cambiar de etapa saca de la
   secuencia anterior y mete en la nueva (AC lo hace con "Goal" + "End automation").
4. **Todo CTA de nutrición apunta al mismo lugar:** el Calendly de la marca (rota entre
   closers) con `utm_source` = nombre de la secuencia. Así el deal en CLOSERS ya dice de
   dónde vino (el webhook lo escribe en "Agendó (utm_source)").
5. **Cadencia total por persona ≤ 2 emails/semana** sumando automatización + newsletter.
   AC tiene "Limit sends" por contacto; se activa.

---

## 2. ManyChat (verificado en la cuenta de AI Borinquen el 18/sep)

### 2.0 Auditoría de la cuenta de AI Borinquen (lo que vi adentro)

| Hallazgo | Dato | Qué significa |
|---|---|---|
| **El plan está EXPIRED** (Configuración → Suscripciones) | Plan gratis, límite **25 contactos**, "el envío de mensajes está restringido cuando alcances el límite". Aviso arriba: "Renew Subscription". | **Esta es la razón por la que el saludo dejó de salir.** No es Meta, no es la beta: la cuenta cayó a Free y Free no envía. |
| El trigger "El usuario sigue tu cuenta" **sigue disparando** | Flujo "Flujo Seguidores nuevos" en LIVE. Contactos nuevos entrando cada pocas horas (el último hace 4 h). Tags: Nuevo Seguidor Marzo 2026 = 7,828 · Junio 2026 = 1,800. | La cuenta SÍ tiene el trigger de seguidor nuevo (beta de Meta) y funciona. Al renovar Pro, vuelve a enviar. |
| Lo que sí se envió cuando estaba en Pro | 924 mensajes (3 variantes del Randomizer, 297/316/311), **~65% abiertos**, 0% clic (no había link). | El abridor funciona: 2 de cada 3 lo leen. El formato de Elvin (minúscula, "cuentame, qué tipo de negocio tienes?") ya está probado. |
| **2,444 conversaciones sin leer** en la Bandeja | El flujo termina en el primer mensaje. Todo el que contestó quedó ahí. | **El hueco más grande.** La gente respondió y nadie siguió. El abridor sin segundo mensaje es una fuga. |
| 11,780 contactos en total | Casi todos "Visitante" (siguieron, no escribieron). | Base enorme sin email ni teléfono. ManyChat solo puede reactivarlos dentro de 24 h de su última interacción, así que hay que darles una razón para volver a escribir (historia con "responde 👋", keyword en reel). |
| Cuentas bajo este login | AI Borinquen (Free), Scrubs & More PR (Free), Master Painting & Roofing (Pro). **Level Up no está aquí**, es otro login. | Level Up se audita aparte cuando Elvin entre. |

**Acción inmediata (Elvin):** renovar Pro en la cuenta de AI Borinquen. Con ~12K
contactos el precio de ManyChat Pro sube por contacto: conviene **archivar** los
"Visitante" de marzo que nunca escribieron (Acciones masivas) y quedarse con los
que interactuaron, para pagar por contactos vivos.

### 2.1 Lo que pasó con el saludo al seguidor nuevo (contexto general)

El trigger "Follow to DM / Say hi to new followers" está en **beta de Meta**: Meta decide qué
cuentas lo tienen, dispara **una sola vez por seguidor**, permite **un mensaje de este tipo
por persona por semana** entre todas las cuentas, y en 2026 hay muchos reportes de fallas.
En AI Borinquen **sí está y sí dispara** (ver 2.0); lo que lo apagó fue el plan. Se usa
como una puerta más, no como la única.

Fuentes: [Follow to DM (BETA) — ManyChat Help](https://help.manychat.com/hc/en-us/articles/23096654243740-Follow-to-DM-on-Instagram-Say-Hi-to-New-Followers-BETA) ·
[reportes de que no dispara](https://community.manychat.com/general-q-a-43/instagram-new-follower-welcome-automation-is-live-but-not-triggering-tried-everything-8245)

### 2.2 Las puertas: todas caen en la MISMA automatización de entrada

Regla de Meta: ManyChat solo escribe a quien interactúa primero. Cada puerta es un trigger
distinto, pero **todas desembocan en el mismo flujo** (A1). Así nadie se escapa.

| Puerta | Trigger de ManyChat | Dónde la ponemos |
|---|---|---|
| Te sigue | Follow to DM (beta, activo en AIB) | Automático |
| Responde una historia (texto o emoji) | Story Reply | Historia diaria "¿nuevo por aquí? responde con 👋" |
| Comenta un reel con keyword | Post & Reel Comments | Todos los reels + el reel fijado |
| Toca un link que abre el DM (`ig.me/m/usuario?ref=X`) | Ref URL | Bio, sticker de historias, emails, WhatsApp, QR |
| Abre el DM y toca un botón | Conversation Starters | 3 botones de entrada |
| Escribe cualquier cosa | Default Reply / keyword | Automático |
| Comparte un reel / te menciona / comenta en un Live | Share to DM / Story Mention / Live | Automático |
| Toca un anuncio que abre DM | Instagram Ads | Campañas click-to-DM |

### 2.3 Reglas de voz de Elvin para TODO lo que sale por DM (obligatorias)

1. **Que no suene a robot.** Todo en **minúscula**. Sin puntos finales la mayoría de las veces.
   Frases cortas, como WhatsApp. Un "jaja", un "🙏", un "ok" suelto.
2. **Errores a propósito, de vez en cuando.** En ~1 de cada 4 variantes: un acento que falta
   ("cuentame", "que tipo"), una "q" por "que", una letra comida. **No siempre.** Nunca en
   el pitch ni en el link.
3. **Randomizer en cada mensaje**, no solo en el primero. 4-6 variantes que cambian
   saludo, orden y una palabra. Estructura fija, texto vivo.
4. **Dolor primero, rápido.** Mensaje 1 abre ("a que se dedica tu negocio?"), mensaje 2
   saca el dolor. **Si no hay dolor, no se propone cita.** Se le da valor y queda en la base.
5. **Una variante dice quién habla:** "soy yo elvin, el ceo. o pensabas q era un bot? jaja".
6. **Audios.** Elvin graba 6-8 audios cortos (20-30 s) que ManyChat manda según la
   situación: bienvenida, "te explico lo que hacemos", "por qué la llamada", "vi que no
   agendaste", "nos vemos mañana". Un audio vale por tres textos.
7. **Máximo 4-5 automatizaciones.** Nada de 20 flujos. Las de abajo son todas.
8. **Preguntas de calificación de AIB** (mientras conversa, no de golpe): cuántos leads le
   llegan al mes, por dónde (llamadas, WhatsApp, Instagram, formulario), quién los contesta
   hoy, qué se le queda sin contestar. Con eso se construye el demo personalizado.
9. **Temas de AIB que siempre se tocan:** agentes personalizados para lo que el negocio
   necesite (no "un chatbot"), la **recepcionista de IA** para profesionales, y los ángulos
   núcleo de [[estilo/ai-borinquen]] (speed to lead, noche y finde, el humano falla,
   danos 7 días, digitalizarse).

### 2.4 Las 5 automatizaciones (y no más)

**A1 · Entrada + dolor** (todas las puertas caen aquí)
- Pausa 3-8 min (random) → **Mensaje 1, abridor** (Randomizer):
  - "buenas, gracias por seguirnos. cuentame, a que se dedica tu negocio?"
  - "hola! vi que nos seguiste. que tipo de negocio tienes?"
  - "gracias por el follow 🙏 a que te dedicas?"
  - "soy yo elvin, el ceo. o pensabas q era un bot? jaja. cuentame a que se dedica tu negocio"
  - "buenas! que tipo de negocio tienes? te pregunto para ver si te puedo ayudar en algo"
  - "hola, gracias por seguirnos. como va tu negocio hoy?"
- Espera respuesta (hasta 24 h). Si no responde → tag `sin-respuesta`, fin (vuelve a
  entrar por otra puerta). Si responde → tag `respondio` + guarda el rubro en campo
  `negocio`.
- **Mensaje 2, el dolor** (Randomizer, adaptado al rubro con IA de ManyChat o con ramas
  por keyword: clínica / oficina / taller / tienda / servicios):
  - "ok. y hoy en dia que es lo que mas te esta costando, que te lleguen clientes o atenderlos?"
  - "y quien te contesta los mensajes y las llamadas cuando tu no puedes?"
  - "mas o menos cuantos leads te llegan al mes? y por donde, whatsapp, llamadas, instagram?"
  - "y eso como lo estas manejando hoy, tu solo o tienes a alguien?"
  - "cuantos mensajes se te quedan sin contestar a la semana, si tuvieras que adivinar"
- Espera respuesta. **Rama sin dolor** ("todo bien", "solo mirando", no contesta) → audio
  corto de Elvin "te explico en 20 segundos lo que hacemos" + tag `nutrir` → ActiveCampaign
  (si dio email) o queda para la próxima historia. **No se propone cita.**
- **Rama con dolor** → tag `dolor:<tipo>` (velocidad / noche / nadie contesta / seguimiento /
  volumen) → pasa a **A2**.

**A2 · Pitch + link + acompañamiento hasta que agenda**
- **Mensaje 3, el pitch** (4 variantes, tono de Elvin, sin errores):
  - "mira, conocemos bien tu industria y podemos ayudar a tu empresa a escalar y a simplificar ese proceso con inteligencia artificial. que te parece si agendamos una videollamada donde te explico paso a paso como funciona nuestro sistema y te muestro un demo personalizado para tu caso?"
  - "te soy honesto, eso que me dices es justo lo que resolvemos. te propongo algo: una videollamada corta, te muestro como funciona el sistema y te armo un demo con tu negocio. te sirve?"
  - (audio de Elvin: "por qué la llamada") + "te parece si lo vemos en una videollamada? te muestro un demo hecho para tu caso"
  - "lo que te esta pasando lo hemos resuelto en negocios como el tuyo. te propongo una videollamada de 20 min, te explico el sistema paso a paso y te enseño un demo personalizado. como lo ves?"
- Espera respuesta. Si dice que sí (o cualquier cosa que no sea un no) →
- **Mensaje 4, el link:** "perfecto. te comparto el enlace, aqui tienes la disponibilidad 👇 [Calendly con utm_source=manychat]" · variantes: "dale. aqui esta mi calendario, escoge el horario que mejor te quede" / "te lo dejo aqui, mira la disponibilidad y separa el que te convenga".
- **Mensaje 5 (+1 min):** "dejame saber una vez hayas agendado, para revisar el sistema y que todo este listo para nuestra demo" · "avisame cuando agendes y voy preparando tu demo".
- **Mensaje 6 (+3 min):** "estare aqui unos minutos mas pendiente" · "por aqui estoy un ratito mas por si tienes alguna duda".
- Tag `link_enviado`. **Cuando responde que agendó** (o Calendly avisa, ver §4) → tag
  `agendo` → **Mensaje 7:** "excelente, nos vemos pronto en la llamada. estare preparando todo para mostrarte como vamos a ayudarte especificamente en tu caso" → pasa a **A3**.
- **Si no agenda:** +2 h "pudiste ver el calendario?" · +24 h audio "vi que no agendaste" +
  caso con número + "te separo hoy o mañana?" con 2 botones · +72 h "te dejo de escribir por
  aqui para no molestar. si en algun momento quieres que revise tu caso, este link queda
  abierto" → tag `no-agendo` → ActiveCampaign sigue por email (§3.3).

**A3 · Agendó → que ENTRE a la llamada (el otro 50%)**
- Trigger: tag `agendo` (lo pone la respuesta o el webhook de Calendly).
- Al momento: confirmación con lo que va a ver ("en la llamada te muestro el demo con tu
  negocio, trae a la mano cuantos leads te llegan al mes y por donde").
- Día antes: audio de Elvin "nos vemos mañana" + una pregunta que lo comprometa
  ("que es lo primero que quieres que el agente resuelva?").
- 1 h antes: "en una hora nos vemos, este es el link. si se te complica avisame y lo
  movemos" (mejor que reagende a que no aparezca).
- 10 min antes: "ya estoy conectando 👋".
- Cierre según resultado (Pipedrive → app → tag): `show` o `noshow`.

**A4 · No show**
- +15 min: "te esperé en la llamada, se te complico? no pasa nada, aqui tienes el link para
  reagendar" (tono cero reproche).
- +1 día: audio "no te preocupes, pasa. lo importante es que lo veas" + caso.
- +3 días: "última por aquí, te dejo el link abierto" → tag `noshow-frio` → email.
- Máximo 3 toques. Después ActiveCampaign.

**A5 · Show → post-llamada**
- +1 h: "gracias por el tiempo hoy. te resumo lo que vimos: [campo `resumen` que llena el
  closer en Pipedrive]. cualquier duda por aqui estoy".
- +1 día: pieza de prueba social del rubro (caso o demo grabado).
- +3 días: "que decidiste? si necesitas que te aclare algo, dime".
- Si compra → tag `cliente` → onboarding por email. Si no → `no-compro` → ActiveCampaign
  (objeciones reales + beca).

**Lo que NO se hace:** una automatización por reel. Cada reel usa A1 con su keyword y su
entrega; la entrega es un paso más dentro de A1, no un flujo nuevo.

### 2.5 Level Up: mismo esqueleto, otro contenido
Mismas 5 automatizaciones. Cambia el router del mensaje 1 ("tienes un negocio/clinica o
eres coach/consultor?") y los dolores del mensaje 2 (referidos, botón azul, contestar tarde,
volumen, "publicas por publicar"). Los abridores por ángulo de LU quedan en el anexo A del
plan. Se audita la cuenta de ManyChat de Level Up cuando Elvin entre (es otro login).

---

## 3. ActiveCampaign: las secuencias con los ángulos que ya tenemos (fase 1 = lo nuevo)

Elvin pidió enfocar en lo **nuevo**. No-show, no-compró y ex-clientes quedan diseñados
para fase 2. Cada email usa **un** ángulo núcleo; los ángulos se rotan, no se inventan.

### 3.1 Bienvenida — 5 emails en 10 días (por marca, y en LU por avatar)

**Level Up**

| Día | Ángulo | Email | CTA |
|---|---|---|---|
| 0 | Historia de Elvin + entrega | "Lo que pediste + quién soy": de fantasma a dos agencias de $100K/mes. Entrega lo prometido. | Responde con tu negocio en una línea |
| 2 | Referidos frágiles (núcleo 1) | "Si tu plan es que alguien te recomiende, no tienes un plan". Coach: "Publicas por publicar" (ángulo 5). | Ver el reel más fuerte |
| 4 | De $X a $Y ¿cómo? (ángulo 1) | Servicios: Tinos $30K→$100K / Coralis $25K→$70K. Coach: Yadiel $5K→$40K. El sistema de 6 pasos detrás. | Agendar (`utm_source=bienvenida`) |
| 7 | IA + estrategia (núcleo 5) + para quién NO es | "La IA no reemplaza al estratega, lo hace 10x más rápido". Tráfico + sistema de ventas + automatización. Filtro honesto. | Diagnóstico de Crecimiento |
| 10 | Plata en la mesa (avatar núcleo 3) + cupos | "¿Cuánto dinero estás dejando en la mesa este mes?" con el número de su diagnóstico si lo hizo. Cupos de la semana. | Agendar |

**AI Borinquen**

| Día | Ángulo | Email | CTA |
|---|---|---|---|
| 0 | Historia + entrega | Quién es Elvin, por qué unió marketing + IA ("la única persona a la que no le puedo decir que se aniche", Ramiro). | Responde: ¿quién contesta tus leads hoy? |
| 2 | Speed to lead (núcleo 1, ángulo 7) | "El 78% le compra al primero que responde". Dato + caso del terapista. | Ver el reel de Camila |
| 4 | El humano falla, la IA no + noche/finde (núcleos 3 y 4) | Historia real de un lead perdido a las 9 PM. | Oír la llamada de Camila / agendar |
| 7 | Doble dolor (7b) + Danos 7 días (núcleo 7) | "Con marketing resuelves UN problema; con IA resuelves DOS". Los 2 sistemas. Para quién no es. | Diagnóstico de Automatización |
| 10 | Digitalizarse (núcleo 8) + cupos | "Si todavía manejas el negocio en Excel…" Aterrizado en horas/semana. Cupos. | Agendar |

### 3.2 Newsletter semanal — jueves 8:00 AM PR, 1 broadcast + la automática = 6-8/mes
- Nombre propio: LU **"El Sistema"** · AIB **"Tu equipo digital"** (propuesta).
- Estructura: 1 ángulo núcleo (rotación fija de 6 en LU / 8 en AIB, así en 2 meses se
  machacaron todos), 1 caso o dato de la semana, 1 CTA. Elvin pidió varios de
  "digitalizarse" por lote en AIB: 1 de cada 3 newsletters.
- **Ya lo produce `/emails-listas`** (lista `newsletter-general`). Ajuste al skill: agregar
  la marca AIB, la lista `bienvenida` y obligar el campo `angulo` con el nombre del núcleo.

### 3.3 Lead → agenda — 4 emails en 7 días (entró y NO agendó)

| Día | Level Up | AI Borinquen |
|---|---|---|
| 0 | Resultado del diagnóstico + link (si vino por quiz) o el caso de su avatar | Igual |
| 1 | "Los ads no funcionan para mi nicho" (núcleo 6): objeción de frente | "Eso es un robot que no entiende a mis clientes" (ángulo 9, formato yapping) |
| 3 | Botón azul vs estrategia (núcleo 2) + caso | "No te entregamos el CRM en blanco" (ángulo 12) + caso |
| 6 | "No necesitas más pacientes, pierdes los que ya te llegan" (ángulo 2) + cupos | Noche y fin de semana (núcleo 4) + Danos 7 días + cupos |

Cada CTA con `utm_source=lead-agenda`. Se corta con tag `agendo`.

### 3.4 Pre-llamada — sube el show rate (la de mayor ROI)
Trigger: `agendo`. Ángulo fijo: **"asume que el lead no te conoce"** (6b): confirmación con
qué esperar + video de Elvin; 24h antes: "más de 50 negocios en PR, contratos, 12 meses
operando" + caso del avatar; 1h antes: SMS/WhatsApp por Twilio con el link. El show rate
por closer sale de Pipedrive CLOSERS para Nabus.

### 3.5 Fase 2 (diseñadas, no montadas)
- `no-show` (3 emails + WhatsApp), `no-compro` (objeciones reales de
  [[estilo/objeciones-reales]] + beca $250 1 vez cada 3 meses), `cliente` (onboarding +
  testimonio día 30 + referido día 60), `ex-cliente` (win-back 45/90 días), `inactivo`.
- Las listas ya existen en `/emails-listas`; cuando Pipedrive mande la etapa pasan de
  campañas manuales a automatizaciones.

---

## 4. Los cables (lo que Claude construye en la app)

La app ya habla con Calendly y con Pipedrive. Se le agrega ActiveCampaign y ManyChat:

| Cable | Qué hace | Estado |
|---|---|---|
| Calendly → AC + ManyChat | Al `invitee.created`: upsert contacto en AC (email, teléfono, tags `marca`, `etapa:agendo`, `closer`), dispara pre-llamada; en ManyChat pone tag `agendo` para cortar el seguimiento. Cancelación → `etapa:cancelo`. | Nuevo (extiende `app/api/calendly/route.ts`) |
| Quiz funnel → AC | Al terminar el diagnóstico: contacto en AC con `origen:quiz`, `etapa:lead`, campo con el cuello de botella detectado → secuencia lead→agenda personalizada por resultado. | Nuevo (extiende `app/api/auditoria/route.ts`) |
| Pipedrive → AC | Webhook de Pipedrive por cambio de stage (NO SHOW, CLOSED WON, LOST, DON'T QUALIFY) → tag `etapa:*` en AC. Es lo que convierte las "listas" en pipelines vivos. | Nuevo (`app/api/pipedrive/route.ts`) |
| AC → Meta (audiencias) | Export semanal de listas `lead sin agendar` y `no-compro` como Custom Audience; `clientes` como exclusión. Los ads siguen a la misma persona. | Fase 2 (manual al inicio) |
| ManyChat → AC | Nativo (integración de ManyChat). Solo mapear campos y tags. | Config |

Secretos nuevos: `ACTIVECAMPAIGN_URL`, `ACTIVECAMPAIGN_KEY`, `MANYCHAT_TOKEN_LU`,
`MANYCHAT_TOKEN_AIB`, `PIPEDRIVE_WEBHOOK_SECRET`. Ninguno se guarda en el repo.

---

## 5. Más allá de email + chat: lo que hace que "no salgan"

Lo que Hormozi/Ramiro tienen y nosotros no, en orden de impacto:

1. **Un lead magnet con nombre en cada puerta.** Los quiz funnels **hay que publicarlos**
   (class.levelupmediapr.net). Todo reel, historia y bio apunta al diagnóstico, no a "escríbeme".
2. **Retargeting con las listas.** El que entró a AC y no agendó ve anuncios de casos hasta
   que agenda. Costo mínimo, audiencia caliente. (Cable AC → Meta.)
3. **Una escalera de valor visible.** LU: diagnóstico gratis → done-with-you $4K → gestión.
   AIB: diagnóstico → AutoFlow. Shadow Operator: newsletter → Skool $55 → consultoría $3,500.
   Cada secuencia empuja al peldaño siguiente, no al último.
4. **Comunidad/newsletter como "casa".** El newsletter semanal es el mínimo. El Skool de
   Shadow Operator es la versión completa: ahí el lead vive entre compra y compra.
5. **WhatsApp como canal de nutrición, no solo de ventas.** 1 mensaje/semana por Twilio a
   quien abre emails pero no hace clic. AC ya lo tiene.
6. **Loop de referidos y testimonios automatizado** (fase 2, lista `cliente`): día 30
   testimonio, día 60 referido con incentivo. Hoy se pide a mano cuando alguien se acuerda.
7. **Un solo dashboard** con el embudo completo (seguidor → DM → email → agenda → show →
   cierre) por marca y por origen. Sale de AC + Pipedrive; se agrega a `/ceo`.

---

## 6. Plan de 4 semanas

**Roles:** Elvin decide y aprueba copy (30 min/semana, en la bandeja). Jessica carga en AC
y ManyChat. Carilin valida el proceso con el equipo de ventas. Claude (Sofi + equipo)
escribe **todo el copy** y construye los cables. Nabus recibe el reporte de show rate.

| Semana | Entregable | Dueño |
|---|---|---|
| **1 · Fundación (22-26 sep)** | AC: dominio de envío + DKIM por marca, listas `LU` y `AIB`, tags estándar, limit sends 2/sem. ManyChat: conectar a AC, ice breakers, flujo keyword + abridores rotativos **de Level Up**. Publicar el quiz funnel LU. | Jessica (config) · Claude (copy de abridores y respuestas) · Elvin (publicar funnel, aprobar abridores) |
| **2 · Secuencias nuevas** | Copy completo de bienvenida (5), lead→agenda (4) y pre-llamada (3 + SMS) para LU, en la bandeja para aprobar. Cargadas en AC el viernes. Newsletter "El Sistema" arranca el jueves 1/oct. | Claude (escribe) · Elvin (aprueba) · Jessica (carga) |
| **3 · Cables** | Calendly→AC/ManyChat, quiz→AC, Pipedrive→AC en la app y en prod. Prueba de punta a punta con un lead ficticio: comenta → DM → email → agenda → deal → tag. Seguimiento de agenda de ManyChat con corte automático. | Claude (código) · Carilin (prueba con un closer) |
| **4 · AIB + medición** | Replicar todo para AI Borinquen (abridores, secuencias, funnel publicado, newsletter "Tu equipo digital"). Audiencias a Meta. Panel del embudo en `/ceo`. Reporte semanal automático a Slack (jueves) con el embudo por origen. | Claude · Jessica · Elvin |

Después de la semana 4 arranca fase 2 (no-show, no-compró, cliente, ex-cliente, referidos).

---

## 7. Cómo sabemos que funciona (KPIs semanales, por marca)

| Métrica | Fuente | Meta primer mes |
|---|---|---|
| Emails nuevos capturados / semana | AC (tag `origen`) | 50 LU · 30 AIB |
| % DM → email capturado | ManyChat | ≥ 40% |
| % lead → agenda (7 días) | AC goal + Pipedrive | ≥ 15% |
| Show rate | Pipedrive CLOSERS (agendada vs no-show) | +10 pts vs hoy |
| Open / click newsletter | AC | 40% / 4% |
| Unsubscribes | AC | < 0.5% por envío |

Se reportan el jueves junto con el brief del CEO.

---

## Decisiones tomadas en este plan
- ActiveCampaign es la herramienta de email (no MailChimp). Una cuenta, dos marcas.
- Pipedrive es la fuente de verdad de la etapa; AC y ManyChat obedecen.
- Sin email no hay link: ManyChat pide el email antes de entregar.
- Fase 1 = lo nuevo (bienvenida, newsletter, lead→agenda, pre-llamada). Fase 2 = las listas de salida.
- Primero Level Up entero, después se copia a AI Borinquen (misma arquitectura, otro copy).

## Conexiones
[[entidades/email-marketing]] · [[proyectos/embudo-dm-historias]] · [[estilo/level-up]] ·
[[estilo/objeciones-reales]] · [[estilo/decisiones-negocio]] · [[ceo/mentores]] ·
[[nabus-director-comercial]]

---

## Anexo A · Abridores de Level Up por ángulo (para el mensaje 1-2 de A1, pasar a la voz de 2.3)

| # | Ángulo (fuente) | Idea del abridor |
|---|---|---|
| 1 | Referidos frágiles (LU núcleo 1) | "si mañana se te secan los referidos, cuantos clientes te quedan? cuentame de que es tu negocio" |
| 2 | Botón azul vs estrategia (LU núcleo 2) | "alguna vez le diste a promocionar y no paso nada? ya corres anuncios o todavia no?" |
| 3 | Pierdes leads por contestar tarde (LU núcleo 3, puente a AIB) | "los leads que te escriben hoy, quien los contesta y en cuanto tiempo?" |
| 4 | No es ventas, es volumen (LU núcleo 4) | "cuantos leads nuevos te entran a la semana, mas o menos?" |
| 5 | De $X a $Y ¿cómo? (ángulo 1 de data) | "tinos paso de 30k a 100k al mes con nosotros. tu negocio es de servicios, salud o vendes un programa?" |
| 6 | Publicas por publicar (avatar coach) | "publicas seguido y no te entra un cliente nuevo? vendes coaching, consultoria o un programa?" |
| 7 | "Los ads no funcionan para mi nicho" (LU núcleo 6) | "si alguna vez pensaste que los anuncios no funcionan para lo tuyo, te entiendo. en que nicho estas?" |
| 8 | Plata en la mesa con la data que ya tienes | "tienes una lista de clientes viejos que hace meses no tocas? cuantos clientes has atendido en el ultimo año?" |

---

## Bitácora de construcción

### 18/sep/2026 · Level Up · ManyChat (Pro renovado por Elvin)

**Regla nueva de Elvin (18/sep, noche):** automatizaciones **cortas y encadenadas**. Cada una
hace 3-5 mensajes y llama a la siguiente; después de eso sigue el humano. La IA puede
conversar pero **sin sonar robot** (nada de "entiendo tu situación", "gracias por compartir",
"estoy aquí para ayudarte"; una palabra sola vale: "ok", "dale").

Quedaron **3 automatizaciones** en la cuenta de Level Up:

| Automatización | Estado | Qué hace |
|---|---|---|
| **Saluda nuevo seguidor** (A1, la del trigger Follow to DM) | Borrador guardado sobre la versión LIVE; **falta que Elvin le dé "Actualizar"** | tag → aleatorizador → pausa 10 min → **AI Step 1** abre con uno de los 3 abridores exactos y saca negocio + dolor (máx. 2 preguntas) → si "sin dolor": "ok perfecto, gracias por contarme 🙏 cualquier cosa por aqui estoy" y fin → si hay dolor: **AI Step 2** conecta con el dolor + uno de los 3 pitches de Elvin → si acepta: **Iniciar A2** |
| **A2 link y acompanamiento LU** | Publicada (sin trigger; solo la llama A1) | link Calendly (`levelupmediapr/entrevistas-clone?utm_source=manychat`) → 1 min → "dejame saber una vez hayas agendado…" → 3 min → "estare aqui unos minutos mas pendiente 🙏" → 2 h → si `Agendo` sigue vacío: **Iniciar A3** |
| **A3 seguimiento agenda LU** | Publicada (sin trigger; solo la llama A2) | "oye, pudiste ver el calendario? si quieres te separo yo un horario…" → 22 h → si `Agendo` sigue vacío: cierre suave con el link + tag `no agendo` |

Campos: `negocio`, `dolor`, `acepta_llamada` (nuevos) + `Agendo` (ya existía). Tag nuevo: `no agendo`.
En A1 quedaron pasos "no adjuntos" (mensajes viejos y la cadena larga que se partió); no corren, se pueden borrar.

**Pendiente:**
1. Elvin: probar A1 con "Vista Previa" y publicar con "Actualizar". Puede pedir activar el add-on "Manychat AI" (los AI Steps).
2. Automatización por keyword ("agend", "listo", "ya") → `Agendo = si` + "excelente, nos vemos pronto en la llamada. estare preparando todo para mostrarte como vamos a ayudarte especificamente en tu caso". Corta A2/A3.
3. Cable Calendly → ManyChat (`invitee.created` → set `Agendo` por email) en `app/api/calendly/route.ts`.
4. Sumar las otras puertas (Story Reply, Default Reply, keyword de reels) como automatizaciones cortas que llamen a A1 (el canvas no carga en Chrome; se hace desde el constructor básico).
5. A4 (agendó → que entre), A5 (no show), A6 (show): mismas piezas cortas, arrancan cuando el webhook ponga `Agendo`.
6. Confirmar el Calendly (hoy: Sesión Estratégica del perfil de la agencia). Alternativas: carilin/sesion-estrategica, juandavid/videollamada-por-zoom, roger-arteaga/videollamada-por-zoom.
7. Audios de Elvin cuando los grabe (bienvenida, por qué la llamada, no agendaste, nos vemos mañana).
8. Replicar en AI Borinquen cuando renueve Pro.

### 18/sep/2026 (noche) · A1 rehecha con 29 abridores en aleatorio real

**Regla de Elvin:** mínimo 25 abridores distintos y en aleatorio; si Meta ve el mismo
texto repetido lo marca como spam.

**Restricción confirmada:** el mensaje al seguidor nuevo sale como **"Respuesta privada"**
(único formato que Meta permite sin que la persona haya escrito). Después de ese mensaje no
se puede enviar nada más hasta que la persona conteste. Por eso el AI Step NO puede ir
dentro de A1: va en una automatización aparte que dispara cuando contesta.

**A1 "Saluda nuevo seguidor" (borrador guardado, sin publicar):**
```
Follow → Acciones: tags "nuevo seguidor junio 2026" + "esperando respuesta"
  → Aleatorizador (3 ramas, "elige una ruta al azar cada vez" ON)
     → Pausa 10 min → Aleatorizador #1 (10 ramas, azar cada vez) → 9 mensajes (#9–#17) + 1 rama vacía
     → Pausa 10 min → Aleatorizador #2 (10 ramas) → 10 mensajes (#18–#27)
     → Pausa 10 min → Aleatorizador #3 (10 ramas) → 3 viejos (Enviar mensaje, #1, #2) + 7 nuevos (#28–#34)
  Todos los mensajes: modo "como Respuesta privada", 1 texto, sin siguiente paso.
```
Los 30 textos están en `data/manychat/abridores-level-up.json` (29 cargados; el #30 queda
para la rama vacía de Aleatorizador #1 cuando se edite). Meta permite hasta 12 ramas por
aleatorizador ([doc](https://support.manychat.com/en/support/solutions/articles/36000080590-randomizer)).

**A1b "Instagram Default Reply" (montada, borrador sin publicar) — Automatización → Básico → Respuesta predeterminada:** cuando alguien
escribe y no matchea keyword → Condición: tiene tag "esperando respuesta" → sí: quitar tag +
AI Step dolor (ya sabe a qué se dedica: viene en su primer mensaje) → condición "sin dolor" →
AI Step pitch → Iniciar A2. Si no tiene el tag: nada (sigue el humano en la bandeja).

Pasos huérfanos en A1 (no corren, borrar cuando Elvin publique): AI Step ×2, Condición,
Condición #1–#3, Iniciar Automatización, Acciones #1, Enviar mensaje #3–#8, Pausas #1–#4.

**A1b construida (18/sep, 10:56 PM):** nodo inicial = mensaje vacío con solo un "Retraso 3 s"
(el constructor básico obliga a que el primer paso sea un mensaje; con solo el retraso no
envía nada) → Condición: etiqueta es "esperando respuesta" → SÍ: Acciones (eliminar etiqueta)
→ AI Step dolor (campos negocio/dolor; instrucción: NO saludar ni volver a preguntar a qué se
dedica; máx. 2 mensajes) → Condición dolor contiene "sin dolor" → sí: "ok perfecto, gracias
por contarme 🙏…" / no: AI Step pitch (acepta_llamada) → Condición acepta_llamada contiene
"si" → Iniciar A2. Rama NO de la primera condición: nada (sigue el humano).

**Para activar todo (Elvin, 2 clics):** abrir "Saluda nuevo seguidor" → **Actualizar**; abrir
"Instagram Default Reply" → **Publicar En Vivo**. A2 y A3 ya están publicadas.

### 18/sep/2026 (noche) · Operación "mitad automatización, mitad humano"
Elvin definió la operación: ManyChat abre y calienta; **el chat de Instagram (setter de DMs)
se apodera de las conversaciones** con audios estratégicos y seguimiento manual. Meta: **5 a 10
agendas de Instagram** (orgánico + anuncios que Elvin va a meter pronto). Manual paso a paso
en [[proyectos/ecosistema/manual-chat-instagram]]. Mensaje para Aure (Directora Comercial,
Slack U08HA9QCJBG) quedó como **borrador en su DM** para que Elvin lo envíe; Aure se reúne con
el chat y le entrega el manual.
