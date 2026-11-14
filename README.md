# World Dashboard

A single page that shows the state of the world at a glance: 13 global indicators covering climate, health, living standards, stability, the economy and demography.

**Work in progress:** tiles show real data from public sources where their licence allows it. Any tile still on illustrative data is labelled MOCK. A full README with a "Make your own" guide comes later.

## Run locally

```bash
cd site && python -m http.server
```

Open http://localhost:8000/. `site/data` is a symlink to `../data`, so the page reads `data/dashboard.json` if you have run the pipeline (see below), and `data/mock-data.json` otherwise.

To regenerate the mock data:

```bash
python scripts/make_mock_data.py
```

## Real data

Python 3.12+. Install the pipeline's dependencies once:

```bash
pip install -r requirements.txt
```

Fetch real data into `data/dashboard.json` (not committed; the page falls back to `data/mock-data.json` without it):

```bash
python -m pipeline.run
```

Run the pipeline tests (offline, on fixtures recorded from real responses):

```bash
python -m pytest -q
```

Re-record the fixtures when a source changes format:

```bash
python scripts/record_fixtures.py
```

Which source feeds which tile, and why each is allowed, is in `DECISIONS.md` under "Data sources and licences".

## Smoke check

The check needs Node and Playwright with Chromium (`npm i -D playwright && npx playwright install chromium`). With the local server running:

```bash
node tests/smoke_page.mjs http://localhost:8000/
```

It checks the tile count, category order, uniform tile size, values, that only the page's own origin is contacted, the phone layout and the data-load error path. It also saves screenshots to `test-results/`. Run it against the live URL after each deploy as well.

## Deployment

Every push to `main` runs the tests, fetches real data and publishes `site/` plus the data files to GitHub Pages through `.github/workflows/deploy.yml`. This needs one setting: Settings → Pages → Source: "GitHub Actions".

See `DECISIONS.md` for the design choices and open questions, and `CLAUDE.md` for the plan.
