// ===== CVibe animations — load with: <script src="animations.js" defer></script> =====
(() => {
  // Skip everything if the person prefers reduced motion
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const CARD = '[class*="card"]';
  const hasInputs = (el) => el.querySelector('input, textarea');

  // 1. Scroll progress bar + navbar blur ------------------------------------
  const bar = document.createElement('div');
  bar.id = 'progress-bar';
  bar.className = 'cv-ui';
  document.body.appendChild(bar);

  const nav = document.querySelector('header') || document.querySelector('nav');
  if (nav) {
    nav.classList.add('cv-navfx');
    if (getComputedStyle(nav).position === 'static') nav.classList.add('cv-sticky');
  }

  const onScroll = () => {
    const h = document.documentElement;
    const progress = h.scrollTop / ((h.scrollHeight - h.clientHeight) || 1);
    bar.style.width = progress * 100 + '%';
    if (nav) nav.classList.toggle('cv-scrolled', h.scrollTop > 40);
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // 2. Floating background glow ---------------------------------------------
  ['a', 'b'].forEach((k) => {
    const blob = document.createElement('div');
    blob.className = 'cv-blob cv-blob-' + k + ' cv-ui';
    blob.setAttribute('aria-hidden', 'true');
    document.body.appendChild(blob);
  });

  // 3. Scroll reveal with stagger -------------------------------------------
  const targets = document.querySelectorAll('h1, h2, section p, .primary-btn, ' + CARD);
  const counts = new Map();

  targets.forEach((el) => {
    if (el.closest('header, nav')) return;
    // skip things inside a card (the card itself animates)
    if (el.closest(CARD) && !el.matches(CARD)) return;

    const n = counts.get(el.parentElement) || 0;
    counts.set(el.parentElement, n + 1);
    el.style.setProperty('--d', Math.min(n * 110, 550) + 'ms');
    el.classList.add('reveal');
    if (el.matches(CARD)) el.classList.add(n % 2 ? 'from-right' : 'from-left');
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in-view');
        io.unobserve(el);
        // remove the stagger delay afterwards so hover effects feel instant
        setTimeout(() => el.style.setProperty('--d', '0ms'), 1500);
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // 4. Button ripple ---------------------------------------------------------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.primary-btn, .nav-btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const s = document.createElement('span');
    s.className = 'cv-ripple cv-ui';
    s.style.cssText =
      `width:${size}px;height:${size}px;` +
      `left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    btn.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  // 5. Card tilt that follows the mouse --------------------------------------
  if (matchMedia('(hover: hover)').matches) {
    document.querySelectorAll(CARD).forEach((card) => {
      if (hasInputs(card)) return; // never tilt the form
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--ry', x * 10 + 'deg');
        card.style.setProperty('--rx', -y * 10 + 'deg');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }

  // 6. Upload box: drag glow + pop when a file is chosen ---------------------
  const box = document.querySelector('.upload-box');
  const fileInput = document.getElementById('resume');
  if (box && fileInput) {
    ['dragenter', 'dragover'].forEach((t) =>
      box.addEventListener(t, (e) => { e.preventDefault(); box.classList.add('dragover'); })
    );
    ['dragleave', 'drop'].forEach((t) =>
      box.addEventListener(t, (e) => { e.preventDefault(); box.classList.remove('dragover'); })
    );
    box.addEventListener('drop', (e) => {
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    fileInput.addEventListener('change', () => {
      box.classList.remove('picked');
      void box.offsetWidth; // restart the animation
      box.classList.add('picked');
    });
  }

  // 7. Analyze button spinner ------------------------------------------------
  const form = document.getElementById('resumeForm');
  const submitBtn = form && form.querySelector('button[type="submit"]');
  const stopLoading = () => submitBtn && submitBtn.classList.remove('loading');
  if (form && submitBtn) {
    form.addEventListener('submit', () => {
      submitBtn.classList.add('loading');
      setTimeout(stopLoading, 20000); // safety net if the backend never answers
    });
  }

  // 8. Number count-up -------------------------------------------------------
  function countUp(el) {
    const text = el.textContent.trim();
    const end = parseInt(text, 10);
    const suffix = text.endsWith('%') ? '%' : '';
    if (!end) return;
    el._counting = true;
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => (el._counting = false), 60);
    };
    requestAnimationFrame(tick);
  }

  // 9. React when results appear --------------------------------------------
  // Watches the page: when your script.js fills in the dashboard, new chips
  // pop in, updated cards pulse, and numbers count up.
  const mo = new MutationObserver((muts) => {
    const added = [];
    const cards = new Set();
    let resultsArrived = false;

    muts.forEach((m) => {
      if (m.type === 'childList') {
        const real = [...m.addedNodes, ...m.removedNodes].filter(
          (n) => !(n.classList && n.classList.contains('cv-ui'))
        );
        if (!real.length) return;
        m.addedNodes.forEach((n) => {
          if (n.nodeType === 1 && !n.classList.contains('cv-ui')) added.push(n);
        });
      }

      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      if (!t) return;
      if (!(form && form.contains(t))) resultsArrived = true;

      const card = t.closest(CARD);
      if (card && !hasInputs(card)) cards.add(card);

      if (!t._counting && t.children.length === 0 && /^\d{1,3}%?$/.test(t.textContent.trim())) {
        countUp(t);
      }
    });

    added.forEach((n, i) => {
      n.style.setProperty('--d', Math.min(i * 70, 1000) + 'ms');
      n.classList.add('pop-in');
      n.addEventListener('animationend', () => n.classList.remove('pop-in'), { once: true });
    });

    cards.forEach((c) => {
      c.classList.remove('pulse');
      void c.offsetWidth;
      c.classList.add('pulse');
      c.addEventListener('animationend', () => c.classList.remove('pulse'), { once: true });
    });

    if (resultsArrived && submitBtn && submitBtn.classList.contains('loading')) {
      stopLoading();
      const dash = document.querySelector('.dashboard-grid');
      if (dash) setTimeout(() => dash.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true, characterData: true });
})();
// ===== Interactive extras =====
(() => {
  // Highlight the nav link of the section you're viewing
  const links = document.querySelectorAll('nav a[href^="#"]');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((a) =>
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)
      );
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => {
    const sec = document.querySelector(a.getAttribute('href'));
    if (sec) spy.observe(sec);
  });

  // Back-to-top button
  const top = document.createElement('button');
  top.id = 'to-top';
  top.className = 'cv-ui';
  top.textContent = '↑';
  top.setAttribute('aria-label', 'Back to top');
  top.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(top);
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > 500), { passive: true });

  // Word counter under the job description
  const jd = document.getElementById('jobDescription');
  if (jd) {
    const count = document.createElement('small');
    count.className = 'jd-count cv-ui';
    jd.insertAdjacentElement('afterend', count);
    const update = () => {
      count.textContent = jd.value.trim().split(/\s+/).filter(Boolean).length + ' words';
    };
    jd.addEventListener('input', update);
    update();
  }

  // Toast message when a file is chosen
  const toast = (msg) => {
    const t = document.createElement('div');
    t.className = 'cv-toast cv-ui';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 400);
    }, 2500);
  };
  const file = document.getElementById('resume');
  if (file) {
    file.addEventListener('change', () => {
      const f = file.files[0];
      if (f) toast(f.name.toLowerCase().endsWith('.pdf') ? 'Attached: ' + f.name : 'Please choose a PDF file');
    });
  }

  // Spotlight that follows the mouse inside cards
  document.querySelectorAll('[class*="card"]').forEach((c) => {
    c.addEventListener('pointermove', (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--mx', e.clientX - r.left + 'px');
      c.style.setProperty('--my', e.clientY - r.top + 'px');
    });
  });
})();