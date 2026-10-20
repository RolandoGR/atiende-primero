/* Atiende Primero · usar mis archivos
 *
 * Lee reportes.xlsx y/o criterios.xlsx EN EL NAVEGADOR. Los archivos no se envían a ninguna parte.
 * Reconoce cuál es cuál por sus hojas ("Reportes" o "Pesos") y los valida con Lectura, igual que el ejemplo.
 * SheetJS (la biblioteca que lee Excel) se carga solo cuando hace falta, para que la página abra rápido.
 */
(function () {
  "use strict";
  var U = window.Util;
  var promesaSheetJS = null;

  // Carga lib/sheetjs/xlsx.mini.min.js una sola vez. Funciona también abriendo el archivo con doble clic.
  function asegurarSheetJS() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (promesaSheetJS) return promesaSheetJS;
    promesaSheetJS = new Promise(function (resolver, rechazar) {
      var s = document.createElement("script");
      s.src = "lib/sheetjs/xlsx.mini.min.js";
      s.onload = function () { resolver(window.XLSX); };
      s.onerror = function () { promesaSheetJS = null; rechazar(new Error("No se pudo cargar la biblioteca para leer Excel.")); };
      document.head.appendChild(s);
    });
    return promesaSheetJS;
  }

  function leerArchivo(archivo) {
    return new Promise(function (resolver, rechazar) {
      var lector = new FileReader();
      lector.onload = function () { resolver(lector.result); };
      lector.onerror = function () { rechazar(new Error("No se pudo leer " + archivo.name + ".")); };
      lector.readAsArrayBuffer(archivo);
    });
  }

  // Convierte un libro de Excel en {nombreHoja: filas}, el formato que entiende Lectura.
  function hojasDe(XLSX, datos) {
    var libro = XLSX.read(datos, { cellDates: true });
    var hojas = {};
    libro.SheetNames.forEach(function (nombre) {
      hojas[nombre] = XLSX.utils.sheet_to_json(libro.Sheets[nombre], { header: 1, defval: null, blankrows: false });
    });
    return hojas;
  }

  function tieneHoja(hojas, nombre) {
    return Object.keys(hojas).some(function (h) { return Modelo.claveTexto(h) === Modelo.claveTexto(nombre); });
  }

  function mostrar(html) {
    document.getElementById("resultado-carga").innerHTML = html;
  }

  function lista(mensajes) {
    return mensajes.length ? "<ul>" + mensajes.map(function (m) { return "<li>" + U.esc(m) + "</li>"; }).join("") + "</ul>" : "";
  }

  function procesar(archivos) {
    archivos = Array.prototype.slice.call(archivos || []);
    if (!archivos.length) return;
    mostrar('<p class="nota">Leyendo ' + archivos.length + (archivos.length === 1 ? " archivo" : " archivos") + "…</p>");
    asegurarSheetJS().then(function (XLSX) {
      return Promise.all(archivos.map(function (a) {
        if (!/\.xlsx$/i.test(a.name)) return { nombre: a.name, error: "no es un archivo .xlsx de Excel" };
        return leerArchivo(a).then(function (datos) {
          try { return { nombre: a.name, hojas: hojasDe(XLSX, datos) }; }
          catch (e) { return { nombre: a.name, error: "no se pudo abrir como Excel (¿está dañado o protegido con contraseña?)" }; }
        });
      }));
    }).then(function (leidos) {
      var opciones = { origen: { tipo: "propio", reportes: "", criterios: "" } };
      var problemas = [];
      leidos.forEach(function (l) {
        if (l.error) { problemas.push(l.nombre + ": " + l.error + "."); return; }
        if (tieneHoja(l.hojas, "Reportes")) { opciones.hojasReportes = l.hojas; opciones.origen.reportes = l.nombre; }
        else if (tieneHoja(l.hojas, "Pesos")) { opciones.hojasCriterios = l.hojas; opciones.origen.criterios = l.nombre; }
        else problemas.push(l.nombre + ": no tiene una hoja «Reportes» ni una hoja «Pesos». Hojas encontradas: " + Object.keys(l.hojas).join(", ") + ".");
      });
      if (!opciones.hojasReportes && !opciones.hojasCriterios) {
        mostrar('<p class="error">No se cargó nada.</p>' + lista(problemas));
        return;
      }
      var resultado = App.cargar(opciones);
      if (!resultado.ok) {
        mostrar('<p class="error">No se cargaron los archivos: hay que corregir esto primero. Se conservan los datos que tenías.</p>' +
          lista(problemas.concat(resultado.errores)) + (resultado.avisos.length ? "<p>Además:</p>" + lista(resultado.avisos) : ""));
        return;
      }
      var cargado = [];
      if (opciones.hojasReportes) cargado.push(App.estado.datos.reportes.length + " reportes de " + opciones.origen.reportes);
      if (opciones.hojasCriterios) cargado.push("criterios de " + opciones.origen.criterios);
      mostrar('<p class="ok">✓ Listo: ' + U.esc(cargado.join(" y ")) + ".</p>" +
        (problemas.length || resultado.avisos.length ? "<p>Revisa:</p>" + lista(problemas.concat(resultado.avisos)) : ""));
      App.avisar("Se cargaron tus archivos. Todo se calculó en tu dispositivo.");
    }).catch(function (e) {
      mostrar('<p class="error">' + U.esc(e.message) + "</p>");
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var dialogo = document.getElementById("dlg-cargar");
    var zona = document.getElementById("zona-carga");
    var entrada = document.getElementById("archivo");
    document.getElementById("btn-cargar").addEventListener("click", function () { U.abrirDialogo(dialogo); });
    entrada.addEventListener("change", function () { procesar(entrada.files); entrada.value = ""; });
    ["dragenter", "dragover"].forEach(function (tipo) {
      zona.addEventListener(tipo, function (e) { e.preventDefault(); zona.classList.add("encima"); });
    });
    ["dragleave", "drop"].forEach(function (tipo) {
      zona.addEventListener(tipo, function (e) { e.preventDefault(); zona.classList.remove("encima"); });
    });
    zona.addEventListener("drop", function (e) { procesar(e.dataTransfer.files); });
    // Evita que soltar un archivo fuera de la zona abra el archivo en la pestaña
    window.addEventListener("dragover", function (e) { e.preventDefault(); });
    window.addEventListener("drop", function (e) { e.preventDefault(); });
    document.getElementById("btn-volver-ejemplo").addEventListener("click", function () {
      App.cargarEjemplo();
      Enlace.escribir(null, []);
      mostrar('<p class="ok">✓ Se restauraron los datos y criterios de ejemplo.</p>');
    });
  });

  window.Cargador = { asegurarSheetJS: asegurarSheetJS, procesar: procesar };
})();
