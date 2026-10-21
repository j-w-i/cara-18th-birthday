/* ============================================================
   Happy 18th Birthday, Cara — interactions
   Vanilla JS. No dependencies.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Tiny helpers
     --------------------------------------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  var toastEl = $("#toast");
  var toastTimer = null;
  function toast(msg, ms) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2600);
  }

  /* ---------------------------------------------------------
     1. Scroll progress bar
     --------------------------------------------------------- */
  var progressBar = $("#progress-bar");
  function updateProgress() {
    if (!progressBar) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    progressBar.style.transform = "scaleX(" + p + ")";
  }

  /* ---------------------------------------------------------
     2. Reveal on scroll
     --------------------------------------------------------- */
  function initReveal() {
    var items = $$(".reveal");
    if (!items.length) return;

    // stagger gallery tiles and list items
    $$("#gallery .shot").forEach(function (el, i) { el.style.setProperty("--d", i * 55); });
    $$("#things .thing").forEach(function (el, i) { el.style.setProperty("--d", Math.min(i * 38, 420)); });

    function cleanup(el) {
      // drop the reveal classes so hover transforms work normally afterwards
      setTimeout(function () {
        el.classList.remove("reveal", "in");
        el.style.removeProperty("--d");
      }, 1400 + (parseInt(el.style.getPropertyValue("--d"), 10) || 0));
    }

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach(function (el) { el.classList.add("in"); cleanup(el); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("in");
        io.unobserve(el);
        cleanup(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------
     3. Confetti engine
     --------------------------------------------------------- */
  var canvas = $("#confetti");
  var ctx = canvas ? canvas.getContext("2d") : null;
  var particles = [];
  var rafId = null;
  var dpr = 1;

  var PALETTE = ["#e9c48c", "#f6dfb6", "#f0a8b9", "#e88fa8", "#f7efe3", "#c9b3ea", "#ffd479"];
  var showerTimer = null;

  function sizeCanvas() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function addParticle(x, y, opts) {
    opts = opts || {};
    var angle = (opts.angle !== undefined ? opts.angle : Math.random() * Math.PI * 2) +
                (Math.random() - 0.5) * (opts.spread || 0);
    var speed = opts.speed !== undefined ? opts.speed : 7 + Math.random() * 7;
    var roll = Math.random();
    var isRound = roll < 0.15;
    var isRibbon = !isRound && roll < 0.5;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.lift || 0),
      w: isRound ? 4 + Math.random() * 2.5 : (isRibbon ? 3 + Math.random() * 2.5 : 6 + Math.random() * 5),
      h: isRound ? 0 : (isRibbon ? 12 + Math.random() * 8 : 6 + Math.random() * 6),
      round: isRound,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      life: 0,
      maxLife: 170 + Math.random() * 120,
      drag: 0.988,
      grav: 0.16 + Math.random() * 0.09,
      sway: isRound ? 0 : 0.5 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2
    });
  }

  function burst(x, y, count, opts) {
    if (!ctx || reduceMotion) return;
    count = count || 90;
    for (var i = 0; i < count; i++) addParticle(x, y, opts);
    startLoop();
  }

  function startLoop() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(tick);
  }

  function tick() {
    rafId = null;
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.vx *= p.drag;
      p.vy = p.vy * p.drag + p.grav;
      // a bit of drift so the strips fall like paper instead of like shrapnel
      p.x += p.vx + (p.sway ? Math.sin(p.life * 0.09 + p.phase) * p.sway : 0);
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;

      if (p.life > p.maxLife || p.y > window.innerHeight + 70) {
        particles.splice(i, 1);
        continue;
      }

      var fade = p.life > p.maxLife - 45 ? Math.max(0, (p.maxLife - p.life) / 45) : 1;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // flip the strip through its own axis so it reads as tumbling paper
        var hh = Math.max(2, Math.abs(p.h * Math.cos(p.rot * 0.8)));
        ctx.fillRect(-p.w / 2, -hh / 2, p.w, hh);
      }
      ctx.restore();
    }

    if (particles.length) {
      rafId = requestAnimationFrame(tick);
    } else if (ctx) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  /* Two corner poppers, aimed up and inwards. Reads as a party popper rather
     than a hollow ring of specks across the headline. */
  function confettiPoppers() {
    if (!ctx || reduceMotion) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    var count = w < 640 ? 45 : 85;
    burst(w * 0.03, h * 0.98, count, { angle: -Math.PI / 3.15, spread: 0.8, speed: 13, lift: 2 });
    burst(w * 0.97, h * 0.98, count, { angle: -2 * Math.PI / 3.15, spread: 0.8, speed: 13, lift: 2 });
  }

  /* A short, light shower from the top edge. Stops itself after ~1.2s. */
  function confettiShower(ms) {
    if (!ctx || reduceMotion) return;
    if (showerTimer !== null) return;
    var w = window.innerWidth;
    var started = Date.now();
    showerTimer = setInterval(function () {
      if (Date.now() - started > (ms || 1200)) {
        clearInterval(showerTimer);
        showerTimer = null;
        return;
      }
      for (var i = 0; i < 4; i++) {
        burst(Math.random() * w, -20, 1, {
          angle: Math.PI / 2 + (Math.random() - 0.5) * 0.6,
          speed: 1 + Math.random() * 2
        });
      }
    }, 110);
  }

  function confettiCelebrate(withShower) {
    confettiPoppers();
    if (withShower) confettiShower(1400);
  }

  function initConfetti() {
    if (!canvas) return;
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas, { passive: true });
  }  /* ---------------------------------------------------------
     4. Gallery lightbox
     --------------------------------------------------------- */
  function initLightbox() {
    var box = $("#lightbox");
    if (!box) return;
    var shots = $$("#gallery .shot");
    if (!shots.length) return;

    var imgEl = $("#lb-img");
    var btnClose = $("#lb-close");
    var btnPrev = $("#lb-prev");
    var btnNext = $("#lb-next");
    var current = -1;
    var lastFocused = null;

    function show(index) {
      var shot = shots[(index + shots.length) % shots.length];
      var img = shot.querySelector("img");
      if (!img) return;
      current = (index + shots.length) % shots.length;
      imgEl.src = img.currentSrc || img.src;
      imgEl.alt = img.alt || "";
      box.setAttribute("aria-hidden", "false");
      document.body.classList.add("lb-open");
    }

    function close() {
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("lb-open");
      current = -1;
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      requestAnimationFrame(function () { btnClose.focus(); });
    }

    shots.forEach(function (shot, i) {
      shot.addEventListener("click", function () { open(i); });
      shot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
          e.preventDefault();
          open(i);
        }
      });
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", function () { show(current - 1); });
    btnNext.addEventListener("click", function () { show(current + 1); });

    box.addEventListener("click", function (e) {
      if (e.target === box) close();
    });

    document.addEventListener("keydown", function (e) {
      if (box.getAttribute("aria-hidden") === "true") return;
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(current - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(current + 1); }
      else if (e.key === "Tab") {
        var focusables = [btnClose, btnPrev, btnNext];
        var idx = focusables.indexOf(document.activeElement);
        e.preventDefault();
        var nextIdx = e.shiftKey ? (idx <= 0 ? focusables.length - 1 : idx - 1) : (idx + 1) % focusables.length;
        focusables[nextIdx].focus();
      }
    });
  }

  /* ---------------------------------------------------------
     5. The cake — eighteen candles
     --------------------------------------------------------- */
  function initCake() {
    var cake = $("#cake");
    if (!cake) return;
    var candles = $$(".candle", cake);
    var status = $("#cake-status");
    var wishCard = $("#wish-card");
    var blowAll = $("#blow-all");
    var relight = $("#relight");
    var hintSep = $("#hint-sep");
    var total = candles.length;
    var blown = 0;

    function setStatus() {
      if (blown >= total) {
        status.textContent = "All eighteen blown out. Wish sent.";
      } else if (blown === 0) {
        status.textContent = total + " candles still lit.";
      } else {
        status.textContent = (total - blown) + (total - blown === 1 ? " candle still lit." : " candles still lit.");
      }
    }

    function extinguish(candle, silent) {
      if (candle.classList.contains("out")) return;
      candle.classList.add("out");
      candle.setAttribute("aria-pressed", "true");
      blown++;

      if (!silent && !reduceMotion) {
        var r = candle.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top, 9, { speed: 2.2, lift: 1.4 });
      }
      setStatus();

      if (blown >= total) {
        wishCard.classList.add("show");
        wishCard.setAttribute("aria-hidden", "false");
        relight.hidden = false;
        if (hintSep) hintSep.hidden = false;
        if (!reduceMotion) {
          setTimeout(function () { confettiCelebrate(false); }, 220);
        }
        toast("Wish made. Happy 18th, Cara 🎂", 4200);
      }
    }

    candles.forEach(function (candle, i) {
      candle.setAttribute("aria-pressed", "false");
      candle.addEventListener("click", function () { extinguish(candle); });
      candle.addEventListener("keydown", function (e) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); extinguish(candle); }
      });
      candle.setAttribute("tabindex", "0");
      candle.dataset.index = i;
    });

    var rowEl = $(".candles", cake);
    if (rowEl) {
      rowEl.addEventListener("click", function (e) {
        if (e.target && e.target.closest && e.target.closest(".candle")) return;
        var lit = candles.filter(function (c) { return !c.classList.contains("out"); });
        if (!lit.length) return;
        var best = null;
        var bestDist = Infinity;
        lit.forEach(function (c) {
          var r = c.getBoundingClientRect();
          var d = Math.abs((r.left + r.right) / 2 - e.clientX);
          if (d < bestDist) { bestDist = d; best = c; }
        });
        if (best) extinguish(best, true);
      });
    }

    if (blowAll) {
      blowAll.addEventListener("click", function () {
        var remaining = candles.filter(function (c) { return !c.classList.contains("out"); });
        remaining.forEach(function (candle, i) {
          setTimeout(function () { extinguish(candle, true); }, reduceMotion ? 0 : i * 60);
        });
      });
    }

    if (relight) {
      relight.addEventListener("click", function () {
        candles.forEach(function (c) {
          c.classList.remove("out");
          c.setAttribute("aria-pressed", "false");
        });
        blown = 0;
        setStatus();
        wishCard.classList.remove("show");
        wishCard.setAttribute("aria-hidden", "true");
        relight.hidden = true;
        if (hintSep) hintSep.hidden = true;
      });
    }

    setStatus();
  }

  /* ---------------------------------------------------------
     6. Live clocks — her time / my time
     --------------------------------------------------------- */
  var MY_TZ = "Australia/Sydney";
  var HER_TZ = "Asia/Manila";

  function initClocks() {
    var nodes = $$("[data-tz]");
    if (!nodes.length) return;

    function safeFormat(tz, opts, fallback) {
      try { return new Intl.DateTimeFormat("en-AU", Object.assign({ timeZone: tz }, opts)).format(new Date()); }
      catch (err) { return fallback; }
    }

    function hourIn(tz) {
      try {
        var parts = new Intl.DateTimeFormat("en-AU", { timeZone: tz, hour: "2-digit", hour12: false }).format(new Date());
        return parseInt(parts, 10) % 24;
      } catch (err) { return 12; }
    }

    function statusFor(h) {
      if (h >= 8 && h < 23) return "probably awake";
      if (h >= 23 || h < 3) return "probably still awake";
      return "probably asleep";
    }

    function tick() {
      nodes.forEach(function (el) {
        var tz = el.getAttribute("data-tz");
        var part = el.getAttribute("data-part");
        if (!part) {
          el.textContent = safeFormat(tz, { hour: "numeric", minute: "2-digit", hour12: true }, "--:--");
        } else if (part === "day") {
          el.textContent = safeFormat(tz, { weekday: "long", day: "numeric", month: "short" }, "—");
        } else if (part === "status") {
          el.textContent = statusFor(hourIn(tz));
        }
      });
    }

    tick();
    setInterval(tick, 10000);
  }

  /* ---------------------------------------------------------
     7. Easter egg — the eighteen
     --------------------------------------------------------- */
  function initEasterEgg() {
    var trigger = $("#easter-eighteen");
    if (!trigger) return;
    var clicks = 0;
    var resetTimer = null;

    function monkeyRain() {
      var count = 24;
      for (var i = 0; i < count; i++) {
        (function (i) {
          var m = document.createElement("span");
          m.className = "monkey";
          m.textContent = Math.random() < 0.82 ? "🐒" : "🙈";
          m.style.left = Math.random() * 96 + "vw";
          m.style.fontSize = 16 + Math.random() * 34 + "px";
          m.style.setProperty("--sway", (Math.random() - 0.5) * 160 + "px");
          m.style.setProperty("--spin", (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 540) + "deg");
          m.style.animationDuration = 2.4 + Math.random() * 2.4 + "s";
          m.style.animationDelay = Math.random() * 0.7 + "s";
          document.body.appendChild(m);
          setTimeout(function () {
            if (m.parentNode) m.parentNode.removeChild(m);
          }, 6000);
        })(i);
      }
      toast("monkey chud mode: activated 🐒", 3200);
      burst(window.innerWidth * 0.5, window.innerHeight * 0.3, 90, { speed: 8 });
    }

    trigger.addEventListener("click", function () {
      clicks++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { clicks = 0; }, 3200);
      if (clicks >= 5) {
        clicks = 0;
        monkeyRain();
      } else if (clicks >= 2) {
        toast((5 - clicks) + " more…", 900);
      }
    });

    trigger.setAttribute("title", "go on, click it a few times");
  }

  /* ---------------------------------------------------------
     9. Midnight gate
     --------------------------------------------------------- */
  var UNLOCK_AT = window.CARA_UNLOCK_AT || "";
  var GATE_PEEK = !!window.CARA_GATE_PEEK;
  /* Password that opens the site before midnight. Change this to whatever
     you want to give her. Case and surrounding spaces are ignored. */
  var GATE_PASSWORD = "cara18";
  var GATE_STORE = "cara18.gate.open";
  var GATE_TZ = "Asia/Manila";

  function gateRemembered() {
    try { return window.localStorage.getItem(GATE_STORE) === "1"; } catch (err) { return false; }
  }

  function gateRemember() {
    try { window.localStorage.setItem(GATE_STORE, "1"); } catch (err) { /* private mode, fine */ }
  }

  function initGate() {
    var gate = $("#gate");
    var unlockAt = new Date(UNLOCK_AT);
    var valid = UNLOCK_AT && !isNaN(unlockAt.getTime());
    var alreadyOpen = !valid || GATE_PEEK || gateRemembered() || Date.now() >= unlockAt.getTime();

    function mainEls() { return $$("main, footer, .topbar"); }

    if (!gate || alreadyOpen) {
      document.documentElement.setAttribute("data-gate", "open");
      if (gate && gate.parentNode) gate.parentNode.removeChild(gate);
      if (!reduceMotion) setTimeout(function () { confettiCelebrate(true); }, 800);
      return false;
    }

    document.documentElement.setAttribute("data-gate", "locked");
    gate.setAttribute("aria-hidden", "false");
    var gateInner = $(".gate-inner", gate);
    if (gateInner) setTimeout(function () { gateInner.focus({ preventScroll: true }); }, 60);
    mainEls().forEach(function (el) {
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
    });

    var daysUnit = $("#gate-days-unit");
    var daysSep = $("#gate-days-sep");
    var dayEl = $("#gate-days");
    var dayLabel = $("#gate-days-label");
    var hourEl = $("#gate-hours");
    var minEl = $("#gate-minutes");
    var secEl = $("#gate-seconds");
    var whenEl = $("#gate-when");

    if (whenEl) {
      try {
        whenEl.textContent = new Intl.DateTimeFormat("en-AU", {
          timeZone: GATE_TZ,
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).format(unlockAt);
      } catch (err) { whenEl.textContent = "Midnight, Manila time"; }
    }

    function pad(n) { return (n < 10 ? "0" : "") + n; }

    var timer = null;

    function unlock() {
      if (timer) clearInterval(timer);
      document.documentElement.setAttribute("data-gate", "open");
      gate.setAttribute("aria-hidden", "true");
      mainEls().forEach(function (el) {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      });
      window.scrollTo(0, 0);
      setTimeout(function () {
        if (gate.parentNode) gate.parentNode.removeChild(gate);
      }, 900);
      if (!reduceMotion) setTimeout(function () { confettiCelebrate(true); }, 300);
      toast("Happy 18th, Cara 🎂", 4200);
    }

    function tick() {
      var left = unlockAt.getTime() - Date.now();
      if (left <= 0) { unlock(); return; }
      var total = Math.floor(left / 1000);
      var d = Math.floor(total / 86400);
      var h = Math.floor((total % 86400) / 3600);
      var m = Math.floor((total % 3600) / 60);
      var s = total % 60;

      if (daysUnit) {
        daysUnit.hidden = d < 1;
        if (daysSep) daysSep.hidden = d < 1;
        if (dayLabel) dayLabel.textContent = d === 1 ? "day" : "days";
        if (dayEl) dayEl.textContent = pad(d);
      }
      if (hourEl) hourEl.textContent = pad(h);
      if (minEl) minEl.textContent = pad(m);
      if (secEl) secEl.textContent = pad(s);
    }

    /* password bypass */
    var form = $("#gate-pass");
    var input = $("#gate-pass-input");
    var msg = $("#gate-pass-msg");
    if (form && input) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var given = (input.value || "").trim().toLowerCase();
        if (given && given === GATE_PASSWORD.toLowerCase()) {
          if (msg) msg.textContent = "";
          gateRemember();
          unlock();
        } else {
          form.classList.add("is-wrong");
          if (msg) msg.textContent = given ? "Not that one. Try again." : "Type the password first.";
          input.select();
          setTimeout(function () { form.classList.remove("is-wrong"); }, 400);
        }
      });
    }

    tick();
    timer = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return true;
  }
  /* ---------------------------------------------------------
     Boot
     --------------------------------------------------------- */
  function boot() {
    initReveal();
    initConfetti();
    initGate();
    initLightbox();
    initCake();
    initClocks();
    initEasterEgg();

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });

    // TZ config exposed for easy editing
    window.__caraSite = { myTimeZone: MY_TZ, herTimeZone: HER_TZ };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
