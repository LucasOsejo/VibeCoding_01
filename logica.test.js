const test = require('node:test');
const assert = require('node:assert/strict');
const {
  leerDistancia, leerTiempo, predecirSegundos, calcularPredicciones,
  formatearTiempo, formatearRitmo,
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
