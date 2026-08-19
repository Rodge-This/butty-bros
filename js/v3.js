/* BUTTY BROS — V3 shared behaviour */
(function(){
  'use strict';
  const rm = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav: solid after scroll, hide on scroll down */
  const nav = document.getElementById('nav');
  if(nav){
    let lastY = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      nav.classList.toggle('solid', y > 40);
      nav.classList.toggle('hide', y > 500 && y > lastY && !document.body.classList.contains('menu-open'));
      lastY = y;
    }, {passive:true});
  }

  /* mobile quote bar: only after the hero */
  const qbar = document.querySelector('.qbar');
  if(qbar){
    const syncBar = () => qbar.classList.toggle('show', scrollY > innerHeight * 0.6);
    addEventListener('scroll', syncBar, {passive:true});
    syncBar();
  }

  /* mobile overlay menu */
  const burger = document.getElementById('burger');
  const mmenu = document.getElementById('mmenu');
  if(burger && mmenu){
    const toggle = (open) => {
      mmenu.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
      burger.innerHTML = open
        ? '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke-linecap="round"/></svg>'
        : '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" stroke-linecap="round"/></svg>';
    };
    burger.addEventListener('click', () => toggle(!mmenu.classList.contains('open')));
    mmenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
    addEventListener('keydown', e => { if(e.key === 'Escape') toggle(false); });
  }

  /* the fold: covered cards ease back */
  /* Any card taller than the space it sticks in can't work in the stack —
     the next card slides over the bottom of it before you can read it.
     Detect that and let those cards scroll normally instead. */
  const autoFlow = () => {
    const top = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--card-top')) || 80;
    document.querySelectorAll('.deck .card').forEach(c => {
      if (c.dataset.flowLocked === '1') return;      // hand-set .card--flow stays put
      const fits = c.scrollHeight <= (innerHeight - top) + 4;
      c.classList.toggle('card--flow', !fits);
    });
  };
  document.querySelectorAll('.deck .card--flow').forEach(c => c.dataset.flowLocked = '1');
  autoFlow();
  addEventListener('resize', autoFlow, {passive:true});

  const cards = [...document.querySelectorAll('.deck .card:not(.card--flow)')];
  if(cards.length > 1 && !rm){
    let ticking = false;
    const update = () => {
      cards.forEach((c,i) => {
        if(i === cards.length-1) return;
        if(c.classList.contains('card--flow')){ c.style.transform=''; c.style.filter=''; return; }
        const next = cards[i+1].getBoundingClientRect();
        const cover = Math.min(Math.max((innerHeight - next.top) / innerHeight, 0), 1);
        c.style.transform = `scale(${1 - cover*0.05}) translateY(${cover*-8}px)`;
        c.style.filter = `brightness(${1 - cover*0.16})`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if(!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
    addEventListener('resize', () => {
      autoFlow();
      cards.forEach(c => { if (c.classList.contains('card--flow')) { c.style.transform = ''; c.style.filter = ''; } });
      update();
    }, {passive:true});
    update();
  }

  /* docket print-in */
  const docket = document.getElementById('docket');
  if(docket){
    new IntersectionObserver((es,obs) => es.forEach(e => {
      if(e.isIntersecting){ docket.classList.add('printed'); obs.disconnect(); }
    }), {threshold:.35}).observe(docket);
  }

  /* live open badge (Europe/London) — Mon–Fri 08:00–14:30 · Sat–Sun 08:30–13:00 */
  const badge = document.getElementById('open-badge');
  if(badge){
    try{
      const now = new Date(new Date().toLocaleString('en-GB',{timeZone:'Europe/London'}));
      const d = now.getDay(), mins = now.getHours()*60 + now.getMinutes();
      const weekend = (d === 0 || d === 6);
      const open = weekend ? (mins >= 510 && mins < 780) : (mins >= 480 && mins < 870);
      badge.textContent = open ? 'Open now · Gynn Square, Blackpool' : 'Gynn Square, Blackpool · Open 7 days';
    }catch(e){}
  }

  /* chip nav: highlight current category */
  const chips = [...document.querySelectorAll('.chipnav a')];
  if(chips.length){
    const targets = chips.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const cio = new IntersectionObserver(es => {
      es.forEach(e => {
        if(e.isIntersecting){
          chips.forEach(c => c.classList.toggle('on', c.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, {rootMargin:'-20% 0px -70% 0px'});
    targets.forEach(t => cio.observe(t));
  }

  /* enquiry form — preview mode unless data-endpoint present */
  const form = document.querySelector('form[data-enquiry]');
  if(form){
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = form.querySelector('.form-msg');
      const endpoint = form.dataset.endpoint;
      if(!endpoint){
        msg.textContent = "Thanks — this is preview mode, so nothing was sent. Once we're live, this lands straight in the Butty Bros inbox. For now, call 07752 743158.";
        msg.classList.add('show');
        return;
      }
      /* basic client-side check so we fail fast and friendly */
      const name = form.querySelector('[name="name"]');
      const phone = form.querySelector('[name="phone"]');
      const email = form.querySelector('[name="email"]');
      if(!name.value.trim() || (!phone.value.trim() && !email.value.trim())){
        msg.textContent = "We just need your name and either a phone number or an email.";
        msg.classList.add('show');
        (name.value.trim() ? phone : name).focus();
        return;
      }

      const btn = form.querySelector('button[type="submit"]');
      const btnHTML = btn ? btn.innerHTML : '';
      if(btn){ btn.disabled = true; btn.innerHTML = 'Sending…'; }
      msg.classList.remove('show');

      try{
        const res = await fetch(endpoint, {method:'POST', body:new FormData(form), headers:{'Accept':'application/json'}});
        let data = {};
        try{ data = await res.json(); }catch(e){}
        if(res.ok && data.ok !== false){
          const thanks = document.getElementById('thanks');
          if(thanks){
            form.hidden = true;
            const aside = document.querySelector('.enq__aside');
            if(aside) aside.hidden = true;
            thanks.hidden = false;
            const sec = document.querySelector('.enq');
            if(sec) sec.style.gridTemplateColumns = '1fr';
            thanks.scrollIntoView({behavior:'smooth', block:'center'});
            history.replaceState(null,'','?sent=1');
            return;
          }
          msg.textContent = "Sent — we'll be back to you shortly, usually the same day.";
          form.reset();
        }else{
          msg.textContent = data.error || "That didn't send. Give us a ring instead on 07752 743158.";
        }
      }catch(err){
        msg.textContent = "That didn't send. Give us a ring instead on 07752 743158.";
      }
      if(btn){ btn.disabled = false; btn.innerHTML = btnHTML; }
      msg.classList.add('show');
    });
  }



  /* ---- enquiry: optional menu builder, tray steppers, thank-you panel ---- */
  const pkg = document.getElementById('pkg');
  const buildSel = document.getElementById('f-build');
  if(pkg && buildSel){
    const syncPkg = () => {
      const on = buildSel.value === 'yes';
      pkg.hidden = !on;
      if(on) pkg.querySelector('.qty__in')?.focus({preventScroll:true});
    };
    buildSel.addEventListener('change', syncPkg);
    syncPkg();
  }

  /* tray steppers — one tray feeds 9 */
  const trayTotal = document.getElementById('traytotal');
  const trayInputs = [...document.querySelectorAll('.qty__in')];
  if(trayInputs.length){
    const SERVES = 9;
    const headEl = document.getElementById('f-count');
    const clampVal = (el) => {
      let n = parseInt(el.value, 10);
      if(isNaN(n) || n < 0) n = 0;
      const max = parseInt(el.max, 10) || 40;
      if(n > max) n = max;
      el.value = n;
      el.closest('.qrow')?.classList.toggle('on', n > 0);
      return n;
    };
    const paintTrays = () => {
      const total = trayInputs.reduce((a, el) => a + clampVal(el), 0);
      if(!trayTotal) return;
      if(!total){ trayTotal.textContent = ''; return; }
      const feeds = total * SERVES;
      let msg = total + (total === 1 ? ' tray' : ' trays') + ' · feeds ' + feeds;
      const heads = parseInt(headEl && headEl.value, 10);
      if(heads > 0){
        if(feeds < heads) msg += ' · ' + (heads - feeds) + ' short of your ' + heads;
        else if(feeds >= heads) msg += ' · covers your ' + heads;
      }
      trayTotal.textContent = msg;
    };
    trayInputs.forEach(el => {
      el.addEventListener('input', paintTrays);
      el.addEventListener('change', paintTrays);
    });
    document.querySelectorAll('.qty__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const el = btn.parentElement.querySelector('.qty__in');
        el.value = (parseInt(el.value,10) || 0) + Number(btn.dataset.step);
        paintTrays();
      });
    });
    if(headEl) headEl.addEventListener('input', paintTrays);
    paintTrays();
  }

  /* enquiry form: show the day of the week as soon as a date is picked */
  const dateEl = document.getElementById('f-date');
  const dayOut = document.getElementById('f-dayout');
  if(dateEl && dayOut){
    const paint = () => {
      const v = dateEl.value;
      if(!v){ dayOut.textContent = ''; return; }
      const d = new Date(v + 'T12:00:00');
      if(isNaN(d)){ dayOut.textContent = ''; return; }
      const nice = d.toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
      const today = new Date(); today.setHours(0,0,0,0);
      const days = Math.round((new Date(v+'T12:00:00').setHours(0,0,0,0) - today) / 86400000);
      let when = '';
      if(days === 0) when = ' · today';
      else if(days === 1) when = ' · tomorrow';
      else if(days > 1 && days < 14) when = ' · in ' + days + ' days';
      else if(days < 0) when = ' · that date has passed';
      dayOut.textContent = nice + when;
    };
    dateEl.addEventListener('change', paint);
    dateEl.addEventListener('input', paint);
    paint();
  }

  const yr = document.getElementById('yr');
  if(yr) yr.textContent = new Date().getFullYear();
})();
