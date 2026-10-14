/* EMBRACE Portal — splash (logo) → EMBRACE Portal poster landing → install banner. Same flow as SMILE.
   Images are plain files: assets/hero.jpg (poster), assets/hero-sm.jpg, assets/hero-blur.jpg, assets/logo-circle.png. */
(function (G) {
  'use strict';
  const CFG = () => G.GROW_CONFIG || {};

  /* logo for headers */
  function logo() {
    return '<span class="brand-logo" role="img" aria-label="EMBRACE Portal"><img src="assets/logo-circle.png" alt="" width="44" height="44" draggable="false"></span>';
  }

  /* splash: the static #splash markup in index.html plays immediately; this ends it */
  function runSplash(after) {
    const splash = document.getElementById('splash');
    const reduce = G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!splash) { if (after) after(); return; }
    document.body.classList.add('is-splashing');
    let ended = false;
    const end = () => {
      if (ended) return; ended = true;
      splash.classList.add('leave'); document.body.classList.remove('is-splashing'); document.body.classList.add('reveal');
      setTimeout(() => splash.remove(), 800);
      if (after) after();
    };
    splash.addEventListener('click', end);
    setTimeout(end, reduce ? 300 : (CFG().SPLASH_MS || 2300));
  }

  /* full-screen poster landing */
  function show(onEnter, onStaff) {
    const splash = document.getElementById('splash');
    if (splash) splash.remove(); // keep it alive while the landing is drawn underneath
    document.body.innerHTML = `
    <div class="landing2" id="landing">
      <div class="lp-blur" aria-hidden="true"></div>
      <div class="lp-stage">
        <figure class="lp-poster">
          <img src="assets/hero.jpg" srcset="assets/hero-sm.jpg 512w, assets/hero.jpg 1024w" sizes="(max-width: 900px) 100vw, 600px" width="1024" height="1536" fetchpriority="high"
               alt="EMBRACE Portal — Expanded Micro Business Recovery Assistance during Crisis and Emergency. Loan support for MSMEs and OFWs. Office of the Local Economic Development and Investment Promotion Officer, Iloilo Province.">
          <span class="lp-shine" aria-hidden="true"></span><span class="lp-sun" aria-hidden="true"></span>
          <span class="lp-spark k1" aria-hidden="true"></span><span class="lp-spark k2" aria-hidden="true"></span><span class="lp-spark k3" aria-hidden="true"></span>
          <span class="lp-spark k4" aria-hidden="true"></span><span class="lp-spark k5" aria-hidden="true"></span><span class="lp-spark k6" aria-hidden="true"></span>
        </figure>
        <div class="lp-panel">
          <button class="btn-enter" id="enterBtn"><span>Enter the Portal</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
          <p class="lp-text">Prepare your <b>business plan</b>, <b>financial statements</b> and <b>EMBRACE loan requirements</b> step by step — even without internet.</p>
          <div class="land-feats"><span>✓ Libre / Free</span><span>✓ Works offline</span><span>✓ English · Filipino · Hiligaynon</span></div>
          <p class="grow-by">Office of the Local Economic Development and Investment Promotion Officer · Iloilo Province<br>
            <button type="button" class="link-btn" id="installLink" hidden>Install app</button> <a href="#admin" id="staffBtn">OLEDIPO Staff</a></p>
        </div>
      </div>
    </div><div id="toasts" aria-live="polite"></div>`;
    if (splash) document.body.appendChild(splash);
    const go = () => { if (G.GrowInstall) G.GrowInstall.hide(false); const l = document.getElementById('landing'); l.classList.add('leaving'); setTimeout(onEnter, G.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450); };
    document.getElementById('enterBtn').onclick = go;
    document.getElementById('staffBtn').onclick = (e) => { e.preventDefault(); if (G.GrowInstall) G.GrowInstall.hide(false); location.hash = '#admin'; if (onStaff) onStaff(); };
    const il = document.getElementById('installLink');
    if (G.GrowInstall && G.GrowInstall.available()) { il.hidden = false; il.onclick = () => G.GrowInstall.show(); }
    const land = document.getElementById('landing');
    land.addEventListener('pointermove', (e) => {
      land.style.setProperty('--px', (e.clientX / G.innerWidth - 0.5).toFixed(3)); land.style.setProperty('--py', (e.clientY / G.innerHeight - 0.5).toFixed(3));
    });
    runSplash(() => { setTimeout(() => { if (G.GrowInstall && document.getElementById('landing')) G.GrowInstall.maybeShow(); }, 1400); });
  }

  G.GrowLanding = { show, logo, runSplash };
})(window);
