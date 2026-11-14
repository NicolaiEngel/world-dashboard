# Design

## Context

- The page renders whatever data file it loads. The mock file is the format contract (`schema_version: 2`).
- `deploy.yml` copies `site/` (with the `data` symlink) to `_site` and publishes it.
- This container has no access to any data source yet. GitHub runners have open internet.
- Motivation and source list: see proposal.md. Requirements: see `specs/`.

## Goals / Non-Goals

**Goals:**
- As many real tiles as the time-box allows, with each failure contained to its own tile.
- Code shaped like the post-MVP pipeline (`pipeline/`, one module per source type, a declarative indicator table), so that moving to `config/indicators.yaml` later is a move rather than a rewrite.

**Non-Goals:**
- `config/*.yaml`, JSON Schemas, a manifest or per-indicator data files (post-MVP).
- The schedule and the last-good fallback (`add-daily-refresh`).
- The change line (step 3).

## Decisions

### 1. Layout

```
pipeline/
  run.py            # python -m pipeline.run [--out data/dashboard.json]
  indicators.py     # table: id -> source type, params, checks {min,max}, scale
  http.py           # one requests session: timeout 20 s, 2 retries, descriptive User-Agent
  sources/
    world_bank.py   # api.worldbank.org/v2/country/WLD/indicator/<code>?format=json&per_page=200
    owid.py         # grapher <slug>.csv + .metadata.json; refuse nonRedistributable
    noaa_gml.py     # Mauna Loa daily CSV; drop -999.99 rows
    copernicus.py   # Climate Pulse daily global 2 m temperature anomaly CSV
    frankfurter.py  # /v1/<start>..?base=EUR&symbols=USD,CNY
    coinbase.py     # Exchange candles, granularity 86400, two pages of 300 days
tests/
  fixtures/<source>/*  # trimmed real responses, recorded once
  test_<source>.py, test_run.py
```

- **Why a Python table and not YAML now:** YAML is the post-MVP config format with its own schema. A plain table keeps the MVP small and maps one-to-one onto it later.
- **Each source function** returns a list of `{date, value}`, or raises `SourceError`.

### 2. Runner merges onto the mock file

- `run.py` reads `data/mock-data.json` and walks its indicators in order.
- **Indicators with a table entry:** fetch, cut the series to its window, apply `scale` and rounding to `decimals`, then range-check the latest value. On success it replaces `series`, `as_of`, `source` and `mock`. On any exception it keeps the mock entry and records the reason.
- **Indicators without an entry** (for example the ETFs) stay mock.
- **Top-level fields:** `generated_at` = run time (UTC). `mock` = true if any indicator is still mock. The `note` is reworded only when nothing is mock.
- The output is written atomically.
- The summary goes to stdout, and to `$GITHUB_STEP_SUMMARY` when that is set.

### 3. Source specifics (verify live during implementation; 15-minute time-box per tile)

- **World Bank:**
  - Drop nulls.
  - Population is scaled by 1e-9 to billions.
  - Source `{name: "World Bank", code, url}` as now.
- **Copernicus Climate Pulse:**
  - Find the current CSV for the daily global surface air temperature anomaly.
  - If a 1850–1900 series exists, use it.
  - Otherwise add C3S's documented offset for 1991–2020 → 1850–1900, cite it in `DECISIONS.md`, and extend the caveat ("converted from 1991–2020 using C3S offset X °C").
  - Attribution must name the Copernicus Climate Change Service.
  - Fallback is the OWID monthly ERA5 series; that would change cadence to monthly, a format-compatible value, recorded in `DECISIONS.md`.
- **NOAA GML:** daily Mauna Loa means, with the last 730 days kept.
- **OWID conflict deaths:**
  - Pick the UCDP-based chart for deaths in state-based conflicts, entity `World`.
  - Read the metadata, skip it if `nonRedistributable`, and copy attribution and licence into `source`.
- **Frankfurter:**
  - One range query for the last 2 years.
  - `eur_usd` = USD.
  - `usd_cny` = CNY ÷ USD, rounded to 4 decimals.
  - Source "ECB via Frankfurter", URL `https://frankfurter.dev`.
- **Coinbase:** Exchange daily candles, using the close price. Source "Coinbase", URL to the BTC-USD price page.
- **MSCI ETF proxies:**
  - Spend the time-box looking for a keyless source whose terms clearly allow public display.
  - Default: stay mock, with a recommendation in `DECISIONS.md` (as CLAUDE.md asks).

### 4. Fetch at deploy; no data commits

- `deploy.yml` gains three steps before "Assemble site": `actions/setup-python` (3.12), `pip install -r requirements.txt`, then `python -m pipeline.run`.
- The runner never fails the job for a source error.
- `data/dashboard.json` is gitignored, and `cp -rL` picks it up through the existing `site/data` symlink.
- **Why:** CLAUDE.md's target says data isn't committed, and doing it now means `add-daily-refresh` only adds a schedule and last-good.
- **Rejected:** committing fetched data after manual runs. It adds data noise to history and goes stale between pushes.

### 5. Page load order

- `app.js` tries `data/dashboard.json`. On a 404 or parse error it falls back to `data/mock-data.json`, without logging a console error (the expected 404 is handled).
- **Known gap:** the browser itself may still log a failed-resource line for the 404. If that breaks the "no console errors" check in a local preview, the smoke check gets a local-only allowance for that one URL; the live site always has the file.

### 6. Real-time module (`site/realtime.js`)

- **Eligibility:** a fixed list of ids (`btc_usd`, `eur_usd`, `usd_cny`), gated on `mock === false`.
- **The header control** is a `<button aria-pressed>`.
- **Remembered:** the state is saved under the `localStorage` key `wd.realtime`, inside try/catch.
- **When on:**
  - `fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot")`;
  - `fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD,CNY")`;
  - both with `AbortController` at 5 s.
- **Updating tiles:** the module updates the tile's number and footer through a small hook exported by `app.js` (`window.WD.setRealtime(id, value, time)`), so `app.js` stays indicator-agnostic.
- **BTC interval:** 60 s, paused on `visibilitychange` to hidden and resumed on visible.
- **Switching off:** clears the interval and re-renders the stored values.
- **Testing:** in Playwright the outside hosts are routed to recorded fixtures. The check asserts no outside request before the click, exactly one Frankfurter call, and the "Real-time · HH:MM" footer.

### 7. Tests

- `pytest` with fixtures trimmed from real responses: a few rows or points, recorded with a one-off `scripts/record_fixtures.py` once the hosts are allowed.
- Runner tests stub the source functions to cover the fallback paths.
- **CI:** `deploy.yml` runs `pytest` before fetching. A test failure stops the deploy, keeping `main` deployable with the previous site.

## Risks / Trade-offs

- [A source changes format or moves its URL] → Per-indicator fallback to mock plus the run summary. `add-daily-refresh` adds last-good so a real tile doesn't flip back to mock.
- [The Copernicus baseline offset is mis-cited] → Cite the C3S page and value in `DECISIONS.md`, and state it in the caveat. If unsure, keep the tile mocked.
- [The container can't reach the sources] → Ask to allow the hosts listed in the proposal. If it's still blocked, verify via `workflow_dispatch` and record fixtures from the runner's output artifact.
- [Real-time contacts third parties, under GDPR, from Germany] → Opt-in only, with the services named on the control. The privacy statement comes in the "before going public" step.
- [MSCI ETF licensing] → Default stays mock, plus a recommendation, until you decide.

## Open Questions

- Coinbase and Frankfurter terms: summarised for you in `DECISIONS.md` during implementation (CLAUDE.md "Before going public" item 6). This doesn't change the build.
