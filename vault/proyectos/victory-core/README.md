# Victory Core — scrapper de leads B2B

**Cliente:** Néstor Nazario Robles · Victory Core Property Services (limpieza de oficinas, Fayetteville NC, arranca de cero).
**Servicio:** "Asistente chat (scrapper)" — **$500 setup + $147/mes**. Lo corremos nosotros.
**Qué hace:** descubre empresas por industria × territorio (Apify Google Maps) → lee su web y
las perfila (Claude, solo con evidencia) → busca al decisor (Apify braveleads: facility /
operations / office manager / owner) → califica con el ICP y puntúa 0-100 (script
determinístico, pesos del manual de Néstor) → entrega **solo hot/qualified** en CSV y/o su CRM
con un Sales Brief en inglés.
**Qué NO hace:** llamar, escribir, seguimiento, precios, chat. Eso es de Néstor y sus vendedores.

## Cómo se corre
```
/victory-leads correr                 # siguiente industria de la rotación, Fayetteville
/victory-leads correr bancos          # una industria
/victory-leads estado                 # conteos, costo del mes, próximas industrias
/victory-leads exportar               # re-entrega (CSV / Pipedrive / webhook)
/victory-leads recalcular             # tras cambiar pesos o umbrales en config.json
```
Archivos: `data/victory-core/config.json` (todo el criterio: territorios, industrias, ICP,
pesos, umbrales, presupuesto, CRM), `data/victory-core/cuentas.json` (base, append-only),
`data/victory-core/exports/leads-<fecha>.csv`, scripts en `scripts/victory-core/`.
Ritmo: **tarea programada `victory-leads-diario` a las 6 AM** (corre mientras la app de Claude esté
abierta). Entrega `entrega.leadsPorDia` = 25/día (mín. 20) como Google Sheet del día en la carpeta
de Drive `config.crm.drive.url` (Victory Core — Leads diarios); lo que sobra queda en cola.
Solo scrapea si la cola no cubre el día (máx. 2 industrias/día).

## Costos (Apify, cuenta de AI Borinquen)
Google Maps ≈ $0.004-0.01/lugar · contactos $0.002/lead + $0.05 start · Claude (enrichment
+ briefs) ≈ $0.02/cuenta. **≈ $1-3 por corrida, $5-12/mes.** Tope en config: $5/corrida,
$40/mes (30 % de la mensualidad = margen mínimo 70 %).

## CRM (Néstor elige)
1. **Pipedrive** (~$14/mes, lo paga él): nos da API token → `PIPEDRIVE_VICTORY_TOKEN` y
   `config.crm.adapter = "pipedrive"`, etapa "Lead calificado".
2. **CRM propio**: API/webhook → `config.crm.adapter = "webhook"` + `webhookUrl` (o Zapier/Make).
3. **Plan $247/$297**: incluye CRM GHL nuestro (adapter pendiente, se hace si lo toma).
Mientras decide: adapter `drive` (hoja diaria en la carpeta compartida). Falta compartirla con su email.

## Estado
- 17-sep-2026: construido (config + scripts + comando + tarea diaria 6 AM + carpeta Drive).
  Pipeline validado con fixtures. Apify estaba en tope mensual: Elvin pone crédito/API.
  Falta: compartir la carpeta con Néstor, su doc de segmentación.
- 18-sep-2026: **1ª corrida real** (property-mgmt, Fayetteville): 80 lugares → 62 cuentas → 4 calificados
  (1 HOT) en la hoja `Leads Victory Core — 2026-09-18`. Rendimiento ~5 % en esa industria; para
  20-25/día hay que subir volumen o entregar también nurture con contacto (decidir con Néstor).

## Cómo Néstor pide cambios
Hoja "Solicitudes" en la carpeta de Drive: la corrida de las 6 AM la lee, aplica lo que es configuración,
registra en `config.solicitudes.atendidas`, avisa a Carilin por Slack lo que requiere humano (CRM,
desarrollo, fuera de alcance) y confirma a Néstor por email cuando tengamos su correo. En la carpeta
hay un LÉEME (Google Doc) con la guía completa.

## Entrega del desarrollo
Paquete autocontenido (git) en `~/Documents/Claude/Projects/victory-core-leads/` + zip. Néstor lo abre en
Claude Code, conecta su Apify y su Drive, y corre `/victory-leads`. README con instalación, config y CRM.
Mientras tanto, nuestra tarea diaria corre con tope $2.50/día.

## Lo que falta de Néstor
Ver `mensaje-nestor.md` (segmentación, territorio, CRM, roles decisor, idioma del brief, pago).
