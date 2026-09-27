// Bienestar (puro; tests en tests/bienestar.test.mjs). La parte wellness de Ritmo: voluntaria, privada y
// fuera del score. Pausa activa de 5 min para gente de escritorio, minutos de ejercicio y energía del día.

export const META_SEMANAL_MIN = 150; // OMS: 150 min de actividad moderada por semana
export const MIN_RESPUESTAS_ANIMO = 5; // por debajo, la maestra no ve el promedio (no se puede adivinar quién)

export type Ejercicio = { nombre: string; como: string; segundos: number };
export type Rutina = { titulo: string; foco: string; ejercicios: Ejercicio[] };

// Una rutina por día de la semana (0 = domingo). ~5 min, sin equipo, de pie o en la silla.
export const RUTINAS: Rutina[] = [
  {
    titulo: "Descanso activo",
    foco: "Suave, para soltar la semana",
    ejercicios: [
      { nombre: "Camina", como: "Camina por la casa o afuera, a paso cómodo.", segundos: 90 },
      { nombre: "Brazos arriba", como: "Entrelaza los dedos, estira los brazos al techo y respira profundo.", segundos: 45 },
      { nombre: "Torsión suave", como: "De pie, gira el tronco a un lado y al otro sin forzar.", segundos: 45 },
      { nombre: "Tocar las rodillas", como: "Baja despacio hacia las rodillas con la espalda relajada y sube.", segundos: 45 },
      { nombre: "Respiración 4-4-6", como: "Inhala 4 s, sostén 4 s, bota el aire en 6 s.", segundos: 60 },
    ],
  },
  {
    titulo: "Cuello y hombros",
    foco: "Para las horas de pantalla",
    ejercicios: [
      { nombre: "Círculos de hombros", como: "Hombros hacia atrás en círculos grandes y lentos; luego hacia adelante.", segundos: 45 },
      { nombre: "Cuello de lado", como: "Lleva la oreja al hombro sin subirlo. 20 s de cada lado.", segundos: 45 },
      { nombre: "Abre el pecho", como: "Manos detrás de la cabeza, codos atrás, pecho al frente.", segundos: 45 },
      { nombre: "Junta las escápulas", como: "Aprieta las escápulas como si sostuvieras un lápiz entre ellas. Suelta y repite.", segundos: 45 },
      { nombre: "Respiración 4-4-6", como: "Inhala 4 s, sostén 4 s, bota el aire en 6 s.", segundos: 60 },
    ],
  },
  {
    titulo: "Piernas activas",
    foco: "Mueve la circulación",
    ejercicios: [
      { nombre: "Sentadillas lentas", como: "Como si te sentaras en la silla y te levantaras. Espalda recta.", segundos: 45 },
      { nombre: "Puntas de pie", como: "Sube a la punta de los pies y baja despacio.", segundos: 45 },
      { nombre: "Zancadas alternas", como: "Un paso al frente, baja la rodilla de atrás sin tocar el piso. Alterna.", segundos: 60 },
      { nombre: "Cuádriceps de pie", como: "Agarra el tobillo detrás de ti (apóyate en la pared). 20 s por pierna.", segundos: 45 },
      { nombre: "Marcha en el sitio", como: "Rodillas arriba, brazos acompañando.", segundos: 60 },
    ],
  },
  {
    titulo: "Espalda",
    foco: "Contra la postura de silla",
    ejercicios: [
      { nombre: "Gato-vaca de pie", como: "Manos en los muslos: redondea la espalda y luego arquéala suave.", segundos: 45 },
      { nombre: "Torsión sentado", como: "En la silla, gira el tronco agarrándote del respaldo. 20 s por lado.", segundos: 60 },
      { nombre: "Colgar hacia adelante", como: "De pie, rodillas flexionadas, deja caer el tronco y respira.", segundos: 45 },
      { nombre: "Ángeles en la pared", como: "Espalda a la pared, sube y baja los brazos como alas.", segundos: 60 },
      { nombre: "Respiración profunda", como: "Manos en el abdomen; que se infle al inhalar.", segundos: 45 },
    ],
  },
  {
    titulo: "Manos y muñecas",
    foco: "Para el que teclea todo el día",
    ejercicios: [
      { nombre: "Círculos de muñeca", como: "Gira las muñecas hacia un lado y hacia el otro.", segundos: 45 },
      { nombre: "Palma arriba", como: "Brazo al frente, palma arriba; con la otra mano baja los dedos. Cambia.", segundos: 45 },
      { nombre: "Palma abajo", como: "Brazo al frente, palma abajo; con la otra mano lleva la mano hacia ti. Cambia.", segundos: 45 },
      { nombre: "Abre y cierra", como: "Puño fuerte y abre los dedos bien separados.", segundos: 45 },
      { nombre: "Ojos 20-20-20", como: "Mira algo lejos (a más de 6 m) y parpadea despacio.", segundos: 60 },
    ],
  },
  {
    titulo: "Energía",
    foco: "Para cerrar la semana arriba",
    ejercicios: [
      { nombre: "Jumping jacks suaves", como: "O sin brincar: abre brazos y piernas a un lado y al otro.", segundos: 45 },
      { nombre: "Sentadilla y arriba", como: "Baja en sentadilla y al subir estira los brazos al techo.", segundos: 45 },
      { nombre: "Plancha en el escritorio", como: "Manos en el borde del escritorio, cuerpo recto. Sostén.", segundos: 45 },
      { nombre: "Marcha rápida", como: "Marcha en el sitio a buen ritmo.", segundos: 60 },
      { nombre: "Estiramiento completo", como: "Brazos arriba, estírate como al levantarte. Respira.", segundos: 45 },
    ],
  },
  {
    titulo: "Movilidad",
    foco: "Articulaciones sueltas",
    ejercicios: [
      { nombre: "Círculos de cadera", como: "Manos en la cintura, círculos grandes con la cadera.", segundos: 45 },
      { nombre: "Isquiotibiales", como: "Talón en una silla baja o escalón, inclínate un poco. 20 s por pierna.", segundos: 60 },
      { nombre: "Tobillos", como: "Levanta un pie y dibuja círculos con el tobillo. Cambia.", segundos: 45 },
      { nombre: "Brazos cruzados", como: "Lleva un brazo recto sobre el pecho con ayuda del otro. Cambia.", segundos: 45 },
      { nombre: "Respiración 4-4-6", como: "Inhala 4 s, sostén 4 s, bota el aire en 6 s.", segundos: 60 },
    ],
  },
];

