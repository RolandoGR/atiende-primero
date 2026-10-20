// Utilidades compartidas por las pruebas en navegador (humo.js y validacion.js).
const path = require("node:path");
const fs = require("node:fs");
const http = require("node:http");
const zlib = require("node:zlib");

const RAIZ = path.join(__dirname, "..", "..");
const SITIO = path.join(RAIZ, "sitio");
const CAPTURAS = path.join(RAIZ, "docs", "capturas");
const XLSX = require(path.join(SITIO, "lib/sheetjs/xlsx.mini.min.js"));
const URL_ARCHIVO = "file://" + path.join(SITIO, "index.html");

// Lleva la cuenta de comprobaciones correctas y fallidas, y las imprime.
function crearRegistro() {
  const registro = { aciertos: 0, fallas: 0, resultados: [] };
  registro.comprobar = function (condicion, descripcion, detalle) {
    registro.resultados.push({ ok: !!condicion, descripcion, detalle });
    if (condicion) { registro.aciertos++; console.log("  ✓ " + descripcion); }
    else { registro.fallas++; console.log("  ✗ " + descripcion + (detalle !== undefined ? " → " + JSON.stringify(detalle) : "")); }
  };
  return registro;
}

// Abre una página nueva y registra errores y cualquier petición que no sea del propio sitio.
async function abrir(navegador, url, viewport, opciones = {}) {
  const contexto = await navegador.newContext(Object.assign({ viewport, deviceScaleFactor: 2, acceptDownloads: true }, opciones.contexto || {}));
  if (opciones.antes) await contexto.addInitScript(opciones.antes);
  const pagina = await contexto.newPage();
  const problemas = [], peticiones = [];
  const origenPermitido = opciones.origen || "file:";
  pagina.on("console", (m) => { if (m.type() === "error" && !(opciones.ignorarConsola || /$^/).test(m.text())) problemas.push("consola: " + m.text()); });
  pagina.on("pageerror", (e) => problemas.push("error: " + e.message));
  pagina.on("request", (r) => {
    const u = r.url();
    peticiones.push(u);
    if (!u.startsWith(origenPermitido) && !u.startsWith("data:") && !u.startsWith("blob:")) problemas.push("petición externa: " + u);
  });
  await pagina.goto(url);
  await pagina.waitForFunction(() => window.App && App.estado.evaluados.length > 0);
  if (opciones.saltarRecorrido !== false) {
    await pagina.waitForSelector("#recorrido:not([hidden])", { timeout: 3000 }).catch(() => {});
    if (await pagina.isVisible("#recorrido-saltar")) await pagina.click("#recorrido-saltar");
  }
  return { contexto, pagina, problemas, peticiones };
}

// Servidor local de sitio/, con compresión gzip como GitHub Pages. Guarda cada solicitud recibida.
async function iniciarServidor() {
  const tipos = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" };
  const solicitudes = [];
  const srv = http.createServer((req, res) => {
    solicitudes.push({ url: req.url, encabezados: req.headers });
    const ruta = path.join(SITIO, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
    if (!ruta.startsWith(SITIO) || !fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) { res.writeHead(404); res.end(); return; }
    const tipo = tipos[path.extname(ruta)] || "application/octet-stream";
    const comprimir = /gzip/.test(req.headers["accept-encoding"] || "") && /text|javascript/.test(tipo);
    res.writeHead(200, Object.assign({ "Content-Type": tipo, "Cache-Control": "max-age=600" }, comprimir ? { "Content-Encoding": "gzip" } : {}));
    const flujo = fs.createReadStream(ruta);
    (comprimir ? flujo.pipe(zlib.createGzip()) : flujo).pipe(res);
  });
  await new Promise((r) => srv.listen(0, "127.0.0.1", r));
  return { base: "http://127.0.0.1:" + srv.address().port, solicitudes, cerrar: () => new Promise((r) => srv.close(r)) };
}

module.exports = { RAIZ, SITIO, CAPTURAS, XLSX, URL_ARCHIVO, crearRegistro, abrir, iniciarServidor };
