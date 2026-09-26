import { FormularioPublico } from "@/components/formularios/formulario-publico";
import { formularioPorSlug } from "@/lib/formularios/repo";
import { temaDe } from "@/lib/formularios/reglas";
import { SEMILLAS } from "@/lib/formularios/semillas";

export const dynamic = "force-dynamic";

// levelupmedia.vercel.app (raíz) → aquí. Desde el 26/sep es el formulario "onboarding-level-up" de
// Pulse → Formularios: lo que se edite allá sale aquí. Si la base no responde, usa la semilla.
export default async function OnboardingLevelUpPage() {
  const f = await formularioPorSlug("onboarding-level-up").catch(() => null);
  const s = SEMILLAS[0];
  return <FormularioPublico slug="onboarding-level-up" config={f?.config ?? s.config} tema={temaDe(f?.apariencia ?? s.apariencia)} />;
}
