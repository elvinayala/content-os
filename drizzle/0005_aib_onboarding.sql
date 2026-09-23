CREATE TABLE "aib_onboarding_clientes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pulse_item_id" text,
	"nombre" text NOT NULL,
	"empresa" text,
	"telefono" text NOT NULL,
	"email" text,
	"servicio" text,
	"fecha_pago" text,
	"estado" text DEFAULT 'activo' NOT NULL,
	"bienvenida_at" timestamp with time zone,
	"encuesta10_at" timestamp with time zone,
	"encuesta30_at" timestamp with time zone,
	"encuesta_activa" text,
	"respuestas" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"historial" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"conversacion_id" text,
	"humano_hasta" timestamp with time zone,
	"ultimo_mensaje_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "aib_onboarding_tel" ON "aib_onboarding_clientes" USING btree ("telefono");--> statement-breakpoint
CREATE INDEX "aib_onboarding_pulse" ON "aib_onboarding_clientes" USING btree ("pulse_item_id");