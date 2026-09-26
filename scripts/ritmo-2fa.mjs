#!/usr/bin/env node
// Reinicia la verificación en dos pasos de Ritmo (teléfono perdido). Para Elvin mismo, o si nadie con
// vista maestra puede entrar. La persona vuelve a escanear un QR nuevo al entrar.
// Uso: node --env-file=.env.local scripts/ritmo-2fa.mjs estado | reset <email>
import postgres from "postgres";

const [cmd, email] = process.argv.slice(2);
const sql = postgres(process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  if (cmd === "reset") {
    if (!email) throw new Error("Falta el email");
    const [u] = await sql`select id, nombre from pulse_users where lower(email) = ${email.toLowerCase()}`;
    if (!u) throw new Error("No existe ese usuario");
    await sql`delete from desempeno_dos_pasos where user_id = ${u.id}`;
    await sql`insert into desempeno_eventos (user_id, tipo, datos) values (${u.id}, ${"2fa_reiniciado"}, ${sql.json({ por: "script" })})`;
    console.log(`Listo: ${u.nombre} configura de nuevo la verificación al entrar.`);
  } else {
    console.log(await sql`select u.nombre, u.email, d.activado_at, d.bloqueado_hasta from desempeno_dos_pasos d join pulse_users u on u.id = d.user_id order by u.nombre`);
  }
} finally {
  await sql.end();
}
