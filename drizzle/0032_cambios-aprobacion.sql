CREATE TABLE "desempeno_cambios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"cambios" jsonb NOT NULL,
	"datos" jsonb,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"propuesto_por" uuid,
	"decidido_por" uuid,
	"decidido_at" timestamp with time zone,
	"nota" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_cambios" ADD CONSTRAINT "desempeno_cambios_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_cambios" ADD CONSTRAINT "desempeno_cambios_propuesto_por_pulse_users_id_fk" FOREIGN KEY ("propuesto_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_cambios" ADD CONSTRAINT "desempeno_cambios_decidido_por_pulse_users_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_cambios_estado" ON "desempeno_cambios" USING btree ("estado","created_at");--> statement-breakpoint
CREATE INDEX "desempeno_cambios_user" ON "desempeno_cambios" USING btree ("user_id","tipo","estado");