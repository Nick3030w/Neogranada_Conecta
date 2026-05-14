# Documento de Requerimientos — Neogranada Conecta

## Introducción

**Neogranada Conecta** es una aplicación móvil institucional desarrollada para la Universidad Militar Nueva Granada (UMNG) de Colombia. Su propósito es permitir a los estudiantes universitarios agendar préstamos de recursos académicos (material lúdico, laboratorios, aulas y otros recursos), y a los administradores gestionar, aprobar o denegar dichas solicitudes.

La aplicación se construye sobre **Ionic + Angular + Capacitor** con **Firebase** como backend (autenticación, base de datos en tiempo real y notificaciones push), siguiendo una arquitectura limpia, escalable y lista para producción. El diseño sigue la identidad visual institucional de la UMNG: fondo azul oscuro, paneles blancos redondeados y detalles dorados.

---

## Glosario

- **App**: La aplicación móvil Neogranada Conecta.
- **Sistema**: El conjunto de frontend (Ionic/Angular) y backend (Firebase) que compone la App.
- **Estudiante**: Usuario registrado con rol `student` que puede consultar recursos y realizar solicitudes de préstamo.
- **Administrador**: Usuario registrado con rol `admin` que gestiona y aprueba/deniega solicitudes de préstamo.
- **Auth_Service**: Servicio Angular responsable de autenticación, registro, logout y recuperación de contraseña mediante Firebase Authentication.
- **Booking_Service**: Servicio Angular responsable de crear, consultar y actualizar solicitudes de préstamo en Firestore.
- **Notification_Service**: Servicio Angular responsable de enviar y recibir notificaciones push y en-app mediante Firebase Cloud Messaging.
- **Chat_Service**: Servicio Angular responsable de gestionar mensajes en tiempo real entre Estudiante y Administrador mediante Firestore.
- **Resource_Service**: Servicio Angular responsable de consultar el catálogo de recursos disponibles en Firestore.
- **Guard**: Angular Route Guard que protege rutas según el estado de autenticación y el rol del usuario.
- **Solicitud**: Registro en Firestore que representa una petición de préstamo de un recurso por parte de un Estudiante.
- **Recurso**: Elemento prestable registrado en Firestore (laboratorio, aula, material lúdico, etc.).
- **Reserva**: Solicitud aprobada que ocupa un slot de tiempo en el calendario.
- **Correo institucional**: Dirección de correo electrónico con dominio `@unimilitar.edu.co`.
- **Código estudiantil**: Identificador numérico único asignado por la UMNG a cada estudiante.
- **Programa académico**: Carrera o posgrado al que pertenece el Estudiante dentro de la UMNG.
- **Estado de solicitud**: Valor enumerado que puede ser `pendiente`, `aprobada`, `denegada` o `cancelada`.
- **Splash Screen**: Pantalla de presentación animada que se muestra al iniciar la App.
- **Modo oscuro**: Tema visual alternativo con paleta de colores oscuros activable por el usuario.
- **APK**: Archivo de instalación de la App para dispositivos Android.

---

## Requerimientos

---

### Requerimiento 1: Pantalla Splash y Arranque de la Aplicación

**User Story:** Como usuario, quiero ver una pantalla de presentación institucional al abrir la App, para que la experiencia de inicio sea coherente con la identidad de la UMNG.

#### Criterios de Aceptación

1. WHEN la App es iniciada en un dispositivo Android, THE Sistema SHALL mostrar la Splash Screen con el logo de la UMNG durante un mínimo de 2 segundos y un máximo de 4 segundos antes de redirigir al flujo de autenticación.
2. WHEN la Splash Screen finaliza y existe una sesión activa persistida, THE Sistema SHALL redirigir al Estudiante o Administrador directamente a su pantalla Home correspondiente sin mostrar la pantalla de Login.
3. WHEN la Splash Screen finaliza y no existe sesión activa, THE Sistema SHALL redirigir al usuario a la pantalla de Login.
4. THE Sistema SHALL mostrar en la Splash Screen el logo PNG de la universidad sobre fondo azul oscuro institucional (`#1a2a4a`).

---

