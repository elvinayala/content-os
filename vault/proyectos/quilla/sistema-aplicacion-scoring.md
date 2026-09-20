---
proyecto: Quilla
tipo: sistema
fecha: 2026-09-15
estado: implementado v1 (kit/landing/, 15/sep/2026)
relacionado: "[[proyectos/quilla/plan-maestro]] · [[proyectos/quilla/funnel-youtube]] · [[proyectos/quilla/perfil-creador-ideal]] · [[proyectos/quilla/tecnologia]]"
---

# Sistema de aplicación y scoring · Quilla

> **En una línea:** el formulario pregunta lo que necesitamos para decidir, una rúbrica de 0 a 100 puntúa, cuatro gates rechazan solos a quien no cumple mínimos, un humano revisa el resto en 24 horas y solo los calificados llegan a una llamada. El aplicante nunca ve su número.

Este documento es la **especificación** del kit, que ya está construido en `kit/landing/` (15/sep/2026; ver su README). Reusa los patrones ya probados en el repo: el quiz funnel de `demos/auditorias/` (pasos, `calcular()`, `tracking()`, honeypot) y las landings estáticas de Resuelto en Netlify con webhooks de GHL.

---

## 1. Flujo

```
YouTube Ad ──► quillagroup.com (landing) ──► /aplicar
                                              │
                     pantalla 0: captura (nombre, email, WhatsApp, @instagram)  ──► evento "lead" → GHL
                                              │
                     pasos 1–5 (redes · alcance · dinero · compromiso · por qué ahora)
                                              │
                     scoring en el navegador → {score, banda, gates, modeloSugerido, motivos}
                                              │
                     evento "aplicacion" → GHL (contacto + custom fields + tags + etapa)
                                              │
              ┌───────────────────────────────┼───────────────────────────────┐
         banda = llamada                banda = revision                 banda = no-califica
         pantalla "encaja"              pantalla "la revisamos"          pantalla "hoy no"
         email + WhatsApp con           aviso interno con motivos        email cortés
         calendario (20 min)            humano decide en 24 h            tag reaplicar-90d
         aviso interno
```

---

## 2. El formulario

Idioma: español de Puerto Rico (tuteo), `lang="es-PR"`. Sin la palabra "gratis". Una pregunta por pantalla en móvil; barra de progreso; se puede volver atrás; el estado se guarda en `localStorage` para retomar.

### Pantalla 0 · Captura (antes de cualquier pregunta)

| Campo | Tipo | Validación |
|---|---|---|
| Nombre | texto | requerido |
| Email | email | requerido, formato |
| WhatsApp | selector de país + número | requerido; se normaliza a E.164 |
| @instagram | texto | requerido (es la plataforma de referencia en PR) |
| Acepto que Quilla me contacte y sus términos | checkbox | requerido |
| (honeypot oculto) | texto | debe quedar vacío |

Al enviar: evento `lead` a GHL (así el 40 % que abandona a mitad queda en el CRM con tag `aplicacion-iniciada`).

### Pasos 1–5

Los selects usan **el punto medio numérico del rango como valor** para que el scoring sea una tabla de búsqueda y no un parser (truco del quiz de auditorías).

