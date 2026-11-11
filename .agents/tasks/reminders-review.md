# Permisos de notificaciones y alarmas exactas para los recordatorios de reservas

El cambio pasa la sincronización de recordatorios de `app.component.ts` a `ReminderService`. El servicio ahora publica el estado de dos permisos (notificaciones y "Alarmas y recordatorios") y guarda las reservas aprobadas para programarlas en cuanto el permiso se conceda. Antes, si el estudiante negaba el permiso al arrancar, la app dejaba de sincronizar hasta el siguiente arranque. Además, con las alarmas exactas denegadas, el plugin 8.3.1 abría la pantalla del sistema en cada `schedule()`, y esas llamadas iban en paralelo. Ahora cada notificación se programa con `isExactNotification` según el permiso real, las llamadas al plugin pasan por una cola, `allowWhileIdle` despierta el teléfono en reposo, y la app muestra avisos diarios (solo en nativo y solo a estudiantes) y una sección nueva en Configuración. Los ocho casos pedidos se cumplen en el código. Lo pendiente es validar en el teléfono y corregir algunos detalles menores.

Watch for: la cadena de diálogos en el primer arranque si el estudiante niega el permiso (likely, de UX, hay que probarla en el dispositivo); la sección nueva no usa el azul institucional `#1a2a4a` (confirmed, no bloqueante); estilos de `.setting-label` duplicados (confirmed, nit); la cola recorre todo el historial de reservas en cada snapshot (likely, de rendimiento, menor).

**Verdict**: APPROVED

## High-level view

`ReminderService` es ahora el dueño del estado: un `BehaviorSubject` privado expuesto como `permissionState$`, con el mismo patrón de `AuthService`. `setPermissionState` encola `scheduleApproved()` en dos transiciones: cuando las notificaciones pasan a `granted`, y cuando las alarmas exactas pasan a `granted` con las notificaciones activas. Esto cubre el permiso concedido tarde (caso 3) y la reprogramación como exactas (caso 8), ya sea desde "Reintentar", desde "Permitir", o al volver de los Ajustes del sistema.

La interacción con el plugin cambió por un motivo comprobado en su código nativo. Con `isExactNotification: false`, `doSchedule` ya no llama a `startActivityForResult` (`LocalNotificationsPlugin.kt:126`). Con `allowWhileIdle` se usa `setAndAllowWhileIdle` o `setExactAndAllowWhileIdle` con `RTC_WAKEUP` (`LocalNotificationManager.kt:362-369`). Todas las llamadas usadas (`checkPermissions`, `requestPermissions`, `checkExactNotificationSetting`, `changeExactNotificationSetting`, `schedule`, `cancel`, `addListener('localNotificationReceived')`) y los campos `display`, `exact_alarm`, `isExactNotification` y `allowWhileIdle` coinciden con `definitions.d.ts` (caso 5). La cola hace que cada snapshot de reservas recorra en serie todo el historial del estudiante.

`AppComponent` sale de inmediato si `isSupported()` es false. Así, en web no hay llamadas nativas, ni listeners, ni alertas (caso 1). Registra un solo listener `appStateChange` (o `visibilitychange` como respaldo). Al volver al primer plano solo llama a `refreshPermissionState()`, sin suscribirse de nuevo, y `ngOnDestroy` limpia las suscripciones y los listeners (caso 2). Los avisos salen una vez por inicio de sesión, gracias a `distinctUntilChanged` sobre el uid. Las claves `reminders_notifications_alert_<uid>` y `reminders_exact_alarm_alert_<uid>` guardan `toDateString()`, así que cada aviso sale como máximo una vez al día (caso 4). Si el estudiante niega el permiso en el primer arranque, puede ver hasta cuatro diálogos seguidos.

La sección de Configuración se muestra con `Capacitor.isNativePlatform() && role === 'student'` y refresca el estado en `ionViewWillEnter` sin crear suscripciones nuevas. El constructor pasó a `inject()`, que hacía falta para inyectar `ReminderService`, y eso además quitó 3 errores de lint preexistentes. Los estilos reutilizan `.action-btn` y la paleta de la página (dorado y `#1a1a1a`) y tienen versión para el tema oscuro. Sin embargo, ningún estilo nuevo usa `#1a2a4a`, porque la página usa `#1a2e5a` desde antes de este cambio, y `.reminders-block .setting-label` copia las siete declaraciones de `.setting-row .setting-label` (caso 7, con estas dos salvedades). Los comentarios están en español, no hay `any` y los `catch` nuevos tipan el error como `unknown`.

Alcance (caso 6): hay cinco archivos modificados, todos de recordatorios o de Configuración. No cambian `package.json` ni `package-lock.json`, no hay tests nuevos, no se tocan mapa, recursos, chatbot ni `functions/`, y no hay commits (HEAD = `origin/main`, `7c3ce11`). La evidencia del coder registra `tsc` y `build` sin errores, y `lint` con 37 errores `prefer-inject` preexistentes, ninguno nuevo. Nada se probó en un dispositivo.

<details>
<summary>Issues (4)</summary>

