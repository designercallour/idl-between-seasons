/* IDL waitlist — email capture state machine shared by all three concepts.
   States: idle → focus → (typing: valid|invalid) → loading → success | error
   The form keeps the existing app.idl.pro model: EMAIL → CTA → done.

   SUBMIT IS A STUB. Replace `IDLWaitlist.submit` with the voting-app endpoint
   when a concept is picked. Add ?fail to the URL to preview the network-error state. */
(function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const IDLWaitlist = {
    reduced,
    submit(email) {
      return new Promise((resolve, reject) => {
        setTimeout(() => (/[?&]fail\b/.test(location.search) ? reject(new Error('network')) : resolve({ email })), 1300);
      });
    },
    valid: (v) => EMAIL_RE.test(v.trim()),

    /* opts.copy: { placeholder, focus, cta, loading, invalid, network }
       opts.onState(state, detail) — concept-specific choreography */
    mount(form, opts = {}) {
      const copy = Object.assign({
        placeholder: 'YOUR EMAIL', focus: 'ENTER YOUR EMAIL', cta: 'GET ON THE LIST',
        loading: 'JOINING…', invalid: 'PLEASE ENTER A VALID EMAIL.', network: 'THAT DIDN’T GO THROUGH. TRY AGAIN.',
      }, opts.copy);
      const input = form.querySelector('input[type=email]');
      const btn = form.querySelector('.wl-btn');
      const lbl = btn.querySelector('.wl-lbl-text');
      const msg = form.querySelector('.wl-msg');
      let state = 'idle';

      input.placeholder = copy.placeholder;
      if (lbl) lbl.textContent = copy.cta;

      const set = (s, detail) => {
        state = s;
        form.dataset.state = s;
        opts.onState && opts.onState(s, detail || {});
        document.dispatchEvent(new CustomEvent('wl:state', { detail: { state: s, form, ...detail } }));
      };

      input.addEventListener('focus', () => { input.placeholder = copy.focus; if (state === 'idle') set('focus'); });
      input.addEventListener('blur', () => { input.placeholder = copy.placeholder; if (state === 'focus' && !input.value) set('idle'); });
      input.addEventListener('input', () => {
        const ok = IDLWaitlist.valid(input.value);
        form.dataset.valid = ok ? '1' : '0';
        if (state === 'error') { msg.textContent = ''; input.removeAttribute('aria-invalid'); set('focus'); }
        opts.onState && opts.onState('typing', { valid: ok, value: input.value });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (state === 'loading' || state === 'success') return;
        const email = input.value.trim();
        if (!IDLWaitlist.valid(email)) {
          msg.textContent = copy.invalid;
          input.setAttribute('aria-invalid', 'true');
          form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
          set('error', { reason: 'invalid' });
          input.focus();
          return;
        }
        input.removeAttribute('aria-invalid');
        msg.textContent = '';
        btn.disabled = true; input.readOnly = true;
        if (lbl) lbl.textContent = copy.loading;
        set('loading', { email });
        try {
          await IDLWaitlist.submit(email);
          set('success', { email });
        } catch (err) {
          msg.textContent = copy.network;
          set('error', { reason: 'network' });
        } finally {
          btn.disabled = false; input.readOnly = false;
          if (lbl) lbl.textContent = copy.cta;
        }
      });

      return {
        reset() { input.value = ''; form.dataset.valid = '0'; msg.textContent = ''; set('idle'); },
        input,
      };
    },

    /* Magnetic pull for CTAs on fine pointers */
    magnetic(el, strength = 0.28) {
      if (reduced || !matchMedia('(pointer:fine)').matches) return;
      const r = 90;
      addEventListener('pointermove', (e) => {
        const b = el.getBoundingClientRect();
        const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const inside = Math.abs(dx) < b.width / 2 + r && Math.abs(dy) < b.height / 2 + r;
        el.style.transform = inside ? `translate(${dx * strength}px, ${dy * strength * 0.6}px)` : '';
      }, { passive: true });
    },

    /* smoothed pointer (-1..1), shared by tilt / parallax effects */
    pointer() {
      const p = { x: 0, y: 0, tx: 0, ty: 0 };
      addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        p.tx = (e.clientX / innerWidth) * 2 - 1;
        p.ty = (e.clientY / innerHeight) * 2 - 1;
      }, { passive: true });
      p.tick = (k = 0.075) => { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; return p; };
      return p;
    },

    /* short stable code from an email — used as a pass reference, not a queue claim */
    code(email) {
      let h = 2166136261;
      for (const c of email.toLowerCase()) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
      return (h >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(-6);
    },
  };
  window.IDLWaitlist = IDLWaitlist;
})();
