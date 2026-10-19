## El CEO Command Center (`/ceo`)

Sección aparte con **shell y tema propios** para monitorear todo el ecosistema
(las 2 agencias + Shadow Operator), inspirada en el look "Agentic OS" (navy +
neón cyan/violeta). PASO 01: todo mock salvo las ventas de Level Up (Sheets).

- **Tema scoped**: la clase `.ceo` (bloque en `app/globals.css`) redefine las CSS
  vars de shadcn solo dentro de `app/ceo/layout.tsx`. El resto del sitio queda
  terracota. Ojo: componentes que portalean a `<body>` (Sheet/Dialog/Select/
  Tooltip) salen del scope — pasarles `className="ceo"` en el `*Content`.
- **Roster** (`lib/ceo.ts`): `orquestador` (CEO/Orchestrator, command layer) +
  5 `especialistas` (Researcher, CMO, Sales Rep, Dev, Data Analyst). El CMO
  `supervisaA` a Sofi y su pipeline (`lib/equipo.ts`) — el squad de contenido
  no se reemplaza, se muestra debajo del CMO.
- **Tabs** (`ceoNavItems`): Command Center, Agents, Tasks, Schedule, Lead
  Pipeline, Content, Knowledge Vault. La `CeoSidebar` además lista los agentes
  con dot de estado (working/waiting/idle).
- **Command Center** (`/ceo`): hero del orquestador con el **operator debrief**
  (mock) + cards por unidad — Level Up con **KPIs reales** de
  `armarDashboardAgencia` (badge LIVE), AI Borinquen en STANDBY (refleja
  `activa: false` en `lib/agencias.ts`), Shadow Operator con mocks de métricas.
- **Mocks** en `lib/mock/ceo.ts` (debrief, tareas, leads, agenda, vault) con
  fechas relativas a hoy vía `hoyISO()` de `lib/format.ts` (hora local, no UTC).
