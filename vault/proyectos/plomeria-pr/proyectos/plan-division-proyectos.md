---
proyecto: Resuelto · División Proyectos
tipo: plan-division
fecha: 2026-09-13
base: "[[plan-maestro]] · [[modelo-operativo-agencia]] · [[plan-expansion]]"
---

# Resuelto Proyectos · Cómo se integra la división sin construir otra empresa

> **La tesis, en una línea:** Resuelto adquiere el cliente, lo precalifica, visita, cotiza con un Cost Book propio, cierra, cobra, asigna un contratista verificado, supervisa y respalda. El contratista ejecuta. No es un directorio. No vende leads. Vende proyectos.

---

## 0. Lo primero: el marco legal que define la división

Verificado hoy: en Puerto Rico, quien se dedica a mejoras a propiedades residenciales debe inscribirse en el **Registro de Contratistas de DACO** (solicitud jurada ante notario, $205, certificado de antecedentes penales, y una **fianza mínima de $4,000** para contratistas nuevos). El consumidor tiene derecho a un contrato escrito con el número de registro.

Consecuencias directas para el modelo:
1. **Resuelto se registra en DACO** como contratista. Es Resuelto quien firma el contrato con el consumidor y cobra; ante DACO, Resuelto es el contratista. Sin esto no se puede vender el primer proyecto.
2. **Registro DACO vigente es requisito no negociable de Resuelto Verified.** Un contratista sin registro no entra a la red, punto.
3. **Oficios licenciados dentro del proyecto** (plomería, electricidad) los ejecutan licenciados: ya tenemos la red de plomeros; los peritos electricistas entran como subcontratistas verificados.
4. **Permisos**: poda o remoción de árboles puede requerir permiso del DRNA o municipal según especie y ubicación; piscinas y ampliaciones pasan por OGPe/municipio. El Cost Book lleva una línea de permisos por categoría y el contrato dice quién los gestiona.
5. **Contrato de mejoras al hogar** con las cláusulas que DACO exige, hitos de pago, retención, garantía y protocolo de abandono. **El abogado revisa antes del primer cierre.** Esto se suma a la consulta de la LLC que ya está pendiente.

---

## 1. Qué reutilizamos (casi todo) y qué es nuevo

| Capa | Ya existe (plomería) | Cómo la usa Proyectos | Nuevo |
|---|---|---|---|
| **Marca y landing** | Resuelto, resueltopr.com en Netlify, brand kit | Misma marca. Nueva sección `/proyectos` con 8 categorías y formulario de precalificación → WhatsApp | Página `/proyectos` + `/contratistas` |
| **Agente de WhatsApp** (`agente/`) | Cotiza plomería, agenda, cobra, recluta plomeros | Se le añade un **tercer flujo**: dueño con proyecto → precalifica, da rango, agenda visita del cotizador. Y un cuarto: contratista que quiere entrar a la red | 3 herramientas nuevas (ya integradas: `precalificar_proyecto`, `agendar_visita_cotizacion`, `registrar_contratista`) |
| **Almacén de datos** (`almacen.ts`) | contactos, trabajos, candidatos | Mismo patrón: `Proyecto` y `Contratista` (integrados). JSON hoy → Postgres cuando haya 50 proyectos | Tipos + colecciones |
| **Calendario** (Google) | Un calendario por plomero | Un calendario por **cotizador**; `data/cotizadores.json` mapea territorios → cotizador | Calendarios de cotizadores |
| **Cobros** (Stripe + ATH Móvil) | Link de pago por trabajo | Mismo módulo, con **hitos**: depósito, avance, final con retención. Para montos grandes, ACH/transferencia para no regalar 2.9% a Stripe | Hitos en `cobros.ts` (Fase 9) |
| **CRM** (GoHighLevel) | Pipeline "Trabajos" | Pipeline nuevo **"Proyectos"** (11 etapas, abajo) + pipeline **"Contratistas"**. Mismos contactos, etiquetas por categoría | 2 pipelines + campos |
| **Anuncios** (Bori) | Campaña Relámpago a WhatsApp | Una campaña **por categoría** a WhatsApp, con el reparto de presupuesto de Elvin. Mismo cliente `bori.ts` | Creativos por categoría |
| **Orgánico** (Zernio) | Cola de piezas | Mismas cuentas; contenido de antes/después de proyectos | Piezas nuevas |
| **Datos / dashboard** | Hoja "Trabajos" + `/admin/estado` | Hoja "Proyectos" + tablero por cotizador (Fase 7) | Vistas nuevas |
| **Cost Book + motor de precio** | Menú fijo de plomería (`menu.json`) | **Nuevo**: `costbook.json` + `cotizador.ts` (motor de márgenes, ya construido). El menú de plomería es el Cost Book más simple posible; este es su hermano mayor | Cost Book, motor, app del cotizador |
| **Coordinador de Ops** | Despacho de plomeros | Mismo rol absorbe la asignación de contratistas y el seguimiento de hitos hasta que el volumen pida a alguien dedicado | — |

