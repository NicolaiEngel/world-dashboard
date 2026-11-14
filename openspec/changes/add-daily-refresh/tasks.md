# Tasks

## 1. Last-good fallback

- [ ] 1.1 Add `--last-good <url>` to `pipeline/run.py`: download with a 20 s timeout, ignore errors, and reuse an entry only if the id matches, `mock` is `false`, and it passes the range check. The fallback order is last-good, then mock. Verify: `tests/test_run.py` covers no last-good (404), a valid last-good reused after a source error, a mock last-good not reused, and an out-of-range last-good not reused, and passes.
- [ ] 1.2 Extend the run summary with "last-good (<as_of>, <reason>)". Verify: a runner test asserts all three summary states.

## 2. Workflow

- [ ] 2.1 `deploy.yml`:
  - add `schedule: 17 5 * * *`;
  - move `configure-pages` (id `pages`) before the fetch;
  - pass `--last-good ${{ steps.pages.outputs.base_url }}/data/dashboard.json`.

  Verify: the YAML parses, and a `workflow_dispatch` run succeeds with "last-good available" in its job summary.
- [ ] 2.2 Keepalive step: `if: vars.KEEPALIVE == 'true' && github.event_name == 'schedule'`, `actions: write`, using the `gh api` enable call. First confirm from GitHub's docs that this resets the inactivity timer; otherwise use `keepalive-workflow` (API mode) pinned to a SHA. Verify: the documentation reference is noted in `DECISIONS.md`, and the step shows as skipped in a dispatch run.

## 3. Docs

- [ ] 3.1 Update `DECISIONS.md` (schedule time, last-good rules, keepalive approach and the `KEEPALIVE` variable) and `README.md` (daily refresh, how to trigger a run by hand, the optional variable). Verify: the README steps match the workflow.

## Workflow follow-up

- Open a PR. After merge, run `workflow_dispatch` once, run the smoke check against the live URL, and check `generated_at` in the live `data/dashboard.json`.
- Archive after `add-real-data-fetchers` has been archived, so its data-fetching spec exists first.
