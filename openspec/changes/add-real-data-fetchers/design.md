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
    frankfurter.py  # ECB provider only, range query, base EUR, symbols USD,CNY
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

### 3. Licence gate (before any fetcher is enabled)

- `indicators.py` has a `licence_cleared` flag per indicator. The runner skips any entry without it ("mock (licence not cleared)").
- **Status from the terms read so far** (14 Nov 2026):

  | Source | Status |
  |---|---|
  | ECB via Frankfurter | ✓ ECB: "users … may make free use of the information … the ECB must be cited as the source." Frankfurter: free, including commercial use; direct provider queries are "subject to each provider's terms" (ECB) |
  | UCDP via OWID | ✓ UCDP: "All datasets are free of charge and licensed under CC BY 4". OWID charts are CC BY, and OWID asks users to respect third-party terms |
  | CoinGecko | Display allowed with "Powered by CoinGecko", but the storage (§6) and user-agreement (§7) conditions aren't met yet → not used now (terms read from your PDF, 5 Sept 2025) |
  | World Bank | To confirm per indicator. The site terms defer to the Data Catalog's dataset licence (WDI is listed as CC BY 4.0) |
  | Copernicus Climate Pulse | To confirm. The CDS licence list includes CC BY 4.0, but the Climate Pulse page is a script-rendered app; the licence and attribution come from its data page or CSV header |
  | NOAA GML | To confirm from the CSV header's data-use statement |
  | IMF World Economic Outlook | Display ✓ with attribution; systematic or automated downloading needs IMF permission → not used now (terms read from your PDF, effective 11 Oct 2024) |
  | MSCI index levels | ✗ "Reproduction, redistribution or any other form of copying or transmission of the Data without MSCI's prior written consent is strictly prohibited." The MSCI Index API is a licensed product. Tiles replaced by IMF GDP growth |
  | Coinbase | ✗ not confirmed: the terms page returns 403 to automated reads, and older terms restricted display to third parties. Not used |

- "To confirm" sources get their quote recorded in `DECISIONS.md` (task 1.1) before their fetcher is enabled.

### 4. Source specifics (verify live during implementation; 15-minute time-box per tile)

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
  - One range query for the last 2 years, restricted to the ECB provider so values are ECB reference rates (not Frankfurter's blended rates).
  - `eur_usd` = USD.
  - `usd_cny` = CNY ÷ USD, rounded to 4 decimals.
  - Source "ECB via Frankfurter", URL `https://frankfurter.dev`.
- **GDP growth (replaces the MSCI tiles), decided 14 Nov 2026:**
  - World Bank `NY.GDP.MKTP.KD.ZG` for `HIC` (`gdp_growth_advanced`, "High-income economies") and `LMY` (`gdp_growth_developing`, "Low & middle income"), through `world_bank.py` like the five other World Bank tiles.
  - Annual, full history; range check −15…+20 %.
  - **Mock data:** the generator replaces the two MSCI entries with plausible annual mock series from 1980 to 2025 (high income about 1–3 %, low & middle income about 3–6 %, with dips in 2009 and 2020). They use their own seeded random generator, and the old MSCI draws keep running unused, so the other 11 series stay byte-identical.
  - **Later upgrade (not in this change):** IMF WEO (advanced vs emerging & developing, with a current-year estimate), once the IMF permits systematic downloads. Its terms (effective 11 Oct 2024) allow display with the attribution "Source: International Monetary Fund, World Economic Outlook database, <link>"; but "Permission is required to copy or download IMF Content in any systematic way", and imf.org refused automated requests from the dev container.
- **Bitcoin, decided 14 Nov 2026: stays mock.**
  - CoinGecko's API terms (5 Sept 2025) allow display with "Powered by CoinGecko" (§4.3). But §6 discourages storing its data (refresh within 24 h, "strong encryption… should be applied", no duplicating or storing beyond what's permitted), and §7 requires a user agreement plus a privacy policy with specific clauses.
  - No CoinGecko fetcher in this change. Revisit after `add-daily-refresh` and the site's legal pages.

### 5. Fetch at deploy; no data commits

- `deploy.yml` gains three steps before "Assemble site": `actions/setup-python` (3.12), `pip install -r requirements.txt`, then `python -m pipeline.run`.
- The runner never fails the job for a source error.
- `data/dashboard.json` is gitignored, and `cp -rL` picks it up through the existing `site/data` symlink.
- **Why:** CLAUDE.md's target says data isn't committed, and doing it now means `add-daily-refresh` only adds a schedule and last-good.
- **Rejected:** committing fetched data after manual runs. It adds data noise to history and goes stale between pushes.

### 6. Page load order

- `app.js` tries `data/dashboard.json`. On a 404 or parse error it falls back to `data/mock-data.json`, without logging a console error (the expected 404 is handled).
- **Known gap:** the browser itself may still log a failed-resource line for the 404. If that breaks the "no console errors" check in a local preview, the smoke check gets a local-only allowance for that one URL; the live site always has the file.

### 7. Real-time module (`site/realtime.js`)

- **Eligibility:** a fixed list of ids (`eur_usd`, `usd_cny`), gated on `mock === false`.
- **The header control** is a `<button aria-pressed>`.
- **Remembered:** the state is saved under the `localStorage` key `wd.realtime`, inside try/catch.
- **When on:** one Frankfurter latest-rates request (ECB provider, base EUR, symbols USD,CNY) with `AbortController` at 5 s. The exact v2 URL is checked live.
- **Updating tiles:** the module updates the tile's number and footer through a small hook exported by `app.js` (`window.WD.setRealtime(id, value, time)`), so `app.js` stays indicator-agnostic.
- **Switching off:** re-renders the stored values.
- **Testing:** in Playwright the outside hosts are routed to recorded fixtures. The check asserts no outside request before the click, exactly one Frankfurter call and no Bitcoin request, and the "Real-time · HH:MM" footer.

### 8. Tests

- `pytest` with fixtures trimmed from real responses: a few rows or points, recorded with a one-off `scripts/record_fixtures.py` once the hosts are allowed.
- Runner tests stub the source functions to cover the fallback paths.
- **CI:** `deploy.yml` runs `pytest` before fetching. A test failure stops the deploy, keeping `main` deployable with the previous site.

## Risks / Trade-offs

- [A source changes format or moves its URL] → Per-indicator fallback to mock plus the run summary. `add-daily-refresh` adds last-good so a real tile doesn't flip back to mock.
- [The Copernicus baseline offset is mis-cited] → Cite the C3S page and value in `DECISIONS.md`, and state it in the caveat. If unsure, keep the tile mocked.
- [The container can't reach the sources] → Ask to allow the hosts listed in the proposal. If it's still blocked, verify via `workflow_dispatch` and record fixtures from the runner's output artifact.
- [Real-time contacts third parties, under GDPR, from Germany] → Opt-in only, with the services named on the control. The privacy statement comes in the "before going public" step.
- [The IMF later grants permission] → Switch the two GDP tiles to the IMF WEO groups in a small follow-up change; the ids stay the same.
- [CLAUDE.md still lists the MSCI tiles] → Recorded in `DECISIONS.md`; you may want to update CLAUDE.md's indicator list.

## Open Questions

- Whether Bitcoin should go real via CoinGecko once its storage and user-agreement conditions can be met.
