# Proposal: Real data (MVP step 4)

## Why

All 13 tiles still show mock numbers. Step 4 replaces them with values fetched from public sources, tile by tile. A source that fails leaves its tile mocked and badged, so the page never breaks. CLAUDE.md, "MVP plan" step 4.

## What Changes

- **Python fetchers (`pipeline/`):** one module per source type, plus a runner that writes `data/dashboard.json` in exactly the mock-data format.
  - A tile whose fetch fails, or whose value fails its range check, keeps its mock entry (`mock: true`).
  - Wording (title, subtitle, category, unit, decimals) still comes from the mock data, so there's one place to edit it.
- **Sources** (each checked live before use; anything unclear is recorded in `DECISIONS.md`):

  | Tiles | Source |
  |---|---|
  | `child_mortality`, `life_expectancy`, `drinking_water`, `population`, `fertility` | World Bank API (`WLD`), one generic fetcher |
  | `temp_anomaly` | Copernicus Climate Pulse daily CSV, vs 1850–1900. If only 1991–2020 exists, convert with C3S's documented offset and say so in the caveat |
  | `co2_ppm` | NOAA GML Mauna Loa daily means |
  | `conflict_deaths` | Our World in Data (UCDP-based chart), skipped if `nonRedistributable` |
  | `eur_usd`, `usd_cny` | Frankfurter (ECB rates); USD/CNY = (EUR/CNY) ÷ (EUR/USD) |
  | `btc_usd` | Coinbase Exchange daily candles. The source label changes from CoinGecko to Coinbase |
  | `msci_world`, `msci_em` | Only if a keyless price source clearly allows public display; **otherwise stay MOCK** (default) |

- **Deploy runs the fetchers:** `deploy.yml` runs the fetch step before publishing, because GitHub runners have open internet. The fetchers also run by hand (`python -m pipeline.run`). The generated file isn't committed.
- **The page** reads `data/dashboard.json` and falls back to `data/mock-data.json` if it's missing (for example, a local preview without fetching).
- **Real-time prices in the browser, opt-in only:**
  - A header control reads "Load real-time prices (connects to Coinbase and Frankfurter)".
  - Once switched on, it updates the BTC and FX values, with "Real-time · HH:MM" in the tile footer.
  - BTC refreshes every 60 s while the tab is visible.
  - The setting is remembered in `localStorage` and can be switched off.
  - Nothing outside our site is contacted until the visitor clicks.
- **Tests:** `pytest` for every fetcher and the runner, using small fixtures recorded from real responses (never invented). Range checks for each indicator.

## Capabilities

### New Capabilities

- `data-fetching`: fetching, normalising, range-checking and assembling real indicator data, with a mock fallback for each indicator.
- `realtime-prices`: the opt-in, in-browser real-time values for Bitcoin and FX.

### Modified Capabilities

- `dashboard-page`: the page loads the fetched data file and falls back to the mock file.
- `site-deployment`: the deploy runs the fetchers, and the published site contains the fetched data file.

## Impact

- **New:**
  - `pipeline/` (runner, sources, indicator table with checks);
  - `tests/` (pytest plus recorded fixtures);
  - `requirements.txt` (`requests` and `pytest`);
  - `site/realtime.js`.
- **Changed:** `site/app.js`, `site/index.html`, `site/styles.css`, `.github/workflows/deploy.yml`, `.gitignore`, `DECISIONS.md`, `README.md`.
- **Network:** this container currently can't reach any data source. During implementation I'll ask to allow these hosts, to record fixtures and check endpoints:
  - `api.worldbank.org`, `ourworldindata.org`, `gml.noaa.gov`, `pulse.climate.copernicus.eu`;
  - `api.frankfurter.dev`, `api.coinbase.com`, `api.exchange.coinbase.com`.

  Anything still blocked gets verified with a `workflow_dispatch` run.
- **Not in scope:**
  - the change line and the "x of 13 live" count (step 3, still open);
  - the scheduled daily refresh and the last-good fallback (`add-daily-refresh`);
  - the config-driven pipeline and JSON Schemas (after the MVP).