**Lo que es genuinamente nuevo son cuatro cosas: el Cost Book, el motor de cotización con control de precio, la app del cotizador (tablet) y el rol de QA/Recovery.** Todo lo demás es extender lo que hay.

---

## 2. Qué construir primero (y en qué orden)

El orden lo dicta una regla: **no se pueden prender anuncios hasta tener a quién asignarle el proyecto y con qué precio cotizarlo.** Por eso contratistas y Cost Book van antes que marketing.

| # | Fase | Qué se entrega | Quién | Cuándo |
|---|---|---|---|---|
| 1 | **Arquitectura operacional** | Este documento; tipos, herramientas del agente, motor de precio y esquema del Cost Book **ya en el código** | Claude | ✅ Hoy |
| 2 | **Reclutamiento de contratistas** | Landing `/contratistas`, 4 flyers, campaña Bori a WhatsApp, el agente registra y filtra; outreach a ferreterías y suplidores | Claude + Elvin (visitas físicas) | Semana 1–3 |
| 3 | **Resuelto Verified** | Checklist de 15 criterios, 3 niveles (Nuevo → Verificado → Preferido), auditoría documental, prueba con 1 proyecto pequeño supervisado | Claude (proceso) + Coordinador (verificación) | Semana 2–4 |
| 4 | **Cost Book** | Sesiones de levantamiento con 3 contratistas por categoría; la pregunta es siempre "¿cuánto necesitas recibir para ejecutar bien esto y ganar?"; cargar `costbook.json` con costos validados | Elvin/Coordinador levantan · Claude estructura | Semana 2–5 |
| 5 | **Sistema de cotización** | App web del cotizador (tablet): scope → Cost Book → precio recomendado, mínimo y aprobación → propuesta PDF con marca → contrato → depósito. Corre en el mismo Express del agente | Claude | Semana 3–6 |
| 6 | **Cotizadores** | 1 cotizador Metro (empleado, $1,500 + 2.5%); perfil, guion de visita, checklist de inspección, entrenamiento con la app | Elvin contrata · Claude prepara material | Semana 4–6 |
| 7 | **CRM + pipeline** | Pipelines "Proyectos" y "Contratistas" en GHL, campos, reporte diario automático desde la app (nada por WhatsApp), tablero por cotizador | Claude | Semana 3–5 |
| 8 | **QA + Recovery** | Encuesta automática post-visita por WhatsApp (el agente hace las 13 preguntas), cola de recuperación para el humano, reglas de comisión 2% + 0.5% | Claude (automatización) + persona de Recovery (part-time; al inicio, el Coordinador) | Semana 5–7 |
| 9 | **Garantía y control de calidad** | Hitos de pago (40/50/10 por defecto), retención final, inspección de aceptación con fotos, proceso de reclamación, protocolo de abandono, límites y exclusiones. **Revisión legal antes de publicar** | Claude redacta · Abogado revisa | Semana 4–7 |
| 10 | **Marketing** | Landing `/proyectos` con 8 categorías, creativos por categoría, campañas Bori con el reparto de $117/día, audiencias de remarketing, piezas de reconocimiento | Claude vía Bori y Zernio | Semana 6–8 |
| 11 | **Lanzamiento** | Prender con 3 categorías (baños, cocinas, poda) y 5+ contratistas verificados; primeros 5 proyectos como piloto controlado | Todos | Semana 8 |
| 12 | **Optimización 90 días** | Mover presupuesto por economics reales, ajustar Cost Book con lo ejecutado, decidir segundo cotizador | Claude propone · Elvin decide | Semana 9–20 |

---

## 3. Los flujos, paso a paso

### 3.1 Cliente (dueño con un proyecto)

