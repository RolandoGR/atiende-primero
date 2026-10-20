#!/usr/bin/env bash
# Prepara el mapa de los 72 municipios de Sonora para el sitio.
#
# Fuente: INEGI, Marco Geoestadístico, Encuesta Intercensal 2025 (archivo 26_sonora.zip).
# Resultado: sitio/datos/municipios.js  (GeoJSON en WGS84, simplificado, ~100 KB)
#
# Pasos:
#   1. Descarga 26_sonora.zip a fuentes/inegi/ (si no existe) y verifica su huella SHA-256.
#   2. Extrae solo la capa de municipios (26mun).
#   3. Con mapshaper: ajusta bordes (snap + clean), simplifica al 3 % conservando la forma
#      de cada municipio, reproyecta de Cónica Conforme de Lambert a WGS84 (lat/lon)
#      y conserva solo clave (CVEGEO) y nombre (NOMGEO).
#   4. Envuelve el GeoJSON en una variable global para que funcione abriendo el sitio
#      con doble clic (los navegadores bloquean fetch() en file://).
#
# Uso: bash scripts/preparar_mapa.sh      (requiere Node.js; mapshaper se baja con npx)
set -euo pipefail

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
FUENTES="$RAIZ/fuentes/inegi"
ZIP="$FUENTES/26_sonora.zip"
URL="https://www.inegi.org.mx/contenidos/productos/prod_serv/contenidos/espanol/bvinegi/productos/geografia/marcogeo/794551196649/26_sonora.zip"
SHA256="2728615ec585624ad0e9b9becbc05bd6febd723c546834d301c5394eeac0b3b2"
MAPSHAPER="mapshaper@0.7.91"
SIMPLIFICACION="3%"
SALIDA="$RAIZ/sitio/datos/municipios.js"

mkdir -p "$FUENTES"
if [ ! -f "$ZIP" ]; then
  echo "Descargando Marco Geoestadístico de Sonora (73 MB)..."
  curl -sS --fail -o "$ZIP" "$URL"
fi

echo "Verificando huella del archivo..."
echo "$SHA256  $ZIP" | sha256sum -c - || {
  echo "AVISO: la huella no coincide. El INEGI pudo haber actualizado el archivo; revisa la versión antes de continuar." >&2
  exit 1
}

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
unzip -q -o "$ZIP" 'conjunto_de_datos/26mun.*' -d "$TMP"

npx -y "$MAPSHAPER" \
  -i "$TMP/conjunto_de_datos/26mun.shp" encoding=latin1 snap snap-interval=2 \
  -clean gap-fill-area=10000m2 sliver-control=1 \
  -simplify "$SIMPLIFICACION" visvalingam weighted keep-shapes \
  -clean \
  -proj wgs84 \
  -filter-fields CVEGEO,NOMGEO \
  -rename-fields clave=CVEGEO,nombre=NOMGEO \
  -o "$TMP/municipios.json" format=geojson precision=0.0001

{
  echo "// Límites municipales de Sonora (72 municipios), simplificados para uso didáctico."
  echo "// Fuente: INEGI, Marco Geoestadístico, Encuesta Intercensal 2025. Geometría simplificada; no es una representación oficial."
  echo "// Generado con scripts/preparar_mapa.sh. No editar a mano."
  printf "window.MUNICIPIOS_SONORA = "
  cat "$TMP/municipios.json"
  echo ";"
} > "$SALIDA"

echo "Listo: $SALIDA ($(wc -c < "$SALIDA") bytes; $(gzip -c "$SALIDA" | wc -c) bytes comprimido)"
