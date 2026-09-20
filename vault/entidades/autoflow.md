---
fecha: 2026-07-26
fuente: memoria
unidad: ai-borinquen
tags: [entidad, tema, producto]
---
# AutoFlow

**Qué es:** El producto estrella de [[ai-borinquen]], con marca pública **Bori** (sitio
`heybori.ai`): **2 agentes de IA (chat + voz) + un CRM** que responde, califica y agenda
leads en automático. Se vende como "equipo digital", no como software. **Evolución 07/17:**
Bori ya no es solo atención/agendamiento — también **crea el contenido Y corre los anuncios**
(*"el creativo es la mitad del producto"*), lo que lo cruza con el core de [[level-up]].

## Resumen acumulado
El core de AI Borinquen y la palanca de cross-sell con [[level-up]]. Promesa: automatizar la atención al cliente para duplicar el agendamiento — resolver los dos problemas del dueño (generar leads Y atenderlos), lo que ninguna agencia de ads ni proveedor de IA hace solo. Posicionamiento: *"No vendemos software, construimos tu equipo digital; el agente es una herramienta, uno del equipo."*

**Arquitectura estandarizada** (un solo método): WhatsApp/Messenger/IG → Go High Level (capa de visualización) → Cloud → IA de Anthropic; **N8N como puente principal para WhatsApp** (validado por [[alejo]] contra la resistencia de David). Implementación 7–10 días, pipeline de 4 etapas + 9 campos, timeline máximo 45 días por cliente. Costo interno máximo $25–30/mes por cliente (nunca se nombran las plataformas al cliente, se vende como "sistema de agendamiento").

**Precios:** Start $3,500 único + $500/mes · Pro (+ agente de voz) · Enterprise $10–15K (un cliente pagó $9K); mantenimiento post-90 días $297 o $597/mes. Nueva oferta directa aprobada: **"Danos 7 días"** — instalar SIEMPRE 2 sistemas (generación de citas + atención automática que agenda sola).

**Asistente de voz "Camila":** el agente de voz de AutoFlow tiene marca propia (demo de
clínica dental) y se vende recurrente a clientes actuales. Venta por rol específico (citas,
recepcionista, cobros, encuestas, reservas), NO "hace todo" (eso = $8–10K). Objeción #1:
[[objecion-suena-robotico]] (voz clonable, delay <1s). Producto hermano en la plataforma:
**Borigat** (marketing con editor de video, avatares, integración Meta pendiente). Plan con
[[alejo]]: revisar Camila primero, luego Borigat; meta de 100–200 beta users de la lista
actual; visión de 15–20 asistentes de voz **verticales** (un rol por agente).

**Pricing confirmado (capacitación de closers, 13/07):** paquete base con CRM **$3,500**
(incluye voz + chat como bono); solo IA sin CRM posible pero sin tracking; para dos negocios,
bono de $500 c/u. Demos de chat y voz para pantalla compartida del closer (aún sin link con
branding de Level Up para compartir directo).

**Frente abierto:** el producto aún no es 100% estable (ver [[estabilidad-producto]]); su propia tesis es *"el que haga un producto 100% validado no tiene competencia"* → estabilizar antes de escalar ventas. La mentoría formal de [[alejo]] ($60/h) empuja "data primero, no IA primero".

