# Bitácora del proyecto · Atiende Primero

Registro del proceso de construcción con Claude Code. Cada entrada incluye la **instrucción textual** que se
dio, lo que se hizo, las decisiones tomadas y por qué. Sirve para que cualquier persona pueda repetir el proceso
(ver también `guia-replicar.md`, Fase 5).

**Convenciones de esta bitácora**
- 🗣️ **Instrucción**: texto exacto que escribió la persona usuaria (sin corregir).
- ❓ **Pregunta de Claude** y ✅ **Respuesta**: decisiones tomadas en conversación.
- 🔧 **Qué se hizo**: acciones concretas y archivos creados o modificados.
- ⚖️ **Decisión y por qué**.

---

## Fase 0 · Plan — 2026-10-20

### 🗣️ Instrucción inicial (textual)

~~~~markdown
# Proyecto: Priorizador de reportes de fallas (herramienta de ejemplo)

## Contexto
Este proyecto es un ejemplo didáctico para una charla sobre IA y toma de decisiones dirigida a mandos medios y altos de la Comisión Federal de Electricidad (CFE) en Hermosillo, Sonora. El propósito es construir, con Claude Code, una herramienta que lea reportes de fallas desde archivos de Excel, calcule una prioridad de atención con criterios configurables y la muestre en un dashboard con un mapa de Sonora y una matriz de prioridad.

La herramienta se publicará en mi página personal y la audiencia entrará con un código QR, sobre todo desde el celular, para explorarla por su cuenta. Además, la audiencia debe poder replicar el proceso y adaptarlo a su propia área, así que el proceso importa tanto como el software.

## Principios que no se negocian
1. Datos 100% ficticios: reportes, folios, cuadrillas y cifras inventados. Sin nombres de personas, números de servicio ni datos personales de ningún tipo.
2. No es un sistema oficial: el nombre de la herramienta no incluye "CFE", no usa logotipos ni identidad gráfica de la institución, y muestra de forma visible "Ejemplo didáctico con datos ficticios". La mención a la charla en CFE va solo en la documentación. No inventes la estructura interna de la empresa; organiza la información por municipio, que es información pública.
3. Todo se procesa en el navegador de quien la usa: sin servidor, sin bases de datos externas, sin analítica ni rastreo. La interfaz lo dice claramente ("Tus archivos no salen de tu dispositivo") e invita a no cargar datos reales de ninguna institución.
4. Funciona sin conexión una vez abierta: bibliotecas y datos geográficos incluidos en el proyecto.
5. Cada prioridad debe poder explicarse: el usuario puede ver qué criterios sumaron cuánto al puntaje de cada reporte.
6. Los criterios y sus pesos se editan desde Excel o desde la interfaz, sin tocar código.
7. Existen reglas duras que el puntaje no puede contradecir (por ejemplo, un cable caído o cualquier riesgo a la seguridad siempre es prioridad crítica).
8. Documentar cada paso mientras se construye, no al final.

## Forma de trabajo
- Trabaja por fases. Al terminar cada fase, detente, resume lo que hiciste y espera mi aprobación antes de continuar.
- Antes de cualquier decisión de diseño importante (estructura de datos, fórmula, diseño visual, fuentes de datos geográficos, publicación), propón opciones con sus ventajas y desventajas y pregúntame.
- Mantén el archivo `docs/bitacora.md` actualizado: registra cada instrucción que te doy (textual), lo que hiciste, las decisiones tomadas y por qué.
- Crea y mantén un `CLAUDE.md` con el contexto del proyecto, las convenciones y los comandos para ejecutarlo.

## Fase 0. Plan
- Propón la estructura de carpetas, el nombre de la herramienta y el plan de trabajo.
- Tecnología: sitio estático (HTML, CSS y JavaScript, sin servidor) que funcione igual abierto con doble clic en la computadora y publicado en una página web. Lectura y escritura de Excel en el navegador con SheetJS. Las bibliotecas van incluidas en el proyecto, no cargadas desde internet. Python con openpyxl solo para generar los datos de ejemplo.
- Mapa de Sonora: propón cómo incluir los límites de los 72 municipios a partir de datos públicos del INEGI (Marco Geoestadístico), simplificados para que pesen poco y carguen rápido en el celular. Documenta la fuente y sus términos de uso. Un mapa de calles en línea puede ser una capa opcional, nunca un requisito.
- Pregúntame cómo está alojada mi página personal para planear la publicación.

