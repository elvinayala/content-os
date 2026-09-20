---
proyecto: Quilla
tipo: organigrama
fecha: 2026-09-15
estado: borrador v1
relacionado: "[[proyectos/quilla/plan-maestro]] · [[perfil-ceo]] · [[organigrama]] · [[proyectos/quilla/onboarding-y-operacion]] · [[proyectos/quilla/plan-financiero]] · [[proyectos/quilla/adquisicion-creadores]] · [[proyectos/quilla/roadmap]]"
---

# Organigrama y KPIs · Quilla

> **Tesis del documento:** Quilla se diseña desde el día 1 para que Elvin no sea el cuello de botella. En sus agencias el patrón fue ser el motor de todo hasta la 1 AM (ver [[perfil-ceo]]); aquí ese patrón no entra. Cada área tiene un dueño que decide dentro de su alcance, cada contratación se dispara por una señal medible y no por sensación, y las únicas tres cosas que pasan por Elvin están escritas abajo.

---

## 1. Principio: Quilla no depende de Elvin

**Lo que solo hace Elvin (y nada más):**

| Decisión | Por qué es suya | Cómo se le presenta |
|---|---|---|
| Aprobar la firma de cada creador | Es la relación estratégica y el nombre que carga el roster | Ficha + auditoría + propuesta en un hilo de Slack; responde "sí / no / hablar" en 48 h |
| Aprobar acuerdos > $25K | Compromete caja o reputación más allá del régimen mensual | Memo de 1 página de Ops/Finance con riesgo, plazo y salida |
| Estrategia | Qué mercados, qué modelos, qué fase; se revisa en la trimestral | Propuesta escrita del equipo; él decide, no redacta |

**Todo lo demás lo decide el equipo dentro de su alcance:** oferta y precio de un venture, contratar a un setter, prender o apagar pauta dentro del presupuesto, aceptar o rechazar un brief de partnership por debajo de $25K, pausar un venture por enfriamiento, elegir herramientas dentro del stack aprobado, escribir y cerrar SOPs.

**Regla de ruteo (heredada de [[organigrama]]):** cuando algo sale de una reunión o de Slack y tiene dueño por rol, va al rol, no a Elvin, aunque Elvin lo haya mencionado. Si Elvin debe estar al tanto, se marca `saber`; si necesita su decisión, `decidir`; `hacer` solo si de verdad lo ejecuta él (ver la lista corta en [[proyectos/quilla/roadmap]] §8).

**Regla de silencio:** si Elvin no responde una aprobación en 48 h, la decisión no se toma sola; el owner la escala una vez por Slack con "necesito decisión antes del <fecha>". Si tampoco responde, el venture espera. Nadie construye ni firma "asumiendo que dirá que sí".

---

## 2. Las 4 áreas · roles iniciales y señales de contratación

| Área | Rol inicial | Quién | Modalidad | Costo mensual | Señal que dispara la siguiente contratación |
|---|---|---|---|---|---|
| **1. Creator Acquisition / Relations** | Creator Scout (Head of Creator Relations) | Humano contratista | Part-time | $2,000 base + $1,500 (Tier 2) / $3,000 (Tier 1) por creador firmado + 5 % override de la comisión de management del año 1 `[DATO]` | ≥ 12 reuniones calificadas/mes sostenidas 2 meses y el Scout no da abasto → segundo Scout part-time o pasar el primero a full-time |
| | Elvin (relaciones estratégicas) | Humano | Fundador, no operativo | $0 | — |
| | Agente de scoring (kit de aplicación → GHL) | Agente IA | 24/7 | Incluido en stack | — |
| **2. Creator Monetization** | Head of Monetization | Humano | Fractional (desde el mes 3) | $2,500 `[DATO]` | 3 ventures activos → full-time (≈ $5,000–6,500 `[DATO]`) |
| | Operador de funnels (GHL / Skool / Stripe) | Humano contratista | Por venture (desde el primer contrato firmado) | $800–1,500 por venture construido `[DATO]` + $300/mes por venture en evergreen `[DATO]` | 2 ventures en construcción a la vez → segundo operador |
| | Equipo de agentes IA del Content OS (Jarvis + skills) | Agentes IA | Interno, 24/7 | Costo de API `[DATO]` (~$100–200/mes) | — (ver §7) |
| | Setters / closers | Humanos contratistas | Solo a comisión, por venture high-ticket | Comisión sobre ventas (se descuenta del neto) | ≥ 15 llamadas/mes en un venture → closer dedicado |
| **3. Brand Partnerships / BD** | Partnerships Lead | Humano | A comisión (desde el mes 2) | 15–20 % de la comisión o margen de Quilla en cada cierre `[DATO]` | $30K/mes en partnerships sostenidos 2 meses → salario base + comisión menor |
| **4. Operations / Finance / Legal** | Ops/Finance | Humano | Part-time | $1,200–1,800 `[DATO]` | 3 ventures activos + 5 creadores firmados → full-time |
| | Abogado externo | Humano | Por proyecto y retainer | $5K inicial (LLC + term sheets + contratos) + $300/mes recurrente compartido con contador `[DATO]` | — |
| | Contador | Humano | Mensual | Incluido en los $300/mes `[DATO]` | > $50K/mes de ingreso bruto agregado → contador dedicado |
| **Transversal** | Vocero de los YouTube Ads | Humano socio/contratista | Buyout o retainer | $500/mes `[DATO]` | — (no es rol operativo; ver [[proyectos/quilla/vocero-y-produccion-ads]]) |

