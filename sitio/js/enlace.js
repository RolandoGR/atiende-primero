/* Atiende Primero · pesos en el enlace
 *
 * Los pesos ajustados se guardan en el fragmento de la URL: index.html#pesos=severidad.30~usuarios.25~...
 * El fragmento (lo que va después de #) nunca se envía al servidor, así que compartir el enlace no envía datos
 * a ninguna parte. Solo viajan los pesos, nunca los reportes.
 */
(function () {
  "use strict";

  var PREFIJO = "pesos=";

  function leer() {
    var fragmento = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (fragmento.indexOf(PREFIJO) !== 0) return { pesos: null, invalidos: [] };
    var pesos = {}, invalidos = [];
    fragmento.slice(PREFIJO.length).split("~").forEach(function (par) {
      if (!par) return;
      var partes = par.split(".");
      var valor = Number(partes[1]);
      if (partes.length === 2 && /^[a-z]+$/.test(partes[0]) && isFinite(valor) && valor >= 0 && valor <= 100) pesos[partes[0]] = valor;
      else invalidos.push(par);
    });
    return { pesos: Object.keys(pesos).length ? pesos : null, invalidos: invalidos };
  }

  function texto(pesos, orden) {
    return PREFIJO + orden.map(function (clave) { return clave + "." + Math.round(pesos[clave]); }).join("~");
  }

  // Escribe los pesos en la barra de direcciones sin agregar pasos al historial ni recargar.
  function escribir(pesos, orden) {
    var url = location.href.split("#")[0] + (pesos ? "#" + texto(pesos, orden) : "");
    try { history.replaceState(null, "", url); } catch (e) { /* algunos navegadores lo impiden en file:// */ }
    return url;
  }

  window.Enlace = { leer: leer, escribir: escribir };
})();
