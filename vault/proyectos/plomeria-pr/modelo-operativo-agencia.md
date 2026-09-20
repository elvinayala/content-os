---
proyecto: Resuelto
tipo: modelo-operativo
fecha: 2026-09-06
base: "[[plan-operativo-30-dias]] · [[campana-clientes]] · [[campana-reclutamiento]]"
---

# Resuelto sin empleados · La agencia es Claude, la plataforma es Bori

> **Decisión de Elvin (6/sep/2026):** Resuelto se lanza sin empleados de marketing. Bori (heybori.ai) es la plataforma de creativos y anuncios. Claude es la agencia: estrategia, community management, diseño gráfico, copy, decisiones de pauta y reportes. Los únicos humanos en nómina son los plomeros y una persona administrativa.

---

## 1. Quién hace qué

| Función | Quién | Cómo |
|---|---|---|
| Estrategia, calendario, copy, diseño gráfico, decisiones de pauta, reportes semanales | **Claude** (esta sesión y las tareas programadas) | Produce las piezas, escribe los copys, arma las campañas, lee los números y decide qué subir, bajar o apagar |
| Creativos con IA (imagen y video) y publicación de campañas en **Meta Ads** | **Bori** (heybori.ai) | Cuenta de Resuelto en Bori, plan Agencia. Conecta la página y la cuenta publicitaria de Resuelto. Todo se publica **en pausa** a propósito |
| Publicación orgánica en Instagram, Facebook, TikTok y Google Business | **Social Planner de GHL (antes se evaluó Zernio)** (MCP oficial en mcp.zernio.com) | Decisión de Elvin (6/sep): el orgánico va por un conector. Zernio es el que ya estaba previsto en el tablero; publica en 15 redes, tiene inbox de comentarios y programación, y se conecta a Claude Code con una llave. `publicar.ts` queda como respaldo |
| Atención, cotización, agenda, cobro y seguimiento **solo por WhatsApp** (y el chat de la web) | **Agente de Resuelto** (`agente/`) | Decisión de Elvin: un solo canal. IG y Messenger contestan una vez con el link de WhatsApp. Las campañas de Bori son de ventas a WhatsApp (`relampago-wa`, luego `whatsapp-4-fases`) |
| Videos con personas reales | **Creadores UGC** pagados por pieza + **Luis** en cámara | Sin nómina: $75–150 por video, brief de Claude, entrega en 72 horas |
| Video con IA | **Higgsfield** (conectado) + el generador de video de Bori | Anuncios, explicativos, b-roll. Claude escribe el guion y el prompt |
| Despacho, reclamaciones, liquidación semanal, proveedores | **Coordinador/a de Operaciones** (única contratación) | Part-time al inicio. Es la persona que mira la agenda a las 8 AM y habla con los plomeros |
| Ejecución del servicio | **Plomeros** (1099) | 65% de la mano de obra, pago los viernes |
| Legal, contabilidad, firma técnica | Abogado, contador, Director Técnico | Externos, por hora o retainer |

**Lo que Elvin hace:** decide, aprueba y activa. Nada más. Cada semana recibe un reporte y una lista corta de decisiones. Activa las campañas que Bori dejó en pausa. No diseña, no escribe, no despacha.

---

## 2. Cómo corren los anuncios (el circuito real)

Bori publica en Meta **siempre en pausa**. Eso, que parece una limitación, es la mejor gobernanza posible para una agencia automatizada: la máquina propone, el dueño activa.

```
Claude                          Bori (heybori.ai)                    Elvin
──────                          ─────────────────                    ─────
Diseña la pieza  ──────────────▶ Sube el creativo
Escribe copy + público + $     ──▶ Arma la campaña (fórmula o manual)
                                 Publica EN PAUSA en Meta ─────────▶ Revisa 2 min · Activa
Lee resultados (viernes) ◀────── Métricas de la campaña
Decide: subir / bajar / apagar ─▶ Ajusta o pausa ───────────────────▶ Se entera
```

**Ritmo:** una tanda de campañas nuevas a la semana, activación los lunes, lectura los viernes. Fuera de eso, solo emergencias (huracán → cisternas, o un territorio vacío).

### Lo que hoy puedo y no puedo hacer solo

| Acción | ¿Puedo solo? | Qué hace falta |
|---|---|---|
| Diseñar piezas, escribir copys, armar la estructura de campaña | Sí | Nada. Ya está pasando |
| Subir creativos y crear la campaña **dentro de Bori** | **Sí**, con un usuario de Resuelto en Bori | `agente/src/bori.ts` entra con email y contraseña igual que el navegador y usa los mismos endpoints. No hace falta tocar el código de Bori |
| Activar una campaña en Meta | No, y no debería | Es tu decisión y tu dinero. Un clic semanal |
| Publicar orgánico en IG, FB, TikTok y GBP | Sí, cuando conectes Zernio | Cuenta en zernio.com (gratis hasta 2 cuentas conectadas), conectar las redes de Resuelto ahí, y darme la llave para añadir el MCP |
| Leer resultados y decidir | Sí | Acceso a los reportes (Bori o Meta Ads Manager) |
| Correr Google Ads | Después | Bori lo tendrá pronto (decisión de Elvin: esperar a Bori). Mientras, solo Meta Ads a WhatsApp |

---

## 3. Dónde vive cada cosa

