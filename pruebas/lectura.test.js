// Pruebas de lectura y validación de los Excel. Ejecutar: node --test pruebas/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, Modelo, Lectura, EJEMPLO, copia, cargarEjemplo } = require("./apoyo.js");
const XLSX = require(path.join(RAIZ, "sitio/lib/sheetjs/xlsx.mini.min.js"));

const base = cargarEjemplo();

// Lee un .xlsx como lo hará el sitio: cada hoja como filas, con fechas como texto "2026-10-19 08:00".
function leerXlsx(ruta, opciones) {
  const libro = XLSX.read(fs.readFileSync(ruta), { cellDates: true });
  const hojas = {};
  for (const nombre of libro.SheetNames) {
    hojas[nombre] = XLSX.utils.sheet_to_json(libro.Sheets[nombre], Object.assign({ header: 1, defval: null, blankrows: false }, opciones));
  }
  return hojas;
}

const resumenReporte = (r) => [r.folio, r.fechaAlta && r.fechaAlta.getTime(), r.municipio, r.localidad, r.latitud, r.longitud, r.tipo,
  r.severidad, r.usuarios, r.horasAbiertas, r.plazo, r.estado, r.riesgo, r.previos, r.cuadrilla];

test("leer los .xlsx con SheetJS da lo mismo que los datos incluidos en el sitio", () => {
  for (const opciones of [{ raw: false, dateNF: "yyyy-mm-dd hh:mm" }, { raw: true }]) {
    const desdeExcel = Lectura.leerReportes(leerXlsx(path.join(RAIZ, "datos/reportes.xlsx"), opciones));
    assert.deepEqual(desdeExcel.errores, []);
    assert.deepEqual(desdeExcel.reportes.map(resumenReporte), base.reportes.reportes.map(resumenReporte), JSON.stringify(opciones));
    assert.equal(desdeExcel.fechaCorte.getTime(), base.reportes.fechaCorte.getTime());

    const criterios = Lectura.leerCriterios(leerXlsx(path.join(RAIZ, "datos/criterios.xlsx"), opciones));
    assert.deepEqual(criterios.errores, []);
    assert.deepEqual(criterios.criterios, base.criterios.criterios, JSON.stringify(opciones));
  }
});

test("las copias para descargar son idénticas a datos/", () => {
  for (const nombre of ["reportes.xlsx", "criterios.xlsx"]) {
    assert.ok(fs.readFileSync(path.join(RAIZ, "datos", nombre)).equals(fs.readFileSync(path.join(RAIZ, "sitio/descargas", nombre))), nombre);
  }
});

test("los encabezados se reconocen sin importar mayúsculas, acentos, espacios ni signos", () => {
  const hojas = copia(EJEMPLO.reportes);
  hojas.Reportes[0] = ["FOLIO", "fecha y hora de alta", " Municipio ", "LOCALIDAD", "latitud", "LONGITUD", "tipo de falla", "SEVERIDAD",
    "usuarios afectados", "horas abiertas", "Plazo de atencion horas", "estado", "riesgo a la seguridad", "reportes previos 30 dias", "cuadrilla"];
  const r = Lectura.leerReportes({ reportes: hojas.Reportes, "acerca de": hojas["Acerca de"] });
  assert.deepEqual(r.errores, []);
  assert.deepEqual(r.reportes.map(resumenReporte), base.reportes.reportes.map(resumenReporte));
});

test("una columna faltante produce un error que la nombra", () => {
  const hojas = copia(EJEMPLO.reportes);
  const i = hojas.Reportes[0].indexOf("Severidad");
  hojas.Reportes = hojas.Reportes.map((fila) => fila.filter((_, j) => j !== i));
  const r = Lectura.leerReportes(hojas);
  assert.equal(r.reportes.length, 0);
  assert.equal(r.errores.length, 1);
  assert.match(r.errores[0], /Faltan columnas.*«Severidad»/);
});

test("un dato inválido produce un error con fila y folio, y el resto se carga", () => {
  const hojas = copia(EJEMPLO.reportes);
  const col = hojas.Reportes[0].indexOf("Severidad");
  hojas.Reportes[2][col] = 7;                       // fila 3 de Excel
  hojas.Reportes[5][hojas.Reportes[0].indexOf("Estado")] = "Pendiente";
  const r = Lectura.leerReportes(hojas);
  assert.equal(r.reportes.length, 198);
  assert.equal(r.errores.length, 2);
  assert.match(r.errores[0], /^Fila 3 \(REP-0002\): la severidad debe ser 1, 2, 3 o 4; dice «7»\.$/);
  assert.match(r.errores[1], /^Fila 6 \(REP-0005\): el estado debe ser Abierto, En proceso o Cerrado; dice «Pendiente»\.$/);
});

