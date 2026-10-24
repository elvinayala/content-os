CREATE TABLE "pulse_consentimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona" text NOT NULL,
	"tipo" text NOT NULL,
	"accion" text NOT NULL,
	"version_documento" text NOT NULL,
	"texto_casilla" text NOT NULL,
	"origen" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"fecha_hora" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "pulse_consentimientos_persona" ON "pulse_consentimientos" USING btree ("persona","tipo");--> statement-breakpoint
CREATE INDEX "pulse_consentimientos_fecha" ON "pulse_consentimientos" USING btree ("fecha_hora");--> statement-breakpoint
-- Solo agregar (skill legal-sitio-web, punto 5): la base rechaza cualquier UPDATE o DELETE. Revocar = fila nueva.
CREATE OR REPLACE FUNCTION pulse_consentimientos_solo_agregar() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'pulse_consentimientos es solo de agregar: revocar = fila nueva con accion revoco';
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
CREATE TRIGGER pulse_consentimientos_sin_cambios BEFORE UPDATE OR DELETE ON "pulse_consentimientos" FOR EACH ROW EXECUTE FUNCTION pulse_consentimientos_solo_agregar();
