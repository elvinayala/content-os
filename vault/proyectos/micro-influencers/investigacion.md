---
proyecto: micro-influencers
tipo: investigacion
fecha: 2026-09-13
estado: borrador v1
relacionado: "[[estilo/level-up]] · [[estilo/ai-borinquen]] · [[ceo/perfil-ceo]] · [[proyectos/micro-influencers/brief-creadores]]"
---

# Micro-influencers de Puerto Rico para Level Up y AI Borinquen

> **Respuesta corta:** sí conviene, pero no como "influencers que hablan de tu agencia". En PR el
> pool de creadores de negocios/tech entre 10K y 50K es **chiquito** (5 cuentas fuertes, 7 útiles).
> La jugada que sí escala es **"dueño de negocio con audiencia"** — doctores, clínicas y salones
> que ya publican reels, son tu ICP y cobran menos que un influencer — convertidos en
> **cliente + creador**: usan AutoFlow / Level Up, cuentan la experiencia con su cara, y tú
> amplificas ese reel con **Partnership Ads** desde su cuenta. Un reel de Tuko Alberto o del
> Tech Guru te da autoridad; un reel de la Dra. Kasey Ruiz contando que dejó de perder citas te
> da leads.

## 1. Qué se hizo y qué no (léelo antes de la lista)

- **Pedido:** micro-influencers 10K–50K, **radicados en Puerto Rico**, para colaboraciones
  orgánicas **pagadas por reel**, y decidir si amplificarlas con anuncios. (La lista de latinos
  en EE.UU. quedó fuera por tu instrucción del 13/sep: "deben estar en Puerto Rico".)
- **Verificado a mano:** 95 cuentas leídas en el perfil público de Instagram el 13/sep/2026;
  a las 30 que caían en rango y nicho se les analizaron los **12 posts más recientes**
  (likes, comentarios, fecha, caption) para calcular engagement real, cadencia y ángulos.
- **Limitación honesta:** Apify (el vetting con vistas de reels que planeamos) **agotó el crédito
  del ciclo** en el plan free — dos runs se abortaron y el actor de descubrimiento encontró
  ~350 cuentas pero solo analizó 5. Por eso las métricas son **likes + comentarios ÷ seguidores**
  (sin vistas). Cuando se renueve el ciclo o subas a Starter (~$49/mes), el archivo
  `candidatos.json` se re-vetea con `apify/instagram-profile-scraper` en un run (~$0.30).
- **Hallazgo principal:** los rankings públicos de "influencers de PR" son todos artistas y
  lifestyle. Los pocos creadores de negocios con audiencia real son mentores de marketing (pares
  tuyos) o profesionales de salud con marca personal. Varias cuentas "grandes" de negocios en PR
  tienen la audiencia muerta (47K con 20 likes) o comprada (46K con 0–2 likes) — están marcadas.

## 2. La lista (Puerto Rico, 10K–50K salvo excepción marcada)

Score 0–100 = 35 fit de audiencia · 25 engagement real · 15 cadencia/formato · 15 fit de marca ·
10 facilidad de contacto. Tarifa por reel es **estimada `[DATO]`** (ver §4). Detalle completo con
métricas en `candidatos.json`.

### Tier A — contactar en el mes 1

| # | Cuenta | Quién es | Seg. | Eng. | Marca | Por qué | Tarifa est. |
|---|---|---|---|---|---|---|---|
| 1 | **@skinclinicpr** | Dra. Kasey Ruiz Vega, clínica de estética, San Juan | 40.2K | **2.7%** (reels 1K–3K likes, 200–700 com.) | AIB + LU | La mejor tracción real de la lista. Dueña de clínica que agenda citas = ICP exacto de AutoFlow. Humor + criterio ("Do Not Buy List"). Candidata #1 a *cliente + creadora*. | $600 |
| 2 | **@virtualizate** | Obed Borrero, "El Tech Guru" de WAPA TV, explica IA sin complicaciones | 46.6K | 0.08% en IG (su fuerza es TV/radio) | AIB | #1 en tecnología del *PR Digital Trends Study 2026*. Ya hace patrocinios (Ford, Planet Solar). Es el sello de credibilidad local: "el Tech Guru explica qué hace AutoFlow". | $800 |
| 3 | **@dr.luismorell** | Cirujano plástico, Guaynabo, 20+ años | 41.3K | **2.2%** (un reel 7.4K likes / 961 com.) | AIB + LU | Marca personal fuerte, reels educativos (mitos) + personalidad. Habla de la decisión del paciente: mismo tono que "pierdes leads por responder tarde". | $700 |
| 4 | **@drsebastianbonnin** | Quiropráctico (AlignLife Guaynabo), autor, speaker, **consultor de negocios** | 23.1K | 0.13% diario, picos reales (14K likes) | AIB + LU | Habla el idioma del dueño de clínica. Primer caso de AutoFlow en quiropráctica (citas recurrentes). | $400 |
| 5* | **@tuko_alberto_** | Mentor de marketing y ventas online, 848 compañías, podcast | 67K *(fuera de rango)* | 0.19% (virales 2–3.7K) | LU + AIB | El creador de negocios más relevante de PR; su audiencia son dueños de negocio. Ya cubre IA. Riesgo: es "par" de marketing → proponer **entrevista/caso**, no anuncio. | $900 |

