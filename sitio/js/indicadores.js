/* Atiende Primero · indicadores
 * Pendientes, vencidos, usuarios afectados, horas promedio abiertas y conteo por prioridad.
 * Respetan los filtros de municipio, tipo y celda de la matriz (solo cuentan reportes pendientes).
 */
(function () {
  "use strict";
  var U = window.Util;

  function actualizar(estado, motivo) {
    if (motivo === "seleccion" || motivo === "vista") return;
    var contenedor = document.getElementById("indicadores");
    var r = Modelo.resumen(App.filtrados(["estado", "prioridad", "folio"]));
    var html =
      tarjeta(U.numero(r.pendientes), "reportes pendientes", "abiertos y en proceso") +
      tarjeta(U.numero(r.vencidos), "vencidos", "pasaron su plazo de atención") +
      tarjeta(U.numero(r.usuariosAfectados), "usuarios afectados", "suma estimada de pendientes") +
      tarjeta(U.numero(r.horasPromedio, 1) + " h", "tiempo promedio abierto", "de los pendientes") +
      '<div class="indicador ancho"><div class="etiqueta">Pendientes por prioridad <span class="nota">(toca para filtrar)</span></div><div class="por-prioridad">' +
      Modelo.PRIORIDADES.slice().reverse().map(function (p) {
        var activo = estado.filtros.prioridad === p;
        return '<button type="button" class="boton prioridad prioridad-' + U.CLASES[p] + '" data-prioridad="' + p + '" aria-pressed="' + activo + '"' +
          (activo ? ' style="outline:3px solid var(--foco);outline-offset:2px"' : "") +
          ' aria-label="' + r.porPrioridad[p] + " pendientes de prioridad " + p + '"><span aria-hidden="true">' + U.ICONOS[p] + '</span><span class="cuenta">' +
          r.porPrioridad[p] + "</span> " + p + "</button>";
      }).join("") + "</div></div>";
    contenedor.innerHTML = html;
  }

  function tarjeta(valor, etiqueta, titulo) {
    return '<div class="indicador" title="' + U.esc(titulo) + '"><div class="valor">' + valor + '</div><div class="etiqueta">' + U.esc(etiqueta) + "</div></div>";
  }

  document.addEventListener("click", function (evento) {
    var boton = evento.target.closest("#indicadores [data-prioridad]");
    if (!boton) return;
    var p = boton.getAttribute("data-prioridad");
    App.cambiarFiltros({ prioridad: App.estado.filtros.prioridad === p ? null : p });
  });

  App.registrar({ actualizar: actualizar });
})();
