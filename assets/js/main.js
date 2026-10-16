/* Seltra — interactions */
(function () {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  $('#year').textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     Intro unveil → hero choreography
  ------------------------------------------------------------------ */
  function startHero() { root.classList.add('is-ready'); }

  if (reduceMotion || root.classList.contains('intro-seen')) {
    root.classList.add('intro-done');
    startHero();
  } else {
    const begin = () => {
      setTimeout(() => {
        root.classList.add('is-revealed');
        setTimeout(startHero, 350);
        setTimeout(() => root.classList.add('intro-done'), 1500);
        try { sessionStorage.setItem('seltra-intro-seen', '1'); } catch (e) {}
      }, 1500);
    };
    // wait for fonts + hero image (with a safety cap) so the reveal is clean
    const heroImg = $('.arch img');
    const ready = Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      heroImg && !heroImg.complete ? new Promise(r => { heroImg.onload = heroImg.onerror = r; }) : Promise.resolve()
    ]);
    Promise.race([ready, new Promise(r => setTimeout(r, 2200))]).then(begin);
  }

  /* ------------------------------------------------------------------
     Header: compact on scroll, progress bar, active section
  ------------------------------------------------------------------ */
  const header = $('#siteHeader');
  const progress = $('.scroll-progress span');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-compact', y > 60);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  const navLinks = $$('.main-nav a');
  const indicator = $('.nav-indicator');
  const navEl = $('.main-nav');

  function moveIndicator(link) {
    if (!link || !navEl.offsetParent) return;
    const navBox = navEl.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    indicator.style.width = box.width + 'px';
    indicator.style.transform = `translateX(${box.left - navBox.left}px)`;
  }
  function setActive(id) {
    navLinks.forEach(a => {
      const on = a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) { a.setAttribute('aria-current', 'true'); moveIndicator(a); }
      else a.removeAttribute('aria-current');
    });
  }

  const sectionIds = ['home', 'collections', 'story', 'gallery', 'notify', 'faqs', 'contact'];
  const navFor = { notify: 'gallery' }; // the signup sits between Gallery and FAQs
  const spy = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) setActive(navFor[e.target.id] || e.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sectionIds.forEach(id => { const el = document.getElementById(id); if (el) spy.observe(el); });

  window.addEventListener('resize', () => moveIndicator($('.main-nav a.is-active')));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => moveIndicator($('.main-nav a.is-active')));

  /* ------------------------------------------------------------------
     Overlays: menu, bag, search, lightbox
  ------------------------------------------------------------------ */
  const scrim = $('#scrim');
  let openPanel = null;
  let lastFocus = null;

  function open(panel, trigger) {
    if (openPanel) close(true);
    lastFocus = trigger || document.activeElement;
    openPanel = panel;
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
    if (panel.id !== 'lightbox') {
      scrim.hidden = false;
      requestAnimationFrame(() => scrim.classList.add('is-visible'));
    }
    body.classList.add('is-locked');
    const focusTarget = panel.querySelector('input, a, button:not([data-close])') || panel.querySelector('button');
    setTimeout(() => focusTarget && focusTarget.focus({ preventScroll: true }), 80);
  }

  function close(silent) {
    if (!openPanel) return;
    const panel = openPanel;
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    $$('[aria-controls="' + panel.id + '"]').forEach(b => b.setAttribute('aria-expanded', 'false'));
    scrim.classList.remove('is-visible');
    setTimeout(() => { if (!openPanel) scrim.hidden = true; }, 400);
    body.classList.remove('is-locked');
    openPanel = null;
    if (!silent && lastFocus) lastFocus.focus({ preventScroll: true });
  }

  $('#menuBtn').addEventListener('click', e => open($('#menuDrawer'), e.currentTarget));
  $('#bagBtn').addEventListener('click', e => open($('#bagDrawer'), e.currentTarget));
  $('#searchBtn').addEventListener('click', e => open($('#searchPanel'), e.currentTarget));
  scrim.addEventListener('click', () => close());
  $$('[data-close]').forEach(b => b.addEventListener('click', () => close()));

  // links inside panels close the panel, then scroll
  $$('.drawer a[href^="#"], .search-panel a[href^="#"]').forEach(a => {
    a.addEventListener('click', () => close(true));
  });

  document.addEventListener('keydown', e => {
    if (!openPanel) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      // keep focus inside the open panel
      const f = $$('a[href], button:not([disabled]), input', openPanel).filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (openPanel && openPanel.id === 'lightbox') {
      if (e.key === 'ArrowRight') showImage(current + 1);
      if (e.key === 'ArrowLeft') showImage(current - 1);
    }
  });

  /* Search */
  const searchInput = $('#searchInput');
  const searchMsg = $('#searchMsg');
  const categories = ['Necklaces', 'Earrings', 'Rings', 'Bracelets', 'Ringlets', 'Anklets', 'Mangalsutra Bracelets', 'Mangalsutra Chains', 'Waist Chains', 'Sets', 'Cuff Bracelets'];
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase();
    if (!q) { searchMsg.textContent = ''; return; }
    const match = categories.find(c => c.toLowerCase().startsWith(q)) || categories.find(c => c.toLowerCase().includes(q)) || (/(mangal|black bead)/.test(q) ? 'Mangalsutra Chains' : /(cuff|bangle|kada)/.test(q) ? 'Cuff Bracelets' : /(waist|kamar|belly)/.test(q) ? 'Waist Chains' : /(hand chain|haath|ringlet)/.test(q) ? 'Ringlets' : /(set|combo)/.test(q) ? 'Sets' : /(ear|stud|climber)/.test(q) ? 'Earrings' : /(ankle|payal)/.test(q) ? 'Anklets' : undefined);
    searchMsg.innerHTML = match
      ? `${match} arrive at launch. <a href="#notify">Join the list</a> to see them first.`
      : `The full shop opens soon. <a href="#notify">Get notified</a> when it does.`;
    $$('a', searchMsg).forEach(a => a.addEventListener('click', () => close(true)));
  });

  /* Lightbox */
  const galleryButtons = $$('.gal-item');
  const lbImg = $('#lbImg');
  const lbCap = $('#lbCap');
  let current = 0;

  function showImage(i) {
    current = (i + galleryButtons.length) % galleryButtons.length;
    const img = galleryButtons[current].querySelector('img');
    lbImg.style.opacity = '0';
    setTimeout(() => {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lbImg.style.opacity = '1';
    }, 150);
  }
  galleryButtons.forEach((btn, i) => btn.addEventListener('click', () => {
    showImage(i);
    open($('#lightbox'), btn);
  }));
  $('.lb-prev').addEventListener('click', () => showImage(current - 1));
  $('.lb-next').addEventListener('click', () => showImage(current + 1));
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') close(); });

  // swipe on touch
  let touchX = null;
  $('#lightbox').addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  $('#lightbox').addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) showImage(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ------------------------------------------------------------------
     Toast
  ------------------------------------------------------------------ */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  $$('.col-card').forEach(card => card.addEventListener('click', () => {
    showToast(`${card.dataset.collection} arrive at launch — join the list below.`);
    setTimeout(() => $('#email').focus({ preventScroll: true }), 900);
  }));

  /* ------------------------------------------------------------------
     Hero parallax + collection card tilt (desktop pointers only)
  ------------------------------------------------------------------ */
  if (finePointer && !reduceMotion) {
    const heroVisual = $('#heroVisual');
    const heroImg = $('#heroSlides');
    heroVisual.addEventListener('pointermove', e => {
      const r = heroVisual.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - .5;
      const ny = (e.clientY - r.top) / r.height - .5;
      heroImg.style.setProperty('--px', (-nx * 18) + 'px');
      heroImg.style.setProperty('--py', (-ny * 18) + 'px');
    });
    heroVisual.addEventListener('pointerleave', () => {
      heroImg.style.setProperty('--px', '0px');
      heroImg.style.setProperty('--py', '0px');
    });

    $$('.col-card').forEach(card => {
      const media = $('.col-media', card);
      card.addEventListener('pointermove', e => {
        const r = media.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width;
        const ny = (e.clientY - r.top) / r.height;
        media.style.setProperty('--ry', ((nx - .5) * 10) + 'deg');
        media.style.setProperty('--rx', ((.5 - ny) * 8) + 'deg');
        media.style.setProperty('--mx', (nx * 100) + '%');
        media.style.setProperty('--my', (ny * 100) + '%');
      });
      card.addEventListener('pointerleave', () => {
        media.style.setProperty('--rx', '0deg');
        media.style.setProperty('--ry', '0deg');
      });
    });
  }

  /* ------------------------------------------------------------------
     Highlight icons draw themselves the first time they're seen
  ------------------------------------------------------------------ */
  $$('.draw path').forEach(p => {
    try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) {}
  });
  const drawObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-drawn'); drawObs.unobserve(e.target); }
    });
  }, { threshold: .6 });
  $$('.draw').forEach((svg, i) => { svg.style.transitionDelay = (i * .15) + 's'; drawObs.observe(svg); });

  /* ------------------------------------------------------------------
     FAQ accordion
  ------------------------------------------------------------------ */
  $$('.faq button').forEach(btn => {
    btn.addEventListener('click', () => {
      const faq = btn.closest('.faq');
      const isOpen = faq.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
  });

  /* ------------------------------------------------------------------
     Sparkles in the coming-soon section
  ------------------------------------------------------------------ */
  const canvas = $('#sparkles');
  const ctx = canvas.getContext('2d');
  const section = $('#notify');
  const colors = ['#FFFFFF', '#E7C391', '#FF9EC0', '#FFC29E', '#C9AEFF', '#9FE6E0'];
  let particles = [];
  let dpr = 1, W = 0, H = 0, running = false, rafId = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = section.clientWidth * dpr;
    H = canvas.height = section.clientHeight * dpr;
  }
  function particle(x, y, burst) {
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      r: (burst ? 2 + Math.random() * 3.5 : 1.2 + Math.random() * 2.8) * dpr,
      vx: (Math.random() - .5) * (burst ? 2.2 : .2) * dpr,
      vy: (burst ? (Math.random() - .75) * 2.2 : -.12 - Math.random() * .3) * dpr,
      life: 0,
      max: burst ? 50 + Math.random() * 40 : 280 + Math.random() * 360,
      c: colors[(Math.random() * colors.length) | 0],
      s: Math.random() * Math.PI,
      burst
    };
  }
  function star(p, a) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.s);
    ctx.globalAlpha = a;
    ctx.fillStyle = p.c;
    ctx.shadowColor = p.c;
    ctx.shadowBlur = 10 * dpr;
    const r = p.r;
    ctx.beginPath();
    ctx.moveTo(0, -r * 2);
    ctx.quadraticCurveTo(r * .25, -r * .25, r * 2, 0);
    ctx.quadraticCurveTo(r * .25, r * .25, 0, r * 2);
    ctx.quadraticCurveTo(-r * .25, r * .25, -r * 2, 0);
    ctx.quadraticCurveTo(-r * .25, -r * .25, 0, -r * 2);
    ctx.fill();
    ctx.restore();
  }
  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.s += .01;
      const t = p.life / p.max;
      if (p.life >= p.max) {
        particles.splice(i, 1);
        if (!p.burst) particles.push(particle(undefined, H + 10));
        continue;
      }
      const a = p.burst ? 1 - t : Math.sin(t * Math.PI) * (.55 + .45 * Math.sin(p.life * .08));
      star(p, Math.max(a, 0));
    }
    rafId = running ? requestAnimationFrame(frame) : null;
  }

  if (!reduceMotion) {
    resize();
    const count = window.innerWidth < 700 ? 26 : 50;
    for (let i = 0; i < count; i++) { const p = particle(); p.life = Math.random() * p.max; particles.push(p); }
    window.addEventListener('resize', resize);

    // only animate while the section is on screen
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running && !rafId) frame();
    }).observe(section);

    section.addEventListener('pointermove', e => {
      if (particles.length > 160 || Math.random() > .35) return;
      const r = section.getBoundingClientRect();
      particles.push(particle((e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr, true));
    });
  }

  function burstAt(el, n) {
    if (reduceMotion) return;
    const r = el.getBoundingClientRect();
    const s = section.getBoundingClientRect();
    for (let i = 0; i < n; i++) {
      particles.push(particle(
        (r.left - s.left + Math.random() * r.width) * dpr,
        (r.top - s.top + r.height / 2) * dpr,
        true
      ));
    }
  }

  /* ------------------------------------------------------------------
     Email signup
     When an email service is connected, put its URL in the form's
     action attribute and this will POST to it.
  ------------------------------------------------------------------ */
  const form = $('#signupForm');
  const input = $('#email');
  const note = $('#signupNote');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const value = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      note.textContent = 'Enter a valid email address, like name@example.com.';
      note.className = 'signup-note is-err';
      input.focus();
      return;
    }

    const action = form.getAttribute('action');
    if (action) {
      try {
        await fetch(action, { method: 'POST', body: new FormData(form), mode: 'no-cors' });
      } catch (err) {
        note.textContent = 'Something went wrong. Check your connection and try again.';
        note.className = 'signup-note is-err';
        return;
      }
    }

    note.textContent = "You're on the list. We'll email you the moment Seltra launches.";
    note.className = 'signup-note is-ok';
    form.reset();
    burstAt(form, 40);
  });
})();

