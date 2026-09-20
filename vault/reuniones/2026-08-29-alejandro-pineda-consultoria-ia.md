---
fecha: 2026-08-29
fuente: granola
unidad: ai-borinquen
tags: [reunión, consultoría, alejandro-pineda, bori, twilio, estabilidad-producto, capacitación]
---

# Alejandro Pineda — Consultoría IA (29/08)

**Resumen:** Consultoría técnica con Alejandro Pineda + [[carilin]]. Tres frentes:
el caso Twilio de llamadas que no entran desde PR, **la validación de la plataforma
Bori antes del lanzamiento** (permisos de Meta ya completos), y una nueva
**plataforma SaaS de agentes de voz** donde cualquiera crea su agente con un prompt.

## Bori — validación antes del lanzamiento

- **Permisos de Meta llegaron la semana pasada, completos** (proveedor de tecnología
  + conexión de clientes). Activos: generador de imágenes, avatar, editor de video,
  campañas. ~10-15 usuarios orgánicos dando feedback.
- **Preocupación principal de Elvin: que no aguante 50-100 usuarios simultáneos**
  ([[estabilidad-producto]]).
- Recomendaciones de Alejandro: pruebas pequeñas con empleados/usuarios de confianza
  primero; **conectar Postgres/Supabase para telemetría** (mapas de calor, grabaciones
  de sesión); acceso al repositorio para revisar arquitectura y correr pruebas de
  estrés, unitarias y de colección.

## Plataforma SaaS de agentes de voz

- Demo en vivo del agente **"Andrea"** (voz femenina, acento mexicano) para taller
  automotriz: capturó nombre, teléfono, modelo de carro y agendó cotización bien.
- **Modelo de negocio:** sin setup (cliente paga mensualidad y se configura solo) o
  con setup (Level Up lo configura desde la cuenta maestra en minutos).
- Alejandro sugiere gamificación en la pantalla de espera mientras se construye el
  agente. Pendiente: cómo se almacena y separa la data por cliente/proyecto.

## Caso Twilio (Vagón PR)

Confirmado que las llamadas no llegan desde PR — ni al cliente ni a Elvin probándolo.
Twilio dice que no es problema suyo; el cliente probó las 3 operadoras de PR con el
mismo resultado. **Twilio ya está fuera de la cuenta de LevelUp** (entregado al
cliente). Hay 2-3 opciones sobre la mesa; el cliente no quiere cambiar el número.

## Capacitaciones acordadas (semana siguiente)

1. **PostHog/Postgres** con los desarrolladores + traer a Bori — miércoles.
2. **Uso de Claude con los tráfickers** — viernes. Tienen Claude Pro pero lo usan
   genérico, sin proyecto por cliente. Enfoque: proyectos por cliente, **imagen de
   referencia + prompt con dirección específica** (Claude Design), optimización de
   tokens.

## Acciones

- **Carilin:** coordinar ambas sesiones (Alejandro envía horarios).
- **Elvin:** dar acceso al repositorio de Bori a Alejandro; enviarle la contraseña por
  WhatsApp; verificar cómo Supabase separa la data por proyecto; crear el **NDA en
  Claude** para el cliente sensible de Ana Milena; construir el **scraper de leads
  para el doctor** (quiere leads diarios de su zona, no un agente de atención) y
  dejarlo documentado para venderlo después.
- **Equipo dev:** David sale, entra un desarrollador nuevo (nombre por confirmar).
- **Proyecto universidad (Cristian):** pausado hasta la 1ª-2ª semana de septiembre;
  reunión agendada con 2 personas de la directiva.

## Conexiones

[[ai-borinquen]] — [[estabilidad-producto]] — [[carilin]] — [[autoflow]] — [[alejo]]
