CREATE TABLE "pulse_papelera" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"tabla" text NOT NULL,
	"fila" jsonb NOT NULL,
	"borrado_at" timestamp with time zone DEFAULT now() NOT NULL,
	"borrado_por" text,
	"restaurado_at" timestamp with time zone,
	"restaurado_por" text
);
--> statement-breakpoint
CREATE INDEX "pulse_papelera_borrado" ON "pulse_papelera" USING btree ("borrado_at");--> statement-breakpoint
CREATE INDEX "pulse_papelera_tabla" ON "pulse_papelera" USING btree ("tabla");--> statement-breakpoint
-- Cada fila borrada (por la app, un script, una cascada o un agente) queda copiada en la papelera.
CREATE OR REPLACE FUNCTION pulse_papelera_guardar() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO pulse_papelera (tabla, fila, borrado_por)
  VALUES (TG_TABLE_NAME, to_jsonb(OLD), NULLIF(current_setting('app.usuario', true), ''));
  RETURN OLD;
END $$;--> statement-breakpoint
-- Vaciar una tabla entera de un golpe no deja rastro fila por fila: se bloquea.
CREATE OR REPLACE FUNCTION pulse_bloquear_truncate() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'TRUNCATE bloqueado en % (protección de datos): borra con DELETE para que quede en la papelera.', TG_TABLE_NAME;
END $$;--> statement-breakpoint
-- Pone los dos triggers en toda tabla de public que no los tenga (la corre también el respaldo
-- diario, así una tabla nueva queda protegida al día siguiente). Devuelve cuántas protegió.
CREATE OR REPLACE FUNCTION pulse_papelera_proteger() RETURNS integer LANGUAGE plpgsql AS $$
DECLARE t text; n integer := 0;
BEGIN
  FOR t IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace s ON s.oid = c.relnamespace
    WHERE s.nspname = 'public' AND c.relkind = 'r'
      AND c.relname NOT IN ('pulse_papelera', 'leads_webhook_log', 'desempeno_bienestar_reacciones')
      AND NOT EXISTS (SELECT 1 FROM pg_trigger g WHERE g.tgrelid = c.oid AND g.tgname = 'papelera_guardar')
  LOOP
    EXECUTE format('CREATE TRIGGER papelera_guardar AFTER DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION pulse_papelera_guardar()', t);
    EXECUTE format('DROP TRIGGER IF EXISTS papelera_truncate ON public.%I', t);
    EXECUTE format('CREATE TRIGGER papelera_truncate BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION pulse_bloquear_truncate()', t);
    n := n + 1;
  END LOOP;
  RETURN n;
END $$;--> statement-breakpoint
SELECT pulse_papelera_proteger();
