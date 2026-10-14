/* EMBRACE Portal — AI services: document completeness check (free), paid AI Business Plan / Loan-Readiness Review, GCash payment.
   All AI calls go through the Apps Script backend (the OpenAI key never reaches the browser). */
(function (G) {
  'use strict';
  const C = G.GrowCalc, API = G.GrowAPI, Store = G.GrowStore;
  const A = () => G.GrowApp;
  const esc = (s) => G.GrowDocs.esc(s);
  const ic = (k, c) => A().ic(k, c);
  const $ = (s) => document.querySelector(s);
  const peso = (x) => C.peso(Number(x || 0), 0);
  let info = null, orders = null, busy = {};

  const STATUS = {
    complete: ['ok', 'Complete'], incomplete: ['warn', 'Incomplete'], unreadable: ['warn', 'Unreadable'],
    wrong_document: ['bad', 'Wrong document'], expired: ['bad', 'Expired']
  };

  /* ---------------- service info (prices, GCash, AI on/off) ---------------- */
  async function loadInfo(force) {
    if (info && !force) return info;
    info = (await Store.getMeta('services').catch(() => null)) || null;
    if (API.configured() && navigator.onLine) {
      try { info = await API.get({ action: 'services' }); await Store.setMeta('services', info); } catch (e) { /* keep cached */ }
    }
    return info;
  }
  const S = () => A().S;
  const online = () => navigator.onLine && API.configured();

  /* ---------------- consent ---------------- */
  function hasConsent() { return !!(S().profile.consent && S().profile.consent.ai); }
  function askConsent() {
    return new Promise((resolve) => {
      A().modal(`<h2>${ic('bulb')} Allow AI assistance?</h2>
        <p>To check your documents for completeness, the portal sends the documents you upload to <b>OpenAI</b>, an AI service outside the Philippines, together with your name and business name so it can check that they match.</p>
        <p class="small">Files stay saved in OLEDIPO's Google Drive.</p>
        <p class="small">AI results are <b>suggestions only</b>. OLEDIPO staff do the official checking, and AI does not decide loan approval. You can withdraw this consent anytime in Settings.</p>
        <div class="btns"><button class="btn" id="aiYes">${ic('check')} I agree</button><button class="btn ghost" id="aiNo">Not now</button></div>`);
      $('#aiYes').onclick = async () => {
        S().profile.consent.ai = true; S().profile.consent.aiAt = new Date().toISOString();
        A().touch(); await A().persist(); A().closeModal(); resolve(true);
      };
      $('#aiNo').onclick = () => { A().closeModal(); resolve(false); };
    });
  }
  async function ready(needSession) {
    if (!online()) { A().toast('You need internet for AI services.', 'err'); return false; }
    if (needSession && !S().session) { A().toast('Create or sign in to your online account first (Settings).', 'err'); location.hash = '#settings'; return false; }
    const i = await loadInfo();
    if (!i || !i.aiEnabled) { A().toast('AI services are not available yet.', 'err'); return false; }
    if (!hasConsent() && !(await askConsent())) return false;
    return true;
  }

  /* ---------------- document check ---------------- */
  function docBlock(d) {
    const a = d.ai;
    const btn = `<button class="btn sm ghost ai-btn" data-act="aiCheck" data-id="${d.id}" ${busy[d.id] ? 'disabled' : ''}>${ic('bulb')} ${busy[d.id] ? 'Checking…' : a ? 'Check again' : 'AI check'}</button>`;
    if (!a) return `<div class="ai-doc">${btn}</div>`;
    const [cls, label] = STATUS[a.status] || ['warn', a.status];
    return `<details class="ai-doc ai-${cls}"><summary><span class="ai-pill ${cls}">AI: ${esc(label)} · ${Number(a.score) || 0}%</span> <small>${esc(a.summary || '')}</small></summary>
      ${(a.checks || []).length ? `<ul class="ai-checks">${a.checks.map((c) => `<li class="${c.ok ? 'ok' : 'no'}">${c.ok ? '✔' : '✘'} <b>${esc(c.item)}</b>${c.note ? ' — ' + esc(c.note) : ''}</li>`).join('')}</ul>` : ''}
      ${(a.missing || []).length ? `<p class="small"><b>Missing / to fix:</b> ${a.missing.map(esc).join('; ')}</p>` : ''}
      ${a.expiryDate ? `<p class="small"><b>Valid until:</b> ${esc(a.expiryDate)}</p>` : ''}${a.advice ? `<p class="small"><b>Advice:</b> ${esc(a.advice)}</p>` : ''}
      <p class="muted small">AI pre-check on ${C.fmtDate(a.at)} — advisory only; OLEDIPO verifies the original.</p>${btn}</details>`;
  }
  async function checkDoc(id, quiet) {
    const p = S().profile, d = p.documents.find((x) => x.id === id); if (!d) return;
    if (!(await ready(true))) return;
    busy[id] = true; A().route();
    try {
      if (!d.driveId || p.meta.dirty) await A().sync();
      const d2 = S().profile.documents.find((x) => x.id === id);
      if (!d2 || !d2.driveId) throw new Error('Could not upload the document. Check your internet and try again.');
      const r = await API.call({ action: 'aiCheckDoc', token: S().session.token, docId: id, driveId: d2.driveId, category: d2.category });
      d2.ai = r.result; A().touch();
      if (!quiet) A().toast('AI check: ' + ((STATUS[r.result.status] || [])[1] || r.result.status) + ' (' + r.result.score + '%)', r.result.status === 'complete' ? 'ok' : 'err');
    } catch (e) { A().toast(e.message, 'err'); }
    delete busy[id]; A().route();
  }
  /* called by app.js after a new upload: upload to Drive right away, then AI-check automatically */
  async function afterUpload(id) {
    if (!S().session || !online()) return;
    try { await A().sync(); } catch (e) { return; }
    const i = await loadInfo();
    if (i && i.aiEnabled && i.aiAutoCheck && hasConsent()) checkDoc(id, false);
    else if (i && i.aiEnabled && !hasConsent()) A().toast('Saved to OLEDIPO Google Drive. Tap “AI check” to have it checked.', 'ok');
  }

  /* ---------------- services page ---------------- */
  function view(sub) {
    return `<div class="page-head"><div><h1>${ic('bulb')} AI Services</h1><p class="muted">Free AI document check · paid AI writing services · pay with GCash</p></div></div>
      <div class="hint">${ic('alert')} AI results are suggestions. You review everything before printing or submitting, and OLEDIPO staff do the official evaluation. AI services do not affect loan approval.</div>
      <div id="svcList"><p class="muted">Loading…</p></div>
      <h2 class="sec">My orders</h2><div id="ordList"><p class="muted">${S().session ? 'Loading…' : 'Sign in to your online account (Settings) to order and see your orders.'}</p></div>
      <div class="form-card"><h2>${ic('docs')} Free: AI document check</h2><p>Each document you upload in <a href="#passport/documents">Passport → Documents</a> is saved in OLEDIPO's Google Drive and can be checked by AI for completeness: right document, readable, signed, not expired, names match.</p>
        <a class="btn ghost" href="#passport/documents">${ic('cam')} Upload &amp; check documents</a></div>`;
  }
  async function after(sub) {
    const i = await loadInfo(true);
    const el = $('#svcList'); if (!el) return;
    if (!i) { el.innerHTML = `<p class="muted">Connect to the internet to see AI services.</p>`; return; }
    el.innerHTML = `<div class="cards">${i.services.map((s) => `<div class="card svc"><div class="svc-top"><h3>${esc(s.name)}</h3><span class="price">${esc(i.currency || '₱')}${esc(s.price)}</span></div>
      <p>${esc(s.description)}</p><button class="btn" data-act="aiOrder" data-svc="${esc(s.id)}" ${i.aiEnabled ? '' : 'disabled'}>${ic('send')} Get this · pay with GCash</button></div>`).join('')}</div>
      ${i.aiEnabled ? '' : '<p class="muted">AI services are being set up by OLEDIPO.</p>'}`;
    await loadOrders();
    const m = /^paid\/(.+)$/.exec(sub || '');
    if (m) A().toast('Payment received — checking your order ' + m[1] + '…', 'ok');
  }
  async function loadOrders() {
    const el = $('#ordList'); if (!el || !S().session) return;
    if (!online()) { el.innerHTML = '<p class="muted">Offline — connect to see your orders.</p>'; return; }
    try { const r = await API.call({ action: 'myOrders', token: S().session.token }); orders = r.orders; if (r.info) info = r.info; }
    catch (e) { el.innerHTML = `<p class="err">${esc(e.message)}</p>`; return; }
    const res = S().profile.aiResults || {};
    el.innerHTML = orders.length ? `<ul class="orders">${orders.map((o) => `<li class="card order">
      <div><b>${esc(o.service)}</b> <span class="st st-${esc(o.status.replace(/\s/g, ''))}">${esc(o.status)}</span><br>
      <small class="muted">${esc(o.orderId)} · ${peso(o.amount)} · ${esc(o.method)}${o.gcashRef ? ' · Ref ' + esc(o.gcashRef) : ''} · ${C.fmtDate(o.createdAt)}</small>${o.notes ? `<br><small>${esc(o.notes)}</small>` : ''}</div>
      <div class="btns">${o.status === 'Awaiting payment' || o.status === 'Rejected' ? `<button class="btn sm" data-act="aiPay" data-id="${esc(o.orderId)}">Pay with GCash</button>` : ''}
        ${o.status === 'Payment submitted' ? '<small class="muted">Waiting for OLEDIPO to confirm your payment.</small>' : ''}
        ${o.status === 'Paid' ? `<button class="btn sm" data-act="aiGen" data-id="${esc(o.orderId)}">${ic('bulb')} Generate now</button>` : ''}
        ${o.status === 'Completed' && res[o.orderId] ? `<button class="btn sm" data-act="aiView" data-id="${esc(o.orderId)}">${ic('eye')} View result</button>` : ''}
        ${o.status === 'Completed' && o.runs < ((info && info.maxRuns) || 3) ? `<button class="btn sm ghost" data-act="aiGen" data-id="${esc(o.orderId)}">Generate again (${((info && info.maxRuns) || 3) - o.runs} left)</button>` : ''}</div></li>`).join('')}</ul>`
      : '<p class="muted">No orders yet.</p>';
  }

  async function order(svcId) {
    if (!(await ready(true))) return;
    const i = info, s = i.services.find((x) => x.id === svcId);
    A().modal(`<h2>${esc(s.name)}</h2><p>${esc(s.description)}</p><p class="big-price">${esc(i.currency)}${esc(s.price)}</p>
      <p class="small">Your information is saved first, then you pay with GCash. The AI runs as soon as the payment is confirmed.</p>
      <div class="btns">${i.paymongo ? `<button class="btn" data-act="aiOrderGo" data-svc="${esc(s.id)}" data-method="paymongo">${ic('send')} Pay with GCash (online checkout)</button>` : ''}
      <button class="btn ${i.paymongo ? 'ghost' : ''}" data-act="aiOrderGo" data-svc="${esc(s.id)}" data-method="gcash">${ic('send')} Pay by sending to OLEDIPO GCash</button></div>`);
  }
  async function orderGo(svcId, method) {
    try {
      await A().sync();
      const r = await API.call({ action: 'orderCreate', token: S().session.token, serviceId: svcId, method, returnUrl: location.href });
      A().closeModal();
      if (r.checkoutUrl) {
        A().modal(`<h2>${ic('send')} GCash checkout</h2><p>Order <b>${esc(r.order.orderId)}</b> · ${peso(r.order.amount)}</p>
          <p>Tap the button to pay securely with GCash. When you're done, come back here and tap <b>“I have paid”</b>.</p>
          <div class="btns"><a class="btn" href="${esc(r.checkoutUrl)}" target="_blank" rel="noopener">Open GCash checkout</a><button class="btn ghost" data-act="aiRefresh">I have paid</button></div>`);
      } else payModal(r.order.orderId, r.order.amount, r.gcash);
      loadOrders();
    } catch (e) { A().toast(e.message, 'err'); }
  }
  function payModal(orderId, amount, g) {
    const o = (orders || []).find((x) => x.orderId === orderId) || {};
    amount = amount || o.amount; g = g || (info && info.gcash) || {};
    A().modal(`<h2>${ic('send')} Pay with GCash</h2>
      <ol class="pay-steps"><li>Open <b>GCash</b> → <b>Send Money</b>.</li>
        <li>Send <b class="big-price">${peso(amount)}</b> to <b>${esc(g.number || '')}</b> (${esc(g.name || 'OLEDIPO')}).</li>
        <li>In the message, write <b>${esc(orderId)}</b>.</li>
        <li>Enter the <b>reference number</b> from your GCash receipt below and attach a screenshot of the receipt.</li></ol>
      <div class="fld"><label for="gcRef">GCash reference number</label><input id="gcRef" inputmode="numeric" placeholder="e.g. 1012345678901" autocomplete="off"></div>
      <div class="fld"><label for="gcRcpt">Screenshot of GCash receipt</label><input id="gcRcpt" type="file" accept="image/*"></div>
      <div class="btns"><button class="btn" data-act="aiPaySubmit" data-id="${esc(orderId)}">${ic('check')} Submit payment</button></div><p id="payErr" class="err" role="alert"></p>
      <p class="muted small">OLEDIPO checks the payment against its GCash account and confirms it, usually within the same working day.</p>`);
  }
  async function paySubmit(orderId) {
    const ref = $('#gcRef').value.trim(), f = $('#gcRcpt').files[0];
    if (!/^\d{8,20}$/.test(ref.replace(/\s/g, ''))) { $('#payErr').textContent = 'Enter the reference number from your GCash receipt (numbers only).'; return; }
    if (!f) { $('#payErr').textContent = 'Please attach the screenshot of your GCash receipt.'; return; }
    try {
      const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
      const small = await shrink(data);
      await API.call({ action: 'orderPay', token: S().session.token, orderId, gcashRef: ref, receipt: { name: f.name, mime: 'image/jpeg', data: small } });
      A().closeModal(); A().toast('Payment submitted. OLEDIPO will confirm it shortly.', 'ok'); loadOrders();
    } catch (e) { $('#payErr').textContent = e.message; }
  }
  function shrink(dataUrl) {
    return new Promise((res) => { const img = new Image(); img.onload = () => { const s = Math.min(1, 1400 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', 0.8)); }; img.onerror = () => res(dataUrl); img.src = dataUrl; });
  }

  /* figures computed on the device (the AI must reuse them, not invent new ones) */
  function figures() {
    const p = S().profile, pc = C.planCalc(p), lf = C.latestFs(p);
    return {
      monthlySales: Math.round(pc.salesM), monthlyCostOfGoods: Math.round(pc.cogsM), monthlyOperatingExpenses: Math.round(pc.opexM), monthlyNetIncome: Math.round(pc.netM),
      annualSales: Math.round(pc.annual.sales), annualNetIncome: Math.round(pc.annual.net), breakEvenSalesPerMonth: pc.beSales == null ? null : Math.round(pc.beSales),
      projectCostTotal: Math.round(pc.pc.total), loanFundedItems: Math.round(pc.pc.totalLoan), loanAmount: pc.loan.amount, loanTermMonths: pc.loan.term, monthlyAmortization: pc.loan.monthly,
      serviceFee: pc.loan.fee, cashNegativeMonths: pc.negativeMonths, latestFinancialYear: lf ? { year: lf.y.year, basis: lf.y.basis, netIncome: Math.round(lf.c.net), totalAssets: Math.round(lf.c.totalAssets) } : null,
      readinessPercent: C.overall(p).pct
    };
  }
  async function generate(orderId) {
    if (!(await ready(true))) return;
    A().modal(`<div class="ai-wait"><div class="spinner"></div><h2>AI is working…</h2><p class="muted">This takes 15–60 seconds. Please keep this page open.</p></div>`);
    try {
      await A().sync();
      const r = await API.call({ action: 'aiGenerate', token: S().session.token, orderId, figures: figures() });
      S().profile.aiResults = S().profile.aiResults || {};
      S().profile.aiResults[orderId] = { serviceId: r.serviceId, result: r.result };
      A().touch(); await A().persist(); A().closeModal(); showResult(orderId); loadOrders();
    } catch (e) { A().closeModal(); A().toast(e.message, 'err'); }
  }
  function list(a) { return (a || []).length ? '<ul>' + a.map((x) => `<li>${esc(x)}</li>`).join('') + '</ul>' : ''; }
  function showResult(orderId) {
    const r = (S().profile.aiResults || {})[orderId]; if (!r) return;
    const x = r.result;
    if (r.serviceId === 'ai-plan') {
      const sec = (t, v) => v ? `<h3>${t}</h3><p>${esc(v).replace(/\n/g, '<br>')}</p>` : '';
      A().modal(`<h2>${ic('plan')} AI Business Plan draft</h2><p class="muted small">Generated ${C.fmtDate(x.generatedAt)}. Read it carefully, then apply it to your Business Plan and edit anything that is not accurate.</p>
        <div class="ai-result">${sec('Executive summary', x.executiveSummary)}${sec('Business description', x.businessDescription)}${sec('Products / services', x.productDescription)}
        ${sec('Target market', x.targetMarket)}${sec('Market area', x.marketArea)}${sec('Sales strategy', x.salesStrategy)}${sec('Competitors', x.competitors)}${sec('Competitive advantage', x.advantage)}
        ${sec('Operations / process', x.process)}${sec('Owner experience', x.ownerExperience)}${sec('Assumptions', x.assumptions)}
        <h3>Goals</h3><ul>${(x.goals || []).map((g) => `<li><b>${esc(g.goal)}</b> — ${esc(g.target)} (${esc(g.by)})</li>`).join('')}</ul>
        <h3>Risks and mitigation</h3><ul>${(x.risks || []).map((g) => `<li><b>${esc(g.risk)}</b> — ${esc(g.mitigation)}</li>`).join('')}</ul>
        ${x.recommendations && x.recommendations.length ? '<h3>Recommendations</h3>' + list(x.recommendations) : ''}</div>
        <div class="btns"><button class="btn" data-act="aiApply" data-id="${esc(orderId)}">${ic('check')} Apply to my Business Plan</button><button class="btn ghost" data-act="closeModal">Close</button></div>`, 'wide');
    } else {
      const lab = { ready: 'Ready to submit', almost_ready: 'Almost ready', not_ready: 'Not ready yet' }[x.overall] || x.overall;
      A().modal(`<h2>${ic('check')} AI Loan-Readiness Review</h2><p class="big-price">${esc(lab)} · ${Number(x.score) || 0}%</p><p>${esc(x.summary)}</p>
        <div class="ai-result">${x.strengths && x.strengths.length ? '<h3>Strengths</h3>' + list(x.strengths) : ''}
        <h3>Gaps to fix</h3><ul>${(x.gaps || []).map((g) => `<li><b>${esc(g.area)}:</b> ${esc(g.issue)}<br><small>➜ ${esc(g.fix)}</small></li>`).join('')}</ul>
        ${x.documentNotes && x.documentNotes.length ? '<h3>Documents</h3>' + list(x.documentNotes) : ''}${x.nextSteps && x.nextSteps.length ? '<h3>Next steps</h3>' + list(x.nextSteps) : ''}</div>
        <p class="muted small">Advisory only. Final evaluation is done by the EMBRACE Technical Working Group.</p><div class="btns"><button class="btn ghost" data-act="closeModal">Close</button></div>`, 'wide');
    }
  }
  function apply(orderId) {
    const r = (S().profile.aiResults || {})[orderId]; if (!r || r.serviceId !== 'ai-plan') return;
    if (!confirm('Replace the text sections of your Business Plan with the AI draft? Your numbers (prices, costs, sales, items to fund) are not changed.')) return;
    const x = r.result, p = S().profile;
    const set = (path, v) => { if (v && String(v).trim()) { const ks = path.split('.'); let o = p; for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; } };
    set('plan.summary', x.executiveSummary); set('business.description', x.businessDescription); set('plan.productDescription', x.productDescription);
    set('plan.targetMarket', x.targetMarket); set('plan.marketArea', x.marketArea); set('plan.salesStrategy', x.salesStrategy); set('plan.competitors', x.competitors);
    set('plan.advantage', x.advantage); set('plan.process', x.process); set('owner.experience', x.ownerExperience); set('plan.assumptions', x.assumptions);
    if ((x.goals || []).length) p.plan.goals = x.goals.map((g) => ({ goal: g.goal, target: g.target, by: g.by }));
    if ((x.risks || []).length) p.plan.risks = x.risks.map((g) => ({ risk: g.risk, mitigation: g.mitigation }));
    p.meta.aiAssisted = new Date().toISOString();
    A().touch(); A().closeModal(); location.hash = '#plan/10'; A().toast('AI draft applied. Please review each step.', 'ok');
  }

  function onClick(a, b) {
    switch (a) {
      case 'aiCheck': checkDoc(b.dataset.id); return true;
      case 'aiOrder': order(b.dataset.svc); return true;
      case 'aiOrderGo': orderGo(b.dataset.svc, b.dataset.method); return true;
      case 'aiPay': payModal(b.dataset.id); return true;
      case 'aiPaySubmit': paySubmit(b.dataset.id); return true;
      case 'aiRefresh': A().closeModal(); loadOrders(); return true;
      case 'aiGen': generate(b.dataset.id); return true;
      case 'aiView': showResult(b.dataset.id); return true;
      case 'aiApply': apply(b.dataset.id); return true;
      case 'aiConsentOff': S().profile.consent.ai = false; S().profile.consent.aiAt = ''; A().touch(); A().route(); A().toast('AI consent withdrawn.', 'ok'); return true;
      case 'aiConsentOn': askConsent().then(() => A().route()); return true;
    }
    return false;
  }

  G.GrowAI = { loadInfo, docBlock, checkDoc, afterUpload, view, after, onClick, hasConsent };
})(window);
