/* Atiende Primero · arranque y navegación
 * Carga los datos de ejemplo (y los pesos del enlace, si los hay), maneja las pestañas,
 * el texto de origen de los datos y los chips de filtros activos.
 */
(function () {
  "use strict";
  var U = window.Util;
  var CLAVE_BIENVENIDA = "atiende-primero:bienvenida-cerrada";

  // Pestañas y vista activa (en computadora se ven todas a la vez por CSS)
  function navegacion(estado, motivo) {
    Array.prototype.forEach.call(document.querySelectorAll(".vista"), function (v) {
      v.classList.toggle("activa", v.getAttribute("data-vista") === estado.vista);
    });
    Array.prototype.forEach.call(document.querySelectorAll(".pestana"), function (p) {
      var activa = p.getAttribute("data-ir-a") === estado.vista;
      p.classList.toggle("activa", activa);
      if (activa) p.setAttribute("aria-current", "page"); else p.removeAttribute("aria-current");
    });
    if (motivo === "vista") window.scrollTo(0, 0);
  }

  function origen(estado) {
    var d = estado.datos;
    var texto = (estado.origen.tipo === "ejemplo" ? "Datos de ejemplo" : "Tus archivos: " + estado.origen.reportes + " · " + estado.origen.criterios) +
      " · " + d.reportes.length + " reportes · corte " + U.fecha(d.fechaCorte) + (App.pesosCambiados() ? " · pesos ajustados" : "");
    document.getElementById("origen").textContent = texto;
  }

  function chips(estado) {
    var f = estado.filtros, lista = [];
    if (f.celda) lista.push(["celda", "Impacto " + Modelo.NIVELES[f.celda.impacto].toLowerCase() + " · urgencia " + ["baja", "media", "alta"][f.celda.urgencia]]);
    if (f.municipio) lista.push(["municipio", f.municipio]);
    if (f.tipo) lista.push(["tipo", f.tipo]);
    if (f.prioridad) lista.push(["prioridad", "Prioridad " + f.prioridad.toLowerCase()]);
    if (f.estado !== "pendientes") lista.push(["estado", f.estado === "todos" ? "Todos los estados" : f.estado]);
    if (f.folio) lista.push(["folio", "Folio: " + f.folio]);
    var contenedor = document.getElementById("filtros-activos");
    contenedor.hidden = !lista.length;
    contenedor.innerHTML = lista.map(function (c) {
      return '<button type="button" class="chip-filtro" data-quitar="' + c[0] + '" aria-label="Quitar filtro: ' + U.esc(c[1]) + '">' + U.esc(c[1]) + ' <span aria-hidden="true">×</span></button>';
    }).join("") + (lista.length > 1 ? '<button type="button" class="chip-filtro limpiar" data-quitar="todo">Quitar todos</button>' : "");
  }

  App.registrar({
    actualizar: function (estado, motivo) {
      navegacion(estado, motivo);
      if (motivo === "vista" || motivo === "seleccion") return;
      origen(estado);
      chips(estado);
    }
  });

  document.addEventListener("click", function (e) {
    var ir = e.target.closest("[data-ir-a]");
    if (ir) { App.irA(ir.getAttribute("data-ir-a")); return; }
    var quitar = e.target.closest("[data-quitar]");
    if (quitar) {
      var k = quitar.getAttribute("data-quitar");
      if (k === "todo") App.limpiarFiltros();
      else { var cambio = {}; cambio[k] = k === "estado" ? "pendientes" : k === "folio" ? "" : null; App.cambiarFiltros(cambio); }
    }
  });

  // La hoja de detalle se detiene debajo del encabezado para que la leyenda de datos ficticios siempre se vea
  function medirEncabezado() {
    var alto = document.querySelector(".encabezado").offsetHeight;
    document.documentElement.style.setProperty("--alto-encabezado", alto + "px");
  }
  window.addEventListener("resize", medirEncabezado);

  function arrancar() {
    medirEncabezado();
    var enlace = Enlace.leer();
    var resultado = App.cargarEjemplo(enlace.pesos);
    if (!resultado.ok) {
      document.getElementById("principal").innerHTML = '<p class="tarjeta">No se pudieron leer los datos de ejemplo: ' + U.esc(resultado.errores.join(" ")) + "</p>";
      return;
    }
    if (enlace.pesos) App.avisar("Se aplicaron los pesos que venían en el enlace.");
    if (enlace.invalidos.length) App.avisar("Algunos pesos del enlace no eran válidos y se ignoraron.");

    var bienvenida = document.getElementById("bienvenida");
    var cerrada = false;
    try { cerrada = localStorage.getItem(CLAVE_BIENVENIDA) === "1"; } catch (e) { /* sin almacenamiento */ }
    bienvenida.hidden = cerrada;
    document.getElementById("cerrar-bienvenida").addEventListener("click", function () {
      bienvenida.hidden = true;
      try { localStorage.setItem(CLAVE_BIENVENIDA, "1"); } catch (e) { /* sin almacenamiento */ }
    });

    if (!Recorrido.yaVisto()) setTimeout(Recorrido.iniciar, 400);

    // Precarga en segundo plano la biblioteca de Excel: así cargar y exportar funcionan aunque después se pierda la señal.
    var precargar = function () { Cargador.asegurarSheetJS().catch(function () { /* se reintenta al usarla */ }); };
    if (window.requestIdleCallback) window.requestIdleCallback(precargar, { timeout: 3000 });
    else setTimeout(precargar, 1500);
  }

  // Los scripts llevan "defer": se ejecutan antes de DOMContentLoaded, así que se arranca en ese momento,
  // cuando todos los módulos ya conectaron sus botones.
  document.addEventListener("DOMContentLoaded", arrancar);
})();
