---
name: revision-clientes
description: La revisión de la cuenta de anuncios de un cliente de Level Up con el método de Elvin — costo por resultado (máx → mes → 7 días → hoy), creativos caros comparados con su CTR (costo alto + CTR bajo = reemplazar ya), qué escalar (< $1 escalar con surf/vertical/horizontal; ~$2 con CTR alto, evaluar), si le falta la estrategia de 5 fases (8 a 12 campañas) y frecuencia > 1.8. El resumen va al estratega y queda en Ritmo para marcar "ejecutado" o por qué no. Usar cuando pidan "revisa a <cliente>", "tengo reunión con <cliente>", "cómo van los anuncios de <cliente>", "revisión de cuentas" o "a quién le toca revisión".
ejecucion: live
marcas: [level-up, clientes]
---

Eres Max (o quien haga la revisión por él). Esta es la skill de Elvin para revisar cuentas de clientes (15/oct/2026).

## Quién y cada cuánto
- Clientes en **CLIENTE ACTIVO** de LEVEL UP MEDIA (Pulse), con pauta.
- **Dos veces al mes**: acuerdo de **$3,000 o más**, sea cual sea el pago inicial (Elvin, 15/oct). **Una vez al mes**:
  los acuerdos menores. Los montos los mantiene Carilin en Pulse ("Acuerdo de Pago", "Pago Inicial").
- La tanda sale sola de lunes a viernes a las **7:30 AM PR** (≈ 8 por día). `node scripts/revision-clientes.mjs lista`
  dice a quién le toca. Se detiene con `pausa` en `data/meta-ads/revisiones/estado.json`.

## El resumen (claro, con espacios, pocos emojis)
1. 💰 **Costo por resultado**: Máx · Mes · 7 días · Hoy (y lo gastado en el mes).
2. **Primero los creativos más caros, comparados con el CTR** (último mes, solo lo prendido):
   - 🔴 **Reemplazar ya**: costo alto (≥ 1.5× la mediana de la cuenta; en conversaciones, además ≥ $3) **y** CTR < 2 %.
   - 🟠 **Costo alto** con buen CTR: revisar oferta o gancho.
   - 🟡 **CTR bajo de 2 %** aunque el costo no sea alto: rotar.
   Se optimiza **desde el creativo, no desde la campaña**.
3. 🚀 **Escalar** (conversaciones): **< $1** con CTR ≥ 2 % → pedir escalar: **surf** (si está bajo $0.99; Elvin lo dice "surf"), vertical u
   horizontal — el trafficker escoge. **Hasta $2 con CTR alto** (≥ 3 %) → evaluar. Siempre que siga bien esta semana.
   Otros objetivos: contra la mediana de la cuenta.
4. 📐 **Estrategia de 5 fases** (8 a 12 campañas activas):
   - Fase 1: tráfico al perfil de Instagram + reconocimiento ThruPlay.
   - Fase 2: ventas (WhatsApp/mensajes → conversaciones; landing → leads; tienda → compras/ROAS), **3 a 4 campañas**
     (video, flyers, carrusel o flexible).
   - Fase 3: remarketing a tibios y calientes, **mínimo 2** (video + flyers o carrusel).
   - Fase 4: ThruPlay a público de 365 días.
   - Fase 5: escalar lo que funciona.
   La fase sale del nombre de la campaña ("FASE 2 / VENTAS WHATSAPP…"); si no lo dice, del objetivo y el público. Más de
   12 activas = consolidar.
5. 🔁 **Frecuencia > 1.8** en el último mes → rotar el creativo o abrir el público.

Estado de la cuenta: ⚠️ **Cuenta no optimizada** si hay algo que corregir · ✅ con algo para escalar · ✅ al día.
La unidad es el **creativo** (el mismo flyer en varios conjuntos, o el mismo post en FB e IG, es uno). CTR = **CTR único**
de Meta. Reglas puras en `scripts/meta-ads/revision.mjs` (tests `tests/revision-clientes.test.mjs`).

## El seguimiento (que lo hagan)
- Cada punto del resumen es una acción en **Ritmo → Cuentas** (`/ritmo/cuentas`). El estratega marca **Ejecutado**, o
  **No se hizo** con el porqué (obligatorio).
- La **dirección de tráfico** (María del Carmen, Juan Diego, Carilin) ve todas las cuentas, el cumplimiento por estratega,
  marca la cuenta **"Ya está bien"** o le **pide optimización** (le llega por Slack).
- 2 días hábiles con puntos sin marcar → recordatorio al estratega; 4 → aviso a la dirección de tráfico.
- Encendido con `REVISION_CUENTAS=on` (Vercel). Antes: vista previa, solo Elvin ve los casos y no se le escribe a nadie.

## Cómo correrla
- Un cliente ya (antes de una reunión): `node scripts/revision-clientes.mjs cliente "<nombre | negocio | cuenta>"`
  (`--enviar` a Elvin por Telegram; `--caso` además lo abre en Ritmo para el estratega).
- La tanda del día: `node scripts/revision-clientes.mjs hoy` (ver) · `hoy --enviar` (una por día).
- Al contestarle a Elvin: el resumen tal cual + 1-2 líneas de criterio si ves algo que las reglas no ven.

## Reglas duras
- Solo lectura de Meta: la revisión no pausa, no cambia presupuestos, no prende nada. Escalar lo hace el trafficker.
- Al cliente nunca. Al estratega solo por Ritmo/Slack del bot cuando está encendido.
- Si Meta no deja leer la cuenta o falta el ID en Pulse, el caso lo pide (compartir con el portafolio Level Up
  836808821982174 con acceso a anuncios / poner el ID).
- Nunca inventar números ni ángulos.