```
Anuncio / orgánico / referido
  → WhatsApp (agente): categoría · municipio · descripción · fotos · plazo · ¿propietario? · presupuesto aproximado
  → precalificar_proyecto: ¿territorio con cotizador? ¿ticket plausible para la categoría? → rango orientativo ("baños completos en PR van de $X a $Y")
  → agendar_visita_cotizacion: visita GRATIS del cotizador, ventana de 2 h, calendario del cotizador, oportunidad en GHL "Visita agendada"
  → Recordatorio día antes + 2 h antes (el agente) · confirmación de asistencia
  → VISITA (humano): inspección, medidas, fotos, scope en la app → Cost Book → precio → propuesta → cierre en sitio si es posible → contrato + depósito por link
  → Cerrado = contrato firmado + depósito recibido por Resuelto (solo entonces cuenta comisión)
  → Asignación a contratista Verified por categoría, zona y capacidad (Coordinador; después el sistema propone)
  → Ejecución con hitos: fotos de avance, pago de avance, inspección de aceptación, pago final menos retención
  → Reseña + cross-sell a los 30 días (cocina → pisos; poda → terraza)
No cerró → Recovery (13 preguntas) en 24–48 h → remarketing
```

### 3.2 Contratista

```
Anuncio / ferretería / referido → WhatsApp (agente) → registrar_contratista (categorías, zonas, DACO, seguro, capacidad, portfolio)
  → Verificación documental (Coordinador): identidad, DACO vigente, seguro, licencias del oficio si aplica, 3 referencias, portfolio
  → Entrevista 20 min → Levantamiento de costos (alimenta el Cost Book)
  → Estado "Verificado" → primer proyecto pequeño supervisado → "Preferido" tras 3 proyectos con rating ≥ 4.8 y cero reclamaciones
```

---

## 4. El Cost Book y el control de precio

**Regla de oro:** el cotizador no inventa precios. El sistema los calcula.

- **Cost Book** (`agente/data/costbook.json`): por categoría, una lista de partidas (demolición, mano de obra por oficio, materiales típicos, transporte, disposición de escombros, permisos, contingencia). Cada partida guarda **muestras reales** de contratistas (quién, cuándo, cuánto) y un costo validado cuando hay 3 o más muestras. Hoy está la estructura completa con las partidas; los costos se llenan en la Fase 4. **No hay números inventados.**
- **Motor** (`agente/src/cotizador.ts`, construido y probado): recibe el scope con costos → suma el costo de ejecución (lo que recibe el contratista) → aplica el margen por tramo → devuelve precio recomendado, mínimo sin aprobación, piso absoluto, comisión del cotizador e hitos. La **contingencia** por categoría (5–15%) es una reserva que sale de la parte de Resuelto y se libera si el proyecto cierra sin desvíos: no infla el precio al cliente.

| Tramo (precio al cliente) | Margen recomendado | Mínimo sin aprobación | Piso absoluto |
|---|---|---|---|
| Hasta $8,000 | 25% | 24% | 20% |
| $8,000 – $25,000 | 25% | 22.5% | 20% |
| Más de $25,000 | 22.5% | 21% | 20% |

Un descuento que baje del mínimo sin aprobación bloquea el cierre en la app y manda la solicitud al Coordinador/Elvin. **Nunca por debajo del 20%**, ni con aprobación. Ejemplo de calibración (verificado con `npm run cotizar -- --costo 9000`): costo de ejecución $9,000 → precio recomendado $12,000 → Resuelto $3,000 (de los que $900 quedan en reserva de contingencia) → contratista $9,000 → comisión del cotizador $300 → hitos $4,800 / $6,000 / $1,200.

---

## 5. Qué hace la IA y qué hace una persona

