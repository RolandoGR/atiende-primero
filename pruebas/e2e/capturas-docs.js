/*
 * Genera las imágenes de la página de documentación del sitio (sitio/img/*.jpg) con un navegador real.
 * Solo vistas de celular: es como llega la mayoría por QR y así la página pesa menos de 150 KB en imágenes.
 * Se vuelven a generar si cambia el diseño. Uso: npm run capturas
 */
const path = require("node:path");
const fs = require("node:fs");
const { chromium } = require("playwright");
const { SITIO, URL_ARCHIVO, abrir } = require("./apoyo-e2e.js");

const DESTINO = path.join(SITIO, "img");
const CALIDAD = 60;

(async () => {
  fs.mkdirSync(DESTINO, { recursive: true });
  const navegador = await chromium.launch();
  const guardar = (pagina, nombre) => pagina.screenshot({ path: path.join(DESTINO, nombre), type: "jpeg", quality: CALIDAD });

  // Celular: resumen y detalle de un reporte
  const celular = await abrir(navegador, URL_ARCHIVO, { width: 390, height: 780 }, { contexto: { deviceScaleFactor: 1.25, isMobile: true, hasTouch: true } });
  await celular.pagina.click("#cerrar-bienvenida");
  await celular.pagina.waitForTimeout(200);
  await guardar(celular.pagina, "celular-resumen.jpg");
  await celular.pagina.evaluate(() => App.seleccionar("REP-0200"));
  await celular.pagina.waitForSelector("#detalle:not([hidden])");
  await celular.pagina.waitForTimeout(200);
  await guardar(celular.pagina, "celular-detalle.jpg");
  await celular.contexto.close();

  await navegador.close();
  for (const f of fs.readdirSync(DESTINO)) console.log(f, Math.round(fs.statSync(path.join(DESTINO, f)).size / 1024) + " KB");
})();
