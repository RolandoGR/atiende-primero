# Cómo adaptar la herramienta a mi área

Hay tres niveles de adaptación, de más fácil a más difícil:

| Nivel | Qué cambias | Necesitas |
|---|---|---|
| 1. Solo Excel | Tus reportes, pesos, tablas de conversión, umbrales y reglas | Excel, LibreOffice o Google Sheets |
| 2. Otro tipo de tareas | El significado de cada columna (por ejemplo, quejas en vez de fallas) | Excel y un poco de criterio |
| 3. Cambios de fondo | Criterios nuevos, otra región, otro nombre | Pedírselo a Claude Code (prompts abajo) |

> ⚠️ Practica con datos ficticios. No cargues datos reales de ninguna institución (ver `limitaciones.md`).

---

## Nivel 1. Cambiar todo desde Excel (sin tocar código)
1. Abre la herramienta y toca **⬆ (Usar mis archivos)** → **Descargar reportes.xlsx / criterios.xlsx de ejemplo**.
2. Edita los archivos en Excel.
3. Vuelve a **⬆** y arrastra tus archivos. Puedes cargar uno o los dos: la herramienta reconoce cuál es cuál por sus
   hojas.
4. Si algo está mal, verás un mensaje que dice en qué fila y qué columna, por ejemplo: "Fila 3 (REP-0002): la
   severidad debe ser 1, 2, 3 o 4; dice «7»". Tus datos anteriores se conservan hasta que el archivo esté bien.

Todo se procesa en tu navegador: tus archivos no salen de tu dispositivo.

### `reportes.xlsx`, hoja "Reportes"
**Columnas obligatorias:** Folio · Municipio · Tipo de falla · Severidad (1 a 4) · Usuarios afectados · Plazo de
atención (horas) · Estado (Abierto, En proceso o Cerrado) · Riesgo a la seguridad (Sí o No) · Reportes previos
(30 días).

**Columnas opcionales:**
- **Fecha y hora de alta.**
- **Localidad.**
- **Latitud y Longitud.** Sin ellas, el reporte no aparece como punto en el mapa.
- **Horas abiertas.** Si falta, se calcula con la fecha de alta y la "Fecha de corte" de la hoja "Acerca de".
- **Cuadrilla.**

