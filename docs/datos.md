# Datos de ejemplo

> **Todo es ficticio.** Los reportes, folios, cuadrillas, fechas y cifras son inventados por un programa.
> No hay nombres de personas, números de servicio ni datos personales. No corresponden a ninguna institución.
> Solo se usan datos públicos del INEGI (nombres de municipios y localidades, coordenadas y población total) para
> que los reportes caigan en lugares reales y en proporción a la población.

## Archivos
| Archivo | Contenido |
|---|---|
| `datos/reportes.xlsx` | Hoja **Reportes** (200 reportes) y hoja **Acerca de** (aviso y **fecha de corte**) |
| `datos/criterios.xlsx` | Hojas **Pesos**, **Umbrales**, **Reglas** y **Acerca de** |
| `sitio/descargas/*.xlsx` | Copias idénticas para el botón "Descargar Excel de ejemplo" |
| `sitio/datos/ejemplo.js` | El mismo contenido de ambos Excel, hoja por hoja y fila por fila, para que el sitio abra con datos sin cargar nada |

`ejemplo.js` guarda las hojas exactamente como vienen en el Excel, no una versión ya procesada. Así el sitio pasa los
datos de ejemplo y los archivos que sube una persona por **el mismo proceso de lectura y validación**. Se verificó con
SheetJS que el contenido de los Excel y el de `ejemplo.js` coincide celda por celda.

## Hoja "Reportes"
| Columna | Tipo | Valores | Descripción |
|---|---|---|---|
| Folio | texto | `REP-0001` … `REP-0200` | Identificador ficticio, en orden de fecha de alta |
| Fecha y hora de alta | fecha y hora | 2026-10-07 a 2026-10-19 | Cuándo se recibió el reporte |
| Municipio | texto | 72 municipios de Sonora | Nombre según el Marco Geoestadístico 2025 del INEGI (con acentos, p. ej. "Álamos") |
| Localidad | texto | 275 localidades posibles | Nombre de una localidad real según el Censo 2020 |
| Latitud, Longitud | número (grados) | WGS84, 5 decimales | Punto aleatorio cerca de la localidad, siempre dentro de su municipio |
| Tipo de falla | lista | Sin servicio, Variación de voltaje, Poste dañado, Cable caído, Transformador dañado, Alumbrado, Otro | |
| Severidad | entero | 1 a 4 | 1 = menor, 4 = mayor |
| Usuarios afectados | entero | 0 a 1,800 | Estimado. En alumbrado siempre es 0 |
| Horas abiertas | entero | ≥ 1 | Pendientes: horas desde el alta hasta la fecha de corte. Cerrados: lo que tardó en cerrarse |
| Plazo de atención (horas) | entero | 4 a 72 | Depende del tipo de falla (tabla abajo) |
| Estado | lista | Abierto, En proceso, Cerrado | |
| Riesgo a la seguridad | lista | Sí, No | Si el reporte indica riesgo para personas o bienes |
| Reportes previos (30 días) | entero | 0 a 9 | Reportes anteriores en la misma localidad en los 30 días previos, según el historial del sistema (incluye reportes que no están en esta muestra) |
| Cuadrilla | texto | `Cuadrilla 01` … `Cuadrilla 20`, `Sin asignar` | Etiqueta genérica. Los cerrados y en proceso siempre tienen una |

En Excel, las columnas Tipo de falla, Estado y Riesgo a la seguridad tienen listas desplegables para evitar errores
al editar.

### Fecha de corte
Las horas abiertas se miden contra una **fecha de corte fija: 2026-10-19 08:00**, guardada en la hoja "Acerca de".
Así el ejemplo se ve igual sin importar cuándo se abra; si se midiera contra la hora actual, con el tiempo todos los
reportes quedarían vencidos.

### Plazos y comportamiento por tipo de falla (inventados, no son normas oficiales)
| Tipo | Plazo (h) | Severidades posibles | Usuarios afectados típicos | Probabilidad de riesgo | Proporción aprox. |
|---|---|---|---|---|---|
| Sin servicio | 8 | 2–4 | ~120 (5 a 2,500) | 3 % | 30 % |
| Variación de voltaje | 24 | 1–3 | ~40 (2 a 600) | 5 % | 18 % |
| Poste dañado | 48 | 2–4 | ~25 (0 a 300) | 20 % | 12 % |
| Cable caído | 4 | 3–4 | ~30 (1 a 400) | 85 % | 5 % |
| Transformador dañado | 24 | 3–4 | ~80 (15 a 400) | 15 % | 10 % |
| Alumbrado | 72 | 1–2 | 0 | 4 % | 14 % |
| Otro | 72 | 1–3 | ~5 (0 a 80) | 3 % | 8 % |

## Cómo se generaron (`scripts/generar_datos.py`)
- **Semilla fija** (`20261020`): cada ejecución produce archivos idénticos byte por byte.
- **Dónde:** se elige el municipio con probabilidad proporcional a *población^0.75* (Censo 2020). El exponente
  menor que 1 reparte un poco más hacia municipios pequeños. Dentro del municipio se elige una localidad según su
  población. El punto cae a una distancia aleatoria de la localidad, mayor en ciudades grandes (≈ 4 km en Hermosillo,
  < 1 km en pueblos), y se comprueba que quede dentro del municipio en el mapa.
