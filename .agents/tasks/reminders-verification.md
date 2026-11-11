# Recordatorios de reservas: verificación de la implementación

Primera iteración: no existía `.agents/tasks/reminders-review.json`. Sin commits, ramas ni push; los cambios están en el árbol de trabajo.

## 1. Comandos ejecutados (PowerShell, desde `c:\Neogranada_Conecta`)

| Comando | Resultado |
|---|---|
| `npm run lint` **antes** de los cambios (línea base) | 40 errores, 0 warnings, en 13 archivos. Todos son `@angular-eslint/prefer-inject`. Incluía 3 en `settings.page.ts` (líneas 27-29). |
| `npm run lint` **después** | 37 errores, 0 warnings, en 12 archivos. Todos `@angular-eslint/prefer-inject` en archivos que no toqué. Ningún error nuevo. Los 3 de `settings.page.ts` desaparecieron porque pasé su constructor a `inject()`. El script sale con código 1 por los errores preexistentes. |
| `npx tsc --noEmit -p tsconfig.app.json` | Sin errores, código 0. |
| `npm run build` | Compila, código 0. Única advertencia: `NG8113: IonButton is not used within the template of RegisterPage` (`register.page.ts:52`), preexistente y ajena a este cambio. Salida en `www/`. |

No ejecuté `ng serve`, `npm start`, watchers, `cap sync` ni `cap run`. No hay Android en este entorno: nada de esto está probado en un teléfono.

## 2. Firmas del plugin confirmadas

Instalado: `@capacitor/local-notifications` **8.3.1** (`node_modules/.../package.json`), `@capacitor/app` **8.1.0**, `@capacitor/core` 8.3.4.

En `node_modules/@capacitor/local-notifications/dist/esm/definitions.d.ts`:

- `checkPermissions(): Promise<PermissionStatus>` y `requestPermissions(): Promise<PermissionStatus>`, con `PermissionStatus { display: PermissionState }`.
- `checkExactNotificationSetting(): Promise<SettingsPermissionStatus>` (desde 6.0.0, solo Android).
- `changeExactNotificationSetting(): Promise<SettingsPermissionStatus>` (desde 6.0.0, solo Android). Abre la pantalla del sistema y resuelve al volver. En Android < 12 no abre nada y devuelve `granted`.
- `SettingsPermissionStatus { exact_alarm: PermissionState }`.
- `PermissionState` (`@capacitor/core`) = `'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'`.
- `LocalNotificationSchema.isExactNotification?: boolean` (por defecto `true`, desde 8.3.0) e `isExactMandatory?: boolean` (por defecto `false`).
- `Schedule.allowWhileIdle?: boolean`.
- **No existe** ningún método para abrir los ajustes de notificaciones de la app. `@capacitor/app` tampoco tiene `openSettings`. Por eso, si el permiso sigue negado, la app muestra instrucciones manuales y no intenta abrir Ajustes.

Código nativo que confirma estas respuestas (`android/src/main/kotlin/.../LocalNotificationsPlugin.kt`):

- `checkExactNotificationSetting` devuelve `exact_alarm: "granted" | "denied"` según `AlarmManager.canScheduleExactAlarms()`. En Android < 12 siempre devuelve `"granted"`.
- En la web (`web.js`), `checkExactNotificationSetting` y `changeExactNotificationSetting` lanzan `unimplemented`.

## 3. Hallazgo del plugin que cambió el diseño de la mejora 2

En la 8.3.x, `schedule()` (`doSchedule`, `LocalNotificationsPlugin.kt`) abre por su cuenta la pantalla "Alarmas y recordatorios" (`startActivityForResult`) cuando alguna notificación pide alarma exacta (`isExactNotification`, `true` por defecto) y el permiso no está concedido (Android 12+). Antes, la app llamaba a `schedule()` una vez por cada reserva aprobada y en paralelo. Con las alarmas exactas denegadas pasaban dos cosas:

1. La pantalla del sistema se abría en cada arranque, y por cada reserva.
2. Capacitor guarda una sola llamada pendiente por plugin para resultados de actividad (`Plugin.java`, `lastPluginCallId`). Con varias llamadas a la vez, cada una pisa a la anterior y solo la última resuelve. Las promesas de las demás reservas quedan colgadas y esas reservas pueden quedarse sin recordatorio.

Eso no se puede confirmar sin el teléfono, pero encaja con "dejaron de funcionar". La versión 8.3.1 está fijada desde el commit original `2befe52`, así que no es una regresión reciente.

Cómo lo resolví:

- Cada notificación se programa con `isExactNotification: exactAlarm === 'granted'`. Sin el permiso se programa inexacta de una vez y el plugin no abre nada. El aviso para pedir el permiso lo controla la app (máximo una vez al día).
- Las llamadas al plugin se serializan en una cola dentro de `ReminderService`.
- Cuando las alarmas exactas pasan a concedidas, se cancelan y se vuelven a programar las reservas aprobadas guardadas, esta vez como exactas.
- Se agregó `allowWhileIdle: true`. Sin esa opción el plugin usa `setExact(AlarmManager.RTC)` o `set(RTC)`, que no despiertan el teléfono en reposo. Con ella usa `setExactAndAllowWhileIdle(RTC_WAKEUP)` o `setAndAllowWhileIdle(RTC_WAKEUP)` (`LocalNotificationManager.kt`, `setExactIfPossible`). Límite de Android en Doze: una alarma de este tipo cada ~9 minutos por app.

