---
proyecto: Quilla
tipo: plan-campana
fecha: 2026-09-15
estado: borrador v1
relacionado: "[[proyectos/quilla/plan-maestro]] · [[perfil-ceo]] · [[proyectos/quilla/adquisicion-creadores]] · [[proyectos/quilla/vocero-y-produccion-ads]] · [[proyectos/quilla/sistema-aplicacion-scoring]] · [[proyectos/quilla/perfil-creador-ideal]] · [[proyectos/quilla/proceso-comercial]]"
---

# Funnel de YouTube Ads · Captar creadores que quieren una empresa, no un manager

> **En una línea:** el único canal pagado de Quilla es YouTube. El ad no vende: filtra. Quien llega a la landing ya sabe que esto es serio, que hay reglas y que no todo el mundo califica. El funnel entero está diseñado para que la llamada de 20 min sea con la persona correcta, no con la que más clics hizo.

Depende de dos compuertas de [[proyectos/quilla/plan-maestro]]: **los ads no arrancan sin vocero** (ver [[proyectos/quilla/vocero-y-produccion-ads]]) y **no se escala sin 2 creadores firmados**.

---

## 1. Por qué YouTube y no Meta para captar creadores

Elvin decidió (15/sep/2026) que la adquisición pagada de Quilla sea **solo YouTube Ads**. Las razones, para que el equipo no vuelva a abrir el debate cada mes:

| Criterio | YouTube | Meta (IG/FB) |
|---|---|---|
| **Intención** | Puedes comprar búsquedas: "cómo monetizar mi audiencia", "manager de creadores". La persona ya está pensando en el problema. | Interrumpes el scroll. La intención la infiere el algoritmo, no la persona. |
| **Contexto de consumo** | Video largo, pantalla grande o TV, sesión de 20–40 min. Cabe un mensaje de 90 s calmado. | Consumo de 3 s por pieza. Premia el gancho agresivo, castiga la calma. |
| **Seriedad percibida** | Un in-stream bien producido se lee como marca. | Un ad de "monetiza tu audiencia" en IG se lee como gurú, aunque no lo sea. |
| **Saturación del mensaje** | Poca competencia en español para este tema en PR. | Es donde viven todos los cursos de "gana $10K al mes con tu Instagram". |
| **Audiencia** | El creador con ≥50K seguidores consume YouTube para aprender del negocio, no para postear. | El creador está en modo "trabajo" (publicando), no en modo "pensar mi empresa". |
| **Remarketing** | Listas por visualización de video + visitantes de la landing. | Igual de bueno, pero el primer toque es peor. |

La decisión de fondo: **Quilla no quiere volumen de aplicaciones, quiere calidad**. En Meta el costo por clic es más bajo y el costo por creador calificado, más alto. En YouTube pagamos más por vista y menos por creador firmado `[DATO]`.

Lo que **no** hacemos: Meta Ads para creadores, ni siquiera "para probar". Meta queda para las ventures de cada creador (ahí sí, con pauta adelantada por Quilla), no para captarlos.

## 2. Estructura de campaña

### 2.1 Formatos

| Formato | Uso | Creativo | Puja |
|---|---|---|---|
| **In-stream skippable** | Primer toque frío. Los 5 s iniciales deciden todo. | Guiones A, B, C en 16:9, 60–90 s | Target CPV, tope $0.08 `[DATO]` |
| **In-feed (antes "discovery")** | Aparece en resultados de búsqueda y en "siguiente". La persona elige verlo. | Mismos videos con thumbnail sobrio + título tipo pregunta | Máx. CPV $0.12 `[DATO]` |
| **Shorts (9:16)** | Solo en remarketing, nunca en frío. | Cortes de 20–30 s de cada guion | Target CPV |

Un ad group por formato × guion. No mezclar guiones en el mismo grupo: necesitamos saber cuál filtra mejor.

### 2.2 Audiencias (campaña de intención primero, el resto después)

**a) Intención personalizada (custom intent) — el corazón de la campaña.** Términos de búsqueda que una persona con audiencia escribe cuando empieza a pensar como empresa:

