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
import { mkdirSync } from "node:fs";

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

async function openPage(viewport, { blockData = false } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const log = { errors: [], pageErrors: [], foreign: [] };
  page.on("console", (m) => m.type() === "error" && log.errors.push(m.text()));
  page.on("pageerror", (e) => log.pageErrors.push(e.message));
  page.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("data:") && new URL(u).origin !== origin) log.foreign.push(u);
  });
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
  const data = await page.evaluate(async () => (await fetch("data/mock-data.json")).json());

  const tiles = await page.locator(".tile").count();
  check(tiles === EXPECTED_TILES, `${tiles} tiles rendered (expected ${EXPECTED_TILES})`);
  check(tiles === data.indicators.length, `one tile per indicator in the data (${data.indicators.length})`);

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
