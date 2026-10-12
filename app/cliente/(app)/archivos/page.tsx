import { redirect } from "next/navigation";

// Archivos se volvió parte de "Trabajo" (30/sep): los links y avisos viejos siguen llegando bien.
export default function Archivos() {
  redirect("/cliente/trabajo");
}
