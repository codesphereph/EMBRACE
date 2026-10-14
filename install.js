/* EMBRACE Portal — one-button install.
   - Android / Chrome / Edge / Samsung Internet (phone & desktop): the "Install" button opens the browser's own install
     dialog immediately (beforeinstallprompt) — one tap on Install, one tap to confirm, and the app is on the home screen.
   - iPhone / iPad (Safari): Apple does not allow websites to install themselves, so the button opens a 2-step guide.
   - The banner slides up 1.4 s after the splash on first opening; closing it is remembered. "Install app" links reopen it.
   - sw.js downloads the whole app on the first visit so it works offline. */
(function (G) {
  'use strict';
  let deferred = null, wanted = false;
  const listeners = [];
  const standalone = () => (G.matchMedia && G.matchMedia('(display-mode: standalone)').matches) || G.navigator.standalone === true;
  const ua = G.navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (G.navigator.platform === 'MacIntel' && G.navigator.maxTouchPoints > 1);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('embrace:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('embrace:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  const LOGO = '<img src="icons/icon-96.png" alt="" width="52" height="52">';

  G.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); if (wanted) show(); });
  G.addEventListener('appinstalled', () => {
    deferred = null; store.set('installed', true); hide(true);
    document.querySelectorAll('.install-banner.ib-app').forEach((b) => b.remove());
    toast('✓ EMBRACE Portal installed. Open it from your home screen.');
  });

  /* offline download on first opening */
  if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.href)) {
    G.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then(() => navigator.serviceWorker.ready).then(() => {
        if (!store.get('offlineReady', false)) { store.set('offlineReady', true); toast('✓ Downloaded — EMBRACE Portal now works even without internet.'); }
      }).catch((err) => console.warn('SW failed', err));
    });
  }

  function toast(msg) {
    const host = document.getElementById('toasts');
    const el = document.createElement('div'); el.className = 'toast ok'; el.setAttribute('role', 'status'); el.textContent = msg;
    if (!host) el.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:95;max-width:92vw';
    (host || document.body).appendChild(el); setTimeout(() => el.classList.add('out'), 4500); setTimeout(() => el.remove(), 5000);
  }

  /* ---------- the one button ---------- */
  async function install() {
    if (!deferred && !isIOS) {
      // the browser may still be preparing its install offer (first seconds after loading) — wait briefly
      await new Promise((res) => { const t0 = Date.now(); const iv = setInterval(() => { if (deferred || Date.now() - t0 > 2500) { clearInterval(iv); res(); } }, 100); });
    }
    if (deferred) {
      const ev = deferred; deferred = null;
      ev.prompt();
      const r = await ev.userChoice.catch(() => ({}));
      if (r && r.outcome === 'accepted') { store.set('installed', true); hide(true); document.querySelectorAll('.install-banner.ib-app').forEach((b) => b.remove()); }
      listeners.forEach((f) => f());
      return;
    }
    guide();
  }

  /* fallback guide (iPhone/iPad, or browsers without an install API) */
  function guide() {
    const old = document.getElementById('installGuide'); if (old) old.remove();
    const g = document.createElement('div'); g.id = 'installGuide'; g.className = 'ig-wrap';
    const share = '<svg viewBox="0 0 24 24" class="ig-ic"><path d="M12 3v12M7 8l5-5 5 5M5 12v8h14v-8"/></svg>';
    const plus = '<svg viewBox="0 0 24 24" class="ig-ic"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>';
    const dots = '<svg viewBox="0 0 24 24" class="ig-ic"><circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/></svg>';
    g.innerHTML = `<div class="ig-sheet" role="dialog" aria-modal="true" aria-labelledby="igTitle"><button class="ib-x ig-x" aria-label="Close">✕</button>
      <div class="ig-head">${LOGO}<div><b id="igTitle">Install EMBRACE Portal</b><small>Takes 2 taps · works offline after</small></div></div>
      ${isIOS ? `<ol class="ig-steps"><li><span>${share}</span>Tap <b>Share</b> at the bottom of Safari</li><li><span>${plus}</span>Tap <b>Add to Home Screen</b>, then <b>Add</b></li></ol>`
        : `<ol class="ig-steps"><li><span>${dots}</span>Open the browser menu <b>⋮</b></li><li><span>${plus}</span>Tap <b>Install app</b> or <b>Add to Home screen</b></li></ol>
           <p class="ig-note">Tip: for one-tap install, open this page in <b>Chrome</b>, <b>Edge</b> or <b>Samsung Internet</b>.</p>`}
      <button class="ib-btn ig-ok">OK</button></div>`;
    document.body.appendChild(g);
    const close = () => g.remove();
    g.querySelector('.ig-x').onclick = close; g.querySelector('.ig-ok').onclick = () => { close(); hide(true); };
    g.addEventListener('click', (e) => { if (e.target === g) close(); });
  }

  /* ---------- floating banner ---------- */
  function maybeShow() { if (standalone() || store.get('installed', false) || store.get('installDismissed', false)) return; wanted = true; show(); }
  function show() {
    let b = document.getElementById('installBanner');
    if (!b) {
      b = document.createElement('div'); b.id = 'installBanner'; b.className = 'install-float'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-labelledby', 'installTitle');
      b.innerHTML = `${LOGO}<div class="install-text"><strong id="installTitle">EMBRACE Portal app</strong><span>Install on this device · works offline</span></div>
        <div class="install-actions"><button type="button" class="ib-btn ib-go" id="installBtn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Install</button>
        <button type="button" class="ib-x" id="installClose" aria-label="Not now">✕</button></div>`;
      document.body.appendChild(b);
      b.querySelector('#installBtn').addEventListener('click', install);
      b.querySelector('#installClose').addEventListener('click', () => hide(true));
    }
    b.classList.remove('out'); b.hidden = false;
  }
  function hide(remember) {
    const b = document.getElementById('installBanner');
    if (remember) store.set('installDismissed', true);
    wanted = false;
    if (!b || b.hidden) return;
    b.classList.add('out'); setTimeout(() => { b.hidden = true; }, 300);
  }

  /* ---------- inline card (Home / Settings) ---------- */
  function html(where) {
    if (standalone() || store.get('installed', false)) return '';
    if (where === 'home' && store.get('installDismissed', false)) return '';
    return `<div class="install-banner ib-app" role="region" aria-label="Install app"><span class="ib-logo"><img src="icons/icon-96.png" alt=""></span>
      <p><b>EMBRACE Portal app</b><br><small>Install on this device · works offline</small></p>
      <button class="ib-btn ib-go" data-ib="install"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Install</button><button class="ib-x" data-ib="close" aria-label="Close">✕</button></div>`;
  }
  function mount(container, where) {
    if (!container) return;
    if (container._ibDraw) { container._ibDraw(); return; }
    const draw = () => { const old = container.querySelector(':scope > .install-banner'); if (old) old.remove(); const h = html(where); if (h) container.insertAdjacentHTML('afterbegin', h); };
    container._ibDraw = draw; draw(); listeners.push(draw);
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ib]'); if (!b) return;
      if (b.dataset.ib === 'close') { store.set('installDismissed', true); b.closest('.install-banner').remove(); }
      if (b.dataset.ib === 'install') install();
    });
  }

  G.GrowInstall = { maybeShow, show, hide, mount, html, install, available: () => !standalone() && !store.get('installed', false) };
})(window);
