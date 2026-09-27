CREATE TABLE "desempeno_bienestar" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"tipo" text NOT NULL,
	"minutos" integer DEFAULT 0 NOT NULL,
	"actividad" text,
	"valor" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_bienestar" ADD CONSTRAINT "desempeno_bienestar_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_bienestar_dia" ON "desempeno_bienestar" USING btree ("user_id","fecha","tipo");--> statement-breakpoint
CREATE INDEX "desempeno_bienestar_fecha" ON "desempeno_bienestar" USING btree ("fecha");