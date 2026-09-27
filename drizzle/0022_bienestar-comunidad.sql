CREATE TABLE "desempeno_bienestar_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_bienestar_reacciones" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	CONSTRAINT "desempeno_bienestar_reacciones_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "desempeno_bienestar_social" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"visible" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_posts" ADD CONSTRAINT "desempeno_bienestar_posts_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_reacciones" ADD CONSTRAINT "desempeno_bienestar_reacciones_post_id_desempeno_bienestar_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."desempeno_bienestar_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_reacciones" ADD CONSTRAINT "desempeno_bienestar_reacciones_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_bienestar_social" ADD CONSTRAINT "desempeno_bienestar_social_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_bienestar_posts_fecha" ON "desempeno_bienestar_posts" USING btree ("created_at");