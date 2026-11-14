"""Generate mock-data.json for the World Dashboard MVP.

All values are ILLUSTRATIVE (plausible shapes and magnitudes, not real data).
Every indicator carries "mock": true so the UI can show a MOCK badge until a
real fetcher replaces it. Re-run to regenerate; the seed keeps output stable.

Usage: python scripts/make_mock_data.py [out_path]
"""
import json
import math
import random
import sys
from datetime import date, timedelta

random.seed(42)
TODAY = date(2026, 11, 14)


def annual(years, fn, noise=0.0, decimals=2):
    return [
        {"date": str(y), "value": round(fn(y) + random.gauss(0, noise), decimals)}
        for y in years
    ]


def business_days(end, n_days=365):
    d, out = end - timedelta(days=n_days), []
    while d <= end:
        if d.weekday() < 5:
            out.append(d)
        d += timedelta(days=1)
    return out


def random_walk(days, start, end, vol, decimals):
    """Brownian bridge in log space: noisy path from start to end."""
    logs, x = [], 0.0
    for _ in days:
        x += random.gauss(0, vol)
        logs.append(x)
    n, target = len(days), math.log(end / start)
    out = []
    for k, d in enumerate(days):
        frac = (k + 1) / n
        v = start * math.exp(logs[k] - frac * logs[-1] + frac * target)
        out.append({"date": d.isoformat(), "value": round(v, decimals)})
    return out


def set_points(series, overrides):
    for p in series:
        if p["date"] in overrides:
            p["value"] = overrides[p["date"]]
    return series


# ---------- annual ("slow") layer ----------
# Annual temperature: no longer published (temp_anomaly is daily now), but kept so the
# shared random stream, and therefore every series below, stays byte-identical.
temp = set_points(
    annual(range(1950, 2026),
           lambda y: 0.30 if y < 1975 else 0.30 + 0.02 * (y - 1975),
           noise=0.07),
    {"2023": 1.45, "2024": 1.55, "2025": 1.47},
)

child_mort = annual(range(1990, 2024),
                    lambda y: 37 + 56 * math.exp(-(y - 1990) / 14) - 3 * (y - 1990) / 33,
                    noise=0.3, decimals=1)

def life_exp_fn(y):
    base = 52.6 + 20.2 * (1 - math.exp(-(y - 1960) / 30)) / (1 - math.exp(-59 / 30))
    return base
life_exp = set_points(annual(range(1960, 2024), life_exp_fn, noise=0.15, decimals=1),
                      {"2019": 72.8, "2020": 72.0, "2021": 71.0, "2022": 72.2, "2023": 73.1})

water = annual(range(2000, 2023), lambda y: 61 + 12 * (y - 2000) / 22, noise=0.2, decimals=1)

population = annual(range(1960, 2025),
                    lambda y: 3.03 + 5.11 * ((y - 1960) / 64) ** 1.05, decimals=2)

fertility = annual(range(1960, 2024),
                   lambda y: 5.0 - 2.75 * (1 - math.exp(-max(y - 1964, 0) / 25)) / (1 - math.exp(-59 / 25))
                   if y >= 1964 else 4.7 + 0.075 * (y - 1960),
                   noise=0.02, decimals=2)

conflict = set_points(
    annual(range(1989, 2025), lambda y: 75_000 - 900 * (y - 1989), noise=12_000, decimals=0),
    {"2014": 105_000, "2015": 98_000, "2021": 120_000, "2022": 270_000,
     "2023": 150_000, "2024": 160_000},
)
for p in conflict:
    p["value"] = int(max(p["value"], 20_000))

# ---------- daily layer ----------
days = business_days(TODAY - timedelta(days=1))
msci_world = random_walk(days, 152.0, 168.0, 0.008, 2)
msci_em = random_walk(days, 44.0, 49.5, 0.010, 2)
eur_usd = random_walk(days, 1.10, 1.16, 0.004, 4)
usd_cny = random_walk(days, 7.25, 7.12, 0.002, 4)
btc_usd = random_walk(days, 92_000, 98_000, 0.025, 0)

# ---------- daily climate layer ----------
# Own RNG so these series don't shift the shared random stream above.
crng = random.Random(2026)


def calendar_days(end, n_days=730):
    return [end - timedelta(days=n_days - 1 - k) for k in range(n_days)]


def daily_temp(end):
    """Daily global air-temperature anomaly vs 1850-1900, ~2 days behind."""
    out, noise = [], 0.0
    for d in calendar_days(end):
        noise = 0.85 * noise + crng.gauss(0, 0.05)        # weather persistence
        doy = d.timetuple().tm_yday
        seasonal = 0.06 * math.cos(2 * math.pi * (doy - 15) / 365.25)
        trend = 1.42 + 0.02 * (d - end).days / 365.25
        out.append({"date": d.isoformat(), "value": round(trend + seasonal + noise, 2)})
    return out


def daily_co2(end):
    """Daily Mauna Loa CO2: trend + seasonal cycle (peak ~May), with a few gaps."""
    out = []
    for d in calendar_days(end):
        if crng.random() < 0.03:                          # instrument / weather gaps
            continue
        doy = d.timetuple().tm_yday
        trend = 427.6 + 2.5 * (d - end).days / 365.25
        seasonal = 3.5 * math.cos(2 * math.pi * (doy - 135) / 365.25)
        out.append({"date": d.isoformat(), "value": round(trend + seasonal + crng.gauss(0, 0.4), 2)})
    if out[-1]["date"] != end.isoformat():                # latest day always present
        out.append({"date": end.isoformat(), "value": round(427.6 + 3.5 * math.cos(
            2 * math.pi * (end.timetuple().tm_yday - 135) / 365.25), 2)})
    return out


