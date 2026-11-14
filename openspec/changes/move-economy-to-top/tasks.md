# Tasks

## 1. Reorder

- [ ] 1.1 Put "Economy" first in `categories` in `scripts/make_mock_data.py` and regenerate `data/mock-data.json`. Verify: `git diff data/` shows only the `categories` line, and two runs give identical files.
- [ ] 1.2 Remove the "Data as of" line from `site/index.html`, plus its code in `app.js`, and add a smoke-check assertion that the header contains no "Data as of". Verify: the smoke check passes, and the header shows only the title and icons.
- [ ] 1.3 Add a `DECISIONS.md` entry (Economy first and no header date, both departing from CLAUDE.md's header and row description). Verify: run the smoke check locally; it passes and reports the order "Economy, Climate, Health, Living standards, Stability, Demography".