| Tarea | IA / automatización | Persona |
|---|---|---|
| Atención 24/7, precalificación, rango orientativo, agenda, recordatorios | ✅ Agente | Escalación |
| Análisis de fotos del cliente (tipo de trabajo, tamaño aproximado, alertas) | ✅ Claude ve las fotos antes de la visita y prepara al cotizador | — |
| Borrador del scope a partir de fotos + notas de voz de la visita | ✅ | Cotizador revisa y firma el scope |
| Cálculo de costo, margen, precio, descuentos permitidos | ✅ Motor | Aprobación de excepciones |
| Propuesta y contrato generados con marca | ✅ | Presentación y cierre en la propiedad |
| **La visita física, medir, cerrar** | — | **Cotizador** |
| Encuesta post-visita (las 13 preguntas) | ✅ Agente por WhatsApp | **Recovery** llama a los que no cerraron o dieron señales |
| Asignación de contratista | Propone (categoría, zona, capacidad, rating) | Coordinador confirma |
| Seguimiento de hitos, recordatorios de fotos de avance, links de pago | ✅ | Inspección de aceptación (foto/video; presencial en proyectos grandes) |
| Reseña, cross-sell a 30/90 días | ✅ | — |
| Reporte diario y tablero por cotizador | ✅ Sale de la app, no de WhatsApp | Elvin lee los viernes |
| Cost Book: consolidar muestras, detectar desvíos entre estimado y ejecutado | ✅ | Levantamiento con contratistas |
| Reclamaciones y abandono | Detecta y abre el caso | Coordinador resuelve |

---

## 6. Roles iniciales (lean, sin contratar antes de la demanda)

| Rol | Quién | Cuándo | Costo |
|---|---|---|---|
| Dirección, aprobaciones de precio, activar campañas, relación con contratistas clave | Elvin | Día 0 | — |
| Agencia + tecnología + procesos | Claude | Día 0 | — |
| **Coordinador/a de Operaciones** (ya previsto): verificación de contratistas, asignación, hitos, Recovery al inicio | Misma persona de plomería, más horas | Semana 2 | +$800/mes |
| **Cotizador Metro** (estimador + closer, empleado) | Contratar | Semana 4–6, con 15+ citas/semana en el embudo | $1,500 base + 2.5% |
| Contratistas Verified | 5 al lanzar (2 baños/cocinas, 1 poda, 1 general, 1 exteriores/piscinas) | Semana 3–8 | Variable |
| Abogado (DACO, contrato de mejoras, garantía) | Externo | Semana 1 | $1,500–2,500 |
| Persona de QA/Recovery dedicada | Cuando haya 40+ visitas/mes | Mes 4–6 | Part-time |
| Cotizadores 2–6 (Oeste, Sur, Norte, float) | Según demanda por territorio | Mes 4–12 | Mismo modelo |

---

## 7. KPIs (se miden desde la primera cita)

**Embudo:** leads → precalificados → citas agendadas → show rate → visitas completadas → propuestas → cierres (contrato + depósito) → asignados → completados → reseñas.

| KPI | Meta inicial | Rojo |
|---|---|---|
| CPL (WhatsApp) | $6–8 | > $15 |
| Costo por cita agendada | $30–50 | > $80 |
| Show rate | ≥ 75% | < 60% |
| Costo por visita completada | ≤ $65 | > $110 |
| Close rate (visita → cerrado) | ≥ 30% | < 20% |
| Ticket promedio | $12,000 | < $8,000 |
| **CAC por proyecto cerrado** | ≤ $250 | > $450 |
| GMV por $ de publicidad | ≥ 15× | < 8× |
| Revenue Resuelto por $ de publicidad | ≥ 3.5× | < 2× |
| Margen real vs. estimado por categoría | desvío ≤ 5 pts | > 8 pts |
| Error de estimación (costo real − Cost Book) | ≤ 10% | > 20% |
| Reclamaciones | ≤ 5% de proyectos | > 10% |
| Satisfacción post-proyecto | ≥ 4.8 | < 4.5 |
| Tiempo cita → cierre | ≤ 7 días | > 21 |
| Por cotizador: visitas, propuestas, close rate, GMV, ticket, depósitos, errores, reclamaciones | tablero semanal | — |

**No se optimiza por CPL solo.** Una categoría con CPL de $12 y close rate del 40% a $15K de ticket vale más que una con CPL de $5 que no cierra.

---

## 8. CRM: los dos pipelines en GoHighLevel

**Pipeline "Proyectos":** Lead → Precalificado → Visita agendada → Visita realizada → Propuesta enviada → **Cerrado (contrato + depósito)** → Asignado → En ejecución → Inspección → Completado → Reseña. Perdido con motivo obligatorio (precio, comparando, financiamiento, fecha, confianza, scope, representante, otro).

Campos por oportunidad: categoría, municipio, territorio, cotizador, contratista, precio, costo estimado, margen %, depósito, hitos pagados, fecha de visita, fuente, motivo de pérdida, rating, reclamación.

