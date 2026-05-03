/* ============================================================
   SNIFTY v2 — INTERACTIONS
   ============================================================ */

// ─── NAV SCROLL ────────────────────────────────────────────
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 32);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ─── MOBILE NAV ────────────────────────────────────────────
const toggle   = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

toggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  toggle.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ─── SMOOTH SCROLL (nav-height offset) ─────────────────────
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const el = document.querySelector(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 12;
    window.scrollTo({ top: y, behavior: 'smooth' });
  });
});

// ─── FAQ ACCORDION ─────────────────────────────────────────
document.querySelectorAll('.faq-item').forEach(item => {
  item.querySelector('.faq-q').addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.faq-a').classList.remove('open');
    });
    if (!isOpen) {
      item.classList.add('open');
      item.querySelector('.faq-a').classList.add('open');
    }
  });
});

// ─── SCROLL REVEAL ─────────────────────────────────────────
const revealTargets = document.querySelectorAll([
  '.aud-card', '.trust-item',
  '.hiw-step', '.sci-step', '.sb-col', '.problem-copy',
  '.problem-chart-wrap', '.science-copy', '.science-steps',
  '.baseline-copy', '.baseline-visual', '.bv-card',
  '.surv-stat', '.cta-inner', '.product-intro', '.product-flow'
].join(','));

revealTargets.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const siblings = [...entry.target.parentElement.children]
      .filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(entry.target);
    setTimeout(() => entry.target.classList.add('visible'), idx * 70);
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

revealTargets.forEach(el => revealObserver.observe(el));

// ─── STAGE BARS ANIMATE IN ─────────────────────────────────
// Bars use CSS custom property --h for height %; animate from 0 on enter
const stageBars = document.querySelectorAll('.sb-bar');
if (stageBars.length) {
  stageBars.forEach(bar => {
    const target = getComputedStyle(bar).getPropertyValue('--h').trim();
    bar.style.setProperty('--h', '0');
    const barObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setTimeout(() => bar.style.setProperty('--h', target), 200);
        barObserver.disconnect();
      }
    }, { threshold: 0.3 });
    barObserver.observe(bar);
  });
}

// ─── CHART LINE DRAW ───────────────────────────────────────
// Triggered by IntersectionObserver so it fires when visible
const vocLine = document.getElementById('vocLine');
if (vocLine) {
  const length = vocLine.getTotalLength ? vocLine.getTotalLength() : 1200;
  vocLine.style.strokeDasharray  = length;
  vocLine.style.strokeDashoffset = length;

  const chartObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      vocLine.style.animation = 'none'; // reset
      vocLine.getBoundingClientRect();  // reflow
      vocLine.style.animation = `drawLine 2s ease-out 0.2s forwards`;
      chartObserver.disconnect();
    }
  }, { threshold: 0.4 });
  if (vocLine.closest('section')) chartObserver.observe(vocLine.closest('section'));
}

