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

### 🗣️ Aprobación de la Fase 0 (textual)
> Apruebo. Ya debe estar todo listo

### 🔧 Conexión del repositorio
- Se conectó `RolandoGR/atiende-primero` a la sesión y se agregó como remoto `origin`. El repositorio existe y está vacío.
- Los dominios `www.inegi.org.mx` y `cdn.sheetjs.com` ya responden desde el entorno.
- ⚠️ **El push fue rechazado (error 403):** la aplicación de Claude en GitHub no tiene permiso de escritura en el
  repositorio. Solución: instalar la Claude GitHub App en el repositorio o reconectar GitHub desde claude.ai.
  Mientras tanto, el trabajo se guarda en commits locales y se sube en cuanto haya acceso.

---

## Fase 1 · Datos de ejemplo y mapa — 2026-10-20

### 🔧 Mapa de municipios
- Se buscaron las ediciones del Marco Geoestadístico en el sitio del INEGI. Como la página arma sus enlaces con
  JavaScript, se abrió con un navegador automatizado (Playwright) para leer las fichas.
- ⚖️ Se eligió **Marco Geoestadístico, Encuesta Intercensal 2025**, la más reciente (corte de noviembre de 2025,
  publicada en agosto de 2026). Del archivo de Sonora (73 MB) solo se usa la capa de municipios.
- Primer intento de simplificación: 157 cruces entre bordes, por las tolerancias de hasta 1 m del INEGI. Se corrigió
  uniendo vértices cercanos (`snap`) y limpiando huecos (`clean`) antes de simplificar.
- Se compararon visualmente simplificaciones al 2 % y al 3 %. ⚖️ Se eligió **3 %** (99 KB, 26 KB comprimido)
  porque conserva mejor los municipios pequeños de la sierra y queda bajo la meta de 150 KB.
- `scripts/preparar_mapa.sh` reproduce todo y verifica la huella SHA-256 del archivo descargado.

### 🔧 Población y localidades
- ⚖️ Para "más reportes en los municipios más poblados" se usa población real y pública: **Censo 2020 (ITER)**.
  Trae también coordenadas de cada localidad, así que los reportes se ubican cerca de lugares reales.
- `scripts/preparar_localidades.py` extrae 72 municipios y 275 localidades (500 habitantes o más, más todas las
  cabeceras). Se guardan en `scripts/referencia/` para que el generador no dependa de la descarga.
- Diferencias de nombres entre fuentes ("Alamos" en el Censo, "Álamos" en el Marco 2025). ⚖️ Se usan los nombres
  del Marco 2025 y las fuentes se cruzan por clave.

### 🔧 Términos de uso del INEGI
- Se leyeron los Términos de Libre Uso: permiten copiar, adaptar y publicar la información si se da crédito
  ("Fuente: INEGI, …"), se avisa de las transformaciones y no se aparenta una postura oficial.
- El léeme del Marco Geoestadístico prohíbe reproducirlo "con fines de lucro"; el proyecto es didáctico y sin lucro.
- Todo quedó documentado en `docs/mapa.md`.

### 🔧 Bibliotecas
- **SheetJS 0.20.3**, versión "mini" (solo `.xlsx`, 280 KB), descargada de `cdn.sheetjs.com`.
- **Leaflet 1.9.4** desde npm (integridad verificada).
- Huellas SHA-256 y licencias en `sitio/lib/VERSIONES.md`.

### ❓ Preguntas de Claude y ✅ respuestas (estructura de datos)
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Cómo escribimos los encabezados? | Legibles en español (recomendado) · Nombres técnicos | **Legibles en español** |
| ¿Contra qué se miden las horas abiertas? | Fecha de corte fija (recomendado) · Hora actual · Solo columna estática | **Fecha de corte fija** |
| ¿Cómo se escriben las reglas duras? | Texto claro + columnas (recomendado) · Solo texto | **Texto claro + columnas** |
| ¿Incluimos reportes cerrados? | Sí, ~15 % (recomendado) · Solo abiertos y en proceso | **Sí, ~15 % cerrados** |

