# Resuelto · Listos para dar trabajo (plan de 7 días)

**Escrito el 22/sep/2026 (noche).** Contexto de Elvin: "Vamos a tener 10 plomeros. La promesa es trabajo en 7 días. Tenemos que tener
flyers, reels, colaboraciones y anuncios para vender plomería, y la app del plomero, listos ANTES de que lleguen los plomeros."

## 1. Lo que quedó hecho hoy (en producción, probado de punta a punta)

**App del plomero v2** — `https://agente-production-684f.up.railway.app/proveedores?p=…&k=…` (PWA instalable, un link por plomero):
- Ve los trabajos disponibles de su zona, acepta con un toque (el primero se lo lleva), alerta push al celular (llaves VAPID puestas hoy) + WhatsApp.
- **Ciclo del trabajo:** 🚗 Voy en camino (le avisa al cliente por WhatsApp) → 📍 Llegué → 📷 fotos del antes/después con la cámara → ✅ Terminé (mano de obra final si es por rango, materiales con recibo, nota).
- **No deja cerrar sin foto del después.** El precio fijo no se puede cambiar; en servicios por rango, si se pasa del rango exige nota y avisa por Telegram.
- Al terminar: le manda al cliente el desglose y el link de pago (página `/pagar/R-xxxx`), mueve la oportunidad en GHL a Completado y te avisa.
- **Mi semana:** lo que va ganando, qué viernes se le paga, semana pasada y acumulado.
- Datos del cliente (tel, WhatsApp, dirección con Google Maps, ventana) solo para el plomero asignado.

**Panel de operación** — `/admin/plomeros?t=<ADMIN_TOKEN>` (token en `agente/.env`):
- **Alta de plomero en 30 segundos** (nombre, WhatsApp, municipio, licencia) → queda activo en su territorio y le llega por WhatsApp la bienvenida con su app.
- Lista de plomeros (copiar link, reenviar bienvenida, pausar/activar), trabajos (montos, fotos, marcar cobrado / pagado al plomero) y ofertas.

**Arreglos de seguridad/negocio:**
- **Cobertura real:** antes Metro Norte estaba "activo" con un plomero de relleno (Luis, 787-000-0000) → el agente agendaba clientes que nadie iba a atender. Ahora solo hay servicio donde hay un plomero ACTIVO en el registro; si no, lista de espera. El agente no puede agendar sin plomero.
- `/admin/*` estaba abierto (teléfonos de candidatos). Ahora exige token; los links que llegan por Telegram lo traen.
- Registro de plomeros en el volumen de Railway (`data/estado/plomeros.json`): altas sin redesplegar.

**Prueba e2e (22/sep):** cliente "fregadero tapado en San Juan" → agente cotizó $149 + $19, agendó → oferta al plomero de prueba → aceptó → en camino → llegó → intentó cerrar sin foto (rechazado) → foto → cerró con $12 de materiales → cliente $182.40, plomero $110.05 → apareció en su semana. Datos de prueba borrados.

## 2. Lo que falta, por quién

### Elvin (bloqueos: sin esto no se cobra ni se anuncia en Google)
| # | Qué | Por qué bloquea |
|---|---|---|
| 1 | **Cómo cobramos esta semana**: ATH Móvil Business real (hoy dice `/ResueltoPR`, es de relleno) y/o Stripe. Ambos piden la LLC o un negocio registrado. Si la LLC no sale esta semana, decidir el puente (ATH Business a nombre de otra entidad tuya, temporal) | El cliente no tiene dónde pagar; al plomero se le paga solo lo cobrado |
| 2 | **Presupuesto de clientes** (ver §3): con 10 plomeros la promesa de trabajo en 7 días cuesta ~$150–200/día | Define cuántas zonas se prenden |
| 3 | **Cuenta de Google Ads + Google Business Profile de Resuelto** (crear y darme acceso) | Google es el canal #1 para plomería (la gente busca "plomero cerca de mí" con el problema encima) |
| 4 | **Seguro de responsabilidad** y acuerdo del plomero revisado por el abogado | Antes del primer trabajo real |

### Claude (construyo esta semana, en este orden)
1. **Campaña de clientes en Meta, EN PAUSA**, un conjunto por territorio, destino WhatsApp 939-247-9234, creativos c1 (menú de precios), c9 (sin sorpresas), c3 (destape), c10 (calentador) + reel de clientes. Se prende zona por zona cuando haya plomero activo ahí.
2. **Encuesta + reseña de Google** 3 h después de cada trabajo cerrado (1–5 estrellas; 5 → link de reseña; ≤3 → alerta a ti). Las reseñas son el combustible de los anuncios.
3. **Recordatorio al cliente** la noche antes de la cita y aviso si el plomero no marcó "en camino" 30 min antes de la ventana (alerta a Yaileen/coordinador).
4. **Contenido de antes/después**: las fotos que suben los plomeros alimentan a Nina (con permiso del cliente) → posts y reels reales en vez de solo flyers.
5. **Guía de 1 página para el plomero** (cómo usar la app) + video corto de pantalla, para mandarla con la bienvenida.

### Nina (orgánico)
Desde que haya 3+ plomeros activos, subir la proporción de contenido para clientes (menú de precios, casos reales, dónde estamos) y anunciar cada zona que abre.

### Yaileen (reclutamiento)
Cada plomero firmado → alta en `/admin/plomeros` el mismo día (le llega su app sola).

## 3. La cuenta de la promesa "trabajo en 7 días"
- Un anuncio de WhatsApp para plomería en PR: ~$4–8 por conversación; ~35 % termina en trabajo agendado → **~$15–25 por trabajo**.
- **~$20/día por zona ≈ 1 trabajo al día** en esa zona.
- 10 plomeros repartidos en 5–6 zonas → **$120–200/día** para que cada uno reciba su primer trabajo en la semana y 1/día después.
- Si el presupuesto es menor: **activar plomeros en olas** (alta en `/admin/plomeros` cuando su zona tenga pauta) y prometer "tu primer trabajo en 7 días" solo a los de zonas con anuncios. Reclutar en toda la isla sigue; lo que se escalona es la activación.
- Regla del plan de clientes que sigue vigente: mejor 2 plomeros ocupados en una zona que 10 esperando por toda la isla.

## 4. Decisión pendiente menor
**¿Qué viernes se paga?** Hoy la app muestra: semana lunes–domingo, pago el viernes siguiente (5 días después del cierre, da tiempo a que paguen los clientes). Alternativa más atractiva para reclutar: corte el miércoles y pago ese mismo viernes. Es un cambio de una línea (`lunesPR`/`cuentaSemanal` en `agente/src/ciclo-trabajo.ts`).
