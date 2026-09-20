// Migración Monday → Pulse por la GraphQL API de Monday (token personal en MONDAY_TOKEN).
// Trae tableros → columnas (con etiquetas/colores) → grupos → items (paginados) → usuarios
// → archivos, y los deja en Postgres (Supabase o PGlite local) + Storage. Idempotente:
// cada fila guarda su monday_id, así que se puede correr varias veces.
//
// Uso: npm run pulse:migrar -- [--dry-run] [--board 7784685790] [--sin-archivos]
import fs from "node:fs/promises";
import path from "node:path";

import { conectar, upsertUsuario } from "./pulse/comun.mjs";
import { colorDeGrupo, mapearColumna, mapearValor, slugDeBoard } from "./pulse/monday-mapeo.mjs";

const TOKEN = process.env.MONDAY_TOKEN;
if (!TOKEN) {
  console.error("Falta MONDAY_TOKEN en .env.local (Monday → avatar → Desarrolladores → Mis tokens de acceso).");
  process.exit(1);
}
const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const SIN_ARCHIVOS = args.includes("--sin-archivos");
const soloBoard = args[args.indexOf("--board") + 1];
const BOARDS = args.includes("--board") ? [soloBoard] : (process.env.MONDAY_BOARDS ?? "7784685790,18399101258,9506323087").split(",").map((s) => s.trim());
const COLAPSAR_DESDE = 200;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gql(query, variables = {}, intento = 0) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: TOKEN, "API-Version": "2025-01" },
    body: JSON.stringify({ query, variables }),
  });
  if (res.status === 429 && intento < 5) {
    await sleep(15000);
    return gql(query, variables, intento + 1);
  }
  const json = await res.json();
  if (json.errors?.length) {
    const e = json.errors[0];
    const retry = e.extensions?.retry_in_seconds;
    if ((e.extensions?.code === "ComplexityException" || /complexity/i.test(e.message)) && intento < 5) {
      console.log(`  · límite de complejidad, espero ${retry ?? 30}s…`);
      await sleep((retry ?? 30) * 1000);
      return gql(query, variables, intento + 1);
    }
    throw new Error(`Monday: ${e.message}`);
  }
  return json.data;
}

const reporte = { usuarios: { creados: 0, existentes: 0 }, tableros: {} };
const db = await conectar();
console.log(`→ Motor: ${db.motor}${DRY ? " (DRY RUN: no escribe)" : ""}`);

// ---------- usuarios ----------
const { users } = await gql(`{ users(kind: all) { id name email enabled } }`);
const mapaUsuarios = new Map(); // mondayId → pulseId
const usuariosNoEncontrados = new Set();
for (const u of users) {
  if (!u.email) continue;
  if (DRY) {
    mapaUsuarios.set(String(u.id), `dry-${u.id}`);
    continue;
  }
  const existente = await db.query(`SELECT id FROM pulse_users WHERE email = $1`, [u.email.toLowerCase()]);
  const fila = await upsertUsuario(db, { email: u.email, nombre: u.name, activo: existente.length > 0 ? undefined : false, mondayId: String(u.id) });
  // upsertUsuario con activo=undefined: mantiene el valor actual (activo OR NULL → activo)
  mapaUsuarios.set(String(u.id), fila.id);
  reporte.usuarios[existente.length ? "existentes" : "creados"]++;
}
console.log(`→ Usuarios de Monday: ${users.length} (${reporte.usuarios.creados} nuevos, inactivos hasta que un admin les ponga clave)`);

// ---------- tableros, columnas, grupos ----------
const Q_BOARD = `query ($ids: [ID!]) { boards(ids: $ids) { id name description items_count
  columns { id title type settings_str archived }
  groups { id title color position archived } } }`;
const mapaBoards = new Map(); // mondayBoardId → { id, columnas: Map(mondayColId → {id,type,settings}), grupos: Map }
const relacionesPendientes = []; // { itemId, columnId, mondayItemIds }
const archivosPendientes = []; // { itemId, columnId, assets }
const mapaItems = new Map(); // mondayItemId → pulseItemId

