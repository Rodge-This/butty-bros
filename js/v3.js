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
  const cards = [...document.querySelectorAll('.deck .card')];
  if(cards.length > 1 && !rm){
    let ticking = false;
    const update = () => {
      cards.forEach((c,i) => {
        if(i === cards.length-1) return;
        const next = cards[i+1].getBoundingClientRect();
        const cover = Math.min(Math.max((innerHeight - next.top) / innerHeight, 0), 1);
        c.style.transform = `scale(${1 - cover*0.05}) translateY(${cover*-8}px)`;
        c.style.filter = `brightness(${1 - cover*0.16})`;
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if(!ticking){ requestAnimationFrame(update); ticking = true; } }, {passive:true});
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
      try{
        const res = await fetch(endpoint, {method:'POST', body:new FormData(form), headers:{'Accept':'application/json'}});
        msg.textContent = res.ok
          ? "Sent — we'll be back to you shortly, usually the same day."
          : "That didn't send. Give us a ring instead on 07752 743158.";
        if(res.ok) form.reset();
      }catch(err){
        msg.textContent = "That didn't send. Give us a ring instead on 07752 743158.";
      }
      msg.classList.add('show');
    });
  }

  const yr = document.getElementById('yr');
  if(yr) yr.textContent = new Date().getFullYear();
})();
