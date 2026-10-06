---
name: propuestas-level-up
description: Arma los datos de una propuesta personalizada y animada para un cliente de Level Up Media o de AI Borinquen (portada con su marca, lo que hablamos, su meta, el plan, ejemplo, testimonios, servicios con precio, proyección, inversión con bono y Klarna, cómo arrancamos y la cita). Úsalo cuando pidan "propuesta", "presentación para el cliente", "deck personalizado" o pasen el resumen de una llamada de venta.
---

# Propuestas personalizadas · Level Up Media / AI Borinquen

Tú preparas el **bloque de datos (JSON)** de la propuesta. Lis lo pega en el **Armador**
(https://lu-armador-propuestas.netlify.app), sube el logo y las fotos del cliente, y descarga la
presentación animada lista. **No escribas HTML ni diseñes nada**: el Armador ya tiene el diseño, la
animación, los logos y los videos de testimonios. Tu trabajo es el contenido, y que sea exacto.

## 1. Qué te van a dar
- El **resumen de la llamada** de Elvin o del closer: nombre, negocio, qué hace, a quién le vende, qué
  problema tiene, su meta, qué servicios se le ofrecieron y a qué precio, bonos y la fecha de la próxima cita.
- A veces el **Instagram o la web** del cliente: úsalos para entender su marca, su producto y sus precios.
  Si puedes abrirlos, mira; si no, trabaja con lo que te pegaron.

## 2. Reglas (no se negocian)
1. **Nada inventado.** Precios, servicios, bonos, plazos, fechas y números salen SOLO de lo que te dieron.
   Si falta algo importante (precio, fecha de la cita), **pregúntalo antes** de escribir el JSON.
2. **Cero promesas de ingresos.** Nada de "vas a vender X" ni "te garantizamos". La meta es la del cliente
   ("Tu meta") y la proyección siempre lleva su nota de "ilustrativa".
3. **Español de Puerto Rico.** Level Up: de **tú**. AI Borinquen: de **usted** salvo que Elvin diga otra cosa.
   Nunca voseo (nada de "tenés", "querés", "vos"). Nunca "gratis".
4. **AutoFlow / agentes de AI Borinquen:** "en marcha en 15 días" y "del día 16 al 45 lo optimizamos con
   conversaciones reales". Nunca "7 días" ni "21 días". AI Borinquen no es solo "contestar mensajes": son
   agentes personalizados para cualquier puesto, capacitación y digitalización.
5. **Testimonios:** solo los de la biblioteca (`testimonios.json`), por su clave. Nunca inventes una cita,
   un cliente ni un número. Escoge 1 (el que más se parezca al negocio del cliente) o hasta 3.
6. **Inversión en anuncios:** si hay marketing con anuncios, di que "los anuncios se pagan aparte,
   directo a Meta".
7. **Corto y con fuerza.** Títulos de 4 a 10 palabras. Cada punto de una lista, una línea.

## 3. La marca de cada propuesta
- `"marca": "level-up"` → marketing, anuncios, contenido, Done For You / Done With You.
- `"marca": "ai-borinquen"` → agentes de IA, AutoFlow (chat y voz), capacitación, digitalización.
- `"acento"`: un color de la marca del cliente (hex), sacado de su logo. Se usa para resaltar su nombre.
- En los textos: `*palabra*` sale en el color de nuestra marca y `**palabra**` en el color del cliente.
  `\n` es un salto de línea.

## 4. Las secciones (en este orden; todas opcionales menos portada y cierre)
| Clave | Para qué | Cuándo |
|---|---|---|
| `portada` | Promesa grande con su nombre | Siempre |
| `diagnostico` | "Lo que hablamos": 3 o 4 puntos (título corto + una línea) | Siempre que haya llamada |
| `meta` | Su meta en grande (número + unidad) y lo que significa | Si dijo una meta |
| `plan` | 1 a 3 carriles de pasos (qué hace cada servicio) | Si hay 2+ servicios o un flujo claro |
| `ejemplo` | Un anuncio de Facebook y/o un chat de ejemplo con su producto | Productos o servicios concretos |
| `prueba` | Testimonios de la biblioteca | Casi siempre |
| `servicios` | Uno por servicio: nombre, precio, qué incluye (6 a 9 puntos) | Siempre |
| `proyeccion` | 3 meses (arranque → meta → escalar), ilustrativa | Si Elvin la pidió |
| `inversion` | Suma de servicios, bono, nota de anuncios, Klarna | Siempre que haya precio |
| `arranque` | 3 o 4 hitos: semana 1, día 15, mes 1… | Siempre |
| `cierre` | La cita: "Nos vemos el *viernes 9 de octubre* a las 3:00 PM." | Siempre |

## 5. Biblioteca de testimonios (claves)
Level Up: `bryan` (quiropráctico, agenda llena) · `robert` (taller, triplicó números) · `magdalys` (salón,
+80 %) · `reina` (tienda de celulares, +50 %) · `ernest` (abogado, +$5K/mes) · `grissel` (salud, leads) ·
`oliver` (restaurante, $30K→$100K) · `yazan` (tienda en línea, 15,000 clientes).
AI Borinquen: `mano-santa` (contestaba el 20 % de sus leads) · `sleekbrowspr` (contesta en 10–15 s) ·
`ernest-aib` (mensajes de madrugada) · `yazan-aib` (tienda en línea).
Detalle completo en `testimonios.json`.

## 6. Formato de salida
Responde con **un solo bloque de código JSON** completo (nada antes de la llave `{` dentro del bloque),
y debajo, en 2 o 3 líneas: qué tiene que subir Lis (logo, 1 a 3 fotos) y cualquier dato que debe confirmar
antes de mandarla. El ejemplo completo y probado está en `ejemplo-kas.json`: cópiale la forma.

Esqueleto:
```json
{
  "marca": "level-up",
  "cliente": { "nombre": "…", "negocio": "…", "fecha": "6 de octubre de 2026", "acento": "#c39a6b" },
  "portada": { "titulo": "Que cada clienta que ve **KAS**\nllegue a *comprar.*", "sub": "…" },
  "diagnostico": { "titulo": "…", "puntos": [["Título corto", "Una línea."], ["…", "…"], ["…", "…"]] },
  "meta": { "numero": "10–15", "unidad": "pares a la semana", "valor": "≈ $4,000 – $5,000", "valor_nota": "al mes en ventas", "nota": "…" },
  "plan": { "titulo": "…", "carriles": [{ "nombre": "1 · MARKETING", "pasos": ["…", "…", "Compra"] }] },
  "ejemplo": { "titulo": "…", "web": "sutienda.com",
    "anuncio": { "pagina": "…", "texto": "…", "producto": "Modelo · $125", "web": "sutienda.com", "boton": "Comprar" },
    "chat": [["cliente", "…"], ["agente", "…"], ["enlace", "Modelo · Negocio"], ["agente", "…"]],
    "nota": "precios y disponibilidad se configuran con tu información" },
  "prueba": { "ceja": "Ya lo hicimos con otra tienda online", "testimonios": ["yazan"] },
  "servicios": [{ "nombre": "Marketing *hecho por nosotros*", "corto": "Marketing DFY · 3 meses", "sub": "…",
    "precio": 3500, "precio_nota": "pago único · 3 meses de servicio", "nota": "La inversión en anuncios se paga aparte, directo a Meta.",
    "pie": "Marketing", "incluye": ["…", "…"] }],
  "proyeccion": { "titulo": "…", "linea_meta": "Tu meta · …", "meses": [{ "mes": "Mes 1", "texto": "…" }, { "mes": "Mes 2", "texto": "…" }, { "mes": "Mes 3", "texto": "…", "cifra": "15+" }] },
  "inversion": { "ceja": "Tu inversión · una sola vez", "titulo": "…", "bono": 500, "bono_texto": "si tomas los dos servicios juntos.", "nota": "…", "klarna": true },
  "arranque": { "titulo": "De la firma a las *ventas.*", "pasos": [["Semana 1", "Onboarding", "…"], ["Día 15", "…", "…"], ["Mes 1", "…", "…"], ["Meses 2 y 3", "…", "…"]] },
  "cierre": { "titulo": "Nos vemos el *viernes 9 de octubre*\na las 3:00 PM.", "sub": "…" }
}
```
Notas: `precio` va en número sin `$` ni comas.
- **Logo y fotos NO van en el JSON**: Lis los sube en el Armador. La primera foto se usa también en el anuncio de ejemplo.
- `acento`: si no tienes su logo, **omítelo** (sale un dorado neutro) y dile a Lis que lo puede poner después.
- `web`: solo si el cliente tiene tienda o página. Si vende por Instagram/WhatsApp, omítelo; en el chat, el
  `enlace` puede ser "Tu cotización · Negocio" o "Agenda tu cita · Negocio".
- `meta.valor` / `valor_nota`: SOLO si el cliente dijo una cifra de dinero. No la calcules tú (sonaría a promesa).
- `plan`: máximo 4 pasos por carril (el último sale resaltado: el resultado).
- Testimonios: 1 si hay uno muy parecido a su negocio; si no, 2 o 3 de negocios cercanos.
- Puedes redactar textos de anuncio y chat a partir de lo que dijo el cliente, pero sin datos nuevos (precios,
  tiempos, garantías). Ajusta la lista de "incluye" a su caso (p. ej. si no vende en línea, el píxel mide mensajes y pedidos). El total y el bono los calcula el Armador. Para los servicios
de AI Borinquen usa frases de usted ("Su agente contesta en segundos…").

## 7. Qué incluye cada servicio (base; ajústalo a lo que se ofreció)
- **Marketing Done For You (Level Up):** onboarding 1:1 y auditoría · estrategia para su cliente ideal ·
  oferta y ángulos ganadores · estructura del contenido orgánico · creativos con su marca · campañas en
  Facebook e Instagram · píxel para medir ventas · optimización constante · su equipo (estratega, diseñador y
  project manager) con reportes.
- **Agente de chat / AutoFlow (AI Borinquen o Level Up):** entrenado con su información (productos, precios,
  horarios, políticas) · contesta en segundos, de día y de noche, en Messenger/Instagram/WhatsApp · califica y
  agenda o manda el enlace de compra · da seguimiento a quien preguntó y no compró · avisa cuando un cliente
  necesita a una persona · en marcha en 15 días + optimización del día 16 al 45.
