---
name: glenn-international-demo
description: Glenn International — cliente prospecto grande de AI Borinquen (AutoFlow); demo de chat WhatsApp en demos/glenn-international/
metadata: 
  node_type: memory
  type: project
  originSessionId: 92e193c8-fd41-4275-bf5e-0c8dd880f997
---

**Glenn International** (glenninternational.com) es un cliente grande en PR que quiere
comprar el sistema de atención al cliente por chat de [[bori-superplataforma]] (producto
**AutoFlow**). Suplidor de energía renovable, eléctrico, iluminación y telecom para el
Caribe **desde 1967**; sede en Carolina PR (787-757-6000, info@glenninternational.com);
personal bilingüe; oficinas de apoyo en RD y Trinidad.

Se construyó un **demo estilo WhatsApp interactivo (sin servidor)** en
`demos/glenn-international/index.html` — un solo archivo HTML+CSS+JS con el logo real
embebido. El usuario escribe y el bot responde por **intención + idioma** (motor de
keywords en el JS, `intents[]`), bilingüe ES/EN, con la info real de Glenn (4 divisiones,
marcas, ubicación, contacto), captura de lead simulada y traspaso a humano. Sin API key,
sin costo, deployable a Netlify por drag-drop. El ZIP listo vive en `~/Desktop/
glenn-autoflow-demo.zip`. Branding Glenn: rojo `#C0161D`, granate `#800000`. Crédito
"Desarrollado por AI Borinquen · AutoFlow" abajo. (Antes era auto-reproducido; se cambió
a interactivo a pedido de Elvin.)

**Asistente de VOZ** (agregado): `demos/glenn-international-voz/` — página branded (orbe de
energía rojo, transcript, toggle ES/EN, persona **"Valentina"**) que usa la **voz real vía
Retell** manejando el orbe (RetellWebClient + `netlify/functions/webcall.mjs` con token
efímero), y **cae al demo del navegador (Web Speech)** si no hay función. Lógica: filtro por
área → orientar → ofrecer transferir a extensión (201-204). ZIP en `~/Desktop/glenn-voz-demo.zip`.
**Agente Retell YA MONTADO** (workspace **AI Borinquen**, key en .env.local): `agent_a42595e72c3dcd00c74e8f0a2c`
(LLM `llm_1bd94d81cf8d5366028992feaf0a`, `claude-4.5-haiku`, voz custom **Valentina**
`custom_voice_ac0ebbc0d0419afa7cd1882530` eleven_v3, bilingüe, 4 transfer tools). Copia la
fórmula del demo "Clinic Up". Re-provisionar: `node scripts/provision-retell-glenn.mjs`.
Deploy premium = poner `RETELL_API_KEY` en Netlify env. Prompt en **tuteo boricua** ([[voz-espanol-pr-tuteo]]).
Referencia mejorada: lizardo-family-dental.netlify.app. Ver [[voz-stack-2026]].

**Regla del demo:** solo info real de su web, nunca inventar precios/horarios/stock.

**Estado (jul 2026): demo de VOZ DESACTIVADO a pedido de Elvin** — el sitio Netlify
`glenn-international-demo-asistente-vo` ahora sirve una página "Demo no disponible", la
función `/api/webcall` fue eliminada del deploy y la env var `RETELL_API_KEY` borrada del
sitio → nadie puede generar llamadas (cero gasto). El agente Retell
`agent_a42595e72c3dcd00c74e8f0a2c` sigue existiendo (solo usable por Elvin vía Test Call).
**Reactivar** = redesplegar `demos/glenn-international-voz/` (public/ + funciones) con
`RETELL_API_KEY` en el sitio (o el ZIP `~/Desktop/glenn-voz-demo.zip`). El demo de CHAT
(`glenn-internationald-demo-chat.netlify.app`, estático y sin costo) sigue vivo.
