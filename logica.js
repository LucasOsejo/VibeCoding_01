// Cálculos de Tempo (Riegel, ritmos, carga, semanas, validaciones).
// No toca la página, para poder probarlo con node --test.

const EXPONENTE_RIEGEL = 1.06;

const DISTANCIAS_OBJETIVO = [
  { nombre: '5K', km: 5 },
  { nombre: '10K', km: 10 },
  { nombre: 'Media maratón', km: 21.0975 },
  { nombre: 'Maratón', km: 42.195 },
];

// Km a partir de un texto como "10" o "21,0975". null si no es válido.
function leerDistancia(texto) {
  const limpio = String(texto).trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null;
  const km = Number(limpio);
  return km > 0 ? km : null;
}

// Segundos a partir de "mm:ss" o "h:mm:ss". null si no es válido.
function leerTiempo(texto) {
  const partes = String(texto).trim().split(':');
  if (partes.length < 2 || partes.length > 3) return null;
  if (!partes.every((p) => /^\d+$/.test(p))) return null;
  const numeros = partes.map(Number);
  const [h, m, s] = numeros.length === 3 ? numeros : [0, ...numeros];
  if (s > 59 || (numeros.length === 3 && m > 59)) return null;
  const total = h * 3600 + m * 60 + s;
  return total > 0 ? total : null;
}

// Fórmula de Riegel: T2 = T1 × (D2 / D1) ^ 1,06.
function predecirSegundos(segundos, km, kmObjetivo) {
  return segundos * Math.pow(kmObjetivo / km, EXPONENTE_RIEGEL);
}

// Una fila por distancia objetivo: nombre, km, segundos y ritmo (s/km).
function calcularPredicciones(segundos, km) {
  return DISTANCIAS_OBJETIVO.map((d) => {
    const prediccion = predecirSegundos(segundos, km, d.km);
    return { nombre: d.nombre, km: d.km, segundos: prediccion, ritmo: prediccion / d.km };
  });
}

// Rodaje = ritmo de maratón más este margen (s/km).
const RODAJE_MARGEN_DESDE = 45;
const RODAJE_MARGEN_HASTA = 75;

// Ritmos de entrenamiento (s/km) sacados de las predicciones de Riegel.
function calcularZonas(segundos, km) {
  const ritmo = (kmObjetivo) => predecirSegundos(segundos, km, kmObjetivo) / kmObjetivo;
  const maraton = ritmo(42.195);
  return {
    series: ritmo(5),
    tempo: ritmo(21.0975),
    rodajeDesde: maraton + RODAJE_MARGEN_DESDE,
    rodajeHasta: maraton + RODAJE_MARGEN_HASTA,
  };
}

function dosCifras(n) {
  return String(n).padStart(2, '0');
}

// "mm:ss" por debajo de una hora, "h:mm:ss" desde una hora.
function formatearTiempo(segundos) {
  const total = Math.round(segundos);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${dosCifras(m)}:${dosCifras(s)}` : `${dosCifras(m)}:${dosCifras(s)}`;
}

// "m:ss/km". Se redondea antes de separar para no producir "4:60".
function formatearRitmo(segundosPorKm) {
  const total = Math.round(segundosPorKm);
  return `${Math.floor(total / 60)}:${dosCifras(total % 60)}/km`;
}

if (typeof module !== 'undefined') {
  module.exports = {
    leerDistancia, leerTiempo, predecirSegundos, calcularPredicciones,
    formatearTiempo, formatearRitmo, calcularZonas,
  };
}
