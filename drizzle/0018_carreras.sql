CREATE TABLE "desempeno_postulaciones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vacante_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"user_id" uuid NOT NULL,
	"candidato_nombre" text,
	"candidato_email" text,
	"candidato_telefono" text,
	"relacion" text,
	"motivo" text NOT NULL,
	"enlace" text,
	"estado" text DEFAULT 'recibida' NOT NULL,
	"nota_rrhh" text,
	"bono_ajuste_id" uuid,
	"bono_mes" text,
	"decidido_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_vacantes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"titulo" text NOT NULL,
	"empresa" text DEFAULT 'level_up' NOT NULL,
	"departamento" text,
	"modalidad" text DEFAULT 'remoto' NOT NULL,
	"ubicacion" text,
	"descripcion" text NOT NULL,
	"requisitos" text,
	"salario" text,
	"bono_referido" double precision DEFAULT 100 NOT NULL,
	"estado" text DEFAULT 'abierta' NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "desempeno_postulaciones" ADD CONSTRAINT "desempeno_postulaciones_vacante_id_desempeno_vacantes_id_fk" FOREIGN KEY ("vacante_id") REFERENCES "public"."desempeno_vacantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_postulaciones" ADD CONSTRAINT "desempeno_postulaciones_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_postulaciones" ADD CONSTRAINT "desempeno_postulaciones_decidido_por_pulse_users_id_fk" FOREIGN KEY ("decidido_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_vacantes" ADD CONSTRAINT "desempeno_vacantes_created_by_pulse_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_postulaciones_vacante" ON "desempeno_postulaciones" USING btree ("vacante_id");--> statement-breakpoint
CREATE INDEX "desempeno_postulaciones_user" ON "desempeno_postulaciones" USING btree ("user_id");