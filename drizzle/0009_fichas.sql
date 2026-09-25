CREATE TABLE "desempeno_ajustes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mes" text NOT NULL,
	"concepto" text NOT NULL,
	"monto" double precision NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_archivos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"categoria" text NOT NULL,
	"nombre" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime" text,
	"bytes" integer,
	"subido_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_ausencias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"desde" text NOT NULL,
	"hasta" text NOT NULL,
	"dias" double precision NOT NULL,
	"certificado" boolean DEFAULT false NOT NULL,
	"nota" text,
	"registrado_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_etica" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"categoria" text NOT NULL,
	"descripcion" text NOT NULL,
	"involucrados" text,
	"estado" text DEFAULT 'nuevo' NOT NULL,
	"nota_interna" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_fichas" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"foto_path" text,
	"telefono" text,
	"telefono_alterno" text,
	"ciudad" text,
	"pais" text,
	"documento_tipo" text,
	"documento_numero" text,
	"salario_mensual" double precision,
	"notas" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_ajustes" ADD CONSTRAINT "desempeno_ajustes_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ajustes" ADD CONSTRAINT "desempeno_ajustes_created_by_pulse_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_archivos" ADD CONSTRAINT "desempeno_archivos_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_archivos" ADD CONSTRAINT "desempeno_archivos_subido_por_pulse_users_id_fk" FOREIGN KEY ("subido_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ausencias" ADD CONSTRAINT "desempeno_ausencias_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ausencias" ADD CONSTRAINT "desempeno_ausencias_registrado_por_pulse_users_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_etica" ADD CONSTRAINT "desempeno_etica_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_fichas" ADD CONSTRAINT "desempeno_fichas_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_fichas" ADD CONSTRAINT "desempeno_fichas_updated_by_pulse_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_ajustes_user_mes" ON "desempeno_ajustes" USING btree ("user_id","mes");--> statement-breakpoint
CREATE INDEX "desempeno_archivos_user" ON "desempeno_archivos" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "desempeno_ausencias_user" ON "desempeno_ausencias" USING btree ("user_id","desde");--> statement-breakpoint
CREATE INDEX "desempeno_etica_estado" ON "desempeno_etica" USING btree ("estado","created_at");