## 4. Cambios por archivo

### `src/app/core/services/reminder.service.ts`
- Tipos exportados `NotificationPermission`, `ExactAlarmPermission` y `ReminderPermissionState`, en el mismo estilo que `theme.service.ts`.
- `permissionStateSubject` (privado) expuesto como `permissionState$`, más el getter `permissionState`.
- `isSupported()`: `Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('LocalNotifications')`. Si es nativo y el plugin falta, emite una sola vez `console.warn('Plugin LocalNotifications no registrado: ejecuta "npx cap sync android" y reinstala la app. ...')`.
- `refreshPermissionState()`, `requestNotificationPermission()` y `openExactAlarmSettings()`. `prompt-with-rationale` se trata como `prompt`. Los errores se registran como `unknown`.
- `setPermissionState()` reprograma las reservas guardadas cuando las notificaciones pasan a concedidas o cuando, con notificaciones activas, las alarmas exactas pasan a concedidas.
- `syncBookings(bookings)` reemplaza el bucle que antes vivía en `app.component.ts`. Guarda las aprobadas, cancela las demás y programa si hay permiso. Va en una cola serializada.
- `scheduleForBooking` ya no pide el permiso por su cuenta (antes llamaba a `requestPermission()`): si no está concedido no hace nada. Además agrega `allowWhileIdle` e `isExactNotification`.
- Se eliminaron `requestPermission()` y `permissionGranted`. Solo los usaba `app.component.ts`.

### `src/app/app.component.ts`
- Si `isSupported()` es false (web o plugin faltante), no hace nada: ni listeners, ni permisos, ni avisos.
- Al arrancar pide el permiso igual que antes si no está concedido. Si se niega, **ya no sale**: se suscribe a las reservas igual (`syncBookings`).
- Escucha `App.addListener('appStateChange')` (`@capacitor/app` ya estaba en `package.json`), dentro de `NgZone.run`. Al volver al primer plano llama a `refreshPermissionState()`. Si el plugin App no está registrado en el APK, usa `document` `visibilitychange` como respaldo.
- Avisos (`AlertController`) solo para `role === 'student'`. Se evalúan una vez por inicio de sesión (`distinctUntilChanged` sobre el uid) y como máximo una vez al día cada uno:
  - Claves de localStorage: `reminders_notifications_alert_<uid>` y `reminders_exact_alarm_alert_<uid>`. Guardan `new Date().toDateString()` en el momento de mostrar el aviso.
  - Notificaciones negadas o sin responder: "Notificaciones desactivadas" con botones "Ahora no" y "Reintentar". "Reintentar" vuelve a llamar a `requestPermissions()`. Si sigue sin concederse, muestra "Activa las notificaciones" con la ruta Ajustes > Apps > Neogranada Conecta > Notificaciones.
  - Notificaciones concedidas y alarmas exactas no: "Recordatorios con retraso" con botones "Ahora no" y "Permitir". "Permitir" llama a `changeExactNotificationSetting()`. Si el usuario acaba de conceder las notificaciones con "Reintentar", este aviso sale a continuación.
  - Una bandera `reminderAlertOpen` evita encimar avisos.
- Los avisos automáticos **no** se repiten al volver al primer plano. Ahí solo se revisa el estado y se reprograma. Así no aparece un aviso encima de Configuración mientras el usuario reintenta desde ahí.
- `ngOnDestroy` cancela las suscripciones y quita los listeners.

### `src/app/features/shared/settings/settings.page.{ts,html,scss}`
- Sección "Recordatorios de reservas", visible solo con `Capacitor.isNativePlatform()` y rol `student`. Muestra:
  - Notificaciones: Activadas, Desactivadas o No disponible. Si están desactivadas, un texto con la ruta manual y el botón "Reintentar".
  - Alarmas exactas: Permitidas, No permitidas o No disponible. Si no están permitidas, una nota sobre el retraso y el botón "Permitir alarmas exactas".
- Refresca el estado en `ionViewWillEnter` y sigue `permissionState$` en tiempo real.
- El constructor pasó de inyección por parámetros a `inject()`, porque había que inyectar `ReminderService` y así lo pide el lint y la guía del repo. Esto quitó 3 errores preexistentes.
- Estilos: reutiliza `.setting-label` y `.action-btn` (con una variante `--small`) y agrega etiquetas de estado verde y rojo. Incluye overrides para el tema oscuro.

## 5. Cambios de comportamiento que el revisor debe conocer

- **Web (`ionic serve`)**: antes, la app pedía permiso de notificaciones del navegador y programaba notificaciones web con `setTimeout`. Ahora no hace nada en web, como pedía la tarea.
- **Alarmas exactas**: antes el plugin abría solo "Alarmas y recordatorios" en cada `schedule()`. Ahora se abre únicamente si el usuario toca "Permitir", en el aviso diario o en Configuración.
- **allowWhileIdle**: los recordatorios se disparan con el teléfono en reposo.
- El pedido del permiso de sistema al arrancar se mantiene igual que antes: también para administradores y antes de iniciar sesión. Solo los avisos propios de la app se limitan a estudiantes.

## 6. Qué no se pudo verificar

- Nada se ejecutó en un dispositivo: ni los diálogos, ni el evento `appStateChange`, ni la entrega de las notificaciones.
- No hay prueba visual de la sección de Configuración.
- No agregué tests, según las instrucciones.
