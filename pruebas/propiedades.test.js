// Pruebas con datos generados al azar (con semilla, repetibles) y revisión de la documentación.
// Ejecutar: node --test "pruebas/*.test.js"
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, Modelo, Lectura, EJEMPLO, copia, cargarEjemplo, aleatorio } = require("./apoyo.js");

const TIPOS = ["Sin servicio", "Variación de voltaje", "Poste dañado", "Cable caído", "Transformador dañado", "Alumbrado", "Otro"];
const ESTADOS = ["Abierto", "En proceso", "Cerrado"];
const R = Modelo.rango;

// 2,000 reportes sintéticos con muchos valores en los bordes, como filas de Excel.
function hojasSinteticas(azar, n) {
  const elegir = (lista) => lista[Math.floor(azar() * lista.length)];
  const borde = (valores, otro) => (azar() < 0.4 ? elegir(valores) : otro());
  const filas = [EJEMPLO.reportes.Reportes[0].slice()];
  for (let i = 1; i <= n; i++) {
    const plazo = borde([1, 4, 72], () => 1 + Math.floor(azar() * 100));
    filas.push([
      "SIN-" + String(i).padStart(5, "0"), "2026-10-18 10:00", "Hermosillo", "Hermosillo", 29.07, -110.95,
      elegir(TIPOS), 1 + Math.floor(azar() * 4),
      borde([0, 1, 10, 11, 100, 101, 500, 501, 100000], () => Math.floor(azar() * 3000)),
      borde([0, plazo, plazo + 1, plazo * 50], () => Math.round(azar() * plazo * 4 * 10) / 10),
      plazo, elegir(ESTADOS), azar() < 0.2 ? "Sí" : "No",
      borde([0, 4, 5, 20], () => Math.floor(azar() * 20)), "Cuadrilla 01"
    ]);
  }
  return { Reportes: filas, "Acerca de": EJEMPLO.reportes["Acerca de"] };
}

// Criterios al azar: pesos 0–100 y umbrales crecientes. Se agrega una regla con "menor o igual que".
function criteriosAlAzar(azar) {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Pesos.slice(1).forEach((fila) => { fila[2] = Math.round(azar() * 100); });
  if (hojas.Pesos.slice(1).every((f) => f[2] === 0)) hojas.Pesos[1][2] = 1;
  const cortes = [0, 0, 0].map(() => Math.round(azar() * 100)).sort((a, b) => a - b);
  hojas.Umbrales = [hojas.Umbrales[0], ["Crítica", cortes[2], ""], ["Alta", cortes[1], ""], ["Media", cortes[0], ""], ["Baja", 0, ""]];
  const tope = Math.floor(azar() * 50);
  hojas.Reglas.push(["Si hay " + tope + " usuarios o menos, al menos media (regla de prueba).", "Usuarios afectados", "menor o igual que", tope, "Media", "Sí"]);
  return { hojas, tope };
}

// Cálculo independiente de la fórmula de docs/modelo.md (no usa Modelo.evaluar) para comparar.
function oraculo(r, c) {
  const escala = (x, tabla) => tabla.reduce((v, t) => (x >= t.desde ? t.valor : v), 0);
  const valores = {
    severidad: escala(r.severidad, c.escalas.severidad),
    usuarios: escala(r.usuarios, c.escalas.usuarios),
    tiempo: Math.min(r.horasAbiertas / r.plazo, 1),
    recurrencia: escala(r.previos, c.escalas.recurrencia),
    riesgo: r.riesgo ? 1 : 0
  };
  const suma = c.orden.reduce((s, k) => s + c.pesos[k].peso, 0);
  const puntaje = c.orden.reduce((s, k) => s + c.pesos[k].peso * valores[k], 0) * 100 / suma;
  let porPuntaje = "Baja";
  for (const u of c.umbrales) if (puntaje >= u.minimo - 1e-9 && R(u.prioridad) > R(porPuntaje)) porPuntaje = u.prioridad;
  return { puntaje, porPuntaje };
}