### 🔧 Generador de datos (`scripts/generar_datos.py`)
- 200 reportes con semilla fija. Se verificó que **dos ejecuciones producen archivos idénticos byte por byte**.
- ⚖️ El municipio se elige con probabilidad proporcional a población^0.75: los más poblados tienen más reportes,
  pero aparecen también municipios pequeños (43 en total).
- ⚖️ Primero se decide qué tan avanzado va cada reporte respecto a su plazo (~70 % en plazo, ~30 % vencido) y luego
  se calcula la fecha de alta hacia atrás desde la fecha de corte (2026-10-19 08:00).
- Ajuste tras la primera corrida: 25 % de los pendientes salían críticos por regla, demasiados para que la priorización
  distinga. Se bajó la proporción de cables caídos (8 → 5) y la probabilidad de riesgo en postes (35 % → 20 %) y
  transformadores (20 % → 15 %). Resultado: 15 %.
- Casos de prueba a propósito: cable caído con pocos usuarios, riesgo en falla menor, tres vencidos, seis reportes en
  una localidad recurrente (Pueblo Yaqui), alto impacto con baja urgencia y un crítico ya cerrado. Folios en `docs/datos.md`.
- ⚖️ `sitio/datos/ejemplo.js` guarda las hojas **tal cual** vienen en los Excel, para que el sitio procese el ejemplo
  y los archivos subidos con el mismo código. Se verificó con SheetJS que coinciden celda por celda.
- Las columnas Tipo de falla, Estado y Riesgo tienen listas desplegables en Excel.
- Se dibujaron los 200 puntos sobre el mapa para revisar que caen en lugares sensatos.
- Documentación en `docs/datos.md`.

### ⏳ Pendiente
- El push a GitHub sigue rechazado (403): falta dar acceso de escritura a la app de Claude en el repositorio.

### 🗣️ Aprobación de la Fase 1 (textual)
> continua

---

## Fase 2 · Modelo de priorización — 2026-10-20

### 🔧 Simulación antes de decidir
Antes de proponer la fórmula, Claude calculó con los datos de ejemplo (163 pendientes) cómo quedaría el reparto de
prioridades con varias formas de convertir los criterios a una escala de 0 a 1. Pesos iniciales: 30/25/20/10/15.
Umbrales: 70/50/30.

| Usuarios afectados | Tiempo | Reparto por puntaje (Baja/Media/Alta/Crítica) | Observación |
|---|---|---|---|
| Lineal (usuarios ÷ 1,000) | Máximo al doble del plazo | 92 / 58 / 12 / 1 | Casi todo queda en baja: la mayoría afecta a pocos usuarios |
| Logarítmica | Máximo al doble del plazo | 46 / 73 / 37 / 7 | La matriz se concentra en urgencia baja |
| Por tramos | Máximo al doble del plazo | 46 / 73 / 37 / 7 | Igual que la logarítmica |
| Por tramos | % del plazo consumido | 31 / 74 / 48 / 10 | Reparto más equilibrado y matriz llena en sus 9 celdas |

### ❓ Preguntas de Claude y ✅ respuestas (fórmula)
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Qué forma general tiene la fórmula? | Suma ponderada + reglas (recomendado) · Impacto × urgencia · Suma + puntos extra por regla | **Suma ponderada + reglas** |
| ¿Cómo convertimos "usuarios afectados" a 0–1? | Por tramos (recomendado) · Logarítmica · Lineal con tope | **Por tramos** |
| ¿Cómo medimos el tiempo respecto al plazo? | % del plazo consumido (recomendado) · Máximo al doble del plazo | **% del plazo consumido** |
| ¿De qué tamaño es la matriz? | 3 × 3 (recomendado) · 4 × 4 · 5 × 5 | **3 × 3** |

