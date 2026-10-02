# Resuelto · Plan de octubre: subir el ticket y subir el cierre

**1/oct/2026.** Sale de la evaluación de los primeros 10 días (21–30/sep) y de lo que pidió Elvin: "empujar subir el
ticket, subir el cierre… activa campañas donde está el plomero nuevo, creativos de los tickets más altos, más lo que ya
está funcionando (precio fijo)".

## Dónde estamos

| | Hoy |
|---|---|
| Plomeros activos | Edgar (Caguas, T3) · **Luis Saez (Cidra, T3, firmó hoy)** · Samuel (Quebradillas, T5) · Santos (Aguadilla, T7, maestro) |
| Pauta | $65/día: Precio fijo Caguas, Quebradillas y Aguadilla $15 c/u · Confianza Aguadilla $10 · Llamadas Aguadilla $10 |
| Lo que funciona | "Precio fijo" (flyer de la ciudad): Caguas 26 conversaciones a ~$2.20 en 7 días, Quebradillas 16 a ~$3.50 |
| Lo que no | "Problemas" (destape/calentador en video) y llamadas: casi $0 en conversaciones |
| Trabajos | R-0001 completado (Edgar) · R-0002 mañana 8 AM Caguas y R-0005 cisterna Gurabo sáb (ofrecidos a Luis) · R-0004 Cayey sáb (Edgar) |
| El problema | Ticket promedio ~$150 → a Resuelto le quedan ~$64 por trabajo y cuesta ~$113 conseguir un cliente. Con $129 no da. |

**La meta del mes:** ticket promedio **≥ $250** y cierre **≥ 15 %** de las conversaciones que dejan teléfono. Con eso,
cada trabajo deja ~$110 y el cliente sale pagado en el primer trabajo.

## 1. Subir el ticket

| # | Qué | Estado |
|---|---|---|
| 1.1 | **Conjunto "D · Ticket alto" en Caguas y Cidra** ($15/día): 5 flyers nuevos (calentador solar desde $699 · trabajos grandes · factura de agua alta / filtración · cisterna desde $899 · calentador $279). Script `kit/anuncios/lanzar-ticket-alto.mjs`, listo. | ⏳ **espera el OK de Elvin** (gasta dinero) |
| 1.2 | **"Aprovecha la visita"**: el agente, al pedir los datos para agendar, hace UNA pregunta para sumar algo a la misma visita sin otro cargo de coordinación (inodoro que corre, llave que gotea, calentador viejo). Va en las notas de la cita y el plomero lo suma en sitio con "Encontré algo más". | ✅ en el agente desde hoy |
| 1.3 | **Plomeros vendiendo en sitio**: "Encontré algo más" y "Recomendar algo" en la app (65 % de lo aprobado es suyo). Yaileen se lo enseña a Luis en la llamada de bienvenida y le recuerda a Edgar. | ✅ app · Yaileen entrena |
| 1.4 | **Destape con máquina $299** en los anuncios: solo cuando confirmemos qué plomero tiene máquina y cámara. | ❓ Yaileen pregunta a Edgar y Luis |
| 1.5 | Repetir el conjunto D en Quebradillas y Aguadilla cuando el de Caguas tenga 5–7 días de datos (si el costo por conversación ≤ $5). Cada uno +$15/día. | después |

## 2. Subir el cierre

| # | Qué | Estado |
|---|---|---|
| 2.1 | **Precios desde el primer mensaje** ("hola", "info", "precio"): el 34 % escribía una vez y se iba. | ✅ desde el 30/sep |
| 2.2 | **Nunca "cita sin plomero"** en Caguas: con Luis hay 2 plomeros en T3. R-0002 y R-0005 ya están ofrecidos a Luis. | ✅ |
| 2.3 | **Llamar a quien deja número y no agenda**: Heileen llama el mismo día (le llega por Telegram cuando el cliente pide llamada). Siguiente paso: aviso automático a las 2 h si dejó teléfono y no agendó. | 🔜 construir |
| 2.4 | **Las llamadas al 787-956-1111** se quedan en el aire por el bloqueo de Telnyx a números de PR. | ⏳ Elvin le pide a Zernio que habilite PR (+1 787/939) |
| 2.5 | **Cobrar en el momento**: ATH Business / Stripe. Hoy se cobra a mano. | ⏳ Elvin |
| 2.6 | Citas duplicadas bloqueadas · scope claro ("el precio es por lo que nos describiste; lo demás lo apruebas tú"). | ✅ |

## 3. Pauta del mes (dentro del tope)

- Hoy $65/día. Con el conjunto D de Caguas: **$80/día**. Tope de los primeros 30 días: $125.
- Cada lunes: se apagan los anuncios con 0 conversaciones en 7 días y se pasa el dinero al que trae (método de Max).
- Área nueva = plomero firmado + $15–20/día (Rafael en Canóvanas abriría Metro, donde ya hay demanda sin cobertura).

## 4. Quién hace qué esta semana

- **Elvin:** OK al conjunto D · Zernio (PR) · ATH Business/Stripe · recarga automática de Anthropic.
- **Yaileen:** instalar la app con Luis y que acepte R-0002 antes de las 5:50 AM · preguntar quién tiene máquina de destape ·
  firmas pendientes (Rafael de Jesus, Jose A. Vargas).
- **Heileen:** llamar a cada cliente que deja número el mismo día; confirmar a Somarie (R-0002) cuando Luis acepte.
- **Claude:** montar el conjunto D con el OK, aviso automático de "dejó número y no agendó", revisión de anuncios el lunes.
