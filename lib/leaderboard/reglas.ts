// Leaderboard de Level Up Media (Aure, 26/sep/2026 · solicitudes #50–#66).
// Lógica pura: lee las tablas de la hoja "COPIA RESPALDO - VENTAS 2026 LEVEL UP" (ya parseada a
// filas) y arma lo que va en las imágenes de CLOSER y SETTER, con las validaciones de Aure.
// Si algo no cuadra devuelve `errores` y NO se genera ni se manda imagen.

export interface Fila {
  nombre: string;
  monto: number; // en dólares, redondeado a centavos
}

export interface Puesto {
  nombre: string; // lo que se muestra
  monto: number | null; // null = la hoja no trae monto (se muestra "$", nunca inventado)
  foto: string | null; // slug de public/leaderboard/fotos/<slug>.png
}

export interface Resumen {
  newSales: number;
  payingOff: number;
  totals: number;
}

export interface ResultadoCloser {
  total: number;
  podio: Puesto[]; // 1.º, 2.º, 3.º
  abajo: Puesto[];
  errores: string[];
}

export interface ResultadoSetter {
  podio: Puesto[];
  abajo: Puesto[];
  errores: string[];
}

export interface ConfigLeaderboard {
  closersInactivos: string[]; // su venta nueva va junta en "CLOSER INACTIVOS"
  closersAbajo: string[]; // todo lo suyo va en el bloque de abajo (pago de cuota), no en el podio
  settersInactivos: string[]; // además de la fila "Inactive Setter"
  fotos: Record<string, string>; // nombre normalizado → slug
}

// #53: "closer inactivos son juan y valentina". En el ejemplo de junio Carilin va abajo (pago de cuota).
export const CONFIG: ConfigLeaderboard = {
  closersInactivos: ["juan david", "valentina"],
  closersAbajo: ["carilin sofia"],
  settersInactivos: [],
  fotos: {
    "roger arteaga": "roger-arteaga",
    "laura bernal": "laura-bernal",
    "carilin sofia": "carilin-sofia",
    "ana cecilio": "ana-cecilio",
    "dilan torres": "dilan-torres",
    "luis fernandez": "luis-fernandez",
    "joaquin la valle": "joaquin-la-valle",
  },
};

const centavos = (n: number) => Math.round(n * 100);
const igual = (a: number, b: number) => centavos(a) === centavos(b);

export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function dinero(s: string | undefined): number | null {
  if (s == null) return null;
  const t = s.replace(/[$,\s]/g, "");
  if (!t || !/^-?\d+(\.\d+)?$/.test(t)) return null;
  return centavos(Number(t)) / 100;
}

