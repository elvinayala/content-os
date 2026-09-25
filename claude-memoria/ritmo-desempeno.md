---
name: ritmo-desempeno
description: Ritmo (/ritmo) — ponche + KPIs por puesto + score 0-100 del equipo de operaciones de Level Up; app aparte de Pulse con sus cuentas; fase 1 construida 25/sep/2026, sin migrar a prod
metadata:
  type: project
---
Ritmo = la plataforma de asistencia y desempeño que Elvin pidió el 24-25/sep/2026 ("récord para evidencia, no presión"; medir asistencia, cumplimiento, productividad y resultados por puesto; todo lo medible automático; el empleado solo reporta bloqueos y lo que el sistema no ve; score 🟢 90-100 / 🟡 75-89 / 🔴 <75; dashboard por departamento y persona).

**Why:** Elvin tiene 25-30 remotos (mayoría Colombia, contratos mixtos). La investigación mostró que un ponche solo no garantiza trabajo y que vigilar (capturas/Hubstaff) no sube rendimiento y en Colombia exigir horario a contratistas es indicio de "contrato realidad". El monitor viejo de huecos en Slack marcó rojos a todos y se retiró.

**How to apply:**
- Elvin NO lo quiere dentro de Pulse: app aparte con su nombre/link (/ritmo, azul tinta + verde + coral; Elvin no quiere "negro y verde" porque se parece a AIB); por dentro usa cuentas/cookie/base de Pulse. Nombre "Ritmo" lo escogí yo (él dijo "como creas mejor").
- Fase 1 hecha (ponche, perfiles, tablero Producción en Pulse, equipo, ficha, ajustes, avisos en simulación). Pendiente de su OK: migración 0008 en Supabase + deploy + invitar al equipo (piloto: estrategas, diseñadores/editores, dev + operaciones; closers/setters después).
- Fase 2: conectores Meta (registro de actividad; requiere que cada media buyer use SU usuario de Business Manager), n8n "Revisado", NocoDB reportes, Chatwoot, tiempo de respuesta en Slack. Fase 3: vacaciones 7 días/año acumulados por mes (usables tras 12 meses), 3 enfermedad con certificado (si no, se cobra de vacaciones), 15 maternidad; ojo: en nómina la ley pide más.
- Ningún aviso al equipo sin su OK (ver [[no-enviar-sin-aprobar]]). Relacionado: [[pulse-crm]], [[organigrama-equipo]].
