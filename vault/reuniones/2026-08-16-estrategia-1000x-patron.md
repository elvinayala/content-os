---
fecha: 2026-08-16
fuente: granola
unidad: ecosistema
tags: [reunión, 1000x, trading, estrategia, nasdaq]
---

# Estrategia 1000X — el patrón de entrada (16/08)

**Resumen:** Documentación de **la estrategia base de [[1000x]]** — la lógica que
después se convierte en el indicador y el radar. Mercado: NASDAQ, contrato de
septiembre 2026, temporalidad de **5 minutos**.

## El patrón

1. Esperar **estructura alcista seguida de cambio de estructura bajista**.
2. **Confirmar toma de liquidez con mecha (wick)** hacia la baja.
3. Marcar la vela con mecha y **crear un recuadro**, extendido hacia la derecha.

## Confirmación de entrada

Esperar **vela con cuerpo que salga del recuadro**:
- **Por encima → confirmación de compra.**
- **Por debajo → confirmación de venta.**

Al aparecer la vela confirmadora, colocar **limit order en el borde del recuadro**.

## Take profit y stop loss

- **TP de compra:** máximo anterior de la estructura (ruptura previa).
- **TP de venta:** mínimo anterior de la estructura (liquidez previa).
- **Stop loss fijo: 30 puntos.**
- **Gestión activa:** si hay indecisión, mover a break even o cerrar. Elvin gestiona el
  stop y las operaciones manualmente.

## Conexiones

[[1000x]] — [[richy]] — [[richy-elvin-trading]]