### Tier B — reserva / cliente + creador

| Cuenta | Quién es | Seg. | Eng. | Marca | Nota | Tarifa est. |
|---|---|---|---|---|---|---|
| @curlbosspr | Salón multitextura, San Juan (booking online, publica a diario) | 30.1K | 1.0% | AIB | Cuenta de marca: la pieza sería "cómo atendemos 200 mensajes a la semana" con la dueña. | $350 |
| @drericadler | Dr. Eric Adler, cirujano plástico facial (Adler Clinics) | 52.9K | 0.3% (reels 300–700) | AIB | Justo sobre rango. Clínica con 3 líneas = muchas consultas entrantes. Prospecto antes que creador. | $600 |
| @drarociocardona | Dermatóloga, San Juan/Carolina; **ya hace #sponsored** (La Roche-Posay, Essie) | 12.9K | 1.9% | AIB | Sabe trabajar con marcas; publica poco. | $300 |
| @yessicayesspr | Coach financiera certificada, series de gastos | 10.4K | 1.2% | LU | Audiencia ordenando finanzas; parte son dueños de negocio pequeño. | $200 |
| @gisellecarazo | Nutricionista, publica a diario y cierra cada reel con "llama para cita" | 25K | 0.2% | AIB | Dolor exacto de AutoFlow (llamadas perdidas). Más caso que influencer. | $250 |
| @amilcardermatology | Dermatólogo, Torre Médica, 10 años | 49.9K | 1.2% pero ≈2 posts/mes | AIB | Audiencia leal, casi no hace reels. Cliente-caso. | $500 |
| @celinanogueras | "Money Mami", podcast **Jefas y Jevas** (auspiciado por ATH Business) | 6.5K *(bajo rango)* | 0.9% | LU | Vía correcta: auspicio de episodio o Elvin invitado hablando de sistemas de venta. | $350/episodio |

### Tier C — anotados (no pagar por reel)

@carloscobianlive (25.6K, hoy contenido de DJ/eventos; puerta a charlas), @ramontorrelemus
(47.3K, **0.06%**: audiencia dormida), @homesofpuertorico (24.7K realtor, solo listings),
@gevega_nutrition (28.6K, CEO clínica, contenido personal), @kiaritza (32.5K, hace #Ad con
Dove/Splenda pero audiencia mamás + dueña de agencia), @margaretpereztv (35K, radio),
@corpobellopr / @raicesrealestate / @iconicrealtygroup (cuentas de empresa → **prospectos de
AutoFlow**, no creadores), @mariacintronpr (9.9K, co-host Redes 101).

### Nano (3K–8K) para intercambio, no pago
@luccianodiazskoff, @hcruz.mentor, @cpajessicacandelaria, @zelmadavila (El Comeback
Empresarial), @crystaldiazpr, @ia_puertorico, @finanzasalmaximo, @tucoachdelaventa, @jorgefuentespr.

### Fuera de rango (referencia, por si subes el techo)
@adfluencis_by_myriam_cortes (82.6K, CMO externa/speaker — par de marketing, mejor alianza),
@tinopr2 (87.9K, frases diarias, awareness general), @kenara.multiservices (157K, contratista con
audiencia — home services es ICP de AIB), @dracruz (161K, clínicas dentales), @coachrandysoler
(115K), @angelee923 (109K), @realestate.mispropiasfinanzas (177K), @josegalindezpr (406K).