## Fase 1. Datos de ejemplo en Excel
Genera con un script reproducible (`scripts/generar_datos.py`, semilla fija):
- `datos/reportes.xlsx`, hoja "Reportes", con unos 300 reportes de fallas ficticios en municipios de Sonora, con más reportes en los municipios más poblados (Hermosillo, Cajeme, Nogales, San Luis Río Colorado, Navojoa, Guaymas, entre otros). Coordenadas aproximadas cerca de las localidades, con una dispersión aleatoria. Columnas sugeridas: folio, fecha y hora de alta, municipio, localidad, latitud, longitud, tipo de falla (sin servicio, variación de voltaje, poste dañado, cable caído, transformador dañado, alumbrado, otro), severidad (1 a 4), usuarios afectados (estimado), horas abiertas, plazo de atención en horas, estado (abierto, en proceso, cerrado), riesgo a la seguridad (sí/no), reportes previos en la misma localidad en los últimos 30 días y cuadrilla asignada (etiqueta genérica, como "Cuadrilla 07").
- `datos/criterios.xlsx`, con la hoja "Pesos" (criterio, descripción, peso), la hoja "Umbrales" (cortes de prioridad crítica, alta, media y baja) y la hoja "Reglas" (reglas duras en lenguaje claro).
- Incluye a propósito algunos casos que pongan a prueba las reglas: un cable caído con pocos usuarios afectados (puntaje bajo pero regla dura crítica), reportes vencidos respecto a su plazo y una localidad con muchos reportes recurrentes.
- Además de los archivos, deja los mismos datos de ejemplo incluidos en el sitio para que la herramienta funcione al abrirla, sin cargar nada.
- Documenta en `docs/datos.md` qué contiene cada columna, cómo se generó y que todo es ficticio.

## Fase 2. Modelo de priorización
- Propón una fórmula simple y explicable: un puntaje de 0 a 100 igual a la suma ponderada de criterios normalizados de 0 a 1, más las reglas duras.
- Criterios iniciales sugeridos: severidad, usuarios afectados, horas abiertas respecto al plazo, recurrencia en la localidad y riesgo a la seguridad.
- Define dos ejes para la matriz: impacto (severidad y usuarios afectados) y urgencia (tiempo respecto al plazo y recurrencia).
- Cada reporte debe conservar el desglose: cuánto aportó cada criterio y si alguna regla dura cambió su categoría.
- Documenta la fórmula en `docs/modelo.md` con un ejemplo calculado a mano.

## Fase 3. Dashboard
- Inicio: la herramienta abre con los datos de ejemplo ya cargados y un aviso breve de qué es y cómo usarla.
- Carga propia: arrastrar o seleccionar `reportes.xlsx` y `criterios.xlsx`, con mensajes claros si falta una columna o un dato no es válido. Botones para descargar los Excel de ejemplo y para volver a los datos de ejemplo.
- Indicadores: total de reportes abiertos, reportes por prioridad, reportes vencidos, usuarios afectados y tiempo promedio abierto.
- Mapa de Sonora: municipios coloreados según la concentración de prioridad y reportes como puntos coloreados por prioridad, con acercamiento a un municipio al seleccionarlo.
- Matriz de prioridad: mapa de calor de impacto contra urgencia; al seleccionar una celda se filtran los reportes correspondientes.
- Lista de atención: tabla ordenada por prioridad, con filtros por municipio, tipo de falla, estado y prioridad.
- Detalle: al seleccionar un reporte, se muestra el desglose de su puntaje y las reglas aplicadas.
- Ajuste en vivo: controles para cambiar los pesos y ver cómo se reordenan la lista, el mapa y la matriz, con un botón para restablecer los valores originales.
- Compartir configuración: los pesos ajustados se reflejan en el enlace, para que alguien pueda compartir su priorización.
- Ayuda integrada: un recorrido guiado corto la primera vez y un panel "¿Cómo se calcula la prioridad?" con la fórmula en lenguaje claro.
- Exportar la lista priorizada a Excel.
- Diseño: prioridad al celular (los usuarios llegarán por QR), que también se vea bien en computadora y en un proyector. Sobrio, legible, con colores de prioridad accesibles y la leyenda "Ejemplo didáctico con datos ficticios" siempre visible. Enlace visible a la documentación del proyecto.

