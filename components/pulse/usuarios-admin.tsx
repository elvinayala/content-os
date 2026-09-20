"use client";

import { KeyRound, Plus, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { actualizarUsuarioAction, crearUsuarioAction } from "@/app/pulse/(app)/configuracion/actions";
import { ColorPicker } from "@/components/pulse/color-picker";
import { UserAvatar } from "@/components/pulse/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NOMBRE_ROL, type RolUsuario, type UsuarioPulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function UsuariosAdmin({ usuarios, yo }: { usuarios: UsuarioPulse[]; yo: UsuarioPulse }) {
  const [abierto, setAbierto] = useState(false);
  const [claveDe, setClaveDe] = useState<UsuarioPulse | null>(null);
  const [clave, setClave] = useState("");

  const aviso = (r: { ok: true } | { ok: false; error: string }, okMsg: string) => {
    if (r.ok) toast.success(okMsg, { className: "pulse" });
    else toast.error(r.error, { className: "pulse" });
  };

  const activos = usuarios.filter((u) => u.activo);
  const inactivos = usuarios.filter((u) => !u.activo);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Usuarios</h2>
          <p className="text-sm text-muted-foreground">Quiénes pueden entrar a Pulse y aparecer en las columnas de Personas. Los importados de Monday no tienen clave: para que entren, tocá "Poner clave". Roles: <b>Miembro</b> usa y edita los tableros · <b>Editor</b> además agrega gente y claves · <b>Admin</b> todo, incluso eliminar tableros.</p>
        </div>
        <Dialog open={abierto} onOpenChange={setAbierto}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus /> Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="pulse">
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
            </DialogHeader>
            <form
              className="flex flex-col gap-3"
              action={async (fd) => {
                const r = await crearUsuarioAction(fd);
                aviso(r, "Usuario creado");
                if (r.ok) setAbierto(false);
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" name="nombre" required autoFocus />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Clave (mín. 6)</Label>
                <Input id="password" name="password" type="text" required minLength={6} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Rol</Label>
                <select name="rol" className="h-9 rounded-md border bg-background px-2 text-sm" defaultValue="miembro">
                  <option value="miembro">Miembro (usa y edita los tableros)</option>
                  <option value="editor">Editor (además da de alta gente y claves)</option>
                  {yo.rol === "admin" ? <option value="admin">Admin (todo, incluso eliminar tableros)</option> : null}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Color del avatar</Label>
                <ColorPicker name="color" defaultValue="blue" />
              </div>
              <Button type="submit">Crear</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Lista titulo={`Activos (${activos.length})`} usuarios={activos} yo={yo} onClave={setClaveDe} aviso={aviso} />
      {inactivos.length ? <Lista titulo={`Inactivos / sin clave (${inactivos.length})`} usuarios={inactivos} yo={yo} onClave={setClaveDe} aviso={aviso} /> : null}

      <Dialog open={!!claveDe} onOpenChange={(o) => !o && setClaveDe(null)}>
        <DialogContent className="pulse">
          <DialogHeader>
            <DialogTitle>Nueva clave para {claveDe?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Input type="text" placeholder="Clave (mín. 6)" value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
            <p className="text-xs text-muted-foreground">Al guardar, el usuario queda activo y puede entrar con su e-mail ({claveDe?.email}) y esta clave. Pasásela por un canal seguro.</p>
            <Button
              onClick={async () => {
                if (!claveDe) return;
                const r = await actualizarUsuarioAction({ id: claveDe.id, password: clave });
                aviso(r, "Clave guardada");
                if (r.ok) {
                  setClaveDe(null);
                  setClave("");
                }
              }}
            >
              Guardar clave
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Lista({ titulo, usuarios, yo, onClave, aviso }: { titulo: string; usuarios: UsuarioPulse[]; yo: UsuarioPulse; onClave: (u: UsuarioPulse) => void; aviso: (r: { ok: true } | { ok: false; error: string }, m: string) => void }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</h3>
      <div className="divide-y rounded-lg border">
        {usuarios.map((u) => (
          <div key={u.id} className={cn("flex flex-wrap items-center gap-3 px-3 py-2", !u.activo && "opacity-70")}>
            <UserAvatar nombre={u.nombre} color={u.color} className="size-8 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {u.nombre} {u.id === yo.id ? <span className="text-xs text-muted-foreground">(vos)</span> : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {u.email} · {NOMBRE_ROL[u.rol]} {!u.tieneClave ? "· sin clave" : ""}
              </p>
            </div>
            <select
              value={u.rol}
              disabled={u.id === yo.id || (yo.rol !== "admin" && u.rol === "admin")}
              onChange={async (e) => aviso(await actualizarUsuarioAction({ id: u.id, rol: e.target.value as RolUsuario }), "Rol actualizado")}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="miembro">Miembro</option>
              <option value="editor">Editor</option>
              {yo.rol === "admin" || u.rol === "admin" ? <option value="admin">Admin</option> : null}
            </select>
            <Button variant="outline" size="sm" disabled={yo.rol !== "admin" && u.rol === "admin" && u.id !== yo.id} onClick={() => onClave(u)}>
              <KeyRound /> {u.tieneClave ? "Cambiar clave" : "Poner clave"}
            </Button>
            {u.id !== yo.id && !(yo.rol !== "admin" && u.rol === "admin") ? (
              <Button variant="ghost" size="sm" onClick={async () => aviso(await actualizarUsuarioAction({ id: u.id, activo: !u.activo }), u.activo ? "Usuario desactivado" : "Usuario activado")}>
                {u.activo ? (
                  <>
                    <UserX /> Desactivar
                  </>
                ) : (
                  <>
                    <UserCheck /> Activar
                  </>
                )}
              </Button>
            ) : null}
          </div>
        ))}
        {usuarios.length === 0 ? <p className="px-3 py-4 text-sm text-muted-foreground">Nadie por acá.</p> : null}
      </div>
    </section>
  );
}