- **Cuándo:** primero se decide qué tan avanzado va el reporte respecto a su plazo: ~70 % dentro del plazo,
  ~20 % entre 1 y 2 veces el plazo y ~10 % entre 2 y 4 veces. La fecha de alta se calcula hacia atrás desde la
  fecha de corte.
- **Estado:** ~55 % abiertos, ~30 % en proceso, ~15 % cerrados. La mitad de los abiertos no tiene cuadrilla asignada.
- **Usuarios afectados:** distribución log-normal alrededor del valor típico del tipo, con tope de un tercio de la
  población de la localidad.

### Resultado
- 200 reportes en **43 municipios**. Los que más tienen: Hermosillo 36, Cajeme 27, Nogales 21, San Luis Río Colorado 15
  y Guaymas 14.
- 163 pendientes (108 abiertos y 55 en proceso) y 37 cerrados.
- 46 pendientes vencidos y 25 pendientes (15 %) que son críticos por regla (cable caído o riesgo a la seguridad).

## Casos de prueba incluidos a propósito
| Folio | Caso | Datos clave | Qué debe pasar |
|---|---|---|---|
| REP-0200 | Cable caído con pocos usuarios | Cable caído, severidad 2, 3 usuarios, 1 h de 4, sin riesgo marcado, Bahía de Kino | Puntaje bajo, pero la regla de cable caído lo hace **crítico** |
| REP-0183 | Riesgo a la seguridad en falla menor | Variación de voltaje, severidad 1, 4 usuarios, 2 h de 24, **riesgo Sí**, Nogales | Puntaje bajo, pero la regla de riesgo lo hace **crítico** |
| REP-0003 | Vencido | Alumbrado, 230 h de 72 (3.2 veces el plazo), San Luis Río Colorado | El tiempo respecto al plazo aporta el máximo |
| REP-0006 | Vencido | Poste dañado, 150 h de 48 (3.1 veces), en proceso, Navojoa | Igual que el anterior |
| REP-0083 | Vencido | Sin servicio, 180 usuarios, 20 h de 8 (2.5 veces), Guaymas | Igual que el anterior |
| REP-0111, 0122, 0144, 0154, 0176, 0190 | Localidad recurrente | Seis reportes abiertos en **Pueblo Yaqui** (Cajeme), con 6 a 9 reportes previos | La recurrencia sube su urgencia |
| REP-0194 | Alto impacto, baja urgencia | Sin servicio, severidad 4, 1,800 usuarios, 1 h de 8, Hermosillo | Impacto alto y urgencia baja en la matriz; la regla de severidad 4 lo deja al menos en **alta** |
| REP-0179 | Crítico pero cerrado | Cable caído con riesgo, **cerrado**, Ciudad Obregón | No debe contar entre los pendientes ni en la matriz |

Estos folios se usarán en las pruebas automáticas de la Fase 4. Si se cambia la semilla o el generador, hay que
actualizar esta tabla; el script imprime los folios de los casos al terminar.

## Hoja "Pesos", "Umbrales" y "Reglas" (`criterios.xlsx`)
Son valores **iniciales**. La fórmula se define en la Fase 2 (`docs/modelo.md`) y puede ajustar estos valores.

**Pesos**: Criterio · Descripción · Peso · Eje de la matriz
| Criterio | Peso | Eje |
|---|---|---|
| Severidad | 30 | Impacto |
| Usuarios afectados | 25 | Impacto |
| Tiempo respecto al plazo | 20 | Urgencia |
| Recurrencia | 10 | Urgencia |
| Riesgo a la seguridad | 15 | Ninguno |

**Umbrales**: Prioridad · Puntaje mínimo · Qué significa. Crítica ≥ 70, Alta ≥ 50, Media ≥ 30, Baja ≥ 0.

**Reglas**: Regla (en lenguaje claro) · Campo · Condición · Valor · Prioridad mínima · Activa
| Regla | Campo | Condición | Valor | Prioridad mínima |
|---|---|---|---|---|
| Si el tipo de falla es cable caído, la prioridad es crítica. | Tipo de falla | es igual a | Cable caído | Crítica |
| Si hay riesgo a la seguridad, la prioridad es crítica. | Riesgo a la seguridad | es igual a | Sí | Crítica |
| Si la severidad es 4, la prioridad es al menos alta. | Severidad | mayor o igual que | 4 | Alta |
| Si hay 500 usuarios afectados o más, la prioridad es al menos alta. | Usuarios afectados | mayor o igual que | 500 | Alta |

Una regla solo puede **subir** la prioridad, nunca bajarla. Condiciones disponibles: "es igual a",
"mayor o igual que" y "menor o igual que".

## Cómo regenerar
```bash
python3 -m pip install -r scripts/requirements.txt
python3 scripts/preparar_localidades.py   # solo si se quiere rehacer la referencia del INEGI
bash scripts/preparar_mapa.sh             # solo si se quiere rehacer el mapa
python3 scripts/generar_datos.py
```
