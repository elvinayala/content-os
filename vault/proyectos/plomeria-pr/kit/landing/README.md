# Landings de Resuelto

Dos páginas, misma marca, públicos distintos.

| Archivo | Para quién | URL en producción | Vista |
|---|---|---|---|
| `index.html` | Cliente (página oficial) | `resueltopr.com` | https://claude.ai/code/artifact/815f72db-7192-4096-a5e3-f733e3bf4b2e |
| `plomeros/index.html` | Plomeros (reclutamiento) | `resueltopr.com/plomeros` | https://claude.ai/code/artifact/a99dda50-7d24-4c25-9ad1-b0e9a1f0ca22 |

## Antes de publicar

Edita el bloque `window.RESUELTO` (arriba de `index.html`) y `window.RESUELTO_P` (arriba de `plomeros/index.html`):

- `whatsapp`: número de WhatsApp Business en formato internacional sin `+` (ej. `17875551234`). En la de plomeros puede ser el mismo número o uno de reclutamiento.
- `webhookEspera` (oficial) y `webhook` (plomeros): URL del webhook de GoHighLevel donde caen los formularios. Sin webhook los formularios muestran la confirmación pero no guardan nada.
- Los enlaces entre páginas ya son relativos (`plomeros/` y `../index.html`), así que funcionan al subir la carpeta completa.

## Cómo desplegar

Ya está en Netlify: sitio `resueltopr` (id `2a72cf58-73cd-4946-86fc-2da7daa928ed`), URL https://resueltopr.netlify.app, dominio `resueltopr.com`. Redesplegar:

```bash
cd kit/landing && npx -y netlify-cli deploy --prod --dir . --no-build --site 2a72cf58-73cd-4946-86fc-2da7daa928ed
```

`--no-build` es obligatorio: sin él la CLI detecta el Next.js del repo padre e intenta compilarlo. DNS en GoDaddy: A `@` → `75.2.60.5`, CNAME `www` → `resueltopr.netlify.app`.

## Decisiones de diseño

- **Oficial**: fondo crema C3, tipografía azul C1, naranja C2 solo en precios y acciones. Héroe con la conversación de WhatsApp porque la cotización instantánea es la promesa.
- **Plomeros**: mundo oscuro (azul noche) porque es el lado del que trabaja, no del que compra. Héroe con calculadora de ingreso semanal al 65%, que es la primera pregunta de todo plomero.
- Las reglas duras (el cliente es de Resuelto, nunca cobras tú) están en la página a propósito: filtran candidatos antes de la entrevista.
