# Preguntas de los plomeros y cómo contestarlas

Salen de las entrevistas con Santos Ferrer (maestro) y Rafael de Jesus (Canóvanas), sept. 2026. Documento de Yaileen:
`~/Downloads/Resuelto_PR_Preguntas_Objeciones_Santos_Rafael_FINAL.pdf`. El agente de reclutamiento contesta lo mismo
(`agente/src/prompt.ts`, bloque "Si pregunta cómo funciona el trabajo").

## La objeción de fondo

Los dos preguntaron lo mismo con otras palabras: **¿qué pasa cuando el trabajo real es más grande que lo que se agendó?**
Antes no había un camino claro en la app. Desde el 30/sep sí lo hay: **adicionales con aprobación del cliente**
(`agente/src/adicionales.ts`).

## Respuestas firmes (ya son así)

| Pregunta | Respuesta corta |
|---|---|
| Al llegar el trabajo es más grande | No se hace nada sin que el cliente apruebe. En la app: **"Encontré algo más"** → escoge el servicio del menú (precio automático) → al cliente le llega un enlace para aprobar → lo aprobado se suma al cobro y el plomero cobra su 65 %. |
| ¿Quién pone el precio del adicional? | El menú. Si no está en el menú, el plomero propone y **Resuelto lo aprueba** (le llega al grupo de Ventas con un enlace) antes de mandárselo al cliente. |
| Tarda mucho más de lo pensado | Si es el mismo trabajo, el precio fijo no cambia (es un promedio: unos salen rápido, otros no). Si cambia lo que hay que hacer, es un adicional. Los trabajos grandes van por rango y el plomero pone el precio final. |
| El cliente cree que "todo" está incluido | El agente y la confirmación de la cita ya le dicen al cliente: "el precio es por lo que nos describiste; si aparece algo más, te dicen el precio antes y tú apruebas". |
| El cliente quiere que primero se vea | Visita de diagnóstico $69, acreditada si hace el trabajo con Resuelto. |
| Recomendación rechazada (cámara) | En la app: **"Recomendar algo"**. El cliente acepta o no por el enlace y queda por escrito (hora e IP). |
| Zonas | 8 zonas (`agente/data/territorios.json`). El plomero decide qué trabajos acepta. |
| Servicios de maestro | "Comercial, condominios y certificaciones AAA" ya está en el menú y requiere firma de maestro: esos van a Santos, cotizados. |
| Materiales | Compra con recibo y foto → 100 % del costo + 10 % de manejo, los viernes. Equipos grandes los suple Resuelto. |
| ¿Cuánto me amarro? | Sin permanencia: se va cuando quiera avisando con 15 días (sección 8). El acuerdo es provisional hasta 90 días mientras el abogado hace el definitivo. (La presentación decía "mes a mes": ya se corrigió.) |
| Leer el contrato antes de firmar | Sí. El enlace de firma muestra todo el contrato antes; también se manda en PDF. |
| Pay-per-lead vs. Resuelto | En las apps de leads el plomero paga por cada cliente, lo persigue, cobra y si no paga lo pierde. Aquí no paga nada por el cliente, Resuelto cobra, da la garantía y le paga los viernes. A cambio, el cliente es de Resuelto. |

## Pendientes de Elvin (no prometer todavía)

1. **Garantía de destapes.** Hoy es 12 meses como todo. Propuesta: 30 días en destapes, y no cubre si el cliente rechazó la
   cámara recomendada o si la causa es estructural (tubería con barriga) o mal uso.
2. **Precios que faltan en el menú:** remover y reinstalar inodoro para destapar · mezcladora de ducha empotrada (válvula
   en la pared; hoy "llave o mezcladora $129" se presta a confusión) · válvula de salida del inodoro (flush valve; hoy
   "reparación de inodoro $99" no la incluye) · instalación de equipos de alto valor (inodoro inteligente) = cotización en sitio.
3. **Capital de trabajo en materiales.** Propuesta: reembolso de materiales en 48 h, aparte del pago del viernes, o que
   Resuelto compre lo que pase de $150.
4. **Contratar con su LLC** (Rafael tiene una). Propuesta: sí, con el número de registro; lo ajusta el abogado.
5. **Reembolso en planilla.** El estado de cuenta ya separa mano de obra y materiales; el 10 % de manejo es ingreso. Cómo
   lo declara, con su contador (confirmar con el contador de Resuelto).