| Pieza | Dónde | Estado |
|---|---|---|
| Cuenta de Resuelto en Bori | heybori.ai, plan **Agencia** (30 videos/mes) | **Crear.** Es tu producto: Resuelto es tu primer cliente "dogfooding" y su caso de éxito |
| Conexión Meta de Resuelto en Bori | Facebook Login desde Bori → página + cuenta publicitaria de **Resuelto** (no de las agencias) | Después de crear la página y el Business Manager de Resuelto |
| Creativos (19 flyers + los que vengan) | `kit/flyers/` y `kit/flyers-clientes/`, copiados a `landing/flyers/` | Listos. Se suben a Bori como creativos |
| Cola orgánica (17 piezas con copy) | `agente/data/calendario-publicaciones.json` | Lista. Espera credenciales |
| Estrategia y públicos de Meta | `kit/campana-clientes.md` §3.3 y `kit/campana-reclutamiento.md` | Escritos. Se cargan en Bori |
| Videos UGC | Brief por pieza con la skill `ugc-traffickers` como patrón | Cuando haya Luis en cámara |
| Reporte semanal | Tarea programada de Claude, viernes 8 AM → Slack o WhatsApp de Elvin | Por crear cuando arranque la pauta |

---

## 4. Google Ads: decisión tomada

Elvin decidió **esperar a que Bori tenga Google Ads** (está en su roadmap inmediato). Hasta entonces la pauta de Resuelto es **solo Meta Ads con destino WhatsApp**, y Google se trabaja gratis: Google Business Profile (perfil por territorio, menú como productos, reseñas) publicado vía Zernio.

Cuando Bori estrene Google Ads, Resuelto es el primer usuario: la campaña de búsqueda ya está diseñada en `kit/campana-clientes.md` §3.1 (grupos, keywords, negativas, extensiones de precio) y se carga tal cual.

## 5. Cómo me conecto a Bori (sin tocar su código)

Bori autentica con email y contraseña y devuelve una cookie de sesión; el navegador no hace nada distinto. `agente/src/bori.ts` entra igual, guarda la cookie y usa los mismos endpoints que la app: subir creativo, previsualizar estrategia, publicar en pausa, listar campañas.

Lo que hace falta, una vez:
1. **Un usuario de Resuelto en heybori.ai** (correo propio de Resuelto, p. ej. `marketing@resueltopr.com`). Tú lo creas o lo creo yo con el formulario de registro.
2. **Habilitarle anuncios** desde tu admin de Bori (`set-ads`): por defecto los usuarios nuevos no publican.
3. **Conectar Meta desde ese usuario** (Facebook Login dentro de Bori) eligiendo la página y la cuenta publicitaria de **Resuelto**.
4. Poner `BORI_EMAIL` y `BORI_PASSWORD` en el `.env` del agente.

Con eso: `npm run bori -- --estado` te dice si está todo conectado, y `npm run bori -- --relampago …` monta la campaña en pausa. Cuando Bori tenga Google Ads, el mismo cliente lo usa.

## 6. La semana tipo de la agencia

| Día | Claude | Bori | Elvin | Coordinador/a |
|---|---|---|---|---|
| **Lunes** | Manda las campañas de la semana (piezas + copy + público + presupuesto) | Las recibe y publica en pausa | Activa (2 min) | Revisa agenda de la semana con los plomeros |
| **Martes–jueves** | Publica orgánico (1 pieza/día), contesta comentarios vía el agente, prepara briefs UGC | Genera creativos nuevos con IA si hacen falta | — | Despacho diario, reseñas, liquidación |
| **Viernes 8 AM** | Lee métricas, escribe el reporte, propone 3 decisiones | Entrega resultados | Lee el reporte, decide en WhatsApp | Liquida a los plomeros |
| **Domingo** | Publica la pieza educativa (la que más se guarda) | — | — | — |

**Google Ads:** por decisión de Elvin se espera a que Bori lo tenga. Mientras tanto la pauta es solo Meta → WhatsApp, y Google Business Profile se trabaja orgánico vía Zernio.

**Reporte del viernes (formato fijo):** gasto, leads, CPL, trabajos completados, CAC, ticket promedio, reseñas, trabajos por plomero por territorio, y **tres decisiones** con recomendación: qué subir, qué bajar, qué apagar. Nada más. Si hace falta más, se pregunta.

---

## 7. Lo que cambia respecto al plan operativo anterior

Se eliminan del presupuesto: media buyer freelance ($400/mes), diseñador freelance ($400), videógrafo ($300/mes). Se sustituyen por:

| Concepto | Mes |
|---|---|
| Bori plan Agencia | ~$249 (precio de tu propio producto; puedes ponerlo como cortesía interna) |
| Creadores UGC | $300–450 (3–4 videos) |
| Higgsfield para video IA | según uso |
| Claude (esta operación) | lo que ya pagas |

**El Coordinador/a de Operaciones se queda.** No es marketing: es la persona que habla con los plomeros, mira la agenda a las 8 AM y resuelve la reclamación del cliente. Eso no lo hace una IA todavía y no conviene fingir que sí.

---

## 8. Los tres riesgos de una agencia sin humanos, y qué los cubre

1. **Un anuncio que se activa mal** (público equivocado, presupuesto disparado). Cubierto: Bori publica en pausa y tú activas. Además `topes.js` limita el gasto diario por cuenta.
2. **Un comentario ofensivo o una crisis en redes sin respuesta.** Cubierto parcialmente: el agente responde DMs y lo escala; los **comentarios públicos** en IG/FB los tiene que leer alguien. Propuesta: el Coordinador revisa comentarios dos veces al día hasta que el agente también lea los webhooks de comentarios (segundo desarrollo pequeño).
3. **Una pieza con un dato equivocado publicada sin revisar.** Cubierto: cada tanda semanal te llega antes de publicarse; y todo precio que aparece en una pieza sale del mismo `menu.json` que usa el agente. Si cambia el precio, cambia en un solo sitio.
