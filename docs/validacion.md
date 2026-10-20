# Informe de validación

**Fecha:** 2026-10-20 · **Navegador de prueba:** Chromium 141 (Playwright 1.56.1) · **Datos:** ejemplo ficticio de 200 reportes

Resultados completos y legibles por máquina: `docs/validacion-resultados.json`. Capturas: `docs/capturas/validacion/`.

## Resumen
| Tema | Cómo se probó | Resultado |
|---|---|---|
| Cálculo con casos conocidos | `npm test`: dos ejemplos calculados a mano, los casos de prueba de la Fase 1 y cálculo independiente con 400,000 evaluaciones al azar | ✅ 35 de 35 pruebas |
| Reglas duras | Invariantes con los pesos originales, 200 combinaciones de pesos y umbrales al azar, y 2,000 reportes sintéticos con valores en los bordes | ✅ Ninguna violación |
| Tamaños de pantalla | 9 tamaños de celular, tableta, computadora y proyector | ✅ Sin desplazamiento horizontal ni textos cortados; leyenda siempre visible; áreas táctiles de 44 px o más |
| Accesibilidad | axe-core 4.14 en 11 estados de la pantalla, más uso solo con teclado | ✅ 0 problemas (ni graves ni menores) |
| Compatibilidad | Sintaxis ES2017 y respaldo para navegadores sin `<dialog>` | ✅ (Safari y Firefox reales: pendiente, ver abajo) |
| Sin conexión | Doble clic con la red apagada; sitio publicado perdiendo la señal después de abrir | ✅ Todo funciona, incluidos cargar y exportar Excel |
| Tiempo de carga | Red y procesador limitados, mediana de 3 corridas | ✅ Lista en 1.6 s con 4G lento (meta: < 3 s) |
| Ningún dato sale del dispositivo | Registro de toda la red durante un recorrido completo, intentos deliberados de envío y revisión del código | ✅ Solo peticiones al propio sitio; la política de seguridad bloquea cualquier envío |
| Archivos maliciosos o dañados | Excel con código incrustado, archivo dañado, archivo que no es Excel, Excel vacío | ✅ No se ejecuta nada; mensajes claros; se conservan los datos |

Comandos (después de `npm install`): `npm test` (35), `npm run humo` (33) y `npm run validacion` (99 comprobaciones).

## 1. Cálculo y reglas duras
- Los dos ejemplos de `docs/modelo.md` (REP-0200: 21.15 puntos; REP-0083: 60.85) coinciden al centésimo.
- Todos los casos de prueba de `docs/datos.md` se comportan como se espera. Una prueba revisa que esa tabla siga
  coincidiendo con los datos.
- **Cálculo independiente:** se volvió a programar la fórmula por separado, sin usar el modelo, y se comparó en
  2,000 reportes sintéticos × 200 combinaciones de pesos y umbrales (400,000 evaluaciones). Coinciden el puntaje,
  la prioridad por puntaje, la prioridad final y el orden.
- **Reglas duras, revisadas directamente sobre los datos:**
  - cable caído o riesgo a la seguridad ⇒ siempre crítica;
  - severidad 4 o 500 usuarios o más ⇒ al menos alta;
  - una regla de prueba con "menor o igual que" se cumple;
  - una regla sobre una columna agregada por la persona funciona.

## 2. Tamaños de pantalla
| Tamaño | Grupo | Desbordes | Leyenda visible (y con detalle abierto) | Áreas táctiles |
|---|---|---|---|---|
| 360 × 640 | Celular Android pequeño | 0 | ✅ | ✅ |
| 390 × 844, agente de iPhone | Celular | 0 | ✅ | ✅ |
| 412 × 915, agente de Android | Celular | 0 | ✅ | ✅ |
| 768 × 1024 | Tableta vertical | 0 | ✅ | ✅ |
| 1024 × 768 | Tableta horizontal | 0 | ✅ | ✅ |
| 1366 × 768 | Computadora | 0 | ✅ | — |
| 1920 × 1080 | Computadora | 0 | ✅ | — |
| 1280 × 720 | Proyector | 0 | ✅ | — |
| 1024 × 768 al 125 % | Proyector con zoom | 0 | ✅ | — |

