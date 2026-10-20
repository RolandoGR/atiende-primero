/*
 * Atiende Primero · lectura y validación de los Excel
 *
 * Convierte las hojas de reportes.xlsx y criterios.xlsx en datos listos para el modelo y explica en lenguaje
 * claro cualquier problema ("Fila 12 (REP-0011): la severidad debe ser 1, 2, 3 o 4; dice 7").
 *
 * Recibe las hojas como filas: { "Reportes": [[encabezados], [fila], ...], "Acerca de": [...] }.
 * Es el mismo formato de sitio/datos/ejemplo.js y de SheetJS (sheet_to_json con header: 1), así que el ejemplo
 * y los archivos que sube una persona pasan por el mismo camino.
 *
 * Los encabezados se reconocen sin importar mayúsculas, acentos, espacios ni signos.
 * Es JavaScript puro (sin página), para poder probarlo en Node.
 */
(function (raiz) {
  "use strict";

  var Modelo = (typeof module === "object" && module.exports) ? require("./modelo.js") : raiz.Modelo;
  var claveTexto = Modelo.claveTexto;
  var normalizarTexto = Modelo.normalizarTexto;

  var MAX_ERRORES = 30; // para no inundar la pantalla si el archivo está muy mal

  // Columnas de la hoja Reportes. "nombres" son las formas aceptadas del encabezado.
  var COLUMNAS_REPORTES = [
    { campo: "folio", nombre: "Folio", tipo: "texto", obligatoria: true },
    { campo: "fechaAlta", nombre: "Fecha y hora de alta", nombres: ["fecha y hora de alta", "fecha de alta", "fecha"], tipo: "fecha" },
    { campo: "municipio", nombre: "Municipio", tipo: "texto", obligatoria: true },
    { campo: "localidad", nombre: "Localidad", tipo: "texto" },
    { campo: "latitud", nombre: "Latitud", tipo: "numero" },
    { campo: "longitud", nombre: "Longitud", tipo: "numero" },
    { campo: "tipo", nombre: "Tipo de falla", nombres: ["tipo de falla", "tipo"], tipo: "texto", obligatoria: true },
    { campo: "severidad", nombre: "Severidad", tipo: "severidad", obligatoria: true },
    { campo: "usuarios", nombre: "Usuarios afectados", tipo: "entero", obligatoria: true },
    { campo: "horasAbiertas", nombre: "Horas abiertas", tipo: "numero" },
    { campo: "plazo", nombre: "Plazo de atención (horas)", nombres: ["plazo de atencion (horas)", "plazo de atencion", "plazo"], tipo: "plazo", obligatoria: true },
    { campo: "estado", nombre: "Estado", tipo: "estado", obligatoria: true },
    { campo: "riesgo", nombre: "Riesgo a la seguridad", nombres: ["riesgo a la seguridad", "riesgo"], tipo: "siNo", obligatoria: true },
    { campo: "previos", nombre: "Reportes previos (30 días)", nombres: ["reportes previos (30 dias)", "reportes previos"], tipo: "entero", obligatoria: true },
    { campo: "cuadrilla", nombre: "Cuadrilla", tipo: "texto" }
  ];

  var ESTADOS = { "abierto": "Abierto", "en proceso": "En proceso", "cerrado": "Cerrado" };
  var CONDICIONES = {
    "es igual a": "igual", "igual a": "igual", "=": "igual",
    "mayor o igual que": "mayorIgual", "mayor o igual a": "mayorIgual", ">=": "mayorIgual",
    "menor o igual que": "menorIgual", "menor o igual a": "menorIgual", "<=": "menorIgual"
  };

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------
  function vacio(v) {
    return v === null || v === undefined || (typeof v === "string" && v.trim() === "");
  }

  function buscarHoja(hojas, nombre) {
    var buscada = claveTexto(nombre);
    var nombres = Object.keys(hojas || {});
    for (var i = 0; i < nombres.length; i++) {
      if (claveTexto(nombres[i]) === buscada) return hojas[nombres[i]];
    }
    return null;
  }

  // Ubica cada columna buscada en los encabezados de la hoja. Devuelve {campo: índice}.
  function ubicarColumnas(encabezados, columnas) {
    var claves = encabezados.map(claveTexto);
    var posiciones = {};
    columnas.forEach(function (col) {
      var opciones = (col.nombres || [col.nombre]).map(claveTexto);
      for (var i = 0; i < claves.length; i++) {
        if (opciones.indexOf(claves[i]) !== -1) { posiciones[col.campo] = i; break; }
      }
    });
    return posiciones;
  }

  function filaVacia(fila) {
    return !fila || fila.every(vacio);
  }

  // Acepta números o texto como "1,800" o "12.5".
  function leerNumero(v) {
    if (typeof v === "number") return isFinite(v) ? v : null;
    if (typeof v !== "string") return null;
    var limpio = v.trim().replace(/,/g, "");
    if (limpio === "" || isNaN(Number(limpio))) return null;
    return Number(limpio);
  }

  // Acepta fechas de Excel (objeto Date o número de serie) y texto "2026-10-19 08:00" o "19/10/2026 08:00".
  function leerFecha(v) {
    // SheetJS a veces entrega fechas con 1 ms de desfase por redondeo; se redondea al segundo.
    if (v instanceof Date) return isNaN(v.getTime()) ? null : new Date(Math.round(v.getTime() / 1000) * 1000);
    if (typeof v === "number" && isFinite(v)) {
      var utc = new Date(Math.round((v - 25569) * 86400000));
      return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate(), utc.getUTCHours(), utc.getUTCMinutes(), utc.getUTCSeconds());
    }
    if (typeof v !== "string") return null;
    var t = v.trim(), m;
    if ((m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/))) {
      return fechaValida(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    if ((m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/))) {
      return fechaValida(+m[3], +m[2], +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    }
    return null;
  }

  function fechaValida(anio, mes, dia, hora, minuto, segundo) {
    var f = new Date(anio, mes - 1, dia, hora, minuto, segundo);
    return f.getFullYear() === anio && f.getMonth() === mes - 1 && f.getDate() === dia ? f : null;
  }

  function leerSiNo(v) {
    if (v === true || v === 1) return true;
    if (v === false || v === 0) return false;
    var t = normalizarTexto(v);
    if (t === "si" || t === "s" || t === "verdadero" || t === "1") return true;
    if (t === "no" || t === "n" || t === "falso" || t === "0") return false;
    return null;
  }

  function texto(v) {
    return vacio(v) ? "" : String(v).trim();
  }

  function mostrar(v) {
    return vacio(v) ? "(vacío)" : "«" + String(v).trim() + "»";
  }

  function Registro() {
    this.errores = [];
    this.avisos = [];
    this.omitidos = 0;
  }
  Registro.prototype.error = function (mensaje) {
    if (this.errores.length < MAX_ERRORES) this.errores.push(mensaje);
    else this.omitidos++;
  };
  Registro.prototype.aviso = function (mensaje) { this.avisos.push(mensaje); };
  Registro.prototype.cerrar = function () {
    if (this.omitidos > 0) this.errores.push("… y " + this.omitidos + " problemas más.");
  };

  // ---------------------------------------------------------------------------
  // reportes.xlsx
  // ---------------------------------------------------------------------------
  function leerFechaCorte(hojas, registro) {
    var hoja = buscarHoja(hojas, "Acerca de");
    if (!hoja) return null;
    for (var i = 0; i < hoja.length; i++) {
      var fila = hoja[i] || [];
      if (claveTexto(fila[0]) === claveTexto("Fecha de corte")) {
        var fecha = leerFecha(fila[1]);
        if (!fecha) registro.error("Hoja «Acerca de»: la fecha de corte " + mostrar(fila[1]) + " no es una fecha válida. Usa el formato 2026-10-19 08:00.");
        return fecha;
      }
    }
    return null;
  }

  function leerReportes(hojas) {
    var registro = new Registro();
    var hoja = buscarHoja(hojas, "Reportes");
    if (!hoja) {
      var disponibles = Object.keys(hojas || {});
      registro.error("No se encontró la hoja «Reportes»" + (disponibles.length ? ". Hojas del archivo: " + disponibles.join(", ") + "." : "."));
      return { reportes: [], fechaCorte: null, columnas: [], errores: registro.errores, avisos: registro.avisos };
    }

    // Los encabezados son la primera fila con contenido
    var inicio = 0;
    while (inicio < hoja.length && filaVacia(hoja[inicio])) inicio++;
    var encabezados = (hoja[inicio] || []).map(texto);
    var pos = ubicarColumnas(encabezados, COLUMNAS_REPORTES);

    var faltantes = COLUMNAS_REPORTES.filter(function (c) { return c.obligatoria && pos[c.campo] === undefined; });
    if (faltantes.length) {
      registro.error("Faltan columnas en la hoja «Reportes»: " + faltantes.map(function (c) { return "«" + c.nombre + "»"; }).join(", ") +
        ". Revisa que los encabezados estén en la primera fila; puedes descargar el Excel de ejemplo para compararlos.");
      return { reportes: [], fechaCorte: null, columnas: encabezados, errores: registro.errores, avisos: registro.avisos };
    }

    var fechaCorte = leerFechaCorte(hojas, registro);
    var reportes = [];
    var folios = {};
    var calculadas = 0, sinCoordenadas = 0, duplicados = [];
    var clavesEncabezado = encabezados.map(claveTexto);

    for (var i = inicio + 1; i < hoja.length; i++) {
      var fila = hoja[i] || [];
      if (filaVacia(fila)) continue;
      var numFila = i + 1; // como la ve la persona en Excel
      var folio = texto(fila[pos.folio]);
      var etiqueta = "Fila " + numFila + (folio ? " (" + folio + ")" : "");
      var problemas = [];
      var r = { fila: numFila, folio: folio, campos: {} };

      COLUMNAS_REPORTES.forEach(function (col) {
        var indice = pos[col.campo];
        var v = indice === undefined ? undefined : fila[indice];
        if (vacio(v)) {
          r[col.campo] = null;
          if (col.obligatoria) problemas.push("falta «" + col.nombre + "»");
          return;
        }
        switch (col.tipo) {
          case "texto":
            r[col.campo] = texto(v);
            break;
          case "numero":
            r[col.campo] = leerNumero(v);
            if (r[col.campo] === null) problemas.push("«" + col.nombre + "» debe ser un número; dice " + mostrar(v));
            else if (col.campo === "horasAbiertas" && r[col.campo] < 0) problemas.push("«Horas abiertas» no puede ser negativa");
            break;
          case "entero":
            r[col.campo] = leerNumero(v);
            if (r[col.campo] === null || r[col.campo] < 0 || Math.floor(r[col.campo]) !== r[col.campo]) problemas.push("«" + col.nombre + "» debe ser un número entero de 0 o más; dice " + mostrar(v));
            break;
          case "plazo":
            r[col.campo] = leerNumero(v);
            if (r[col.campo] === null || r[col.campo] <= 0) problemas.push("«" + col.nombre + "» debe ser un número de horas mayor que 0; dice " + mostrar(v));
            break;
          case "severidad":
            r[col.campo] = leerNumero(v);
            if ([1, 2, 3, 4].indexOf(r[col.campo]) === -1) problemas.push("la severidad debe ser 1, 2, 3 o 4; dice " + mostrar(v));
            break;
          case "estado":
            r[col.campo] = ESTADOS[normalizarTexto(v)] || null;
            if (!r[col.campo]) problemas.push("el estado debe ser Abierto, En proceso o Cerrado; dice " + mostrar(v));
            break;
          case "siNo":
            r[col.campo] = leerSiNo(v);
            if (r[col.campo] === null) problemas.push("«" + col.nombre + "» debe ser Sí o No; dice " + mostrar(v));
            break;
          case "fecha":
            r[col.campo] = leerFecha(v);
            if (!r[col.campo]) problemas.push("«" + col.nombre + "» no es una fecha válida; dice " + mostrar(v) + " (usa 2026-10-19 08:00)");
            break;
        }
      });

      // Horas abiertas vacías: se calculan con la fecha de alta y la fecha de corte
      if (r.horasAbiertas === null && problemas.length === 0) {
        if (r.fechaAlta && fechaCorte) {
          r.horasAbiertas = Math.max(0, Math.round((fechaCorte - r.fechaAlta) / 360000) / 10);
          calculadas++;
        } else {
          problemas.push("faltan las «Horas abiertas» (o la fecha de alta y la fecha de corte para calcularlas)");
        }
      }

      if (problemas.length) {
        registro.error(etiqueta + ": " + problemas.join("; ") + ".");
        continue;
      }

      if (r.latitud === null || r.longitud === null || Math.abs(r.latitud) > 90 || Math.abs(r.longitud) > 180) {
        r.latitud = null; r.longitud = null; sinCoordenadas++;
      }
      if (folios[folio]) duplicados.push(folio);
      folios[folio] = true;

      // Todas las columnas de la fila quedan disponibles para las reglas, con su encabezado normalizado.
      // Las conocidas con su valor ya interpretado; las demás (columnas agregadas por la persona) tal cual.
      clavesEncabezado.forEach(function (clave, j) { if (clave) r.campos[clave] = fila[j]; });
      COLUMNAS_REPORTES.forEach(function (col) {
        if (pos[col.campo] === undefined) return;
        var valor = r[col.campo];
        if (col.tipo === "siNo") valor = valor ? "Sí" : "No";
        r.campos[clavesEncabezado[pos[col.campo]]] = valor;
      });
      r.estado = r.estado || "Abierto";
      r.pendiente = r.estado !== "Cerrado";
      reportes.push(r);
    }

    if (calculadas) registro.aviso("Se calcularon las horas abiertas de " + calculadas + " reportes con la fecha de corte.");
    if (sinCoordenadas) registro.aviso(sinCoordenadas + " reportes no tienen latitud y longitud válidas; no aparecerán como punto en el mapa.");
    if (duplicados.length) registro.aviso("Hay folios repetidos: " + duplicados.slice(0, 5).join(", ") + (duplicados.length > 5 ? "…" : "") + ".");
    if (!reportes.length && !registro.errores.length) registro.error("La hoja «Reportes» no tiene reportes.");
    registro.cerrar();

    return { reportes: reportes, fechaCorte: fechaCorte, columnas: encabezados, errores: registro.errores, avisos: registro.avisos };
  }

  // ---------------------------------------------------------------------------
  // criterios.xlsx
  // ---------------------------------------------------------------------------
  // Lee una hoja como lista de objetos {campo: valor}, con el número de fila de Excel.
  function filasDeTabla(hoja, columnas, nombreHoja, registro) {
    var inicio = 0;
    while (inicio < hoja.length && filaVacia(hoja[inicio])) inicio++;
    var pos = ubicarColumnas((hoja[inicio] || []).map(texto), columnas);
    var faltantes = columnas.filter(function (c) { return c.obligatoria && pos[c.campo] === undefined; });
    if (faltantes.length) {
      registro.error("Faltan columnas en la hoja «" + nombreHoja + "»: " + faltantes.map(function (c) { return "«" + c.nombre + "»"; }).join(", ") + ".");
      return null;
    }
    var filas = [];
    for (var i = inicio + 1; i < hoja.length; i++) {
      if (filaVacia(hoja[i])) continue;
      var obj = { fila: i + 1 };
      columnas.forEach(function (c) { obj[c.campo] = pos[c.campo] === undefined ? undefined : hoja[i][pos[c.campo]]; });
      filas.push(obj);
    }
    return filas;
  }

  function leerPesos(hojas, registro) {
    var hoja = buscarHoja(hojas, "Pesos");
    if (!hoja) { registro.error("No se encontró la hoja «Pesos»."); return null; }
    var filas = filasDeTabla(hoja, [
      { campo: "criterio", nombre: "Criterio", obligatoria: true },
      { campo: "descripcion", nombre: "Descripción" },
      { campo: "peso", nombre: "Peso", obligatoria: true },
      { campo: "eje", nombre: "Eje de la matriz", nombres: ["eje de la matriz", "eje"] }
    ], "Pesos", registro);
    if (!filas) return null;

    var pesos = {}, orden = [];
    filas.forEach(function (f) {
      var criterio = Modelo.buscarCriterio(f.criterio);
      var etiqueta = "Hoja «Pesos», fila " + f.fila;
      if (!criterio) {
        registro.error(etiqueta + ": no se reconoce el criterio " + mostrar(f.criterio) + ". Los criterios disponibles son: " +
          Modelo.CRITERIOS.map(function (c) { return c.nombre; }).join(", ") + ".");
        return;
      }
      if (pesos[criterio.clave]) { registro.error(etiqueta + ": el criterio «" + criterio.nombre + "» está repetido."); return; }
      var peso = leerNumero(f.peso);
      if (peso === null || peso < 0) { registro.error(etiqueta + ": el peso de «" + criterio.nombre + "» debe ser un número de 0 o más; dice " + mostrar(f.peso) + "."); return; }
      var eje = criterio.eje;
      if (!vacio(f.eje)) {
        var ejeLeido = { impacto: "Impacto", urgencia: "Urgencia", ninguno: "Ninguno" }[normalizarTexto(f.eje)];
        if (ejeLeido) eje = ejeLeido;
        else registro.error(etiqueta + ": el eje debe ser Impacto, Urgencia o Ninguno; dice " + mostrar(f.eje) + ".");
      }
      pesos[criterio.clave] = { nombre: criterio.nombre, descripcion: texto(f.descripcion), peso: peso, eje: eje };
      orden.push(criterio.clave);
    });

    Modelo.CRITERIOS.forEach(function (c) {
      if (!pesos[c.clave]) registro.aviso("La hoja «Pesos» no incluye «" + c.nombre + "»; no contará en el puntaje.");
    });
    var suma = orden.reduce(function (s, k) { return s + pesos[k].peso; }, 0);
    if (orden.length && suma === 0) registro.error("Todos los pesos valen 0: al menos un criterio debe tener peso mayor que 0.");
    else if (orden.length && Math.abs(suma - 100) > 1e-9) registro.aviso("Los pesos suman " + suma + ", no 100. El puntaje se ajusta para quedar entre 0 y 100.");
    return { pesos: pesos, orden: orden };
  }

  function leerEscalas(hojas, registro) {
    var escalas = JSON.parse(JSON.stringify(Modelo.ESCALAS_PREDETERMINADAS));
    var hoja = buscarHoja(hojas, "Escalas");
    if (!hoja) {
      registro.aviso("No se encontró la hoja «Escalas»; se usan las tablas de conversión predeterminadas.");
      return escalas;
    }
    var filas = filasDeTabla(hoja, [
      { campo: "criterio", nombre: "Criterio", obligatoria: true },
      { campo: "desde", nombre: "A partir de", nombres: ["a partir de", "desde"], obligatoria: true },
      { campo: "valor", nombre: "Valor", obligatoria: true }
    ], "Escalas", registro);
    if (!filas) return escalas;

    var leidas = {};
    filas.forEach(function (f) {
      var etiqueta = "Hoja «Escalas», fila " + f.fila;
      var criterio = Modelo.buscarCriterio(f.criterio);
      if (!criterio || !criterio.usaEscala) {
        registro.error(etiqueta + ": " + mostrar(f.criterio) + " no usa tabla de conversión. Solo Severidad, Usuarios afectados y Recurrencia.");
        return;
      }
      var desde = leerNumero(f.desde), valor = leerNumero(f.valor);
      if (desde === null) { registro.error(etiqueta + ": «A partir de» debe ser un número; dice " + mostrar(f.desde) + "."); return; }
      if (valor === null || valor < 0 || valor > 1) { registro.error(etiqueta + ": el valor debe estar entre 0 y 1; dice " + mostrar(f.valor) + "."); return; }
      var lista = leidas[criterio.clave] || (leidas[criterio.clave] = []);
      if (lista.some(function (t) { return t.desde === desde; })) { registro.error(etiqueta + ": el tramo que empieza en " + desde + " está repetido para «" + criterio.nombre + "»."); return; }
      lista.push({ desde: desde, valor: valor });
    });
    Object.keys(leidas).forEach(function (clave) {
      escalas[clave] = leidas[clave].sort(function (a, b) { return a.desde - b.desde; });
    });
    Modelo.CRITERIOS.forEach(function (c) {
      if (c.usaEscala && !leidas[c.clave]) registro.aviso("La hoja «Escalas» no trae tramos para «" + c.nombre + "»; se usa la tabla predeterminada.");
    });
    return escalas;
  }

  function leerPrioridad(v) {
    var buscada = normalizarTexto(v);
    for (var i = 0; i < Modelo.PRIORIDADES.length; i++) {
      if (normalizarTexto(Modelo.PRIORIDADES[i]) === buscada) return Modelo.PRIORIDADES[i];
    }
    return null;
  }

  function leerUmbrales(hojas, registro) {
    var hoja = buscarHoja(hojas, "Umbrales");
    if (!hoja) { registro.error("No se encontró la hoja «Umbrales»."); return null; }
    var filas = filasDeTabla(hoja, [
      { campo: "prioridad", nombre: "Prioridad", obligatoria: true },
      { campo: "minimo", nombre: "Puntaje mínimo", nombres: ["puntaje minimo", "minimo"], obligatoria: true },
      { campo: "significado", nombre: "Qué significa", nombres: ["que significa", "significado", "descripcion"] }
    ], "Umbrales", registro);
    if (!filas) return null;

    var umbrales = {};
    filas.forEach(function (f) {
      var etiqueta = "Hoja «Umbrales», fila " + f.fila;
      var prioridad = leerPrioridad(f.prioridad);
      var minimo = leerNumero(f.minimo);
      if (!prioridad) { registro.error(etiqueta + ": la prioridad debe ser Crítica, Alta, Media o Baja; dice " + mostrar(f.prioridad) + "."); return; }
      if (minimo === null || minimo < 0 || minimo > 100) { registro.error(etiqueta + ": el puntaje mínimo debe estar entre 0 y 100; dice " + mostrar(f.minimo) + "."); return; }
      umbrales[prioridad] = { prioridad: prioridad, minimo: minimo, significado: texto(f.significado) };
    });
    if (!umbrales.Baja) umbrales.Baja = { prioridad: "Baja", minimo: 0, significado: "" };
    for (var i = 1; i < Modelo.PRIORIDADES.length; i++) {
      var p = Modelo.PRIORIDADES[i];
      if (!umbrales[p]) { registro.error("Hoja «Umbrales»: falta el puntaje mínimo de la prioridad «" + p + "»."); return null; }
      if (umbrales[p].minimo < umbrales[Modelo.PRIORIDADES[i - 1]].minimo) {
        registro.error("Hoja «Umbrales»: el puntaje mínimo de «" + p + "» (" + umbrales[p].minimo + ") no puede ser menor que el de «" +
          Modelo.PRIORIDADES[i - 1] + "» (" + umbrales[Modelo.PRIORIDADES[i - 1]].minimo + ").");
        return null;
      }
    }
    return Modelo.PRIORIDADES.slice().reverse().map(function (p) { return umbrales[p]; });
  }

  function leerReglas(hojas, registro) {
    var hoja = buscarHoja(hojas, "Reglas");
    if (!hoja) { registro.aviso("No se encontró la hoja «Reglas»: no hay reglas duras."); return []; }
    var filas = filasDeTabla(hoja, [
      { campo: "texto", nombre: "Regla", obligatoria: true },
      { campo: "campo", nombre: "Campo", obligatoria: true },
      { campo: "condicion", nombre: "Condición", obligatoria: true },
      { campo: "valor", nombre: "Valor", obligatoria: true },
      { campo: "prioridadMinima", nombre: "Prioridad mínima", obligatoria: true },
      { campo: "activa", nombre: "Activa" }
    ], "Reglas", registro);
    if (!filas) return [];

    var reglas = [];
    filas.forEach(function (f) {
      var etiqueta = "Hoja «Reglas», fila " + f.fila;
      var condicion = CONDICIONES[normalizarTexto(f.condicion)];
      var prioridad = leerPrioridad(f.prioridadMinima);
      var activa = vacio(f.activa) ? true : leerSiNo(f.activa);
      var problemas = [];
      if (vacio(f.campo)) problemas.push("falta el campo (la columna de reportes que revisa la regla)");
      if (!condicion) problemas.push("la condición debe ser «es igual a», «mayor o igual que» o «menor o igual que»; dice " + mostrar(f.condicion));
      if (vacio(f.valor)) problemas.push("falta el valor");
      if (!prioridad) problemas.push("la prioridad mínima debe ser Crítica, Alta, Media o Baja; dice " + mostrar(f.prioridadMinima));
      if (activa === null) problemas.push("«Activa» debe ser Sí o No; dice " + mostrar(f.activa));
      if (problemas.length) { registro.error(etiqueta + ": " + problemas.join("; ") + "."); return; }
      if (condicion !== "igual" && leerNumero(f.valor) === null) {
        registro.error(etiqueta + ": la condición «" + texto(f.condicion) + "» necesita un valor numérico; dice " + mostrar(f.valor) + ".");
        return;
      }
      reglas.push({
        fila: f.fila,
        texto: texto(f.texto) || (texto(f.campo) + " " + texto(f.condicion) + " " + texto(f.valor)),
        campo: texto(f.campo),
        campoClave: claveTexto(f.campo),
        condicion: condicion,
        valor: leerNumero(f.valor) !== null ? leerNumero(f.valor) : texto(f.valor),
        prioridadMinima: prioridad,
        activa: activa
      });
    });
    return reglas;
  }

  function leerCriterios(hojas) {
    var registro = new Registro();
    var pesos = leerPesos(hojas, registro);
    var escalas = leerEscalas(hojas, registro);
    var umbrales = leerUmbrales(hojas, registro);
    var reglas = leerReglas(hojas, registro);
    registro.cerrar();
    var completos = pesos && pesos.orden.length && umbrales && registro.errores.length === 0;
    return {
      criterios: completos ? { pesos: pesos.pesos, orden: pesos.orden, escalas: escalas, umbrales: umbrales, reglas: reglas } : null,
      errores: registro.errores,
      avisos: registro.avisos
    };
  }

  // Avisa si una regla revisa una columna que no existe en los reportes cargados (nunca se cumpliría).
  function revisarReglas(criterios, columnasReportes) {
    var avisos = [];
    var claves = (columnasReportes || []).map(claveTexto);
    (criterios && criterios.reglas || []).forEach(function (regla) {
      if (regla.activa && claves.indexOf(regla.campoClave) === -1) {
        avisos.push("La regla «" + regla.texto + "» revisa la columna «" + regla.campo + "», que no existe en los reportes; no se aplicará.");
      }
    });
    return avisos;
  }

  var Lectura = {
    COLUMNAS_REPORTES: COLUMNAS_REPORTES,
    leerReportes: leerReportes,
    leerCriterios: leerCriterios,
    revisarReglas: revisarReglas,
    leerFecha: leerFecha,
    leerNumero: leerNumero
  };

  if (typeof module === "object" && module.exports) module.exports = Lectura;
  else raiz.Lectura = Lectura;
})(this);