- `cómo monetizar mi audiencia` · `monetizar seguidores instagram` · `monetizar tiktok sin marcas` · `manager de creadores` · `agencia de creadores` · `representación de influencers`
- `brand deals` · `cuánto cobrar por un reel` · `media kit creador` · `tarifa influencer` · `vender curso online` · `lanzar membresía` · `crear comunidad de pago` · `skool en español`
- `creator economy` · `negocio con mi audiencia` · `ingresos creador de contenido` · `genflow` · `creator management agency` (en inglés, para el segmento bilingüe)

Negativas: `gratis`, `hack`, `rápido`, `sin audiencia`, `desde cero`, `cómo ser influencer`, `ganar seguidores`. Quien busca eso no es nuestro perfil.

**b) Afinidad personalizada.** Personas que consumen canales de: negocios en español, marketing de contenido, emprendimiento serio, podcasts de creadores, finanzas personales para profesionales.

**c) Placements.** Canales y videos de creator economy en español (podcasts de creadores hispanos, entrevistas a managers, canales de "negocio detrás del creador"). Lista inicial de 30 canales la arma el Scout la semana 1 `[DATO]`. Excluir canales de cursos de "hazte rico".

**d) Remarketing.** Tres listas:
- Vio ≥50 % de cualquier ad (ventana 30 días) → recibe el guion que no vio.
- Visitó la landing sin aplicar (ventana 14 días) → recibe guion C ("Qué pasa después de la aplicación") + Shorts.
- Empezó la aplicación y no la terminó (ventana 7 días) → recibe guion C + email 0 de recuperación (ver §7).

Excluir de todas las campañas frías: quien ya aplicó y quien ya está en el CRM.

### 2.3 Geo y idioma

- **Fase 1 (mes 2–4):** Puerto Rico, idioma español + inglés (mucho creador boricua tiene el teléfono en inglés).
- **Fase 2 (desde mes 5, solo si costo por creador firmado ≤ $3K):** Florida, Nueva York, Texas — hispanos de EE. UU., segmentación por idioma español y afinidad hispana. No abrimos Latinoamérica hasta tener un caso documentado.

### 2.4 Presupuesto y regla de escala

| Etapa | Diario | Mensual | Condición |
|---|---|---|---|
| Mes 1 | $0 | $0 | Se graba, se monta la landing, se elige vocero. Nada de pauta. |
| Mes 2–3 | $60 | ~$1,800 | Vocero elegido + 3 ads grabados + landing viva. |
| Escala | $100 | ~$3,000 | Costo por creador firmado ≤ $3K **y** ≥2 creadores firmados. |
| Fase 2 geo | $100–150 `[DATO]` | ~$3,000–4,500 | Un caso documentado + Head of Monetization activo. |

Reparto sugerido del diario: 60 % intención personalizada · 20 % placements · 10 % afinidad · 10 % remarketing `[DATO]`. Se ajusta semana a semana según §3.

### 2.5 Exclusiones

**Contenido:** infantil, gaming, música (salvo placements elegidos a mano), noticias sensibles, contenido embebido fuera de YouTube. **Dispositivos:** TV conectada solo en in-stream (no hay clic), excluir de in-feed. **Demografía:** menores de 18; sin límite superior (los creadores de autoridad suelen tener 35–55). **Horario:** sin restricción las primeras 2 semanas; luego recortar 1–5 AM si el CTR cae.

## 3. KPIs y cómo leerlos semana a semana

Targets del brief (todos `[DATO]` hasta tener 4 semanas de data real):

| KPI | Target | Qué mide | Si está mal, qué tocar |
|---|---|---|---|
| **CPV** | ≤ $0.08 | Costo por vista (30 s o completa) | Puja demasiado alta o audiencia demasiado amplia. Bajar tope de CPV o cerrar afinidad. |
| **VTR** | ≥ 30 % | % que ve el ad hasta el final o 30 s | Primeros 5 s flojos. Cambiar el orden de hooks o el guion. |
| **CTR** | ≥ 0.8 % | Clics a la landing / impresiones | El ad interesa pero no invita. Revisar CTA y la card final. |
| **Costo por aplicación** | ≤ $40 | Pauta / aplicaciones completas | Landing o formulario con fricción. Revisar §6 y el paso 3 de la aplicación. |
| **% calificados** | ≥ 15 % | Aplicaciones con score ≥70 / total | El ad no filtra. Reforzar guion B en frío. Revisar términos negativos. |
| **Costo por creador firmado** | ≤ $3K | Pauta acumulada / contratos firmados | Se lee a 60–90 días. Es el único KPI que decide escalar. |

