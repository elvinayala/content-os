/** Feriados de Puerto Rico + federales de EE. UU. Esos días Nina publica sobre el feriado (regla de Elvin). */
export interface Feriado { clave: string; nombre: string; angulo: string }

const nthWeekday = (y: number, m: number, dow: number, n: number) => { const d = new Date(y, m, 1); const off = (dow - d.getDay() + 7) % 7; return new Date(y, m, 1 + off + (n - 1) * 7); };
const lastWeekday = (y: number, m: number, dow: number) => { const d = new Date(y, m + 1, 0); const off = (d.getDay() - dow + 7) % 7; return new Date(y, m + 1, 0 - off); };
function easter(y: number) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31) - 1, da = ((h + l - 7 * m + 114) % 31) + 1; return new Date(y, mo, da); }
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const shift = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** Devuelve el feriado de una fecha (YYYY-MM-DD, hora PR) o null. */
export function feriadoDe(fechaISO: string): Feriado | null {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const fijo: Record<string, Feriado> = {
    "01-01": { clave: "ano-nuevo", nombre: "Año Nuevo", angulo: "arrancar el año con la casa resuelta; lista corta de mantenimiento de enero" },
    "01-06": { clave: "reyes", nombre: "Día de Reyes", angulo: "tradición boricua; regalo para la casa = tranquilidad; guiño a la grama para los camellos" },
    "03-22": { clave: "abolicion", nombre: "Día de la Abolición de la Esclavitud", angulo: "memoria y dignidad del trabajo; respeto al oficio" },
    "06-19": { clave: "juneteenth", nombre: "Juneteenth", angulo: "libertad y dignidad del trabajo" },
    "07-04": { clave: "4-julio", nombre: "4 de julio", angulo: "día libre, parrilla, familia; cuidado con la presión del agua en casa llena" },
    "07-25": { clave: "constitucion", nombre: "Día de la Constitución de Puerto Rico", angulo: "orgullo boricua; hecho en PR para PR" },
    "07-27": { clave: "barbosa", nombre: "Natalicio de José Celso Barbosa", angulo: "trabajo, educación y servicio al pueblo" },
    "10-31": { clave: "halloween", nombre: "Halloween", angulo: "las verdaderas historias de terror son las de plomería: el precio que dobla, el plomero fantasma" },
    "11-11": { clave: "veteranos", nombre: "Día de los Veteranos", angulo: "gracias a los veteranos boricuas; servicio y compromiso" },
    "11-19": { clave: "descubrimiento-pr", nombre: "Día del Descubrimiento de Puerto Rico", angulo: "orgullo de la isla; servimos a toda la isla" },
    "12-24": { clave: "nochebuena", nombre: "Nochebuena", angulo: "casa llena, lechón, familia; que la plomería aguante la fiesta" },
    "12-25": { clave: "navidad", nombre: "Navidad", angulo: "gracias a las familias y a los plomeros que trabajan en diciembre" },
    "12-31": { clave: "despedida-ano", nombre: "Despedida de Año", angulo: "cierre de año; lo que aprendimos; año nuevo casa nueva" },
  };
  const k = `${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  if (fijo[k]) return fijo[k];
  const f = new Date(y, m - 1, d); const s = iso(f);
  const movibles: [string, Feriado][] = [
    [iso(nthWeekday(y, 0, 1, 2)), { clave: "hostos", nombre: "Natalicio de Eugenio María de Hostos", angulo: "educación y trabajo bien hecho" }],
    [iso(nthWeekday(y, 0, 1, 3)), { clave: "mlk", nombre: "Día de Martin Luther King Jr.", angulo: "dignidad, servicio, justicia en el trabajo" }],
    [iso(nthWeekday(y, 1, 1, 3)), { clave: "presidentes", nombre: "Día de los Presidentes", angulo: "fin de semana largo; revisa la casa antes de salir" }],
    [iso(shift(easter(y), -2)), { clave: "viernes-santo", nombre: "Viernes Santo", angulo: "pausa y familia; respeto; mensaje sobrio" }],
    [iso(nthWeekday(y, 3, 1, 3)), { clave: "de-diego", nombre: "Natalicio de José de Diego", angulo: "orgullo puertorriqueño; hecho aquí" }],
    [iso(nthWeekday(y, 4, 0, 2)), { clave: "madres", nombre: "Día de las Madres", angulo: "a las madres que arreglan todo; hoy que alguien lo resuelva por ti" }],
    [iso(lastWeekday(y, 4, 1)), { clave: "memorial", nombre: "Memorial Day", angulo: "memoria y respeto; fin de semana largo" }],
    [iso(nthWeekday(y, 5, 0, 3)), { clave: "padres", nombre: "Día de los Padres", angulo: "al papá que 'lo arregla él'; hoy descansa" }],
    [iso(nthWeekday(y, 8, 1, 1)), { clave: "trabajo", nombre: "Día del Trabajo", angulo: "homenaje a los plomeros y a todos los oficios de PR" }],
    [iso(nthWeekday(y, 9, 1, 2)), { clave: "raza", nombre: "Día de la Raza", angulo: "raíces; orgullo; isla" }],
    [iso(nthWeekday(y, 10, 4, 4)), { clave: "gracias", nombre: "Día de Acción de Gracias", angulo: "gracias a los clientes y plomeros que confiaron; casa llena, fregadero a prueba" }],
  ];
  const hit = movibles.find(([dia]) => dia === s);
  return hit ? hit[1] : null;
}
