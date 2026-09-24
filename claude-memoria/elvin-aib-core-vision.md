---
name: elvin-aib-core-vision
description: "La constitución de producto de AI Borinquen Core según Elvin — AI-native, uso real antes que infra, sistema operativo de agentes, Builder incremental"
metadata: 
  node_type: memory
  type: project
  originSessionId: d0f9ba4c-bb83-4133-b227-e967a01ca3f1
  modified: 2026-07-27T18:49:14.922Z
---

Entre el 15 y 16/07/2026, por Slack (DM), Elvin fijó la **dirección de producto de
AI Borinquen Core** — el agente/producto propio de AI Borinquen — como una serie de
directivas permanentes. Es su criterio de producto; usarlo al construir o decidir
sobre AIB Core.

**North Star:** *"¿Cuántas tareas reales hace AI Borinquen Core por mí cada día?"*
No se mide en líneas de código, features ni documentos — se mide en **uso real**.
Meta: que sea *"el primer software que abro todas las mañanas y el último que cierro
por la noche."*

**Directivas núcleo:**
- **Producto antes que infraestructura**: llegar lo antes posible al primer uso real.
  Si se está construyendo infra sin valor inmediato, detener y proponer un camino más
  corto. *"Nunca optimices para impresionar; optimiza para que el sistema funcione de
  forma confiable todos los días."*
- **AI-First / AI-native**: todo módulo se expone vía API/tools para que lo use un
  humano Y un agente; desacoplado del proveedor de IA; nada depende solo de una GUI.
- **Dogfooding extremo** (reforzado 17/07): usar el Core dentro de AIB cuanto antes
  ("¿esto ya puede ayudarme hoy?"). Regla dura: **si una función no la usamos nosotros
  primero durante varias semanas, no pasa a producción para clientes.**
- **6 preguntas obligatorias antes de construir cualquier feature** (17/07): 1) ¿Qué
  problema real resuelve? 2) ¿Con qué frecuencia lo usaré? 3) ¿Qué tarea dejaré de
  hacer personalmente? 4) ¿Qué KPI mejora? 5) ¿Cómo mediremos el éxito? 6) ¿Existe una
  forma más simple de lograr lo mismo? Cada feature debe tener un caso de uso específico
  dentro de AIB **antes** de construirse.
- **PRODUCT REVIEW semanal** (auto-reporte, 17/07): funcionalidades más usadas /
  nunca usadas, deuda técnica, oportunidades de simplificación, ideas descartadas y
  por qué, y recomendaciones para la semana siguiente. El Core evoluciona por uso real
  y datos, no por intuición. *"El éxito no será la cantidad de código; será cuánto
  trabajo real elimina de mi día."* El dev actúa como **CTO + Product Manager**.
- **Sistema operativo de agentes**: arquitectura que desde el inicio prevea múltiples
  agentes especializados (CEO, CTO, Sales, Marketing, Operations, Finance, Research,
  Builder) con memoria/herramientas propias sin rediseñar.
- **Builder Kernel incremental**: el pipeline universal (Analizar→Planificar→Generar
  →Probar→Corregir→Documentar→Entregar) existe desde la Demo 1; cada demo reemplaza
  una etapa por inteligencia real. Nunca escribir código desechable; toda plantilla
  es un caso particular de un futuro generador.
- **Demos con nombre de producto cada máx. 5 tareas**: Demo 1 Assistant (WhatsApp +
  memoria) → 2 Executive (Gmail + Calendar + docs) → 3 Analyst (reportes/dashboards)
  → 4 Operator (automatización) → 5 Builder (crear y desplegar apps).
- **Aprendizaje permanente controlado**: el agente no modifica su comportamiento/
  Constitución/memoria base sin aprobación explícita (versionado, auditable, reversible).

**Refuerzo 25-26/07/2026** (DM a Aure, durante el build de staging del Core con
PostgreSQL/Railway/DigitalOcean): 5 principios operativos que ahora son criterio duro.
1) **Métricas desde el día uno**: tiempo ahorrado, costo por tarea, uso por herramienta,
errores, acciones aprobadas/rechazadas. 2) **Cada decisión debe reducir dependencia de
un proveedor, no aumentarla** (portabilidad de PostgreSQL, dump externo cifrado, no
atarse a un solo backend). 3) **Todo componente nuevo debe ser reutilizable** por
cualquier futuro producto (Assistant/Executive/Analyst/Operator/Builder) — cero código
desechable. 4) **Dogfooding extremo antes de vender**: operar AIB con el Core varias
semanas antes de venderlo o sumar features. 5) **Confiabilidad, simplicidad,
observabilidad y evidencia > velocidad** — prefiere retrasar una feature antes que
romper esos principios. *"Mi objetivo no es construir el agente más impresionante; es
construir el sistema operativo más confiable para dirigir AI Borinquen."* Nota técnica
del build: acciones irreversibles en estado `ambiguous` nunca se reintentan solas, se
resuelven manualmente con evidencia real del proveedor (ID + timestamp + idempotency_key).

**Documentos base:** `CONSTITUTION.md` (misión, principios de diseño/seguridad/
desarrollo, cuándo actúa solo vs pide aprobación) y `BUSINESS.md` (por qué existe,
misión a 10 años, qué jamás haremos, por qué elegirlo sobre ChatGPT/Claude directo).

**Primer hito de punta a punta:** enviar un WhatsApp *"construye un dashboard para
analizar las ventas de Level Up Media"* y que el Core entienda → planifique →
construya → pruebe → despliegue → devuelva el link por WhatsApp → documente solo.

**Flujo de trabajo con el dev/Claude Code:** tarea por tarea, PLAN → IMPLEMENTACIÓN
→ PRUEBAS → DOCUMENTACIÓN → COMMIT → ESPERAR APROBACIÓN. Actuar como CTO, no como
programador: si hay una mejor decisión técnica, detenerse y justificarla antes.

Conecta con [[elvin-ceo-perfil]], [[tablero-contenido]] y las prioridades vivas del
Command Center (foco de producto = voz/Camila primero; estabilidad de Railway).
