// Lector genérico de Google Sheets PÚBLICAS (share "cualquiera con el link").
// No usa googleapis ni credenciales: baja el export CSV de la hoja y lo parsea.
// Server-only (usa fetch sin caché). Las páginas que lo consumen son dynamic.

export interface FilaSheet {
  [columna: string]: string;
}

export interface HojaSheet {
  headers: string[];
  filas: FilaSheet[];
}

function urlCsv(sheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// Parser CSV que respeta comillas dobles (los valores traen comas: "$1,000.00").
// Maneja "" como comilla escapada y saltos de línea CRLF/LF.
export function parseCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let enComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];

    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++; // comilla escapada
        } else {
          enComillas = false;
        }
      } else {
        campo += c;
      }
      continue;
    }

    if (c === '"') {
      enComillas = true;
    } else if (c === ",") {
      fila.push(campo);
      campo = "";
    } else if (c === "\n") {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else if (c === "\r") {
      // ignorar (parte de CRLF)
    } else {
      campo += c;
    }
  }
  // último campo/fila si no termina en salto de línea
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas;
}

// Baja la hoja y devuelve headers + filas como objetos.
// Descarta columnas sin encabezado (columnas basura/notas) y filas vacías.
export async function fetchSheet(
  sheetId: string,
  gid: string,
): Promise<HojaSheet> {
  const res = await fetch(urlCsv(sheetId, gid), {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) {
    throw new Error(
      `No se pudo leer la hoja ${sheetId} (gid ${gid}): HTTP ${res.status}`,
    );
  }
  const texto = await res.text();
  const matriz = parseCsv(texto);
  if (matriz.length === 0) return { headers: [], filas: [] };

  const headersRaw = matriz[0].map((h) => h.trim());
  // Índices de columnas con encabezado real (ignora vacías / de nota).
  const cols = headersRaw
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => h.length > 0);
  const headers = cols.map((c) => c.h);

  const filas: FilaSheet[] = [];
  for (let r = 1; r < matriz.length; r++) {
    const fila = matriz[r];
    const obj: FilaSheet = {};
    let algoConValor = false;
    for (const { h, i } of cols) {
      const val = (fila[i] ?? "").trim();
      obj[h] = val;
      if (val) algoConValor = true;
    }
    if (algoConValor) filas.push(obj);
  }

  return { headers, filas };
}
