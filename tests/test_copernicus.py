import pytest

from pipeline.http import SourceError
from pipeline.sources import copernicus
from helpers import text


def test_adds_offset_to_1991_2020_anomaly():
    raw = text("copernicus/era5_daily_series_2t_global.csv")
    last = [l for l in raw.splitlines() if l and not l.startswith("#")][-1].split(",")
    series = copernicus.parse(raw, 0.88)
    assert series[-1]["date"] == last[0]
    assert series[-1]["value"] == pytest.approx(float(last[3]) + 0.88)


def test_missing_column_raises():
    raw = text("copernicus/era5_daily_series_2t_global.csv").replace("ano_91-20", "something_else")
    with pytest.raises(SourceError, match="ano_91-20"):
        copernicus.parse(raw, 0.88)
