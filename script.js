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
    var angle = opts.angle !== undefined ? opts.angle : Math.random() * Math.PI * 2;
    var speed = opts.speed !== undefined ? opts.speed : 3 + Math.random() * 7;
    var isRound = Math.random() < 0.22;
    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (opts.lift || 0),
      w: isRound ? 4 + Math.random() * 3 : 5 + Math.random() * 7,
      h: isRound ? 0 : 7 + Math.random() * 9,
      round: isRound,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.28,
      color: PALETTE[(Math.random() * PALETTE.length) | 0],
      life: 0,
      maxLife: 130 + Math.random() * 120,
      drag: 0.988,
      grav: 0.13 + Math.random() * 0.08
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
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life++;

      if (p.life > p.maxLife || p.y > window.innerHeight + 60) {
        particles.splice(i, 1);
        continue;
      }

      var fade = p.life > p.maxLife - 40 ? Math.max(0, (p.maxLife - p.life) / 40) : 1;
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
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, Math.abs(p.h * Math.cos(p.rot * 0.6)) + 2);
      }
      ctx.restore();
    }

    if (particles.length) {
      rafId = requestAnimationFrame(tick);
    } else if (ctx) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }

  function initConfetti() {
    if (!canvas) return;
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas, { passive: true });

    if (!reduceMotion) {
      setTimeout(function () {
        burst(window.innerWidth * 0.5, window.innerHeight * 0.34, 120, { speed: 8, lift: 1 });
      }, 850);
    }
  }

  /* ---------------------------------------------------------
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
          setTimeout(function () {
            burst(window.innerWidth * 0.5, window.innerHeight * 0.55, 150, { speed: 9, lift: 1 });
          }, 220);
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
     Boot
     --------------------------------------------------------- */
  function boot() {
    initReveal();
    initConfetti();
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
