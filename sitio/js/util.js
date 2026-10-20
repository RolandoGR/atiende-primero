/* Atiende Primero · utilidades de la interfaz (formatos, prioridades y protección del texto). */
(function () {
  "use strict";

  var ICONOS = { "Crítica": "▲", "Alta": "●", "Media": "◆", "Baja": "▼" };
  var CLASES = { "Crítica": "critica", "Alta": "alta", "Media": "media", "Baja": "baja" };
  var COLORES = { "Crítica": "#a8201c", "Alta": "#dd5a1e", "Media": "#d6a100", "Baja": "#3470b5" };

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

  // Diálogos: usan <dialog> del navegador; en navegadores sin soporte (p. ej., iPhone con iOS anterior a 15.4)
  // se muestran con el atributo "open" y un fondo oscuro hecho con CSS.
  function abrirDialogo(d) {
    if (typeof d.showModal === "function") { if (!d.open) d.showModal(); return; }
    d.setAttribute("open", "");
    d.classList.add("dialogo-respaldo");
    document.body.classList.add("con-dialogo");
    var foco = d.querySelector("button, a, input");
    if (foco) foco.focus();
  }

  function cerrarDialogo(d) {
    if (typeof d.close === "function" && typeof d.showModal === "function") { d.close(); return; }
    d.removeAttribute("open");
    d.classList.remove("dialogo-respaldo");
    if (!document.querySelector("dialog[open]")) document.body.classList.remove("con-dialogo");
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var abierto = document.querySelector("dialog.dialogo-respaldo[open]");
    if (abierto) cerrarDialogo(abierto);
  });

  window.Util = {
    ICONOS: ICONOS, CLASES: CLASES, COLORES: COLORES,
    esc: esc, numero: numero, fecha: fecha, chipPrioridad: chipPrioridad, $: $,
    abrirDialogo: abrirDialogo, cerrarDialogo: cerrarDialogo
  };
})();
