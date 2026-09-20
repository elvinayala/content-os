---
fecha: 2026-09-19
fuente: manual
unidad: bori
tags: [contrataciones, bori, head-de-crecimiento, latam, remoto]
estado: rol definido · vacante lista para publicar · meta: firmado el 6/oct/2026
---

# Head de Crecimiento · Bori (heybori.ai) · remoto LatAm

## 1. Qué es Bori (para que lo entienda en 30 segundos)
Bori es una plataforma de marketing con IA para negocios pequeños de Puerto Rico (y luego
LatAm): crea la estrategia, los guiones, los flyers y los videos, y publica los anuncios en
Meta, con soporte. Se vende **Pro a $99/mes** (Starter y Agencia existen, no se promueven; nunca
"desde $39"). Está en producción con clientes pagando (57 usuarios, 12 pagando, 24 cortesías,
MRR ~$810 en agosto, 0 cancelaciones) y creció sin marketing: entra por los leads que no califican
para las agencias. El plan de 90 días (13/sep) fija **1,000 usuarios al día 60 (12/nov) y 3,000 al
día 90 (12/dic), ~330 pagando, MRR ~$25K**, con presupuesto escalonado que solo se abre si la
activación llega al objetivo.

## 2. Misión del puesto (una línea)
**Llevar la activación del 6 % al 40 % y convertir usuarios activos en suscriptores que se
quedan.** Todo lo demás (pauta, prensa, referidos) se abre solo cuando ese número lo permita.

## 3. El número y las compuertas (no negociables)
| Métrica | Hoy | Día 30 | Día 60 | Día 90 |
|---|---|---|---|---|
| Usuarios registrados | 57 | 250 | 1,000 | 3,000 |
| Activación (usa la app de verdad en 7 días) | 6 % | 25 % | 40 % | 40 %+ |
| Pagando | 12 | 40 | 150 | 330 |
| MRR | ~$810 | ~$3.5K | ~$12K | ~$25K |
| Churn 30 días | — | <6 % | <6 % | <6 % |

Compuertas: pauta ≤ $50/día hasta activación ≥ 40 % · CPR > $10 dos días seguidos → cambiar
creativos, no subir presupuesto · churn 30 d > 6 % → congelar captación. Fase 2 (pago fuerte)
no abre sin 1,000 usuarios y activación ≥ 40 %.

## 4. Qué hace (responsabilidades)
**Activación (el 60 % de su tiempo)**
- Auditar el onboarding real (usuario nuevo → primer flyer/video/anuncio) y quitar fricción.
- Secuencia de bienvenida por WhatsApp y correo (Resend ya funciona): día 0, 1, 3, 7.
- **Reto de 7 días** (ya construido: `reto.js`, premio de 50 créditos): operarlo como campaña
  permanente, con landing y seguimiento.
- **Prueba de 7 días de Pro con tarjeta** (construida, apagada: `PRUEBA_7D_TOKEN`): encenderla,
  medir conversión a pago, ajustar.
- Uso por usuario (`/api/admin/uso-usuarios`): cada semana, quién se registró y no usó → llamada o
  WhatsApp personal; quién usó y no pagó → oferta; quién pagó y no usa → rescate.

**Retención y monetización (20 %)**
- Referidos (regala 20 / recibe 20, ya en prod) como motor principal de crecimiento orgánico.
- Sello "Hecho con Bori" en descargas gratis (ya en prod): medir cuántos registros trae.
- Churn: llamada de salida a cada cancelación; reporte mensual de por qué se van.
- Fundadores: 500 cupos a precio congelado (decisión pendiente de Elvin) → si se aprueba, la
  campaña es suya.

**Adquisición (20 %, solo con compuertas abiertas)**
- Los **13,267 leads perdidos** de Level Up y AI Borinquen (`vault/proyectos/bori-crecimiento/
  leads-perdidos/`, pipelines "Bori · Seguimiento" ya creados en Pipedrive): campaña de WhatsApp
  + correo con **Lis Acevedo** (seguimiento), solo a los que agendaron y no cerraron (2,482).
- **Bori Live** martes 7 PM, 12 semanas: anfitrión/a, agenda y seguimiento a los asistentes.
- 20 creativos con **el trafficker de Elvin** (dueño del motor de pago): brief, prueba, rotación.
- Kit de prensa y notas a medios de PR (Bori como "la plataforma que no existía en PR").

