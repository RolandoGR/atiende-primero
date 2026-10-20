# Atiende Primero · priorizador de reportes de fallas

Herramienta de **ejemplo didáctico con datos ficticios**. Lee reportes de fallas desde Excel, calcula una
prioridad explicable (criterios con pesos editables + reglas duras) y la muestra en un dashboard con un mapa
de los municipios de Sonora, una matriz impacto/urgencia y una lista de atención.

Se preparó para una charla sobre IA y toma de decisiones en Hermosillo, Sonora. El público entra por QR,
sobre todo desde el celular, y debe poder **replicar el proceso** con Claude Code. El proceso importa tanto
como el software.

- Repositorio: `RolandoGR/atiende-primero` (público)
- Publicación: GitHub Pages vía GitHub Actions, solo la carpeta `sitio/` → `https://rolandogr.github.io/atiende-primero/`

## Principios que no se negocian
1. **Datos 100% ficticios.** Sin nombres de personas, números de servicio ni datos personales.
2. **No es un sistema oficial.** El nombre y la interfaz no usan "CFE", logotipos ni identidad gráfica de
   ninguna institución. La leyenda "Ejemplo didáctico con datos ficticios" siempre está visible. La mención
   a la charla va solo en la documentación. La información se organiza por **municipio** (información pública);
   no inventar estructura interna de ninguna empresa.
3. **Todo se procesa en el navegador.** Sin servidor, sin bases de datos externas, sin analítica ni rastreo.
   La interfaz dice "Tus archivos no salen de tu dispositivo" e invita a no cargar datos reales.
4. **Funciona sin conexión** una vez abierta: bibliotecas y geometría incluidas en el proyecto.
5. **Cada prioridad se puede explicar**: desglose de cuánto aportó cada criterio y qué reglas aplicaron.
6. **Criterios y pesos editables** desde Excel o desde la interfaz, sin tocar código.
7. **Reglas duras** que el puntaje no puede contradecir (p. ej., cable caído o riesgo a la seguridad = crítica).
8. **Documentar cada paso mientras se construye**, no al final.

## Forma de trabajo
- Por fases (0 a 6). Al terminar cada fase: detenerse, resumir y esperar aprobación.
- Antes de una decisión de diseño importante: proponer opciones con ventajas y desventajas y preguntar.
- `docs/bitacora.md`: registrar **cada instrucción del usuario de forma textual**, lo que se hizo, las
  decisiones y por qué. Actualizarla durante el trabajo, no al final.
- Hacer commit y push al cerrar cada fase (el entorno de trabajo es temporal).

## Convenciones técnicas
- **Idioma:** español en interfaz, documentación, nombres de archivos, variables y comentarios.
- **Sitio estático sin compilación:** HTML + CSS + JavaScript "a mano", sin framework ni empaquetador.
- **Debe funcionar con doble clic (`file://`):**
  - Solo `<script>` clásicos; **nada de `type="module"`** ni `import`/`export`.
  - **Nada de `fetch()`** para datos propios: los datos de ejemplo y la geometría son archivos `.js` que
    asignan una variable global (`window.DATOS_EJEMPLO = {...}`, `window.MUNICIPIOS_SONORA = {...}`).
- **Sin peticiones externas:** sin CDN, fuentes web, analítica ni rastreo. Las bibliotecas viven en `sitio/lib/`
  con su archivo de licencia. Única excepción: la capa opcional de calles (OpenStreetMap), apagada por defecto
  y con aviso.
- Los pesos compartidos viajan en el **fragmento** de la URL (`#pesos=...`), que el navegador no envía al servidor.
- `sitio/js/modelo.js` es **puro** (sin DOM) para poder probarlo en Node y en el navegador.
- Colores de prioridad accesibles (contraste suficiente y nunca solo color: también texto o icono).
- Diseño **primero para celular**; también debe verse bien en computadora y proyector.

## Estructura
```
CLAUDE.md, README.md, LICENSE, .gitignore
docs/        bitacora.md, datos.md, mapa.md, modelo.md, guia-replicar.md, adaptar-a-mi-area.md, limitaciones.md, capturas/
scripts/     generar_datos.py (semilla fija), preparar_mapa.sh (mapshaper), requirements.txt
fuentes/     insumos crudos del INEGI (no se versionan)
datos/       reportes.xlsx, criterios.xlsx (fuente editable)
sitio/       ← lo único que se publica: index.html, documentacion.html, css/, js/, lib/, datos/, descargas/
pruebas/     apoyo.js, modelo.test.js, lectura.test.js (node --test), e2e/ (Playwright)
```

