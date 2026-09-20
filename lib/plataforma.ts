import type { Plataforma } from "@/lib/types";

// Abreviatura y estilo por plataforma (usado en chips e íconos del calendario).
export const plataformaMeta: Record<
  Plataforma,
  { abrev: string; clase: string }
> = {
  Instagram: { abrev: "IG", clase: "bg-pink-500/15 text-pink-300 border-pink-500/30" },
  TikTok: { abrev: "TT", clase: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  YouTube: { abrev: "YT", clase: "bg-red-500/15 text-red-300 border-red-500/30" },
  X: { abrev: "X", clase: "bg-zinc-400/15 text-zinc-300 border-zinc-400/30" },
  LinkedIn: { abrev: "IN", clase: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
};
