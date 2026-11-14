# Proposal: Final check and polish (MVP step 6)

## Why

Step 6 is the final check of the live page before the demo. An audit of https://nicolaiengel.github.io/world-dashboard/ on 14 Nov 2026 covered:
- screenshots at 1440, 1280, 768 and 390 px;
- axe-core (WCAG 2 A/AA plus best practices);
- the network log.

What passed: all 13 tiles are identical in size at every width, there's no horizontal scroll, axe reports **no violations**, only own-origin requests are made, and about 100 KB is transferred with a load time of about 1–1.5 s. Four things are off, and this change fixes them.

## What Changes

1. **The expand button covers data.** The ⤢ button sits on top of the plot's top-right corner and hides the newest points of rising series (life expectancy, GDP, fertility). It moves out of the plot, into the tile's value row (right-aligned, same size and label). It still never changes tile size.
2. **Phone header is too tall.** At 390 px the real-time button wraps onto two lines and pushes the icons onto a third row (about 130 px before the first tile). On narrow screens the button label becomes "Real-time rates (Frankfurter)", which still names the service it connects to, and the icons stay on the title row. The header must fit in two rows at 360 px.
3. **No favicon.** Every visit triggers a request for a missing `/favicon.ico` (a 404, on our own origin). This adds an inline SVG favicon as a `data:` URI (a plain blue line glyph in `--chart-line`), so the browser makes no request for it.
4. **Deploy warning.** GitHub warns that `actions/configure-pages@v5`, `actions/deploy-pages@v4`, `actions/setup-python@v5` and the artifact upload target the deprecated Node.js 20. Each moves to its current major version, checked at implementation time, and verified by a workflow run.

**Not in scope** (the "before going public" checklist, decided separately): Impressum and privacy pages, a footer disclaimer, a LICENSE file, a secrets scan.

**Demo run-through:** after merge, I run the full smoke check on the live site and send you screenshots of desktop and phone, the expanded chart and real-time on. There's no new text on the page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `dashboard-page`: the expand button sits in the value row, not on the chart; the header fits in two rows at 360 px; no favicon request.
- `realtime-prices`: the control's label may be shortened on narrow screens but must still name Frankfurter.

## Impact

- **Changed:** `site/index.html`, `site/app.js` (button position in the template), `site/realtime.js` (short label), `site/styles.css`, `.github/workflows/deploy.yml`, `tests/smoke_page.mjs`, `DECISIONS.md`.
- **Unchanged:** data, pipeline, data format.