**Reporte (todas las semanas, lunes)**
Registros por fuente · activados · pagando · MRR · churn 30 d · CPR · qué se probó y qué se
aprendió. Un mensaje en Slack + el dashboard de negocio de Bori.

## 5. Qué NO hace
- No toca el producto ni el código (David + Claude; los bugs van a Equipo → Fallos).
- No vende AutoFlow ni los servicios de las agencias.
- No cambia precios ni la oferta (Pro $99 es lo que se promueve).
- No sube pauta por su cuenta: las compuertas mandan.

## 6. Con quién trabaja
Elvin (visión, ~6 h/semana + un audio semanal de 30 min) · el trafficker de Elvin (creativos y
pauta) · Lis Acevedo (seguimiento de leads perdidos) · David (dev) · Sofi (agente: contenido de
Bori, 1 pieza/semana) · Claude (Content OS: datos, automatizaciones, reportes).

## 7. Perfil
- Ha operado **activación, onboarding o retención en un SaaS o app B2C** con números que puede
  mostrar (no "marketing general").
- Sabe: WhatsApp Business/API, email transaccional, Stripe (trials, portal), Meta Ads a nivel
  de leer resultados, un CRM.
- Lee un embudo y decide con datos; escribe claro; español nativo (público PR y LatAm; el copy
  final para PR lo revisa Sofi en tuteo boricua).
- Autónomo/a y remoto/a: recibe objetivo semanal, ejecuta, reporta.
- Plus: ha vendido a negocios pequeños; ha hecho lives o comunidad.

## 8. Compensación
- **Base $1,800–3,000 USD/mes** según experiencia y país (contrato de servicios, remoto).
- **Variable:** $10 por cada usuario **activado** que pasa a **pagar** (tope $2,000/mes) +
  bono de $1,000 al llegar a 1,000 usuarios con activación ≥ 40 % (día 60) y $1,500 al llegar a
  330 pagando (día 90).
- 90 días de prueba. Herramientas y presupuesto de pauta los pone la empresa.

## 9. Proceso de selección (cierra el 29/sep, arranca el 6/oct)
1. Publicar (LinkedIn de Elvin, grupos SaaS/growth LatAm, Workana/Torre, referidos de Alejo y
   Oscar). Filtro en la aplicación: caso real con números + qué haría la semana 1 + tarifa.
2. 3 entrevistas de 30 min (Elvin o Carilin): que explique su caso; que lea el embudo de Bori
   (le mostramos el dashboard) y diga qué mediría primero.
3. **Prueba pagada de 48 h** a 2 finalistas: acceso a un usuario de prueba y a
   `/api/admin/uso-usuarios`; entrega (a) auditoría del onboarding en 1 página, (b) la secuencia de
   bienvenida de 4 mensajes de WhatsApp, (c) el plan de sus primeras 2 semanas con 3 métricas.
4. Elegir el viernes 3/oct. Arranca el lunes 6/oct.

## 10. Onboarding (primeras 2 semanas)
Semana 1: accesos (Bori owner-lite, Stripe read, Resend, WhatsApp Business, Pipedrive "Bori ·
Seguimiento", Slack), lee `bori-plan-crecimiento` y el dashboard, habla con 10 usuarios reales
(5 que pagan, 5 que no usan). Semana 2: enciende la secuencia de bienvenida y el reto, define el
tablero de métricas, primer reporte del lunes.

## 11. Vacante lista para publicar
Ver `vacantes-q4-2026.md` §2 (texto completo). Resumen para redes:

> **Head de Crecimiento — SaaS de marketing con IA (remoto, LatAm)**
> Bori es la agencia de marketing completa en una app, para negocios pequeños de Puerto Rico. Ya
> tiene clientes pagando y creció sin marketing. Busco a quien la lleve de decenas de usuarios a
> miles. El número que vas a mover: activación (hoy 6 %). Base $1,800–3,000 + variable por
> usuarios que activan y pagan. Remoto. Prueba pagada de 48 h antes de contratar. Escribe con el
> asunto "Bori": un caso real con números, qué harías la semana 1 con 6 % de activación, y tu
> tarifa. Cierro el 29/sep.
