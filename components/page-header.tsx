import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  titulo: string;
  descripcion?: string;
  children?: React.ReactNode; // acciones a la derecha
}

export function PageHeader({ titulo, descripcion, children }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">{titulo}</h1>
          {descripcion ? (
            <p className="text-sm text-muted-foreground">{descripcion}</p>
          ) : null}
        </div>
        {children ? (
          <div className="flex items-center gap-2">{children}</div>
        ) : null}
      </div>
    </header>
  );
}