/* ------------------------------------------------------------------
   Collections: auto-rolling carousel on phones
   Advances every few seconds, pauses while the visitor touches it,
   and only runs while the section is on screen.
------------------------------------------------------------------ */
(function () {
  'use strict';
  const grid = document.getElementById('colGrid');
  if (!grid) return;
  const cards = Array.from(grid.querySelectorAll('.col-card'));
  const mobile = window.matchMedia('(max-width: 640px)');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DELAY = 1300;      // time on each card
  const RESUME = 4000;     // wait after the visitor touches it

  // dots under the carousel
  const dots = document.createElement('div');
  dots.className = 'col-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Choose a collection');
  cards.forEach((card, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', card.dataset.collection || 'Collection ' + (i + 1));
    b.addEventListener('click', () => { goTo(i); pause(); });
    dots.appendChild(b);
  });
  grid.after(dots);

  let index = 0, timer = null, resumeTimer = null, visible = false;

  function current() {
    const center = grid.scrollLeft + grid.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((c, i) => {
      const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }
  function paintDots(i) {
    Array.from(dots.children).forEach((d, j) => d.setAttribute('aria-selected', String(i === j)));
  }
  function goTo(i) {
    index = (i + cards.length) % cards.length;
    const c = cards[index];
    grid.scrollTo({ left: c.offsetLeft - (grid.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' });
    paintDots(index);
  }
  function play() {
    stop();
    if (!mobile.matches || reduceMotion || !visible) return;
    timer = setInterval(() => goTo(current() + 1), DELAY);
  }
  function stop() { clearInterval(timer); timer = null; }
  function pause() {
    stop();
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(play, RESUME);
  }

  grid.addEventListener('touchstart', pause, { passive: true });
  grid.addEventListener('pointerdown', pause);
  grid.addEventListener('scroll', () => {
    clearTimeout(grid._t);
    grid._t = setTimeout(() => paintDots(current()), 80);
  }, { passive: true });

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    visible ? play() : stop();
  }, { threshold: 0.4 }).observe(grid);

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : play());
  mobile.addEventListener('change', play);
  paintDots(0);
})();


/* ------------------------------------------------------------------
   Always open at the top of the page, and keep #links out of the URL
   (so a refresh or reopen never jumps to an old position)
------------------------------------------------------------------ */
(function () {
  'use strict';
  const toTop = () => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  };
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  toTop();
  window.addEventListener('load', toTop);
  window.addEventListener('pageshow', e => { if (e.persisted) toTop(); });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  });
})();

