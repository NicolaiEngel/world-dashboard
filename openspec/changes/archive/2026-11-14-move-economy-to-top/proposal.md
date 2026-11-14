# Proposal: Economy first, no header date

## Why

Economy holds the tiles that change from one visit to the next (exchange rates and Bitcoin), plus the growth comparison between advanced and developing economies once `add-real-data-fetchers` replaces the MSCI tiles. It should be the first thing you see.

## What Changes

- **Category order** becomes Economy, Climate, Health, Living standards, Stability, Demography.
- **Where:** in the generator's `categories` list. Regenerate `data/mock-data.json`; only that list changes.
- **Real data:** the fetchers in `add-real-data-fetchers` write the same order.
- **Departs from CLAUDE.md:** the wireframe row plan put Economy second. Recorded in `DECISIONS.md`.
- **Header date removed:** "Data as of 13 Nov 2026" goes, because every tile already shows its own date. The header keeps the title and the placeholder icons. This also departs from CLAUDE.md's header description.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-page`: the expected category order in the "Category groups" scenario changes, and the header no longer shows a data date.

## Impact

- **Files:** `scripts/make_mock_data.py`, `data/mock-data.json` (one line), `DECISIONS.md`.
- **`site/`:** `index.html` and `app.js` lose the header date. The category order needs no code change.
- **Smoke check:** it derives the expected order from the data file. It gains an assertion that the header has no date.
