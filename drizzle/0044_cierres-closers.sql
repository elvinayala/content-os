-- Closers (14/oct/2026, Elvin): industria y género de cada cierre del día, para saber qué closer cierra mejor qué.
ALTER TABLE "desempeno_ventas_diario" ADD COLUMN IF NOT EXISTS "cierres" jsonb DEFAULT '[]'::jsonb NOT NULL;