**Pipeline "Contratistas":** Aplicó → Documentos → Entrevista → Levantamiento de costos → Verificado → Preferido → Pausado/Descartado.

El reporte diario del cotizador **sale de la app**: cada visita cerrada en la app actualiza GHL y la hoja. No hay reporte manual por WhatsApp.

---

## 9. Riesgos y cómo se cubren

| Riesgo | Cobertura |
|---|---|
| **Vender sin registro DACO** | No se firma el primer contrato sin el registro y la fianza. Semana 1 con el abogado |
| **Contratista abandona a mitad** | Hitos de pago (nunca más del 40% adelantado al contratista), retención 10%, cláusula de sustitución, segundo contratista Verified por categoría antes de lanzar |
| **Cotizador baja precios por comisión** | El motor bloquea bajo el mínimo; comisión solo sobre cerrado + cobrado por Resuelto |
| **Cotizador se lleva al cliente** | Recovery llama a todos los cotizados; contrato con no-captación; pagos solo a Resuelto |
| **Error de estimación grande** | Contingencia por categoría; contratista confirma el costo antes de asignar; desvíos alimentan el Cost Book |
| **Mala ejecución dañe la marca** | Verified con prueba supervisada; rating mínimo; primer proyecto de cada contratista es pequeño |
| **Flujo de caja: Resuelto cobra y paga hitos** | Cuenta bancaria separada para depósitos de clientes; el depósito nunca se usa para otra cosa |
| **Permisos (árboles, piscinas)** | Línea de permisos en el Cost Book; el contrato dice quién los tramita; sin permiso no arranca |
| **Crecer en categorías antes que en contratistas** | Lanzar con 3 categorías y 5 contratistas; abrir una categoría solo con 2 Verified en ella |

---

## 10. Los primeros 30 / 60 / 90 días

### Días 1–30 · Cimientos
- Abogado: registro DACO de Resuelto, fianza, contrato de mejoras al hogar con hitos y garantía.
- Reclutar contratistas: landing `/contratistas`, campaña Bori, visitas a 10 ferreterías y suplidores de gabinetes, countertops y piscinas. **Meta: 25 aplicaciones, 8 verificados.**
- Cost Book: 3 contratistas por categoría en baños, cocinas y poda. **Meta: costos validados en las 3 categorías de lanzamiento.**
- Pipelines en GHL, app del cotizador v1, contrato y propuesta con marca.
- Perfil del cotizador publicado; entrevistas.

### Días 31–60 · Piloto controlado
- Cotizador Metro contratado y entrenado con la app.
- Landing `/proyectos` y creativos de baños, cocinas y poda.
- Prender Bori con **$60/día** (no los $117 todavía) en 3 categorías, solo Metro.
- **Meta: 20 visitas, 5 proyectos cerrados, 0 reclamaciones**, Cost Book ajustado con lo ejecutado.
- Encuesta post-visita automática y Recovery operando.

### Días 61–90 · Abrir el grifo
- Subir a $117/día con el reparto de Elvin, y moverlo a los 14 días según economics reales.
- Abrir las 5 categorías restantes solo donde haya 2 contratistas Verified.
- **Meta: 8–10 proyectos al mes**, ticket ≥ $12K, CAC ≤ $250, primeras 10 reseñas de proyectos.
- Decisión: segundo cotizador (Oeste o segundo Metro) según lista de espera por territorio.

---

## 11. Lo que ya está en el código (Fase 1 hecha)

- `agente/data/categorias-proyectos.json`: las 8 categorías con preguntas de precalificación, ticket plausible, tramo de margen, permisos y cross-sell.
- `agente/data/costbook.json`: estructura completa del Cost Book con las partidas por categoría, guion de levantamiento y campos para muestras. Costos en blanco a propósito.
- `agente/data/cotizadores.json`: mapa territorio → cotizador → calendario (con el cotizador Metro por contratar).
- `agente/src/cotizador.ts`: motor de precio con tramos, mínimos, aprobación, comisión e hitos. `npm run cotizar -- --costo 9000` lo demuestra.
- `agente/src/almacen.ts`: tipos `Proyecto` y `Contratista` con sus colecciones.
- `agente/src/herramientas.ts` + `prompt.ts`: el agente ya sabe precalificar un proyecto, agendar la visita del cotizador y registrar contratistas, con la voz y las reglas de Resuelto.
