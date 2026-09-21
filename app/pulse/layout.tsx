import type { Metadata } from "next";

import { NOMBRE_APP, SUBTITULO_APP } from "@/lib/pulse/types";

export const metadata: Metadata = {
  title: `${NOMBRE_APP} · ${SUBTITULO_APP}`,
  description: "CRM de clientes · EA Market LLC",
};

// La clase .pulse scopea el tema claro (app/globals.css). El shell con sidebar vive en
// (app)/layout.tsx para que /pulse/login quede afuera.
export default function PulseLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="pulse min-h-svh w-full bg-background text-foreground">{children}</div>;
}