Además:
- No importan mayúsculas, acentos ni espacios en los encabezados: "plazo de atencion horas" funciona.
- Puedes **agregar columnas propias** (por ejemplo "Zona" o "Circuito") y usarlas en reglas.
- Para que el municipio se coloree en el mapa, su nombre debe coincidir con el del INEGI (por ejemplo, "Álamos"; "Heroica
  Nogales" es la localidad; el municipio es "Nogales"). Si no coincide, la herramienta te avisa cuáles faltan.

### `criterios.xlsx`
| Hoja | Qué controla | Ejemplo de cambio |
|---|---|---|
| **Pesos** | Cuánto aporta cada criterio al puntaje y en qué eje de la matriz cuenta | Subir "Riesgo a la seguridad" de 15 a 30 |
| **Escalas** | Cómo se convierte cada dato a un valor de 0 a 1 | Que de 1 a 10 usuarios valga 0.5 en vez de 0.25 |
| **Umbrales** | Desde qué puntaje es crítica, alta o media | Crítica desde 80 en vez de 70 |
| **Reglas** | Situaciones que siempre tienen una prioridad mínima | "Si Zona es igual a Hospital, la prioridad es crítica" |

**Cómo escribir una regla** (hoja Reglas):
| Regla (texto que se muestra) | Campo | Condición | Valor | Prioridad mínima | Activa |
|---|---|---|---|---|---|
| Si la zona es hospital, la prioridad es crítica. | Zona | es igual a | Hospital | Crítica | Sí |
| Si quedan 2 horas o menos de plazo, al menos alta. | Horas restantes | menor o igual que | 2 | Alta | Sí |

- **Campo:** el nombre de cualquier columna de tus reportes, incluidas las que agregues.
- **Condición:** "es igual a", "mayor o igual que" o "menor o igual que".
- Una regla **solo puede subir** la prioridad, nunca bajarla.
- Para desactivar una regla sin borrarla, escribe "No" en "Activa".

También puedes **mover los pesos en la pestaña Pesos** y compartir el enlace: quien lo abra verá tu priorización
con tus pesos. El enlace no lleva datos, solo los pesos.

---

## Nivel 2. Otro tipo de reportes o tareas
El modelo no sabe que se trata de fallas eléctricas: solo ve números y reglas. Puedes reinterpretar cada columna
sin cambiar sus encabezados.

| Columna de la herramienta | Mantenimiento de instalaciones | Quejas de clientes | Inspecciones programadas | Incidencias de TI |
|---|---|---|---|---|
| Tipo de falla | Plomería, electricidad, aire acondicionado | Cobro, atención, demora | Seguridad, ambiental, calidad | Red, correo, sistema, equipo |
| Severidad (1–4) | Qué tanto impide usar el espacio | Gravedad de la queja | Hallazgo previo más grave | Impacto en la operación |
| Usuarios afectados | Personas que usan el espacio | Clientes con el mismo problema | Personas expuestas | Usuarios sin servicio |
| Plazo de atención (horas) | Plazo interno por tipo | Plazo de respuesta comprometido | Días para la inspección × 24 | Tiempo de respuesta acordado |
| Reportes previos (30 días) | Fallas repetidas en el mismo lugar | Quejas previas del mismo cliente o tema | Hallazgos anteriores | Incidencias repetidas del mismo equipo |
| Riesgo a la seguridad | Riesgo para personas | Riesgo legal o reputacional | Riesgo para personas o ambiente | Riesgo de seguridad informática |
| Municipio | Inmueble o sede (sin mapa) | Región | Planta o sitio | Edificio |

Si tus lugares no son municipios de Sonora, el mapa no los coloreará, pero **la lista, la matriz, el detalle y los
pesos funcionan igual**. Ajusta los plazos y las reglas en `criterios.xlsx`.

---

## Nivel 3. Cambios que requieren pedírselos a Claude Code
Abre el proyecto en Claude Code, en la web o en tu computadora, y pide el cambio en lenguaje claro. Pide siempre
que actualice la documentación y las pruebas, y revisa la bitácora antes de aceptar.

### Agregar un criterio nuevo al puntaje (por ejemplo, "Antigüedad del equipo")
```text
Quiero agregar un sexto criterio al puntaje: "Antigüedad del equipo" (años, columna nueva en reportes.xlsx),
convertido a 0–1 con una tabla en la hoja Escalas (0–5 años → 0, 6–15 → 0.5, más de 15 → 1), con peso 10 y en el
eje Impacto. Propón primero cómo cambiarían modelo.js, lectura.js, criterios.xlsx, el detalle y la ayuda; después
de mi aprobación, impleméntalo, actualiza docs/modelo.md con un ejemplo a mano y agrega pruebas.
```

### Usar otra región (otro estado o tus propias zonas)
Hoy el mapa, sus textos y los datos de ejemplo están hechos para Sonora: el archivo del INEGI del estado 26, el
Censo 2020 del estado 26 y los textos "Mapa de Sonora".
```text
Quiero adaptar la herramienta a [Baja California]. Propón cómo cambiar scripts/preparar_mapa.sh y
scripts/preparar_localidades.py para usar el Marco Geoestadístico y el Censo 2020 de ese estado (verifica nombres
de archivo y huellas SHA-256 en el sitio del INEGI), regenerar los datos de ejemplo y cambiar los textos que dicen
"Sonora". Pregúntame antes de cada decisión importante.
```
Si en vez de municipios usas zonas propias, pide que el mapa use un archivo GeoJSON de tus zonas. Primero verifica
que puedas compartir esa geometría.

### Cambiar el nombre, los textos o los colores
```text
Cambia el nombre de la herramienta a "[Mi nombre]" y el subtítulo a "[Priorizador de ...]". Revisa index.html,
documentacion.html, README y CLAUDE.md. No cambies la leyenda "Ejemplo didáctico con datos ficticios".
```
Si cambias colores, pide que se validen otra vez para daltonismo y contraste, como en la Fase 4.

### Otros ejes de la matriz o más niveles
```text
Quiero que la matriz sea de 4 × 4 en lugar de 3 × 3. Propón los cortes, muéstrame una maqueta en celular y
actualiza las pruebas y docs/modelo.md.
```

---

## Antes de compartir tu versión
- Corre las pruebas: `npm test`, `npm run humo` y `npm run validacion` (ver `README.md`).
- Revisa que la leyenda "Ejemplo didáctico con datos ficticios" siga visible si usas datos de ejemplo.
- Si el uso va a ser real, lee primero `limitaciones.md`.