1. **Diálogos encadenados en el primer arranque** (likely, no bloqueante): si el estudiante ya tiene sesión y niega el diálogo del sistema al arrancar, enseguida sale "Notificaciones desactivadas". Si toca "Reintentar", vuelve a salir el diálogo del sistema y después "Activa las notificaciones". Hay que probarlo en el teléfono. Si resulta molesto, conviene omitir el aviso propio en el mismo arranque en que el sistema acaba de preguntar.
2. **Sin color institucional en la sección nueva** (confirmed, no bloqueante): ninguno de los estilos nuevos usa `#1a2a4a`. Siguen la paleta propia de la página (`#1a2e5a`, dorado, `#1a1a1a`). Hay que confirmar con el usuario si basta con esa coherencia o si quiere el azul institucional, por ejemplo en el texto de `.reminder-status`.
3. **Estilos de `.setting-label` duplicados** (confirmed, nit): `.reminders-block .setting-label` copia línea por línea `.setting-row .setting-label`, y su override oscuro también está duplicado. Se puede usar un selector compartido.
4. **La cola recorre todo el historial en cada snapshot** (likely, menor): `syncBookings` cancela y reprograma, una por una, todas las reservas aprobadas y cancela todas las demás en cada snapshot de Firestore, incluidas las que ya terminaron. Filtrar las reservas cuya hora de fin ya pasó reduciría las llamadas al plugin.

</details>

<details>
<summary>Details</summary>

## Componentes y flujo de datos

```
currentUser$ ─switchMap─> getByStudent(uid) ─> syncBookings() ──┐ (guarda aprobadas)
                                                                 ▼
appStateChange / visibilitychange ─┐                    cola enqueue()
Configuración (ionViewWillEnter,   ├─> refreshPermissionState()   │
  Reintentar, Permitir)            │          │                  │
Avisos de AppComponent ────────────┘          ▼                  ▼
                                   setPermissionState ──> scheduleApproved()
                                   (permissionState$)     cancel + schedule
                                                          isExactNotification = exact
                                                          allowWhileIdle = true
```

## `isExactNotification` y la pantalla que abría el plugin

`doSchedule` en 8.3.1 solo abre "Alarmas y recordatorios" cuando alguna notificación del lote pide alarma exacta:

```kotlin
val honorExact = ... notifications.any { it.isExactNotification }
if (honorExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !canScheduleExactAlarms()) {
    startActivityForResult(call, Intent(ACTION_REQUEST_SCHEDULE_EXACT_ALARM, ...), "exactAlarmScheduleCallback")
    return
}
```

`scheduleForBooking` envía `isExactNotification: this.permissionState.exactAlarm === 'granted'`, así que el plugin solo abriría esa pantalla si el estado en caché dice "concedido" y el sistema dice lo contrario. Ese desfase no dura: según la documentación de `changeExactNotificationSetting`, Android reinicia la app cuando se revoca el permiso, y el arranque vuelve a leer el estado. En Android < 12, `checkExactNotificationSetting` responde `granted` y el plugin no abre nada por debajo de la API 31. La cola evita que varias llamadas compitan por la única llamada pendiente que Capacitor guarda para resultados de actividad.

Por la cola, cada snapshot de reservas ejecuta en serie un `cancel` por cada reserva no aprobada y un `cancel` más un `schedule` por cada aprobada, incluidas las del historial cuyo horario ya pasó. En esas `scheduleForBooking` no programa nada, pero el `cancel` sí pasa por el puente nativo. Antes estas llamadas se lanzaban en paralelo. Ahora son secuenciales y aumentan con el historial del estudiante (likely, menor).

## Secuencia de diálogos en el primer arranque

`initReminders` mantiene el pedido del permiso del sistema al arrancar, igual que antes. Los avisos propios salen cuando `currentUser$` emite un uid de estudiante, así que con la sesión ya guardada las dos cosas pasan casi juntas. Un estudiante que niega el diálogo del sistema ve enseguida "Notificaciones desactivadas". Si toca "Reintentar", Android puede mostrar el diálogo de nuevo (la denegación pasa a ser permanente después de la segunda negativa) y luego aparece "Activa las notificaciones". Son hasta cuatro diálogos seguidos en el primer uso (likely). El límite diario impide que esto se repita, pero conviene probarlo en el teléfono antes de darlo por bueno.

</details>

<details>
<summary>Archivos modificados</summary>

`src/app/core/services/reminder.service.ts`: estado de permisos con `BehaviorSubject`, `isSupported()`, `refreshPermissionState()`, `requestNotificationPermission()`, `openExactAlarmSettings()`, `syncBookings()` con cola serializada, `isExactNotification` y `allowWhileIdle`. Se eliminan `requestPermission()` y `permissionGranted`.

`src/app/app.component.ts`: guarda para web, sincronización sin abandonar si se niega el permiso, listener `appStateChange` (con respaldo `visibilitychange`), avisos diarios por uid y `ngOnDestroy`.

`src/app/features/shared/settings/settings.page.ts`: paso a `inject()`, estado de recordatorios, `retryNotificationPermission()` y `openExactAlarmSettings()`.

`src/app/features/shared/settings/settings.page.html`: bloque "Recordatorios de reservas" visible solo en nativo y para estudiantes.

`src/app/features/shared/settings/settings.page.scss`: estilos del bloque, variante `action-btn--small` y overrides del tema oscuro.

Diff completo: `git -C c:\Neogranada_Conecta diff` (cambios sin commitear sobre `7c3ce11`).

</details>
