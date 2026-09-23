---
proyecto: Resuelto
tipo: plan-campana
fase: 0 · Reclutamiento · Sprint de anuncios
estado: MONTADA EN META (18/sep) · campaña A como borrador en act_1564735818086768 · falta método de pago + activar
actualizado: 2026-09-13
base: "[[marketing-fase-0]] · [[ESTADO]] · [[kit/campana-reclutamiento]] · [[proyectos/campana-contratistas]]"
---

# Sprint de anuncios · Reclutar plomeros y contratistas · $50/día × 7 días

> **Actualización 18/sep/2026:** se montó **directo en Meta** (no por Bori) porque Elvin quiso arrancar al día siguiente. Portafolio propio `Resuelto Home Services LLC` (157965986805918), cuenta `act_1564735818086768`, página Resuelto PR, pixel `28140823722265213` en las 3 landings (PageView · Lead · Contact). Como aún no hay WhatsApp, el objetivo es **Clientes potenciales → conversión Lead en el sitio** (formulario de `/plomeros` → GHL). Campaña A creada: `Resuelto · Plomeros · Leads · Sprint 1` ($30/día) → conjunto `Plomeros · PR · Advantage+ · Lead web` (PR, 25+) → anuncio A1 video 15 s con copy v1, CTA "Enviar solicitud", URL con UTM. Pendiente: tarjeta (Elvin), A2/A3 flyers y campaña B contratistas.
>
> **Campaña WhatsApp (18/sep, borrador):** `Resuelto · Plomeros · WhatsApp · Sprint 1` ($30/día, objetivo Ventas → Destinos de mensajes) → conjunto `Plomeros · PR · Hombres 30+ · Plomería · WhatsApp` (Puerto Rico, edad mínima 25 [tope del control duro de Meta], sugerencia 30–65+, Hombres, intereses Plomería (construcción) · Plumbing Technician (cargo) · The Home Depot · Construction (industry) · Caja de herramientas; ~480–566K) → anuncio W1 video 15 s, copy v1 con CTA a WhatsApp, plantilla de chat de Resuelto (saludo + 3 botones: licencia/aplicar · cómo funciona el pago · zonas). **Falta:** conectar el número de WhatsApp en el conjunto (Destino manual → WhatsApp → Conectar perfil, pide código) y **desmarcar Messenger**, que quedó marcado como destino temporal porque Meta exige al menos uno.

> **Estructura final (18/sep, noche) · $65/día en borrador, aprobada por Elvin ("dale destino a la más plata al video"):** las dos campañas pasaron a **presupuesto por conjunto (ABO)** para controlar cuánto va a cada creativo. Cada campaña tiene 2 conjuntos gemelos (mismo público) con 1 anuncio cada uno:
>
> | Campaña | Conjunto | Creativo | $/día | IDs (conjunto · anuncio) |
> |---|---|---|---|---|
> | Leads · Sprint 1 (`120255016255510029`) | L1 · Video audio · Advantage+ PR 25+ · Lead web | `resuelto-plomeros-15s-audio.mp4` (A1) | $18 | `120255016255490029` · `120255016255500029` |
> | Leads · Sprint 1 | L2 · Flyer $1,950 · Advantage+ PR 25+ · Lead web | `flyers/01-cuanto-ganas.png` 4:5 original (A2) | $12 | `120255018161070029` · `120255018161080029` |
> | WhatsApp · Sprint 1 (`120255016399820029`) | W1 · Video audio · Hombres 30+ PR · Plomería · WhatsApp | video con audio (W1) | $21 | `120255016399830029` · `120255016399840029` |
> | WhatsApp · Sprint 1 | W2 · Flyer $1,950 · Hombres 30+ PR · Plomería · WhatsApp | flyer 01 (W2) | $14 | `120255018289310029` · `120255018289320029` |
>
> Copy, título, descripción, CTA y URL con UTM son idénticos dentro de cada campaña; solo cambia el creativo. Sin imágenes generadas por IA ni "Agregar música" de Meta (se apagó en W2). El flyer se subió a la biblioteca de la cuenta como `01-cuanto-ganas.png` (1080×1350); los recortes 1:1 y 1,91:1 cortaban el titular, así que va en **Original** (feed 4:5) y Meta avisa que no saldrá en algunas ubicaciones — aceptable. **Regla de decisión al día 3:** el conjunto con CPL/costo por conversación ≥ 2× del otro se apaga y su presupuesto pasa al ganador (sin superar $65/día). Pendiente igual: tarjeta, número de WhatsApp en W1 y W2 (y desmarcar Messenger en ambos), Instagram.

