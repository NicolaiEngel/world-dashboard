# Design

## Context

- Builds on `add-real-data-fetchers`: `deploy.yml` already runs pytest and the runner before publishing, and the runner already falls back to mock for each indicator.
- See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- A daily fresh page.
- A transient source outage doesn't turn a real tile back to mock.
- Forks get a working schedule without inheriting our keepalive.

**Non-Goals:**
- The post-MVP `build-and-deploy.yml` rename.
- A per-indicator `status` field. That would change the data format, so the tile's date shows staleness instead.

## Decisions

### 1. One workflow, three triggers

- Add `schedule: - cron: "17 5 * * *"` to `deploy.yml`, next to `push` and `workflow_dispatch`.
- The existing concurrency group `pages` already keeps a scheduled run and a push run from publishing out of order.
- **Rejected:** a separate refresh workflow. Two workflows publishing the same site would need cross-workflow coordination.

### 2. Last-good URL comes from Pages, not config

- Move `actions/configure-pages` before the fetch step, and pass `${{ steps.pages.outputs.base_url }}/data/dashboard.json` to `python -m pipeline.run --last-good <url>`.
- Forks get their own URL automatically; nothing is hard-coded.
- The download uses a 20 s timeout. Any error, a 404 or invalid JSON means "no last-good".
- **Reuse:** a last-good entry is used only if its `id` matches, `mock` is `false`, and its latest value passes today's range check.

### 3. Keepalive without third-party code

- The last step is guarded by `if: vars.KEEPALIVE == 'true' && github.event_name == 'schedule'`.
- It runs `gh api -X PUT repos/${{ github.repository }}/actions/workflows/deploy.yml/enable`, with `permissions: actions: write` on that job.
- Enabling an already enabled workflow is a no-op that GitHub counts as activity for the inactivity timer. **This is to be confirmed during implementation against GitHub's docs.** If the docs don't support it, the fallback is `gautamkrishnar/keepalive-workflow` in API mode, pinned to a commit SHA.
- **Rejected:** dummy commits. They pollute history and every fork's history.

### 4. Summary

`run.py` adds the "last-good (<as_of>, <reason>)" state. The job summary already receives the runner's output.

## Risks / Trade-offs

- [GitHub delays or skips scheduled runs at busy times] → The off-peak minute helps, and a late run just means one more stale day. `workflow_dispatch` is the manual fallback.
- [Last-good data gets very old if a source stays down for weeks] → The tile's `as_of` shows it. A later "stale after N days" rule can come with the post-MVP `status` field.
- [The keepalive API call doesn't reset the timer] → Verified during implementation, with the documented fallback above.

## Migration Plan

1. Merge after `add-real-data-fetchers` is live.
2. Trigger `workflow_dispatch` once to confirm a last-good download works.
3. The first scheduled run happens at the next 05:17 UTC.
4. Optional: set `KEEPALIVE=true`.
