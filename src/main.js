import './style.css';
import { inject } from '@vercel/analytics';

// Initialize Vercel Analytics (tracks visitors on Vercel Dashboard)
inject();


// =====================================================================
// CONFIG — the only block you should need to touch before deploying.
// =====================================================================
const CONFIG = {
  // Google Form registration link
  registerUrl: "https://forms.gle/3rV8NPLJAu8CrK8F8",

  // Google Apps Script Web App URL — returns { count: N }
  teamCountUrl: "https://script.google.com/macros/s/AKfycbzGv2NrG8NVtLNFgS4IzaJM5fSEbBQZvdrWyhZ3-4T3gL324OW0TsFR6zn2IgVo5oUtZQ/exec",

  // Max participant slots available
  teamCountMax: 40,

  // Set to a real date string (e.g. "2026-08-28") once confirmed,
  // or leave as null to keep showing the provisional label.
  eventDateISO: null,
  eventDateLabel: "8th - 9th September 2026"
};

function applyConfig(){
  // Hero button — scroll down to the registration section (never redirect to form)
  const heroBtn = document.getElementById('registerBtn');
  if(heroBtn){
    heroBtn.href = '#register';
    heroBtn.removeAttribute('data-pending');
    heroBtn.removeAttribute('target');
    heroBtn.removeAttribute('rel');
    heroBtn.addEventListener('click', e => {
      e.preventDefault();
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // CTA-band button (inside the #register section) — links to the actual form
  const ctaBtn = document.getElementById('registerBtn2');
  if(ctaBtn){
    if(CONFIG.registerUrl){
      ctaBtn.href = CONFIG.registerUrl;
      ctaBtn.removeAttribute('data-pending');
      ctaBtn.target = '_blank';
      ctaBtn.rel = 'noopener';
    }
  }

  const dateVital = document.getElementById('dateVital');
  if(dateVital && CONFIG.eventDateISO){
    const d = new Date(CONFIG.eventDateISO);
    dateVital.textContent = d.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
  } else if(dateVital){
    dateVital.textContent = CONFIG.eventDateLabel;
  }
}
applyConfig();

// =====================================================================
// LIVE REGISTRATION COUNT
// =====================================================================
function animateCounter(el, target, duration = 1100) {
  const startTime = performance.now();
  function tick(now) {
    const p = Math.min((now - startTime) / duration, 1);
    const eased = p < 1 ? 1 - Math.pow(1 - p, 3) : 1; // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target;
  }
  requestAnimationFrame(tick);
}

async function fetchTeamCount() {
  const countEl  = document.getElementById('liveRegCount');
  const fillEl   = document.getElementById('liveRegFill');
  const trackEl  = document.getElementById('liveRegProgress');
  // Second instance (CTA band)
  const countEl2  = document.getElementById('liveRegCount2');
  const fillEl2   = document.getElementById('liveRegFill2');
  const trackEl2  = document.getElementById('liveRegProgress2');
  if (!countEl && !countEl2) return;

  try {
    const res  = await fetch(CONFIG.teamCountUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = Math.max(0, parseInt(data.count, 10) || 0);
    const max   = CONFIG.teamCountMax;

    // Helper to update one count+bar pair
    function updateWidget(cEl, fEl, tEl) {
      if (cEl) animateCounter(cEl, count);
      if (fEl) {
        setTimeout(() => {
          const pct = Math.min(100, (count / max) * 100).toFixed(1);
          fEl.style.width = pct + '%';
          if (count / max >= 0.75) fEl.classList.add('warn');
          else fEl.classList.remove('warn');
        }, 80);
      }
      if (tEl) {
        tEl.setAttribute('aria-valuenow', count);
        tEl.setAttribute('aria-valuetext', `${count} of ${max} participants registered`);
      }
    }

    updateWidget(countEl,  fillEl,  trackEl);
    updateWidget(countEl2, fillEl2, trackEl2);

    // ── Lock registration when slots are full (Limit: 40 participants) ──
    if (count >= max) {
      const heroBtn = document.getElementById('registerBtn');
      const ctaBtn  = document.getElementById('registerBtn2');
      const navBtn  = document.getElementById('navRegisterBtn');

      [heroBtn, ctaBtn].forEach(btn => {
        if (btn) {
          btn.href = 'javascript:void(0);';
          btn.removeAttribute('target');
          btn.removeAttribute('rel');
          btn.textContent = 'Registrations Full (40/40)';
          btn.classList.add('btn-disabled');
          btn.setAttribute('aria-disabled', 'true');
          btn.style.pointerEvents = 'none';
          btn.addEventListener('click', e => e.preventDefault(), { capture: true });
        }
      });

      if (navBtn) {
        navBtn.href = 'javascript:void(0);';
        navBtn.textContent = 'Full';
        navBtn.classList.add('btn-disabled');
        navBtn.setAttribute('aria-disabled', 'true');
        navBtn.style.pointerEvents = 'none';
        navBtn.addEventListener('click', e => e.preventDefault(), { capture: true });
      }

      // Update CTA band subtitle
      const ctaSub = document.querySelector('#register p');
      if (ctaSub) {
        ctaSub.textContent = 'Registrations are now closed — the 40-participant limit has been reached.';
        ctaSub.style.color = '#ff3b5c';
      }

      // Mark progress bars as full
      [fillEl, fillEl2].forEach(f => { if (f) f.classList.add('full'); });
    }

  } catch (err) {
    console.warn('[TECH4LIFE] Live team count fetch error:', err);
    // Graceful fallback to 0 instead of broken symbols
    if (countEl && countEl.textContent === '--') countEl.textContent = '0';
    if (countEl2 && countEl2.textContent === '--') countEl2.textContent = '0';
  }
}

// Fetch immediately, then refresh every 60 s
fetchTeamCount();
setInterval(fetchTeamCount, 60_000);

// =====================================================================
// COUNTDOWN TIMER — counts down to 8th September 2026 00:00:00 IST
// =====================================================================
(function initCountdown() {
  const TARGET = new Date('2026-09-08T00:00:00+05:30').getTime();

  const cdDays    = document.getElementById('cdDays');
  const cdHours   = document.getElementById('cdHours');
  const cdMinutes = document.getElementById('cdMinutes');
  const cdSeconds = document.getElementById('cdSeconds');
  const cdWrap    = document.getElementById('countdownWrap');

  if (!cdDays || !cdHours || !cdMinutes || !cdSeconds) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now  = Date.now();
    const diff = TARGET - now;

    if (diff <= 0) {
      cdDays.textContent    = '00';
      cdHours.textContent   = '00';
      cdMinutes.textContent = '00';
      cdSeconds.textContent = '00';
      cdWrap?.classList.add('finished');
      return; // stop ticking
    }

    const days    = Math.floor(diff / 86_400_000);
    const hours   = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000)  / 60_000);
    const seconds = Math.floor((diff % 60_000)     / 1_000);

    cdDays.textContent    = pad(days);
    cdHours.textContent   = pad(hours);
    cdMinutes.textContent = pad(minutes);
    cdSeconds.textContent = pad(seconds);

    setTimeout(tick, 1000);
  }

  tick();
})();



// mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
}, { passive: true });
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'), { passive: true });
});

