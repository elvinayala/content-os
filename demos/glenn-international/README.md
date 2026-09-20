# Demo AutoFlow · Glenn International

Demo de atención al cliente por chat (estilo **WhatsApp Business**) para
**Glenn International**, hecho por **AI Borinquen** (producto **AutoFlow**).

Es un chat **interactivo sin servidor**: el visitante escribe y el bot responde
según el **tema y el idioma** del mensaje, con el catálogo real (energía renovable,
eléctrico, iluminación, telecom), ubicación/contacto, cotización, captura de lead y
traspaso a un especialista humano — en **español e inglés** (detección automática).
Todo el contenido sale de la web real de Glenn (`glenninternational.com`); no hay
precios ni horarios inventados. Sin API key ni costo por mensaje.

Para editar las respuestas, busca el arreglo `intents` dentro del `<script>` en
`index.html`: cada entrada tiene sus `k` (palabras clave) y los textos `es` / `en`.

## Archivo

- `index.html` — todo el demo en un solo archivo (HTML + CSS + JS inline, logo
  real embebido en base64). Cero build, cero dependencias, funciona offline.

## Ver localmente

```bash
# desde esta carpeta
python3 -m http.server 8000
# abrir http://localhost:8000
```

O simplemente abrir `index.html` en el navegador.

## Publicar (Netlify)

Es un sitio estático de un archivo — se sube en segundos:

- **Drag & drop:** arrastra esta carpeta a https://app.netlify.com/drop
- **CLI:** `netlify deploy --dir . --prod`

Queda con su propia URL (ej. `glenn-autoflow-demo.netlify.app`) para enviarle el
link al cliente.

## Editar las respuestas

El bot es un motor de intenciones por palabras clave (sin IA externa). En el
`<script>` de `index.html`:

- `intents[]` — cada tema: `k` (palabras clave, en minúscula y sin acentos) y los
  textos `es` / `en`. El primer tema cuyas palabras aparezcan gana; ordénalos de más
  específico a más general.
- `fallback` — respuesta cuando no reconoce el tema.
- `leadReply` — respuesta cuando el visitante deja teléfono o email.
- El saludo inicial está al final del script (`Saludo inicial`).
