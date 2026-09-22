# Los agentes de n8n de Level Up — qué hace cada uno y cómo los mantenemos

Análisis del 21/sep/2026 sobre los 76 workflows no archivados (44 activos). Fuente: los JSON en
`data/n8n/workflows/` + ejecuciones de los últimos 30 días. Regla de lectura: **●** activo · **○**
inactivo · "30d" = corridas ok/error en 30 días.

## Cómo está armado (la foto)

```
              ┌──────────── PULSE (fuente de verdad desde el 21/sep) ────────────┐
              │ LEVEL UP MEDIA · Asignación de Estrategas · Cumpleaños · TESORERÍA │
              └──────────────┬────────────────────────────────┬──────────────────┘
        Sync Pulse→NocoDB v1 │ (webhook + 5:10)     Sync equipo │ (webhook + 5:00)
                             ▼                                 ▼
   NocoDB proyecto "monitory-agent" (pyinwak5zvazh9h)
     · clientes (mom1ynk05ap3m1l): 98 activos, ID-cuenta-publicitaria, admin→, traffiker→, industria→,
       fecha-inicio-campaña, ultimo-revisado, ultima-alerta, dependencia, felicitaciones…
     · equipo (m0uib6kq4i1gelp): nombre, ID-monday, ID-slack, email
     · industrias · mensajes-slack (m8v320mexdfjjou: log de alertas con botones)
                             │
   ┌─────────────────────────┼──────────────────────────────────────────┐
   ▼                         ▼                                          ▼
 7:45 AM Trigger v1.1     8 AM Alerta falta de pago     9 AM Cobros + Recordatorio 60-90 (leen Pulse)
   ├─ Alerta falta de fases ─┐                          10 AM Lector de seguimientos (10 y 30 días)
   ├─ Alerta fase 5          ├─► Slack #office-6-*      10 AM PDF ciberseguridad · 11 AM Bienestar
   └─ Agente de monitoreo v3 ┘   con botones →          5 PM Bienvenida · 7 AM RevisionInstanciaEvoAPI
                                 Slack button logic v2
                                 (marca revisado / dependencia en NocoDB)

   Chatwoot (WhatsApp por Evolution) ──► webhook chatwoot ──► Agente de onboarding v5 (OrquestaBot)
                                                               ├─ tools: citas Calendly, alertas Slack,
                                                               │  encuesta 10/30 días (Tools encuestador)
                                                               └─ lee la 2ª base NocoDB "onboarding"
                                                                  (piehks983q2cfu6 / mc5m2od7vy71g6z)
                                                                  que llena **E-) citas automáticas v4**
                                                                  desde los emails de Calendly (Gmail)
```

Hay **dos bases NocoDB**: la de *monitoreo* (clientes/equipo, la que alimentaba Monday y ahora
alimenta Pulse) y la de *onboarding* (personas que agendaron por Calendly: nombre, email, teléfono,
fecha). La segunda **no depende de Monday**: la llena `citas automáticas v4` leyendo los correos de
Calendly. Los agentes de WhatsApp (bienvenida, PDFs, encuestas) trabajan sobre esa segunda base.

## Los agentes, por familia

### 1. Monitoreo de anuncios (el corazón: Meta Ads de cada cliente activo)

| Workflow | Qué hace | Dispara | Lee | Avisa | 30d |
|---|---|---|---|---|---|
| ● **A-) Trigger v1.1 safe** | El director de orquesta de las 7:45 AM. Recorre los 98 clientes activos de NocoDB y por cada uno lanza los 3 de abajo. Si el cliente no tiene estratega, avisa a Carilin y Elvin. | 7:45 AM L-V | NocoDB clientes+equipo | Slack, Teams (error) | 18/2 ⚠ |
| ● **B-) Agente de monitoreo v3** | Baja de Meta las métricas de los últimos 3 días de la cuenta publicitaria, las compara con **umbrales por industria** (CPL, CTR, frecuencia…), y si algo está mal manda alerta a Slack etiquetando al estratega, con botones "Revisado / Para después". Si la cuenta no está asignada al system user de Meta, alerta a #office-6-cuentas-error-alerta-agente-ia con las instrucciones. | sub | NocoDB, Meta API | #office-6-agente-monitoreo-ads | 20/5 ⚠ |
| ● **E-) Alerta falta de fases v1** | Revisa que el cliente tenga campañas activas en cada "fase" del método Level Up (Redis guarda la config). Si falta una fase → alerta. | sub | Redis, Meta API | Slack | 26/0 |
| ● **F-) Alerta para fase 5** | Igual pero específico para la fase 5 (remarketing/retención). | sub | Redis, Meta API | Slack | 24/0 |
| ● **C-) Alerta por falta de pago v1** | 8 AM: revisa en Meta el estado de pago de cada cuenta publicitaria; si está en deuda/pausada por pago → alerta. | 8 AM | NocoDB, Meta API | #office-6-agente-campaña-problemas-pago | 14/0 |
| ● **B-) Slack button logic v2** | Recibe los clics de los botones de las alertas. "Revisado" → escribe `ultimo-revisado` en NocoDB; "Para después"/"Dependencia" → marca la fila. Es lo que evita que la misma alerta salga todos los días. | webhook Slack | NocoDB clientes + log | Slack | 11/0 |
| ● **A) RevisionInstanciaEvoAPI** | 7 AM: chequea que la instancia de WhatsApp (Evolution) esté conectada y que el token de Meta siga vivo. Avisa si no. **Nota del proveedor: el token de Meta hay que renovarlo cada 59 días** (está pegado en una nota del workflow). | 7 AM | Evolution, Meta | #office-6-monitoreo-agentes-ia | 14/0 |
| ● **E-) Agente supervisor** | Auditor con IA (gpt-5-mini): cuando se publica una campaña, compara el presupuesto contra el "Presupuesto mensual" del cliente (ahora desde Pulse) y da PASS/FAIL. Solo lo llama el Publicador. | sub | NocoDB, Pulse, Meta | Slack (canal de pruebas) | 0/0 |

