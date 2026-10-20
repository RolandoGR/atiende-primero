/* Atiende Primero · ajuste de pesos en vivo
 * Una barra de 0 a 100 por criterio, independiente de las demás. Al lado se ve qué porcentaje real del puntaje
 * representa (peso ÷ suma de pesos). Al moverla se recalcula todo y el enlace guarda los pesos.
 */
(function () {
  "use strict";
  var U = window.Util;
  var pendiente = null;    // pesos esperando el siguiente cuadro de animación

  function construir(estado) {
    var c = estado.criterios;
    document.getElementById("pesos").innerHTML = c.orden.map(function (clave) {
      var p = c.pesos[clave];
      return '<div class="peso" data-clave="' + clave + '">' +
        '<div class="peso-cabeza"><label for="peso-' + clave + '">' + U.esc(p.nombre) + "</label>" +
        '<span class="peso-valor"><strong data-valor></strong> <span data-porcentaje></span></span></div>' +
        '<input type="range" id="peso-' + clave + '" min="0" max="100" step="1" value="' + p.peso + '" data-clave="' + clave + '"' +
        ' aria-describedby="desc-' + clave + '">' +
        '<p class="nota" id="desc-' + clave + '">' + U.esc(p.descripcion || "") + "</p></div>";
    }).join("");
  }

  function refrescar(estado) {
    var c = estado.criterios, base = App.pesosBase();
    var suma = c.orden.reduce(function (s, k) { return s + c.pesos[k].peso; }, 0);
    c.orden.forEach(function (clave) {
      var caja = document.querySelector('.peso[data-clave="' + clave + '"]');
      if (!caja) return;
      var peso = c.pesos[clave].peso;
      var barra = caja.querySelector("input");
      if (document.activeElement !== barra) barra.value = peso;
      caja.querySelector("[data-valor]").textContent = U.numero(peso);
      var pct = suma > 0 ? peso * 100 / suma : 0;
      caja.querySelector("[data-porcentaje]").textContent = "(" + U.numero(pct) + " % del puntaje)";
      barra.setAttribute("aria-valuetext", peso + ", " + Math.round(pct) + " por ciento del puntaje");
      caja.classList.toggle("cambiado", peso !== base[clave]);
    });
    var aviso = document.getElementById("aviso-pesos");
    aviso.hidden = suma > 0;
    aviso.textContent = suma > 0 ? "" : "Todos los pesos están en 0: sube al menos uno para calcular la prioridad.";
  }

  function actualizar(estado, motivo) {
    if (motivo === "datos" || !document.querySelector(".peso")) construir(estado);
    if (motivo === "vista" || motivo === "filtros" || motivo === "seleccion") return;
    refrescar(estado);
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("pesos").addEventListener("input", function (e) {
      if (!e.target.matches('input[type="range"]')) return;
      pendiente = pendiente || {};
      pendiente[e.target.getAttribute("data-clave")] = Number(e.target.value);
      // Un solo recálculo por cuadro de animación aunque el control envíe muchos eventos
      window.requestAnimationFrame(function () {
        if (!pendiente) return;
        var pesos = pendiente;
        pendiente = null;
        App.aplicarPesos(pesos);
      });
    });
    document.getElementById("btn-restablecer").addEventListener("click", function () {
      App.restablecerPesos();
      App.avisar("Pesos restablecidos a los del Excel cargado.");
    });
    document.getElementById("btn-compartir").addEventListener("click", function () {
      var url = Enlace.escribir(App.pesosCambiados() ? App.pesosActuales() : null, App.estado.criterios.orden);
      var campo = document.getElementById("enlace-copiable");
      campo.value = url;
      var listo = function () { App.avisar("Enlace copiado. Quien lo abra verá la lista con estos pesos."); };
      var aMano = function () {
        campo.hidden = false;
        campo.select();
        App.avisar("Copia el enlace del recuadro.");
      };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(listo, aMano);
      else aMano();
    });
    document.getElementById("btn-como").addEventListener("click", function () { Ayuda.abrir(); });
  });

  App.registrar({ actualizar: actualizar });
})();
