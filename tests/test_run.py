import json
import os
from datetime import datetime, timezone

from pipeline import run as runner
from pipeline.http import SourceError
from pipeline.sources import Fetched

ROOT = os.path.dirname(os.path.dirname(__file__))


def mock_data():
    with open(os.path.join(ROOT, "data", "mock-data.json"), encoding="utf-8") as f:
        return json.load(f)


def daily(n=800, value=1.1):
    from datetime import date, timedelta
    end = date(2026, 11, 13)
    return [{"date": (end - timedelta(days=n - 1 - i)).isoformat(), "value": value} for i in range(n)]


def annual(value):
    return [{"date": str(y), "value": value} for y in range(1990, 2025)]


WB_VALUES = {"SP.POP.TOTL": 8.2e9, "SP.DYN.TFRT.IN": 2.2, "NY.GDP.MKTP.KD.ZG": 3.1,
             "SH.DYN.MORT": 37.0, "SP.DYN.LE00.IN": 73.0, "SH.H2O.SMDW.ZS": 74.0}


def ok_sources(**override):
    src = {
        "world_bank": lambda s, code, country: Fetched(annual(WB_VALUES[code]), {"name": "World Bank", "url": "u"}),
        "frankfurter": lambda s, quote: Fetched(daily(value=7.1 if quote == "USD/CNY" else 1.1),
                                               {"name": "ECB via Frankfurter", "url": "u"}),
        "noaa_gml": lambda s: Fetched(daily(value=425.0), {"name": "NOAA", "url": "u"}),
        "copernicus": lambda s, offset_to_1850_1900: Fetched(daily(value=1.5), {"name": "C3S", "url": "u"},
                                                             caveat_note="Converted."),
        "owid": lambda s, slug, entity: Fetched(annual(150000.0), {"name": "UCDP via OWID", "url": "u"}),
    }
    src.update(override)
    return src


NOW = datetime(2026, 11, 14, 5, 17, tzinfo=timezone.utc)


def test_success_keeps_ids_order_and_wording():
    m = mock_data()
    out, summary = runner.run(m, session=object(), sources=ok_sources(), now=NOW)
    assert [i["id"] for i in out["indicators"]] == [i["id"] for i in m["indicators"]]
    assert out["categories"] == m["categories"] and out["schema_version"] == m["schema_version"]
    by = {i["id"]: i for i in out["indicators"]}
    mock_by = {i["id"]: i for i in m["indicators"]}
    life = by["life_expectancy"]
    assert life["mock"] is False and life["title"] == mock_by["life_expectancy"]["title"]
    assert life["as_of"] == life["series"][-1]["date"] == "2024"
    assert by["population"]["series"][-1]["value"] == 8.2  # people -> billions, 2 decimals
    assert len(by["eur_usd"]["series"]) <= 730  # daily window
    assert by["temp_anomaly"]["caveat"].endswith("Converted.")
    assert out["generated_at"] == "2026-11-14T05:17:00Z"


def test_licence_not_cleared_stays_mock_without_contact():
    calls = []
    src = ok_sources()
    src["coingecko"] = lambda *a, **k: calls.append(1)
    out, summary = runner.run(mock_data(), session=object(), sources=src, now=NOW)
    btc = next(i for i in out["indicators"] if i["id"] == "btc_usd")
    assert btc["mock"] is True and not calls
    assert ("btc_usd", "mock", "licence not cleared") in summary
    assert out["mock"] is True


def boom(*a, **k):
    raise SourceError("HTTP 503 from example")


def test_source_error_keeps_mock_entry_unchanged_and_continues():
    m = mock_data()
    out, summary = runner.run(m, session=object(), sources=ok_sources(noaa_gml=boom), now=NOW)
    co2 = next(i for i in out["indicators"] if i["id"] == "co2_ppm")
    assert co2 == next(i for i in m["indicators"] if i["id"] == "co2_ppm")
    assert ("co2_ppm", "mock", "SourceError: HTTP 503 from example") in summary
    assert sum(1 for _, s, _ in summary if s == "real") == 11


def test_empty_series_falls_back():
    out, summary = runner.run(mock_data(), session=object(),
                              sources=ok_sources(owid=lambda s, slug, entity: Fetched([], {"name": "x", "url": "u"})),
                              now=NOW)
    state = dict((i, (s, d)) for i, s, d in summary)["conflict_deaths"]
    assert state[0] == "mock" and "empty series" in state[1]


def test_out_of_range_falls_back():
    out, summary = runner.run(mock_data(), session=object(),
                              sources=ok_sources(noaa_gml=lambda s: Fetched(daily(value=999.0), {"name": "x", "url": "u"})),
                              now=NOW)
    state = dict((i, (s, d)) for i, s, d in summary)["co2_ppm"]
    assert state[0] == "mock" and "range check failed" in state[1]


def test_summary_lists_every_indicator(tmp_path, monkeypatch):
    out, summary = runner.run(mock_data(), session=object(), sources=ok_sources(), now=NOW)
    text = runner.format_summary(summary)
    assert text.startswith("Data run: 12 of 13 indicators real")
    assert all(i["id"] in text for i in out["indicators"])
    p = tmp_path / "out.json"
    runner.write_atomic(str(p), out)
    assert json.loads(p.read_text())["indicators"][0]["id"] == out["indicators"][0]["id"]
