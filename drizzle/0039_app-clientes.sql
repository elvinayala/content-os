CREATE TABLE "pulse_app_clientes" (
	"item_id" uuid PRIMARY KEY NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"slack_url" text,
	"creado_por" uuid,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_acceso_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "pulse_app_push" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"dispositivo" text,
	"creado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_ok_at" timestamp with time zone,
	"fallos" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pulse_app_clientes" ADD CONSTRAINT "pulse_app_clientes_item_id_pulse_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pulse_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_app_clientes" ADD CONSTRAINT "pulse_app_clientes_creado_por_pulse_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_app_push" ADD CONSTRAINT "pulse_app_push_item_id_pulse_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pulse_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_app_push_endpoint" ON "pulse_app_push" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "pulse_app_push_item" ON "pulse_app_push" USING btree ("item_id");--> statement-breakpoint
SELECT pulse_papelera_proteger();
