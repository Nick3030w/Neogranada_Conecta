<p align="center">
  <img src="https://img.shields.io/badge/Angular-20-dd0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 20"/>
  <img src="https://img.shields.io/badge/Ionic-8-3880ff?style=for-the-badge&logo=ionic&logoColor=white" alt="Ionic 8"/>
  <img src="https://img.shields.io/badge/Firebase-12-ffca28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
  <img src="https://img.shields.io/badge/Cloud_Functions-Gemini-4285f4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="Cloud Functions + Gemini"/>
  <img src="https://img.shields.io/badge/Capacitor-8-119eff?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor 8"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9"/>
</p>

<h1 align="center">📱 Neogranada Conecta</h1>

<p align="center">
  <strong>Plataforma móvil de gestión de préstamos y reservas de recursos académicos</strong><br/>
  Universidad Militar Nueva Granada
</p>

<p align="center">
  <em>Optimiza la experiencia universitaria conectando estudiantes con los recursos que necesitan — y entre sí — en tiempo real.</em>
</p>

<p align="center">
  <strong>Asistente con IA (Gemini)</strong> · <strong>Chat en tiempo real entre estudiantes</strong> · <strong>Arquitectura serverless segura</strong>
</p>

---

## Tabla de Contenidos

- [Descripción](#descripción)
- [Funcionalidades Destacadas](#-funcionalidades-destacadas)
  - [Asistente Virtual con IA — NeoBot](#-asistente-virtual-con-ia--neobot)
  - [Chat en Tiempo Real entre Estudiantes](#-chat-en-tiempo-real-entre-estudiantes)
- [Características Completas](#características-completas)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Decisiones de Ingeniería](#-decisiones-de-ingeniería)
- [Instalación](#instalación)
- [Scripts Disponibles](#-scripts-disponibles)
- [Compilación Android](#-compilación-android)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Diseño y UX](#diseño-y-ux)
- [Licencia](#-licencia)

---

## Descripción

**Neogranada Conecta** es una aplicación móvil híbrida que digitaliza y centraliza el proceso de préstamo y reserva de recursos universitarios en la Universidad Militar Nueva Granada.

La plataforma elimina los procesos manuales y presenciales, ofreciendo a estudiantes y administradores una experiencia fluida, organizada y en tiempo real. Más allá de la reserva de recursos, integra dos componentes que elevan el proyecto por encima de un CRUD convencional: un **asistente conversacional impulsado por IA generativa (Google Gemini)** servido a través de una **arquitectura serverless segura**, y una **mensajería instantánea entre estudiantes** construida sobre listeners reactivos de Firestore.

| Recurso | Descripción |
|---------|-------------|
| Aulas | Reserva de salones para actividades académicas |
| Laboratorios | Solicitud de espacios de práctica e investigación |
| Elementos deportivos | Préstamo de material para actividades físicas |
| Instrumentos musicales | Gestión de equipos musicales disponibles |
| Material lúdico | Préstamo de recursos recreativos y didácticos |
| Biblioteca | Consulta de información y recursos bibliográficos |
| Bases de datos | Acceso a recursos digitales académicos |
| Botiquín | Información sobre recursos de primeros auxilios |

---

## ⭐ Funcionalidades Destacadas

### 🤖 Asistente Virtual con IA — NeoBot

**NeoBot** es un asistente conversacional integrado en la app, impulsado por **Google Gemini**, que resuelve dudas de los estudiantes sobre reservas, recursos y uso de la plataforma en lenguaje natural.

La parte más interesante no es que "responda preguntas", sino **cómo está construido**, priorizando seguridad y control de costos:

- **🔒 La API key nunca viaja al cliente.** En lugar de llamar a Gemini desde Angular (lo que expondría la clave en el bundle y permitiría que cualquiera agotara la cuota), la app invoca una **Cloud Function** (`askChatbot`) que actúa como *proxy seguro*. La clave se almacena como **secreto de Firebase** (`defineSecret`) y solo existe en el servidor.
- **🔐 Acceso autenticado.** La función rechaza cualquier petición sin sesión válida (`HttpsError 'unauthenticated'`), de modo que solo estudiantes y administradores logueados consumen el modelo.
- **🛡️ Validación y saneamiento de entrada.** Se valida que el mensaje no esté vacío ni exceda 1000 caracteres, y se recorta el historial a los últimos turnos antes de enviarlo al modelo.
- **💰 Control de gasto.** Uso de `maxInstances` para acotar picos, modelo *Flash-Lite* (rápido y económico) y `maxOutputTokens` limitados.
- **🎯 Respuestas en contexto.** Un *system prompt* propio (`knowledge-base.ts`) ancla al modelo al dominio de la aplicación, y una `temperature` baja (0.3) prioriza respuestas consistentes sobre creativas.
- **💾 Historial de conversaciones.** El estudiante puede consultar sus charlas previas con NeoBot.

```
┌──────────────┐   httpsCallable   ┌────────────────────┐   API segura   ┌──────────┐
│  App Angular │ ───────────────▶ │  Cloud Function     │ ─────────────▶ │  Gemini  │
│  (ChatbotSvc)│                   │  askChatbot (proxy) │                │  (API)   │
│   SIN key    │ ◀─────────────── │  key = secreto 🔒   │ ◀───────────── │          │
└──────────────┘     respuesta     └────────────────────┘                └──────────┘
```

> **Por qué importa:** este patrón —*BaaS como backend, función serverless como capa de confianza para claves y validación*— es exactamente el tipo de decisión de arquitectura que se espera de un ingeniero que diseña sistemas seguros, no solo interfaces.

---

### 💬 Chat en Tiempo Real entre Estudiantes

La app incluye **mensajería directa (DM) uno a uno entre estudiantes**, pensada para coordinar trabajos en grupo, grupos de estudio, actividades deportivas/culturales o préstamos de recursos. Está construida sobre **Cloud Firestore** con actualizaciones en tiempo real mediante `onSnapshot`.

Puntos técnicos que vale la pena resaltar:

- **🆔 Identificadores de conversación determinísticos.** Cada par de estudiantes comparte un único documento cuyo id se deriva de ordenar sus `uid` (`uidA__uidB`). Esto **elimina hilos duplicados por diseño** y hace innecesario cualquier sistema de "solicitud de amistad": abrir la conversación basta para empezar a escribir.
- **♻️ Escritura idempotente sin lectura previa.** La conversación se crea o refresca con un único `setDoc({ merge: true })`, evitando un `getDoc` previo que las reglas de seguridad denegarían sobre un documento aún inexistente. Un solo *round-trip*, sin condiciones de carrera.
- **⚡ Tiempo real reactivo (RxJS + Firestore).** Las conversaciones se exponen como `Observable` que sigue el *stream* del perfil autenticado (`switchMap`, `distinctUntilChanged`), de modo que la lista arranca en cuanto el `uid` está disponible, incluso tras recargar.
- **📑 Consultas optimizadas sin índices compuestos.** Se consulta con `array-contains` sobre `participantIds` y el **ordenamiento se resuelve en cliente**, evitando exigir índices compuestos en Firestore.
- **✅ Estado de lectura por participante.** Cada conversación guarda `lastReadAt` por usuario, lo que permite calcular mensajes no leídos y badges de notificación de forma precisa.
- **🏷️ Conversaciones con contexto.** Cada chat se etiqueta con un *asunto* académico (reserva, trabajo en grupo, estudio, deportiva, cultural o general).
- **🔔 Notificaciones desacopladas.** El aviso al destinatario es secundario: si la notificación falla, el mensaje ya se entregó (el envío nunca depende del aviso).
- **🧩 Reutilización de infraestructura.** Los mensajes directos y los de las solicitudes de reserva comparten la misma estructura (`chats/{channelId}/messages`), reutilizando la misma pantalla de chat para ambos casos.

> **Por qué importa:** modela un problema real de datos (unicidad, concurrencia, lectura en tiempo real y eficiencia de consultas) con soluciones elegantes en lugar de fuerza bruta — justo lo que distingue a un desarrollador que *diseña* de uno que solo *conecta*.

---

## Características Completas

### Portal Estudiante

- **Catálogo de recursos** — Exploración completa con filtros por categoría
- **Disponibilidad en tiempo real** — Consulta de horarios libres antes de reservar
- **Reserva inteligente** — Agendamiento con validación de conflictos de horario
- **Calendario personal** — Visualización de reservas activas y pasadas
- **Chat con administradores** — Comunicación directa por cada solicitud
- **Chat entre estudiantes (DM)** — Mensajería instantánea uno a uno ⭐
- **Directorio de estudiantes** — Búsqueda de compañeros por nombre o código
- **Asistente NeoBot (IA)** — Resolución de dudas con Google Gemini ⭐
- **Mapa interactivo** — Ubicación de bloques y recursos del campus
- **Notificaciones** — Alertas sobre estado de solicitudes y mensajes
- **Tutorial de bienvenida** — Guía interactiva para nuevos usuarios
- **Perfil personalizable** — Configuración de datos y preferencias

### Portal Administrador

- **Panel de gestión** — Vista centralizada de todas las solicitudes entrantes
- **Aprobación/Rechazo** — Flujo ágil con motivos de denegación personalizados
- **Calendario administrativo** — Panorama completo de reservas aprobadas
- **Chat con estudiantes** — Comunicación contextual por cada reserva
- **Notificaciones inteligentes** — Control de alertas con opción de silencio

### Seguridad y Acceso

- Autenticación con **Firebase Auth** y restricción a correos institucionales (`@unimilitar.edu.co`)
- Control de acceso basado en roles (`student` | `admin`)
- Guards de ruta funcionales (`authGuard`, `noAuthGuard`, `roleGuard`)
- Reglas de seguridad declarativas en **Firestore** (`firestore.rules`)
- Recuperación de contraseña por correo electrónico
- Secretos sensibles (API keys) resguardados en el servidor, nunca en el cliente

---

## Stack Tecnológico

### ¿Por qué estas tecnologías?

| Tecnología | Versión | Razón de elección |
|------------|---------|-------------------|
| **Angular** | 20 | Framework robusto con tipado fuerte, standalone components y excelente ecosistema para aplicaciones empresariales |
| **Ionic Framework** | 8 | Componentes nativos multiplataforma que proporcionan UX nativa sin código duplicado |
| **Capacitor** | 8 | Bridge moderno para APIs nativas (haptics, notificaciones, status bar) con mejor rendimiento que Cordova |
| **Firebase Auth** | 12 | Autenticación segura y escalable sin necesidad de backend propio |
| **Cloud Firestore** | 12 | Base de datos NoSQL en tiempo real, ideal para sincronización instantánea de reservas y chat |
| **Cloud Functions** | v2 | Capa serverless de confianza: proxy seguro al modelo de IA y resguardo de secretos |
| **Google Gemini** | Flash-Lite | Modelo de IA generativa rápido y económico para el asistente conversacional |
| **TypeScript** | 5.9 | Tipado estático que reduce errores y mejora la mantenibilidad |
| **RxJS** | 7.8 | Programación reactiva para flujos de datos en tiempo real (chat, notificaciones, sesión) |
| **SCSS** | — | Preprocesador CSS con variables y mixins para consistencia visual |
| **ESLint** | 9 | Análisis estático para mantener calidad y estándares |
| **Karma + Jasmine** | — | Framework de testing unitario integrado con Angular |

### Diagrama de arquitectura tecnológica

```
┌─────────────────────────────────────────────────────┐
│                      FRONTEND                        │
│  ┌───────────┐  ┌──────────┐  ┌────────────────┐    │
│  │  Angular  │  │  Ionic   │  │   TypeScript   │    │
│  │    20     │  │    8     │  │      5.9       │    │
│  └───────────┘  └──────────┘  └────────────────┘    │
├─────────────────────────────────────────────────────┤
│                    NATIVE LAYER                      │
│  ┌─────────────────────────────────────────────┐    │
│  │                Capacitor 8                   │    │
│  │   (Android · Haptics · StatusBar · Splash)   │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│                   BACKEND (BaaS)                     │
│  ┌──────────────┐  ┌──────────────────────────┐     │
│  │ Firebase Auth│  │     Cloud Firestore      │     │
│  │  (Sesiones)  │  │   (Datos + chat en vivo) │     │
│  └──────────────┘  └──────────────────────────┘     │
│  ┌─────────────────────────────────────────────┐    │
│  │   Cloud Functions  →  Google Gemini (IA)     │    │
│  │      (proxy seguro · secretos · auth)        │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

## Arquitectura

La aplicación sigue una **arquitectura modular basada en features** con separación clara de responsabilidades:

```
src/app/
│
├── 📁 core/                    # Capa central (singleton)
│   ├── guards/                 # Protección de rutas (funcionales)
│   │   ├── auth.guard.ts       # Requiere sesión activa
│   │   ├── no-auth.guard.ts    # Solo usuarios sin sesión
│   │   └── role.guard.ts       # Valida rol (student/admin)
│   ├── interfaces/             # Contratos de datos
│   │   ├── user.interface.ts
│   │   ├── booking.interface.ts
│   │   ├── resource.interface.ts
│   │   ├── chat.interface.ts
│   │   ├── chatbot.interface.ts
│   │   ├── notification.interface.ts
│   │   └── campus-block.interface.ts
│   └── services/               # Lógica de negocio
│       ├── auth.service.ts
│       ├── booking.service.ts
│       ├── chat.service.ts
│       ├── student-chat.service.ts     # DM entre estudiantes ⭐
│       ├── chatbot.service.ts          # Cliente de NeoBot (IA) ⭐
│       ├── chatbot-history.service.ts
│       ├── notification.service.ts
│       ├── reminder.service.ts
│       ├── resource.service.ts
│       ├── image.service.ts
│       ├── theme.service.ts
│       └── user.service.ts
│
├── 📁 features/                # Módulos por dominio
│   ├── auth/                   # login · register · forgot-password
│   ├── student/                # home · catalog · availability · booking ·
│   │                           # confirmation · calendar · library · databases ·
│   │                           # map · block-detail · chats · students · tutorial
│   ├── admin/                  # home · confirmation · calendar · chats
│   └── shared/                 # chat · chatbot · notifications · profile · settings
│
├── app.routes.ts               # Rutas con lazy loading y guards
└── app.component.ts            # Componente raíz

functions/                      # Cloud Functions (backend serverless)
├── src/
│   ├── index.ts                # askChatbot: proxy seguro a Gemini ⭐
│   └── knowledge-base.ts       # System prompt del asistente
└── package.json
```

### Principios de diseño

- **Standalone Components** — Sin NgModules; cada componente declara sus dependencias
- **Lazy Loading** — Cada página se carga bajo demanda para optimizar el arranque
- **Reactive Streams** — `BehaviorSubject` / `Observable` para estado en tiempo real
- **Guard-based routing** — Seguridad declarativa a nivel de ruta
- **Feature-first organization** — Código organizado por funcionalidad, no por tipo de archivo
- **Serverless trust layer** — Las operaciones sensibles (IA, secretos) se delegan a Cloud Functions

---

## 🧠 Decisiones de Ingeniería

Un resumen de las decisiones técnicas que sustentan el proyecto y el razonamiento detrás de ellas:

| Decisión | Problema que resuelve | Beneficio |
|----------|----------------------|-----------|
| **Proxy serverless para la IA** | La API key quedaría expuesta en el cliente | Seguridad de credenciales y control de cuota/costos |
| **IDs de conversación determinísticos** | Hilos duplicados entre el mismo par de usuarios | Unicidad garantizada por diseño, sin lógica extra |
| **`setDoc` idempotente con `merge`** | Condiciones de carrera y lecturas denegadas por reglas | Creación/actualización atómica en un solo round-trip |
| **`array-contains` + orden en cliente** | Índices compuestos costosos en Firestore | Consultas más simples y sin configuración de índices |
| **`switchMap` sobre el perfil autenticado** | La query de chat podía arrancar sin `uid` tras recargar | Streams fiables alineados con la sesión |
| **Notificaciones desacopladas del envío** | Un fallo en el aviso bloquearía el mensaje | Entrega de mensajes resiliente |
| **Traducción de errores de Firebase** | Códigos crípticos de cara al usuario | UX clara con mensajes en español |

---

## Instalación

### Prerrequisitos

- **Node.js** >= 18.x
- **npm** >= 9.x
- **Ionic CLI** (opcional, recomendado) — `npm install -g @ionic/cli`
- **Firebase CLI** (para desplegar Cloud Functions) — `npm install -g firebase-tools`

### Configuración

```bash
# 1. Clonar el repositorio
git clone https://github.com/Nick3030w/Neogranada_Conecta.git
cd Neogranada_Conecta

# 2. Instalar dependencias de la app
npm install

# 3. Instalar dependencias de las Cloud Functions
cd functions && npm install && cd ..

# 4. Ejecutar en modo desarrollo
ionic serve          # o, sin Ionic CLI:  ng serve
```

La aplicación estará disponible en `http://localhost:4200`

### Variables de entorno y secretos

El proyecto utiliza Firebase. Configura tus credenciales en:

```
src/environments/environment.ts          # Desarrollo
src/environments/environment.prod.ts     # Producción
```

La API key del asistente **no** se guarda en el repositorio: se registra como secreto de Firebase.

```bash
firebase functions:secrets:set GEMINI_API_KEY
```

---

## 📜 Scripts Disponibles

### Aplicación

| Comando | Descripción |
|---------|-------------|
| `npm start` | Servidor de desarrollo (`ng serve`) |
| `npm run build` | Compilación de producción |
| `npm run watch` | Compilación con hot-reload |
| `npm run test` | Ejecutar tests unitarios |
| `npm run lint` | Análisis estático de código |

### Cloud Functions (desde `functions/`)

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compilar las funciones (TypeScript → JS) |
| `npm run serve` | Emular las funciones localmente |
| `npm run deploy` | Desplegar las funciones a Firebase |
| `npm run logs` | Ver logs de las funciones en producción |

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

## Estructura del Proyecto

Ver [Arquitectura](#arquitectura) para el detalle completo de carpetas. En resumen:

- `src/app/core/` — guards, interfaces y servicios (lógica de negocio)
- `src/app/features/` — páginas organizadas por dominio (auth, student, admin, shared)
- `functions/` — backend serverless (Cloud Functions + integración con Gemini)
- `android/` — proyecto nativo generado por Capacitor
- `firestore.rules` — reglas de seguridad de la base de datos

---

## Diseño y UX

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
- ✅ Mensajes de error traducidos a lenguaje claro en español

---

## 📄 Licencia

Este proyecto es de uso **académico y educativo**, desarrollado por **Nick303w** como estudiante de Ingeniería de Sistemas de la Universidad Militar Nueva Granada.

---

<p align="center">
  Desarrollado con 💙 para la comunidad Neogranadina
</p>
