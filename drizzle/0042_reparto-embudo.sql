ALTER TABLE "leads_embudos" ADD COLUMN "reparto" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "leads_embudos" ADD COLUMN "reparto_turno" integer DEFAULT 0 NOT NULL;