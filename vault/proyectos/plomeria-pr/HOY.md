# Hoy · 6 de septiembre

**La regla del día: no publiques nada hasta que el link funcione y el WhatsApp conteste.** Los flyers dicen `resueltopr.com/plomeros`. Si alguien lo toca y no existe, quemaste el lanzamiento y esa persona no vuelve.

Orden correcto: **dominio → WhatsApp → web en vivo → perfiles → publicar**. Todo lo demás puede esperar a mañana.

---

## Bloque 1 · Lo que desbloquea todo (90 minutos)

- [x] **`resueltopr.com` registrado** en GoDaddy (6/sep, vence 6/sep/2027). Nameservers de GoDaddy: los DNS se configuran ahí.
- [x] **Número de WhatsApp: 939-247-9234** (comprado 21/sep). Falta:
  - [ ] Activar la línea (tiene que recibir el SMS de Meta). **No instales WhatsApp ni WhatsApp Business** en ella.
  - [ ] Conectarla en Zernio + variables en Railway: pasos exactos en `agente/README.md` §1 (10 min).
  - [ ] Avísame cuando esté conectada y redespliego las landings (ya tienen el número) y lo pongo en las campañas W1/W2 de Bori.
- [ ] **Reservar los handles**: `@resueltopr` en Instagram, Facebook, TikTok y YouTube. Aunque no publiques hoy, resérvalos antes de que alguien más los tome.
- [ ] **Llamar al abogado** para la LLC y el encuadre de la Ley 59-2022. Solo agendar, no hace falta que sea hoy.
- [ ] **Pasarme los datos de Luis**: municipio, número y nivel de licencia, vehículo, herramientas. Con eso cierro el territorio de lanzamiento y ajusto el agente.

## Bloque 2 · La web en vivo ✅ desplegada (6/sep)

- [x] Sitio creado y desplegado por Claude en Netlify: **https://resueltopr.netlify.app** (oficial) y **/plomeros**. Los 19 flyers viven en `/flyers/`.
- [x] Dominio `resueltopr.com` asignado al sitio en Netlify.
- [ ] **Pegar los DNS en GoDaddy** (Mi cuenta → Dominios → resueltopr.com → DNS): borra el registro A "Parked" de GoDaddy y añade:
  - **A** · nombre `@` · valor `75.2.60.5`
  - **CNAME** · nombre `www` · valor `resueltopr.netlify.app`
  En 10–30 min carga `https://resueltopr.com` y Netlify emite el SSL solo.
- [x] Landings con el número real `19392479234` en el código (21/sep); se redespliegan cuando el número esté conectado (antes, el link de wa.me diría que no existe).

Para redesplegar (lo hago yo): `cd kit/landing && npx netlify-cli deploy --prod --dir . --no-build --site 2a72cf58-73cd-4946-86fc-2da7daa928ed`

## Bloque 3 · Redes (45 minutos)

Las imágenes están en `kit/perfiles/`.

- [ ] **Foto de perfil**: `avatar-naranja.png` (la recomendada, se ve en cualquier fondo). En las tres redes y en el WhatsApp Business.
- [ ] **Portada de Facebook**: `portada-facebook.png`.
- [ ] **Bio** (cópiala tal cual):
  > Plomería con precio fijo en Puerto Rico. Te decimos el precio antes de llegar.
  > 🔧 ¿Eres plomero? Únete 👇
  > resueltopr.com/plomeros
- [ ] **Cuenta profesional**: en Instagram, Configuración → Cuenta → cambiar a cuenta profesional (Business) y vincularla a la página de Facebook. Sin esto, ni los DMs ni la publicación por API funcionan después.
- [ ] **Portadas de destacadas**: las 4 de `kit/perfiles/` (Precios, Cómo funciona, Trabajos, Plomeros).

## Bloque 4 · Email (45 minutos)

**Usa GoHighLevel, no montes otra herramienta.** Ya lo necesitas para el CRM y el agente ya empuja ahí los contactos con etiquetas. Un solo sitio, cero costo extra.

- [ ] Crea una **sub-cuenta nueva** llamada "Resuelto". Propia, separada de las de las agencias.
- [ ] Verifica el dominio de envío (`resueltopr.com`) para que los correos no caigan en spam. Esto tarda unas horas en propagar, por eso conviene hacerlo hoy.
- [ ] Crea el workflow **"Candidatos plomeros"** disparado por la etiqueta `plomero-candidato`, con los 4 correos que ya están escritos en `kit/campana-reclutamiento.md` (sección 5): inmediato, día 2, día 4, día 7.
- [ ] Crea el pipeline **"Trabajos"** con las etapas: Agendado → Completado → Cobrado → Reseña. Copia los IDs, los necesita el agente.

Si prefieres no tocar GHL todavía, MailerLite es gratis hasta 1,000 contactos y sirve para arrancar. Pero acabarás moviéndolo.

---

## Lo que NO hagas hoy

- **No publiques todavía.** Espera a que el link cargue y el WhatsApp conteste. Un día no cambia nada; un lanzamiento con el link roto sí.
- **No prendas anuncios.** Primero la web y el agente, y antes hay que tener el seguro y la LLC.
- **No abras cuenta de TikTok todavía.** Ese contenido necesita a Luis en cámara y eso es de la semana que viene.

## Mañana

Con el dominio y el WhatsApp listos: conectar el agente a la Cloud API (una hora), publicar el primer flyer de reclutamiento, y entrar a los 10 grupos de Facebook de la campaña.
