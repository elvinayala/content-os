CREATE TABLE "desempeno_presencia" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"lugar" text NOT NULL,
	"visto_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_presencia" ADD CONSTRAINT "desempeno_presencia_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
SELECT pulse_papelera_proteger();
