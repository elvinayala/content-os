# Nina · Community Manager de Resuelto

**Creada el 21/sep/2026 (11:30 PM) por pedido de Elvin.** Agente propio de Resuelto: vive en el servicio `agente` de Railway
(24/7, sin depender de la Mac), publica por **Zernio** en Instagram + Facebook y le reporta a Elvin por **Telegram**.
Código: `agente/src/community/` · estado: `data/estado/community.json` (volumen) · imágenes generadas: `data/estado/community-media/`
(públicas en `https://agente-production-684f.up.railway.app/community/media/<archivo>.png`).

## Identidad
- **Nombre:** Nina. Firma "Nina · Resuelto". Nunca menciona a Bori ni a las agencias.
- **Voz:** tuteo PR, directa, frases cortas, ≤ 2 emojis, sin "gratis" ni promesas de ingreso. WhatsApp 939-247-9234 · resueltopr.com.
- **Reclutamiento:** habla de plomeros en TODO Puerto Rico.

## Qué publica y cuándo
- **1 publicación al día, 11:00 AM AST**, los 7 días. **7:30 AM**: te manda por Telegram qué va a salir (pilar, formato, ángulo, creativo).
- **Mezcla 50/20/20/10** en ciclos de 10: `P S P R P M P S P R` (P=problema, S=solución, R=producto, M=mentalidad).
- **Formatos rotan**: post → carrusel → post → reel → post → carrusel → post. Historias NO. Reels solo de la biblioteca (3 videos); si no hay reel fresco, cae a post.
- **Creativos:** alterna 1 de la **biblioteca** (24 flyers + feed + 3 reels ya en resueltopr.com) y 1 **generado por ella** (tarjeta 1080×1350 con Sora/DM Sans, navy o crema, titular con palabras en naranja, apoyo, pill CTA; carruseles de 5 tarjetas). No repite un creativo en 21 días.
- **Feriados PR + federales EE. UU.** (`feriados.ts`: Reyes, Hostos, MLK, Presidentes, Abolición, Viernes Santo, De Diego, Madres, Memorial, Juneteenth, Padres, 4 de julio, Constitución PR, Barbosa, Trabajo, Raza, Halloween, Veteranos, Descubrimiento PR, Acción de Gracias, Nochebuena, Navidad, Despedida de Año): ese día publica sobre el feriado (post generado) y no consume turno del ciclo.
- Captions: Claude (`MODELO`, hoy claude-sonnet-5) con el brief del pilar + ángulo roninavo; gancho, 2–5 líneas, CTA, 4–6 hashtags.

## Operación
| Qué | Cómo |
|---|---|
| Ver plan de hoy + últimas 10 | `GET /admin/nina/plan` |
| Publicar/programar/borrador ahora | `POST /admin/nina/ejecutar?modo=publicar|programar|borrador` |
| Forzar el preaviso | `POST /admin/nina/preaviso` |
| Cambiar hora | `NINA.horaPublicacion` en `identidad.ts` |
| Agregar un creativo (p. ej. un reel nuevo) | sube el archivo a `kit/landing/...` (Netlify) y añádelo a `biblioteca.ts` |

**Sin Instagram/Facebook conectados en Zernio, Nina guarda todo como BORRADOR** (visible en Zernio → Posts) y te avisa. Con las cuentas
conectadas publica sola. Detecta las cuentas en cada corrida (`GET /v1/accounts/health`).

## Estado 21/sep 11:50 PM
- **Instagram @resueltoapp.pr y Facebook Resuelto PR conectados en Zernio** (ids `6ab1f7ef…` / `6ab1f756…`).
- **Primer post real programado: martes 22/sep 11:00 AM** — f01 "Hola, somos Resuelto" (pilar mentalidad), Zernio `6ab1f8e7…`, status scheduled en FB+IG. Desde el 23 el reloj publica solo: el ciclo sigue en `problema` (contador 3).
- Overrides manuales: `POST /admin/nina/ejecutar?modo=programar&creativo=f01&fecha=2026-09-22`.

## Telegram — LISTO (22/sep 12:05 AM)
Bot **@Nina_resueltoCM_bot** ("Resuelto - Nina CM"). `TELEGRAM_BOT_TOKEN` + `COORDINADOR_TELEGRAM_CHAT_ID=8771242182` (Elvin) en Railway y en `agente/.env`. Por este bot llegan: preaviso 7:30, reporte de publicación 11:00, candidatos que aplican por WhatsApp y escalaciones del agente. Ya no depende de la ventana de 24 h de WhatsApp.

## Probado el 21/sep
- Borrador 1: pilar problema, post c8 (biblioteca), caption "Coges el día libre, esperas todo el santo día y el plomero no llega…" → Zernio `6ab1f555…`.
- Borrador 2: pilar solución, **carrusel generado de 5 tarjetas** ("¿Tienes una fuga y no lo sabes?" → medidor), fuentes de marca OK → Zernio `6ab1f573…`.