### Requerimiento 2: Registro de Usuarios

**User Story:** Como estudiante interesado en usar la App, quiero registrarme con mis datos institucionales, para que pueda acceder a los servicios de préstamo de la UMNG.

#### Criterios de Aceptación

1. THE Auth_Service SHALL exponer un formulario de registro con los campos: nombre completo, correo institucional, código estudiantil, programa académico, contraseña y confirmación de contraseña. El rol `student` SHALL ser asignado automáticamente a todo usuario que se registre mediante este formulario público; el formulario NO SHALL exponer ningún selector de rol.
2. THE Sistema SHALL reservar el rol `admin` exclusivamente para cuentas creadas directamente en Firebase Console o mediante un script de inicialización seguro, nunca a través del formulario público de registro.
3. WHEN el usuario envía el formulario de registro, THE Auth_Service SHALL validar que el correo ingresado pertenezca al dominio `@unimilitar.edu.co` antes de crear la cuenta.
4. WHEN el correo ingresado no pertenece al dominio `@unimilitar.edu.co`, THEN THE Auth_Service SHALL mostrar el mensaje de error: "Solo se permiten correos institucionales (@unimilitar.edu.co)".
5. WHEN el usuario envía el formulario de registro, THE Auth_Service SHALL validar que la contraseña tenga mínimo 8 caracteres, al menos una letra mayúscula, una letra minúscula y un número.
6. WHEN la contraseña no cumple los criterios de seguridad, THEN THE Auth_Service SHALL mostrar un mensaje descriptivo indicando el criterio incumplido.
7. WHEN el campo de confirmación de contraseña no coincide con el campo de contraseña, THEN THE Auth_Service SHALL mostrar el mensaje: "Las contraseñas no coinciden".
8. WHEN el correo institucional ya está registrado en Firebase Authentication, THEN THE Auth_Service SHALL mostrar el mensaje: "Este correo ya está registrado. Intenta iniciar sesión".
9. WHEN el registro es exitoso, THE Auth_Service SHALL crear el perfil del usuario en Firestore con todos los campos del formulario y el rol `student` asignado automáticamente, y redirigir al usuario al Home del Estudiante.
10. THE Auth_Service SHALL mostrar todos los errores de validación de forma amigable, sin exponer mensajes técnicos internos de Firebase.

---

### Requerimiento 3: Inicio de Sesión

**User Story:** Como usuario registrado, quiero iniciar sesión con mi correo institucional y contraseña, para que pueda acceder a las funcionalidades de la App según mi rol.

#### Criterios de Aceptación

1. THE Auth_Service SHALL exponer una pantalla de Login con campo de correo institucional y campo de contraseña. El rol del usuario SHALL ser determinado exclusivamente por el valor almacenado en su perfil Firestore, nunca por una selección manual en el Login.
2. WHEN el usuario ingresa credenciales válidas y presiona "Ingresar", THE Auth_Service SHALL autenticar al usuario mediante Firebase Authentication, leer su rol desde Firestore y redirigirlo a la pantalla Home correspondiente a su rol (`student` → Home Estudiante, `admin` → Home Administrador).
3. WHEN las credenciales ingresadas son incorrectas, THEN THE Auth_Service SHALL mostrar el mensaje: "Correo o contraseña incorrectos. Verifica tus datos".
4. WHEN el perfil Firestore del usuario autenticado no contiene un rol válido (`student` o `admin`), THEN THE Auth_Service SHALL cerrar la sesión automáticamente y mostrar el mensaje: "No se pudo determinar el rol de tu cuenta. Contacta al administrador".
5. WHEN el usuario presiona "Ingresar" con campos vacíos, THEN THE Auth_Service SHALL mostrar mensajes de validación indicando los campos requeridos sin realizar la llamada a Firebase.
6. THE Auth_Service SHALL persistir la sesión del usuario en el dispositivo de forma que, al cerrar y reabrir la App, el usuario permanezca autenticado sin necesidad de volver a ingresar sus credenciales.

---

### Requerimiento 4: Recuperación de Contraseña

