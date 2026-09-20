// Creadores del equipo → su usuario de Slack, para mandarles por DM el contenido
// aprobado (listo para grabar). El campo `para` de una Entrega se resuelve contra
// este mapa; si matchea, el guión aprobado le llega a esa persona por Slack.
//
// Los IDs de Slack no son secretos (identifican usuarios del workspace). Para
// agregar a alguien: buscá su id con users.list y sumalo acá.

export interface Creador {
  clave: string; // slug para matchear el campo `para`
  nombre: string; // cómo saludarlo en el DM
  slackId: string; // usuario de Slack (Uxxxx)
}

export const CREADORES: Creador[] = [
  { clave: "valentina", nombre: "Valentina", slackId: "U08CZV7EL2C" },
  { clave: "juan diego", nombre: "Juan Diego", slackId: "U09D4GB4MPW" },
  { clave: "jay", nombre: "Jay", slackId: "U0AA8M91HE1" },
  { clave: "heidy", nombre: "Heidy", slackId: "U0B8FM57ECR" },
  // Sumar cuando tengamos sus IDs: Daren, Frankie.
];

// Resuelve el campo `para` de una entrega a un creador con Slack. Tolera variantes
// ("Valentina", "valentina contreras", "para Valentina"…) matcheando por la clave.
export function creadorDeDestino(para?: string): Creador | null {
  if (!para) return null;
  const p = para.toLowerCase();
  return (
    CREADORES.find((c) => p.includes(c.clave)) ??
    CREADORES.find((c) => c.clave.split(" ")[0] && p.includes(c.clave.split(" ")[0])) ??
    null
  );
}
