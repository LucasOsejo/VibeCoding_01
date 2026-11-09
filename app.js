// Interfaz de Tempo: lee los formularios, llama a logica.js,
// pinta los resultados y guarda las sesiones en localStorage.

const formMarca = document.getElementById('form-marca');
const errorMarca = document.getElementById('error-marca');
const tablaPredicciones = document.getElementById('tabla-predicciones');
const tablaZonas = document.getElementById('tabla-zonas');

// Rellena el tbody de una tabla con una fila por cada lista de textos.
function rellenarTabla(tabla, filas) {
  tabla.querySelector('tbody').replaceChildren(...filas.map((textos) => {
    const tr = document.createElement('tr');
    for (const texto of textos) {
      const td = document.createElement('td');
      td.textContent = texto;
      tr.append(td);
    }
    return tr;
  }));
}

function mostrarErrorMarca(mensaje) {
  errorMarca.textContent = mensaje;
  errorMarca.hidden = false;
  tablaPredicciones.hidden = true;
  tablaZonas.hidden = true;
}

function pintarResultados(predicciones, zonas) {
  rellenarTabla(tablaPredicciones, predicciones.map((f) => [
    f.nombre, formatearTiempo(f.segundos), formatearRitmo(f.ritmo),
  ]));
  const sinUnidad = (ritmo) => formatearRitmo(ritmo).replace('/km', '');
  rellenarTabla(tablaZonas, [
    ['Series', formatearRitmo(zonas.series)],
    ['Tempo', formatearRitmo(zonas.tempo)],
    ['Rodaje', `${sinUnidad(zonas.rodajeDesde)}–${formatearRitmo(zonas.rodajeHasta)}`],
  ]);
  errorMarca.hidden = true;
  tablaPredicciones.hidden = false;
  tablaZonas.hidden = false;
}

formMarca.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const km = leerDistancia(formMarca.distancia.value);
  const segundos = leerTiempo(formMarca.tiempo.value);
  if (km === null) return mostrarErrorMarca('Escribe la distancia en km, mayor que 0.');
  if (segundos === null) return mostrarErrorMarca('Escribe el tiempo como h:mm:ss o mm:ss.');
  pintarResultados(calcularPredicciones(segundos, km), calcularZonas(segundos, km));
});
