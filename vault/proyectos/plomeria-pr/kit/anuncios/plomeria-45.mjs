// Plomería · clientes de $30 a $45 al día (Elvin, 19/oct/2026: "a los 30 diarios de plomería ahora le va a añadir $15 más…
// mira de dónde han venido más clientes potenciales y sube el presupuesto ahí, y donde tengamos plomeros establece bien
// esa estrategia"). Solo zonas con plomero activo; el dinero va a lo que ya probó que trae conversaciones baratas:
//
//   De dónde vinieron (30 días, agente + Meta): Centro-Este (Caguas, Gurabo, Cayey, Juncos, San Lorenzo, Cidra) = 35 de los
//   54 leads con pueblo y 8 de los 9 trabajos cobrados; "A · Caguas · Precio fijo" = $3.89 por conversación (88).
//   Quebradillas (Samuel) $4.33 (33) — estaba apagada. Aguadilla (Santos) $4.65 (28). Los gráficos "E" y "Confianza"
//   salen entre $11 y $27 por conversación: se apagan.
//
//   Caguas (Edgar, Luis Saez, Charlie)  A · Precio fijo $12 → $22 · D · Ticket alto (Caguas y Cidra) $3 → $6 · E × 3 → apagar
//   Quebradillas (Samuel)                campaña → prender · A · Precio fijo $2 → $8 · B, C, E → apagar
//   Aguadilla (Santos)                   A · Precio fijo $2 → $9 · C, E → apagar
//   Total: $45/día. Metro (Jaime es aprendiz) y Oeste esperan a que firme un licenciado.
//
// Uso: node --env-file=.env.local vault/proyectos/plomeria-pr/kit/anuncios/plomeria-45.mjs            → muestra el antes/después
//      … --aplicar   → SOLO con el OK de Elvin (19/oct: "deja todo en borrador y déjame saber por Slack")
const T = process.env.META_ADS_TOKEN; if (!T) throw new Error("Falta META_ADS_TOKEN");
const APLICAR = process.argv.includes("--aplicar");
const CAMPANA_QUEBRADILLAS = "120255119529030029";
const CAMBIOS = [
  ["120255115172980029", 2200], // A · Caguas · Precio fijo
  ["120255203459600029", 600],  // D · Caguas y Cidra · Ticket alto
  ["120255225331700029", null], // E · Caguas · Inodoro (gráfico)
  ["120255225331230029", null], // E · Caguas · Fuga (gráfico)
  ["120255225330300029", null], // E · Caguas · Fregadero (gráfico)
  ["120255119529220029", 800],  // A · Quebradillas · Precio fijo
  ["120255119529540029", null], // B · Quebradillas · Problemas
  ["120255119529870029", null], // C · Quebradillas · Propiedades
  ["120255225332610029", null], // E · Quebradillas · Cisterna
  ["120255155398700029", 900],  // A · Aguadilla · Precio fijo
  ["120255155399390029", null], // C · Aguadilla · Confianza
  ["120255225333360029", null], // E · Aguadilla · Calentador
];
const leer = async (id, f) => (await fetch(`https://graph.facebook.com/v25.0/${id}?fields=${f}&access_token=${T}`)).json();
const post = async (id, body) => { const j = await (await fetch(`https://graph.facebook.com/v25.0/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, access_token: T }) })).json(); if (j.error) throw new Error(id + ": " + JSON.stringify(j.error)); };

let total = 0;
for (const [id, centavos] of CAMBIOS) {
  const a = await leer(id, "name,status,daily_budget");
  if (a.error) throw new Error(id + ": " + JSON.stringify(a.error));
  console.log(`${a.name.padEnd(46)} ${a.status} $${a.daily_budget / 100} → ${centavos ? `ACTIVE $${centavos / 100}` : "PAUSED"}`);
  if (centavos) total += centavos;
  if (APLICAR) await post(id, centavos ? { status: "ACTIVE", daily_budget: centavos } : { status: "PAUSED" });
}
console.log(`Campaña Quebradillas: ${(await leer(CAMPANA_QUEBRADILLAS, "status")).status} → ACTIVE`);
if (APLICAR) await post(CAMPANA_QUEBRADILLAS, { status: "ACTIVE" });
console.log(`Total plomería: $${total / 100}/día`, APLICAR ? "· APLICADO" : "· (prueba: nada cambió; --aplicar con el OK de Elvin)");
