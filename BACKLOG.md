# Backlog

Open tasks for future development, collected after the MVP (14 Nov 2026). Each task becomes its own OpenSpec change (`/openspec-propose`) when it's picked up. The notes under a task are context from the MVP, not decisions.

## Open tasks

- [ ] **Verify all source links working**
  - Every tile links to its source (`source.url` in the data). A check could request each URL and report broken ones, for example as a step in the deploy workflow or in `tests/`.
- [ ] **User-customizable top category**
  - Today the order is fixed by `categories` in the data: Economy first, decided 14 Nov 2026.
- [ ] **Data aggregation (multiple in one chart)**
  - For example both GDP-growth groups, or EUR/USD and USD/CNY, in one chart.
- [ ] **Custom exchange rates picker**
  - Frankfurter (ECB provider) offers about 30 currencies; today only USD and CNY are requested.
- [ ] **iOS/macOS widgets (?)**
  - Could read the published `data/dashboard.json`.
- [ ] **"ECB via Frankfurter" meaning?**
  - The rates are the ECB's euro reference rates, fetched through the free Frankfurter API with `providers=ECB`. The ECB's terms require citing the ECB as the source. Possibly the label needs a clearer wording.
- [ ] **Detail view: enable data range adjustments through user interactions**
  - The expanded chart (step 5) currently shows the full stored series, with no zoom or range selection.
- [ ] **Verify real-time data automatically re-fetches every minute**
  - Not built this way today. The opt-in real-time exchange rates fetch once per switch-on or page load, with no periodic refresh, because ECB rates change only once per working day (`realtime-prices` spec, CLAUDE.md). A per-minute refresh needs a source that updates more often and whose terms allow it.
- [ ] **Find and implement real world bitcoin or ethereum data with license**
  - Bitcoin is MOCK today. Coinbase's market-data terms couldn't be confirmed. CoinGecko allows display with "Powered by CoinGecko", but its storage rules and user-agreement requirement aren't met yet. See "Data sources and licences" in `DECISIONS.md`.
- [ ] **Find ways to display more data in real time**
  - Any source must pass the five real-time conditions in CLAUDE.md (no key, CORS, per-IP limits, terms allow public display, updates more often than daily) and the licence gate.
- [ ] **Make tile graphs adjustable in time frame shown**
  - Tiles show about the last 12 months (daily) or the full history (annual). The data stores about 2 years for daily tiles, so longer frames need more history in the pipeline.

## Also still open (from the MVP)

- **Before going public:** the checklist in CLAUDE.md (Impressum and privacy page, footer disclaimer, LICENSE, a secrets scan of the git history, commit email address).
- **IMF:** ask copyright@imf.org whether automated downloads are allowed, for the IMF GDP-growth upgrade.
- **Keepalive:** optionally set the repository variable `KEEPALIVE` = `true`.