test("si faltan las horas abiertas, se calculan con la fecha de corte", () => {
  const hojas = copia(EJEMPLO.reportes);
  const col = hojas.Reportes[0].indexOf("Horas abiertas");
  hojas.Reportes[1][col] = null;  // REP-0001, abierto
  const r = Lectura.leerReportes(hojas);
  const rep = r.reportes.find((x) => x.folio === "REP-0001");
  const esperado = Math.round((r.fechaCorte - rep.fechaAlta) / 360000) / 10;
  assert.equal(rep.horasAbiertas, esperado);
  assert.ok(r.avisos.some((a) => /Se calcularon las horas abiertas de 1 reportes/.test(a)));
});

test("sin hoja «Reportes» el error dice qué hojas hay", () => {
  const r = Lectura.leerReportes({ Hoja1: [["a"]] });
  assert.match(r.errores[0], /No se encontró la hoja «Reportes»\. Hojas del archivo: Hoja1\./);
});

test("fechas: texto ISO, texto día/mes/año y número de serie de Excel", () => {
  const esperado = new Date(2026, 9, 19, 8, 0).getTime();
  assert.equal(Lectura.leerFecha("2026-10-19 08:00").getTime(), esperado);
  assert.equal(Lectura.leerFecha("19/10/2026 08:00").getTime(), esperado);
  const serie = Date.UTC(2026, 9, 19, 8, 0) / 86400000 + 25569;
  assert.equal(Lectura.leerFecha(serie).getTime(), esperado);
  assert.equal(Lectura.leerFecha("31/02/2026"), null);
  assert.equal(Lectura.leerNumero("1,800"), 1800);
});

test("criterio desconocido en Pesos: el error lista los disponibles", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Pesos[1][0] = "Antigüedad del equipo";
  const c = Lectura.leerCriterios(hojas);
  assert.equal(c.criterios, null);
  assert.ok(c.errores.some((e) => /no se reconoce el criterio «Antigüedad del equipo».*Severidad, Usuarios afectados/.test(e)));
});

test("umbrales desordenados son un error", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Umbrales.find((f) => f[0] === "Alta")[1] = 80; // Alta por encima de Crítica (70)
  const c = Lectura.leerCriterios(hojas);
  assert.equal(c.criterios, null);
  assert.ok(c.errores.some((e) => /«Crítica» \(70\) no puede ser menor que el de «Alta» \(80\)/.test(e)));
});

test("sin hoja Escalas se usan las tablas predeterminadas, con aviso", () => {
  const hojas = copia(EJEMPLO.criterios);
  delete hojas.Escalas;
  const c = Lectura.leerCriterios(hojas);
  assert.deepEqual(c.errores, []);
  assert.deepEqual(c.criterios.escalas, Modelo.ESCALAS_PREDETERMINADAS);
  assert.ok(c.avisos.some((a) => /Escalas/.test(a)));
});

test("una escala con valor fuera de 0–1 es un error", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Escalas[1][2] = 5;
  const c = Lectura.leerCriterios(hojas);
  assert.ok(c.errores.some((e) => /Hoja «Escalas», fila 2: el valor debe estar entre 0 y 1; dice «5»/.test(e)));
});

test("una regla sobre una columna que no existe genera un aviso; una regla sobre una columna nueva funciona", () => {
  const criterios = copia(EJEMPLO.criterios);
  criterios.Reglas.push(["Si la zona es hospital, la prioridad es crítica.", "Zona", "es igual a", "hospital", "Crítica", "Sí"]);
  const c = Lectura.leerCriterios(criterios);
  assert.deepEqual(c.errores, []);
  assert.equal(Lectura.revisarReglas(c.criterios, base.reportes.columnas).length, 1);

  // La persona agrega una columna "Zona" a sus reportes: la regla se aplica sin tocar código
  const reportes = copia(EJEMPLO.reportes);
  reportes.Reportes[0].push("Zona");
  reportes.Reportes.slice(1).forEach((fila) => fila.push(fila[0] === "REP-0010" ? "Hospital" : "Habitacional"));
  const r = Lectura.leerReportes(reportes);
  assert.deepEqual(Lectura.revisarReglas(c.criterios, r.columnas), []);
  const e = Modelo.priorizar(r.reportes, c.criterios).find((x) => x.reporte.folio === "REP-0010");
  assert.equal(e.prioridad, "Crítica");
  assert.ok(e.reglasAplicadas.some((x) => /hospital/.test(x.texto)));
});

test("condición numérica con valor de texto es un error", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Reglas[3][3] = "cuatro";
  const c = Lectura.leerCriterios(hojas);
  assert.ok(c.errores.some((e) => /necesita un valor numérico; dice «cuatro»/.test(e)));
});
