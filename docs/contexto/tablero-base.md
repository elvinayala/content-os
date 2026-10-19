# Tablero de Contenido · @tenfoldmarc

Tablero de contenido para un negocio de creador. Seis secciones: Baúl de Ganchos,
Métricas, Rastreador de Competencia, Community Manager, Calendario de Contenido y
Tendencias. Este es el **PASO 01**: UI completa con **datos mock**, lista para
conectar integraciones reales.

> ⚠️ Next.js 16 tiene cambios de convención respecto a versiones previas. Ver
> `@AGENTS.md` y `node_modules/next/dist/docs/` antes de tocar APIs del framework.


## Herramientas / Stack

| Herramienta | Versión | Por qué |
|---|---|---|
| **Next.js** (App Router) | 16.x | Framework React full-stack; routing por carpetas. |
| **React** | 19.x | Server Components por defecto, `"use client"` donde hay estado. |
| **TypeScript** | 5.x | Tipado de toda la capa de datos (`lib/types.ts`). |
| **Tailwind CSS** | v4 | Estilos utilitarios. Config vía `@theme` en `app/globals.css` (sin `tailwind.config`). |
| **shadcn/ui** (Radix) | preset Nova | Componentes accesibles. Viven en `components/ui/`. |
| **lucide-react** | — | Íconos. |
| **recharts** | v3 | Gráfico de Métricas (vía wrapper `components/ui/chart`). |
| **sonner** | — | Toasts (`<Toaster />` en el layout). |

## Cómo correr

```bash
npm run dev     # http://localhost:3000
npm run build   # build de producción (verifica tipos)
npm start       # sirve el build
```

## Decisiones de diseño

- **Modo oscuro forzado**: `className="dark"` en `<html>` (no hay toggle; el prompt
  pide modo oscuro). Si más adelante querés toggle, ya está `next-themes` instalado.
- **Acento terracota**: definido en el bloque `.dark` de `app/globals.css` como
  `--primary`/`--ring`/`--sidebar-primary` ≈ `oklch(0.63 0.135 42)`. Toda la UI usa
  los tokens de shadcn (`primary`, `muted`, `chart-1..5`), así que cambiar el acento
  es editar **una** variable. La paleta de fondo es un negro cálido (tinte 40°).
- **Sidebar**: componente `sidebar` de shadcn. `@tenfoldmarc` va en el `SidebarHeader`
  (`components/app-sidebar.tsx`); la navegación a las 6 secciones sale de `lib/nav.ts`
  (única fuente de verdad: la usan también la home y la sidebar).
- **Datos mock en archivos**: cada sección lee de `lib/mock/*.ts` (tipados con
  `lib/types.ts`). Cero setup, todo renderiza al instante.
- **Server vs Client**: las páginas son Server Components; solo se marca `"use client"`
  lo interactivo (copiar gancho, gráfico, composer, filtro de tendencias).

## Estructura

```
app/
  layout.tsx            Root mínimo: html + fuentes + TooltipProvider + Toaster (dark)
  globals.css           Tailwind v4 + tokens terracota (.dark) + tema navy/neón (.ceo)
  (tablero)/            Route group con el shell del tablero (no cambia URLs)
    layout.tsx          Shell: SidebarProvider + AppSidebar
    page.tsx            Inicio (resumen + accesos a las secciones)
    dashboard/          Dashboard de Agencias (Google Sheets)
    equipo/             Equipo de agentes (pipeline) — lee data/negocio.json
    ganchos/            1. Baúl de Ganchos
    metricas/           2. Métricas
    competencia/        3. Rastreador de Competencia
    community/          4. Community Manager
    calendario/         5. Calendario de Contenido (lee data/calendario.json)
    tendencias/         6. Tendencias (fuentes desde data/negocio.json)
    configuracion/      Mi negocio (form + server action) — escribe data/negocio.json
  ceo/                  CEO Command Center (shell y tema propios, ver abajo)
  ritmo/                Ritmo: ponche + desempeño del equipo (app aparte, cuentas de Pulse)
    layout.tsx          <div class="ceo"> + SidebarProvider + CeoSidebar
    page.tsx            Command Center (debrief + unidades + widgets)
    agents/ tasks/ schedule/ pipeline/ content/ vault/
components/
  app-sidebar.tsx       @tenfoldmarc + nav
  ceo/                  Piezas del Command Center (sidebar, cards, board, tabla)
  page-header.tsx       Header común (con SidebarTrigger)
  platform-badge.tsx    Badge de plataforma con color
  sections/             Piezas client por sección
  ui/                   Componentes shadcn
lib/
  types.ts              Tipos de todas las secciones (incluye Negocio y CEO)
  nav.ts                Definición de las secciones de la sidebar
  format.ts             Formato de números/fechas (es-AR) + hoyISO()
  calendario.ts         Lectura de data/calendario.json (server)
  negocio.ts            Lectura/escritura de data/negocio.json (server)
  equipo.ts             Definición de los 5 agentes (pipeline)
  ceo.ts                Roster ejecutivo, tabs del /ceo y unidades de negocio
  plataforma.ts         Abreviatura/color por plataforma
  mock/                 Datos seed por sección (incluye ceo.ts)
data/
  calendario.json       Entradas del calendario (las agrega /guion)
  negocio.json          Configuración del negocio (la edita /configuracion)
demos/auditorias/       Quiz funnels (Level Up + AI Borinquen) para ClickFunnels 2.0 — ver su README
.claude/commands/
  guion.md              Slash command /guion
```