test("2,000 reportes al azar × 200 combinaciones de pesos y umbrales: el modelo coincide con el cálculo independiente y nunca viola una regla", () => {
  const azar = aleatorio(4242);
  const leidos = Lectura.leerReportes(hojasSinteticas(azar, 2000));
  assert.deepEqual(leidos.errores, []);
  assert.equal(leidos.reportes.length, 2000);
  let evaluaciones = 0;
  for (let i = 0; i < 200; i++) {
    const { hojas, tope } = criteriosAlAzar(azar);
    const c = Lectura.leerCriterios(hojas);
    assert.deepEqual(c.errores, [], "combinación " + i);
    const lista = Modelo.priorizar(leidos.reportes, c.criterios);
    lista.forEach((e, j) => {
      const r = e.reporte, et = `combinación ${i}, ${r.folio}`;
      const o = oraculo(r, c.criterios);
      assert.ok(Math.abs(o.puntaje - e.puntaje) < 1e-9, et + ": puntaje distinto al cálculo independiente");
      assert.equal(e.prioridadPuntaje, o.porPuntaje, et + ": prioridad por puntaje");
      assert.ok(e.puntaje >= -1e-9 && e.puntaje <= 100 + 1e-9, et + ": fuera de 0–100");
      assert.ok(Math.abs(e.aportes.reduce((s, a) => s + a.aporte, 0) - e.puntaje) < 1e-9, et + ": aportes ≠ puntaje");
      assert.ok(R(e.prioridad) >= R(e.prioridadPuntaje), et + ": bajó la prioridad");
      // Reglas, revisadas directamente sobre los datos (sin usar Modelo.cumpleRegla)
      if (r.tipo === "Cable caído" || r.riesgo) assert.equal(e.prioridad, "Crítica", et + ": cable caído o riesgo");
      if (r.severidad >= 4 || r.usuarios >= 500) assert.ok(R(e.prioridad) >= R("Alta"), et + ": severidad 4 o 500 usuarios");
      if (r.usuarios <= tope) assert.ok(R(e.prioridad) >= R("Media"), et + ": regla «menor o igual que»");
      // Ninguna prioridad sube sin razón: o es la del puntaje, o la impone alguna regla que se cumple
      const esperada = [o.porPuntaje].concat(e.reglasAplicadas.map((x) => x.prioridadMinima)).reduce((a, b) => (R(b) > R(a) ? b : a));
      assert.equal(e.prioridad, esperada, et + ": prioridad final");
      if (j > 0) {
        const a = lista[j - 1];
        assert.ok(R(a.prioridad) > R(e.prioridad) || (a.prioridad === e.prioridad && a.puntaje >= e.puntaje - 1e-9), et + ": orden");
      }
      evaluaciones++;
    });
  }
  assert.equal(evaluaciones, 400000);
});

test("la tabla de casos de prueba de docs/datos.md coincide con los datos de ejemplo", () => {
  const texto = fs.readFileSync(path.join(RAIZ, "docs/datos.md"), "utf8");
  const seccion = texto.slice(texto.indexOf("## Casos de prueba"), texto.indexOf("##", texto.indexOf("## Casos de prueba") + 5));
  const filas = seccion.split("\n").filter((l) => /^\| REP-\d{4}/.test(l));
  assert.ok(filas.length >= 8, "se encontraron " + filas.length + " filas");
  const { reportes } = cargarEjemplo();
  const porFolio = Object.fromEntries(reportes.reportes.map((r) => [r.folio, r]));
  let revisados = 0;
  for (const fila of filas) {
    const celdas = fila.split("|").map((c) => c.trim());
    const folios = celdas[1].match(/\d{4}/g).map((n) => "REP-" + n);
    for (const folio of folios) {
      const r = porFolio[folio];
      assert.ok(r, folio + " no existe en los datos");
      assert.ok(fila.includes(r.tipo) || fila.includes(r.localidad), folio + ": la fila no menciona su tipo (" + r.tipo + ") ni su localidad (" + r.localidad + ")");
      revisados++;
    }
  }
  assert.equal(revisados, 13);
});

