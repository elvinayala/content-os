---
name: hey-bori-meta-app
description: "app Hey Bori publicada y aprobada (ago/2026); business_management APROBADO el 24/sep/2026 03:21 AST (y renovados ads_management, ads_read, pages_show_list, pages_read_engagement, public_profile) — el puente de Evaluadores ya no hace falta; clientes con \"Sin páginas\" solo tienen que tocar Reconectar Meta"
metadata: 
  node_type: memory
  type: project
  originSessionId: f903cebd-d0d1-42f4-8fcd-b06da4b4ddc6
  modified: 2026-07-25T03:19:18.056Z
---

App de Meta **"Hey Bori"** (ID 27337036735966798) vive bajo el negocio **Level Up Media** (ID 100872629602980, Business Verification ✅). Se maneja desde el Chrome "Browser 2" de Elvin (cuenta FB distinta a elvinayalalugo@gmail.com — la de Level Up).

**Historia:** Primera verificación de acceso (17 nov 2025, enviada por Alexander Mora) fue RECHAZADA porque marcó "Agencia" y escribió que la app era "strictly for internal use by the agency" + puso levelupmediapr.net como sitio. Meta respondió "tu negocio no es proveedor de tecnología".

**24 jul 2026:** Se identificó la app como Tech Provider (irreversible, con OK de Elvin) y se reenvió la verificación de acceso corregida: solo "Plataforma SaaS" marcado, descripción de Bori como SaaS público por suscripción ($19-$249/mes, heybori.ai), "¿administras portfolios?" = No (clientes conectan vía Facebook Login, no se administran sus portfolios), sitio = https://www.heybori.ai. Estado: **En revisión** (Meta contesta ~5 días). Fecha límite de Meta: 22/09/2026.

**Falta después de que aprueben:** (1) subir ícono de la app (PNG 1024x1024 del coquí — Elvin debe subirlo a mano en Configuración → Básica), (2) App Review de permisos ads_management/ads_read/business_management/pages_show_list/pages_read_engagement — desde mayo 2026 SIN screencast (proceso simplificado), (3) publicar la app a modo Live. El tier "Full" de Marketing API llega solo con 500 llamadas/15 días y <15% error.

**Why:** Mientras no apruebe, los clientes de Bori NO pueden conectar sus cuentas de Meta — los anuncios están gateados a owner/staff (canAds en server.js). Los closers venden solo creación de contenido.

**How to apply:** Al retomar el tema Meta/App Review, revisar primero developers.facebook.com → Hey Bori → Revisar → Verificación (estado de acceso). No repetir el framing "agencia/uso interno" en ningún texto a Meta. Relacionado: [[bori-backend-real]], [[tablero-contenido]].

**Aprendizaje 14/sep/2026 (caso Lumière + trafficker):** `/me/accounts` solo devuelve páginas donde la PERSONA que conectó tiene rol directo. Si el trafficker crea la cuenta publicitaria en un Business Portfolio, la página queda "invisible" → Bori muestra "Sin páginas" aunque la cuenta sí salga. Arreglo en `meta.js` (commit 795957c): SCOPES + `business_management` y `listPages` une perfil + owned_pages + client_pages. Los clientes conectados ANTES deben desconectar y volver a conectar una vez (aceptando el permiso nuevo). Diagnóstico desde la sesión del dueño: `GET /api/admin/meta-debug?userId=<id>` (permisos, páginas, negocios). El pixel NO hace falta para campañas de WhatsApp/tráfico; solo para ventas web, y debe existir en el Administrador de Eventos y pegarse en Conexiones.

**Estado 16/sep/2026:** la app está **PUBLICADA** y la revisión del 21/ago/2026 fue **aprobada** (ads_management, ads_read, pages_show_list, pages_read_engagement con acceso avanzado). Lo que faltaba era **`business_management`** ("Listo para la prueba" = solo lo otorga a gente con rol en la app; a clientes públicos Facebook se lo descarta en silencio) → clientes con la página en un Business Portfolio (Yarimar/Liberty) ven 0 páginas aunque la marquen en el diálogo. Ese día se dejó lista la solicitud (submission 28046561495014315): descripción, screencast (`heybori-business-management.mp4`, grabado desde el Chrome de Elvin conectando su propia cuenta: 235 páginas, paso "Negocios" visible), certificación de uso permitido, tratamiento de datos (Digital Seed Ventures LLC / Railway / PR, prellenado de agosto) e instrucciones para revisores actualizadas (cuenta revisor.meta@heybori.ai verificada, login 200). **Pendiente:** que Meta registre la llamada de prueba a la API (`/me/businesses` ya se hizo al reconectar a Elvin; tarda hasta 24h) y entonces el botón **"Enviar para revisión"** se habilita → hay que darle desde developers.facebook.com → Revisar → Revisión de la app. Puente mientras tanto: agregar al cliente como Tester en Roles de la app.

**19/sep/2026:** la solicitud de `business_management` (submission 28046561495014315) quedó **enviada** ("Revisión en curso", Meta dice hasta 20 días). Mientras tanto el **puente que sí funciona** es agregar al usuario de Facebook del cliente como **Evaluador** en developers.facebook.com → Hey Bori → Roles de la app → Agregar personas → Evaluador → pegar su id (el `yo.id` que devuelve `/api/admin/meta-debug?userId=`). El cliente acepta la invitación en developers.facebook.com/requests (puede pedirle registrarse como desarrollador: aceptar términos) y luego Desconectar/Conectar Meta en Bori → aparece el paso "Negocios" y salen las páginas del Business Portfolio. Ya invitadas: Jennibel De La Rosa (Lumière, pendiente) y Yari Hernandez (Liberty, pendiente).


**24/sep/2026 — APROBADO.** App Review de Hey Bori: `business_management` **Approved**; renovados `ads_management`, `ads_read`, `pages_show_list`, `pages_read_engagement`, `public_profile`. Bori ya pedía ese scope (`meta.js` SCOPES + rerequest), así que no hay cambio de código: el cliente que tenía la página en un Business Portfolio ("Sin páginas") solo tiene que ir a Configuración → Conexiones → **Reconectar Meta** y marcar sus negocios. La versión B del mensaje de bienvenida (dar acceso directo a la página) y el puente de Evaluadores de la app dejan de hacer falta.
