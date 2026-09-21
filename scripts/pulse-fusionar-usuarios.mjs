// Fusiona usuarios duplicados de Pulse: mueve las asignaciones (columnas people) y la
// actividad del duplicado al que se queda, le pasa el monday_id y borra el duplicado.
// Uso: node --env-file-if-exists=.env.local scripts/pulse-fusionar-usuarios.mjs sobrevive@x.com duplicado@x.com [...]
import { conectar } from "./pulse/comun.mjs";

const pares = process.argv.slice(2);
if (pares.length < 2 || pares.length % 2) {
  console.error("Uso: ... sobrevive@x.com duplicado@x.com [sobrevive2 duplicado2 ...]");
  process.exit(1);
}
const db = await conectar();
for (let i = 0; i < pares.length; i += 2) {
  const [s] = await db.query(`SELECT id, email, monday_id FROM pulse_users WHERE email = $1`, [pares[i].toLowerCase()]);
  const [d] = await db.query(`SELECT id, email, monday_id FROM pulse_users WHERE email = $1`, [pares[i + 1].toLowerCase()]);
  if (!s || !d) {
    console.log(`✗ no encontré ${pares[i]} / ${pares[i + 1]}`);
    continue;
  }
  // items cuyos values (jsonb) mencionan el id del duplicado
  const items = await db.query(`SELECT id, values FROM pulse_items WHERE values::text LIKE $1`, [`%${d.id}%`]);
  let celdas = 0;
  for (const it of items) {
    const v = typeof it.values === "string" ? JSON.parse(it.values) : it.values;
    let tocado = false;
    for (const k of Object.keys(v)) {
      if (Array.isArray(v[k]) && v[k].includes(d.id)) {
        v[k] = [...new Set(v[k].map((x) => (x === d.id ? s.id : x)))];
        tocado = true;
        celdas++;
      }
    }
    if (tocado) await db.query(`UPDATE pulse_items SET values = $1 WHERE id = $2`, [v, it.id]);
  }
  await db.query(`UPDATE pulse_activity SET user_id = $1 WHERE user_id = $2`, [s.id, d.id]);
  await db.query(`UPDATE pulse_items SET created_by = $1 WHERE created_by = $2`, [s.id, d.id]);
  await db.query(`UPDATE pulse_files SET uploaded_by = $1 WHERE uploaded_by = $2`, [s.id, d.id]);
  if (!s.monday_id && d.monday_id) {
    await db.query(`UPDATE pulse_users SET monday_id = NULL WHERE id = $1`, [d.id]);
    await db.query(`UPDATE pulse_users SET monday_id = $1 WHERE id = $2`, [d.monday_id, s.id]);
  }
  await db.query(`DELETE FROM pulse_users WHERE id = $1`, [d.id]);
  console.log(`✓ ${d.email} → ${s.email} (${celdas} asignaciones movidas)`);
}
await db.close();
