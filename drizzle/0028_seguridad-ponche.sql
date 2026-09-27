CREATE TABLE "desempeno_dispositivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"token_hash" text NOT NULL,
	"huella" text,
	"agente" text,
	"ips" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"ip_pendiente" text,
	"ultima_ip" text,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"motivo" text,
	"reemplaza" boolean DEFAULT false NOT NULL,
	"decidido_por" uuid,
	"decidido_at" timestamp with time zone,
	"ultimo_uso_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_ponche_manual" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"hora" timestamp with time zone NOT NULL,
	"motivo" text NOT NULL,
	"estado" text DEFAULT 'pendiente' NOT NULL,
	"ip" text,
	"agente" text,
	"decidido_por" uuid,
	"decidido_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD COLUMN "motivo_salida" text;--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD COLUMN "dispositivo_id" uuid;--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD COLUMN "manual_por" uuid;--> statement-breakpoint
ALTER TABLE "desempeno_dispositivos" ADD CONSTRAINT "desempeno_dispositivos_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_dispositivos" ADD CONSTRAINT "desempeno_dispositivos_decidido_por_pulse_users_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ponche_manual" ADD CONSTRAINT "desempeno_ponche_manual_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ponche_manual" ADD CONSTRAINT "desempeno_ponche_manual_decidido_por_pulse_users_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_dispositivos_token" ON "desempeno_dispositivos" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "desempeno_dispositivos_user" ON "desempeno_dispositivos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "desempeno_ponche_manual_estado" ON "desempeno_ponche_manual" USING btree ("estado","created_at");--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD CONSTRAINT "desempeno_ponches_manual_por_pulse_users_id_fk" FOREIGN KEY ("manual_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;