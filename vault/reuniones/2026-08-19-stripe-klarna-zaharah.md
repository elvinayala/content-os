---
fecha: 2026-08-19
fuente: granola
unidad: level-up
tags: [reunión, cliente, stripe, klarna, ecommerce, zaharah-gonzalez, pagos]
---

# Stripe y Klarna — productos y payment links con Zaharah (19/08)

**Resumen:** Sesión técnica de implementación con **Zaharah González** (gerente del
cliente, la más familiarizada con tecnología). Se monta Stripe con ~30 productos y
payment links, y se activa financiamiento por Klarna.

## Stripe

- Cuenta ya creada por la dueña; Zaharah entra a manejar la parte técnica compartiendo
  pantalla.
- **~30 productos individuales** a añadir. Por producto: nombre, descripción, imagen
  (opcional), precio y tipo de pago (**one-off** o **recurrente**).
- **Productos del mismo precio comparten link** (ej. compact powder en distintos
  colores).
- La imagen es opcional — poca gente la ve al entrar al link.
- Link de práctica creado y probado con éxito.

## Klarna y financiamiento

- **Klarna, Afterpay, Affirm y Amazon Pay se activan automáticamente** al crear el
  link. No hace falta abrir cuenta separada con Klarna; el cliente gestiona su cuenta.
- Al probar Klarna **no apareció la opción de cuotas** — posible causa: aprobación
  individual por cliente. Plan: probar con varias personas hoy y reportar.

## Impuestos

**11.5% de Puerto Rico incluido en el precio del producto.** En Stripe Tax se
seleccionó "already registered" (la tienda ya está registrada en hacienda).

## Acciones

- **Zaharah:** añadir los ~30 productos y crear sus payment links (1-2 min c/u),
  completar hoy y dar update en una hora; probar el link de Klarna con varios clientes
  y escalar si a nadie le aparece la opción de cuotas.
- **Promover Klarna en la tienda** con sellos visibles — puede subir las ventas
  **10-20%**.

## Conexiones

[[level-up]] — [[zaharah-gonzalez]]
