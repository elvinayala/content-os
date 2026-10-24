# elvinayala.com — página principal + 4 embudos de quiz

**Producción = ClickFunnels 2.0** (13/oct/2026, decisión de Elvin: "todo en ClickFunnels"). Esta carpeta es la fuente del
código: `cf/*.html` son los snippets que se pegan en el elemento *Custom JS/HTML* de cada página (Open Code Editor). Los
`*/index.html` son las versiones para vista previa local. Los quiz mandan el lead a
`https://content-os-chi-seven.vercel.app/api/auditoria`.

| URL | Funnel CF | Página CF | Snippet | marcaId (CRM) | Pipeline |
|---|---|---|---|---|---|
| `/` (→ `/inicio-pagina`) | `jALyxD` | Inicio | `cf/hub.html` | — | — |
| `/escalar` | `NXZnvB` | `/escalar-quiz` | `cf/escalar.html` | `elvin-escalar` | LU 16 · ELVIN · ESCALAR $10-20K (stage 154) |
| `/marketing` | `YLZxbP` | `/marketing-quiz` | `cf/marketing.html` | `level-up` | LU 12 · DIAGNÓSTICO (stage 122) |
| `/ia` | `jZZPkV` | `/ia-quiz` | `cf/ia.html` | `ai-borinquen` | cuenta Pipedrive AIB (3 / 33) |
| `/auditoria` | `NzxGvR` | `/negocio-digital` | `demos/auditorias/shadow-operator/cf-snippet.html` | `shadow-operator` | LU 14 · SHADOW (stage 136) |

## Cómo se actualiza un funnel
1. Edita el `*/index.html` (o `generar-escalar.py` para `/escalar`), pruébalo en local (launch config `elvinayala`, puerto 8801).
2. Regenera el snippet de CF: el hub con `python3 build-hub-cf.py`; los quiz son las mismas copias de `demos/auditorias/<marca>/`.
3. `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pbcopy < cf/<snippet>.html`, abre la página en CF → elemento Custom JS/HTML → Open Code Editor →
   cmd+a, cmd+v → verifica el hash de `getValue()` (hash de 31 sobre unidades UTF-16) → **Escape** → botón naranja *Save* → guardar.
4. Verifica en vivo con `curl` (la caché tarda ~20 s).

## Reglas que ya nos mordieron
- El **path de la página nunca puede ser igual al path del funnel** (CF renombra la página a `/xxx--NNNNN`).
- El hub se monta como capa fija `#ea-hub` con todas sus clases con prefijo `ea-` para que el CSS de ClickFunnels no se filtre.
- Un `<link href=""…>` con comilla de más deja la página en blanco: probar el snippet en `_prueba/hub-cf.html` antes de pegarlo.
- Los UTM del link de la bio (`https://www.elvinayala.com/?utm_source=instagram…`) pasan del hub al quiz que elijan.
- Videos de fondo del hub: ver `videos/LEEME.md` (hoy el hub de CF no lleva videos).
- `_redirects` y `netlify.toml` son del plan viejo en Netlify (descartado); se conservan solo como respaldo.