**User Story:** Como usuario registrado, quiero recuperar mi contraseña olvidada mediante mi correo institucional, para que pueda recuperar el acceso a mi cuenta sin contactar soporte.

#### Criterios de Aceptación

1. THE Auth_Service SHALL ofrecer un enlace o botón "¿Olvidaste tu contraseña?" visible en la pantalla de Login.
2. WHEN el usuario ingresa un correo institucional válido y solicita la recuperación, THE Auth_Service SHALL enviar un correo de restablecimiento de contraseña mediante Firebase Authentication.
3. WHEN el correo ingresado para recuperación no está registrado en Firebase Authentication, THEN THE Auth_Service SHALL mostrar el mensaje: "No encontramos una cuenta con ese correo institucional".
4. WHEN el correo de recuperación es enviado exitosamente, THE Auth_Service SHALL mostrar el mensaje: "Revisa tu correo institucional para restablecer tu contraseña".

---

### Requerimiento 5: Cierre de Sesión y Protección de Rutas

**User Story:** Como usuario autenticado, quiero cerrar sesión de forma segura y que las rutas privadas estén protegidas, para que mis datos y los de la institución estén seguros.

#### Criterios de Aceptación

1. WHEN el usuario presiona "Cerrar sesión" en la pantalla de Configuración, THE Auth_Service SHALL invalidar la sesión en Firebase Authentication, limpiar los datos de sesión persistidos en el dispositivo y redirigir al usuario a la pantalla de Login.
2. WHEN un usuario no autenticado intenta acceder a una ruta protegida, THE Guard SHALL redirigir al usuario a la pantalla de Login.
3. WHEN un Estudiante autenticado intenta acceder a una ruta exclusiva del Administrador, THE Guard SHALL redirigir al Estudiante a su pantalla Home y mostrar el mensaje: "No tienes permisos para acceder a esta sección".
4. WHEN un Administrador autenticado intenta acceder a una ruta exclusiva del Estudiante, THE Guard SHALL redirigir al Administrador a su pantalla Home.
5. THE Guard SHALL verificar tanto el estado de autenticación como el rol del usuario en cada navegación a rutas protegidas.

---

### Requerimiento 6: Catálogo de Recursos

**User Story:** Como Estudiante, quiero explorar el catálogo de recursos disponibles para préstamo, para que pueda identificar qué necesito reservar.

#### Criterios de Aceptación

1. THE Resource_Service SHALL recuperar y mostrar el catálogo de recursos desde Firestore, organizado en las categorías: Laboratorios, Aulas, Material lúdico, Elementos deportivos, Botiquín y Base de datos.
2. WHEN el Estudiante selecciona una categoría del catálogo, THE Sistema SHALL mostrar la lista de recursos disponibles dentro de esa categoría con nombre, imagen representativa y estado de disponibilidad.
3. WHEN el Estudiante selecciona un recurso específico, THE Sistema SHALL mostrar la pantalla de detalle con imagen, nombre, descripción, estado de disponibilidad (`disponible` en verde / `no disponible` en rojo) y el botón "Agendar" si el recurso está disponible.
4. WHILE el recurso seleccionado tiene estado `no disponible`, THE Sistema SHALL deshabilitar el botón "Agendar" y mostrar el mensaje: "Este recurso no está disponible en este momento".
5. THE Resource_Service SHALL actualizar el estado de disponibilidad de los recursos en tiempo real mediante listeners de Firestore.

---

### Requerimiento 7: Agendamiento de Préstamos

**User Story:** Como Estudiante, quiero agendar el préstamo de un recurso seleccionando fecha, hora y servicio, para que pueda reservar el recurso que necesito en el momento adecuado.

#### Criterios de Aceptación