### ⚖️ Decisiones de la Fase 2
- **Puntaje 0–100** = Σ peso × valor (0 a 1) × 100 ÷ Σ pesos. Cada criterio aporta "X puntos" y los aportes suman el puntaje.
- **Reglas duras como prioridad mínima**: la prioridad final es la más alta entre la del puntaje y la de las reglas
  que se cumplen. El puntaje no se altera; el desglose explica qué regla cambió la prioridad.
  *Por qué:* así es imposible que unos pesos raros dejen un cable caído por debajo de crítica.
- **Tablas de conversión editables** en una nueva hoja "Escalas" de `criterios.xlsx` (severidad, usuarios y
  recurrencia). *Por qué:* cumple el principio de editar criterios sin tocar código y se explica en una frase.
- **Ejes de la matriz** definidos por la columna "Eje de la matriz" de Pesos: impacto = severidad + usuarios;
  urgencia = tiempo + recurrencia; el riesgo queda fuera porque ya lo cubre su regla.
- La lectura y validación de Excel (`lectura.js`) y el cálculo (`modelo.js`) son JavaScript sin dependencias del
  navegador, para probarlos en Node con `node --test`.

### 🗣️ Aprobación del plan de la Fase 2
El plan se aprobó en Claude Code ("User has approved your plan").

### 🔧 Qué se hizo
- **Hoja "Escalas"** en `criterios.xlsx` con las tablas de conversión.
  - ⚖️ Cambio respecto al plan: en vez de columnas "Desde" y "Hasta", una sola columna, **"A partir de"**. Cada tramo
    vale hasta el inicio del siguiente, así que al editar en Excel no pueden quedar huecos ni traslapes.
- **Reproducibilidad corregida.** Al regenerar, `reportes.xlsx` cambió aunque sus datos no. Causa: openpyxl escribe
  la hora actual en los metadatos del archivo, y el ZIP interno del `.xlsx` guarda la hora de cada parte. La
  comprobación de la Fase 1 había pasado solo porque las dos corridas cayeron en el mismo segundo. Ahora el
  generador fija esas fechas. Se verificó con dos corridas separadas por varios segundos.
- **`sitio/js/modelo.js`**: cálculo del puntaje, aportes, prioridad, reglas, ejes y resumen para los indicadores.
- **`sitio/js/lectura.js`**: lectura y validación de las hojas, con mensajes en lenguaje claro. Las reglas pueden
  revisar cualquier columna, incluso una que agregue la persona.
- Ajustes encontrados por las pruebas:
  - Al leer Excel como texto, el valor de una regla llegaba como "4" en vez de 4. Ahora se guarda como número.
  - SheetJS entrega algunas fechas con 1 milisegundo de desfase; ahora se redondean al segundo.
- **31 pruebas automáticas** (`node --test "pruebas/*.test.js"`), todas en verde en cuatro zonas horarias (UTC,
  Hermosillo, Ciudad de México y Tokio).
  - Incluyen los dos ejemplos a mano.
  - Incluyen los casos de prueba de la Fase 1.
  - Revisan que las reglas no se violen con 200 combinaciones de pesos al azar.
  - Comprueban que leer los `.xlsx` con SheetJS da lo mismo que los datos incluidos en el sitio.
- Prueba en el navegador: Chromium abrió los módulos como archivo local (`file://`), sin errores ni peticiones externas.
- Nota técnica: en Node 22, `node --test pruebas/` no funciona con una carpeta; se usa el patrón `"pruebas/*.test.js"`.
- Documentación: `docs/modelo.md` (fórmula, diagrama, ejemplos a mano, alternativas descartadas, límites),
  `docs/datos.md` (Escalas y validación) y `CLAUDE.md`.

### 📊 Resultado con los datos de ejemplo (163 pendientes)
Baja 32 · Media 66 · Alta 39 · Crítica 26 (16 de ellas por regla). 46 vencidos. Las 9 celdas de la matriz tienen reportes.

