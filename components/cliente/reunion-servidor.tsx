import { ReunionEstrategia } from "@/components/cliente/reunion";
import { altoValorCliente, reunionDelMes } from "@/lib/clientes-app/reunion";

/** Solo para quien tiene derecho (pagó $3,000+ o está marcado "Alto"); a los demás no se les muestra nada. */
export async function ReunionDelCliente({ itemId, preview }: { itemId: string; preview: boolean }) {
  if (!(await altoValorCliente(itemId).catch(() => false))) return null;
  const r = await reunionDelMes(itemId).catch(() => null);
  return <ReunionEstrategia reunion={r} preview={preview} />;
}