**Totales de nómina en régimen (mes 3 en adelante):** ≈ $6,500–8,000/mes `[DATO]` incluyendo Scout, Head fractional, Ops part-time, vocero, legal/contable; los operadores y comisiones son variables por venture y se cargan al neto de cada venture (ver [[proyectos/quilla/plan-financiero]]).

**Regla de contratación:** nadie pasa a full-time sin 3 ventures activos (compuerta de [[proyectos/quilla/roadmap]]). Antes de eso, todo es part-time, fractional o comisión. La señal de la tabla tiene que sostenerse 2 meses; un pico de un mes no contrata a nadie.

---

## 3. Organigrama a 90 días y a 12 meses

### 3a. A 90 días (3 creadores firmados, 1 lanzamiento hecho)

```
                    ┌──────────────────────────┐
                    │ Elvin · CEO / estrategia │  aprueba firmas, > $25K, estrategia
                    └────────────┬─────────────┘
                                 │  (trimestral + Slack `decidir`)
     ┌───────────────┬───────────┴───────────┬────────────────────┐
     │               │                       │                    │
┌────┴─────┐  ┌──────┴──────────┐  ┌─────────┴────────┐  ┌────────┴────────┐
│ Scout    │  │ Head of         │  │ Partnerships     │  │ Ops/Finance     │
│ part-time│  │ Monetization    │  │ Lead (comisión)  │  │ part-time       │
│          │  │ fractional      │  │                  │  │ + abogado       │
└────┬─────┘  └──────┬──────────┘  └──────────────────┘  │ + contador      │
     │               │                                   └─────────────────┘
 agente de     ┌─────┴────────────┐
 scoring       │ Operador funnels │  1 por venture en construcción
 (kit → GHL)   │ (contratista)    │
               └─────┬────────────┘
                     │
               ┌─────┴────────────────────────┐
               │ Agentes IA (Jarvis + skills) │  uso interno, sin marcas expuestas
               │ setter a comisión (si HT)    │
               └──────────────────────────────┘
```

| Rol | Estado al día 90 |
|---|---|
| Elvin | 3 aprobaciones de firma hechas; 1 trimestral hecha |
| Scout | Contratado el día ≤ 30; 8 reuniones calificadas/mes |
| Head of Monetization | Fractional desde el mes 3; dueño de 1 venture lanzado + 1 en construcción |
| Operador de funnels | 1 contratista, 1–2 ventures |
| Partnerships Lead | A comisión desde el mes 2; 1 partnership cerrado |
| Ops/Finance | Part-time; LLC, GHL, DocuSign, ledger y P&L mensual corriendo |
| Vocero | Elegido el día ≤ 30; 3 ads grabados el día ≤ 60 |

### 3b. A 12 meses (5–8 creadores, 2–3 ventures con ingresos)

