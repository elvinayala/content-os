---
fecha: 2026-09-18
fuente: manual
unidad: ecosistema
tags: [ceo, plan-de-guerra, portafolio, estrategia, q4-2026, holding]
estado: aprobado por Elvin el 18/sep/2026 → en ejecución
---

# Plan de guerra — IA Market, Q4 2026 (18 sep → 12 dic)

Aprobado por Elvin el 18 de septiembre de 2026 tras leer [[perfil-ceo]], [[mentores]],
las memorias de los 13 proyectos, el vault completo, los snapshots del tablero y el
código del Core. El portafolio vivo se ve en `/ceo/portafolio`; las ideas nuevas van a
[[ideas/README|el estacionamiento de ideas]].

## El diagnóstico honesto

| Señal | Dato |
|---|---|
| Aperturas en 14 días | Resuelto (4/sep), Contigo PR (6/sep), Quilla (15/sep), Cortex (16/sep), Victory Core (17/sep), Ecosistema (18/sep) |
| Negocios/proyectos vivos | 13 |
| Tareas asignadas a Elvin | 60 de 141 (`data/tareas.json`) |
| Level Up: churn junio | **115%** (20 entran, 23 se van), CAC $1,546 |
| Level Up: ventas nuevas | de $80K/mes a $26–27K; ticket promedio $2,700 (era $3,500–4,000) |
| Level Up: wins | 0 en 25 días en #clientes-wins |
| AIB: cierre | closer cierra 3/mes, 50% no-show, sobran $1–5K/mes |
| AIB: ManyChat | plan expirado, 11,780 contactos, 2,444 conversaciones sin leer |
| Orgánico | LU 10.3K / AIB 8.5K / Shadow 23 seguidores, 1–4 likes por post |
| Bori | 57 usuarios, 12 pagando, MRR ~$810 (ago), activación 6% |
| Core (`app/borinquen`) | 11 páginas sobre mock; solo el CRM es real; cero generador de demos |

**Tres verdades:**

1. **El cuello de botella no es contenido ni vendedores: es Elvin como único cerebro.**
   Los mentores lo repiten desde enero. El burnout no viene de los roles, viene del ritmo:
   6 frentes en 14 días y cada uno es una empresa de 2 años.
2. **Level Up es un balde con hueco.** Con 115% de churn, meter más leads o más ads es
   tirar agua al piso. Primero se cierra el hueco (onboarding, contenido del cliente,
   medición por closer).
