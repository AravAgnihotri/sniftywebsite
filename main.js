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

function waitlistPostUrl() {
  const meta = document.querySelector('meta[name="snifty-waitlist-api"]');
  const base = (meta?.getAttribute('content') || '').trim().replace(/\/+$/, '');
  return base ? `${base}/api/waitlist` : '/api/waitlist';
}

// ─── WAITLIST FORM (POST → /api/waitlist, SQLite via server) ─
const form = document.getElementById('waitlistForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const btn = form.querySelector('button[type="submit"]');
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const btnHTML = btn.innerHTML;

    form.querySelectorAll('.wl-error').forEach((el) => el.remove());

    btn.textContent = 'Saving your spot…';
    btn.disabled = true;

    try {
      const res = await fetch(waitlistPostUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        btn.innerHTML = btnHTML;
        btn.disabled = false;
        const msg = data.error || 'Could not save your spot. Please try again.';
        const err = document.createElement('p');
        err.className = 'wl-error';
        err.setAttribute('role', 'alert');
        err.textContent = msg;
        form.insertBefore(err, form.querySelector('.wl-note'));
        return;
      }

      form.innerHTML = `
        <div style="text-align:center;padding:32px 0">
          <div style="
            width:52px;height:52px;background:var(--purple);border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:22px;color:#fff;font-weight:900;margin:0 auto 18px;
            animation:successPop 0.4s cubic-bezier(0.34,1.56,0.64,1)
          ">✓</div>
          <h3 style="font-size:20px;font-weight:800;margin-bottom:8px;color:var(--black)">
            You're in, ${escapeHTML(name)}.
          </h3>
          <p style="color:var(--gray-3);font-size:15px">
            We'll reach out when your device is ready. Welcome to the founding cohort.
          </p>
        </div>`;
    } catch {
      btn.innerHTML = btnHTML;
      btn.disabled = false;
      const err = document.createElement('p');
      err.className = 'wl-error';
      err.setAttribute('role', 'alert');
      err.textContent =
        'Could not reach the server. Run `npm run dev` and open the local URL, or set the snifty-waitlist-api meta tag to your API host.';
      form.insertBefore(err, form.querySelector('.wl-note'));
    }
  });
}

function escapeHTML(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// inject keyframe for success pop
const s = document.createElement('style');
s.textContent = `@keyframes successPop { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }`;
document.head.appendChild(s);