## Comandos
```bash
# Datos de ejemplo (semilla fija; archivos idénticos en cada ejecución)
python3 -m pip install -r scripts/requirements.txt
python3 scripts/generar_datos.py          # datos/*.xlsx, sitio/descargas/*.xlsx, sitio/datos/ejemplo.js

# Referencias del INEGI (solo para rehacerlas; descargan a fuentes/ y verifican SHA-256)
python3 scripts/preparar_localidades.py   # scripts/referencia/*.csv (Censo 2020, ITER)
bash scripts/preparar_mapa.sh             # sitio/datos/municipios.js (Marco Geoestadístico EIC 2025, mapshaper)

# Pruebas del modelo y de la lectura de Excel (31 pruebas; Node 22 no acepta una carpeta, usar el patrón)
node --test "pruebas/*.test.js"

# Usar la herramienta: abrir sitio/index.html con doble clic, o servirla localmente
python3 -m http.server -d sitio 8000
```

## Datos
- `ejemplo.js` guarda las hojas de los Excel tal cual (`{reportes: {Reportes: [[encabezados], ...]}, criterios: {...}}`)
  para que el sitio procese el ejemplo y los archivos subidos con el mismo código.
- Encabezados legibles en español ("Fecha y hora de alta"); el sitio debe reconocerlos sin importar mayúsculas,
  acentos ni espacios.
- Horas abiertas se miden contra la **fecha de corte** de la hoja "Acerca de" (2026-10-19 08:00), no contra la hora actual.
- Reglas duras en `criterios.xlsx` hoja "Reglas": Campo · Condición · Valor · Prioridad mínima. Solo suben la prioridad.
- Los municipios se nombran como en el Marco Geoestadístico 2025 y se cruzan por clave INEGI (`26030` = Hermosillo).
- Casos de prueba con folio fijo: ver `docs/datos.md`.

## Modelo (ver `docs/modelo.md`)
- Puntaje 0–100 = Σ peso × valor (0–1) × 100 ÷ Σ pesos. Severidad, usuarios y recurrencia se convierten con la hoja
  **Escalas** ("A partir de" → valor); tiempo = mín(horas ÷ plazo, 1); riesgo Sí = 1.
- Prioridad final = máx(prioridad por umbrales, prioridad mínima de cada regla que se cumple). Las reglas nunca
  bajan la prioridad ni cambian el puntaje.
- Impacto y urgencia: promedios ponderados por eje (columna "Eje de la matriz"); matriz 3 × 3 con cortes 0.33 y 0.67.
- Orden: prioridad, puntaje, % del plazo consumido, folio. Los cerrados no cuentan en indicadores ni matriz.
- Carga en el navegador, en este orden: `modelo.js` → `lectura.js` (exponen `window.Modelo` y `window.Lectura`;
  en Node, `module.exports`).
- Leer Excel con SheetJS: `XLSX.read(datos, {cellDates: true})` y `sheet_to_json(hoja, {header: 1, defval: null,
  blankrows: false})`, y pasar las hojas a `Lectura.leerReportes` / `Lectura.leerCriterios`.
- Cualquier cambio a la fórmula debe actualizar `docs/modelo.md` y sus ejemplos a mano (están en las pruebas).

## Fuentes y licencias
- Código: MIT. Documentación y datos ficticios: CC BY 4.0.
- Límites municipales: INEGI, Marco Geoestadístico, Encuesta Intercensal 2025 (simplificado). Población y
  localidades: INEGI, Censo 2020 (ITER). Términos de Libre Uso del INEGI: citar la fuente, avisar que se
  transformó y no aparentar postura oficial. Ver `docs/mapa.md`.
- Bibliotecas: SheetJS Community Edition 0.20.3 "mini" (Apache 2.0), Leaflet 1.9.4 (BSD-2-Clause). Ver `sitio/lib/VERSIONES.md`.

## Estado
- Fase 0 (plan): terminada.
- Fase 1 (datos y mapa): terminada.
- Fase 2 (modelo): terminada, pendiente de aprobación. Ver `docs/bitacora.md`.