## Línea de tiempo
- 2026-02-09 — Se decide vender **paquetes cerrados** (mínimo $5,500), no servicios sueltos ([[2026-02-09-ventas-ai-borinquen]]).
- 2026-03-25 — SOP de costos: máximo $25–30/mes interno por cliente ([[2026-03-25-sop-desarrolladores]]).
- 2026-05-21 — **Estandarizado a un solo método** (WhatsApp/IG → GHL → Cloud → Anthropic), 7–10 días, 4 etapas + 9 campos ([[2026-05-21-producto-autoflow-estandar]]).
- 2026-06-11 — Vendido dentro del cierre de [[yaritza-amaral]] ($5,000, voz+chat+CRM) ([[2026-06-11-yaritza-cierre]]).
- 2026-06-30 — Escalera de precios y comparativa dura (humano $58K/año vs AutoFlow ~$9,500) fijadas con Laura ([[2026-06-30-laurita]]).
- 2026-07-02 — N8N como puente principal para WhatsApp (no GHL) ([[2026-07-02-carilin-estrategia]]).
- 2026-07-10 — Cross-sell dentro de un cliente de ads: **Angel Ruiz / Parada Típica** ($6K, incluye AutoFlow) ([[2026-07-10]]).
- 2026-07-13 — Pricing base $3,500 con CRM confirmado en la capacitación de closers; venta de
  voz por rol específico; objeción "suena robótico" ([[2026-07-13-carla-sesion-closer]]).
- 2026-07-14 — [[alejo]] formalizado como consultor ($60/h): revisar Camila/voz primero, beta
  de 100–200, 15–20 asistentes verticales ([[2026-07-14-alejo-ia-mentor]]).
- 2026-07-17 — **Sitio público `heybori.ai` EN VIVO** (marca Bori); pruebas del equipo el
  fin de semana antes del lanzamiento del lunes. Nuevo posicionamiento: Bori **crea contenido
  Y corre anuncios** ("el creativo es la mitad del producto"). Accesos de equipo (Jessica,
  Ana) y plan de dar acceso a clientes "de $1,000 para arriba". Arranca vertical
  [[ai-borinquen-salud]] (`salud.aiborinquen.co` → Railway) ([[2026-07-17]]).
- 2026-07-18 — Sesión con [[alejo]]: **vender los agentes por ROL** (no todo-en-uno),
  planes de mantenimiento $297/$497, tier gratis de Borinquen como bono a clientes de la
  agencia, y **PostHog** para observabilidad arrancando el lunes
  ([[2026-07-18-alejo-mentoria-ia]]).
- 2026-07-21 — **Bori se lanza como EMPRESA #3** (venta 30 de agosto, arranque septiembre),
  identidad propia, "aliado tecnológico" de las dos agencias. Modelo de venta: funnel
  automático sin closer + soporte WhatsApp; plan anual ~$2,500 (2-3 meses de bono), pro
  ~$1,200, retención ~$500; closers 20% mes a mes. Nuevo encuadre: **los 3 niveles de
  asistente de WhatsApp** (reglas → chatbot IA → **agente conectado** = AutoFlow).
  Mantenimiento ajustado a **$197/$397** (notificar clientes activos el 1 de agosto; 60
  días de config; precio por uso real). Productos satélite: consultoría $4,000 y Staff
  Agency $2,000 ([[2026-07-21-carilin-revision-clientes]]).
- 2026-07-25 — **Sesión de mentoría IA/Alejo**: nuevas decisiones de producto: **data first** — dashboard obligatorio por cliente con métricas (llamadas, conversaciones, minutos); producto **low-ticket ($500)** como entrada para retener leads que no compran high-ticket; benchmarking de modelos (revisar Nano/Higgsfield vs Sonnet, costo-beneficio), arquitectura con **fallbacks multi-modelo** (Fal.ai en lugar de dependencias únicas de Higgsfield); dos ambientes (prod + staging), CI/CD en GitHub; PostHog obligatorio lunes para observabilidad ([[2026-07-25-sesion-alejo-ia]]).

## Conexiones
[[el-terapista]] — el caso que lo vende (respondía el 20% de 3–4K leads/mes). [[ai-borinquen-salud]] — el primer vertical con dominio propio (salud). [[estabilidad-producto]] — los crash-loops de voz/`bori` bloquean escalarlo. [[objecion-esta-caro]] — se rebate con la comparativa dura y financiamiento. [[objecion-suena-robotico]] — la objeción #1 del asistente de voz. [[yaritza-amaral]] — cierre ancla que lo incluye. [[alejo]] — validó la arquitectura y ahora dirige la validación del producto ("data first, AI second").
