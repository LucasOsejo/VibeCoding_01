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

// ---------- Diario de carga ----------

// true si el texto es una fecha real en formato aaaa-mm-dd.
function esFechaValida(texto) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false;
  const [a, m, d] = texto.split('-').map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d;
}

// Entero a partir de un texto como "60". null si no es un entero.
function leerEntero(texto) {
  const limpio = String(texto).trim();
  return /^-?\d+$/.test(limpio) ? Number(limpio) : null;
}

// { sesion } si los datos son válidos, { error } con el motivo si no.
function leerSesion(fechaTexto, minutosTexto, rpeTexto) {
  const fecha = String(fechaTexto).trim();
  if (!esFechaValida(fecha)) return { error: 'Elige la fecha de la sesión.' };
  const minutos = leerEntero(minutosTexto);
  if (minutos === null || minutos <= 0) {
    return { error: 'Escribe los minutos, un número entero mayor que 0.' };
  }
  const rpe = leerEntero(rpeTexto);
  if (rpe === null || rpe < 1 || rpe > 10) {
    return { error: 'El RPE tiene que ser un número entero de 1 a 10.' };
  }
  return { sesion: { fecha, minutos, rpe } };
}

function cargaSesion(sesion) {
  return sesion.minutos * sesion.rpe;
}

// Copia ordenada de la más reciente a la más antigua.
function ordenarSesiones(sesiones) {
  return [...sesiones].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function borrarSesion(sesiones, id) {
  return sesiones.filter((s) => s.id !== id);
}

// Copia de la lista con la sesión de ese id cambiada por los datos nuevos.
function actualizarSesion(sesiones, id, datos) {
  return sesiones.map((s) => (s.id === id ? { ...s, ...datos } : s));
}

// Sesiones a partir del texto guardado en localStorage. [] si falta o está corrupto.
function leerSesionesGuardadas(texto) {
  try {
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

// "aaaa-mm-dd" → "dd/mm/aaaa".
function formatearFecha(fecha) {
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// ---------- Carga semanal ----------

const DIA_MS = 24 * 60 * 60 * 1000;
const SUBIDA_MAXIMA_PORCENTAJE = 15;

// Se trabaja en UTC para que el huso horario no mueva las fechas de día.
function fechaUTC(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
}

function textoFecha(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

// Lunes (aaaa-mm-dd) de la semana de lunes a domingo que contiene la fecha.
function lunesDeLaSemana(fecha) {
  const ms = fechaUTC(fecha);
  const diasDesdeLunes = (new Date(ms).getUTCDay() + 6) % 7;
  return textoFecha(ms - diasDesdeLunes * DIA_MS);
}

// true si la carga sube más de un 15 % y la semana anterior tenía carga.
// Se compara con enteros para evitar errores de redondeo (1000 × 1,15).
function subeDemasiado(anterior, actual) {
  return anterior > 0 && actual * 100 > anterior * (100 + SUBIDA_MAXIMA_PORCENTAJE);
}

// Una entrada por semana con sesiones, de la más reciente a la más antigua.
// "anterior" es la carga de la semana de calendario previa (0 si no hubo sesiones).
function cargasSemanales(sesiones) {
  const porSemana = new Map();
  for (const s of sesiones) {
    const lunes = lunesDeLaSemana(s.fecha);
    porSemana.set(lunes, (porSemana.get(lunes) || 0) + cargaSesion(s));
  }
  return [...porSemana.keys()].sort().reverse().map((lunes) => {
    const carga = porSemana.get(lunes);
    const anterior = porSemana.get(textoFecha(fechaUTC(lunes) - 7 * DIA_MS)) || 0;
    return { lunes, carga, anterior, aviso: subeDemasiado(anterior, carga) };
  });
}

// "+16 %", "-20 %", "0 %"; "—" si no hay semana anterior con la que comparar.
function formatearCambio(anterior, actual) {
  if (anterior <= 0) return '—';
  const porcentaje = Math.round(((actual - anterior) / anterior) * 100);
  return `${porcentaje > 0 ? '+' : ''}${porcentaje} %`;
}

if (typeof module !== 'undefined') {
  module.exports = {
    leerDistancia, leerTiempo, predecirSegundos, calcularPredicciones,
    formatearTiempo, formatearRitmo, calcularZonas,
    leerSesion, cargaSesion, ordenarSesiones, borrarSesion, leerSesionesGuardadas, formatearFecha,
    lunesDeLaSemana, subeDemasiado, cargasSemanales, formatearCambio,
    actualizarSesion,
  };
}
