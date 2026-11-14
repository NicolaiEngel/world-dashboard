# Proposal: Economy first

## Why

Economy holds five of the seven daily tiles: markets, FX and Bitcoin. It's what changes from one visit to the next, so it should be the first thing you see.

## What Changes

- **Category order** becomes Economy, Climate, Health, Living standards, Stability, Demography.
- **Where:** in the generator's `categories` list. Regenerate `data/mock-data.json`; only that list changes.
- **Real data:** the fetchers in `add-real-data-fetchers` write the same order.
- **Departs from CLAUDE.md:** the wireframe row plan put Economy second. Recorded in `DECISIONS.md`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-page`: the expected category order in the "Category groups" scenario changes.

## Impact

- **Files:** `scripts/make_mock_data.py`, `data/mock-data.json` (one line), `DECISIONS.md`.
- **No code change in `site/`:** the page already follows the data's `categories` order.
- **Smoke check:** it derives the expected order from the data file, so it needs no change.
