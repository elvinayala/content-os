// Crea el tablero privado "Tesorería LU · Métricas del mes" (una fila por mes, solo Level Up) y le da
// acceso a la tesorera. Idempotente por slug: si ya existe, solo asegura los miembros.
//   node --env-file=.env.local scripts/pulse/crear-tablero-tesoreria.mjs [--dry-run]
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const SLUG = "tesoreria-mensual";
const MIEMBROS = ["maria@levelupmediapr.net", "carilin@levelupmediapr.net", "aure@levelupmediapr.net"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const HASTA_MES = 9; // se precargan los meses de 2026 hasta septiembre
const seco = process.argv.includes("--dry-run");

const lbl = (label, color, esDone) => ({ id: randomUUID().slice(0, 8), label, color, ...(esDone ? { esDone: true } : {}) });
const n = (title, formato, width = 150, formula) => ({ title, type: "number", settings: { formato, ...(formula ? { formula } : {}) }, width });
const COLUMNAS = [
  { title: "Mes", type: "date", settings: {}, width: 130 },
  { title: "Estado", type: "status", settings: { labels: [lbl("Por llenar", "grey"), lbl("En revisión", "orange"), lbl("Cerrado", "green", true)] }, width: 140 },
  n("Ventas nuevas ($)", "moneda"),
  n("Clientes nuevos", "entero", 130),
  n("Ventas recurrentes ($)", "moneda", 170),
  n("Ingresos totales ($)", "moneda", 160, "{Ventas nuevas ($)} + {Ventas recurrentes ($)}"),
  n("Reembolsos ($)", "moneda"),
  n("Cantidad de reembolsos", "entero", 170),
  n("Ingresos netos ($)", "moneda", 160, "{Ingresos totales ($)} - {Reembolsos ($)}"),
  n("Clientes activos al inicio", "entero", 180),
  n("Clientes activos al cierre", "entero", 180),
  n("Bajas del mes", "entero", 130),
  n("Churn (%)", "decimal", 120, "{Bajas del mes} / {Clientes activos al inicio} * 100"),
  n("Ticket promedio ($)", "moneda", 160, "{Ingresos totales ($)} / {Clientes activos al cierre}"),
  n("Lifetime value ($)", "moneda", 160, "{Ticket promedio ($)} / ({Churn (%)} / 100)"),
  n("Cobros pendientes ($)", "moneda", 170),
  { title: "Responsable", type: "people", settings: {}, width: 140 },
  { title: "Reporte (Excel/PDF)", type: "file", settings: {}, width: 170 },
  { title: "Notas", type: "long_text", settings: {}, width: 260 },
];
const GRUPOS = [
  { title: "Level Up Media", color: "yellow" }, // solo LU: María no trabaja AI Borinquen (Elvin, 26/sep)
];

const sql = postgres(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const usuarios = await sql`select id, email from pulse_users where email in ${sql(MIEMBROS)}`;
  const maria = usuarios.find((u) => u.email === MIEMBROS[0]);
  if (!maria) throw new Error("No encontré a María García (maria@levelupmediapr.net) en Pulse");
  let [board] = await sql`select id from pulse_boards where slug = ${SLUG}`;
  if (seco) {
    console.log({ existe: !!board, miembros: usuarios.map((u) => u.email), columnas: COLUMNAS.length, filas: GRUPOS.length * HASTA_MES });
    process.exit(0);
  }
  await sql.begin(async (tx) => {
    if (!board) {
      const [pos] = await tx`select coalesce(position, 0) + 1 as p from pulse_boards where slug = 'tesoreria'`;
      [board] = await tx`insert into pulse_boards (slug, nombre, descripcion, color, position, privado)
        values (${SLUG}, 'Tesorería LU · Métricas del mes', 'Level Up Media, una fila por mes. Ingresos, ingresos netos, churn, ticket promedio y lifetime value se calculan solos. Privado: tesorería + dirección.', 'green', ${pos?.p ?? 2}, true)
        returning id`;
      const cols = [];
      for (const [i, c] of COLUMNAS.entries()) {
        const [r] = await tx`insert into pulse_columns (board_id, title, type, settings, position, width)
          values (${board.id}, ${c.title}, ${c.type}, ${tx.json(c.settings)}, ${i * 1024}, ${c.width}) returning id`;
        cols.push({ ...c, id: r.id });
      }
      const col = (t) => cols.find((c) => c.title === t);
      const porLlenar = col("Estado").settings.labels[0].id;
      for (const [gi, g] of GRUPOS.entries()) {
        const [grupo] = await tx`insert into pulse_groups (board_id, title, color, position) values (${board.id}, ${g.title}, ${g.color}, ${gi * 1024}) returning id`;
        // Meses más recientes arriba.
        for (let m = HASTA_MES; m >= 1; m--) {
          const values = { [col("Mes").id]: `2026-${String(m).padStart(2, "0")}-01`, [col("Estado").id]: porLlenar, [col("Responsable").id]: [maria.id] };
          await tx`insert into pulse_items (board_id, group_id, name, position, values, created_by)
            values (${board.id}, ${grupo.id}, ${`${MESES[m - 1]} 2026`}, ${(HASTA_MES - m) * 1024}, ${tx.json(values)}, ${maria.id})`;
        }
      }
      console.log("Tablero creado:", board.id);
    }
    for (const u of usuarios) {
      await tx`insert into pulse_board_members (board_id, user_id) values (${board.id}, ${u.id}) on conflict do nothing`;
    }
  });
  console.log("Miembros:", usuarios.map((u) => u.email).join(", "));
} finally {
  await sql.end();
}
