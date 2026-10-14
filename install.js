/* GROW — install banner + offline download (same logic as SMILE).
   - The browser's install prompt is captured; the banner slides up 1.4 s after the splash ends (first opening).
   - Android / Chrome / Edge: "Install" opens the browser's install dialog (one tap).
   - iPhone / iPad: "Share → Add to Home Screen" instructions.
   - Dismissing is remembered; the "Install app" link (footer of Home / Settings) opens it again.
   - sw.js downloads the whole app on the first visit so it works offline. */
(function (G) {
  'use strict';
  let deferred = null, wanted = false;
  const listeners = [];
  const standalone = () => (G.matchMedia && G.matchMedia('(display-mode: standalone)').matches) || G.navigator.standalone === true;
  const ua = G.navigator.userAgent || '';
  const isIOS = /iphone|ipad|ipod/i.test(ua) || (G.navigator.platform === 'MacIntel' && G.navigator.maxTouchPoints > 1);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('grow:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('grow:' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };

  G.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; listeners.forEach((f) => f()); if (wanted) show(); });
  G.addEventListener('appinstalled', () => { deferred = null; store.set('installed', true); hide(true); document.querySelectorAll('.install-banner.ib-app').forEach((b) => b.remove()); toast('EMBRACE Portal installed! Open it from your home screen.'); });

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
    if (!host) el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:95;max-width:92vw';
    (host || document.body).appendChild(el); setTimeout(() => el.classList.add('out'), 4500); setTimeout(() => el.remove(), 5000);
  }

  function message() {
    if (isIOS) return { msg: 'Tap <b>Share</b> <span class="ib-ico">⬆︎</span>, then <b>Add to Home Screen</b>.', btn: 'Got it' };
    if (deferred) return { msg: 'Add EMBRACE Portal to your home screen — opens like an app and works offline.', btn: 'Install' };
    return { msg: 'Use your browser menu <b>⋮</b> and choose <b>“Install app”</b> or <b>“Add to Home screen”</b>.', btn: 'OK' };
  }

  /* ---------- floating banner (SMILE style) ---------- */
  function maybeShow() { if (standalone() || store.get('installed', false) || store.get('installDismissed', false)) return; wanted = true; show(); }
  function show() {
    let b = document.getElementById('installBanner');
    if (!b) {
      b = document.createElement('div'); b.id = 'installBanner'; b.className = 'install-float'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-labelledby', 'installTitle');
      b.innerHTML = `<img src="icons/icon-96.png" alt="" width="56" height="56"><div class="install-text"><strong id="installTitle">Install EMBRACE Portal</strong><span id="installMsg"></span></div>
        <div class="install-actions"><button type="button" class="ib-btn" id="installBtn">Install</button><button type="button" class="ib-x" id="installClose" aria-label="Dismiss">✕</button></div>`;
      document.body.appendChild(b);
      b.querySelector('#installBtn').addEventListener('click', doInstall);
      b.querySelector('#installClose').addEventListener('click', () => hide(true));
    }
    const m = message();
    b.querySelector('#installMsg').innerHTML = m.msg; b.querySelector('#installBtn').textContent = m.btn;
    b.classList.remove('out'); b.hidden = false;
  }
  function hide(remember) {
    const b = document.getElementById('installBanner');
    if (remember) store.set('installDismissed', true);
    wanted = false;
    if (!b || b.hidden) return;
    b.classList.add('out'); setTimeout(() => { b.hidden = true; }, 300);
  }
  async function doInstall() {
    if (deferred) {
      deferred.prompt();
      const r = await deferred.userChoice.catch(() => ({}));
      deferred = null;
      if (r && r.outcome === 'accepted') store.set('installed', true);
    }
    hide(true);
    listeners.forEach((f) => f());
  }

  /* ---------- inline card (Home / Settings) ---------- */
  function html(where) {
    if (standalone() || store.get('installed', false)) return '';
    if (where === 'home' && store.get('installDismissed', false) && !deferred) return '';
    const m = message();
    return `<div class="install-banner ib-app" role="region" aria-label="Install app"><span class="ib-logo"><img src="icons/icon-96.png" alt=""></span>
      <p><b>Install EMBRACE Portal.</b> ${m.msg}</p>${deferred ? '<button class="ib-btn" data-ib="install">Install</button>' : ''}<button class="ib-x" data-ib="close" aria-label="Close">✕</button></div>`;
  }
  function mount(container, where) {
    if (!container) return;
    if (container._ibDraw) { container._ibDraw(); return; }
    const draw = () => { const old = container.querySelector(':scope > .install-banner'); if (old) old.remove(); const h = html(where); if (h) container.insertAdjacentHTML('afterbegin', h); };
    container._ibDraw = draw; draw(); listeners.push(draw);
    container.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ib]'); if (!b) return;
      if (b.dataset.ib === 'close') { store.set('installDismissed', true); b.closest('.install-banner').remove(); }
      if (b.dataset.ib === 'install') doInstall();
    });
  }

  G.GrowInstall = { maybeShow, show, hide, mount, html, available: () => !standalone() && !store.get('installed', false) };
})(window);
