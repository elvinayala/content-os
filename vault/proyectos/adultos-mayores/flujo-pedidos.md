---
proyecto: Adultos Mayores PR
tipo: flujo-operativo
fecha: 2026-09-06
estado: borrador v1
---

# Flujo de un pedido · de la llamada a la puerta

> Un pedido nace en la voz del abuelo y termina con una foto en el WhatsApp del hijo. En el medio, la plataforma hace todo lo demás.

## 1. Dónde nace el pedido

| Entrada | Quién | Cómo |
|---|---|---|
| La llamada diaria | El abuelo | El agente pregunta "¿necesitas algo hoy?" y toma el pedido |
| La línea entrante | El abuelo | Llama al número de la nevera a cualquier hora |
| WhatsApp | El hijo | "Mándale compra a mami el viernes" |
| Recurrente | El sistema | Comida caliente 3 veces por semana, farmacia cada 30 días |

## 2. El flujo paso a paso

```
Abuelo pide (voz)
   │
   ▼
Agente repite el pedido y confirma ("¿está bien así?")
   │
   ▼
Se crea el pedido: categoría · detalle · dirección · ventana de entrega · precio estimado
   │
   ▼
Billetera del hijo
   ├─ dentro del límite → aprobado automático
   └─ fuera del límite → WhatsApp al hijo: "Mami pidió X, $Y. ¿Apruebas?" (un toque)
   │
   ▼
Despacho: se ofrece al cuidador más cercano disponible en el territorio (app simple del cuidador / WhatsApp)
   ├─ acepta en 10 min → asignado
   └─ nadie acepta → coordinador asigna a mano
   │
   ▼
Cuidador ejecuta (compra con recibo · farmacia · lleva al abuelo · visita)
   │
   ▼
Entrega: foto en la puerta con el abuelo (o del recibo/entrega) + hora
   │
   ▼
Cobro a la billetera: costo real (recibo) + fee de servicio + servicio del cuidador
   │
   ▼
Reporte al hijo por WhatsApp con foto y recibo
   │
   ▼
Calificación: el abuelo en la próxima llamada ("¿cómo te trató Luis?") y el hijo con un toque
   │
   ▼
Pago al cuidador: 65% del servicio, cada viernes
```

## 3. Catálogo con precios de referencia

| Categoría | Qué incluye | Precio al cliente | Al cuidador (65%) |
|---|---|---|---|
| Compra de supermercado | Lista por voz, compra con recibo, entrega en la puerta | costo de la compra + $9 de servicio + $12 de cuidador | $7.80 |
| Farmacia / recetas | Recoger receta o comprar OTC, entrega | costo + $7 de servicio + $10 de cuidador | $6.50 |
| Comida caliente | Plato del día de cocina aliada, entregado | $12–$15 (incluye entrega) | $4 por entrega |
| Transporte a cita | Ida, espera hasta 2 h, vuelta, acompaña adentro si la familia lo pide | $35–$60 | $23–$39 |
| Visita / compañía | 1–2 h: conversar, dominó, caminar, ayudar con algo de la casa | $25–$45 | $16–$29 |
| Pago o gestión | Luz, agua, correo, documentos | $15 | $9.75 |
| Arreglo de la casa | Se refiere a Resuelto con descuento | según Resuelto | comisión de referido a la plataforma |

Fee de servicio = ingreso de la plataforma. Servicio del cuidador se reparte 65/35. Los costos reales (compra, farmacia, plato) se pasan al costo con recibo, sin margen escondido: la confianza es el producto.

## 4. La billetera del hijo

- Se carga por **ATH Móvil, tarjeta o transferencia**. También sirve tarjeta guardada con cobro automático.
- **Límite por pedido y por mes** que fija el hijo. Debajo del límite todo se aprueba solo.
- **Varios hijos pueden aportar** a la misma billetera (el que vive en Orlando y la que vive en Bayamón).
- El abuelo **nunca maneja dinero** en este flujo. El cuidador **nunca recibe efectivo** del abuelo. Si el abuelo insiste en pagar algo, se anota y se le dice que "ya está pago".
- Estado de cuenta mensual por WhatsApp y en el panel.

## 5. El cuidador

- **Requisitos:** mayor de 21, certificado de antecedentes penales (Ley 300), 2 referencias, entrevista con el coordinador, entrenamiento de 2 horas (trato al adulto mayor, señales de alerta, qué nunca hacer), foto de perfil y, si maneja, licencia y seguro del vehículo.
- **Herramienta:** app simple o WhatsApp: recibe pedido, acepta, sube foto, cobra el viernes.
- **Reglas duras:** no efectivo, no entrar sin permiso, no medicar, no dar consejos médicos, no aceptar regalos de valor, no hacer trabajos fuera de la plataforma con los abuelos de la plataforma.
- **Calificación:** abuelo + hijo. Por debajo de 4.5 se revisa; una queja seria y sale.
- **Ingreso:** con 4 pedidos al día, $100–$140 diarios. Es la misma landing de reclutamiento que Resuelto usa con los plomeros, con la calculadora adaptada.

## 6. Territorios

Los mismos 8 de Resuelto: Metro Norte, Metro Oeste, Caguas, Ponce, Arecibo, Mayagüez, Aguadilla, Fajardo. Se abre un territorio cuando hay **20 abuelos activos** en él; antes, no se reclutan cuidadores ahí. Se arranca en el territorio del piloto.

## 7. Métricas del flujo (desde el día 1)

Pedidos por abuelo al mes · tiempo de aceptación del cuidador · tiempo de entrega · % con foto · calificación promedio · % de pedidos sobre el límite (si es alto, el límite está mal puesto) · ingreso por pedido · disputas.
