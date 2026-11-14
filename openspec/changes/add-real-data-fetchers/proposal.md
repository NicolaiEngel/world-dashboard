# Proposal: Real data (MVP step 4)

## Why

All 13 tiles still show mock numbers. Step 4 replaces them with values fetched from public sources, tile by tile. A source that fails leaves its tile mocked and badged, so the page never breaks. CLAUDE.md, "MVP plan" step 4.

## What Changes

- **Python fetchers (`pipeline/`):** one module per source type, plus a runner that writes `data/dashboard.json` in exactly the mock-data format.
  - A tile whose fetch fails, or whose value fails its range check, keeps its mock entry (`mock: true`).
  - Wording (title, subtitle, category, unit, decimals) still comes from the mock data, so there's one place to edit it.
- **Licence gate:** a source is fetched only after its terms have been read and shown to allow display on a public website. The decisive quote, URL and required attribution go into a "Data sources and licences" table in `DECISIONS.md`. A source whose terms can't be confirmed isn't fetched, and its tile stays MOCK.
- **Sources** (each checked live before use):

  | Tiles | Source |
  |---|---|
  | `child_mortality`, `life_expectancy`, `drinking_water`, `population`, `fertility` | World Bank API (`WLD`), one generic fetcher |
  | `temp_anomaly` | Copernicus Climate Pulse daily CSV, vs 1850–1900; attribution to the Copernicus Climate Change Service. If only 1991–2020 exists, convert with C3S's documented offset and say so in the caveat |
  | `co2_ppm` | NOAA GML Mauna Loa daily means |
  | `conflict_deaths` | Our World in Data (UCDP-based chart, UCDP data CC BY 4.0), skipped if `nonRedistributable` |
  | `eur_usd`, `usd_cny` | Frankfurter, ECB provider (ECB: free use if the ECB is cited); USD/CNY = (EUR/CNY) ÷ (EUR/USD) |
  | `btc_usd` | CoinGecko keyless API, daily closes for the last 365 days, with the required CoinGecko attribution. Replaces Coinbase, whose market-data terms couldn't be confirmed |
  | `gdp_growth_advanced`, `gdp_growth_developing` (**replace `msci_world`, `msci_em`**) | IMF World Economic Outlook via the keyless DataMapper API: real GDP growth (`NGDP_RPCH`) for "Advanced economies" (`ADVEC`) and "Emerging market and developing economies" (`OEMDC`), annual from 1980 up to the current year. The current year is an IMF estimate, so the caveat says so and names the WEO edition. Later projection years are dropped. Subject to the licence gate |

- **Deploy runs the fetchers:** `deploy.yml` runs the fetch step before publishing, because GitHub runners have open internet. The fetchers also run by hand (`python -m pipeline.run`). The generated file isn't committed.
- **The page** reads `data/dashboard.json` and falls back to `data/mock-data.json` if it's missing (for example, a local preview without fetching).
- **Real-time exchange rates in the browser, opt-in only:**
  - A header control reads "Load real-time exchange rates (connects to Frankfurter)".
  - Once switched on, it updates EUR/USD and USD/CNY, with "Real-time · HH:MM" in the tile footer.
  - The setting is remembered in `localStorage` and can be switched off.
  - Nothing outside our site is contacted until the visitor clicks.
  - **Bitcoin isn't real-time:** CLAUDE.md rules out CoinGecko in the browser, and Coinbase's terms couldn't be confirmed. Bitcoin shows the daily close from the deploy.
- **MSCI tiles replaced:** MSCI's terms forbid redistribution without written consent, so the two MSCI tiles become the two IMF GDP-growth tiles. In the mock data and the generator, `msci_world` / `msci_em` become `gdp_growth_advanced` ("Advanced economies") and `gdp_growth_developing` ("Emerging & developing"). Subtitle "Real GDP growth, % per year", category Economy, cadence annual, unit "%", 1 decimal. Economy then has two annual and three daily tiles.
- **Tests:** `pytest` for every fetcher and the runner, using small fixtures recorded from real responses (never invented). Range checks for each indicator.

## Capabilities

### New Capabilities

- `data-fetching`: fetching, normalising, range-checking and assembling real indicator data, with a mock fallback for each indicator.
- `realtime-prices`: the opt-in, in-browser real-time values for the FX rates.

### Modified Capabilities

- `dashboard-page`: the page loads the fetched data file and falls back to the mock file.
- `site-deployment`: the deploy runs the fetchers, and the published site contains the fetched data file.
- `mock-data`: the indicator list swaps `msci_world` / `msci_em` for `gdp_growth_advanced` / `gdp_growth_developing`.

## Impact

- **New:**
  - `pipeline/` (runner, sources, indicator table with checks);
  - `tests/` (pytest plus recorded fixtures);
  - `requirements.txt` (`requests` and `pytest`);
  - `site/realtime.js`.
- **Changed:** `scripts/make_mock_data.py` and `data/mock-data.json` (two MSCI entries replaced by the two GDP-growth entries), `site/app.js`, `site/index.html`, `site/styles.css`, `.github/workflows/deploy.yml`, `.gitignore`, `DECISIONS.md`, `README.md`.
- **Network:** these hosts are needed to record fixtures and check endpoints:
  - `api.worldbank.org`, `ourworldindata.org`, `gml.noaa.gov`, `pulse.climate.copernicus.eu`;
  - `api.frankfurter.dev`, `api.coingecko.com`, `www.imf.org` (still to be added).

  These, plus the terms pages, are already allowed in the `world-dashboard` environment. The Climate Pulse CSV host may need adding once it's found.

  Anything still blocked gets verified with a `workflow_dispatch` run.
- **Not in scope:**
  - the change line and the "x of 13 live" count (step 3, still open);
  - the scheduled daily refresh and the last-good fallback (`add-daily-refresh`);
  - the config-driven pipeline and JSON Schemas (after the MVP).
