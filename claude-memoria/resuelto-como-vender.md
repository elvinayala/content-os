---
name: resuelto-como-vender
description: Cómo quiere Elvin que se venda en Resuelto (llamadas y chat): no vender rápido — saludar, presentarse, escuchar, pedir fotos, diagnosticar (precio del menú o visita de $69) y cerrar con horario
metadata:
  type: feedback
---

**El propósito de una llamada o chat de Resuelto no es vender rápido** (Elvin, 26/sep/2026). Orden: saludar por el nombre ("¿cómo estás?") → presentarse ("te habla X, de Resuelto PR; estamos alrededor de la isla") → recordar lo que escribió por las redes o preguntar el problema → **escuchar y anotar sin interrumpir** → **pedir fotos del área** (récord y para evaluar) antes de ofrecer la solución → diagnóstico: si está claro y en el menú, precio ("$X de mano de obra + $19 de coordinación, 12 meses de garantía" — sin decir "fijo" ni recalcarlo, sin asteriscos; 25/sep); si no, **visita de diagnóstico de $69** (se acredita) → cerrar con dos horarios concretos, no con preguntas.

**Why:** los clientes que solo recibían el precio se iban; Elvin quiere que se sientan atendidos y que el diagnóstico venda solo.
**How to apply:** en el guion del menú interno (`kit/menu-precios/generar.py`), en el prompt del agente (paso 3: fotos antes de la solución, sin bloquear la venta) y en cualquier instrucción al setter. No soltar el 20% de materiales si no preguntan. Relacionado: [[plomeria-pr-vision]].

**Escuchar primero, nunca cerrar la puerta** (Elvin, 26/sep, caso Gabriel el perito electricista: "está al garete… empieza a pensar, coge lógica"): contestar lo que la persona YA dijo antes de cualquier saludo de guion; a quien ofrece OTRO oficio (electricista, handyman, A/C, pintor…) no se le despide: se reconoce su experiencia, se le dice que Resuelto va a abrir más oficios, se piden área/años/licencia/teléfono y va a la **lista de espera** (`anotar_otro_oficio`, tag GHL `lista-espera-oficios` + `oficio-*`). Vendedor con sabiduría sin parecer vendedor; siempre un siguiente paso.
