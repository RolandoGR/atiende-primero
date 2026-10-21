# Guía para replicar el proyecto con Claude Code

Esta guía es para alguien **sin experiencia en programación**. Explica cómo construir, con Claude Code en la web,
una herramienta como **Atiende Primero**: un priorizador de reportes que lee Excel, calcula una prioridad explicable
y la muestra en un mapa, una matriz y una lista. Incluye todos los prompts que se usaron.

> Atiende Primero se preparó como ejemplo para una charla sobre IA y toma de decisiones dirigida a mandos medios y
> altos de la CFE en Hermosillo, Sonora. Es un **ejemplo didáctico con datos ficticios**; no es un sistema oficial
> ni está avalado por ninguna institución.

![La herramienta en un celular](../sitio/img/celular-resumen.jpg)

## Cómo se trabaja con Claude Code
- **Tú decides; Claude construye.** Le das una instrucción (un *prompt*), propone opciones, tú eliges y escribe el
  código y la documentación.
- **Por fases.** El proyecto se dividió en 7 fases (0 a 6). Al terminar cada una, Claude se detiene, resume y
  espera tu aprobación.
- **Todo queda registrado.** Claude mantiene `docs/bitacora.md` con cada instrucción textual, cada pregunta, cada
  respuesta y por qué se decidió así.
- **Lo que importa revisar** no es el código, sino:
  - las capturas de pantalla;
  - que las pruebas salgan "en verde";
  - que las decisiones coincidan con lo que quieres.

## 1. Qué necesitas
| Qué | Para qué |
|---|---|
| Una cuenta de **GitHub** (gratuita) | Ahí se guarda el proyecto y desde ahí se publica la página |
| Un plan de **Claude** que incluya Claude Code en la web: **Pro, Max o Team** (en Enterprise, según el tipo de licencia) | Para usar `claude.ai/code` |
| Excel, LibreOffice o Google Sheets | Para ver y editar los archivos de datos |
| Una computadora con navegador | Claude Code en la web no requiere instalar nada; el celular sirve para revisar avances |

Las sesiones consumen el uso incluido en tu plan de Claude. Información verificada en la documentación oficial
(`code.claude.com/docs/en/web-quickstart`) el 21 de octubre de 2026; los nombres exactos de los botones pueden
cambiar.

## 2. Preparación (una sola vez, unos 15 minutos)
1. **Crea un repositorio vacío en GitHub.** Botón **New repository**, ponle nombre (por ejemplo
   `mi-priorizador`) y márcalo como **Public** si quieres publicarlo gratis en GitHub Pages.
2. **Entra a `https://claude.ai/code`**, inicia sesión y conecta tu cuenta de GitHub cuando te lo pida.
3. **Dale permiso de escritura a Claude en tu repositorio.** Instala la **Claude GitHub App** en tu cuenta desde
   `https://github.com/apps/claude/installations/new` y elige tu repositorio.
   > 💡 **Lección de este proyecto:** aquí se olvidó este paso y GitHub rechazó guardar el trabajo (error 403)
   > durante varias fases. El trabajo se quedó en un entorno temporal con riesgo de perderse. Hazlo **antes** de
   > empezar.
4. **Permite los sitios de donde se descargan los datos.** El entorno de Claude Code solo puede conectarse a sitios
   permitidos.
   1. En la pantalla de nueva sesión, abre el selector de entorno: el primer control bajo el cuadro de mensaje.
   2. Elige tu entorno y toca su ícono de configuración.
   3. En **Network access**, elige el nivel que permite agregar dominios propios ("Custom"; en algunas versiones
      aparece como "Limited").
   4. En **Allowed domains**, escribe uno por línea:
      ```text
      www.inegi.org.mx
      cdn.sheetjs.com
      ```
   5. Deja marcada la casilla que incluye la lista predeterminada de gestores de paquetes.

   Sin esto, Claude no podrá descargar el mapa del INEGI ni la biblioteca para leer Excel.
5. **Elige tu repositorio** en el selector de repositorios, bajo el cuadro de mensaje.

## 3. Cómo se avanza en cada fase
1. Pega el prompt de la fase (ver anexos).
2. **Modo plan:** en el menú de modo, junto al cuadro de mensaje, elige **Plan** cuando quieras que Claude
   investigue y proponga sin cambiar nada. Cuando el plan te convenza, apruébalo y Claude empieza a trabajar.
