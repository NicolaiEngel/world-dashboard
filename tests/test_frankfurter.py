import pytest

from pipeline.http import SourceError
from pipeline.sources import frankfurter
from helpers import js


def test_usd_series_from_recorded_ecb_rates():
    by_date = frankfurter.parse(js("frankfurter/rates_ecb.json"))
    usd = frankfurter.to_series(by_date, "USD")
    assert usd and all(0.5 < p["value"] < 2 for p in usd)
    assert [p["date"] for p in usd] == sorted(by_date)


def test_usd_cny_is_cny_divided_by_usd():
    rows = js("frankfurter/rates_ecb.json")
    by_date = frankfurter.parse(rows)
    d = sorted(by_date)[-1]
    expected = by_date[d]["CNY"] / by_date[d]["USD"]
    assert frankfurter.to_series(by_date, "USD/CNY")[-1] == {"date": d, "value": expected}


def test_empty_response_raises():
    with pytest.raises(SourceError):
        frankfurter.parse([])
