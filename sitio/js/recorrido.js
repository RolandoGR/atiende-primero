/* Atiende Primero · recorrido guiado (la primera vez)
 * Cinco pasos que señalan las partes de la pantalla. Se puede saltar y repetir desde "?".
 * Lo único que se guarda en el navegador es que ya se vio (localStorage); si no se puede guardar, no pasa nada.
 */
(function () {
  "use strict";
  var CLAVE = "atiende-primero:recorrido-visto";

  var PASOS = [
    { vista: "resumen", objetivo: "#indicadores", titulo: "Lo pendiente, de un vistazo",
      texto: "Cuántos reportes siguen pendientes, cuántos ya vencieron y cuántos hay de cada prioridad. Todos los datos son ficticios." },
    { vista: "resumen", objetivo: "#tarjeta-matriz", titulo: "Impacto × urgencia",
      texto: "Cada celda agrupa reportes según su impacto (severidad y usuarios) y su urgencia (tiempo y recurrencia). Toca una para filtrar." },
    { vista: "mapa", objetivo: "#vista-mapa .tarjeta", titulo: "Dónde se concentra lo urgente",
      texto: "Los municipios más oscuros tienen más reportes críticos y altos. Toca uno para acercarte; toca un punto para ver su reporte." },
    { vista: "lista", objetivo: "#vista-lista .tarjeta", titulo: "Qué atender primero",
      texto: "La lista está ordenada por prioridad. Toca un reporte para ver cuántos puntos aportó cada criterio y qué reglas aplicaron." },
    { vista: "pesos", objetivo: "#tarjeta-pesos", titulo: "Tú decides los criterios",
      texto: "Mueve los pesos y mira cómo cambia el orden. También puedes cargar tus propios Excel: no salen de tu dispositivo." }
  ];

  var paso = 0;

  function marcarVisto() { try { localStorage.setItem(CLAVE, "1"); } catch (e) { /* sin almacenamiento: no importa */ } }
  function yaVisto() { try { return localStorage.getItem(CLAVE) === "1"; } catch (e) { return false; } }

  function mostrarPaso() {
    var p = PASOS[paso];
    if (window.innerWidth < 1024) App.irA(p.vista);
    document.getElementById("recorrido-paso").textContent = "Paso " + (paso + 1) + " de " + PASOS.length;
    document.getElementById("recorrido-titulo").textContent = p.titulo;
    document.getElementById("recorrido-texto").textContent = p.texto;
    document.getElementById("recorrido-siguiente").textContent = paso === PASOS.length - 1 ? "Empezar" : "Siguiente";
    setTimeout(function () {
      var objetivo = document.querySelector(p.objetivo);
      var foco = document.getElementById("recorrido-foco");
      if (!objetivo) { foco.style.display = "none"; return; }
      objetivo.scrollIntoView({ block: "nearest" });
      var r = objetivo.getBoundingClientRect();
      var alto = Math.min(r.height, window.innerHeight * 0.55);
      foco.style.display = "block";
      foco.style.left = (r.left - 6) + "px";
      foco.style.top = (r.top - 6) + "px";
      foco.style.width = (r.width + 12) + "px";
      foco.style.height = (alto + 12) + "px";
      var caja = document.querySelector(".recorrido-caja");
      var abajo = r.top + alto / 2 > window.innerHeight / 2;
      caja.style.top = abajo ? "12px" : "auto";
      caja.style.bottom = abajo ? "auto" : "";
    }, 60);
    document.getElementById("recorrido-siguiente").focus();
  }

  function iniciar() {
    paso = 0;
    App.seleccionar(null);
    document.getElementById("recorrido").hidden = false;
    mostrarPaso();
  }

  function terminar() {
    document.getElementById("recorrido").hidden = true;
    marcarVisto();
    if (window.innerWidth < 1024) App.irA("resumen");
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("recorrido-siguiente").addEventListener("click", function () {
      if (paso < PASOS.length - 1) { paso++; mostrarPaso(); } else terminar();
    });
    document.getElementById("recorrido-saltar").addEventListener("click", terminar);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !document.getElementById("recorrido").hidden) terminar();
    });
    window.addEventListener("resize", function () { if (!document.getElementById("recorrido").hidden) mostrarPaso(); });
  });

  window.Recorrido = { iniciar: iniciar, yaVisto: yaVisto };
})();
