import pytest

from pipeline.http import SourceError
from pipeline.sources import world_bank
from helpers import js


def test_parses_recorded_response_and_drops_nulls():
    payload = js("world_bank/sh_dyn_mort_wld.json")
    series = world_bank.parse(payload, "SH.DYN.MORT")
    raw = [r for r in payload[1] if r["value"] is not None]
    assert len(series) == len(raw) and len(series) < len(payload[1])  # the recorded 2025 row is null
    assert [p["date"] for p in series] == sorted(p["date"] for p in series)
    assert all(isinstance(p["value"], float) for p in series)


def test_error_payload_raises():
    with pytest.raises(SourceError, match="not valid"):
        world_bank.parse(js("world_bank/invalid_indicator.json"), "NOT.A.CODE")


def test_all_null_rows_raise():
    payload = js("world_bank/sh_dyn_mort_wld.json")
    nulls = [dict(r, value=None) for r in payload[1]]
    with pytest.raises(SourceError, match="no values"):
        world_bank.parse([payload[0], nulls], "SH.DYN.MORT")
