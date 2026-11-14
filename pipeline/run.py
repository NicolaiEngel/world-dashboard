"""Fetch real data for each indicator and write data/dashboard.json.

    python -m pipeline.run [--mock data/mock-data.json] [--out data/dashboard.json]

Every indicator starts from its mock entry (wording, unit, decimals). Indicators whose
source is licence-cleared are fetched; on any failure the mock entry is kept unchanged.
A single source failing never fails the run.
"""
import argparse
import copy
import json
import os
import sys
import tempfile
from datetime import date, datetime, timedelta, timezone

from .http import SourceError, make_session
from .indicators import INDICATORS
from .sources import copernicus, frankfurter, noaa_gml, owid, world_bank

SOURCES = {
    "world_bank": world_bank.fetch,
    "frankfurter": frankfurter.fetch,
    "noaa_gml": noaa_gml.fetch,
    "copernicus": copernicus.fetch,
    "owid": owid.fetch,
}


def window(series: list, days: int | None) -> list:
    if not days or not series:
        return series
    last = date.fromisoformat(series[-1]["date"])
    cutoff = (last - timedelta(days=days)).isoformat()
    return [p for p in series if p["date"] > cutoff]


def build_entry(mock: dict, spec: dict, fetched) -> dict:
    scale = spec.get("scale", 1)
    decimals = mock["decimals"]
    series = window(fetched.series, spec.get("window_days"))
    series = [{"date": p["date"], "value": round(p["value"] * scale, decimals)} for p in series]
    if not series:
        raise SourceError("empty series after windowing")
    latest = series[-1]["value"]
    checks = spec.get("checks") or {}
    if not (checks.get("min", float("-inf")) <= latest <= checks.get("max", float("inf"))):
        raise SourceError(f"range check failed: latest value {latest} outside "
                          f"{checks.get('min')}..{checks.get('max')}")
    entry = copy.deepcopy(mock)
    entry.update(series=series, as_of=series[-1]["date"], source=fetched.source, mock=False)
    if fetched.caveat_note:
        entry["caveat"] = " ".join(x for x in (mock.get("caveat"), fetched.caveat_note) if x)
    return entry


def run(mock_data: dict, session=None, sources=None, now=None) -> tuple[dict, list]:
    sources = sources or SOURCES
    session = session or make_session()
    out = copy.deepcopy(mock_data)
    summary = []
    for i, mock in enumerate(mock_data["indicators"]):
        spec = INDICATORS.get(mock["id"])
        if spec is None:
            summary.append((mock["id"], "mock", "no source configured"))
            continue
        if not spec.get("licence_cleared"):
            summary.append((mock["id"], "mock", "licence not cleared"))
            continue
        try:
            fetch = sources[spec["source"]]
            fetched = fetch(session, **spec.get("params", {}))
            out["indicators"][i] = build_entry(mock, spec, fetched)
            summary.append((mock["id"], "real", f"as of {out['indicators'][i]['as_of']}"))
        except Exception as e:  # any failure keeps the mock entry
            summary.append((mock["id"], "mock", f"{e.__class__.__name__}: {e}"))
    all_real = all(not ind.get("mock") for ind in out["indicators"])
    out["mock"] = not all_real
    out["generated_at"] = (now or datetime.now(timezone.utc)).strftime("%Y-%m-%dT%H:%M:%SZ")
    real = sum(1 for _, state, _ in summary if state == "real")
    out["note"] = (f"{real} of {len(summary)} indicators fetched from public sources; "
                   "entries with mock: true are ILLUSTRATIVE MOCK DATA, not real values.")
    return out, summary


def format_summary(summary: list) -> str:
    real = sum(1 for _, s, _ in summary if s == "real")
    lines = [f"Data run: {real} of {len(summary)} indicators real", ""]
    for ind_id, state, detail in summary:
        lines.append(f"- {ind_id}: {state} ({detail})" if state == "mock" else f"- {ind_id}: real, {detail}")
    return "\n".join(lines)


def write_atomic(path: str, data: dict) -> None:
    d = os.path.dirname(os.path.abspath(path))
    os.makedirs(d, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=d, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
    os.replace(tmp, path)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--mock", default="data/mock-data.json")
    ap.add_argument("--out", default="data/dashboard.json")
    args = ap.parse_args(argv)
    with open(args.mock, encoding="utf-8") as f:
        mock_data = json.load(f)
    out, summary = run(mock_data)
    write_atomic(args.out, out)
    text = format_summary(summary)
    print(text)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a", encoding="utf-8") as f:
            f.write("## " + text.replace("\n\n", "\n\n", 1) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
