CREATE TABLE "leads_acceso" (
	"user_id" uuid NOT NULL,
	"marca" text NOT NULL,
	"alcance" text DEFAULT 'todos' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_actividades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trato_id" uuid NOT NULL,
	"tipo" text DEFAULT 'llamada' NOT NULL,
	"asunto" text NOT NULL,
	"vence_at" timestamp with time zone NOT NULL,
	"hecha" boolean DEFAULT false NOT NULL,
	"hecha_at" timestamp with time zone,
	"asignado_id" uuid,
	"creada_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_embudos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marca" text NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"archivado" boolean DEFAULT false NOT NULL,
	"dias_estancado" integer DEFAULT 7 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_etapas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embudo_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"probabilidad" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_historial" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trato_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"texto" text NOT NULL,
	"autor_id" uuid,
	"externo_id" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_tratos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marca" text NOT NULL,
	"embudo_id" uuid NOT NULL,
	"etapa_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"negocio" text,
	"telefono" text,
	"email" text,
	"valor" integer DEFAULT 0 NOT NULL,
	"dueno_id" uuid,
	"estado" text DEFAULT 'abierto' NOT NULL,
	"motivo_perdida" text,
	"origen" text DEFAULT 'manual' NOT NULL,
	"agendo_por" text,
	"etiquetas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"datos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"orden" double precision DEFAULT 0 NOT NULL,
	"etapa_desde" timestamp with time zone DEFAULT now() NOT NULL,
	"proxima_actividad" timestamp with time zone,
	"ultimo_mensaje" timestamp with time zone,
	"no_leidos" integer DEFAULT 0 NOT NULL,
	"chat_id" text,
	"cuenta_whatsapp" text,
	"cerrado_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_webhook_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fuente" text NOT NULL,
	"marca" text,
	"evento" text,
	"resultado" text,
	"cuerpo" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_whatsapp" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"marca" text NOT NULL,
	"cuenta" text NOT NULL,
	"nombre" text,
	"embudo_id" uuid,
	"dueno_id" uuid,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "leads_whatsapp_cuenta_unique" UNIQUE("cuenta")
);
--> statement-breakpoint
ALTER TABLE "leads_acceso" ADD CONSTRAINT "leads_acceso_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_actividades" ADD CONSTRAINT "leads_actividades_trato_id_leads_tratos_id_fk" FOREIGN KEY ("trato_id") REFERENCES "public"."leads_tratos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_actividades" ADD CONSTRAINT "leads_actividades_asignado_id_pulse_users_id_fk" FOREIGN KEY ("asignado_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_actividades" ADD CONSTRAINT "leads_actividades_creada_por_pulse_users_id_fk" FOREIGN KEY ("creada_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_etapas" ADD CONSTRAINT "leads_etapas_embudo_id_leads_embudos_id_fk" FOREIGN KEY ("embudo_id") REFERENCES "public"."leads_embudos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_historial" ADD CONSTRAINT "leads_historial_trato_id_leads_tratos_id_fk" FOREIGN KEY ("trato_id") REFERENCES "public"."leads_tratos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_historial" ADD CONSTRAINT "leads_historial_autor_id_pulse_users_id_fk" FOREIGN KEY ("autor_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_tratos" ADD CONSTRAINT "leads_tratos_embudo_id_leads_embudos_id_fk" FOREIGN KEY ("embudo_id") REFERENCES "public"."leads_embudos"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_tratos" ADD CONSTRAINT "leads_tratos_etapa_id_leads_etapas_id_fk" FOREIGN KEY ("etapa_id") REFERENCES "public"."leads_etapas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_tratos" ADD CONSTRAINT "leads_tratos_dueno_id_pulse_users_id_fk" FOREIGN KEY ("dueno_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_whatsapp" ADD CONSTRAINT "leads_whatsapp_embudo_id_leads_embudos_id_fk" FOREIGN KEY ("embudo_id") REFERENCES "public"."leads_embudos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads_whatsapp" ADD CONSTRAINT "leads_whatsapp_dueno_id_pulse_users_id_fk" FOREIGN KEY ("dueno_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "leads_acceso_pk" ON "leads_acceso" USING btree ("user_id","marca");--> statement-breakpoint
CREATE INDEX "leads_actividades_trato" ON "leads_actividades" USING btree ("trato_id","hecha");--> statement-breakpoint
CREATE INDEX "leads_actividades_asignado" ON "leads_actividades" USING btree ("asignado_id","hecha","vence_at");--> statement-breakpoint
CREATE INDEX "leads_embudos_marca" ON "leads_embudos" USING btree ("marca","orden");--> statement-breakpoint
CREATE INDEX "leads_etapas_embudo" ON "leads_etapas" USING btree ("embudo_id","orden");--> statement-breakpoint
CREATE INDEX "leads_historial_trato" ON "leads_historial" USING btree ("trato_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "leads_historial_externo" ON "leads_historial" USING btree ("externo_id");--> statement-breakpoint
CREATE INDEX "leads_tratos_tablero" ON "leads_tratos" USING btree ("embudo_id","estado","etapa_id","orden");--> statement-breakpoint
CREATE INDEX "leads_tratos_telefono" ON "leads_tratos" USING btree ("marca","telefono");--> statement-breakpoint
CREATE INDEX "leads_tratos_email" ON "leads_tratos" USING btree ("marca","email");--> statement-breakpoint
CREATE INDEX "leads_tratos_dueno" ON "leads_tratos" USING btree ("dueno_id","estado");