**Estado**: funciona pero con dos fallas reales: (a) el Agente de monitoreo v3 fallaba con nombres
con comillas (arreglado el 20/sep, esperar a mañana para confirmar 0 errores) y (b) `Trigger v1.1` da
error de **licencia de Microsoft Teams** ("Failed to get license information") — el proveedor
enviaba copia de las alertas a su propio Teams (gerencia@pymes-ai.com). **Hay que quitar los nodos de
Teams** de todos los workflows: ya no tiene sentido y hoy fallan.

### 2. Reportes al cliente

| Workflow | Qué hace | Dispara | 30d |
|---|---|---|---|
| ● **A-) Trigger v1** | 9 AM: lanza B-) V3 para los clientes a los que les toca reporte. | 9 AM | 14/0 |
| ● **B-) V3** | Por cliente: baja métricas de Meta del período, arma el reporte (PDF vía Gotenberg), y si el cliente no tiene resultados avisa al estratega. La nota dice: "se corre a mano cuando a un cliente no le llegó el reporte, editando el ID en NocoDB". | sub / manual | 1/0 |
| ● **C-) Lógica envío de reportes v5** | El que realmente envía: **Gmail al cliente** + aviso en #office-1-fullfilment-reportes etiquetando al estratega; guarda `fecha-ultimo-reporte` en NocoDB. Incluye insights de IA. | sub | 63/0 |

**Estado**: sano (63 envíos en 30 días, 0 errores). Depende de `fecha-inicio-campaña` y del
estratega en NocoDB — los dos ahora vienen de Pulse.

### 3. Onboarding y experiencia del cliente por WhatsApp

| Workflow | Qué hace | Dispara | 30d |
|---|---|---|---|
| ● **A-) Recibir webhook chatwoot v1** | Recibe cada mensaje que entra a Chatwoot (WhatsApp de la agencia), lo limpia y se lo pasa al agente. | webhook Chatwoot | 110/0 |
| ● **B-) Agente de onboarding v5 "OrquestaBot"** | El agente de IA que conversa con el cliente nuevo por WhatsApp: responde dudas del onboarding (lee el doc de Google), agenda/reagenda/cancela citas (Calendly), hace la **encuesta de satisfacción a los 10 y 30 días**, y escala al asesor por Slack cuando hace falta. Modelos: gpt-5-mini / gpt-4.1-mini / Gemini. Memoria en Postgres. | sub | 115/0 |
| ● **C-) Tools agente principal v1** | Las herramientas que el agente llama por webhook: disponibilidad, reagendar, cancelar, alertar asesor/setter. | webhooks | 0/0* |
| ● **D-) Tools encuestador v1** | Herramientas de la encuesta: alerta a Slack (#office-6-problemas-onboarding-clientes) con resumen de IA, finalizar encuesta. | webhooks | 5/0 |
| ● **F-) Lector de seguimientos v1** | 10 AM: busca en la base de onboarding a quien agendó hace exactamente 10 y 30 días y le dispara la encuesta por WhatsApp. | 10 AM | 28/0 |
| ● **J-) Envío de mensaje de bienvenida** | 5 PM: manda el WhatsApp de bienvenida a quien agendó ese día. | 5 PM | 14/0 |
| ● **I-) Envío de PDF de ciberseguridad** | 10 AM: manda por WhatsApp un PDF educativo (Drive) a los clientes nuevos. | 10 AM | 14/0 |
| ● **E-) citas automáticas v4** | **El alimentador de la base de onboarding**: lee los correos de Calendly (`no-reply@calendly.com`) cada minuto y crea la fila (nombre, email, teléfono, fecha, evento). 143 nodos. | Gmail | ⚠ 0 en 30d |
| ○ G-) PDF de educación · ○ H-) Felicitaciones 100-200 leads · ○ Mensaje de bienvenida onboarding (viejo) | Variantes/versiones anteriores. Felicitaciones está "activo" pero su schedule (cada 2 días 4:20 PM) no corrió en 30 días. | | |

