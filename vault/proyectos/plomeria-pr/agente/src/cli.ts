/** Chat local en la terminal para probar el agente sin WhatsApp: `npm run chat` */
import readline from "node:readline";
import { almacen } from "./almacen.js";
import { responder } from "./agente.js";

const contacto = almacen.obtenerOCrearContacto("web", "cli-" + (process.argv[2] ?? "prueba"));
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
console.log("Resuelto · chat de prueba. Escribe como un cliente o como un plomero. Ctrl+C para salir.\n");
const pregunta = () => rl.question("tú > ", async (t) => {
  try { for (const r of await responder(contacto, { texto: t })) console.log("\nresuelto > " + r + "\n"); }
  catch (e) { console.error(e); }
  pregunta();
});
pregunta();
