---
name: pulse-bajas-offboarded
description: "En Pulse, \"eliminar\" un cliente = moverlo a OFFBOARDED (con razón de baja), nunca borrarlo; así se le explica a Jessica y al equipo"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c764d2b1-b364-4884-bc3e-923a3b76fe6d
  modified: 2026-09-28T13:13:58.623Z
---

Cuando se le pida a Jessica (o a cualquiera del equipo) "eliminar", "sacar" o "limpiar" clientes de Pulse, la
instrucción es **moverlos al grupo OFFBOARDED con su razón de baja**, NO borrarlos. Borrar de verdad no se usa para
clientes.

**Why:** Elvin, 28/sep/2026: "a Jessica, cuando le digas de eliminar algo de Pulse, es moverlos a OFFBOARDED, no eliminar
como tal". Los clientes dados de baja siguen contando para historial, LTV, reactivación y el puente con n8n/NocoDB; el
borrado solo existe como error (y para eso está la papelera, [[proteccion-datos]]).

**How to apply:** en cualquier mensaje, DM del bot, agente (Sofi, Max, Nico) o texto de Pulse dirigido a Jessica/equipo,
decir "pásalo a OFFBOARDED con su razón de baja" en vez de "elimínalo/bórralo". Los números del Inicio ya excluyen
OFFBOARDED (ver [[pulse-crm]]).
