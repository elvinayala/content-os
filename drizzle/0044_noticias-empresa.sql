-- 17/oct: Noticias por empresa. El "cierres" de ventas ya lo aplicó a mano 0044_cierres-closers.sql (no estaba en el
-- journal ni en el snapshot); aquí va con IF NOT EXISTS para que el snapshot quede al día sin fallar.
ALTER TABLE "desempeno_noticias" ADD COLUMN IF NOT EXISTS "empresa" text DEFAULT 'todas' NOT NULL;--> statement-breakpoint
ALTER TABLE "desempeno_ventas_diario" ADD COLUMN IF NOT EXISTS "cierres" jsonb DEFAULT '[]'::jsonb NOT NULL;
