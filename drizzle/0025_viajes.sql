CREATE TABLE "desempeno_viaje_anual" (
	"anio" integer PRIMARY KEY NOT NULL,
	"premio" text NOT NULL,
	"tope_usd" double precision,
	"anuncio" text NOT NULL,
	"ganador_id" uuid,
	"anunciado_at" timestamp with time zone,
	"nota" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_viajes_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"destino" text NOT NULL,
	"desde" text,
	"hasta" text,
	"presupuesto_usd" double precision,
	"notas" text,
	"solicitud_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_viaje_anual" ADD CONSTRAINT "desempeno_viaje_anual_ganador_id_pulse_users_id_fk" FOREIGN KEY ("ganador_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_viajes_plan" ADD CONSTRAINT "desempeno_viajes_plan_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_viajes_plan_user" ON "desempeno_viajes_plan" USING btree ("user_id");