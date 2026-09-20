import { PageHeader } from "@/components/page-header";
import { SparringSala } from "@/components/ceo/sparring-sala";

export const metadata = { title: "Práctica de ventas · CEO Command Center" };

// Sala de sparring: los setters y closers practican objeciones por voz contra
// un cliente difícil (IA) y reciben una calificación contra el framework de
// Joe Lajara (vault/mentorias/joe-lajara-ventas.md).
export default function PracticaPage() {
  return (
    <>
      <PageHeader
        titulo="Práctica de ventas"
        descripcion="Role play por voz contra un cliente difícil. Al colgar, te califica con el framework de Joe."
      />
      <main className="flex-1 p-4 sm:p-6">
        <SparringSala />
      </main>
    </>
  );
}
