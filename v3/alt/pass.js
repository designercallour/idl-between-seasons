/* IDL · Season 02 waitlist pass — shared behaviour for v3/alt-0X.html.
   The baseline v3/index.html has its own inline script and does not load this.

   Markup contract (each layout places these wherever its composition needs them):
     form[data-wl] > input[type=email], button.cta [data-cta] label, [data-msg]
     [data-surface]   the pass object: tap-to-wake target, shakes on error, carries .wipe
     [data-status]    status text (any number)      [data-passno] pass reference (any number)
     [data-holder]    email shown on success         [data-support] outside copy, swapped on success
     [data-donefocus] focus target after activation  [data-reset] "use a different email"
   Motion hooks (all optional, all subtle):
     [data-tilt=deg] [data-par=px] [data-shift=px] [data-lit] [data-bg]
   Layout helpers:
     [data-fit] (+ data-fit-to="selector") scales display type to an exact width.

   SUBMIT IS A STUB — replace `submit()` with the app.idl.pro capture endpoint.
   ?fail previews the network error · ?intro replays the intro · ?dev shows the comparison bar. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const body = document.body, q = new URLSearchParams(location.search);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const LOGO = '<svg class="logo" viewBox="0 0 110 32" fill="currentColor" aria-hidden="true"><path d="M.2 9V.2h30.15V9H.2Z"/><path d="M30.35 13.77H.2v18.11h24.08l6.07-18.11Z"/><path d="M37.3 9 40.33.2c3.15 0 11.6-.26 21.15 0 9.55.55 11.93 9.44 11.93 13.46H54.43l-1.63 4.66h19.96c-2.69 11.54-13.34 13.85-18.33 13.56H29.7l6.07-18.22h18.66L56.17 9H37.3Z"/><path d="M103.78.2H83.28l-4.45 13.46h20.39L103.78.2Z"/><path d="m72.76 31.88 4.45-13.56h31.67l.33 13.56H72.76Z"/></svg>';

  /* ---------------- fit display type to a width ---------------- */
  const fit = () => $$('[data-fit]').forEach((el) => {
    const target = el.dataset.fitTo ? $(el.dataset.fitTo) : el.parentElement;
    if (!target || !target.offsetWidth) return;
    el.style.fontSize = '100px'; el.style.whiteSpace = 'nowrap'; el.style.display = 'inline-block';
    const w = el.getBoundingClientRect().width;
    const max = parseFloat(el.dataset.fitMax || 400);
    el.style.fontSize = Math.min(max, (100 * target.getBoundingClientRect().width) / w).toFixed(2) + 'px';
    el.style.display = '';
  });
  fit(); addEventListener('resize', fit);
  document.fonts && document.fonts.ready.then(fit);

  /* ---------------- intro: 2026 ENDED → SEASON 02 OPEN → reveal ---------------- */
  // setTimeout (not rAF) so the entrance still resolves in background tabs / embedded previews
  const enter = () => setTimeout(() => { fit(); body.classList.add('is-in'); }, 30);
  let seen = false; try { seen = sessionStorage.getItem('idl-s02-intro') === '1'; } catch (e) {}
  if (!reduced && (q.has('intro') || (!seen && !q.has('nointro')))) {
    try { sessionStorage.setItem('idl-s02-intro', '1'); } catch (e) {}
    const ov = document.createElement('div');
    ov.className = 'idl-intro'; ov.setAttribute('aria-hidden', 'true');
    ov.innerHTML = `<div class="idl-intro-in">${LOGO}<div class="idl-intro-rows">
      <div class="idl-intro-row a"><span class="display">2026 Season</span><span class="chip ended">Ended</span></div>
      <div class="idl-intro-row b"><span class="display">Season 02</span><span class="chip open"><span class="dot"></span>Waitlist open</span></div></div></div>`;
    body.appendChild(ov);
    const out = () => { ov.classList.add('out'); setTimeout(enter, 120); setTimeout(() => ov.remove(), 700); };
    const t1 = setTimeout(() => ov.classList.add('s2'), 520), t2 = setTimeout(out, 1150);
    const skip = () => { clearTimeout(t1); clearTimeout(t2); out(); removeEventListener('keydown', skip); };
    ov.addEventListener('click', skip); addEventListener('keydown', skip, { once: true });
  } else {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(enter);
    setTimeout(enter, 700);
  }

  /* ---------------- the pass: state machine ---------------- */
  const form = $('[data-wl]'); if (!form) return;
  const input = $('input[type=email]', form), cta = $('.cta', form), ctaLbl = $('[data-cta]', form), msg = $('[data-msg]', form);
  const surface = $('[data-surface]'), statusEls = $$('[data-status]'), passNos = $$('[data-passno]');
  const supports = $$('[data-support]').map((el) => [el, el.innerHTML]);
  const COPY = { locked: 'Pass locked', ready: 'Ready', valid: 'Ready to activate', loading: 'Activating pass…', activated: 'Pass activated', active: 'Pass active', invalid: 'Check your email', network: 'Try again' };
  const EMPTY = 'S02-——————';

  const set = (s, txt) => {
    body.dataset.pass = s;
    body.dataset.awake = s === 'locked' ? '0' : '1';
    body.dataset.done = s === 'activated' || s === 'active' ? '1' : '0';
    statusEls.forEach((e) => (e.textContent = txt || COPY[s]));
  };
  set('locked');

  // pass reference derived from the email — an identifier, never a queue position
  const code = (e) => { let h = 2166136261; for (const c of e.toLowerCase()) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6); };
  let rollT;
  const setNo = (v) => passNos.forEach((e) => (e.textContent = v));
  const roll = (to) => {
    clearInterval(rollT);
    if (reduced) return setNo(to);
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'; let i = 0;
    rollT = setInterval(() => {
      setNo(to.split('').map((c, j) => (j < 4 + i / 2 ? c : A[(Math.random() * A.length) | 0])).join(''));
      if (++i > 12) { clearInterval(rollT); setNo(to); }
    }, 34);
  };
  let lastNo = '';
  setNo(EMPTY);

  input.addEventListener('focus', () => { if (body.dataset.pass === 'locked') set('ready'); });
  input.addEventListener('blur', () => { if (body.dataset.pass === 'ready' && !input.value.trim()) set('locked'); });
  input.addEventListener('input', () => {
    if (body.dataset.pass === 'error') { msg.textContent = ''; input.removeAttribute('aria-invalid'); set('ready'); }
    const v = input.value.trim(), ok = EMAIL.test(v), next = ok ? 'S02-' + code(v) : EMPTY;
    if (next !== lastNo) { lastNo = next; ok ? roll(next) : (clearInterval(rollT), setNo(EMPTY)); }
    if (body.dataset.pass === 'ready') statusEls.forEach((e) => (e.textContent = ok ? COPY.valid : COPY.ready));
  });
  // the whole pass is the hit area: touching it wakes it up
  surface && surface.addEventListener('click', (e) => {
    if (body.dataset.done !== '1' && !e.target.closest('a,button,input,label')) input.focus();
  });

  const submit = (email) => new Promise((res, rej) =>
    setTimeout(() => (q.has('fail') ? rej(new Error('network')) : res({ email })), 1400));

  const nudge = (cls) => { if (!surface) return; surface.classList.remove(cls); void surface.offsetWidth; surface.classList.add(cls); };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = body.dataset.pass; if (s === 'loading' || body.dataset.done === '1') return;
    const email = input.value.trim();
    if (!EMAIL.test(email)) {
      msg.textContent = 'Please enter a valid email.';
      input.setAttribute('aria-invalid', 'true');
      set('error', COPY.invalid); nudge('shake'); input.focus(); return;
    }
    msg.textContent = ''; input.removeAttribute('aria-invalid');
    set('loading'); cta.disabled = true; input.readOnly = true; ctaLbl.textContent = 'Activating…';
    // warm the success photo while we wait
    $$('img.ph-win[loading=lazy]').forEach((i) => (i.loading = 'eager'));
    try {
      await submit(email);
      $$('[data-holder]').forEach((h) => (h.textContent = email));
      clearInterval(rollT); setNo('S02-' + code(email));
      // beat 1: PASS ACTIVATED — the wipe crosses the object
      nudge('go'); set('activated');
      // beat 2: YOU'RE ON THE LIST
      setTimeout(() => {
        set('active');
        supports.forEach(([el]) => { if (el.dataset.success) el.innerHTML = el.dataset.success; });
        const d = $('[data-donefocus]'); d && d.focus({ preventScroll: true });
      }, reduced ? 0 : 1150);
    } catch (err) {
      msg.textContent = 'That didn’t go through. Try again.';
      set('error', COPY.network); nudge('shake');
    } finally {
      cta.disabled = false; input.readOnly = false; ctaLbl.textContent = 'Activate my pass';
    }
  });
  const reset = $('[data-reset]');
  reset && reset.addEventListener('click', () => {
    input.value = ''; lastNo = ''; setNo(EMPTY); surface && surface.classList.remove('go');
    supports.forEach(([el, html]) => (el.innerHTML = html));
    set('locked'); setTimeout(() => input.focus(), 60);
  });

  /* ---------------- dev comparison bar (?dev) ---------------- */
  if (q.has('dev')) {
    const keep = ['fail', 'dev'].filter((k) => q.has(k)).join('&');
    const here = location.pathname.split('/').pop() || 'index.html';
    const links = [['index.html', 'Current'], ['alt-01.html', 'Alt 01'], ['alt-02.html', 'Alt 02'], ['alt-03.html', 'Alt 03'], ['alt-04.html', 'Alt 04']];
    const bar = document.createElement('nav'); bar.className = 'devbar'; bar.setAttribute('aria-label', 'Layout comparison (dev only)');
    bar.innerHTML = links.map(([f, l]) => `<a href="${f}?${f === 'index.html' ? 'fail' : keep}"${f === here ? ' aria-current="page"' : ''}>${l}</a>`).join('') + '<a href="compare.html">Compare ↗</a>';
    body.appendChild(bar);
  }

  /* ---------------- motion: dormant when locked, alive once awake ---------------- */
  if (reduced) return;
  const tilts = $$('[data-tilt]'), pars = $$('[data-par]'), shifts = $$('[data-shift]'), lits = $$('[data-lit]'), bgs = $$('[data-bg]');
  const p = { x: 0, y: 0, tx: 0, ty: 0 }; let t = 0;
  addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; p.tx = e.clientX / innerWidth * 2 - 1; p.ty = e.clientY / innerHeight * 2 - 1; }, { passive: true });
  const loop = () => {
    if (!fine) { t += .008; p.tx = Math.sin(t) * .3; p.ty = Math.cos(t * .8) * .18; }
    p.x += (p.tx - p.x) * .07; p.y += (p.ty - p.y) * .07;
    const k = body.dataset.awake === '1' ? 1 : .45;   // the dormant pass barely moves
    tilts.forEach((el) => { const d = +el.dataset.tilt; el.style.setProperty('--ty', (p.x * d * k).toFixed(2) + 'deg'); el.style.setProperty('--tx', (p.y * -d * .75 * k).toFixed(2) + 'deg'); });
    pars.forEach((el) => { const d = +el.dataset.par; el.style.setProperty('--px', (p.x * -d).toFixed(1) + 'px'); el.style.setProperty('--py', (p.y * -d * .66).toFixed(1) + 'px'); });
    shifts.forEach((el) => { const d = +el.dataset.shift; el.style.translate = `${(p.x * d).toFixed(1)}px ${(p.y * d * .5).toFixed(1)}px`; });
    lits.forEach((el) => { el.style.setProperty('--lx', (50 + p.x * 40).toFixed(1) + '%'); el.style.setProperty('--ly', (30 + p.y * 30).toFixed(1) + '%'); });
    bgs.forEach((el) => { el.style.setProperty('--bx', (p.x * -14).toFixed(1) + 'px'); el.style.setProperty('--by', (p.y * -9).toFixed(1) + 'px'); });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if (fine && cta) addEventListener('pointermove', (e) => {
    const b = cta.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height / 2);
    const near = Math.abs(dx) < b.width / 2 + 36 && Math.abs(dy) < b.height / 2 + 36;
    cta.style.transform = near ? `translate(${(dx * .05).toFixed(1)}px,${(dy * .16).toFixed(1)}px)` : '';
  }, { passive: true });
})();