### 🗣️ Aprobación de la Fase 2 (textual)
> dale

---

## Fase 3 · Dashboard — 2026-10-20

### 🔧 Colores de prioridad: validación antes de proponer
Se usó la guía de visualización de datos de Claude y su validador de paletas (simula daltonismo y mide contraste)
para no elegir colores "a ojo".
- Primer intento con el semáforo de estado de la guía (gris, ámbar, naranja, rojo): **falló**. El ámbar y el naranja
  eran casi indistinguibles (diferencia 13.6, mínimo 15) y el gris "se leía sin color".
- Se ajustaron los tonos hasta pasar todas las pruebas en tema claro: Crítica `#a8201c`, Alta `#dd5a1e`,
  Media `#d6a100`, Baja `#3f7fc8`. Peor par para daltonismo: 10.8 (meta ≥ 8); peor par con visión normal: 15.9
  (mínimo 15).
  - El ámbar tiene contraste bajo contra el fondo (2.28:1). La guía lo permite **solo** si cada color va
    acompañado de texto visible; por eso cada prioridad siempre lleva icono (▲●◆▼) y su nombre.
- En **modo oscuro** no se encontró un ámbar y un naranja que se distinguieran dentro del rango de luminosidad
  permitido. ⚖️ Se propone tema **solo claro**, que además se lee mejor en un proyector.
- Alternativa validada: rampa de un solo tono rojo (`#e88a83 → #6e1612`).

### 🔧 Maqueta
Se dibujó una maqueta en celular con dos formas de navegar y las dos paletas: `docs/capturas/propuestas-fase3.png`.

### ❓ Preguntas de Claude y ✅ respuestas (diseño)
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Cómo se navega en el celular? | Pestañas abajo (recomendado) · Una sola página | **Pestañas abajo** |
| ¿Qué colores para las prioridades? | Semáforo (recomendado) · Un solo tono rojo | **Semáforo** |
| ¿Qué indica el color de cada municipio en el mapa? | Críticos + altos (recomendado) · Carga total · Puntaje promedio | **Críticos + altos** |
| ¿Cómo funcionan los controles de pesos? | Independientes + % (recomendado) · Que siempre sumen 100 | **Independientes + %** |

### ⚖️ Por qué
- **Pestañas abajo:** en una página con todo seguido, al deslizar el dedo sobre el mapa se mueve el mapa y no la
  página. Con pestañas, cada vista ocupa la pantalla. En computadora y proyector se ve todo junto.
- **Baja en azul, no en verde:** el verde sugiere "todo bien", y un reporte de prioridad baja sigue pendiente.
- **Críticos + altos por municipio:** responde "¿dónde se concentra lo urgente?". La carga total se parecería a un
  mapa de población.
- **Pesos independientes:** mover un control no mueve los demás. El porcentaje real de cada criterio se muestra al lado.

(La sesión de trabajo se reinició en este punto; el trabajo y los archivos se conservaron.)

### 🗣️ Aprobación del plan de la Fase 3
El plan se aprobó en Claude Code ("User has approved your plan").

### 🔧 Qué se construyó
- `sitio/index.html` y `sitio/css/estilos.css`: diseño primero para celular con 4 pestañas abajo; desde 1024 px,
  tres columnas (resumen y pesos · mapa · lista). Tema solo claro.
- Un archivo de JavaScript por pieza, para que se pueda leer y adaptar: `app.js` (estado único), `indicadores.js`,
  `matriz.js`, `mapa.js`, `lista.js`, `detalle.js`, `pesos.js`, `enlace.js`, `cargador.js`, `exportar.js`, `ayuda.js`,
  `recorrido.js`, `inicio.js` y `util.js`.
