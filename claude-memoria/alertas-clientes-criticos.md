---
name: alertas-clientes-criticos
description: Cómo clasificar clientes críticos sin misatribuir — cruzar con fichas del vault antes de alertar (feedback real de Carilin)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c12b9463-db18-4960-808d-58c3790c8e33
---

Las alertas de clientes críticos del brief/Command Center **no siempre concuerdan
con el feedback real** que le llega a Carilin/CSM. Antes de marcar a un cliente como
crítico, cruzá con `vault/entidades/<cliente>.md` (ground-truth de CSM).

**Por qué:** varias alertas salieron mal atribuidas y hacían quedar mal al equipo
por cosas que no eran su culpa.

**How to apply:**
- **No misatribuir quejas internas al cliente.** Si un miembro del equipo reporta
  "mala comunicación" pero la causa es que el cliente no responde → es *cliente
  no-responsivo*, no *insatisfecho con el equipo* (ej. Marynell Ramos).
- **No alertar ROI prematuro.** Campañas que arrancaron hace pocos días no son
  "bajo ROI / no recuperó inversión" — es arranque (ej. Kenneth López, campañas
  desde 13/jul).
- **No culpar al equipo por pagos/banco del cliente.** Tarjeta bloqueada por el
  banco = onboarding/pago (ej. Maribel García).
- **Separar producto de comunicación.** Asistente IA que no rinde = caso de
  PRODUCTO → escalar a Dev (ej. Yeremi Reyes / La Central GPS).
- Fichas creadas 18/07: Ivan Torres, Marynell Ramos, Maribel García, Kenneth López,
  David Bonilla Solar, Yeremi Reyes. El brief ([[circuito-contenido-equipo]]) ya
  tiene la regla de cruce. Cuando llegue feedback nuevo de casos críticos, actualizá
  la ficha del cliente en el vault.
