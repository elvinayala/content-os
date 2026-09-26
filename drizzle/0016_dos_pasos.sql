CREATE TABLE "desempeno_dos_pasos" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"secreto_cifrado" text NOT NULL,
	"activado_at" timestamp with time zone,
	"ultimo_contador" integer DEFAULT -1 NOT NULL,
	"intentos_fallidos" integer DEFAULT 0 NOT NULL,
	"bloqueado_hasta" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_dos_pasos" ADD CONSTRAINT "desempeno_dos_pasos_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;