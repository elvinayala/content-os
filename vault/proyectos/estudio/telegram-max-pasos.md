---
fecha: 2026-09-21
fuente: manual
unidad: portafolio
tags: [telegram, botfather, max, meta-ads, railway]
estado: HECHO 21/sep/2026 · bot @eamarket_max_bot · servicio `max` en Railway con todas las variables
---

# Conectar a MAX (tu media buyer) en Telegram — 5 minutos desde el celular

Max es un bot propio, separado de Sofi y de Nico. Le hablas normal ("móntame un Follow Me a
Mauro con estos dos reels, $15 al día", "¿cómo van las campañas de Mauro?") y él monta las
campañas EN PAUSA o te lee los números. Cerebro: `vault/ceo/cerebro-max.md`.

## A. Crear el bot (en Telegram, 2 min)
1. Abre **@BotFather** (palomita azul) y escribe `/newbot`.
2. Nombre: `Max · Media Buyer`
3. Usuario (termina en `bot`, sin espacios): `iamarket_max_bot` (si está tomado: `max_iamarket_bot`).
4. BotFather te da el **token** (`8123456789:AAH…`). Tócalo para copiarlo.
5. Opcional: `/setdescription` → "Media buyer de IA Market: monta campañas en pausa y lee resultados."
   `/setuserpic` → tu logo.

## B. Pegar el token en Railway (1 min)
Desde la Mac (recomendado), pega el token en lugar de `<token>`:

```bash
cd "/Users/elvinayala/AGENTE CONTENIDO" && npx @railway/cli variables --service max --set "TELEGRAM_BOT_TOKEN_MAX=<token>" --skip-deploys
```

O en railway.com → proyecto **puente-telegram** → servicio **max** → Variables →
`TELEGRAM_BOT_TOKEN_MAX` = el token.

## C. Desplegar a Max (1 min)
```bash
cd "/Users/elvinayala/AGENTE CONTENIDO" && npx @railway/cli up --service max --detach
```
Tarda ~2 minutos en construir. Ya tiene: `PUENTE_BOT=max`, tu chat id, la clave de Anthropic,
el token de Meta Ads (compartido con `puente`), volumen `/estado` para no perder la conversación.

## D. Probar
En Telegram, abre tu bot y escribe `/start`. Debe contestar "Soy Max, tu media buyer…". Luego:
- `¿Cómo van las campañas de Mauro?`
- `Móntame un Follow Me a Mauro con los reels 18166493623461894 y 18164515909468572, $15 al día, 18 a 35`
- `/ads resultados level-up` (atajo directo, sin gastar tokens)

## Qué puede y qué no
- **Puede:** leer resultados, campañas y árboles; montar campañas con las 4 plantillas (follow-me,
  trafico-url, dm-instagram, quiz) EN PAUSA; pausar por id; listar videos y públicos de la cuenta.
- **No puede (a propósito):** activar, subir presupuesto, borrar, editar código, tocar cuentas fuera
  del portafolio, ni listar reels de IG (la app no tiene ese permiso: los ids de reels se los das tú,
  desde Ads Manager → Usar publicación existente → Identificador).
- Cuando el token de Meta venza (~60 días, error 190), Max te lo dice; lo renuevas con
  `node scripts/meta-ads/token-desde-bori.mjs` en la Mac y `railway variables --set META_ADS_TOKEN=…`.