for (const boardId of BOARDS) {
  const { boards } = await gql(Q_BOARD, { ids: [boardId] });
  const b = boards?.[0];
  if (!b) {
    console.log(`✗ Tablero ${boardId} no encontrado (¿el token tiene acceso?)`);
    continue;
  }
  const slug = slugDeBoard(b.name, b.id);
  const rep = (reporte.tableros[slug] = { nombre: b.name, columnas: { mapeadas: [], saltadas: [] }, grupos: 0, items: 0, valoresDescartados: {}, personasSinUsuario: new Set(), archivos: { subidos: 0, fallidos: 0 } });
  console.log(`\n→ ${b.name} (${b.id}): ${b.items_count} items`);

  let pulseBoardId = `dry-board-${b.id}`;
  if (!DRY) {
    const [fila] = await db.query(
      `INSERT INTO pulse_boards (slug, nombre, descripcion, color, position, monday_id) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (monday_id) DO UPDATE SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion RETURNING id`,
      [slug, b.name, b.description || null, "bright_blue", BOARDS.indexOf(boardId), String(b.id)],
    );
    pulseBoardId = fila.id;
  }

  const columnas = new Map();
  let pos = 0;
  for (const c of b.columns) {
    if (c.type === "name") continue;
    const m = mapearColumna(c);
    if (m.saltada) {
      rep.columnas.saltadas.push(`${c.title} (${m.motivo})`);
      continue;
    }
    let id = `dry-col-${c.id}`;
    if (!DRY) {
      const [fila] = await db.query(
        `INSERT INTO pulse_columns (board_id, title, type, settings, position, width, monday_id) VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (board_id, monday_id) DO UPDATE SET title = EXCLUDED.title, settings = EXCLUDED.settings, position = EXCLUDED.position RETURNING id`,
        [pulseBoardId, c.title, m.type, m.settings, pos, anchoPorTipo(m.type, c.title), c.id],
      );
      id = fila.id;
    }
    columnas.set(c.id, { id, type: m.type, settings: m.settings, title: c.title });
    rep.columnas.mapeadas.push(`${c.title} → ${m.type}`);
    pos++;
  }

  const columnasTocadas = new Set();
  const grupos = new Map();
  const gruposOrdenados = b.groups.filter((g) => !g.archived).sort((a, b2) => Number(a.position) - Number(b2.position));
  for (let i = 0; i < gruposOrdenados.length; i++) {
    const g = gruposOrdenados[i];
    let id = `dry-grp-${g.id}`;
    if (!DRY) {
      const [fila] = await db.query(
        `INSERT INTO pulse_groups (board_id, title, color, position, colapsado_default, monday_id) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (board_id, monday_id) DO UPDATE SET title = EXCLUDED.title, color = EXCLUDED.color, position = EXCLUDED.position RETURNING id`,
        [pulseBoardId, g.title, colorDeGrupo(g.color), i, false, g.id],
      );
      id = fila.id;
    }
    grupos.set(g.id, { id, title: g.title, items: 0 });
  }
  rep.grupos = grupos.size;
  mapaBoards.set(String(b.id), { id: pulseBoardId, columnas, grupos, slug });

  // ---------- items (paginado) ----------
  const FRAG = `fragment I on Item { id name created_at updated_at group { id }
    column_values { id type text value
      ... on StatusValue { index }
      ... on DateValue { date }
      ... on PeopleValue { persons_and_teams { id kind } }
      ... on BoardRelationValue { linked_item_ids }
      ... on FileValue { files { ... on FileAssetValue { asset { id name public_url file_extension file_size } } } } } }`;
  let cursor = null;
  let indice = 0;
  do {
    const data = cursor
      ? await gql(`${FRAG} query ($c: String!) { next_items_page(cursor: $c, limit: 500) { cursor items { ...I } } }`, { c: cursor })
      : await gql(`${FRAG} query ($b: ID!) { boards(ids: [$b]) { items_page(limit: 500) { cursor items { ...I } } } }`, { b: b.id });
    const page = cursor ? data.next_items_page : data.boards[0].items_page;
    cursor = page.cursor;
    for (const it of page.items) {
      const g = grupos.get(it.group?.id);
      if (!g) continue;
      g.items++;
      await resolverUsuariosFaltantes(it);
      const values = {};
      const pendRel = [];
      const pendArch = [];
      for (const cv of it.column_values) {
        const col = columnas.get(cv.id);
        if (!col) continue;
        const r = mapearValor(col, cv, { usuarios: mapaUsuarios });
        if (col.type === "status" && r.value === null && r.descartado && (cv.text ?? "").trim()) {
          // etiqueta borrada en Monday pero todavía usada: la recreamos (gris)
          const id = `m${cv.index}`;
          col.settings.labels = [...(col.settings.labels ?? []), { id, label: cv.text.trim(), color: "grey" }];
          columnasTocadas.add(col);
          r.value = id;
          delete r.descartado;
        }
        if (r.descartado !== undefined) {
          if (col.type === "people") r.descartado.split(",").forEach((x) => rep.personasSinUsuario.add(x));
          else rep.valoresDescartados[col.title] = (rep.valoresDescartados[col.title] ?? 0) + 1;
        }
        if (r.value !== null && r.value !== undefined && r.value !== false) values[col.id] = r.value;
        if (r.relacionPendiente) pendRel.push({ columnId: col.id, mondayItemIds: r.relacionPendiente });
        if (r.archivosPendientes && !SIN_ARCHIVOS) pendArch.push({ columnId: col.id, assets: r.archivosPendientes });
      }
      let itemId = `dry-item-${it.id}`;
      if (!DRY) {
        const [fila] = await db.query(
          `INSERT INTO pulse_items (board_id, group_id, name, position, values, monday_id, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (monday_id) DO UPDATE SET name = EXCLUDED.name, group_id = EXCLUDED.group_id, position = EXCLUDED.position,
             values = EXCLUDED.values, updated_at = EXCLUDED.updated_at RETURNING id`,
          [pulseBoardId, g.id, it.name, (indice + 1) * 1024, values, String(it.id), it.created_at ?? new Date().toISOString(), it.updated_at ?? new Date().toISOString()],
        );
        itemId = fila.id;
      }
      mapaItems.set(String(it.id), itemId);
      for (const p of pendRel) relacionesPendientes.push({ itemId, ...p });
      for (const p of pendArch) archivosPendientes.push({ itemId, boardId: pulseBoardId, ...p });
      indice++;
    }
    rep.items = indice;
    process.stdout.write(`  · ${indice} items\r`);
    await sleep(300);
  } while (cursor);
  console.log(`  · ${indice} items en ${grupos.size} grupos`);
  if (!DRY) for (const col of columnasTocadas) await db.query(`UPDATE pulse_columns SET settings = $1 WHERE id = $2`, [col.settings, col.id]);

  // Grupos grandes arrancan colapsados.
  if (!DRY) {
    for (const g of grupos.values()) {
      if (g.items >= COLAPSAR_DESDE || /offboard/i.test(g.title)) await db.query(`UPDATE pulse_groups SET colapsado_default = true WHERE id = $1`, [g.id]);
    }
  }
}

