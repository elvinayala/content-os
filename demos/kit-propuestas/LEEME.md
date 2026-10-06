# Kit de propuestas animadas (para Lis) · 6/oct/2026

Elvin: "algo para ayudarle a Lis, que me hace las presentaciones personalizadas de los clientes… que lo pueda hacer ella".
El diseño y la animación son los de la propuesta de KAS (motor de la demo de closers de Level Up); el contenido sale de un JSON.

- **Armador** (lo que usa Lis): https://lu-armador-propuestas.netlify.app (Netlify `lu-armador-propuestas`,
  sitio d71acefd-10c5-4455-a713-1256e283c995, noindex). Pega el JSON → sube logo y hasta 3 fotos (se achican en el navegador)
  → crea, revisa, descarga el .html → Netlify Drop para el link. Todo corre en el navegador; nada sale a ningún servidor.
- **Claude escribe el JSON**: `skill/propuestas-level-up/SKILL.md` (+ `testimonios.json`, `ejemplo-kas.json`).
  Plan gratis: adjuntar `Instrucciones para Claude - Propuestas.txt` (= SKILL.md + anexos). Pro: subir
  `Skill-Propuestas-Level-Up.zip` en Configuración → Capacidades → Skills. Probado con un Claude aparte (caso inventado
  "Dulce Masa"): el JSON salió bien al primer intento; sus dudas se aclararon en la sección 6 del SKILL.
- **Marcas**: `level-up` (negro + amarillo) y `ai-borinquen` (verde-negro + neón #2bff88, Outfit). El color del cliente
  (`acento`) resalta su nombre.
- **Testimonios**: SOLO los de `testimonios.json` (links públicos ya aprobados: lu-demo-ventas, lu-propuesta-kas y
  aib-kit-ventas en Netlify). Testimonio nuevo = subirlo a un sitio y agregar su entrada.
- **Dos motores iguales**: `armar.py` (línea de comandos, `python3 armar.py datos.json`) y `armador/armar.js` (navegador).
  Si cambias uno, cambia el otro. `python3 construir-armador.py` rehace `armador/index.html`; luego se sube a Netlify.
- Lo que NO hace: videos de motion (Remotion). Esos siguen saliendo de `motion/` (Remi).
