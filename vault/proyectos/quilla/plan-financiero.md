---
proyecto: Quilla
tipo: proyecciones
fecha: 2026-09-15
estado: borrador v1 (todo `[DATO]`: supuestos de arranque, se recalibran con los primeros casos)
relacionado: "[[proyectos/quilla/plan-maestro]] · [[proyectos/quilla/servicios-y-revenue-share]] · [[proyectos/quilla/roadmap]] · [[proyectos/quilla/decisiones]]"
---

# Plan financiero básico · Quilla

> **En una línea:** con $40K de caja, Quilla aguanta 6 meses sin ingresos, llega al primer venture con ingresos entre el mes 4 y el 6, y en el escenario base cierra el año 1 con la caja recuperada y ~$21K/mes de ingreso. Si al mes 5 no hay un venture lanzado, se corta el burn a la mitad. Esa es la regla.

Todas las cifras son supuestos `[DATO]`. El modelo vive en un script sencillo (mes a mes) y se recalibra con cada caso real.

---

## 1. Inversión inicial (una vez)

| Rubro | Monto | Nota |
|---|---|---|
| Abogado: LLC + paquete de contratos (NDA, Management, Monetization, Partnership, Scout) | $5,000 | Ver [[proyectos/quilla/contratos]] |
| Producción de los 3 anuncios de YouTube | $4,000 | Un día de rodaje con productora local + edición |
| Marca y web (kit visual, dominio, landing, formulario) | $2,000 | Landing y formulario se construyen en el PASO 02; el kit visual sí se paga |
| Setup de herramientas (GHL, DocuSign, Slack, Apify) | $500 | |
| **Total** | **$11,500** | Queda $28,500 de los $40K para operar |

---

## 2. Burn mensual (operación)

| Rubro | Mes 1 | Mes 2 | Mes 3–6 | Mes 7–9 | Mes 10–12 |
|---|---|---|---|---|---|
| Creator Scout (base; incentivos aparte) | $2,000 | $2,000 | $2,000 | $2,000 | $2,000 |
| YouTube Ads ($60/día) | — | $1,800 | $1,800 | $1,800 | $1,800 |
| Head of Monetization (fractional) | — | — | $2,500 | $2,500 | $2,500 |
| Operador de funnels (part-time) | — | — | — | $1,500 | $1,500 |
| Ops / Partnerships coordinación (part-time) | — | — | — | — | $2,000 |
| Herramientas (GHL, Netlify, Apify, DocuSign, Slack) | $400 | $400 | $400 | $400 | $400 |
| Contador y legal recurrente | $300 | $300 | $300 | $300 | $300 |
| Vocero (retainer / uso de imagen) | $500 | $500 | $500 | $500 | $500 |
| Varios (viajes en la isla, software puntual) | $300 | $300 | $300 | $300 | $300 |
| **Total** | **$3,500** | **$5,300** | **$7,800** | **$9,300** | **$11,300** |

Fuera del burn (se pagan de ingresos que ya entraron): incentivos al Scout por firma ($1.5–3K), referidos, comisiones del Partnerships Lead, setters/closers de cada venture, y la pauta de los ventures (se adelanta y se recupera del neto del venture, no del burn de Quilla).

---

## 3. Cómo gana Quilla (unit economics por creador)

| Concepto | Monetization (venture típico) | Management | Partnerships |
|---|---|---|---|
| Tiempo de la primera conversación a la firma | 2–4 semanas | 2 semanas | — |
| Tiempo de la firma al primer ingreso | 8–12 semanas | 4–8 semanas | 4–6 semanas |
| Costo de adquisición (CAC) por creador firmado | $2–3K (Scout + ads + horas) | $1–2K | — |
| Costo de construcción hasta el lanzamiento | $4–8K en horas de equipo + $1.5–3K de pauta adelantada | $500 | $1K por propuesta |
| Ingreso bruto del venture en régimen (mes 6+) | $15–25K/mes | — | — |
| Neto (≈75 % del bruto) | $11–19K/mes | — | — |
| Share de Quilla | $5.5–9.5K/mes | 20–25 % de $30–60K/año = $6–15K/año | $3.75–15K por acuerdo (agente) o $9–24K (principal) |
| Recuperación del CAC + construcción | Mes 2–3 tras el lanzamiento | Mes 6 | Al primer acuerdo |
| Valor a 24 meses (LTV) | $100–180K | $12–30K | $20–80K por creador si renueva |

