---
name: n8n-envios-sin-repetir
description: "Regla para cualquier flujo de n8n que le escribe a clientes — nunca depender de staticData con throw, leer data.key de Evolution, llave en la base y vigilar el primer envío real"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e7db03bf-54ec-46dd-b9d2-76c3b45e44de
  modified: 2026-09-26T17:52:38.880Z
---

25/sep/2026: el flujo "K-) Referidos veteranos" le mandó el mismo WhatsApp **18 veces a Christopher Taveras y 8 a
Rafael Caban** (uno cada 10 min). Dos errores míos juntos: (1) la respuesta del nodo de Evolution viene como
`{success, data:{key:{id}}}` y yo leía `r.key` → todo envío "fallaba"; (2) al "fallar" el Code lanzaba `throw`, y
**n8n no guarda `$getWorkflowStaticData` si la corrida termina en error** → nunca quedó "enviado" ni "pausado" y
reintentó cada corrida. Ese mismo día la felicitación de leads mandó bien pero no marcó NocoDB ("Multiple matches
found" por `$('Nodo').item` detrás de un Postgres) y al otro día iba a repetir.

**Why:** Elvin pidió explícitamente "no quiero spam, siempre protégete"; mandar repetido desde el WhatsApp de Level
Up quema la confianza del cliente y arriesga el número (ya pasó con Resuelto, ver [[whatsapp-negocio-no-avisos]]).

**How to apply:** en todo flujo que escriba a clientes: nunca `throw` después de un envío; marcar "enviado" en una
fuente persistente (Postgres/NocoDB) además de staticData y consultarla ANTES de mandar (llave doble); leer la
respuesta real del nodo (probar con un envío y mirar el JSON); no usar `$('X').item` detrás de nodos Postgres
(devolver los datos en la misma fila); y después de activar, vigilar la PRIMERA corrida real antes de dar por
terminado. Relacionado: [[verificar-antes-de-activar]], [[n8n-level-up]].
