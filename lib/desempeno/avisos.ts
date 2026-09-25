// Textos de los avisos de Ritmo por Slack (puros; los arma el cron /api/cron/ritmo).
// Tono: hechos, sin presión. Solo se manda si hay algo que mirar.

export interface FilaAviso {
  nombre: string;
  liderId: string | null;
  estado: string; // EstadoAsistencia del día revisado
  minutosTarde: number;
  sinSalida: boolean;
  correccionPendiente: boolean;
  vencidas: number;
  bloqueos: string | null;
  score: number | null;
  scoreSemana: number | null;
}

const lista = (xs: string[]) => xs.join(", ");

/** Digest de la mañana (lo de AYER) para Carilin o para un líder. null = nada que avisar. */
export function textoDigest(p: { fecha: string; filas: FilaAviso[]; url: string; para: string }): string | null {
  const f = p.filas;
  const sinMarcar = f.filter((x) => x.estado === "ausente").map((x) => x.nombre);
  const tarde = f.filter((x) => x.minutosTarde > 15).map((x) => `${x.nombre} (${x.minutosTarde} min)`);
  const sinSalida = f.filter((x) => x.sinSalida).map((x) => x.nombre);
  const porConfirmar = f.filter((x) => x.correccionPendiente).map((x) => x.nombre);
  const vencidas = f.filter((x) => x.vencidas > 0).map((x) => `${x.nombre} (${x.vencidas})`);
  const bloqueos = f.filter((x) => x.bloqueos).map((x) => `• ${x.nombre}: ${x.bloqueos!.replace(/\s+/g, " ").slice(0, 160)}`);
  const lineas: string[] = [];
  if (sinMarcar.length) lineas.push(`🔴 Sin marcar: ${lista(sinMarcar)}`);
  if (tarde.length) lineas.push(`⏰ Entraron tarde: ${lista(tarde)}`);
  if (sinSalida.length) lineas.push(`⚠️ Sin salida marcada: ${lista(sinSalida)}`);
  if (porConfirmar.length) lineas.push(`🕓 Salidas por confirmar: ${lista(porConfirmar)}`);
  if (vencidas.length) lineas.push(`📌 Entregables vencidos: ${lista(vencidas)}`);
  if (bloqueos.length) lineas.push(`🧱 Bloqueos reportados:\n${bloqueos.join("\n")}`);
  if (!lineas.length) return null;
  const dia = new Date(`${p.fecha}T12:00:00`).toLocaleDateString("es-PR", { weekday: "long", day: "numeric", month: "long" });
  return `*Ritmo · ${dia}* (${p.para})\n${lineas.join("\n")}\n<${p.url}|Ver en Ritmo>`;
}

/** Resumen de los lunes para Elvin: la semana por colores y quién necesita atención. */
export function textoSemanal(p: { filas: FilaAviso[]; url: string; calibrando: boolean }): string {
  const conScore = p.filas.filter((x) => x.scoreSemana !== null);
  const verde = conScore.filter((x) => x.scoreSemana! >= 90).length;
  const amarillo = conScore.filter((x) => x.scoreSemana! >= 75 && x.scoreSemana! < 90).length;
  const rojos = conScore.filter((x) => x.scoreSemana! < 75).sort((a, b) => a.scoreSemana! - b.scoreSemana!);
  const lineas = [
    `*Ritmo · resumen de la semana*${p.calibrando ? " (calibrando: el equipo aún no ve el score)" : ""}`,
    `🟢 ${verde} cumpliendo · 🟡 ${amarillo} atención · 🔴 ${rojos.length} requieren intervención`,
  ];
  if (rojos.length) lineas.push(`Requieren intervención: ${lista(rojos.slice(0, 8).map((x) => `${x.nombre} (${x.scoreSemana})`))}`);
  lineas.push(`<${p.url}|Ver en Ritmo>`);
  return lineas.join("\n");
}
