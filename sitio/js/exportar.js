/* Atiende Primero · exportar la lista priorizada a Excel
 * Respeta los filtros activos. El archivo se arma en el navegador y se descarga directamente.
 */
(function () {
  "use strict";

  function redondear(n, d) { var f = Math.pow(10, d); return Math.round(n * f) / f; }

  function exportar() {
    Cargador.asegurarSheetJS().then(function (XLSX) {
      var estado = App.estado;
      var lista = App.filtrados();
      var orden = estado.criterios.orden;
      var nombres = orden.map(function (k) { return estado.criterios.pesos[k].nombre; });
      var columnasOriginales = Lectura.COLUMNAS_REPORTES;

      var encabezados = ["Posición", "Folio", "Prioridad", "Puntaje", "Prioridad por puntaje", "Reglas aplicadas"]
        .concat(nombres.map(function (n) { return "Aporte: " + n; }))
        .concat(["Impacto (0-1)", "Urgencia (0-1)", "Celda de la matriz", "Vencido"])
        .concat(columnasOriginales.filter(function (c) { return c.campo !== "folio"; }).map(function (c) { return c.nombre; }));

      var filas = lista.map(function (e) {
        var r = e.reporte;
        return [e.posicion, r.folio, e.prioridad, redondear(e.puntaje, 2), e.prioridadPuntaje,
          e.reglasAplicadas.map(function (x) { return x.texto; }).join(" | ")]
          .concat(orden.map(function (k) { return redondear(e.aportes.filter(function (a) { return a.clave === k; })[0].aporte, 2); }))
          .concat([redondear(e.impacto, 3), redondear(e.urgencia, 3),
            "Impacto " + Modelo.NIVELES[e.celda.impacto].toLowerCase() + " · urgencia " + ["baja", "media", "alta"][e.celda.urgencia],
            e.vencido ? "Sí" : "No"])
          .concat(columnasOriginales.filter(function (c) { return c.campo !== "folio"; }).map(function (c) {
            var v = r[c.campo];
            if (c.tipo === "siNo") return v ? "Sí" : "No";
            if (v instanceof Date) return Util.fecha(v);
            return v === null || v === undefined ? "" : v;
          }));
      });

      var suma = orden.reduce(function (s, k) { return s + estado.criterios.pesos[k].peso; }, 0);
      var pesos = [["Criterio", "Peso", "% del puntaje", "Eje de la matriz"]].concat(orden.map(function (k) {
        var p = estado.criterios.pesos[k];
        return [p.nombre, p.peso, redondear(p.peso * 100 / suma, 1), p.eje];
      }));

      var f = estado.filtros, filtros = [];
      if (f.municipio) filtros.push("Municipio: " + f.municipio);
      if (f.tipo) filtros.push("Tipo: " + f.tipo);
      if (f.prioridad) filtros.push("Prioridad: " + f.prioridad);
      if (f.celda) filtros.push("Celda: impacto " + Modelo.NIVELES[f.celda.impacto].toLowerCase() + ", urgencia " + ["baja", "media", "alta"][f.celda.urgencia]);
      if (f.folio) filtros.push("Folio contiene: " + f.folio);
      filtros.push("Estado: " + (f.estado === "pendientes" ? "pendientes" : f.estado));

      var acerca = [
        ["Dato", "Valor"],
        ["Aviso", "Ejemplo didáctico con datos ficticios. La prioridad es una sugerencia; la decisión final es de las personas."],
        ["Generado con", "Atiende Primero (se calculó en el navegador; nada se envió a ningún servidor)"],
        ["Fecha de corte", Util.fecha(estado.datos.fechaCorte)],
        ["Reportes", estado.origen.reportes],
        ["Criterios", estado.origen.criterios + (App.pesosCambiados() ? " (pesos ajustados en pantalla)" : "")],
        ["Filtros", filtros.join(" · ")],
        ["Filas exportadas", lista.length]
      ];

      var libro = XLSX.utils.book_new();
      var hoja = XLSX.utils.aoa_to_sheet([encabezados].concat(filas));
      hoja["!cols"] = encabezados.map(function (h) { return { wch: Math.max(10, Math.min(40, h.length + 2)) }; });
      XLSX.utils.book_append_sheet(libro, hoja, "Lista priorizada");
      XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(pesos), "Pesos usados");
      XLSX.utils.book_append_sheet(libro, XLSX.utils.aoa_to_sheet(acerca), "Acerca de");
      XLSX.writeFile(libro, "atiende-primero-priorizado.xlsx");
      App.avisar("Se descargó la lista priorizada (" + lista.length + " reportes).");
    }).catch(function (e) { App.avisar(e.message); });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btn-exportar").addEventListener("click", exportar);
  });

  window.Exportar = { exportar: exportar };
})();
