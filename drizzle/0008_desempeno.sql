CREATE TABLE "desempeno_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor_id" uuid,
	"tipo" text NOT NULL,
	"datos" jsonb,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_metas" (
	"puesto" text NOT NULL,
	"kpi" text NOT NULL,
	"meta" double precision NOT NULL,
	"peso" integer NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_metricas" (
	"user_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"kpi" text NOT NULL,
	"valor" double precision,
	"fuente" text NOT NULL,
	"detalle" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_perfiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"puesto" text NOT NULL,
	"lider_id" uuid,
	"hora_entrada" text DEFAULT '09:00' NOT NULL,
	"hora_salida" text DEFAULT '18:00' NOT NULL,
	"dias_laborables" jsonb DEFAULT '[1,2,3,4,5]'::jsonb NOT NULL,
	"tipo_contrato" text DEFAULT 'contratista' NOT NULL,
	"fecha_ingreso" text,
	"activo" boolean DEFAULT true NOT NULL,
	"desde" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_ponches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"entrada_at" timestamp with time zone DEFAULT now() NOT NULL,
	"salida_at" timestamp with time zone,
	"ip_entrada" text,
	"ip_salida" text,
	"user_agent" text,
	"correccion" text,
	"correccion_por" uuid,
	"nota" text
);
--> statement-breakpoint
CREATE TABLE "desempeno_reportes" (
	"user_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"bloqueos" text,
	"datos" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_metas" ADD CONSTRAINT "desempeno_metas_updated_by_pulse_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_metricas" ADD CONSTRAINT "desempeno_metricas_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_perfiles" ADD CONSTRAINT "desempeno_perfiles_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_perfiles" ADD CONSTRAINT "desempeno_perfiles_lider_id_pulse_users_id_fk" FOREIGN KEY ("lider_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD CONSTRAINT "desempeno_ponches_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ponches" ADD CONSTRAINT "desempeno_ponches_correccion_por_pulse_users_id_fk" FOREIGN KEY ("correccion_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_reportes" ADD CONSTRAINT "desempeno_reportes_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_eventos_user_at" ON "desempeno_eventos" USING btree ("user_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_metas_pk" ON "desempeno_metas" USING btree ("puesto","kpi");--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_metricas_pk" ON "desempeno_metricas" USING btree ("user_id","fecha","kpi");--> statement-breakpoint
CREATE INDEX "desempeno_ponches_user_fecha" ON "desempeno_ponches" USING btree ("user_id","fecha");--> statement-breakpoint
CREATE UNIQUE INDEX "desempeno_reportes_pk" ON "desempeno_reportes" USING btree ("user_id","fecha");