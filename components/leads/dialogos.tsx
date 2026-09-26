"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { cerrarLeadAction, crearEmbudoAction, crearLeadAction, guardarEmbudoAction } from "@/app/pulse/(app)/leads/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOTIVOS_PERDIDA, slugDeMarca, type Marca } from "@/lib/leads/reglas";

export interface EtapaUI {
  id: string;
  nombre: string;
}
export interface EmbudoUI {
  id: string;
  nombre: string;
  diasEstancado: number;
}
export interface UsuarioUI {
  id: string;
  nombre: string;
  color: string | null;
}

const selectCls = "h-9 w-full rounded-md border bg-background px-2 text-sm";

export function NuevoLeadDialog({
  abierto,
  onCerrar,
  marca,
  embudo,
  etapas,
  etapaInicial,
  usuarios,
  yoId,
}: {
  abierto: boolean;
  onCerrar: () => void;
  marca: Marca;
  embudo: EmbudoUI;
  etapas: EtapaUI[];
  etapaInicial?: string;
  usuarios: UsuarioUI[];
  yoId: string;
}) {
  const router = useRouter();
  const [pend, start] = useTransition();
  const [f, setF] = useState({ nombre: "", negocio: "", telefono: "", email: "", valor: "", etapaId: etapaInicial ?? etapas[0]?.id ?? "", duenoId: yoId });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const guardar = () =>
    start(async () => {
      const r = await crearLeadAction({ marca, embudoId: embudo.id, etapaId: f.etapaId, nombre: f.nombre, negocio: f.negocio, telefono: f.telefono, email: f.email, valor: Number(f.valor) || 0, duenoId: f.duenoId || null });
      if (!r.ok && r.id) {
        toast.info(r.error);
        onCerrar();
        return void router.push(`/pulse/leads/${slugDeMarca(marca)}/${r.id}`);
      }
      if (!r.ok) return void toast.error(r.error);
      toast.success("Lead creado");
      onCerrar();
      setF({ ...f, nombre: "", negocio: "", telefono: "", email: "", valor: "" });
      router.refresh();
    });
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="pulse sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo lead · {embudo.nombre}</DialogTitle>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            guardar();
          }}
        >
          <div className="grid gap-1.5">
            <Label>Nombre de la persona *</Label>
            <Input autoFocus value={f.nombre} onChange={set("nombre")} placeholder="María Rivera" />
          </div>
          <div className="grid gap-1.5">
            <Label>Negocio</Label>
            <Input value={f.negocio} onChange={set("negocio")} placeholder="Clínica Dental Sonrisa" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>WhatsApp / teléfono</Label>
              <Input value={f.telefono} onChange={set("telefono")} placeholder="787 555 1234" inputMode="tel" />
            </div>
            <div className="grid gap-1.5">
              <Label>Valor (USD)</Label>
              <Input value={f.valor} onChange={set("valor")} placeholder="0" inputMode="numeric" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input value={f.email} onChange={set("email")} placeholder="correo@negocio.com" type="email" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Etapa</Label>
              <select className={selectCls} value={f.etapaId} onChange={set("etapaId")}>
                {etapas.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label>Dueño</Label>
              <select className={selectCls} value={f.duenoId} onChange={set("duenoId")}>
                <option value="">Sin asignar</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="ghost" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pend || !f.nombre.trim()} className="bg-[#08a742] text-white hover:bg-[#07923a]">
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PerdidoDialog({ tratoId, nombre, onCerrar, onHecho }: { tratoId: string | null; nombre: string; onCerrar: () => void; onHecho: () => void }) {
  const [motivo, setMotivo] = useState<string>("");
  const [otro, setOtro] = useState("");
  const [pend, start] = useTransition();
  const guardar = () =>
    start(async () => {
      if (!tratoId) return;
      const r = await cerrarLeadAction(tratoId, "perdido", motivo === "Otro" ? otro || "Otro" : motivo);
      if (!r.ok) return void toast.error(r.error);
      toast("Marcado como perdido");
      setMotivo("");
      setOtro("");
      onHecho();
    });
  return (
    <Dialog open={!!tratoId} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="pulse sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Marcar como perdido</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{nombre}</p>
        <div className="grid gap-2">
          {MOTIVOS_PERDIDA.map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm has-[:checked]:border-red-400 has-[:checked]:bg-red-50">
              <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} />
              {m}
            </label>
          ))}
          {motivo === "Otro" && <Input autoFocus value={otro} onChange={(e) => setOtro(e.target.value)} placeholder="¿Qué pasó?" />}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={pend || !motivo} onClick={guardar} className="bg-red-600 text-white hover:bg-red-700">
            Perdido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Editar el embudo: nombre, días para "estancado" y etapas (renombrar, agregar, subir/bajar, borrar vacías). */