| Paso | Campo | Tipo | Valores |
|---|---|---|---|
| **1 · Tus redes** | Seguidores en Instagram | select | `0, 2500, 7500, 17500, 37500, 75000, 150000, 350000, 750000` (etiquetas: "menos de 5K", "5K–10K", "10K–25K", "25K–50K", "50K–100K", "100K–200K", "200K–500K", "más de 500K") |
| | Seguidores en TikTok / YouTube / Facebook / X | 4 selects | misma escala; opcional (default 0) |
| | Handles TikTok / YouTube / Facebook / X | texto | opcionales |
| | Plataforma principal | radio | `instagram / tiktok / youtube / facebook / x` (default: la de más seguidores) |
| **2 · Tu alcance** | Vistas promedio de tus últimos 10 reels | select | `500, 2000, 6000, 15000, 40000, 100000` |
| | Engagement aproximado (si lo sabes) | select | `0.5, 1.5, 3, 5, nose` ("menos de 1 %", "1–2 %", "2–4 %", "más de 4 %", "no lo sé") |
| | Dónde está tu audiencia | radio | `pr` (70 %+ en PR) / `mixta` (PR + EE. UU.) / `us` (mayoría hispanos en EE. UU.) / `latam` / `nose` |
| | Tu nicho principal | select | `salud, finanzas, fitness, belleza, tech, comida, familia, entretenimiento, musica, deportes, lifestyle, otro` |
| **3 · Tu dinero** | Cuánto te genera tu audiencia al mes hoy (todo incluido) | select | `0, 250, 1000, 3000, 7500, 15000, 30000` ("nada", "menos de $500", "$500–1.5K", "$1.5K–5K", "$5K–10K", "$10K–20K", "más de $20K") |
| | Cómo monetizas hoy | multi | `patrocinios, afiliados, productos, cursos, eventos, ugc, adsense, ninguna` |
| | Credibilidad fuera de redes | multi | `tv, radio, podcast, profesion, autor, ninguna` (profesión = médico, abogado, CPA, etc.) |
| **4 · Tu compromiso** | Qué quieres lograr | radio | `patrocinios` (mejores acuerdos con marcas) / `producto` (lanzar algo propio) / `negocio` (construir una empresa) / `delegar` (que alguien maneje lo comercial) / `crecer` (más audiencia) |
| | Horas semanales que puedes dedicar | select | `2, 6, 12, 25` ("menos de 4", "4–8", "8–15", "más de 15") |
| | ¿Trabajarías con participación en los ingresos (revenue share) en vez de pagar un fee? | radio | `si / depende / no` |
| | ¿Aceptarías exclusividad limitada al proyecto que construyamos juntos? | radio | `si / depende / no` |
| **5 · Por qué ahora** | Cuéntanos por qué aplicas ahora (opcional) | textarea | máx. 600 caracteres → nota en GHL |

Tiempo estimado: 3–4 minutos. Es largo a propósito: filtra.

---

## 3. La rúbrica (0–100)

### 3.1 Pesos

| Dimensión | Peso | Cómo se puntúa (0 a 1, multiplicado por el peso) |
|---|---|---|
| Audiencia | 25 | Escala logarítmica. Plataforma principal: 5K → 0 … 500K → 1 (60 % del peso). Total en todas las redes: 10K → 0 … 1M → 1 (40 %). Ajuste por ubicación: Latam ×0.6, EE. UU. ×0.85, PR/mixta ×1 |
| Engagement | 15 | <1 % → 0 · 1–2 % → 0.55 · 2–4 % → 0.8 · ≥4 % → 1 · "no sé" → 0.4. Si no dio %, se estima con vistas ÷ seguidores × 5 (0.2 vistas por seguidor ≈ 1 %) |
| Nicho | 12 | salud, finanzas → 1 · fitness → 0.85 · tech, belleza → 0.8 · comida, familia → 0.7 · entretenimiento → 0.6 · música, deportes → 0.55 · lifestyle → 0.5 · otro → 0.4 |
| Ingresos actuales | 12 | $0 → 0 · $250 → 0.2 · $1K → 0.4 · $3K → 0.6 · $7.5K → 0.8 · $15K → 0.9 · $30K → 1 |
| Sofisticación de monetización | 8 | 0 formas → 0 · 1 → 0.35 · 2 → 0.6 · 3 → 0.8 · 4+ → 1 |
| Objetivo | 6 | negocio, delegar → 1 · producto → 0.9 · patrocinios → 0.7 · crecer → 0.5 |
| Disponibilidad | 6 | <4 h → 0 · 4–8 → 0.5 · 8–15 → 0.8 · 15+ → 1 |
| Disposición (rev share + exclusividad) | 10 | 60 % rev share (sí 1, depende 0.5, no 0) + 40 % exclusividad (sí 1, depende 0.5, no 0.15) |
| Credibilidad | 6 | TV, radio o profesión → 1 · solo podcast/autor → 0.6 · ninguna → 0 |

Los pesos reflejan lo que importa para construir un negocio: audiencia real y engagement (40 %), que el nicho y el dinero actual demuestren que la audiencia compra (24 %), y que el creador quiera y pueda (22 %). La credibilidad externa pesa poco en el número pero abre un gate.

Benchmarks de engagement tomados de la investigación real de PR: 2.2–2.7 % es top, 1 % es aceptable, 0.1–0.3 % es audiencia muerta o comprada ([[proyectos/micro-influencers/investigacion]]).

### 3.2 Gates de rechazo automático

Cualquiera de estos manda a `no-califica` sin importar el score:

| Gate | Condición | Por qué |
|---|---|---|
| `audiencia` | < 25K en la plataforma principal **y** < 50K en total **y** sin credibilidad fuerte (TV/radio/profesión) | No hay masa para un negocio; el costo de construir es el mismo |
| `engagement` | engagement declarado < 1 % | Audiencia comprada o muerta; no convierte |
| `revshare` | rev share = "no" | Rompe el modelo. (D6: si Elvin quiere ver los casos de alto ingreso que dicen "no", este gate baja a `revision`) |
| `disponibilidad` | < 4 h/semana | El creador tiene que grabar, aparecer y aprobar |