## Fase 4. Validación
- Pruebas del cálculo con casos conocidos (incluidos los casos de prueba de la fase 1).
- Revisión de que las reglas duras siempre se cumplan.
- Pruebas en tamaños de pantalla de celular, tableta y computadora, y en los navegadores más comunes.
- Prueba completa sin conexión a internet y medición del tiempo de carga.
- Revisión de que ningún dato se envía fuera del navegador.

## Fase 5. Documentación para la audiencia
En la carpeta `docs/`:
- `guia-replicar.md`: guía paso a paso para que alguien sin experiencia en programación reproduzca el proyecto con Claude Code, incluidos los prompts usados en cada fase.
- `adaptar-a-mi-area.md`: cómo cambiar los datos, los criterios y las reglas para otro tipo de reportes o tareas.
- `bitacora.md`: el registro completo del proceso.
- `limitaciones.md`: qué no hace la herramienta, qué decisiones siguen siendo humanas y qué haría falta para usar datos reales (autorización, clasificación de la información, herramientas institucionales).
- Un `README.md` con capturas de pantalla, instrucciones para usar y publicar la herramienta y la estructura del proyecto.
- Una página de documentación dentro del sitio, en lenguaje claro, que reúna lo anterior para quien llegue desde el QR.

## Fase 6. Publicación
- Prepara la carpeta lista para subir a mi página personal, según cómo esté alojada.
- Agrega una licencia libre para el código (propón cuál) y respeta los términos de uso de los datos del INEGI.
- Lista de verificación final: probar el enlace publicado en varios celulares, revisar que los Excel de ejemplo se descarguen y que la página de documentación esté enlazada.
- Genera el código QR del enlace final en formato de imagen para la presentación.

## Criterios de aceptación
- Al abrir el enlace desde un celular, la herramienta funciona de inmediato con los datos de ejemplo.
- Funciona igual abierta con doble clic en la computadora y sin conexión.
- Cambiar un peso (en Excel o en la interfaz) cambia el orden de la lista, el mapa y la matriz sin tocar código.
- Cada puntaje se puede explicar desde la interfaz.
- Las reglas duras nunca se violan.
- Ningún dato sale del dispositivo de quien la usa.
- Una persona puede seguir `guia-replicar.md` y llegar al mismo resultado.

Empieza por la Fase 0: propón el plan y la estructura, hazme las preguntas necesarias y espera mi aprobación.
~~~~

> Nota: la sesión se inició en **modo plan** de Claude Code, en el que Claude solo puede leer e investigar
> y debe presentar un plan para aprobación antes de crear o modificar archivos.

### 🔧 Revisión del entorno
- La carpeta de trabajo estaba vacía: el proyecto parte de cero.
- Herramientas disponibles: Python 3 con openpyxl 3.1.5, Node.js 22, npm, git y Chromium (para pruebas con Playwright).
- La red del entorno de trabajo **bloqueó** `www.inegi.org.mx` (mapa de municipios) y `cdn.sheetjs.com`
  (SheetJS). El registro de npm sí responde.
  - ⚖️ No se usará el paquete `xlsx` de npm: está congelado en la versión 0.18.5, que tiene vulnerabilidades
    conocidas al leer archivos manipulados. La versión vigente de SheetJS solo se publica en `cdn.sheetjs.com`.

### ⚖️ Decisión técnica: que funcione con doble clic
Cuando una página se abre como archivo local (`file://`), los navegadores bloquean `fetch()` y los módulos de
JavaScript (`type="module"`). Para que la herramienta funcione igual con doble clic que publicada en la web:
- Solo se usan `<script>` clásicos, sin compilación ni framework.
- Los datos de ejemplo y el mapa se guardan como archivos `.js` que crean una variable global, en lugar de `.json`.

### ❓ Preguntas de Claude y ✅ respuestas (ronda 1)
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Cómo está alojada tu página personal? | GitHub Pages · Netlify/Vercel/Cloudflare · Hosting propio (FTP/cPanel) · WordPress/Wix/Squarespace | **GitHub Pages** |
| ¿Dónde quieres que viva el código? | Repo público nuevo en GitHub (recomendado) · Repo privado · Un repo existente | **Repo público nuevo en GitHub** |
| ¿Qué nombre prefieres? | Atiende Primero (recomendado) · Semáforo de Fallas · Triage de Reportes · PrioriMapa Sonora | **Atiende Primero** |
| INEGI y SheetJS están bloqueados, ¿cómo lo resolvemos? | Habilito esos dominios (recomendado) · Yo subo los archivos · Decidir en la Fase 1 | **Habilito esos dominios** |