- ⚖️ Rampas de color validadas con el script de la guía:
  - mapa: violeta grisáceo, críticos + altos por municipio en 5 clases: 0, 1, 2–3, 4–7, 8 o más;
  - matriz: grises tinta.
  Así no se confunden con los colores de prioridad. En mapas y matrices de magnitud el tono más claro puede
  fundirse con el fondo porque significa "casi cero".
- ⚖️ **Política de seguridad del contenido (CSP)** en la página: solo se permiten archivos del propio sitio y
  ninguna conexión de red. La única excepción son las imágenes de la capa opcional de calles. Se comprobó que no
  bloquea nada al abrir con doble clic.
- ⚖️ SheetJS se carga solo al usar "Mis archivos" o al exportar. La primera carga pesa **428 KB (117 KB comprimidos)**,
  bajo la meta de 450 KB.
- `sitio/documentacion.html`: página mínima con enlaces. Se completa en la Fase 5.

### 🔧 Ajustes después de mirar las capturas
- El nombre de la herramienta aparecía dentro de un recuadro gris. Causa: la clase CSS `marca` del encabezado chocaba
  con la de las etiquetas "Vencido" de la lista. Se renombró a `nombre-app`.
- El chip de prioridad "Baja" se cortaba en el celular y en la columna izquierda de la computadora. Ahora es una
  cuadrícula de 2 × 2.
- Las etiquetas verticales de la matriz se cortaban. Ahora son horizontales: Alto, Medio, Bajo.
- En el celular, el encabezado ocupaba demasiado alto y **la hoja de detalle tapaba la leyenda de datos ficticios**.
  Ahora el encabezado es más compacto: sin subtítulo y con el botón de archivos como icono, con su nombre para
  lectores de pantalla. El detalle se detiene debajo del encabezado.
- Decía "urgencia bajo" y "urgencia alto"; se corrigió el género.
- En el recorrido guiado, el cuadro de texto tapaba lo que señalaba. Ahora se coloca arriba cuando el elemento está abajo.
- El aviso flotante quedaba detrás de los diálogos. Se omite mientras hay un diálogo abierto, que ya muestra su resultado.
- Se agregó un ícono vacío incrustado en la página. Así el navegador no pide `favicon.ico` al servidor ni registra un error.

### 🧪 Prueba de humo (`pruebas/e2e/humo.js`): 33 comprobaciones en verde
Con Chromium real:
- como archivo local (`file://`), en celular (390 × 844) y en computadora (1366 × 768);
- servido por HTTP, como en GitHub Pages.

Comprueba:
- **cero errores y cero peticiones fuera del dispositivo**;
- 163 pendientes y 26 críticos;
- que el recorrido aparece la primera vez;
- que la matriz filtra (REP-0194 en impacto alto · urgencia baja);
- el detalle de REP-0200 (21.15 puntos, Baja → Crítica por cable caído);
- que la recurrencia en 60 sube a Pueblo Yaqui y que los pesos viajan en el enlace y se aplican al abrirlo;
- que la ayuda refleja los pesos actuales;
- cargar Excel propios, y que uno sin la columna Severidad muestra un error claro y conserva los datos;
- que el Excel exportado trae el mismo orden que la pantalla.

Las capturas están en `docs/capturas/`.

### 🗣️ Aprobación de la Fase 3 (textual)
> Sí, dale

---

## Fase 4 · Validación — 2026-10-20

### 🔧 Hallazgos al planear
- En el entorno de trabajo solo hay Chromium (no se pueden instalar Firefox ni WebKit). Safari y Firefox reales se
  probarán a mano en celulares en la Fase 6. Aquí se usa emulación de dispositivos y una revisión de compatibilidad.
- **Falla frente al principio 4 ("funciona sin conexión una vez abierta"):** la biblioteca de Excel se cargaba solo
  al usarla. Si alguien abre la herramienta desde el QR y luego pierde la señal, "Mis archivos" y "Exportar" fallarían.
- Los diálogos usan `<dialog>`, que no existe en iPhone con iOS anterior a 15.4.

