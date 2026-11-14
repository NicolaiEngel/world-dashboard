/* Enlarged view of a tile's chart: the full stored series, more axis labels, and the
   nearest point's date and value on hover/tap. Shows only what the tile already shows
   (title, MOCK badge, unit, source link). No outside requests. */
(function () {
  "use strict";

  const $dialog = document.getElementById("expand");
  const $dashboard = document.getElementById("dashboard");
  if (!$dialog || !$dashboard || !window.WD || typeof $dialog.showModal !== "function") return;

  const $title = $dialog.querySelector(".expand__title");
  const $badge = $dialog.querySelector(".badge-mock");
  const $unit = $dialog.querySelector(".expand__unit");
  const $canvas = $dialog.querySelector(".expand__chart canvas");
  const $source = $dialog.querySelector(".expand__source-link");
  let chart = null;
  let opener = null;

  function open(id, from) {
    const ind = window.WD.indicator(id);
    if (!ind || !ind.series || !ind.series.length || typeof Chart === "undefined") return;
    opener = from || null;
    $title.textContent = ind.title;
    $badge.hidden = ind.mock !== true;
    $unit.textContent = ind.unit ? `(${ind.unit})` : "";
    $source.textContent = ind.source.name;
    $source.href = ind.source.url;
    $dialog.dataset.id = id;
    $dialog.showModal();
    const wide = $canvas.parentElement.clientWidth >= 480;
    chart = new Chart($canvas, window.WD.chartConfig(ind.series, {
      xCount: wide ? 6 : 3, yTicks: 6, fontSize: 12,
      tooltip: { decimals: ind.decimals, unit: ind.unit },
    }));
  }

  function close() {
    if ($dialog.open) $dialog.close();
  }

  $dialog.addEventListener("close", () => {
    if (chart) { chart.destroy(); chart = null; }
    delete $dialog.dataset.id;
    if (opener && document.contains(opener)) opener.focus();
    opener = null;
  });
  $dialog.querySelector(".expand__close").addEventListener("click", close);
  // A click on the backdrop lands on the <dialog> element itself, not on its panel.
  $dialog.addEventListener("click", (e) => { if (e.target === $dialog) close(); });

  // Expand button (in the value row), or a click anywhere on a tile's mini chart.
  $dashboard.addEventListener("click", (e) => {
    const area = e.target.closest(".tile__expand, .tile__chart");
    if (!area) return;
    const tile = area.closest(".tile");
    if (!tile) return;
    open(tile.dataset.id, tile.querySelector(".tile__expand"));
  });
})();
