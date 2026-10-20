# Modelo de priorización

Cómo calcula **Atiende Primero** la prioridad de cada reporte. La idea es que cualquier persona pueda revisar
una prioridad con lápiz y papel: no hay "caja negra".

## En una frase
Cada reporte recibe un **puntaje de 0 a 100** que suma lo que aporta cada criterio según su peso. Los
**umbrales** convierten el puntaje en prioridad, y las **reglas duras** pueden subirla, pero nunca bajarla.

```
 Datos del reporte                Valor de 0 a 1           × Peso    = Aporte (puntos)
 ─────────────────────────────    ─────────────────────    ──────    ─────────────────
 Severidad (1 a 4)            →   tabla de Escalas         ×  30
 Usuarios afectados           →   tabla de Escalas         ×  25
 Horas abiertas ÷ plazo       →   tope en 1 (vencido = 1)  ×  20     Suma de aportes
 Reportes previos (30 días)   →   tabla de Escalas         ×  10     = PUNTAJE (0–100)
 Riesgo a la seguridad        →   Sí = 1, No = 0           ×  15
                                                                         │
                     Umbrales: Crítica ≥ 70 · Alta ≥ 50 · Media ≥ 30 · Baja
                                                                         │
                                                       Prioridad por puntaje
                                                                         │
             Reglas duras: si se cumple una, la prioridad sube al menos a la que indica
                                                                         │
                                                         PRIORIDAD FINAL
```

Todo lo que aparece en este diagrama (pesos, tablas, umbrales y reglas) se edita en `criterios.xlsx` o desde la
interfaz, sin tocar código.

## Paso 1. Convertir cada criterio a un valor de 0 a 1
Los datos vienen en unidades distintas (una severidad de 1 a 4, cientos de usuarios, horas). Para sumarlos, cada
uno se convierte primero a un valor entre 0 (no aporta) y 1 (aporta todo su peso).

**Severidad, usuarios afectados y recurrencia** usan las tablas de la hoja **Escalas**. Cada tramo vale desde
"A partir de" hasta el inicio del siguiente tramo:

| Severidad | Valor | | Usuarios afectados | Valor | | Reportes previos (30 días) | Valor |
|---|---|---|---|---|---|---|---|
| 1 | 0 | | 0 | 0 | | 0 | 0 |
| 2 | 0.33 | | 1 a 10 | 0.25 | | 1 | 0.2 |
| 3 | 0.67 | | 11 a 100 | 0.5 | | 2 | 0.4 |
| 4 | 1 | | 101 a 500 | 0.75 | | 3 | 0.6 |
| | | | 501 o más | 1 | | 4 | 0.8 |
| | | | | | | 5 o más | 1 |

**Tiempo respecto al plazo** = horas abiertas ÷ plazo de atención, con tope en 1. A la mitad del plazo vale 0.5;
un reporte vencido vale 1.

**Riesgo a la seguridad** vale 1 si dice "Sí" y 0 si dice "No".

## Paso 2. Sumar los aportes
**Aporte de un criterio = peso × valor.** El puntaje es la suma de los aportes.

Si los pesos no suman 100, el puntaje se ajusta para seguir entre 0 y 100: aporte = peso × valor × 100 ÷ (suma de
pesos). Por eso duplicar todos los pesos no cambia nada; lo que importa es la proporción entre ellos.

## Paso 3. Prioridad por puntaje (hoja Umbrales)
| Prioridad | Puntaje mínimo | Qué significa |
|---|---|---|
| Crítica | 70 | Atender de inmediato |
| Alta | 50 | Atender en el turno |
| Media | 30 | Programar en los próximos días |
| Baja | 0 | Atender cuando haya capacidad |

## Paso 4. Reglas duras (hoja Reglas)
Algunas situaciones deben atenderse primero sin importar el puntaje. Cada regla dice qué columna revisar, qué
condición se debe cumplir y qué **prioridad mínima** impone:

| Regla | Prioridad mínima |
|---|---|
| Si el tipo de falla es cable caído, la prioridad es crítica. | Crítica |
| Si hay riesgo a la seguridad, la prioridad es crítica. | Crítica |
| Si la severidad es 4, la prioridad es al menos alta. | Alta |
| Si hay 500 usuarios afectados o más, la prioridad es al menos alta. | Alta |

**Prioridad final = la más alta entre la del puntaje y la de las reglas que se cumplen.**
- Una regla nunca baja una prioridad ni cambia el puntaje. Así el puntaje sigue diciendo "qué tan grave se ve por
  sus datos" y la regla explica por qué subió.
- Las reglas pueden revisar **cualquier columna** de la hoja Reportes, incluso una que la persona agregue (por ejemplo,
  "Zona = hospital").
- Las pruebas automáticas comprueban que ninguna prioridad viole las reglas, con los pesos originales y con
  200 combinaciones de pesos al azar.

## Paso 5. Ejes de la matriz (impacto × urgencia)
La columna "Eje de la matriz" de la hoja Pesos dice en qué eje cuenta cada criterio:
- **Impacto** = promedio ponderado de severidad y usuarios afectados: (30 × severidad + 25 × usuarios) ÷ 55.
- **Urgencia** = promedio ponderado de tiempo y recurrencia: (20 × tiempo + 10 × recurrencia) ÷ 30.
- El riesgo a la seguridad no está en ningún eje porque su regla ya lo vuelve crítico.

Cada eje se divide en tres niveles: **Bajo** (menos de 0.33), **Medio** (0.33 a 0.67) y **Alto** (0.67 o más).
Resulta una matriz de 3 × 3. Los reportes **cerrados** no aparecen en la matriz ni en los indicadores.

