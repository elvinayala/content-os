CREATE TABLE "desempeno_bienestar_comentarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_posts" ADD COLUMN "tipo" text DEFAULT 'mensaje' NOT NULL;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_posts" ADD COLUMN "para_user_id" uuid;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_posts" ADD COLUMN "clave" text;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_comentarios" ADD CONSTRAINT "desempeno_bienestar_comentarios_post_id_desempeno_bienestar_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."desempeno_bienestar_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_comentarios" ADD CONSTRAINT "desempeno_bienestar_comentarios_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_bienestar_comentarios_post" ON "desempeno_bienestar_comentarios" USING btree ("post_id","created_at");--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_posts" ADD CONSTRAINT "desempeno_bienestar_posts_para_user_id_pulse_users_id_fk" FOREIGN KEY ("para_user_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_bienestar_posts_clave" ON "desempeno_bienestar_posts" USING btree ("clave");