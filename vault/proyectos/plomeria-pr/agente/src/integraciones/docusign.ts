/**
 * Firma del contrato por trabajo con DocuSign eSignature (JWT Grant).
 * Sin credenciales → modo simulado: guarda el HTML del contrato y lo marca "pendiente-firma".
 *
 * Setup (una vez): app en admindemo.docusign.com → Integration Key, RSA keypair, User ID (GUID),
 * consentimiento del usuario a la app. Variables: DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_USER_ID,
 * DOCUSIGN_ACCOUNT_ID, DOCUSIGN_PRIVATE_KEY (PEM en una línea con \n), DOCUSIGN_BASE (demo|prod).
 * ⚠ Verificar contra una cuenta real antes del primer envío: los nombres de campos siguen la
 * documentación pública de la API v2.1 pero no se han probado aquí.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../almacen.js";

const env = process.env;
const DEMO = (env.DOCUSIGN_BASE ?? "demo") === "demo";
const AUTH = DEMO ? "https://account-d.docusign.com" : "https://account.docusign.com";
const API = DEMO ? "https://demo.docusign.net/restapi/v2.1" : "https://na1.docusign.net/restapi/v2.1"; // prod: usar base_uri de /oauth/userinfo

export const configurado = () => !!(env.DOCUSIGN_INTEGRATION_KEY && env.DOCUSIGN_USER_ID && env.DOCUSIGN_ACCOUNT_ID && env.DOCUSIGN_PRIVATE_KEY);

function b64url(b: Buffer | string) { return Buffer.from(b).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_"); }

async function token(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: env.DOCUSIGN_INTEGRATION_KEY, sub: env.DOCUSIGN_USER_ID, aud: AUTH.replace("https://", ""), iat: now, exp: now + 3600, scope: "signature impersonation" }));
  const firma = crypto.createSign("RSA-SHA256").update(`${header}.${claims}`).sign(env.DOCUSIGN_PRIVATE_KEY!.replace(/\\n/g, "\n"));
  const jwt = `${header}.${claims}.${b64url(firma)}`;
  const r = await fetch(`${AUTH}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }) });
  if (!r.ok) throw new Error(`DocuSign token ${r.status}: ${await r.text()}`);
  return ((await r.json()) as { access_token: string }).access_token;
}

export interface EnvioContrato { proveedorId: string; ofertaId: string; nombre: string; email?: string; telefono: string; html: string }
export interface ResultadoEnvio { envelopeId: string; estado: "enviado" | "simulado"; urlFirma?: string }

export async function enviarContrato(e: EnvioContrato): Promise<ResultadoEnvio> {
  const dir = path.join(RAIZ, "data", "estado", "contratos"); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${e.ofertaId}-${e.proveedorId}.html`), e.html);
  if (!configurado()) return { envelopeId: `sim-${e.ofertaId}`, estado: "simulado" };

  const t = await token();
  const body = {
    emailSubject: `Resuelto · Orden de trabajo ${e.ofertaId} para tu firma`,
    documents: [{ documentBase64: Buffer.from(e.html).toString("base64"), name: `Orden ${e.ofertaId}.html`, fileExtension: "html", documentId: "1" }],
    recipients: {
      signers: [
        { email: e.email || `${e.telefono}@sms.resueltopr.com`, name: e.nombre, recipientId: "1", routingOrder: "1", clientUserId: e.proveedorId,
          tabs: { signHereTabs: [{ anchorString: "/firma_proveedor/", anchorUnits: "pixels", anchorXOffset: "0", anchorYOffset: "-10" }] } },
      ],
      carbonCopies: [{ email: env.RESUELTO_EMAIL ?? "contratos@resueltopr.com", name: "Resuelto", recipientId: "2", routingOrder: "2" }],
    },
    status: "sent",
  };
  const r = await fetch(`${API}/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`DocuSign envelope ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { envelopeId: string };

  // Firma embebida: URL para firmar desde el portal (válida ~5 min; se regenera al abrir).
  const v = await fetch(`${API}/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes/${j.envelopeId}/views/recipient`, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ returnUrl: `${env.URL_PUBLICA ?? "https://agente.resueltopr.com"}/proveedores?firmado=${e.ofertaId}`, authenticationMethod: "none", email: body.recipients.signers[0].email, userName: e.nombre, clientUserId: e.proveedorId }) });
  const urlFirma = v.ok ? ((await v.json()) as { url: string }).url : undefined;
  return { envelopeId: j.envelopeId, estado: "enviado", urlFirma };
}

/** Webhook de DocuSign Connect: devuelve el envelopeId y si quedó completado. */
export function leerWebhook(body: any): { envelopeId?: string; completado: boolean } {
  const envelopeId = body?.data?.envelopeId ?? body?.envelopeId;
  const status = body?.data?.envelopeSummary?.status ?? body?.event ?? body?.status;
  return { envelopeId, completado: String(status).toLowerCase().includes("completed") };
}
