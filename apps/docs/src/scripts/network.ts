// Animated network behind the heroes. Its colours are the two accents of the public sites.
const KEY = 'syn-netp';
const stored = () => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const state = { paused: stored() };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const dark = () => document.documentElement.dataset.theme === 'dark';

interface Point {
  x: number; y: number; vx: number; vy: number; r: number; p: number; ph: number;
}

const initNet = (canvas: HTMLCanvasElement) => {
  const wrap = canvas.closest<HTMLElement>('.ds-hero-wrap');
  const ctx = canvas.getContext('2d');
  if (!wrap || !ctx) return;
  let w = 0, h = 0, nodes: Point[] = [];
  let mouse = { x: -1e4, y: -1e4 };
  const D = 140;

  const init = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const rect = wrap.getBoundingClientRect();
    w = rect.width; h = rect.height;
    if (!w || !h) return;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(w < 700 ? 34 : 110, (w * h) / 14000));
    nodes = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: 0.8 + Math.random() * 1.6, p: 0.3 + Math.random() * 0.7, ph: Math.random() * 6.28,
    }));
  };

  const tick = (t: number) => {
    requestAnimationFrame(tick);
    if (state.paused || !w || document.hidden || wrap.getBoundingClientRect().bottom < 0) return;
    const C = dark() ? { n: '129,140,248', l: '165,180,252', a: 1 } : { n: '79,70,229', l: '99,102,241', a: 1.6 };
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      if (!reduce) { n.x += n.vx; n.y += n.vy; }
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
      const dx = n.x - mouse.x, dy = n.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 140 && d > 0) { n.x += (dx / d) * 0.6; n.y += (dy / d) * 0.6; }
    }
    ctx.lineWidth = 0.7;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y;
        if (Math.abs(dx) > D || Math.abs(dy) > D) continue;
        const d = Math.hypot(dx, dy);
        if (d < D) {
          ctx.strokeStyle = `rgba(${C.l},${(1 - d / D) * 0.2 * C.a})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      const md = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (md < 180) {
        ctx.strokeStyle = `rgba(${C.l},${(1 - md / 180) * 0.35 * C.a})`;
        ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      const pulse = 0.75 + 0.25 * Math.sin(t / 700 + n.ph);
      const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
      g.addColorStop(0, `rgba(${C.n},${Math.min(1, 0.6 * n.p * pulse * C.a)})`);
      g.addColorStop(1, `rgba(${C.n},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, 6.28); ctx.fill();
      ctx.fillStyle = `rgba(${C.n},${Math.min(1, 0.95 * n.p)})`; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.28); ctx.fill();
    }
  };

  wrap.addEventListener('pointermove', (event) => {
    const rect = wrap.getBoundingClientRect();
    mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  wrap.addEventListener('pointerleave', () => { mouse = { x: -1e4, y: -1e4 }; });
  new ResizeObserver(init).observe(wrap);
  init();
  requestAnimationFrame(tick);
};

const render = () => {
  // The rings around the logo follow the same pause.
  document.documentElement.toggleAttribute('data-paused', state.paused);
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-net-pause]')) {
    button.setAttribute('aria-pressed', String(state.paused));
    const label = button.querySelector(state.paused ? '.ds-netp__play > span' : '.ds-netp__pause > span');
    if (label?.textContent) button.setAttribute('aria-label', label.textContent);
  }
};

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-net-pause]')) {
  button.addEventListener('click', () => {
    state.paused = !state.paused;
    try {
      localStorage.setItem(KEY, state.paused ? '1' : '0');
    } catch {
      // Storage can be unavailable: the choice then lasts for this page.
    }
    render();
  });
}
render();
document.querySelectorAll<HTMLCanvasElement>('canvas.ds-net').forEach(initNet);

export {};
