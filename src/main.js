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
  teamCountUrl: "https://script.google.com/macros/s/AKfycbwd98DFxylc3-3YNbdSpG7ucoxfbTwkZKb2SX3oBRrWJwdu84OQGQoQg0j2Hr5l5uxJYg/exec",

  // Total participants registered (display only, no cap)
  teamCountMax: 90,

  // Set to a real date string (e.g. "2026-08-28") once confirmed,
  // or leave as null to keep showing the provisional label.
  eventDateISO: null,
  eventDateLabel: "22nd - 23rd September 2026"
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
  const countEl2 = document.getElementById('liveRegCount2');
  if (!countEl && !countEl2) return;

  try {
    const res  = await fetch(CONFIG.teamCountUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const count = Math.max(0, parseInt(data.count, 10) || 0);

    // Update count display (no cap/limit — registration always open)
    if (countEl) animateCounter(countEl, count);
    if (countEl2) animateCounter(countEl2, count);

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
  const TARGET = new Date('2026-09-22T00:00:00+05:30').getTime();

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
// SMOOTH SCROLL-REVEAL — IntersectionObserver for section fade-ins
// =====================================================================
(function initScrollReveal(){
  const sections = document.querySelectorAll('.section, .cta-band');
  if(!sections.length) return;

  // Graceful fallback for older browsers
  if(!('IntersectionObserver' in window)){
    sections.forEach(s => s.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if(entry.isIntersecting){
        // Stagger the reveal slightly for visual polish
        const delay = idx * 60;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px'
  });

  sections.forEach(s => observer.observe(s));
})();

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
// Delta-time driven for consistent speed across all frame-rates.
// =====================================================================
function initBackground(){
  const canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  let W, H, dpr, mouse = {x: -9999, y: -9999};
  let raf;
  let t = 0;
  let lastFrame = performance.now();

  // ── device capability detection ────────────────────────────────────
  const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  const isLowPower = isMobileDevice && (navigator.hardwareConcurrency || 4) <= 4;
  const auroraStep = isMobileDevice ? 8 : 4; // coarser wave on mobile

  // ── FPS tracking for adaptive quality ──────────────────────────────
  let frameCount = 0;
  let fpsAccum = 0;
  let avgFps = 60;
  let skipConstellationLines = false; // auto-degrade if FPS too low

  // ── resize ──────────────────────────────────────────────────────────
  function resize(){
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

  function rebuildParticles(){
    const cap = isLowPower ? 25 : (isMobileDevice ? 40 : 90);
    const n = Math.min(cap, Math.floor(W * H / 14000));
    dots = Array.from({length: n}, () => ({
      x:  Math.random() * W,  y: Math.random() * H,
      vx: (Math.random() - .5) * .28, vy: (Math.random() - .5) * .28,
      r:  Math.random() * 3 + 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      pulse: Math.random() * Math.PI * 2
    }));

    const crossCap = isLowPower ? 4 : (isMobileDevice ? 8 : 28);
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
    for(let x = 0; x <= W; x += auroraStep){
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

  // ── main loop (delta-time driven) ──────────────────────────────────
  function frame(now){
    // Delta-time: consistent speed regardless of frame-rate
    const dt = Math.min((now - lastFrame) / 1000, 0.1); // cap at 100ms to prevent jumps
    lastFrame = now;

    // FPS tracking — auto-degrade constellation lines if consistently below 30fps
    frameCount++;
    fpsAccum += dt;
    if(fpsAccum >= 1.0){
      avgFps = frameCount / fpsAccum;
      frameCount = 0;
      fpsAccum = 0;
      skipConstellationLines = avgFps < 28;
    }

    ctx.clearRect(0, 0, W, H);
    // Fill background to avoid transparency flicker
    ctx.fillStyle = (typeof window.getHackxTheme === 'function' && window.getHackxTheme() === 'light') ? '#f0f8ff' : '#050d1f';
    ctx.fillRect(0, 0, W, H);

    t += dt * 0.8; // smooth time advance, ~0.004 per frame at 60fps equivalent

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

    // === CONSTELLATION LINES (skip on low FPS) ===
    if(!skipConstellationLines){
      const lineColor  = isLight ? '#0070c0' : '#00E5A0';
      const mouseColor = isLight ? '#d97000' : '#FFB627';
      const lineAlpha  = isLight ? .06 : .09;
      const mouseAlpha = isLight ? .08 : .12;
      const connDist   = isMobileDevice ? 100 : 130;

      for(let i = 0; i < dots.length; i++){
        for(let j = i + 1; j < dots.length; j++){
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          if(distSq < connDist * connDist){
            const dist = Math.sqrt(distSq);
            ctx.save();
            ctx.globalAlpha = lineAlpha * (1 - dist / connDist);
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = .7;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.restore();
          }
        }
        // mouse-reactive halo
        const mdx = dots[i].x - mouse.x, mdy = dots[i].y - mouse.y;
        const mdSq = mdx * mdx + mdy * mdy;
        if(mdSq < 32400){ // 180^2
          const md = Math.sqrt(mdSq);
          ctx.save();
          ctx.globalAlpha = mouseAlpha * (1 - md / 180);
          ctx.strokeStyle = mouseColor;
          ctx.lineWidth = .8;
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
          ctx.restore();
        }
      }
    }

    // === GLOWING DOTS (delta-time movement) ===
    const speed60 = dt * 60; // normalize to 60fps equivalent
    for(const p of dots){
      p.x += p.vx * speed60;
      p.y += p.vy * speed60;
      p.pulse += .025 * speed60;
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

    // === MEDICAL CROSS PARTICLES (delta-time movement) ===
    for(const c of crosses){
      c.x += c.vx * speed60;
      c.y += c.vy * speed60;
      c.rot += c.rotV * speed60;
      if(c.x < -30 || c.x > W + 30) c.vx *= -1;
      if(c.y < -30 || c.y > H + 30) c.vy *= -1;
      drawCross(c.x, c.y, c.size, c.rot, c.color, isLight ? c.alpha * 1.8 : c.alpha);
    }

    raf = requestAnimationFrame(frame);
  }

  // ── throttled mouse/touch tracking ─────────────────────────────────
  let mouseThrottle = 0;
  window.addEventListener('mousemove', e => {
    const now = performance.now();
    if(now - mouseThrottle < 16) return; // ~60fps cap
    mouseThrottle = now;
    mouse.x = e.clientX; mouse.y = e.clientY;
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; }, { passive: true });

  // Touch: treat touch position as mouse for constellation lines
  let touchThrottle = 0;
  window.addEventListener('touchmove', e => {
    const now = performance.now();
    if(now - touchThrottle < 16) return;
    touchThrottle = now;
    if (e.touches.length > 0) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
  }, { passive: true });
  window.addEventListener('touchend', () => { mouse.x = -9999; mouse.y = -9999; }, { passive: true });

  // ── pause RAF when tab is hidden (saves battery & prevents jank on switch) ──
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      lastFrame = performance.now(); // reset delta to avoid huge jump
      raf = requestAnimationFrame(frame);
    }
  }, { passive: true });

  // ── kick off ────────────────────────────────────────────────────────
  resize();
  let resizeTimer;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }, 200);
  }, { passive: true });
  raf = requestAnimationFrame(frame);
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
    ctx.fillStyle = '#050d1f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
