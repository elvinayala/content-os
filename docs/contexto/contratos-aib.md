## Contratos de AI Borinquen con firma electrónica (`/pulse/contratos-aib`, 9/oct/2026)

Elvin: "el contrato de Borinquen igual que el de Resuelto que llenan los plomeros cuando firman, pero con el branding
de AI Borinquen"; Aure: "estos datos se llenan manual: nombre, teléfono, qué se le ofreció, cuánto es el costo". El
equipo de AIB (quien ve el tablero AI BORINQUEN en Pulse: Elvin, Aure, Carilin…) llena en **Pulse → Contratos AIB**
nombre, teléfono, correo, negocio, **Incluye el servicio** y costos (total · pago de hoy · **cuotas con fecha**, que con el
pago de hoy tienen que dar el total · mensualidad · nota; en la hoja 1 salen bajo "Detalles del pago" y, debajo de la
autorización, la firma y la fecha del cliente, como en el papel) → link
`/contrato/<token>` (público en `proxy.ts`; copiar o mandar por WhatsApp). El cliente, en el teléfono: sus datos y
método de pago → firma e iniciales (dedo o escritas) → lee e inicia las 6 hojas → acepta y firma → PDF (pdf-lib, sin
Chromium: membrete AIB, iniciales y "Página X de Y" en cada pie, hoja de certificado con IP, dispositivo y SHA-256) en
Storage `pulse/aib-contratos/` y `/api/contrato/<token>/pdf`. Aviso a Elvin (`notificarCEO`) y DM del bot al que lo
emitió; un contrato con `emitido.prueba` no avisa. Texto = el "Acuerdo de pago AI" de Aure (14 cláusulas, EA Market LLC),
solo con errores de dedo corregidos. **PCI**: NO se piden número de tarjeta, CVV ni número de cuenta (solo titular,
tipo, últimos 4, banco/tipo de cuenta y dirección de facturación; 13+ dígitos seguidos se rechazan); el cobro va por un
medio seguro. Tabla `aib_contratos` (SQL directo, se crea sola, papelera). Código: `lib/aib-contratos/{documento,pdf,repo,
firmar}.ts`, `components/aib-contratos/{firmar,panel}.tsx`, `app/contrato/`, `app/api/contrato/`, tests
`tests/aib-contratos.test.mjs`.
