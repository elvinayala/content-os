# Landing de Contigo PR

| Archivo | Para quién | URL en producción |
|---|---|---|
| `index.html` | El hijo (página oficial) | `contigopr.com` (dominio por registrar) · vista: https://claude.ai/code/artifact/fa348e96-2b34-419f-998c-c011707be10a |
| `cuidadoras/index.html` | La cuidadora (reclutamiento) | `contigopr.com/cuidadoras` · vista: https://claude.ai/code/artifact/ae6a1864-7325-47fc-a386-2f84823f4028 |

## Antes de publicar

Edita el bloque `window.CONTIGO` arriba de `index.html` y `window.CONTIGO_C` arriba de `cuidadoras/index.html`:

- `whatsapp`: número de WhatsApp Business en formato internacional sin `+` (ej. `17875551234`). Hoy tiene `17870000000` de relleno.
- `saludo`: el mensaje que se abre en WhatsApp al tocar cualquier botón. Los botones de "apadrinar" y "ser cuidadora" traen su propio saludo en `data-saludo`.
- `webhookEspera` (familias) y `webhook` (cuidadoras): URL del webhook de GoHighLevel donde caen los formularios. Sin webhook, el formulario muestra la confirmación pero no guarda nada.
- Los enlaces entre las dos páginas ya son relativos, así que funcionan al subir la carpeta completa.

Datos de ejemplo que hay que cambiar cuando existan los reales: "Carmen" (la voz, decisión D6), "Luz" y su tarjeta (cuidadora de muestra), los territorios activos (hoy Metro Norte y Metro Oeste), y los precios si cambia D4.

## Cómo desplegar

Sube la carpeta `landing/` entera a Netlify o Vercel (arrastrar y soltar). La estructura de carpetas ya produce las rutas `/` y `/cuidadoras`, y el `netlify.toml` trae la redirección. Vista previa publicada: https://claude.ai/code/artifact/fa348e96-2b34-419f-998c-c011707be10a

## Decisiones de diseño

- Fondo Blanco Arroz C3, títulos verde Yagrumo C1, amarillo Maíz C2 solo en botones, precios y el imán. Coral C6 solo en el corazón del logo y en la línea de alerta del reporte.
- El héroe muestra el **reporte diario en WhatsApp** porque esa es la promesa al hijo: "tú lo ves en tu WhatsApp".
- "Para ella / Para ti" en dos columnas: la verde es el mundo del abuelo (sin app), la blanca el del hijo (control).
- Los planes ponen en el medio Contigo Cuidado porque la cuidadora fija es la diferencia contra todo lo demás.
- La sección de la cuidadora usa una tarjeta con nombre, zona, visitas y "Verificada": es la pieza que responde a "¿es seguro?".
- Lista de espera por territorio: la llamada se activa en toda la isla; las visitas solo donde hay cuidadoras.
- "No somos servicio médico ni de emergencia" está en el FAQ y en el pie a propósito.

## La página de cuidadoras

Mundo verde profundo, no crema: es el lado del que trabaja, no del que compra (misma lógica que la landing de plomeros de Resuelto). El héroe es la **calculadora de ingreso al 65%** porque "¿cuánto voy a ganar?" es la primera pregunta de toda cuidadora.

Las **cinco reglas duras** (nunca efectivo, no medicar ni bañar, la familia es de Contigo, foto de cada entrega, no aceptar regalos) están en la página a propósito: filtran candidatas antes de la entrevista y evitan el problema más caro del negocio.

Los flyers que llevan a esta página están en `../flyers/`.
