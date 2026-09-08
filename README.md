<p align="center">
  <img src="https://img.shields.io/badge/Angular-20-dd0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 20"/>
  <img src="https://img.shields.io/badge/Ionic-8-3880ff?style=for-the-badge&logo=ionic&logoColor=white" alt="Ionic 8"/>
  <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Capacitor-8-119eff?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor 8"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9"/>
</p>

<h1 align="center">📱 Neogranada Conecta</h1>

<p align="center">
  <strong>Plataforma móvil de gestión de préstamos y reservas de recursos académicos</strong><br/>
  Universidad Militar Nueva Granada
</p>

<p align="center">
  <em>Optimiza la experiencia universitaria conectando estudiantes con los recursos que necesitan, en tiempo real.</em>
</p>

---

## � Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Compilación Android](#-compilación-android)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Diseño y UX](#-diseño-y-ux)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Neogranada Conecta** es una aplicación móvil híbrida que digitaliza y centraliza el proceso de préstamo y reserva de recursos universitarios en la Universidad Militar Nueva Granada.

La plataforma elimina los procesos manuales y presenciales, ofreciendo a estudiantes y administradores una experiencia fluida, organizada y en tiempo real para gestionar:

| Recurso | Descripción |
|---------|-------------|
| 🏫 Aulas | Reserva de salones para actividades académicas |
| 🔬 Laboratorios | Solicitud de espacios de práctica e investigación |
| 🏀 Elementos deportivos | Préstamo de material para actividades físicas |
| 🎵 Instrumentos musicales | Gestión de equipos musicales disponibles |
| 🎲 Material lúdico | Préstamo de recursos recreativos y didácticos |
| 📚 Biblioteca | Consulta de información y recursos bibliográficos |
| 💾 Bases de datos | Acceso a recursos digitales académicos |
| 🩺 Botiquín | Información sobre recursos de primeros auxilios |

---

## ✨ Características

### 👨‍🎓 Portal Estudiante

- **Catálogo de recursos** — Exploración completa de recursos disponibles con filtros por categoría
- **Disponibilidad en tiempo real** — Consulta de horarios libres antes de reservar
- **Reserva inteligente** — Agendamiento con validación de conflictos de horario
- **Calendario personal** — Visualización de todas las reservas activas y pasadas
- **Chat en tiempo real** — Comunicación directa con administradores por cada solicitud
- **Chat entre estudiantes** — Búsqueda de compañeros por nombre o código estudiantil y conversación uno a uno, sin solicitud de amistad, con un asunto universitario que da contexto (reserva de un recurso, trabajo en grupo, actividad deportiva…)
- **Mapa interactivo** — Ubicación de bloques y recursos dentro del campus
- **Notificaciones** — Alertas sobre estado de solicitudes y novedades
- **Tutorial de bienvenida** — Guía interactiva para nuevos usuarios
- **Perfil personalizable** — Foto de perfil (cámara o galería), datos de contacto y preferencias de cuenta: tema, notificaciones, pantalla de inicio y categoría favorita del catálogo

### 👨‍💼 Portal Administrador

- **Panel de gestión** — Vista centralizada de todas las solicitudes entrantes
- **Aprobación/Rechazo** — Flujo ágil con motivos de denegación personalizados
- **Calendario administrativo** — Panorama completo de reservas aprobadas
- **Chat con estudiantes** — Comunicación contextual por cada reserva
- **Notificaciones inteligentes** — Control de alertas con opción de silencio
- **Perfil personalizable** — Misma pantalla de configuración de perfil que el estudiante: foto, cargo, contacto y preferencias de cuenta

### 🔐 Seguridad y Acceso

- Autenticación segura con Firebase Auth
- Control de acceso basado en roles (`student` | `admin`)
- Guards de ruta para protección de áreas restringidas
- Recuperación de contraseña por correo electrónico

---

## 🛠 Stack Tecnológico

### ¿Por qué estas tecnologías?

