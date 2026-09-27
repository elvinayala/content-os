CREATE TABLE "desempeno_noticias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"categoria" text NOT NULL,
	"titulo" text NOT NULL,
	"cuerpo" text NOT NULL,
	"persona_id" uuid,
	"enlace" text,
	"fijada" boolean DEFAULT false NOT NULL,
	"autor_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_noticias" ADD CONSTRAINT "desempeno_noticias_persona_id_pulse_users_id_fk" FOREIGN KEY ("persona_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_noticias" ADD CONSTRAINT "desempeno_noticias_autor_id_pulse_users_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;