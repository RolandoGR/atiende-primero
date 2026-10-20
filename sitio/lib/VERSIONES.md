# Bibliotecas incluidas

Se incluyen copias locales para que la herramienta funcione sin conexión y sin cargar nada de internet.

| Biblioteca | Versión | Licencia | Origen | Archivos | SHA-256 |
|---|---|---|---|---|---|
| SheetJS Community Edition (versión "mini": lee y escribe .xlsx) | 0.20.3 | Apache 2.0 (`sheetjs/LICENSE`) | https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.mini.min.js | `sheetjs/xlsx.mini.min.js` | `0cb353f830d7288385492c83d277b058ddeac664ca51cf1393aa1fd3e2b70939` |
| Leaflet | 1.9.4 | BSD-2-Clause (`leaflet/LICENSE`) | paquete npm `leaflet@1.9.4` (integridad verificada por npm) | `leaflet/leaflet.js` | `db49d009c841f5ca34a888c96511ae936fd9f5533e90d8b2c4d57596f4e5641a` |
| | | | | `leaflet/leaflet.css` | `a7837102824184820dfa198d1ebcd109ff6d0ff9a2672a074b9a1b4d147d04c6` |

Notas:
- No se usa el paquete `xlsx` de npm: está congelado en la versión 0.18.5, con vulnerabilidades conocidas.
  SheetJS publica las versiones vigentes solo en `cdn.sheetjs.com`.
- Se eligió la versión "mini" de SheetJS (≈280 KB, 86 KB comprimida) porque solo se necesitan archivos `.xlsx`.
  Se carga únicamente al subir o exportar un Excel.
- Para verificar: `sha256sum sitio/lib/*/*.js sitio/lib/*/*.css`.
