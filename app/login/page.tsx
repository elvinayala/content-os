import { Hexagon } from "lucide-react";

import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Entrar · CEO Command Center" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; desde?: string }>;
}) {
  const { error, desde } = await searchParams;

  return (
    <div className="ceo flex min-h-svh w-full items-center justify-center bg-background p-4 text-foreground">
      <Card className="glow w-full max-w-sm border-primary/30 bg-gradient-to-b from-card to-background/60">
        <CardContent className="flex flex-col gap-5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Hexagon className="size-5" />
            </div>
            <div className="leading-tight">
              <h1 className="font-semibold">CEO Command Center</h1>
              <p className="label-mono text-muted-foreground">
                Acceso privado
              </p>
            </div>
          </div>

          <form action={loginAction} className="flex flex-col gap-3">
            <input type="hidden" name="desde" value={desde ?? ""} />
            <Input
              type="password"
              name="password"
              placeholder="Contraseña"
              autoFocus
              required
            />
            {error ? (
              <p className="text-sm text-destructive">
                Contraseña incorrecta. Probá de nuevo.
              </p>
            ) : null}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