### ❓ Preguntas de Claude y ✅ respuestas (ronda 2)
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Cómo dibujamos el mapa? | Leaflet local (recomendado) · SVG propio | 🗣️ *"revisa el repo de los webscrapers porque creo que para el alcance que buscamos, tal vez leaflet no funcionaría. Quiero que aparezcan 200 reportes aprox"* |
| ¿Qué licencia libre usamos? | MIT + CC BY 4.0 (recomendado) · Apache 2.0 + CC BY 4.0 · Solo MIT | **MIT + CC BY 4.0** |
| ¿Cómo creamos el repo público? | Lo creo yo vacío y te aviso · Otro nombre de repo | **Lo creo yo vacío y te aviso** |
| ¿Cómo publicamos solo `sitio/` en GitHub Pages? | GitHub Actions (recomendado) · Copiar a mi repo de página · Dominio propio | **GitHub Actions** |

### 🔧 Seguimiento sobre el mapa
- No hay un repositorio con "scraper" en el nombre en la cuenta. Claude preguntó cuál era; la respuesta fue
  *sin preferencia*. Claude pidió acceso a los tres candidatos (`ladrilleros`, `sonora-fit-hub`,
  `sonora-gym-connect`) y **el acceso fue rechazado**, así que no se revisaron.
- ❓ Claude explicó que Leaflet dibuja miles de puntos sin problema (200 es poco, incluso en celular) y preguntó
  qué preocupaba. ✅ Respuesta: **"Leaflet está bien con 200"**.

### ⚖️ Decisiones de la Fase 0
| Tema | Decisión | Por qué |
|---|---|---|
| Nombre | **Atiende Primero** · priorizador de reportes de fallas | Claro, orientado a la acción, sin referencias institucionales. |
| Tecnología | HTML + CSS + JS sin compilación; `<script>` clásicos; datos como `.js` | Funciona con doble clic y publicado; fácil de leer y replicar. |
| Excel | SheetJS (versión vigente) en `sitio/lib/`, cargado solo al subir o exportar | Primera carga ligera en celular; los datos de ejemplo ya vienen en `.js`. |
| Mapa | **Leaflet** local con dibujo en canvas; capa de calles OpenStreetMap solo opcional y apagada | Gestos de acercamiento en celular y zoom a municipio listos; 200 puntos son ligeros. |
| Geometría | INEGI, Marco Geoestadístico, municipios de Sonora; reproyectada a WGS84 y simplificada con mapshaper (meta ≤ 150 KB) | Fuente pública y oficial; simplificada para cargar rápido. |
| Volumen de datos | **~200 reportes** (la instrucción inicial decía ~300) | Pedido del usuario en la ronda 2. |
| Privacidad | Sin analítica, sin CDN, sin fuentes web; pesos compartidos en el fragmento `#` de la URL | El fragmento no se envía al servidor; nada sale del dispositivo. |
| Repositorio | Público, `RolandoGR/atiende-primero` | La audiencia puede ver código, bitácora y prompts. |
| Publicación | GitHub Pages vía GitHub Actions, solo `sitio/` | Documentación y scripts no se mezclan con el sitio. |
| Licencia | MIT (código) + CC BY 4.0 (documentación y datos ficticios) + atribución INEGI | Simple y permisiva; compatible con los términos de uso del INEGI. |
| Pruebas | `node --test` para el modelo; Playwright con Chromium para pantallas | Sin dependencias pesadas; Firefox/Safari se revisan a mano en la Fase 6. |

### 🗣️ Aprobación
El plan se aprobó en Claude Code ("User has approved your plan").

### 🔧 Qué se hizo tras la aprobación
- Se creó la carpeta `atiende-primero/` con la estructura acordada (`docs/`, `scripts/`, `fuentes/`, `datos/`,
  `sitio/`, `pruebas/`) y se inicializó git en la rama `main`.
- `.gitignore`: excluye insumos crudos (`fuentes/`), `node_modules/` y resultados de pruebas.
- `CLAUDE.md`: contexto, los 8 principios, convenciones técnicas, estructura y comandos.
- Esta bitácora.

### ⏳ Pendiente del usuario
1. Crear el repositorio público vacío `RolandoGR/atiende-primero` en GitHub y avisar (para hacer el primer push).
2. Agregar `www.inegi.org.mx` y `cdn.sheetjs.com` a la política de red del entorno (necesario para la Fase 1).
3. En la Fase 6: activar GitHub Pages con origen "GitHub Actions" en la configuración del repositorio.
