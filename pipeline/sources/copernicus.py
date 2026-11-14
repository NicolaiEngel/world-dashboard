"""Copernicus Climate Pulse: daily global 2 m air temperature anomaly (ERA5).

Climate Pulse publishes anomalies vs 1991-2020 only. Following C3S's documented practice,
1991-2020 is 0.88 °C above 1850-1900 (range 0.72-0.99; daily offsets 0.79-0.97), so the
value shown is ano_91-20 + offset, and the caveat says so.
Licence: Copernicus Licence, clear and visible attribution required.
"""
import csv
import io
from datetime import date

from ..http import SourceError, get
from . import Fetched

CSV = "https://sites.ecmwf.int/data/climatepulse/data/series/era5_daily_series_2t_global.csv"


def parse(text: str, offset: float) -> list:
    lines = [l for l in text.splitlines() if l and not l.startswith("#")]
    reader = csv.DictReader(io.StringIO("\n".join(lines)))
    if not reader.fieldnames or "ano_91-20" not in reader.fieldnames:
        raise SourceError("Climate Pulse CSV has no ano_91-20 column")
    out = []
    for row in reader:
        try:
            out.append({"date": row["date"], "value": float(row["ano_91-20"]) + offset})
        except (KeyError, TypeError, ValueError):
            continue
    if not out:
        raise SourceError("Climate Pulse CSV contained no data rows")
    return sorted(out, key=lambda p: p["date"])


def fetch(session, offset_to_1850_1900: float) -> Fetched:
    r = get(session, CSV)
    series = parse(r.text, offset_to_1850_1900)
    year = series[-1]["date"][:4] if series else str(date.today().year)
    note = (f"Converted from the 1991–2020 baseline by adding C3S's {offset_to_1850_1900:.2f} °C offset "
            "to 1850–1900 (daily offsets range 0.79–0.97 °C). Recent days are preliminary. "
            f"Generated using Copernicus Climate Change Service information {year}.")
    return Fetched(series=series, caveat_note=note,
                   source={"name": "Copernicus Climate Change Service (C3S)",
                           "url": "https://pulse.climate.copernicus.eu/"})
