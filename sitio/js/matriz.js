/* Atiende Primero · matriz impacto × urgencia (3 × 3)
 * Filas: impacto (Alto arriba). Columnas: urgencia. Cada celda cuenta los reportes pendientes y cuántos son críticos.
 * El fondo usa una rampa de grises (no los colores de prioridad) según cuántos reportes hay.
 * Tocar una celda filtra la lista, el mapa y los indicadores.
 */
(function () {
  "use strict";
  var U = window.Util;

  // Rampa de un solo tono, de claro (pocos) a oscuro (muchos). El texto cambia a blanco en los dos tonos oscuros.
  var RAMPA = ["#f1f0ec", "#dcdad3", "#bebbb2", "#8e8b83", "#5d5b55"];
  var NIVELES_TEXTO = ["bajo", "medio", "alto"];

  function clase(n, maximo) {
    if (n === 0 || maximo === 0) return 0;
    return Math.min(4, 1 + Math.floor((n / maximo) * 3.999));
  }

  function actualizar(estado, motivo) {
    if (motivo === "seleccion" || motivo === "vista") return;
    // La matriz no se filtra por su propia celda (para que siempre se vean las 9) ni por estado (solo pendientes).
    var lista = App.filtrados(["celda", "estado", "folio"]).filter(function (e) { return e.pendiente; });
    var conteo = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], criticos = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    lista.forEach(function (e) {
      conteo[e.celda.impacto][e.celda.urgencia]++;
      if (e.prioridad === "Crítica") criticos[e.celda.impacto][e.celda.urgencia]++;
    });
    var maximo = Math.max.apply(null, conteo.map(function (fila) { return Math.max.apply(null, fila); }));
    var sel = estado.filtros.celda;

    var html = '<div class="eje esquina">Impacto ↓</div>' + ["Baja", "Media", "Alta"].map(function (t) { return '<div class="eje">' + t + "</div>"; }).join("");
    for (var impacto = 2; impacto >= 0; impacto--) {
      html += '<div class="eje eje-y">' + ["Bajo", "Medio", "Alto"][impacto] + "</div>";
      for (var urgencia = 0; urgencia <= 2; urgencia++) {
        var n = conteo[impacto][urgencia], c = criticos[impacto][urgencia];
        var k = clase(n, maximo);
        var seleccionada = sel && sel.impacto === impacto && sel.urgencia === urgencia;
        html += '<button type="button" class="celda' + (seleccionada ? " seleccionada" : "") + '" data-impacto="' + impacto + '" data-urgencia="' + urgencia + '"' +
          ' style="background:' + RAMPA[k] + ";color:" + (k >= 3 ? "#ffffff" : "#1b1a18") + '"' +
          ' aria-pressed="' + !!seleccionada + '"' +
          ' aria-label="Impacto ' + NIVELES_TEXTO[impacto] + ", urgencia " + ["baja", "media", "alta"][urgencia] + ": " + n + " pendientes, " + c + ' críticos"' +
          (n === 0 && !seleccionada ? " disabled" : "") + ">" +
          '<span class="n">' + n + "</span>" +
          '<span class="criticos">' + (c ? "▲ " + c + (c === 1 ? " crítico" : " críticos") : "&nbsp;") + "</span></button>";
      }
    }
    html += '<div></div><div class="titulo-eje">Urgencia →</div>';
    var contenedor = document.getElementById("matriz");
    contenedor.className = "matriz";
    contenedor.innerHTML = html;
    contenedor.setAttribute("aria-label", "Matriz de impacto (filas) por urgencia (columnas)");
  }

  document.addEventListener("click", function (evento) {
    var celda = evento.target.closest("#matriz .celda");
    if (!celda) return;
    var impacto = Number(celda.getAttribute("data-impacto")), urgencia = Number(celda.getAttribute("data-urgencia"));
    var sel = App.estado.filtros.celda;
    var misma = sel && sel.impacto === impacto && sel.urgencia === urgencia;
    App.cambiarFiltros({ celda: misma ? null : { impacto: impacto, urgencia: urgencia }, estado: "pendientes" });
  });

  window.Matriz = { RAMPA: RAMPA };
  App.registrar({ actualizar: actualizar });
})();
