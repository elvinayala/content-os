CREATE TABLE "desempeno_agentes_reportes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agente" text NOT NULL,
	"fecha" text NOT NULL,
	"resumen" text,
	"tareas" integer,
	"entregables" jsonb,
	"bloqueos" text,
	"corridas" integer DEFAULT 0 NOT NULL,
	"minutos" double precision DEFAULT 0 NOT NULL,
	"costo_usd" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_agentes_reportes_dia" ON "desempeno_agentes_reportes" USING btree ("agente","fecha");