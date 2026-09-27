// Categorías de Noticias (puro: lo usan servidor y cliente).
export const CATEGORIAS_NOTICIA = [
  { id: "logro", nombre: "Logro", emoji: "🏆" },
  { id: "noticia", nombre: "Noticia", emoji: "📰" },
  { id: "comunicado", nombre: "Comunicado", emoji: "📣" },
  { id: "benefica", nombre: "Causa benéfica", emoji: "💚" },
] as const;
export type CategoriaNoticia = (typeof CATEGORIAS_NOTICIA)[number]["id"];
export const categoriaNoticia = (id: string) => CATEGORIAS_NOTICIA.find((c) => c.id === id) ?? CATEGORIAS_NOTICIA[1];
