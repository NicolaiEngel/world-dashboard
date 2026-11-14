"""World Bank Indicators API (WDI, CC BY 4.0)."""
from ..http import SourceError, get
from . import Fetched

API = "https://api.worldbank.org/v2/country/{country}/indicator/{code}"


def parse(payload, code: str) -> list:
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        msg = payload[0].get("message") if isinstance(payload, list) and payload and isinstance(payload[0], dict) else None
        raise SourceError(f"unexpected World Bank response for {code}: {msg or 'no data rows'}")
    rows = [r for r in payload[1] if r.get("value") is not None and str(r.get("date", "")).isdigit()]
    series = sorted(({"date": str(r["date"]), "value": float(r["value"])} for r in rows), key=lambda p: p["date"])
    if not series:
        raise SourceError(f"World Bank returned no values for {code}")
    return series


def fetch(session, code: str, country: str) -> Fetched:
    r = get(session, API.format(country=country, code=code), format="json", per_page=200)
    try:
        payload = r.json()
    except ValueError as e:
        raise SourceError("World Bank response is not JSON") from e
    return Fetched(series=parse(payload, code),
                   source={"name": "World Bank", "code": code,
                           "url": f"https://data.worldbank.org/indicator/{code}"})