// =====================================================================
// THEME TOGGLE — light / dark, persisted in localStorage
// =====================================================================
const THEME_KEY = 'hackx-theme';
const html = document.documentElement;

// Apply saved theme immediately (before first paint)
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
html.setAttribute('data-theme', savedTheme);

const themeToggle = document.getElementById('themeToggle');
function syncToggleIcon(){
  const isDark = html.getAttribute('data-theme') === 'dark';
  themeToggle.textContent = isDark ? '☀️' : '🌙';
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
}
syncToggleIcon();

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  // Batch the DOM write inside rAF to avoid forced layout on the click frame
  requestAnimationFrame(() => {
    html.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    syncToggleIcon();
  });
});

// Expose current theme for canvas engine
window.getHackxTheme = () => html.getAttribute('data-theme');



// Radar SVG animation is driven purely by CSS @keyframes (radarSpin / radarBlip).
// No JS needed for it. prefersReduced used below for the canvas engine only.
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// =====================================================================
// PREMIUM BACKGROUND ENGINE
// • Layer 1 — Aurora sine waves (canvas, fixed, full-viewport)
// • Layer 2 — Constellation dots + mouse-reactive lines
// • Layer 3 — Floating medical cross / DNA-helix particles
// All drawn below z-index -2 so they never sit on top of text.
// =====================================================================
function initBackground(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, dpr, mouse = {x: -9999, y: -9999};
  let raf;
  let t = 0;

  // ── resize ──────────────────────────────────────────────────────────
  function resize(){
    // Cap DPR at 1.5 on mobile to halve the pixel budget on Retina phones
    const isMobile = window.innerWidth <= 820;
    dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuildParticles();
  }

  // ── particles ───────────────────────────────────────────────────────
  const COLORS = ['#FF3B5C','#00E5A0','#FFB627','#7B6FFF'];
  let dots = [], crosses = [];
  // Fewer particles on mobile = less draw-call overhead
  const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  function rebuildParticles(){
    const cap = isMobileDevice ? 40 : 90;
    const n = Math.min(cap, Math.floor(W * H / 14000));
    dots = Array.from({length: n}, () => ({
      x:  Math.random() * W,  y: Math.random() * H,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r:  Math.random() * 3 + 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2
    }));

    const crossCap = isMobileDevice ? 8 : 28;
    const nc = Math.min(crossCap, Math.floor(W * H / 50000));
    crosses = Array.from({length: nc}, () => ({
      x:  Math.random() * W,  y: Math.random() * H,
      vx: (Math.random() - .5) * .18, vy: (Math.random() - .5) * .18,
      size: Math.random() * 20 + 16,
      alpha: Math.random() * .28 + .12,
      rot: Math.random() * Math.PI,
      rotV: (Math.random() - .5) * .006,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }));
  }

  // ── aurora wave helper ──────────────────────────────────────────────
  function drawAurora(yBase, amp, freq, phase, color, alpha){
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for(let x = 0; x <= W; x += 4){
      const y = yBase + Math.sin(x * freq + phase) * amp
                       + Math.sin(x * freq * .6 + phase * 1.3) * (amp * .45)
                       + Math.sin(x * freq * .3 + phase * .7) * (amp * .25);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // ── medical cross ──────────────────────────────────────────────────
  function drawCross(x, y, size, rot, color, alpha){
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = size * .22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-size * .5, 0); ctx.lineTo(size * .5, 0);
    ctx.moveTo(0, -size * .5); ctx.lineTo(0, size * .5);
    ctx.stroke();
    ctx.restore();
  }

  // ── main loop ───────────────────────────────────────────────────────
  function frame(){
    ctx.clearRect(0, 0, W, H);
    t += .004;

    const isLight = (typeof window.getHackxTheme === 'function')
      && window.getHackxTheme() === 'light';

    // === AURORA WAVES (back layer) ===
    if(isLight){
      drawAurora(H * .22, H * .18, .0014, t * .9,          '#FF3B5C', .07);
      drawAurora(H * .55, H * .22, .0011, t * .7 + 2.1,    '#7B6FFF', .065);
      drawAurora(H * .78, H * .16, .0016, t * 1.1 + 4.5,   '#00C988', .06);
      drawAurora(H * .38, H * .13, .0009, t * .55 + 1.2,   '#FFB627', .055);
    } else {
      drawAurora(H * .22, H * .18, .0014, t * .9,          '#FF3B5C', .055);
      drawAurora(H * .55, H * .22, .0011, t * .7 + 2.1,    '#7B6FFF', .05);
      drawAurora(H * .78, H * .16, .0016, t * 1.1 + 4.5,   '#00E5A0', .048);
      drawAurora(H * .38, H * .13, .0009, t * .55 + 1.2,   '#FFB627', .038);
    }

    // === CONSTELLATION LINES ===
    const lineColor  = isLight ? '#0070c0' : '#00E5A0';
    const mouseColor = isLight ? '#d97000' : '#FFB627';
    const lineAlpha  = isLight ? .06 : .09;
    const mouseAlpha = isLight ? .08 : .12;

    for(let i = 0; i < dots.length; i++){
      for(let j = i + 1; j < dots.length; j++){
        const a = dots[i], b = dots[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if(dist < 130){
          ctx.save();
          ctx.globalAlpha = lineAlpha * (1 - dist / 130);
          ctx.strokeStyle = lineColor;
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.restore();
        }
      }
      // mouse-reactive halo
      const md = Math.hypot(dots[i].x - mouse.x, dots[i].y - mouse.y);
      if(md < 180){
        ctx.save();
        ctx.globalAlpha = mouseAlpha * (1 - md / 180);
        ctx.strokeStyle = mouseColor;
        ctx.lineWidth = .8;
        ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y);
        ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        ctx.restore();
      }
    }

    // === GLOWING DOTS ===
    for(const p of dots){
      p.x += p.vx; p.y += p.vy;
      p.pulse += .025;
      if(p.x < 0 || p.x > W) p.vx *= -1;
      if(p.y < 0 || p.y > H) p.vy *= -1;
      const pulse = .55 + .45 * Math.sin(p.pulse);
      const dotAlpha = isLight ? .85 * pulse : .7 * pulse;
      const dotBlur  = isLight ? 10 * pulse  : 16 * pulse;
      ctx.save();
      ctx.shadowBlur = dotBlur;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = dotAlpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (.85 + .35 * pulse), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // === MEDICAL CROSS PARTICLES ===
    for(const c of crosses){
      c.x += c.vx; c.y += c.vy;
      c.rot += c.rotV;
      if(c.x < -30 || c.x > W + 30) c.vx *= -1;
      if(c.y < -30 || c.y > H + 30) c.vy *= -1;
      drawCross(c.x, c.y, c.size, c.rot, c.color, isLight ? c.alpha * 1.8 : c.alpha);
    }

    raf = requestAnimationFrame(frame);
  }

  // ── mouse tracking ──────────────────────────────────────────────────
  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; }, { passive: true });
  // Touch: treat touch position as mouse for constellation lines
  window.addEventListener('touchmove', e => {
    if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; }, { passive: true });

  // ── pause RAF when tab is hidden (saves battery & prevents jank on switch) ──
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { frame(); }
  }, { passive: true });

  // ── kick off ────────────────────────────────────────────────────────
  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); frame(); }, 250);
  }, { passive: true });
  frame();
}

if(!prefersReduced){
  initBackground();
} else {
  // Reduced motion: just fill the canvas with the base background color,
  // no animation, so it doesn't sit blank/transparent.
  const canvas = document.getElementById('bgCanvas');
  if(canvas){
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.fillStyle = '#0A0E27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
