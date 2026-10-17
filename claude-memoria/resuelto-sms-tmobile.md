---
name: resuelto-sms-tmobile
description: 17/oct/2026 — los SMS del 787-956-1111 (Zernio) no llegan a T-Mobile: el número no tiene registro 10DLC; el código de Resuelto Pro ahora también sale por WhatsApp
metadata:
  type: project
---

El número de Resuelto en Zernio (+1 787-956-1111) manda SMS **sin registro de operadora** (`/v1/sms/registrations` vacío, `smsRequested: false`). Zernio acepta el envío pero **T-Mobile lo filtra**: a Jaime Morales (y probablemente a Luis Saez, también T-Mobile) no le llegaba el código de la app Resuelto Pro. Claro (América Móvil) sí recibe.

- **Arreglo (desplegado):** la app tiene "¿No te llegó? Pídelo por WhatsApp" (wa.me con "Código Resuelto Pro"); el webhook contesta con el código a todo plomero activo que escriba "código" (`proAcceso.pideCodigo`). Si nos escribió en las últimas 24 h, el código sale también por WhatsApp. Cada pedido de código le avisa a Yaileen (`SLACK_RECLUTAMIENTO_ID`) con el link de entrada del plomero (máximo 1 cada 30 min).
- **Pendiente de Elvin:** registrar el SMS ante las operadoras en Zernio (10DLC: marca + campaña, necesita los datos de la LLC). Sin eso, cualquier SMS a T-Mobile se pierde, también los avisos a clientes.
- **Why:** un plomero que no puede entrar no recibe trabajos.
- **How to apply:** si "no le llega el texto", primero hacer el lookup del operador (`/v1/sms/lookup`). Si es T-Mobile, usar WhatsApp o el link.

Relacionado: [[plomeria-pr-vision]], [[resuelto-sin-garantia-pagos-viernes]].