Un venture de Monetization en régimen cubre el burn completo de Quilla. Dos lo cubren con margen. Por eso Monetization es la línea principal y las otras dos alimentan el pipeline y el flujo de caja temprano.

---

## 4. Tres escenarios a 12 meses

Supuestos comunes: caja inicial $40K, inversión inicial $11.5K, burn de la tabla §2, neto = 75 % del bruto, share 50 %. Los ventures siguen una curva realista: pico en el lanzamiento, caída al 50 % el mes siguiente, recuperación con evergreen.

### 4.1 Base (5 creadores firmados; 2 ventures; partnerships modestos)

- Venture 1 lanza en el mes 4 (bruto $18K → $9K → $14K → $20K → $25K al mes 12).
- Venture 2 lanza en el mes 7 (bruto $12K → $7K → $10K → $15K).
- Partnerships: comisión/margen de $1,250/mes desde el mes 3, $2,500 desde el 6, $3,750 desde el 9 (equivale a $60K → $120K anual contratado).
- Management: $600/mes desde el mes 4, $1,200 desde el 7, $2,500 desde el 10.

| Mes | Share ventures | Partnerships | Management | Ingreso | Burn | Resultado | Caja al cierre |
|---|---|---|---|---|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 3,500 | −3,500 | 25,000 |
| 2 | 0 | 0 | 0 | 0 | 5,300 | −5,300 | 19,700 |
| 3 | 0 | 1,250 | 0 | 1,250 | 7,800 | −6,550 | 13,150 |
| 4 | 6,750 | 1,250 | 600 | 8,600 | 7,800 | +800 | 13,950 |
| 5 | 3,375 | 1,250 | 600 | 5,225 | 7,800 | −2,575 | 11,375 |
| 6 | 3,375 | 2,500 | 600 | 6,475 | 7,800 | −1,325 | 10,050 |
| 7 | 9,750 | 2,500 | 1,200 | 13,450 | 9,300 | +4,150 | 14,200 |
| 8 | 7,875 | 2,500 | 1,200 | 11,575 | 9,300 | +2,275 | 16,475 |
| 9 | 7,875 | 3,750 | 1,200 | 12,825 | 9,300 | +3,525 | 20,000 |
| 10 | 11,250 | 3,750 | 2,500 | 17,500 | 11,300 | +6,200 | 26,200 |
| 11 | 11,250 | 3,750 | 2,500 | 17,500 | 11,300 | +6,200 | 32,400 |
| 12 | 15,000 | 3,750 | 2,500 | 21,250 | 11,300 | +9,950 | 42,350 |
| **Año** | **76,500** | **26,250** | **12,900** | **115,650** | **101,800** | **+13,850** | |

Punto más bajo de caja: **$10K en el mes 6**. Break-even mensual sostenido: **mes 7**. Cierra el año con la caja recuperada ($42K) y un ingreso de $21K/mes que crece.

### 4.2 Conservador (3 creadores; 1 venture tardío; pocos partnerships)

- Un solo venture lanza en el mes 6 (bruto $10K → $5K → $8K → $15K al mes 12). Partnerships $1,250/mes desde el mes 5. Management $500/mes desde el 6.
- Ingreso del año: **$35.6K**. Con el burn completo ($101.8K) la caja se agota en el **mes 5**.

**Por eso existe la regla de corte:** si al cierre del mes 5 no hay un venture lanzado ni un partnership firmado, el burn baja a $3.5–4K/mes (se pausan los ads y el Head of Monetization fractional pasa a pago por proyecto; el Scout pasa a solo incentivos). Con ese corte, la caja aguanta hasta el mes 12 y el negocio sigue vivo con 1 venture creciendo. Es un año lento, no un fracaso.