### ❓ Pregunta de Claude y ✅ respuesta
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Cómo garantizamos que todo funcione sin conexión una vez abierta? | Precargar en segundo plano (recomendado) · Modo sin conexión completo (service worker) · Dejarlo así | **Precargar en segundo plano** |

⚖️ *Por qué:* es simple, no retrasa la primera carga y cumple el principio. Un service worker también permitiría
reabrir sin señal, pero es más difícil de explicar y no funciona al abrir con doble clic.

### 🗣️ Aprobación del plan de la Fase 4
El plan se aprobó en Claude Code ("User has approved your plan").

### 🔧 Qué se hizo
- **Precarga en segundo plano** de la biblioteca de Excel (`inicio.js`): cargar y exportar funcionan aunque se pierda
  la señal después de abrir.
- **Respaldo para navegadores sin `<dialog>`** (`Util.abrirDialogo` y `Util.cerrarDialogo`). Se probó quitándole
  `<dialog>` al navegador a propósito.
- **`package.json`** con las herramientas de prueba: Playwright 1.56.1, axe-core 4.14 y acorn 8.19, más los comandos
  `npm test`, `npm run humo` y `npm run validacion`. El sitio no usa nada de npm.
- **`pruebas/propiedades.test.js`:**
  - 400,000 evaluaciones al azar comparadas contra un cálculo independiente de la fórmula;
  - revisión de que la tabla de casos de `docs/datos.md` coincide con los datos;
  - reglas con "menor o igual que";
  - 5,000 reportes.
- **`pruebas/e2e/validacion.js`**, con 99 comprobaciones: 9 tamaños de pantalla, accesibilidad, teclado,
  compatibilidad, sin conexión, tiempos, privacidad y archivos hostiles.
- Informe: **`docs/validacion.md`**.

### 🐞 Lo que encontró la validación y cómo se corrigió
| Hallazgo | Corrección |
|---|---|
| Las pruebas tardaban 52 s: el modelo creaba un formateador de números nuevo en cada reporte | Formateadores reutilizables; ahora 4.6 s (también acelera el sitio) |
| Contraste insuficiente: texto blanco sobre "Alta" (3.8:1) y "Baja" (4.1:1); WCAG pide 4.5:1 | "Alta" con texto oscuro (4.6:1); "Baja" `#3f7fc8` → `#3470b5` (5.1:1). Paleta revalidada para daltonismo |
| ⚖️ Se probó oscurecer el naranja en vez de cambiar el texto, pero quedaba demasiado parecido al rojo de "Crítica" (diferencia 9.7, mínimo 15) | Se descartó |
| Botones de zoom del mapa de 30 px y chips de filtro de 36 px | 44 px |
| Etiquetas para lectores de pantalla distintas del texto visible (prioridades y matriz) | Texto oculto dentro del botón, en lugar de una etiqueta aparte |
| Al cerrar el detalle con Escape el foco se perdía (la lista se redibuja) | Se busca el reporte por folio y se le regresa el foco |
| **Con red y procesador lentos tardaba 4.4 s**: el navegador pedía los 22 archivos uno por uno | Scripts en el `<head>` con `defer`: se piden a la vez. **Ahora 1.6 s** |
| La prueba confundía el archivo `pesos.js` con pesos enviados al servidor | Se corrigió la prueba (el sitio estaba bien) |

### 📊 Resultado final
- `npm test`: 35/35.
- `npm run humo`: 33/33.
- `npm run validacion`: 99/99.
- Listo en 1.6 s con 4G lento.
- 0 problemas de accesibilidad.
- 0 peticiones fuera del sitio.

Pendiente para la Fase 6: probar en Safari y Firefox reales y en celulares físicos (lista en `docs/validacion.md`).

### 🗣️ Aprobación de la Fase 4 (textual)
> Sí, dale con la Fase 5

---

## Fase 5 · Documentación para la audiencia — 2026-10-20/21