### Lectura semanal (viernes, 30 min, Scout + Elvin por Slack)

1. **Semana 1–2:** solo CPV y VTR. No tocar nada más. Si VTR <20 % en un guion, pausarlo y dejar los otros dos.
2. **Semana 3–4:** entra CTR y costo por aplicación. Si costo por aplicación >$60, el problema es la landing, no el ad.
3. **Semana 5–8:** entra % calificados. Si <10 %, el ad atrae al perfil equivocado: mover presupuesto de afinidad a intención y subir guion B.
4. **Semana 9–12:** costo por creador firmado. Decide escalar a $100/día o apagar.

Regla de oro (de Ramiro, en [[mentores]]): **nunca dejar que un creativo fuera de KPI llegue a $100 de gasto sin decisión**. Se pausa, se anota por qué y se prueba otra cosa.

## 4. Los tres guiones (60–90 s a cámara)

Reglas comunes: habla el vocero en nombre de Quilla ("nosotros"). Ritmo lento, pausas reales, cero música de fondo agresiva. Sin cifras de ingresos, sin "$100K al mes", sin "dinero rápido", sin "libertad financiera". Se dice "empresa", "negocio", "audiencia", "reglas", "aplicación". El objetivo de cada guion es que **la persona equivocada se vaya sola** antes de aplicar.

Indicación de subtítulos para los tres: subtítulos quemados, tipografía sans limpia, blanco sobre banda oscura semitransparente, máximo 2 líneas, sin emojis, sin palabras resaltadas en color. Se subtitula el 100 % del texto porque el 60–70 % de las vistas en móvil son sin sonido `[DATO]`.

### Guion A · "Tienes audiencia, no tienes empresa" (75–85 s)

**Tono:** conversación de mesa, no de escenario. El vocero mira a cámara, sentado, manos quietas.

**HOOK (0–8 s)**
> Si tienes cincuenta mil personas que te escuchan… tienes audiencia. Lo que probablemente no tienes es una empresa. Y no es lo mismo.

**DESARROLLO (8–50 s)**
> Una audiencia es atención. Y la atención se paga con brand deals, con un reel de trescientos dólares, con un canje. Está bien. Pero se termina cuando dejas de publicar.
> Una empresa es otra cosa. Es una oferta que la gente compra sin que tú estés en vivo. Es un sistema que vende mientras grabas. Es un equipo que no eres tú.
> Nosotros somos Quilla. Construimos empresas alrededor de creadores. No te manejamos la agenda: diseñamos el negocio, lo montamos, ponemos el equipo y la pauta, y lo operamos contigo. Tú sigues siendo la cara. Nosotros quedamos detrás.

**FILTRO (50–70 s)**
> Trabajamos a revenue share, no con fee mensual. Eso quiere decir que si a ti no te va bien, a nosotros tampoco. Y también quiere decir que elegimos con quién trabajar. Tres a cinco creadores este año. No más.

**CTA (70–85 s)**
> Si tienes audiencia real, tiempo y ganas de vender algo tuyo, aplica en el enlace. Lees las reglas, contestas con calma. Si calificas, hablamos veinte minutos. Si no, te lo decimos con respeto.

*Subtítulo de cierre en pantalla:* **Quilla · Convertimos creadores en empresas · quillagroup.com/aplicar**

### Guion B · "Para quién NO es Quilla" (65–80 s)

**Tono:** más directo, casi una lista. Sin sonreír de más. Es el guion que más filtra; en frío se le da el 40 % del presupuesto `[DATO]`.

