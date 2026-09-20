// Seed de Pulse: admin (PULSE_ADMIN_EMAIL/PULSE_ADMIN_PASSWORD) + 2 miembros de prueba +
// tablero "Demo" con 4 grupos, columnas de todos los tipos y 40 items.
// Uso: npm run db:seed   (idempotente: el tablero Demo se recrea si ya existe)
import { conectar, nuevoId, upsertUsuario } from "./pulse/comun.mjs";

const db = await conectar();
console.log(`→ Motor: ${db.motor}`);

const adminEmail = process.env.PULSE_ADMIN_EMAIL ?? "elvin@levelupmediapr.net";
const adminPass = process.env.PULSE_ADMIN_PASSWORD ?? "pulse-dev";
if (!process.env.PULSE_ADMIN_PASSWORD) console.log("  (sin PULSE_ADMIN_PASSWORD: clave del admin = pulse-dev)");

const admin = await upsertUsuario(db, { email: adminEmail, nombre: "Elvin Ayala", rol: "admin", password: adminPass, color: "dark_orange" });
const jessica = await upsertUsuario(db, { email: "jessica@levelupmediapr.net", nombre: "Jessica", password: process.env.PULSE_DEMO_PASSWORD ?? "pulse-dev", color: "purple" });
const carly = await upsertUsuario(db, { email: "carilin@levelupmediapr.net", nombre: "Carilin", password: process.env.PULSE_DEMO_PASSWORD ?? "pulse-dev", color: "blue" });
console.log(`→ Usuarios: ${[admin, jessica, carly].map((u) => u.email).join(", ")}`);

// Tablero Demo (se borra y recrea).
await db.query(`DELETE FROM pulse_boards WHERE slug = 'demo'`);
const [board] = await db.query(
  `INSERT INTO pulse_boards (slug, nombre, descripcion, color, position) VALUES ('demo', 'Demo', 'Tablero de prueba con todos los tipos de columna', 'aqua', 99) RETURNING id`,
);

const industria = [
  { id: nuevoId(), label: "Comercio", color: "bright_green" },
  { id: nuevoId(), label: "Bienestar", color: "pink" },
  { id: nuevoId(), label: "Restaurante", color: "green" },
  { id: nuevoId(), label: "Asesorías, servicios legales", color: "dark_orange" },
  { id: nuevoId(), label: "Belleza", color: "dark_grey" },
];
const progreso = [
  { id: nuevoId(), label: "Onboarding Completado", color: "green", esDone: true },
  { id: nuevoId(), label: "En proceso", color: "orange" },
  { id: nuevoId(), label: "Pausado", color: "red" },
];
const paquete = [
  { id: nuevoId(), label: "VIP", color: "purple" },
  { id: nuevoId(), label: "Elite", color: "indigo" },
  { id: nuevoId(), label: "Starter", color: "grey" },
];
const servicios = [
  { id: nuevoId(), label: "Meta Ads", color: "blue" },
  { id: nuevoId(), label: "Contenido", color: "pink" },
  { id: nuevoId(), label: "Automatización", color: "aqua" },
];