## Orden de la lista de atención
1. Prioridad final (crítica primero).
2. Puntaje (mayor primero).
3. Parte del plazo ya consumida (el más atrasado primero).
4. Folio.

---

## Ejemplo 1, calculado a mano: REP-0200 (cable caído con pocos usuarios)
Datos: cable caído en Bahía de Kino (Hermosillo), severidad 2, 3 usuarios afectados, 1 hora abierta de un plazo
de 4, sin reportes previos y sin riesgo marcado.

| Criterio | Dato | Valor 0–1 | Peso | Aporte |
|---|---|---|---|---|
| Severidad | 2 | 0.33 | 30 | 0.33 × 30 = **9.90** |
| Usuarios afectados | 3 (tramo de 1 a 10) | 0.25 | 25 | 0.25 × 25 = **6.25** |
| Tiempo respecto al plazo | 1 h ÷ 4 h = 0.25 | 0.25 | 20 | 0.25 × 20 = **5.00** |
| Recurrencia | 0 reportes previos | 0 | 10 | **0** |
| Riesgo a la seguridad | No | 0 | 15 | **0** |
| | | | **Puntaje** | **21.15** |

- Por puntaje: 21.15 < 30 → **Baja**.
- Regla "Si el tipo de falla es cable caído, la prioridad es crítica" → se cumple → **Crítica**.
- **Prioridad final: Crítica**, elevada por regla. Impacto = (30 × 0.33 + 25 × 0.25) ÷ 55 = 0.29 (bajo);
  urgencia = (20 × 0.25 + 10 × 0) ÷ 30 = 0.17 (baja).

Es el caso que justifica las reglas duras: los números por sí solos dirían "baja", pero un cable caído es un
peligro aunque afecte a pocas personas.

## Ejemplo 2, calculado a mano: REP-0083 (sin servicio, vencido)
Datos: sin servicio en Heroica Guaymas, severidad 3, 180 usuarios afectados, 20 horas abiertas de un plazo de 8,
1 reporte previo y sin riesgo.

| Criterio | Dato | Valor 0–1 | Peso | Aporte |
|---|---|---|---|---|
| Severidad | 3 | 0.67 | 30 | 0.67 × 30 = **20.10** |
| Usuarios afectados | 180 (tramo de 101 a 500) | 0.75 | 25 | 0.75 × 25 = **18.75** |
| Tiempo respecto al plazo | 20 h ÷ 8 h = 2.5 → tope 1 | 1 | 20 | 1 × 20 = **20.00** |
| Recurrencia | 1 reporte previo | 0.2 | 10 | 0.2 × 10 = **2.00** |
| Riesgo a la seguridad | No | 0 | 15 | **0** |
| | | | **Puntaje** | **60.85** |

- Por puntaje: 60.85 ≥ 50 → **Alta**. No se cumple ninguna regla.
- **Prioridad final: Alta.** Impacto = (30 × 0.67 + 25 × 0.75) ÷ 55 = 0.71 (alto); urgencia = (20 × 1 + 10 × 0.2) ÷ 30
  = 0.73 (alta).

Ambos ejemplos se comprueban en `pruebas/modelo.test.js`.

---

## Por qué así (decisiones y alternativas)
Antes de elegir, se simuló el reparto de prioridades de los 163 reportes pendientes del ejemplo con varias opciones.
Pesos 30/25/20/10/15 y umbrales 70/50/30.

| Usuarios afectados | Tiempo | Baja / Media / Alta / Crítica (solo puntaje) | Observación |
|---|---|---|---|
| Lineal (usuarios ÷ 1,000) | máximo al doble del plazo | 92 / 58 / 12 / 1 | Casi todo cae en baja: la mayoría de los reportes afecta a pocos usuarios |
| Logarítmica | máximo al doble del plazo | 46 / 73 / 37 / 7 | La matriz se concentra en urgencia baja |
| **Por tramos** | **% del plazo consumido** | **31 / 74 / 48 / 10** | **Elegida:** reparto equilibrado y las 9 celdas de la matriz con reportes |

- **Suma ponderada** en lugar de impacto × urgencia: con una multiplicación, un criterio en cero anula a los demás
  y el desglose "cada criterio aporta X puntos" deja de ser directo.
- **Reglas como prioridad mínima** en lugar de "puntos extra": con puntos extra, unos pesos poco comunes podrían
  dejar un cable caído por debajo de crítica.
- **Tramos** en lugar de una curva: se explican en una frase ("de 11 a 100 usuarios vale la mitad") y se editan en
  Excel.

**Resultado con los datos de ejemplo** (163 pendientes): Baja 32 · Media 66 · Alta 39 · Crítica 26. De los 26
críticos, 16 lo son por una regla.

## Qué no hace el modelo
- No se pueden **agregar criterios nuevos** al puntaje solo desde Excel: el modelo sabe calcular cinco criterios.
  Lo que sí se puede sin tocar código es cambiar sus pesos, sus tablas de conversión, los umbrales y las reglas,
  y escribir reglas sobre columnas nuevas.
- No considera distancias, rutas ni disponibilidad de cuadrillas.
- No aprende de datos históricos: es una fórmula fija y transparente que define una persona.
- La prioridad es una **sugerencia** para ordenar el trabajo. La decisión final sigue siendo humana.

## Dónde está el código
- `sitio/js/modelo.js`: el cálculo (`evaluar`, `priorizar`, `resumen` y `conPesos` para el ajuste en vivo).
- `sitio/js/lectura.js`: lee y valida los Excel y explica los errores en lenguaje claro.
- `pruebas/`: 35 pruebas automáticas del cálculo (`npm test`), además de las pruebas en navegador (ver `docs/validacion.md`).
