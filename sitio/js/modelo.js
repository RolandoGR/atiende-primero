/*
 * Atiende Primero · modelo de priorización
 *
 * Calcula el puntaje (0 a 100), la prioridad y su explicación para cada reporte.
 * Es JavaScript puro: no toca la página, así que se puede probar en Node (`node --test pruebas/`).
 *
 * La fórmula, en corto (detalle y ejemplos en docs/modelo.md):
 *   1. Cada criterio se convierte a un valor de 0 a 1.
 *   2. Puntaje = suma de (peso × valor) × 100 ÷ suma de pesos. Lo que aporta cada criterio se guarda aparte.
 *   3. La prioridad por puntaje sale de los umbrales (p. ej. crítica desde 70).
 *   4. Las reglas duras fijan una prioridad mínima: la prioridad final es la más alta entre la del puntaje
 *      y la de las reglas que se cumplen. Una regla nunca baja la prioridad ni cambia el puntaje.
 *   5. Impacto y urgencia (ejes de la matriz) son promedios ponderados de los criterios de cada eje.
 */
(function (raiz) {
  "use strict";

  // De menor a mayor. La posición en la lista sirve para comparar prioridades.
  var PRIORIDADES = ["Baja", "Media", "Alta", "Crítica"];

  // Niveles de cada eje de la matriz 3 × 3 y sus cortes: Bajo < 0.33 ≤ Medio < 0.67 ≤ Alto.
  var NIVELES = ["Bajo", "Medio", "Alto"];
  var CORTES_NIVEL = [0.33, 0.67];

  // Criterios que sabe calcular el modelo. "nombres" son las formas en que se reconocen en la hoja Pesos.
  var CRITERIOS = [
    { clave: "severidad", nombre: "Severidad", nombres: ["severidad"], eje: "Impacto", usaEscala: true },
    { clave: "usuarios", nombre: "Usuarios afectados", nombres: ["usuarios afectados", "usuarios"], eje: "Impacto", usaEscala: true },
    { clave: "tiempo", nombre: "Tiempo respecto al plazo", nombres: ["tiempo respecto al plazo", "tiempo", "tiempo respecto al plazo de atencion"], eje: "Urgencia", usaEscala: false },
    { clave: "recurrencia", nombre: "Recurrencia", nombres: ["recurrencia", "reportes previos"], eje: "Urgencia", usaEscala: true },
    { clave: "riesgo", nombre: "Riesgo a la seguridad", nombres: ["riesgo a la seguridad", "riesgo"], eje: "Ninguno", usaEscala: false }
  ];

  // Tablas de conversión predeterminadas (las mismas de criterios.xlsx, hoja Escalas).
  // Cada tramo vale desde "desde" hasta el inicio del siguiente tramo.
  var ESCALAS_PREDETERMINADAS = {
    severidad: [{ desde: 1, valor: 0 }, { desde: 2, valor: 0.33 }, { desde: 3, valor: 0.67 }, { desde: 4, valor: 1 }],
    usuarios: [{ desde: 0, valor: 0 }, { desde: 1, valor: 0.25 }, { desde: 11, valor: 0.5 }, { desde: 101, valor: 0.75 }, { desde: 501, valor: 1 }],
    recurrencia: [{ desde: 0, valor: 0 }, { desde: 1, valor: 0.2 }, { desde: 2, valor: 0.4 }, { desde: 3, valor: 0.6 }, { desde: 4, valor: 0.8 }, { desde: 5, valor: 1 }]
  };

  var EPSILON = 1e-9;

  function rango(prioridad) {
    return PRIORIDADES.indexOf(prioridad);
  }

  function mayorPrioridad(a, b) {
    return rango(a) >= rango(b) ? a : b;
  }

  // Minúsculas, sin acentos y sin espacios de más. Sirve para comparar textos escritos de distintas formas.
  function normalizarTexto(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/\s+/g, " ").trim();
  }

  // Como normalizarTexto, pero además quita signos y espacios: "Plazo de atención (horas)" → "plazodeatencionhoras".
  function claveTexto(texto) {
    return normalizarTexto(texto).replace(/[^a-z0-9]+/g, "");
  }

  function buscarCriterio(nombre) {
    var clave = claveTexto(nombre);
    for (var i = 0; i < CRITERIOS.length; i++) {
      for (var j = 0; j < CRITERIOS[i].nombres.length; j++) {
        if (claveTexto(CRITERIOS[i].nombres[j]) === clave) return CRITERIOS[i];
      }
    }
    return null;
  }

  // Busca en la tabla el último tramo cuyo "desde" sea menor o igual al dato.
  function aplicarEscala(dato, tabla) {
    var valor = 0;
    for (var i = 0; i < tabla.length; i++) {
      if (dato >= tabla[i].desde - EPSILON) valor = tabla[i].valor;
    }
    return valor;
  }

  function formatoNumero(n, decimales) {
    return Number(n).toLocaleString("es-MX", { maximumFractionDigits: decimales || 0 });
  }

  // Convierte un criterio del reporte a un valor de 0 a 1 y describe el dato original en palabras.
  function valorCriterio(clave, reporte, criterios) {
    var escala = (criterios.escalas && criterios.escalas[clave]) || ESCALAS_PREDETERMINADAS[clave];
    switch (clave) {
      case "severidad":
        return { valor: aplicarEscala(reporte.severidad, escala), dato: "Severidad " + reporte.severidad + " de 4" };
      case "usuarios":
        return { valor: aplicarEscala(reporte.usuarios, escala), dato: formatoNumero(reporte.usuarios) + (reporte.usuarios === 1 ? " usuario" : " usuarios") };
      case "tiempo":
        var proporcion = reporte.plazo > 0 ? reporte.horasAbiertas / reporte.plazo : 1;
        return {
          valor: Math.min(proporcion, 1),
          dato: formatoNumero(reporte.horasAbiertas, 1) + " h de " + formatoNumero(reporte.plazo, 1) + " h de plazo (" +
            formatoNumero(proporcion * 100) + " %" + (proporcion > 1 ? ", vencido" : "") + ")"
        };
      case "recurrencia":
        return { valor: aplicarEscala(reporte.previos, escala), dato: reporte.previos + (reporte.previos === 1 ? " reporte previo" : " reportes previos") + " en 30 días" };
      case "riesgo":
        return { valor: reporte.riesgo ? 1 : 0, dato: reporte.riesgo ? "Sí hay riesgo" : "Sin riesgo" };
      default:
        throw new Error("Criterio desconocido: " + clave);
    }
  }

  function aNumero(valor) {
    if (typeof valor === "number") return valor;
    if (typeof valor === "string" && valor.trim() !== "" && !isNaN(Number(valor.replace(/,/g, "")))) return Number(valor.replace(/,/g, ""));
    return null;
  }

  // ¿El reporte cumple la condición de la regla? Compara contra la columna del reporte que nombra la regla.
  function cumpleRegla(regla, reporte) {
    var datoReporte = reporte.campos ? reporte.campos[regla.campoClave] : undefined;
    if (datoReporte === undefined || datoReporte === null || datoReporte === "") return false;
    var numReporte = aNumero(datoReporte);
    var numRegla = aNumero(regla.valor);
    if (regla.condicion === "igual") {
      if (numReporte !== null && numRegla !== null) return Math.abs(numReporte - numRegla) < EPSILON;
      return normalizarTexto(datoReporte) === normalizarTexto(regla.valor);
    }
    if (numReporte === null || numRegla === null) return false;
    if (regla.condicion === "mayorIgual") return numReporte >= numRegla - EPSILON;
    if (regla.condicion === "menorIgual") return numReporte <= numRegla + EPSILON;
    return false;
  }

  function prioridadPorPuntaje(puntaje, umbrales) {
    // umbrales: [{prioridad, minimo}], se revisan de la prioridad más alta a la más baja
    var ordenados = umbrales.slice().sort(function (a, b) { return rango(b.prioridad) - rango(a.prioridad); });
    for (var i = 0; i < ordenados.length; i++) {
      if (puntaje >= ordenados[i].minimo - EPSILON) return ordenados[i].prioridad;
    }
    return PRIORIDADES[0];
  }

  function nivel(valor) {
    if (valor < CORTES_NIVEL[0] - EPSILON) return 0;
    if (valor < CORTES_NIVEL[1] - EPSILON) return 1;
    return 2;
  }

  // Evalúa un reporte: valores 0–1, aportes, puntaje, prioridad, reglas aplicadas y posición en la matriz.
  function evaluar(reporte, criterios) {
    var orden = criterios.orden || Object.keys(criterios.pesos);
    var sumaPesos = 0;
    orden.forEach(function (clave) { sumaPesos += criterios.pesos[clave].peso; });

    var aportes = [];
    var puntaje = 0;
    var ejes = { Impacto: { suma: 0, pesos: 0 }, Urgencia: { suma: 0, pesos: 0 } };
    orden.forEach(function (clave) {
      var definicion = criterios.pesos[clave];
      var calculo = valorCriterio(clave, reporte, criterios);
      var aporte = sumaPesos > 0 ? definicion.peso * calculo.valor * 100 / sumaPesos : 0;
      puntaje += aporte;
      aportes.push({
        clave: clave, nombre: definicion.nombre, dato: calculo.dato, valor: calculo.valor,
        peso: definicion.peso, aporte: aporte, eje: definicion.eje
      });
      if (ejes[definicion.eje]) {
        ejes[definicion.eje].suma += definicion.peso * calculo.valor;
        ejes[definicion.eje].pesos += definicion.peso;
      }
    });

    var prioridadPuntaje = prioridadPorPuntaje(puntaje, criterios.umbrales);
    var prioridad = prioridadPuntaje;
    var reglasAplicadas = [];
    (criterios.reglas || []).forEach(function (regla) {
      if (!regla.activa || !cumpleRegla(regla, reporte)) return;
      reglasAplicadas.push({
        texto: regla.texto, prioridadMinima: regla.prioridadMinima,
        subioPrioridad: rango(regla.prioridadMinima) > rango(prioridadPuntaje)
      });
      prioridad = mayorPrioridad(prioridad, regla.prioridadMinima);
    });

    var impacto = ejes.Impacto.pesos > 0 ? ejes.Impacto.suma / ejes.Impacto.pesos : 0;
    var urgencia = ejes.Urgencia.pesos > 0 ? ejes.Urgencia.suma / ejes.Urgencia.pesos : 0;
    var proporcionPlazo = reporte.plazo > 0 ? reporte.horasAbiertas / reporte.plazo : Infinity;

    return {
      reporte: reporte,
      aportes: aportes,
      puntaje: puntaje,
      prioridadPuntaje: prioridadPuntaje,
      reglasAplicadas: reglasAplicadas,
      prioridad: prioridad,
      elevadoPorRegla: prioridad !== prioridadPuntaje,
      impacto: impacto,
      urgencia: urgencia,
      celda: { impacto: nivel(impacto), urgencia: nivel(urgencia) },
      proporcionPlazo: proporcionPlazo,
      vencido: reporte.horasAbiertas > reporte.plazo,
      pendiente: reporte.estado !== "Cerrado"
    };
  }

  // Orden de la lista de atención: prioridad final, puntaje, parte del plazo consumida y folio.
  function comparar(a, b) {
    return (rango(b.prioridad) - rango(a.prioridad)) ||
      (b.puntaje - a.puntaje > EPSILON ? 1 : a.puntaje - b.puntaje > EPSILON ? -1 : 0) ||
      (b.proporcionPlazo - a.proporcionPlazo) ||
      String(a.reporte.folio).localeCompare(String(b.reporte.folio), "es");
  }

  function priorizar(reportes, criterios) {
    var evaluados = reportes.map(function (r) { return evaluar(r, criterios); });
    evaluados.sort(comparar);
    evaluados.forEach(function (e, i) { e.posicion = i + 1; });
    return evaluados;
  }

  function contarPorPrioridad() {
    var conteo = {};
    PRIORIDADES.forEach(function (p) { conteo[p] = 0; });
    return conteo;
  }

  // Indicadores del tablero. Solo cuentan los reportes pendientes (abiertos y en proceso).
  function resumen(evaluados) {
    var pendientes = evaluados.filter(function (e) { return e.pendiente; });
    var porPrioridad = contarPorPrioridad();
    var matriz = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]; // matriz[impacto][urgencia]
    var porMunicipio = {};
    var usuarios = 0, horas = 0, vencidos = 0;
    pendientes.forEach(function (e) {
      porPrioridad[e.prioridad]++;
      matriz[e.celda.impacto][e.celda.urgencia]++;
      usuarios += e.reporte.usuarios;
      horas += e.reporte.horasAbiertas;
      if (e.vencido) vencidos++;
      var m = porMunicipio[e.reporte.municipio] || (porMunicipio[e.reporte.municipio] = { total: 0, porPrioridad: contarPorPrioridad(), puntajeTotal: 0, prioridadMaxima: PRIORIDADES[0] });
      m.total++;
      m.porPrioridad[e.prioridad]++;
      m.puntajeTotal += e.puntaje;
      m.prioridadMaxima = mayorPrioridad(m.prioridadMaxima, e.prioridad);
    });
    return {
      total: evaluados.length,
      pendientes: pendientes.length,
      cerrados: evaluados.length - pendientes.length,
      porPrioridad: porPrioridad,
      vencidos: vencidos,
      usuariosAfectados: usuarios,
      horasPromedio: pendientes.length ? horas / pendientes.length : 0,
      matriz: matriz,
      porMunicipio: porMunicipio
    };
  }

  // Copia de los criterios con otros pesos ({severidad: 40, ...}). La usa el ajuste en vivo.
  function conPesos(criterios, pesos) {
    var copia = JSON.parse(JSON.stringify(criterios));
    Object.keys(pesos).forEach(function (clave) {
      if (copia.pesos[clave]) copia.pesos[clave].peso = Number(pesos[clave]);
    });
    return copia;
  }

  var Modelo = {
    PRIORIDADES: PRIORIDADES,
    NIVELES: NIVELES,
    CORTES_NIVEL: CORTES_NIVEL,
    CRITERIOS: CRITERIOS,
    ESCALAS_PREDETERMINADAS: ESCALAS_PREDETERMINADAS,
    normalizarTexto: normalizarTexto,
    claveTexto: claveTexto,
    buscarCriterio: buscarCriterio,
    aplicarEscala: aplicarEscala,
    rango: rango,
    cumpleRegla: cumpleRegla,
    evaluar: evaluar,
    priorizar: priorizar,
    resumen: resumen,
    conPesos: conPesos
  };

  if (typeof module === "object" && module.exports) module.exports = Modelo;
  else raiz.Modelo = Modelo;
})(this);