### ❓ Preguntas de Claude y ✅ respuestas
| Pregunta | Opciones ofrecidas | ✅ Respuesta |
|---|---|---|
| ¿Qué prompts incluimos en la guía para replicar? | Originales + versión mejorada (recomendado) · Solo los originales · Solo la versión mejorada | **Originales + versión mejorada** |
| ¿Dónde se menciona que el proyecto se preparó para una charla en la CFE? | Solo en el repositorio (recomendado) · También en la página del sitio | **Solo en el repositorio** |
| ¿Cómo aparecen tus créditos? | Nombre + página personal (recomendado) · Solo usuario de GitHub · Sin créditos | **Nombre + página personal** |
| ¿Cómo escribo tu nombre? | Rolando García · RolandoGR | **RolandoGR** |
| ¿Con qué versión de Claude Code explicamos cómo replicar? | En la web (recomendado) · App de escritorio / terminal · Ambas | **En la web** |

⚖️ *Por qué:* el sitio publicado no debe parecer institucional; el contexto de la charla vive en el repositorio.
Claude Code en la web no requiere instalar nada, que es lo más accesible para quien no programa, y es como se
construyó este proyecto.

(La sesión de trabajo se reinició mientras se presentaba el plan; se continuó con lo acordado en las respuestas.)

### 🔧 Verificación de datos sobre Claude Code en la web
Para no escribir de memoria, un agente consultó la documentación oficial (code.claude.com) el 21 de octubre de 2026.
- Claude Code en la web está disponible en los planes **Pro, Max y Team**; en Enterprise depende del tipo de licencia.
- GitHub se conecta desde `claude.ai/code`. Para guardar cambios en el repositorio hace falta permiso de escritura:
  instalar la **Claude GitHub App** (`github.com/apps/claude/installations/new`).
- La red se configura en el entorno, en **Network access**: niveles predeterminado, sin red, completo o
  personalizado, con **Allowed domains**. `www.inegi.org.mx` y `cdn.sheetjs.com` no están en la lista predeterminada.
- El modo plan se elige en el menú de modo junto al cuadro de mensaje.
- Lo que la documentación **no** aclara se señaló así en la guía y no se afirmó: nombre de la rama, permisos exactos
  de la app, si los archivos sin guardar sobreviven cuando se recicla el entorno.

### 🔧 Qué se hizo
- **`docs/guia-replicar.md`:**
  - preparación (incluida la lección del error 403);
  - fase por fase;
  - las 22 preguntas con su respuesta;
  - qué hacer si algo falla;
  - Anexo A con el prompt original, copiado automáticamente de la bitácora para que sea exacto, y las instrucciones
    posteriores;
  - Anexo B con un prompt mejorado que consolida las decisiones.
- **`docs/adaptar-a-mi-area.md`:**
  - nivel 1, solo Excel: columnas, pesos, escalas, umbrales y reglas sobre columnas nuevas;
  - nivel 2: la misma herramienta para mantenimiento, quejas, inspecciones o TI;
  - nivel 3: prompts para pedirle cambios de fondo a Claude Code.
- **`docs/limitaciones.md`:** qué no hace, qué decisiones son humanas, riesgos (sesgos, exceso de confianza, pesos
  manipulables) y qué haría falta para usar datos reales.
- **`README.md`:** contexto de la charla, capturas, documentación, comandos, privacidad, fuentes y créditos.
- **`sitio/documentacion.html`:** página completa en lenguaje claro, con índice, 2 imágenes de celular y créditos. No
  menciona ninguna institución.
- **Imágenes:** `npm run capturas` las genera. Se quitó la de computadora porque la meta era ≤ 150 KB; las dos de
  celular pesan 94 KB.
- **Pruebas nuevas:**
  - el sitio no menciona a la CFE (principio 2, ahora automático);
  - todos los enlaces internos de la documentación existen;
  - la página de documentación pasa accesibilidad, no tiene desbordes, no hace peticiones externas y sus imágenes
    cargan.

