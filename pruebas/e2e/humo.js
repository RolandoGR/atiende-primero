/*
 * Prueba de humo del dashboard con Playwright (navegador Chromium real).
 *
 * Abre sitio/index.html con doble clic simulado (file://) en tamaño de celular y de computadora, y servido por HTTP.
 * Revisa que no haya errores ni peticiones fuera del dispositivo, que la matriz filtre, que el detalle explique el
 * puntaje, que los pesos reordenen y viajen en el enlace, que se puedan cargar y exportar Excel, y toma capturas.
 *
 * Uso: NODE_PATH=/opt/node22/lib/node_modules node pruebas/e2e/humo.js
 *      (con la biblioteca playwright instalada; usa el Chromium preinstalado del entorno)
 */
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const http = require("node:http");
const { chromium } = require("playwright");

const RAIZ = path.join(__dirname, "..", "..");
const SITIO = path.join(RAIZ, "sitio");
const CAPTURAS = path.join(RAIZ, "docs", "capturas");
const XLSX = require(path.join(SITIO, "lib/sheetjs/xlsx.mini.min.js"));
const URL_ARCHIVO = "file://" + path.join(SITIO, "index.html");
const CELULAR = { width: 390, height: 844 };
const COMPUTADORA = { width: 1366, height: 768 };

let fallas = 0, aciertos = 0;
function comprobar(condicion, descripcion, detalle) {
  if (condicion) { aciertos++; console.log("  ✓ " + descripcion); }
  else { fallas++; console.log("  ✗ " + descripcion + (detalle !== undefined ? " → " + JSON.stringify(detalle) : "")); }
}

// Abre una página nueva y registra cualquier error o petición que no sea local.
async function abrir(navegador, url, viewport, opciones = {}) {
  const contexto = await navegador.newContext({ viewport, deviceScaleFactor: 2, acceptDownloads: true });
  const pagina = await contexto.newPage();
  const problemas = [];
  const origenPermitido = opciones.origen || "file:";
  pagina.on("console", (m) => { if (m.type() === "error") problemas.push("consola: " + m.text()); });
  pagina.on("pageerror", (e) => problemas.push("error: " + e.message));
  pagina.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith(origenPermitido) && !u.startsWith("data:") && !u.startsWith("blob:")) problemas.push("petición externa: " + u);
  });
  await pagina.goto(url);
  await pagina.waitForFunction(() => window.App && App.estado.evaluados.length > 0);
  if (opciones.saltarRecorrido !== false) {
    await pagina.waitForSelector("#recorrido:not([hidden])", { timeout: 3000 }).catch(() => {});
    if (await pagina.isVisible("#recorrido-saltar")) await pagina.click("#recorrido-saltar");
  }
  return { contexto, pagina, problemas };
}

const captura = (pagina, nombre, completa) => pagina.screenshot({ path: path.join(CAPTURAS, nombre + ".png"), fullPage: !!completa });
const ir = (pagina, vista) => pagina.click(`.pestana[data-ir-a="${vista}"]`);