| Tecnología | Versión | Razón de elección |
|------------|---------|-------------------|
| **Angular** | 20 | Framework robusto con tipado fuerte, standalone components y excelente ecosistema para aplicaciones empresariales |
| **Ionic Framework** | 8 | Componentes nativos multiplataforma que proporcionan UX nativa sin código duplicado |
| **Capacitor** | 8 | Bridge moderno para APIs nativas (cámara, notificaciones, haptics) con mejor rendimiento que Cordova |
| **Firebase Auth** | 12 | Autenticación segura y escalable sin necesidad de backend propio |
| **Cloud Firestore** | 12 | Base de datos NoSQL en tiempo real, ideal para sincronización instantánea de reservas y chat |
| **TypeScript** | 5.9 | Tipado estático que reduce errores en tiempo de desarrollo y mejora la mantenibilidad |
| **RxJS** | 7.8 | Programación reactiva para manejar flujos de datos en tiempo real (chat, notificaciones, estados) |
| **SCSS** | — | Preprocesador CSS con variables y mixins para mantener consistencia visual |
| **ESLint** | 9 | Análisis estático de código para mantener calidad y estándares |
| **Karma + Jasmine** | — | Framework de testing unitario integrado con Angular |

### Diagrama de tecnologías

```
┌─────────────────────────────────────────────────────┐
│                   FRONTEND                          │
│  ┌───────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Angular  │  │  Ionic   │  │  TypeScript    │  │
│  │    20     │  │    8     │  │     5.9        │  │
│  └───────────┘  └──────────┘  └────────────────┘  │
├─────────────────────────────────────────────────────┤
│                   NATIVE LAYER                      │
│  ┌─────────────────────────────────────────────┐   │
│  │            Capacitor 8                      │   │
│  │   (Android · Haptics · StatusBar · Splash)  │   │
│  └─────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                   BACKEND (BaaS)                    │
│  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Firebase Auth│  │   Cloud Firestore        │   │
│  │  (Sesiones) │  │  (Datos en tiempo real)   │   │
│  └──────────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 🏗 Arquitectura

La aplicación sigue una **arquitectura modular basada en features** con separación clara de responsabilidades:

```
src/app/
│
├── 📁 core/                    # Capa central (singleton)
│   ├── guards/                 # Protección de rutas
│   │   ├── auth.guard.ts       # Requiere sesión activa
│   │   ├── no-auth.guard.ts    # Solo usuarios sin sesión
│   │   └── role.guard.ts       # Valida rol (student/admin)
│   ├── interfaces/             # Contratos de datos
│   │   ├── user.interface.ts
│   │   ├── booking.interface.ts
│   │   ├── resource.interface.ts
│   │   ├── chat.interface.ts
│   │   ├── notification.interface.ts
│   │   └── campus-block.interface.ts
│   └── services/               # Lógica de negocio
│       ├── auth.service.ts
│       ├── booking.service.ts
│       ├── chat.service.ts          # Mensajería por canal (solicitud o conversación)
│       ├── student-chat.service.ts  # Conversaciones directas entre estudiantes
│       ├── user.service.ts          # Directorio y búsqueda de estudiantes
│       ├── image.service.ts         # Recorte/compresión de la foto de perfil
│       ├── notification.service.ts
│       ├── resource.service.ts
│       └── theme.service.ts
│
├── 📁 features/                # Módulos por dominio
│   ├── auth/                   # Autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── student/                # Área estudiantil
│   │   ├── home/
│   │   ├── catalog/
│   │   ├── availability/
│   │   ├── booking/
│   │   ├── confirmation/
│   │   ├── calendar/
│   │   ├── library/
│   │   ├── databases/
│   │   ├── map/
│   │   ├── block-detail/
│   │   ├── chats/
│   │   ├── students/           # Directorio para buscar compañeros
│   │   └── tutorial/
│   ├── admin/                  # Área administrativa
│   │   ├── home/
│   │   ├── confirmation/
│   │   ├── calendar/
│   │   └── chats/
│   └── shared/                 # Componentes compartidos
│       ├── chat/
│       ├── notifications/
│       ├── profile/
│       └── settings/
│
├── app.routes.ts               # Configuración de rutas (lazy loading)
└── app.component.ts            # Componente raíz
```

### Principios de diseño

- **Standalone Components** — Sin NgModules; cada componente declara sus propias dependencias
- **Lazy Loading** — Cada página se carga bajo demanda para optimizar el tiempo de arranque
- **Reactive Streams** — Uso de `BehaviorSubject` y `Observable` para estado en tiempo real
- **Guard-based routing** — Seguridad declarativa a nivel de ruta
- **Feature-first organization** — Código organizado por funcionalidad, no por tipo de archivo

### Colecciones en Firestore

| Colección | Contenido |
|-----------|-----------|
| `users/{uid}` | Perfil, foto (data URL) y preferencias de cuenta |
| `resources/{id}` | Catálogo de recursos |
| `bookings/{id}` | Solicitudes de reserva |
| `notifications/{id}` | Avisos por usuario |
| `conversations/{id}` | Conversaciones directas entre estudiantes |
| `chats/{channelId}/messages/{id}` | Mensajes de cualquier chat |

**Un solo canal de mensajes.** Tanto el chat de una solicitud como el chat entre estudiantes guardan sus mensajes en `chats/{channelId}/messages`. El `channelId` es el `bookingId` en el primer caso y el `conversationId` en el segundo, así que la pantalla de chat se reutiliza sin duplicar lógica.

**Conversaciones sin duplicados.** El id de una conversación directa se deriva de los dos `uid` ordenados (`uidA__uidB`), de modo que dos estudiantes siempre caen en el mismo hilo y no hace falta solicitud de amistad: basta con abrirlo. El documento guarda `participantIds` (para consultar con `array-contains`), una copia mínima de cada participante (nombre, código y programa, sin la foto para no inflar el documento), el asunto y `lastReadAt` por usuario para saber qué está sin leer.

> **Reglas de seguridad:** las reglas de Firestore se administran en la consola de Firebase y no viven en este repositorio. La colección `conversations` debe permitir lectura y escritura solo a los `uid` incluidos en `participantIds`, y el directorio de estudiantes requiere que un estudiante autenticado pueda leer los perfiles de otros estudiantes para poder buscarlos.

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Ionic CLI** (opcional, recomendado)

```bash
npm install -g @ionic/cli
```

### Configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU-USUARIO/neogranada-conecta.git
cd neogranada-conecta

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
ionic serve
# o sin Ionic CLI:
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

### Variables de entorno

El proyecto utiliza Firebase. Configura tus credenciales en:

```
src/environments/environment.ts          # Desarrollo
src/environments/environment.prod.ts     # Producción
```

---

## 📜 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Compilación de producción |
| `npm run watch` | Compilación con hot-reload |
| `npm run test` | Ejecutar tests unitarios |
| `npm run lint` | Análisis estático de código |

---

## 📱 Compilación Android

```bash
# Compilar la aplicación web
ionic build --prod

# Sincronizar con el proyecto nativo
npx cap sync android

# Abrir en Android Studio
npx cap open android
```

> **App ID:** `co.edu.unimilitar.neogranada`  
> **Directorio de salida:** `www/`

---

## 🎨 Diseño y UX

La interfaz sigue la identidad visual institucional de la Universidad Militar Nueva Granada:

| Elemento | Valor |
|----------|-------|
| Color primario | `#1a2a4a` (Azul institucional) |
| Enfoque | Mobile-first |
| Componentes | Ionic UI Kit nativo |
| Iconografía | Ionicons 7 |
| Navegación | Flujo lineal con retorno contextual |
| Feedback | Haptics nativos en acciones clave |

### Principios UX

- ✅ Navegación intuitiva con máximo 3 taps para completar una reserva
- ✅ Estados de carga y vacíos con mensajes claros
- ✅ Feedback inmediato con iconografía y color
- ✅ Tutorial de onboarding para nuevos usuarios
- ✅ Modo oscuro configurable

---

## 📄 Licencia

Este proyecto es de uso **académico y educativo**, desarrollado como parte del programa académico de la Universidad Militar Nueva Granada.

---

<p align="center">
  Desarrollado con 💙 para la comunidad Neogranadina
</p>
