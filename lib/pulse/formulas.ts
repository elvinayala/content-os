// Columnas calculadas: una columna number con `settings.formula` se llena sola a partir de otras
// columnas del mismo elemento. La fórmula usa títulos entre llaves y + - * / ( ):
//   "{Bajas del mes} / {Clientes activos al inicio} * 100"
// Puro (sin DB) para testearlo y usarlo en cliente y servidor.

import type { ValorCelda } from "./types";

interface ColumnaFormula {
  id: string;
  title: string;
  type: string;
  settings: { formula?: string };
}

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Evalúa una expresión aritmética simple. null si falta un dato, divide por cero o es inválida.
export function evaluar(formula: string, valorDe: (titulo: string) => number | null): number | null {
  const tokens: (number | string)[] = [];
  const re = /\s*(\{[^}]+\}|\d+(?:\.\d+)?|[-+*/()])/y;
  let pos = 0;
  while (pos < formula.length) {
    if (/^\s*$/.test(formula.slice(pos))) break;
    re.lastIndex = pos;
    const m = re.exec(formula);
    if (!m) return null;
    pos = re.lastIndex;
    const t = m[1];
    if (t.startsWith("{")) {
      const v = valorDe(t.slice(1, -1));
      if (v === null || !Number.isFinite(v)) return null;
      tokens.push(v);
    } else if (/^\d/.test(t)) tokens.push(Number(t));
    else tokens.push(t);
  }
  let i = 0;
  const primario = (): number | null => {
    const t = tokens[i++];
    if (typeof t === "number") return t;
    if (t === "-") {
      const v = primario();
      return v === null ? null : -v;
    }
    if (t === "(") {
      const v = suma();
      if (tokens[i++] !== ")") return null;
      return v;
    }
    return null;
  };
  const producto = (): number | null => {
    let a = primario();
    while (a !== null && (tokens[i] === "*" || tokens[i] === "/")) {
      const op = tokens[i++];
      const b = primario();
      if (b === null) return null;
      if (op === "/" && b === 0) return null;
      a = op === "*" ? a * b : a / b;
    }
    return a;
  };
  const suma = (): number | null => {
    let a = producto();
    while (a !== null && (tokens[i] === "+" || tokens[i] === "-")) {
      const op = tokens[i++];
      const b = producto();
      if (b === null) return null;
      a = op === "+" ? a + b : a - b;
    }
    return a;
  };
  const r = suma();
  if (r === null || i !== tokens.length || !Number.isFinite(r)) return null;
  return Math.round(r * 100) / 100;
}

export const esCalculada = (c: { type: string; settings?: { formula?: string } }) => c.type === "number" && !!c.settings?.formula;

// Recalcula todas las columnas calculadas de un elemento (en cadena: una calculada puede usar otra).
// Devuelve solo lo que cambió.
export function recalcular(columnas: ColumnaFormula[], values: Record<string, ValorCelda>): Record<string, number | null> {
  const porTitulo = new Map(columnas.map((c) => [norm(c.title), c]));
  const actuales: Record<string, ValorCelda> = { ...values };
  const calculadas = columnas.filter(esCalculada);
  const cambios: Record<string, number | null> = {};
  for (let vuelta = 0; vuelta < calculadas.length + 1; vuelta++) {
    let hubo = false;
    for (const c of calculadas) {
      const v = evaluar(c.settings.formula!, (titulo) => {
        const col = porTitulo.get(norm(titulo));
        const x = col ? actuales[col.id] : undefined;
        return typeof x === "number" ? x : null;
      });
      if ((actuales[c.id] ?? null) !== v) {
        actuales[c.id] = v;
        cambios[c.id] = v;
        hubo = true;
      }
    }
    if (!hubo) break;
  }
  return cambios;
}
