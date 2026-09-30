CREATE TABLE "desempeno_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"app" text DEFAULT 'ritmo' NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"dispositivo" text,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_ok_at" timestamp with time zone,
	"fallos" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_push" ADD CONSTRAINT "desempeno_push_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_push_endpoint" ON "desempeno_push" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "desempeno_push_user" ON "desempeno_push" USING btree ("user_id","app");--> statement-breakpoint
SELECT pulse_papelera_proteger();