3. **Responde las preguntas.** Claude te ofrece opciones con ventajas y desventajas, y normalmente marca una como
   "(Recomendado)". Si no estás seguro, la recomendada suele ser razonable, pero piensa en tu audiencia.
4. **Revisa antes de aprobar:**
   - el resumen de la fase;
   - las capturas que te envía;
   - que diga que las pruebas pasaron;
   - la bitácora.
5. **Aprueba con una frase corta**, por ejemplo "Apruebo, sigue con la fase 2". Si algo no te gusta, dilo con
   tus palabras: "el mapa se ve muy chico en el celular".

## 4. Las fases, una por una
| Fase | Qué pasa | Qué revisar antes de aprobar |
|---|---|---|
| **0. Plan** | Claude propone nombre, estructura y tecnología, y pregunta dónde se publicará | Que el plan respete tus principios (datos ficticios, privacidad, sin conexión) |
| **1. Datos** | Descarga los límites municipales y la población del INEGI, y genera los Excel ficticios | Abre los Excel: ¿se ven realistas?, ¿están los casos de prueba? |
| **2. Modelo** | Propone la fórmula, simula opciones y programa el cálculo con pruebas | El ejemplo calculado a mano en `docs/modelo.md` |
| **3. Dashboard** | Muestra una maqueta, pregunta diseño y colores, y construye la página | Las capturas en celular y computadora |
| **4. Validación** | Prueba tamaños de pantalla, accesibilidad, funcionamiento sin conexión, velocidad y privacidad | `docs/validacion.md`: todo en verde y qué se corrigió |
| **5. Documentación** | Escribe esta guía, el README y la página de ayuda | Léela como lo haría tu audiencia |
| **6. Publicación** | Prepara GitHub Pages, la licencia y el código QR | Abre el enlace en tu celular |

### Las preguntas que hizo Claude en este proyecto (y cómo se respondieron)
| Fase | Pregunta | Respuesta elegida |
|---|---|---|
| 0 | ¿Cómo está alojada tu página? | GitHub Pages |
| 0 | ¿Nombre de la herramienta? | Atiende Primero |
| 0 | ¿Cómo dibujar el mapa? | Leaflet, incluido en el proyecto |
| 0 | ¿Licencia? | MIT para el código y CC BY 4.0 para la documentación |
| 0 | ¿Cómo publicar? | GitHub Actions, solo la carpeta `sitio/` |
| 1 | ¿Encabezados del Excel? | Legibles en español |
| 1 | ¿Contra qué se miden las horas abiertas? | Una fecha de corte fija |
| 1 | ¿Cómo se escriben las reglas? | Texto claro y columnas (campo, condición, valor) |
| 1 | ¿Incluir reportes cerrados? | Sí, ~15 % |
| 2 | ¿Forma de la fórmula? | Suma ponderada y reglas como prioridad mínima |
| 2 | ¿Usuarios afectados? | Por tramos |
| 2 | ¿Tiempo? | Porcentaje del plazo consumido |
| 2 | ¿Matriz? | 3 × 3 |
| 3 | ¿Navegación en celular? | Pestañas abajo |
| 3 | ¿Colores? | Semáforo validado para daltonismo |
| 3 | ¿Qué colorea el mapa? | Reportes críticos y altos por municipio |
| 3 | ¿Pesos? | Controles independientes con su porcentaje |
| 4 | ¿Sin conexión? | Precargar la biblioteca de Excel |
| 5 | ¿Prompts en la guía? | Originales y versión mejorada |
| 5 | ¿Dónde mencionar la charla? | Solo en el repositorio |
| 5 | ¿Créditos? | RolandoGR con página personal |
| 5 | ¿Versión de Claude Code? | En la web |

Todas las preguntas con sus opciones completas están en `docs/bitacora.md`.

## 5. Si algo falla (problemas reales de este proyecto)
| Síntoma | Causa | Qué hacer |
|---|---|---|
| "Push rechazado" o error **403** | Claude no tiene permiso de escritura en tu repositorio | Instala la Claude GitHub App en el repositorio (paso 2.3) |
| Claude no puede descargar del INEGI o de SheetJS | El entorno bloquea esos sitios | Agrégalos en **Network access → Allowed domains** (paso 2.4) |
| La captura muestra algo cortado o encimado | Diseño sin revisar en ese tamaño | Dile exactamente qué ves; pídele que vuelva a tomar capturas |
| Las pruebas tardan mucho | Código lento (aquí: 52 s → 4.6 s) | Pídele que investigue la causa antes de seguir |
| La sesión se reinició | El entorno es temporal | Pide que verifique el estado y continúe; por eso conviene guardar en GitHub al cerrar cada fase |
| No entiendes una pregunta | — | Pregúntale: "explícamelo como si no supiera programar" |

