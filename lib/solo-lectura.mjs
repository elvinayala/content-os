// Solo lectura que se PROPAGA (parche D, 12-oct-2026; aprobado por Elvin). Cuando el puente corre una tarea de solo
// lectura (AI Core, lo delegado a Nico, los diagnósticos de solicitudes), le pone AGENTE_SOLO_LECTURA=1 al proceso del
// agente. Todo script con efectos lo respeta: así, aunque una regla de permisos dejara pasar un comando, una tarea de
// solo lectura nunca termina mandando mensajes, activando a otro agente, gastando en fal.ai o escribiendo en Meta.
// Sin la marca (Telegram de Elvin, la Mac verificada, el trabajo normal de cada agente) no cambia nada.

export const MARCA_SOLO_LECTURA = "AGENTE_SOLO_LECTURA";

export const enSoloLectura = (env = process.env) => env[MARCA_SOLO_LECTURA] === "1";

export class SoloLecturaError extends Error {
  constructor(accion) {
    super(`Solo lectura: "${accion}" no se permite en esta tarea. Explica qué harías y que lo apruebe Elvin.`);
    this.name = "SoloLecturaError";
  }
}

/** Lanza si la tarea es de solo lectura. */
export function exigirEscritura(accion, env = process.env) {
  if (enSoloLectura(env)) throw new SoloLecturaError(accion);
}

/** Para los CLI: corta el proceso con un mensaje claro (código 3) si la tarea es de solo lectura. */
export function negarEnSoloLectura(accion, env = process.env) {
  if (!enSoloLectura(env)) return;
  console.error(`⛔ ${new SoloLecturaError(accion).message}`);
  process.exit(3);
}
