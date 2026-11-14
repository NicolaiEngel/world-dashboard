// Smoke check for the dashboard page.
//
//   node tests/smoke_page.mjs [url] [screenshot-dir]
//
// Defaults: http://localhost:8000/ and test-results/. Run it against the local
// preview (cd site && python -m http.server) before merging, and against the
// live URL after every deploy. Exit code 0 = all checks passed.
//
// Needs Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const url = process.argv[2] || "http://localhost:8000/";
const outDir = process.argv[3] || "test-results";
const EXPECTED_TILES = Number(process.env.EXPECTED_TILES || 13);
const origin = new URL(url).origin;
mkdirSync(outDir, { recursive: true });

const failures = [];
const check = (ok, msg) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${msg}`);
  if (!ok) failures.push(msg);
};

const browser = await chromium.launch();

// Recorded real Frankfurter response (tests/fixtures), reduced to the latest day: the shape
// of a "latest rates" answer. Real-time tests never contact Frankfurter itself.
const fxRows = JSON.parse(readFileSync(new URL("./fixtures/frankfurter/rates_ecb.json", import.meta.url), "utf8"));
const fxLatestDate = fxRows.map((r) => r.date).sort().at(-1);
const FX_LATEST = fxRows.filter((r) => r.date === fxLatestDate);

async function openPage(viewport, { blockData = false, blockFetched = false, fx = null, storage = null } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const log = { errors: [], pageErrors: [], foreign: [] };
  page.on("console", (m) => m.type() === "error" && log.errors.push(m.text()));
  page.on("pageerror", (e) => log.pageErrors.push(e.message));
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("data:") && new URL(u).origin !== origin) log.foreign.push(u);
  });
  if (storage) await context.addInitScript((kv) => { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); }, storage);
  log.fx = 0;
  await context.route("https://api.frankfurter.dev/**", (r) => {
    log.fx++;
    if (fx === "hang") return; // never answers: the page must time out on its own
    return r.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" },
                       body: JSON.stringify(FX_LATEST) });
  });
  if (blockFetched || blockData) {
    await page.route("**/data/dashboard.json", (r) => r.fulfill({ status: 404, body: "" }));
  }
  if (blockData) {
    await page.route("**/data/mock-data.json", (r) => r.fulfill({ status: 404, body: "" }));
  }
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector(".tile, .load-error", { timeout: 10000 });
  return { context, page, log };
}

// ---------- desktop ----------
{
  const { context, page, log } = await openPage({ width: 1440, height: 1000 });
  // The data file the page actually used: fetched data if present, else the mock file.
  const data = await page.evaluate(async () => {
    for (const u of ["data/dashboard.json", "data/mock-data.json"]) {
      const r = await fetch(u); if (r.ok) return r.json();
    }
  });
  console.log(`      (data: ${data.indicators.filter((i) => !i.mock).length} of ${data.indicators.length} real)`);

  const tiles = await page.locator(".tile").count();
  check(tiles === EXPECTED_TILES, `${tiles} tiles rendered (expected ${EXPECTED_TILES})`);
  check(tiles === data.indicators.length, `one tile per indicator in the data (${data.indicators.length})`);

  const header = await page.locator(".site-header").innerText();
  check(/World Dashboard/.test(header) && !/Data as of/i.test(header), "header shows the title and no data date");

  const headings = await page.locator(".category__title").allTextContents();
  const expectedHeadings = data.categories.filter((c) => data.indicators.some((i) => i.category === c));
  check(JSON.stringify(headings) === JSON.stringify(expectedHeadings), `category order: ${headings.join(", ")}`);

  const info = await page.evaluate(() =>
    [...document.querySelectorAll(".tile")].map((t) => {
      const r = t.getBoundingClientRect();
      const chart = window.Chart && Chart.getChart(t.querySelector("canvas"));
      const fits = (sel) => { const e = t.querySelector(sel); return e.scrollWidth <= e.clientWidth && e.scrollHeight <= e.clientHeight + 1; };
      return {
        id: t.dataset.id,
        w: Math.round(r.width), h: Math.round(r.height),
        number: t.querySelector(".tile__number").textContent,
        cadence: t.querySelector(".tile__cadence").textContent,
        date: t.querySelector(".tile__date").getAttribute("datetime"),
        href: t.querySelector(".tile__source-link").getAttribute("href"),
        target: t.querySelector(".tile__source-link").getAttribute("target"),
        points: chart ? chart.data.labels.length : 0,
        color: chart ? chart.data.datasets[0].borderColor : null,
        titleFits: fits(".tile__title") && fits(".tile__subtitle"), valueFits: fits(".tile__value"),
        badges: t.querySelectorAll(".badge-mock").length,
        badgeText: (t.querySelector(".badge-mock") || {}).textContent || "",
        badgeTitle: t.querySelector(".badge-mock")?.getAttribute("title") || "",
        axes: chart ? (() => {
          const x = chart.scales.x, y = chart.scales.y;
          const vals = chart.data.datasets[0].data;
          return {
            xShown: x.options.display !== false, yShown: y.options.display !== false,
            xLabels: x.ticks.map((tk) => x.getLabelForValue ? x.options.ticks.callback.call(x, tk.value) : String(tk.label)),
            yTicks: y.ticks.map((tk) => tk.value),
            yLabels: y.ticks.map((tk) => String(tk.label)),
            dataMin: Math.min(...vals), dataMax: Math.max(...vals),
          };
        })() : null,
      };
    }));
  const sizes = new Set(info.map((t) => `${t.w}x${t.h}`));
  check(sizes.size === 1, `all tiles the same size (${[...sizes].join(", ")})`);
  check(new Set(info.map((t) => t.color)).size === 1 && info[0].color, `one chart colour (${info[0]?.color})`);

  const fmt = (v, d) => new Intl.NumberFormat("en", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v);
  for (const ind of data.indicators) {
    const t = info.find((x) => x.id === ind.id);
    if (!t) { check(false, `${ind.id}: tile missing`); continue; }
    const last = ind.series[ind.series.length - 1];
    const problems = [];
    if (t.number !== fmt(last.value, ind.decimals)) problems.push(`value ${t.number} != ${fmt(last.value, ind.decimals)}`);
    if (t.date !== ind.as_of) problems.push(`date ${t.date} != ${ind.as_of}`);
    if (t.href !== ind.source.url || t.target !== "_blank") problems.push("source link");
    if (!t.titleFits || !t.valueFits) problems.push("title/definition/value overflow");
    if (ind.cadence === "daily" && !(t.points > 200 && t.points <= 366)) problems.push(`daily chart has ${t.points} points`);
    if (ind.cadence !== "daily" && t.points !== ind.series.length) problems.push(`annual chart has ${t.points}/${ind.series.length} points`);
    if (t.badges !== (ind.mock === true ? 1 : 0)) problems.push(`${t.badges} MOCK badge(s) for mock=${ind.mock}`);
    if (t.badges && !(/^MOCK/.test(t.badgeText) && /mock data/i.test(t.badgeText) && /mock data/i.test(t.badgeTitle))) problems.push("badge lacks accessible description");
    const a = t.axes;
    if (!a || !a.xShown || !a.yShown) problems.push("axes hidden");
    else {
      if (a.xLabels.length < 2 || a.xLabels.some((l) => !l)) problems.push(`x labels ${JSON.stringify(a.xLabels)}`);
      const re = ind.cadence === "daily" ? /^[A-Z][a-z]{2} \d{4}$/ : /^\d{4}$/;
      if (!a.xLabels.every((l) => re.test(l))) problems.push(`x label format ${JSON.stringify(a.xLabels)}`);
      if (ind.cadence !== "daily" && (a.xLabels[0] !== ind.series[0].date || a.xLabels.at(-1) !== ind.series.at(-1).date))
        problems.push("annual x labels don't reach first/last year");
      if (a.yTicks.length < 2 || a.yLabels.some((l) => !l)) problems.push(`y ticks ${JSON.stringify(a.yLabels)}`);
      if (!(a.yTicks[0] <= a.dataMin && a.yTicks.at(-1) >= a.dataMax)) problems.push(`y ticks ${a.yTicks[0]}..${a.yTicks.at(-1)} don't span ${a.dataMin}..${a.dataMax}`);
    }
    check(problems.length === 0, `${ind.id}: ${problems.length ? problems.join("; ") : "value, date, link, chart ok"}`);
  }

  check((await page.locator(".tile-slot").count()) === 0, "no empty placeholder slot");

  check(log.errors.length === 0 && log.pageErrors.length === 0,
    `no console errors${log.errors.length + log.pageErrors.length ? ": " + [...log.errors, ...log.pageErrors].join(" | ") : ""}`);
  check(log.foreign.length === 0, `only own-origin requests${log.foreign.length ? ": " + log.foreign.join(", ") : ""}`);
  check((await context.cookies()).length === 0, "no cookies set");
  await page.screenshot({ path: `${outDir}/desktop.png`, fullPage: true });
  await context.close();
}

