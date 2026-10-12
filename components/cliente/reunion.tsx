"use client";

import { CalendarCheck, CalendarPlus, Loader2, Video } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { pedirReunionAction } from "@/app/cliente/actions";
import type { Reunion } from "@/lib/clientes-app/reunion";
import { HORAS, textoHorario } from "@/lib/clientes-app/reunion-reglas";

const etiquetaHora = (h: string) => {
  const [hh, mm] = h.split(":").map(Number);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, "0")} ${hh < 12 ? "AM" : "PM"}`;
};
const enDias = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
};
const campo = "h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary";

// Reunión de estrategia mensual. Solo se dibuja para quien tiene derecho (lo decide el servidor); el texto nunca dice por qué.
export function ReunionEstrategia({ reunion, preview }: { reunion: Reunion | null; preview?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [ops, setOps] = useState([{ fecha: "", hora: "10:00" }, { fecha: "", hora: "14:00" }, { fecha: "", hora: "" }]);
  const [tema, setTema] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (reunion?.estado === "agendada" && reunion.agendadaPara) {
    const d = new Date(reunion.agendadaPara);
    const fecha = d.toLocaleDateString("en-CA", { timeZone: "America/Puerto_Rico" });
    const hora = d.toLocaleTimeString("en-GB", { timeZone: "America/Puerto_Rico", hour: "2-digit", minute: "2-digit" });
    return (
      <div className="panel flex items-center gap-3 border-primary/40 p-4">
        <CalendarCheck className="size-6 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="ceja">Tu reunión de estrategia</p>
          <p className="text-sm font-medium first-letter:uppercase">{textoHorario({ fecha, hora })}</p>
        </div>
        {reunion.enlace ? (
          <a href={reunion.enlace} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground">
            <Video className="size-3.5" /> Unirme
          </a>
        ) : null}
      </div>
    );
  }
  if (reunion?.estado === "pedida")
    return (
      <div className="panel flex flex-col gap-1.5 p-4">
        <p className="ceja">Reunión de estrategia · solicitada ✓</p>
        <p className="text-sm">Tu equipo te va a confirmar el día y la hora. Propusiste:</p>
        <ul className="text-xs text-muted-foreground">
          {reunion.opciones.map((o) => (
            <li key={`${o.fecha}${o.hora}`} className="first-letter:uppercase">
              · {textoHorario(o)}
            </li>
          ))}
        </ul>
      </div>
    );

  const enviar = async () => {
    setEnviando(true);
    const r = await pedirReunionAction({ opciones: ops.filter((o) => o.fecha), tema });
    setEnviando(false);
    if (!r.ok) return toast.error(r.error, { className: "lu-app" });
    toast.success("¡Listo! Tu equipo te confirma el día y la hora.", { className: "lu-app" });
  };

  return (
    <div className="panel flex flex-col gap-3 p-4">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/25">
          <CalendarPlus className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Reunión de estrategia del mes</p>
          <p className="text-[12px] text-muted-foreground">Revisa con tu equipo tus resultados y los próximos pasos.</p>
        </div>
        {!abierto ? (
          <button onClick={() => setAbierto(true)} disabled={preview} className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50">
            Pedir
          </button>
        ) : null}
      </div>
      {abierto ? (
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-muted-foreground">¿Cuándo te funciona? Danos hasta 3 opciones (lunes a viernes, hora de PR).</p>
          {ops.map((o, i) => (
            <div key={i} className="grid grid-cols-[1fr_auto] gap-2">
              <input type="date" className={campo} min={enDias(1)} max={enDias(21)} value={o.fecha} onChange={(e) => setOps(ops.map((x, j) => (j === i ? { ...x, fecha: e.target.value } : x)))} />
              <select className={campo} value={o.hora} onChange={(e) => setOps(ops.map((x, j) => (j === i ? { ...x, hora: e.target.value } : x)))}>
                <option value="">Hora</option>
                {HORAS.map((h) => (
                  <option key={h} value={h}>
                    {etiquetaHora(h)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <textarea className={`${campo} h-20 py-2.5`} maxLength={400} placeholder="¿Qué quieres revisar? (opcional)" value={tema} onChange={(e) => setTema(e.target.value)} />
          <button onClick={enviar} disabled={enviando || !ops.some((o) => o.fecha && o.hora)} className="flex h-11 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {enviando ? <Loader2 className="size-4 animate-spin" /> : null} Pedir mi reunión
          </button>
        </div>
      ) : null}
    </div>
  );
}
