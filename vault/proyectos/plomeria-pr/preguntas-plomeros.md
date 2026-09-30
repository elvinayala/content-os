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

## Decidido por Elvin (30/sep)

1. **Garantía de destapes: 30 días** (destape simple y con máquina). No cubre si el cliente no aceptó la cámara
   recomendada, mal uso ni fallas de la tubería. Lo demás sigue en 12 meses. (`garantia_dias` en `agente/data/menu.json`.)
2. **A cotizar en sitio** (el plomero propone en la app, Resuelto aprueba el precio): remover y reinstalar inodoro ·
   mezcladora de ducha empotrada · válvula de salida del inodoro · equipos de alto valor.
3. **Materiales: reembolso en 48 horas** de cerrado el trabajo (costo + 10 %), aparte del viernes. Al cerrar, el aviso
   del equipo trae el monto y la fecha límite.
4. **Contratar con su LLC: sí**, con el número de registro. Pendiente: que el abogado lo deje en el acuerdo.
5. **Reembolso en planilla:** el estado de cuenta separa mano de obra y materiales; el 10 % de manejo es ingreso; la
   declaración la ve cada uno con su contador.

A los plomeros activos (Edgar, Samuel, Santos) se les avisó por texto y por la app el 30/sep, con el aviso de que pronto
tendrán Resuelto Pro en el celular.