const columnas = [
  ["Personas", "people", { multiple: true }, 120],
  ["Empresa", "text", {}, 220],
  ["Presupuesto mensual", "number", { formato: "moneda" }, 150],
  ["Industria", "status", { labels: industria }, 170],
  ["Progreso", "status", { labels: progreso }, 190],
  ["Paquete", "status", { labels: paquete }, 120],
  ["Servicios", "dropdown", { labels: servicios, multiple: true }, 200],
  ["Fecha de Inicio", "date", {}, 140],
  ["Alto valor", "checkbox", {}, 100],
  ["Teléfono", "phone", {}, 150],
  ["E-mail", "email", {}, 220],
  ["Onboarding Form", "link", {}, 160],
  ["Comentarios", "long_text", {}, 260],
  ["Propuesta", "file", {}, 160],
];
const cols = {};
let pos = 0;
for (const [title, type, settings, width] of columnas) {
  const [c] = await db.query(
    `INSERT INTO pulse_columns (board_id, title, type, settings, position, width) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [board.id, title, type, settings, pos++, width],
  );
  cols[title] = c.id;
}

const grupos = [
  ["ONBOARDING & SETUP", "bright_blue", 6],
  ["ANÁLISIS Y ESTRATEGIA", "dark_orange", 5],
  ["CLIENTE ACTIVO", "green", 24],
  ["OFFBOARDED", "dark_grey", 5],
];
const nombres = ["Edgar Lugo", "Oliver Sotillo", "Carlos Rivera", "Christopher Taveras", "Bryan Vega", "Emilio Jiménez", "Gerald Butler", "Josean Martínez", "Marie Pagán", "Luis Maldonado", "Grisel Villanueva", "Deborah Soler", "Joshua Santana", "Shaidimar Berríos", "Julio Santiago", "Fabián Patiño", "Yazan Alkhatib", "Máximo Arango", "Beatriz Vela", "Luz Guzmán"];
const empresas = ["Warranty Plus", "Tinos Restaurant", "Rivera Auto Corp", "K Clothing", "Topchiro", "ReAwaken Upper Cervical", "ARSYS PR / Armerías", "Tu Casa Segura", "Rx Automatic Transmission", "LM Interior Designer", "Oficina Médica Dra. Villanueva", "Farmacias Deborah", "Xilos Door", "Shai Shai", "JJ Aluminum Contractors", "Incentivo Solar", "SOLA Boutique", "Tu Energía PR", "Bea Vela Trending", "Building-up-people"];
const personas = [admin.id, jessica.id, carly.id];
const pick = (arr, i) => arr[i % arr.length];

let gpos = 0;
let n = 0;
for (const [title, color, cantidad] of grupos) {
  const [g] = await db.query(
    `INSERT INTO pulse_groups (board_id, title, color, position, colapsado_default) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [board.id, title, color, gpos++, title === "OFFBOARDED"],
  );
  for (let i = 0; i < cantidad; i++, n++) {
    const dia = 1 + (n % 28);
    const values = {
      [cols["Personas"]]: [pick(personas, n), ...(n % 4 === 0 ? [pick(personas, n + 1)] : [])],
      [cols["Empresa"]]: pick(empresas, n),
      [cols["Presupuesto mensual"]]: [300, 500, 600, 900, 1200][n % 5],
      [cols["Industria"]]: pick(industria, n).id,
      [cols["Progreso"]]: title === "CLIENTE ACTIVO" ? progreso[0].id : pick(progreso, n).id,
      [cols["Paquete"]]: pick(paquete, n).id,
      [cols["Servicios"]]: n % 3 === 0 ? [servicios[0].id, servicios[1].id] : [pick(servicios, n).id],
      [cols["Fecha de Inicio"]]: `2025-${String(1 + (n % 12)).padStart(2, "0")}-${String(dia).padStart(2, "0")}`,
      [cols["Alto valor"]]: n % 6 === 0,
      [cols["Teléfono"]]: `+1 787 ${String(600 + n).padStart(3, "0")} ${String(1000 + n * 7).slice(-4)}`,
      [cols["E-mail"]]: `${pick(nombres, n).split(" ")[0].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}@ejemplo.com`,
      [cols["Onboarding Form"]]: n % 2 === 0 ? { url: "https://forms.gle/ejemplo", text: "Onboarding" } : null,
      [cols["Comentarios"]]: n % 3 === 0 ? "PAGÓ $1000 15 DE SEPT / PAGÓ $1000 21 DE AGOSTO / NUEVO ACUERDO 30 DE MAYO." : null,
    };
    for (const k of Object.keys(values)) if (values[k] === null) delete values[k];
    await db.query(
      `INSERT INTO pulse_items (board_id, group_id, name, position, values, created_by) VALUES ($1, $2, $3, $4, $5, $6)`,
      [board.id, g.id, `${pick(nombres, n)}${n >= nombres.length ? ` ${Math.floor(n / nombres.length) + 1}` : ""}`, (i + 1) * 1024, values, admin.id],
    );
  }
}
console.log(`→ Tablero Demo: ${grupos.length} grupos, ${columnas.length} columnas, ${n} items`);
await db.close();
