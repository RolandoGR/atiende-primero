# Publicación

**Enlace final:** https://rolandogr.github.io/atiende-primero/

**Código QR** (en `docs/qr/`):
- `qr-atiende-primero.svg`: vectorial, recomendado para diapositivas;
- `qr-atiende-primero.png`: 1200 px;
- `qr-atiende-primero-texto.png`: con el nombre y el enlace escritos debajo.

Se generan con `python3 scripts/generar_qr.py` y se comprobó con un lector independiente que llevan al enlace correcto.

![Código QR](qr/qr-atiende-primero-texto.png)

## Cómo se publica
- El sitio es estático: solo se publica la carpeta `sitio/`.
- El flujo `.github/workflows/publicar.yml` se ejecuta cada vez que cambia la rama `main`, o a mano desde la
  pestaña **Actions → Publicar en GitHub Pages → Run workflow**:
  1. **Pruebas:** corre las pruebas del cálculo (`node --test "pruebas/*.test.js"`). Si alguna falla, **no se
     publica**.
  2. **Publicar:** sube `sitio/` a GitHub Pages.
- Versiones de las acciones oficiales al 21 de octubre de 2026: `actions/checkout@v7`, `actions/setup-node@v7`,
  `actions/configure-pages@v6`, `actions/upload-pages-artifact@v5`, `actions/deploy-pages@v5`.

### Pasos (una sola vez)
1. **Dar a Claude permiso de escritura** en el repositorio: instala la Claude GitHub App en
   https://github.com/apps/claude/installations/new y elige `atiende-primero`. Sin esto no se puede subir el
   trabajo (error 403).
2. **Subir el trabajo** a la rama `main` del repositorio `RolandoGR/atiende-primero`.
3. En GitHub, abre el repositorio → **Settings** → **Pages** → en **Build and deployment**, **Source**:
   elige **GitHub Actions**.
4. Ve a la pestaña **Actions** y espera a que "Publicar en GitHub Pages" termine en verde, en unos 2 minutos. Si se
   subió antes del paso 3, usa **Run workflow** para lanzarlo de nuevo.
5. Abre https://rolandogr.github.io/atiende-primero/.

### Estado
- ✅ **Publicado el 21 de octubre de 2026.** El flujo "Publicar en GitHub Pages" terminó en verde: pruebas en 11 s y
  publicación en 15 s. Despliegue registrado en el entorno `github-pages`.
- Lección: el primer intento falló con "Get Pages site failed… Not Found" porque Pages no estaba activado en este
  repositorio. Se activó en `https://github.com/RolandoGR/atiende-primero/settings/pages` → Source: GitHub Actions.

### Comprobado antes de publicar (simulación local)
- El sitio servido bajo la subcarpeta `/atiende-primero/`, como en GitHub Pages, abre con los 200 reportes.
- Los Excel de ejemplo se descargan y la página de documentación enlaza de ida y vuelta con la herramienta.
- No hay rutas absolutas ni archivos faltantes (0 errores 404).
- `npm test` 37/37, `npm run humo` 33/33, `npm run validacion` 111/111.

## Lista de verificación final (con el enlace ya publicado)
Marca cada punto en dispositivos reales. Son las pruebas que no se pudieron hacer en el entorno de trabajo (ver
`validacion.md`).

**Acceso**
- [ ] El QR, escaneado desde la diapositiva o el proyector, abre el enlace en iPhone y en Android.
- [ ] La herramienta abre de inmediato con los datos de ejemplo y la leyenda "Ejemplo didáctico con datos ficticios".
- [ ] En el navegador se ve el candado de conexión segura (`https://`).

**Celulares (al menos un iPhone con Safari y un Android con Chrome)**
- [ ] El recorrido guiado aparece la primera vez y se puede saltar.
- [ ] Las 4 pestañas funcionan. El mapa se acerca con dos dedos y al tocar un municipio.
- [ ] Al tocar un reporte se ve el desglose de su puntaje, y la leyenda sigue visible.
- [ ] Mover un peso reordena la lista.
- [ ] "Copiar enlace" y abrirlo en otro celular muestra los mismos pesos.

**Computadora y proyector**
- [ ] En Chrome, Edge y Firefox se ven las tres columnas y el detalle lateral.
- [ ] En el proyector se lee desde el fondo del salón.

**Excel**
- [ ] Los botones "Descargar reportes.xlsx / criterios.xlsx de ejemplo" descargan los archivos.
- [ ] Editar un peso o una regla en Excel y volver a cargarlo cambia el orden.
- [ ] "Exportar" descarga la lista priorizada.

**Sin conexión y privacidad**
- [ ] Abrir la herramienta, activar el modo avión, cargar un Excel y exportar: funciona.
- [ ] La capa de calles está apagada y avisa antes de activarse.

**Documentación**
- [ ] El botón "Docs" abre la página de documentación, y desde ahí se regresa a la herramienta.
- [ ] Los enlaces a GitHub (guía, bitácora, código) abren y el repositorio es **público**.
- [ ] Una persona ajena al proyecto entiende la página "Qué es / Cómo usarla" sin ayuda.

**Opcional**
- [ ] Agregar un enlace a la herramienta desde tu página personal (`RolandoGR.github.io`).
- [ ] Revisar la herramienta con VoiceOver (iPhone) o TalkBack (Android).

## Para actualizar después
- Cualquier cambio que llegue a `main` se publica solo, si pasan las pruebas.
- Si cambias el enlace (otro nombre de repositorio o un dominio propio), vuelve a generar el QR:
  `python3 scripts/generar_qr.py https://nuevo-enlace/`
