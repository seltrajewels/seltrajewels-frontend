/* Seltra — page-wide sparkles, cursor trail and tap bursts */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('pageSparkles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const colors = ['#FFFFFF', '#F0679A', '#FF9478', '#EBAA4A', '#6FD8CC', '#9B7CF4', '#FFD27A'];
  let W = 0, H = 0, dpr = 1, parts = [], raf = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * dpr;
    H = canvas.height = innerHeight * dpr;
  }
  function make(x, y, burst) {
    return {
      x: x ?? Math.random() * W,
      y: y ?? Math.random() * H,
      r: (burst ? 1.6 + Math.random() * 3 : 1 + Math.random() * 2.2) * dpr,
      vx: (Math.random() - .5) * (burst ? 2.4 : .15) * dpr,
      vy: (burst ? (Math.random() - .7) * 2.4 : -.1 - Math.random() * .25) * dpr,
      life: 0,
      max: burst ? 45 + Math.random() * 35 : 260 + Math.random() * 320,
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
    ctx.shadowBlur = 8 * dpr;
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
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life++; p.x += p.vx; p.y += p.vy; p.s += .012;
      if (p.life >= p.max) {
        parts.splice(i, 1);
        if (!p.burst) parts.push(make(undefined, H + 8));
        continue;
      }
      const t = p.life / p.max;
      const a = p.burst ? 1 - t : Math.sin(t * Math.PI) * (.45 + .4 * Math.sin(p.life * .09));
      star(p, Math.max(a, 0) * (p.burst ? 1 : .75));
    }
    raf = document.hidden ? null : requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  const count = innerWidth < 700 ? 18 : 34;
  for (let i = 0; i < count; i++) { const p = make(); p.life = Math.random() * p.max; parts.push(p); }
  frame();
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !raf) frame(); });

  // sparkle trail behind the cursor (desktop)
  if (finePointer) {
    let last = 0;
    addEventListener('pointermove', e => {
      const now = performance.now();
      if (now - last < 35 || parts.length > 200) return;
      last = now;
      parts.push(make(e.clientX * dpr, e.clientY * dpr, true));
    }, { passive: true });
  }

  // a little burst wherever someone taps or clicks
  addEventListener('pointerdown', e => {
    for (let i = 0; i < 14; i++) parts.push(make(e.clientX * dpr, e.clientY * dpr, true));
  }, { passive: true });
})();
