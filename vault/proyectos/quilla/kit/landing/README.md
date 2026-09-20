# Landing y aplicación de Quilla

Dos páginas, HTML estático, sin build. Se despliegan arrastrando esta carpeta a Netlify o con la CLI.

| Archivo | Qué es | URL en producción |
|---|---|---|
| `index.html` | Landing: promesa, para quién es, las 12 etapas, los 4 modelos, las reglas, FAQ, CTA | `quillagroup.com` |
| `aplicar/index.html` | Aplicación: captura → 5 pasos → scoring → 3 pantallas de resultado | `quillagroup.com/aplicar` |
| `config.js` | **El único archivo que se edita antes de publicar** (webhook, calendario, email, Instagram) | — |
| `scoring.js` | La rúbrica 0–100, los 4 gates y el modelo sugerido (spec: `sistema-aplicacion-scoring.md` §3) | — |
| `test-scoring.mjs` | `node --test test-scoring.mjs` · 8 pruebas (los 6 perfiles de la spec + invariantes) | — |
| `estilo.css` | Tokens del brand kit (`../brand-kit.md`) y base compartida | — |
| `netlify.toml` | Redirect `/aplicar` y headers de seguridad | — |

## Antes de publicar

Edita `config.js`:

- `webhook`: URL del inbound webhook del workflow **"Aplicación de creadores"** en la sub-cuenta de GoHighLevel de Quilla. **Vacío = modo local**: la página funciona igual, guarda cada envío en `localStorage` (`quilla_aplicacion_v1_pendientes`) y lo muestra en la consola.
- `calendario`: URL del calendario de GHL "Llamada de evaluación · 20 min". Vacío = el botón "Agendar la llamada" se oculta y el aplicante solo recibe el email.
- `email` e `instagram`: los reales.

El aplicante **nunca ve su puntaje**. El score, la banda, el modelo sugerido, los motivos y los gates viajan en el payload a GHL.

## Cómo probar en local

```bash
python3 -m http.server 8795 -d "vault/proyectos/quilla/kit/landing"
```

(o el launch `quilla-landing` de `.claude/launch.json`). Abre `http://localhost:8795/?utm_source=test&utm_campaign=yt`, pulsa Aplicar y confirma que la URL conserva las UTMs. Desde la consola: `QUILLA_APP.calcular({...})` devuelve `{score, banda, modeloSugerido, gates, motivos}`.

## Cómo desplegar

```bash
cd "vault/proyectos/quilla/kit/landing" && npx -y netlify-cli deploy --prod --dir . --no-build
```

La primera vez crea el sitio (nombre sugerido `quilla`); anota aquí el `site id`. `--no-build` es obligatorio: sin él la CLI intenta compilar el Next.js del repo padre. DNS en el registrador: A `@` → `75.2.60.5`, CNAME `www` → `<sitio>.netlify.app`. **No publicar sin OK de Elvin.**

## El workflow en GHL (resumen; detalle en `sistema-aplicacion-scoring.md` §5)

Inbound Webhook → Create/Update Contact (llave: email) → custom fields (Score, Banda, Modelo, Motivos, Gates, Plataforma, Seguidores…, UTMs) → tag `creador` → si `evento = lead`: etapa "Empezó aplicación" (+ recordatorio 24 h) · si `evento = aplicacion`: por `banda` → `llamada`: etapa "Calificado · agendar" + email/WhatsApp con calendario + aviso interno · `revision`: etapa "Revisión humana" + aviso interno con motivos · `no-califica`: etapa "No califica" + email cortés + tag `reaplicar-90d`.

Si GHL rechaza el POST desde el navegador (CORS), plan B: función de Netlify clonada de `vault/proyectos/plomeria-pr/kit/landing/netlify/functions/lead.mjs` que llame a `contacts/upsert` con `GHL_TOKEN` en las variables de Netlify, y `config.webhook = "/api/aplicar"`.

## Decisiones de diseño

- **La línea de agua** (regla de 1 px en azul agua bajo el header) es el motivo de marca: arriba el creador, debajo Quilla.
- Un solo acento (azul agua profunda). Serif Newsreader para titulares, IBM Plex Sans para cuerpo, Plex Mono para etiquetas y contadores.
- La landing no tiene menú, contadores ni urgencia. La sección "Las reglas, de frente" y la de criterios filtran antes de la aplicación, a propósito.
- La aplicación pide los seguidores por rangos con el punto medio como valor: el scoring queda como tabla de búsqueda y no depende de cómo escriba el aplicante.
- Ninguna cifra de ingresos prometida en ninguna pantalla. Tuteo de Puerto Rico en todo el copy.
