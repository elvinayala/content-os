CREATE TABLE "leads_numeros_equipo" (
	"telefono" text PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"agregado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads_numeros_equipo" ADD CONSTRAINT "leads_numeros_equipo_agregado_por_pulse_users_id_fk" FOREIGN KEY ("agregado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;