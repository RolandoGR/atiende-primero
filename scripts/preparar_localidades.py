"""Prepara las tablas de referencia geográfica que usa el generador de datos ficticios.

Fuente: INEGI, Censo de Población y Vivienda 2020, Principales resultados por localidad (ITER), Sonora.
Solo se toman datos públicos y agregados: nombre de municipio y localidad, coordenadas y población total.

Resultado (se versiona en el repositorio para no depender de la descarga):
  scripts/referencia/municipios_sonora.csv   clave, municipio, poblacion_2020
  scripts/referencia/localidades_sonora.csv  clave_mun, municipio, clave_loc, localidad, latitud, longitud, poblacion_2020

Se conservan las localidades con al menos POBLACION_MINIMA habitantes y, siempre, la cabecera
municipal (clave de localidad 0001), para que cada municipio tenga al menos un lugar.

Uso: python3 scripts/preparar_localidades.py
"""

import csv
import hashlib
import io
import re
import urllib.request
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ZIP = RAIZ / "fuentes" / "inegi" / "iter2020" / "iter_26_cpv2020_csv.zip"
URL = "https://www.inegi.org.mx/contenidos/programas/ccpv/2020/datosabiertos/iter/iter_26_cpv2020_csv.zip"
SHA256 = "4ad9380527c248bb236bd90eefed760b0f8796eaeab7c469f95ead033e96dee2"
CSV_INTERNO = "iter_26_cpv2020/conjunto_de_datos/conjunto_de_datos_iter_26CSV20.csv"
SALIDA = RAIZ / "scripts" / "referencia"
POBLACION_MINIMA = 500


def descargar():
    if not ZIP.exists():
        print("Descargando ITER 2020 de Sonora...")
        ZIP.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(URL, ZIP)
    huella = hashlib.sha256(ZIP.read_bytes()).hexdigest()
    if huella != SHA256:
        raise SystemExit(f"La huella del archivo no coincide ({huella}). Revisa la versión antes de continuar.")


def dms_a_decimal(texto):
    """Convierte '109°32'46.865" W' a -109.546351."""
    grados, minutos, segundos, hemisferio = re.match(r"(\d+)°(\d+)'([\d.]+)\"\s*([NSEW])", texto.strip()).groups()
    valor = int(grados) + int(minutos) / 60 + float(segundos) / 3600
    return round(-valor if hemisferio in "SW" else valor, 6)


def main():
    descargar()
    with zipfile.ZipFile(ZIP) as z:
        filas = list(csv.DictReader(io.TextIOWrapper(z.open(CSV_INTERNO), encoding="utf-8-sig")))

    municipios = [f for f in filas if f["MUN"] != "000" and f["LOC"] == "0000"]
    localidades = [
        f for f in filas
        if f["LOC"] not in ("0000", "9998", "9999")
        and (int(f["POBTOT"]) >= POBLACION_MINIMA or f["LOC"] == "0001")
    ]

    SALIDA.mkdir(parents=True, exist_ok=True)
    with open(SALIDA / "municipios_sonora.csv", "w", newline="", encoding="utf-8") as s:
        w = csv.writer(s)
        w.writerow(["clave", "municipio", "poblacion_2020"])
        for f in sorted(municipios, key=lambda f: f["MUN"]):
            w.writerow(["26" + f["MUN"], f["NOM_MUN"], int(f["POBTOT"])])

    with open(SALIDA / "localidades_sonora.csv", "w", newline="", encoding="utf-8") as s:
        w = csv.writer(s)
        w.writerow(["clave_mun", "municipio", "clave_loc", "localidad", "latitud", "longitud", "poblacion_2020"])
        for f in sorted(localidades, key=lambda f: (f["MUN"], f["LOC"])):
            w.writerow([
                "26" + f["MUN"], f["NOM_MUN"], f["LOC"], f["NOM_LOC"],
                dms_a_decimal(f["LATITUD"]), dms_a_decimal(f["LONGITUD"]), int(f["POBTOT"]),
            ])

    print(f"Listo: {len(municipios)} municipios y {len(localidades)} localidades en {SALIDA}")


if __name__ == "__main__":
    main()
