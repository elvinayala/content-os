---
proyecto: captacion-no-meta
tipo: plan-maestro
fecha: 2026-09-13
estado: borrador v1
relacionado: "[[ceo/perfil-ceo]] · [[estilo/level-up]] · [[estilo/ai-borinquen]] · [[proyectos/micro-influencers/investigacion]]"
---

# Sistema de captación de élite fuera de Meta (Level Up + AI Borinquen)

> **Tesis:** tu ventaja injusta no es otro canal de anuncios, es que ya tienes **scraping
> (Apify) + agentes de voz/chat (AutoFlow) + CRM**. El sistema de élite es **outbound con
> señal de dolor medida**: encuentras al negocio, le pruebas que pierde clientes (lo llamas y
> nadie contesta) y le mandas el diagnóstico con su nombre. Meta te da volumen; esto te da
> clientes de $3K–$5K/mes que no están en Facebook buscando agencia. Alrededor de ese motor
> se ponen 4 canales de apoyo: Google Search (intención), LinkedIn (autoridad + B2B), partners
> (referidos calientes) y TikTok Spark Ads (alcance barato con los creadores de la lista).

## 1. Los 6 canales, ordenados por lo que te van a dar

| # | Canal | Para quién | Qué te da | Costo/mes aprox. | Tiempo a primer cliente |
|---|---|---|---|---|---|
| 1 | **Outbound con scraping + auditoría de respuesta** | AIB (clínicas, legal, home services, dealers, seguros) y LU (servicios $10–40K/mes) | Leads calificados con dolor comprobado | $300–$600 (Apify, email tool, minutos de voz) | 2–4 semanas |
| 2 | **Google Ads Search** | Ambas | Gente buscando "agencia de marketing PR" / "recepcionista virtual" ahora | $1,500–$3,000 | 1–3 semanas |
| 3 | **Partners de referido** (CPAs, POS, asociaciones, bancos) | Ambas, sobre todo AIB | Leads calientes recurrentes | Comisión 10–15% | 4–8 semanas |
| 4 | **LinkedIn (perfil de Elvin + Sales Navigator)** | AIB como "partner tecnológico" para empresas medianas; LU para clínicas grandes | Autoridad + reuniones con decisores | $100 (Sales Nav) + 3 h/semana | 4–8 semanas |
| 5 | **TikTok Spark Ads con creadores** | AIB (demo de AutoFlow) | Alcance barato + retargeting | $800–$2,000 + fees de creadores | 3–6 semanas |
| 6 | **ABM de 50 cuentas** (video personalizado + regalo) | Clientes de $5K+/mes: cadenas de clínicas, dealers, franquicias | 5–10 clientes de élite al año | $50–$100 por cuenta | 6–12 semanas |

YouTube (long-form + búsqueda) queda para el trimestre 2: sirve, pero tarda y necesita
producción constante.

## 2. Canal 1 — Outbound con scraping + "auditoría de respuesta" (el motor)

**La idea:** no vendes automatización, vendes un dato incómodo: *"te llamamos 3 veces esta
semana y nadie contestó; te escribimos por IG y contestaste en 19 horas. Con 40 consultas al
mes eso son ~$X que no entran."* El diagnóstico es la puerta; AutoFlow es la solución obvia.

**Pipeline semanal (500 negocios):**
1. **Buscar** — Apify `compass/crawler-google-places` por categoría × municipio (dentista,
   estética, quiropráctico, techos, solar, dealer, abogado, seguros; San Juan, Guaynabo,
   Bayamón, Caguas, Carolina, Ponce, Mayagüez). Campos: nombre, teléfono, web, rating,
   número de reseñas, horario, IG si aparece. Filtro: ≥ 30 reseñas (ya tienen volumen) y
   rating ≥ 4.0 (negocio sano que pierde por atención, no por servicio).
2. **Enriquecer** — Apify `apify/instagram-profile-scraper` con el handle (seguidores, si
   tienen link de citas), buscador de emails (Hunter/Anymail) para el dueño, y tu propio
   scraper de la web (¿tienen chat? ¿WhatsApp? ¿horario de respuesta?).
3. **Medir el dolor (la auditoría)** — tu agente de voz llama 2 veces (una en horario, otra a
   las 6:30 PM) y registra: contestó sí/no, segundos, si ofreció cita. Un mensaje de prueba
   por IG/WhatsApp con una pregunta real ("¿tienen espacio esta semana para X?") y se mide el
   tiempo de respuesta. Todo cae en Pipedrive como *score de atención* (0–100).