// ---------- phone ----------
{
  const { context, page, log } = await openPage({ width: 360, height: 780 });
  const scroll = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  check(scroll[0] <= scroll[1], `no horizontal scroll at 360 px (${scroll[0]} <= ${scroll[1]})`);
  const overflow = await page.evaluate(() => [...document.querySelectorAll(".tile")]
    .filter((t) => [".tile__title", ".tile__subtitle", ".tile__value"].some((s) => { const e = t.querySelector(s); return e.scrollWidth > e.clientWidth || e.scrollHeight > e.clientHeight + 1; }))
    .map((t) => t.dataset.id));
  check(overflow.length === 0, `phone: titles, definitions and values fit${overflow.length ? " (overflow: " + overflow.join(", ") + ")" : ""}`);
  const axisIssues = await page.evaluate(() => [...document.querySelectorAll(".tile")].flatMap((t) => {
    const chart = Chart.getChart(t.querySelector("canvas"));
    const x = chart.scales.x, ctx = chart.ctx;
    const f = x.options.ticks.font;
    ctx.save(); ctx.font = `${f.size}px ${f.family}`;
    const items = x.ticks.map((tk, i) => {
      const label = x.options.ticks.callback.call(x, tk.value);
      const w = ctx.measureText(label).width, px = x.getPixelForTick(i);
      // Chart.js aligns edge labels inward when they'd overflow; use the drawn label boxes
      return { label, w, px };
    });
    ctx.restore();
    const out = [];
    const items2 = (x._labelItems || []).map((it, i) => ({ ...items[i], left: it.options.translation[0] - (it.options.textAlign === "left" ? 0 : it.options.textAlign === "right" ? items[i].w : items[i].w / 2) }));
    for (let i = 0; i + 1 < items2.length; i++) {
      if (items2[i].left + items2[i].w + 2 > items2[i + 1].left) out.push(`${t.dataset.id}: "${items2[i].label}" overlaps "${items2[i + 1].label}"`);
    }
    for (const it of items2) if (it.left < -1 || it.left + it.w > chart.width + 1) out.push(`${t.dataset.id}: "${it.label}" outside chart`);
    return out;
  }));
  check(axisIssues.length === 0, `phone: axis labels don't overlap or spill${axisIssues.length ? " (" + axisIssues.join("; ") + ")" : ""}`);
  check(log.pageErrors.length === 0, "phone: no uncaught errors");
  await page.screenshot({ path: `${outDir}/phone.png`, fullPage: true });
  await context.close();
}

