---
name: kit-propuestas-lis
description: Kit para que Lis haga sola las propuestas animadas de clientes (6/oct/2026) — Armador web lu-armador-propuestas.netlify.app + Skill/instrucciones para Claude que escriben el JSON
metadata:
  type: project
---

Elvin (6/oct/2026): Lis (Lis Acevedo, lis.acevedo@levelupmediapr.net) hace las presentaciones personalizadas de clientes; quiere que las haga sola, con el mismo estilo de la propuesta de KAS. Se le mandó por DM del bot (6/oct) el link, los pasos y dos archivos.

- **Flujo**: su Claude (aunque sea gratis) escribe el JSON con `Instrucciones para Claude - Propuestas.txt` → lo pega en **https://lu-armador-propuestas.netlify.app**, sube logo y ≤3 fotos → descarga el .html → Netlify Drop para el link. Con Claude Pro (Elvin se lo va a pagar): sube `Skill-Propuestas-Level-Up.zip` en Configuración → Capacidades → Skills.
- Todo en `demos/kit-propuestas/` (LEEME). Marcas `level-up` y `ai-borinquen`; testimonios SOLO de `testimonios.json` (links públicos aprobados). Dos motores iguales: `armar.py` y `armador/armar.js`; `construir-armador.py` rehace la página.
- **Why:** Elvin no tiene tiempo de hacer cada propuesta; Lis no sabe programar.
- **How to apply:** testimonio nuevo aprobado → subirlo a Netlify y agregarlo a `testimonios.json` (y reconstruir + redeploy el armador + rehacer zip/txt y reenviarle a Lis). Los videos de motion NO están en el kit: siguen saliendo de Remi (`motion/`). Ver [[lu-material-ventas]], [[remi-motion]].
