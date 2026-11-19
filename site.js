(function () {
  "use strict";

  var STORAGE_KEY = "superwho-detroit-paths";

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function loadPicked() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function savePicked(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  /* ---------- reveal + timeline ---------- */
  function setupReveal() {
    var nodes = $all(".reveal, .week");
    if (!nodes.length) return;
    if (window.__SHOT__) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      document.body.classList.add("shot");
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("in");
      });
    }, { threshold: 0.18 });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function setupTimeline() {
    var fill = $(".timeline-fill");
    var wrap = $(".timeline");
    if (!fill || !wrap) return;
    function update() {
      if (document.body.classList.contains("shot") || window.__SHOT__) {
        fill.style.height = "100%";
        return;
      }
      var rec = wrap.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var start = vh * 0.75;
      var traveled = start - rec.top;
      var pct = Math.max(0, Math.min(1, traveled / rec.height));
      fill.style.height = (pct * 100) + "%";
    }
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  window.__revealAll = function () {
    window.__SHOT__ = true;
    document.body.classList.add("shot");
    $all(".reveal, .week").forEach(function (n) { n.classList.add("in"); });
    var fill = $(".timeline-fill");
    if (fill) fill.style.height = "100%";
  };

  /* ---------- situation panes ---------- */
  function setupSituation() {
    var panes = $all(".situ-pane");
    if (!panes.length) return;
    panes.forEach(function (p) {
      p.addEventListener("click", function () {
        panes.forEach(function (x) { x.classList.remove("active"); });
        p.classList.add("active");
      });
      p.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); p.click(); }
      });
    });
  }

  /* ---------- path cards ---------- */
  function setupPaths() {
    var cards = $all(".path");
    if (!cards.length) return;
    var picked = loadPicked();

    function paint() {
      cards.forEach(function (c) {
        var id = c.getAttribute("data-path");
        var isOn = picked.indexOf(id) !== -1;
        c.classList.toggle("picked", isOn);
        var tag = c.querySelector(".picked-flag");
        if (tag) tag.hidden = !isOn;
        var btn = c.querySelector("[data-pick]");
        if (btn) btn.textContent = isOn ? "Picked" : "Pick this path";
      });
    }

    cards.forEach(function (c) {
      c.querySelectorAll("[data-flip]").forEach(function (b) {
        b.addEventListener("click", function (e) {
          e.preventDefault();
          c.classList.toggle("flipped");
        });
      });
      var pick = c.querySelector("[data-pick]");
      if (pick) {
        pick.addEventListener("click", function (e) {
          e.preventDefault();
          var id = c.getAttribute("data-path");
          var i = picked.indexOf(id);
          if (i === -1) picked.push(id);
          else picked.splice(i, 1);
          savePicked(picked);
          paint();
        });
      }
    });
    paint();
  }

  /* ---------- map pins ---------- */
  var PROPERTIES = {
    manistique: {
      title: "5600 Manistique St",
      city: "Detroit 48224",
      offer: "2 bed, 1 bath, 714 sq ft. Auction starting at $1,000, dated November 13.",
      why: "Listed as a small-house renovation cost test.",
      note: "Unverified research only. The auction date was November 13, so we’ll recheck the status before doing anything."
    },
    liberal: {
      title: "15693 Liberal St",
      city: "Detroit 48205",
      offer: "3 bed, 1 bath, 889 sq ft. Own It Now, $1,000.",
      why: "Listed for entry-level resale or rental analysis.",
      note: "Unverified research only. Statuses changed around November 13, so we’ll recheck before doing anything."
    },
    joann: {
      title: "18030 Joann St",
      city: "Detroit 48205",
      offer: "3 bed, 1 bath, 1,210 sq ft. Own It Now, $1,000.",
      why: "Listed as a larger rehabilitation comparison.",
      note: "Unverified research only. Statuses changed around November 13, so we’ll recheck before doing anything."
    },
    monterey: {
      title: "2645 Monterey St",
      city: "Detroit 48206",
      offer: "6 bed, 2 bath, 2,600 sq ft. Own It Now, $1,000.",
      why: "Listed as a high-complexity stress test.",
      note: "Unverified research only. Statuses changed around November 13, so we’ll recheck before doing anything."
    },
    sanjuan: {
      title: "15493 San Juan Dr",
      city: "Detroit 48221",
      offer: "4 bed, 2 bath, 1,344 sq ft. Auction opening at $1,100, dated November 20.",
      why: "Listed for a neighborhood / exit comparison.",
      note: "Unverified research only, observed in mid-November 2026. We’ll recheck the details before doing anything."
    }
  };

  function setupMap() {
    var pins = $all(".pin");
    var detail = $("#pin-detail");
    if (!pins.length || !detail) return;

    function show(id) {
      var p = PROPERTIES[id];
      if (!p) return;
      pins.forEach(function (x) { x.classList.toggle("active", x.getAttribute("data-id") === id); });
      detail.innerHTML =
        "<p class='rank'>Selected property</p>" +
        "<h3>" + p.title + "</h3>" +
        "<p>" + p.city + "</p>" +
        "<dl>" +
        "<dt>Published offer information</dt><dd>" + p.offer + "</dd>" +
        "<dt>Why it was listed</dt><dd>" + p.why + "</dd>" +
        "<dt>Status</dt><dd>" + p.note + "</dd>" +
        "</dl>" +
        "<p class='calc-note'>Land Bank homes are generally sold as-is and often carry rehabilitation and occupancy obligations, commonly including a six-month target, with possible extensions. Missing those requirements can put ownership at risk, so we’d plan for them together before any bid. This is not a recommendation to bid or buy.</p>";
    }

    pins.forEach(function (pin) {
      pin.addEventListener("click", function () { show(pin.getAttribute("data-id")); });
      pin.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); show(pin.getAttribute("data-id")); }
      });
    });
  }

  /* ---------- calculator ---------- */
  /*
    Illustration seeds from the discussion (not forecasts):
    Flip: $175,000 sale / $155,000 all-in costs / $20,000 contribution.
      The $155,000 is split here only so the sliders can be moved:
      purchase $90,000 + rehab $40,000 + other $25,000. That split is not a documented deal.
    Wholesale: $8,000 revenue / $2,500 costs / $5,500 contribution (1 assignment).
    Research: $4,000 / $1,200 / $2,800 for 4 clients → $1,000 and $300 each.
    Activation: $6,000 / $2,000 / $4,000 for 2 projects → $3,000 and $1,000 each.
    Hours per week were never collected; 10 is a playable assumption.
  */
  var SEEDS = {
    flip: {
      purchase: 90000, rehab: 40000, other: 25000, sale: 175000,
      holding: 4, volume: 1, hours: 10, fee: 0, unitCost: 0
    },
    wholesale: {
      purchase: 0, rehab: 0, other: 0, sale: 8000,
      holding: 1, volume: 1, hours: 10, fee: 8000, unitCost: 2500
    },
    research: {
      purchase: 0, rehab: 0, other: 0, sale: 1000,
      holding: 0, volume: 4, hours: 10, fee: 1000, unitCost: 300
    },
    activation: {
      purchase: 0, rehab: 0, other: 0, sale: 3000,
      holding: 1, volume: 2, hours: 10, fee: 3000, unitCost: 1000
    }
  };

  var state = { path: "flip" };
  Object.assign(state, SEEDS.flip);

  var charts = {};

  function money(n) {
    var sign = n < 0 ? "-" : "";
    var v = Math.abs(Math.round(n));
    return sign + "$" + v.toLocaleString("en-US");
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function tween(el, next) {
    var prev = parseFloat(el.getAttribute("data-val") || "0");
    el.setAttribute("data-val", String(next));
    if (reducedMotion()) { el.textContent = money(next); return; }
    var start = performance.now();
    var dur = 640;
    function step(t) {
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var cur = prev + (next - prev) * eased;
      el.textContent = money(cur);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = money(next);
    }
    requestAnimationFrame(step);
  }

  function compute() {
    var path = state.path;
    var profit, revenue, costs, volumeLabel;
    if (path === "flip") {
      revenue = state.sale;
      costs = state.purchase + state.rehab + state.other;
      profit = revenue - costs;
      volumeLabel = "deals";
    } else if (path === "wholesale") {
      revenue = state.fee;
      costs = state.unitCost;
      profit = revenue - costs;
      volumeLabel = "assignments";
    } else if (path === "research") {
      revenue = state.fee;
      costs = state.unitCost;
      profit = revenue - costs;
      volumeLabel = "clients";
    } else {
      revenue = state.fee;
      costs = state.unitCost;
      profit = revenue - costs;
      volumeLabel = "projects";
    }
    var monthly = profit * state.volume;
    var hoursMonth = state.hours * (52 / 12);
    var perHour = hoursMonth > 0 ? monthly / hoursMonth : 0;
    var months = [];
    var i;
    for (i = 1; i <= 12; i++) {
      months.push(i > state.holding ? monthly : 0);
    }
    var year = months.reduce(function (a, b) { return a + b; }, 0);
    return {
      profit: profit, revenue: revenue, costs: costs,
      monthly: monthly, perHour: perHour, months: months, year: year,
      volumeLabel: volumeLabel
    };
  }

  function paintKPIs(r) {
    var profitEl = $("#kpi-profit");
    var monthEl = $("#kpi-month");
    var hourEl = $("#kpi-hour");
    if (!profitEl) return;
    tween(profitEl, r.profit);
    tween(monthEl, r.monthly);
    tween(hourEl, r.perHour);
    [profitEl, monthEl, hourEl].forEach(function (el, idx) {
      var v = idx === 0 ? r.profit : idx === 1 ? r.monthly : r.perHour;
      el.classList.remove("warn", "bad");
      if (v < 0) el.classList.add("bad");
      else if (v < 1000 && idx !== 2) el.classList.add("warn");
      else if (idx === 2 && v < 25) el.classList.add("warn");
    });
  }

  function tickMoney(v) {
    if (v === 0) return "$0";
    var abs = Math.abs(v);
    if (abs >= 1000) {
      var k = v / 1000;
      var s = Math.abs(k - Math.round(k)) < 0.05 ? String(Math.round(k)) : k.toFixed(1);
      return "$" + s + "K";
    }
    return "$" + Math.round(v);
  }

  function chartDefaults() {
    if (typeof Chart === "undefined") return;
    Chart.defaults.color = "#9a9388";
    Chart.defaults.borderColor = "#2a303c";
    Chart.defaults.font.family = "'IBM Plex Mono', monospace";
    Chart.defaults.font.size = 11;
  }

  function setupCharts() {
    if (typeof Chart === "undefined") return;
    chartDefaults();
    var profitCtx = $("#chart-profit");
    var yearCtx = $("#chart-year");
    var hourCtx = $("#chart-hour");
    if (!profitCtx || !yearCtx || !hourCtx) return;

    charts.profit = new Chart(profitCtx, {
      type: "bar",
      data: {
        labels: ["Revenue", "Costs", "Contribution"],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ["#00f0d4", "#ff3b00", "#ffc43a"],
          borderWidth: 0,
          barPercentage: 0.6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(42,48,60,0.8)" }, ticks: { callback: tickMoney } }
        }
      }
    });

    charts.year = new Chart(yearCtx, {
      type: "line",
      data: {
        labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
        datasets: [{
          data: new Array(12).fill(0),
          borderColor: "#00f0d4",
          backgroundColor: "rgba(0,240,212,0.12)",
          fill: true,
          tension: 0.25,
          pointRadius: 3,
          pointBackgroundColor: "#ff3b00",
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(42,48,60,0.8)" }, ticks: { callback: tickMoney } }
        }
      }
    });

    charts.hour = new Chart(hourCtx, {
      type: "bar",
      data: {
        labels: ["5 hrs/wk", "10 hrs/wk", "20 hrs/wk", "40 hrs/wk"],
        datasets: [{
          label: "$ / hour",
          data: [0, 0, 0, 0],
          backgroundColor: ["#ff7a18", "#00f0d4", "#ffc43a", "#ff3b00"],
          borderWidth: 0,
          barPercentage: 0.7
        }]
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: "rgba(42,48,60,0.8)" }, ticks: { callback: tickMoney } },
          y: { grid: { display: false } }
        }
      }
    });
  }

  function updateCharts(r) {
    if (charts.profit) {
      charts.profit.data.datasets[0].data = [r.revenue, r.costs, r.profit];
      charts.profit.update();
    }
    if (charts.year) {
      charts.year.data.datasets[0].data = r.months;
      charts.year.update();
    }
    if (charts.hour) {
      var monthly = r.monthly;
      function rate(hrs) { return hrs > 0 ? Math.round(monthly / (hrs * 52 / 12)) : 0; }
      charts.hour.data.datasets[0].data = [rate(5), rate(10), rate(20), rate(40)];
      // Highlight the user's chosen hours by shifting the matching bar toward cyan.
      var hrs = state.hours;
      var colors = ["#ff7a18", "#ff7a18", "#ff7a18", "#ff7a18"];
      var idx = hrs <= 7 ? 0 : hrs <= 15 ? 1 : hrs <= 30 ? 2 : 3;
      colors[idx] = "#00f0d4";
      charts.hour.data.datasets[0].backgroundColor = colors;
      charts.hour.update();
    }
  }

  function applyPath(path) {
    state.path = path;
    var seed = SEEDS[path];
    Object.keys(seed).forEach(function (k) { state[k] = seed[k]; });
    var hideDeal = path !== "flip";
    $all("[data-for]").forEach(function (el) {
      var allow = el.getAttribute("data-for").split(/\s+/);
      el.classList.toggle("dim", allow.indexOf(path) === -1);
    });
    syncSliders();
    refresh();
    $all(".path-switch button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-calc-path") === path);
    });
  }

  function syncSliders() {
    $all("[data-bind]").forEach(function (inp) {
      var key = inp.getAttribute("data-bind");
      if (state[key] == null) return;
      inp.value = state[key];
      var out = inp.closest(".ctrl") && inp.closest(".ctrl").querySelector("output");
      if (out) out.textContent = formatBound(key, state[key]);
    });
  }

  function formatBound(key, val) {
    if (key === "holding" || key === "volume" || key === "hours") return String(val);
    return money(val);
  }

  function refresh() {
    var r = compute();
    paintKPIs(r);
    updateCharts(r);
    var yearEl = $("#kpi-year");
    if (yearEl) tween(yearEl, r.year);
    return r;
  }

  function setupCalcCountUp() {
    var shell = $(".calc-shell");
    if (!shell || reducedMotion()) return;
    var once = false;
    var io = new IntersectionObserver(function (entries) {
      if (once) return;
      if (entries.some(function (e) { return e.isIntersecting; })) {
        once = true;
        ["kpi-profit", "kpi-month", "kpi-hour", "kpi-year"].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.setAttribute("data-val", "0");
        });
        refresh();
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(shell);
  }

  function setupCalculator() {
    if (!$(".calc-shell")) return;
    setupCharts();
    setupCalcCountUp();

    $all(".path-switch button").forEach(function (b) {
      b.addEventListener("click", function () { applyPath(b.getAttribute("data-calc-path")); });
    });
    $all("[data-bind]").forEach(function (inp) {
      inp.addEventListener("input", function () {
        var key = inp.getAttribute("data-bind");
        state[key] = Number(inp.value);
        var out = inp.closest(".ctrl") && inp.closest(".ctrl").querySelector("output");
        if (out) out.textContent = formatBound(key, state[key]);
        refresh();
      });
    });

    var picked = loadPicked();
    var start = "flip";
    if (picked.indexOf("research") !== -1) start = "research";
    else if (picked.indexOf("activation") !== -1) start = "activation";
    else if (picked.indexOf("wholesale") !== -1) start = "wholesale";
    else if (picked.indexOf("reno") !== -1) start = "flip";
    applyPath(start);

    window.__calcState = state;
    window.__calcCompute = compute;
    window.__calcApply = applyPath;
    window.__calcRefresh = refresh;
  }

  /* ---------- input page ---------- */
  var QUESTIONS = [
    "What would you like this business to accomplish for your family over the next 12 months and five years?",
    "How much capital would you be comfortable putting at risk initially, without affecting family security?",
    "How much time could each of you realistically commit each week while employed?",
    "Which parts of real estate interest you most, and which would you prefer to avoid?",
    "What local relationships, resources, or skills could we appropriately draw on together, within the limits of your jobs?",
    "Would you prefer larger profits from occasional transactions, or smaller profits from repeatable activity?",
    "What would convince you that this business is ready to grow? What proof would you want before expanding or leaving employment?"
  ];
  var HINTS = [
    "A few words is plenty. There are no wrong answers.",
    "A range is fine, including what you would not want to risk.",
    "Include any limits from work and family commitments.",
    "Buying, researching, negotiating, managing, renovating, commercial property, or other work.",
    "Investors, contractors, property owners, community organizations, or others.",
    "Please say which you prefer, and why.",
    "For example, consistent monthly profit, reliable customers, or proven systems."
  ];

  function setupInput() {
    var root = $("#input-flow");
    if (!root) return;
    var step = 0;
    var answers = new Array(7).fill("");
    var qEl = $("#q-text");
    var ta = $("#q-answer");
    var bar = $("#q-progress span");
    var stepEl = $("#q-step");
    var nextBtn = $("#q-next");
    var backBtn = $("#q-back");
    var react = $("#react-block");
    var sendWrap = $("#send-block");
    var formCard = $("#q-card");
    var thanks = $("#thanks");

    function show() {
      var total = 8; // 7 questions + reactions/comment
      if (step < 7) {
        qEl.textContent = QUESTIONS[step];
        ta.value = answers[step];
        ta.placeholder = HINTS[step];
        ta.parentNode.style.display = "";
        react.style.display = "none";
        sendWrap.style.display = "none";
        nextBtn.textContent = step === 6 ? "Continue" : "Next";
        stepEl.textContent = "Question " + (step + 1) + " of 7";
        bar.style.width = ((step + 1) / 8 * 100) + "%";
      } else {
        qEl.textContent = "How do these paths feel?";
        ta.parentNode.style.display = "none";
        react.style.display = "";
        sendWrap.style.display = "";
        nextBtn.style.display = "none";
        stepEl.textContent = "Your take";
        bar.style.width = "100%";
      }
      backBtn.style.visibility = step === 0 ? "hidden" : "visible";
    }

    nextBtn.addEventListener("click", function () {
      if (step < 7) {
        answers[step] = ta.value;
        step += 1;
        show();
      }
    });
    backBtn.addEventListener("click", function () {
      if (step > 0 && step <= 7) answers[Math.min(step, 6)] = ta.value;
      if (step > 0) {
        step -= 1;
        nextBtn.style.display = "";
        show();
      }
    });
    var send = $("#send-btn");
    if (send) {
      send.addEventListener("click", function (e) {
        e.preventDefault();
        formCard.style.display = "none";
        thanks.classList.add("show");
      });
    }
    var askBtn = $("#ask-btn");
    if (askBtn) {
      askBtn.addEventListener("click", function (e) {
        e.preventDefault();
        var h = $("#ask-hint");
        if (h) h.textContent = "This preview does not send questions yet.";
      });
    }

    if (window.__SHOT_STEP__) {
      step = Number(window.__SHOT_STEP__);
      show();
    } else {
      show();
    }

    window.__inputGo = function (n) { step = n; nextBtn.style.display = n < 7 ? "" : "none"; show(); };
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupReveal();
    setupTimeline();
    setupSituation();
    setupPaths();
    setupMap();
    setupCalculator();
    setupInput();
  });
})();
