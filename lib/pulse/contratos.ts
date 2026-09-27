// Acuerdo firmado: en #office-2-ventas-contrato el closer publica la venta (nombre, correo,
// teléfono…) y en el hilo sube el PDF del contrato. Esta parte pura lee esos mensajes y los
// empareja con la ficha del cliente en Pulse. Sin DB ni Slack, para testearla.

export interface VentaSlack {
  ts: string;
  nombre: string;
  emails: string[];
  telefonos: string[]; // últimos 10 dígitos
  autor?: string;
}

export interface ArchivoSlack {
  id: string;
  name: string;
  mimetype?: string;
  url_private_download?: string;
  size?: number;
}

export interface FichaCliente {
  nombre: string;
  emails: string[];
  telefonos: string[];
}

export const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export const ultimos10 = (s: string) => {
  const d = s.replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
};

// Quita el formato de Slack: <mailto:a@b.com|a@b.com> → a@b.com, <tel:+1…|…> → +1…, *negrita* → negrita.
function limpiar(texto: string): string {
  return texto
    .replace(/<(?:mailto|tel):([^|>]+)(?:\|[^>]*)?>/g, " $1 ")
    .replace(/<@[A-Z0-9]+\|([^>]+)>/g, "$1")
    .replace(/<([^|>]+)\|([^>]+)>/g, "$2")
    .replace(/[*_~]/g, "");
}

// Lee un mensaje de venta. null si no parece una venta (sin correo ni teléfono).
export function leerVenta(ts: string, texto: string, autor?: string): VentaSlack | null {
  const t = limpiar(texto);
  const emails = [...new Set((t.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g) ?? []).map((e) => e.toLowerCase()))];
  const telefonos = [
    ...new Set(
      (t.match(/\+?\d[\d\s().-]{8,}\d/g) ?? [])
        .map(ultimos10)
        .filter(Boolean),
    ),
  ];
  if (!emails.length && !telefonos.length) return null;
  const lineas = t.split("\n").map((l) => l.trim()).filter(Boolean);
  // Formato "REGISTRO DE VENTA · Cliente: X" o la primera línea con el nombre.
  const cliente = lineas.map((l) => l.match(/^cliente\s*:\s*(.+)$/i)?.[1]).find(Boolean);
  const primera = lineas.find((l) => !/registro de venta/i.test(l) && !/@|:\s|^\+?\d/.test(l));
  const nombre = (cliente ?? primera ?? "").slice(0, 120);
  return { ts, nombre, emails, telefonos, autor };
}

const tokens = (s: string) => norm(s).split(" ").filter((w) => w.length >= 3 && !/^(del|las|los|and|llc|inc)$/.test(w));

// Puntaje: correo o teléfono = 3 (dato duro); nombre y apellido = 2; los dos = 4. El nombre desempata
// cuando un closer copió el correo/teléfono de otro cliente en la venta (pasó con Natacha/Angelica).
export function puntaje(f: FichaCliente, v: VentaSlack): number {
  const duro = f.emails.some((e) => v.emails.includes(e.toLowerCase())) || f.telefonos.some((t) => t && v.telefonos.includes(t));
  const a = tokens(f.nombre);
  const b = new Set(tokens(v.nombre));
  const comunes = a.filter((w) => b.has(w)).length;
  const nombre = comunes >= 2 || (comunes === 1 && a.length === 1 && b.size === 1);
  return (duro ? 3 : 0) + (nombre ? (duro ? 1 : 2) : 0);
}

// La venta que corresponde a la ficha (la más reciente con mejor puntaje). null si ninguna llega a 2.
export function emparejar(f: FichaCliente, ventas: VentaSlack[]): VentaSlack | null {
  let mejor: { v: VentaSlack; p: number } | null = null;
  for (const v of ventas) {
    const p = puntaje(f, v);
    if (p < 2) continue;
    if (!mejor || p > mejor.p || (p === mejor.p && Number(v.ts) > Number(mejor.v.ts))) mejor = { v, p };
  }
  return mejor?.v ?? null;
}

// El PDF del contrato dentro del hilo: primero el que se llama contrato/acuerdo, si no el primer PDF.
export function elegirContrato(archivos: ArchivoSlack[]): ArchivoSlack | null {
  const pdfs = archivos.filter((a) => a.mimetype === "application/pdf" || /\.pdf$/i.test(a.name));
  return pdfs.find((a) => /contrat|acuerdo|agreement/i.test(a.name)) ?? pdfs[0] ?? null;
}

// ¿El nombre del PDF menciona al cliente? Si no, puede ser el contrato de otra persona (ya pasó).
export function archivoCoincide(nombreCliente: string, nombreArchivo: string): boolean {
  const archivo = norm(nombreArchivo.replace(/[_-]+/g, " "));
  const ruido = new Set(["level", "media", "contrato", "acuerdo", "pdf", "dfy"]);
  const t = tokens(nombreCliente).filter((w) => !ruido.has(w));
  if (!t.length) return true;
  // Un PDF sin nombre de persona ("Contrato_(1).pdf") no dice nada: no es sospechoso.
  const delArchivo = archivo.replace(/\.pdf$/, "").split(" ").filter((w) => /^[a-z]{3,}$/.test(w) && !ruido.has(w) && !/^(done|for|fou|you|up)$/.test(w));
  if (!delArchivo.length) return true;
  return t.some((w) => archivo.includes(w));
}
