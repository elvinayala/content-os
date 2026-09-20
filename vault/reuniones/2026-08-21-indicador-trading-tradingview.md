---
fecha: 2026-08-21
fuente: granola
unidad: ecosistema
tags: [reunión, 1000x, trading, producto, indicador, tradingview]
---

# Indicador de trading con señales BUY/SELL (21/08)

**Resumen:** Especificación del **indicador** de [[1000x]] — el producto del tier de
$250. Traduce la estrategia de [[richy]] a señales visuales en la gráfica.

## Lógica

- En temporalidad de **5 minutos**: toma liquidez, espera confirmación al salir del
  nivel marcado.
- **Cierre por arriba con cuerpo → señal de compra.**
- **Cierre por abajo con cuerpo → señal de venta.**

## Visualización

Al activarse aparece un recuadro o triángulo sobre la vela: **"BUY"** en alcista,
**"SELL"** en bajista. No hace falta mostrar puntos ni niveles numéricos.

## Compatibilidad

Debe funcionar en **TradingView y en plataformas tipo TopStep**, enlazable a cuentas
de clientes en cualquiera de las dos, y disponible también dentro de la plataforma
propia. El usuario debe poder **activarlo o desactivarlo a voluntad**.

## Acciones

- Crear el indicador con señales BUY/SELL y opción de encender/apagar.
- Proveer credenciales o instrucciones para añadirlo en TradingView (Elvin necesita
  saber cómo instalarlo o vincularlo a las cuentas de clientes).

## Conexiones

[[1000x]] — [[richy]] — [[richy-elvin-trading]]
