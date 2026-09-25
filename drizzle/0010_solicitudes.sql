CREATE TABLE "desempeno_solicitudes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"desde" text,
	"hasta" text,
	"dias" double precision,
	"detalle" text NOT NULL,
	"estado" text NOT NULL,
	"supervisor_id" uuid,
	"supervisor_at" timestamp with time zone,
	"supervisor_nota" text,
	"rrhh_id" uuid,
	"rrhh_at" timestamp with time zone,
	"rrhh_nota" text,
	"ausencia_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_solicitudes" ADD CONSTRAINT "desempeno_solicitudes_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_solicitudes" ADD CONSTRAINT "desempeno_solicitudes_supervisor_id_pulse_users_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_solicitudes" ADD CONSTRAINT "desempeno_solicitudes_rrhh_id_pulse_users_id_fk" FOREIGN KEY ("rrhh_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_solicitudes_estado" ON "desempeno_solicitudes" USING btree ("estado","created_at");--> statement-breakpoint
CREATE INDEX "desempeno_solicitudes_user" ON "desempeno_solicitudes" USING btree ("user_id");