/* EMBRACE Portal
   Main UI controller (vanilla JS, no external libraries, works offline). */
(function (G) {
  'use strict';
  const C = G.GrowCalc, D = G.GrowDocs, Store = G.GrowStore, API = G.GrowAPI, I = G.I18N;
  const t = (s) => I.t(s), tb = (s) => I.tb(s);
  const n = C.n, has = C.has, peso = C.peso;
  const esc = D.esc;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const S = {
    profile: null, session: null, settings: { lang: 'en', size: 1, contrast: false },
    ui: { fsYear: -1, fsTab: 'is', passTab: 'owner' }, online: navigator.onLine,
    sync: { state: 'idle', msg: '' }, admin: { token: null, list: null, current: null, filter: '', status: '' }
  };

  /* ================================================================ icons */
  const ICON = {
    home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    id: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.5"/><path d="M5.5 17c.7-2 2-3 3.5-3s2.8 1 3.5 3M14 10h5M14 13h4"/>',
    plan: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7M9 16h7M9 8h3"/>',
    chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
    loan: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 9v.01M18 15v.01"/>',
    docs: '<path d="M8 3h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 7v12a2 2 0 0 0 2 2"/><path d="M11 13l2 2 4-4"/>',
    cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    sound: '<path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
    bulb: '<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
    print: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    up: '<path d="M12 21V9M7 14l5-5 5 5M5 3h14"/>',
    cloud: '<path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    cloudOff: '<path d="M22.6 17A5 5 0 0 0 18 10h-1.3A8 8 0 0 0 5.3 5.3M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3M1 1l22 22"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
    cam: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    cap: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>',
    stamp: '<path d="M5 22h14M5 18h14v-3a3 3 0 0 0-3-3h-1V9a3 3 0 1 0-6 0v3H8a3 3 0 0 0-3 3z"/>',
    pen: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>',
    alert: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>',
    sprout: '<path d="M12 22V11"/><path d="M12 11C12 6 8 3 3 3c0 5 4 8 9 8zM12 13c0-4 3-7 9-7 0 4-3 7-9 7z"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'
  };
  const LOGO = () => (G.GrowLanding ? G.GrowLanding.logo() : '');
  const ic = (k, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${ICON[k] || ''}</svg>`;

  /* ================================================================ path helpers */
  function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o); }
  function setPath(o, p, v) {
    const ks = p.split('.'); let a = o;
    for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] == null || typeof a[ks[i]] !== 'object') a[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[ks[i]]; }
    a[ks[ks.length - 1]] = v;
  }
  let fid = 0;

  /* ================================================================ examples (sample answers) */
  const EX = {
    'plan.projectName': 'Additional cooking equipment and working capital for Nanay Liza\'s Batchoy House',
    'business.nature': 'Eatery / food service',
    'business.description': 'Nanay Liza\'s Batchoy House started in 2015 inside the public market. We serve La Paz-style batchoy, pancit and snacks to market vendors, shoppers and nearby households. The business is registered with DTI and has a Mayor\'s Permit. Sales dropped during the pandemic because the market was closed for 2 months. We want to buy a bigger stove and freezer and add new menu items.',
    'plan.productDescription': 'Batchoy is a noodle soup with round miki noodles, pork, liver and chicharon in a rich pork broth. We also sell pancit canton and puto. Food is cooked fresh every morning using our family recipe.',
    'plan.targetMarket': 'Market vendors, shoppers, tricycle drivers, students and families living near the public market. Also bulk orders for birthdays and barangay events.',
    'plan.marketArea': 'Public market and the poblacion barangays of the municipality',
    'plan.salesStrategy': 'Keep prices affordable, give "suki" discounts to regular customers, accept bulk orders with 1-day notice, and post the daily menu on our Facebook page.',
    'plan.competitors': 'Two other eateries in the market sell batchoy at ₱55–60.',
    'plan.advantage': 'Family recipe since 1990s, bigger servings, fast service, cleaner dining area.',
    'plan.process': '1) Buy fresh pork and noodles at the market at 5:00 AM. 2) Boil broth for 2 hours. 3) Prepare toppings. 4) Cook and serve per order from 7:00 AM to 6:00 PM. 5) Clean and record sales every evening.',
    'owner.experience': 'I have managed this eatery for 9 years. I learned cooking from my mother who sold batchoy in La Paz. I attended DTI\'s Basic Entrepreneurship and Food Safety seminars.',
    'plan.assumptions': 'Sales are based on the average daily sales of the last 6 months. Prices of raw materials are based on current public market prices.',
    'plan.summary': ''
  };

  /* ================================================================ field builder */
  function field(o) {
    const id = 'f' + (++fid);
    const val = getPath(S.profile, o.path);
    const v = val == null ? '' : val;
    const reqMark = o.req ? `<span class="req" title="${t('Required')}">*</span>` : (o.opt ? ` <span class="opt">(${t('Optional')})</span>` : '');
    const help = o.help ? `<div class="help">${o.help}${speakBtn(o.help)}</div>` : '';
    let input;
    const common = `id="${id}" data-bind="${o.path}" ${o.num ? 'data-num="1"' : ''} ${o.req ? 'aria-required="true"' : ''}`;
    const ph = o.ph ? `placeholder="${esc(o.ph)}"` : '';
    switch (o.type) {
      case 'textarea':
        input = `<textarea ${common} rows="${o.rows || 4}" ${ph}>${esc(v)}</textarea>`; break;
      case 'select':
        input = `<select ${common}><option value="">— ${t('Choose')} —</option>${o.options.map((x) => { const [val2, lab] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(val2)}" ${String(v) === String(val2) ? 'selected' : ''}>${esc(t(lab))}</option>`; }).join('')}</select>`; break;
      case 'radio':
        input = `<div class="chips" role="radiogroup" aria-labelledby="${id}l">${o.options.map((x) => { const [val2, lab] = Array.isArray(x) ? x : [x, x]; return `<label class="chip"><input type="radio" name="${id}" data-bind="${o.path}" value="${esc(val2)}" ${String(v) === String(val2) ? 'checked' : ''}><span>${t(lab)}</span></label>`; }).join('')}</div>`; break;
      case 'checks':
        input = `<div class="chips">${o.options.map((x) => `<label class="chip"><input type="checkbox" data-arr="${o.path}" value="${esc(x)}" ${(val || []).indexOf(x) >= 0 ? 'checked' : ''}><span>${esc(t(x))}</span></label>`).join('')}</div>`; break;
      case 'money':
        input = `<div class="affix"><span class="pre">₱</span><input ${common} type="text" inputmode="decimal" value="${esc(v)}" ${ph} autocomplete="off"></div>`; break;
      default:
        input = `<div class="affix">${o.pre ? `<span class="pre">${o.pre}</span>` : ''}<input ${common} type="${o.type || 'text'}" ${o.type === 'number' ? 'inputmode="decimal" step="any"' : ''} ${o.inputmode ? `inputmode="${o.inputmode}"` : ''} value="${esc(v)}" ${ph} ${o.max ? `maxlength="${o.max}"` : ''} autocomplete="${o.ac || 'off'}">${o.suf ? `<span class="suf">${o.suf}</span>` : ''}</div>`;
    }
    const ex = EX[o.path] && o.type === 'textarea'
      ? `<details class="example"><summary>${ic('bulb')} ${t('Example')}</summary><p>${esc(EX[o.path])}</p><button type="button" class="btn sm ghost" data-act="useEx" data-path="${o.path}">${t('Use this example')}</button></details>` : '';
    const missing = o.req && !has(val) && !(Array.isArray(val) && val.length) ? ' is-missing' : '';
    return `<div class="fld ${o.cls || ''}${missing}"><label id="${id}l" for="${id}">${tb(o.label)}${reqMark}</label>${help}${input}${ex}</div>`;
  }
  function speakBtn(text) {
    if (!('speechSynthesis' in G)) return '';
    return ` <button type="button" class="speak" data-act="speak" data-text="${esc(String(text).replace(/<[^>]+>/g, ''))}" aria-label="${t('Read aloud')}" title="${t('Read aloud')}">${ic('sound')}</button>`;
  }
  const row = (...cells) => `<div class="row">${cells.join('')}</div>`;

  /* table editor for arrays of objects */
  function tableEditor(path, cols, tpl, opts = {}) {
    const arr = getPath(S.profile, path) || [];
    const body = arr.map((it, i) => `<div class="trow" role="group" aria-label="${t('Row')} ${i + 1}">
        <span class="rnum">${i + 1}</span>
        ${cols.map((c) => {
          const p = `${path}.${i}.${c.k}`; const val = it[c.k] == null ? '' : it[c.k];
          let inp;
          if (c.type === 'select') inp = `<select data-bind="${p}" aria-label="${esc(c.label)}">${c.options.map((x) => { const [a, b] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(a)}" ${String(val) === String(a) ? 'selected' : ''}>${esc(t(b))}</option>`; }).join('')}</select>`;
          else if (c.type === 'calc') inp = `<output data-calc="${c.calc}" data-i="${i}" aria-label="${esc(c.label)}"></output>`;
          else inp = `<input data-bind="${p}" ${c.num ? 'data-num="1" inputmode="decimal"' : ''} type="${c.type === 'date' ? 'date' : 'text'}" value="${esc(val)}" placeholder="${esc(c.ph || '')}" aria-label="${esc(c.label)}">`;
          return `<label class="tcell ${c.w || ''}"><span class="tlab">${esc(t(c.label))}</span>${inp}</label>`;
        }).join('')}
        <button type="button" class="icon-btn danger" data-act="delRow" data-path="${path}" data-i="${i}" aria-label="${t('Remove')}" title="${t('Remove')}">${ic('trash')}</button>
      </div>`).join('');
    return `<div class="table-ed" data-path="${path}">
      <div class="thead"><span class="rnum">#</span>${cols.map((c) => `<span class="tcell ${c.w || ''}">${esc(t(c.label))}</span>`).join('')}<span class="icon-btn-sp"></span></div>
      ${body || `<p class="muted pad">${t('No rows yet.')}</p>`}
      <button type="button" class="btn sm ghost add" data-act="addRow" data-path="${path}" data-tpl="${tpl}">${ic('plus')} ${t(opts.addLabel || 'Add row')}</button></div>`;
  }
  const TPL = {
    product: () => ({ id: C.uid('pr'), name: '', unit: '', price: '', qty: '', per: 'day', unitCost: '', costing: { materials: '', labor: '', overhead: '', units: '' } }),
    opex: () => ({ label: '', amount: '' }),
    raw: () => ({ item: '', source: '' }),
    equip: () => ({ item: '' }),
    emp: () => ({ name: '', work: '', status: 'Permanent' }),
    fund: () => ({ item: '', qty: '1', unitCost: '', type: 'fixed', source: 'loan' }),
    goal: () => ({ goal: '', target: '', by: '' }),
    risk: () => ({ risk: '', mitigation: '' }),
    training: () => ({ id: C.uid('tr'), title: '', kind: 'Training', provider: '', date: '', hours: '', topics: '', skills: '', certificateDocId: '' })
  };

  /* ================================================================ persistence */
  let saveTimer = null, syncTimer = null;
  function touch() {
    S.profile.meta.updatedAt = new Date().toISOString();
    S.profile.meta.dirty = true;
    setSaveState('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(persist, 500);
  }
  function persist() {
    const ov = C.overall(S.profile);
    S.profile.meta.completeness = ov.pct;
    S.profile.meta.missing = ov.missing.map((m) => m.msg);
    if (ov.pct === 100 && !S.profile.meta.readyAt) S.profile.meta.readyAt = new Date().toISOString();
    return Store.saveProfile(S.profile).then(() => {
      setSaveState('saved');
      if (S.session && S.online) { clearTimeout(syncTimer); syncTimer = setTimeout(() => sync(), 4000); }
    }).catch((e) => { setSaveState('error'); console.error(e); toast('Could not save on this device: ' + e.message, 'err'); });
  }
  function setSaveState(s) {
    const el = $('#saveState'); if (!el) return;
    el.dataset.state = s;
    el.textContent = s === 'saving' ? t('Saving…') : s === 'error' ? 'Save error' : t('Saved on this device');
  }

  /* ================================================================ sync */
  function syncLabel() {
    if (!S.online && !API.isGas()) return { cls: 'off', icon: 'cloudOff', text: t('Offline') + ' · ' + t('Saved on this device') };
    if (!API.configured()) return { cls: 'local', icon: 'lock', text: t('Saved on this device') };
    if (!S.session) return { cls: 'local', icon: 'cloudOff', text: t('Not linked to online account') };
    if (S.sync.state === 'busy') return { cls: 'busy', icon: 'cloud', text: 'Syncing…' };
    if (S.sync.state === 'error') return { cls: 'warn', icon: 'alert', text: S.sync.msg || 'Sync problem' };
    if (S.profile && S.profile.meta.dirty) return { cls: 'warn', icon: 'cloud', text: t('Not synced yet') };
    return { cls: 'ok', icon: 'cloud', text: t('Synced') + (S.session.lastSync ? ' ' + new Date(S.session.lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '') };
  }
  function renderSyncPill() {
    const el = $('#syncPill'); if (!el) return;
    const s = syncLabel();
    el.className = 'pill ' + s.cls; el.innerHTML = ic(s.icon) + `<span>${esc(s.text)}</span>`;
  }
  async function sync(opts = {}) {
    if (!S.session || !API.configured() || (!S.online && !API.isGas()) || S.sync.state === 'busy') { renderSyncPill(); return; }
    S.sync.state = 'busy'; renderSyncPill();
    try {
      // 1) upload documents that are only on this device
      for (const d of S.profile.documents) {
        if (d.driveId) continue;
        const f = await Store.getFile(d.id);
        if (!f) continue;
        const r = await API.call({ action: 'uploadFile', token: S.session.token, file: { id: d.id, name: d.name, mime: d.mime, category: d.category, data: f.data } });
        d.driveId = r.driveId;
      }
      // 2) save profile
      const body = JSON.parse(JSON.stringify(S.profile)); delete body.review;
      const r = await API.call({ action: 'save', token: S.session.token, profile: body, baseUpdatedAt: S.profile.meta.serverUpdatedAt || '', force: !!opts.force })
        .catch((e) => { if (e.data && e.data.conflict) return e.data; throw e; });
      if (r.conflict) { S.sync.state = 'idle'; renderSyncPill(); return resolveConflict(r); }
      S.profile.meta.serverUpdatedAt = r.serverUpdatedAt; S.profile.meta.dirty = false; S.profile.review = r.review;
      S.session.lastSync = Date.now(); await Store.setSecure('session', S.session);
      await Store.saveProfile(S.profile);
      S.sync = { state: 'idle', msg: '' };
      if (opts.toast) toast('Synced with OLEDIPO server.', 'ok');
    } catch (e) {
      S.sync = { state: 'error', msg: /sign in/i.test(e.message) ? 'Please sign in again' : 'Will retry when online' };
      if (/sign in|session/i.test(e.message)) { S.session = null; await Store.setSecure('session', null); }
      if (opts.toast) toast(e.message, 'err');
    }
    renderSyncPill();
  }
  function resolveConflict(r) {
    const theirs = r.profile;
    modal(`<h2>Two different versions</h2><p>Your online Passport was changed on another device (${esc(new Date(r.serverUpdatedAt).toLocaleString())}).</p>
      <p>Which version do you want to keep?</p>
      <div class="btns"><button class="btn" data-act="conflictMine">Keep this device's version</button><button class="btn ghost" data-act="conflictTheirs">Use the online version</button></div>`);
    S._conflict = { theirs, serverUpdatedAt: r.serverUpdatedAt };
  }

  /* ================================================================ toast / modal */
  function toast(msg, kind) {
    const el = document.createElement('div'); el.className = 'toast ' + (kind || ''); el.setAttribute('role', 'status'); el.textContent = msg;
    $('#toasts').appendChild(el); setTimeout(() => el.classList.add('out'), 3800); setTimeout(() => el.remove(), 4300);
  }
  function modal(html, cls) {
    closeModal();
    const m = document.createElement('div'); m.id = 'modal'; m.className = 'modal-wrap';
    m.innerHTML = `<div class="modal ${cls || ''}" role="dialog" aria-modal="true"><button class="icon-btn close" data-act="closeModal" aria-label="${t('Close')}">${ic('x')}</button>${html}</div>`;
    document.body.appendChild(m);
    const f = m.querySelector('input,button.btn,select,textarea'); if (f) f.focus();
  }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  /* ================================================================ shell */
  const NAV = [
    ['#home', 'home', 'Home'], ['#passport', 'id', 'Passport'], ['#plan', 'plan', 'Plan'], ['#finance', 'chart', 'Finance'],
    ['#loan', 'loan', 'Loan'], ['#docs', 'docs', 'Docs']
  ];
  function shell() {
    document.body.innerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <header class="top">
        <a class="brand" href="#home" aria-label="EMBRACE Portal home">${LOGO()}<span><b>EMBRACE Portal</b><small>Expanded Micro Business Recovery Assistance during Crisis and Emergency</small></span></a>
        <div class="top-r">
          <span id="syncPill" class="pill" role="status" aria-live="polite"></span>
          <label class="lang">${ic('globe')}<select id="langSel" aria-label="${t('Language')}">${Object.entries(I.LANGS).map(([k, v]) => `<option value="${k}" ${S.settings.lang === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
          <a class="icon-btn" href="#settings" aria-label="${t('Settings')}" title="${t('Settings')}">${ic('cog')}</a>
        </div>
      </header>
      <nav class="side" aria-label="Main">${NAV.map(([h, i, l]) => `<a href="${h}" data-nav="${h}">${ic(i)}<span>${t(l)}</span></a>`).join('')}
        <a href="#programs" data-nav="#programs" class="desk-only">${ic('globe')}<span>${t('Programs')}</span></a>
        <a href="#settings" data-nav="#settings" class="desk-only">${ic('cog')}<span>${t('Settings')}</span></a>
        <div class="side-foot desk-only"><span id="saveState" aria-live="polite">${t('Saved on this device')}</span></div>
      </nav>
      <main id="main" tabindex="-1"></main>
      <div id="toasts" aria-live="polite"></div>`;
    renderSyncPill();
  }
  function applySettings() {
    document.documentElement.style.setProperty('--scale', S.settings.size);
    document.documentElement.classList.toggle('hc', !!S.settings.contrast);
    I.set(S.settings.lang);
  }

  /* ================================================================ router */
  function route() {
    const h = location.hash || '#home';
    const [base, sub] = h.slice(1).split('/');
    if (base === 'admin') return renderAdmin();
    if (!S.profile) return;
    if (S.shellMode !== 'app') { shell(); S.shellMode = 'app'; }
    fid = 0;
    $$('[data-nav]').forEach((a) => a.classList.toggle('on', a.dataset.nav === '#' + base));
    const views = { home: vHome, passport: vPassport, plan: vPlan, finance: vFinance, loan: vLoan, docs: vDocs, settings: vSettings, programs: vPrograms };
    const fn = views[base] || vHome;
    const main = $('#main');
    main.innerHTML = fn(sub);
    if (base !== 'settings' && base !== 'programs') { S.profile.meta.lastRoute = h; }
    refreshCalcs();
    main.focus({ preventScroll: true });
    window.scrollTo(0, 0);
    $$('.stepper li.on, .tabs .on, .years .on').forEach((el) => { const p = el.parentElement; p.scrollLeft = el.offsetLeft - p.offsetLeft - 16; });
    if (base === 'programs') loadPrograms();
    if (base === 'loan' && G.GrowLoans && $('#loanAcct')) G.GrowLoans.after();
    if (base === 'settings' && G.GrowInstall && $('#setInstall')) { localStorage.removeItem && (function () { try { localStorage.removeItem('growInstallLater'); } catch (e) { /* ignore */ } })(); G.GrowInstall.mount($('#setInstall'), 'app'); }
    if (base === 'home' && G.GrowInstall) G.GrowInstall.mount(main, 'app');
  }

  /* ================================================================ VIEWS */
  function ring(pct, size = 64, label) {
    const r = (size - 8) / 2, c = 2 * Math.PI * r;
    return `<div class="ring" style="--s:${size}px" role="img" aria-label="${label || ''} ${pct}%"><svg viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="bg"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" class="fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}"/></svg><b>${pct}%</b></div>`;
  }
  function issuesBox(list, title) {
    if (!list.length) return `<div class="okbox">${ic('check')} ${t('Nothing missing here.')}</div>`;
    return `<div class="issues"><h3>${ic('alert')} ${t(title || 'Issues to fix')}</h3><ul>${list.map((i) => `<li class="sev-${i.sev || 'missing'}">${i.route ? `<a href="${i.route}">${esc(i.msg)}</a>` : esc(i.msg)}</li>`).join('')}</ul></div>`;
  }
  function missingList(comp) { return comp.missing.map((m) => ({ sev: 'missing', msg: t('Missing') + ': ' + m.msg, route: m.route })); }

  /* ---------------------------------------------------------------- HOME */
  function vHome() {
    const p = S.profile, ov = C.overall(p);
    const name = p.owner.firstName ? esc(p.owner.firstName) : '';
    const days = Math.max(1, Math.ceil((Date.now() - new Date(p.meta.createdAt)) / 864e5));
    const cards = [
      ['#passport', 'id', 'MSME Enterprise Passport', ov.parts.passport.pct, 'Your profile, business, trainings and documents — fill in once, reuse many times.'],
      ['#plan/1', 'plan', 'Business Plan', ov.parts.plan.pct, 'Step-by-step Annex D business plan with automatic costing, forecast and cash flow.'],
      ['#finance', 'chart', 'Financial Statements', ov.parts.fs.pct, 'Income statement, balance sheet and cash flow — computed for you.'],
      ['#loan', 'loan', 'EMBRACE Loan', ov.parts.loan.pct, 'Eligibility self-check, requirements checklist and amortization.']
    ];
    const empty = !p.owner.firstName && !p.business.name;
    const st = p.review && p.review.status && p.review.status !== 'Draft' ? p.review.status : '';
    return `<section class="hero">
        <div><h1>${t('Welcome to EMBRACE Portal')}${name ? ', ' + name : ''}!</h1>
        <p class="lead">Prepare your business plan, financial statements and EMBRACE loan requirements — step by step, in simple language, ${t('Works even without internet').toLowerCase()}.</p>
        ${p.meta.lastRoute && p.meta.lastRoute !== '#home' ? `<a class="btn big" href="${esc(p.meta.lastRoute)}">${t('Continue where you left off')} ${ic('arrowR')}</a>` : `<a class="btn big" href="#passport/owner">${t('Get started')} ${ic('arrowR')}</a>`}
        ${empty ? `<button class="btn ghost" data-act="loadSample">${t('Load sample business')}</button>` : ''}</div>
        <div class="hero-ring">${ring(ov.pct, 120, t('Readiness'))}<span>${t('Readiness')}</span><small>${t('Days since you started')}: ${days}</small></div>
      </section>
      ${st ? `<div class="status-banner">${ic('send')} Application status: <b>${esc(st)}</b>${p.review.remarks ? ' — ' + esc(p.review.remarks) : ''}</div>` : ''}
      ${G.GrowLoans ? G.GrowLoans.homeCard() : ''}
      <h2 class="sec">${t('Your progress')}</h2>
      <div class="cards">${cards.map(([h, i, l, pct, d]) => `<a class="card mod" href="${h}">${ic(i, 'big')}<div><h3>${t(l)}</h3><p>${d}</p></div>${ring(pct, 56, t(l))}</a>`).join('')}</div>
      <div class="grid2">
        <section class="panel"><h2>${ic('alert')} Next things to fill in</h2>
          ${ov.missing.length ? `<ol class="todo">${ov.missing.slice(0, 6).map((m) => `<li><a href="${m.route}">${esc(m.msg)}</a></li>`).join('')}</ol>${ov.missing.length > 6 ? `<p class="muted">+ ${ov.missing.length - 6} more</p>` : ''}` : `<div class="okbox">${ic('check')} Everything is filled in. Go to <a href="#docs">Documents</a> to print.</div>`}
        </section>
        <section class="panel"><h2>${ic('docs')} ${t('Quick actions')}</h2>
          <div class="qa"><a class="btn ghost" href="#docs">${ic('print')} Print documents</a><a class="btn ghost" href="#passport/documents">${ic('cam')} Upload a permit / photo</a>
          <a class="btn ghost" href="#passport/trainings">${ic('cap')} Add a training</a><a class="btn ghost" href="#programs">${ic('globe')} ${t('Programs')}</a></div>
        </section>
      </div>
      <p class="disclaimer">${ic('alert')} ${t('This app does not guarantee loan approval.')} Final evaluation is done by the EMBRACE Technical Working Group.</p>`;
  }

  /* ---------------------------------------------------------------- PASSPORT */
  const PTABS = [['owner', 'Entrepreneur'], ['business', 'Business'], ['financial', 'Financial'], ['trainings', 'Trainings'], ['documents', 'Documents'], ['needs', 'Development needs']];
  function tabs(base, list, cur) {
    return `<div class="tabs" role="tablist">${list.map(([k, l]) => `<a role="tab" href="${base}/${k}" class="${cur === k ? 'on' : ''}" aria-selected="${cur === k}">${t(l)}</a>`).join('')}</div>`;
  }
  function vPassport(sub) {
    sub = sub || 'owner';
    const p = S.profile;
    const head = `<div class="page-head"><div><h1>${t('MSME Enterprise Passport')}</h1><p class="muted">${p.passportId ? 'Passport ID <b>' + esc(p.passportId) + '</b> · ' : ''}Fill in once — the portal reuses this in every form.</p></div>
      <button class="btn ghost" data-act="doc" data-doc="passport">${ic('eye')} ${t('Preview')}</button></div>` + tabs('#passport', PTABS, sub);
    const body = { owner: pOwner, business: pBusiness, financial: pFinancial, trainings: pTrainings, documents: pDocuments, needs: pNeeds }[sub] || pOwner;
    const idx = PTABS.findIndex((x) => x[0] === sub);
    const nav = `<div class="stepnav">${idx > 0 ? `<a class="btn ghost" href="#passport/${PTABS[idx - 1][0]}">${ic('arrowL')} ${t('Back')}</a>` : '<span></span>'}
      ${idx < PTABS.length - 1 ? `<a class="btn" href="#passport/${PTABS[idx + 1][0]}">${t('Next')}: ${t(PTABS[idx + 1][1])} ${ic('arrowR')}</a>` : `<a class="btn" href="#plan/1">${t('Next')}: ${t('Business Plan')} ${ic('arrowR')}</a>`}</div>`;
    return head + `<div class="form-card">${body()}</div>` + nav;
  }
  const PROV = ['Iloilo', 'Iloilo City', 'Guimaras', 'Antique', 'Capiz', 'Aklan', 'Negros Occidental', 'Other'];
  function addrFields(base) {
    return row(field({ path: base + '.lot', label: 'Lot / House No.', opt: true, cls: 'w1' }), field({ path: base + '.street', label: 'Street / Sitio / Purok', opt: true, cls: 'w2' })) +
      row(field({ path: base + '.brgy', label: 'Barangay', req: true, cls: 'w2' }), field({ path: base + '.municipality', label: 'Municipality / City', req: true, cls: 'w2', ph: 'e.g. Zarraga' })) +
      row(field({ path: base + '.province', label: 'Province', type: 'select', options: PROV, req: true, cls: 'w2' }), field({ path: base + '.zip', label: 'Zip code', opt: true, inputmode: 'numeric', max: 4, cls: 'w1' }));
  }
  function pOwner() {
    return `<h2>${t('Entrepreneur')} — Annex A Part A</h2>` +
      row(field({ path: 'owner.lastName', label: 'Last name', req: true, ac: 'family-name' }), field({ path: 'owner.firstName', label: 'First name', req: true, ac: 'given-name' }), field({ path: 'owner.middleName', label: 'Middle name', opt: true, ac: 'additional-name' })) +
      row(field({ path: 'owner.dob', label: 'Date of birth', type: 'date', req: true }), field({ path: 'owner.sex', label: 'Sex', type: 'radio', options: ['Male', 'Female'], req: true })) +
      field({ path: 'owner.civilStatus', label: 'Civil status', type: 'radio', options: ['Single', 'Married', 'Widow/er', 'Legally Separated'], req: true }) +
      `<h3>${t('Home address')}</h3>` + addrFields('owner.address') +
      field({ path: 'owner.district', label: 'District', type: 'radio', options: [['1', '1st'], ['2', '2nd'], ['3', '3rd'], ['4', '4th'], ['5', '5th']], req: true, help: 'Your congressional district in Iloilo Province. Ask your barangay if unsure.' }) +
      field({ path: 'owner.residentSinceYear', label: 'Living in this barangay since (year)', inputmode: 'numeric', max: 4, opt: true, help: 'Used for the Barangay Certificate of Residency (Annex C).' }) +
      `<h3>Contact</h3>` +
      row(field({ path: 'owner.contact', label: 'Mobile number', type: 'tel', req: true, ph: '09XXXXXXXXX', ac: 'tel' }), field({ path: 'owner.email', label: 'Email address', type: 'email', opt: true, ac: 'email' })) +
      row(field({ path: 'owner.facebook', label: 'Facebook account', opt: true }), field({ path: 'owner.tin', label: 'TIN No.', opt: true, inputmode: 'numeric' }), field({ path: 'owner.banks', label: 'Bank affiliations', opt: true, ph: 'e.g. LANDBANK savings' })) +
      `<h3>Background</h3>` +
      row(field({ path: 'owner.role', label: 'Role in the business', type: 'select', options: ['Owner', 'Co-owner / Partner', 'Manager', 'Family member helping'] }), field({ path: 'owner.education', label: 'Highest education', type: 'select', options: ['Elementary', 'High school', 'Senior high / Vocational', 'College', 'Post-graduate'], opt: true })) +
      field({ path: 'owner.experience', label: 'Business experience and qualification', type: 'textarea', req: true, help: 'How long have you been in business? Where did you learn your skills? Any trainings?' });
  }
  function pBusiness() {
    return `<h2>${t('Business')} — Annex A Part B</h2>` +
      field({ path: 'business.name', label: 'Business name', req: true, ph: "e.g. Nanay Liza's Batchoy House" }) +
      `<h3>${t('Business address')}</h3><button type="button" class="btn sm ghost" data-act="copyAddr">Same as home address</button>` + addrFields('business.address') +
      row(field({ path: 'business.startYear', label: 'Year the business started', req: true, inputmode: 'numeric', max: 4, ph: 'e.g. 2015' }), `<div class="fld"><label>Years in operation</label><output class="big-out" data-calc="yrsOp"></output></div>`) +
      row(field({ path: 'business.type', label: 'Business type', type: 'radio', options: ['Manufacturing/Processing', 'Trading', 'Service'], req: true, help: 'Manufacturing = you make products. Trading = you buy and resell. Service = you sell services (eatery, salon, repair).' })) +
      row(field({ path: 'business.ownership', label: 'Ownership', type: 'radio', options: ['Single Proprietorship', 'Partnership', 'Others'], req: true })) +
      field({ path: 'business.nature', label: 'Nature of business', ph: 'e.g. Eatery, Sari-sari store, Feeds retailing', opt: true }) +
      `<h3>${t('Number of employees')} <small class="muted">(not counting yourself)</small></h3>` +
      row(field({ path: 'business.employees.male', label: 'Male', inputmode: 'numeric', num: 1, cls: 'w1' }), field({ path: 'business.employees.female', label: 'Female', inputmode: 'numeric', num: 1, cls: 'w1' }), `<div class="fld w1"><label>Total</label><output class="big-out" data-calc="empTotal"></output></div>`) +
      `<p class="muted small">Employment status (number of employees):</p>` +
      row(...['permanent', 'contractual', 'casual', 'seasonal', 'others'].map((k) => field({ path: 'business.employment.' + k, label: k.charAt(0).toUpperCase() + k.slice(1), inputmode: 'numeric', cls: 'w1' }))) +
      field({ path: 'business.registrations', label: 'Registration (check all that apply)', type: 'checks', options: ['DTI', "Mayor's Permit", 'SEC', 'Barangay Permit', 'BIR', 'CDA', 'FDA'] }) +
      field({ path: 'business.regNumbers', label: 'Registration numbers', opt: true, ph: 'e.g. DTI 1234567, Mayor\'s Permit 2026-0456' }) +
      `<h3>${t('Products or services')}</h3><div class="row">${[0, 1, 2, 3, 4].map((i) => field({ path: 'business.products.' + i, label: (i + 1) + '.', req: i === 0, cls: 'w2' })).join('')}</div>` +
      `<h3>Capital and sales</h3>` +
      row(field({ path: 'business.capital', label: 'Capital', type: 'money', req: true, help: 'How much money is invested in the business now.' }), field({ path: 'business.annualSales', label: 'Annual gross sales (latest)', type: 'money', req: true }), field({ path: 'business.netAssets', label: 'Business net assets (latest)', type: 'money', req: true, help: 'Total assets minus debts. You can copy this from your Balance Sheet.' })) +
      `<button type="button" class="btn sm ghost" data-act="fillFromFs">Fill sales and net assets from my Financial Statements</button>` +
      field({ path: 'business.description', label: 'Brief description of the business', type: 'textarea', req: true, help: 'When did it start? What do you sell? Who are your customers? What happened during the crisis?' }) +
      field({ path: 'business.operations', label: 'Operations (days and hours open, how you operate)', type: 'textarea', rows: 2, opt: true, ph: 'e.g. Open Monday to Saturday, 6 AM to 6 PM' });
  }
  function pFinancial() {
    const lf = C.latestFs(S.profile), pc = C.planCalc(S.profile), b = S.profile.business;
    return `<h2>Financial profile</h2><p class="muted">Summary from your Financial Statements and Business Plan. Edit the numbers in those sections.</p>
      <div class="stats">
        <div class="stat"><span>Capital</span><b>${has(b.capital) ? peso(n(b.capital)) : '—'}</b></div>
        <div class="stat"><span>Annual gross sales</span><b>${has(b.annualSales) ? peso(n(b.annualSales)) : '—'}</b></div>
        <div class="stat"><span>Net assets</span><b>${has(b.netAssets) ? peso(n(b.netAssets)) : '—'}</b></div>
        ${lf ? `<div class="stat"><span>Net income ${lf.y.year} ${lf.y.basis === 'estimate' ? '(estimate)' : ''}</span><b>${peso(lf.c.net)}</b></div>` : ''}
        <div class="stat"><span>Projected monthly sales</span><b>${pc.salesM ? peso(pc.salesM) : '—'}</b></div>
        <div class="stat"><span>Financing requirement</span><b>${pc.loan.amount ? peso(pc.loan.amount) : '—'}</b></div>
      </div>
      <div class="btns"><a class="btn ghost" href="#finance">${ic('chart')} ${t('Financial Statements')}</a><a class="btn ghost" href="#plan/6">${ic('plan')} ${t('Sales Forecast & Cash Flow')}</a><a class="btn ghost" href="#loan">${ic('loan')} ${t('EMBRACE Loan')}</a></div>`;
  }
  function verBadge(id) {
    const v = S.profile.review && S.profile.review.verified && S.profile.review.verified[id];
    return v ? `<span class="badge ver">${ic('check')} ${t('Verified by OLEDIPO')}</span>` : `<span class="badge self">${t('Self-reported')}</span>`;
  }
  function pTrainings() {
    const p = S.profile;
    const certs = p.documents.filter((d) => d.category === 'Training Certificate');
    return `<h2>${t('Trainings')} &amp; capacity development</h2>
      <p class="help">Record trainings, seminars, workshops, coaching or mentoring you attended. These help OLEDIPO recommend support for you. They are <b>not</b> loan requirements unless officially required (OFW applicants need a Basic Entrepreneurship Training certificate).${speakBtn('Record trainings, seminars, workshops, coaching or mentoring you attended.')}</p>
      ${p.trainings.map((tr, i) => `<div class="sub-card"><div class="sub-head"><b>${i + 1}. ${esc(tr.title || 'New training')}</b> ${verBadge(tr.id)}<button class="icon-btn danger" data-act="delRow" data-path="trainings" data-i="${i}" aria-label="${t('Remove')}">${ic('trash')}</button></div>
        ${row(field({ path: `trainings.${i}.title`, label: 'Training title', req: true, cls: 'w3' }), field({ path: `trainings.${i}.kind`, label: 'Type', type: 'select', options: ['Training', 'Seminar', 'Workshop', 'Coaching', 'Mentoring', 'Webinar'] }))}
        ${row(field({ path: `trainings.${i}.provider`, label: 'Provider', ph: 'e.g. DTI Iloilo, LEDIP Center, TESDA' }), field({ path: `trainings.${i}.date`, label: 'Date', type: 'date' }), field({ path: `trainings.${i}.hours`, label: 'Hours', inputmode: 'decimal', cls: 'w1' }))}
        ${row(field({ path: `trainings.${i}.topics`, label: 'Topics', cls: 'w2' }), field({ path: `trainings.${i}.skills`, label: 'Skills acquired', cls: 'w2' }))}
        <div class="fld"><label>Certificate</label><div class="row"><select data-bind="trainings.${i}.certificateDocId"><option value="">— none —</option>${certs.map((d) => `<option value="${d.id}" ${tr.certificateDocId === d.id ? 'selected' : ''}>${esc(d.name)}</option>`).join('')}</select>
        <label class="btn sm ghost file-btn">${ic('cam')} Upload certificate<input type="file" accept="image/*,application/pdf" data-upload="Training Certificate" data-link="trainings.${i}.certificateDocId" hidden></label></div></div>
      </div>`).join('') || `<p class="muted">No trainings recorded yet.</p>`}
      <button class="btn ghost" data-act="addRow" data-path="trainings" data-tpl="training">${ic('plus')} Add a training</button>`;
  }
  function pDocuments() {
    const p = S.profile;
    return `<h2>${t('Documents')}</h2>
      <p class="help">Take a clear photo or choose a PDF of your permits, certificates and records. Files are stored securely on this device and, when you are online with an account, saved in OLEDIPO's Google Drive. AI can then check each one for completeness.${speakBtn('Take a clear photo or choose a PDF of your permits, certificates and records.')}</p>
      <div class="upload-box"><label for="upCat">Document type</label><select id="upCat">${C.DOC_CATEGORIES.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
        <label class="btn big file-btn">${ic('cam')} ${t('Take photo / choose file')}<input type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" data-upload="#upCat" hidden></label>
        <small class="muted">PDF, photo, Word or Excel · up to 5 MB. Photos are resized to save space.</small></div>
      <ul class="doclist">${p.documents.map((d) => `<li><div><b>${esc(d.category)}</b><span>${esc(d.name)} · ${(d.size / 1024).toFixed(0)} KB · ${C.fmtDate(d.addedAt)}</span></div>
        ${verBadge(d.id)} ${d.driveId ? `<span class="badge">${ic('cloud')} uploaded</span>` : ''}
        <button class="icon-btn" data-act="viewFile" data-id="${d.id}" aria-label="View">${ic('eye')}</button>
        <button class="icon-btn danger" data-act="delDoc" data-id="${d.id}" aria-label="${t('Remove')}">${ic('trash')}</button>${G.GrowAI ? G.GrowAI.docBlock(d) : ''}</li>`).join('') || '<li class="muted">No documents yet.</li>'}</ul>`;
  }
  function pNeeds() {
    const sug = C.suggestedNeeds(S.profile);
    return `<h2>${t('Development needs')}</h2><p class="help">What would you like to learn or improve? This helps OLEDIPO plan trainings and technical assistance.${speakBtn('What would you like to learn or improve?')}</p>
      ${sug.length ? `<div class="hint">${ic('bulb')} Suggested from your answers: ${sug.map((s) => `<button class="chip-btn" data-act="addNeed" data-v="${esc(s)}">${esc(s)} +</button>`).join(' ')}</div>` : ''}
      ${field({ path: 'needs', label: 'Topics', type: 'checks', options: C.NEEDS })}
      ${field({ path: 'needsOther', label: 'Others', opt: true })}`;
  }

  /* ---------------------------------------------------------------- PLAN */
  const STEPS = ['Business Profile', 'Products & Target Market', 'Marketing & Sales', 'Operations & Management', 'Costing & Pricing',
    'Sales Forecast & Cash Flow', 'Financing & Use of Funds', 'Break-even & Goals', 'Risks & Mitigation', 'Review & Generate'];
  function vPlan(sub) {
    const step = Math.min(10, Math.max(1, parseInt(sub, 10) || 1));
    const comp = C.completenessOf(S.profile, 'plan');
    const stepMissing = comp.missing.filter((m) => m.route === '#plan/' + step);
    const fns = [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10];
    return `<div class="page-head"><div><h1>${t('Business Plan')} <small class="muted">Annex D</small></h1><p class="muted">${t('Step')} ${step} ${t('of')} 10 · ${comp.pct}% ${t('Complete').toLowerCase()}</p></div>
        <button class="btn ghost" data-act="doc" data-doc="plan">${ic('eye')} ${t('Preview')}</button></div>
      <ol class="stepper" aria-label="Steps">${STEPS.map((s, i) => { const m = comp.missing.some((x) => x.route === '#plan/' + (i + 1)); return `<li class="${i + 1 === step ? 'on' : ''} ${m ? 'miss' : 'ok'}"><a href="#plan/${i + 1}" aria-current="${i + 1 === step ? 'step' : 'false'}"><span>${i + 1}</span><em>${t(s)}</em></a></li>`; }).join('')}</ol>
      <div class="form-card"><h2>${step}. ${t(STEPS[step - 1])}</h2>${fns[step - 1]()}
      ${step < 10 && stepMissing.length ? `<div class="issues soft"><ul>${stepMissing.map((m) => `<li>${t('Missing')}: ${esc(m.msg)}</li>`).join('')}</ul></div>` : ''}</div>
      <div class="stepnav">${step > 1 ? `<a class="btn ghost" href="#plan/${step - 1}">${ic('arrowL')} ${t('Back')}</a>` : '<a class="btn ghost" href="#passport/business">' + ic('arrowL') + ' ' + t('Passport') + '</a>'}
      ${step < 10 ? `<a class="btn" href="#plan/${step + 1}">${t('Next')} ${ic('arrowR')}</a>` : `<a class="btn" href="#finance">${t('Next')}: ${t('Financial Statements')} ${ic('arrowR')}</a>`}</div>`;
  }
  function s1() {
    const b = S.profile.business;
    return `<div class="reuse">${ic('id')} <div><b>${esc(b.name || 'Business name not set')}</b><br><span class="muted">${esc(C.addr(b.address) || 'Address not set')} · ${esc(C.fullName(S.profile.owner) || '')} · ${esc(S.profile.owner.contact || '')}</span></div><a class="btn sm ghost" href="#passport/business">${t('Edit')}</a></div>
      <p class="muted small">These details come from your Passport, so you don't need to type them again.</p>` +
      field({ path: 'plan.projectName', label: 'Name of project', req: true, type: 'textarea', rows: 2, help: 'What will you do with the loan? Example: "Purchase of freezer and working capital for ..."' }) +
      field({ path: 'business.nature', label: 'Nature of business', ph: 'e.g. Eatery, Sari-sari store, Feeds retailing' }) +
      field({ path: 'business.ownership', label: 'Form of business', type: 'radio', options: ['Single Proprietorship', 'Partnership', 'Others'] }) +
      field({ path: 'business.description', label: 'Brief description of the business', type: 'textarea', req: true, help: 'When did it start? What do you sell? Who are your customers? How did the crisis affect you?' });
  }
  function s2() {
    return field({ path: 'plan.productDescription', label: 'Description of the product / service', type: 'textarea', req: true, help: 'Describe what you sell, how it is made, and what makes it good.' }) +
      `<h3>${t('Selling price')} and expected sales</h3><p class="help">List each product. Enter the price and how many you usually sell.${speakBtn('List each product. Enter the price and how many you usually sell.')}</p>` +
      tableEditor('plan.products', [
        { k: 'name', label: 'Product', w: 'w3', ph: 'e.g. Batchoy (regular)' }, { k: 'unit', label: 'Unit', ph: 'bowl, pack, kg' },
        { k: 'price', label: 'Selling price', num: 1, ph: '₱' }, { k: 'qty', label: 'Quantity sold', num: 1 },
        { k: 'per', label: 'per', type: 'select', options: [['day', 'day'], ['week', 'week'], ['month', 'month']] },
        { k: '_s', label: 'Monthly sales', type: 'calc', calc: 'prodSales' }
      ], 'product', { addLabel: 'Add product' }) +
      row(field({ path: 'plan.daysPerMonth', label: 'Operating days per month', inputmode: 'numeric', num: 1, cls: 'w1', help: 'Used for products sold per day. Example: open Monday to Saturday = 26 days.' }), `<div class="fld"><label>${t('Monthly sales')}</label><output class="big-out" data-calc="salesM"></output></div>`) +
      field({ path: 'plan.targetMarket', label: 'Target market / main customers', type: 'textarea', rows: 3, req: true, help: 'Who buys from you? Example: market vendors, students, households, resellers.' }) +
      field({ path: 'plan.marketArea', label: 'Market area', type: 'textarea', rows: 2, req: true, help: 'Where are your customers? Example: public market and nearby barangays.' });
  }
  const MEDIA = ['Word of mouth / suki', 'Facebook page', 'Facebook Marketplace', 'TikTok', 'Shopee / Lazada', 'Tarpaulin / signage', 'Flyers', 'Radio', 'Trade fairs / bazaars', 'Referral from resellers'];
  function s3() {
    return field({ path: 'plan.promotion', label: 'Media used to promote the business', type: 'checks', options: MEDIA, req: true }) +
      field({ path: 'plan.promotionOther', label: 'Other promotion', opt: true }) +
      field({ path: 'plan.salesStrategy', label: 'Sales strategy', type: 'textarea', rows: 3, opt: true, help: 'How will you increase sales? Discounts, delivery, new products, bulk orders?' }) +
      field({ path: 'plan.competitors', label: 'Competitors', type: 'textarea', rows: 2, opt: true, help: 'Who else sells the same? At what price?' }) +
      field({ path: 'plan.advantage', label: 'Your advantage over competitors', type: 'textarea', rows: 2, opt: true });
  }
  function s4() {
    return `<h3>3.1 Raw materials (or goods you buy for resale) and source</h3>` +
      tableEditor('plan.rawMaterials', [{ k: 'item', label: 'Raw material / goods', w: 'w3' }, { k: 'source', label: 'Source / supplier', w: 'w3' }], 'raw') +
      `<h3>3.2 Tools / equipment used</h3>` + tableEditor('plan.equipment', [{ k: 'item', label: 'Tool / equipment', w: 'w4' }], 'equip') +
      field({ path: 'plan.process', label: 'Production or service process', type: 'textarea', rows: 3, opt: true, help: 'Step by step: how do you make the product or serve customers?' }) +
      `<h3>4. Organization and management</h3>` +
      field({ path: 'owner.experience', label: 'Business experience and qualification', type: 'textarea', req: true }) +
      `<h3>4.2 Profile of employees</h3>` +
      tableEditor('plan.employees', [{ k: 'name', label: 'Name of employee', w: 'w3' }, { k: 'work', label: 'Nature of work', w: 'w2' },
        { k: 'status', label: 'Status', type: 'select', options: ['Permanent', 'Temporary', 'On-call', 'Seasonal', 'Contractual', 'Casual'] }], 'emp');
  }
  function s5() {
    const prods = S.profile.plan.products;
    return `<p class="help">For each product, enter the costs for ONE production batch (or one purchase for trading). The app computes the cost per unit and your mark-up.${speakBtn('For each product, enter the costs for one production batch. The app computes the cost per unit and your mark-up.')}</p>` +
      (prods.length ? prods.map((pr, i) => `<div class="sub-card"><div class="sub-head"><b>${esc(pr.name || 'Product ' + (i + 1))}</b><span class="muted">${t('Selling price')}: ${pr.price ? peso(n(pr.price)) : '—'}</span></div>
        ${row(field({ path: `plan.products.${i}.costing.materials`, label: 'Materials per batch', type: 'money' }), field({ path: `plan.products.${i}.costing.labor`, label: 'Labor per batch', type: 'money', opt: true }),
          field({ path: `plan.products.${i}.costing.overhead`, label: 'Overhead per batch (fuel, electricity, packaging)', type: 'money', opt: true }), field({ path: `plan.products.${i}.costing.units`, label: 'Units produced per batch', inputmode: 'numeric', num: 1 }))}
        ${row(field({ path: `plan.products.${i}.unitCost`, label: 'OR enter cost per unit directly', type: 'money', opt: true, help: 'For trading: the price you pay your supplier per unit.' }), `<div class="fld w2"><label>Result</label><output class="calc-box" data-calc="costing" data-i="${i}"></output></div>`)}
      </div>`).join('') : `<p class="muted">Add products in Step 2 first.</p>`) +
      `<h3>Monthly operating expenses</h3><p class="help">Costs you pay every month regardless of sales. Do not repeat costs already included in the product costing above.</p>` +
      tableEditor('plan.opex', [{ k: 'label', label: 'Expense', w: 'w3', ph: 'e.g. Stall rental' }, { k: 'amount', label: 'Amount per month', num: 1, ph: '₱' }], 'opex', { addLabel: 'Add expense' }) +
      `<div class="calc-panel" data-calc="planMonthly"></div>`;
  }
  function s6() {
    return `<p class="help">The app projects your sales and cash for the next 12 months using only the numbers you entered. Change the assumptions below.${speakBtn('The app projects your sales and cash for the next 12 months using only the numbers you entered.')}</p>` +
      row(field({ path: 'plan.beginningCash', label: 'Cash you have now (beginning cash)', type: 'money', req: true, help: 'Enter 0 if none.' }),
        field({ path: 'plan.growthPct', label: 'Expected sales growth per month', suf: '%', inputmode: 'decimal', opt: true, help: 'Leave blank or 0 if you expect the same sales every month.' }),
        field({ path: 'plan.drawings', label: "Owner's monthly drawings (household use)", type: 'money', opt: true })) +
      `<label class="toggle"><input type="checkbox" data-bool="plan.includeLoan" ${S.profile.plan.includeLoan ? 'checked' : ''}> Include the EMBRACE loan (proceeds in month 1, payments start month 7)</label>` +
      `<div class="calc-panel" data-calc="planMonthly"></div><h3>12-month cash flow projection</h3><div data-calc="cashflow"></div>` +
      field({ path: 'plan.assumptions', label: 'Assumptions', type: 'textarea', rows: 3, opt: true, help: 'Explain where your numbers come from (e.g. average daily sales last 6 months).' });
  }
  function s7() {
    return `<h3>A. List of items to be funded</h3><p class="help">What will you buy? Mark each item as an equipment/fixed asset or working capital, and whether the loan or your own money (equity) pays for it.</p>` +
      tableEditor('plan.itemsFunded', [{ k: 'item', label: 'Item', w: 'w3', ph: 'e.g. Chest freezer' }, { k: 'qty', label: 'Qty', num: 1 }, { k: 'unitCost', label: 'Unit cost', num: 1, ph: '₱' },
        { k: 'type', label: 'Type', type: 'select', options: [['fixed', 'Equipment / fixed asset'], ['working', 'Working capital']] },
        { k: 'source', label: 'Paid by', type: 'select', options: [['loan', 'Loan'], ['equity', 'Own money (equity)']] }, { k: '_t', label: 'Total', type: 'calc', calc: 'fundTotal' }], 'fund', { addLabel: 'Add item' }) +
      `<h3>B. Total project cost</h3><div data-calc="projectCost"></div>` +
      `<h3>Financing requirement</h3>` +
      row(field({ path: 'loan.amount', label: 'Loan amount applied for', type: 'money', req: true, help: 'EMBRACE: PHP 20,000 to PHP 100,000.' }), `<div class="fld w2"><label>Loan terms</label><output class="calc-box" data-calc="loanBox"></output></div>`) +
      `<button type="button" class="btn sm ghost" data-act="loanFromItems">Use total of loan-funded items as loan amount</button>` +
      field({ path: 'loan.purposes', label: 'Purpose of the loan', type: 'checks', options: ['Working Capital', 'Acquisition of Equipment', 'Acquisition of Fixed Assets'], req: true });
  }
  function s8() {
    return `<div data-calc="breakeven"></div><h3>Business development goals</h3><p class="help">What do you want to achieve in the next 1–2 years? Make it measurable.</p>` +
      tableEditor('plan.goals', [{ k: 'goal', label: 'Goal', w: 'w3', ph: 'e.g. Add pancit and dinuguan to the menu' }, { k: 'target', label: 'Target / measure', w: 'w2', ph: 'e.g. +₱10,000 monthly sales' }, { k: 'by', label: 'By when', ph: 'e.g. June 2027' }], 'goal', { addLabel: 'Add goal' });
  }
  const COMMON_RISKS = [
    ['Increase in prices of raw materials', 'Buy in bulk when prices are low; keep at least 2 suppliers; review selling prices every quarter.'],
    ['Typhoon, flood or other natural calamity', 'Keep stock in a safe, elevated area; set aside an emergency fund; consider microinsurance.'],
    ['New competitors / low sales', 'Keep quality and service consistent; offer suki discounts and promos; promote on Facebook.'],
    ['Owner gets sick or cannot work', 'Train a family member or employee to run daily operations.'],
    ['Spoilage or damage of goods', 'Practice first-in-first-out (FIFO); proper storage; order only what can be sold.'],
    ['Customers not paying credit (utang)', 'Limit credit to trusted suki; record all credit; set a payment schedule.']
  ];
  function s9() {
    return `<p class="help">What could go wrong, and what will you do about it?</p><button type="button" class="btn sm ghost" data-act="addRisks">${ic('bulb')} Add common risks for small businesses</button>` +
      tableEditor('plan.risks', [{ k: 'risk', label: 'Risk', w: 'w3' }, { k: 'mitigation', label: 'Mitigation measure', w: 'w4' }], 'risk', { addLabel: 'Add risk' });
  }
  function s10() {
    const comp = C.completenessOf(S.profile, 'plan');
    const issues = C.planIssues(S.profile);
    return `<h3>Executive summary</h3><p class="help">A short introduction to your whole plan. Press the button to write a draft from your answers, then edit it.</p>
      <button type="button" class="btn sm ghost" data-act="genSummary">${ic('bulb')} Write a draft from my answers</button>` +
      field({ path: 'plan.summary', label: 'Executive summary', type: 'textarea', rows: 7 }) +
      `<div class="grid2"><div>${issuesBox(missingList(comp), 'Missing information')}</div><div>${issuesBox(issues, 'Things to check')}</div></div>
      <div class="btns"><button class="btn big" data-act="doc" data-doc="plan">${ic('eye')} ${t('Preview')} ${t('Business Plan')}</button>
      <button class="btn ghost" data-act="docWord" data-doc="plan">${ic('down')} ${t('Download Word')}</button></div>`;
  }

  /* ---------------------------------------------------------------- FINANCE */
  function vFinance() {
    const p = S.profile, fs = p.fs;
    fs.years.sort((a, b) => a.year - b.year);
    if (S.ui.fsYear < 0 || S.ui.fsYear >= fs.years.length) S.ui.fsYear = fs.years.length - 1;
    const yi = S.ui.fsYear, y = fs.years[yi];
    const tab = S.ui.fsTab;
    const base = `fs.years.${yi}`;
    const comp = C.completenessOf(p, 'fs');
    let body = '';
    if (!y) body = `<p class="muted">Add a year to start.</p>`;
    else if (tab === 'is') {
      body = `<p class="help">Enter totals for the whole year ${y.year}. Use your notebook, receipts or sales records.${speakBtn('Enter totals for the whole year. Use your notebook, receipts or sales records.')}</p>` +
        field({ path: base + '.sales', label: 'Sales', type: 'money', req: true, help: 'All money from selling products or services for the year.' }) +
        `<h3>Cost of sales</h3>` + row(field({ path: base + '.begInv', label: 'Beginning inventory', type: 'money', help: 'Value of goods/materials on hand at the start of the year.' }), field({ path: base + '.purchases', label: 'Purchases', type: 'money', help: 'Goods or raw materials bought during the year.' }), field({ path: base + '.endInv', label: 'Ending inventory', type: 'money', help: 'Value of goods left at the end of the year.' })) +
        `<div class="calc-line" data-calc="fsCogs"></div><h3>Operating expenses</h3>` +
        `<div class="row">${fs.opexLabels.map((l, li) => `<div class="fld w2 lab-edit">${field({ path: `${base}.opex.${l}`, label: l, type: 'money' }).replace('<div class="fld ', '<div class="fld nob ')}<button class="icon-btn sm danger" data-act="delLabel" data-list="opexLabels" data-i="${li}" aria-label="${t('Remove')} ${esc(l)}">${ic('x')}</button></div>`).join('')}</div>
        <button class="btn sm ghost" data-act="addLabel" data-list="opexLabels">${ic('plus')} Add expense line</button>
        <div class="calc-line" data-calc="fsNet"></div>`;
    } else if (tab === 'bs') {
      body = `<p class="help">What the business owns and owes on December 31, ${y.year}.</p><h3>Current assets</h3>` +
        row(field({ path: base + '.cash', label: 'Cash on hand and in bank', type: 'money', req: true }), field({ path: base + '.receivables', label: 'Accounts receivable (utang of customers)', type: 'money', opt: true }), field({ path: base + '.otherCurrent', label: 'Other current assets', type: 'money', opt: true })) +
        `<p class="muted small">Merchandise inventory is taken from Ending inventory in the Income Statement: <b data-calc="endInv"></b></p><h3>Non-current assets (equipment, building, vehicles)</h3>` +
        fs.ncaLabels.map((l, li) => `<div class="row nca">${field({ path: `${base}.nca.${l}.cost`, label: l + ' — cost', type: 'money', cls: 'w2' })}${field({ path: `${base}.nca.${l}.dep`, label: 'Accumulated depreciation', type: 'money', cls: 'w2', opt: true })}<button class="icon-btn sm danger" data-act="delLabel" data-list="ncaLabels" data-i="${li}" aria-label="${t('Remove')} ${esc(l)}">${ic('x')}</button></div>`).join('') +
        `<button class="btn sm ghost" data-act="addLabel" data-list="ncaLabels">${ic('plus')} Add asset</button><div class="calc-line" data-calc="fsAssets"></div>` +
        `<h3>Liabilities (debts)</h3><div class="row">${fs.liabLabels.map((l, li) => `<div class="fld w2 lab-edit">${field({ path: `${base}.liab.${l}`, label: l, type: 'money' }).replace('<div class="fld ', '<div class="fld nob ')}<button class="icon-btn sm danger" data-act="delLabel" data-list="liabLabels" data-i="${li}" aria-label="${t('Remove')}">${ic('x')}</button></div>`).join('')}</div>
        <button class="btn sm ghost" data-act="addLabel" data-list="liabLabels">${ic('plus')} Add liability</button>` +
        `<h3>Owner's equity (capital)</h3>` + row(field({ path: base + '.capitalBeg', label: 'Capital at the beginning of the year', type: 'money', req: true }), field({ path: base + '.ownerInvest', label: 'Additional investment during the year', type: 'money', opt: true }), field({ path: base + '.drawings', label: "Owner's drawings (taken for personal use)", type: 'money', opt: true })) +
        `<div class="calc-line" data-calc="fsBalance"></div>`;
    } else if (tab === 'cf') {
      body = `<p class="help">Cash that actually came in and went out during ${y.year}.</p><button class="btn sm ghost" data-act="cfFromIs">Copy sales, purchases and expenses from the Income Statement</button>` +
        field({ path: base + '.cf.beg', label: 'Cash at the beginning of the year', type: 'money', req: true }) +
        `<h3>Cash received</h3>` + row(field({ path: base + '.cf.inSales', label: 'Collections from sales', type: 'money' }), field({ path: base + '.cf.inLoans', label: 'Loans received', type: 'money', opt: true }), field({ path: base + '.cf.inOwner', label: "Owner's additional investment", type: 'money', opt: true }), field({ path: base + '.cf.inOther', label: 'Other cash received', type: 'money', opt: true })) +
        `<h3>Cash paid</h3>` + row(field({ path: base + '.cf.outPurchases', label: 'Purchases / raw materials', type: 'money' }), field({ path: base + '.cf.outOpex', label: 'Operating expenses paid', type: 'money' }), field({ path: base + '.cf.outAssets', label: 'Equipment / assets bought', type: 'money', opt: true })) +
        row(field({ path: base + '.cf.outLoan', label: 'Loan payments', type: 'money', opt: true }), field({ path: base + '.cf.outDrawings', label: "Owner's drawings", type: 'money', opt: true }), field({ path: base + '.cf.outOther', label: 'Other cash paid', type: 'money', opt: true })) +
        `<div class="calc-line" data-calc="fsCash"></div>`;
    } else {
      body = `<div data-calc="fsCompare"></div>`;
    }
    return `<div class="page-head"><div><h1>${t('Financial Statements')}</h1><p class="muted">${comp.pct}% ${t('Complete').toLowerCase()} · Computed automatically from your entries.</p></div>
        <div class="btns"><button class="btn ghost" data-act="doc" data-doc="fs">${ic('eye')} ${t('Preview')}</button><button class="btn ghost" data-act="fsCsv">${ic('down')} CSV</button></div></div>
      <div class="years" role="tablist" aria-label="Year">${fs.years.map((yy, i) => `<button role="tab" class="year ${i === yi ? 'on' : ''}" data-act="fsYear" data-i="${i}" aria-selected="${i === yi}">${yy.year}<small class="${yy.basis}">${yy.basis === 'estimate' ? t('Estimate') : t('Actual')}</small></button>`).join('')}
        <button class="year add" data-act="addYear" aria-label="${t('Add year')}">${ic('plus')}<small>${t('Add year')}</small></button></div>
      ${y ? `<div class="year-bar"><span>${y.year}:</span>${field({ path: base + '.basis', label: 'These figures are', type: 'radio', options: [['actual', 'Actual (from records)'], ['estimate', 'Estimate / projection']] }).replace('class="fld ', 'class="fld inline ')}
        <button class="btn sm ghost" data-act="prevFill" ${yi === 0 ? 'disabled' : ''}>Bring beginning balances from ${y.year - 1}</button>
        <button class="btn sm ghost danger" data-act="delYear">${ic('trash')} Remove ${y.year}</button></div>` : ''}
      <div class="tabs" role="tablist">${[['is', 'Income Statement'], ['bs', 'Balance Sheet'], ['cf', 'Cash Flow Statement'], ['ind', 'Indicators & Checks']].map(([k, l]) => `<button role="tab" class="${tab === k ? 'on' : ''}" data-act="fsTab" data-t="${k}" aria-selected="${tab === k}">${t(l)}</button>`).join('')}</div>
      <div class="form-card">${body}</div>
      <div data-calc="fsIssues"></div>
      <div class="stepnav"><a class="btn ghost" href="#plan/10">${ic('arrowL')} ${t('Business Plan')}</a><a class="btn" href="#loan">${t('Next')}: ${t('EMBRACE Loan')} ${ic('arrowR')}</a></div>`;
  }

  /* ---------------------------------------------------------------- LOAN */
  function vLoan(sub) {
    if (!sub) sub = G.GrowLoans && G.GrowLoans.hasLoans() ? 'account' : 'apply';
    const tabsHtml = `<div class="tabs loan-tabs" role="tablist"><a role="tab" href="#loan/account" class="${sub === 'account' ? 'on' : ''}">${ic('loan')} My Loan</a><a role="tab" href="#loan/apply" class="${sub === 'apply' ? 'on' : ''}">${ic('send')} Apply for EMBRACE</a></div>`;
    if (sub === 'account') return `<div class="page-head"><div><h1>${t('EMBRACE Loan')}</h1><p class="muted">Loan status, payments and due dates</p></div></div>` + tabsHtml + (G.GrowLoans ? G.GrowLoans.view() : '');
    return tabsHtml + vLoanApply();
  }
  function vLoanApply() {
    const p = S.profile, l = p.loan, ofw = l.applicantType === 'ofw';
    const yn = [['yes', 'Yes'], ['no', 'No'], ['', 'Not sure']];
    const el = C.eligibility(p);
    const qs = el.list.map((x) => {
      if (x.auto) return `<li class="elig ${x.ok === true ? 'ok' : x.ok === false ? 'no' : 'q'}"><span class="mark">${x.ok === true ? ic('check') : x.ok === false ? ic('x') : '?'}</span><div><b>${esc(x.label)}</b><small>Auto-checked from your Passport: ${esc(x.src || '')}</small></div></li>`;
      if (x.k === 'losses') {
        return `<li class="elig ${x.ok === true ? 'ok' : x.ok === false ? 'no' : 'q'}"><span class="mark">${x.ok === true ? ic('check') : x.ok === false ? ic('x') : '?'}</span><div><b>${esc(x.label)}</b>
          ${field({ path: 'loan.elig.closure1mo', label: 'Was the business closed for at least 1 month during a crisis/emergency?', type: 'radio', options: yn })}
          ${field({ path: 'loan.elig.drop20pct', label: 'Did monthly sales drop by at least 20% for 2 months?', type: 'radio', options: yn })}</div></li>`;
      }
      return `<li class="elig ${x.ok === true ? 'ok' : x.ok === false ? 'no' : 'q'}"><span class="mark">${x.ok === true ? ic('check') : x.ok === false ? ic('x') : '?'}</span><div>${field({ path: 'loan.elig.' + x.k, label: x.label, type: 'radio', options: yn })}</div></li>`;
    }).join('');
    const ck = C.checklist(p);
    const st = (p.review && p.review.status) || 'Draft';
    const comp = C.completenessOf(p, 'loan');
    return `<div class="page-head"><div><h1>${t('EMBRACE Loan')}</h1><p class="muted">Expanded Micro Business Recovery Assistance during Crisis and Emergency · Iloilo Provincial Government</p></div>
        <button class="btn ghost" data-act="doc" data-doc="checklist">${ic('eye')} Checklist</button></div>
      <div class="disclaimer">${ic('alert')} ${t('This app does not guarantee loan approval.')} It helps you prepare requirements based on the official EMBRACE guidelines. Applications are evaluated by the Technical Working Group (TWG).</div>
      <div class="form-card"><h2>1. ${t('Eligibility self-check')}</h2>
        ${field({ path: 'loan.applicantType', label: 'I am applying as', type: 'radio', options: [['micro', 'Micro-enterprise owner'], ['ofw', 'Overseas Filipino Worker (OFW)']] })}
        <ul class="elig-list">${qs}</ul>
        <div class="elig-result ${el.pass ? 'ok' : el.fail ? 'no' : 'q'}">${el.pass ? ic('check') + ' Based on your answers, you appear to meet the basic EMBRACE criteria.' : el.fail ? ic('x') + ' One or more criteria are not met. You may still talk to the LEDIP Center for other programs.' : '? Answer all questions to see the result.'}</div>
      </div>
      <div class="form-card"><h2>2. ${t('Loan details')}</h2>
        ${row(field({ path: 'loan.amount', label: 'Loan amount applied for', type: 'money', req: true, help: 'Minimum ₱20,000, maximum ₱100,000.' }), `<div class="fld w2"><label>Loan terms</label><output class="calc-box" data-calc="loanBox"></output></div>`)}
        ${field({ path: 'loan.purposes', label: 'Purpose', type: 'checks', options: ['Working Capital', 'Acquisition of Equipment', 'Acquisition of Fixed Assets'], req: true })}
        ${field({ path: 'loan.collateral', label: 'Collateral', type: 'radio', options: [['pdc', 'Post-dated checks (PDC)'], ['comaker', 'Co-maker']], req: true })}
        ${l.collateral === 'comaker' ? `<div class="sub-card"><h3>Co-maker</h3>${row(field({ path: 'loan.comaker.name', label: 'Full name', req: true }), field({ path: 'loan.comaker.relation', label: 'Relationship to you' }), field({ path: 'loan.comaker.contact', label: 'Mobile number', type: 'tel' }))}
          ${row(field({ path: 'loan.comaker.occupation', label: 'Occupation / employer' }), field({ path: 'loan.comaker.income', label: 'Monthly income', type: 'money', opt: true }))}<p class="muted small">The co-maker must show proof of financial capacity: ITR, pay slip, latest financial or bank statement, or certificate of employment and compensation.</p></div>` : ''}
        ${field({ path: 'loan.releaseDate', label: 'Expected loan release date (to compute due dates)', type: 'date', opt: true })}
        <details class="sched"><summary>${t('Amortization schedule')}</summary><div data-calc="schedule"></div></details>
      </div>
      <div class="form-card"><h2>3. ${t('Requirements checklist')}</h2><p class="muted">${ofw ? 'For OFWs' : 'For micro-business owners'} · based on the EMBRACE Implementing Rules and Regulations.</p>
        <ul class="checklist">${ck.map((c) => `<li class="ck-${c.status}"><span class="mark">${c.status === 'done' ? ic('check') : c.status === 'ready' ? ic('print') : c.status === 'optional' ? '–' : '!'}</span>
          <div><b>${esc(c.label)}</b><small>${esc(c.detail || '')}</small>${c.docs.length ? `<small>${c.docs.map((d) => esc(d.name) + ' ' + (S.profile.review && S.profile.review.verified && S.profile.review.verified[d.id] ? '(verified)' : '(self-reported)')).join(', ')}</small>` : ''}</div>
          ${c.cats && c.status !== 'done' ? `<label class="btn sm ghost file-btn">${ic('cam')} Upload<input type="file" accept="image/*,application/pdf" data-upload="${esc(c.cats[0])}" hidden></label>` : `<a class="btn sm ghost" href="${c.link}">${t('Edit')}</a>`}</li>`).join('')}</ul>
      </div>
      <div class="form-card"><h2>4. ${t('Submit to OLEDIPO')}</h2>
        <p>Status: <b class="st st-${esc(st.replace(/\s/g, ''))}">${esc(st)}</b>${p.review && p.review.applicantNo ? ' · Applicant No. ' + esc(p.review.applicantNo) : ''}</p>
        ${p.review && p.review.remarks ? `<p class="hint">${ic('alert')} OLEDIPO remarks: ${esc(p.review.remarks)}</p>` : ''}
        ${issuesBox(missingList(comp), 'Before submitting')}
        <label class="toggle consent"><input type="checkbox" data-bool="consent.share" ${p.consent.share ? 'checked' : ''}> I consent to share my Enterprise Passport, business plan, financial statements and uploaded documents with OLEDIPO / LEDIP Center of the Provincial Government of Iloilo for evaluation of my EMBRACE application and for business development assistance. I confirm the information is true to the best of my knowledge.</label>
        <div class="btns"><button class="btn big" data-act="submit" ${!p.consent.share ? 'disabled' : ''}>${ic('send')} ${t('Submit to OLEDIPO')}</button>
        <a class="btn ghost" href="#docs">${ic('print')} Print documents instead</a></div>
        <p class="muted small">Online submission needs internet and a linked online account (see ${t('Settings')}). You can also print your documents and submit them in person at the LEDIP Center.</p>
      </div>`;
  }

  /* ---------------------------------------------------------------- DOCUMENTS */
  function vDocs() {
    const ov = C.overall(S.profile);
    return `<div class="page-head"><div><h1>${t('Documents')}</h1><p class="muted">Generated from your saved information — works offline. Print, save as PDF, or download as Word to edit.</p></div></div>
      ${ov.pct < 100 ? `<div class="hint">${ic('alert')} Readiness ${ov.pct}%. Blank lines will appear where information is missing — you can still print and fill them in by hand.</div>` : ''}
      <div class="doc-grid">${D.LIST.map((d) => { const doc = d.fn(S.profile); return `<div class="card doc">${ic(d.icon === 'check' ? 'check' : d.icon, 'big')}<h3>${esc(doc.title)}</h3><p>${esc(d.desc)}</p>
        <div class="btns"><button class="btn sm" data-act="doc" data-doc="${d.id}">${ic('eye')} ${t('Preview')} / ${t('Print')}</button><button class="btn sm ghost" data-act="docWord" data-doc="${d.id}">${ic('down')} Word</button></div></div>`; }).join('')}</div>
      <div class="form-card"><h2>Backup and transfer</h2><p class="help">Save a backup file of your whole Passport (including documents) to your phone or a USB drive. Use it to move to another device even without internet.</p>
        <div class="btns"><button class="btn ghost" data-act="backup">${ic('down')} Download backup (.json)</button>
        <label class="btn ghost file-btn">${ic('up')} Restore from backup<input type="file" accept=".json,application/json" data-restore="1" hidden></label></div></div>`;
  }

  /* ---------------------------------------------------------------- SETTINGS */
  function vSettings() {
    const s = S.settings;
    const linked = !!S.session;
    return `<div class="page-head"><div><h1>${t('Settings')}</h1></div></div>
      <div class="form-card"><h2>${t('Language')} &amp; accessibility</h2>
        <div class="fld"><label>${t('Language')}</label><div class="chips">${Object.entries(I.LANGS).map(([k, v]) => `<label class="chip"><input type="radio" name="lang" data-setting="lang" value="${k}" ${s.lang === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div></div>
        <div class="fld"><label>${t('Text size')}</label><div class="chips">${[[1, 'Normal'], [1.15, 'Large'], [1.3, 'Extra large']].map(([k, v]) => `<label class="chip"><input type="radio" name="size" data-setting="size" value="${k}" ${Number(s.size) === k ? 'checked' : ''}><span style="font-size:${k}em">${v}</span></label>`).join('')}</div></div>
        <label class="toggle"><input type="checkbox" data-setting="contrast" ${s.contrast ? 'checked' : ''}> ${t('High contrast')}</label>
      </div>
      <div class="form-card"><h2>${ic('cloud')} Online account &amp; sync</h2>
        ${!API.configured() ? `<p class="muted">The online server is not configured for this copy of the EMBRACE Portal. Your data stays on this device. (Administrators: set API_URL in js/config.js.)</p>` :
        linked ? `<p>Linked to EMBRACE Passport <b>${esc(S.session.passportId)}</b>. ${S.session.lastSync ? 'Last sync: ' + new Date(S.session.lastSync).toLocaleString() : ''}</p>
          <div class="btns"><button class="btn" data-act="syncNow">${ic('cloud')} ${t('Sync now')}</button><button class="btn ghost" data-act="signOut">${t('Sign out')}</button></div>
          <p class="muted small">Your data is saved on this device first and sent to the OLEDIPO server automatically when you have internet.</p>` :
        `<p>Link an online account to back up your Passport, use it on another device, and submit your application online.</p>
          <div class="btns"><button class="btn" data-act="register">${t('Create account')}</button><button class="btn ghost" data-act="signIn">${t('Sign in')}</button></div>`}
      </div>
      ${G.GrowInstall && G.GrowInstall.available() ? `<div class="form-card"><h2>${ic('down')} Install the app</h2><div id="setInstall"></div></div>` : ''}
      <div class="form-card"><h2>${ic('bulb')} AI assistance</h2><p class="muted">AI (OpenAI) checks your uploaded documents for completeness. Results are suggestions only; OLEDIPO staff do the official checks.</p>
        <p>Status: <b>${S.profile.consent && S.profile.consent.ai ? 'Allowed since ' + C.fmtDate(S.profile.consent.aiAt) : 'Not allowed'}</b></p>
        <div class="btns">${S.profile.consent && S.profile.consent.ai ? `<button class="btn ghost" data-act="aiConsentOff">Withdraw AI consent</button>` : `<button class="btn ghost" data-act="aiConsentOn">Allow AI assistance</button>`}</div></div>
      <div class="form-card"><h2>${ic('lock')} Security</h2><p class="muted">${Store.cryptoAvailable ? 'Your data on this device is encrypted with your PIN (AES-256).' : 'This browser does not support encryption — use the HTTPS address of the EMBRACE Portal for encrypted storage.'}</p>
        <div class="btns"><button class="btn ghost" data-act="changePin">Change PIN</button><button class="btn ghost" data-act="lockNow">${ic('lock')} Lock now</button><button class="btn ghost danger" data-act="wipe">${ic('trash')} Erase all data on this device</button></div></div>
      <div class="form-card"><h2>About the EMBRACE Portal</h2><p><b>EMBRACE Portal — Expanded Micro Business Recovery Assistance during Crisis and Emergency</b> v${esc(G.GROW_CONFIG.VERSION)}. Developed for the ${esc(G.GROW_CONFIG.OFFICE)}, ${esc(G.GROW_CONFIG.LGU)}, in response to the 2026 Iloilo Startup Hackathon challenge “NegosyoPlan”.</p>
        <p class="muted small">Financial computations use only the information you provide. Missing information is flagged, not invented. Professional review of financial statements is recommended. The EMBRACE Portal does not guarantee loan approval.</p>
        <p><a href="#admin">${ic('users')} ${t('OLEDIPO Staff')}</a></p></div>`;
  }

  /* ---------------------------------------------------------------- PROGRAMS */
  function vPrograms() {
    return `<div class="page-head"><div><h1>${t('Programs')}</h1><p class="muted">Financing, training and assistance programs from OLEDIPO. Updated when online.</p></div></div><div id="progList"><p class="muted">Loading…</p></div>`;
  }
  async function loadPrograms() {
    let data = await Store.getMeta('programs');
    const render = (d, note) => {
      const el = $('#progList'); if (!el) return;
      const list = (d && d.programs) || [{ title: 'EMBRACE Program', agency: 'Iloilo Provincial Government – OLEDIPO / LEDIP Center', description: 'Loans of PHP 20,000–100,000 at 0% interest for micro-enterprise owners and displaced OFWs. 3% service fee, 6-month grace period.', who: 'Iloilo residents with businesses in Iloilo Province.' }];
      el.innerHTML = (note ? `<p class="hint">${note}</p>` : '') + `<div class="cards">${list.map((x) => `<div class="card prog"><h3>${esc(x.title)}</h3><small>${esc(x.agency || '')}</small><p>${esc(x.description || '')}</p>${x.who ? `<p class="muted small"><b>Who may avail:</b> ${esc(x.who)}</p>` : ''}${x.deadline ? `<p class="small"><b>Deadline:</b> ${esc(x.deadline)}</p>` : ''}${x.link ? `<a class="btn sm ghost" href="${esc(x.link)}" target="_blank" rel="noopener">More info</a>` : ''}</div>`).join('')}</div>`;
    };
    render(data, data ? 'Saved list from ' + new Date(data.fetchedAt).toLocaleDateString() : 'Showing built-in information.');
    if (API.configured() && (S.online || API.isGas())) {
      try { data = await API.get({ action: 'programs' }); await Store.setMeta('programs', data); render(data); } catch (e) { /* keep cached */ }
    }
  }

  /* ================================================================ calculated fragments */
  const CALC = {
    yrsOp: () => { const y = C.yrsOperating(S.profile); return y == null ? '—' : y + ' yr' + (y === 1 ? '' : 's'); },
    empTotal: () => { const e = C.employeeCount(S.profile); return e == null ? '—' : String(e); },
    prodSales: (el) => { const pr = S.profile.plan.products[el.dataset.i]; return pr ? peso(C.productCalc(pr, S.profile.plan.daysPerMonth).salesMonth) : ''; },
    salesM: () => peso(C.planCalc(S.profile).salesM),
    fundTotal: (el) => { const it = S.profile.plan.itemsFunded[el.dataset.i]; return it ? peso(n(it.qty || 1) * n(it.unitCost)) : ''; },
    costing: (el) => {
      const pr = S.profile.plan.products[el.dataset.i]; if (!pr) return '';
      const c = C.productCalc(pr, S.profile.plan.daysPerMonth);
      if (c.unitCost == null) return '<span class="flag">Enter batch costs and units, or a cost per unit.</span>';
      const price = n(pr.price);
      return `Cost per unit <b>${peso(c.unitCost)}</b>` + (c.costingUnit != null && has(pr.unitCost) ? ` <small>(using direct entry; worksheet gives ${peso(c.costingUnit)})</small>` : '') +
        (price ? `<br>Profit per unit <b class="${c.marginPerUnit < 0 ? 'neg' : ''}">${peso(c.marginPerUnit)}</b> · Mark-up <b>${C.pct(c.markupPct)}</b>` : '<br><span class="flag">Selling price missing (Step 2).</span>') +
        `<br><small>Price at 30% mark-up: ${peso(c.unitCost * 1.3)} · at 50%: ${peso(c.unitCost * 1.5)}</small>`;
    },
    planMonthly: () => {
      const pc = C.planCalc(S.profile);
      return `<div class="stats"><div class="stat"><span>${t('Monthly sales')}</span><b>${peso(pc.salesM)}</b></div><div class="stat"><span>Cost of goods</span><b>${pc.cogsKnown ? peso(pc.cogsM) : '<span class="flag">incomplete</span>'}</b></div>
        <div class="stat"><span>Gross profit</span><b>${peso(pc.grossM)}</b></div><div class="stat"><span>${t('Monthly expenses')}</span><b>${peso(pc.opexM)}</b></div>
        <div class="stat hl ${pc.netM < 0 ? 'neg' : ''}"><span>${t('Monthly profit')}</span><b>${peso(pc.netM)}</b></div><div class="stat"><span>${t('Annual sales')}</span><b>${peso(pc.annual.sales)}</b></div></div>`;
    },
    cashflow: () => {
      const pc = C.planCalc(S.profile);
      return D.cashflowTable(pc).replace('class="grid small"', 'class="tbl cf"') + (pc.negativeMonths.length ? `<p class="warn">${ic('alert')} Cash becomes negative in month(s) ${pc.negativeMonths.join(', ')}. Consider lower drawings, smaller purchases or a different loan amount.</p>` : '') +
        `<div class="bars" aria-hidden="true">${(() => { const mx = Math.max(1, ...pc.cashflow.map((r) => Math.abs(r.end))); return pc.cashflow.map((r) => `<span class="${r.end < 0 ? 'neg' : ''}" style="height:${Math.max(2, Math.abs(r.end) / mx * 100)}%" title="Month ${r.m}: ${peso(r.end, 0)}"><i>${r.m}</i></span>`).join(''); })()}</div><p class="muted small center">Cash at the end of each month</p>`;
    },
    projectCost: () => {
      const pc = C.planCalc(S.profile).pc;
      return `<table class="tbl"><tr><th>Particulars</th><th class="r">Equity</th><th class="r">Loan</th><th class="r">Total</th></tr>
        <tr><td>Fixed assets</td><td class="r">${peso(pc.fixedEquity)}</td><td class="r">${peso(pc.fixedLoan)}</td><td class="r">${peso(pc.fixedTotal)}</td></tr>
        <tr><td>Working capital</td><td class="r">${peso(pc.wcEquity)}</td><td class="r">${peso(pc.wcLoan)}</td><td class="r">${peso(pc.wcTotal)}</td></tr>
        <tr class="tot"><td>Total project cost</td><td class="r">${peso(pc.totalEquity)}</td><td class="r">${peso(pc.totalLoan)}</td><td class="r">${peso(pc.total)}</td></tr></table>`;
    },
    loanBox: () => {
      const lc = C.loanCalc(S.profile.loan.amount, S.profile.loan.releaseDate);
      if (!lc.amount) return '<span class="muted">Enter an amount.</span>';
      return (lc.valid ? '' : `<span class="flag">${ic('alert')} Must be ₱20,000 – ₱100,000.</span><br>`) +
        `Term <b>${lc.term} months</b> after 6-month grace · 0% interest<br>Service fee (3%) <b>${peso(lc.fee)}</b> → you receive <b>${peso(lc.net)}</b><br>Monthly amortization <b>${peso(lc.monthly)}</b>`;
    },
    schedule: () => {
      const lc = C.loanCalc(S.profile.loan.amount, S.profile.loan.releaseDate);
      if (!lc.schedule.length) return '<p class="muted">Enter a loan amount.</p>';
      return `<table class="tbl"><tr><th>No.</th><th>Due</th><th class="r">Amount</th><th class="r">Balance</th></tr>${lc.schedule.map((s) => `<tr><td>${s.no}</td><td>${s.due ? C.fmtDate(s.due) : 'Month ' + (6 + s.no)}</td><td class="r">${peso(s.payment)}</td><td class="r">${peso(s.balance)}</td></tr>`).join('')}</table>
        <p class="muted small">Late payment: penalty of 0.5% of the amount due (${peso(lc.penaltyPerMonthLate)}) per month. Three missed payments in a row = default.</p>`;
    },
    breakeven: () => {
      const pc = C.planCalc(S.profile);
      const pctBar = pc.beSales && pc.salesM ? Math.min(100, pc.beSales / pc.salesM * 100) : 0;
      return `<div class="stats"><div class="stat"><span>Monthly fixed expenses</span><b>${peso(pc.opexM)}</b></div><div class="stat"><span>Gross margin</span><b>${C.pct(pc.cmRatio * 100)}</b></div>
        <div class="stat hl"><span>${t('Break-even sales')} / month</span><b>${pc.beSales == null ? '<span class="flag">needs costs &amp; prices</span>' : peso(pc.beSales)}</b></div>
        <div class="stat"><span>Break-even / operating day</span><b>${pc.beDaily == null ? '—' : peso(pc.beDaily)}</b></div><div class="stat"><span>Projected sales / month</span><b>${peso(pc.salesM)}</b></div></div>
        ${pc.beSales && pc.salesM ? `<div class="be"><div class="be-bar"><span style="width:${pctBar}%"></span><em style="left:${pctBar}%">break-even</em></div><p class="small">${pc.salesM >= pc.beSales ? `Your projected sales are <b>${C.pct((pc.salesM - pc.beSales) / pc.salesM * 100)}</b> above break-even (margin of safety).` : `<span class="neg">Projected sales are BELOW break-even.</span>`}</p></div>` : ''}
        <p class="muted small">Break-even = monthly fixed expenses ÷ gross margin. Below this level of sales, the business loses money.</p>`;
    },
    endInv: () => { const y = S.profile.fs.years[S.ui.fsYear]; return y && has(y.endInv) ? peso(n(y.endInv)) : '—'; },
    fsCogs: () => { const o = cur(); return o ? `Goods available ${peso(o.c.goods)} · <b>Cost of sales ${peso(o.c.cogs)}</b> · <b>Gross income ${peso(o.c.gross)}</b>` : ''; },
    fsNet: () => { const o = cur(); return o ? `Total operating expenses ${peso(o.c.opexTotal)} · <b class="${o.c.net < 0 ? 'neg' : ''}">${t('Net income')} ${peso(o.c.net)}</b>` + (o.c.netMargin != null ? ` · Net margin ${C.pct(o.c.netMargin)}` : '') : ''; },
    fsAssets: () => { const o = cur(); return o ? `Current assets ${peso(o.c.curAssets)} · Non-current ${peso(o.c.ncaNet)} · <b>${t('Total assets')} ${peso(o.c.totalAssets)}</b>` : ''; },
    fsBalance: () => {
      const o = cur(); if (!o) return '';
      const ok = Math.abs(o.c.diff) < 1;
      return `Liabilities ${peso(o.c.totalLiab)} + Capital at end ${peso(o.c.capitalEnd)} = <b>${peso(o.c.liabCap)}</b><br>${t('Total assets')} <b>${peso(o.c.totalAssets)}</b> — ` +
        (o.c.hasBS ? (ok ? `<span class="okc">${ic('check')} Balanced</span>` : `<span class="neg">${ic('alert')} Not balanced: difference ${peso(o.c.diff)}</span>`) : '<span class="muted">enter cash and capital</span>');
    },
    fsCash: () => { const o = cur(); if (!o) return ''; const y = o.y; return `Cash in ${peso(o.c.cfIn)} · Cash out ${peso(o.c.cfOut)} · <b>Cash at end ${peso(o.c.cfEnd)}</b>` + (has(y.cash) ? (Math.abs(o.c.cfEnd - n(y.cash)) < 1 ? ` <span class="okc">${ic('check')} matches balance sheet</span>` : ` <span class="flag">balance sheet cash is ${peso(n(y.cash))}</span>`) : ''); },
    fsCompare: () => {
      const rows = C.fsCalc(S.profile);
      const L = [['Sales', (c, y) => peso(n(y.sales))], ['Cost of sales', (c) => peso(c.cogs)], ['Gross income', (c) => peso(c.gross)], ['Operating expenses', (c) => peso(c.opexTotal)], ['Net income', (c) => `<b class="${c.net < 0 ? 'neg' : ''}">${peso(c.net)}</b>`],
        ['Total assets', (c) => peso(c.totalAssets)], ['Total liabilities', (c) => peso(c.totalLiab)], ['Capital at end', (c) => peso(c.capitalEnd)], ['Balance check', (c) => c.hasBS ? (Math.abs(c.diff) < 1 ? '✔' : `<span class="neg">${peso(c.diff)}</span>`) : '—'],
        ['Gross profit margin', (c) => C.pct(c.grossMargin)], ['Net profit margin', (c) => C.pct(c.netMargin)], ['Sales growth', (c) => C.pct(c.salesGrowth)],
        ['Current ratio', (c) => c.currentRatio == null ? '—' : c.currentRatio.toFixed(2)], ['Debt-to-equity', (c) => c.debtToEquity == null ? '—' : c.debtToEquity.toFixed(2)], ['Return on assets', (c) => C.pct(c.roa)]];
      const mx = Math.max(1, ...rows.map((r) => Math.max(n(r.y.sales), Math.abs(r.c.net))));
      return `<div class="scroll"><table class="tbl"><tr><th></th>${rows.map((r) => `<th class="r">${r.y.year}<br><small class="${r.y.basis}">${r.y.basis === 'estimate' ? t('Estimate') : t('Actual')}</small></th>`).join('')}</tr>
        ${L.map(([l, f]) => `<tr><td>${t(l)}</td>${rows.map((r) => `<td class="r">${f(r.c, r.y)}</td>`).join('')}</tr>`).join('')}</table></div>
        <div class="chart-yrs" aria-hidden="true">${rows.map((r) => `<div><span class="b s" style="height:${n(r.y.sales) / mx * 100}%"></span><span class="b ni ${r.c.net < 0 ? 'neg' : ''}" style="height:${Math.abs(r.c.net) / mx * 100}%"></span><i>${r.y.year}</i></div>`).join('')}</div>
        <p class="legend"><span class="k s"></span> ${t('Sales')} <span class="k ni"></span> ${t('Net income')}</p>
        <p class="muted small">Indicators help you and OLEDIPO understand the health of your business. Gross margin = gross income ÷ sales. Current ratio above 1 means you can pay short-term debts. Professional review is recommended.</p>`;
    },
    fsIssues: () => issuesBox(C.fsIssues(S.profile).map((i) => Object.assign({}, i, { msg: (i.sev === 'missing' ? t('Missing') + ': ' : '') + i.msg })), 'Checks')
  };
  function cur() { const rows = C.fsCalc(S.profile); const y = S.profile.fs.years[S.ui.fsYear]; return rows.find((r) => r.y === y); }
  function refreshCalcs() {
    $$('[data-calc]').forEach((el) => { const f = CALC[el.dataset.calc]; if (f) el.innerHTML = f(el); });
    $$('.fld').forEach((el) => {
      const inp = el.querySelector('[data-bind][aria-required="true"]');
      if (inp) { const v = getPath(S.profile, inp.dataset.bind); el.classList.toggle('is-missing', !has(v)); }
    });
  }

  /* ================================================================ events */
  function onInput(e) {
    const el = e.target;
    if (el.dataset.bind) {
      if (el.type === 'radio' && !el.checked) return;
      let v = el.value;
      if (el.dataset.num) v = v.replace(/[^\d.\-]/g, '');
      if (el.closest('.affix') && el.closest('.affix').querySelector('.pre') && el.closest('.affix').querySelector('.pre').textContent === '₱') v = v.replace(/[^\d.\-]/g, '');
      setPath(S.profile, el.dataset.bind, v);
      if (el.dataset.num || (el.inputMode === 'decimal')) { /* keep raw text while typing */ }
      touch(); refreshCalcs();
      if (e.type === 'change' && /^(loan\.applicantType|loan\.collateral|loan\.elig|fs\.years\.\d+\.basis|business\.(startYear|employees|address\.province|netAssets))/.test(el.dataset.bind) && /^#loan|^#finance/.test(location.hash)) route();
    } else if (el.dataset.arr) {
      const arr = (getPath(S.profile, el.dataset.arr) || []).slice();
      const i = arr.indexOf(el.value);
      if (el.checked && i < 0) arr.push(el.value); if (!el.checked && i >= 0) arr.splice(i, 1);
      setPath(S.profile, el.dataset.arr, arr); touch(); refreshCalcs();
    } else if (el.dataset.bool) {
      setPath(S.profile, el.dataset.bool, el.checked);
      if (el.dataset.bool === 'consent.share') S.profile.consent.at = el.checked ? new Date().toISOString() : '';
      touch(); refreshCalcs(); if (e.type === 'change') route();
    } else if (el.dataset.setting) {
      const k = el.dataset.setting;
      S.settings[k] = el.type === 'checkbox' ? el.checked : (k === 'size' ? Number(el.value) : el.value);
      Store.setMeta('settings', S.settings); applySettings();
      if (k === 'lang') { S.profile.lang = el.value; S.shellMode = ''; }
      route();
    }
  }

  async function onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act, p = S.profile;
    switch (a) {
      case 'addRow': { const arr = getPath(p, b.dataset.path) || []; arr.push(TPL[b.dataset.tpl]()); setPath(p, b.dataset.path, arr); touch(); route(); break; }
      case 'delRow': {
        const arr = getPath(p, b.dataset.path);
        if (!confirm(t('Remove') + '?')) return;
        arr.splice(Number(b.dataset.i), 1); touch(); route(); break;
      }
      case 'useEx': setPath(p, b.dataset.path, EX[b.dataset.path]); touch(); route(); break;
      case 'speak': speak(b.dataset.text); break;
      case 'closeModal': closeModal(); break;
      case 'copyAddr': p.business.address = Object.assign({}, p.owner.address); touch(); route(); break;
      case 'fillFromFs': {
        const lf = C.latestFs(p); if (!lf) return toast('No financial statement yet.', 'err');
        if (has(lf.y.sales)) p.business.annualSales = String(n(lf.y.sales));
        if (lf.c.hasBS) p.business.netAssets = String(Math.round((lf.c.totalAssets - lf.c.totalLiab) * 100) / 100);
        touch(); route(); toast('Filled from ' + lf.y.year + ' statements.', 'ok'); break;
      }
      case 'addNeed': if (p.needs.indexOf(b.dataset.v) < 0) p.needs.push(b.dataset.v); touch(); route(); break;
      case 'addRisks': {
        const have = p.plan.risks.filter((r) => has(r.risk));
        COMMON_RISKS.forEach(([r, m]) => { if (!have.some((x) => x.risk === r)) have.push({ risk: r, mitigation: m }); });
        p.plan.risks = have; touch(); route(); toast('Added. Edit or remove what does not apply to you.', 'ok'); break;
      }
      case 'genSummary': {
        if (has(p.plan.summary) && !confirm('Replace your current summary with a new draft?')) return;
        p.plan.summary = D.autoSummary(p); touch(); route(); break;
      }
      case 'loanFromItems': { const pc = C.planCalc(p); if (pc.pc.totalLoan) { p.loan.amount = String(pc.pc.totalLoan); touch(); route(); } else toast('No items marked as paid by loan.', 'err'); break; }
      case 'fsYear': S.ui.fsYear = Number(b.dataset.i); route(); break;
      case 'fsTab': S.ui.fsTab = b.dataset.t; route(); break;
      case 'addYear': {
        const ys = p.fs.years; const next = ys.length ? Math.max(...ys.map((y) => y.year)) + 1 : new Date().getFullYear() - 1;
        const yr = Number(prompt('Year to add (e.g. ' + next + '):', next)); if (!yr || ys.some((y) => y.year === yr)) return;
        const ny = C.newFsYear(yr); if (yr >= new Date().getFullYear()) ny.basis = 'estimate';
        ys.push(ny); ys.sort((x, y) => x.year - y.year); S.ui.fsYear = ys.indexOf(ny); touch(); route(); break;
      }
      case 'delYear': { const y = p.fs.years[S.ui.fsYear]; if (!confirm('Remove all figures for ' + y.year + '?')) return; p.fs.years.splice(S.ui.fsYear, 1); S.ui.fsYear = p.fs.years.length - 1; touch(); route(); break; }
      case 'prevFill': {
        const rows = C.fsCalc(p); const i = S.ui.fsYear; const y = p.fs.years[i], prev = rows.find((r) => r.y === p.fs.years[i - 1]); if (!prev) return;
        if (has(prev.y.endInv)) y.begInv = String(n(prev.y.endInv));
        if (prev.c.hasBS) y.capitalBeg = String(Math.round(prev.c.capitalEnd * 100) / 100);
        if (has(prev.y.cash)) y.cf.beg = String(n(prev.y.cash));
        touch(); route(); toast('Beginning inventory, capital and cash copied from ' + prev.y.year + '.', 'ok'); break;
      }
      case 'cfFromIs': {
        const y = p.fs.years[S.ui.fsYear], o = cur();
        if (has(y.sales)) y.cf.inSales = String(n(y.sales)); if (has(y.purchases)) y.cf.outPurchases = String(n(y.purchases));
        if (o.c.opexTotal) y.cf.outOpex = String(o.c.opexTotal); if (has(y.drawings)) y.cf.outDrawings = String(n(y.drawings));
        touch(); route(); toast('Copied. Adjust if some sales were on credit or some expenses unpaid.', 'ok'); break;
      }
      case 'addLabel': {
        const lab = (prompt('Name of the new line:') || '').replace(/["<>.&]/g, '').trim(); if (!lab) return;
        const L = p.fs[b.dataset.list]; if (L.indexOf(lab) < 0) L.push(lab); touch(); route(); break;
      }
      case 'delLabel': {
        const L = p.fs[b.dataset.list]; const lab = L[Number(b.dataset.i)];
        if (!confirm('Remove "' + lab + '" from all years?')) return;
        L.splice(Number(b.dataset.i), 1);
        const key = { opexLabels: 'opex', ncaLabels: 'nca', liabLabels: 'liab' }[b.dataset.list];
        p.fs.years.forEach((y) => { delete y[key][lab]; }); touch(); route(); break;
      }
      case 'fsCsv': downloadFsCsv(); break;
      case 'doc': openDoc(b.dataset.doc, p); break;
      case 'docWord': {
        if (b.dataset.doc === '__obj' && S._docObj) { download(D.wordBlob(S._docObj.doc), S._docObj.base + '.doc'); break; }
        const prof = (b.closest('#docView') && S._docProfile) || p;
        const d = D.LIST.find((x) => x.id === b.dataset.doc); const doc = d.fn(prof); download(D.wordBlob(doc), fileName(doc.title, prof) + '.doc'); break;
      }
      case 'printDoc': { const f = $('#docFrame'); f.contentWindow.focus(); f.contentWindow.print(); break; }
      case 'closeDoc': { const v = $('#docView'); if (v) v.remove(); break; }
      case 'viewFile': viewFile(b.dataset.id); break;
      case 'delDoc': {
        if (!confirm('Delete this document from this device' + (S.session ? ' and the online account' : '') + '?')) return;
        const d = p.documents.find((x) => x.id === b.dataset.id);
        p.documents = p.documents.filter((x) => x.id !== b.dataset.id);
        p.trainings.forEach((tr) => { if (tr.certificateDocId === b.dataset.id) tr.certificateDocId = ''; });
        await Store.delFile(b.dataset.id);
        if (d && d.driveId && S.session) API.call({ action: 'deleteFile', token: S.session.token, driveId: d.driveId }).catch(() => {});
        touch(); route(); break;
      }
      case 'loadSample': if (confirm('Load a fictional sample business to try the EMBRACE Portal? You can erase it later in Settings.')) { S.profile = C.normalize(sampleProfile()); touch(); route(); } break;
      case 'backup': backup(); break;
      case 'submit': submitApp(); break;
      case 'syncNow': sync({ toast: true }); break;
      case 'register': accountDialog('register'); break;
      case 'signIn': accountDialog('signin'); break;
      case 'doRegister': doRegister(); break;
      case 'doSignIn': doSignIn(); break;
      case 'signOut': if (confirm('Sign out? Your data stays on this device.')) { S.session = null; await Store.setSecure('session', null); renderSyncPill(); route(); } break;
      case 'conflictMine': closeModal(); sync({ force: true, toast: true }); break;
      case 'conflictTheirs': {
        closeModal(); const c = S._conflict; if (!c || !c.theirs) return;
        S.profile = C.normalize(c.theirs); S.profile.meta.serverUpdatedAt = c.serverUpdatedAt; S.profile.meta.dirty = false;
        await Store.saveProfile(S.profile); route(); toast('Online version loaded.', 'ok'); break;
      }
      case 'changePin': pinChangeDialog(); break;
      case 'doChangePin': doChangePin(); break;
      case 'lockNow': Store.lock(); lockScreen(); break;
      case 'wipe': if (confirm('Erase ALL EMBRACE Portal data on this device? Download a backup first if you need it.') && confirm('Are you sure? This cannot be undone.')) { await Store.wipe(); location.hash = ''; location.reload(); } break;
      default: if (G.GrowLoans && /^ln[A-Z]/.test(a)) { G.GrowLoans.onClick(a, b); return; } if (G.GrowAI && G.GrowAI.onClick(a, b)) return; if (G.GrowAdmin && G.GrowAdmin.onClick) G.GrowAdmin.onClick(a, b, e);
    }
  }

  async function onFile(e) {
    const el = e.target;
    if (el.dataset.restore) return restore(el.files[0]);
    if (!el.dataset.upload) return;
    const file = el.files && el.files[0]; if (!file) return;
    const cat = el.dataset.upload.charAt(0) === '#' ? $(el.dataset.upload).value : el.dataset.upload;
    try {
      let data = await readAsDataURL(file), mime = file.type || 'application/octet-stream', name = file.name;
      if (/^image\/(jpeg|png|webp)/.test(mime)) { const r = await shrinkImage(data); data = r; mime = 'image/jpeg'; name = name.replace(/\.\w+$/, '') + '.jpg'; }
      const size = Math.round((data.length - data.indexOf(',') - 1) * 0.75);
      if (size > 5 * 1024 * 1024) return toast('File is larger than 5 MB.', 'err');
      const id = C.uid('d');
      await Store.putFile(id, { name, mime, data });
      S.profile.documents.push({ id, category: cat, name, mime, size, addedAt: new Date().toISOString(), driveId: '' });
      if (el.dataset.link) setPath(S.profile, el.dataset.link, id);
      touch(); route(); toast('Saved: ' + cat, 'ok');
      if (G.GrowAI) G.GrowAI.afterUpload(id);
    } catch (err) { toast('Could not read file: ' + err.message, 'err'); }
  }
  function readAsDataURL(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(f); }); }
  function shrinkImage(dataUrl) {
    return new Promise((res) => {
      const img = new Image(); img.onload = () => {
        const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.82));
      }; img.onerror = () => res(dataUrl); img.src = dataUrl;
    });
  }
  async function viewFile(id) {
    const f = await Store.getFile(id); if (!f) return toast('File is not on this device (it may be stored online only).', 'err');
    const blob = await (await fetch(f.data)).blob(); const url = URL.createObjectURL(blob);
    if (/^image\//.test(f.mime)) modal(`<h2>${esc(f.name)}</h2><img src="${url}" alt="${esc(f.name)}" class="preview-img">`, 'wide');
    else { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.download = f.name; a.click(); }
  }

  /* ================================================================ documents */
  function openDoc(id, profile) {
    const d = D.LIST.find((x) => x.id === id); if (!d) return;
    showDoc(d.fn(profile || S.profile), id);
    S._docProfile = profile || S.profile;
  }
  /* open any generated document object {title, html} (e.g. Statement of Account) */
  function openDocObj(doc, base) { S._docObj = { doc, base }; showDoc(doc, '__obj'); }
  function showDoc(doc, id) {
    const old = $('#docView'); if (old) old.remove();
    const v = document.createElement('div'); v.id = 'docView'; v.className = 'docview';
    v.innerHTML = `<div class="doc-bar"><button class="btn ghost" data-act="closeDoc">${ic('arrowL')} ${t('Back')}</button><b>${esc(doc.title)}</b>
      <div class="btns"><button class="btn" data-act="printDoc">${ic('print')} ${t('Print')} / PDF</button><button class="btn ghost" data-act="docWord" data-doc="${id}">${ic('down')} Word</button></div></div>
      <iframe id="docFrame" title="${esc(doc.title)}"></iframe>`;
    document.body.appendChild(v);
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(doc.title)}</title><style>@page{size:auto;margin:14mm}body{max-width:820px;margin:0 auto;padding:18px;background:#fff}${D.PRINT_CSS}@media print{body{padding:0}}</style></head><body>${doc.html}</body></html>`;
    const fr = $('#docFrame'); fr.srcdoc = html;
  }
  function fileName(s, prof) { prof = prof || S.profile; const nm = (prof.business.name || prof.owner.lastName || 'EMBRACE').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_'); return s.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_') + '_' + nm; }
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000); }
  function downloadFsCsv() {
    const p = S.profile, rows = C.fsCalc(p), q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
    const lines = [['', ...rows.map((r) => r.y.year + ' (' + r.y.basis + ')')]];
    const add = (l, f) => lines.push([l, ...rows.map((r) => { const x = f(r); return x == null ? '' : x; })]);
    add('Sales', (r) => n(r.y.sales)); add('Beginning inventory', (r) => n(r.y.begInv)); add('Purchases', (r) => n(r.y.purchases)); add('Ending inventory', (r) => n(r.y.endInv));
    add('Cost of sales', (r) => r.c.cogs); add('Gross income', (r) => r.c.gross);
    p.fs.opexLabels.forEach((l) => add(l, (r) => n(r.y.opex[l]))); add('Total operating expenses', (r) => r.c.opexTotal); add('Net income', (r) => r.c.net);
    add('Cash', (r) => n(r.y.cash)); add('Receivables', (r) => n(r.y.receivables)); add('Total current assets', (r) => r.c.curAssets); add('Net non-current assets', (r) => r.c.ncaNet);
    add('Total assets', (r) => r.c.totalAssets); add('Total liabilities', (r) => r.c.totalLiab); add('Capital end', (r) => r.c.capitalEnd); add('Balance difference', (r) => r.c.diff);
    add('Cash flow - ending cash', (r) => r.c.cfEnd);
    download(new Blob(['﻿' + lines.map((l) => l.map(q).join(',')).join('\r\n')], { type: 'text/csv' }), fileName('Financial_Statements') + '.csv');
  }
  async function backup() {
    const files = {};
    for (const d of S.profile.documents) { const f = await Store.getFile(d.id); if (f) files[d.id] = f; }
    const data = { app: 'EMBRACE', version: G.GROW_CONFIG.VERSION, exportedAt: new Date().toISOString(), profile: S.profile, files };
    download(new Blob([JSON.stringify(data)], { type: 'application/json' }), fileName('EMBRACE_backup') + '_' + new Date().toISOString().slice(0, 10) + '.json');
    toast('Backup downloaded. Keep it in a safe place — it contains your personal information.', 'ok');
  }
  async function restore(file) {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (['GROW', 'EMBRACE'].indexOf(data.app) < 0 || !data.profile) throw new Error('Not an EMBRACE Portal backup file.');
      if (!confirm('Replace the data on this device with the backup from ' + new Date(data.exportedAt).toLocaleString() + '?')) return;
      S.profile = C.normalize(data.profile);
      for (const id of Object.keys(data.files || {})) await Store.putFile(id, data.files[id]);
      touch(); await persist(); route(); toast('Backup restored.', 'ok');
    } catch (e) { toast(e.message, 'err'); }
  }

  /* ================================================================ accounts */
  function accountDialog(mode) {
    if (!S.online && !API.isGas()) return toast('You need internet for this.', 'err');
    if (mode === 'register') {
      modal(`<h2>${t('Create account')}</h2><p class="muted">Your online EMBRACE Passport lets you back up, use another device and submit to OLEDIPO.</p>
        <div class="fld"><label for="acMobile">${t('Mobile number')}</label><input id="acMobile" type="tel" inputmode="tel" value="${esc(S.profile.owner.contact || '')}" placeholder="09XXXXXXXXX"></div>
        <div class="fld"><label for="acPin">Online PIN (4–8 digits)</label><input id="acPin" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div>
        <div class="fld"><label for="acPin2">Repeat PIN</label><input id="acPin2" type="password" inputmode="numeric" maxlength="8" autocomplete="new-password"></div>
        <p class="muted small">By creating an account, your Passport will be stored on the Provincial Government's secure Google server. It will only be shared with OLEDIPO evaluators after you give consent.</p>
        <div class="btns"><button class="btn" data-act="doRegister">${t('Create account')}</button></div><p id="acErr" class="err" role="alert"></p>`);
    } else {
      modal(`<h2>${t('Sign in')}</h2><div class="fld"><label for="acId">Passport ID or mobile number</label><input id="acId" type="text" autocomplete="username"></div>
        <div class="fld"><label for="acPin">Online PIN</label><input id="acPin" type="password" inputmode="numeric" maxlength="8" autocomplete="current-password"></div>
        <div class="btns"><button class="btn" data-act="doSignIn">${t('Sign in')}</button></div><p id="acErr" class="err" role="alert"></p>`);
    }
  }
  async function doRegister() {
    const m = $('#acMobile').value, p1 = $('#acPin').value, p2 = $('#acPin2').value;
    if (p1 !== p2) return ($('#acErr').textContent = 'PINs do not match.');
    try {
      const r = await API.call({ action: 'register', mobile: m, pin: p1 });
      S.session = { token: r.token, passportId: r.passportId }; S.profile.passportId = r.passportId; S.profile.meta.serverUpdatedAt = '';
      await Store.setSecure('session', S.session); closeModal(); touch(); await persist(); await sync({ toast: true }); route();
      modal(`<h2>${ic('check')} Account created</h2><p>Your EMBRACE Passport ID is</p><p class="big-id">${esc(r.passportId)}</p><p>Write it down. You can sign in with this ID or your mobile number.</p>`);
    } catch (e) { $('#acErr').textContent = e.message; }
  }
  async function doSignIn() {
    try {
      const r = await API.call({ action: 'login', id: $('#acId').value, pin: $('#acPin').value });
      S.session = { token: r.token, passportId: r.passportId }; await Store.setSecure('session', S.session);
      const localHasData = !!(S.profile.owner.firstName || S.profile.business.name);
      if (r.profile) {
        if (!localHasData || confirm('Load your online Passport on this device? (OK = use online data, Cancel = keep this device\'s data and upload it)')) {
          S.profile = C.normalize(r.profile); S.profile.meta.serverUpdatedAt = r.serverUpdatedAt; S.profile.meta.dirty = false; await Store.saveProfile(S.profile);
        } else { S.profile.passportId = r.passportId; S.profile.meta.serverUpdatedAt = r.serverUpdatedAt; touch(); await persist(); await sync({ force: true }); }
      } else { S.profile.passportId = r.passportId; touch(); await persist(); await sync(); }
      closeModal(); renderSyncPill(); route(); toast('Signed in as ' + r.passportId, 'ok');
    } catch (e) { $('#acErr').textContent = e.message; }
  }
  async function submitApp() {
    const p = S.profile;
    if (!p.consent.share) return toast('Please give consent first.', 'err');
    if (!API.configured()) return toast('Online submission is not available in this copy. Print your documents and submit them at the LEDIP Center.', 'err');
    if (!S.session) { toast('Create or sign in to an online account first.', 'err'); return accountDialog('register'); }
    const miss = C.overall(p).missing.length;
    if (miss && !confirm(miss + ' item(s) are still missing. Submit anyway? OLEDIPO may ask you to complete them.')) return;
    try {
      await sync();
      if (p.meta.dirty) throw new Error('Could not sync. Check your internet and try again.');
      const r = await API.call({ action: 'submit', token: S.session.token, consent: true });
      p.review = r.review; await Store.saveProfile(p); route();
      modal(`<h2>${ic('check')} Submitted</h2><p>Your application was sent to OLEDIPO / LEDIP Center. The Secretariat will contact you at <b>${esc(p.owner.contact)}</b> to schedule an interview.</p><p class="muted">Remember: bring 3 signed copies of the Application Form and your original documents.</p>`);
    } catch (e) { toast(e.message, 'err'); }
  }
  function pinChangeDialog() {
    modal(`<h2>Change PIN</h2><div class="fld"><label for="pOld">Current PIN</label><input id="pOld" type="password" inputmode="numeric" maxlength="8"></div>
      <div class="fld"><label for="pNew">New PIN (4–8 digits)</label><input id="pNew" type="password" inputmode="numeric" maxlength="8"></div>
      ${S.session ? '<label class="toggle"><input type="checkbox" id="pOnline" checked> Also change my online PIN</label>' : ''}
      <div class="btns"><button class="btn" data-act="doChangePin">Change PIN</button></div><p id="acErr" class="err" role="alert"></p>`);
  }
  async function doChangePin() {
    const o = $('#pOld').value, nw = $('#pNew').value;
    if (!/^\d{4,8}$/.test(nw)) return ($('#acErr').textContent = 'PIN must be 4 to 8 digits.');
    try {
      await Store.unlock(o);
      if (S.session && $('#pOnline') && $('#pOnline').checked) await API.call({ action: 'changePin', token: S.session.token, oldPin: o, newPin: nw });
      await Store.changePin(nw); closeModal(); toast('PIN changed.', 'ok');
    } catch (e) { $('#acErr').textContent = e.message === 'Wrong PIN' ? 'Current PIN is wrong.' : e.message; }
  }

  function speak(text) {
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = S.settings.lang === 'en' ? 'en-PH' : 'fil-PH'; u.rate = 0.92;
      speechSynthesis.speak(u);
    } catch (e) { /* not supported */ }
  }

  /* ================================================================ lock / welcome */
  function lockScreen() {
    document.body.innerHTML = `<header class="top gate-top"><span class="brand">${LOGO()}<span><b>EMBRACE Portal</b><small>Expanded Micro Business Recovery Assistance during Crisis and Emergency</small></span></span></header><div class="gate"><div class="gate-card"><h1>EMBRACE Portal</h1><p class="muted">Expanded Micro Business Recovery Assistance during Crisis and Emergency</p>
      <form id="unlockForm"><label for="pin">${t('Enter your PIN')}</label><input id="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="current-password" class="pin-in" required>
      <button class="btn big full" type="submit">${ic('lock')} ${t('Unlock')}</button><p id="pinErr" class="err" role="alert"></p></form>
      <details class="small"><summary>${t('Forgot PIN?')}</summary><p>For your security, your data on this device can only be opened with your PIN. If you have an online account, you can erase this device and sign in again to restore your Passport.</p>
      <button class="btn sm ghost danger" id="forgotWipe">Erase this device and start again</button></details>
      <p class="small"><a href="#admin" id="staffLink">${t('OLEDIPO Staff')}</a></p></div></div><div id="toasts"></div>`;
    $('#pin').focus();
    $('#unlockForm').onsubmit = async (e) => {
      e.preventDefault();
      try { await Store.unlock($('#pin').value); await start(); } catch (err) { $('#pinErr').textContent = 'Wrong PIN. Please try again.'; $('#pin').value = ''; $('#pin').focus(); }
    };
    $('#forgotWipe').onclick = async () => { if (confirm('Erase all EMBRACE Portal data on this device?')) { await Store.wipe(); location.reload(); } };
    $('#staffLink').onclick = () => { setTimeout(route, 0); };
  }
  function welcome() {
    document.body.innerHTML = `<header class="top gate-top"><span class="brand">${LOGO()}<span><b>EMBRACE Portal</b><small>Expanded Micro Business Recovery Assistance during Crisis and Emergency</small></span></span></header><div class="gate"><div class="gate-card wide"><h1>EMBRACE Portal</h1><p class="lead">Expanded Micro Business Recovery Assistance during Crisis and Emergency</p>
      <p>Your guide to preparing a <b>business plan</b>, <b>financial statements</b> and <b>EMBRACE loan requirements</b> — on your phone or computer, even without internet.</p>
      <h2>${t('Choose your language')}</h2><div class="chips center">${Object.entries(I.LANGS).map(([k, v]) => `<label class="chip big"><input type="radio" name="wl" value="${k}" ${S.settings.lang === k ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>
      <form id="pinForm"><h2>${t('Create a PIN')}</h2><p class="muted small">4 to 8 numbers. It protects your information on this device. Do not share it.</p>
      <div class="row"><div class="fld"><label for="p1">PIN</label><input id="p1" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" class="pin-in" autocomplete="new-password" required></div>
      <div class="fld"><label for="p2">Repeat PIN</label><input id="p2" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" class="pin-in" autocomplete="new-password" required></div></div>
      <button class="btn big full" type="submit">${t('Get started')} ${ic('arrowR')}</button><p id="pinErr" class="err" role="alert"></p></form>
      <p class="muted small">Your information stays on this device unless you choose to link an online account and give consent to share it with OLEDIPO.</p>
      <p class="small"><a href="#admin" id="staffLink">${t('OLEDIPO Staff')}</a></p></div></div><div id="toasts"></div>`;
    $$('input[name="wl"]').forEach((r) => (r.onchange = () => { S.settings.lang = r.value; Store.setMeta('settings', S.settings); applySettings(); welcome(); }));
    $('#pinForm').onsubmit = async (e) => {
      e.preventDefault();
      const a = $('#p1').value, b = $('#p2').value;
      if (!/^\d{4,8}$/.test(a)) return ($('#pinErr').textContent = 'PIN must be 4 to 8 numbers.');
      if (a !== b) return ($('#pinErr').textContent = 'PINs do not match.');
      await Store.createPin(a);
      S.profile = C.newProfile(); S.profile.lang = S.settings.lang;
      await Store.saveProfile(S.profile); await start();
    };
    $('#staffLink').onclick = () => { setTimeout(route, 0); };
  }

  /* ================================================================ sample (fictional) */
  function sampleProfile() {
    const y = new Date().getFullYear(), P = C.newProfile();
    Object.assign(P.owner, { lastName: 'Dela Peña', firstName: 'Liza', middleName: 'Santos', dob: '1980-05-14', sex: 'Female', civilStatus: 'Married', contact: '09170000000', email: '', facebook: 'facebook.com/nanaylizasbatchoy',
      address: { lot: '12', street: 'Rizal St.', brgy: 'Poblacion', municipality: 'Sample Town', province: 'Iloilo', zip: '5000' }, district: '4', residentSinceYear: '1980', role: 'Owner', education: 'High school', experience: EX['owner.experience'] });
    Object.assign(P.business, { name: "Nanay Liza's Batchoy House (SAMPLE)", address: { lot: 'Stall 21', street: 'Public Market', brgy: 'Poblacion', municipality: 'Sample Town', province: 'Iloilo', zip: '5000' },
      startYear: String(y - 9), type: 'Service', ownership: 'Single Proprietorship', nature: 'Eatery', employees: { male: '1', female: '1' }, employment: { permanent: '2', contractual: '', casual: '', seasonal: '', others: '' },
      registrations: ['DTI', "Mayor's Permit", 'Barangay Permit'], products: ['Batchoy', 'Pancit canton', 'Puto', 'Softdrinks', ''], capital: '120000', annualSales: '489600', netAssets: '185000', description: EX['business.description'], operations: 'Open Monday to Saturday, 6:00 AM to 6:00 PM' });
    Object.assign(P.plan, {
      projectName: EX['plan.projectName'], productDescription: EX['plan.productDescription'], targetMarket: EX['plan.targetMarket'], marketArea: EX['plan.marketArea'],
      promotion: ['Word of mouth / suki', 'Facebook page'], salesStrategy: EX['plan.salesStrategy'], competitors: EX['plan.competitors'], advantage: EX['plan.advantage'], process: EX['plan.process'], daysPerMonth: 26,
      products: [
        { id: C.uid('pr'), name: 'Batchoy', unit: 'bowl', price: '55', qty: '25', per: 'day', unitCost: '', costing: { materials: '650', labor: '300', overhead: '100', units: '25' } },
        { id: C.uid('pr'), name: 'Puto', unit: 'piece', price: '6', qty: '20', per: 'day', unitCost: '3.5', costing: { materials: '', labor: '', overhead: '', units: '' } },
        { id: C.uid('pr'), name: 'Softdrinks', unit: 'bottle', price: '20', qty: '24', per: 'day', unitCost: '13', costing: { materials: '', labor: '', overhead: '', units: '' } }],
      opex: [{ label: 'Stall rental', amount: '2000' }, { label: 'Electricity and water', amount: '1020' }, { label: 'Permits (monthly share)', amount: '300' }],
      rawMaterials: [{ item: 'Pork, liver, noodles, vegetables, seasoning', source: 'Public market' }, { item: 'Softdrinks', source: 'Truck delivery (distributor)' }, { item: 'Puto', source: 'Local supplier at the market' }],
      equipment: [{ item: 'Kitchen utensils' }, { item: 'Big cooking pans' }, { item: 'Two-burner stove' }, { item: 'Tables and chairs' }],
      employees: [{ name: 'Employee A', work: 'Cook / helper', status: 'Permanent' }, { name: 'Employee B', work: 'Waiter', status: 'Permanent' }],
      itemsFunded: [{ item: 'Stainless kitchen sink with counter', qty: '1', unitCost: '15000', type: 'fixed', source: 'loan' }, { item: 'Chest freezer', qty: '1', unitCost: '18000', type: 'fixed', source: 'loan' },
        { item: 'Tables', qty: '4', unitCost: '2000', type: 'fixed', source: 'loan' }, { item: 'Chairs', qty: '12', unitCost: '550', type: 'fixed', source: 'loan' }, { item: 'Working capital (raw materials)', qty: '1', unitCost: '2400', type: 'working', source: 'loan' },
        { item: 'Kitchen utensils', qty: '1', unitCost: '4000', type: 'fixed', source: 'equity' }],
      beginningCash: '15000', growthPct: '1', drawings: '6000', includeLoan: true,
      goals: [{ goal: 'Add pancit and dinuguan to the daily menu', target: '+₱8,000 sales per month', by: 'Within 6 months' }, { goal: 'Accept online orders through Facebook', target: '10 orders per week', by: 'Within 1 year' }],
      risks: COMMON_RISKS.slice(0, 3).map(([r, m]) => ({ risk: r, mitigation: m })), assumptions: EX['plan.assumptions']
    });
    P.plan.summary = '';
    P.fs.years = [y - 3, y - 2, y - 1].map((yy, i) => {
      const f = C.newFsYear(yy);
      const sales = [420000, 455000, 489600][i], beg = [8000, 9000, 9500][i], pur = [250000, 268000, 279000][i], end = [9000, 9500, 10000][i];
      Object.assign(f, { sales: String(sales), begInv: String(beg), purchases: String(pur), endInv: String(end), cash: String([30000, 33700, 38360][i]), receivables: '', capitalBeg: '140500', drawings: String([24000, 26000, 28000][i]) });
      f.opex = { 'Salaries and Wages': String([96000, 102000, 108000][i]), Rent: '24000', 'Power, Light and Water': String([11000, 11800, 12240][i]), 'Permits and Licenses': '3500' };
      f.nca = { 'Equipment': { cost: '60000', dep: String([12000, 18000, 24000][i]) }, 'Furniture and Fixtures': { cost: '25000', dep: String([5000, 7500, 10000][i]) } };
      return f;
    });
    // make the sample balance sheets consistent (computed, not invented: capital end = beg + NI − drawings; cash set so assets = liab + capital)
    const fs = P.fs;
    fs.years.forEach((yy, i) => {
      const c = C.fsYearCalc(yy, fs);
      if (i > 0) { const pc = C.fsYearCalc(fs.years[i - 1], fs); yy.capitalBeg = String(Math.round(pc.capitalEnd)); }
      const c2 = C.fsYearCalc(yy, fs);
      const needCash = c2.capitalEnd + c2.totalLiab - (c2.totalAssets - n(yy.cash));
      yy.cash = String(Math.round(needCash));
      yy.cf = { beg: '', inSales: yy.sales, inLoans: '', inOwner: '', inOther: '', outPurchases: yy.purchases, outOpex: String(c.opexTotal), outAssets: '', outLoan: '', outDrawings: yy.drawings, outOther: '' };
      const net = n(yy.cf.inSales) - n(yy.cf.outPurchases) - n(yy.cf.outOpex) - n(yy.cf.outDrawings);
      if (i === 0) yy.cf.beg = String(Math.round(n(yy.cash) - net));
      else {
        yy.cf.beg = fs.years[i - 1].cash;
        const diff = Math.round(n(yy.cf.beg) + net - n(yy.cash)); // other receipts / payments in the fictional sample
        if (diff > 0) yy.cf.outOther = String(diff); else if (diff < 0) yy.cf.inOther = String(-diff);
      }
    });
    Object.assign(P.loan, { applicantType: 'micro', amount: '50000', purposes: ['Acquisition of Equipment', 'Working Capital'], collateral: 'comaker', comaker: { name: 'Juan Dela Cruz', relation: 'Brother', contact: '09180000000', occupation: 'Public school teacher', income: '28000' },
      elig: { resident6mo: 'yes', inIloilo: '', operating1yr: '', closure1mo: 'yes', drop20pct: 'yes', assetsUnder3M: '', employees2to9: '', noGovAssist: 'yes' } });
    P.trainings = [{ id: C.uid('tr'), title: 'Basic Entrepreneurship Training', kind: 'Training', provider: 'LEDIP Center', date: (y - 2) + '-03-15', hours: '16', topics: 'Business planning, bookkeeping', skills: 'Preparing a simple cash book', certificateDocId: '' },
      { id: C.uid('tr'), title: 'Food Safety Seminar', kind: 'Seminar', provider: 'DTI Iloilo', date: (y - 1) + '-08-02', hours: '8', topics: 'Safe food handling', skills: 'Proper storage and sanitation', certificateDocId: '' }];
    P.needs = ['Digital marketing and social media', 'Costing and pricing'];
    return P;
  }

  /* ================================================================ boot */
  async function start() {
    const p = await Store.getProfile();
    S.profile = C.normalize(p || C.newProfile());
    S.session = await Store.getSecure('session').catch(() => null);
    S.shellMode = '';
    applySettings();
    if (!location.hash || location.hash === '#') location.hash = '#home'; else route();
    if (S.session) sync();
    if (G.GrowLoans) G.GrowLoans.load(false).then(() => { if (/^#(home)?$/.test(location.hash || '#home') && G.GrowLoans.hasLoans()) route(); });
  }
  let bound = false;
  function bindOnce() {
    if (bound) return; bound = true;
    document.addEventListener('input', onInput);
    document.addEventListener('change', (e) => {
      if (e.target.type === 'file') return onFile(e);
      if (e.target.id === 'langSel') {
        S.settings.lang = e.target.value; if (S.profile) S.profile.lang = e.target.value;
        Store.setMeta('settings', S.settings); applySettings(); S.shellMode = ''; return route();
      }
      onInput(e);
    });
    document.addEventListener('click', onClick);
    G.addEventListener('hashchange', () => {
      if ((location.hash || '').indexOf('#admin') === 0) return route();
      if (!S.profile) return location.reload();
      route();
    });
    G.addEventListener('online', () => { S.online = true; renderSyncPill(); sync(); });
    G.addEventListener('offline', () => { S.online = false; renderSyncPill(); });
  }

  async function boot() {
    S.settings = Object.assign(S.settings, (await Store.getMeta('settings')) || {});
    applySettings();
    bindOnce();
    if ((location.hash || '').indexOf('#admin') === 0) return renderAdmin();
    if (G.GrowLanding) return G.GrowLanding.show(enterApp, () => renderAdmin());
    enterApp();
  }
  async function enterApp() {
    window.scrollTo(0, 0);
    const st = await Store.status();
    if (!st.hasPin) return welcome();
    if (!Store.cryptoAvailable) { await Store.unlock(''); return start(); }
    lockScreen();
  }

  function renderAdmin() {
    if (!G.GrowAdmin) return;
    if (S.shellMode !== 'admin' || !$('#main')) {
      S.shellMode = 'admin';
      document.body.innerHTML = `<header class="top"><a class="brand" href="#home">${LOGO()}<span><b>EMBRACE Portal</b><small>Expanded Micro Business Recovery Assistance during Crisis and Emergency · OLEDIPO Staff</small></span></a>
        <div class="top-r"><a class="btn sm ghost" href="#home">${ic('arrowL')} Applicant app</a></div></header><main id="main" class="admin-main" tabindex="-1"></main><div id="toasts" aria-live="polite"></div>`;
    }
    G.GrowAdmin.render();
  }


  G.GrowApp = { S, ic, esc, toast, modal, closeModal, openDoc, openDocObj, download, field, refreshCalcs, renderAdmin, getPath, touch, persist, route, sync };
  document.addEventListener('DOMContentLoaded', boot);
})(window);