> **PUBLICADAS 21/sep/2026 ~22:30 AST.** Las 4 (A1, A2, W1, W2) entraron en revisión de Meta. Lo que hubo que resolver para publicar: (1) el error "Ningún método de pago" era cache de Ads Manager — la Visa •7932 del portafolio se vinculó a la cuenta publicitaria por "Método de pago del negocio" (sin teclear tarjeta); (2) el video 9:16 no cumple 4:5–1,91:1 para el feed de IG — se dejó Advantage+ automático (Meta simplemente no lo sirve ahí) y se publicó con "Intentar publicar elementos con errores"; intentar excluir a mano las ubicaciones de IG generó errores en cascada (#2238294/#2490406/#2490494) porque Explorar/Buscar/Threads dependen del feed — NO volver a hacerlo. Meta impuso **límite de gasto de $50/día** (cuenta nueva): los primeros días el gasto real será ≤ $50, no $65. WhatsApp: W1 y W2 con el 939-247-9234 (WABA `2594942544291294`) como único destino; los chats los contesta el agente propio vía Zernio.



> **22/sep — Reestructura por región (Elvin):** todo a **WhatsApp**, objetivo Ventas, optimización
> **conversaciones**, solo botón de WhatsApp, **$75/día × 7 días**. 7 conjuntos, uno por región, cada uno con
> su flyer sin cifras (`kit/flyers-regiones/`, publicados en `resueltopr.com/flyers/regiones/`):
> Área Metro (San Juan + Bayamón, 9 municipios) $15 · Caguas · Ponce · Arecibo · Mayagüez · Aguadilla ·
> Fajardo $10 c/u. Segmentación por **municipio** (región de Meta), hombres 25-65 + intereses de plomería con
> Advantage+. Saludo del chat: "Hola, soy plomero de <región> y quiero aplicar." Montaje:
> `node scripts/meta-ads/resuelto-regiones.mjs montar [--aplicar]` (idempotente, ids en
> `data/meta-ads/campanas/resuelto-regiones-2026-09.json`). **Campaña de Leads pausada el 22/sep.**
> ⚠️ Bloqueo: el token de Meta (el de Bori) no tiene la página Resuelto PR → Meta rechaza crear conjuntos
> a WhatsApp por API ("tu página no está vinculada a una cuenta de WhatsApp") y no deja clonar W2 (su
> atribución de 7 días ya no se permite). Se monta desde Ads Manager o reconectando Meta en Bori con la página.

> **Para qué existe este documento:** cuando Elvin conecte el usuario de Resuelto en Bori (con anuncios habilitados y Meta conectada), montar esto es correr **4 comandos** (§9) y activar en Ads Manager. Todo lo demás —creativos, copys, públicos, saludo de WhatsApp, reglas de decisión, reporte— ya está decidido aquí.

## 1. La jugada en 10 líneas

- **Objetivo Meta:** Ventas → conversaciones por **WhatsApp** (click-to-WhatsApp). Nada de formularios, nada de Messenger/IG DM.
- **Dos campañas Relámpago de Bori** (1 campaña · 1 conjunto Advantage+ · varios anuncios cada una): **A · Plomeros** y **B · Contratistas**.
- **Presupuesto:** **$50/día** → A $30 · B $20 los primeros 3 días; del día 4 se mueve hacia la que traiga la aplicación más barata. **7 días · tope $350.**
- **Geo:** Puerto Rico completo (la oferta de proveedores es escasa; el territorio se filtra en la conversación, no en el anuncio).
- **Creativos:** 1 video animado de 15 s + 2 flyers por campaña (3 anuncios por conjunto; Meta reparte solo).
- **Aterrizaje:** el WhatsApp de Resuelto. El agente hace la primera criba (licencia/DACO · zona · categorías · disponibilidad) y agenda la videollamada de 20 min.
- **Meta del sprint:** ~55 conversaciones → **~22 aplicaciones** (12 plomeros · 10 contratistas) → 8 entrevistas → **3 plomeros y 3 contratistas en verificación** al día 10.
- **Regla de oro:** el requisito (licencia · DACO) va en la primera línea de todo. Preferimos 10 conversaciones buenas a 40 malas.
- **Cierre:** el día 7 se decide con datos: extender 7 días más con la ganadora, o cortar y volcar el dinero a visitas físicas/referidos (`marketing-fase-0.md` §6).
- **Quién hace qué:** Claude monta en pausa y reporta · Elvin activa (un clic) y hace las entrevistas · el agente atiende 24/7.

## 2. Por qué así (las decisiones)

| Decisión | Alternativa descartada | Razón |
|---|---|---|
| Ventas → WhatsApp | Tráfico a la landing / formulario de leads | Un plomero no llena formularios; escribe. WhatsApp convierte 3–5× mejor con este público y el agente califica al instante |
| Isla completa | Radio 25 km alrededor de Luis | Reclutamos oferta, no demanda. Hay 963 plomeros colegiados en toda la isla; recortar geo encarece el CPM y deja fuera a los buenos de Caguas/Bayamón |
| Advantage+ (Bori) | Intereses manuales | Con $50/día, el algoritmo con señal de conversación gana; los intereses "plomería/construcción" quedan como sugerencia para Elvin si algún día quiere afinar (§5) |
| $30 / $20 | $25 / $25 | Los plomeros son el cuello de botella de la Fase 0 (5 activos para prender clientes) y su pool es 10× menor que el de contratistas: cuesta más llegarles |
| 7 días | 5 días | Meta necesita ~50 eventos por conjunto para salir de aprendizaje. Con $30/día y CPC ~$0.60 se logra hacia el día 4–5. Cortar antes es tirar los primeros 3 días |
| Video + 2 flyers | Solo video | El video da alcance y explica; los flyers con el número grande ($1,950 · $9,000/$12,000) suelen tener mejor tasa de clic en feed. Meta decide el mix |

## 3. Estructura exacta

```
Cuenta publicitaria: Resuelto Home Services LLC (Business Manager propio)
│
├─ Campaña A · "Resuelto · Plomeros · WA · Sprint 1"      objetivo: Ventas (WhatsApp)   $30/día
│    └─ Conjunto Advantage+ · PR · 25–60 · WhatsApp de Resuelto
│         ├─ Anuncio A1 · video  resuelto-plomeros-15s.mp4
│         ├─ Anuncio A2 · flyer  05-ad-meta.png            (el ad Meta de plomeros)
│         └─ Anuncio A3 · flyer  01-cuanto-ganas.png       (el número grande: $1,950)
│
└─ Campaña B · "Resuelto · Contratistas · WA · Sprint 1"  objetivo: Ventas (WhatsApp)   $20/día
     └─ Conjunto Advantage+ · PR · 28–60 · WhatsApp de Resuelto
          ├─ Anuncio B1 · video  resuelto-contratistas-15s.mp4
          ├─ Anuncio B2 · flyer  k5-ad-meta.png
          └─ Anuncio B3 · flyer  k2-nueve-mil.png          (tu pago / lo que cierra Resuelto)
```

Bori publica cada Relámpago como campaña + conjunto + anuncios, **todo en pausa**. Nombres: los pone Bori; Elvin los puede renombrar en Ads Manager si quiere seguir esta convención.

## 4. Creativos (URLs públicas, listas para Meta)

| Campaña | Pieza | Archivo local | URL pública |
|---|---|---|---|
| A | Video 15 s (gancho → tesis → $1,950 → 3 ticks → CTA) | `kit/videos/resuelto-plomeros-15s.mp4` | https://resueltopr.com/videos/resuelto-plomeros-15s.mp4 |
| A | Flyer ad Meta | `kit/flyers/05-ad-meta.png` | https://resueltopr.com/flyers/05-ad-meta.png |
| A | Flyer $1,950 semanal | `kit/flyers/01-cuanto-ganas.png` | https://resueltopr.com/flyers/01-cuanto-ganas.png |
| B | Video 15 s (cotizas gratis → vendemos el proyecto → $9,000/$12,000 → 3 ticks → CTA Verified) | `kit/videos/resuelto-contratistas-15s.mp4` | https://resueltopr.com/videos/resuelto-contratistas-15s.mp4 |
| B | Flyer ad Meta | `kit/flyers-contratistas/k5-ad-meta.png` | https://resueltopr.com/flyers/k5-ad-meta.png |
| B | Flyer $9,000 / $12,000 | `kit/flyers-contratistas/k2-nueve-mil.png` | https://resueltopr.com/flyers/k2-nueve-mil.png |

> ⚠️ **Creativos que todavía contradicen al chat (22/sep).** El flyer `01-cuanto-ganas.png` ($1,950 semanal)
> y el segmento del contador en `resuelto-plomeros-15s.mp4` gritan una cifra que el chat ya no discute
> hasta la entrevista. Antes de activar el sprint, una de dos: (a) **sacarlos del set** y correr A con el
> video recortado + `05-ad-meta.png`, o (b) **regenerarlos** — el flyer se rehace desde su fuente y el video
> tiene su guion editable al lado (`kit/videos/*.edit.jsx`), cambiando el contador por "2 cupos por área".
> Lo mismo aplica a `03-buscamos-10` si se vuelve a usar: hoy el mensaje es **2 plomeros por área**.
> Los creativos de contratistas (B) no tienen este problema: ahí el pago por hitos sí se explica de frente.

Los guiones de los videos (`kit/videos/*.edit.jsx`) están guardados: cambiar un número o una frase y re-renderizar toma 5 minutos. Cuando el dominio apunte, las URLs pasan a `resueltopr.com/...` sin mover nada.

**Nota sobre video en Bori:** el flujo Relámpago de Bori se probó con imágenes. Si al publicar rechaza la URL `.mp4`, se publica con los 2 flyers y Elvin **añade el video como anuncio dentro del mismo conjunto** desde Ads Manager (Duplicar anuncio → cambiar creativo → subir el mp4; 3 minutos). Está en el checklist de §9.

## 5. Públicos

**Lo que Bori configura (Advantage+):** Puerto Rico · 25–60 · colocaciones automáticas (Reels, Stories, Feed FB/IG) · optimización a conversaciones iniciadas.

**Si Elvin quiere afinar a mano en Ads Manager (opcional, no el día 1):**
- A · Plomeros: intereses *plomería, fontanería, Home Depot, herramientas eléctricas, construcción, trabajo autónomo*; comportamiento *propietarios de pequeños negocios*; edad 25–60; hombres y mujeres (no excluir).
- B · Contratistas: intereses *remodelación, construcción, contratista general, cocinas, baños, DACO, materiales de construcción, Masso, National Lumber*; edad 28–60.
- **Exclusiones (ambas):** personas que ya escribieron al WhatsApp de Resuelto (audiencia de "mensajes enviados" de la página, 30 días) para no pagar dos veces por la misma persona.

## 6. Copys (listos para pegar)

Límite de Bori para el texto principal: 500 caracteres. Emojis: máximo 1. Requisito en la primera línea. Tuteo puertorriqueño, sin promesas infladas.

### Campaña A · Plomeros

> ⚠️ **Regla del 22/sep (Elvin):** el anuncio NO promete porcentajes, cifras semanales ni cuándo se paga.
> El chat califica y agenda; **los números se explican en la entrevista** (ver `agente/src/prompt.ts`,
> flujo del plomero candidato). Si el anuncio los grita, el lead llega preguntando justo lo que el chat
> no contesta. Lo que sí se dice: nosotros ponemos los clientes y la publicidad, y **2 cupos por área**.

**Texto principal · versión 1 (días 1–3):**
> Para plomeros licenciados en PR: tú haces la plomería, nosotros hacemos el resto.
> Resuelto te trae los clientes, cotiza y cobra. Tú trabajas y cobras por tu trabajo; sigues con tus clientes propios y no pones un peso en publicidad.
> Estamos tomando 2 plomeros por área. Escríbenos por WhatsApp: te hacemos 4 preguntas y coordinamos la entrevista.

**Texto principal · versión 2 (rotar el día 4 si la 1 no llega a 1.5% CTR):**
> ¿Cansado de cotizar, perseguir y cobrar? Con Resuelto solo trabajas.
> Cliente confirmado, precio cerrado y el cobro lo hacemos nosotros. Requisito: licencia de plomero vigente.
> 2 cupos por área y vamos por orden de llegada. Aplica por WhatsApp y coordinamos la entrevista.

**Titular (si Bori lo pide):** `Plomero licenciado: tenemos tus próximos clientes`
**Descripción corta:** `Tú trabajas, nosotros conseguimos y cobramos · 2 cupos por área`
**Botón:** Enviar mensaje de WhatsApp

### Campaña B · Contratistas

**Texto principal · versión 1:**
> Para contratistas con registro DACO: nosotros vendemos el proyecto, tú lo ejecutas.
> Resuelto consigue al cliente, cotiza, cierra y cobra el depósito. Tú recibes el proyecto con alcance y precio cerrados por escrito, y te pagamos por hitos (40 · 50 · 10). Cero cuotas, cero cotizar gratis, cero leads que "lo van a pensar".
> Pocos cupos por categoría y zona (baños, cocinas, poda primero). Aplica por WhatsApp.

**Texto principal · versión 2:**
> ¿Cotizas gratis y el cliente "lo va a pensar"? Eso se acabó.
> En Resuelto el proyecto llega vendido: depósito cobrado, alcance cerrado, fecha fija. Tú pones la ejecución; nosotros el cliente, el cotizador, la garantía y el cobro. Requisito: DACO vigente.
> Programa Resuelto Verified: pocos por categoría, el que entra se queda con su zona. Aplica por WhatsApp.

**Titular:** `Contratista con DACO: proyectos vendidos, no leads`
**Descripción corta:** `Precio y alcance cerrados · pagos por hitos · cero cuotas`
**Botón:** Enviar mensaje de WhatsApp

## 7. WhatsApp: el primer minuto decide

Bori configura el **saludo** (lo que aparece prellenado cuando la persona toca el botón) y los **botones** (respuestas rápidas). Después responde el agente de Resuelto (o Elvin, si el agente aún no está en producción, con los guiones de `kit/campana-reclutamiento.md` §4 y `proyectos/campana-contratistas.md`).

| | Saludo prellenado (`--saludo`) | Botones (`--botones`) |
|---|---|---|
| **A · Plomeros** | `Hola, soy plomero y quiero aplicar a Resuelto.` | `Tengo licencia vigente` · `¿Cómo funciona?` · `¿En qué zonas están?` |
| **B · Contratistas** | `Hola, soy contratista y quiero aplicar a Resuelto Verified.` | `Tengo registro DACO` · `¿Cómo funciona el pago por hitos?` · `¿Qué categorías buscan?` |

**Lo que hace el agente con un plomero (ya programado en `agente/src/prompt.ts`, reescrito el 22/sep):** pregunta lo básico de dos en dos — nombre · años de experiencia · área · nivel y número de licencia · vehículo y herramientas — y con eso va al grano: reclutamos en toda la isla, nosotros ponemos clientes y publicidad, **2 plomeros por área**, y el siguiente paso es una **entrevista por videollamada de 20 min** que él mismo cuadra por chat. **No da porcentajes ni cuándo se paga**: "el trato completo con números te lo explicamos en la entrevista". Si el plomero insiste una segunda vez, dice el 65% y pago semanal, y vuelve a la entrevista — no queda evasivo dos veces. Registra siempre con `registrar_candidato` (con los años de experiencia). Con contratistas el flujo sigue igual (DACO primero).

**Tiempo de respuesta humano cuando el agente escala:** < 1 hora en horario 8 AM–8 PM. Un candidato que espera 4 horas ya no es candidato.

## 8. Calendario del sprint (7 días)

| Día | Qué pasa | Quién | Señal esperada |
|---|---|---|---|
| **D0** | Montaje en pausa (§9) · revisar en Ads Manager que salgan 2 campañas, 3 anuncios cada una, WhatsApp correcto, saludo y botones · probar el botón desde un celular | Claude monta · Elvin revisa 5 min | Todo en pausa, sin errores de política |
| **D1 (8 AM)** | Elvin **activa** ambas campañas · Claude publica orgánico p01 y k01 el mismo día (Social Planner de GHL) | Elvin · Claude | Primeras conversaciones antes de las 6 PM |
| **D1–D3** | **No tocar.** Aprendizaje. Responder toda conversación en < 1 h · entrevistas el mismo día si se puede | Agente · Elvin | ≥ 6 conversaciones/día en A · ≥ 4 en B |
| **D3 (noche)** | Primer reporte: gasto, CPM, CTR, conversaciones, costo/conversación, aplicaciones con requisito, por anuncio | Claude | Ver §10 para umbrales |
| **D4** | Rebalanceo: presupuesto a la campaña con menor costo por **aplicación válida** (no por clic) · apagar el anuncio peor si su CTR < 0.8% y ya gastó $20 · rotar a copy v2 donde toque | Claude propone · Elvin aplica (2 clics) | Costo/aplicación baja 15–25% |
| **D5–D6** | Dejar correr · seguir entrevistando · pedir referidos a cada entrevistado ("¿a quién más conoces?") | Elvin | Referidos: el canal más barato de todos |
| **D7 (noche)** | Cierre: costo por aplicación y por entrevista por canal · **decisión**: extender 7 días con la ganadora (mismo $50/día), o cortar y pasar a físico/referidos | Claude reporta · Elvin decide | Ver §11 |

## 9. Montaje: los comandos (cuando Bori esté conectado)

**Prerrequisitos (checklist, en orden):**
1. ☑ DNS apuntado: `resueltopr.com` y `www` cargan con SSL (14/sep).
2. ☐ Número de WhatsApp de Resuelto activo y puesto en las 3 landings (`window.RESUELTO*` en `kit/landing/`), y el agente conectado a ese número **o** Elvin listo para contestar a mano.
3. ☐ Usuario `marketing@resueltopr.com` en Bori con **anuncios habilitados** (set-ads) y **Meta conectada** desde ese usuario (página FB de Resuelto + cuenta publicitaria + WhatsApp Business).
4. ☐ Credenciales en `agente/.env`: `BORI_EMAIL`, `BORI_PASSWORD` (y `BORI_URL` solo si no es heybori.ai).

**Paso 1 · Verificar la conexión**
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO/vault/proyectos/plomeria-pr/agente" && npm run bori -- --estado
```
Debe decir `anunciosHabilitados: true` y `metaConectada: true`. Si no, parar aquí.

**Paso 2 · Subir los flyers a Bori (o usar las URLs públicas; ambas valen)**
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO/vault/proyectos/plomeria-pr/agente" && npm run bori -- --subir ../kit/flyers/05-ad-meta.png ../kit/flyers/01-cuanto-ganas.png ../kit/flyers-contratistas/k5-ad-meta.png ../kit/flyers-contratistas/k2-nueve-mil.png
```
Devuelve una URL por archivo (o se usan directamente las de `resueltopr.netlify.app/flyers/...`, que Meta ya puede leer). Los videos van por URL pública directa (§4).

**Paso 3 · Campaña A · Plomeros · $30/día (en pausa)**
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO/vault/proyectos/plomeria-pr/agente" && npm run bori -- --relampago --presupuesto 30 --imagenes "https://resueltopr.com/videos/resuelto-plomeros-15s.mp4,https://resueltopr.com/flyers/05-ad-meta.png,https://resueltopr.com/flyers/01-cuanto-ganas.png" --mensaje "Para plomeros licenciados en PR: tú haces la plomería, nosotros hacemos el resto. Resuelto te trae los clientes, cotiza y cobra. Tú trabajas y cobras por tu trabajo; sigues con tus clientes propios y no pones un peso en publicidad. Estamos tomando 2 plomeros por área. Escríbenos por WhatsApp: te hacemos 4 preguntas y coordinamos la entrevista." --link "https://resueltopr.com/plomeros" --saludo "Hola, soy plomero y quiero aplicar a Resuelto." --botones "Tengo licencia vigente|¿Cómo funciona?|¿En qué zonas están?"
```

**Paso 4 · Campaña B · Contratistas · $20/día (en pausa)** — lleva `--forzar` porque Bori protege contra publicar dos Relámpagos seguidos.
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO/vault/proyectos/plomeria-pr/agente" && npm run bori -- --relampago --forzar --presupuesto 20 --imagenes "https://resueltopr.com/videos/resuelto-contratistas-15s.mp4,https://resueltopr.com/flyers/k5-ad-meta.png,https://resueltopr.com/flyers/k2-nueve-mil.png" --mensaje "Para contratistas con registro DACO: nosotros vendemos el proyecto, tú lo ejecutas. Resuelto consigue al cliente, cotiza, cierra y cobra el depósito. Tú recibes el proyecto con alcance y precio cerrados por escrito, y te pagamos por hitos (40 · 50 · 10). Cero cuotas, cero cotizar gratis, cero leads que lo van a pensar. Pocos cupos por categoría y zona (baños, cocinas, poda primero). Aplica por WhatsApp." --link "https://resueltopr.com/contratistas" --saludo "Hola, soy contratista y quiero aplicar a Resuelto Verified." --botones "Tengo registro DACO|¿Cómo funciona el pago por hitos?|¿Qué categorías buscan?"
```

**Paso 5 · Confirmar y pasar el control a Elvin**
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO/vault/proyectos/plomeria-pr/agente" && npm run bori -- --campanas
```
El comando imprime el `adsManagerUrl`. Elvin entra, revisa (§8 D0) y **activa** las dos campañas el D1 a las 8 AM.

**Si Bori rechaza el `.mp4`:** repetir los pasos 3 y 4 solo con los dos flyers de cada campaña; luego en Ads Manager: abrir el conjunto → duplicar un anuncio → cambiar el creativo → subir el video desde `kit/videos/` → guardar. Queda en pausa como el resto.

## 10. Lo que se mide (y los umbrales)

Benchmarks de Meta en PR para click-to-WhatsApp con creativo decente (los uso para juzgar, no para prometer):

| Métrica | Esperado | Alerta (actuar en D4) | Cómo se lee |
|---|---|---|---|
| CPM | $4–8 | > $12 | Si está alto y el CTR bien, es el público; si CTR también bajo, es el creativo |
| CTR (todo) | ≥ 1.5% video · ≥ 1.2% flyer | < 0.8% con > $20 gastados | Se apaga ese anuncio |
| Costo por conversación iniciada | A ≤ $6 · B ≤ $5 | > $10 | Cambiar copy a v2 y revisar el saludo |
| Conversación → aplicación válida (con licencia/DACO) | ≥ 40% | < 25% | El problema es el mensaje: subir el requisito de tamaño en el creativo |
| **Costo por aplicación válida** | **A ≤ $15 · B ≤ $12** | > $30 | La métrica que manda el presupuesto del D4 |
| Aplicación → entrevista hecha | ≥ 50% | < 30% | El problema es la velocidad de respuesta humana |
| Costo por verificado (a 14 días) | ≤ $60 | > $150 | Umbral de `marketing-fase-0.md` §6: se apaga el canal |

**Proyección del sprint con $350:** ~60,000 impresiones · ~900 clics · ~55 conversaciones · **~22 aplicaciones válidas** · ~10 entrevistas · 4–6 en verificación. Si sale la mitad, sigue siendo más barato que cualquier bolsa de empleo.

**Cómo reporto:** D3 y D7 por escrito (y a diario si algo se sale de umbral). Hoy Bori no expone métricas por API, así que el dato sale de `--campanas` más un pantallazo de Ads Manager que Elvin manda al chat; en 5 minutos devuelvo la lectura y la acción concreta.

## 11. Reglas de decisión (para no discutir con datos delante)

1. **Un anuncio** con > $20 gastados y CTR < 0.8% → se apaga. Sin excepciones ni "dale un día más".
2. **Una campaña** con costo por aplicación válida > 2× la otra al D4 → pierde $10/día a favor de la otra. Al D6, si sigue igual, pierde otros $10.
3. **Conversaciones sin licencia/DACO > 50%** → el creativo está atrayendo al público equivocado: se cambia al copy v2 (requisito en la primera frase) y se sube el tamaño del requisito en el flyer.
4. **Respuesta humana > 2 h en horario** → el problema no es el anuncio; se pausa medio día antes de seguir quemando dinero sin atender.
5. **D7:** costo por aplicación válida ≤ $15 (A) o ≤ $12 (B) → **extender 7 días** con la ganadora al mismo $50/día. Por encima de $30 → **cortar** y volcar los $350 siguientes a tarjetas QR en suplidores + bono de referidos ($200 por plomero activo).
6. Nunca subir el presupuesto más de 30% de un día para otro (Meta reinicia el aprendizaje).

## 12. Lo que Elvin tiene que hacer para arrancar este sprint

1. Bori: crear el usuario de Resuelto, habilitar anuncios, conectar página FB + cuenta publicitaria + WhatsApp de Resuelto desde ese usuario (15 min). Pasarme `BORI_EMAIL`/`BORI_PASSWORD` para `agente/.env`.
2. Confirmar el número de WhatsApp (ya puesto en landings y creativos) y quién contesta: el agente en producción o él a mano.
3. Decir el **día 1**. Yo monto el D0 y te paso el link para activar.
4. Reservar 45 min diarios D1–D7 para entrevistas por video (20 min cada una). Sin ese bloque, el sprint no sirve.

Fuera de este sprint, los otros canales de la Fase 0 siguen igual (`marketing-fase-0.md` §4): visitas a suplidores, grupos de Facebook y referidos son los que más entregan por dólar; los anuncios son el acelerador, no la base.


### 22/sep (tarde) — 7 copias de W2 creadas en Ads Manager, APAGADAS
- Duplicadas en Chrome (sin la extensión bloqueadora ya no se trabó) y publicadas **apagadas** solo desde
  el editor del lote (el borrador viejo de W2 sigue SIN publicar). Nacieron con objetivo LINK_CLICKS
  (heredado de ese borrador) y el anuncio "$1,950" adentro.
- Ids (conjunto / anuncio copiado): Metro 120255069505370029 / 120255069505270029 · Caguas 120255069505320029 /
  120255069505280029 · Ponce 120255069505330029 / 120255069505360029 · Arecibo 120255069505260029 /
  120255069505390029 · Mayagüez 120255069505340029 / 120255069505290029 · Aguadilla 120255069505350029 /
  120255069505300029 · Fajardo 120255069505380029 / 120255069505310029 (también en
  `data/meta-ads/campanas/resuelto-regiones-2026-09.json`).
- **Bloqueo**: el token (Bori) no tiene la página Resuelto PR → Meta rechaza hasta pausar un anuncio de
  WhatsApp de esa página (subcode 2446880). Arreglo: Elvin reconecta Meta en heybori.ai marcando la
  página Resuelto PR y corre `token-desde-bori.mjs`; luego `node scripts/meta-ads/resuelto-regiones.mjs
  montar --aplicar` hace nombre/presupuesto/municipios/fin/objetivo CONVERSATIONS, flyer regional,
  anuncio nuevo en pausa, pausa el $1,950 copiado y pausa W1/W2.

### 22/sep (noche) — Reestructura LISTA: 7 regiones en pausa, W1/W2 pausados
Hecho en Ads Manager (editor de cada anuncio/conjunto, nunca "Revisar y publicar"; el borrador viejo de W2
sigue sin publicar) y verificado por API (`arbol 120255016399820029`):

| Conjunto | $/día | Municipios |
|---|---|---|
| R · Área Metro | 15 | San Juan, Bayamón, Carolina, Guaynabo, Cataño, Toa Baja, Toa Alta, Trujillo Alto, Dorado |
| R · Caguas | 10 | Caguas, Aguas Buenas, Gurabo, Juncos, San Lorenzo, Cayey |
| R · Ponce | 10 | Ponce, Guayanilla, Juana Díaz, Peñuelas, Santa Isabel |
| R · Arecibo | 10 | Arecibo, Manatí, Barceloneta, Vega Baja, Vega Alta, Hatillo, Camuy |
| R · Mayagüez | 10 | Mayagüez, Cabo Rojo, San Germán, Añasco, Hormigueros |
| R · Aguadilla | 10 | Aguadilla, Isabela, Moca, San Sebastián, Aguada |
| R · Fajardo | 10 | Fajardo, Luquillo, Río Grande, Ceiba, Humacao, Naguabo |

- **Total $75/día**, fin 29/sep 17:59, hombres 25-65, solo WhatsApp (+1 939-247-9234), todos **EN PAUSA**.
- Anuncio de cada conjunto = "R · <Región> · Flyer regional": flyer regional sin cifras, texto "Buscamos plomero
  en <Región>… Solo 2 cupos… licencia vigente… 4 preguntas y coordinamos la entrevista", título "Buscamos plomero
  en <Región>", descripción "Solo 2 cupos en la región · Licencia vigente". Mejoras de IA de Meta apagadas.
- **W1 (120255016399830029) y W2 (120255018289310029) PAUSADOS** por API (copy con $1,950 / 65 %, fuera de la
  regla "sin cifras"). Nada gasta hasta que Elvin active los 7 conjuntos.
- Límites: la optimización quedó en **clics al enlace** (las copias heredaron LINK_CLICKS y Meta no deja cambiarla
  después de publicar; para "Conversaciones" puras habría que crear conjuntos nuevos desde cero). El mensaje de
  bienvenida es el genérico de Meta. El token de Bori sigue sin la página Resuelto PR: toda edición de anuncios
  de WhatsApp va por Ads Manager (pausar conjuntos por API sí funciona).
- Gotcha: la búsqueda masiva de lugares trae homónimos extranjeros (Mozambique, Brasil, Reino Unido…); hay que
  borrar toda fila que no diga "Puerto Rico". Y verificar por API después de publicar: Mayagüez se guardó una
  vez con "Puerto Rico" entero y hubo que rehacerlo.

### 22/sep (noche) — Follow Me a @resueltoapp.pr (prueba social), EN PAUSA
Pedido de Elvin: $10/día × 3 días, tráfico al perfil de IG, 50-100 seguidores, segmentado como para vender, solo Instagram.
- Campaña `120255070276990029` (Tráfico, **PAUSADA**) → conjunto `120255070277000029` (PROFILE_VISIT → perfil IG,
  $10/día, fin 25/sep 20:21) → anuncio `120255070276980029` con los 2 posts de clientes ("Hola. Somos Resuelto." y
  "El problema no es el precio"), CTA "Ir al perfil de Instagram", mejoras de IA apagadas.
- Público "dueños de casa" de `kit/campana-clientes.md`: los 12 municipios de los 3 territorios de arranque (Metro Norte,
  Metro Oeste, Centro-Este), 28-65, intereses Remodelaciones + Vivienda + The Home Depot, Advantage+ público y expansión
  geográfica APAGADOS; ubicaciones manuales solo Instagram (feed, perfil, stories, reels, explorar, búsqueda).
- Trampa: en este objetivo Ads Manager vuelve a "Puerto Rico" entero cada vez que se toca otra parte del público (y al
  desmarcar "Llegar a más personas"). La geo se fijó por API después de publicar (`targeting.geo_locations.regions` +
  `individual_setting.geo:0`, sin `targeting_optimization`). Plan: `data/meta-ads/campanas/resuelto-follow-me-2026-09.json`.