4. **Contactar solo a los que fallaron** (score < 50; suelen ser 40–60%):
   - **Email 1** (día 0): el diagnóstico con sus números + captura de pantalla. Asunto:
     "Los llamé el martes a las 6:32 PM". CTA: "¿te muestro en 10 min cómo se arregla?"
   - **Llamada del agente de voz** (día 1, a la línea del negocio, horario comercial): "Llamo
     de parte de Elvin por el reporte que le enviamos…" y agenda en el calendario.
   - **WhatsApp** (día 3): el video de 60 s de la demo (el agente contestando a las 11 PM).
   - **Email 2** (día 6): caso de un colega del mismo rubro (Dr. Marvin / Dr. Bryan Vega).
   - **Llamada humana** (día 8): closer o Elvin solo si abrió los emails o vio el video.
5. **Cerrar** con la oferta que ya existe: "Danos 7 días" / automatización desde $497 /
   AutoFlow $3,997 con garantía de 21 días. Para LU: auditoría de crecimiento (el quiz funnel
   Diagnóstico de Crecimiento ya está en ClickFunnels) + propuesta.

**Reglas y cumplimiento:** llamadas B2B a líneas de negocio en horario comercial, identificarse
siempre, no marcador automático a celulares sin consentimiento (TCPA), opt-out en cada email
(CAN-SPAM), dominios secundarios para el email frío (no el principal), máximo 50 emails/día por
buzón, calentamiento de 2 semanas. Nada de "gratis".

**Números objetivo:** 500 scrapeados → 250 auditados con falla → 250 contactados → 25
reuniones (10%) → 5 clientes (20%). A $2K–$4K/mes por cliente, un mes de outbound paga el año.

**Quién:** Mateo (datos) corre el scraping los lunes; el agente de voz audita martes–jueves;
Facu carga la secuencia; Elvin/closer cierra. Todo se puede montar como skill `/prospectar`
que encole encargos al worker de Apify.

## 3. Canal 2 — Google Ads Search (intención pura)

- **Campañas:** (a) LU: "agencia de marketing digital puerto rico", "meta ads puerto rico",
  "agencia de anuncios para doctores"; (b) AIB: "recepcionista virtual puerto rico", "chatbot
  para negocio", "contestador de llamadas con inteligencia artificial", "automatizar citas".
  Concordancia de frase + negativas (empleo, curso, gratis).
- **Landing:** los quiz funnels que ya existen (Diagnóstico de Crecimiento / Diagnóstico de
  Automatización) — un formulario de 30 s califica mejor que una página larga.
- **Presupuesto:** $50–$100/día por marca; PR tiene poco volumen pero CPC bajo ($1–$4). Meta
  de CPL: < $60 en AIB, < $120 en LU.
- **Extras:** Performance Max con audiencias de clientes actuales; remarketing de Search a
  YouTube in-feed con el video de la demo.

## 4. Canal 3 — Partners de referido (leads calientes, cero pauta)

Quién ya habla con tu ICP todos los días y no compite contigo:
- **CPAs y contadores** (@cpajessicacandelaria, @planillaspr_cpa, Colegio de CPA): ven las
  ventas y las citas perdidas. Comisión 10–15% recurrente 12 meses o fee fijo por cliente.
- **Proveedores de POS / software** (TrackNova, Vagaro/booking que usan los salones): AutoFlow
  como complemento; ellos te ponen en su onboarding.
- **Asociaciones**: SME Puerto Rico (Digital & Innovation Forum), Colegio de Cirujanos
  Dentistas, Asociación de Quiroprácticos, Cámara de Comercio del Sur, Centro para
  Emprendedores, Colmena66 → charla "IA para clínicas: cómo no perder la cita de las 9 PM" +
  oferta especial a miembros.
- **Bancos/fintech** que auspician contenido de negocios (ATH Business auspicia Jefas y Jevas):
  co-marketing con webinar.
- **Tus propios clientes**: programa de referidos — un mes sin fee por cada cliente referido
  que firme.

Meta: 5 partners activos en 60 días; cada uno debería traer 1–2 leads/mes.

## 5. Canal 4 — LinkedIn (autoridad + decisores)

- **Perfil de Elvin como operador**, no como agencia: titular "Lleno agendas de clínicas y
  negocios de servicio en PR con IA. 2 empresas, $X/mes gestionados". Destacados: 3 casos.