### 📊 Resultado
- `npm test`: 37/37.
- `npm run humo`: 33/33.
- `npm run validacion`: 111/111.

### 🗣️ Aprobación de la Fase 5 (textual)
> Sí, dale con la Fase 6

---

## Fase 6 · Publicación — 2026-10-21

### 🔧 Qué se hizo
- **Push:** se volvió a intentar y GitHub lo rechazó otra vez (403). Todo se preparó localmente.
- **Licencias:**
  - `LICENSE` (MIT, código, © 2026 RolandoGR), con una nota que aclara qué cubre cada licencia;
  - `LICENSE-docs` (CC BY 4.0, documentación y datos ficticios).
  - ⚖️ `creativecommons.org` estaba bloqueado en el entorno. El texto legal oficial se tomó del paquete
    `spdx-license-list` 6.12.0, la lista estándar de licencias SPDX, y se indica la fuente.
- **Publicación:** `.github/workflows/publicar.yml`. En cada cambio a `main` corre las pruebas del cálculo y, solo si
  pasan, publica `sitio/` en GitHub Pages.
  - Se consultaron las versiones vigentes de las acciones oficiales: checkout v7, setup-node v7,
    configure-pages v6, upload-pages-artifact v5, deploy-pages v5.
  - ⚖️ En la publicación solo corren las pruebas del cálculo (rápidas y sin instalar nada); las de navegador se
    corren antes de subir cambios.
- **Simulación de GitHub Pages:** el sitio servido bajo `/atiende-primero/` abre bien. Los Excel de ejemplo, la
  documentación y las imágenes cargan, sin archivos faltantes.
- **Código QR** (`scripts/generar_qr.py` → `docs/qr/`):
  - en SVG, PNG y PNG con el nombre, la leyenda y el enlace;
  - corrección de errores media, para que se lea aunque el proyector no sea nítido;
  - ✅ se verificó con un lector independiente (`jsqr`) que lleva a `https://rolandogr.github.io/atiende-primero/`.
- **`docs/publicacion.md`:** pasos para publicar, lista de verificación final en dispositivos reales y cómo
  actualizar.
- README, guía para replicar y `CLAUDE.md` actualizados.

### ⏳ Pendiente del usuario para que el enlace funcione
1. Instalar la Claude GitHub App en `RolandoGR/atiende-primero` (o subir el respaldo a mano).
2. Settings → Pages → Source: **GitHub Actions**.
3. Recorrer la lista de verificación de `docs/publicacion.md` con el enlace publicado.

### 🗣️ Instrucción (textual)
> Ya instalé la app, sube todo

### 🔧 Subida a GitHub
- ✅ **Push correcto:** `main` ya está en `RolandoGR/atiende-primero` con todo el historial (las 7 fases).
- El flujo "Publicar en GitHub Pages" arrancó solo:
  - ✅ **Pruebas del cálculo:** pasaron en GitHub en 8 s;
  - ❌ **Publicar:** se detuvo con "Get Pages site failed… verify that the repository has Pages enabled". GitHub
    Pages todavía no está activado en el repositorio.
- Desde el entorno de trabajo no se puede consultar ni cambiar la configuración de Pages: ese acceso a la API de
  GitHub está bloqueado. Tampoco se puede abrir `rolandogr.github.io` porque la red no lo permite. Activar Pages y
  revisar el sitio publicado le toca al usuario.

### ⏳ Pendiente del usuario
1. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
2. Avisar para relanzar el flujo, o hacerlo en Actions → Publicar en GitHub Pages → Run workflow.

### 🗣️ Instrucción (textual)
> (captura de pantalla de Settings → Pages: "Workflow details will appear here once your site has been deployed",
> con "Enforce HTTPS" activado)

El usuario activó GitHub Pages con origen GitHub Actions. Se relanzó el flujo de publicación.
