"""Our World in Data grapher charts (CSV + metadata). Refuses non-redistributable data.

For conflict deaths only UCDP years (1989 onwards) are kept: earlier World values come
from PRIO, whose licence hasn't been cleared.
"""
import csv
import io

from ..http import SourceError, get
from . import Fetched

BASE = "https://ourworldindata.org/grapher/{slug}"
PARAMS = {"v": "1", "csvType": "full", "useColumnShortNames": "true"}


def check_metadata(meta: dict) -> None:
    cols = (meta or {}).get("columns") or {}
    if not cols:
        raise SourceError("OWID metadata has no columns")
    for name, col in cols.items():
        if col.get("nonRedistributable"):
            raise SourceError(f"OWID column {name} is marked nonRedistributable")


def parse(text: str, entity: str, min_year: int = 1989) -> list:
    reader = csv.DictReader(io.StringIO(text))
    fields = reader.fieldnames or []
    value_cols = [f for f in fields if f not in ("entity", "code", "year", "Entity", "Code", "Year")]
    if len(value_cols) != 1:
        raise SourceError(f"expected one value column in OWID CSV, got {value_cols}")
    col = value_cols[0]
    out = []
    for row in reader:
        if (row.get("entity") or row.get("Entity")) != entity:
            continue
        try:
            year = int(row.get("year") or row.get("Year"))
            value = float(row[col])
        except (TypeError, ValueError):
            continue
        if year >= min_year:
            out.append({"date": str(year), "value": value})
    if not out:
        raise SourceError(f"no {entity} rows in OWID CSV")
    return sorted(out, key=lambda p: p["date"])


def fetch(session, slug: str, entity: str) -> Fetched:
    url = BASE.format(slug=slug)
    meta = get(session, url + ".metadata.json", **PARAMS)
    try:
        check_metadata(meta.json())
    except ValueError as e:
        raise SourceError("OWID metadata is not JSON") from e
    r = get(session, url + ".csv", **PARAMS)
    return Fetched(series=parse(r.text, entity),
                   source={"name": "UCDP via Our World in Data", "url": url})