// ---------- real-time exchange rates (opt-in) ----------
{
  const { context, page, log } = await openPage({ width: 1440, height: 1000 });
  const data = await page.evaluate(async () => (await fetch("data/dashboard.json")).ok
    ? (await fetch("data/dashboard.json")).json() : (await fetch("data/mock-data.json")).json());
  const fxReal = ["eur_usd", "usd_cny"].filter((id) => data.indicators.find((i) => i.id === id)?.mock === false);
  const btn = page.locator("#realtime-toggle");
  check(await btn.isVisible() && /Load real-time exchange rates \(connects to Frankfurter\)/.test(await btn.innerText()),
    "real-time: opt-in control names Frankfurter");
  check(log.fx === 0 && log.foreign.length === 0, "real-time: nothing outside our site before the click");
  await btn.click();
  await page.waitForTimeout(800);
  check(log.fx === 1, `real-time: exactly one Frankfurter request after the click (${log.fx})`);
  check(!log.foreign.some((u) => !u.startsWith("https://api.frankfurter.dev/")), "real-time: no other outside host (no Bitcoin request)");
  const whens = await page.evaluate((ids) => ids.map((id) => document.querySelector(`.tile[data-id="${id}"] .tile__when`).innerText), fxReal);
  check(fxReal.length === 0 || whens.every((w) => /^Real-time · \d\d:\d\d$/.test(w)),
    `real-time: FX footers show "Real-time · HH:MM" (${whens.join(" | ") || "FX still mock: skipped"})`);
  if (fxReal.includes("usd_cny")) {
    const q = Object.fromEntries(FX_LATEST.map((r) => [r.quote, r.rate]));
    const shown = await page.locator('.tile[data-id="usd_cny"] .tile__number').innerText();
    check(shown === (q.CNY / q.USD).toFixed(4), `real-time: USD/CNY = CNY ÷ USD (${shown})`);
  }
  const btcWhen = await page.locator('.tile[data-id="btc_usd"] .tile__when').innerText();
  check(!/Real-time/.test(btcWhen), "real-time: Bitcoin tile unaffected");
  await btn.click();
  const after = await page.evaluate((ids) => ids.map((id) => document.querySelector(`.tile[data-id="${id}"] .tile__when`).innerText), fxReal);
  check(after.every((w) => !/Real-time/.test(w)), "real-time: switching off restores stored values");
  check(log.pageErrors.length === 0, "real-time: no uncaught errors");
  await context.close();
}
{
  const { context, page, log } = await openPage({ width: 1024, height: 700 }, { storage: { "wd.realtime": "on" } });
  await page.waitForTimeout(800);
  check(log.fx === 1 && (await page.locator("#realtime-toggle").getAttribute("aria-pressed")) === "true",
    "real-time: remembered choice loads without a click");
  await context.close();
}
{
  const { context, page, log } = await openPage({ width: 1024, height: 700 }, { storage: { "wd.realtime": "on" }, fx: "hang" });
  await page.waitForTimeout(6000);
  const whens = await page.locator(".tile__when").allInnerTexts();
  check(log.fx === 1 && !whens.some((w) => /Real-time/.test(w)) && log.pageErrors.length === 0,
    "real-time: timeout keeps stored values silently");
  await context.close();
}

// ---------- fetched data missing: mock fallback ----------
{
  const { context, page, log } = await openPage({ width: 1024, height: 700 }, { blockFetched: true });
  const tiles = await page.locator(".tile").count();
  const badges = await page.locator(".badge-mock").count();
  check(tiles === EXPECTED_TILES && badges === EXPECTED_TILES && log.pageErrors.length === 0,
    `no dashboard.json: renders all tiles from the mock file (${tiles} tiles, ${badges} MOCK)`);
  await context.close();
}

// ---------- data load failure ----------
{
  const { context, page, log } = await openPage({ width: 1024, height: 700 }, { blockData: true });
  const msg = await page.locator(".load-error").count();
  check(msg === 1 && (await page.locator(".site-title").count()) === 1, "load failure: header stays, error message shown");
  check(log.pageErrors.length === 0, "load failure: no uncaught errors");
  await context.close();
}

await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : "\nAll checks passed");
process.exit(failures.length ? 1 : 0);