### 3.3 Bandas

| Score | Banda | Qué pasa |
|---|---|---|
| ≥ 70 (sin gates) | `llamada` | Calendario de 20 min de una vez; aviso interno |
| 45–69 (sin gates) | `revision` | Un humano revisa en 24 h y decide llamada o no |
| < 45 o cualquier gate | `no-califica` | Email cortés; puede reaplicar en 90 días |

### 3.4 Modelo sugerido

Orden de evaluación:
1. **business-building** si objetivo = negocio **y** (ingresos ≥ $3K **o** total ≥ 100K).
2. **management** si plataforma principal ≥ 100K **y** (objetivo = delegar **o** nicho ∈ {entretenimiento, música}).
3. **partnerships** si credibilidad fuerte **o** objetivo = patrocinios **o** nicho con factor ≥ 0.8.
4. **monetizacion** en cualquier otro caso.

Es una sugerencia para el revisor y para la pantalla de resultado; la auditoría lo confirma o lo cambia.

### 3.5 Salida

```
{
  score: 0–100,
  banda: "llamada" | "revision" | "no-califica",
  calificado: banda === "llamada",
  gates: ["audiencia", ...],
  modeloSugerido: "management" | "monetizacion" | "partnerships" | "business-building",
  motivos: ["Audiencia principal 37.5K en Instagram", "Engagement 2–4 %: real", "Nicho salud: alto potencial", "Sin disposición a revenue share", ...],
  sub: { aud, eng, nicho, ingresos, monet, objetivo, disp, dispos, cred }
}
```

`motivos` son frases en español listas para que el revisor y GHL las muestren. El aplicante **nunca** ve `score` ni `sub`.

### 3.6 Perfiles de prueba (el test del PASO 02 debe pasar estos)

| # | Perfil | Banda esperada | Modelo esperado |
|---|---|---|---|
| 1 | Entretenedor PR: IG 350K, TikTok 750K, eng 3 %, entretenimiento, $7.5K/mes, patrocinios + eventos, PR, delegar, 12 h, sí/sí, TV | `llamada` | management |
| 2 | Médico: IG 37.5K, eng 3 %, salud, $1K, ninguna, PR, negocio, 6 h, sí/depende, profesión | `revision` (≈60) | partnerships |
| 3 | Micro: IG 7.5K, eng 5 %, lifestyle, $0, PR, sí/sí, sin credibilidad | `no-califica` (gate audiencia) | — |
| 4 | Finanzas 150K, eng 1.5 %, $15K, productos + cursos, rev share "no" | `no-califica` (gate revshare) | — |
| 5 | Hispano EE. UU. 75K, eng 0.5 %, `us` | `no-califica` (gate engagement) | — |
| 6 | Creador de negocios: IG 75K + YT 17.5K, eng 1.5 %, finanzas, $3K, afiliados + patrocinios, mixta, negocio, 25 h, sí/sí, podcast | `llamada` (≈70) | business-building |

Invariantes: `0 ≤ score ≤ 100`; si hay gates, `calificado` es falso; `motivos` nunca vacío.

---

## 4. Las tres pantallas de resultado

Tono calmado, sin números, sin "gratis", sin promesas.

**`llamada`**
> **Tu perfil encaja con lo que buscamos.**
> El siguiente paso es una llamada de 20 minutos con el equipo de Quilla para ver si tiene sentido trabajar juntos. No es una venta: es una conversación sobre tu audiencia y lo que se podría construir.
> [Agendar la llamada] (calendario de GHL)
> También te llega por email y WhatsApp.
> *Por dónde empezaríamos:* {Management: "representar tus acuerdos con marcas" | Monetización: "construir un producto propio sobre tu audiencia" | Partnerships: "acuerdos de largo plazo con marcas" | Business building: "una empresa completa alrededor de tu marca"}.

**`revision`**
> **Recibimos tu aplicación. La revisamos a mano.**
> Cada perfil lo revisa una persona del equipo. Te contestamos en 5 días hábiles, sea que sí o que no.
> Mientras tanto, puedes ver cómo trabajamos en @quilla.