```
                    ┌──────────────────────────┐
                    │ Elvin · CEO / estrategia │
                    └────────────┬─────────────┘
     ┌───────────────┬───────────┴───────────┬─────────────────────┐
┌────┴──────────┐ ┌──┴───────────────────┐ ┌─┴──────────────────┐ ┌┴──────────────────┐
│ Creator       │ │ Head of Monetization │ │ Partnerships Lead  │ │ Ops/Finance       │
│ Relations     │ │ FULL-TIME            │ │ base + comisión    │ │ full-time (si     │
│ Scout ×1–2    │ │                      │ │ (si ≥ $30K/mes)    │ │ 3 ventures + 5    │
│               │ │ ├ Operador funnels ×2│ │ ├ Roster concierge │ │ creadores)        │
│ + referidos   │ │ ├ Setter/closer por  │ │ └ Producción por   │ │ ├ abogado         │
│ + YouTube Ads │ │ │  venture HT        │ │   campaña (contra- │ │ ├ contador        │
│   (vocero)    │ │ └ Agentes IA         │ │   tistas)          │ │ └ ledger + P&L    │
└───────────────┘ └──────────────────────┘ └────────────────────┘ └───────────────────┘
```

| Rol | Estado al mes 12 | Condición para que exista |
|---|---|---|
| Head of Monetization full-time | Dueño de 2–3 ventures con ingresos y del pipeline de nuevos | 3 ventures activos (compuerta) |
| Operadores ×2 | Uno en construcción, uno en evergreen/optimización | 2 construcciones simultáneas sostenidas |
| Segundo Scout o Scout full-time | Cubre mercado hispano de EE. UU. (primer creador fuera de PR) | ≥ 12 reuniones calificadas/mes por 2 meses |
| Partnerships Lead con base | Vende paquetes 3/6/12 meses y campañas multi-creador | $30K/mes en partnerships por 2 meses |
| Ops/Finance full-time | Contratos, cobros, ledger, reportes, SOPs, herramientas | 3 ventures + 5 creadores |
| Decisión de plataforma Fase 2 | Solo si ≥ 25 creadores en roster y ≥ 30 briefs/mes | Métricas, no deseo |

---

## 4. Matriz RACI · las 15 decisiones más frecuentes

R = responsable (ejecuta) · A = aprueba (una sola persona) · C = consultado · I = informado

| # | Decisión | Elvin | Scout | Head Monet. | Operador | Partn. Lead | Ops/Fin |
|---|---|---|---|---|---|---|---|
| 1 | Pasar una aplicación de "revisión humana" a "calificado · agendar" | I | R/A | C | — | — | — |
| 2 | Hacer o no la auditoría de audiencia | — | C | R/A | — | — | I |
| 3 | Modelo sugerido para un creador (management / monetización / partnerships / BB) | I | C | R/A | — | C | — |
| 4 | Enviar propuesta a un creador | I | C | R | — | — | A (números) |
| 5 | Firmar a un creador | **A** | C | R | — | — | R (contrato) |
| 6 | Acuerdo, setup fee o compromiso > $25K | **A** | — | R | — | R | C |
| 7 | Oferta y precio de un venture | I | — | R/A | C | — | C |
| 8 | Prender / apagar / subir pauta de un venture dentro del presupuesto | I | — | R/A | R | — | C |
| 9 | Contratar setter o closer a comisión para un venture | I | — | R/A | — | — | C |
| 10 | Aceptar o rechazar un brief de partnership < $25K | I | — | C | — | R/A | C |
| 11 | Precio y margen de un paquete de partnership | I | — | C | — | R/A | C |
| 12 | Pausar un venture por enfriamiento del creador | I | — | R/A | I | — | C |
| 13 | Cerrar un venture / aplicar build-lock, tail u opción de compra | **A** | — | R | I | — | R (abogado) |
| 14 | Pago mensual del rev share (día 10) | I | — | C | — | — | R/A |
| 15 | Subir YouTube Ads de $60 a $100/día | **A** | C | C | — | — | R (dato de costo por firma) |

**Lectura rápida:** Elvin es A en 4 de 15. En las otras 11 se entera. Si en la práctica aparece una decisión que no está en esta tabla y nadie sabe quién la toma, la toma el Head of Monetization y se agrega a la tabla en el siguiente lunes de operaciones.

---

## 5. KPIs por área

Targets a 90 días y a 12 meses. Los `[DATO]` se calibran con el primer trimestre real.