### Descartados con motivo
Fuera de PR: @melirodriguezconferencista (Cali), @mas_vida_psicologos (España),
@coachcarlosmeza (México), @negociosconmaite (Argentina), @luisabantocoach. Inflados o muertos:
@elgurudemarketing (46K, 0–2 likes), @jmmedical.pr (15K, 1–6 likes). Inactivos: @cuponeandoprnet
(ene/2025), @mujerbonica (jun/2025), @dermgrouppr. Fuera de nicho: @catalinnamorales,
@lilliriel_rivera, @sabrinarosadopr, @josieedmee.

### No contactar (competidores)
@booomagency, @promopuertorico, @thedigitalchameleon (agencias de ads/redes en PR);
@enix.ai, @aiautomatiza (agencias de IA).

## 3. Cómo colaborar (el formato que sí funciona en PR)

1. **Cliente + creador** (Tier A/B de salud y belleza): les instalas AutoFlow o les corres
   Level Up **a precio normal o con descuento por contenido**, y a los 21 días graban 1 reel en
   su voz: "antes perdía X citas por no responder; ahora…". Pagas el reel aparte (tarifa de la
   tabla) para que el trato sea limpio y puedas pedir derechos de uso. Es el formato más
   creíble y el único que da leads además de alcance.
2. **Autoridad prestada** (Tuko, Tech Guru, Myriam): no "anuncio", sino **entrevista o caso**:
   Tuko analiza el caso de un cliente de Level Up (formato que ya usa: Autoservicio 65, Dribble
   Bros); el Tech Guru prueba AutoFlow en vivo ("le escribí a las 11 PM y me contestó").
3. **Podcast** (Jefas y Jevas, El Comeback Empresarial): Elvin invitado + auspicio de episodio.
   Baratísimo por minuto de atención y la audiencia es 100% empresarias/os.
4. **Lo que NO hacer:** pagar por reel a cuentas de 30–50K con engagement < 0.2% (Tier C), ni a
   lifestyle por "alcance". Un reel de la Dra. Kasey con 2K likes reales vale más que 5 de esos.

Reglas de marca en cada pieza (del vault): tuteo de PR; **nunca "gratis"**; IA es el mecanismo,
no el protagonista; nunca prometer ingresos; CTA "comenta X" o WhatsApp; para Level Up con
coaches/mentores se dice **consultoría**, no agencia. En anuncios de AIB se habla de usted.

## 4. Tarifas estimadas por reel `[DATO]` (confirmar en el outreach)

Benchmarks 2026 (Influee, Shopify, Ecommerce Fastlane): micro 10K–100K cobra $150–$500 en
lifestyle y $500–$1,500 en nichos financieros/profesionales; video +25–50% sobre estático;
derechos de uso y exclusividad multiplican 1.5–3×. Ajustado a PR (mercado más chico, menos
oferta de marcas):

| Tier de seguidores | Reel orgánico | + derechos de uso 90 días (Partnership Ads) | Paquete 3 reels |
|---|---|---|---|
| 10K–25K | $150–$300 | +30% | −15% |
| 25K–50K | $300–$700 | +40% | −15% |
| 50K–100K (excepciones) | $700–$1,200 | +50% | −15% |
| Profesionales de salud | suelen preferir **trueque + fee chico** ($200–$400) | — | — |
| Podcast (episodio auspiciado) | $250–$500 | incluido | — |

Ancla de negociación: pide la *media kit*; si no tienen, ofrece la banda baja + derechos de uso.

## 5. ¿Amplificar con anuncios? Sí — como Partnership Ads, no como ad propio

- **Qué es:** el creador publica el reel orgánico con etiqueta "Colaboración pagada" y te
  aprueba como socio comercial (Business Suite → Branded content → Approve partner). Tú lo
  impulsas desde **su** handle en Ads Manager con tu presupuesto, tu segmentación (PR, dueños de
  negocio, intereses) y tu píxel.
- **Por qué:** CPA ~19% más bajo y CTR ~53% más alto que un ad de marca (CreatorCommerce 2026);
  la prueba social viene de una cara conocida; y el orgánico ya te dijo qué gancho funciona
  antes de gastar.
- **Obligatorio en 2026:** Meta exige el formato Partnership Ads para cualquier contenido de
  creador pagado (marzo–mayo 2026); UGC "disfrazado" de orgánico = rechazo + penalidad de
  cuenta. Divulgación FTC: verbal + en pantalla en los primeros 3 s del reel y en el caption;
  el creador debe declarar herramientas de IA usadas; tú revisas los claims antes de
  impulsar (nada de "gratis", nada de ingresos).
