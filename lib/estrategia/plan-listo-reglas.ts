// "Plan listo" de un cliente nuevo (19/oct/2026) — reglas puras. Tests: tests/plan-listo.test.mjs.
//
// Elvin: "En el canal de revisión estratégica los estrategas van a enviar, cuando el cliente esté listo, el plan
// completo de un cliente nuevo para arrancar (creativos, plan de marketing, todo lo que tienen listo para salir con
// todas las fases) para aprobación mía o de Carilin. Cuando un cliente esté listo me tiene que llegar una alerta por
// Telegram con información breve: dueño, nombre del negocio, pago inicial, etc."
//
// El canal (#office-5-revision-estrategica) es también el del Director Creativo (Leo revisa cada pieza), así que NO
// todo mensaje es un plan: solo el que empieza con "PLAN LISTO" (o dice "plan completo" / "listo para arrancar").

export interface ClientePlan {
  itemId: string;
  nombre: string; // dueño (la ficha en Pulse se llama como el contacto)
  empresa: string | null;
  acuerdo: string | null;
  pagoInicial: number | null;
  servicio: string | null;
  fechaInicio: string | null;
  fechaPago: string | null;
  estratega: string | null;
  grupo: string;
  industria: string | null;
  pueblo: string | null;
}

const norm = (s: string | null | undefined) =>
  String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9ñ ]+/g, " ").replace(/\s+/g, " ").trim();

const SENAL = /^\W{0,3}(plan listo|plan completo)\b|\bplan (completo|listo) (para|de)\b|\blisto para (arrancar|salir|lanzar|publicar)\b|\bcliente nuevo\b.*\b(plan|arrancar|listo)\b/i;

/** ¿Es el aviso de "plan listo" de un cliente (y no una pieza suelta para Leo)? Solo el mensaje principal, no respuestas. */
export function esPlanListo(texto: string, { esRespuesta = false }: { esRespuesta?: boolean } = {}): boolean {
  if (esRespuesta) return false;
  const t = String(texto ?? "").replace(/[*_~`]/g, "").trim();
  return SENAL.test(t);
}

/** "PLAN LISTO | Fancy Halo | Repostería" → "Fancy Halo" (lo que el estratega escribió como negocio). */
export function negocioDelTexto(texto: string): string | null {
  const primera = String(texto ?? "").replace(/[*_~`]/g, "").split("\n")[0];
  const partes = primera.split(/\s[|·—–-]\s|\|/).map((x) => x.trim()).filter(Boolean);
  const sinSenal = partes.filter((p) => !/^\W*(plan (listo|completo)|cliente nuevo|listo para)/i.test(p));
  return sinSenal[0]?.slice(0, 80) || null;
}

const VACIAS = new Set(["llc", "inc", "corp", "pr", "the", "and", "de", "del", "la", "el", "los", "las", "y", "services", "service", "servicios", "group", "co"]);
const palabras = (s: string | null) => norm(s).split(" ").filter((w) => w.length >= 3 && !VACIAS.has(w));

/** El cliente de Pulse al que se refiere el mensaje. Si hay empate, los que están arrancando ganan (no los activos). */
export function emparejarCliente(texto: string, clientes: ClientePlan[]): { cliente: ClientePlan | null; candidatos: ClientePlan[] } {
  const escrito = norm(negocioDelTexto(texto));
  const t = norm(`${escrito} ${texto}`);
  const puntos = (c: ClientePlan) => {
    const emp = norm(c.empresa), nom = norm(c.nombre);
    if (emp.length >= 4 && t.includes(emp)) return 10;
    if (nom.length >= 6 && t.includes(nom)) return 9;
    if (escrito.length >= 6 && (emp.startsWith(escrito) || (escrito.length >= 8 && emp.includes(escrito)))) return 8; // "Fancy Halo" ⊂ "Fancy Halo By Nixalee"
    const pe = palabras(c.empresa);
    if (pe.length && pe.every((w) => t.includes(w))) return 6 + Math.min(pe.length, 3);
    const pn = palabras(c.nombre);
    if (pn.length >= 2 && pn.slice(0, 2).every((w) => t.includes(w))) return 5;
    return 0;
  };
  const conPuntos = clientes.map((c) => ({ c, p: puntos(c) })).filter((x) => x.p > 0);
  if (!conPuntos.length) return { cliente: null, candidatos: [] };
  const max = Math.max(...conPuntos.map((x) => x.p));
  const mejores = conPuntos.filter((x) => x.p === max).map((x) => x.c);
  if (mejores.length === 1) return { cliente: mejores[0], candidatos: mejores };
  const nuevos = mejores.filter((c) => c.grupo !== "CLIENTE ACTIVO");
  return { cliente: nuevos.length === 1 ? nuevos[0] : null, candidatos: mejores.slice(0, 4) };
}

const usd = (n: number | null) => (n == null ? "—" : `$${n.toLocaleString("en-US")}`);
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const fecha = (d: string | null) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? `${Number(d.slice(8, 10))}/${MESES[Number(d.slice(5, 7)) - 1]}` : d || null);

/** El aviso a Elvin por Telegram: breve, con lo que necesita para aprobar o entrar a la reunión. */
export function textoAlerta(o: { cliente: ClientePlan | null; candidatos: ClientePlan[]; negocio: string | null; autor: string; texto: string; archivos: number; link: string | null }): string {
  const c = o.cliente;
  const L = [`🚀 *Plan listo para arrancar* · ${c?.empresa || c?.nombre || o.negocio || "cliente sin identificar"}`];
  if (c) {
    L.push(`Dueño: ${c.nombre}${c.pueblo ? ` · ${c.pueblo}` : ""}${c.industria ? ` · ${c.industria}` : ""}`);
    L.push(`Pago inicial: ${usd(c.pagoInicial)}${c.fechaPago ? ` (${fecha(c.fechaPago)})` : ""} · Acuerdo: ${c.acuerdo || "—"}`);
    L.push(`Servicio: ${c.servicio || "—"} · En Pulse: ${c.grupo}${c.fechaInicio ? ` · inicio ${fecha(c.fechaInicio)}` : ""}`);
    L.push(`Estratega: ${o.autor}${c.estratega && c.estratega !== o.autor ? ` (asignado en Pulse: ${c.estratega})` : ""}`);
  } else {
    L.push(`Lo mandó: ${o.autor}`);
    L.push(o.candidatos.length ? `No supe cuál es en Pulse: ${o.candidatos.map((x) => x.empresa || x.nombre).join(" · ")}` : "No lo encontré en Pulse (revisa el nombre del negocio en la ficha).");
  }
  const resumen = String(o.texto).replace(/[*_~`]/g, "").replace(/\s+/g, " ").trim().slice(0, 220);
  L.push("", `📝 ${resumen}${o.texto.length > 220 ? "…" : ""}${o.archivos ? ` · ${o.archivos === 1 ? "1 archivo" : `${o.archivos} archivos`}` : ""}`);
  L.push("Lo aprueban tú o Carilin en el hilo." + (o.link ? `\n${o.link}` : ""));
  return L.join("\n");
}
