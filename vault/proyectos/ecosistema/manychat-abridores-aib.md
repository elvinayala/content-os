# Abridores de ManyChat · AI Borinquen (24/sep/2026)

Por qué: Instagram restringió los DMs de @ai_borinquen. Mandar **el mismo texto** a muchas personas se ve
como envío masivo. Solución: un **Randomizer** que reparte entre muchos abridores "similares pero distintos".

## Lo que está LIVE (montado por Claude el 24/sep/2026, 11:35 PM)

Flujo **"Flujo Seguidores nuevos"** (cuenta AI BORINQUEN, 9,201 ejecuciones previas). ManyChat permite **máximo 12
rutas** por Aleatorizador, así que quedaron 12 rutas (A–L), cada una con su Pausa inteligente + su abridor,
todos enviados **como Respuesta privada** (obligatorio para el disparador de seguidor nuevo):

| Ruta | Pausa | Abridor |
|---|---|---|
| A | 1 min | buenas, gracias por seguirnos / cuéntame, qué tipo de negocio tienes? (original) |
| B | 3 min | Saludos. Vi que nos seguiste, a que industria pertenece tu negocio? (original) |
| C | 2 min | gracias por seguirnos / te consulto, tu negocio hoy necesita más clientes o más tiempo para atenderlos? (original) |
| D | 1 min | Hey, gracias por el follow. Cuéntame, ¿qué tipo de negocio tienes? |
| E | 3 min | Hola, bienvenido(a) por aquí. ¿A qué se dedica tu empresa? |
| F | 4 min | Hola, gracias por seguir la página. Por curiosidad, ¿qué negocio tienes? |
| G | 2 min | Saludos! Vi que nos empezaste a seguir. ¿En qué industria está tu negocio? |
| H | 2 min | Saludos, te habla Alexis, de AI Borinquen. Vi que nos seguiste, ¿a qué se dedica tu negocio? |
| I | 1 min | Hola, aquí Alexis. Gracias por el follow. ¿Tu negocio es de servicios o de productos? |
| J | 3 min | Hey! Soy Alexis, uno de los fundadores de AI Borinquen. ¿En qué industria estás tú? |
| K | 4 min | Hola, una pregunta rápida: ¿tu negocio es de qué industria? |
| L | 2 min | Hola, qué bueno que nos sigues. ¿Tu negocio recibe muchos mensajes al día o todavía no tanto? |

Todas las pausas envían **solo de 9:00 a 20:00** (hora del contacto). Antes: 3 rutas, 5 min, a cualquier hora.
Los abridores de la lista de abajo que no están LIVE quedan **de repuesto para la rotación** de cada 2 semanas
(cambiar 5–6 textos; sin emojis en ManyChat, dan aviso). Tope diario: ManyChat no lo trae nativo para este
disparador; si Instagram vuelve a frenar, bajar el volumen apagando rutas o pausando el flujo unos días.

## Cómo montarlo en ManyChat

1. En el flujo del abridor, antes del mensaje, agrega un paso **Randomizer**.
2. Una rama por abridor, todas con el mismo peso. Si el Randomizer no te deja tantas ramas, pon un Randomizer
   con 4 ramas (grupos A, B, C y D) y dentro de cada rama otro Randomizer con los 6 abridores de ese grupo:
   así salen 24 textos distintos.
3. Cada rama termina en el **mismo** paso siguiente (la pregunta de industria, el embudo de siempre). Solo cambia
   el saludo.
4. Agrega un **Smart Delay** de 30–90 s antes del abridor (no contestar en el mismo segundo).
5. `{{first_name}}` es el campo de nombre de ManyChat. Si viene vacío, ManyChat lo deja en blanco; por eso
   la mitad de los abridores no lo usa.

## Reglas para que no vuelva a pasar

- A **nuevos seguidores** (que no escribieron): máximo **20–30 al día** y nunca en ráfaga. Mejor aún, solo a quien
  además dio like, comentó o vio historias.
- Si alguien no contesta, **no se le insiste** más de 1 vez.
- Cada 2 semanas, cambia 5 o 6 abridores por otros nuevos (que no se "gasten").
- Nada de links en el primer mensaje, nada de "gratis", sin promesas de resultados. Tuteo de Puerto Rico.

---

## Grupo A · Saludo + pregunta de industria

1. Hola {{first_name}}, gracias por seguirnos. ¿A qué se dedica tu negocio?
2. ¡Saludos! Vi que nos empezaste a seguir. ¿En qué industria está tu negocio?
3. Hey, gracias por el follow 🙌 Cuéntame, ¿qué tipo de negocio tienes?
4. Hola, bienvenido(a) por aquí. ¿A qué se dedica tu empresa?
5. Saludos {{first_name}}, qué bueno tenerte por aquí. ¿De qué es tu negocio?
6. Hola, gracias por seguir la página. Por curiosidad, ¿en qué trabajas o qué negocio tienes?

## Grupo B · Presentación corta + pregunta

7. Hola {{first_name}}, soy Alexis de AI Borinquen. Gracias por seguirnos. ¿Qué negocio tienes?
8. Saludos, te habla Alexis, de AI Borinquen. Vi que nos seguiste, ¿a qué se dedica tu negocio?
9. Hola, aquí Alexis. Gracias por el follow. ¿Tu negocio es de servicios o de productos?
10. ¡Hey! Soy Alexis, uno de los fundadores de AI Borinquen. ¿En qué industria estás tú?
11. Hola {{first_name}}, te escribe Alexis. Gracias por seguirnos. Cuéntame un poco de tu negocio.
12. Saludos, soy Alexis de AI Borinquen. Qué bueno verte por aquí. ¿Qué tipo de negocio manejas?

## Grupo C · Pregunta directa, casual

13. Hola, una pregunta rápida: ¿tu negocio es de qué industria?
14. Saludos {{first_name}}. ¿Tienes negocio propio? ¿De qué es?
15. Hey, gracias por seguirnos. ¿Tu negocio está en Puerto Rico? ¿De qué es?
16. Hola, bienvenido(a). Para conocerte mejor, ¿a qué te dedicas?
17. Saludos. Te pregunto porque cada negocio es distinto: ¿de qué es el tuyo?
18. Hola {{first_name}}, ¿cómo estás? Gracias por el follow. ¿A qué se dedica tu negocio?

## Grupo D · Con un poquito de contexto (sin vender)

19. Hola, gracias por seguirnos. Aquí compartimos cómo los negocios en PR usan IA para atender clientes. ¿El tuyo de qué es?
20. Saludos {{first_name}}. Por aquí hablamos de automatizar ventas y citas. ¿Qué negocio tienes tú?
21. Hola, qué bueno que nos sigues. ¿Tu negocio recibe muchos mensajes al día o todavía no tanto?
22. Hey, gracias por el follow. ¿Tienes negocio? Me gusta saber a quién le estamos escribiendo.
23. Hola {{first_name}}, bienvenido(a). ¿En qué industria estás? Así te comparto lo que más te pueda servir.
24. Saludos, gracias por seguirnos. ¿Tu negocio es de servicios, de comida, de salud…? Cuéntame.
