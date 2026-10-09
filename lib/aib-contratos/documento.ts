// Contrato de AI Borinquen con firma electrónica (9/oct/2026, Elvin: "el contrato de Borinquen igual que el de
// Resuelto que llenan los plomeros cuando firman, pero con el branding de AI Borinquen"; Aure: "estos datos se llenan
// manual: nombre del cliente, teléfono, qué se le ofreció, cuánto es el costo").
// El equipo llena en Pulse lo que se le ofreció y el costo → link → el cliente completa sus datos, inicia cada hoja y
// firma → PDF con certificado. Parte PURA (tests en tests/aib-contratos.test.mjs): el texto del contrato (el
// "Acuerdo de pago AI" de Aure, solo con errores de dedo corregidos), la validación y las hojas que pintan la página y
// el PDF. Por seguridad NO se piden el número completo de la tarjeta, el CVV ni el número de cuenta (PCI).

export const METODOS = [
  { id: "credito", nombre: "Tarjeta de crédito" },
  { id: "debito", nombre: "Tarjeta de débito" },
  { id: "ach", nombre: "Pago ACH (transferencia bancaria directa)" },
  { id: "affirm", nombre: "Affirm" },
  { id: "paypal", nombre: "PayPal" },
  { id: "klarna", nombre: "Klarna" },
  { id: "ath", nombre: "ATH Móvil" },
] as const;
export type Metodo = (typeof METODOS)[number]["id"];
export const TARJETAS = [
  { id: "visa", nombre: "Visa" },
  { id: "mastercard", nombre: "MasterCard" },
  { id: "amex", nombre: "American Express" },
  { id: "discover", nombre: "Discover" },
] as const;
export const CUENTAS = [
  { id: "ahorros", nombre: "Ahorros" },
  { id: "corriente", nombre: "Corriente" },
] as const;

/** Lo que llena el equipo (a mano, en Pulse) antes de mandar el link. */
export interface Oferta {
  cliente: { nombre: string; telefono: string; email: string; negocio: string };
  servicio: string; // "Incluye el servicio"
  costos: { total: number; hoy: number | null; mensual: number | null; nota: string };
}
/** Lo que completa el cliente en su teléfono. */
export interface DatosCliente {
  nombre: string; email: string; telefono: string; negocio: string;
  metodo: Metodo | ""; titular: string;
  tarjeta: string; ultimos4: string; banco: string; tipoCuenta: string;
  calle: string; ciudad: string; estado: string; postal: string;
}
export const CAMPOS_CLIENTE: (keyof DatosCliente)[] = ["nombre", "email", "telefono", "negocio", "metodo", "titular", "tarjeta", "ultimos4", "banco", "tipoCuenta", "calle", "ciudad", "estado", "postal"];

export type Bloque =
  | { t: "titulo"; texto: string; tag: string }
  | { t: "h"; texto: string }
  | { t: "p"; texto: string }
  | { t: "datos"; filas: [string, string][] }
  | { t: "opciones"; opciones: { texto: string; marcado: boolean }[] }
  | { t: "nota"; texto: string }
  | { t: "firmas" };
export interface Hoja { n: number; titulo: string; bloques: Bloque[] }

