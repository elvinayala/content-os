CREATE TYPE "public"."pulse_rol" AS ENUM('admin', 'miembro');--> statement-breakpoint
CREATE TYPE "public"."pulse_tipo_actividad" AS ENUM('crear', 'valor', 'nombre', 'mover', 'eliminar', 'comentario');--> statement-breakpoint
CREATE TYPE "public"."pulse_tipo_columna" AS ENUM('text', 'long_text', 'number', 'status', 'dropdown', 'date', 'people', 'checkbox', 'link', 'email', 'phone', 'file', 'relation');--> statement-breakpoint
CREATE TABLE "pulse_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"board_id" uuid NOT NULL,
	"column_id" uuid,
	"tipo" "pulse_tipo_actividad" NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"user_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"nombre" text NOT NULL,
	"descripcion" text,
	"color" text,
	"position" integer DEFAULT 0 NOT NULL,
	"monday_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_columns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"type" "pulse_tipo_columna" NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"width" integer DEFAULT 160 NOT NULL,
	"monday_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"column_id" uuid NOT NULL,
	"nombre" text NOT NULL,
	"storage_path" text NOT NULL,
	"mime" text,
	"bytes" integer,
	"monday_asset_id" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"title" text NOT NULL,
	"color" text DEFAULT 'grey' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"colapsado_default" boolean DEFAULT false NOT NULL,
	"monday_id" text
);
--> statement-breakpoint
CREATE TABLE "pulse_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"board_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monday_id" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pulse_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"nombre" text NOT NULL,
	"password_hash" text,
	"rol" "pulse_rol" DEFAULT 'miembro' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"color" text,
	"monday_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pulse_activity" ADD CONSTRAINT "pulse_activity_item_id_pulse_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pulse_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_activity" ADD CONSTRAINT "pulse_activity_user_id_pulse_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_columns" ADD CONSTRAINT "pulse_columns_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_files" ADD CONSTRAINT "pulse_files_item_id_pulse_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."pulse_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_files" ADD CONSTRAINT "pulse_files_column_id_pulse_columns_id_fk" FOREIGN KEY ("column_id") REFERENCES "public"."pulse_columns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_files" ADD CONSTRAINT "pulse_files_uploaded_by_pulse_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_groups" ADD CONSTRAINT "pulse_groups_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_items" ADD CONSTRAINT "pulse_items_board_id_pulse_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."pulse_boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_items" ADD CONSTRAINT "pulse_items_group_id_pulse_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."pulse_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pulse_items" ADD CONSTRAINT "pulse_items_created_by_pulse_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."pulse_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pulse_activity_item" ON "pulse_activity" USING btree ("item_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_boards_slug" ON "pulse_boards" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_boards_monday" ON "pulse_boards" USING btree ("monday_id");--> statement-breakpoint
CREATE INDEX "pulse_columns_board" ON "pulse_columns" USING btree ("board_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_columns_monday" ON "pulse_columns" USING btree ("board_id","monday_id");--> statement-breakpoint
CREATE INDEX "pulse_files_item" ON "pulse_files" USING btree ("item_id","column_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_files_monday" ON "pulse_files" USING btree ("monday_asset_id");--> statement-breakpoint
CREATE INDEX "pulse_groups_board" ON "pulse_groups" USING btree ("board_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_groups_monday" ON "pulse_groups" USING btree ("board_id","monday_id");--> statement-breakpoint
CREATE INDEX "pulse_items_board_group" ON "pulse_items" USING btree ("board_id","group_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_items_monday" ON "pulse_items" USING btree ("monday_id");--> statement-breakpoint
CREATE INDEX "pulse_items_values_gin" ON "pulse_items" USING gin ("values");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_users_email" ON "pulse_users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "pulse_users_monday" ON "pulse_users" USING btree ("monday_id");