- **Regla de gasto:** solo se impulsa un reel que supere la **mediana de vistas del creador**
  (misma regla de "bombazo" de Métricas). Presupuesto de prueba $150–$300 por reel durante 5
  días; si el costo por lead calificado ≤ el de tus ads propios, escalar.
- **Contrato (mínimos):** derechos de uso 90 días para ads (renovable), exclusividad de
  categoría 60 días (no promocionar otra agencia de ads / otra IA), 1 ronda de revisión, guion
  guiado por brief pero en su voz, divulgación, permiso de partnership ads activado antes de
  pagar el 50% final.

## 6. Plan a 90 días

**Mes 1 — validar (5–6 creadores, 1 reel c/u)**
- Semana 1: DM + email a Tier A (5) y a 3 de Tier B (Kasey, Morell, Bonnin, Tech Guru, Tuko;
  Curl Boss, Cardona, Yessica). Templates en `brief-creadores.md`.
- Semana 2: cerrar 5–6. A los de salud/belleza, ofrecer **cliente + creador** (AutoFlow o LU
  con descuento por contenido + fee por reel). A Tuko/Tech Guru, entrevista/caso.
- Semanas 3–4: grabar y publicar. Cada reel con **keyword única de comentario** (`comenta
  FLOW` / `comenta LEVEL`) + link UTM en bio del creador. Meta: costo por lead calificado por
  creador.

**Mes 2 — escalar lo que funcionó**
- 2 reels/mes con los 3 mejores. Activar Partnership Ads sobre los reels que superaron la
  mediana. Reemplazar a los que no rindieron con Tier B.
- Primer **caso de éxito con cara** (el cliente + creador que mejor midió) → lo usas en tus
  propios ads y en /ganchos.

**Mes 3 — sistematizar**
- Contrato mensual con 3–4 creadores fijos, calendario en `data/calendario.json`.
- Comparar CAC creador vs. CAC ads propios; decidir presupuesto fijo y, si sobra, abrir el techo
  a 50K–100K (Tuko, Myriam, Kenara) o a la diáspora (Orlando/NY) para AIB.

**Escenarios de presupuesto mensual `[DATO]`**

| | Conservador | Medio | Agresivo |
|---|---|---|---|
| Reels/mes | 4 | 8 | 14 |
| Fee creadores | ~$1,500 | ~$3,200 | ~$6,000 |
| Partnership Ads | $0 | $1,000 | $2,500 |
| Total | **~$1.5K** | **~$4.2K** | **~$8.5K** |
| Meta de leads calificados | 15–25 | 40–60 | 80–120 |

KPIs por creador: leads calificados, costo por lead, citas agendadas (AIB) / auditorías
(LU), ventas atribuidas, y "ratio de prueba" = engagement del reel patrocinado ÷ su mediana.

## 7. Riesgos y cómo se cubren

- **Par de marketing (Tuko, Myriam, Kiaritza):** pueden verte como competencia. Formato
  entrevista/caso y cláusula de no-denigración; nada de "mi agencia vs. la tuya".
- **Médicos y claims:** no prometer resultados médicos ni de ingresos; el reel habla de
  *atención al paciente y agenda*, no de tratamientos.
- **Cuentas infladas:** todo Tier A/B tiene engagement medido; re-vetear con Apify (vistas) antes
  de firmar contratos mensuales.
- **Dependencia de una cara:** 3–4 creadores rotando, nunca uno.

## 8. Próximos pasos inmediatos

1. Aprobar Tier A y el escenario de presupuesto.
2. Mandar los DMs de `brief-creadores.md` (Sofi/Facu pueden hacerlo desde las cuentas de marca).
3. Cuando Apify renueve el ciclo: correr `apify/instagram-profile-scraper` con los 22 handles de
   `candidatos.json` (`resultsLimit: 30`) y actualizar `vistasPromedio` / `vistasMediana`.
4. Activar en Business Suite de Level Up y AI Borinquen la opción de anuncios de colaboración
   antes del primer reel.

---
Fuentes externas usadas: PR Digital Trends Study 2026 (SME/Estudios Técnicos) · Meta Partnership
Ads 2026 (contentgrip, Instagram Help Center) · CreatorCommerce benchmark · Influee / Shopify /
Ecommerce Fastlane (tarifas 2026) · hiveinfluence.io (rankings por categoría en PR) · perfiles
públicos de Instagram (13/sep/2026).