**`no-califica`**
> **Gracias por aplicar. Hoy no es el momento.**
> Trabajamos con pocos creadores a la vez y con un perfil muy específico: audiencia principalmente en Puerto Rico, engagement real y disposición a construir un negocio en conjunto. Tu perfil todavía no está ahí, y preferimos decírtelo de frente.
> *Qué te acercaría:* (una viñeta por gate) audiencia → "Pasar de 25K en tu plataforma principal o sumar credibilidad fuera de redes (TV, radio, tu profesión)"; engagement → "Que tus últimos 10 reels promedien al menos el 20 % de tus seguidores en vistas"; revshare → "Un modelo de participación en los ingresos"; disponibilidad → "Al menos 4 horas a la semana".
> Puedes volver a aplicar en 90 días.

---

## 5. Integración con GoHighLevel

### 5.1 Payload (plano; el mapeador de webhooks de GHL no maneja bien objetos anidados)

`evento` (`lead` | `aplicacion`) · `origen` = "landing-quilla" · `fecha` · `nombre` · `email` · `telefono` (E.164) · `instagram, tiktok, youtube, facebook, x` · `seg_instagram … seg_x` · `seg_total` · `plataforma_principal` · `vistas_promedio` · `engagement_pct` · `audiencia_ubicacion` · `nicho` · `ingresos_mes` · `monetizacion` (lista separada por comas) · `credibilidad` (lista) · `objetivo` · `disponibilidad_h` · `revshare` · `exclusividad` · `porque_ahora` · `score` · `banda` · `calificado` · `modelo_sugerido` · `motivos` (unidos con " · ") · `gates` · `utm_source, utm_medium, utm_campaign, utm_content, utm_term` · `gclid` · `landing_url` · `referrer`.

### 5.2 Workflow "Aplicación de creadores"

1. **Inbound Webhook** recibe el payload.
2. **Create/Update Contact** con email como llave (así `lead` y `aplicacion` se funden en el mismo contacto).
3. **Set custom fields**: Score, Banda, Modelo sugerido, Motivos, Gates, Plataforma principal, Seguidores IG/TT/YT/FB/X, Seguidores total, Engagement, Nicho, Ingresos, Monetización, Credibilidad, Objetivo, Disponibilidad, Rev share, Exclusividad, Ubicación audiencia, UTMs, Landing URL.
4. **Tag** `creador`.
5. **If/Else por `evento`:**
   - `lead` → tag `aplicacion-iniciada`; crear oportunidad en pipeline **Creadores**, etapa "Empezó aplicación". Esperar 24 h → si no tiene tag `aplico` → WhatsApp: "Vimos que empezaste tu aplicación a Quilla. Si quieres retomarla, aquí está el enlace." (una sola vez).
   - `aplicacion` → tag `aplico`, quitar `aplicacion-iniciada`, mover a "Aplicó", y **If/Else por `banda`:**
     - `llamada` → tag `calificado`; etapa "Calificado · agendar"; email + WhatsApp con el enlace del calendario "Llamada de evaluación · 20 min"; notificación interna (email + Slack) al Scout y a Elvin con nombre, handle, score, modelo y motivos.
     - `revision` → tag `revision`; etapa "Revisión humana"; notificación interna al Scout con motivos y enlace al contacto; el aplicante recibe solo el email "recibimos tu aplicación".
     - `no-califica` → tag `no-califica`; etapa "No califica"; email cortés; tag `reaplicar-90d` (workflow aparte: a los 90 días, un email "si tu perfil cambió, puedes volver a aplicar").
6. Al agendar la llamada (trigger de calendario) → etapa "Llamada agendada", recordatorios 24 h y 1 h por WhatsApp.

**Pipeline Creadores:** Empezó aplicación → Aplicó → Revisión humana → Calificado · agendar → Llamada agendada → Auditoría → Propuesta → Firmado | No califica | No show | Descartado.

### 5.3 Si no hay webhook todavía
La página funciona igual: guarda el payload en `localStorage`, lo muestra en consola y sigue a la pantalla de resultado. Así se puede probar y publicar antes de que exista la sub-cuenta de GHL.

### 5.4 Si GHL bloquea el POST desde el navegador (CORS)
Plan B: una función de Netlify (`netlify/functions/aplicar.mjs`, clonada de la de Resuelto) que recibe el POST y llama a la API de GHL con un token privado (`contacts/upsert` + `opportunities`). El formulario apunta a `/api/aplicar` en vez de al webhook.

---

## 6. Revisión humana (checklist de 10 minutos)

Owner: Creator Scout. SLA: 24 horas hábiles desde que entra a "Revisión humana".