export function EmbudoDialog({ abierto, onCerrar, embudo, etapas }: { abierto: boolean; onCerrar: () => void; embudo: EmbudoUI; etapas: EtapaUI[] }) {
  const router = useRouter();
  const [nombre, setNombre] = useState(embudo.nombre);
  const [dias, setDias] = useState(String(embudo.diasEstancado));
  const [lista, setLista] = useState<{ id?: string; nombre: string }[]>(etapas.map((e) => ({ id: e.id, nombre: e.nombre })));
  const [pend, start] = useTransition();
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= lista.length) return;
    const c = [...lista];
    [c[i], c[j]] = [c[j], c[i]];
    setLista(c);
  };
  const guardar = () =>
    start(async () => {
      const r = await guardarEmbudoAction(embudo.id, { nombre, diasEstancado: Number(dias) || 0, etapas: lista });
      if (!r.ok) return void toast.error(r.error);
      toast.success("Embudo guardado");
      onCerrar();
      router.refresh();
    });
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="pulse sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar embudo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="grid gap-1.5">
              <Label>Nombre</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label title="Días sin moverse para marcarlo en rojo">Estancado a los</Label>
              <Input value={dias} onChange={(e) => setDias(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <Label>Etapas</Label>
          <div className="grid max-h-80 gap-1.5 overflow-y-auto pr-1">
            {lista.map((e, i) => (
              <div key={e.id ?? `n${i}`} className="flex items-center gap-1">
                <Input value={e.nombre} onChange={(ev) => setLista(lista.map((x, k) => (k === i ? { ...x, nombre: ev.target.value } : x)))} />
                <Button size="icon" variant="ghost" onClick={() => mover(i, -1)} aria-label="Subir">
                  <ArrowUp className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => mover(i, 1)} aria-label="Bajar">
                  <ArrowDown className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setLista(lista.filter((_, k) => k !== i))} aria-label="Quitar">
                  <Trash2 className="size-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setLista([...lista, { nombre: "Nueva etapa" }])}>
            <Plus className="size-4" /> Etapa
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={pend} onClick={guardar}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NuevoEmbudoDialog({ abierto, onCerrar, marca, onCreado }: { abierto: boolean; onCerrar: () => void; marca: Marca; onCreado: (id: string) => void }) {
  const [nombre, setNombre] = useState("");
  const [etapas, setEtapas] = useState("Nuevo lead\nContactado\nCita agendada\nSeguimiento");
  const [pend, start] = useTransition();
  const crear = () =>
    start(async () => {
      const r = await crearEmbudoAction(marca, nombre, etapas.split("\n"));
      if (!r.ok || !r.id) return void toast.error(r.error);
      toast.success("Embudo creado");
      onCerrar();
      onCreado(r.id);
    });
  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="pulse sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nuevo embudo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Nombre</Label>
            <Input autoFocus value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Clase de Frankie · octubre" />
          </div>
          <div className="grid gap-1.5">
            <Label>Etapas (una por línea)</Label>
            <textarea className="min-h-32 rounded-md border bg-background p-2 text-sm" value={etapas} onChange={(e) => setEtapas(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button disabled={pend || !nombre.trim()} onClick={crear}>
            Crear
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