**⚠ Hallazgo importante**: `citas automáticas v4` **no ha corrido ni una vez en 30 días**. Es el que
mete a los clientes nuevos en la base de onboarding. Como bienvenida/PDF/seguimientos leen esa base
por fecha, **desde hace un mes ningún cliente nuevo recibe la bienvenida ni las encuestas de 10/30
días** (los workflows "corren ok" pero no encuentran a nadie). Causas probables: el trigger de Gmail
perdió la conexión OAuth, o Calendly cambió el remitente/formato. Es el arreglo #1 de la lista.
Alternativa mejor que arreglar el parser de correos: nuestro webhook de Calendly ya existe
(`/api/calendly` en Content OS, escribe en Pipedrive); puede también escribir la fila en NocoDB.

### 4. Tesorería y retención (los que leían Monday directo → hoy leen Pulse)

| Workflow | Qué hace | Dispara | 30d |
|---|---|---|---|
| ● **Agente Cobros** | 9 AM: busca en TESORERÍA (Pulse) a quien le toca "Próximo pago" hoy y avisa en #office-9-agenteia-tesoreria etiquetando a la persona de cobros (U091X0MQXV0), con negocio, acuerdo, estado de ads y comentarios. | 9 AM | 14/0 |
| ● **Recordatorio 60-90 días** | 9 AM: avisa quién cumple 90 días de acuerdo hoy (renovar contrato) y quién cumple 60 (30 días antes). | 9 AM | 14/0 |

**Estado**: sano. Verificado el 21/sep que con Pulse dan exactamente lo mismo que daban con Monday.

### 5. Publicación de campañas (la "fábrica" del proveedor)

| Workflow | Qué hace | 30d |
|---|---|---|
| ● A-) Webhooks central v1 / ○ v2 devflow | Punto de entrada para publicar campañas desde un formulario/CRM: recibe el pedido, crea copies con IA y publica en Meta. | 0/0 |
| ● B-) Publicador de campañas v1 (112 nodos) / devflow (137) | Crea campaña + conjuntos + anuncios en Meta desde NocoDB/Minio (creativos), con thumbnails por SSH/ffmpeg. Nota: "colocar el http request para activar la campaña" (quedó a medias). | 0/0 |
| ● C-) Creador de copy(s) v1 / devflow | Genera copies con gpt-4.1. | 0/0 |
| ● Recordatorio remarketing (<3 campañas activas, 15 días después) | Alerta con IA si el cliente tiene menos de 3 campañas 15 días después de arrancar. | 0/0 |
| ● D-) Limpiador de minio | Mensual: vacía el bucket de creativos. | 0/0 |

**Estado**: **cero uso en 30 días**. Esto es lo que el proveedor estaba construyendo y nunca llegó a
producción. Hoy los traffickers publican con **Bori** y Max (Content OS) tiene su propio motor de
Meta Ads. **Recomendación: archivar toda esta familia** (no borrar: queda el respaldo en el repo).

### 6. Equipo interno

| Workflow | Qué hace | 30d |
|---|---|---|
| ● **A-) Mensajes de bienestar** | 11 AM: cápsula diaria de mentalidad con gpt-5 (arquetipos "duros"/"positivos") a #office-1-communications. | 14/0 |
| ● **A-) Agente de RH "SofIA"** | Por webhook (¿formulario/Slack?): vacaciones, reporte de conducta, consultas de políticas (SOP). Las vacaciones las procesa `C-) Herramienta - Procesar Vacaciones`, **que todavía lee Monday** (tableros HR, ya migrados a Pulse). 4 usos en 30 días. | 4/0 |
| ● D) Comprobante de pago | Formulario n8n para subir comprobantes → Drive + Slack. | 0/0 |
| ● Notificación Error | Recibe todos los errores de todos los workflows y avisa (Gmail + Slack + Teams). | 17/0 |
| ● BackUp Workflows / BackUp Credential | Respaldo cada 10 min a GitHub `level-up-media-pr/n8n-backup` (workflows) y diario (credenciales descifradas). | 2018/0 |