- **Contenido 3×/semana** (reutiliza el vault): caso con números, opinión contraria ("los
  referidos son frágiles"), detrás de cámaras del agente de voz. Formato texto + 1 imagen o
  carrusel PDF; nada de "estoy emocionado de anunciar".
- **Prospección:** Sales Navigator → dueños/gerentes de clínicas, dealers, aseguradoras,
  firmas legales en PR (título contiene owner/CEO/administrador, empresa 10–200 empleados).
  30 invitaciones/día sin nota; a los que aceptan, mensaje de valor a los 2 días (el
  diagnóstico o un caso de su rubro), nunca pitch en el primer mensaje. Scraping de los
  resultados con Apify `linkedin` actors para enriquecer y meter en la secuencia de email.
- **Objetivo:** 10 conversaciones y 3 reuniones al mes; es el canal para el reposicionamiento
  de AIB como "empresa de tecnología / partner tecnológico" y para empresas medianas.

## 6. Canal 5 — TikTok (Spark Ads con los creadores de la lista)

- PR está fuerte en TikTok y el CPM es 30–50% menor que Meta. B2B directo es débil, así que se
  usa para **awareness + demo de AutoFlow** y retargeting, no como canal principal.
- **Spark Ads** = el equivalente a Partnership Ads: el creador (Chicle, will_0mar, Oscar
  Navarro) publica el sketch/demo, te da el código de autorización y tú lo impulsas.
- Segmentación: PR, 28–55, intereses negocios/emprendimiento/marketing + audiencias
  personalizadas de tu CRM. CTA a WhatsApp o al quiz.
- Presupuesto de prueba: $30–$60/día por creativo, 3 creativos, 3 semanas. Medir CPL contra
  Meta antes de escalar.

## 7. Canal 6 — ABM de 50 cuentas de élite

- Lista de 50: cadenas de clínicas (dental, estética, dermatología), dealers grandes,
  aseguradoras, firmas legales, franquicias de servicio, contratistas de solar/techos con
  volumen. Cada una con decisor identificado (LinkedIn + Google Maps + IG).
- Por cuenta: diagnóstico de respuesta hecho a mano + **video personalizado de 2 min** (Loom:
  "les escribí, esto pasó, esto se arregla así") + un regalo físico con la carta (libro,
  café boricua) → llamada.
- 5 cuentas por semana, seguimiento 6 toques. Meta: 8–10 reuniones y 3–5 clientes de $5K+/mes
  en 90 días.

## 8. Plan a 90 días

**Mes 1 — el motor**
- Semana 1: dominios de email frío + calentamiento; Pipedrive con pipelines "Outbound" y
  "Partners"; guion del agente de voz auditor; plantillas de email con el diagnóstico.
- Semana 2: primer scraping (dentistas + estéticas + techos, área metro) → 500 negocios;
  auditoría de respuesta; Google Ads Search encendido para AIB.
- Semanas 3–4: primeras 250 secuencias; 5 partners contactados (2 CPAs, 1 POS, 2
  asociaciones); LinkedIn: perfil listo y 3 posts/semana.

**Mes 2 — abrir canales**
- Outbound a 500/semana con nuevas categorías (dealers, legal, seguros); Google Ads para LU.
- Charla en una asociación; 2 partners firmados.
- LinkedIn Sales Navigator: 30 invitaciones/día; TikTok Spark Ads con 2 creadores.
- ABM: primeras 10 cuentas con video personalizado.

**Mes 3 — medir y cortar**
- CPL y costo por cliente por canal; se queda lo que esté por debajo de Meta o traiga
  clientes de mayor ticket.
- Convertir el outbound en skill/tarea programada (`/prospectar` semanal en el worker).
- Decidir YouTube para el trimestre 2.

**Presupuesto mensual del sistema (sin fees de creadores):** ~$2,500–$4,500 (Google $1.5–3K ·
herramientas de email/voz $300–$600 · Sales Navigator $100 · TikTok $800–$1,000 desde el
mes 2). KPIs: reuniones/semana por canal, CPL, % de cierre, ticket promedio, clientes con
LTV > $15K.

## 9. Qué NO hacer
- DMs masivos automatizados en Instagram (te tumban la cuenta).
- Marcador automático a celulares.
- Lead magnets "gratis" o webinars genéricos: tu gancho es el diagnóstico con nombre y apellido.
- Encender los 6 canales la misma semana: primero el motor, después uno por mes.
