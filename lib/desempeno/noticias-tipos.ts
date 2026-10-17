// Categorías de Noticias (puro: lo usan servidor y cliente).
export const CATEGORIAS_NOTICIA = [
  { id: "logro", nombre: "Logro", emoji: "🏆" },
  { id: "noticia", nombre: "Noticia", emoji: "📰" },
  { id: "comunicado", nombre: "Comunicado", emoji: "📣" },
  { id: "benefica", nombre: "Causa benéfica", emoji: "💚" },
] as const;
export type CategoriaNoticia = (typeof CATEGORIAS_NOTICIA)[number]["id"];
export const categoriaNoticia = (id: string) => CATEGORIAS_NOTICIA.find((c) => c.id === id) ?? CATEGORIAS_NOTICIA[1];

// Para quién (17/oct, Elvin: cada empleado ve solo lo de su empresa, nunca la de la otra).
export const PARA_NOTICIA = [
  { id: "todas", nombre: "Todo el equipo" },
  { id: "level_up", nombre: "Level Up" },
  { id: "ai_borinquen", nombre: "AI Borinquen" },
] as const;
export type ParaNoticia = (typeof PARA_NOTICIA)[number]["id"];
export const esParaNoticia = (x: string): x is ParaNoticia => PARA_NOTICIA.some((p) => p.id === x);

/** Quién ve una noticia: la de "todas", la de SU empresa (o la otra donde también vende) y la vista maestra todas. */
export function noticiaVisible(n: { empresa: string }, v: { empresa: string | null; tambienEn?: string | null; maestro: boolean }): boolean {
  if (v.maestro || n.empresa === "todas") return true;
  return !!v.empresa && (n.empresa === v.empresa || n.empresa === v.tambienEn);
}
