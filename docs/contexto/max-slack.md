## Max vive en Slack (24/sep/2026)

Elvin: "Max debe de vivir en Slack… todo el proceso (onboarding, estrategia, contenido) lo crea
independiente, envía aprobación al canal, se aprueba y se lo envía al cliente; luego crea la estructura
en borrador y, si lo autoriza, lo publica". **#max-aprobaciones** (`SLACK_MAX_CHANNEL_ID`, Elvin + Carilin
+ bot): Max propone con un #id; deciden **Elvin o Carilin** con `ok <id>` · `ok <id> pero …` (lo ajusta y
vuelve a subir) · `no <id> <corrección>` · `publica <id>`. **Max nunca le escribe al cliente**: el
servidor (`lib/max/flujo.ts`) publica en el canal del cliente EXACTAMENTE lo aprobado. Clientes = los
invitados de Slack (single-channel guests) en un canal vinculado → su mensaje va al buzón de Max, que
prepara la respuesta y la manda a aprobación. Arranca con cada cliente nuevo del formulario de onboarding
de LU: el formulario abre el expediente y **el Fathom de la reunión de onboarding de Jessica** (webhook de
la cuenta de equipo, `fathom.mjs crear --equipo`; solo llamadas etiquetadas "Onboarding · <Negocio>", lo
demás se descarta y no sale en ningún canal) despierta a Max y le pide a Jessica su resumen en el hilo
(`lib/max/onboarding.ts`). Aprueban Elvin, Carilin o Jessica; publicar solo Elvin o Carilin. Hoy ningún
canal de cliente habilitado (`MAX_CANALES_CLIENTES`) y límites de conversación en `revisarParaCliente`. Datos: tablas `max_clientes` (expediente: canal,
etapa, ficha, ids de Meta) y `max_items` (propuestas) en la base de Pulse, `lib/max/repo.ts`; lógica pura
testeada en `lib/max/operador.ts` (`tests/max-operador.test.mjs`); API `/api/max` (CRON_SECRET, pública
en proxy). Manos de Max: `scripts/max.mjs` (clientes|alta|canales|vincular|etapa|ficha|meta|leer|hilo|
llamada|proponer|pendientes|nota|cerrar|enviar) y `meta-ads.mjs cliente:<slug> …` (cuenta del expediente)
+ `proponer-publicar <campaignIds> --cliente <slug>` + `activar --item <id>` (ÚNICO camino para prender
por API: exige un 🚀 aprobado por Elvin/Carilin y prende solo sus ids). Puente de Max (Railway): lo que
llega `de: slack` se trabaja con `MAX_SLACK` y el cerebro §17. Bori queda para los clientes de AIB.
**Modelo y gasto:** Opus 5.5 para planear/investigar/producir y Haiku 4.5 para mensajes y trámites, con topes
de $10/día y $25/semana para lo automático (`scripts/max-gasto.mjs`, `MAX_TOPE_DIA/SEMANA` en Railway; al
llegar, lo de Slack queda en cola y se avisa a Elvin). **Carpeta de Drive por cliente** (`lib/max/drive.ts`):
Google Apps Script en la cuenta de LU (`scripts/drive/max-drive.gs`, `DRIVE_SCRIPT_URL` + `DRIVE_SCRIPT_SECRETO`)
crea `Clientes Level Up · Max/<Negocio · Persona>` con 6 subcarpetas, la comparte con el dominio, la enlaza en
la columna "Carpeta del cliente (Drive)" de LEVEL UP MEDIA en Pulse y avisa en #max-aprobaciones; guarda el
onboarding y todo lo aprobado; Max sube lo demás con `max.mjs carpeta|drive-doc|drive-archivo|drive-listar`.
**Identidad** (`vault/ceo/identidad-max.md`): Max · Estratega Digital 5.0, muñequito 3D con las raíces de Elvin (su
creador: pelo, barba, blazer de lino crema) + pin de brújula y brillo amarillo LU, en `public/marcas/max/` (oficial max-v3, la de la ceja); publica en Slack con su nombre y foto (`chat:write.customize`), sus mensajes
programados salen con identidad por `max_programados` + cron `/api/cron/max-programados` (cada 5 min); su propia
app de Slack está lista en `scripts/slack/max-app-manifest.json` (falta instalarla y el cambio de token).
**Motion a pedido en UN paso (9/oct/2026)**: Carilin y María del Carmen pidieron 2 motion con todo el material en el hilo y Max
les pidió "URLs públicas", hex y tipografías por dos días (no podía abrir adjuntos; sus respuestas cortas iban al modelo barato y se
quedaban en silencio). Ahora: el pedido = un mensaje en #max-aprobaciones (brief + guion + logo y fotos o Drive abierto, sin b-roll);
`max.mjs material <slug> --hilo <ts>` → `/api/max` accion `material` (`lib/max/material.ts`, reglas puras `material-reglas.ts` +
tests) baja adjuntos de Slack y carpetas públicas de Drive (embeddedfolderview, sin clave) a Storage `pulse/motion/clientes/<slug>/`
con URL de 1 año y `ficha.material`; Max los mira, fija `ficha.marca` y corre `remi.mjs … --cliente --proponer`. Mensajes cortos de
un pedido de producción → modelo bueno (`PRODUCCION` en max-gasto.mjs); si una persona le escribe y Max no contesta, el puente le
da otra vuelta y si no, nota honesta + aviso a Elvin (`respondioEnSlack`). Cerebro §22b, skill motion-graphics §7.0. **María del Carmen
aprueba como Carilin** (9/oct; publicar campañas sigue siendo de Elvin o Carilin; `MAX_EDITORES`/`decisionDeEditor` quedan para quien
solo pida cambios). La música del motion se repite hasta el final (`<Audio loop>` en Anuncio.tsx). **Fotos del cliente desde el
primer segundo**: `foto` en cualquier escena de texto = foto de fondo con velo de su marca y texto blanco (`ConFoto` en escenas.tsx).
