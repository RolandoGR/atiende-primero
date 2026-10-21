# Mapa de Sonora: fuentes, términos de uso y preparación

## Qué se usa
| Dato | Fuente | Para qué |
|---|---|---|
| Límites de los 72 municipios | **INEGI, Marco Geoestadístico, Encuesta Intercensal 2025** (archivo `26_sonora.zip`, capa `26mun`, corte cartográfico de noviembre de 2025, publicado en agosto de 2026) | Dibujar el mapa en el sitio (`sitio/datos/municipios.js`) |
| Población por municipio y localidades con coordenadas | **INEGI, Censo de Población y Vivienda 2020, Principales resultados por localidad (ITER), Sonora** | Repartir los reportes ficticios según la población y ubicarlos cerca de localidades reales (`scripts/referencia/*.csv`) |

Ligas de descarga:
- Marco Geoestadístico (ficha): https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=794551196649
  · archivo de Sonora: `https://www.inegi.org.mx/contenidos/productos/prod_serv/contenidos/espanol/bvinegi/productos/geografia/marcogeo/794551196649/26_sonora.zip`
  (SHA-256 `2728615ec585624ad0e9b9becbc05bd6febd723c546834d301c5394eeac0b3b2`, 73 MB)
- ITER 2020 de Sonora: `https://www.inegi.org.mx/contenidos/programas/ccpv/2020/datosabiertos/iter/iter_26_cpv2020_csv.zip`
  (SHA-256 `4ad9380527c248bb236bd90eefed760b0f8796eaeab7c469f95ead033e96dee2`)

Los archivos originales se guardan en `fuentes/inegi/` y **no** se suben al repositorio; los scripts los descargan
y verifican su huella.

### Por qué esta edición
El INEGI publica varias ediciones del Marco Geoestadístico (2020, 2021, 2022, 2023, 2024, 2025 y Encuesta
Intercensal 2025). Se eligió la más reciente disponible al 20 de octubre de 2026. Su léeme indica que es la base
del Marco Geoestadístico 2026.

## Términos de uso
La información del INEGI se usa conforme a los **Términos de Libre Uso de la Información del INEGI**
(https://www.inegi.org.mx/inegi/terminos.html). En resumen, permiten copiar, distribuir, publicar, adaptar,
extraer y usar la información, con estas obligaciones:

1. **Dar crédito al INEGI** con la forma "Fuente: INEGI, *nombre del producto*".
2. **Avisar de cualquier transformación** y no presentarla como si la hubiera hecho el INEGI.
3. **No aparentar una postura oficial** ni que el INEGI avala, integra, patrocina o apoya el uso.

Cómo se cumple en este proyecto:
- Crédito, visible en el pie del mapa del sitio, en la documentación y en el README:
  > Fuente: INEGI, Marco Geoestadístico, Encuesta Intercensal 2025 (límites municipales, simplificados).
  > Fuente: INEGI, Censo de Población y Vivienda 2020, ITER (población y ubicación de localidades).
- Aviso de transformación: los límites fueron **simplificados y reproyectados**. No son una representación oficial
  y no deben usarse para medir distancias ni superficies.
- Los reportes, folios, cuadrillas y cifras de la herramienta son **ficticios**. El INEGI no tiene relación con ellos.
- El léeme del producto prohíbe reproducirlo "con fines de lucro". Este proyecto es didáctico y sin fines de lucro.

## Cómo se preparó el mapa (`scripts/preparar_mapa.sh`)
1. Descarga `26_sonora.zip` y verifica su huella SHA-256.
2. Extrae solo la capa de municipios (`26mun`, 72 polígonos, proyección Cónica Conforme de Lambert, ITRF2008).
3. Con **mapshaper 0.7.91**:
   - `snap` + `clean`: une vértices a menos de 2 m y rellena huecos pequeños entre municipios. El INEGI advierte
     hasta 1 m de huecos o traslapes; sin este paso la simplificación dejaba 157 cruces entre bordes.
   - `simplify 3% visvalingam weighted keep-shapes`: conserva el 3 % de los vértices sin eliminar ningún municipio.
   - `proj wgs84`: convierte a latitud y longitud, el sistema que usa Leaflet.
   - Conserva solo `clave` (CVEGEO, p. ej. `26030`) y `nombre` (NOMGEO, p. ej. `Hermosillo`).
   - Redondea las coordenadas a 4 decimales (≈ 11 m).
4. Guarda el resultado como `window.MUNICIPIOS_SONORA = {...}` en `sitio/datos/municipios.js`. Es un archivo `.js`,
   no `.json`, porque los navegadores no permiten leer `.json` con `fetch()` cuando la página se abre con doble clic.

**Resultado:** 72 municipios, **99 KB** (26 KB comprimido con gzip).

Se compararon visualmente simplificaciones al 2 % (72 KB) y al 3 % (99 KB). Se eligió 3 % porque los municipios
pequeños de la sierra conservan mejor su forma y sigue por debajo de la meta de 150 KB.

## Localidades y población (`scripts/preparar_localidades.py`)
- Del ITER 2020 se toman los 72 municipios con su población total y las localidades con **500 habitantes o más**,
  más todas las cabeceras municipales: **275 localidades** con nombre, coordenadas y población.
- Solo se usan datos públicos y agregados (nombres de lugares, coordenadas y población total). No hay datos de personas.
- Diferencias de nombres: el Censo 2020 escribe "Alamos" y "Onavas"; el Marco Geoestadístico 2025, "Álamos" y
  "Ónavas". La herramienta usa siempre los nombres del Marco Geoestadístico 2025 y cruza las fuentes por clave.

## Capa opcional de calles
Puede activarse una capa de OpenStreetMap si hay conexión. Viene **apagada**, porque al activarla el navegador pide
imágenes a un servidor externo. La herramienta funciona completa sin ella.

- **Política de uso de OpenStreetMap:** sus servidores son de voluntarios y exigen saber desde qué sitio se piden
  las imágenes (encabezado `Referer`). La capa envía **solo el dominio** (`https://rolandogr.github.io/`), sin ruta
  ni `#pesos`. El resto de la página no envía nada.
- **Con doble clic (`file://`) no está disponible:** no hay dominio que enviar y OpenStreetMap bloquearía las
  imágenes.
- Es para uso ligero, como una demostración. Un uso intensivo debería usar un proveedor de mapas propio o contratado.
