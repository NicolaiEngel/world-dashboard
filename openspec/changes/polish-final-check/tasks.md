# Tasks

## 1. Page fixes

- [x] 1.1 Move the expand button from the chart into the value row (right-aligned, same label and styles). Verify: the smoke check asserts at 1440 and 360 px that no button box intersects its chart's plot area (`chartArea`), that the 13 names are unchanged, and that tiles are identical in size.
- [x] 1.2 Compact the phone header: icons on the title row, and a short label ("Real-time rates (Frankfurter)", or "… on · off" when active) at ≤ 520 px, with `aria-label` keeping the full text. Verify: the smoke check at 360 px asserts header height ≤ 100 px, the visible label contains "Frankfurter", and the accessible name is the full label.
- [x] 1.3 Add an inline SVG favicon (`data:` URI). Verify: the smoke check asserts no request whose path ends in `favicon.ico`.

## 2. Deploy

- [x] 2.1 Update `configure-pages`, `upload-pages-artifact`, `deploy-pages` and `setup-python` (and `checkout`, if newer) to their current major versions. Verify: the YAML parses, and after merge the deploy run succeeds without the Node.js 20 deprecation warning.

## 3. Docs

- [x] 3.1 Add a `DECISIONS.md` entry with the audit results (widths tested, axe result, request list, size) and the fixes. Verify: the entry lists each finding with its fix.

## Workflow follow-up

- Open a PR. After merge: check the deploy log for the Node.js 20 warning, run the smoke check against the live URL, and send desktop and phone screenshots (including the expanded chart and real-time on) as the demo run-through.
- Archive the change.
