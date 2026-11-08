---
inclusion: always
---

# Neogranada Conecta — Contexto del Producto

**Neogranada Conecta** es una app móvil híbrida (Ionic + Angular + Capacitor) para la
**Universidad Militar Nueva Granada** que digitaliza el **préstamo y reserva de recursos
académicos**: aulas, laboratorios, elementos deportivos, instrumentos musicales, material
lúdico, biblioteca, bases de datos y botiquín.

## Dos portales con roles

La app tiene control de acceso basado en roles (`student` | `admin`), gestionado con Firebase Auth:

- **Portal Estudiante** (`/student/*`): catálogo de recursos, consulta de disponibilidad,
  reserva con validación de conflictos, calendario personal, chat por reserva, chat directo
  con otros estudiantes (DM), mapa del campus, biblioteca/bases de datos, asistente virtual
  **NeoBot** (chatbot con Gemini) y tutorial de onboarding.
- **Portal Administrador** (`/admin/*`): panel de solicitudes, aprobación/rechazo con motivo,
  calendario administrativo y chat con estudiantes por cada reserva.

## Reglas de negocio clave

- **Solo correos institucionales** `@unimilitar.edu.co` pueden registrarse.
- El registro público **siempre** crea usuarios con rol `student`. El rol `admin` se asigna
  manualmente (no desde la app).
- En el primer ingreso se marca el flag de tutorial (`tutorial_seen_<uid>` en localStorage).
- La pantalla de inicio tras login respeta `profile.startPage` con lista blanca por rol
  (`resolveStartPage`).
- Los mensajes de error de Firebase se traducen a español amigable (ver `AuthService.getErrorMessage`).

## Idioma

Todo el producto está en **español** (UI, mensajes de error, textos). Mantén ese idioma en
UI, comentarios y mensajes de commit.

## Identidad visual

- Color primario institucional: `#1a2a4a` (azul).
- Enfoque **mobile-first**, UI con componentes nativos de Ionic 8, iconografía Ionicons 7.
- App ID nativo: `co.edu.unimilitar.neogranada`.
