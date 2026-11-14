"""Record small test fixtures from REAL source responses (never invented).

    python scripts/record_fixtures.py

Each response is fetched live and trimmed to a few rows, so tests stay small and offline.
Re-run when a source changes its format.
"""
import json
import os
import sys
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from pipeline.http import get, make_session  # noqa: E402

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "tests", "fixtures")


def save(name, content):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content if isinstance(content, str) else json.dumps(content, ensure_ascii=False, indent=1))
    print("recorded", name)


def head_tail_csv(text, tail=12):
    lines = text.splitlines()
    comments = [l for l in lines if l.startswith("#")]
    data = [l for l in lines if l and not l.startswith("#")]
    keep = data[:1] if data and not data[0][:1].isdigit() else []  # header row, if any
    return "\n".join(comments + keep + data[-tail:]) + "\n"


def main():
    s = make_session()
    # World Bank: under-5 mortality, World (keep newest rows incl. any nulls), and a real error payload
    wb = get(s, "https://api.worldbank.org/v2/country/WLD/indicator/SH.DYN.MORT", format="json", per_page=200).json()
    save("world_bank/sh_dyn_mort_wld.json", [wb[0], wb[1][:8]])
    err = s.get("https://api.worldbank.org/v2/country/WLD/indicator/NOT.A.CODE", params={"format": "json"}, timeout=20).json()
    save("world_bank/invalid_indicator.json", err)
    # Frankfurter (ECB provider), last ~10 days
    start = (date.today() - timedelta(days=10)).isoformat()
    fr = get(s, "https://api.frankfurter.dev/v2/rates", base="EUR", quotes="USD,CNY", providers="ECB",
             **{"from": start}).json()
    save("frankfurter/rates_ecb.json", fr)
    # NOAA GML daily CO2
    save("noaa_gml/co2_daily_mlo.csv", head_tail_csv(get(s, "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv").text))
    # Copernicus Climate Pulse
    save("copernicus/era5_daily_series_2t_global.csv", head_tail_csv(
        get(s, "https://sites.ecmwf.int/data/climatepulse/data/series/era5_daily_series_2t_global.csv").text))
    # OWID conflict deaths: metadata (columns only) + CSV rows for World and one region
    base = "https://ourworldindata.org/grapher/deaths-in-state-based-conflicts-by-region"
    params = {"v": "1", "csvType": "full", "useColumnShortNames": "true"}
    meta = get(s, base + ".metadata.json", **params).json()
    save("owid/conflict_metadata.json", {"chart": {"title": meta.get("chart", {}).get("title")},
                                         "columns": {k: {"titleShort": v.get("titleShort"),
                                                         "nonRedistributable": v.get("nonRedistributable"),
                                                         "citationShort": v.get("citationShort")}
                                                     for k, v in meta.get("columns", {}).items()}})
    lines = get(s, base + ".csv", **params).text.splitlines()
    keep = [lines[0]] + [l for l in lines[1:] if l.startswith("World,")][-6:] \
        + [l for l in lines[1:] if l.startswith("World,")][:2] + [l for l in lines[1:] if l.startswith("Africa")][-2:]
    save("owid/conflict.csv", "\n".join(keep) + "\n")


if __name__ == "__main__":
    main()
