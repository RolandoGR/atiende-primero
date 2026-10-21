"""Genera el código QR del enlace publicado, para la presentación.

Produce en docs/qr/:
  qr-atiende-primero.svg        vectorial: se ve nítido a cualquier tamaño (recomendado para diapositivas)
  qr-atiende-primero.png        1200 × 1200 px
  qr-atiende-primero-texto.png  con el nombre, la leyenda de ejemplo didáctico y el enlace escritos debajo

Uso: python3 scripts/generar_qr.py [enlace]
Requiere: python3 -m pip install -r scripts/requirements.txt
"""

import sys
from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont

ENLACE = sys.argv[1] if len(sys.argv) > 1 else "https://rolandogr.github.io/atiende-primero/"
SALIDA = Path(__file__).resolve().parent.parent / "docs" / "qr"
TINTA = "#1b1a18"


def crear_qr():
    # Corrección de errores media (M): se lee aunque el QR se proyecte con poca nitidez, sin volverse demasiado denso.
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=4, box_size=10)
    qr.add_data(ENLACE)
    qr.make(fit=True)
    return qr


def fuente(tamano, negrita=False):
    nombre = "DejaVuSans-Bold.ttf" if negrita else "DejaVuSans.ttf"
    for carpeta in ("/usr/share/fonts/truetype/dejavu", "/Library/Fonts", "C:/Windows/Fonts"):
        ruta = Path(carpeta) / nombre
        if ruta.exists():
            return ImageFont.truetype(str(ruta), tamano)
    return ImageFont.load_default()


def main():
    SALIDA.mkdir(parents=True, exist_ok=True)
    qr = crear_qr()

    qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(SALIDA / "qr-atiende-primero.svg")

    imagen = qr.make_image(fill_color=TINTA, back_color="white").convert("RGB")
    imagen = imagen.resize((1200, 1200), Image.NEAREST)
    imagen.save(SALIDA / "qr-atiende-primero.png", optimize=True)

    # Versión con texto: QR arriba y debajo el nombre, la leyenda y el enlace
    ancho, alto = 1200, 1560
    lienzo = Image.new("RGB", (ancho, alto), "white")
    lienzo.paste(imagen, (0, 0))
    dibujo = ImageDraw.Draw(lienzo)
    renglones = [
        ("Atiende Primero", fuente(72, True), TINTA),
        ("Ejemplo didáctico con datos ficticios", fuente(40), "#5c3b00"),
        (ENLACE.replace("https://", ""), fuente(40), "#4f4e4a"),
    ]
    y = 1190
    for texto, letra, color in renglones:
        caja = dibujo.textbbox((0, 0), texto, font=letra)
        dibujo.text(((ancho - (caja[2] - caja[0])) / 2, y), texto, font=letra, fill=color)
        y += (caja[3] - caja[1]) + 34
    lienzo.save(SALIDA / "qr-atiende-primero-texto.png", optimize=True)

    print(f"QR de {ENLACE} (versión {qr.version}, corrección M) en {SALIDA}")


if __name__ == "__main__":
    main()
