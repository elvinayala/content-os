ALTER TABLE "desempeno_perfiles" ADD COLUMN "solo_ritmo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "desempeno_perfiles" SET "solo_ritmo" = true WHERE "user_id" IN (SELECT "id" FROM "pulse_users" WHERE "password_hash" IS NULL OR "rol" = 'miembro' AND "email" LIKE '%.prueba%');
