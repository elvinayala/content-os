CREATE TABLE "pulse_reglas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"cuando" jsonb NOT NULL,
	"entonces" jsonb NOT NULL,
	"veces" integer DEFAULT 0 NOT NULL,
	"ultima_vez" timestamp with time zone,
	"creada_por" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_vistas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"estado" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pulse_reglas" ADD CONSTRAINT "pulse_reglas_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_reglas" ADD CONSTRAINT "pulse_reglas_creada_por_pulse_users_id_fk" FOREIGN KEY ("creada_por") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_vistas" ADD CONSTRAINT "pulse_vistas_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_vistas" ADD CONSTRAINT "pulse_vistas_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pulse_reglas_board" ON "pulse_reglas" USING btree ("board_id");--> statement-breakpoint
CREATE INDEX "pulse_vistas_user_board" ON "pulse_vistas" USING btree ("user_id","board_id");