Cada tamaño tiene dos capturas en `docs/capturas/validacion/`: al abrir y con el detalle de un reporte.

## 3. Accesibilidad
- **axe-core** (reglas WCAG 2.x) en celular (inicio, lista, pesos, mapa, detalle, ayuda, carga de archivos) y en
  computadora (inicio, detalle, ayuda, carga): **0 problemas**.
- **Teclado:** se llega a la matriz y a la lista con Tab, Enter filtra y abre el detalle, el foco pasa al título,
  Escape cierra y regresa el foco al reporte, las flechas mueven los pesos y la ayuda abre y cierra.
- **Corregido durante la validación:**
  - Contraste del texto en los chips de prioridad. El blanco sobre naranja (3.8:1) y sobre azul (4.1:1) no
    alcanzaba el 4.5:1 que pide WCAG para texto pequeño. Ahora "Alta" lleva texto oscuro (4.6:1) y "Baja" un azul
    un poco más oscuro, `#3470b5`, con texto blanco (5.1:1). La paleta se volvió a validar para daltonismo:
    peor par 10.8, visión normal 15.9.
  - Botones de zoom del mapa: de 30 a 44 px.
  - Chips de filtros: de 36 a 44 px.
  - Etiquetas para lectores de pantalla de los botones de prioridad y de las celdas de la matriz: ahora contienen
    el texto visible.
  - Al cerrar el detalle, el foco no regresaba a la lista porque la lista se redibuja. Ahora se busca el reporte
    por su folio.

## 4. Compatibilidad
Solo hay Chromium en el entorno de prueba. Para los demás navegadores se revisó qué usa el sitio y desde qué versión
existe.

| Lo que usa el sitio | Safari / iOS | Chrome / Android | Firefox | Si no existe |
|---|---|---|---|---|
| JavaScript ES2017 (comprobado con el analizador `acorn`) | 11 | 58 | 53 | — |
| `Element.closest`, `Promise`, `String.normalize`, `Intl.NumberFormat` | 10 | 51 | 53 | — |
| `<dialog>` | 15.4 | 37 | 98 | **Respaldo probado** (atributo `open` y fondo con CSS) |
| `requestIdleCallback` | — | 47 | 55 | Respaldo con `setTimeout` |
| CSS `gap` en flexbox, `inset` | 14.1 | 84 | 63 | Se ve con menos espacio entre elementos |
| CSS `clamp()` | 13.1 | 79 | 75 | Texto en tamaño fijo |
| `:focus-visible`, `accent-color` | 15.4 | 86 / 93 | 85 / 92 | Se ignoran (cosmético) |
| Leaflet 1.9 | Navegadores actuales | | | — |

**Versiones recomendadas:** iOS/Safari 14.5 o más reciente, Chrome o Edge 90 o más, Firefox 90 o más (todas de 2021).

## 5. Sin conexión
- **Doble clic con la red apagada desde el inicio:** abre con los datos de ejemplo. Funcionan el mapa, los pesos, el
  detalle, cargar `reportes.xlsx` y exportar a Excel.
- **Sitio publicado, perdiendo la señal después de abrir:** todo lo anterior sigue funcionando. Para lograrlo se
  agregó una **precarga en segundo plano** de la biblioteca de Excel. Antes, cargar y exportar fallaban sin señal.
- **Limitaciones conocidas:**
  - En el sitio publicado, los botones "Descargar … de ejemplo" necesitan conexión, porque son enlaces a archivos.
  - Recargar la página sin señal no funciona, porque no hay service worker, por decisión de diseño.

## 6. Tiempo de carga y peso
Servidor local con compresión gzip, como GitHub Pages, y red limitada con las herramientas del navegador. Celular
emulado. Mediana de 3 corridas sin caché.

| Perfil | Red | Procesador | Primer contenido | Página leída | **Lista para usarse** |
|---|---|---|---|---|---|
| 4G lento | 1.6 Mbps, 150 ms | 4 veces más lento | 0.56 s | 1.47 s | **1.61 s** |
| 3G rápido | 750 kbps, 300 ms | 4 veces más lento | 1.04 s | 2.63 s | **2.75 s** |
| Sin límite | — | normal | 0.07 s | 0.14 s | **0.17 s** |

