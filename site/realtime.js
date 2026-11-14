/* Opt-in real-time exchange rates (ECB reference rates via Frankfurter).
   Nothing outside this site is contacted until the visitor switches it on.
   One request per switch-on / page load; no periodic refresh (ECB rates change once per working day). */
(function () {
  "use strict";

  const URL = "https://api.frankfurter.dev/v2/rates?base=EUR&quotes=USD,CNY&providers=ECB";
  const ELIGIBLE = ["eur_usd", "usd_cny"];
  const KEY = "wd.realtime";
  const TIMEOUT_MS = 5000;
  const LABEL_OFF = "Load real-time exchange rates (connects to Frankfurter)";
  const LABEL_ON = "Real-time exchange rates on · switch off";

  const $btn = document.getElementById("realtime-toggle");
  if (!$btn || !window.WD) return;

  function remembered() {
    try { return localStorage.getItem(KEY) === "on"; } catch (e) { return false; }
  }
  function remember(on) {
    try { if (on) localStorage.setItem(KEY, "on"); else localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  }

  let on = false;
  let controller = null;

  function setButton() {
    $btn.textContent = on ? LABEL_ON : LABEL_OFF;
    $btn.setAttribute("aria-pressed", on ? "true" : "false");
  }

  /* Only tiles whose stored data is real get real-time values. */
  function eligible() {
    return ELIGIBLE.filter((id) => { const ind = window.WD.indicator(id); return ind && ind.mock === false; });
  }

  async function load() {
    const ids = eligible();
    if (!ids.length) return;
    controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(URL, { signal: controller.signal, cache: "no-store", credentials: "omit" });
      if (!res.ok) return;
      const rows = await res.json();
      const rate = {};
      (Array.isArray(rows) ? rows : []).forEach((r) => { if (r && r.base === "EUR") rate[r.quote] = Number(r.rate); });
      if (!on) return; // switched off while loading
      const now = new Date();
      if (ids.includes("eur_usd") && rate.USD > 0) window.WD.setRealtime("eur_usd", rate.USD, now);
      if (ids.includes("usd_cny") && rate.USD > 0 && rate.CNY > 0) window.WD.setRealtime("usd_cny", rate.CNY / rate.USD, now);
    } catch (e) {
      /* failure or timeout: keep stored values, no message */
    } finally {
      clearTimeout(timer);
    }
  }

  function switchOn() {
    on = true; remember(true); setButton(); load();
  }
  function switchOff() {
    on = false; remember(false); setButton();
    if (controller) controller.abort();
    ELIGIBLE.forEach((id) => window.WD.restoreStored(id));
  }

  $btn.addEventListener("click", () => (on ? switchOff() : switchOn()));
  setButton();
  $btn.hidden = false;
  window.WD.onLoaded(() => { if (remembered()) switchOn(); });
})();