1. Abrir el perfil público en Instagram (y la plataforma principal si es otra). ¿Los seguidores declarados coinciden (±15 %)?
2. Mirar los últimos 12 posts: likes + comentarios promedio ÷ seguidores. ¿Da ≥ 1.5 %? ¿Los comentarios son reales (no bots, no "🔥🔥")?
3. Vistas de los últimos 10 reels si están visibles. ¿Promedian ≥ 15 % de los seguidores?
4. ¿La audiencia es de PR o hispana de EE. UU.? (comentarios, ubicaciones, idioma).
5. ¿Hay un tema claro que la gente le pregunta? (señal de oferta).
6. ¿Ya vende algo? ¿Cómo? (link en bio, DM, formulario).
7. Buscar el nombre en Google + "escándalo" / "controversia". Nada activo.
8. ¿Tiene manager o agencia visible en la bio? (posible conflicto de exclusividad).
9. Leer "por qué ahora". ¿Suena a alguien que quiere construir o a alguien que quiere que le resuelvan?
10. Decisión: **llamada** (mover a "Calificado · agendar" y disparar el email) · **no** (mover a "No califica" con nota de por qué) · **esperar** (nota + tarea a 30 días).

Regla: si el Scout duda, agenda la llamada. Es más barato un "no" en 20 minutos que perder un buen perfil por un número.

---

## 7. Métricas del sistema

| Métrica | Target `[DATO]` |
|---|---|
| Aplicaciones completadas / iniciadas | ≥ 55 % |
| % `llamada` sobre completadas | 10–15 % |
| % `revision` | 20–30 % |
| % `no-califica` | 55–70 % (si baja de 40 %, los ads están atrayendo mal o los gates están flojos) |
| Revisión humana dentro del SLA | 100 % |
| `revision` que pasan a llamada | 30–40 % |
| Llamadas agendadas → realizadas | ≥ 70 % |
| Llamadas → auditoría | ≥ 50 % |

Ajuste de la rúbrica: cada mes se comparan las bandas con el resultado real (firmó / no) y se recalibran pesos y umbrales. Cambios de umbrales los aprueba Elvin (D6).

---

## 8. Arquitectura (construida el 15/sep/2026 en `kit/landing/`; ver su README)

Carpeta: `vault/proyectos/quilla/kit/landing/`. Sin build, se despliega arrastrando a Netlify o con `npx netlify-cli deploy --prod --dir . --no-build`.

| Archivo | Qué es |
|---|---|
| `index.html` | Landing premium (estructura y copy en [[proyectos/quilla/funnel-youtube]]). El CTA lleva a `/aplicar` conservando la query string (UTMs) |
| `aplicar/index.html` | El formulario: captura → 5 pasos → loader → 3 resultados. Sin navegación |
| `config.js` | `window.QUILLA = { webhook: "", calendario: "", whatsapp: "", instagram: "", storageKey: "quilla_aplicacion_v1" }`. Un solo lugar para pegar la URL del webhook de GHL |
| `scoring.js` | `calcular(d)` puro, envuelto en UMD para usarlo en el navegador y en Node |
| `test-scoring.mjs` | `node --test`: los 6 perfiles de §3.6 + invariantes |
| `netlify.toml` | `publish = "."`, redirect `/aplicar → /aplicar/index.html` |
| `README.md` | Antes de publicar (editar `config.js`), comando de deploy, pasos del workflow en GHL |

**Reusar tal cual** de `demos/auditorias/shadow-operator/index.html`: `tracking()` (UTMs, gclid, landing_url, referrer), honeypot, selector de país con normalización a E.164, `renderPaso`, barra de progreso, loader, `guardar()` en localStorage, `emailOk`. De `vault/proyectos/plomeria-pr/kit/landing/plomeros/index.html`: reset CSS, `.btn`, FAQ con `<details>`, el patrón `.then(done).catch(done)` para que la UI siga aunque el POST falle.

**Tokens de marca** en un solo bloque `:root` (fondo, texto, acento, serif, sans) para que el brand kit visual del PASO 02 los cambie sin tocar más nada.

**Preview local:** entrada en `.claude/launch.json` con `python3 -m http.server 8795 -d vault/proyectos/quilla/kit/landing`.

**Smoke test:** abrir `/?utm_source=test`, clic en Aplicar, confirmar que la URL conserva la UTM, llenar captura, ver el payload `lead` en consola, completar el perfil 2 y llegar a la pantalla `revision`, correr `calcular()` con el perfil 1 desde la consola y ver `llamada`, y con un webhook de prueba mirar el POST en la pestaña de red.
