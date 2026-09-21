CREATE TABLE "autoflow_chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" uuid NOT NULL,
	"sesion_id" text NOT NULL,
	"mensajes" integer DEFAULT 0 NOT NULL,
	"lead" boolean DEFAULT false NOT NULL,
	"ultimo_mensaje_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autoflow_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"telefono" text,
	"email" text,
	"interes" text,
	"canal" text DEFAULT 'manual' NOT NULL,
	"etapa" text DEFAULT 'nuevo' NOT NULL,
	"es_ejemplo" boolean DEFAULT false NOT NULL,
	"origen_ref" text,
	"nota" text,
	"hora" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autoflow_llamadas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" uuid NOT NULL,
	"call_id" text NOT NULL,
	"agent_id" text,
	"estado" text DEFAULT 'iniciada' NOT NULL,
	"inicio" timestamp with time zone,
	"fin" timestamp with time zone,
	"duracion_seg" integer,
	"turnos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resumen" text,
	"resultado" text,
	"exitosa" boolean,
	"sentimiento" text,
	"grabacion_url" text,
	"datos_extraidos" jsonb,
	"latencia_p50_ms" integer,
	"latencia_p95_ms" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autoflow_portales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"negocio" text NOT NULL,
	"nicho" text,
	"contacto" text,
	"color" text DEFAULT '#10b981' NOT NULL,
	"asistente" text DEFAULT 'Asistente' NOT NULL,
	"modo" text DEFAULT 'demo' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"agent_id_voz" text,
	"urls" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"leads_ejemplo_cargados" boolean DEFAULT false NOT NULL,
	"pipedrive_deal_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "autoflow_solicitudes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portal_id" uuid NOT NULL,
	"texto" text NOT NULL,
	"autor" text,
	"estado" text DEFAULT 'recibida' NOT NULL,
	"respuesta" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "autoflow_chats" ADD CONSTRAINT "autoflow_chats_portal_id_autoflow_portales_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."autoflow_portales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoflow_leads" ADD CONSTRAINT "autoflow_leads_portal_id_autoflow_portales_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."autoflow_portales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoflow_llamadas" ADD CONSTRAINT "autoflow_llamadas_portal_id_autoflow_portales_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."autoflow_portales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "autoflow_solicitudes" ADD CONSTRAINT "autoflow_solicitudes_portal_id_autoflow_portales_id_fk" FOREIGN KEY ("portal_id") REFERENCES "public"."autoflow_portales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "autoflow_chats_sesion" ON "autoflow_chats" USING btree ("portal_id","sesion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autoflow_leads_origen" ON "autoflow_leads" USING btree ("portal_id","origen_ref");--> statement-breakpoint
CREATE INDEX "autoflow_leads_portal" ON "autoflow_leads" USING btree ("portal_id");--> statement-breakpoint
CREATE UNIQUE INDEX "autoflow_llamadas_call" ON "autoflow_llamadas" USING btree ("call_id");--> statement-breakpoint
CREATE INDEX "autoflow_llamadas_portal" ON "autoflow_llamadas" USING btree ("portal_id","inicio");--> statement-breakpoint
CREATE UNIQUE INDEX "autoflow_portales_slug" ON "autoflow_portales" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "autoflow_portales_agente" ON "autoflow_portales" USING btree ("agent_id_voz");--> statement-breakpoint
CREATE INDEX "autoflow_solicitudes_portal" ON "autoflow_solicitudes" USING btree ("portal_id","created_at");