### 7. Apagados o dormidos (Monday)

- ○ **A-) Migración de datos de Monday v5** — apagado el 21/sep. Reemplazado por Sync Pulse.
- ○ **C-) actualización diaria de estratega** — apagado el 21/sep. Sobra: el estratega llega por Sync Pulse.
- ● **C-) Herramienta - Procesar Vacaciones** — activo, lee Monday (HR), solo lo llama el Agente de RH cuando alguien pide vacaciones. Repuntar a Pulse (`hr-level-up-media`, `solicitudes-hr`) cuando toque; hoy nadie lo dispara.
- ● **C.1) Agente de monitoreo (Jul 11)** — copia vieja del monitoreo que lee Monday. 0 corridas. Archivar.
- ○ ~15 copias/versiones viejas (Levelito MetricMan v1/v2/v3, Agente RH Backup, Birthday, Docusign, gráficos…). Archivar.

## Cómo lo mantenemos (el plan)

**Ya funciona hoy**
- Respaldo propio: `node scripts/n8n.mjs exportar` → `data/n8n/workflows/` (+ el backup del proveedor a GitHub, que sigue corriendo y es nuestro).
- Vigilancia: la ronda de Nico (7 AM) reporta workflows con error en 24 h. Además `Notificación Error` avisa por Slack/Gmail en el momento.
- Cambios: editar el JSON local → `node scripts/n8n.mjs subir <id>` → re-exportar. Sin tocar la UI.
- Datos: Pulse es la fuente; Sync clientes (5:10) y Sync equipo (5:00) repasan todo cada noche.

**Arreglos pendientes, en orden**
1. **citas automáticas v4 muerto hace 30 días** → nadie nuevo recibe bienvenida/encuestas. Revisar la credencial de Gmail; si está rota, conectar `/api/calendly` (Content OS) para que escriba la fila en la base de onboarding. Impacto directo en clientes.
2. **Quitar Microsoft Teams** de todos los workflows (Trigger v1.1, reportes, bienvenida, alerta de pago, Notificación Error, falta de pago…): era la copia del proveedor y hoy da error de licencia. Después, borrar la credencial `MicrosoftTeamsPymesAI`.
3. **Token de Meta del "Agente Monitoreo"** (system user): el proveedor lo renovaba cada 59 días a mano. Hay que saber cuándo vence (RevisionInstanciaEvoAPI avisa cuando muere) y dejarlo documentado; ideal: usar el token del sistema de Hey Bori, que ya tenemos.
4. Confirmar mañana que el Agente de monitoreo v3 corre sin el error de `blocksUi`.
5. **Archivar** la familia de publicación de campañas (5 workflows, 0 uso), C.1 monitoreo y las ~15 copias viejas. Menos ruido para Nico.
6. Repuntar Procesar Vacaciones a Pulse (baja prioridad).

**Reglas**
- Sin OK de Elvin: no activar/desactivar, no tocar credenciales ni webhooks (Chatwoot y las tools del agente apuntan a URLs fijas de n8n).
- Todo cambio pasa por el repo (JSON + commit). La UI de n8n solo para mirar.
- Las credenciales viven en n8n y en el backup de GitHub (privado). El día que cambie una (Meta, Chatwoot, OpenAI), se cambia en n8n y el backup la recoge.

**A futuro (cuando esté estable): ¿qué conviene sacar de n8n?**
- Los agentes de WhatsApp (onboarding, encuestas, bienvenida) son buenos candidatos para Bori: ya tenemos la plataforma, la memoria y el WhatsApp. No ahora.
- Monitoreo/alertas/reportes: se quedan en n8n. Funcionan, tienen 30 días de historia limpia y la lógica (umbrales por industria, fases) está probada.
- Publicación de campañas: ya está resuelto por Bori + Max. No migrar, archivar.

## Hecho el 21/sep (noche)

1. ✅ **Citas de onboarding**: `/api/calendly` (Content OS) ya no ignora los eventos de Onboarding: le
   avisa a n8n (`webhook/onboarding-cita`, workflow "A-) Cita de onboarding v1", GbGyPmnkEcf1Excz),
   que crea el evento en el Calendar de agenteia@ y la fila en la base de onboarding con dedupe por
   email/teléfono. Probado en simulación: OK. `citas automáticas v4` queda como respaldo inactivo de
   hecho (sin ejecuciones); archivar cuando el primer onboarding real pase por el nuevo camino.
2. ✅ **Teams fuera**: 8 nodos de Microsoft Teams (copia al proveedor) puenteados; los errores siguen
   yendo a Slack y Gmail. Falta borrar la credencial `MicrosoftTeamsPymesAI` desde la UI (Aure/Elvin).
