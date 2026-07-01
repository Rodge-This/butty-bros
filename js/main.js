/* ==========================================================================
   BUTTY BROS — Site JS
   No dependencies. Progressive enhancement only.
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Mobile nav toggle ---- */
  var toggle = document.querySelector(".nav__toggle");
  var links = document.querySelector(".nav__links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    // close menu when a link is tapped
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Live opening-hours indicator ----
     Hours (Europe/London). Sunday closed.
     Mon–Fri 07:30–14:30, Sat 08:30–13:00 */
  var HOURS = {
    0: null,                 // Sun
    1: [7.5, 14.5],          // Mon
    2: [7.5, 14.5],
    3: [7.5, 14.5],
    4: [7.5, 14.5],
    5: [7.5, 14.5],
    6: [8.5, 13.0]           // Sat
  };
  function londonNow() {
    // Approximate local time in Europe/London using Intl
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false
      }).formatToParts(new Date());
      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var days = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
      return { day: days[map.weekday], h: parseInt(map.hour,10) + parseInt(map.minute,10)/60 };
    } catch (err) {
      var d = new Date();
      return { day: d.getDay(), h: d.getHours() + d.getMinutes()/60 };
    }
  }
  var badge = document.querySelector("[data-open-badge]");
  if (badge) {
    var now = londonNow();
    var today = HOURS[now.day];
    var isOpen = today && now.h >= today[0] && now.h < today[1];
    var dot = badge.querySelector("[data-open-dot]");
    var txt = badge.querySelector("[data-open-text]");
    if (txt) txt.textContent = isOpen ? "Open now" : "Closed now";
    if (dot) dot.style.background = isOpen ? "#5F9E5F" : "#C4432B";
    badge.setAttribute("data-state", isOpen ? "open" : "closed");
  }
  // highlight today's row in any hours table
  var todayRow = document.querySelector('.hours [data-day="' + londonNow().day + '"]');
  if (todayRow) todayRow.classList.add("today");

  /* ---- Enquiry form handling ----
     Front-end validation + graceful submission.
     When a real endpoint is set on the form via data-endpoint, it POSTs there.
     Otherwise it shows the "not yet connected" success-preview state so the
     shell is testable without a backend. */
  document.querySelectorAll("form[data-enquiry]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      // native validity first
      if (!form.checkValidity()) { form.reportValidity(); return; }

      var endpoint = form.getAttribute("data-endpoint");
      var btn = form.querySelector('button[type="submit"]');
      var original = btn ? btn.innerHTML : "";

      function show(kind, msg) {
        if (!status) return;
        status.className = "form-status form-status--" + kind;
        status.textContent = msg;
        status.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }

      if (!endpoint) {
        // Shell mode — no backend wired yet.
        show("ok", "Thanks — your enquiry looks good. (Heads up: the form isn't connected to email yet, so this is a preview. Once it's live, this will land straight in the Butty Bros inbox.)");
        form.reset();
        return;
      }

      if (btn) { btn.disabled = true; btn.innerHTML = "Sending…"; }
      fetch(endpoint, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      }).then(function (r) {
        if (r.ok) {
          show("ok", "Thanks — your enquiry's in. We'll get back to you within one working day.");
          form.reset();
        } else {
          show("err", "Something went wrong sending that. Please call 07548 175156 or email hello@buttybros.co.uk instead.");
        }
      }).catch(function () {
        show("err", "Couldn't send — check your connection, or call 07548 175156 and we'll sort it.");
      }).finally(function () {
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
      });
    });
  });

  /* ---- Footer year ---- */
  var yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

})();
