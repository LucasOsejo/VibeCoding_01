const test = require('node:test');
const assert = require('node:assert/strict');
const {
  leerDistancia, leerTiempo, predecirSegundos, calcularPredicciones,
  formatearTiempo, formatearRitmo, calcularZonas,
  leerSesion, cargaSesion, ordenarSesiones, borrarSesion, leerSesionesGuardadas, formatearFecha,
  lunesDeLaSemana, subeDemasiado, cargasSemanales, formatearCambio,
  actualizarSesion,
} = require('./logica.js');

test('leerDistancia acepta enteros y decimales con coma o punto', () => {
  assert.equal(leerDistancia('10'), 10);
  assert.equal(leerDistancia('21,0975'), 21.0975);
  assert.equal(leerDistancia(' 21.0975 '), 21.0975);
});

test('leerDistancia rechaza vacío, cero, negativos y texto', () => {
  for (const t of ['', '0', '-5', 'abc', '10km', '1,2,3']) {
    assert.equal(leerDistancia(t), null, `«${t}»`);
  }
});

test('leerTiempo acepta mm:ss y h:mm:ss', () => {
  assert.equal(leerTiempo('50:00'), 3000);
  assert.equal(leerTiempo('1:50:19'), 6619);
  assert.equal(leerTiempo('0:50:00'), 3000);
});

test('leerTiempo rechaza formatos incorrectos y tiempo cero', () => {
  for (const t of ['', '50', '50:7x', '50:60', '1:60:00', '0:00', '1:2:3:4', 'a:bc']) {
    assert.equal(leerTiempo(t), null, `«${t}»`);
  }
});

test('predecirSegundos aplica Riegel', () => {
  assert.equal(predecirSegundos(3000, 10, 10), 3000);
  assert.equal(Math.round(predecirSegundos(3000, 10, 5)), 1439);
});

test('calcularPredicciones da 5K, 10K, media y maratón con su ritmo', () => {
  const filas = calcularPredicciones(3000, 10).map((f) => [
    f.nombre, formatearTiempo(f.segundos), formatearRitmo(f.ritmo),
  ]);
  assert.deepEqual(filas, [
    ['5K', '23:59', '4:48/km'],
    ['10K', '50:00', '5:00/km'],
    ['Media maratón', '1:50:19', '5:14/km'],
    ['Maratón', '3:50:01', '5:27/km'],
  ]);
});

test('formatearTiempo usa mm:ss bajo la hora y h:mm:ss desde la hora', () => {
  assert.equal(formatearTiempo(1439), '23:59');
  assert.equal(formatearTiempo(6619), '1:50:19');
  assert.equal(formatearTiempo(3599.6), '1:00:00');
  assert.equal(formatearTiempo(65), '01:05');
});

test('formatearRitmo redondea sin producir :60', () => {
  assert.equal(formatearRitmo(287.8), '4:48/km');
  assert.equal(formatearRitmo(299.6), '5:00/km');
});

test('calcularZonas: series = ritmo 5K, tempo = ritmo media, rodaje = maratón +45 a +75 s/km', () => {
  const z = calcularZonas(3000, 10);
  assert.equal(formatearRitmo(z.series), '4:48/km');
  assert.equal(formatearRitmo(z.tempo), '5:14/km');
  assert.equal(formatearRitmo(z.rodajeDesde), '6:12/km');
  assert.equal(formatearRitmo(z.rodajeHasta), '6:42/km');
});

test('calcularZonas: el rodaje siempre es 30 s/km más ancho y más lento que el tempo', () => {
  const z = calcularZonas(6619, 21.0975);
  assert.equal(Math.round(z.rodajeHasta - z.rodajeDesde), 30);
  assert.ok(z.series < z.tempo && z.tempo < z.rodajeDesde);
});

test('leerSesion devuelve la sesión si los datos son válidos', () => {
  assert.deepEqual(leerSesion('2026-11-09', '60', '5'), {
    sesion: { fecha: '2026-11-09', minutos: 60, rpe: 5 },
  });
  assert.deepEqual(leerSesion('2026-11-09', ' 45 ', '10').sesion.rpe, 10);
});

test('leerSesion rechaza fecha vacía o inexistente', () => {
  for (const f of ['', '2026-02-30', '09/11/2026', 'hoy']) {
    assert.equal(leerSesion(f, '60', '5').error, 'Elige la fecha de la sesión.', `«${f}»`);
  }
});

test('leerSesion rechaza minutos que no son un entero mayor que 0', () => {
  for (const m of ['', '0', '-10', '30.5', 'abc']) {
    assert.equal(leerSesion('2026-11-09', m, '5').error, 'Escribe los minutos, un número entero mayor que 0.', `«${m}»`);
  }
});

test('leerSesion rechaza RPE fuera de 1–10 o no entero', () => {
  for (const r of ['', '0', '11', '5.5', 'x']) {
    assert.equal(leerSesion('2026-11-09', '60', r).error, 'El RPE tiene que ser un número entero de 1 a 10.', `«${r}»`);
  }
});

test('cargaSesion = minutos × RPE', () => {
  assert.equal(cargaSesion({ minutos: 60, rpe: 5 }), 300);
});