export function formatoDinero(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Cuadro resumen: busca las celdas "New Sales", "Paying Off Debt" y "Totals"; el monto es la primera
 *  celda con dinero a la derecha (o, si no hay, la de abajo). */
export function leerResumen(filas: string[][]): { resumen?: Resumen; errores: string[] } {
  const buscar = (etiqueta: string): number | null => {
    for (let r = 0; r < filas.length; r++) {
      const fila = filas[r];
      for (let c = 0; c < fila.length; c++) {
        if (normalizar(fila[c] ?? "") !== etiqueta) continue;
        for (let k = c + 1; k < fila.length; k++) {
          const v = dinero(fila[k]);
          if (v !== null) return v;
        }
        const abajo = dinero(filas[r + 1]?.[c]);
        if (abajo !== null) return abajo;
      }
    }
    return null;
  };
  const newSales = buscar("new sales");
  const payingOff = buscar("paying off debt");
  const totals = buscar("totals");
  const errores: string[] = [];
  if (newSales === null) errores.push('No encontré "New Sales" en la hoja.');
  if (payingOff === null) errores.push('No encontré "Paying Off Debt" en la hoja.');
  if (totals === null) errores.push('No encontré "Totals" en la hoja.');
  if (errores.length) return { errores };
  return { resumen: { newSales: newSales!, payingOff: payingOff!, totals: totals! }, errores };
}

/** Tabla con encabezado "<quien>" + "Total recaudado por <quien>", hasta la fila "Totales". */
export function leerTabla(filas: string[][], quien: "closer" | "setter"): { filas: Fila[]; totalHoja: number | null; errores: string[] } {
  for (let r = 0; r < filas.length; r++) {
    const fila = filas[r].map((x) => normalizar(x ?? ""));
    const cNombre = fila.indexOf(quien);
    const cTotal = fila.findIndex((x) => x === `total recaudado por ${quien}`);
    if (cNombre < 0 || cTotal < 0) continue;
    const out: Fila[] = [];
    let totalHoja: number | null = null;
    for (let k = r + 1; k < filas.length; k++) {
      const nombre = (filas[k][cNombre] ?? "").trim();
      if (!nombre) break;
      if (/^totales?$/i.test(normalizar(nombre))) {
        totalHoja = dinero(filas[k][cTotal]);
        break;
      }
      const monto = dinero(filas[k][cTotal]);
      out.push({ nombre, monto: monto ?? 0 });
    }
    const errores: string[] = [];
    if (!out.length) errores.push(`La tabla de ${quien}s está vacía.`);
    if (totalHoja !== null && !igual(out.reduce((s, f) => s + f.monto, 0), totalHoja)) {
      errores.push(`La tabla de ${quien}s no suma su fila "Totales" (${formatoDinero(totalHoja)}).`);
    }
    return { filas: out, totalHoja, errores };
  }
  return { filas: [], totalHoja: null, errores: [`No encontré la tabla de ${quien}s ("${quien}" + "Total recaudado por ${quien}").`] };
}

const MARCAS = /\b(pdc|bori|renovacion|10%)\b|\s-\s|%/g;
const esPdc = (nombre: string) => /\b(pdc|renovacion)\b/.test(normalizar(nombre));
const baseDe = (nombre: string) => normalizar(nombre).replace(MARCAS, " ").replace(/\b\d+\b/g, " ").replace(/\s+/g, " ").trim();
const empiezaCon = (completo: string, base: string) => completo === base || completo.startsWith(base + " ");
const enLista = (persona: string, lista: string[]) => lista.some((x) => empiezaCon(persona, x) || empiezaCon(x, persona));

function fotoDe(nombre: string, cfg: ConfigLeaderboard): string | null {
  const n = normalizar(nombre);
  const k = Object.keys(cfg.fotos).find((x) => empiezaCon(n, x) || empiezaCon(x, n));
  return k ? cfg.fotos[k] : null;
}

/** Nombre completo de la persona: "Juan David PDC" → "Juan David Ramirez" si esa fila existe. */
function personaDe(fila: string, completos: string[]): string {
  const base = baseDe(fila);
  return completos.find((c) => empiezaCon(c, base)) ?? base;
}

const bonito = (nombreHoja: string) => nombreHoja.replace(/\s+/g, " ").trim();

export function armarCloser(filas: string[][], cfg: ConfigLeaderboard = CONFIG): ResultadoCloser {
  const { resumen, errores: e1 } = leerResumen(filas);
  const { filas: tabla, errores: e2 } = leerTabla(filas, "closer");
  const errores = [...e1, ...e2];
  if (!resumen || errores.length) return { total: 0, podio: [], abajo: [], errores };

  // Nombres "normales" (sin PDC/BORI) = la persona; las demás filas se le suman.
  const completos = tabla.filter((f) => !/\b(pdc|bori|renovacion|inactive)\b/.test(normalizar(f.nombre))).map((f) => normalizar(f.nombre));
  const mostrar = new Map(tabla.filter((f) => completos.includes(normalizar(f.nombre))).map((f) => [normalizar(f.nombre), bonito(f.nombre)]));

  const nueva = new Map<string, number>();
  const cuota = new Map<string, number>();
  let inactivosNueva = 0;
  let pdcOtros = 0; // pago de cuota de quien no va con nombre abajo (entra en "Renovación & Otros")
  for (const f of tabla) {
    const n = normalizar(f.nombre);
    if (/\binactive\b/.test(n)) {
      if (esPdc(n)) pdcOtros += f.monto;
      else inactivosNueva += f.monto;
      continue;
    }
    const persona = personaDe(f.nombre, completos);
    const pdc = esPdc(f.nombre);
    if (enLista(persona, cfg.closersAbajo)) {
      cuota.set(persona, (cuota.get(persona) ?? 0) + f.monto);
    } else if (pdc) {
      pdcOtros += f.monto;
    } else if (enLista(persona, cfg.closersInactivos)) {
      inactivosNueva += f.monto;
    } else {
      nueva.set(persona, (nueva.get(persona) ?? 0) + f.monto);
    }
  }

  const candidatos: Puesto[] = [...nueva.entries()]
    .filter(([, m]) => centavos(m) > 0)
    .map(([p, m]) => ({ nombre: mostrar.get(p) ?? p, monto: m, foto: fotoDe(p, cfg) }));
  if (centavos(inactivosNueva) > 0) candidatos.push({ nombre: "CLOSER INACTIVOS", monto: inactivosNueva, foto: "inactivo" });
  candidatos.sort((a, b) => (b.monto ?? 0) - (a.monto ?? 0));
  const podio = candidatos.slice(0, 3);

  const abajo: Puesto[] = [...cuota.entries()]
    .filter(([, m]) => centavos(m) > 0)
    .map(([p, m]) => ({ nombre: mostrar.get(p) ?? p, monto: m, foto: fotoDe(p, cfg) }));
  const renovacion = centavos(resumen.payingOff - abajo.reduce((s, x) => s + (x.monto ?? 0), 0)) / 100;
  abajo.push({ nombre: "Renovación & Otros", monto: renovacion, foto: "renovacion" });

  // Validaciones de Aure (si una falla, no se exporta ni se manda).
  const suma = (xs: Puesto[]) => xs.reduce((s, x) => s + (x.monto ?? 0), 0);
  if (!igual(resumen.newSales + resumen.payingOff, resumen.totals)) {
    errores.push(`New Sales (${formatoDinero(resumen.newSales)}) + Paying Off Debt (${formatoDinero(resumen.payingOff)}) no da Totals (${formatoDinero(resumen.totals)}).`);
  }
  if (!igual(suma(podio), resumen.newSales)) {
    errores.push(`La parte de arriba suma ${formatoDinero(suma(podio))} y New Sales dice ${formatoDinero(resumen.newSales)}${candidatos.length > 3 ? " (hay más de 3 con venta nueva)" : ""}.`);
  }
  if (renovacion < 0 || !igual(suma(abajo), resumen.payingOff) || centavos(renovacion) < centavos(pdcOtros)) {
    errores.push(`La parte de abajo no cuadra con Paying Off Debt (${formatoDinero(resumen.payingOff)}): Renovación & Otros daría ${formatoDinero(renovacion)} y solo los PDC de la tabla ya suman ${formatoDinero(pdcOtros)}.`);
  }
  for (const p of [...podio, ...abajo]) if (!p.foto) errores.push(`Falta la foto de ${p.nombre}.`);
  return { total: resumen.totals, podio, abajo, errores };
}

export function armarSetter(filas: string[][], cfg: ConfigLeaderboard = CONFIG): ResultadoSetter {
  const { filas: tabla, errores } = leerTabla(filas, "setter");
  if (errores.length) return { podio: [], abajo: [], errores };
  let inactivos: number | null = null;
  const personas: Puesto[] = [];
  for (const f of tabla) {
    const n = normalizar(f.nombre);
    if (/\binactive\b|\binactivo/.test(n) || enLista(n, cfg.settersInactivos)) {
      inactivos = (inactivos ?? 0) + f.monto;
      continue;
    }
    personas.push({ nombre: bonito(f.nombre), monto: centavos(f.monto) > 0 ? f.monto : null, foto: fotoDe(f.nombre, cfg) });
  }
  const todos = [...personas];
  if (inactivos !== null && centavos(inactivos) > 0) todos.push({ nombre: "SETTER INACTIVOS", monto: inactivos, foto: "inactivo" });
  todos.sort((a, b) => (b.monto ?? 0) - (a.monto ?? 0));
  const podio = todos.slice(0, 3);
  const abajo = todos.slice(3);
  for (const p of [...podio, ...abajo]) if (!p.foto) errores.push(`Falta la foto de ${p.nombre} (nombre nuevo o sin foto).`);
  return { podio, abajo, errores };
}

const MESES = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
/** Mes actual en PR, en inglés como la plantilla ("JUNE LEADERBOARD"). */
export function mesPR(fecha = new Date()): string {
  const m = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Puerto_Rico", month: "numeric" }).format(fecha));
  return MESES[m - 1];
}