// ---------- relaciones (2ª pasada) ----------
console.log(`\n→ Relaciones: ${relacionesPendientes.length} celdas`);
// settings.boardId de las columnas relation → id del tablero Pulse.
for (const [, b] of mapaBoards) {
  for (const col of b.columnas.values()) {
    if (col.type !== "relation") continue;
    const destino = (col.settings.mondayBoardIds ?? []).map((id) => mapaBoards.get(String(id))?.id).find(Boolean);
    const settings = { multiple: true, ...(destino ? { boardId: destino } : {}) };
    if (!DRY) await db.query(`UPDATE pulse_columns SET settings = $1 WHERE id = $2`, [settings, col.id]);
  }
}
let relOk = 0;
for (const r of relacionesPendientes) {
  const ids = r.mondayItemIds.map((id) => mapaItems.get(String(id))).filter(Boolean);
  if (!ids.length) continue;
  relOk++;
  if (!DRY) await db.query(`UPDATE pulse_items SET values = values || $1::jsonb WHERE id = $2`, [{ [r.columnId]: ids }, r.itemId]);
}
console.log(`  · ${relOk} resueltas (el resto apunta a items fuera de los tableros migrados)`);

// ---------- archivos ----------
if (!SIN_ARCHIVOS) {
  console.log(`\n→ Archivos: ${archivosPendientes.reduce((a, p) => a + p.assets.length, 0)}`);
  const supabase = await clienteStorage();
  for (const p of archivosPendientes) {
    const idsCelda = [];
    for (const asset of p.assets) {
      const slugBoard = [...mapaBoards.values()].find((b) => b.id === p.boardId)?.slug ?? "board";
      const rep = reporte.tableros[slugBoard];
      try {
        if (DRY) {
          idsCelda.push(`dry-file-${asset.id}`);
          continue;
        }
        const yaExiste = await db.query(`SELECT id FROM pulse_files WHERE monday_asset_id = $1`, [String(asset.id)]);
        if (yaExiste.length) {
          idsCelda.push(yaExiste[0].id);
          continue;
        }
        let url = asset.public_url;
        let res = await fetch(url);
        if (!res.ok) {
          // la public_url vence (~1 h): pedirla de nuevo
          const d = await gql(`query ($ids: [ID!]) { assets(ids: $ids) { public_url } }`, { ids: [asset.id] });
          url = d.assets?.[0]?.public_url;
          res = await fetch(url);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        const nombre = String(asset.name).replace(/[^\w.\-() ]+/g, "_").slice(0, 150);
        const storagePath = `${p.boardId}/${p.itemId}/${asset.id}-${nombre}`;
        const mime = mimeDe(asset.file_extension);
        await guardarArchivo(supabase, storagePath, buf, mime);
        const [fila] = await db.query(
          `INSERT INTO pulse_files (item_id, column_id, nombre, storage_path, mime, bytes, monday_asset_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [p.itemId, p.columnId, asset.name, storagePath, mime, asset.file_size ?? buf.length, String(asset.id)],
        );
        idsCelda.push(fila.id);
        rep.archivos.subidos++;
        process.stdout.write(`  · ${rep.archivos.subidos} subidos\r`);
      } catch (e) {
        rep.archivos.fallidos++;
        console.log(`  ✗ ${asset.name}: ${e.message}`);
      }
    }
    if (idsCelda.length && !DRY) await db.query(`UPDATE pulse_items SET values = values || $1::jsonb WHERE id = $2`, [{ [p.columnId]: idsCelda }, p.itemId]);
  }
}

// ---------- reporte ----------
for (const t of Object.values(reporte.tableros)) t.personasSinUsuario = [...t.personasSinUsuario];
console.log("\n════════ REPORTE ════════");
for (const [slug, t] of Object.entries(reporte.tableros)) {
  console.log(`\n${t.nombre} (/pulse/${slug}): ${t.items} items · ${t.grupos} grupos · ${t.columnas.mapeadas.length} columnas`);
  if (t.columnas.saltadas.length) console.log(`  columnas saltadas: ${t.columnas.saltadas.join(", ")}`);
  if (Object.keys(t.valoresDescartados).length) console.log(`  valores descartados: ${JSON.stringify(t.valoresDescartados)}`);
  if (t.personasSinUsuario.length) console.log(`  personas borradas de Monday (sin usuario, ids): ${t.personasSinUsuario.join(", ")}`);
  if (!SIN_ARCHIVOS) console.log(`  archivos: ${t.archivos.subidos} subidos, ${t.archivos.fallidos} fallidos`);
}
await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
await fs.writeFile(path.join(process.cwd(), "data", "pulse-migracion.json"), JSON.stringify({ fecha: new Date().toISOString(), dryRun: DRY, ...reporte }, null, 2));
console.log(`\nReporte guardado en data/pulse-migracion.json`);
await db.close();

// ---------- helpers ----------
// Usuarios desactivados no salen en users(kind: all): se buscan por id y se crean inactivos.
async function resolverUsuariosFaltantes(item) {
  const ids = new Set();
  for (const cv of item.column_values) for (const p of cv.persons_and_teams ?? []) if (p.kind === "person" && !mapaUsuarios.has(String(p.id)) && !usuariosNoEncontrados.has(String(p.id))) ids.add(String(p.id));
  if (!ids.size) return;
  const { users: encontrados } = await gql(`query ($ids: [ID!]) { users(ids: $ids) { id name email } }`, { ids: [...ids] });
  for (const u of encontrados ?? []) {
    if (!u.email) continue;
    if (DRY) mapaUsuarios.set(String(u.id), `dry-${u.id}`);
    else {
      const fila = await upsertUsuario(db, { email: u.email, nombre: u.name, activo: false, mondayId: String(u.id) });
      mapaUsuarios.set(String(u.id), fila.id);
    }
    reporte.usuarios.creados++;
    ids.delete(String(u.id));
  }
  for (const id of ids) usuariosNoEncontrados.add(id);
}
function anchoPorTipo(type, title) {
  const base = { text: 180, long_text: 260, number: 130, status: 160, dropdown: 200, date: 140, people: 120, checkbox: 90, link: 160, email: 220, phone: 150, file: 160, relation: 200 }[type] ?? 160;
  return Math.max(base, Math.min(320, title.length * 8 + 40));
}
function mimeDe(ext) {
  const e = String(ext ?? "").toLowerCase().replace(".", "");
  return { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", webp: "image/webp", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", xls: "application/vnd.ms-excel", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", csv: "text/csv", txt: "text/plain", mp4: "video/mp4", mov: "video/quicktime" }[e] ?? "application/octet-stream";
}
async function clienteStorage() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}
async function guardarArchivo(supabase, storagePath, buf, mime) {
  if (!supabase) {
    const ruta = path.join(process.cwd(), ".pulse-db", "archivos", storagePath);
    await fs.mkdir(path.dirname(ruta), { recursive: true });
    await fs.writeFile(ruta, buf);
    return;
  }
  const { error } = await supabase.storage.from("pulse").upload(storagePath, buf, { contentType: mime, upsert: true });
  if (error) throw new Error(error.message);
}
