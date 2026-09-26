CREATE TABLE "form_formularios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"titulo" text NOT NULL,
	"marca" text DEFAULT 'level_up' NOT NULL,
	"apariencia" jsonb NOT NULL,
	"config" jsonb NOT NULL,
	"accion" text DEFAULT 'ninguna' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"archivado" boolean DEFAULT false NOT NULL,
	"creado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_respuestas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"formulario_id" uuid NOT NULL,
	"token" text NOT NULL,
	"respuestas" jsonb NOT NULL,
	"preguntas" jsonb NOT NULL,
	"resultado" text,
	"origen" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "form_formularios" ADD CONSTRAINT "form_formularios_creado_por_pulse_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_respuestas" ADD CONSTRAINT "form_respuestas_formulario_id_form_formularios_id_fk" FOREIGN KEY ("formulario_id") REFERENCES "public"."form_formularios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "form_formularios_slug" ON "form_formularios" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "form_respuestas_token" ON "form_respuestas" USING btree ("formulario_id","token");--> statement-breakpoint
CREATE INDEX "form_respuestas_form" ON "form_respuestas" USING btree ("formulario_id","created_at");