1. WHEN el Estudiante presiona "Agendar" en la pantalla de detalle de un recurso disponible, THE Sistema SHALL mostrar el formulario de agendamiento con los campos: fecha, hora, servicio (dropdown con las categorías disponibles) y observaciones (campo de texto opcional).
2. WHEN el Estudiante envía el formulario de agendamiento con todos los campos requeridos completos, THE Booking_Service SHALL crear una Solicitud en Firestore con estado `pendiente`, asociada al Estudiante y al recurso seleccionado.
3. WHEN el Estudiante envía el formulario de agendamiento con campos requeridos vacíos, THEN THE Sistema SHALL mostrar mensajes de validación indicando los campos faltantes sin crear la Solicitud.
4. WHEN la fecha seleccionada es anterior a la fecha actual del dispositivo, THEN THE Sistema SHALL mostrar el mensaje: "La fecha de agendamiento debe ser igual o posterior a hoy".
5. WHEN la Solicitud es creada exitosamente en Firestore, THE Sistema SHALL redirigir al Estudiante a la pantalla de Estado de Confirmación mostrando el estado `pendiente` con un indicador visual de procesamiento.
6. WHEN se crea una nueva Solicitud, THE Notification_Service SHALL enviar una notificación push al Administrador informando que hay una nueva solicitud pendiente de revisión.

---

### Requerimiento 8: Estado de Confirmación de Solicitudes (Estudiante)

**User Story:** Como Estudiante, quiero ver el estado actualizado de mis solicitudes de préstamo, para que pueda saber si fueron aprobadas, denegadas o están pendientes.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al Estudiante la pantalla de Estado de Confirmación con el estado actual de su Solicitud más reciente: `pendiente` (spinner), `aprobada` (ícono de éxito en verde) o `denegada` (ícono de error en rojo).
2. WHEN el estado de una Solicitud cambia en Firestore, THE Sistema SHALL actualizar la pantalla de Estado de Confirmación del Estudiante en tiempo real sin necesidad de recargar la página.
3. WHEN la Solicitud tiene estado `aprobada` o `denegada`, THE Sistema SHALL mostrar un botón "Chatear con la dependencia" que abre el Chat_Service con el Administrador responsable.
4. WHEN la Solicitud tiene estado `aprobada`, THE Notification_Service SHALL enviar una notificación push al Estudiante informando que su solicitud fue aprobada.
5. WHEN la Solicitud tiene estado `denegada`, THE Notification_Service SHALL enviar una notificación push al Estudiante informando que su solicitud fue denegada, incluyendo el motivo si fue especificado por el Administrador.

---

### Requerimiento 9: Gestión de Solicitudes (Administrador)

**User Story:** Como Administrador, quiero revisar, aprobar o denegar las solicitudes de préstamo de los estudiantes, para que pueda gestionar eficientemente el uso de los recursos institucionales.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al Administrador en su pantalla de Estado de Confirmación la lista de todas las Solicitudes con estado `pendiente`, ordenadas por fecha de creación ascendente.
2. WHEN el Administrador selecciona una Solicitud pendiente, THE Sistema SHALL mostrar el detalle completo: nombre del Estudiante, recurso solicitado, fecha, hora, servicio y observaciones.
3. WHEN el Administrador presiona "Aprobar" en una Solicitud pendiente, THE Booking_Service SHALL actualizar el estado de la Solicitud a `aprobada` en Firestore y crear la Reserva correspondiente en el calendario.
4. WHEN el Administrador presiona "Denegar" en una Solicitud pendiente, THE Sistema SHALL solicitar al Administrador un motivo de denegación (campo de texto requerido) antes de actualizar el estado a `denegada` en Firestore.
5. WHEN el Administrador intenta denegar una Solicitud sin ingresar un motivo, THEN THE Sistema SHALL mostrar el mensaje: "Debes ingresar un motivo para denegar la solicitud".
6. WHEN el Administrador aprueba o deniega una Solicitud, THE Notification_Service SHALL enviar la notificación correspondiente al Estudiante según lo definido en el Requerimiento 8.

---

### Requerimiento 10: Calendario de Préstamos

