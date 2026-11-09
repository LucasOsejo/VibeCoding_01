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

// ---------- Diario de carga ----------

const CLAVE_SESIONES = 'tempo.sesiones';
const formSesion = document.getElementById('form-sesion');
const errorSesion = document.getElementById('error-sesion');
const sinSesiones = document.getElementById('sin-sesiones');
const tablaSesiones = document.getElementById('tabla-sesiones');
const tablaSemanas = document.getElementById('tabla-semanas');

function cargarSesiones() {
  return leerSesionesGuardadas(localStorage.getItem(CLAVE_SESIONES));
}

function guardarSesiones(sesiones) {
  localStorage.setItem(CLAVE_SESIONES, JSON.stringify(sesiones));
}

function nuevoId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function filaSesion(sesion) {
  const tr = document.createElement('tr');
  const textos = [formatearFecha(sesion.fecha), sesion.minutos, sesion.rpe, cargaSesion(sesion)];
  for (const texto of textos) {
    const td = document.createElement('td');
    td.textContent = texto;
    tr.append(td);
  }
  const boton = document.createElement('button');
  boton.type = 'button';
  boton.textContent = 'Borrar';
  boton.setAttribute('aria-label', `Borrar sesión del ${formatearFecha(sesion.fecha)}`);
  boton.addEventListener('click', () => {
    guardarSesiones(borrarSesion(cargarSesiones(), sesion.id));
    pintarDiario();
  });
  const td = document.createElement('td');
  td.append(boton);
  tr.append(td);
  return tr;
}

function pintarSemanas(sesiones) {
  const semanas = cargasSemanales(sesiones);
  rellenarTabla(tablaSemanas, semanas.map((x) => [
    formatearFecha(x.lunes), x.carga, formatearCambio(x.anterior, x.carga),
    x.aviso ? '⚠ Sube más de un 15 %' : '',
  ]));
  tablaSemanas.querySelectorAll('tbody tr').forEach((tr, i) => {
    tr.classList.toggle('aviso', semanas[i].aviso);
  });
}

function pintarDiario() {
  const sesiones = ordenarSesiones(cargarSesiones());
  tablaSesiones.querySelector('tbody').replaceChildren(...sesiones.map(filaSesion));
  pintarSemanas(sesiones);
  tablaSesiones.hidden = sesiones.length === 0;
  tablaSemanas.hidden = sesiones.length === 0;
  sinSesiones.hidden = sesiones.length > 0;
}

formSesion.addEventListener('submit', (evento) => {
  evento.preventDefault();
  const { sesion, error } = leerSesion(formSesion.fecha.value, formSesion.minutos.value, formSesion.rpe.value);
  if (error) {
    errorSesion.textContent = error;
    errorSesion.hidden = false;
    return;
  }
  errorSesion.hidden = true;
  guardarSesiones([...cargarSesiones(), { id: nuevoId(), ...sesion }]);
  formSesion.minutos.value = '';
  formSesion.rpe.value = '';
  pintarDiario();
});

pintarDiario();
