# Tasks

## 1. Setup

- [ ] 1.1 Licence gate: complete the "Data sources and licences" table in `DECISIONS.md` for every source (terms URL, decisive quote, licence, required attribution, status). Confirm World Bank (each of the five indicators), Copernicus Climate Pulse, NOAA GML and the IMF (copyright and usage page), which are still open. Verify: every indicator with `licence_cleared = True` has a row with a quote, and MSCI and Coinbase are recorded as not cleared.
- [ ] 1.2 Confirm every data endpoint responds from this environment (ask to add `www.imf.org` and, if needed, the Climate Pulse CSV host). Verify: `curl` to each returns an HTTP status, not a proxy refusal.
- [ ] 1.3 Add `requirements.txt` (`requests`, `pytest`), the `pipeline/` package skeleton (`run.py`, `indicators.py` with `licence_cleared` flags, `http.py`, `sources/`), and `data/dashboard.json` in `.gitignore`. Verify: `python -m pipeline.run --help` runs, and `pytest` collects zero failing tests.

## 2. Runner

- [ ] 2.1 Implement the runner: merge onto the mock file, skip indicators whose licence isn't cleared, apply window, scale and rounding, range-check, fall back to mock per indicator, print the summary (and write it to `$GITHUB_STEP_SUMMARY`), write the file atomically. Verify: `tests/test_run.py` (with stubbed sources) covers success, exception, empty series, out-of-range and "licence not cleared", and passes; output ids and order equal the mock file's.

## 3. Sources (15-minute time-box per tile; a failing tile stays mock and gets a `DECISIONS.md` note)

- [ ] 3.1 World Bank fetcher for `child_mortality`, `life_expectancy`, `drinking_water`, `population` (scale 1e-9), `fertility`. Verify: the endpoint is checked live for `WLD`, there are recorded fixtures, `tests/test_world_bank.py` passes, and a live run marks all five real.
- [ ] 3.2 Frankfurter fetcher for `eur_usd` and `usd_cny` (CNY ÷ USD). Verify: fixture tests pass, and the live values match the ECB reference rate for the latest day.
- [ ] 3.3 CoinGecko keyless fetcher for `btc_usd` (365 daily closes, source "CoinGecko" with link). Its licence flag stays off until Nicolai confirms CoinGecko's API terms in a browser. Verify: fixture tests pass, and a live run gives a recent close with `as_of` within 2 days.
- [ ] 3.4 NOAA GML daily CO₂ fetcher (drops flagged values). Verify: fixture tests cover a `-999.99` row, and a live run gives a latest value of about 420–435 ppm.
- [ ] 3.5 Copernicus Climate Pulse temperature fetcher, with the baseline settled (1850–1900 series, or the documented offset with caveat and `DECISIONS.md` citation). Verify: fixture tests pass, and the live latest value and baseline are recorded in `DECISIONS.md`.
- [ ] 3.6 OWID conflict-deaths fetcher (metadata check, `nonRedistributable` refusal, attribution and licence copied). Verify: fixture tests include a `nonRedistributable` case, and a live run gives World annual data.
- [ ] 3.7 Replace the MSCI tiles. In `scripts/make_mock_data.py`, swap `msci_world` / `msci_em` for `gdp_growth_advanced` / `gdp_growth_developing` (annual 1980–2026 mock series, same position in Economy) and regenerate. Then write the `imf.py` fetcher: one DataMapper call, cut at the current year, estimate caveat with the WEO edition. Verify: the other 11 mock series are byte-identical, the fixture tests pass, and a live run gives both series ending in the current year with the estimate caveat.

## 4. Page

- [ ] 4.1 `app.js` loads `data/dashboard.json` with a silent fallback to `data/mock-data.json`, and exposes `WD.setRealtime` / `WD.restoreStored`. Verify: the smoke check passes both with and without `dashboard.json`, and real tiles show no MOCK badge.
- [ ] 4.2 `site/realtime.js` and the header control "Load real-time exchange rates (connects to Frankfurter)": opt-in, `localStorage` memory, the off switch, one Frankfurter call with a 5 s timeout, the "Real-time · HH:MM" footer on the two FX tiles, silent failure. Verify: new smoke-check cases (Frankfurter routed to a recorded fixture) prove there are no outside requests before the click, exactly one Frankfurter call after it and no Bitcoin request, the footer label, the off switch, and a timeout fallback with no console errors.

## 5. Deploy and docs

- [ ] 5.1 `deploy.yml`: set up Python 3.12, install, run `pytest`, run `python -m pipeline.run` (never failing on a source error), then assemble and publish as before. Verify: on this branch, a `workflow_dispatch` run on GitHub succeeds and its job summary lists every indicator as real or mock with a reason (or, if dispatch from a branch isn't possible, this is checked right after merge).
- [ ] 5.2 Update `DECISIONS.md` (the licence table, the temperature baseline, fallbacks used, why MSCI was replaced by IMF GDP growth and the alternatives considered, the CoinGecko/Coinbase decision) and `README.md` (`python -m pipeline.run`, `pytest`, how the deploy fetches). Verify: every tile's source and status is listed, and the README commands run as written.

## Workflow follow-up

- Open a PR. After merge, confirm the deploy run, then run `node tests/smoke_page.mjs https://nicolaiengel.github.io/world-dashboard/` and check that the live tiles show real values where the summary says so.
- Archive the change and sync the specs.
