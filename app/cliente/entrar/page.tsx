import { redirect } from "next/navigation";

// El link personal lo resuelve el proxy (?k=). Si alguien llega aquí sin link, va a la app o al candado.
export default function Entrar() {
  redirect("/cliente");
}
