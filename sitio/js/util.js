/* Atiende Primero · utilidades de la interfaz (formatos, prioridades y protección del texto). */
(function () {
  "use strict";

  var ICONOS = { "Crítica": "▲", "Alta": "●", "Media": "◆", "Baja": "▼" };
  var CLASES = { "Crítica": "critica", "Alta": "alta", "Media": "media", "Baja": "baja" };
  var COLORES = { "Crítica": "#a8201c", "Alta": "#dd5a1e", "Media": "#d6a100", "Baja": "#3f7fc8" };

  // Protege cualquier texto que venga de un archivo antes de ponerlo en la página.
  function esc(texto) {
    return String(texto === null || texto === undefined ? "" : texto)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function numero(n, decimales) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return Number(n).toLocaleString("es-MX", { minimumFractionDigits: decimales || 0, maximumFractionDigits: decimales || 0 });
  }

  function fecha(f) {
    if (!(f instanceof Date) || isNaN(f.getTime())) return "—";
    var dos = function (n) { return (n < 10 ? "0" : "") + n; };
    return dos(f.getDate()) + "/" + dos(f.getMonth() + 1) + "/" + f.getFullYear() + " " + dos(f.getHours()) + ":" + dos(f.getMinutes());
  }

  // Chip de prioridad: siempre icono + texto, nunca solo color.
  function chipPrioridad(prioridad) {
    return '<span class="prioridad prioridad-' + CLASES[prioridad] + '"><span aria-hidden="true">' + ICONOS[prioridad] + "</span>" + esc(prioridad) + "</span>";
  }

  function $(selector) { return document.querySelector(selector); }

  window.Util = {
    ICONOS: ICONOS, CLASES: CLASES, COLORES: COLORES,
    esc: esc, numero: numero, fecha: fecha, chipPrioridad: chipPrioridad, $: $
  };
})();