temp_daily = daily_temp(TODAY - timedelta(days=2))
co2 = daily_co2(TODAY - timedelta(days=1))


def ind(id_, title, subtitle, category, cadence, unit, decimals, source, series, caveat=None):
    """One tile. All tiles share this shape; the UI renders them identically."""
    return {
        "id": id_,
        "title": title,                 # tile headline
        "subtitle": subtitle,           # one-line definition / unit, shown under the title
        "category": category,           # tiles are grouped under category headings
        "cadence": cadence,             # daily | monthly | annual  (shown on tile; sets the change reference)
        "unit": unit,
        "decimals": decimals,
        "source": source,               # {name, url}: planned real source, linked on every tile
        "as_of": series[-1]["date"],
        "mock": True,                   # true -> MOCK badge; real fetchers set false
        "caveat": caveat,               # optional, for the detail view
        "series": series,               # [{date, value}], oldest first
    }


WB = lambda code: {"name": "World Bank", "code": code, "url": f"https://data.worldbank.org/indicator/{code}"}
OWID = lambda url: {"name": "Our World in Data", "url": url}
ETF_NOTE = "Tracking ETF used as proxy; MSCI index levels are not freely available."
FRANKFURTER = {"name": "ECB via Frankfurter", "url": "https://www.frankfurter.app"}

# Order = display order on the page
indicators = [
    ind("temp_anomaly", "Temperature anomaly", "°C above 1850–1900 average", "Climate", "daily", "°C", 2,
        {"name": "Copernicus Climate Pulse (C3S)", "url": "https://pulse.climate.copernicus.eu/"}, temp_daily,
        "Single-day value. The Paris goal refers to long-term (~20-year) average warming."),
    ind("co2_ppm", "CO₂ concentration", "Atmospheric CO₂ at Mauna Loa, ppm", "Climate", "daily", "ppm", 2,
        {"name": "NOAA GML (Mauna Loa)", "url": "https://gml.noaa.gov/ccgg/trends/"}, co2,
        "Daily values have gaps; strong seasonal cycle, so compare with the same day a year earlier."),
    ind("child_mortality", "Child mortality", "Deaths under 5 per 1,000 live births", "Health", "annual",
        "per 1,000", 1, WB("SH.DYN.MORT"), child_mort),
    ind("life_expectancy", "Life expectancy", "Years at birth", "Health", "annual", "years", 1,
        WB("SP.DYN.LE00.IN"), life_exp),
    ind("drinking_water", "Drinking water", "% with safely managed access", "Living standards", "annual",
        "%", 1, WB("SH.H2O.SMDW.ZS"), water),
    ind("conflict_deaths", "Conflict deaths", "Battle-related deaths per year", "Stability", "annual",
        "deaths", 0, OWID("https://ourworldindata.org/war-and-peace"), conflict,
        "State-based conflicts (UCDP); excludes indirect deaths."),
    ind("msci_world", "MSCI World", "URTH ETF price, USD", "Economy", "daily", "USD", 2,
        {"name": "MSCI (ETF proxy)", "url": "https://www.msci.com/indexes"}, msci_world, ETF_NOTE),
    ind("msci_em", "MSCI EM", "Emerging markets · EEM ETF price, USD", "Economy", "daily", "USD", 2,
        {"name": "MSCI (ETF proxy)", "url": "https://www.msci.com/indexes"}, msci_em, ETF_NOTE),
    ind("eur_usd", "EUR/USD", "US dollars per euro", "Economy", "daily", "USD", 4, FRANKFURTER, eur_usd),
    ind("usd_cny", "USD/CNY", "Chinese yuan per US dollar", "Economy", "daily", "CNY", 4, FRANKFURTER, usd_cny),
    ind("btc_usd", "Bitcoin", "Price in US dollars", "Economy", "daily", "USD", 0,
        {"name": "CoinGecko", "url": "https://www.coingecko.com/en/coins/bitcoin"}, btc_usd),
    ind("population", "World population", "Billion people", "Demography", "annual", "bn", 2,
        WB("SP.POP.TOTL"), population),
    ind("fertility", "Fertility rate", "Births per woman (2.1 = replacement)", "Demography", "annual",
        "births/woman", 2, WB("SP.DYN.TFRT.IN"), fertility),
]

data = {
    "schema_version": 2,
    "generated_at": f"{TODAY.isoformat()}T08:00:00Z",
    "mock": True,
    "note": "ILLUSTRATIVE MOCK DATA – plausible shapes, not real values. Replace per indicator with real fetchers.",
    "change_reference": {"daily": "previous day", "monthly": "same month last year", "annual": "10 years earlier"},
    "categories": ["Climate", "Health", "Living standards", "Stability", "Economy", "Demography"],
    "indicators": indicators,
}

out = sys.argv[1] if len(sys.argv) > 1 else "data/mock-data.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)

# summary for wireframing
for i in indicators:
    s = i["series"]
    back = 1 if i["cadence"] == "daily" else 10
    print(f'{i["id"]:16} last={s[-1]["value"]} ({i["as_of"]})  ref={s[-1 - back]["value"]} ({s[-1 - back]["date"]})')
