"""ECB euro reference rates via Frankfurter (ECB provider only, not blended rates)."""
from datetime import date, timedelta

from ..http import SourceError, get
from . import Fetched

API = "https://api.frankfurter.dev/v2/rates"
SOURCE = {"name": "ECB via Frankfurter",
          "url": "https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html"}

_cache: dict = {}


def parse(rows) -> dict:
    """[{date, base, quote, rate}] -> {date: {quote: rate}} for EUR-based ECB rates."""
    if not isinstance(rows, list) or not rows:
        raise SourceError("Frankfurter returned no rates")
    by_date: dict = {}
    for r in rows:
        if r.get("base") != "EUR" or r.get("rate") is None:
            continue
        by_date.setdefault(r["date"], {})[r["quote"]] = float(r["rate"])
    if not by_date:
        raise SourceError("Frankfurter returned no EUR-based rates")
    return by_date


def to_series(by_date: dict, quote: str) -> list:
    out = []
    for d in sorted(by_date):
        q = by_date[d]
        if quote == "USD/CNY":  # USD/CNY = (EUR/CNY) / (EUR/USD)
            if "CNY" in q and "USD" in q:
                out.append({"date": d, "value": q["CNY"] / q["USD"]})
        elif quote in q:
            out.append({"date": d, "value": q[quote]})
    if not out:
        raise SourceError(f"no {quote} values in Frankfurter response")
    return out


def fetch(session, quote: str, today: date | None = None) -> Fetched:
    start = ((today or date.today()) - timedelta(days=740)).isoformat()
    if start not in _cache:  # one call serves both FX indicators
        r = get(session, API, base="EUR", quotes="USD,CNY", providers="ECB", **{"from": start})
        try:
            _cache[start] = parse(r.json())
        except ValueError as e:
            raise SourceError("Frankfurter response is not JSON") from e
    return Fetched(series=to_series(_cache[start], quote), source=dict(SOURCE))
