// Interfaz de Tempo: lee los formularios, llama a logica.js,
// pinta los resultados y guarda las sesiones en localStorage.

const formMarca = document.getElementById('form-marca');
const errorMarca = document.getElementById('error-marca');
const tablaPredicciones = document.getElementById('tabla-predicciones');

function mostrarErrorMarca(mensaje) {
  errorMarca.textContent = mensaje;
  errorMarca.hidden = false;
  tablaPredicciones.hidden = true;
}

function pintarPredicciones(filas) {
  const cuerpo = tablaPredicciones.querySelector('tbody');
  cuerpo.replaceChildren(...filas.map((f) => {
    const tr = document.createElement('tr');
    for (const texto of [f.nombre, formatearTiempo(f.segundos), formatearRitmo(f.ritmo)]) {
      const td = document.createElement('td');
      td.textContent = texto;
      tr.append(td);
    }
    return tr;
  }));
  errorMarca.hidden = true;
  tablaPredicciones.hidden = false;
}

formMarca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const km = leerDistancia(formMarca.distancia.value);
  const segundos = leerTiempo(formMarca.tiempo.value);
  if (km === null) return mostrarErrorMarca('Escribe la distancia en km, mayor que 0.');
  if (segundos === null) return mostrarErrorMarca('Escribe el tiempo como h:mm:ss o mm:ss.');
  pintarPredicciones(calcularPredicciones(segundos, km));
});
