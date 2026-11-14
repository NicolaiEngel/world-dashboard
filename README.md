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

`.github/workflows/deploy.yml` runs the tests, fetches real data and publishes `site/` plus the data files to GitHub Pages:

- on every push to `main`;
- daily at 05:17 UTC, so the daily tiles stay current;
- by hand: Actions → "Deploy to GitHub Pages" → Run workflow.

If a source fails, a tile keeps the last published real data; the run's summary says which tiles are real, kept from the last good run, or mock.

Settings:

- **Required:** Settings → Pages → Source: "GitHub Actions".
- **Optional:** to stop GitHub from switching off the daily run after 60 days without commits, add the repository variable `KEEPALIVE` with value `true` (Settings → Secrets and variables → Actions → Variables).

See `DECISIONS.md` for the design choices and open questions, `BACKLOG.md` for open tasks, and `CLAUDE.md` for the plan.
