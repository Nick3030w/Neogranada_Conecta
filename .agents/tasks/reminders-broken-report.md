# Recordatorios de reserva (15 min antes) dejaron de llegar: informe de investigación

Solo lectura. No se ejecutó la app ni se vio el teléfono.

## 1. Resumen

No encontré ningún cambio en el código del repo que rompa los recordatorios. Los commits recientes de mapa e imágenes (`928585f`, `eede243`, `13fa29f`, PRs #4, #5 y #6) no tocan nada de lo que usan las notificaciones. La causa más probable está fuera del código fuente: el APK que corre en el celular no se reconstruyó con `ionic build` y `npx cap sync android` desde este repo, o la sincronización nativa falló en el otro PC.

Por lectura no puedo confirmar cuál de las causas ocurrió. El plan de pruebas (sección 5) las distingue.

## 2. Causas probables (ordenadas)

### A. Build o sync nativo desactualizado o incompleto (más probable, no verificable por lectura)

- `android/app/src/main/assets/capacitor.plugins.json` está en `.gitignore` (`android/.gitignore:100`). Lo regenera `npx cap sync`. Los assets web de `android/app/src/main/assets/public` también son un artefacto generado.
- En este PC el `public` sincronizado es del 9/09/2026 y `www/` es del 23/09/2026. Ninguno incluye los cambios de noviembre (mapa, recursos, chatbot). Quien instaló en el teléfono con un clon sin `npm install` ni `cap sync` pudo instalar un build sin el plugin, o con web y nativo desfasados.
- Si el plugin no está registrado, `LocalNotifications.schedule` lanza "not implemented". El error se traga con `console.error` en `reminder.service.ts:127-129` y `requestPermission` (`reminder.service.ts:41-44`). El usuario no ve nada.
- Estado verificado en este PC: el plugin sí está registrado.
  - `capacitor.build.gradle:16`
  - `capacitor.settings.gradle:17-18`
  - `capacitor.plugins.json:19-20`
  - `package.json`: `@capacitor/local-notifications` 8.3.1

### B. Permiso de notificaciones denegado o reiniciado en el teléfono

- `app.component.ts:32-35`: si `requestPermission()` devuelve false al arrancar, `initReminders` retorna y nunca se suscribe a las reservas. No se reintenta hasta reiniciar la app.
- Android 13+ (`targetSdk` 36) exige el permiso `POST_NOTIFICATIONS`. Reinstalar la app o borrar sus datos lo reinicia y el diálogo solo sale una vez. Si se rechazó, hay que activarlo en Ajustes.
- El manifest del plugin ya declara `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK` y `SCHEDULE_EXACT_ALARM`. Se fusionan al compilar, así que su ausencia del manifest de la app no es la falla.

### C. Alarma exacta o ahorro de batería

- En Android 14+ `SCHEDULE_EXACT_ALARM` suele estar denegado por defecto. El plugin cae a una alarma inexacta, que puede retrasarse varios minutos, sobre todo en modo ahorro de batería o con fabricantes agresivos (Xiaomi, Huawei, Samsung).
- Esto retrasa los avisos pero no explica un fallo total. El manifest propio de la app solo declara `SCHEDULE_EXACT_ALARM` (`AndroidManifest.xml:44`). No declara `USE_EXACT_ALARM`.

### D. Recordatorios solo para reservas ya vistas con la app abierta

- El único punto que programa recordatorios es `app.component.ts:43-70`. Se suscribe a `getByStudent(uid)` y programa para reservas con `status === 'aprobada'`.
- No hay llamada a `scheduleForBooking` en las pantallas de reserva ni de confirmación de admin. Si el estudiante no abre la app después de que el admin aprueba, el teléfono no programa nada.
- Esto es un diseño original (commit `2befe52`), no una regresión.

## 3. Lo que descarté, con evidencia

- **Servicio o llamadas borradas**: `reminder.service.ts` y `app.component.ts` no cambiaron desde `2befe52` (9/09/2026). `git log` sobre esos archivos solo muestra ese commit como último cambio.
- **Cambio del modelo Booking**: el único diff en `booking.interface.ts` desde `2befe52` es el campo opcional `lastReadAt`. `date`, `startTime`, `endTime` y `status` son los mismos. `BookingService.toBooking` normaliza `startTime` y `endTime`, incluido el campo legacy `time`.
- **Cambios en la reserva de aulas**: el commit `13fa29f` (selector de bloque y salón) solo agrega código de UI en `booking.page.ts`. En el diff no aparece ningún cambio en `date`, `startTime`, `endTime` ni `resourceName`. Lo revisé con un filtro de líneas, no leyendo el diff completo.
- **Archivos de Android borrados**: `git log --diff-filter=D` solo muestra borrados de `.kiro/specs/...`, `src/assets/icon/favicon.png` y `src/assets/shapes.svg`. No hay archivos de `android/` ni de `res/` borrados.
- **Ícono pequeño de notificación**: `capacitor.config.ts` no configura `LocalNotifications.smallIcon` (solo SplashScreen y StatusBar). Nada referencia `ic_stat_icon_config_sample`, así que no depende de un drawable que se pudiera haber renombrado.
- **Ids numéricos**: `hashId` (`reminder.service.ts:51-58`) deriva solo de `bookingId` y el sufijo. No depende de recursos ni de imágenes.
- **Excepción previa al scheduling**: `toDate` y `scheduleForBooking` solo hacen parseo de strings. No hay llamadas a `ResourceService`, por lo que los cambios de `resource.service.ts` (sync de aulas con Firestore) no los afectan.
- **Gradle y plugin**: el plugin sigue en los archivos de Gradle y en `capacitor.plugins.json` locales (ver A).
- **Git status**: el árbol de trabajo estaba limpio en lo revisado. Mi comando de estado mostró salida confusa por PowerShell, así que no lo garantizo del todo.

## 4. Arreglo propuesto (nada implementado)

No hay un diff de código que corrija la causa A o B. Pasos para dejarlo funcionando:

1. En el PC con el proyecto: `git pull`, `npm install`.
2. `ionic build --prod`, luego `npx cap sync android`. Confirmar en la salida que aparece `@capacitor/local-notifications` entre los plugins.
3. `npx cap open android`, limpiar el proyecto (Build > Clean) y reinstalar la app en el teléfono.

Mejoras opcionales de código, para evitar fallos silenciosos:

- En `app.component.ts`, reintentar el permiso o mostrar un aviso cuando se deniegue, en lugar de salir de `initReminders` para siempre.
- Declarar `USE_EXACT_ALARM` en `AndroidManifest.xml` solo si la política de Google Play lo permite para este tipo de app. Calendarios y recordatorios son el caso permitido, pero conviene revisarlo.
- Pedir al usuario que habilite "Alarmas y recordatorios" con `LocalNotifications.checkExactNotificationSetting()` y `changeExactNotificationSetting()`, que existen en la versión 8 del plugin (no lo verifiqué en el código del plugin).
- Si se quiere programar desde otro dispositivo o con la app cerrada, hace falta una notificación push (FCM). Hoy `functions/src/index.ts` está abierto en el editor pero no lo revisé.

## 5. Qué probar en el teléfono

1. Ajustes > Apps > Neogranada Conecta > Notificaciones: activadas. Si no, activarlas.
2. Ajustes > Apps > Acceso especial > Alarmas y recordatorios: permitir para la app (Android 12+).
3. Batería: desactivar la optimización para la app (sin restricciones).
4. Desinstalar la app, reconstruir con los pasos 1-3 de la sección 4 e instalar de nuevo. Al abrirla debe aparecer el diálogo de permiso de notificaciones.
5. Crear una reserva que empiece en unos 20 minutos, aprobarla como admin y abrir la app con el estudiante. A los 5 minutos debe llegar el aviso de inicio.
6. Si no llega, conectar el teléfono por USB y abrir `chrome://inspect`. Buscar en consola `Error al programar recordatorios de reserva` o `Error al solicitar permiso de notificaciones`. Ese mensaje confirma si el plugin falta (causa A) o el permiso falló (causa B).

## 6. Limitaciones

- No pude ver el teléfono, el APK instalado ni la consola del dispositivo.
- No verifiqué que el APK actual contenga el plugin. Solo que está registrado en este PC.
- No corrí build ni tests.
