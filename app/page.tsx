import { redirect } from "next/navigation";

// El dashboard principal es el CEO Command Center.
// El tablero de contenido vive en /tablero (se llega desde el tab Content).
export default function Root() {
  redirect("/ceo");
}