3. **AI Borinquen no tiene problema de producto, tiene problema de demostración.** Oscar
   lo dijo en febrero ("comunicación demasiado técnica"); Elvin lo dijo el 18/sep ("vender
   sistemas con MVP").

**Decisiones de Elvin (18/sep):** congelar todo lo nuevo salvo Resuelto en piloto; caras
orgánicas = micro-influencers y clientes-creadores (no teleprompter); presupuesto nuevo
$7–9K/mes en personas clave.

## 1. La estructura: un holding, tres capas, cuatro servicios compartidos

```
IA MARKET (holding · Elvin = CEO, decide y se entera)
│
├─ MOTORES (hacen el dinero hoy)         Level Up Media · AI Borinquen
├─ PRODUCTOS (componen solos, poco Elvin) Bori · Cortex · Shadow Operator
├─ PILOTO (con compuerta)                 Resuelto
└─ CONGELADOS (con trigger de reapertura) Quilla · Contigo PR · Staff Agency · 1000X · Ventaja
│
└─ SERVICIOS COMPARTIDOS (la ventaja del holding)
   ├─ Estudio (contenido de las 4 marcas)       ← Sofi (agente) coordina · Elvin escribe
   ├─ Revenue (setters, closers, CRM, demos)     ← Juan David (AIB) + Valentina + setters (Luis arma los MVPs del día)
   ├─ Tech (Claude, Content OS, Bori, Cortex)    ← Claude + Alejo
   └─ Finanzas (margen, CAC, LTV, churn)         ← María García
```

Shadow Operator no es una cuarta empresa: es **el departamento de marketing del holding**.

## 2. Portafolio (estado, meta, horas de Elvin, trigger)

| Unidad | Estado Q4 | Meta 12/dic | Horas/sem de Elvin | Trigger de reapertura |
|---|---|---|---|---|
| Level Up | MOTOR | churn <8%/mes, $125K/mes, ventas nuevas $60K | 4 | — |
| AI Borinquen | MOTOR | $30K/mes, 6 cierres/mes con demo, no-show <30% | 4 | — |
| Bori | PRODUCTO | 1,000 usuarios al día 60, activación ≥40% | 6 | — |
| Cortex | PRODUCTO | edita el 100% de LU/AIB, entra a Bori como servicio | 1 | — |
| Shadow Operator | PRODUCTO | 50 posts, 3K seguidores, Skool con 30 fundadores | 1 día/mes + 30 min/sem | — |
| Resuelto | PILOTO | compuerta 15/nov: ≥3 plomeros y ≥30 trabajos, o se congela | 2 | pasa la compuerta → Coordinador/a de Ops |
| ISLA Run Series | PILOTO (excepción 23/sep) | Cabo Rojo 5K el 13/dic: base 1,800, tope 2,500; compuerta 1/nov ≥900 inscritos | 1 | P&L real positivo → ISLA #2 |
| Quilla | CONGELADO | — | 0 | Shadow ≥10K y LU churn <8% por 2 meses |
| Contigo PR | CONGELADO | — | 0 | stack voz+WhatsApp de Resuelto 60 días reutilizable |
| Staff Agency | CONGELADO (plataforma) | se absorbe en Revenue | 0 | ≥5 empresas externas pidiendo setters |
| 1000X | CONGELADO | Richy lo opera | 0 | Richy trae 50 miembros solo |
| Ventaja | CONGELADO | — | 0 | Q2 2027 |
| Victory Core | ENTREGADO | Néstor lo corre | 0 | — |

**Regla dura: ninguna empresa nueva hasta el 12/dic.**

> **Excepción (23/sep/2026) — ISLA Run Series.** Elvin la aprobó como *excepción con operador*: la
> carrera la operan sus socios (director de carrera) y el municipio de Cabo Rojo; Elvin solo aprueba
> presupuesto >$5K, precios, marca y compuertas (~1 h/sem). Claude y los agentes ponen la plataforma, el contenido y
> la pauta. Plan en [[proyectos/isla-run/plan-maestro]].

## 3. Las cinco jugadas

### Jugada 1 — Cerrar el balde de Level Up (semanas 1–4, $0)
- Onboarding captura el contenido del cliente en 7 días (cláusula de negligencia + Cortex `/u/<token>`).
- Scoreboard semanal por closer desde Pipedrive CLOSERS (show rate, cierre, ticket) para Elvin y Carilin.
- Cross-sell AutoFlow a la base de LU con el ángulo "doble dolor" ([[estilo/angulos-ganadores]]).
- No se escala pauta hasta churn <8%/mes. El [[proyectos/ecosistema/plan-ecosistema|ecosistema]] sigue.

### Jugada 2 — El Estudio (semanas 1–12)
- **La coordinación la hace Sofi (agente)**, no una contratación: `/coordinar-produccion` 7:30 AM + `data/estudio.json` → [[proyectos/estudio/perfil-productora]], [[proyectos/estudio/caras-y-angulos]].
- Caras orgánicas = micro-influencers Tier A/B ([[proyectos/micro-influencers/investigacion]]) + clientes-creadores + Partnership Ads. $1.5K/mes.
- Daren se re-encuadra: 1 día de grabación al mes con teleprompter, solo anuncios. Yulianna y Valentina siguen.
- Testimonios de una vez (Bryan Vega, Tinos, Coralis, RK, Dr. Marvin, El Terapista) con la dinámica "él graba, LU edita".
- Cortex edita todo; la fábrica de contenido (Sofi + skills) produce; la productora publica.
- Cuota de Elvin: 1 día de grabación al mes (30 piezas) + audio semanal de 30 min.
- Reparto semanal objetivo: LU 5 · AIB 4 · Shadow 4 · Bori 1 (14 piezas, número de Ramiro).

### Jugada 3 — AIB vende con MVP: la Fábrica de MVPs (semanas 2–6)
Definición de Elvin (18/sep): "vender sistemas con MVP" = el prospecto recibe algo que puede
tocar antes de la llamada. Flujo "MVP en 24 horas" (`/demo-cliente`, `scripts/demo-cliente/`,
plantillas `demos/_plantilla-autoflow/`):
1. El setter llena 6 campos (negocio, nicho, web/IG, WhatsApp, dolor, tipo de negocio).
2. Claude lee la web/IG y genera todo el contenido (intents, base hablada, prompt de voz, landing, deck, recorrido).
3. Se arma el paquete con marca del cliente: **propuesta** (hub) · **presentación .pptx** personalizada · **landing** del negocio (rediseño o nueva) · **chat** WhatsApp · **voz** real (Retell) · **recorrido "por dentro"** del sistema (embudo, conversaciones, agenda, agentes — simulación con su flujo, no la plataforma).
4. Deploy a Netlify → link; nota en el deal de Pipedrive AIB; el setter lo manda por WhatsApp **antes** de la llamada.
5. El closer abre el MVP en la llamada (no slides genéricas) y el prospecto habla con su propio asistente ([[estilo/objeciones-reales]] #9).

Complementos: setter boricua a comisión, abridor "auditoría de respuesta" ([[proyectos/captacion-no-meta/plan-maestro]]), ManyChat Pro + AC. Compuerta: 10 llamadas con demo vs 10 sin demo en octubre.

### Jugada 4 — Bori y Cortex en piloto automático
Se mantiene el plan de 90 días y sus compuertas. Contratar el Head de Crecimiento remoto. Bori: caras = coquí + UGC de dueños. Cortex: sin features nuevas. Bori se explota **después** de activación ≥40% (hoy 6%).

### Jugada 5 — Shadow Operator como motor de marca (casi $0)
Veredicto: viable, el momento es correcto, condición: que el contenido salga. Oferta confirmada: Skool $55/mes + consultoría $3,500/4 meses (10 por cohorte = $35K, la cierra Valentina). Embudo: quiz `/auditoria` → DM PLAN → Skool → consultoría. Calendario: oct 50 posts; nov Skool con 30 fundadores de la propia base; ene 2027 cohorte 1. NO hacen falta más funnels, webinars ni equipo propio. Ver [[estilo/shadow-operator]].

## 4. Personas y dinero

| Contratación | Costo/mes | Cuándo |
|---|---|---|
| ~~Productor/a de contenido~~ → Sofi (agente) | $0 | ya activa (19/sep) |
| Setter boricua AIB | $0 fijo (100 % comisión, 10 % por venta) | semana 3 |
| Head de Crecimiento Bori (remoto) | $1,800–3,000 | semana 2 |
| Creadores UGC + micro-influencers | $1,500 | continuo |
| Herramientas (ManyChat Pro, Retell, Apify Starter, Netlify) | ~$350 | semana 1 |
| **Total nuevo** | **$3.7–4.9K** fijos (+ comisiones del setter según ventas) | |

No se contrata: COO, director de ventas, diseñadores, traffickers, videógrafo, Scout de Quilla, coordinador de Resuelto (solo si pasa la compuerta). No se gasta: los $40K de Quilla, marketplace, plataformas nuevas. Retorno que lo justifica: 3 cierres extra de AIB al mes ($9K) o 2 clientes de LU retenidos.

## 5. El sistema operativo de Elvin

- **Lunes 9 AM**: board meeting + scoreboard de 5 números por unidad (leads, shows, cierres, churn, piezas publicadas). 30 min.
- **Viernes 3 PM**: revisión CEO de 1 h: compuertas, decisiones pendientes, nada operativo.
- **1 día al mes**: grabación (Shadow + testimonios + anuncios de Daren, el mismo día).
- **1 vez al mes**: product review de Bori/Cortex.
- **Aprueba solo**: gastos >$5K, contrataciones, estrategia, contratos de creadores. Lo demás lo decide el líder del área ([[organigrama]]). Guiones y marketing NO se delegan: son de Elvin; se delega la logística de producción.
- **Hora de cierre: 8 PM.** El burnout es un riesgo del negocio.

## 6. Compuertas del trimestre (las mide el board meeting)
- 15/oct: primeras 10 demos enviadas; productora contratada; 25 posts de Shadow publicados.
- 1/nov: compuerta de ISLA Cabo Rojo 5K (≥900 inscritos → orden de medallas; 15/oct ≥300).
- 15/nov: compuerta de Resuelto; Skool abierto con fundadores; churn LU medido 2 meses seguidos.
- 12/dic: cierre del trimestre contra la tabla de §2; decisión de reaperturas para Q1 2027.