## 6. ¿Saldrá idéntico?
No byte por byte: Claude no escribe siempre exactamente igual. Con los mismos prompts y las mismas respuestas
obtendrás una herramienta **equivalente**: mismas funciones, misma fórmula, mismos principios.

Si quieres **exactamente esta versión** para estudiarla o modificarla, haz un *fork* del repositorio
`RolandoGR/atiende-primero` en GitHub y abre tu copia en Claude Code.

## 7. Recomendaciones
- **Empieza por los principios.** Lo que no se negocia (datos ficticios, privacidad, explicabilidad) va al inicio
  del prompt. Claude lo respetará en cada fase.
- **Pide opciones, no solo resultados.** "Propón opciones con ventajas y desventajas y pregúntame" produce mejores
  decisiones.
- **Exige pruebas y capturas.** En este proyecto, las capturas y las pruebas automáticas encontraron una docena de
  errores que no se veían en el código.
- **No uses datos reales** de tu institución con herramientas no autorizadas (ver `limitaciones.md`).

---

## Anexo A. Prompts originales (textuales)
Así se construyó realmente este proyecto. El prompt inicial:

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

Después, las instrucciones fueron muy cortas, porque Claude se detenía a preguntar y a pedir aprobación:

| Momento | Instrucción textual |
|---|---|
| Al responder sobre el mapa (fase 0) | *revisa el repo de los webscrapers porque creo que para el alcance que buscamos, tal vez leaflet no funcionaría. Quiero que aparezcan 200 reportes aprox* |
| Aprobar fase 0 | *Apruebo. Ya debe estar todo listo* |
| Aprobar fase 1 | *continua* |
| Aprobar fase 2 | *dale* |
| Aprobar fase 3 | *Sí, dale* |
| Aprobar fase 4 | *Sí, dale con la Fase 5* |

Lo demás fueron respuestas a las preguntas de opción múltiple (tabla de la sección 4).

## Anexo B. Versión mejorada (con las decisiones ya tomadas)
Úsala si quieres llegar a un resultado parecido con menos ida y vuelta. Reemplaza lo que está entre corchetes.
Claude seguirá deteniéndose al final de cada fase.

~~~~markdown
# Proyecto: [NOMBRE DE TU HERRAMIENTA] · priorizador de reportes (ejemplo didáctico)

## Contexto
Quiero construir contigo, paso a paso, una herramienta de ejemplo para [una charla / un taller / mi equipo] que lea
reportes desde Excel, calcule una prioridad de atención con criterios configurables y la muestre en un dashboard con
un mapa de [Sonora], una matriz de impacto y urgencia y una lista de atención. Se publicará en GitHub Pages
([tu-usuario].github.io/[repositorio]) y la gente entrará por QR desde el celular. También debe poder replicarse,
así que el proceso importa tanto como el software.

## Principios que no se negocian
1. Datos 100 % ficticios: sin nombres de personas, números de servicio ni datos personales.
2. No es un sistema oficial: sin nombre, logotipos ni identidad de ninguna institución. Leyenda siempre visible
   "Ejemplo didáctico con datos ficticios". Organiza la información por municipio (información pública).
3. Todo se procesa en el navegador: sin servidor, bases de datos, analítica ni rastreo. La interfaz dice "Tus
   archivos no salen de tu dispositivo" e invita a no cargar datos reales.
4. Funciona sin conexión una vez abierta (bibliotecas y mapa incluidos; precarga en segundo plano la biblioteca de
   Excel) y también abriendo index.html con doble clic.
5. Cada prioridad se puede explicar: cuánto aportó cada criterio y qué reglas aplicaron.
6. Criterios, pesos, tablas de conversión, umbrales y reglas se editan desde Excel o desde la interfaz, sin código.
7. Reglas duras que el puntaje no puede contradecir (cable caído o riesgo a la seguridad = crítica).
8. Documenta cada paso mientras construyes, no al final.