export const ACTIVIDADES = [
  { id: "caminar", nombre: "Caminar", emoji: "🚶" },
  { id: "correr", nombre: "Correr", emoji: "🏃" },
  { id: "gym", nombre: "Gym / pesas", emoji: "🏋️" },
  { id: "yoga", nombre: "Yoga / estiramiento", emoji: "🧘" },
  { id: "deporte", nombre: "Deporte", emoji: "⚽" },
  { id: "baile", nombre: "Baile", emoji: "💃" },
  { id: "bici", nombre: "Bici", emoji: "🚴" },
  { id: "otro", nombre: "Otro", emoji: "✨" },
] as const;

export const ANIMOS = [
  { valor: 1, emoji: "😫", nombre: "Agotado" },
  { valor: 2, emoji: "😕", nombre: "Bajo" },
  { valor: 3, emoji: "😐", nombre: "Normal" },
  { valor: 4, emoji: "🙂", nombre: "Bien" },
  { valor: 5, emoji: "⚡", nombre: "Con energía" },
] as const;

/** Rutina del día (por día de la semana de la fecha PR). */
export function rutinaDelDia(fecha: string): Rutina {
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return RUTINAS[dia];
}
export const duracionRutina = (r: Rutina) => r.ejercicios.reduce((n, e) => n + e.segundos, 0);

export type RegistroBienestar = { userId: string; fecha: string; tipo: string; minutos: number; valor: number | null };

/** Minutos que cuentan para la meta: ejercicio anotado + pausas activas hechas. */
const minutosDe = (r: RegistroBienestar) => (r.tipo === "actividad" || r.tipo === "pausa" ? r.minutos : 0);

/** Mi semana: minutos (lun-dom), pausas, meta y días seguidos con pausa hasta `hoy`. */
export function miSemana(regs: RegistroBienestar[], dias: string[], hoy: string) {
  const porDia = dias.map((f) => ({ fecha: f, minutos: regs.filter((r) => r.fecha === f).reduce((n, r) => n + minutosDe(r), 0), pausa: regs.some((r) => r.fecha === f && r.tipo === "pausa") }));
  const minutos = porDia.reduce((n, d) => n + d.minutos, 0);
  let racha = 0;
  const conPausa = new Set(regs.filter((r) => r.tipo === "pausa").map((r) => r.fecha));
  for (let d = hoy; conPausa.has(d); d = restarDia(d)) racha++;
  return { porDia, minutos, meta: META_SEMANAL_MIN, pct: Math.min(100, Math.round((minutos / META_SEMANAL_MIN) * 100)), pausas: porDia.filter((d) => d.pausa).length, racha };
}