type R<T> = { ok: true; v: T } | { ok: false; error: string };
const limpio = (x: unknown, max = 120) => String(x ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const digitos = (s: string) => s.replace(/\D/g, "");
/** 13+ dígitos seguidos (con espacios o guiones) = parece un número de tarjeta o de cuenta: no se acepta. */
export const pareceNumeroSensible = (s: string) => /(?:\d[ -]?){13,}/.test(s);

export function numero(x: unknown): number | null {
  const s = String(x ?? "").replace(/[$,\s]/g, "");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
export const dinero = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Valida lo que llena el equipo. Teléfono de 10 dígitos (PR), total > 0, el pago de hoy no pasa del total. */
export function validarOferta(e: Record<string, unknown>): R<Oferta> {
  const nombre = limpio(e.nombre, 80), telefono = digitos(String(e.telefono ?? "")).replace(/^1(?=\d{10}$)/, "");
  const email = limpio(e.email, 120).toLowerCase(), negocio = limpio(e.negocio, 100);
  const servicio = String(e.servicio ?? "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, 2000);
  const total = numero(e.total), hoy = numero(e.hoy), mensual = numero(e.mensual), nota = limpio(e.nota, 300);
  if (!nombre) return { ok: false, error: "Falta el nombre del cliente." };
  if (telefono.length !== 10) return { ok: false, error: "El teléfono debe tener 10 dígitos." };
  if (email && !EMAIL.test(email)) return { ok: false, error: "El correo no es válido." };
  if (!servicio) return { ok: false, error: "Falta lo que incluye el servicio (lo que se le ofreció)." };
  if (total === null || Number.isNaN(total) || total <= 0) return { ok: false, error: "Falta el costo total." };
  if (Number.isNaN(hoy) || Number.isNaN(mensual)) return { ok: false, error: "Los montos solo llevan números." };
  if (hoy !== null && (hoy <= 0 || hoy > total)) return { ok: false, error: "El pago de hoy tiene que ser mayor que 0 y no pasar del total." };
  if (mensual !== null && mensual < 0) return { ok: false, error: "La mensualidad no puede ser negativa." };
  return { ok: true, v: { cliente: { nombre, telefono, email, negocio }, servicio, costos: { total, hoy, mensual: mensual || null, nota } } };
}

const usaFacturacion = (m: string) => m === "credito" || m === "debito" || m === "ach";
const esTarjeta = (m: string) => m === "credito" || m === "debito";

/** Valida lo que completa el cliente. Devuelve el primer error en español para mostrarlo. */
export function validarDatos(entrada: unknown): R<DatosCliente> {
  const e = (entrada && typeof entrada === "object" ? entrada : {}) as Record<string, unknown>;
  const d = Object.fromEntries(CAMPOS_CLIENTE.map((k) => [k, limpio(e[k])])) as unknown as DatosCliente;
  d.email = d.email.toLowerCase();
  for (const k of CAMPOS_CLIENTE) if (pareceNumeroSensible(d[k]) ) return { ok: false, error: "Por tu seguridad, no escribas el número completo de la tarjeta ni de la cuenta: solo los últimos 4 dígitos." };
  if (!d.nombre) return { ok: false, error: "Falta tu nombre completo." };
  if (!EMAIL.test(d.email)) return { ok: false, error: "Escribe un correo electrónico válido." };
  if (digitos(d.telefono).length < 10) return { ok: false, error: "El teléfono debe tener 10 dígitos." };
  if (!METODOS.some((m) => m.id === d.metodo)) return { ok: false, error: "Escoge el método de pago." };
  if (!d.titular) return { ok: false, error: esTarjeta(d.metodo) ? "Falta el nombre del titular de la tarjeta." : d.metodo === "ach" ? "Falta el nombre del titular de la cuenta." : "Falta el nombre de quien paga." };
  if (!esTarjeta(d.metodo)) { d.tarjeta = ""; d.ultimos4 = ""; }
  if (d.metodo !== "ach") { d.banco = ""; d.tipoCuenta = ""; }
  if (d.tarjeta && !TARJETAS.some((t) => t.id === d.tarjeta)) return { ok: false, error: "Escoge el tipo de tarjeta." };
  if (d.ultimos4 && !/^\d{4}$/.test(d.ultimos4)) return { ok: false, error: "Escribe solo los últimos 4 dígitos de la tarjeta." };
  if (d.tipoCuenta && !CUENTAS.some((t) => t.id === d.tipoCuenta)) return { ok: false, error: "Escoge el tipo de cuenta." };
  if (usaFacturacion(d.metodo)) {
    if (!d.calle) return { ok: false, error: "Falta la dirección de facturación (calle)." };
    if (!d.ciudad) return { ok: false, error: "Falta la ciudad de facturación." };
    if (!d.estado) return { ok: false, error: "Falta el estado o provincia (p. ej. PR)." };
    if (!/^\d{5}(-\d{4})?$/.test(d.postal)) return { ok: false, error: "El código postal debe tener 5 dígitos." };
  }
  return { ok: true, v: d };
}

const PNG = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
/** Firma e iniciales: PNG en data URL, no vacías y de tamaño razonable (~300 KB máx.). */
export function imagenValida(x: unknown): x is string {
  return typeof x === "string" && PNG.test(x) && x.length > 400 && x.length < 420_000;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fechaLarga(iso: string): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Puerto_Rico", day: "numeric", month: "numeric", year: "numeric" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.day} de ${MESES[Number(p.month) - 1]} de ${p.year}`;
}

export function textoCostos(c: Oferta["costos"]): string {
  const partes = [`Total: ${dinero(c.total)}`];
  if (c.hoy !== null && c.hoy !== c.total) partes.push(`Pago de hoy: ${dinero(c.hoy)}`);
  if (c.mensual) partes.push(`Mensualidad: ${dinero(c.mensual)} al mes`);
  return partes.join(" · ") + (c.nota ? `. ${c.nota}` : "");
}
const montoHoy = (c: Oferta["costos"]) => c.hoy ?? c.total;
const tel = (s: string) => { const d = digitos(s).replace(/^1(?=\d{10}$)/, ""); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : s; };
const nombreDe = <T extends { id: string; nombre: string }>(xs: readonly T[], id: string) => xs.find((x) => x.id === id)?.nombre ?? "";

/** Las hojas del contrato con los datos puestos (las usa la página del cliente, con lo que va escribiendo, y el PDF). */
export function hojas(o: Oferta, d: Partial<DatosCliente>, fechaIso: string): Hoja[] {
  const v = (s: string | undefined) => (s ?? "").trim() || "—";
  const metodo = d.metodo ?? "";
  const facturacion: [string, string][] = [["Titular", v(d.titular)]];
  if (esTarjeta(metodo)) facturacion.push(["Tipo de tarjeta", v(nombreDe(TARJETAS, d.tarjeta ?? ""))], ["Últimos 4 dígitos", d.ultimos4 ? `•••• ${d.ultimos4}` : "—"]);
  if (metodo === "ach") facturacion.push(["Banco", v(d.banco)], ["Tipo de cuenta", v(nombreDe(CUENTAS, d.tipoCuenta ?? ""))]);
  if (usaFacturacion(metodo) || d.calle) facturacion.push(["Dirección de facturación", [d.calle, d.ciudad, [d.estado, d.postal].filter(Boolean).join(" ")].filter((x) => x && x.trim()).join(", ") || "—"]);
  const detalles: [string, string][] = [["Pago de servicios", dinero(montoHoy(o.costos))], ["Total del acuerdo", dinero(o.costos.total)]];
  if (o.costos.mensual) detalles.push(["Mensualidad", `${dinero(o.costos.mensual)} al mes`]);
  if (o.costos.nota) detalles.push(["Nota", o.costos.nota]);

  return [
    { n: 1, titulo: "Información de pago", bloques: [
      { t: "titulo", texto: "Acuerdo de servicios y pago", tag: "AI Borinquen · EA Market LLC" },
      { t: "h", texto: "1. Datos del cliente" },
      { t: "datos", filas: [["Nombre completo", v(d.nombre)], ["Correo electrónico", v(d.email)], ["Teléfono", d.telefono ? tel(d.telefono) : "—"], ["Negocio", v(d.negocio)]] },
      { t: "h", texto: "2. Método de pago" },
      { t: "opciones", opciones: METODOS.map((m) => ({ texto: m.nombre, marcado: m.id === metodo })) },
      { t: "h", texto: "3. Datos de facturación" },
      { t: "datos", filas: facturacion },
      { t: "nota", texto: "Por tu seguridad, este acuerdo no pide el número completo de la tarjeta, el código de seguridad (CVV) ni el número de la cuenta bancaria. El pago se procesa por un medio seguro de AI Borinquen (enlace de pago, ATH Móvil, PayPal, Affirm o Klarna)." },
      { t: "h", texto: "4. Detalles del pago" },
      { t: "datos", filas: detalles },
      { t: "h", texto: "5. Autorización" },
      { t: "p", texto: "Autorizo a AI Borinquen a procesar el pago por el monto especificado anteriormente, utilizando el método de pago indicado." },
    ] },
    { n: 2, titulo: "Confidencialidad y términos de uso", bloques: [
      { t: "h", texto: "Nota de confidencialidad y seguridad de datos" },
      { t: "p", texto: "AI Borinquen garantiza que toda información provista por el cliente, incluyendo datos de tarjeta de crédito, será manejada con estricta confidencialidad y utilizada únicamente para los fines de este acuerdo. Nos comprometemos a proteger sus datos según los estándares más altos de seguridad y privacidad. Ninguna información será compartida con terceros, excepto cuando sea necesario para el procesamiento seguro del pago o cuando lo exija la ley." },
      { t: "h", texto: "Términos de uso · AI Borinquen" },
      { t: "p", texto: "El presente contrato será firmado en representación de EA Market LLC, quien será la parte legal responsable de la ejecución de los servicios aquí descritos." },
      { t: "p", texto: "Entre: AI Borinquen, compañía de responsabilidad limitada con sede en Hormigueros, Puerto Rico, con oficina principal en la Carr. 114 STE 1A, Bo. Castillo, Mayagüez, PR (en adelante \"AI Borinquen\"), y el cliente identificado en este documento." },
      { t: "p", texto: "AI Borinquen ofrece servicios de marketing, automatización, implementación de agentes de inteligencia artificial y chatbots personalizados, sujeto a los términos aquí establecidos. Al contratar estos servicios, el cliente declara ser mayor de 18 años y contar con capacidad legal para formalizar este documento." },
      { t: "h", texto: "Términos y condiciones" },
      { t: "p", texto: "1. Naturaleza del contrato. El presente contrato contempla la prestación de servicios de marketing a través de Meta, así como asistencia técnica durante el proceso y la implementación de procesos de automatización acordados entre las partes, entrenamiento y entrega con sus respectivas pruebas. Los detalles específicos relacionados con campañas, procesos, integraciones tecnológicas y alcances operativos serán definidos luego de la fase inicial de evaluación y discovery, y podrán documentarse mediante un plan de trabajo y, de ser necesario, un Addendum que formará parte integral de este contrato una vez firmado por ambas partes. Los servicios contratados no incluyen desarrollo de páginas web personalizadas desde cero. No obstante, sí se incluye la creación, configuración y/o implementación de ambientes funcionales para capacitación, tutoriales o entrenamiento del sistema." },
    ] },
    { n: 3, titulo: "Servicios, cronograma y garantía", bloques: [
      { t: "p", texto: "2. Detalles de los servicios y entregables. El Proveedor desarrollará las tareas según el alcance técnico aprobado, incluyendo la implementación del proceso personalizado del asistente de chat para WhatsApp, Facebook e Instagram, automatización con su sistema de agenda actual y automatizaciones internas, e implementación del marketing por 90 días. Las entregas se realizan por fases, con verificaciones parciales y un periodo de prueba de hasta 10 días laborables. Toda objeción o rechazo de entrega deberá presentarse por escrito, vía correo electrónico formal, dentro del plazo indicado. Se considerará aceptada la entrega una vez firmada el acta de recepción o transcurridos los 10 días sin objeción escrita. La aceptación no podrá retrasarse sin causa técnica debidamente documentada." },
      { t: "p", texto: "3. Cronograma de implementación. El proyecto se desarrollará conforme al cronograma técnico anexo. Si el Cliente no entrega información, accesos o aprobaciones en tiempo razonable, los plazos se suspenderán automáticamente. Si el retraso del Cliente excede 15 días naturales, el Proveedor podrá facturar el avance proporcional y considerar la fase como entregada. Cualquier modificación en fechas o alcance deberá acordarse por escrito." },
      { t: "p", texto: "4. Garantía de funcionamiento. AI Borinquen garantiza la correcta configuración y operatividad de las automatizaciones entregadas conforme al alcance técnico aprobado. Se excluyen fallos derivados de plataformas externas, cambios de API, interrupciones de terceros o uso indebido del sistema. Durante 30 días posteriores a la entrega, se ofrecerá soporte gratuito limitado a incidencias técnicas operativas." },
      { t: "p", texto: "5. Límite de responsabilidad. La responsabilidad total de AI Borinquen no excederá el monto efectivamente pagado por el Cliente. AI Borinquen no será responsable por daños indirectos, pérdida de ingresos, reputación o datos, ni por lucro cesante. El Cliente reconoce que este límite es razonable y proporcional a la naturaleza tecnológica del servicio." },
    ] },
    { n: 4, titulo: "Propiedad, pagos y terminación", bloques: [
      { t: "p", texto: "6. Propiedad intelectual y derechos de uso. Todo flujo de trabajo, plantilla, automatización, activo digital o proceso desarrollado específicamente para la operación de EL CLIENTE será considerado work for hire y será de uso exclusivo de EL CLIENTE, el cual tendrá su propia cuenta en la cual será implementado y contará con el acceso total desde su creación. En caso de que el cliente decida no continuar con el servicio de soporte, mantenimiento o acompañamiento por parte de la empresa, conservará pleno acceso y podrá seguir utilizando el sistema sin restricción alguna. No obstante, EL PROVEEDOR retendrá la titularidad sobre su metodología, arquitectura base, frameworks, lógica interna, código fuente, documentación técnica interna y cualquier estructura propietaria utilizada para la creación de dichas soluciones, los cuales no serán transferidos ni divulgados." },
      { t: "p", texto: "7. Política de pagos y reembolsos. Los pagos son no reembolsables, salvo incumplimiento grave verificado mediante dictamen técnico independiente mutuamente acordado." },
      { t: "p", texto: "8. Cambios en tarifas. Las tarifas son fijas para el alcance original del contrato. Cualquier modificación o solicitud adicional deberá ser aprobada por escrito mediante cotización adicional firmada o correo de aceptación. No se realizará trabajo adicional sin la debida aprobación formal." },
      { t: "p", texto: "9. Terminación del contrato. Cualquiera de las partes podrá rescindir el contrato únicamente por incumplimiento comprobado, documentado y no subsanado dentro de un plazo razonable tras la notificación formal. El Cliente podrá solicitar la terminación anticipada solo si demuestra, mediante evidencia escrita, una causa objetiva de incumplimiento del Proveedor dentro del alcance técnico acordado. En caso de cancelación anticipada por decisión del Cliente sin causa técnica válida, AI Borinquen conservará los pagos efectuados y podrá facturar proporcionalmente por el trabajo realizado hasta la fecha. La terminación requerirá aviso escrito con al menos quince (15) días hábiles de antelación, procurando que ambas partes acuerden las condiciones de cierre y entrega parcial de resultados." },
    ] },
    { n: 5, titulo: "Confidencialidad, soporte e indemnidad", bloques: [
      { t: "p", texto: "10. Cláusula de confidencialidad. Ambas partes se comprometen a mantener confidencial toda información técnica, comercial o financiera obtenida durante la ejecución del contrato. AI Borinquen solo responderá por filtraciones demostrables y atribuibles directamente a su negligencia. Esta obligación tendrá vigencia de cinco (5) años posteriores a la finalización del contrato. Cualquier incumplimiento generará responsabilidad por daños comprobados." },
      { t: "p", texto: "11. Soporte y mantenimiento posterior. AI Borinquen brindará soporte gratuito durante 30 días posteriores a la entrega final, limitado a incidencias técnicas reportadas por escrito. El horario de atención será de lunes a viernes, de 9:00 a.m. a 6:00 p.m. (hora de Puerto Rico). Cualquier solicitud recibida fuera de ese horario será atendida el siguiente día hábil. AI Borinquen no será responsable por interrupciones o fallos ocasionados por plataformas externas, factores de conectividad, uso indebido o causas ajenas a su control. Solicitudes que impliquen ajustes funcionales o nuevas tareas requerirán cotización adicional. Transcurrido el periodo gratuito, el Cliente podrá contratar planes de soporte opcionales con atención prioritaria." },
      { t: "p", texto: "12. Cláusula de indemnidad. Cada parte será responsable por sus propias acciones u omisiones. El Cliente reconoce y acepta que será el único responsable frente a terceros, autoridades o usuarios finales por el uso de las herramientas o sistemas implementados bajo este contrato. AI Borinquen no será responsable por sanciones regulatorias, multas o reclamos derivados del manejo, almacenamiento o procesamiento de datos personales realizado por el Cliente o por terceros bajo su control. Esta cláusula protege a ambas partes frente a reclamaciones externas y refuerza la obligación del Cliente de cumplir con las leyes de privacidad y protección de datos aplicables." },
    ] },
    { n: 6, titulo: "Conflictos, servicio y firmas", bloques: [
      { t: "p", texto: "13. Resolución de conflictos y no demandas colectivas. Cualquier controversia podrá someterse a un proceso de arbitraje opcional, únicamente si ambas partes así lo acuerdan por escrito. De utilizarse arbitraje, el árbitro será seleccionado de mutuo acuerdo entre las partes. Nada en esta cláusula limitará el derecho de cualquiera de las partes a acudir a los tribunales competentes conforme a la Sección 14 del presente contrato." },
      { t: "p", texto: "14. Ley aplicable y jurisdicción. Cualquier asunto relacionado con los trabajos contratados que no esté expresamente cubierto por este contrato se regirá conforme a las leyes del Estado Libre Asociado de Puerto Rico y, cuando aplique, por la jurisdicción federal correspondiente." },
      { t: "h", texto: "Resumen del acuerdo" },
      { t: "datos", filas: [["Fecha", fechaLarga(fechaIso)], ["Nombre completo del cliente", v(d.nombre)], ["Número(s) telefónico(s) del cliente", d.telefono ? tel(d.telefono) : "—"], ["Correo electrónico del cliente", v(d.email)], ["Incluye el servicio", o.servicio], ["Costos", textoCostos(o.costos)]] },
      { t: "firmas" },
    ] },
  ];
}

export const codigoDe = (id: number) => "AIB-" + String(id).padStart(4, "0");