test("regla con «menor o igual que» y regla sobre una columna de texto agregada", () => {
  const criterios = copia(EJEMPLO.criterios);
  criterios.Reglas.push(["Si quedan 2 horas o menos de plazo, al menos alta.", "Horas restantes", "menor o igual que", 2, "Alta", "Sí"]);
  criterios.Reglas.push(["Si el circuito es hospital, crítica.", "Circuito", "es igual a", "HOSPITAL", "Crítica", "Sí"]);
  const reportes = copia(EJEMPLO.reportes);
  reportes.Reportes[0].push("Horas restantes", "Circuito");
  reportes.Reportes.slice(1).forEach((f) => {
    const horas = f[9], plazo = f[10];
    f.push(Math.max(0, plazo - horas), f[0] === "REP-0050" ? "Hospital" : "Residencial");
  });
  const r = Lectura.leerReportes(reportes), c = Lectura.leerCriterios(criterios);
  assert.deepEqual(c.errores, []);
  assert.deepEqual(Lectura.revisarReglas(c.criterios, r.columnas), []);
  const lista = Modelo.priorizar(r.reportes, c.criterios);
  for (const e of lista) {
    const restantes = Math.max(0, e.reporte.plazo - e.reporte.horasAbiertas);
    if (restantes <= 2) assert.ok(R(e.prioridad) >= R("Alta"), e.reporte.folio);
  }
  assert.equal(lista.find((e) => e.reporte.folio === "REP-0050").prioridad, "Crítica", "la comparación de texto no distingue mayúsculas");
});

test("un archivo con 5,000 reportes se lee y prioriza rápido", () => {
  const azar = aleatorio(7);
  const inicio = process.hrtime.bigint();
  const leidos = Lectura.leerReportes(hojasSinteticas(azar, 5000));
  const lista = Modelo.priorizar(leidos.reportes, cargarEjemplo().criterios.criterios);
  const ms = Number(process.hrtime.bigint() - inicio) / 1e6;
  assert.equal(lista.length, 5000);
  assert.ok(ms < 1500, "tardó " + ms + " ms");
});

// ---------------------------------------------------------------------------
// Documentación y principios
// ---------------------------------------------------------------------------
function archivosDeTexto(carpeta, excluir) {
  const lista = [];
  for (const entrada of fs.readdirSync(carpeta, { withFileTypes: true })) {
    const ruta = path.join(carpeta, entrada.name);
    if (excluir.some((e) => ruta.includes(e))) continue;
    if (entrada.isDirectory()) lista.push(...archivosDeTexto(ruta, excluir));
    else if (/\.(html|js|css|md|json)$/.test(entrada.name)) lista.push(ruta);
  }
  return lista;
}

test("principio 2: ningún archivo del sitio publicado menciona a la CFE ni a otra institución por su nombre", () => {
  // Las bibliotecas de terceros (sitio/lib) se revisan aparte: son código minificado ajeno al proyecto.
  const archivos = archivosDeTexto(path.join(RAIZ, "sitio"), [path.join("sitio", "lib")]);
  assert.ok(archivos.length > 15);
  const hallazgos = archivos.filter((f) => /\bCFE\b|Comisi[oó]n Federal de Electricidad/i.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(hallazgos, []);
});

test("los enlaces internos de la documentación apuntan a archivos que existen", () => {
  const rotos = [];
  const revisar = (archivo, destino) => {
    if (/^(https?:|mailto:|#|data:)/.test(destino)) return;
    const limpio = decodeURIComponent(destino.split("#")[0].split("?")[0]);
    if (!limpio) return;
    if (!fs.existsSync(path.resolve(path.dirname(archivo), limpio))) rotos.push(path.relative(RAIZ, archivo) + " → " + destino);
  };
  const markdown = [path.join(RAIZ, "README.md"), path.join(RAIZ, "CLAUDE.md")]
    .concat(fs.readdirSync(path.join(RAIZ, "docs")).filter((f) => f.endsWith(".md")).map((f) => path.join(RAIZ, "docs", f)));
  for (const archivo of markdown) {
    // Quita los bloques de código para no confundir ejemplos con enlaces
    const texto = fs.readFileSync(archivo, "utf8").replace(/(~~~~|```)[\s\S]*?\1/g, "");
    for (const m of texto.matchAll(/\]\(([^)\s]+)\)/g)) revisar(archivo, m[1]);
    for (const m of texto.matchAll(/<img[^>]+src="([^"]+)"/g)) revisar(archivo, m[1]);
  }
  for (const html of ["index.html", "documentacion.html"]) {
    const archivo = path.join(RAIZ, "sitio", html);
    for (const m of fs.readFileSync(archivo, "utf8").matchAll(/(?:href|src)="([^"]+)"/g)) revisar(archivo, m[1]);
  }
  assert.deepEqual(rotos, []);
});
