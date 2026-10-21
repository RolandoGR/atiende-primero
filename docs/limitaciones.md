# Limitaciones

**Atiende Primero es un ejemplo didáctico con datos ficticios.** Sirve para entender cómo se puede apoyar una
decisión con criterios explícitos y explicables. No es un sistema de operación ni está avalado por ninguna institución.

## Qué no hace
- **No decide.** Ordena reportes y explica por qué; la decisión sigue siendo de las personas.
- **No asigna cuadrillas ni calcula rutas.** No sabe dónde está cada cuadrilla, cuánto tarda en llegar ni qué
  material lleva.
- **No aprende de datos históricos.** Es una fórmula fija y transparente que define una persona. No usa
  aprendizaje automático ni "adivina" pesos.
- **No se conecta a ningún sistema.** No lee ni escribe en bases de datos, no recibe reportes en tiempo real y no
  manda avisos. Trabaja con un Excel a la vez, con una fecha de corte.
- **No tiene usuarios ni historial.** No hay inicio de sesión, permisos ni registro de quién cambió qué peso.
- **Solo sabe calcular 5 criterios:**
  - severidad;
  - usuarios afectados;
  - tiempo respecto al plazo;
  - recurrencia;
  - riesgo a la seguridad.

  Sus pesos, tablas, umbrales y reglas se cambian en Excel. Agregar un criterio nuevo al puntaje requiere cambiar
  el código (ver `adaptar-a-mi-area.md`).
- **No reabre sin señal.** Una vez abierta funciona sin conexión, pero recargarla sin señal no funciona en el sitio
  publicado. Con doble clic en la computadora siempre funciona.
- **El mapa es aproximado.** Los límites municipales se simplificaron para que carguen rápido. No sirven para medir
  distancias ni superficies.

## Qué decisiones siguen siendo humanas
| Decisión | Por qué no la puede tomar la herramienta |
|---|---|
| Qué criterios importan y cuánto pesa cada uno | Es una decisión de política: refleja prioridades, recursos y valores de la organización |
| Qué reglas duras existen | Dependen de normas de seguridad y de la experiencia de quien opera |
| Si los datos son correctos | Un número mal capturado produce una prioridad mal calculada, aunque la fórmula sea correcta |
| Qué hacer con los casos límite | Dos reportes con puntaje parecido pueden necesitar atención distinta por razones que no están en el Excel |
| Atender, posponer o escalar | La prioridad es una **sugerencia** para ordenar el trabajo; alguien tiene que decidir y responder por ello |

## Riesgos de usar una herramienta así
- **Exceso de confianza en un número.** Un puntaje de 83.5 parece preciso, pero solo es tan bueno como los pesos
  y los datos. Por eso la herramienta muestra siempre de dónde sale cada punto.
- **Sesgos de la fórmula.**
  - Dar mucho peso a "usuarios afectados" favorece a las ciudades grandes y puede dejar al final a localidades
    pequeñas con fallas graves.
  - La recurrencia puede castigar o favorecer zonas según cómo se capturen los reportes.

  Conviene revisar con regularidad quién queda abajo de la lista.
- **Pesos manipulables.** Cualquiera puede mover un peso para que "su" reporte suba. En uso real, los pesos deben
  definirse, documentarse y cambiarse por un proceso acordado, no a criterio de cada persona.
- **Datos incompletos.** Si faltan reportes o la información llega tarde, la lista se ve ordenada pero no refleja
  la realidad.

## Qué haría falta para usar datos reales
Esta herramienta **no debe usarse con datos reales de ninguna institución**. Para construir algo parecido con
información real haría falta, al menos:

1. **Autorización formal** de la institución, con un responsable del proyecto.
2. **Clasificar la información.** Hay que determinar qué datos son públicos, reservados o confidenciales, y si
   incluyen datos personales: nombres, direcciones, números de servicio o ubicaciones exactas de personas.
3. **Cumplir la normatividad aplicable** de transparencia, protección de datos personales, seguridad de la
   información y archivos, con asesoría del área jurídica y de la unidad de transparencia correspondientes.
4. **Herramientas e infraestructura institucionales**, no una página personal ni cuentas personales: servidores
   o nube autorizados, respaldo, continuidad.
5. **Control de acceso y bitácora:** quién puede ver los datos, quién puede cambiar pesos y reglas, y registro de
   cada cambio.
6. **Revisión de seguridad** por el área de tecnologías de la información.
7. **Validación con el personal operativo:**
   - que los criterios y las reglas tengan sentido en campo;
   - probar la lista contra decisiones pasadas;
   - medir si mejora la atención.
8. **Responsables de mantenimiento:** quién actualiza la herramienta, los datos geográficos y las reglas.
9. **Revisión periódica de resultados**, para detectar sesgos y errores (ver "Riesgos").

## Sobre las herramientas de IA
Este proyecto se construyó con Claude Code. La IA escribió código y documentación siguiendo instrucciones,
propuso opciones y una persona decidió en cada paso (ver `bitacora.md`). Para un proyecto real:
- revisa qué herramientas de IA están autorizadas en tu institución y bajo qué condiciones;
- **no compartas datos reales ni confidenciales con herramientas no autorizadas**;
- revisa y prueba lo que la IA produce: aquí, las pruebas automáticas encontraron y corrigieron varios errores
  (ver `validacion.md`).