**HOOK (0–7 s)**
> Antes de que apliques a Quilla, te decimos para quién no es. Así no perdemos el tiempo ni tú ni nosotros.

**DESARROLLO / FILTRO (7–60 s)**
> No es para ti si tienes menos de veinticinco mil seguidores reales. No porque no valgas: porque el modelo todavía no cierra con esos números.
> No es para ti si tu audiencia no interactúa. Si tienes cien mil seguidores y cien likes, lo vamos a ver en la auditoría antes de la primera llamada.
> No es para ti si no quieres vender. Nosotros construimos negocios, y un negocio vende algo. Si te incomoda ofrecer, te va a incomodar todo lo demás.
> No es para ti si buscas que alguien te pague un fee fijo por manejarte. Trabajamos a porcentaje del resultado. Cincuenta y cincuenta sobre lo neto en las empresas que montamos juntos. Con contrato, con números claros, con revisión al año.
> Y no es para ti si no tienes cuatro horas a la semana. Menos que eso no alcanza para construir nada.

**CTA (60–80 s)**
> Si nada de esto te asustó, probablemente sí es para ti. Aplica en el enlace. Cinco pasos, unos diez minutos. Te contestamos en un día hábil.

*Subtítulo de cierre:* **Quilla · quillagroup.com/aplicar · Leemos cada aplicación.**

### Guion C · "Qué pasa después de la aplicación" (70–90 s)

**Tono:** transparente, casi un tour guiado. Sirve en frío pero rinde más en remarketing (visitó y no aplicó).

**HOOK (0–8 s)**
> Mucha gente no aplica porque no sabe qué pasa después. Te lo contamos completo, sin sorpresas.

**DESARROLLO (8–55 s)**
> Uno. Aplicas. Cinco pasos: quién eres, tus números, tu audiencia, qué has vendido, cuánto tiempo tienes. Nada de ensayos.
> Dos. Un sistema puntúa tu aplicación y una persona la revisa en veinticuatro horas. Si califica, te llega un enlace para una llamada de veinte minutos. Si no, te llega un correo diciéndolo. No te dejamos en visto.
> Tres. En la llamada no te vendemos nada. Te preguntamos. Queremos entender qué has intentado, qué te ha frenado y qué quieres construir.
> Cuatro. Si tiene sentido, hacemos una auditoría de tu audiencia. Dos páginas con datos reales: quién te sigue de verdad, qué contenido rinde, qué se podría vender. Sin promesas.
> Cinco. Si vemos oportunidad, te presentamos una propuesta escrita con el modelo, los números y las reglas. Si la firmamos, ahí empezamos a construir. Antes de la firma, no construimos nada. Es nuestra regla.

**FILTRO (55–72 s)**
> Todo este proceso toma entre dos y tres semanas. Si buscas algo para este viernes, esto no es.

**CTA (72–90 s)**
> Si prefieres saber exactamente dónde estás parado antes de decidir nada, aplica. El enlace está abajo.

*Subtítulo de cierre:* **Quilla · Aplicación → revisión en 24 h → llamada → auditoría → propuesta → contrato**

## 5. Brief de producción

Detalle operativo (día de rodaje, equipo, entregables, contrato del vocero) en [[proyectos/quilla/vocero-y-produccion-ads]]. Aquí, lo que el director y el editor necesitan para que los tres ads se vean como Quilla.