- **Primera carga:** 421 KB (122 KB comprimidos) en 22 archivos. La biblioteca de Excel (273 KB, 85 KB
  comprimidos) llega después, en segundo plano.
- **Mover un peso** (recalcular y redibujar todo):

  | Reportes | Procesador normal | Procesador 4 veces más lento |
  |---|---|---|
  | 200 | 13 ms | 74 ms |
  | 5,000 | 112 ms | 624 ms |

- **Corregido durante la validación:** con red lenta y procesador lento, el navegador pedía los 22 archivos de la
  página uno tras otro, y la herramienta tardaba **4.4 s** en estar lista. Se movieron los scripts al `<head>`
  con `defer`: ahora se piden todos a la vez y se ejecutan en el mismo orden. Resultado: **1.6 s**.

## 7. Ningún dato sale del dispositivo
- **Recorrido completo** (abrir, recorrido guiado, matriz, filtros, detalle, pesos, ayuda, cargar dos Excel,
  exportar): solo hubo peticiones a archivos del propio sitio. Cargar y exportar no hicieron **ninguna** petición.
- El servidor nunca recibió los pesos del enlace: viajan en el fragmento `#`, que el navegador no envía.
- No se crea ninguna cookie. `localStorage` solo guarda dos marcas: "ya vi el recorrido" y "cerré la bienvenida".
- **Intentos deliberados de envío** desde la página (`fetch`, `XMLHttpRequest`, `sendBeacon` e imagen hacia otro
  sitio): la política de seguridad (CSP) los bloqueó todos y **nada llegó a la red**.
- **Capa de calles:**
  - si se cancela el aviso, no pide nada;
  - si se acepta, solo pide imágenes a `tile.openstreetmap.org`, sin `Referer`.
- **Revisión del código de `sitio/js`:** no usa `fetch`, `XMLHttpRequest`, `sendBeacon`, `WebSocket`,
  `EventSource`, geolocalización ni cookies. Las únicas direcciones externas son los enlaces de atribución, la
  capa opcional y el repositorio.

## 8. Archivos maliciosos o dañados
- Un Excel con `<script>`, `<img onerror>` y `<svg onload>` en municipio, localidad, tipo, cuadrilla, descripción
  de un criterio y texto de una regla: **no se ejecutó nada**. Los textos se muestran tal cual y no generan
  peticiones.
- En estos 4 casos aparece un mensaje claro y se conservan los datos que había:
  - un `.xlsx` dañado;
  - un archivo que no es Excel;
  - un Excel con la hoja "Reportes" vacía;
  - un Excel solo con encabezados.

## Lo que no se pudo probar aquí
- **Safari (iPhone) y Firefox reales.** Se cubrieron con emulación de tamaño y agente, la revisión de compatibilidad
  y el respaldo de `<dialog>`, pero falta probarlos en dispositivos físicos.
- **Celulares físicos:** gestos reales en el mapa, teclado en pantalla y lectores de pantalla (VoiceOver, TalkBack).
- **El sitio publicado en GitHub Pages:** se simuló con un servidor local con compresión.

## Lista de verificación manual (para la Fase 6, con el enlace publicado)
- [ ] iPhone con Safari: abre por QR, se ve la leyenda, se navega por las 4 pestañas y se acerca el mapa con dos dedos.
- [ ] Android con Chrome: lo mismo.
- [ ] Computadora con Firefox y con Edge: tres columnas, detalle lateral, exportar a Excel.
- [ ] Proyector o pantalla externa: legible desde el fondo del salón.
- [ ] Descargar los Excel de ejemplo, editarlos, volver a cargarlos y ver el cambio.
- [ ] Mover un peso, copiar el enlace, abrirlo en otro celular y ver los mismos pesos.
- [ ] Abrir, activar modo avión, cargar un Excel y exportar.
- [ ] Probar el recorrido guiado y la ayuda con VoiceOver o TalkBack, al menos una vez.
