# Plan

El agente trabaja una fase cada vez y marca las casillas al cerrarla.

Al cerrar cada fase: la app se abre con doble clic en `index.html`, `node --test` y `npx playwright test` pasan en verde, y se hace commit con este archivo actualizado. No se usa linter.

## Fase 1 · Esqueleto

**Objetivo:** una versión mínima que se abre y está lista para probarse.

**Tareas:**
- [x] Crear `index.html` con el nombre de la app, «Tempo», y dos apartados vacíos: «Calculadora» y «Diario de carga».
- [x] Crear `logica.js` y `app.js` vacíos, enlazados desde `index.html`.
- [x] Instalar Playwright (`@playwright/test` y Chromium) como dependencia de desarrollo.

**Pruebas:**
- e2e: abre `index.html`, ve «Tempo» y los dos apartados, y no hay errores en la consola.

**Hecho cuando:** al abrir `index.html` se ve «Tempo» con los dos apartados y `npx playwright test` pasa.

## Fase 2 · Predicción de tiempos (Riegel)

**Objetivo:** meter una marca reciente y ver las predicciones de 5K, 10K, media y maratón.

**Tareas:**
- [ ] Formulario de marca: distancia (km) y tiempo (`hh:mm:ss`).
- [ ] En `logica.js`: leer el tiempo, aplicar Riegel (exponente 1,06), calcular el ritmo y formatear tiempos y ritmos.
- [ ] Tabla con tiempo y ritmo (min/km) de cada distancia.
- [ ] Mensajes de error si falta un dato o no es válido.

**Pruebas:**
- Unitarias de cada función de `logica.js`.
- e2e: 10 km en 50:00 → 23:59 · 50:00 · 1:50:19 · 3:50:01. Distancia 0 → error y sin resultados.

**Hecho cuando:** el caso de 10 km en 50:00 da esos tiempos en la página y las pruebas pasan.

## Fase 3 · Ritmos por zona

**Objetivo:** mostrar los ritmos de entrenamiento debajo de las predicciones.

**Tareas:**
- [ ] En `logica.js`: series = ritmo de 5K; tempo = ritmo de media; rodaje = ritmo de maratón + 45 a + 75 s/km.
- [ ] Mostrar las tres zonas en la página.

**Pruebas:**
- Unitarias de las zonas.
- e2e: 10 km en 50:00 → series 4:48/km, tempo 5:14/km, rodaje 6:12–6:42/km.

**Hecho cuando:** se ven esas tres zonas para esa marca y las pruebas pasan.

## Fase 4 · Diario: registrar, guardar y borrar sesiones

**Objetivo:** apuntar sesiones que no se pierden al recargar.

**Tareas:**
- [ ] Formulario de sesión: fecha, minutos y RPE (1–10), con validación.
- [ ] En `logica.js`: carga = minutos × RPE y validación de la sesión.
- [ ] Lista de sesiones por fecha, con su carga y un botón para borrar cada una.
- [ ] Guardar y leer las sesiones en `localStorage`.

**Pruebas:**
- Unitarias de la carga y la validación.
- e2e: añadir 60 min con RPE 5 → carga 300; recargar → sigue; borrar → desaparece; RPE 11 → error.

**Hecho cuando:** las sesiones sobreviven a una recarga, se pueden borrar y las pruebas pasan.

## Fase 5 · Carga semanal y aviso del 15 %

**Objetivo:** ver la carga de cada semana y detectar subidas bruscas.

**Tareas:**
- [ ] En `logica.js`: agrupar las sesiones por semana (lunes a domingo), sumar la carga y compararla con la semana anterior.
- [ ] Tabla de semanas con su carga total y un aviso visible si sube más de un 15 %.

**Pruebas:**
- Unitarias: 1000 → 1160 avisa; 1000 → 1150 no avisa; semana anterior a 0 no avisa; domingo 8/11/2026 y lunes 9/11/2026 caen en semanas distintas.
- e2e: sesiones que suman 1000 y 1160 en semanas seguidas → se ve el aviso; al borrar una hasta 1150 → desaparece.

**Hecho cuando:** el aviso aparece y desaparece según esos casos y las pruebas pasan.
