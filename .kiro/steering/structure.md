---
inclusion: always
---

# Estructura y Convenciones de Código

## Arquitectura: feature-first modular

```
src/app/
├── core/                       # Capa central singleton
│   ├── guards/                 # authGuard, noAuthGuard, roleGuard(role)
│   ├── interfaces/             # Contratos de datos (user, booking, resource, chat, etc.)
│   └── services/               # Lógica de negocio (providedIn: 'root')
├── features/                   # Módulos por dominio
│   ├── auth/                   # login, register, forgot-password
│   ├── student/                # home, catalog, availability, booking, confirmation,
│   │                           # calendar, library, databases, map, block-detail,
│   │                           # chats, students, tutorial
│   ├── admin/                  # home, confirmation, calendar, chats
│   └── shared/                 # chat, chatbot, notifications, profile, settings
├── app.routes.ts               # Rutas con lazy loading y guards
└── app.component.ts            # Componente raíz
```

## Dónde va cada cosa

- **Servicio nuevo** (lógica de negocio / acceso a Firestore) → `core/services/`.
- **Interfaz / tipo de datos** → `core/interfaces/`.
- **Guard de ruta** → `core/guards/`.
- **Página nueva** → `features/<area>/<nombre>/`, y registrarla en `app.routes.ts` con
  `loadComponent` (lazy). Páginas compartidas entre roles van en `features/shared/`.

## Convenciones (seguir los patrones existentes)

### Componentes
- **Standalone components**, sin NgModules. Cada componente declara sus `imports`.
- Páginas usan sufijo `Page` en la clase (p. ej. `StudentHomePage`, `CatalogPage`);
  componentes reutilizables usan sufijo `Component`. (Validado por ESLint.)
- Selector de componentes con prefijo `app` y kebab-case; directivas con prefijo `app`
  y camelCase.
- Archivos de página: `<nombre>.page.ts`, `.page.html`, `.page.scss`.

### Inyección de dependencias
- Usar la API `inject()` en vez de inyección por constructor.
  Ej: `private auth = inject(Auth);`

### Servicios
- `@Injectable({ providedIn: 'root' })`.
- Exponer estado reactivo con `BehaviorSubject` privado + `Observable` público con sufijo `$`
  (patrón de `AuthService`: `currentUserSubject` → `currentUser$`).
- Usar `async/await` para operaciones de Firestore/Auth.
- Usar `serverTimestamp()` al escribir `createdAt`/`updatedAt` en Firestore; convertir
  Timestamps a `Date` al leer (`data['campo']?.toDate?.() ?? new Date()`).

### Rutas
- Lazy loading con `loadComponent: () => import(...).then(m => m.ClasePage)`.
- Guards funcionales: `authGuard`, `noAuthGuard`, `roleGuard('student' | 'admin')`.
- Áreas protegidas: `canActivate: [authGuard, roleGuard('<rol>')]`.

### Estilo general
- **Comentarios y documentación en español**, estilo JSDoc breve (`/** ... */`) como en
  los servicios existentes.
- TypeScript estricto: tipar explícitamente, evitar `any`; para errores externos usar
  `unknown` y acotar (ver `getErrorMessage`).
- Reactividad con RxJS (`BehaviorSubject`, `Observable`) para datos en tiempo real
  (chat, notificaciones, sesión).

## Antes de dar por terminado un cambio

1. `npm run lint` sin errores.
2. `npm run build` compila correctamente.
3. Recordar al usuario que la **prueba visual/interactiva** y los flujos reales con
   Firebase/Android los valida él en local.
