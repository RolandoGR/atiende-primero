/* Atiende Primero · "¿Cómo se calcula la prioridad?"
 * Explicación en lenguaje claro, generada con los criterios ACTUALES (pesos, tablas, umbrales y reglas),
 * para que siempre coincida con lo que la persona está viendo.
 */
(function () {
  "use strict";
  var U = window.Util;

  var CONDICIONES = { igual: "es igual a", mayorIgual: "es mayor o igual que", menorIgual: "es menor o igual que" };

  function tablaEscala(nombre, tabla) {
    return "<tr><td>" + U.esc(nombre) + "</td><td>" + tabla.map(function (t, i) {
      var siguiente = tabla[i + 1];
      var rango = siguiente ? (siguiente.desde - 1 > t.desde ? t.desde + " a " + (siguiente.desde - 1) : String(t.desde)) : t.desde + " o más";
      return U.esc(rango) + " → <strong>" + U.numero(t.valor, 2) + "</strong>";
    }).join(" · ") + "</td></tr>";
  }

  function contenido(estado) {
    var c = estado.criterios;
    var suma = c.orden.reduce(function (s, k) { return s + c.pesos[k].peso; }, 0);
    var html = '<p class="formula">Puntaje (0 a 100) = suma de (peso × valor de cada criterio), y las reglas duras pueden subir la prioridad, nunca bajarla.</p>';

    html += "<h3>1. Cada criterio se convierte a un valor de 0 a 1</h3><table><tbody>";
    ["severidad", "usuarios", "recurrencia"].forEach(function (k) {
      if (c.pesos[k]) html += tablaEscala(c.pesos[k].nombre, c.escalas[k]);
    });
    if (c.pesos.tiempo) html += "<tr><td>" + U.esc(c.pesos.tiempo.nombre) + "</td><td>Horas abiertas ÷ plazo, con tope en 1 (a la mitad del plazo vale 0.5; vencido vale 1)</td></tr>";
    if (c.pesos.riesgo) html += "<tr><td>" + U.esc(c.pesos.riesgo.nombre) + "</td><td>Sí → 1 · No → 0</td></tr>";
    html += "</tbody></table>";

    html += "<h3>2. Se multiplica por su peso y se suma</h3><table><thead><tr><th>Criterio</th><th class=\"num\">Peso</th><th class=\"num\">% del puntaje</th><th>Eje de la matriz</th></tr></thead><tbody>" +
      c.orden.map(function (k) {
        var p = c.pesos[k];
        return "<tr><td>" + U.esc(p.nombre) + '</td><td class="num">' + U.numero(p.peso) + '</td><td class="num">' + U.numero(suma ? p.peso * 100 / suma : 0) + " %</td><td>" + U.esc(p.eje) + "</td></tr>";
      }).join("") + "</tbody></table>";
    if (Math.abs(suma - 100) > 1e-9) html += '<p class="nota">Los pesos suman ' + U.numero(suma) + "; el puntaje se ajusta para quedar entre 0 y 100. Lo que importa es la proporción.</p>";

    html += "<h3>3. El puntaje da una prioridad</h3><table><tbody>" + c.umbrales.map(function (u) {
      return "<tr><td>" + U.chipPrioridad(u.prioridad) + "</td><td>" + (u.minimo > 0 ? "desde " + U.numero(u.minimo) + " puntos" : "menos de " + U.numero(c.umbrales[c.umbrales.length - 2].minimo) + " puntos") +
        (u.significado ? ' <span class="nota">· ' + U.esc(u.significado) + "</span>" : "") + "</td></tr>";
    }).join("") + "</tbody></table>";

    var activas = c.reglas.filter(function (r) { return r.activa; });
    html += "<h3>4. Reglas duras: la prioridad nunca queda por debajo de esto</h3>";
    html += activas.length ? "<table><tbody>" + activas.map(function (r) {
      return "<tr><td>" + U.esc(r.texto) + '<br><span class="nota">Si «' + U.esc(r.campo) + "» " + CONDICIONES[r.condicion] + " " + U.esc(r.valor) + "</span></td><td>" + U.chipPrioridad(r.prioridadMinima) + "</td></tr>";
    }).join("") + "</tbody></table>" : '<p class="nota">No hay reglas activas.</p>';
    html += '<p class="nota">Una regla no cambia el puntaje: lo deja como está y explica por qué subió la prioridad.</p>';

    html += "<h3>5. Impacto y urgencia (la matriz)</h3><p>Impacto es el promedio ponderado de los criterios del eje «Impacto»; urgencia, el de los del eje «Urgencia». " +
      "Cada eje se divide en bajo (menos de 0.33), medio y alto (0.67 o más).</p>";
    html += '<p class="nota">Ejemplo: un cable caído con 3 usuarios suma 21 puntos (baja por puntaje), pero la regla de cable caído lo vuelve crítico. ' +
      "Toca cualquier reporte para ver su cálculo completo.</p>";
    return html;
  }

  function abrir() {
    document.getElementById("ayuda-cuerpo").innerHTML = contenido(App.estado);
    U.abrirDialogo(document.getElementById("dlg-ayuda"));
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("btn-ayuda").addEventListener("click", abrir);
    document.getElementById("btn-recorrido").addEventListener("click", function () {
      U.cerrarDialogo(document.getElementById("dlg-ayuda"));
      Recorrido.iniciar();
    });
    // Botones "✕" de los diálogos y clic fuera del contenido
    Array.prototype.forEach.call(document.querySelectorAll("dialog"), function (d) {
      d.addEventListener("click", function (e) {
        if (e.target.closest("[data-cerrar]") || e.target === d) U.cerrarDialogo(d);
      });
    });
  });

  window.Ayuda = { abrir: abrir };
})();
