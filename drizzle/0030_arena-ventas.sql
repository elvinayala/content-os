CREATE TABLE "desempeno_ventas_alias" (
	"user_id" uuid NOT NULL,
	"alias" text NOT NULL,
	CONSTRAINT "desempeno_ventas_alias_user_id_alias_pk" PRIMARY KEY("user_id","alias")
);
--> statement-breakpoint
CREATE TABLE "desempeno_ventas_bonos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empresa" text NOT NULL,
	"titulo" text NOT NULL,
	"detalle" text,
	"monto" integer NOT NULL,
	"rol" text,
	"desde" text NOT NULL,
	"hasta" text,
	"estado" text DEFAULT 'propuesto' NOT NULL,
	"creado_por" uuid,
	"autorizado_por" uuid,
	"ganador_id" uuid,
	"ganado_at" timestamp with time zone,
	"pagado_por" uuid,
	"ajuste_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "desempeno_ventas_diario" (
	"user_id" uuid NOT NULL,
	"fecha" text NOT NULL,
	"citas" integer DEFAULT 0 NOT NULL,
	"presentaron" integer DEFAULT 0 NOT NULL,
	"conversaciones" integer DEFAULT 0 NOT NULL,
	"agendas" integer DEFAULT 0 NOT NULL,
	"animo" integer,
	"nota" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desempeno_ventas_diario_user_id_fecha_pk" PRIMARY KEY("user_id","fecha")
);
--> statement-breakpoint
CREATE TABLE "desempeno_ventas_goals" (
	"user_id" uuid NOT NULL,
	"mes" text NOT NULL,
	"monto" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "desempeno_ventas_goals_user_id_mes_pk" PRIMARY KEY("user_id","mes")
);
--> statement-breakpoint
ALTER TABLE "desempeno_ventas_alias" ADD CONSTRAINT "desempeno_ventas_alias_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_bonos" ADD CONSTRAINT "desempeno_ventas_bonos_creado_por_pulse_users_id_fk" FOREIGN KEY ("creado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_bonos" ADD CONSTRAINT "desempeno_ventas_bonos_autorizado_por_pulse_users_id_fk" FOREIGN KEY ("autorizado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_bonos" ADD CONSTRAINT "desempeno_ventas_bonos_ganador_id_pulse_users_id_fk" FOREIGN KEY ("ganador_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_bonos" ADD CONSTRAINT "desempeno_ventas_bonos_pagado_por_pulse_users_id_fk" FOREIGN KEY ("pagado_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_diario" ADD CONSTRAINT "desempeno_ventas_diario_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_goals" ADD CONSTRAINT "desempeno_ventas_goals_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "desempeno_ventas_bonos_empresa" ON "desempeno_ventas_bonos" USING btree ("empresa","estado");--> statement-breakpoint
SELECT pulse_papelera_proteger();