| Elemento | Especificación |
|---|---|
| **Set** | Un solo espacio: oficina o estudio con fondo con profundidad (pared con textura, estantería baja, ventana desenfocada). Nada de neón, nada de fondo negro con logo. Una silla, una mesa opcional. Sin objetos de "éxito" a la vista. |
| **Luz** | Luz suave lateral (key a 45°, softbox grande), relleno bajo, un contra sutil para separar del fondo. Temperatura 4,300–5,000 K. Look "documental premium", no "YouTuber". |
| **Ropa** | Colores sólidos, tonos neutros (gris, azul marino, crema, tierra). Sin logos, sin estampados, sin joyería llamativa. El vocero se ve como alguien que dirige, no como alguien que vende. |
| **Lente / cámara** | 35–50 mm equivalente, f/2.8–4, plano medio (pecho a cabeza) para el máster. Una segunda cámara a 85 mm en primer plano para los cortes de énfasis. 4K, 24 o 25 fps. |
| **Sonido** | Lavalier + micrófono de cañón como respaldo. Sala tratada o con mantas; el silencio entre frases tiene que ser limpio, porque los guiones usan pausas. |
| **Formatos** | **16:9** máster para in-stream e in-feed. **4:3** no se entrega (YouTube lo rellena con barras y se ve viejo). **9:16** para Shorts de remarketing: se graba con encuadre seguro (safe zone central) para reencuadrar sin perder al vocero. |
| **B-roll** | Mínimo y solo de proceso: manos escribiendo, una pizarra con un diagrama de funnel, una pantalla con una hoja de cálculo genérica, una llamada por videoconferencia. **Prohibido:** dinero, carros, relojes, aviones, casas, piscinas, playas, celebridades. |
| **Música** | Un colchón muy bajo (−28 a −32 dB) o nada. Sin drops, sin subir en el CTA. Si duda, sin música. |
| **Subtítulos** | Quemados, según indicación de §4. Se entregan además como .srt para YouTube. |
| **Gráfica** | Marca de agua discreta "Quilla" en esquina inferior derecha desde el segundo 3. Card final de 5 s con URL. Sin animaciones de logo. |
| **Cortes por guion** | **3 por guion = 9 piezas:** (1) máster 16:9 completo · (2) versión 16:9 de 30–40 s con hook + filtro + CTA · (3) Short 9:16 de 20–30 s con solo el hook y el CTA. |
| **Variantes de hook** | Grabar 2 hooks alternativos por guion (mismo texto con otra primera frase) para poder rotar sin regrabar. |

Entregable del editor: 9 piezas + 6 hooks alternos + .srt + thumbnails sobrios para in-feed (foto del vocero, fondo neutro, texto máximo 5 palabras: "¿Audiencia o empresa?", "Para quién no es", "Qué pasa después").

## 6. Landing: estructura y copy

Dominio: `quillagroup.com/aplicar` (o subdominio `aplicar.quillagroup.com`). HTML estático en Netlify (PASO 02); formulario de 5 pasos → webhook GHL → scoring (ver [[proyectos/quilla/sistema-aplicacion-scoring]]). Una sola página, sin menú, sin blog, sin popups. Tipografía seria, mucho aire, una sola foto (el vocero o nadie). Sin contadores, sin "quedan 3 cupos".

### 6.1 Hero

**H1:** Convertimos creadores en empresas.
**Sub:** Quilla diseña, construye y opera negocios alrededor de tu audiencia. Tú sigues siendo la cara. Nosotros quedamos detrás.
**CTA primario:** Aplicar (10 minutos)
**Línea bajo el botón:** Leemos cada aplicación. Respondemos en 24 horas hábiles.

### 6.2 Para quién es

**H2:** Trabajamos con pocos creadores. A propósito.

Buscamos creadores que ya tienen una audiencia real y quieren que esa audiencia sostenga una empresa, no solo un calendario de publicaciones.

- Más de 50,000 seguidores reales en tu plataforma principal (o más de 25,000 si tienes credibilidad fuerte: profesión, TV, radio). Una audiencia que interactúa: engagement de 2 % o más, o vistas promedio de 20 % de tus seguidores.
- Seis meses o más publicando con consistencia. Al menos la mitad de tu audiencia en Puerto Rico o hispana en Estados Unidos.
- Disposición a vender algo tuyo y a trabajar a revenue share. Cuatro horas a la semana, mínimo.

Si no cumples alguno de estos puntos hoy, la aplicación te lo va a decir antes de que pierdas el tiempo.

### 6.3 Cómo trabajamos

**H2:** Doce etapas. Ninguna se salta.

Descubrimiento → Auditoría de audiencia → Validación de oportunidad → Propuesta → Contrato → Diseño del modelo → Construcción → Pre-lanzamiento → Lanzamiento → Optimización → Escala → Nuevas líneas de ingreso.