**User Story:** Como usuario (Estudiante o Administrador), quiero visualizar un calendario con las reservas activas, para que pueda planificar el uso de los recursos sin conflictos de horario.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar una vista de calendario mensual con los días que tienen Reservas activas marcados visualmente con el color dorado institucional (`#f0c040`).
2. WHEN el Estudiante accede al calendario, THE Sistema SHALL mostrar únicamente las Reservas asociadas a su cuenta, junto con un contador de "Préstamos vigentes".
3. WHEN el Administrador accede al calendario, THE Sistema SHALL mostrar todas las Reservas activas de todos los Estudiantes.
4. WHEN el usuario selecciona un día marcado en el calendario, THE Sistema SHALL mostrar la lista de Reservas correspondientes a ese día con el nombre del recurso, hora y estado.
5. THE Booking_Service SHALL actualizar el calendario en tiempo real cuando se aprueben o cancelen Reservas en Firestore.

---

### Requerimiento 11: Centro de Notificaciones

**User Story:** Como usuario, quiero recibir y consultar notificaciones sobre el estado de mis solicitudes y eventos relevantes, para que esté informado sin necesidad de revisar manualmente la App.

#### Criterios de Aceptación

1. THE Notification_Service SHALL recibir y almacenar notificaciones push enviadas por Firebase Cloud Messaging en el dispositivo del usuario.
2. THE Sistema SHALL mostrar en el Centro de Notificaciones la lista de notificaciones recibidas, ordenadas por fecha descendente, con ícono, título, descripción y marca de tiempo.
3. WHEN el usuario recibe una nueva notificación con la App en segundo plano o cerrada, THE Notification_Service SHALL mostrar una notificación nativa del sistema operativo Android.
4. WHEN el usuario presiona una notificación nativa, THE Sistema SHALL abrir la App y navegar directamente a la pantalla relacionada con el evento notificado.
5. WHEN el usuario accede al Centro de Notificaciones, THE Sistema SHALL marcar todas las notificaciones no leídas como leídas.
6. THE Sistema SHALL mostrar un indicador de notificaciones no leídas (badge) en el ícono del Centro de Notificaciones en la navegación principal.

---

### Requerimiento 12: Chat entre Estudiante y Dependencia

**User Story:** Como Estudiante o Administrador, quiero comunicarme mediante un chat básico sobre una solicitud específica, para que pueda resolver dudas o coordinar detalles del préstamo sin salir de la App.

#### Criterios de Aceptación

1. THE Chat_Service SHALL crear un canal de chat único por Solicitud, accesible tanto por el Estudiante que realizó la solicitud como por el Administrador asignado.
2. WHEN un usuario envía un mensaje en el chat, THE Chat_Service SHALL persistir el mensaje en Firestore con el contenido, el identificador del remitente, la marca de tiempo y el identificador de la Solicitud asociada.
3. THE Chat_Service SHALL actualizar la lista de mensajes en tiempo real mediante listeners de Firestore, de forma que ambos participantes vean los mensajes nuevos sin necesidad de recargar.
4. WHEN el usuario envía un mensaje vacío, THEN THE Chat_Service SHALL no enviar el mensaje ni crear el registro en Firestore.
5. WHEN un participante del chat recibe un mensaje nuevo con la App en segundo plano, THE Notification_Service SHALL enviar una notificación push indicando que hay un mensaje nuevo en la solicitud correspondiente.
6. THE Sistema SHALL mostrar en el chat el nombre del remitente y la marca de tiempo de cada mensaje.

---

### Requerimiento 13: Perfil de Usuario

**User Story:** Como usuario autenticado, quiero ver y editar mi información de perfil, para que mis datos en la App estén siempre actualizados.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en la pantalla de Perfil los datos del usuario: nombre completo, correo institucional, código estudiantil, programa académico y rol.
2. WHEN el usuario modifica el nombre completo o el programa académico y presiona "Guardar", THE Sistema SHALL actualizar los datos correspondientes en el documento Firestore del usuario.
3. WHEN la actualización del perfil es exitosa, THE Sistema SHALL mostrar el mensaje: "Perfil actualizado correctamente".
4. IF ocurre un error al guardar el perfil en Firestore, THEN THE Sistema SHALL mostrar el mensaje: "No se pudo actualizar el perfil. Intenta de nuevo" sin perder los datos ingresados por el usuario.
5. THE Sistema SHALL permitir al usuario visualizar su avatar o imagen de perfil; WHERE el usuario no haya subido una imagen, THE Sistema SHALL mostrar un avatar generado con las iniciales del nombre completo.