| Área | KPI | Definición | Target 90 días | Target 12 meses |
|---|---|---|---|---|
| **Acquisition** | Reuniones calificadas | Llamadas de 20 min con creadores de score ≥ 70 o revisión aprobada | 8/mes (desde el mes 2) | 12/mes |
| | Auditorías entregadas | Auditorías de 2 páginas completadas | 3 en total | 3–4/mes |
| | Firmas | Contratos en DocuSign completados | 3 acumuladas | 5–8 acumuladas |
| | Costo por firma | (Scout base + bonos + YouTube Ads + producción prorrateada) ÷ firmas | ≤ $3K `[DATO]` | ≤ $2.5K `[DATO]` |
| | Costo por aplicación (YouTube) | Gasto en YouTube Ads ÷ aplicaciones completas | ≤ $40 `[DATO]` | ≤ $30 `[DATO]` |
| | % de aplicaciones calificadas | Score ≥ 70 ÷ aplicaciones completas | ≥ 15 % `[DATO]` | ≥ 20 % `[DATO]` |
| **Monetization** | Ventures activos | Ventures en etapa 7 o posterior | 1 lanzado + 1 en construcción | 2–3 con ingresos |
| | Tiempo a lanzamiento | Días desde firma hasta cierre de ventana de lanzamiento | ≤ 60 días `[DATO]` | ≤ 45 días promedio `[DATO]` |
| | Ingreso bruto por venture | Cobros del mes | Primer ingreso registrado | $15K–$25K/mes en el principal `[DATO]` (escenario base) |
| | Ingreso neto por venture | Bruto − procesamiento − pauta − comisiones − costos directos | ≥ 60 % del bruto `[DATO]` | ≥ 65 % del bruto `[DATO]` |
| | Share mensual de Quilla | Suma del 50 % del neto de todos los ventures | Primer share cobrado | ≈ $16K/mes `[DATO]` (escenario base) |
| | Retención / churn | Según playbook | Medida desde el primer mes | Dentro del umbral del playbook |
| **Partnerships** | Propuestas enviadas | Propuestas formales a marcas | 1 | 3–4/mes |
| | Cerrados | Contratos firmados con anticipo cobrado | 1 | 6–8 en el año `[DATO]` |
| | Valor promedio | Valor total del paquete ÷ cerrados | ≥ $15K `[DATO]` | ≥ $20K `[DATO]` |
| | Margen | (Comisión o margen de Quilla) ÷ valor del paquete | 20–25 % agente / 30–40 % principal | Igual, con mezcla ≥ 30 % principal |
| | Ingreso anual en partnerships | Suma de paquetes cerrados | — | $120K `[DATO]` (escenario base) |
| **Ops / Finance** | Burn mensual | Salida de caja del mes sin pauta de ventures | ≤ $8K `[DATO]` | ≤ $8K hasta el break-even; luego crece con señal |
| | Caja | Saldo disponible | ≥ $12K al día 90 `[DATO]` | Positiva; break-even sostenido en el mes 7 `[DATO]` |
| | Margen operativo | (Ingreso de Quilla − burn) ÷ ingreso | Negativo (esperado) | ≥ 0 desde el mes 9 `[DATO]` |
| | Cobros a tiempo | Anticipos y shares cobrados dentro de 10 días de la fecha | 100 % | ≥ 95 % |
| | Contratos firmados antes de construir | Ventures construidos con DocuSign completado ÷ ventures construidos | **100 %** | **100 %** |
| | SOPs documentados | SOPs de las 12 etapas escritos con el primer caso | 12/12 | Versión 2 con tiempos reales |

**Un solo número por área para el tablero semanal:** Acquisition = firmas acumuladas · Monetization = share mensual de Quilla · Partnerships = valor cerrado acumulado · Ops = meses de caja restantes.

---

## 6. Ritmo de reuniones

| Ritual | Cuándo | Duración | Quién | Formato | Sale de aquí |
|---|---|---|---|---|---|
| **Diaria async** | Cada día antes de las 10 AM | 3 líneas por persona | Todo el equipo | Slack `#daily`: ayer / hoy / bloqueo | Bloqueos con dueño; nada de discusión en el hilo |
| **Lunes de operaciones** | Lunes 9:00 AM | 45 min | Equipo completo, sin Elvin | Tablero de ventures por etapa + timeboxes vencidos + alertas | Acciones con dueño y fecha; lista `decidir` para Elvin |
| **Viernes de pipeline** | Viernes 11:00 AM | 30 min | Scout + Head of Monetization + Partnerships Lead | Pipeline "Creadores" y "Partnerships" en GHL, etapa por etapa | Quién se llama la semana que viene; qué propuesta sale |
| **Mensual de P&L** | Día 8 | 60 min | Head of Monetization + Ops/Finance + operador | Ledger cerrado por venture; burn; caja | Pagos del día 10; reportes a creadores; alertas al trimestral |
| **Trimestral de estrategia** | Cada 90 días | 90 min | Elvin + líderes de área | Seguir / ajustar / parar por venture; contrataciones por señal; mercado | Decisiones de Elvin escritas en `decisiones.md` |

