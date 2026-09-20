import { Plus, Table2 } from "lucide-react";
import Link from "next/link";

import { crearBoardAction } from "@/app/pulse/(app)/actions";
import { ColorPicker } from "@/components/pulse/color-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cssColor } from "@/lib/pulse/colores";
import { usuarioActual } from "@/lib/pulse/auth";
import { listarBoards } from "@/lib/pulse/repo";

export default async function PulseHome() {
  const [boards, usuario] = await Promise.all([listarBoards(), usuarioActual()]);
  return (
    <>
      <header className="flex h-14 items-center gap-3 border-b px-4">
        <SidebarTrigger />
        <h1 className="text-lg font-semibold">Tableros</h1>
        <span className="text-sm text-muted-foreground">Hola, {usuario?.nombre.split(" ")[0]}</span>
        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus /> Nuevo tablero
              </Button>
            </DialogTrigger>
            <DialogContent className="pulse">
              <DialogHeader>
                <DialogTitle>Nuevo tablero</DialogTitle>
              </DialogHeader>
              <form action={crearBoardAction} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input id="nombre" name="nombre" placeholder="Ej: Clientes Shadow Operator" autoFocus required />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Color</Label>
                  <ColorPicker name="color" defaultValue="bright_blue" />
                </div>
                <Button type="submit">Crear</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>
      <main className="grid gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {boards.map((b) => (
          <Link key={b.id} href={`/pulse/${b.slug}`} className="group">
            <Card className="h-full transition-shadow group-hover:shadow-md">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: cssColor(b.color) }}>
                  <Table2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{b.nombre}</h2>
                  <p className="text-sm text-muted-foreground">
                    {b.items} elemento{b.items === 1 ? "" : "s"}
                  </p>
                  {b.descripcion ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{b.descripcion}</p> : null}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {boards.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">Todavía no hay tableros. Creá el primero con "Nuevo tablero".</p>
        ) : null}
      </main>
    </>
  );
}
