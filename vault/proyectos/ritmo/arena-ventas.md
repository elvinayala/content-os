# Ritmo · Arena — ventas dentro de Ritmo (diseño, 27/sep/2026) · PARA APROBAR ANTES DE CONSTRUIR

Pedido de Elvin: hacer parte de Ritmo al equipo de ventas (closers, setters, chatters) de Level Up Y de
AI Borinquen, **sin ponche** (ni aparecerles el reloj), con algo "bien especial": su marcador, metas,
ranking tipo carrera, bonos y un diario. Fuente de ventas: la hoja **"VENTAS 2026"** (la misma del leaderboard,
`lib/leaderboard/reglas.ts`).

## Reglas
- Puesto de ventas en Ritmo = **sin ponche**: en Hoy no hay reloj; en su lugar va **Mi marcador**. No entra al
  score de asistencia; su desempeño es 100 % resultados y lo ve su líder.
- **Level Up y AI Borinquen no se mezclan**: cada empresa tiene su Arena, su ranking y su meta.
- Lo que se mide en dinero es **cash collected** (lo que el cliente pagó en la llamada), nunca el valor total del acuerdo.
- **Comisión = privada**: cada quien ve solo la suya. En el ranking no sale la comisión de nadie.

## Pantallas
1. **Mi marcador** (Hoy, para ventas)
   - Llamadas agendadas hoy (closers) · llamadas hechas / conversaciones escritas (setters y chatters).
   - Cash collected: hoy · semana · mes, contra **mi meta del día / semana / mes**.
   - **Mi comisión del mes** (privada): cuánto llevo comisionado según las reglas de mi puesto.
   - **Mi goal personal**: botón para poner su meta propia (p. ej. "$50,000 en ventas") con barra de progreso.
2. **Arena · la carrera** (ranking de su empresa)
   - Closers y setters por separado, actualizado a diario desde la hoja: cash collected del mes de cada uno
     (la carrera: barras que avanzan hacia la meta).
   - **Meta del equipo de la semana** con barra grande.
   - **Panel de alerta**: grande y visible cuando el día va en **$0** o por debajo de la meta del día ("Hoy no se ha
     vendido nada" / "Vamos X% de la meta de hoy").
3. **Bonos**
   - El líder (Nahuel en LU; quien Elvin diga en AIB) **crea y autoriza bonos**: "Bono $X al primero que cierre N
     esta semana", "bono por meta del mes"…
   - Los bonos disponibles salen en el marcador de cada quien; cuando alguien lo gana, queda "ganado" y el líder
     lo aprueba (y puede ir a nómina como ajuste, igual que el bono de referidos de Carreras).
4. **Mi diario (journal)**
   - Cada día: cómo me fue ayer (texto corto + ánimo), llamadas / conversaciones, cash collected, % de cierre.
   - Resumen de la semana automático: total de llamadas, cash collected, % de cierre (closers), llamadas y
     conversaciones (setters / chatters).
5. **Lo compartido con todo Ritmo**: Solicitudes, Carreras, Bienestar, Noticias y canal ético. Los logros de ventas
   (primera venta del mes, récord de la semana, bono ganado) salen solos en Noticias y en Slack.

## Fuentes de datos
- **Hoja "VENTAS 2026"** (ya conectada al leaderboard): cash collected por closer y setter, ventas nuevas vs
  pagos de deuda (PDC), inactivos. Da el mes; para el día hace falta la pestaña de transacciones con fecha
  `[CONFIRMAR: qué pestaña trae cada venta con fecha, closer y setter]`.
- **Leads (CRM propio) + Calendly** (ya en vivo): citas agendadas de cada closer (actividad "llamada"),
  shows / no-shows, etapas.
- **Timelines / WhatsApp** (ya conectado a Leads): conversaciones escritas de los chatters.
- **Diario y goal personal**: los llena la persona en Ritmo.

## Decisiones de Elvin (27/sep/2026)
- **Bonos:** Nahuel los **crea** en Ritmo; **Elvin los autoriza** (solo Elvin).
- **Meta de Level Up (solo LU):** **$100,000/mes en ventas nuevas** y **mínimo $150,000/mes en total**
  (nuevas + pagos de deuda). Ritmo actual ≈ **$35,000 por semana** (referencia para la meta semanal).
- **Meta de AI Borinquen:** **$30,000/mes**. Lo de AIB (datos y detalle de la meta) se coordina **con Aure**.
- **Comisiones:** respondió Nahuel (27/sep, Slack). Aplican **igual en Level Up y AI Borinquen**:
  - **Closer**: % sobre **cash collected**, escalonado por % de cierre, con **show-up ≥ 60 %** como condición:
    cierre 20 % → **7 %** · 25 % → **8 %** · 30 % → **9 %** · 35 % → **10 %**.
    `[CONFIRMAR con Nahuel: ¿con cierre < 20 % o show-up < 60 % cobra 0 %, o un mínimo? ¿el tramo se calcula con el
    % del mes completo?]`
  - **Setter**: **4 % sobre ventas** `[CONFIRMAR: ¿cash collected de las ventas que agendó, igual que el closer?]`.
  - **Chatter**: **4 % sobre ventas**; **5 %** si el equipo supera **200 agendas al mes** (hoy ~120). La meta de agendas
    sube cuando suba la pauta. `[CONFIRMAR: ¿las 200 son del equipo o de cada chatter?]`
  - Nahuel: "vamos por esos 200k!"
- **Pestaña de la hoja con cada venta y su fecha:** se le preguntó a Aure por Slack (27/sep) → pendiente.

## Construcción (propuesta)
Tablas `ventas_*` en la base de Pulse (metas, goals personales, bonos, diario), lector de la hoja reutilizando
`lib/leaderboard/reglas.ts`, rol "ventas" en `PUESTOS` sin ponche, pantallas `/ritmo/arena` y el marcador en Hoy.
Coordinar con la sesión que está desarrollando Ritmo para no pisarse.