**Reglas:** ninguna reunión sin agenda escrita 24 h antes. Ninguna reunión termina sin acciones con dueño y fecha en Slack. Elvin solo está en la trimestral y en lo que él pida ver; el resto le llega como `saber` en el brief diario.

---

## 7. Cómo se usa el equipo de agentes IA del Content OS (uso interno)

Elvin ya tiene un Content OS con Jarvis y skills (ver `CLAUDE.md` del repo y [[proyectos/quilla/tecnologia]]). Quilla lo usa como **capacidad interna**, no como producto ni como marca. Reglas:

| Agente / skill | Para qué lo usa Quilla | Quién lo opera | Qué NO se hace |
|---|---|---|---|
| **Jarvis** (chat + tool loop) | Consultas rápidas sobre métricas, vault y ganchos; encolar trabajos pesados (transcribir un perfil, tandas de ideas) | Head of Monetization, operador | No se le da acceso al creador; no se muestran pantallas del HUD a terceros |
| **`analizar-competidor`** | Parte del insumo de la auditoría de audiencia (etapa 2): qué formatos y ganchos le funcionan al creador y a sus pares | Head of Monetization | No se entrega el output crudo al creador; se reescribe en el formato de 2 páginas y sin referencias a las marcas de Elvin |
| **`ideas-ganadoras`** | Tandas de ideas para el contenido de venta y de calentamiento (etapas 7–8) | Operador de funnels | No se usan los pilares ni ángulos de AI Borinquen / Level Up / Shadow Operator; se crea un perfil de marca por creador |
| **`guionar-reel`** | Primeros borradores de los reels de venta que el creador graba (cantidad fija por playbook) | Operador de funnels | El creador siempre recibe un guion adaptado a su voz; nunca un guion con el estilo de otra marca |
| **`transcribir-perfil`** (worker + Apify) | Transcribir el perfil del creador para la auditoría y para extraer sus propios ganchos | Encolado por Jarvis; ejecuta el worker | Solo perfiles públicos y con autorización del creador |
| **`armar-carrusel` / `redactar-historias`** | Piezas de calentamiento y de lanzamiento | Operador | Igual: perfil de marca por creador |

**Separación de marcas (obligatoria):**
- Se crea un archivo de estilo por creador en `vault/proyectos/quilla/creadores/<handle>/estilo.md` y las skills se invocan con ese estilo, no con `vault/estilo/*.md` de las agencias.
- Ningún entregable a un creador, marca o socio menciona Level Up Media, AI Borinquen, Shadow Operator, Jarvis, ni el nombre de ningún agente interno. Para el creador, "el equipo de Quilla" produjo el borrador.
- Los outputs se guardan en la carpeta del creador dentro de `vault/proyectos/quilla/`, no en las carpetas de contenido de las agencias.
- Los agentes son productividad interna: aceleran, no reemplazan al owner humano de cada etapa. El Head of Monetization firma cada auditoría y cada propuesta.

---

## 8. Cultura en 8 reglas

1. **Sin contrato no se construye.** Es la regla que define a Quilla. Se dice en la entrevista de cada contratación.
2. **El creador mantiene la atención; Quilla se queda detrás.** No pedimos crédito público, no aparecemos en el contenido, no etiquetamos. Holding silencioso.
3. **Cada decisión tiene un solo dueño.** Si dos personas creen que deciden lo mismo, se arregla en el lunes de operaciones, no en el momento.
4. **Nunca prometemos ingresos.** A un creador, a una marca, a un socio. Mostramos modelos, rangos de mercado y lo que ya pasó. Nada más.
5. **Timebox o no existe.** Toda tarea tiene fecha. Lo que se vence se escala, no se estira en silencio.
6. **Escrito > dicho.** Lo que no está en Slack o en el vault no pasó. Actas el mismo día. Reportes el día 10.
7. **Elvin decide, no ejecuta.** Si le llega un pendiente operativo, se devuelve al rol. Si un rol le pide que apruebe algo que está dentro de su alcance, ese rol no está decidiendo.
8. **Premium y calmado.** Sin urgencia artificial, sin lenguaje de gurú, sin descuentos por presión. Se le habla al creador como a un socio de negocio, porque lo es.