---

### Requerimiento 14: Configuración de la Aplicación

**User Story:** Como usuario, quiero configurar preferencias de la App como notificaciones y modo oscuro, para que la experiencia de uso se adapte a mis necesidades.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en la pantalla de Configuración las opciones: silenciar notificaciones (toggle), ajustes de perfil (enlace), cambiar contraseña (enlace) y cerrar sesión (botón).
2. WHEN el usuario activa el toggle "Silenciar notificaciones", THE Notification_Service SHALL suspender la entrega de notificaciones push al dispositivo del usuario hasta que el toggle sea desactivado.
3. WHERE el dispositivo o el sistema operativo soporta modo oscuro, THE Sistema SHALL ofrecer un toggle "Modo oscuro" en la pantalla de Configuración que aplique el tema oscuro a toda la App.
4. WHEN el usuario activa el modo oscuro, THE Sistema SHALL persistir la preferencia en el almacenamiento local del dispositivo y aplicarla en cada inicio de la App.
5. WHEN el usuario presiona "Cambiar contraseña", THE Auth_Service SHALL enviar un correo de restablecimiento de contraseña al correo institucional del usuario y mostrar el mensaje: "Revisa tu correo para cambiar tu contraseña".

---

### Requerimiento 15: Mapa de Bloques y Sedes

**User Story:** Como Estudiante, quiero consultar un mapa o listado de los bloques y sedes de la UMNG, para que pueda ubicar fácilmente el lugar donde se encuentra el recurso que deseo reservar.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en la pantalla de Mapa un buscador de texto y una lista de bloques y sedes de la UMNG, cada uno con nombre, ícono representativo y descripción breve.
2. WHEN el Estudiante ingresa texto en el buscador, THE Sistema SHALL filtrar la lista de bloques y sedes en tiempo real mostrando únicamente los resultados que coincidan con el texto ingresado (búsqueda insensible a mayúsculas/minúsculas).
3. WHEN el Estudiante selecciona un bloque o sede de la lista, THE Sistema SHALL mostrar información detallada del lugar: nombre, descripción, recursos disponibles asociados y, WHERE esté disponible, una imagen del lugar.
4. IF no se encuentran resultados para el texto de búsqueda ingresado, THEN THE Sistema SHALL mostrar el mensaje: "No se encontraron bloques o sedes con ese nombre".

---

### Requerimiento 16: Tutorial de Uso

**User Story:** Como Estudiante nuevo, quiero acceder a un tutorial en video sobre cómo usar la App, para que pueda aprender a utilizar todas las funcionalidades sin necesidad de asistencia externa.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en la pantalla de Tutorial un reproductor de video con el logo de la UMNG, controles de reproducción (play/pausa, barra de progreso) y botones de valoración (like/dislike).
2. WHEN el Estudiante presiona el botón "like" o "dislike", THE Sistema SHALL registrar la valoración asociada al identificador del usuario en Firestore.
3. WHEN el Estudiante ya ha valorado el tutorial, THE Sistema SHALL mostrar visualmente activo el botón de la valoración previamente seleccionada.
4. THE Sistema SHALL soportar la reproducción del video tanto en modo retrato como en modo paisaje en dispositivos Android.

---

### Requerimiento 17: Home del Estudiante

**User Story:** Como Estudiante autenticado, quiero ver una pantalla de inicio con acceso rápido a todas las funcionalidades, para que pueda navegar eficientemente por la App.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en el Home del Estudiante el mensaje de bienvenida "Bienvenido a Neogranada Conecta" junto con el nombre del Estudiante autenticado.
2. THE Sistema SHALL mostrar en el Home del Estudiante un grid de accesos directos con íconos dorados para: Catálogo, Tutorial, Calendario, Configuración, Mapa y Perfil.
3. WHEN el Estudiante presiona cualquier acceso directo del grid, THE Sistema SHALL navegar a la pantalla correspondiente.
4. THE Sistema SHALL mostrar en el Home del Estudiante un indicador visual si existen notificaciones no leídas.

---

### Requerimiento 18: Home del Administrador

