import copy

import pytest

from pipeline.http import SourceError
from pipeline.sources import owid
from helpers import js, text


def test_world_rows_from_1989_only():
    series = owid.parse(text("owid/conflict.csv"), "World")
    assert [p["date"] for p in series] == ["2020", "2021", "2022", "2023", "2024", "2025"]  # 1946/47 (PRIO) dropped


def test_recorded_metadata_is_redistributable():
    owid.check_metadata(js("owid/conflict_metadata.json"))


def test_non_redistributable_is_refused():
    meta = copy.deepcopy(js("owid/conflict_metadata.json"))
    for col in meta["columns"].values():
        col["nonRedistributable"] = True
    with pytest.raises(SourceError, match="nonRedistributable"):
        owid.check_metadata(meta)


def test_unknown_entity_raises():
    with pytest.raises(SourceError):
        owid.parse(text("owid/conflict.csv"), "Atlantis")
