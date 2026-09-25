---
name: ritmo-desempeno
description: Ritmo (/ritmo) — ponche + KPIs por puesto + score 0-100 del equipo de operaciones de Level Up; app aparte de Pulse con sus cuentas; EN PROD 25/sep/2026 en ritmo-eamarket.vercel.app
metadata:
  type: project
---
Ritmo = la plataforma de asistencia y desempeño que Elvin pidió el 24-25/sep/2026 ("récord para evidencia, no presión"; medir asistencia, cumplimiento, productividad y resultados por puesto; todo lo medible automático; el empleado solo reporta bloqueos y lo que el sistema no ve; score 🟢 90-100 / 🟡 75-89 / 🔴 <75; dashboard por departamento y persona).

**Why:** Elvin tiene 25-30 remotos (mayoría Colombia, contratos mixtos). La investigación mostró que un ponche solo no garantiza trabajo y que vigilar (capturas/Hubstaff) no sube rendimiento y en Colombia exigir horario a contratistas es indicio de "contrato realidad". El monitor viejo de huecos en Slack marcó rojos a todos y se retiró.

**How to apply:**
- Elvin NO lo quiere dentro de Pulse: app aparte con su nombre/link (/ritmo, azul tinta + verde + coral; Elvin no quiere "negro y verde" porque se parece a AIB); por dentro usa cuentas/cookie/base de Pulse. Nombre "Ritmo" lo escogí yo (él dijo "como creas mejor").
- EN PROD 25/sep (migración 0008 aplicada, deploy, dominio ritmo-eamarket.vercel.app). Vista maestra (Equipo + Ajustes) SOLO Elvin, Carilin y Aure (admin/editoras) — pedido explícito; los líderes no la ven. Cada empleado entra con un link de acceso de 72 h (Ajustes → Link de acceso) y crea su propia clave. Falta: Carilin carga perfiles del piloto, crear tablero Producción desde Ajustes, y OK de Elvin para DESEMPENO_AVISOS=real.
- Fase 2: conectores Meta (registro de actividad; requiere que cada media buyer use SU usuario de Business Manager), n8n "Revisado", NocoDB reportes, Chatwoot, tiempo de respuesta en Slack. Fase 3: vacaciones 7 días/año acumulados por mes (usables tras 12 meses), 3 enfermedad con certificado (si no, se cobra de vacaciones), 15 maternidad; ojo: en nómina la ley pide más.
- Ningún aviso al equipo sin su OK (ver [[no-enviar-sin-aprobar]]). Relacionado: [[pulse-crm]], [[organigrama-equipo]].
- 25/sep (tarde): EN PROD también **Personas** (ficha de RR.HH. solo para operaciones con sueldo fijo: foto, contacto, alterno, ubicación, documento, salario USD, documentos/certificaciones/entrenamiento con videos, nómina estimada del mes siguiente), **vacaciones** (aviso a los 12 meses) y **canal ético** (anónimo, SOLO Elvin lo ve). RR.HH. = Yaileen (Head of Team Scaling) entra a la maestra por `RITMO_RRHH`; su Slack tiene yaileenjimenez@gmail.com (no @levelupmediapr.net) → confirmar con Elvin antes de darle acceso. Elvin pidió que Aure se reúna con Yaileen y que Yaileen lo deje listo para el LUNES 28/sep; ajustes → Nico.
