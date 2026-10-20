// Pruebas del modelo de priorización. Ejecutar: node --test pruebas/
const test = require("node:test");
const assert = require("node:assert/strict");
const { Modelo, Lectura, EJEMPLO, copia, cargarEjemplo, aleatorio } = require("./apoyo.js");

const { reportes, criterios } = cargarEjemplo();
const C = criterios.criterios;
const evaluados = Modelo.priorizar(reportes.reportes, C);
const porFolio = (lista, folio) => lista.find((e) => e.reporte.folio === folio);
const cerca = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} ≠ ${b}`);
const aportesDe = (e) => Object.fromEntries(e.aportes.map((a) => [a.clave, a.aporte]));

test("los datos de ejemplo se leen sin errores", () => {
  assert.deepEqual(reportes.errores, []);
  assert.deepEqual(criterios.errores, []);
  assert.equal(reportes.reportes.length, 200);
  assert.ok(C);
});

test("ejemplo a mano 1 (docs/modelo.md): REP-0200, cable caído con pocos usuarios", () => {
  const e = porFolio(evaluados, "REP-0200");
  const a = aportesDe(e);
  cerca(a.severidad, 9.9, "severidad 2 → 0.33 × 30");
  cerca(a.usuarios, 6.25, "3 usuarios → 0.25 × 25");
  cerca(a.tiempo, 5, "1 h de 4 → 0.25 × 20");
  cerca(a.recurrencia, 0, "0 reportes previos");
  cerca(a.riesgo, 0, "sin riesgo");
  cerca(e.puntaje, 21.15, "puntaje");
  assert.equal(e.prioridadPuntaje, "Baja");
  assert.equal(e.prioridad, "Crítica");
  assert.equal(e.elevadoPorRegla, true);
  assert.equal(e.reglasAplicadas.length, 1);
  assert.match(e.reglasAplicadas[0].texto, /cable caído/);
  assert.equal(e.reglasAplicadas[0].subioPrioridad, true);
});

test("ejemplo a mano 2 (docs/modelo.md): REP-0083, sin servicio vencido", () => {
  const e = porFolio(evaluados, "REP-0083");
  const a = aportesDe(e);
  cerca(a.severidad, 20.1, "severidad 3 → 0.67 × 30");
  cerca(a.usuarios, 18.75, "180 usuarios → 0.75 × 25");
  cerca(a.tiempo, 20, "20 h de 8 (vencido) → 1 × 20");
  cerca(a.recurrencia, 2, "1 reporte previo → 0.2 × 10");
  cerca(a.riesgo, 0, "sin riesgo");
  cerca(e.puntaje, 60.85, "puntaje");
  assert.equal(e.prioridadPuntaje, "Alta");
  assert.equal(e.prioridad, "Alta");
  assert.equal(e.reglasAplicadas.length, 0);
  assert.equal(e.vencido, true);
  assert.deepEqual(e.celda, { impacto: 2, urgencia: 2 });
});

test("REP-0183: riesgo a la seguridad en falla menor es crítica por regla", () => {
  const e = porFolio(evaluados, "REP-0183");
  assert.ok(e.puntaje < 30);
  assert.equal(e.prioridad, "Crítica");
  assert.ok(e.reglasAplicadas.some((r) => /riesgo/.test(r.texto)));
});

test("reportes vencidos: el tiempo respecto al plazo vale 1", () => {
  for (const folio of ["REP-0003", "REP-0006", "REP-0083"]) {
    const e = porFolio(evaluados, folio);
    assert.equal(e.vencido, true, folio);
    assert.equal(e.aportes.find((a) => a.clave === "tiempo").valor, 1, folio);
  }
});

test("localidad recurrente: Pueblo Yaqui tiene recurrencia alta", () => {
  const yaqui = evaluados.filter((e) => e.reporte.localidad === "Pueblo Yaqui");
  assert.deepEqual(yaqui.map((e) => e.reporte.folio).sort(), ["REP-0111", "REP-0122", "REP-0144", "REP-0154", "REP-0176", "REP-0190"]);
  for (const e of yaqui) assert.ok(e.aportes.find((a) => a.clave === "recurrencia").valor >= 0.8, e.reporte.folio);
});

test("REP-0194: alto impacto y baja urgencia; al menos alta por severidad 4", () => {
  const e = porFolio(evaluados, "REP-0194");
  assert.ok(Modelo.rango(e.prioridad) >= Modelo.rango("Alta"));
  assert.deepEqual(e.celda, { impacto: 2, urgencia: 0 });
});

test("REP-0179: un crítico cerrado no cuenta en pendientes ni en la matriz", () => {
  const e = porFolio(evaluados, "REP-0179");
  assert.equal(e.prioridad, "Crítica");
  assert.equal(e.pendiente, false);
  const r = Modelo.resumen(evaluados);
  const pendientes = evaluados.filter((x) => x.pendiente).length;
  assert.equal(r.pendientes, pendientes);
  assert.equal(r.cerrados, 200 - pendientes);
  assert.equal(r.matriz.flat().reduce((s, n) => s + n, 0), pendientes);
  assert.equal(Object.values(r.porPrioridad).reduce((s, n) => s + n, 0), pendientes);
  const total = Object.values(r.porMunicipio).reduce((s, m) => s + m.total, 0);
  assert.equal(total, pendientes);
});

// Revisa que ninguna prioridad viole las reglas duras ni quede por debajo de la del puntaje.
function revisarInvariantes(lista, criteriosUsados, contexto) {
  for (const e of lista) {
    const r = e.reporte;
    const etiqueta = `${contexto} ${r.folio}`;
    assert.ok(Modelo.rango(e.prioridad) >= Modelo.rango(e.prioridadPuntaje), etiqueta + ": prioridad menor que la del puntaje");
    for (const regla of criteriosUsados.reglas) {
      if (regla.activa && Modelo.cumpleRegla(regla, r)) {
        assert.ok(Modelo.rango(e.prioridad) >= Modelo.rango(regla.prioridadMinima), etiqueta + ": viola «" + regla.texto + "»");
      }
    }
    // Comprobación independiente de las reglas del enunciado, directamente sobre los datos
    if (r.tipo === "Cable caído" || r.riesgo) assert.equal(e.prioridad, "Crítica", etiqueta + ": cable caído o riesgo debe ser crítica");
    const suma = e.aportes.reduce((s, a) => s + a.aporte, 0);
    assert.ok(Math.abs(suma - e.puntaje) < 1e-9, etiqueta + ": los aportes no suman el puntaje");
    assert.ok(e.puntaje >= -1e-9 && e.puntaje <= 100 + 1e-9, etiqueta + ": puntaje fuera de 0–100");
    for (const a of e.aportes) assert.ok(a.valor >= 0 && a.valor <= 1, etiqueta + ": valor fuera de 0–1");
  }
}

test("las reglas duras nunca se violan con los pesos originales", () => {
  revisarInvariantes(evaluados, C, "pesos originales");
});

test("las reglas duras nunca se violan con 200 combinaciones de pesos al azar", () => {
  const azar = aleatorio(20261020);
  for (let i = 0; i < 200; i++) {
    const pesos = {};
    for (const clave of C.orden) pesos[clave] = Math.round(azar() * 100);
    if (Object.values(pesos).every((p) => p === 0)) pesos.severidad = 1;
    const otros = Modelo.conPesos(C, pesos);
    revisarInvariantes(Modelo.priorizar(reportes.reportes, otros), otros, `combinación ${i}`);
  }
});

test("la lista queda ordenada por prioridad y luego por puntaje", () => {
  for (let i = 1; i < evaluados.length; i++) {
    const a = evaluados[i - 1], b = evaluados[i];
    assert.ok(Modelo.rango(a.prioridad) >= Modelo.rango(b.prioridad), `posición ${i}`);
    if (a.prioridad === b.prioridad) assert.ok(a.puntaje >= b.puntaje - 1e-9, `posición ${i}`);
    assert.equal(a.posicion, i);
  }
});

test("cambiar un peso reordena la lista: con recurrencia en 60, Pueblo Yaqui sube", () => {
  const promedio = (lista) => {
    const yaqui = lista.filter((e) => e.reporte.localidad === "Pueblo Yaqui");
    return yaqui.reduce((s, e) => s + e.posicion, 0) / yaqui.length;
  };
  const antes = promedio(evaluados);
  const despues = promedio(Modelo.priorizar(reportes.reportes, Modelo.conPesos(C, { recurrencia: 60 })));
  assert.ok(despues < antes - 10, `posición promedio antes ${antes}, después ${despues}`);
});

test("pesos que no suman 100: se avisa y el puntaje es el mismo que con los pesos proporcionales", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Pesos.slice(1).forEach((fila) => { fila[2] = fila[2] * 2; });
  const leidos = Lectura.leerCriterios(hojas);
  assert.deepEqual(leidos.errores, []);
  assert.ok(leidos.avisos.some((a) => /suman 200/.test(a)), leidos.avisos.join(" | "));
  const dobles = Modelo.priorizar(reportes.reportes, leidos.criterios);
  for (const e of dobles) cerca(e.puntaje, porFolio(evaluados, e.reporte.folio).puntaje, e.reporte.folio);
});

test("si todos los pesos valen 0, es un error", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Pesos.slice(1).forEach((fila) => { fila[2] = 0; });
  const leidos = Lectura.leerCriterios(hojas);
  assert.equal(leidos.criterios, null);
  assert.ok(leidos.errores.some((e) => /Todos los pesos valen 0/.test(e)));
});

test("desactivar una regla en Excel la deja sin efecto", () => {
  const hojas = copia(EJEMPLO.criterios);
  hojas.Reglas.find((f) => /cable caído/.test(f[0]))[5] = "No";
  const leidos = Lectura.leerCriterios(hojas);
  const e = porFolio(Modelo.priorizar(reportes.reportes, leidos.criterios), "REP-0200");
  assert.equal(e.prioridad, "Baja");
});

test("cambiar una escala en Excel cambia el valor del criterio", () => {
  const hojas = copia(EJEMPLO.criterios);
  // Que 1 a 10 usuarios valga 0.5 en vez de 0.25
  hojas.Escalas.find((f) => f[0] === "Usuarios afectados" && f[1] === 1)[2] = 0.5;
  const leidos = Lectura.leerCriterios(hojas);
  const e = porFolio(Modelo.priorizar(reportes.reportes, leidos.criterios), "REP-0200");
  cerca(e.aportes.find((a) => a.clave === "usuarios").aporte, 12.5, "3 usuarios → 0.5 × 25");
});

test("resumen: indicadores coherentes con la lista", () => {
  const r = Modelo.resumen(evaluados);
  const pend = evaluados.filter((e) => e.pendiente);
  assert.equal(r.vencidos, pend.filter((e) => e.reporte.horasAbiertas > e.reporte.plazo).length);
  assert.equal(r.usuariosAfectados, pend.reduce((s, e) => s + e.reporte.usuarios, 0));
  cerca(r.horasPromedio, pend.reduce((s, e) => s + e.reporte.horasAbiertas, 0) / pend.length, "horas promedio");
  assert.ok(r.matriz.flat().every((n) => n > 0), "todas las celdas de la matriz tienen reportes en el ejemplo");
});
