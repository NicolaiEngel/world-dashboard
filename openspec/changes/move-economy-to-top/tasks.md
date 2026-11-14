# Tasks

## 1. Reorder

- [ ] 1.1 Put "Economy" first in `categories` in `scripts/make_mock_data.py` and regenerate `data/mock-data.json`. Verify: `git diff data/` shows only the `categories` line, and two runs give identical files.
- [ ] 1.2 Add a `DECISIONS.md` entry (Economy first, departing from the wireframe's row plan). Verify: run the smoke check locally; it passes and reports the order "Economy, Climate, Health, Living standards, Stability, Demography".
