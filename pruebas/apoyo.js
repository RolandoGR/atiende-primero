// Utilidades compartidas por las pruebas: cargan los datos de ejemplo y los módulos del sitio.
const path = require("node:path");

const RAIZ = path.join(__dirname, "..");
global.window = global.window || {};
require(path.join(RAIZ, "sitio/datos/ejemplo.js"));

const Modelo = require(path.join(RAIZ, "sitio/js/modelo.js"));
const Lectura = require(path.join(RAIZ, "sitio/js/lectura.js"));
const EJEMPLO = global.window.DATOS_EJEMPLO;

function copia(objeto) {
  return JSON.parse(JSON.stringify(objeto));
}

function cargarEjemplo() {
  const reportes = Lectura.leerReportes(copia(EJEMPLO.reportes));
  const criterios = Lectura.leerCriterios(copia(EJEMPLO.criterios));
  return { reportes, criterios };
}

// Generador de números pseudoaleatorios con semilla, para pruebas repetibles.
function aleatorio(semilla) {
  let estado = semilla >>> 0;
  return function () {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

module.exports = { RAIZ, Modelo, Lectura, EJEMPLO, copia, cargarEjemplo, aleatorio };
