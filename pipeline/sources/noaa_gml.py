"""NOAA GML daily mean CO2 at Mauna Loa (freely available; credit requested)."""
from ..http import SourceError, get
from . import Fetched

CSV = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv"


def parse(text: str) -> list:
    """Rows: year,month,day,decimal_date,co2 (comment lines start with #). Flagged values
    (<= -99) are skipped, never filled in."""
    out = []
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split(",")]
        if len(parts) < 5:
            continue
        try:
            y, m, d, value = int(parts[0]), int(parts[1]), int(parts[2]), float(parts[4])
        except ValueError:
            continue  # header or malformed row
        if value <= -99:
            continue
        out.append({"date": f"{y:04d}-{m:02d}-{d:02d}", "value": value})
    if not out:
        raise SourceError("NOAA CSV contained no data rows")
    return sorted(out, key=lambda p: p["date"])


def fetch(session) -> Fetched:
    r = get(session, CSV)
    return Fetched(series=parse(r.text),
                   source={"name": "NOAA GML, Mauna Loa", "url": "https://gml.noaa.gov/ccgg/trends/"})
