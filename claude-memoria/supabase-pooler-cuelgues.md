---
name: supabase-pooler-cuelgues
description: Por qué Ritmo/Pulse "se quedaban cargando" (26/sep/2026): el pooler de transacciones de Supabase cuelga consultas en cola; el de sesión tiene tope de 15 clientes y tumbó prod al probarlo
metadata:
  type: project
---
26/sep/2026: páginas de Ritmo y Pulse colgadas hasta el timeout de 300 s de Vercel. Reproducido desde la Mac: con el pooler de TRANSACCIONES (:6543) ~1 de cada 3 lotes de consultas en cola en una misma conexión se cuelga (con max:1 casi siempre); no es pipelining ni el protocolo simple. El pooler de SESIÓN (:5432, mismo host) no se cuelga, pero tiene **tope de 15 clientes en total** (EMAXCONNSESSION) y las instancias congeladas de Vercel no sueltan las conexiones: al pasarlo a prod se llenó y **tumbó prod ~5 min** (rollback con `vercel promote`).

**Why:** quedó el pooler de transacciones + vigilante `lib/pulse/cliente-db.ts` (5 s → conexión nueva, la vieja con 10 s de gracia, lecturas se repiten y gana la primera respuesta). Prueba final: 66/66 OK, casi todo < 2 s.

**How to apply:**
- NO pasar prod al pooler de sesión sin antes subir el "Pool size" en Supabase (Database → Connection pooling), lo decide Elvin.
- Si vuelven cuelgues: `vercel logs … -q renovada` muestra qué consulta se trabó.
- Rollback rápido: `npx vercel promote <url-deploy-anterior> --yes --scope elvin-7614s-projects`.
- Hay otro bug aparte: `/api/cron/autoflow-llamadas` falla con un Date como parámetro (ERR_INVALID_ARG_TYPE).
Ver [[pulse-crm]], [[ritmo-desempeno]].