**User Story:** Como Administrador autenticado, quiero ver una pantalla de inicio con acceso rápido a las funcionalidades de gestión, para que pueda administrar eficientemente las solicitudes de préstamo.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar en el Home del Administrador un grid de accesos directos con íconos dorados para: Calendario, Configuración, Confirmación (gestión de solicitudes) y Perfil.
2. WHEN el Administrador presiona cualquier acceso directo del grid, THE Sistema SHALL navegar a la pantalla correspondiente.
3. THE Sistema SHALL mostrar en el Home del Administrador un contador de solicitudes pendientes de revisión, actualizado en tiempo real desde Firestore.
4. THE Sistema SHALL mostrar en el Home del Administrador un indicador visual si existen notificaciones no leídas.

---

### Requerimiento 19: Diseño Visual e Identidad Institucional

**User Story:** Como usuario de la App, quiero que la interfaz refleje la identidad visual de la UMNG con un diseño moderno y profesional, para que la experiencia sea coherente con la imagen institucional.

#### Criterios de Aceptación

1. THE Sistema SHALL aplicar en todas las pantallas la paleta de colores institucional definida mediante variables SCSS: fondo azul oscuro (`#1a2a4a`), paneles blancos con bordes redondeados, y detalles/acentos dorados (`#f0c040`).
2. THE Sistema SHALL utilizar componentes reutilizables (tarjetas, botones, headers) definidos en el módulo `shared` de la arquitectura, garantizando consistencia visual en toda la App.
3. THE Sistema SHALL aplicar sombras suaves en tarjetas y paneles, transiciones de navegación fluidas y tipografía clara y profesional en todas las pantallas.
4. THE Sistema SHALL reservar un espacio visible en la pantalla de Login y en la Splash Screen para el logo PNG de la UMNG.
5. THE Sistema SHALL ser diseñado con enfoque mobile-first optimizado para dispositivos Android con resoluciones estándar (360dp–414dp de ancho).

---

### Requerimiento 20: Arquitectura y Escalabilidad

**User Story:** Como desarrollador, quiero que la App siga una arquitectura limpia y escalable, para que el código sea mantenible y extensible a futuro.

#### Criterios de Aceptación

1. THE Sistema SHALL organizar el código fuente bajo la estructura de directorios: `src/app/core/`, `src/app/shared/`, `src/app/features/`, `src/app/auth/`, con servicios en `core/services/`, guards en `core/guards/` e interfaces en `core/interfaces/`.
2. THE Sistema SHALL definir todas las interfaces TypeScript de las entidades del dominio (Usuario, Solicitud, Recurso, Reserva, Notificación, Chat, Rol) en `core/interfaces/` antes de ser utilizadas en servicios o componentes.
3. THE Sistema SHALL implementar lazy loading para todos los módulos de features, de forma que cada ruta cargue su módulo únicamente cuando sea navegada por primera vez.
4. THE Sistema SHALL centralizar todas las variables de entorno (claves de Firebase, URLs, configuraciones) en los archivos `src/environments/environment.ts` y `src/environments/environment.prod.ts`.
5. THE Sistema SHALL definir todas las variables de diseño (colores, tipografías, espaciados, radios de borde) como variables SCSS en `src/theme/variables.scss` para garantizar consistencia y facilitar cambios globales.

---

### Requerimiento 21: Generación del APK Android

**User Story:** Como desarrollador, quiero poder generar un APK de Android funcional a partir del proyecto, para que la App pueda ser instalada y probada en dispositivos físicos.

#### Criterios de Aceptación

1. THE Sistema SHALL ser configurable mediante Capacitor para compilar y generar un APK de Android ejecutando los comandos estándar: `ionic build`, `npx cap sync android` y la compilación desde Android Studio.
2. THE Sistema SHALL incluir en `capacitor.config.ts` el `appId` con formato de dominio inverso (`co.edu.unimilitar.neogranada`), el `appName` "Neogranada Conecta" y la configuración del Splash Screen.
3. WHEN se genera el APK en modo producción, THE Sistema SHALL utilizar las variables de entorno de `environment.prod.ts` y no exponer claves de desarrollo.