Antes de la firma, hablamos, auditamos y proponemos. Después de la firma, construimos. Nunca al revés.

### 6.4 Los cuatro modelos

**H2:** Cuatro formas de trabajar juntos. Elegimos una contigo.

| Modelo | En una línea |
|---|---|
| **Creator Management** | Representamos tu negocio comercial: negociamos, cerramos y cobramos tus acuerdos con marcas. Comisión del 20 % sobre lo que te llega y 25 % sobre lo que originamos. |
| **Creator Monetization** | Construimos y operamos contigo un negocio propio (curso, membresía, servicio, producto). Revenue share 50/50 sobre el ingreso neto. |
| **Brand Partnerships** | Diseñamos y producimos campañas de marca a 3, 6 o 12 meses, con integración, derechos y medición. |
| **Creator Business Building** | Fundamos juntos una empresa alrededor de tu marca, con equity o participación definida. Caso a caso. |

### 6.5 Las reglas, de frente

**H2:** Lo que te vamos a decir en la llamada, te lo decimos aquí.

1. **No cobramos fee mensual por manejarte.** Cobramos un porcentaje de lo que construimos juntos. Si no funciona, no cobramos.
2. **No prometemos ingresos.** Ni en el ad, ni en la llamada, ni en el contrato. Te mostramos datos y un plan.
3. **No construimos sin contrato.** Ni un funnel, ni una página, ni un producto.
4. **Revenue share sobre neto, definido por escrito:** ingreso bruto menos procesamiento de pagos, pauta, comisiones de vendedores y costos directos acordados.
5. **Exclusividad comercial, no de contenido.** Tu contenido es tuyo. Lo que sí pedimos es representar en exclusiva lo que se vende.
6. **Contratos con término y salida.** 12 meses en management, 24 en monetization con revisión a los 12. Qué pasa si te vas está escrito antes de firmar.
7. **Tú pones tiempo real.** Cuatro horas a la semana, contenido orgánico y tu cara. Nosotros ponemos estrategia, oferta, funnel, CRM, equipo comercial y pauta.

### 6.6 FAQ

**¿Cuánto cuesta aplicar?** Nada. Aplicar no tiene costo y no te compromete a nada.
**¿Me van a llamar para venderme algo?** No. La llamada de 20 minutos es para entender tu situación. Si no hay encaje, te lo decimos ahí mismo.
**¿Qué es la auditoría de audiencia?** Un documento de dos páginas con datos reales de tu audiencia (demografía, interacción real, contenido que rinde, comparables) y dos o tres oportunidades de negocio que vemos. Se hace solo si pasaste la llamada.
**¿Ya tengo manager, puedo aplicar?** Sí. Quilla no reemplaza a un manager de agenda o de contenido; construye el negocio. Si hay conflicto de exclusividad comercial, lo vemos en la llamada.
**¿Trabajan con creadores fuera de Puerto Rico?** Hoy priorizamos Puerto Rico. Si eres hispano en Estados Unidos y tu audiencia lo es, aplica igual; abrimos ese mercado en los próximos meses.
**¿Qué pasa si aplico y no califico?** Te llega un correo con la razón. Puedes volver a aplicar en 6 meses.
**¿Quién está detrás de Quilla?** Un equipo en Puerto Rico con experiencia en marketing de respuesta directa, funnels y ventas. Preferimos que la atención esté en el creador, no en nosotros.

### 6.7 CTA final

**H2:** Si llegaste hasta aquí, probablemente ya sabes si esto es para ti.
**Botón:** Aplicar ahora
**Línea:** Cinco pasos. Diez minutos. Respuesta en 24 horas hábiles.
**Pie:** Quilla · Puerto Rico · hola@quillagroup.com `[DATO]` · Privacidad · Términos

## 7. Secuencia post-aplicación por banda

Todo sale de GHL, en texto plano, firmado por "Equipo Quilla". Sin imágenes, sin botones de color. Un enlace por email, máximo. Bandas según [[proyectos/quilla/sistema-aplicacion-scoring]]: **≥70 llamada · 45–69 revisión · <45 no califica**. Todos empiezan con "Hola [Nombre]," y cierran con "Equipo Quilla".

