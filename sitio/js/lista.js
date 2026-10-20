/* Atiende Primero · lista de atención
 * Reportes ordenados por prioridad (Modelo.priorizar), con filtros y búsqueda por folio.
 * También dibuja "Primeros por atender" en el resumen del celular.
 */
(function () {
  "use strict";
  var U = window.Util;
  var PAGINA = 50;
  var mostrar = PAGINA;

  function fila(e, seleccionado) {
    var r = e.reporte;
    var marcas = [];
    if (!e.pendiente) marcas.push('<span class="marca">Cerrado</span>');
    else if (r.estado === "En proceso") marcas.push('<span class="marca">En proceso</span>');
    if (e.pendiente && e.vencido) marcas.push('<span class="marca vencido">Vencido</span>');
    if (e.elevadoPorRegla) marcas.push('<span class="marca">Subió por regla</span>');
    return '<li><button type="button" class="reporte' + (seleccionado ? " seleccionado" : "") + '" data-folio="' + U.esc(r.folio) + '">' +
      '<span class="pos">' + e.posicion + "</span>" +
      '<span class="principal"><span class="linea1">' + U.chipPrioridad(e.prioridad) +
      '<span class="folio">' + U.esc(r.folio) + '</span><span class="tipo">' + U.esc(r.tipo) + "</span></span>" +
      '<span class="lugar">' + U.esc(r.municipio) + (r.localidad && r.localidad !== r.municipio ? " · " + U.esc(r.localidad) : "") + "</span>" +
      (marcas.length ? '<span class="marcas">' + marcas.join("") + "</span>" : "") + "</span>" +
      '<span class="puntaje"><strong>' + U.numero(e.puntaje, 1) + "</strong><span>puntos</span></span>" +
      "</button></li>";
  }

  function opciones(select, valores, actual, textoTodos) {
    select.innerHTML = '<option value="">' + textoTodos + "</option>" + valores.map(function (v) {
      return '<option value="' + U.esc(v) + '"' + (v === actual ? " selected" : "") + ">" + U.esc(v) + "</option>";
    }).join("");
  }

  function llenarFiltros(estado) {
    var municipios = {}, tipos = {};
    estado.evaluados.forEach(function (e) { municipios[e.reporte.municipio] = true; tipos[e.reporte.tipo] = true; });
    var orden = function (a, b) { return a.localeCompare(b, "es"); };
    opciones(document.getElementById("f-municipio"), Object.keys(municipios).sort(orden), estado.filtros.municipio, "Todos");
    opciones(document.getElementById("f-tipo"), Object.keys(tipos).sort(orden), estado.filtros.tipo, "Todos");
    var selEstado = document.getElementById("f-estado");
    selEstado.innerHTML = [["pendientes", "Pendientes"], ["Abierto", "Abiertos"], ["En proceso", "En proceso"], ["Cerrado", "Cerrados"], ["todos", "Todos"]]
      .map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === estado.filtros.estado ? " selected" : "") + ">" + o[1] + "</option>"; }).join("");
    opciones(document.getElementById("f-prioridad"), Modelo.PRIORIDADES.slice().reverse(), estado.filtros.prioridad, "Todas");
    var folio = document.getElementById("f-folio");
    if (document.activeElement !== folio) folio.value = estado.filtros.folio || "";
  }

  function actualizar(estado, motivo) {
    if (motivo === "vista") return;
    if (motivo === "datos" || motivo === "filtros") mostrar = PAGINA;
    if (motivo !== "seleccion") llenarFiltros(estado);

    var lista = App.filtrados();
    var visibles = lista.slice(0, mostrar);
    var contenedor = document.getElementById("lista");
    contenedor.innerHTML = visibles.length
      ? visibles.map(function (e) { return fila(e, e.reporte.folio === estado.seleccionado); }).join("")
      : '<li class="vacio">No hay reportes con estos filtros.</li>';
    document.getElementById("conteo-lista").textContent =
      "Mostrando " + visibles.length + " de " + lista.length + (lista.length === 1 ? " reporte" : " reportes") + ", ordenados por prioridad.";
    var mas = document.getElementById("btn-mas");
    mas.hidden = lista.length <= mostrar;
    mas.textContent = "Mostrar " + Math.min(PAGINA, lista.length - mostrar) + " más";

    // Primeros por atender (resumen en el celular): solo pendientes
    var primeros = lista.filter(function (e) { return e.pendiente; }).slice(0, 5);
    document.getElementById("primeros").innerHTML = primeros.length
      ? primeros.map(function (e) { return fila(e, e.reporte.folio === estado.seleccionado); }).join("")
      : '<li class="vacio">No hay pendientes con estos filtros.</li>';
  }

  document.addEventListener("click", function (evento) {
    var boton = evento.target.closest(".reporte[data-folio]");
    if (boton) App.seleccionar(boton.getAttribute("data-folio"));
  });

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("filtros");
    form.addEventListener("submit", function (e) { e.preventDefault(); });
    form.addEventListener("change", function (e) {
      var nombre = e.target.name, valor = e.target.value;
      if (nombre === "folio") return;
      var cambio = {};
      cambio[nombre] = valor || (nombre === "estado" ? "pendientes" : null);
      App.cambiarFiltros(cambio);
    });
    document.getElementById("f-folio").addEventListener("input", function (e) { App.cambiarFiltros({ folio: e.target.value }); });
    document.getElementById("btn-mas").addEventListener("click", function () {
      mostrar += PAGINA;
      actualizar(App.estado, "mas");
    });
  });

  App.registrar({ actualizar: actualizar });
})();
