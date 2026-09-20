# Asistente de voz "Valentina" — Glenn International (AutoFlow)

Demo de **asistente de voz por navegador** para Glenn International, hecho por **AI Borinquen**.
Mejora la fórmula de la referencia (una página que abría el web-call *genérico* de Retell):
aquí la página lleva el **branding de Glenn**, un **orbe de energía** propio, **transcript en
vivo**, toggle **ES/EN**, y la lógica de **filtro de llamada → orientar → ofrecer transferir
al experto del departamento** (con extensión), en tuteo boricua e inglés.

## Dos modos (el mismo orbe)

1. **Sin llaves (funciona ya).** Usa el micrófono del navegador (Web Speech API): tocas el
   orbe, hablas y Valentina responde con voz. Cero backend, cero costo. *Limitación:* la voz
   es la del sistema operativo y necesita **Chrome/Edge** (desktop o Android). Es el modo de
   respaldo — si la función premium no está disponible, la página cae a este modo sola.

2. **Premium (voz real "Valentina" de Retell) — YA MONTADO.** El agente ya existe en el
   workspace **AI Borinquen**:
   - Agente: `agent_a42595e72c3dcd00c74e8f0a2c` ("Glenn International - Demo Asistente de Voz")
   - Voz: **Valentina** (custom ElevenLabs, `eleven_v3`) · modelo `claude-4.5-haiku` · bilingüe
   - 4 transferencias a extensión: renovable 201 · eléctrico 202 · iluminación 203 · telecom 204
   El orbe usa esta voz real vía la Netlify Function `netlify/functions/webcall.mjs` (token
   efímero; la API key vive solo en el servidor). Detalle en [`retell-agente.md`](retell-agente.md).

## Probar la voz real AHORA (sin deploy)
En Retell → **Agents → "Glenn International - Demo Asistente de Voz" → Test Call**. Hablas con
Valentina de una vez.

## Publicar la página branded (Netlify, con la voz real)
1. En Netlify → **Environment variables** agrega **`RETELL_API_KEY`** = la Secret Key del
   workspace AI Borinquen. *(El `agent_id` ya está en la función; no hace falta más.)*
2. Sube la carpeta (incluye `netlify/functions/`): **drag & drop** a
   https://app.netlify.com/drop, o `netlify deploy --dir . --prod`.
3. En Retell → **Public Keys** (o dominios permitidos) autoriza tu URL `xxx.netlify.app` si te
   lo pide, y pon un **tope de gasto**. Abre el link en el celular con **Chrome** y habla.

> Sin la variable `RETELL_API_KEY` en Netlify, la página sigue viva pero en modo del navegador.

## Ver localmente
```bash
python3 -m http.server 8000    # http://localhost:8000  (Chrome) — usa el modo del navegador
# ?debug=1 expone window.__valeria para probar la lógica sin micrófono
```

## Editar
- **Respuestas del modo navegador:** en `index.html`, objeto `AREAS` y la función `respond()`.
- **Cerebro premium (prompt, voz, transferencias):** [`retell-agente.md`](retell-agente.md) y
  `scripts/provision-retell-glenn.mjs` (re-provisiona el agente si cambias el prompt/voz).
- **Nombre/idioma:** constantes al inicio del `<script>`.
