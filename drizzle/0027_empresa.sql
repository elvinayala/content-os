CREATE TABLE "desempeno_empresa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seccion" text NOT NULL,
	"titulo" text NOT NULL,
	"cuerpo" text DEFAULT '' NOT NULL,
	"url" text,
	"empresa" text DEFAULT 'todas' NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"publicado" boolean DEFAULT true NOT NULL,
	"clave" text,
	"actualizado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_empresa" ADD CONSTRAINT "desempeno_empresa_actualizado_por_pulse_users_id_fk" FOREIGN KEY ("actualizado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_empresa_seccion" ON "desempeno_empresa" USING btree ("seccion","orden");--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_empresa_clave" ON "desempeno_empresa" USING btree ("clave");