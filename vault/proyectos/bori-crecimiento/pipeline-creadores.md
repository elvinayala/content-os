---
fecha: 2026-09-21
fuente: manual
unidad: bori
tags: [bori, creadores, influencers, colaboraciones, pipeline, lis]
estado: sistema montado 21/sep · Lis coordinadora (piloto) · Elvin aprueba los viernes
---

# De dónde salen los creadores (y cómo no subestimar a los chiquitos)

Elvin (21/sep): "Hay creadores que tú no estás encontrando. Yo los identifico a ojo: 10–15K
seguidores pero con buen engagement orgánico, hablan bonito, tienen su propio estilo. Hay
muchas opciones." Este es el sistema para que ese ojo se vuelva un flujo constante y no dependa
de que él los vea.

## 1. Cómo entran (cuatro puertas, todas terminan en `data/creadores.json`)
| Puerta | Quién | Cómo |
|---|---|---|
| **Elvin a ojo** | Elvin | Le escribe a cualquier bot por Telegram: `creador @handle @otro para Bori, habla bonito` → entra como *por-vetar* al instante, sin gastar tokens |
| **Lis buscando** | Lis | 10 nuevos por semana con las fuentes de abajo; los agrega con el mismo mensaje a Sofi por Telegram/Slack o se los pasa a Nico |
| **Los agentes descubriendo** | `/creadores buscar` | Apify por hashtags y lugares de PR: trae a los autores con más interacción relativa, filtra 8–100K, los mete a *por-vetar* |
| **Los propios clientes** | Bori / Lis | Usuarios de Bori, clientes de LU/AIB con audiencia (Bryan Vega, Dra. Kasey, Tuko…): el mejor creador es el que ya usa el producto |

## 2. Dónde buscar (fuentes de Lis, 1 hora al día)
1. **Sugeridos de Instagram** de cada creador ya vetado ("cuentas similares"): 5 nuevos por cada uno.
2. **Hashtags y lugares de PR**: #emprendedorespr #negociospr #pymespr #boricua #puertorico +
   nicho (salud, belleza, contratistas, restaurantes, fitness, mamás, humor). Reels por ubicación:
   San Juan, Bayamón, Caguas, Carolina, Ponce, Mayagüez, Arecibo, Guaynabo, Humacao, Dorado.
3. **Comentarios de las cuentas grandes de PR** (Molusco, Tech Guru, Tuko, La Comay, comediantes):
   quien comenta con gracia y tiene 10K suele ser creador con comunidad real.
4. **TikTok PR** (los que crecen en TikTok y tienen IG chico: engagement altísimo, tarifa baja).
5. **Dueños de negocio con audiencia** en los nichos de Bori: quiroprácticos, estéticas, gyms,
   restaurantes, mecánicos, contratistas, abogados, dentistas. Buscar por categoría + "PR".
6. **Directorios**: Collabstr, Heepsy (gratis para buscar), hiveinfluence; lista de comedia/lifestyle
   ya en `vault/proyectos/micro-influencers/creadores-generales.md`.
7. **Clientes y ex-clientes** de LU/AIB con IG activo (Pulse → columna IG; Pipedrive).
8. **Los que ya cerramos**: cada creador que publica recomienda a 2 más (se le pregunta al cobrar).

## 3. El criterio de Elvin en números (`scripts/creadores.mjs puntuar`)
Se mira la **mediana de los últimos 12 posts** (un viral no engaña). 100 puntos:
| Señal | Qué mide | Puntos |
|---|---|---|
| Engagement | (likes + comentarios) / seguidores | ≥6 % → 35 · ≥3.5 % → 28 · ≥2 % → 18 · ≥1 % → 8 |
| Alcance de reels | vistas de reels / seguidores (¿le llega a gente que no lo sigue?) | ≥50 % → 20 · ≥25 % → 14 · ≥10 % → 7 |
| Conversación | comentarios / likes (comunidad real, no solo corazones) | ≥6 % → 10 · ≥3 % → 6 |
| Actividad | posts por mes y días desde el último | ≥6/mes y <14 d → 15 · ≥3/mes y <30 d → 10 |
| Tamaño | 8K–100K (donde el precio y el alcance rinden) | 10 |
| Puerto Rico | bio, ubicaciones o captions | 10 |
**Tier A ≥ 70 · B ≥ 50 · C ≥ 35 · descartar < 35.** Alertas automáticas: inactivo, privado,
sin PR, muchos seguidores con poca interacción (comprados), casi no publica video.

Lo que los números no ven lo mira Lis (o Elvin) en 2–3 posts: **habla bonito, tiene estilo
propio, su audiencia son dueños de negocio o gente de PR que compra**. Un Tier B de 12K que habla
como la gente vale más que un Tier A de 80K que lee un teleprompter.

Prueba real (21/sep): @bikinijeweler → 13,676 seg · ER 2.4 % · reels 19 % · PR → 55 pts, Tier B,
**alerta: inactivo 346 días** (el directorio decía 4.8 % de engagement; los números viejos engañan).

## 4. El flujo completo
```
por-vetar (Elvin/Lis/agentes agregan) → /creadores vetar (Apify + puntaje, diario 8 AM)
→ vetado: Tier A/B a Lis por Slack con el siguiente paso → contactado (Lis: DM/entrevista 15 min)
→ cotizado (Lis: `estado @h cotizado --precio 500 --formato "3 reels" --nota "por qué"`)
→ viernes: `tabla-viernes` → Telegram de Elvin → aprobado (Elvin marca) → acuerdo + pago (Aure)
→ brief + guion (Sofi) → publicado → medido (código de referido; repetir lo que vende)
```
Tarea programada `creadores-vetar-diario` (8:00 AM lun–sáb) corre `/creadores vetar`; los viernes
además `/creadores tabla`.

## 5. Lis — Coordinadora de Colaboraciones de Bori (desde el 22/sep)
Puesto nuevo dentro de EA Market, no "cien pesos más": título, responsabilidad propia, meta y
computadora nueva. Salario **$850** (de $750) + **$50 por colaboración publicada** + **$10 por
cada usuario que pague con el código de un creador suyo**. Se reevalúa el 6/nov (meta: 4
colaboraciones publicadas en octubre); si el ritmo pasa a 8–10 al mes, el puesto crece con ella.
Lo que hace: buscar 10/semana (fuentes de arriba) · contactar y entrevistar 15 min (guion en
`vault/proyectos/estudio/micro-influencers/propuesta.md`) · negociar y cotizar · **la tabla del
viernes** (3 opciones cotizadas con su recomendación) · seguimiento de cada colab hasta publicar ·
medir por código. Aure respalda en negociación difícil, acuerdo y pago. No graba; no aprueba
presupuesto.
