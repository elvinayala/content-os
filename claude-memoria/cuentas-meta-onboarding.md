---
name: cuentas-meta-onboarding
description: 12/oct — verificación automática de que Bori (token Hey Bori) lee la cuenta publicitaria de cada cliente de LU; ficha + DM a Jessica + cron; portafolio 836808821982174
metadata:
  type: project
---

Elvin (11/oct): "cómo aseguramos que Bori lea todas las cuentas y queden conectadas el día del onboarding". Construido el 12/oct:
`lib/pulse/cuentas-meta.ts` (+ `-reglas.ts`, tests `tests/cuentas-meta.test.mjs`), cron `/api/cron/cuentas-meta` (cada hora 8AM–8PM PR sobre fichas nuevas/con problema; `?completo=1` 7 AM PR sobre todas; lunes = recordatorio a Jessica; `?avisar=0` = pasada en silencio), enganchado a `altaOnboarding`. Escribe en la ficha SOLO al cambiar de estado (usuario sistema "Cuentas de anuncios (automático)") y manda UN DM a Jessica por pasada (`PULSE_CUENTAS_AVISAR`).
Solo mira los grupos CLIENTE ACTIVO, ONBOARDING & SETUP y ANÁLISIS Y ESTRATEGIA (no Inner Circle/Accelerator/OFFBOARDED).

**Cómo comparten los clientes:** asignan su cuenta al portafolio **"Level Up" (836808821982174)** con permiso de administrar campañas (todas las cuentas que sí se leen lo tienen como agencia). Error `(#200) Ad account owner has NOT grant…` = aún no la comparte.

**Why:** el 11/oct se vio que 6 de 84 cuentas no se leían (felicitaciones y Resultados de la app de clientes no podían leer Meta) y nadie se enteraba.
**Trampa:** el `META_ADS_TOKEN` que tenía Vercel era inválido ("Cannot parse access token") → se reemplazó el 12/oct con el de `.env.local` (Hey Bori). Si falla la pasada con ≥ 5 errores de token, avisa a Elvin. Primer informe: 78 leídas, 6 sin permiso, 2 con pago pendiente, 28 sin ID (Jessica avisada por DM desde la cuenta de Elvin el 12/oct).
Pendiente opcional: añadir al formulario de onboarding (idCuenta) el texto de cómo compartir la cuenta.
Ver [[n8n-level-up]] (credencial "Facebook Graph (Hey Bori · Elvin)" EDnAJIe6yynT2Btp).

**12/oct (tarde):** se llenaron solos 21 de los 28 IDs faltantes, emparejando el nombre del negocio con las cuentas que ya ve el portafolio (552 visibles): 20 ✅, Natacha Agront con pago pendiente. Faltan 7 (ACTIVATEPR, Mason Hype, Andrews Medical, Daniel Ortiz, Abogado David/Alfredo Prats, Blessed Events Boutique, Magic Car Care Image); Jessica avisada (desde la cuenta de Elvin, firmado Nico). Jessica NO tiene acceso a Ads Manager: el ID se lo pide al cliente. **Proceso (Carilin, 12/oct):** en el onboarding el cliente configura la cuenta y nos da permiso de socio (lo sigue Jessica); el ESTRATEGA asignado pone el ID en Pulse (Jessica no tiene acceso a ningún administrador de anuncios). Avisos ya ruteados así: no compartida → Jessica; sin ID/pago/caída → estratega asignado; sin estratega → Jessica (ella asigna estrategas) con Carilin en copia. Explicado a las dos por DM (desde la cuenta de Elvin, firmado Nico). 10 clientes no tienen estratega asignado (7 sin ID + 3 con pago) — se lo pasé a Carilin.
