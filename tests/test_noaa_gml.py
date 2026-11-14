import pytest

from pipeline.http import SourceError
from pipeline.sources import noaa_gml
from helpers import text


def test_parses_recorded_csv():
    series = noaa_gml.parse(text("noaa_gml/co2_daily_mlo.csv"))
    assert len(series) == 12
    assert series[-1]["date"].count("-") == 2 and 380 < series[-1]["value"] < 480


def test_flagged_values_are_skipped_not_filled():
    raw = text("noaa_gml/co2_daily_mlo.csv")
    last = [l for l in raw.splitlines() if l and not l.startswith("#")][-1]
    flagged = raw.replace(last, last.rsplit(",", 1)[0] + ",-999.99")
    series = noaa_gml.parse(flagged)
    assert len(series) == 11 and all(p["value"] > 0 for p in series)


def test_comments_only_raises():
    raw = "\n".join(l for l in text("noaa_gml/co2_daily_mlo.csv").splitlines() if l.startswith("#"))
    with pytest.raises(SourceError):
        noaa_gml.parse(raw)
