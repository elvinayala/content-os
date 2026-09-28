CREATE TABLE "leads_exportaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"marca" text NOT NULL,
	"filtro" jsonb NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"decidida_por" uuid,
	"decidida_at" timestamp with time zone,
	"expira_at" timestamp with time zone,
	"descargada_at" timestamp with time zone,
	"filas" integer,
	"nota" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads_exportaciones" ADD CONSTRAINT "leads_exportaciones_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_exportaciones" ADD CONSTRAINT "leads_exportaciones_decidida_por_pulse_users_id_fk" FOREIGN KEY ("decidida_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "leads_exportaciones_estado" ON "leads_exportaciones" USING btree ("estado","created_at");--> statement-breakpoint
CREATE INDEX "leads_exportaciones_user" ON "leads_exportaciones" USING btree ("user_id","created_at");