// Convierte el CSV interno de exportar.mjs en la hoja que ve Néstor (columnas
// clave primero, encabezados en inglés, sin campos internos) → <salida>.
// Uso: node scripts/victory-core/hoja.mjs data/victory-core/exports/leads-<fecha>.csv <salida.csv>
import { readFileSync, writeFileSync } from "node:fs";
const [, , entrada, salida] = process.argv;
const parse = (t) => { const rows = []; let row = [], cell = "", q = false; for (let i = 0; i < t.length; i++) { const ch = t[i]; if (q) { if (ch === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; } else if (ch === '"') q = true; else if (ch === ",") { row.push(cell); cell = ""; } else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; } else if (ch !== "\r") cell += ch; } if (cell || row.length) { row.push(cell); rows.push(row); } return rows; };
const esc = (v) => (/[",\n]/.test(v ?? "") ? `"${String(v).replace(/"/g, '""')}"` : (v ?? ""));
const rows = parse(readFileSync(entrada, "utf8"));
const h = rows[0];
const cols = [["segmento", "Segment"], ["score", "Score"], ["empresa", "Company"], ["tipo_facility", "Facility type"], ["contacto", "Contact"], ["cargo", "Title"], ["email", "Email"], ["email_estado", "Email status"], ["telefono_contacto", "Contact phone"], ["telefono_empresa", "Company phone"], ["direccion", "Address"], ["web", "Website"], ["n_locations", "# Locations"], ["clasificacion", "Scope"], ["rango_oportunidad", "Est. monthly range"], ["linkedin", "LinkedIn"], ["brief", "Sales brief"], ["encontrado_el", "Found on"]];
const estado = { verificado: "verified", no_verificado: "not verified", invalido: "invalid", desconocido: "unknown", conocido: "known" };
const idx = cols.map(([k]) => h.indexOf(k));
const out = [cols.map(([, n]) => n).join(",")];
for (const r of rows.slice(1)) if (r.length > 1) out.push(idx.map((i, j) => esc(cols[j][0] === "email_estado" ? (estado[r[i]] ?? r[i]) : r[i])).join(","));
writeFileSync(salida, out.join("\n") + "\n");
console.log(`${salida}: ${out.length - 1} filas`);
