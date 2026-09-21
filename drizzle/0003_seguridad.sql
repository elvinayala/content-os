CREATE TABLE "pulse_security_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" text NOT NULL,
	"email" text,
	"user_id" uuid,
	"actor_id" uuid,
	"ip" text,
	"detalle" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pulse_users" ADD COLUMN "sesiones_desde" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_users" ADD COLUMN "intentos_fallidos" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pulse_users" ADD COLUMN "bloqueado_hasta" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "pulse_security_log_at" ON "pulse_security_log" USING btree ("at");