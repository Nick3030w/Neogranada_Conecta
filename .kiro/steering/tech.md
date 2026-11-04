---
inclusion: always
---

# Stack Tecnológico y Comandos

## Stack

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Angular (standalone components) | 20 |
| UI móvil | Ionic Framework | 8 |
| Nativo | Capacitor (Android) | 8 |
| Auth | Firebase Auth vía `@angular/fire` | 20 / Firebase 12 |
| Base de datos | Cloud Firestore vía `@angular/fire` | 20 / Firebase 12 |
| Backend | Cloud Functions (carpeta `functions/`) | — |
| Reactividad | RxJS | 7.8 |
| Lenguaje | TypeScript | 5.9 |
| Estilos | SCSS | — |
| Lint | ESLint + @angular-eslint | 9 / 20 |
| Tests | Karma + Jasmine | — |
| Chatbot | Google Gemini (asistente NeoBot) | — |

## Comandos

```bash
npm install            # Instalar dependencias
npm start              # Dev server (ng serve) — http://localhost:4200
npm run build          # Build de producción
npm run watch          # Build con hot-reload (configuración development)
npm run test           # Tests unitarios (Karma/Jasmine)
npm run lint           # Análisis estático (ESLint)
```

### Android / Capacitor

```bash
ionic build --prod      # Compilar web (salida en www/)
npx cap sync android    # Sincronizar con el proyecto nativo
npx cap open android    # Abrir en Android Studio
```

## Notas de entorno (importante para Kiro Web)

- **NO** ejecutar procesos de larga duración (`ng serve`, `npm start`, `cap run`,
  watchers) en el sandbox: bloquean la ejecución. Para tests usa ejecución única, no watch.
- El build/emulación de **Android no está disponible** en el sandbox. Esos pasos se validan
  en el PC del usuario con el SDK de Android.
- La validación en Web se limita a: `npm run build`, `npm run lint` y `npm run test`
  (este último puede requerir un navegador headless). La **validación visual/interactiva
  de la UI** y los flujos reales contra Firebase los hace el usuario en local.

## Configuración Firebase

Las credenciales viven en `src/environments/environment.ts` (dev) y
`environment.prod.ts` (prod). Proyecto Firebase: `neoconecta-ceb6b`.
Las reglas de Firestore están en `firestore.rules`.
