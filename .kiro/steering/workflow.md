---
inclusion: always
---

# Flujo de Trabajo y Git

Este proyecto se trabaja de forma combinada entre **Kiro Web** (escribir/refactorizar
lógica, arreglar bugs, documentar) y el **IDE en local** (ver la app, probar flujos reales,
build Android). Esta guía mantiene ese flujo coherente en cualquier dispositivo.

## División de responsabilidades

- **Kiro Web** → escribir lógica (servicios, guards, interfaces, consultas Firestore),
  refactors, fixes de tipos/lint/build, documentación y reglas de Firestore. Entrega el
  trabajo listo en una **rama/PR**.
- **IDE local (cualquier PC)** → `git pull`, `ionic serve`, prueba visual e interactiva,
  pruebas contra Firebase, build y emulación Android, y merge final.

## Convenciones de commits

- Mensajes en **español**, concisos y descriptivos (consistente con el historial del repo).
- Agrupar cambios relacionados en un mismo commit; evitar commits enormes sin relación.

## Pull Requests

- Para que el usuario revise los cambios, preferir **push a una rama + PR** (el usuario está
  en navegador y no tiene acceso directo al sistema de archivos).
- Describir en el PR: qué cambió, por qué, y qué debe **probar el usuario en local**
  (especialmente lo visual y los flujos con Firebase/Android que Kiro no puede validar).

## Portabilidad de la configuración entre PCs

- Toda la configuración de Kiro específica del proyecto vive en `.kiro/` **dentro del repo**
  (steering, specs, hooks, skills de proyecto). Commitear `.kiro/` hace que esté disponible
  automáticamente en el IDE, en Kiro Web y en cualquier otro computador tras `git pull`.
- Las **skills a nivel de usuario** y los **learnings** van ligados a la cuenta del usuario,
  no al repo: siguen al usuario entre dispositivos sin necesidad de git.

## Recordatorios de verificación

- Kiro Web **no puede** ver la UI renderizada, correr dev servers interactivos, ni compilar
  o emular Android. No afirmar que algo "funciona" o "se ve bien" visualmente; afirmar como
  máximo que compila, pasa el lint y/o pasa los tests.
- Al terminar, indicar siempre dónde revisar el trabajo (enlace del PR o de la rama).
