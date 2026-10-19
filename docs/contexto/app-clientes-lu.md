## App de clientes de Level Up (`app.levelupmediapr.net`, 29/sep/2026)

Elvin: "apps sin App Store con push… una para mis clientes de Level Up". PWA instalable (mismo patrón que Ritmo) para los
clientes que pagan: **Inicio** (en qué va: Onboarding → Cuentas → Estrategia → Campañas, del grupo + Progreso de LEVEL UP
MEDIA; su semana en números; próximo reporte; su equipo) · **Resultados** (Meta Ads de SU cuenta, 7/30 días/este mes:
resultados = leads + conversaciones, costo por resultado, inversión, alcance, ROAS solo con ventas; día a día; los 3 mejores
anuncios con miniatura; caché 1 h) · **Archivos** (su carpeta de Drive + subir fotos/videos + acuerdo firmado) · **Mi cuenta**
(servicio, plan, equipo con "Agendar", instalar/activar avisos). **Solicitudes, reportes y soporte siguen en el canal de
Slack de su negocio** (Elvin: la app y Slack conviven; la app tiene "Escríbenos en Slack").
- **Acceso** (`lib/clientes-app/acceso.ts`, tests `tests/clientes-app.test.mjs`): link personal
  `/cliente/entrar?k=<itemId>.<version>.<hmac>` (`CLIENTES_APP_SECRET`) → el proxy deja la cookie `lu-cliente` (90 días);
  cada página confirma en `pulse_app_clientes` (migración 0039) que siga activo y en la misma versión (`visorActual`,
  `lib/clientes-app/sesion.ts`). **Cambiar link = versión + 1** (link y sesiones viejas mueren, candado dice "link vencido");
  desactivar = `activo=false`; reactivar siempre con versión nueva. El manifest lleva el link personal como `start_url`
  (iPhone: la app instalada puede no heredar la sesión de Safari) y el candado deja pegar el link. Clientes en OFFBOARDED o
  "Decidió no continuar" ven "tu cuenta no está activa".
- **Equipo**: en la ficha de LEVEL UP MEDIA en Pulse, pestaña **App** (`components/pulse/app-cliente.tsx`,
  `app-cliente-actions.ts`): crear/copiar/cambiar link, desactivar, **canal de Slack** del negocio (se pega a mano; no estaba
  guardado en ningún lado), "Ver como el cliente" (`/cliente/ver/<itemId>`, vista previa con sesión de Pulse), último acceso,
  teléfonos con avisos y "Enviar aviso". Cada cambio queda en el registro de seguridad (`app_cliente`).
- **Qué ve** (`lib/clientes-app/datos.ts`, lista cerrada): Empresa, Progreso/grupo, Tipo de servicio, Paquete, Pueblo, Fecha
  de Inicio, fechas de reporte, equipo (Personas = account manager; Estratega y Diseñador del tablero Asignación de
  Estrategas), Id cuenta publicitaria (solo para leer Meta) y el PDF de Acuerdo firmado. **Nunca** pagos, montos,
  comentarios, notas, vendedor ni datos de contacto del equipo. `CLIENTES_APP_AGENDA` = {correo: Calendly} para "Agendar".
- **Resultados** (`lib/clientes-app/resultados.ts` + `resultados-reglas.ts` puro): Marketing API con `META_ADS_TOKEN` (el de
  Max, en Vercel desde el 29/sep; ~60 días, se renueva desde Bori). Token vencido → la app dice "no disponible" y a Elvin
  le llega UN aviso por día (`notificarCEO`).
- **Archivos** (`lib/clientes-app/archivos.ts` + `archivos-reglas.ts` puro): carpeta = columna **Contenido** (link de Drive) o
  la carpeta de Max. Va por el Apps Script (`scripts/drive/max-drive.gs`, acciones `app-listar|app-bajar|app-subir`, que
  verifica que el archivo esté DENTRO de la carpeta del cliente). Bajar: Apps Script → servidor → copia en Storage
  `pulse/clientes-app/<item>/cache/` → link firmado 5 min (Vercel no devuelve > 4.5 MB); tope 20 MB (más grande: por Slack).
  Subir: teléfono → Storage (URL firmada) → Apps Script → "Material del cliente (app)" (tope 100 MB, fotos/videos/PDF).
  **Pendiente de Elvin: publicar el Apps Script** (no hay `DRIVE_SCRIPT_URL`); mientras tanto la pestaña dice "muy pronto".
- **Push** (`lib/clientes-app/push.ts`, tabla `pulse_app_push`, SW `public/cliente/sw.js`, ruta `POST /cliente/push`): la
  prueba que el cliente se manda sale siempre; los avisos del equipo/sistema solo con **`CLIENTES_APP_AVISOS=real`**
  (apagado hasta el OK de Elvin). La pantalla de instalar/activar es común con Ritmo (`components/app-movil.tsx`,
  `ConfigApp`; config en `lib/clientes-app/config.ts`).
- **Dominio**: `app.levelupmediapr.net` agregado al proyecto en Vercel (29/sep) → falta en Network Solutions: CNAME `app` →
  `cname.vercel-dns.com` + TXT `_vercel` = `vc-domain-verify=app.levelupmediapr.net,c0d41a934badca58b913`. En ese host todo
  lo que no sea `/cliente` vuelve a la app (proxy). Tema `.lu-app` (negro #0b0b0b + amarillo #f5ce1a, Sora/Inter), CSP de
  Pulse + `*.fbcdn.net` para las miniaturas.