## El comando `/guion`

`.claude/commands/guion.md` toma un guión (o tema) como argumento, extrae 1-3 piezas
(título, gancho, ángulo, plataforma, fecha) y las **agrega** a `data/calendario.json`
con `origen: "guion"`. La página `/calendario` es `dynamic = "force-dynamic"` y lee el
archivo en cada request, así que las entradas nuevas aparecen al recargar.

Uso: `/guion <pegá tu guión acá>`

## El equipo de agentes y "Mi negocio"

El tablero se opera como un **equipo de agentes** (`lib/equipo.ts`), inspirado en el
modelo del creador. **`Sofi` (Head de Contenido, `head` en el módulo)** coordina por
encima: maneja el pipeline semanal, **junta todos los reportes en un solo informe** y
persigue lo que falta para que salga a tiempo. Debajo, el pipeline de 5:

`Mateo` (datos: Métricas + Competencia) → `Santi` (estrategia: reglas/mix) →
`Cami` (ideas: Tendencias) → `Lauti` (guiones: Baúl + /guion) →
`Facu` (publicación: Community + Calendario).

La página **`/equipo`** muestra la command center de Sofi (informe consolidado armado
con los mocks + `data/calendario.json`: bombazos, ideas con potencial, guiones, cola,
y los pendientes por estado), el pipeline y un resumen de personalización.

La **personalización** vive en `data/negocio.json` (tipo `Negocio` en `lib/types.ts`):
marca (nicho, tono, audiencia, oferta, CTA), cuentas, competidores, fuentes y las
`reglas` de los agentes (mix semanal, horarios, umbral de bombazo, hora del resumen
de Slack, ideas/semana). Se edita en **`/configuracion`** (form client +
**server action** `guardarNegocioAction` que escribe el JSON y hace `revalidatePath`).

- **Conectar cuentas reales** = OAuth por plataforma; lo autoriza el usuario (no se
  guardan contraseñas/tokens en el repo). El botón "Conectar" hoy es un stub.
- Las secciones leen de `negocio.json` a medida que se conectan las APIs. Ya andan:
  **Tendencias** usa `negocio.fuentes`; **Equipo** usa todo el resumen.

## Conectar datos reales (próximos pasos)

Cada sección está aislada detrás de su mock. Para pasar a datos reales, reemplazá el
contenido de `lib/mock/<seccion>.ts` (o convertilo en una función async que llame a la
API) manteniendo los tipos de `lib/types.ts`; la UI no cambia.

- **Ganchos** → store propio (DB) + transcripción (Whisper/etc.) + IA para generar la
  `plantilla` a partir del `transcripto`. La UI ya filtra por **nicho / tipo / vistas**
  (`GanchosExplorer`) y el botón **"Usar este"** copia la plantilla para pegarla en
  `/guion`.
- **Métricas** → Instagram Graph API (insights de cuenta y media). Cada stat card tiene
  un **sparkline** (`components/sparkline.tsx`) con series a **7/30/90 días**; reemplazá
  `series` por datos reales. "Bombazo" = vistas ≥ 2× `MEDIANA_30D` (en `lib/types.ts`).
- **Competencia** → scraping de los **domingos a la mañana** de las 8 cuentas seguidas
  (p. ej. un Actor de **Apify**) + transcripción del audio (gancho + texto en pantalla).
  El botón **"Guardar en Baúl"** debe crear un `Gancho`. Actualizá `actualizadoEl`.
- **Community Manager** → la descripción se arma con **gancho + ángulo + CTA**
  (`generarDescripcion`, reemplazable por la API de Claude). La **publicación real se
  delega al Zernio MCP** (botón PUBLICAR); hoy es un stub con toast.
- **Calendario** → **vista mensual** (`CalendarMonth`); al tocar un día se abre un panel
  lateral (`Sheet`) con el guion completo. Persiste en `data/calendario.json` (incluye
  `hora` y `descripcion`); para multiusuario, mover a DB.
- **Tendencias** → revisar las **12 fuentes 1 vez por día** (RSS/APIs: blog de Anthropic,
  blog de OpenAI, listas de X, fuentes del nicho) + un filtro con IA que asigne la
  `etiqueta` (`potencial` / `explicativo` / `ignorar`) y proponga `angulosContenido`.
  El **resumen de las 5 con más potencial** se envía por **Slack a las 7 AM**: el botón
  "Enviar ahora" es un stub; en real va por el **Slack MCP** disparado por una **tarea
  programada** (cron 7 AM).

## Registro de decisiones

- Scaffold con `create-next-app` en carpeta temporal y movido al working dir porque el
  nombre `AGENTE CONTENIDO` (mayúsculas + espacio) no es válido como nombre de paquete npm.
- shadcn init con preset **Nova** (Lucide + Geist) y base **Radix**.
- Calendario lee de JSON (no de DB) para que `/guion` pueda escribir sin más setup.
- El shell del tablero se movió de `app/layout.tsx` al route group `app/(tablero)/`
  para que `/ceo` tenga sidebar y tema propios sin anidar dos sidebars. Las URLs
  no cambiaron.
- ⚠️ El caché persistente de Turbopack puede servir CSS viejo tras editar
  `globals.css` (ni el restart del dev server lo invalida). Si un cambio de CSS
  no aparece: `rm -rf .next` y reiniciar.
