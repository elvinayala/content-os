# Resuelto Pro · la app de los plomeros (iPhone y Android)

**Decisión de Elvin (26/sep/2026):** Resuelto necesita app móvil, primero para los plomeros ("personas mayores; todo
simple") y después para los clientes. Esta es la de los plomeros.

## Cómo está hecha

- **La pantalla es la web** `https://app.resueltopr.com/pro` (`agente/portal/pro.html`). La app nativa (Capacitor 8) la
  abre adentro y le suma lo que el navegador no da: **alertas que suenan con el celular bloqueado**. Todo cambio de
  pantalla sale al desplegar el agente, **sin actualizar la app en las tiendas**.
- **Entrada:** número de teléfono → código de 6 dígitos por texto desde el 787-956-1111 → queda conectado en ese
  celular (`/api/pro/codigo`, `/api/pro/entrar`, `agente/src/pro-acceso.ts`). Vista de prueba: **787-000-0000**,
  código **000000**, que abre trabajos de ejemplo.
- **Alertas:** al entrar, la app pide permiso y registra su token en `/api/pro/dispositivo`. El servidor
  (`agente/src/push-nativo.ts`) manda cada oferta a **Android por Firebase (FCM)** y a **iPhone directo por Apple
  (APNs)**, con el sonido `alerta` (Android `res/raw/alerta.wav`, iPhone `alerta.caf`) y prioridad alta. Además siguen
  el texto y el web push.
- `appId`: `pr.resuelto.pro` · nombre: **Resuelto Pro** · solo iPhone, no iPad (para no pedir capturas de iPad).
- Íconos y pantalla de inicio: `assets/` → `npm run iconos`.

## Lo que falta y quién lo hace

| # | Qué | Quién | Para qué |
|---|---|---|---|
| 1 | **D-U-N-S** de Resuelto PR Home Services LLC (gratis, 5–30 días hábiles) | Elvin | Cuentas de organización |
| 2 | **Apple Developer** como organización ($99/año) | Elvin | TestFlight y App Store |
| 3 | **Google Play Console** como organización ($25) | Elvin | Play Store (sin la prueba de 12 personas × 14 días) |
| 4 | **Firebase**: proyecto "Resuelto", app Android `pr.resuelto.pro` → `google-services.json` al secreto de GitHub `GOOGLE_SERVICES_JSON`; cuenta de servicio → `FIREBASE_SERVICE_ACCOUNT_JSON` en Railway | Elvin crea la cuenta; Claude configura | Alertas en Android |
| 5 | **Llave APNs (.p8)** en developer.apple.com → Keys → `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID` en Railway | Claude con la cuenta de Apple | Alertas en iPhone |
| 6 | Firma y subida: Android (keystore de subida) y iPhone (Xcode/Codemagic o un runner macOS) | Claude | Publicar |
| 7 | Ficha en las tiendas: nombre, descripción, capturas, política de privacidad (hay que publicarla) | Claude | Publicar |

## Compilar

- **Android (en la nube):** GitHub → Actions → **"Resuelto Pro · Android"** → Run workflow. Deja el APK de prueba en
  los artefactos. Local: `npm run android:apk` (necesita Android Studio y Java 21).
- **iPhone:** necesita Xcode (la Mac hoy solo tiene las Command Line Tools). `npx cap sync ios` y abrir
  `ios/App/App.xcodeproj`; el proyecto ya trae el permiso de alertas (`App.entitlements`: `aps-environment`,
  alertas urgentes) y el sonido `alerta.caf`. Las dependencias van por Swift Package Manager, sin CocoaPods.
