// Directorio de responsables del ecosistema → su Slack (workspace Level Up).
// Lo usa el botón "Accionar" del Command Center: Elvin elige a quién escribirle
// sobre un punto del debrief y el mensaje sale como él (user token) por DM.
// IDs de usuario de Slack (no son secretos). Para agregar gente: users.list.

export interface ResponsableSlack {
  id: string; // Slack user id (workspace Level Up)
  nombre: string;
  rol: string;
}

export const RESPONSABLES: ResponsableSlack[] = [
  { id: "U07V7MVJ18B", nombre: "Carilin", rol: "Directora de Operaciones" },
  { id: "U08HA9QCJBG", nombre: "Aure", rol: "Asistente + Directora Comercial" },
  { id: "U08SN35L2UX", nombre: "Jessica", rol: "Project Manager (onboarding)" },
  { id: "U091X0MQXV0", nombre: "María García", rol: "Tesorería LUM" },
  { id: "U08Q51UFLSH", nombre: "Yaileen", rol: "Tesorería AIB / Team Scaling" },
  { id: "U09D4GB4MPW", nombre: "Juan Diego", rol: "Director de Estrategas (tráfico)" },
  { id: "U0916SXJE9Z", nombre: "María del Carmen", rol: "Directora Creativa" },
  { id: "U0B8FM57ECR", nombre: "Heidy", rol: "Community Manager" },
  { id: "U08CZV7EL2C", nombre: "Valentina", rol: "Sales Team Leader / creadora UGC" },
  { id: "U0ARDBKQDCJ", nombre: "Felipe Durán", rol: "Estratega Digital" },
  { id: "U09HS09R37T", nombre: "Santiago Gutiérrez", rol: "Estratega Digital" },
  { id: "U0A3JTY3MFZ", nombre: "David Bonilla", rol: "Dev (producto AIB)" },
  { id: "U0AC0FWJ0CF", nombre: "Michael González", rol: "Creativos / edición" },
];

// Sugerencia simple de responsable según palabras del texto del item.
// Tolera texto vacío/undefined: si una fuente externa (Slack, Granola) falla o
// devuelve un item a medio escribir, esto NO puede tumbar el Command Center
// entero — cae al responsable por defecto y la página sigue viva.
export function sugerirResponsable(texto?: string | null): ResponsableSlack {
  const t = String(texto ?? "").toLowerCase();
  const regla: [RegExp, string][] = [
    [/onboarding|no estamos bien|jessica/, "U08SN35L2UX"],
    [/crash|railway|voz|deploy|producto|retell|vapi|bori\b/, "U0A3JTY3MFZ"],
    [/tesorer|pago|cobr|factur|renovar|churn|reembolso/, "U091X0MQXV0"],
    [/creativo|edici[oó]n|video|am[eé]rico|michael/, "U0916SXJE9Z"],
    [/estratega|tr[aá]fico|ads|roas|campaña|closer|setter/, "U09D4GB4MPW"],
    [/contenido|publicar|historia|reel|post/, "U0B8FM57ECR"],
    [/cliente|cr[ií]tico|queja|operacion/, "U07V7MVJ18B"],
  ];
  for (const [re, id] of regla) {
    if (re.test(t)) {
      const r = RESPONSABLES.find((x) => x.id === id);
      if (r) return r;
    }
  }
  // Default: Carilin (operaciones) — o Aure como asistente.
  return RESPONSABLES[0];
}
