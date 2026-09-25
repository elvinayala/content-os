ALTER TABLE "desempeno_fichas" ADD COLUMN "contacto_emergencia" text;--> statement-breakpoint
ALTER TABLE "desempeno_fichas" ADD COLUMN "completada_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "desempeno_perfiles" ADD COLUMN "empresa" text DEFAULT 'level_up' NOT NULL;