/** El equipo (solo agregados): participación, minutos, cuántos llegaron a la meta y energía (si hay ≥ 5). */
export function equipoSemana(regs: RegistroBienestar[], personasActivas: number) {
  const porPersona = new Map<string, number>();
  for (const r of regs) porPersona.set(r.userId, (porPersona.get(r.userId) ?? 0) + minutosDe(r));
  const animos = regs.filter((r) => r.tipo === "animo" && r.valor);
  const participantes = new Set(regs.map((r) => r.userId)).size;
  return {
    participantes,
    personas: personasActivas,
    minutos: [...porPersona.values()].reduce((a, b) => a + b, 0),
    cumplieron: [...porPersona.values()].filter((m) => m >= META_SEMANAL_MIN).length,
    pausas: regs.filter((r) => r.tipo === "pausa").length,
    respuestasAnimo: animos.length,
    animo: animos.length >= MIN_RESPUESTAS_ANIMO ? Math.round((animos.reduce((n, r) => n + r.valor!, 0) / animos.length) * 10) / 10 : null,
  };
}

/** Lunes a domingo de la semana de `fecha` (YYYY-MM-DD). */
export function semanaDe(fecha: string): string[] {
  const d = new Date(`${fecha}T12:00:00Z`);
  const desdeLunes = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - desdeLunes);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(d);
    x.setUTCDate(d.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

function restarDia(f: string) {
  const d = new Date(`${f}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

// ---- Comunidad (solo quienes se unen) ----
export const REACCIONES = ["💪", "🔥", "👏", "❤️"] as const;
export const MAX_MENSAJE = 280;
export const MAX_COMENTARIO = 200;

/** Comentario: corto, sin vacíos. */
export function errorComentario(texto: string): string | null {
  const t = (texto ?? "").trim();
  if (!t) return "Escribe algo";
  if (t.length > MAX_COMENTARIO) return `Máximo ${MAX_COMENTARIO} caracteres`;
  return null;
}

/** Logros que el sistema publica en la comunidad (una vez por semana cada uno; la clave evita repetirlos). */
export function logrosDeLaSemana(yo: { minutos: number; racha: number }, userId: string, lunes: string): { clave: string; texto: string }[] {
  const out: { clave: string; texto: string }[] = [];
  if (yo.minutos >= META_SEMANAL_MIN) out.push({ clave: `meta:${userId}:${lunes}`, texto: `llegó a la meta de la semana: ${yo.minutos} min moviéndose 🏆` });
  if (yo.racha >= 5) out.push({ clave: `racha5:${userId}:${lunes}`, texto: "lleva 5 días seguidos haciendo la pausa activa 🔥" });
  return out;
}

/** Tablero de la semana entre los que se unieron: minutos, pausas y si se movió hoy. Nunca incluye energía. */
export function tableroComunidad(regs: RegistroBienestar[], visibles: { id: string; nombre: string }[], hoy: string) {
  return visibles
    .map((p) => {
      const mios = regs.filter((r) => r.userId === p.id);
      const minutos = mios.reduce((n, r) => n + (r.tipo === "actividad" || r.tipo === "pausa" ? r.minutos : 0), 0);
      return {
        id: p.id,
        nombre: p.nombre,
        minutos,
        pausas: mios.filter((r) => r.tipo === "pausa").length,
        activoHoy: mios.some((r) => r.fecha === hoy && (r.tipo === "pausa" || r.tipo === "actividad")),
        meta: minutos >= META_SEMANAL_MIN,
      };
    })
    .sort((a, b) => b.minutos - a.minutos || b.pausas - a.pausas || a.nombre.localeCompare(b.nombre));
}

/** Mensaje de la comunidad: corto, sin vacíos. Devuelve el error o null. */
export function errorMensaje(texto: string): string | null {
  const t = (texto ?? "").trim();
  if (t.length < 2) return "Escribe algo";
  if (t.length > MAX_MENSAJE) return `Máximo ${MAX_MENSAJE} caracteres`;
  return null;
}

/** Nombre corto para la comunidad: primer nombre + inicial del apellido. */
export function nombreCorto(nombre: string): string {
  const partes = nombre.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[1][0]}.` : partes[0];
}
