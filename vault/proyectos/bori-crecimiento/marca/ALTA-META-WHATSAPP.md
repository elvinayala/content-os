# Bori en Meta · página, Instagram y WhatsApp (22/sep/2026)

Todo va en el portafolio **Level Up Media** (100872629602980, verificado; ahí vive la app Hey Bori).
Son activos NUEVOS: no se toca la página, la cuenta de anuncios ni el pixel de Level Up Media.
Archivos: `vault/proyectos/bori-crecimiento/marca/` (kit v1). Handle en todo: **@heybori**.

## 1 · Página de Facebook (Elvin, ~5 min)
business.facebook.com → portafolio **Level Up Media** → Configuración → Cuentas → Páginas → **Agregar → Crear una página nueva**.

| Campo | Qué poner |
|---|---|
| Nombre | `Hey Bori` |
| Categoría | `Software` (y si deja una segunda: `Servicio de publicidad y marketing`) |
| Presentación / bio | `Bori crea tus anuncios con IA y los publica en Facebook e Instagram, sin agencia.` |
| Sitio web | `https://www.heybori.ai` |
| Usuario | `heybori` |
| Foto de perfil | `02-perfil/avatar-oscuro-1080.png` |
| Portada | `03-portadas/facebook-1640x924.png` |

## 2 · Instagram (Elvin, ~5 min)
App de Instagram → crear cuenta nueva → usuario **`heybori`** (respaldo `heybori.ai`).
- Nombre: `Hey Bori · anuncios con IA`
- Bio:
  ```
  Tus anuncios con IA en 1 minuto
  Flyers, videos y copy para tu negocio
  Publica en FB e IG sin agencia
  👇 Pruébalo gratis
  ```
- Enlace: `https://www.heybori.ai`
- Foto: `02-perfil/avatar-oscuro-1080.png`
- Configuración → Tipo de cuenta → **Cuenta profesional → Empresa → Software**.
- Conectar a la página **Hey Bori** (Configuración → Centro de cuentas, o desde la página: Configuración → Cuentas vinculadas → Instagram).
- En business.facebook.com → Level Up Media → Cuentas → Cuentas de Instagram → **Agregar** → `heybori`.

## 3 · WhatsApp 939-250-8393 (Elvin, ~5 min) — NUNCA instalarle WhatsApp a esa línea
zernio.com → Connections → selector de perfil junto a "Platforms" → **nuevo perfil "Hey Bori"** →
con ese perfil seleccionado: WhatsApp → **+ Connect** → **"It's with another provider or on the API"** →
ventana de Meta: portafolio **Level Up Media** → **crear cuenta de WhatsApp Business nueva** →
- Nombre visible: `Hey Bori`
- Categoría: la más cercana a software/servicios profesionales
- Descripción: `Bori crea tus anuncios con IA y los publica por ti. Tu cuenta y soporte: heybori.ai`
- Número `939-250-8393` → verificación por **SMS** (llamada si no llega).
- Foto de perfil del WhatsApp (Connections → WhatsApp → Business Profile): `02-perfil/avatar-oscuro-1080.png`.

## 4 · Lo que hace Claude cuando Elvin diga "listo"
- Busca el `accountId` del WhatsApp de Bori en Zernio (API).
- Crea el webhook `https://www.heybori.ai/api/whatsapp/zernio` (message.received + message.sent) con un secreto nuevo.
- Pone en Railway (believable-amazement → bori): `ZERNIO_API_KEY`, `ZERNIO_ACCOUNT_ID`, `ZERNIO_WEBHOOK_SECRET`.
- Prueba de punta a punta; después `WHATSAPP_SOPORTE=19392508393` (prende el botón de la landing y de los correos).
- Botón "Enviar mensaje de WhatsApp" en la página Hey Bori (si Elvin lo aprueba).
