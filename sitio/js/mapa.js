/* Atiende Primero · mapa de Sonora (Leaflet, sin conexión)
 *
 * - Municipios coloreados por cuántos reportes pendientes tienen en prioridad crítica o alta.
 * - Reportes como puntos del color de su prioridad (los críticos se dibujan encima).
 * - Tocar un municipio lo acerca y filtra por él; tocar un punto abre su detalle.
 * - Capa de calles de OpenStreetMap opcional y apagada: es lo único que puede pedir algo a internet.
 */
(function () {
  "use strict";
  var U = window.Util;

  // Rampa de un solo tono (violeta grisáceo, distinta de los colores de prioridad), de 0 a "8 o más".
  var CLASES = [
    { desde: 0, hasta: 0, color: "#eeebf3", texto: "0" },
    { desde: 1, hasta: 1, color: "#cfc8e0", texto: "1" },
    { desde: 2, hasta: 3, color: "#a99bc9", texto: "2–3" },
    { desde: 4, hasta: 7, color: "#8571b0", texto: "4–7" },
    { desde: 8, hasta: Infinity, color: "#624b94", texto: "8 o más" }
  ];

  var mapa, capaMunicipios, capaPuntos, capaCalles, limitesSonora;
  var capasPorMunicipio = {};   // nombre normalizado -> capa de Leaflet
  var conteos = {};             // nombre normalizado -> críticos + altos pendientes
  var iniciado = false;

  function claseDe(n) {
    for (var i = 0; i < CLASES.length; i++) if (n >= CLASES[i].desde && n <= CLASES[i].hasta) return CLASES[i];
    return CLASES[0];
  }

  function iniciar() {
    if (iniciado || !window.L || !window.MUNICIPIOS_SONORA) return;
    iniciado = true;
    mapa = L.map("mapa", { preferCanvas: true, zoomSnap: 0.25, minZoom: 5, maxZoom: 15, attributionControl: true, tap: true });
    mapa.attributionControl.setPrefix('<a href="https://leafletjs.com" rel="noreferrer">Leaflet</a>');
    mapa.attributionControl.addAttribution("Fuente: INEGI, Marco Geoestadístico 2025 (límites simplificados)");

    capaMunicipios = L.geoJSON(MUNICIPIOS_SONORA, {
      style: function () { return { color: "#6f6a7a", weight: 0.8, fillColor: CLASES[0].color, fillOpacity: 0.9 }; },
      onEachFeature: function (rasgo, capa) {
        var nombre = rasgo.properties.nombre;
        capasPorMunicipio[Modelo.normalizarTexto(nombre)] = capa;
        capa.on("click", function () { elegirMunicipio(nombre); });
        capa.bindTooltip(function () {
          var n = conteos[Modelo.normalizarTexto(nombre)] || 0;
          return "<strong>" + U.esc(nombre) + "</strong><br>" + n + (n === 1 ? " pendiente crítico o alto" : " pendientes críticos o altos");
        }, { sticky: true });
      }
    }).addTo(mapa);
    limitesSonora = capaMunicipios.getBounds();
    mapa.fitBounds(limitesSonora);
    encuadrado = document.getElementById("mapa").offsetWidth > 0;
    mapa.setMaxBounds(limitesSonora.pad(0.5));
    capaPuntos = L.layerGroup().addTo(mapa);

    document.getElementById("btn-ver-sonora").addEventListener("click", function () {
      App.cambiarFiltros({ municipio: null });
      mapa.flyToBounds(limitesSonora, { duration: 0.4 });
    });
    document.getElementById("chk-calles").addEventListener("change", alternarCalles);
    leyenda();
  }

  function elegirMunicipio(nombre) {
    // Usa el nombre como aparece en los reportes, si existe; si no, el del mapa
    var enDatos = App.estado.evaluados.find(function (e) { return Modelo.normalizarTexto(e.reporte.municipio) === Modelo.normalizarTexto(nombre); });
    var valor = enDatos ? enDatos.reporte.municipio : nombre;
    App.cambiarFiltros({ municipio: App.estado.filtros.municipio === valor ? null : valor });
  }

  function alternarCalles(evento) {
    if (evento.target.checked) {
      var acepta = window.confirm("La capa de calles pide imágenes del mapa a los servidores de OpenStreetMap, por internet.\n\n" +
        "Tus reportes NO se envían: solo se piden imágenes de la zona que estás viendo.\n\n¿Activarla?");
      if (!acepta) { evento.target.checked = false; return; }
      capaCalles = capaCalles || L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" rel="noreferrer">OpenStreetMap</a>', referrerPolicy: "no-referrer"
      });
      capaCalles.addTo(mapa);
      capaCalles.bringToBack();
      capaMunicipios.setStyle({ fillOpacity: 0.45 });
    } else if (capaCalles) {
      mapa.removeLayer(capaCalles);
      capaMunicipios.setStyle({ fillOpacity: 0.9 });
    }
  }

  function leyenda() {
    var html = '<div class="grupo"><strong>Municipios:</strong> críticos + altos pendientes ' +
      CLASES.map(function (c) { return '<span><span class="muestra" style="background:' + c.color + '"></span> ' + c.texto + "</span>"; }).join("") + "</div>" +
      '<div class="grupo"><strong>Reportes:</strong> ' +
      Modelo.PRIORIDADES.slice().reverse().map(function (p) {
        return '<span><span class="punto" style="background:' + U.COLORES[p] + '"></span> <span aria-hidden="true">' + U.ICONOS[p] + "</span> " + p + "</span>";
      }).join("") + "</div>";
    document.getElementById("leyenda-mapa").innerHTML = html;
  }

  function pintarMunicipios() {
    conteos = {};
    // El color no depende del filtro de municipio, para poder comparar con los vecinos.
    App.filtrados(["municipio", "estado", "folio"]).forEach(function (e) {
      if (!e.pendiente || (e.prioridad !== "Crítica" && e.prioridad !== "Alta")) return;
      var clave = Modelo.normalizarTexto(e.reporte.municipio);
      conteos[clave] = (conteos[clave] || 0) + 1;
    });
    var elegido = App.estado.filtros.municipio ? Modelo.normalizarTexto(App.estado.filtros.municipio) : null;
    Object.keys(capasPorMunicipio).forEach(function (clave) {
      var capa = capasPorMunicipio[clave];
      capa.setStyle({
        fillColor: claseDe(conteos[clave] || 0).color,
        color: clave === elegido ? "#1b1a18" : "#6f6a7a",
        weight: clave === elegido ? 3 : 0.8
      });
      if (clave === elegido) capa.bringToFront();
    });
  }

  function pintarPuntos() {
    capaPuntos.clearLayers();
    var lista = App.filtrados(["municipio"]).filter(function (e) { return e.reporte.latitud !== null; });
    // Primero los de menor prioridad, para que los críticos queden encima
    lista.slice().reverse().forEach(function (e) {
      var color = e.pendiente ? U.COLORES[e.prioridad] : "#8a8780";
      var seleccionado = App.estado.seleccionado === e.reporte.folio;
      var punto = L.circleMarker([e.reporte.latitud, e.reporte.longitud], {
        radius: seleccionado ? 10 : 6.5, color: seleccionado ? "#1b1a18" : "#ffffff", weight: seleccionado ? 3 : 1.5,
        fillColor: color, fillOpacity: e.pendiente ? 0.95 : 0.6
      });
      punto.bindTooltip(U.esc(e.reporte.folio) + " · " + U.esc(e.prioridad) + "<br>" + U.esc(e.reporte.tipo) + " · " + U.esc(e.reporte.localidad || e.reporte.municipio));
      punto.on("click", function (ev) { L.DomEvent.stopPropagation(ev); App.seleccionar(e.reporte.folio); });
      capaPuntos.addLayer(punto);
    });
  }

  function acercarMunicipio(nombre) {
    var capa = capasPorMunicipio[Modelo.normalizarTexto(nombre)];
    if (capa) mapa.flyToBounds(capa.getBounds(), { padding: [20, 20], maxZoom: 11, duration: 0.4 });
  }

  var ultimoMunicipio = null;
  var encuadrado = false;   // ¿ya se encuadró Sonora con el mapa visible?

  function actualizar(estado, motivo) {
    if (!iniciado) iniciar();
    if (!iniciado) return;
    if (motivo === "vista") {
      // Leaflet necesita recalcular su tamaño cuando su pestaña se vuelve visible; la primera vez, encuadra Sonora.
      setTimeout(function () {
        mapa.invalidateSize();
        if (!encuadrado && document.getElementById("mapa").offsetWidth > 0) {
          encuadrado = true;
          if (estado.filtros.municipio) acercarMunicipio(estado.filtros.municipio); else mapa.fitBounds(limitesSonora);
        }
      }, 0);
      return;
    }
    pintarMunicipios();
    pintarPuntos();
    if (estado.filtros.municipio !== ultimoMunicipio) {
      ultimoMunicipio = estado.filtros.municipio;
      if (ultimoMunicipio) acercarMunicipio(ultimoMunicipio);
      else if (motivo === "datos") mapa.fitBounds(limitesSonora);
    }
  }

  // Centra el mapa en un reporte (desde el detalle: "Ver en el mapa")
  function verReporte(e) {
    if (!iniciado || e.reporte.latitud === null) return;
    App.irA("mapa");
    setTimeout(function () {
      mapa.invalidateSize();
      mapa.flyTo([e.reporte.latitud, e.reporte.longitud], 12, { duration: 0.4 });
    }, 50);
  }

  window.Mapa = { verReporte: verReporte, CLASES: CLASES };
  App.registrar({ actualizar: actualizar });
})();