**Email 0 (todas las bandas, inmediato) · Asunto:** Recibimos tu aplicación
> Tu aplicación llegó completa. Una persona del equipo la revisa en las próximas 24 horas hábiles y te escribimos por este mismo correo con el siguiente paso.

### Banda A · Califica para llamada (≥70)

**Email 1 (≤24 h) · Asunto:** Tu aplicación califica: elige tu horario
> Revisamos tu aplicación y queremos hablar contigo. Es una llamada de 20 minutos por video; no es una presentación de ventas, es una conversación para entender qué has construido y qué quieres construir. Elige el horario que te sirva: [enlace calendario GHL]. Quien te llama es [Nombre del Scout], de Quilla.

**Email 2 (+48 h si no agendó) · Asunto:** ¿Te sirve alguno de estos horarios?
> Vimos que no elegiste horario todavía. Te dejamos tres opciones para esta semana: [martes 10 AM] · [miércoles 3 PM] · [jueves 11 AM]. Si ninguna te sirve, responde este correo con un día y hora.

**Email 3 (+5 días si no agendó) · Asunto:** Dejamos tu aplicación abierta 30 días
> No queremos insistir. Tu aplicación queda activa 30 días; si en ese tiempo quieres agendar, el enlace sigue funcionando: [enlace]. Después de eso, puedes volver a aplicar cuando te haga sentido.

### Banda B · Revisión humana (45–69)

**Email 1 (≤24 h) · Asunto:** Estamos revisando tu aplicación con más detalle
> Tu aplicación está en revisión. Hay un par de puntos que queremos ver mejor antes de decidir el siguiente paso; en algunos casos te vamos a pedir un dato adicional. Te escribimos en 2 días hábiles como máximo.

**Email 2 (≤72 h) · Asunto:** Un dato más para terminar de revisar
> Para completar la revisión, ¿nos compartes [captura de insights de los últimos 30 días / enlace a tu contenido con mejor rendimiento / confirmación de tus horas disponibles]? Responde a este correo con eso y cerramos la revisión en 24 horas.

**Email 3 (tras revisar) · Asunto:** Resultado de la revisión
> Terminamos la revisión. [Si sube a A: "Queremos hablar contigo; elige tu horario aquí: [enlace]". Si baja a C: "Hoy no vemos encaje por [razón concreta: tamaño de audiencia / interacción / disponibilidad]. Te explicamos qué tendría que cambiar y te invitamos a aplicar de nuevo en 6 meses."]

### Banda C · No califica (<45)

**Email 1 (≤24 h) · Asunto:** Tu aplicación: hoy no hay encaje
> Gracias por aplicar y por el tiempo que tomó. Revisamos tu aplicación y hoy no vemos encaje con el modelo de Quilla. La razón principal: [tamaño de audiencia por debajo del mínimo / interacción declarada por debajo del 1 % / disponibilidad menor a 4 h por semana / preferencia por fee fijo en lugar de revenue share]. No es un juicio sobre tu contenido. Es que el modelo que construimos no funciona con esos números todavía.

**Email 2 (+3 días) · Asunto:** Qué mirar si quieres volver a aplicar
> Si te interesa volver a aplicar más adelante, esto es lo que revisamos: audiencia real (no comprada), interacción sostenida, consistencia de 6 meses y disposición a vender. Con eso claro, la aplicación se reabre en 6 meses.

**Email 3 (+6 meses, automático) · Asunto:** Han pasado seis meses
> Hace seis meses aplicaste a Quilla. Si tus números cambiaron, la aplicación está abierta otra vez: [enlace]. Si no, ningún problema.

## 8. Reglas de mensaje (lo que nunca decimos)

