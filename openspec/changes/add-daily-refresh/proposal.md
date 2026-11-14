# Proposal: Daily automatic refresh

## Why

After `add-real-data-fetchers`, data is only fetched when someone pushes to `main`. The seven daily tiles go stale within a day. A scheduled run keeps the page current with nobody involved (CLAUDE.md: first item under "Extras", and "Automation" under Architecture).

## What Changes

- **Daily schedule:** `deploy.yml` also runs once a day at 05:17 UTC. Each run fetches, tests and redeploys.
- **Last-good fallback:**
  - Before fetching, the runner downloads the currently published `data/dashboard.json`.
  - If a source fails today, an indicator that was real yesterday keeps yesterday's real data instead of falling back to mock.
  - Only an indicator that has never been fetched falls back to mock.
  - The tile's date shows how old the data is, so this stays honest.
- **Keepalive:** GitHub disables scheduled workflows after 60 days without repository activity. A small step re-enables the workflow through the GitHub API, using the built-in token, with no third-party action and no dummy commits.
  - It runs only where a repository variable `KEEPALIVE=true` is set, so forks don't silently inherit it.
- **The run summary** also says which indicators used last-good data, and from which date.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `site-deployment`: adds the scheduled run and the keepalive.
- `data-fetching`: the per-indicator fallback becomes last-good first, then mock; the summary reports last-good use.

(Both build on `add-real-data-fetchers`, which must be applied and archived first.)

## Impact

- **Files:** `.github/workflows/deploy.yml`, `pipeline/run.py`, `tests/test_run.py`, `DECISIONS.md`, `README.md`.
- **Repo setting (yours):** optionally add the repository variable `KEEPALIVE=true` (Settings → Secrets and variables → Actions → Variables) to keep the schedule alive past 60 quiet days.
- **Not in scope:**
  - renaming to `build-and-deploy.yml`;
  - config-driven indicators;
  - JSON Schemas;
  - hourly price snapshots.

  These come after the MVP.
