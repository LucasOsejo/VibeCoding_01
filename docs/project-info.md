# Información del proyecto

## Qué es
**Tempo** es una página web para preparar una media maratón con dos herramientas: una **calculadora** que, a partir de una marca reciente, da los ritmos de entrenamiento y una predicción de tiempos, y un **diario de carga** que suma la carga de cada semana y avisa si sube demasiado de golpe.

## Para quién
Corredores aficionados que preparan una media maratón y quieren saber a qué ritmo entrenar cada tipo de sesión y no aumentar la carga tan rápido que se lesionen.

## Funciones

**Calculadora**
- Pedir una marca reciente: distancia en km (admite decimales, p. ej. 21,0975) y tiempo en `hh:mm:ss`.
- Predecir el tiempo de 5K, 10K, media maratón (21,0975 km) y maratón (42,195 km) con la fórmula de Riegel: `T2 = T1 × (D2 / D1) ^ 1,06`. Mostrar cada predicción con su ritmo en min/km.
- Dar los ritmos de entrenamiento por zona, sacados de esas predicciones:
  - **Series:** ritmo de 5K.
  - **Tempo:** ritmo de media maratón.
  - **Rodaje:** de ritmo de maratón + 45 s/km a ritmo de maratón + 75 s/km (un rango).
- Avisar si falta un dato o no es válido (distancia o tiempo vacíos, cero, negativos o con formato incorrecto).

**Diario de carga**
- Registrar una sesión: fecha, minutos y esfuerzo percibido (RPE, entero de 1 a 10).
- Calcular la carga de la sesión: `minutos × RPE`.
- Listar las sesiones guardadas y permitir borrar cada una.
- Mostrar la carga total de cada semana (de lunes a domingo).
- Avisar en una semana si su carga sube **más de un 15 %** respecto a la semana anterior. Si la semana anterior no tiene sesiones (carga 0), no se avisa.
- Guardar las sesiones en el navegador (`localStorage`) para que sigan ahí al recargar.
- Avisar si un dato de la sesión falta o no es válido (fecha vacía, minutos ≤ 0, RPE fuera de 1–10).

## Fuera de alcance
- Servidor, base de datos, cuentas de usuario o sincronizar entre dispositivos.
- Librerías o frameworks externos en la app.
- Editar sesiones (se borra y se vuelve a crear).
- Gráficas, planes de entrenamiento, zonas por frecuencia cardiaca o ritmos de otras fórmulas (Daniels, VDOT…).
- Unidades en millas o en otros idiomas: todo en km y en español.
- Exportar o importar datos.

## Tecnología
- HTML, CSS y JavaScript sin librerías, que se ejecutan en el navegador.
- Archivos:
  - `index.html`: la página.
  - `logica.js`: los cálculos (Riegel, ritmos, carga, semanas, aviso del 15 %, validaciones). Sin acceso a la página, para poder probarlo.
  - `app.js`: lee los formularios, llama a `logica.js`, pinta los resultados y guarda en `localStorage`.
- **Cómo se arranca:** doble clic en `index.html` (se abre desde `file://`, sin servidor). Por eso se usan scripts normales, no módulos ES.

## Datos y claves
- Datos: la marca que escribe el usuario (no se guarda) y sus sesiones (fecha, minutos, RPE), guardadas solo en el `localStorage` de su navegador.
- No necesita claves. `GEMINI_API_KEY` de `.env.example` viene de la plantilla y no se usa.

## Cómo se prueba
- **Pruebas de la lógica** junto al código (`logica.test.js`), con `node --test`, que viene con Node y no instala nada.
- **Pruebas de extremo a extremo** en `e2e/`, con Playwright (`npx playwright test`). Es la única dependencia, solo para desarrollo; se instalará cuando haga falta y avisando antes.

Casos concretos:
- **Riegel:** 10 km en 50:00 → 5K en 23:59 (4:48/km), media en 1:50:19 (5:14/km), maratón en 3:50:01 (5:27/km).
- **Zonas** para esa marca: series 4:48/km, tempo 5:14/km, rodaje de 6:12 a 6:42/km.
- **Carga de sesión:** 60 min con RPE 5 = 300.
- **Aviso del 15 %:** semana anterior 1000 y esta 1160 (+16 %) → avisa; esta 1150 (+15 % justo) → no avisa; semana anterior 0 → no avisa.
- **Semanas:** una sesión el domingo 8/11/2026 y otra el lunes 9/11/2026 caen en semanas distintas.
- **Persistencia:** añadir una sesión, recargar la página y la sesión sigue ahí; borrarla y desaparece.
- **Validación:** distancia 0 o tiempo `50:7x` → mensaje de error, sin resultados.
