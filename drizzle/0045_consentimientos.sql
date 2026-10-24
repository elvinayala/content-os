CREATE TABLE "legal_consentimientos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"persona" text NOT NULL,
	"email" text,
	"telefono" text,
	"tipo" text NOT NULL,
	"accion" text NOT NULL,
	"version_documento" text NOT NULL,
	"texto_casilla" text NOT NULL,
	"origen" text NOT NULL,
	"referencia" text,
	"ip" text,
	"user_agent" text,
	"datos" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "legal_consentimientos_persona" ON "legal_consentimientos" USING btree ("persona","created_at");--> statement-breakpoint
CREATE INDEX "legal_consentimientos_email" ON "legal_consentimientos" USING btree ("email");--> statement-breakpoint
CREATE INDEX "legal_consentimientos_telefono" ON "legal_consentimientos" USING btree ("telefono");--> statement-breakpoint
CREATE UNIQUE INDEX "legal_consentimientos_unico" ON "legal_consentimientos" USING btree ("referencia","tipo","accion","version_documento");--> statement-breakpoint
-- Registro de consentimientos (24/oct/2026, skill legal-sitio-web punto 5): SOLO DE AGREGAR.
-- Revocar = fila nueva con accion 'revoco'. Se conserva mínimo 5 años (TCPA: 4 años para demandar).
ALTER TABLE "legal_consentimientos" ADD CONSTRAINT "legal_consentimientos_tipo" CHECK ("tipo" IN ('terminos', 'privacidad', 'marketing_sms', 'marketing_email', 'llamadas_ia', 'cookies', 'privacidad_equipo', 'avisos_push', 'grabacion_ia'));--> statement-breakpoint
ALTER TABLE "legal_consentimientos" ADD CONSTRAINT "legal_consentimientos_accion" CHECK ("accion" IN ('acepto', 'revoco'));--> statement-breakpoint
-- La hora la pone SIEMPRE la base (nunca la del navegador ni la que mande el código).
CREATE OR REPLACE FUNCTION legal_consentimientos_hora() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END $$;--> statement-breakpoint
CREATE TRIGGER legal_consentimientos_hora BEFORE INSERT ON "legal_consentimientos" FOR EACH ROW EXECUTE FUNCTION legal_consentimientos_hora();--> statement-breakpoint
-- Nada se edita ni se borra: el registro es la prueba.
CREATE OR REPLACE FUNCTION legal_consentimientos_inmutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'legal_consentimientos es solo de agregar: para revocar, inserta una fila con accion = revoco';
END $$;--> statement-breakpoint
CREATE TRIGGER legal_consentimientos_inmutable BEFORE UPDATE OR DELETE ON "legal_consentimientos" FOR EACH ROW EXECUTE FUNCTION legal_consentimientos_inmutable();--> statement-breakpoint
CREATE TRIGGER legal_consentimientos_sin_truncate BEFORE TRUNCATE ON "legal_consentimientos" FOR EACH STATEMENT EXECUTE FUNCTION legal_consentimientos_inmutable();
--> statement-breakpoint
-- Datos personales (correo, teléfono, IP): RLS prendido y sin políticas = la API REST de Supabase (anon/authenticated)
-- no los ve. La app entra por DATABASE_URL como dueña de la tabla y el respaldo con service_role: ambos lo saltan.
ALTER TABLE "legal_consentimientos" ENABLE ROW LEVEL SECURITY;
