---
name: leads-crm
description: Leads = CRM de clientes potenciales dentro de Pulse que reemplaza a Pipedrive (26/sep/2026); esencia Pipedrive, Timelines como puente de WhatsApp, historial de Pipedrive archivado en Excel (NO cargado)
metadata:
  type: project
---

Pipedrive cuesta ~$900/mes (LU ~$600, AIB ~$300). El 26/sep/2026 Elvin aprobó reemplazarlo con **Leads
dentro de Pulse** (`/pulse/leads`), autorizando semana 1 y 2 "sin ningún miedo". Primero Level Up.

**Reglas de Elvin:** tiene que tener "la raíz y la esencia de Pipedrive" (columnas, arrastrar, embudos,
botones) pero limpio, simple y muy fácil de usar. **El historial (~20K leads) NO se carga en Pulse**: queda
archivado en Excel (`~/Documents/Archivo Pipedrive/2026-09-26/` + copia en Supabase `pulse/archivo-pipedrive/`)
— "no se puede perder". WhatsApp sigue por **Timelines.ai** (GoHighLevel descartado). Marcas nunca mezcladas.

**Estado:** módulo + puente + cables de Calendly/quiz LU en producción; Leads arranca vacío con los 6 embudos
reales de LU. **27/sep:** embudos = copia EXACTA de los 11 de Pipedrive LU; entrada para Zapier (`/api/leads/entrada`)
probada en prod; cuentas creadas (Luis setter; Roger, Laura, Joaquín closers; Nahuel director comercial; Ana y
Dilan chatters; Aure) con links de 72 h a Leads. Santiago ya no está. **Timelines LU CONECTADO (26/sep)**: token en .env.local + Vercel, número +1 787-409-2812 (Level Up Media),
webhooks 30187/30188 sin errores; probado con conversación real (lead + historial en ambos sentidos). Clientes
actuales de Pulse (todo menos OFFBOARDED) NO entran como lead (pedido de Elvin); ex-clientes sí. **Falta de Elvin:** OK para mandar los links por Slack. **Zaps HECHOS (26/sep):** los 4 de clases (LUM Class Diego 360078172 v8,
FRANKIE 363181220 v4, VC 347784257 v7, CLICKFUNNELS - PIPEDRIVE 302982861 v2 = CF CLASS) tienen paso 4 Webhooks
POST → /api/leads/entrada, en paralelo a Pipedrive; name = "Data Contact Name" (el first/last sale vacío); probados
y publicados, leads de prueba borrados. Los 60 runs retenidos son del "Daily Executive Email Digest to Slack" (app
desconectada), no de las clases.
**Semana 3:** mover prospección/demos/dashboards, correr en paralelo 1 semana y cancelar Pipedrive LU; AIB después.
Detalle técnico en CLAUDE.md §Leads. Ver [[pulse-crm]], [[closers-lu-calendly]], [[ecosistema-lu-aib]].

**26/sep (tarde) — en validación:** por orden de Elvin, Aure y Nahuel usan Leads primero y dan el visto bueno
antes de la transición (instrucciones por DM de Slack desde la cuenta de Elvin, firmadas "Claude"; Nahuel con su
link de activación, vence 29/sep). Sin su ✅ NO se mandan los links al resto (Luis, Roger, Laura, Joaquín, Ana, Dilan)
ni se apaga Pipedrive. Jessica tiene que llenar el Teléfono de 6 clientes activos sin número (para el filtro de
clientes en WhatsApp); "Roger Arteaga" aparece como cliente en ONBOARDING & SETUP, quizá sea una ficha de prueba.

**27/sep/2026 — AIB en Leads**: 4 embudos copiados de Pipedrive AIB, Timelines AIB conectado (token en .env.local/Vercel), quiz AIB → Diagnóstico de Automatización, acceso Aure + Luis. Falta: decidir si se cargan los ~1,000 leads abiertos (WHATSAPP + RECUPERACIÓN 2026) y el "satélite"/setter nuevo que Elvin dirá.

**27/sep/2026 — Grupos y equipo**: Leads de WhatsApp YA entran en tiempo real (Timelines → Pulse al instante). Los grupos de WhatsApp (cita closer+setter+admin, `is_group`) van solos a la columna angosta "Grupos" al final del embudo, fuera de los totales (pedido de Elvin). Teléfonos del equipo (fichas de Ritmo + LEADS_TELEFONOS_EQUIPO) no entran como lead; Nahuel se había colado y se borró.

**28/sep — Exportar leads:** botón Exportar (Excel como Pipedrive). Elvin exporta directo; **Nahuel y Aure piden y Elvin aprueba** (link por Slack, una vez, 24 h, /pulse/leads/exportaciones). Nadie más exporta.

**28/sep — Leads → Equipo:** Nahuel (director de ventas LU), las editoras y Elvin dan/quitan acceso a Leads desde el botón Equipo. Roger, Laura y Luis tenían acceso pero sin clave creada (necesitan su link de acceso de Carilin).

**29/sep — Link oficial de Leads = https://leads.levelupmediapr.net** (DNS en Network Solutions + verificado en Vercel, `LEADS_URL` en Production). Es el que se le da al equipo de ventas; Nahuel ya lo tiene. En Network Solutions el CNAME se llena: Refers to = Other Host `leads`, Alias to = `cname.vercel-dns.com` (al revés queda mal).

**30/sep — Reparto por embudo (round robin):** Editar embudo → Nadie / Una persona / Rotación entre el equipo con acceso a Leads. Solo a leads que llegan sin dueño. **Cierre de Pipedrive (30/sep–1/oct):** Elvin pidió asegurar la BASE HISTÓRICA COMPLETA de todos los embudos (no solo lo reciente). **AIB hecho** (token nuevo en .env.local): 5,346 tratos en `~/Documents/Archivo Pipedrive/2026-10-01/ai-borinquen/` (+ `por-embudo/`, un Excel por embudo con contacto, etapa, estado, dueño, fechas y notas) y copia en Storage `pulse/archivo-pipedrive/2026-10-01/ai-borinquen/`; enviado por DM del bot a Elvin y Aure. **LU pendiente**: su token da 401; falta uno nuevo (app.pipedrive.com/settings/api) ANTES de cancelar. Scripts reutilizables en el scratchpad de la sesión: no; repetir con `scripts/pipedrive-archivo.mjs lu` + Excel por embudo. Nahuel ya puede configurar el reparto ("Reparto de leads" en el menú del embudo).
**1/oct — Equipo ≠ lead:** botón "Es del equipo" en la ficha del lead (dirección o Nahuel) guarda el número en `leads_numeros_equipo` y saca el lead; el filtro de WhatsApp consulta esa lista + fichas de Ritmo. El equipo de ventas (closers/setters/chatters) no tiene ficha en Ritmo: solo la lista los reconoce. "Laureano" (+1 787-618-8618) quedó como lead: no se sabe si es del equipo.