## Forma de trabajo
- Por fases (0 a 6). Al terminar cada fase: detente, resume, muéstrame capturas y espera mi aprobación.
- Antes de cualquier decisión de diseño importante, propón opciones con ventajas y desventajas y pregúntame.
- Mantén docs/bitacora.md (cada instrucción mía textual, lo que hiciste, decisiones y por qué) y CLAUDE.md.
- Al cerrar cada fase: commit y push.

## Decisiones ya tomadas (úsalas salvo que veas un problema; si lo ves, pregúntame)
- Tecnología: sitio estático en sitio/ (HTML, CSS y JavaScript sin compilar, solo scripts clásicos con "defer",
  datos como archivos .js con variables globales para que funcione con file://). SheetJS (versión vigente de
  cdn.sheetjs.com, "mini") y Leaflet incluidos en sitio/lib. Python con openpyxl solo para generar datos.
- Mapa: límites municipales del INEGI (Marco Geoestadístico más reciente), simplificados con mapshaper (≤ 150 KB),
  reproyectados a WGS84; población y localidades del Censo 2020 (ITER). Documenta fuente y términos de uso.
- Datos: ~200 reportes ficticios con semilla fija (archivos idénticos en cada corrida), repartidos según la
  población; encabezados legibles en español; horas abiertas medidas contra una fecha de corte fija; ~15 % cerrados;
  casos de prueba intencionales (cable caído con pocos usuarios, vencidos, localidad recurrente).
- Fórmula: puntaje 0–100 = suma ponderada de criterios normalizados 0–1 (severidad, usuarios afectados por tramos,
  % del plazo consumido con tope en 1, recurrencia, riesgo). Tablas de conversión en una hoja "Escalas"
  ("A partir de" → valor). Reglas duras como prioridad mínima (nunca bajan). Matriz 3 × 3 de impacto (severidad y
  usuarios) contra urgencia (tiempo y recurrencia). Ejemplo calculado a mano en docs/modelo.md.
- Diseño: primero celular con pestañas abajo (Resumen, Mapa, Lista, Pesos) y tres columnas desde 1024 px; tema
  claro; semáforo de prioridades validado para daltonismo y con contraste ≥ 4.5:1, siempre con icono y texto; mapa
  coloreado por reportes críticos y altos; pesos con controles independientes y su porcentaje; enlace que comparte
  los pesos en el fragmento #; recorrido guiado; ayuda "¿Cómo se calcula?"; exportar a Excel; política de seguridad
  (CSP) sin conexiones de red.
- Pruebas: node --test para el cálculo (incluida una comparación con un cálculo independiente y datos al azar);
  Playwright para el navegador (tamaños de celular a proyector, sin conexión, tiempos con red lenta, privacidad,
  archivos maliciosos) y axe-core para accesibilidad.
- Publicación: GitHub Pages con GitHub Actions publicando solo sitio/; licencia MIT (código) y CC BY 4.0 (docs).

## Fases
0. Plan: estructura, nombre, plan de trabajo; pregúntame lo necesario.
1. Datos de ejemplo y mapa (docs/datos.md, docs/mapa.md).
2. Modelo de priorización con pruebas (docs/modelo.md).
3. Dashboard: primero una maqueta con opciones de diseño; luego construir y revisar capturas.
4. Validación (docs/validacion.md).
5. Documentación para la audiencia: guía para replicar con los prompts, cómo adaptarla, limitaciones, README y una
   página de documentación dentro del sitio.
6. Publicación: GitHub Pages, licencia, lista de verificación y código QR del enlace.

Empieza por la Fase 0: propón el plan, hazme las preguntas necesarias y espera mi aprobación.
~~~~

### Prompts cortos para cada fase
| Momento | Prompt |
|---|---|
| Iniciar | *(el prompt anterior)* |
| Después de revisar la fase | *Apruebo la fase [N]. Actualiza la bitácora, haz commit y push, y sigue con la fase [N+1]: propón el plan y hazme las preguntas necesarias.* |
| Si algo se ve mal | *En la captura [nombre], [describe lo que ves]. Corrígelo, vuelve a tomar las capturas y anótalo en la bitácora.* |
| Si no entiendes algo | *Explícame [esto] en lenguaje sencillo, como si no supiera programar.* |
| Antes de cerrar | *Corre todas las pruebas, verifica que la bitácora y CLAUDE.md estén al día y dime qué falta.* |
