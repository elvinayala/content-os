CREATE TABLE "desempeno_google" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"refresh_cifrado" text NOT NULL,
	"conectado_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_google" ADD CONSTRAINT "desempeno_google_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
SELECT pulse_papelera_proteger();
