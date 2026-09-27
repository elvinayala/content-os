// Crea los tableros de SOPs (27/sep/2026, pedido de Elvin): "SOPs · Level Up" (público en Pulse) y
// "SOPs · AI Borinquen" (privado: equipo AIB). Un grupo por departamento con un SOP principal para
// arrancar; cada departamento agrega los demás procesos. Publicar exige la reunión con el
// departamento y la fecha de revisión, y deja la próxima revisión a 90 días. Idempotente por slug.
//   node --env-file=.env.local scripts/pulse/crear-tableros-sop.mjs
import { randomUUID } from "node:crypto";
import postgres from "postgres";

const id8 = () => randomUUID().slice(0, 8);
const TABLEROS = [
  {
    slug: "sops-level-up",
    nombre: "SOPs · Level Up",
    color: "yellow",
    privado: false,
    departamentos: [
      ["Operaciones", "carilin"],
      ["Onboarding y cuentas", "carilin"],
      ["Customer Success", "carilin"],
      ["Estrategia y tráfico", "carilin"],
      ["Producción creativa", "carilin"],
      ["Contenido y community", "carilin"],
      ["Ventas", "aure"],
      ["Tesorería", "aure"],
      ["Recursos Humanos", "aure"],
    ],
  },
  {
    slug: "sops-ai-borinquen",
    nombre: "SOPs · AI Borinquen",
    color: "green",
    privado: true,
    departamentos: [
      ["Ventas", "aure"],
      ["Onboarding y CSM", "aure"],
      ["Implementación y automatizaciones", "aure"],
      ["Tesorería", "aure"],
    ],
  },
];
const COLORES_GRUPO = ["bright_blue", "purple", "aqua", "orange", "pink", "green", "dark_blue", "yellow", "red"];

const sql = postgres(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  const users = Object.fromEntries((await sql`select id, email from pulse_users where email in ('carilin@levelupmediapr.net','aure@levelupmediapr.net','elvin@levelupmediapr.net')`).map((u) => [u.email.split("@")[0], u.id]));
  for (const t of TABLEROS) {
    const [ya] = await sql`select id from pulse_boards where slug = ${t.slug}`;
    if (ya) { console.log("ya existe:", t.slug); continue; }
    const estado = { por: id8(), rehaciendo: id8(), revision: id8(), publicado: id8() };
    await sql.begin(async (tx) => {
      const [{ min }] = await tx`select coalesce(min(position), 0) - 2 as min from pulse_boards`;
      const [b] = await tx`insert into pulse_boards (slug, nombre, descripcion, color, position, privado)
        values (${t.slug}, ${t.nombre}, 'Un SOP por fila, agrupados por departamento. Antes de publicar: reunión con el departamento, revisar/rehacer, poner la fecha de revisión y subir el documento.', ${t.color}, ${t.slug === "sops-level-up" ? min : min + 3}, ${t.privado}) returning id`;
      const COLS = [
        { title: "Estado", type: "status", width: 140, settings: { labels: [
          { id: estado.por, label: "Por hacer", color: "grey" },
          { id: estado.rehaciendo, label: "Rehaciendo", color: "orange" },
          { id: estado.revision, label: "En revisión", color: "bright_blue" },
          { id: estado.publicado, label: "Publicado", color: "green", esDone: true },
        ] } },
        { title: "Responsable", type: "people", width: 140, settings: {} },
        { title: "Reunión con el departamento", type: "date", width: 190, settings: {} },
        { title: "Fecha de revisión", type: "date", width: 150, settings: {} },
        { title: "Próxima revisión", type: "date", width: 150, settings: {} },
        { title: "Versión", type: "text", width: 100, settings: {} },
        { title: "Documento", type: "file", width: 170, settings: {} },
        { title: "Link del documento", type: "link", width: 180, settings: {} },
        { title: "Notas", type: "long_text", width: 260, settings: {} },
      ];
      const col = {};
      for (const [i, c] of COLS.entries()) {
        const [r] = await tx`insert into pulse_columns (board_id, title, type, settings, position, width) values (${b.id}, ${c.title}, ${c.type}, ${tx.json(c.settings)}, ${i}, ${c.width}) returning id`;
        col[c.title] = r.id;
      }
      for (const [gi, [dep, quien]] of t.departamentos.entries()) {
        const [g] = await tx`insert into pulse_groups (board_id, title, color, position) values (${b.id}, ${dep}, ${COLORES_GRUPO[gi % COLORES_GRUPO.length]}, ${gi * 1024}) returning id`;
        const values = { [col.Estado]: estado.por, ...(users[quien] ? { [col.Responsable]: [users[quien]] } : {}) };
        await tx`insert into pulse_items (board_id, group_id, name, position, values, created_by) values (${b.id}, ${g.id}, ${`SOP principal · ${dep}`}, 0, ${tx.json(values)}, ${users.elvin ?? null})`;
      }
      await tx`insert into pulse_reglas (board_id, nombre, activa, cuando, entonces, creada_por) values (${b.id}, 'Publicar un SOP exige la reunión y la fecha de revisión; la próxima revisión queda a 90 días', true,
        ${tx.json({ tipo: "valor", columnId: col.Estado, valor: estado.publicado })},
        ${tx.json([{ tipo: "exigir", columnId: col["Reunión con el departamento"] }, { tipo: "exigir", columnId: col["Fecha de revisión"] }, { tipo: "fecha", columnId: col["Próxima revisión"], dias: 90 }])},
        ${users.elvin ?? null})`;
      console.log("creado:", t.slug, b.id);
    });
  }
} finally {
  await sql.end();
}
