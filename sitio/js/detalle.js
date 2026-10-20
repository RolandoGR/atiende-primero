/* Atiende Primero · detalle de un reporte
 * Explica la prioridad: cuánto aportó cada criterio, el puntaje, la prioridad por puntaje,
 * las reglas duras que se cumplieron y si alguna subió la prioridad.
 */
(function () {
  "use strict";
  var U = window.Util;
  var anterior = null;      // elemento que tenía el foco antes de abrir, para regresarlo al cerrar
  var abierto = null;

  function contenido(e, estado) {
    var r = e.reporte;
    var suma = e.aportes.reduce(function (s, a) { return s + a.peso; }, 0);
    var html = '<div class="resultado">' +
      '<span class="puntos">' + U.numero(e.puntaje, 2) + "</span><span>puntos de 100</span>" +
      (e.elevadoPorRegla
        ? '<span>' + U.chipPrioridad(e.prioridadPuntaje) + '</span><span class="flecha" aria-label="sube a">→</span><span>' + U.chipPrioridad(e.prioridad) + "</span>"
        : "<span>" + U.chipPrioridad(e.prioridad) + "</span>") +
      "</div>";
    html += '<p class="nota">Lugar ' + e.posicion + " de " + estado.evaluados.length + " en la lista · Impacto " +
      Modelo.NIVELES[e.celda.impacto].toLowerCase() + " (" + U.numero(e.impacto, 2) + "), urgencia " +
      ["baja", "media", "alta"][e.celda.urgencia] + " (" + U.numero(e.urgencia, 2) + ")</p>";

    html += "<h3>¿De dónde salen los puntos?</h3>";
    e.aportes.forEach(function (a) {
      var posible = suma > 0 ? a.peso * 100 / suma : 0;
      html += '<div class="aporte"><div class="aporte-cabeza"><span>' + U.esc(a.nombre) + "</span><strong>" +
        U.numero(a.aporte, 2) + " de " + U.numero(posible, 1) + "</strong></div>" +
        '<div class="dato">' + U.esc(a.dato) + " → vale " + U.numero(a.valor, 2) + " (de 0 a 1) × peso " + U.numero(a.peso) + "</div>" +
        '<div class="barra" aria-hidden="true"><span class="posible" style="width:' + posible + '%"></span><span class="obtenido" style="width:' + a.aporte + '%"></span></div></div>';
    });
    html += '<p class="nota">La barra clara es lo máximo que puede aportar cada criterio con los pesos actuales; la oscura, lo que aportó.</p>';

    html += "<h3>Reglas duras</h3>";
    if (e.reglasAplicadas.length) {
      e.reglasAplicadas.forEach(function (regla) {
        html += '<div class="regla' + (regla.subioPrioridad ? " subio" : "") + '">' + U.esc(regla.texto) +
          (regla.subioPrioridad ? "<br><strong>Esta regla subió la prioridad de " + U.esc(e.prioridadPuntaje) + " a " + U.esc(regla.prioridadMinima) + ".</strong>" : "") + "</div>";
      });
    } else {
      html += '<p class="nota">No se cumplió ninguna regla dura: la prioridad sale solo del puntaje.</p>';
    }

    html += "<h3>Datos del reporte</h3><dl class=\"datos-reporte\">" +
      par("Tipo de falla", r.tipo) + par("Municipio", r.municipio) + par("Localidad", r.localidad) +
      par("Fecha y hora de alta", r.fechaAlta ? U.fecha(r.fechaAlta) : "—") + par("Estado", r.estado) +
      par("Severidad", r.severidad + " de 4") + par("Usuarios afectados", U.numero(r.usuarios)) +
      par("Horas abiertas", U.numero(r.horasAbiertas, 1) + " de " + U.numero(r.plazo) + " de plazo" + (e.vencido ? " (vencido)" : "")) +
      par("Riesgo a la seguridad", r.riesgo ? "Sí" : "No") + par("Reportes previos (30 días)", r.previos) +
      par("Cuadrilla", r.cuadrilla || "—") + "</dl>";

    if (r.latitud !== null) html += '<div class="fila-botones"><button type="button" class="boton boton-secundario" id="btn-ver-en-mapa">◎ Ver en el mapa</button></div>';
    html += '<p class="nota">La prioridad es una sugerencia para ordenar el trabajo. La decisión final es de las personas.</p>';
    return html;
  }

  function par(etiqueta, valor) {
    return "<dt>" + U.esc(etiqueta) + "</dt><dd>" + U.esc(valor === null || valor === undefined || valor === "" ? "—" : valor) + "</dd>";
  }

  function actualizar(estado, motivo) {
    var panel = document.getElementById("detalle");
    var e = estado.seleccionado ? App.buscar(estado.seleccionado) : null;
    if (!e) {
      if (!panel.hidden) { panel.hidden = true; if (anterior && anterior.focus) anterior.focus(); }
      abierto = null;
      return;
    }
    if (motivo === "vista" || motivo === "filtros") return;
    document.getElementById("detalle-titulo").textContent = e.reporte.folio + " · " + e.reporte.tipo;
    document.getElementById("detalle-cuerpo").innerHTML = contenido(e, estado);
    var verMapa = document.getElementById("btn-ver-en-mapa");
    if (verMapa) verMapa.addEventListener("click", function () { if (window.innerWidth < 1024) App.seleccionar(null); Mapa.verReporte(e); });
    if (abierto !== e.reporte.folio) {
      if (panel.hidden) anterior = document.activeElement;
      panel.hidden = false;
      panel.scrollTop = 0;
      document.getElementById("detalle-titulo").focus();
      abierto = e.reporte.folio;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("cerrar-detalle").addEventListener("click", function () { App.seleccionar(null); });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !document.getElementById("detalle").hidden && !document.querySelector("dialog[open]")) App.seleccionar(null);
    });
  });

  App.registrar({ actualizar: actualizar });
})();
