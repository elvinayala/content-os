# Resuelto · Portal de operación y app del plomero

**Construido el 23/sep/2026.** Todo vive en el servicio `agente` de Railway (mismo lugar que el agente de WhatsApp), con los datos en su volumen.

## Portal (`/portal`) — para Elvin, el gerente de proyectos y reclutamiento
`https://app.resueltopr.com/portal` (mientras propaga el DNS: `https://agente-production-684f.up.railway.app/portal`). Usuario y clave (30 días de sesión).
- **Inicio:** trabajos de hoy, en curso, terminados por cobrar, garantías abiertas, plomeros activos, lo que se debe a plomeros + buscador.
- **Clientes:** buscar por nombre, teléfono, dirección o municipio → **ficha**: contacto, notas internas, todos sus trabajos con la garantía (vigente hasta / venció), e **historial completo** (lo que dijo el cliente, lo que contestó el agente, cada paso del plomero, sus comentarios y lo que anotó el equipo). El historial es permanente (`data/estado/historial/<contacto>.jsonl`); arrancó el 23/sep.
- **Trabajo:** datos del cliente, dinero (mano de obra, materiales, total cliente, pago plomero), línea de tiempo (agendado → aceptado → en camino → llegó → terminado), fotos antes/después, notas del plomero y del equipo; acciones: marcar cobrado, marcar pagado al plomero, cancelar, **abrir garantía**.
- **Garantía:** 12 meses desde que se terminó. Crea un re-trabajo ($0 al cliente) y se lo ofrece SOLO al plomero original con 48 h (contrato). Se le avisa al cliente y a Elvin por Telegram. Al cerrarlo: $0 al cliente, al plomero se le reembolsan materiales hasta $150.
- **Plomeros:** alta en 30 s (le llega su app por WhatsApp), ficha con link de su app, pausar/activar, trabajos, pagos (semana, pasada, acumulado) y todos sus comentarios.
- **Equipo** (solo admin): crear usuarios (roles admin / gerente / reclutamiento), desactivar.
- Usuarios creados: Elvin (`resueltoapp.pr@gmail.com`, admin) y Yaileen (`yaileenjimenez@gmail.com`, reclutamiento); claves enviadas a Elvin por Telegram. Falta: el gerente de proyectos (Elvin lo crea en Equipo).
- Código: `agente/src/portal/rutas.ts`, `portal/staff.ts`, `garantias.ts`, `historial.ts`.

## App del plomero
- **Link corto:** `https://app.resueltopr.com/a/<id>/<código de 8>` (antes era un link larguísimo). La app guarda su llave en el celular: al abrirla desde el ícono de la pantalla de inicio ya no pide el link (antes daba "Acceso inválido" — arreglado).
- **Comentarios del plomero** en cualquier momento del trabajo (llegan a la ficha del trabajo, a la del cliente y a Elvin por Telegram).
- Ciclo completo (en camino → llegué → fotos → terminé → cobro) y "Mi semana": ver `PLAN-LISTOS-PARA-TRABAJOS.md`.

## ¿App en el App Store / Google Play?
**Hoy: app web instalable (PWA).** Se instala con un toque en la pantalla de inicio, abre como app, tiene alertas push (Android siempre; iPhone desde iOS 16.4 si está instalada en la pantalla de inicio) y usa la cámara. Sirve para los primeros 10–30 plomeros.
**Después: la misma app empaquetada para las tiendas** (Capacitor, sin rehacerla), cuando: (1) exista la LLC — Apple exige cuenta de organización con número D-U-N-S; $99/año; Google Play $25 una vez; (2) haya 15+ plomeros o se necesite algo que la web no da (ubicación en segundo plano, alertas más confiables en iPhone). Trabajo estimado: 1–2 semanas + revisión de Apple (1–2 semanas).

## Base de datos
Hoy los datos viven en el **volumen de Railway** (`/app/data/estado`: contactos, trabajos, ofertas, plomeros, historial, fotos). Es persistente pero **no tiene copia de seguridad**. Pendiente:
1. **Elvin:** activar *Backups* del volumen en Railway (servicio `agente` → Volume → Backups, diario) — 1 minuto.
2. **Claude, cuando pase de ~300 trabajos o haya 2+ personas editando a la vez:** migrar a Postgres (Railway) cambiando solo `almacen.ts`; fotos a almacenamiento de objetos.