async function celular(navegador, tmp) {
  console.log("\nCelular (390 × 844), abierto como archivo (file://)");
  const { contexto, pagina, problemas } = await abrir(navegador, URL_ARCHIVO, CELULAR, { saltarRecorrido: false });

  // Recorrido guiado la primera vez
  const recorridoVisible = await pagina.waitForSelector("#recorrido:not([hidden])", { timeout: 3000 }).then(() => true).catch(() => false);
  comprobar(recorridoVisible, "el recorrido guiado aparece la primera vez");
  await captura(pagina, "celular-recorrido");
  for (let i = 0; i < 5; i++) await pagina.click("#recorrido-siguiente");
  comprobar(await pagina.isHidden("#recorrido"), "el recorrido termina después de 5 pasos");

  const r = await pagina.evaluate(() => Modelo.resumen(App.filtrados(["estado", "prioridad", "folio"])));
  comprobar(r.pendientes === 163 && r.porPrioridad["Crítica"] === 26, "indicadores: 163 pendientes y 26 críticos", r.porPrioridad);
  comprobar((await pagina.textContent("#indicadores")).includes("163"), "los indicadores muestran 163 en pantalla");
  comprobar(await pagina.isVisible(".leyenda"), "la leyenda de datos ficticios está visible");
  await captura(pagina, "celular-resumen");

  // Matriz: impacto alto, urgencia baja
  await pagina.click('#matriz .celda[data-impacto="2"][data-urgencia="0"]');
  const enCelda = await pagina.evaluate(() => App.filtrados().map((e) => e.reporte.folio));
  comprobar(enCelda.includes("REP-0194"), "la celda impacto alto · urgencia baja incluye REP-0194");
  comprobar(await pagina.isVisible("#filtros-activos .chip-filtro"), "aparece el chip del filtro de la matriz");
  await ir(pagina, "lista");
  const filas = await pagina.locator("#lista .reporte").count();
  comprobar(filas === Math.min(50, enCelda.length), "la lista muestra solo los reportes de la celda", { filas, esperados: enCelda.length });
  await captura(pagina, "celular-lista-filtrada");
  await pagina.click('#filtros-activos [data-quitar="celda"]');

  // Detalle de REP-0200
  await pagina.fill("#f-folio", "REP-0200");
  await pagina.click('#lista .reporte[data-folio="REP-0200"]');
  await pagina.waitForSelector("#detalle:not([hidden])");
  const detalle = await pagina.textContent("#detalle");
  comprobar(detalle.includes("21.15"), "el detalle de REP-0200 muestra 21.15 puntos");
  comprobar(/Baja.*→.*Crítica/s.test(detalle) && detalle.includes("cable caído"), "el detalle muestra Baja → Crítica por la regla de cable caído");
  await captura(pagina, "celular-detalle");
  await pagina.click("#cerrar-detalle");
  await pagina.fill("#f-folio", "");

  // Mapa
  await ir(pagina, "mapa");
  await pagina.waitForTimeout(500);
  comprobar(await pagina.evaluate(() => document.querySelectorAll("#mapa path.leaflet-interactive").length >= 72 || document.querySelector("#mapa canvas") !== null), "el mapa dibuja los municipios");
  await captura(pagina, "celular-mapa");

  // Pesos: recurrencia en 60
  await ir(pagina, "pesos");
  const antes = await pagina.evaluate(() => {
    const y = App.estado.evaluados.filter((e) => e.reporte.localidad === "Pueblo Yaqui");
    return y.reduce((s, e) => s + e.posicion, 0) / y.length;
  });
  await pagina.evaluate(() => {
    const control = document.querySelector('#peso-recurrencia');
    control.value = "60";
    control.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await pagina.waitForFunction(() => App.pesosActuales().recurrencia === 60);
  const despues = await pagina.evaluate(() => {
    const y = App.estado.evaluados.filter((e) => e.reporte.localidad === "Pueblo Yaqui");
    return y.reduce((s, e) => s + e.posicion, 0) / y.length;
  });
  comprobar(despues < antes - 10, "con recurrencia en 60, Pueblo Yaqui sube en la lista", { antes, despues });
  const url = pagina.url();
  comprobar(url.includes("#pesos=") && url.includes("recurrencia.60"), "el enlace lleva los pesos", url);
  await captura(pagina, "celular-pesos");

  const otra = await abrir(navegador, url, CELULAR);
  comprobar(await otra.pagina.evaluate(() => App.pesosActuales().recurrencia === 60), "al abrir el enlace se aplican los mismos pesos");
  comprobar(otra.problemas.length === 0, "sin errores al abrir el enlace con pesos", otra.problemas);
  await otra.contexto.close();

  // Ayuda
  await pagina.click("#btn-ayuda");
  const ayuda = await pagina.textContent("#ayuda-cuerpo");
  comprobar(ayuda.includes("Recurrencia") && ayuda.includes("60"), "la ayuda refleja los pesos actuales");
  await captura(pagina, "celular-ayuda");
  await pagina.click('#dlg-ayuda [data-cerrar]');

  // Carga de archivos propios
  await pagina.click("#btn-restablecer");
  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", path.join(RAIZ, "datos/reportes.xlsx"));
  await pagina.waitForSelector("#resultado-carga .ok, #resultado-carga .error");
  comprobar(await pagina.evaluate(() => App.estado.datos.reportes.length === 200 && App.estado.origen.tipo === "propio"), "cargar reportes.xlsx deja 200 reportes como «tus archivos»");
  await captura(pagina, "celular-cargar");

  // Un Excel sin la columna Severidad
  const libro = XLSX.read(fs.readFileSync(path.join(RAIZ, "datos/reportes.xlsx")), { cellDates: true });
  const filasExcel = XLSX.utils.sheet_to_json(libro.Sheets.Reportes, { header: 1 });
  const col = filasExcel[0].indexOf("Severidad");
  const roto = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(roto, XLSX.utils.aoa_to_sheet(filasExcel.map((f) => f.filter((_, j) => j !== col))), "Reportes");
  const rutaRoto = path.join(tmp, "reportes-sin-severidad.xlsx");
  fs.writeFileSync(rutaRoto, XLSX.write(roto, { type: "buffer", bookType: "xlsx" }));
  await pagina.setInputFiles("#archivo", rutaRoto);
  await pagina.waitForFunction(() => /Severidad/.test(document.getElementById("resultado-carga").textContent));
  const mensaje = await pagina.textContent("#resultado-carga");
  comprobar(/Faltan columnas.*«Severidad»/.test(mensaje), "un Excel sin «Severidad» muestra un error que la nombra");
  comprobar(await pagina.evaluate(() => App.estado.datos.reportes.length === 200), "tras el error se conservan los datos anteriores");
  await pagina.click("#btn-volver-ejemplo");
  comprobar(await pagina.evaluate(() => App.estado.origen.tipo === "ejemplo"), "«Volver a los datos de ejemplo» funciona");
  await pagina.click('#dlg-cargar [data-cerrar]');

  // Exportar la lista
  await ir(pagina, "lista");
  await pagina.selectOption("#f-prioridad", "Crítica");
  const [descarga] = await Promise.all([pagina.waitForEvent("download"), pagina.click("#btn-exportar")]);
  const rutaExport = path.join(tmp, descarga.suggestedFilename());
  await descarga.saveAs(rutaExport);
  const exportado = XLSX.read(fs.readFileSync(rutaExport));
  const hoja = XLSX.utils.sheet_to_json(exportado.Sheets["Lista priorizada"], { header: 1 });
  const enPantalla = await pagina.evaluate(() => App.filtrados().map((e) => e.reporte.folio));
  comprobar(JSON.stringify(hoja.slice(1).map((f) => f[1])) === JSON.stringify(enPantalla), "el Excel exportado trae la lista filtrada en el mismo orden", { excel: hoja.length - 1, pantalla: enPantalla.length });
  comprobar(exportado.SheetNames.join(",") === "Lista priorizada,Pesos usados,Acerca de", "el Excel exportado trae sus 3 hojas", exportado.SheetNames);

  comprobar(problemas.length === 0, "celular: sin errores ni peticiones externas", problemas);
  await contexto.close();
}

async function computadora(navegador) {
  console.log("\nComputadora (1366 × 768), abierto como archivo (file://)");
  const { contexto, pagina, problemas } = await abrir(navegador, URL_ARCHIVO, COMPUTADORA);
  for (const id of ["#indicadores", "#matriz", "#mapa", "#lista", "#pesos"]) {
    comprobar(await pagina.isVisible(id), "se ve " + id + " sin cambiar de pestaña");
  }
  comprobar(await pagina.isHidden(".pestanas"), "las pestañas se ocultan en computadora");
  await pagina.waitForTimeout(400);
  await captura(pagina, "computadora-inicio");
  await pagina.click('#lista .reporte[data-folio]');
  await pagina.waitForSelector("#detalle:not([hidden])");
  await captura(pagina, "computadora-detalle");
  comprobar(problemas.length === 0, "computadora: sin errores ni peticiones externas", problemas);
  await contexto.close();
}

async function servidor(navegador) {
  console.log("\nServido por HTTP (como en GitHub Pages)");
  const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".xlsx": "application/octet-stream" };
  const srv = http.createServer((req, res) => {
    const ruta = path.join(SITIO, decodeURIComponent(req.url.split("?")[0].split("#")[0]).replace(/\/$/, "/index.html"));
    if (!ruta.startsWith(SITIO) || !fs.existsSync(ruta)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": tipos[path.extname(ruta)] || "application/octet-stream" });
    fs.createReadStream(ruta).pipe(res);
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + srv.address().port;
  const { contexto, pagina, problemas } = await abrir(navegador, base + "/", CELULAR, { origen: base });
  comprobar(await pagina.evaluate(() => App.estado.evaluados.length === 200), "abre con los 200 reportes de ejemplo");
  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", [path.join(RAIZ, "datos/reportes.xlsx"), path.join(RAIZ, "datos/criterios.xlsx")]);
  await pagina.waitForSelector("#resultado-carga .ok");
  comprobar(await pagina.evaluate(() => App.estado.origen.reportes === "reportes.xlsx" && App.estado.origen.criterios === "criterios.xlsx"), "carga ambos archivos a la vez y reconoce cuál es cuál");
  comprobar(problemas.length === 0, "HTTP: sin errores ni peticiones a otros sitios", problemas);
  await contexto.close();
  srv.close();
}

(async () => {
  fs.mkdirSync(CAPTURAS, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "atiende-primero-"));
  const navegador = await chromium.launch();
  try {
    await celular(navegador, tmp);
    await computadora(navegador);
    await servidor(navegador);
  } catch (e) {
    fallas++;
    console.log("  ✗ la prueba se detuvo: " + e.message);
  } finally {
    await navegador.close();
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`\n${aciertos} comprobaciones correctas, ${fallas} fallas.`);
  process.exit(fallas ? 1 : 0);
})();