### 4.3 Optimista (8 creadores; 3 ventures; partnerships fuertes)

- Ventures lanzan en los meses 3, 6 y 9 (brutos en régimen $40K, $25K y $15K). Partnerships de $1,250 a $7,500/mes. Management hasta $5K/mes.
- Ingreso del año: **$218K**. Caja al cierre: **$145K**. Break-even sostenido en el mes 6. Permite contratar al Head of Monetization full-time en el mes 9 y abrir hispanos de EE. UU. en el trimestre 4.

### 4.4 Comparación

| | Conservador | Base | Optimista |
|---|---|---|---|
| Creadores firmados año 1 | 3 | 5 | 8 |
| Ventures con ingresos | 1 | 2 | 3 |
| Ingreso total año 1 | $36K | $116K | $218K |
| Ingreso mes 12 | $7K | $21K | $43K |
| Caja mínima (sin corte) | agotada mes 5 | $10K (mes 6) | $20K (mes 2) |
| Break-even mensual | no en el año 1 (con corte, mes 12) | mes 7 | mes 6 |

---

## 5. Caja necesaria y regla de gestión

- **$40K** cubre la inversión inicial y ~5 meses de burn completo sin ingresos. Es suficiente **si** se respeta la compuerta del mes 5.
- **Reserva:** nunca bajar de $8K de caja sin decisión explícita de Elvin (D3).
- **Reinversión:** hasta que la caja vuelva a $40K, el 100 % del resultado positivo se queda en Quilla. Después, Elvin decide distribución vs. reinversión trimestralmente.
- **Pauta de ventures:** se adelanta desde la caja de Quilla con tope de $3K por venture por mes `[DATO]` y se recupera del neto antes del reparto. Si un venture no recupera la pauta en 60 días, se pausa la pauta.
- **Financiamiento externo:** no en el año 1. Si el escenario optimista se cumple, en el año 2 se evalúa capital para el mercado de EE. UU.

---

## 6. Qué mueve más el resultado (sensibilidad)

| Palanca | Efecto |
|---|---|
| Un mes antes de lanzar el Venture 1 | +$8–10K en el año y caja mínima $18K en vez de $10K |
| Un mes después | caja mínima $3K: al borde de la regla de corte |
| Bruto en régimen del Venture 1 de $25K en vez de $20K | +$1,875/mes de share |
| Un partnership "Integración" ($30K) cerrado en el mes 4 como principal | +$9–12K de margen en el año |
| YouTube Ads sin aplicaciones calificadas en 60 días | −$3,600 y se apaga; el Scout absorbe la meta |
| Scout que no trae reuniones a los 60 días | se reemplaza; costo del error ~$4K |

Lo que más importa no es el % de rev share: es **cuándo lanza el primer venture y cuánto vende**. Todo el roadmap de los primeros 90 días existe para acortar eso.

---

## 7. Indicadores financieros que se revisan cada mes

| Indicador | Target base |
|---|---|
| Burn mensual vs. presupuesto | ± 10 % |
| Caja al cierre | ≥ $8K siempre; ≥ $15K desde el mes 7 |
| Ingreso por línea (share / partnerships / management) | según tabla §4.1 |
| Cobros a tiempo (marcas y ventures) | ≥ 90 % dentro de 15 días |
| Pauta adelantada pendiente de recuperar | ≤ $6K en total |
| Margen operativo (resultado / ingreso) | ≥ 30 % desde el mes 9 |
| Contratos firmados antes de construir | 100 % |

---

## 8. Año 2 (orientativo)

Con 15–25 creadores y 6–10 ventures con ingresos, el ingreso mensual de Quilla en el mes 24 ronda **$115K** en el escenario base ($80K share + $25K partnerships + $10K management) con un burn de ~$45K (equipo de 12 entre humanos y contratistas). Es el punto en el que Quilla deja de ser un experimento y se convierte en el holding que Elvin describe. Los supuestos del año 2 se escriben al cierre del trimestre 3 del año 1 con datos reales.