test('ordenarSesiones pone la más reciente primero sin modificar la lista original', () => {
  const lista = [{ fecha: '2026-11-02' }, { fecha: '2026-11-09' }, { fecha: '2026-10-30' }];
  assert.deepEqual(ordenarSesiones(lista).map((x) => x.fecha), ['2026-11-09', '2026-11-02', '2026-10-30']);
  assert.equal(lista[0].fecha, '2026-11-02');
});

test('borrarSesion quita solo la sesión con ese id', () => {
  const lista = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  assert.deepEqual(borrarSesion(lista, 'b'), [{ id: 'a' }, { id: 'c' }]);
  assert.equal(lista.length, 3);
});

test('leerSesionesGuardadas devuelve [] si no hay nada o está corrupto', () => {
  assert.deepEqual(leerSesionesGuardadas(null), []);
  assert.deepEqual(leerSesionesGuardadas('no es json'), []);
  assert.deepEqual(leerSesionesGuardadas('{"a":1}'), []);
  assert.deepEqual(leerSesionesGuardadas('[{"id":"a","fecha":"2026-11-09","minutos":60,"rpe":5}]'),
    [{ id: 'a', fecha: '2026-11-09', minutos: 60, rpe: 5 }]);
});

test('formatearFecha pasa de aaaa-mm-dd a dd/mm/aaaa', () => {
  assert.equal(formatearFecha('2026-11-09'), '09/11/2026');
});

test('lunesDeLaSemana: semanas de lunes a domingo', () => {
  assert.equal(lunesDeLaSemana('2026-11-09'), '2026-11-09'); // lunes
  assert.equal(lunesDeLaSemana('2026-11-15'), '2026-11-09'); // domingo
  assert.equal(lunesDeLaSemana('2026-11-08'), '2026-11-02'); // domingo anterior
  assert.equal(lunesDeLaSemana('2026-01-01'), '2025-12-29'); // cambio de año
});

test('subeDemasiado: solo si sube MÁS de un 15 % y la semana anterior tenía carga', () => {
  assert.equal(subeDemasiado(1000, 1160), true);
  assert.equal(subeDemasiado(1000, 1150), false);
  assert.equal(subeDemasiado(1000, 1151), true);
  assert.equal(subeDemasiado(0, 500), false);
  assert.equal(subeDemasiado(1000, 800), false);
});

test('cargasSemanales suma por semana, compara con la anterior y avisa', () => {
  const sesiones = [
    { fecha: '2026-11-02', minutos: 100, rpe: 10 }, // semana del 2/11: 1000
    { fecha: '2026-11-09', minutos: 100, rpe: 10 }, // semana del 9/11: 1160
    { fecha: '2026-11-15', minutos: 16, rpe: 10 },
  ];
  assert.deepEqual(cargasSemanales(sesiones), [
    { lunes: '2026-11-09', carga: 1160, anterior: 1000, aviso: true },
    { lunes: '2026-11-02', carga: 1000, anterior: 0, aviso: false },
  ]);
});

test('cargasSemanales: domingo 8/11 y lunes 9/11 caen en semanas distintas', () => {
  const semanas = cargasSemanales([
    { fecha: '2026-11-08', minutos: 10, rpe: 1 },
    { fecha: '2026-11-09', minutos: 20, rpe: 1 },
  ]);
  assert.deepEqual(semanas.map((x) => [x.lunes, x.carga]), [['2026-11-09', 20], ['2026-11-02', 10]]);
});

test('cargasSemanales: si hay una semana vacía en medio, la anterior cuenta como 0', () => {
  const semanas = cargasSemanales([
    { fecha: '2026-11-02', minutos: 10, rpe: 1 },
    { fecha: '2026-11-16', minutos: 100, rpe: 1 },
  ]);
  assert.deepEqual(semanas[0], { lunes: '2026-11-16', carga: 100, anterior: 0, aviso: false });
});

test('cargasSemanales sin sesiones devuelve []', () => {
  assert.deepEqual(cargasSemanales([]), []);
});

test('formatearCambio da el porcentaje con signo, o — sin semana anterior', () => {
  assert.equal(formatearCambio(1000, 1160), '+16 %');
  assert.equal(formatearCambio(1000, 800), '-20 %');
  assert.equal(formatearCambio(1000, 1000), '0 %');
  assert.equal(formatearCambio(0, 500), '—');
});

test('actualizarSesion cambia solo la sesión con ese id, sin modificar la lista original', () => {
  const lista = [
    { id: 'a', fecha: '2026-11-09', minutos: 60, rpe: 5 },
    { id: 'b', fecha: '2026-11-10', minutos: 30, rpe: 3 },
  ];
  const nueva = actualizarSesion(lista, 'a', { fecha: '2026-11-08', minutos: 90, rpe: 6 });
  assert.deepEqual(nueva, [
    { id: 'a', fecha: '2026-11-08', minutos: 90, rpe: 6 },
    { id: 'b', fecha: '2026-11-10', minutos: 30, rpe: 3 },
  ]);
  assert.equal(lista[0].minutos, 60);
});

test('actualizarSesion con un id que no existe deja la lista igual', () => {
  const lista = [{ id: 'a', fecha: '2026-11-09', minutos: 60, rpe: 5 }];
  assert.deepEqual(actualizarSesion(lista, 'zzz', { fecha: '2026-11-01', minutos: 1, rpe: 1 }), lista);
});
