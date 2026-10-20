/* Atiende Primero · estado de la aplicación
 *
 * Guarda en un solo lugar los datos cargados, los criterios, los filtros y el reporte seleccionado.
 * Cuando algo cambia, recalcula con el modelo (solo si cambiaron datos o pesos) y avisa a cada parte de la
 * pantalla para que se actualice. Cada módulo se registra con App.registrar({actualizar: function (estado, motivo) {...}}).
 */
(function () {
  "use strict";

  var modulos = [];

  var FILTROS_VACIOS = { municipio: null, tipo: null, estado: "pendientes", prioridad: null, celda: null, folio: "" };

  var estado = {
    datos: null,            // {reportes, fechaCorte, columnas} de Lectura.leerReportes
    criteriosBase: null,    // criterios tal como vienen del Excel
    criterios: null,        // criterios con los pesos ajustados en la pantalla
    evaluados: [],          // resultado de Modelo.priorizar
    filtros: copiar(FILTROS_VACIOS),
    seleccionado: null,     // folio del reporte abierto en el detalle
    vista: "resumen",
    origen: { tipo: "ejemplo", reportes: "datos de ejemplo", criterios: "criterios de ejemplo" },
    avisos: []
  };

  function copiar(o) { return JSON.parse(JSON.stringify(o)); }

  function registrar(modulo) { modulos.push(modulo); }

  function notificar(motivo) {
    modulos.forEach(function (m) {
      try { m.actualizar(estado, motivo); } catch (e) { if (window.console) console.error(e); }
    });
  }

  function recalcular() {
    estado.evaluados = Modelo.priorizar(estado.datos.reportes, estado.criterios);
  }

  function pesosActuales() {
    var pesos = {};
    estado.criterios.orden.forEach(function (clave) { pesos[clave] = estado.criterios.pesos[clave].peso; });
    return pesos;
  }

  function pesosBase() {
    var pesos = {};
    estado.criteriosBase.orden.forEach(function (clave) { pesos[clave] = estado.criteriosBase.pesos[clave].peso; });
    return pesos;
  }

  function pesosCambiados() {
    var base = pesosBase(), actuales = pesosActuales();
    return Object.keys(base).some(function (k) { return base[k] !== actuales[k]; });
  }

  // Revisa que los municipios de los reportes existan en el mapa.
  function revisarMunicipios(reportes) {
    var conocidos = {};
    (window.MUNICIPIOS_SONORA ? MUNICIPIOS_SONORA.features : []).forEach(function (f) {
      conocidos[Modelo.normalizarTexto(f.properties.nombre)] = true;
    });
    var faltantes = {};
    reportes.forEach(function (r) {
      if (!conocidos[Modelo.normalizarTexto(r.municipio)]) faltantes[r.municipio] = true;
    });
    var lista = Object.keys(faltantes);
    return lista.length ? ["Estos municipios no están en el mapa de Sonora y no se colorearán: " + lista.slice(0, 6).join(", ") + (lista.length > 6 ? "…" : "") + "."] : [];
  }

  /*
   * Carga hojas ya leídas (del ejemplo o de un Excel). Cualquiera de las dos puede faltar: se conserva la actual.
   * Devuelve {ok, errores, avisos}. Si hay errores graves, no reemplaza nada.
   */
  function cargar(opciones) {
    var errores = [], avisos = [];
    var datos = estado.datos, criteriosBase = estado.criteriosBase;

    if (opciones.hojasReportes) {
      var r = Lectura.leerReportes(opciones.hojasReportes);
      if (!r.reportes.length) {
        errores = errores.concat(r.errores);
      } else {
        datos = r;
        avisos = avisos.concat(r.avisos);
        if (r.errores.length) avisos.push("Se omitieron filas con problemas (se cargaron " + r.reportes.length + "):");
        avisos = avisos.concat(r.errores);
      }
    }
    if (opciones.hojasCriterios) {
      var c = Lectura.leerCriterios(opciones.hojasCriterios);
      if (!c.criterios) errores = errores.concat(c.errores);
      else { criteriosBase = c.criterios; avisos = avisos.concat(c.avisos); }
    }
    if (errores.length) return { ok: false, errores: errores, avisos: avisos };

    avisos = avisos.concat(Lectura.revisarReglas(criteriosBase, datos.columnas), revisarMunicipios(datos.reportes));
    estado.datos = datos;
    estado.criteriosBase = criteriosBase;
    estado.criterios = copiar(criteriosBase);
    if (opciones.pesos) aplicarPesosSinAvisar(opciones.pesos);
    if (opciones.origen) {
      if (opciones.hojasReportes) estado.origen.reportes = opciones.origen.reportes;
      if (opciones.hojasCriterios) estado.origen.criterios = opciones.origen.criterios;
      estado.origen.tipo = opciones.origen.tipo;
    }
    estado.filtros = copiar(FILTROS_VACIOS);
    estado.seleccionado = null;
    estado.avisos = avisos;
    recalcular();
    notificar("datos");
    return { ok: true, errores: [], avisos: avisos };
  }

  function cargarEjemplo(pesos) {
    var resultado = cargar({
      hojasReportes: DATOS_EJEMPLO.reportes, hojasCriterios: DATOS_EJEMPLO.criterios, pesos: pesos,
      origen: { tipo: "ejemplo", reportes: "datos de ejemplo", criterios: "criterios de ejemplo" }
    });
    return resultado;
  }

  function aplicarPesosSinAvisar(pesos) {
    Object.keys(pesos).forEach(function (clave) {
      if (estado.criterios.pesos[clave]) estado.criterios.pesos[clave].peso = Number(pesos[clave]);
    });
  }

  // Cambia pesos (desde los controles o el enlace) y recalcula. Si todos quedan en 0 no recalcula.
  function aplicarPesos(pesos) {
    aplicarPesosSinAvisar(pesos);
    var suma = estado.criterios.orden.reduce(function (s, k) { return s + estado.criterios.pesos[k].peso; }, 0);
    if (suma <= 0) { notificar("pesos-invalidos"); return false; }
    recalcular();
    Enlace.escribir(pesosCambiados() ? pesosActuales() : null, estado.criterios.orden);
    notificar("pesos");
    return true;
  }

  function restablecerPesos() { return aplicarPesos(pesosBase()); }

  function cambiarFiltros(parcial) {
    Object.keys(parcial).forEach(function (k) { estado.filtros[k] = parcial[k]; });
    notificar("filtros");
  }

  function limpiarFiltros() {
    estado.filtros = copiar(FILTROS_VACIOS);
    notificar("filtros");
  }

  function seleccionar(folio) {
    estado.seleccionado = folio;
    notificar("seleccion");
  }

  function irA(vista) {
    estado.vista = vista;
    notificar("vista");
  }

  // Reportes evaluados que pasan los filtros. "excluir" deja fuera algunos filtros (p. ej., la matriz no se filtra a sí misma).
  function filtrados(excluir) {
    var f = estado.filtros, sin = {};
    (excluir || []).forEach(function (k) { sin[k] = true; });
    var folio = (f.folio || "").trim().toLowerCase();
    return estado.evaluados.filter(function (e) {
      var r = e.reporte;
      if (!sin.municipio && f.municipio && r.municipio !== f.municipio) return false;
      if (!sin.tipo && f.tipo && r.tipo !== f.tipo) return false;
      if (!sin.prioridad && f.prioridad && e.prioridad !== f.prioridad) return false;
      if (!sin.celda && f.celda && (e.celda.impacto !== f.celda.impacto || e.celda.urgencia !== f.celda.urgencia || !e.pendiente)) return false;
      if (!sin.estado) {
        if (f.estado === "pendientes" && !e.pendiente) return false;
        if (f.estado !== "pendientes" && f.estado !== "todos" && r.estado !== f.estado) return false;
      }
      if (!sin.folio && folio && String(r.folio).toLowerCase().indexOf(folio) === -1) return false;
      return true;
    });
  }

  function buscar(folio) {
    for (var i = 0; i < estado.evaluados.length; i++) if (estado.evaluados[i].reporte.folio === folio) return estado.evaluados[i];
    return null;
  }

  function avisar(mensaje) {
    var caja = document.getElementById("aviso");
    // Con un diálogo abierto el aviso quedaría detrás; el diálogo ya muestra su propio resultado.
    if (!caja || document.querySelector("dialog[open]")) return;
    caja.textContent = mensaje;
    caja.hidden = false;
    clearTimeout(avisar.temporizador);
    avisar.temporizador = setTimeout(function () { caja.hidden = true; }, 3500);
  }

  window.App = {
    estado: estado,
    registrar: registrar,
    cargar: cargar,
    cargarEjemplo: cargarEjemplo,
    aplicarPesos: aplicarPesos,
    restablecerPesos: restablecerPesos,
    pesosActuales: pesosActuales,
    pesosBase: pesosBase,
    pesosCambiados: pesosCambiados,
    cambiarFiltros: cambiarFiltros,
    limpiarFiltros: limpiarFiltros,
    seleccionar: seleccionar,
    irA: irA,
    filtrados: filtrados,
    buscar: buscar,
    avisar: avisar
  };
})();
