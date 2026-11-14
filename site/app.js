/* World Dashboard: renders every indicator in the data file as an identical tile.
   Nothing here is indicator-specific: add an indicator to the data file and it appears. */
(function () {
  "use strict";

  const DATA_URL = "data/mock-data.json";
  const DAILY_WINDOW_DAYS = 365;
  const CADENCE_LABEL = { daily: "Daily", monthly: "Monthly", annual: "Annual" };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const $dashboard = document.getElementById("dashboard");
  const $template = document.getElementById("tile-template");

  /* ISO date ("YYYY", "YYYY-MM" or "YYYY-MM-DD") -> "2026", "Nov 2026", "13 Nov 2026" */
  function formatDate(iso) {
    const [y, m, d] = String(iso).split("-");
    if (d) return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
    if (m) return `${MONTHS[Number(m) - 1]} ${y}`;
    return y;
  }

  function formatNumber(value, decimals) {
    return new Intl.NumberFormat("en", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  }

  function dayNumber(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  }

  /* Daily tiles show about the last year; annual (and monthly) tiles show everything. */
  function chartWindow(ind) {
    const s = ind.series;
    if (ind.cadence !== "daily" || s.length === 0) return s;
    const cutoff = dayNumber(s[s.length - 1].date) - DAILY_WINDOW_DAYS;
    return s.filter((p) => dayNumber(p.date) >= cutoff);
  }

  const compact = new Intl.NumberFormat("en", { notation: "compact", maximumSignificantDigits: 3 });

  /* Axis label for a point date: years as-is, days and months as "Nov 2026". */
  function axisDate(iso) {
    const [y, m] = String(iso).split("-");
    return m ? `${MONTHS[Number(m) - 1]} ${y}` : y;
  }

  /* x ticks at the first point, the middle (if room) and the last point. */
  function edgeTicks(n, count) {
    if (n <= 1) return [0];
    if (count <= 2 || n === 2) return [0, n - 1];
    return [0, Math.round((n - 1) / 2), n - 1];
  }

  function drawChart(canvas, points) {
    if (typeof Chart === "undefined") return;
    const css = getComputedStyle(document.documentElement);
    const color = css.getPropertyValue("--chart-line").trim();
    const axisText = css.getPropertyValue("--axis-text").trim();
    const axisGrid = css.getPropertyValue("--axis-grid").trim();
    const narrow = canvas.parentElement.clientWidth < 200;
    const xCount = narrow ? 2 : 3;
    const font = { size: 10, family: css.getPropertyValue("--font-sans").trim() };
    new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map((p) => p.date),
        datasets: [{
          data: points.map((p) => p.value),
          borderColor: color,
          borderWidth: 1.6,
          pointRadius: 0,
          tension: 0,
          fill: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        events: [],
        layout: { padding: { top: 2, bottom: 2 } },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            type: "category",
            grid: { display: false },
            border: { display: false },
            afterBuildTicks: (axis) => {
              axis.ticks = edgeTicks(points.length, xCount).map((i) => ({ value: i }));
            },
            ticks: {
              autoSkip: false,
              maxRotation: 0,
              color: axisText,
              font,
              padding: 2,
              callback: (value) => axisDate(points[value] ? points[value].date : ""),
            },
          },
          y: {
            grace: "5%",
            grid: { color: axisGrid, drawTicks: false },
            border: { display: false },
            ticks: {
              maxTicksLimit: 3,
              color: axisText,
              font,
              padding: 4,
              callback: (value) => compact.format(value),
            },
          },
        },
      },
    });
  }

  function renderTile(ind) {
    const node = $template.content.firstElementChild.cloneNode(true);
    const last = ind.series[ind.series.length - 1];
    node.dataset.id = ind.id;

    node.querySelector(".tile__title").textContent = ind.title;
    if (ind.mock !== true) node.querySelector(".badge-mock").remove();
    const sub = node.querySelector(".tile__subtitle");
    sub.textContent = ind.subtitle || "";
    sub.title = ind.subtitle || "";

    node.querySelector(".tile__number").textContent = last ? formatNumber(last.value, ind.decimals) : "–";
    node.querySelector(".tile__unit").textContent = ind.unit || "";

    node.querySelector(".tile__cadence").textContent = CADENCE_LABEL[ind.cadence] || ind.cadence;
    const date = node.querySelector(".tile__date");
    date.textContent = formatDate(ind.as_of);
    date.dateTime = ind.as_of;

    const link = node.querySelector(".tile__source-link");
    link.textContent = ind.source.name;
    link.href = ind.source.url;
    link.title = ind.source.name;

    return node;
  }

  function render(data) {
    const indicators = data.indicators || [];
    const categories = data.categories || [];

    $dashboard.replaceChildren();
    const charts = [];
    const groups = categories
      .map((name) => ({ name, items: indicators.filter((i) => i.category === name) }))
      .filter((g) => g.items.length > 0);

    groups.forEach((group) => {
      const section = document.createElement("section");
      section.className = "category";
      const h = document.createElement("h2");
      h.className = "category__title";
      h.textContent = group.name;
      const tiles = document.createElement("div");
      tiles.className = "category__tiles";

      group.items.forEach((ind) => {
        const tile = renderTile(ind);
        tiles.appendChild(tile);
        charts.push([tile.querySelector("canvas"), chartWindow(ind)]);
      });

      section.append(h, tiles);
      $dashboard.appendChild(section);
    });

    // Draw charts after the tiles are in the DOM, so they have a size.
    charts.forEach(([canvas, points]) => drawChart(canvas, points));
  }

  function showLoadError() {
    const p = document.createElement("p");
    p.className = "load-error";
    p.setAttribute("role", "alert");
    p.textContent = "The data could not be loaded. Please try again later.";
    $dashboard.replaceChildren(p);
  }

  fetch(DATA_URL, { cache: "no-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(render)
    .catch((err) => {
      console.warn("World Dashboard: data load failed:", err.message);
      showLoadError();
    });
})();