| Nunca | Por qué | En su lugar |
|---|---|---|
| "$X al mes", "6 cifras", "7 cifras" | Promesa de ingresos. Ilegal en muchos casos y rompe el posicionamiento. | "Construimos un negocio con datos y un plan." |
| "Rápido", "en 30 días", "sin esfuerzo" | Vende velocidad; Quilla vende sistema. | "Entre dos y tres semanas para decidir; meses para construir." |
| "Gratis" | Prohibido en toda la marca. | "Sin costo", "no te compromete", "aplicar no cuesta nada". |
| "Libertad financiera", "vivir de tu pasión" | Lenguaje de gurú. | "Una empresa que no depende de que estés en vivo." |
| "Últimos cupos", "solo hoy" | Urgencia falsa. | "Tres a cinco creadores este año." (verdad, con calma) |
| "Garantizado", "asegurado" | Promesa. | "Con contrato, con números claros." |
| Nombrar a Level Up Media o AI Borinquen | Quilla no tiene vínculo público con las agencias. | "Un equipo en Puerto Rico con experiencia en respuesta directa y ventas." |
| Voseo, "plata", "laburo", "chico" por pequeño | Voz de Puerto Rico, tuteo. | "Tú tienes", "dinero", "trabajo", "pequeño/menor". |
| "Te manejamos" | Suena a manager de agenda. | "Construimos y operamos contigo." |
| Mostrar dinero, carros, lujo | Rompe el filtro. | Proceso, pizarra, datos, equipo. |

Toda pieza (ad, landing, email) pasa por esta tabla antes de publicarse. Lo revisa el Scout; lo aprueba Elvin solo la primera vez de cada tipo.

## 9. Plan de prueba de 30 días (arranca el día que la landing y los 3 ads están vivos)

| Semana | Qué hacemos | Presupuesto | Lo que miramos | Decisión al cierre |
|---|---|---|---|---|
| **1** | Encender 3 ad groups in-stream (A, B, C) solo con intención personalizada, geo PR. In-feed apagado. | $60/día | CPV, VTR por guion. Nada más. | Pausar cualquier guion con VTR <20 %. Mantener los otros. |
| **2** | Encender in-feed con los mismos 3. Encender remarketing (listas de video ≥50 %). | $60/día | CPV, VTR, CTR. Primeras aplicaciones. | Si CTR <0.5 % en un guion, cambiar thumbnail/título antes de tocar el video. |
| **3** | Encender placements (30 canales) y afinidad al 10 %. Shorts en remarketing. | $60/día | Costo por aplicación, % calificados (primer corte). | Si costo por aplicación >$60: revisar landing (§6) y paso 3 del formulario. Si % calificados <10 %: mover presupuesto a intención + subir guion B. |
| **4** | Sin cambios de estructura. Solo rotar hooks alternos en el guion más flojo. Preparar informe. | $60/día | Todo el tablero + llamadas agendadas + auditorías iniciadas. | Ver criterios abajo. |

### Criterios al día 30

**Escalar a $100/día** si se cumplen las cuatro: (1) CPV ≤ $0.10 y VTR ≥ 25 % en al menos 2 guiones (tolerancia sobre el target porque es data de 30 días) · (2) costo por aplicación ≤ $50 · (3) % calificados ≥ 12 % · (4) al menos 2 llamadas de descubrimiento hechas con perfil correcto (el Scout lo confirma, no el sistema).

La escala a $100/día se sostiene solo si a los 90 días el costo por creador firmado es ≤ $3K y hay ≥2 firmados. Si no, vuelve a $60.

**Mantener a $60/día y ajustar** si se cumplen 2 o 3 de las cuatro. Un ciclo más de 30 días con los cambios anotados en la lectura semanal.

**Apagar y volver a la mesa** si: costo por aplicación >$80 después de corregir landing, o % calificados <8 % después de mover a intención y subir guion B, o cero llamadas con perfil correcto en 30 días.

Apagar no significa abandonar YouTube: significa que el mensaje o el vocero no están filtrando. Se revisa con Elvin en una sesión de 45 min y se decide si es guion, vocero, landing o audiencia. Mientras tanto, la adquisición sigue por los canales 1–3 de [[proyectos/quilla/adquisicion-creadores]] (networking, referidos, Scout), que no dependen de la pauta.

Todo lo que se aprenda en estos 30 días se anota en [[proyectos/quilla/decisiones]] con fecha, para no repetir pruebas.
