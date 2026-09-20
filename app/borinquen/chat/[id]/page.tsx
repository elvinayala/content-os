import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";

import { leerAsistenteChat } from "@/lib/chat/store";
import { entrenamientoCompleto } from "@/lib/borinquen/entrenar";
import { ChatAcciones } from "@/components/borinquen/chat-acciones";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function AsistenteChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = await leerAsistenteChat(id);
  if (!a) notFound();

  const ent = a.entrenamiento;
  const prog = entrenamientoCompleto(ent);

  return (
    <>
      <PageHeader titulo={a.nombre} descripcion={a.proposito}>
        <Badge variant="outline" className="label-mono capitalize">
          {a.canales.join(" · ")}
        </Badge>
        <ChatAcciones id={a.id} estado={a.estado} />
      </PageHeader>

      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Link
          href="/borinquen/chat"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="size-4" /> Asistentes de Chat
        </Link>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Dato label="Estado" valor={a.estado} />
          <Dato label="Chats" valor={String(a.metricas?.chats ?? 0)} />
          <Dato
            label="Resueltos"
            valor={a.metricas?.resueltosPct != null ? `${a.metricas.resueltosPct}%` : "—"}
          />
          <Dato label="Leads" valor={String(a.metricas?.leads ?? 0)} />
        </div>

        <Tabs defaultValue="entrenamiento">
          <TabsList>
            <TabsTrigger value="entrenamiento">Entrenamiento</TabsTrigger>
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="metricas">Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="entrenamiento" className="mt-4 space-y-4">
            <Card className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="label-mono text-muted-foreground">
                    Info del negocio
                  </h3>
                  <Badge variant="outline" className="label-mono">
                    {prog.campos}/{prog.total} campos
                    {prog.tieneConversaciones ? " + convos" : ""}
                  </Badge>
                </div>
                {ent ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Fila k="Rubro" v={ent.nicho || "—"} />
                    <Fila k="Público" v={ent.publico || "—"} />
                    <Fila k="Ofrece" v={ent.oferta || "—"} />
                    <Fila k="Tono" v={ent.tono || "—"} />
                    <Fila k="Meta" v={ent.cta || "—"} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este asistente todavía no tiene datos de entrenamiento.
                  </p>
                )}
              </CardContent>
            </Card>
            {ent?.conversaciones ? (
              <Card className="bg-gradient-to-b from-card to-background/40">
                <CardContent className="p-5">
                  <h3 className="label-mono mb-2 text-muted-foreground">
                    Conversaciones de entrenamiento
                  </h3>
                  <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                    {ent.conversaciones}
                  </pre>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          <TabsContent value="prompt" className="mt-4">
            <Card className="bg-gradient-to-b from-card to-background/40">
              <CardContent className="p-5">
                <h3 className="label-mono mb-2 text-muted-foreground">
                  Prompt del sistema (entrenado)
                </h3>
                <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                  {a.promptSistema}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metricas" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Dato label="Chats" valor={String(a.metricas?.chats ?? 0)} />
              <Dato
                label="Resolución"
                valor={a.metricas?.resueltosPct != null ? `${a.metricas.resueltosPct}%` : "—"}
              />
              <Dato label="Leads capturados" valor={String(a.metricas?.leads ?? 0)} />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <Card className="bg-gradient-to-b from-card to-background/40">
      <CardContent className="p-4">
        <p className="label-mono text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono text-lg font-semibold capitalize">{valor}</p>
      </CardContent>
    </Card>
  );
}

function Fila({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
