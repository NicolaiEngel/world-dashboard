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
    check(problems.length === 0, `${ind.id}: ${problems.length ? problems.join("; ") : "value, date, link, chart ok"}`);
  }

  const lastGroup = page.locator(".category").last();
  check((await lastGroup.locator(".tile-slot").count()) === 1 && (await page.locator(".tile-slot").count()) === 1,
    "one empty slot, at the end of the last group");

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
