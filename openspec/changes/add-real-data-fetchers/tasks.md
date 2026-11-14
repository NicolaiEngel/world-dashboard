# Tasks

## 1. Setup

- [ ] 1.1 Ask to allow the source hosts for this environment (see proposal), and confirm each one responds. Verify: `curl` to each host returns an HTTP status (not a proxy refusal), or the host is listed as "verify via workflow_dispatch".
- [ ] 1.2 Add `requirements.txt` (`requests`, `pytest`), the `pipeline/` package skeleton (`run.py`, `indicators.py`, `http.py`, `sources/`), and `data/dashboard.json` in `.gitignore`. Verify: `python -m pipeline.run --help` runs, and `pytest` collects zero failing tests.

## 2. Runner

- [ ] 2.1 Implement the runner: merge onto the mock file, apply window, scale and rounding, range-check, fall back to mock per indicator, print the summary (and write it to `$GITHUB_STEP_SUMMARY`), write the file atomically. Verify: `tests/test_run.py` (with stubbed sources) covers success, exception, empty series and out-of-range, and passes; output ids and order equal the mock file's.

## 3. Sources (15-minute time-box per tile; a failing tile stays mock and gets a `DECISIONS.md` note)

- [ ] 3.1 World Bank fetcher for `child_mortality`, `life_expectancy`, `drinking_water`, `population` (scale 1e-9), `fertility`. Verify: the endpoint is checked live for `WLD`, there are recorded fixtures, `tests/test_world_bank.py` passes, and a live run marks all five real.
- [ ] 3.2 Frankfurter fetcher for `eur_usd` and `usd_cny` (CNY ÷ USD). Verify: fixture tests pass, and the live values match the ECB reference rate for the latest day.
- [ ] 3.3 Coinbase Exchange candles fetcher for `btc_usd` (about 2 years, two pages). Verify: fixture tests pass, and a live run gives a recent close with `as_of` within 2 days.
- [ ] 3.4 NOAA GML daily CO₂ fetcher (drops flagged values). Verify: fixture tests cover a `-999.99` row, and a live run gives a latest value of about 420–435 ppm.
- [ ] 3.5 Copernicus Climate Pulse temperature fetcher, with the baseline settled (1850–1900 series, or the documented offset with caveat and `DECISIONS.md` citation). Verify: fixture tests pass, and the live latest value and baseline are recorded in `DECISIONS.md`.
- [ ] 3.6 OWID conflict-deaths fetcher (metadata check, `nonRedistributable` refusal, attribution and licence copied). Verify: fixture tests include a `nonRedistributable` case, and a live run gives World annual data.
- [ ] 3.7 MSCI ETF proxies: check candidate keyless price sources and their terms within the time-box. Verify: either a fetcher with tests and clearly permissive terms, or both tiles left mock with a recommendation in `DECISIONS.md`.

## 4. Page

- [ ] 4.1 `app.js` loads `data/dashboard.json` with a silent fallback to `data/mock-data.json`, and exposes `WD.setRealtime` / `WD.restoreStored`. Verify: the smoke check passes both with and without `dashboard.json`, and real tiles show no MOCK badge.
- [ ] 4.2 `site/realtime.js` and the header control: opt-in, `localStorage` memory, the off switch, one Coinbase and one Frankfurter call, the BTC 60 s visible-only refresh, 5 s timeouts, the "Real-time · HH:MM" footer, silent failure. Verify: new smoke-check cases (outside hosts routed to recorded fixtures) prove there are no outside requests before the click, the correct calls after it, the footer label, the off switch, and a timeout fallback with no console errors.

## 5. Deploy and docs

- [ ] 5.1 `deploy.yml`: set up Python 3.12, install, run `pytest`, run `python -m pipeline.run` (never failing on a source error), then assemble and publish as before. Verify: on this branch, a `workflow_dispatch` run on GitHub succeeds and its job summary lists every indicator as real or mock with a reason (or, if dispatch from a branch isn't possible, this is checked right after merge).
- [ ] 5.2 Update `DECISIONS.md` (the source for each tile, the temperature baseline, fallbacks used, the ETF recommendation, a Coinbase and Frankfurter terms summary) and `README.md` (`python -m pipeline.run`, `pytest`, how the deploy fetches). Verify: every tile's source and status is listed, and the README commands run as written.

## Workflow follow-up

- Open a PR. After merge, confirm the deploy run, then run `node tests/smoke_page.mjs https://nicolaiengel.github.io/world-dashboard/` and check that the live tiles show real values where the summary says so.
- Archive the change and sync the specs.