/* ------------------------------------------------------------------
   Hero slideshow: crossfades through featured pieces
------------------------------------------------------------------ */
(function () {
  'use strict';
  const slides = Array.from(document.querySelectorAll('#heroSlides .arch-slide'));
  const dotsEl = document.getElementById('slideDots');
  const nameEl = document.getElementById('floatName');
  const catEl = document.getElementById('floatCat');
  const card = document.getElementById('floatCard');
  if (slides.length < 2 || !dotsEl) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DURATION = 4500;
  let i = 0, timer = null;

  slides.forEach((s, n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show ' + s.dataset.name);
    b.addEventListener('click', () => { show(n); restart(); });
    dotsEl.appendChild(b);
  });

  function show(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    Array.from(dotsEl.children).forEach((d, k) => d.setAttribute('aria-current', String(k === i)));
    if (card) {
      card.classList.remove('is-swap');
      void card.offsetWidth;
      card.classList.add('is-swap');
    }
    if (nameEl) nameEl.textContent = slides[i].dataset.name;
    if (catEl) catEl.textContent = slides[i].dataset.cat + ' · Launching soon';
  }
  function restart() {
    clearInterval(timer);
    if (!reduce) timer = setInterval(() => show(i + 1), DURATION);
  }
  // load the remaining slides once the page has settled
  window.addEventListener('load', () => slides.forEach(s => { s.loading = 'eager'; }));
  document.addEventListener('visibilitychange', () => document.hidden ? clearInterval(timer) : restart());
  show(0);
  // begin rotating once the opening reveal has finished
  const introRunning = !document.documentElement.classList.contains('intro-done');
  setTimeout(restart, introRunning ? 3200 : 0);
})();
