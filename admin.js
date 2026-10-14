/* EMBRACE Portal — OLEDIPO staff workspace: review submitted passports, verify records, update application status. Online only. */
(function (G) {
  'use strict';
  const C = G.GrowCalc, API = G.GrowAPI;
  const $ = (s) => document.querySelector(s);
  const A = () => G.GrowApp;
  const st = () => A().S.admin;
  const esc = (s) => G.GrowDocs.esc(s);
  const ic = (k) => A().ic(k);

  function tokenGet() { try { return st().token || sessionStorage.getItem('growAdmin'); } catch (e) { return st().token; } }
  function tokenSet(v) { st().token = v; try { v ? sessionStorage.setItem('growAdmin', v) : sessionStorage.removeItem('growAdmin'); } catch (e) { /* ignore */ } }

  function render() {
    const main = $('#main'); if (!main) return;
    if (!API.configured()) {
      main.innerHTML = `<div class="form-card"><h1>OLEDIPO Staff Workspace</h1><p>The online server is not configured for this copy of the EMBRACE Portal. Set <code>API_URL</code> in <code>js/config.js</code>, or open GROW from the Apps Script web app URL.</p></div>`;
      return;
    }
    if (!tokenGet()) return loginView(main);
    if (st().current) return detailView(main);
    if (st().tab === 'orders') return ordersView(main);
    if (st().tab === 'loans') return st().loan ? loanDetail(main) : loansView(main);
    listView(main);
  }

  function loginView(main) {
    main.innerHTML = `<div class="gate-card admin-login"><h1>${ic('users')} OLEDIPO Staff Workspace</h1><p class="muted">Review EMBRACE applications submitted through the portal.</p>
      <div class="fld"><label for="adName">Your name</label><input id="adName" autocomplete="name"></div>
      <div class="fld"><label for="adKey">Admin key</label><input id="adKey" type="password" autocomplete="current-password"></div>
      <div class="btns"><button class="btn big" data-act="adLogin">Sign in</button></div><p id="adErr" class="err" role="alert"></p>
      <p class="muted small">The admin key is shown in the Apps Script log after running <code>setup()</code>. Keep it confidential.</p></div>`;
  }

  async function loadList() {
    const r = await API.call({ action: 'adminList', token: tokenGet() });
    st().list = r.applicants; st().statuses = r.statuses; st().sheetUrl = r.spreadsheetUrl;
  }

  async function listView(main) {
    if (!st().list) {
      main.innerHTML = '<p class="muted pad">Loading applicants…</p>';
      try { await loadList(); } catch (e) { return fail(e); }
    }
    const L = st().list, f = (st().filter || '').toLowerCase(), sf = st().status || '';
    const counts = {}; L.forEach((x) => { counts[x.status || 'Draft'] = (counts[x.status || 'Draft'] || 0) + 1; });
    const rows = L.filter((x) => (!sf || x.status === sf) && (!f || [x.passportId, x.name, x.business, x.contact].join(' ').toLowerCase().indexOf(f) >= 0))
      .sort((a, b) => String(b.submittedAt || b.updatedAt).localeCompare(String(a.submittedAt || a.updatedAt)));
    main.innerHTML = tabsBar('apps') + `<div class="page-head"><div><h1>EMBRACE Applications</h1><p class="muted">${L.length} passports · ${L.filter((x) => x.consent).length} shared with OLEDIPO</p></div>
      <div class="btns"><button class="btn ghost" data-act="adRefresh">Refresh</button><button class="btn ghost" data-act="adExport">${ic('down')} CSV</button>${st().sheetUrl ? `<a class="btn ghost" href="${esc(st().sheetUrl)}" target="_blank" rel="noopener">Open Google Sheet</a>` : ''}<button class="btn ghost" data-act="adLogout">Sign out</button></div></div>
      <div class="stats">${(st().statuses || []).map((s) => `<button class="stat ${sf === s ? 'hl' : ''}" data-act="adStatus" data-s="${esc(s)}"><span>${esc(s)}</span><b>${counts[s] || 0}</b></button>`).join('')}</div>
      <div class="row"><div class="fld w3"><label for="adSearch">Search</label><input id="adSearch" value="${esc(st().filter || '')}" placeholder="Name, business, Passport ID, mobile"></div>
        <div class="fld"><label>Status</label><select id="adStatusSel"><option value="">All</option>${(st().statuses || []).map((s) => `<option ${s === sf ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div></div>
      <div class="scroll"><table class="tbl admin"><tr><th>Passport ID</th><th>Name</th><th>Business</th><th>Dist.</th><th class="r">Loan</th><th class="r">Complete</th><th>Status</th><th>Submitted</th><th></th></tr>
      ${rows.map((x) => `<tr><td><code>${esc(x.passportId)}</code></td><td>${esc(x.name || '—')}</td><td>${esc(x.business || '—')}</td><td>${esc(x.district)}</td><td class="r">${x.loanAmount ? C.peso(Number(x.loanAmount), 0) : ''}</td>
        <td class="r">${x.completeness !== '' && x.completeness != null ? esc(x.completeness) + '%' : ''}</td><td><span class="st st-${esc(String(x.status).replace(/\s/g, ''))}">${esc(x.status)}</span></td><td>${x.submittedAt ? new Date(x.submittedAt).toLocaleDateString() : ''}</td>
        <td>${x.consent ? `<button class="btn sm" data-act="adOpen" data-id="${esc(x.passportId)}">Open</button>` : '<small class="muted">no consent</small>'}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">No applicants found.</td></tr>'}</table></div>`;
    const s = $('#adSearch'); s.oninput = () => { st().filter = s.value; const pos = s.selectionStart; listView(main).then(() => { const n = $('#adSearch'); n.focus(); n.setSelectionRange(pos, pos); }); };
    $('#adStatusSel').onchange = (e) => { st().status = e.target.value; listView(main); };
  }

  function detailView(main) {
    const d = st().current, p = C.normalize(d.profile || {}); p.review = d.review;
    const ver = d.review.verified || {};
    const ov = C.overall(p), pc = C.planCalc(p), el = C.eligibility(p), lf = C.latestFs(p);
    const vbox = (id, label) => `<label class="toggle"><input type="checkbox" data-ver="${esc(id)}" ${ver[id] ? 'checked' : ''}> ${esc(label)} ${ver[id] ? `<small class="muted">(by ${esc(ver[id].by)} ${new Date(ver[id].at).toLocaleDateString()})</small>` : ''}</label>`;
    main.innerHTML = `<div class="page-head"><div><button class="btn sm ghost" data-act="adBack">${ic('arrowL')} All applications</button><h1>${esc(C.fullName(p.owner) || d.passportId)}</h1>
        <p class="muted"><code>${esc(d.passportId)}</code> · ${esc(p.business.name)} · ${esc(p.owner.contact)} · Readiness ${ov.pct}%</p></div></div>
      <div class="grid2"><div class="form-card"><h2>Application</h2>
        <div class="stats"><div class="stat"><span>Loan applied</span><b>${pc.loan.amount ? C.peso(pc.loan.amount) : '—'}</b></div><div class="stat"><span>Term / monthly</span><b>${pc.loan.term ? pc.loan.term + ' mo · ' + C.peso(pc.loan.monthly) : '—'}</b></div>
          <div class="stat"><span>Projected net / month</span><b>${C.peso(pc.netM)}</b></div><div class="stat"><span>Coverage</span><b>${pc.dscr == null ? '—' : pc.dscr.toFixed(2) + '×'}</b></div>
          <div class="stat"><span>Latest FS (${lf ? lf.y.year + ' ' + lf.y.basis : '—'})</span><b>${lf ? C.peso(lf.c.net) : '—'}</b></div><div class="stat"><span>Self-check</span><b>${el.pass ? 'Meets criteria' : el.fail ? 'Not met' : 'Incomplete'}</b></div></div>
        <h3>Generated documents</h3><div class="btns">${G.GrowDocs.LIST.map((x) => `<button class="btn sm ghost" data-act="adDoc" data-doc="${x.id}">${esc(x.fn(p).title)}</button>`).join('')}</div>
        <h3>Missing items</h3>${ov.missing.length ? `<ul class="small">${ov.missing.map((m) => `<li>${esc(m.msg)}</li>`).join('')}</ul>` : '<p class="okc">Complete</p>'}
        <h3>Checks</h3><ul class="small">${C.planIssues(p).concat(C.fsIssues(p).filter((i) => i.sev !== 'missing')).map((i) => `<li>${esc(i.msg)}</li>`).join('') || '<li>None</li>'}</ul>
      </div>
      <div class="form-card"><h2>Evaluation</h2>
        <div class="row"><div class="fld"><label for="adSt">Status</label><select id="adSt">${(st().statuses || []).map((s) => `<option ${s === d.review.status ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select></div>
        <div class="fld w1"><label for="adNo">Applicant No.</label><input id="adNo" value="${esc(d.review.applicantNo)}"></div><div class="fld w1"><label for="adBatch">Batch No.</label><input id="adBatch" value="${esc(d.review.batchNo)}"></div></div>
        <div class="fld"><label for="adRem">TWG remarks / recommendations (visible to applicant)</label><textarea id="adRem" rows="3">${esc(d.review.remarks)}</textarea></div>
        <h3>Verification</h3><p class="muted small">Mark records you have checked against originals. Unchecked records remain "self-reported".</p>
        ${vbox('fs', 'Financial statements verified')}${vbox('plan', 'Business plan reviewed')}${vbox('eligibility', 'Eligibility confirmed (interview)')}
        <h3>Documents ${d.documentsFolderUrl ? `<a class="btn sm ghost" href="${esc(d.documentsFolderUrl)}" target="_blank" rel="noopener">Open Drive folder</a>` : ''}</h3>
        ${p.documents.map((x) => vbox(x.id, x.category + ' — ' + x.name + (x.driveId ? '' : ' (not uploaded)')) + (x.ai ? `<p class="small ai-line">AI pre-check: <b>${esc(x.ai.status)}</b> · ${Number(x.ai.score) || 0}% — ${esc(x.ai.summary || '')}${(x.ai.missing || []).length ? '<br>Missing: ' + x.ai.missing.map(esc).join('; ') : ''}</p>` : '')).join('') || '<p class="muted">No documents.</p>'}
        <h3>Trainings</h3>${p.trainings.map((x) => vbox(x.id, (x.title || '') + ' — ' + (x.provider || '') + (x.date ? ' (' + x.date + ')' : ''))).join('') || '<p class="muted">None recorded.</p>'}
        <div class="fld"><label for="adNote">Internal note (optional)</label><input id="adNote"></div>
        ${(d.review.notes || []).length ? `<ul class="small">${d.review.notes.map((nn) => `<li><b>${esc(nn.by)}</b> ${new Date(nn.at).toLocaleString()}: ${esc(nn.text)}</li>`).join('')}</ul>` : ''}
        <div class="btns"><button class="btn big" data-act="adSave">Save evaluation</button></div><p id="adErr" class="err" role="alert"></p>
      </div></div>`;
  }

  function tabsBar(cur) {
    return `<div class="tabs" role="tablist"><button class="${cur === 'apps' ? 'on' : ''}" data-act="adTab" data-t="apps">Applications</button><button class="${cur === 'loans' ? 'on' : ''}" data-act="adTab" data-t="loans">Loans &amp; Payments</button></div>`;
  }

  async function ordersView(main) {
    if (!st().orders) {
      main.innerHTML = tabsBar('orders') + '<p class="muted pad">Loading orders…</p>';
      try { const r = await API.call({ action: 'adminOrders', token: tokenGet() }); st().orders = r.orders; st().ordStatuses = r.statuses; } catch (e) { return fail(e); }
    }
    const L = st().orders, pend = L.filter((o) => o.status === 'Payment submitted').length;
    main.innerHTML = tabsBar('orders') + `<div class="page-head"><div><h1>AI Services · GCash Orders</h1><p class="muted">${L.length} orders · <b>${pend}</b> payment(s) to verify against the OLEDIPO GCash account</p></div>
      <div class="btns"><button class="btn ghost" data-act="adOrdRefresh">Refresh</button></div></div>
      <div class="scroll"><table class="tbl admin"><tr><th>Order</th><th>Applicant</th><th>Service</th><th class="r">Amount</th><th>Method</th><th>GCash ref</th><th>Receipt</th><th>Status</th><th>Action</th></tr>
      ${L.map((o) => `<tr><td><code>${esc(o.orderId)}</code><br><small>${o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</small></td><td>${esc(o.name || '')}<br><small><code>${esc(o.passportId)}</code></small></td>
        <td>${esc(o.service)}${o.runs ? `<br><small>generated ${o.runs}×</small>` : ''}</td><td class="r">₱${esc(o.amount)}</td><td>${esc(o.method)}</td><td>${esc(o.gcashRef || '')}</td>
        <td>${o.receiptUrl ? `<a href="${esc(o.receiptUrl)}" target="_blank" rel="noopener">View</a>` : ''}</td><td><span class="st st-${esc(String(o.status).replace(/\s/g, ''))}">${esc(o.status)}</span>${o.verifiedBy ? `<br><small>${esc(o.verifiedBy)}</small>` : ''}</td>
        <td>${o.status === 'Payment submitted' || o.status === 'Awaiting payment' ? `<button class="btn sm" data-act="adOrdSet" data-id="${esc(o.orderId)}" data-s="Paid">Mark paid</button> <button class="btn sm ghost danger" data-act="adOrdSet" data-id="${esc(o.orderId)}" data-s="Rejected">Reject</button>` : ''}
          ${o.status === 'Paid' || o.status === 'Completed' ? `<button class="btn sm ghost" data-act="adOrdSet" data-id="${esc(o.orderId)}" data-s="Refunded">Refunded</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="9" class="muted">No orders yet.</td></tr>'}</table></div>
      <p class="muted small">Before marking <b>Paid</b>, confirm the amount and reference number in OLEDIPO's GCash transaction history. Orders paid by online checkout (PayMongo) are confirmed automatically.</p>`;
  }

  /* ---------------- Loans & payments ---------------- */
  const peso = (x) => C.peso(Number(x || 0));
  const LST = { 'Fully Paid': 'ok', Current: 'ok', 'Grace period': 'info', 'Past due': 'warn', Default: 'bad', Restructured: 'info' };
  async function loansView(main) {
    if (!st().loans) {
      main.innerHTML = tabsBar('loans') + '<p class="muted pad">Loading loans…</p>';
      try { const r = await API.call({ action: 'adminLoans', token: tokenGet() }); st().loans = r.loans; } catch (e) { return fail(e); }
    }
    const L = st().loans, f = (st().lfilter || '').toLowerCase(), sf = st().lstatus || '';
    const counts = {}; L.forEach((x) => { counts[x.status] = (counts[x.status] || 0) + 1; });
    const out = L.reduce((s, x) => s + x.balance, 0), coll = L.reduce((s, x) => s + x.paid, 0), rel = L.reduce((s, x) => s + x.amount, 0);
    const rows = L.filter((x) => (!sf || x.status === sf) && (!f || [x.loanId, x.name, x.business, x.applicationNo, x.passportId].join(' ').toLowerCase().indexOf(f) >= 0));
    main.innerHTML = tabsBar('loans') + `<div class="page-head"><div><h1>Loans &amp; Payments</h1><p class="muted">${L.length} loans · released ${peso(rel)} · collected ${peso(coll)} · outstanding <b>${peso(out)}</b> · collection efficiency ${rel ? Math.round(coll / rel * 100) : 0}%</p></div>
      <div class="btns"><button class="btn" data-act="adLoanNew">+ New loan</button><button class="btn ghost" data-act="adLoansRefresh">Refresh</button><button class="btn ghost" data-act="adLoansCsv">${ic('down')} CSV</button></div></div>
      <div class="stats">${['Current', 'Grace period', 'Past due', 'Default', 'Fully Paid'].map((k) => `<button class="stat ${sf === k ? 'hl' : ''}" data-act="adLStatus" data-s="${k}"><span>${k}</span><b>${counts[k] || 0}</b></button>`).join('')}</div>
      <div class="fld"><label for="adLSearch">Search</label><input id="adLSearch" value="${esc(st().lfilter || '')}" placeholder="Name, business, Loan ID, application no."></div>
      <div class="scroll"><table class="tbl admin"><tr><th>Loan ID</th><th>Borrower / business</th><th class="r">Amount</th><th class="r">Paid</th><th class="r">Balance</th><th>Status</th><th>Next due</th><th>Member</th><th></th></tr>
      ${rows.map((x) => `<tr><td><code>${esc(x.loanId)}</code>${x.applicationNo ? `<br><small>App ${esc(x.applicationNo)}</small>` : ''}</td><td>${esc(x.name || '')}<br><small>${esc(x.business || '')}</small></td>
        <td class="r">${peso(x.amount)}</td><td class="r">${peso(x.paid)}</td><td class="r"><b>${peso(x.balance)}</b></td><td><span class="lstat ${LST[x.status] || 'info'}">${esc(x.status)}</span>${x.missed ? `<br><small>${x.missed} missed</small>` : ''}</td>
        <td>${x.next ? C.fmtDate(x.next.due) + '<br><small>' + peso(x.next.amount) + '</small>' : '—'}</td><td>${x.passportId ? `<small><code>${esc(x.passportId)}</code></small>` : '<small class="muted">not linked</small>'}</td>
        <td><button class="btn sm" data-act="adLoanOpen" data-id="${esc(x.loanId)}">Open</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">No loans. Import the MONITORING_EMBRACE workbook from the EMBRACE menu in the Google Sheet, or add a new loan.</td></tr>'}</table></div>
      <p class="muted small">Existing borrowers: in the Google Sheet use <b>EMBRACE → Import EMBRACE monitoring workbook…</b> (Google Sheets copy of MONITORING_EMBRACE). Members link their loan with the Loan ID / Application No. and release check number, or you can type their Passport ID in the loan.</p>`;
    const sIn = $('#adLSearch'); sIn.oninput = () => { st().lfilter = sIn.value; const pos = sIn.selectionStart; loansView(main).then(() => { const n = $('#adLSearch'); n.focus(); n.setSelectionRange(pos, pos); }); };
  }
  async function loanDetail(main) {
    const cur = st().loan;
    if (cur.id && !cur.data) {
      main.innerHTML = tabsBar('loans') + '<p class="muted pad">Loading…</p>';
      try { cur.data = await API.call({ action: 'adminLoanGet', token: tokenGet(), loanId: cur.id }); } catch (e) { return fail(e); }
    }
    const d = cur.data || { raw: {}, fields: ['Passport ID', 'Application No.', 'Batch No.', 'NAME', 'NAME OF BUSINESS', 'Nature of Business', 'Type of Applicant', 'Address', 'District', 'Mobile', 'Loan Amount', 'Term (months)', 'Monthly Amortization', 'Check No.', 'Check Date', 'Release Date', 'First Due Date', 'Maturity Date', 'Collateral', 'Co-maker', 'Co-maker Contact', 'Status Override', 'Remarks'] };
    const l = d.loan, dateF = /Date$/;
    const today = new Date().toISOString().slice(0, 10);
    main.innerHTML = tabsBar('loans') + `<div class="page-head"><div><button class="btn sm ghost" data-act="adLoanBack">${ic('arrowL')} All loans</button>
      <h1>${l ? 'Loan <code>' + esc(l.loanId) + '</code>' : 'New loan'}</h1>${l ? `<p class="muted">${esc(l.name || '')} · ${esc(l.business || '')}</p>` : ''}</div>${l ? `<span class="lstat big ${LST[l.status] || 'info'}">${esc(l.status)}</span>` : ''}</div>
      ${l ? `<div class="stats"><div class="stat hl"><span>Balance</span><b>${peso(l.balance)}</b></div><div class="stat"><span>Paid</span><b>${peso(l.paid)}</b></div><div class="stat"><span>Arrears</span><b>${peso(l.arrears)}</b></div>
        <div class="stat"><span>Est. penalty</span><b>${peso(l.penaltyEstimate)}</b></div><div class="stat"><span>Next due</span><b>${l.next ? peso(l.next.amount) : '—'}</b><small>${l.next ? C.fmtDate(l.next.due) : ''}</small></div></div>` : ''}
      <div class="grid2"><div class="form-card"><h2>Post a payment (from Official Receipt)</h2>${l ? `
        <div class="row"><div class="fld"><label for="pyDate">Date</label><input id="pyDate" type="date" value="${today}"></div><div class="fld"><label for="pyOr">OR No.</label><input id="pyOr" inputmode="numeric"></div></div>
        <div class="row"><div class="fld"><label for="pyAmt">Amortization paid</label><input id="pyAmt" inputmode="decimal" value="${l.next ? l.next.amount : ''}"></div><div class="fld"><label for="pyPen">Penalty paid</label><input id="pyPen" inputmode="decimal" value="0"></div></div>
        <div class="fld"><label for="pyPart">Particulars</label><select id="pyPart"><option>Payment-Monthly Amortization</option><option>Payment-Advance Amortization</option><option>Payment-Full Settlement</option><option>Penalties and Surcharges</option></select></div>
        <div class="btns"><button class="btn" data-act="adPayAdd">${ic('check')} Post payment</button></div><p id="adErr" class="err" role="alert"></p>` : '<p class="muted">Save the loan first.</p>'}
        </div>
        <div class="form-card"><h2>Loan details</h2><div class="row">${d.fields.map((f) => `<div class="fld w2"><label>${esc(f)}</label><input data-lf="${esc(f)}" ${dateF.test(f) ? 'type="date"' : ''} value="${esc(d.raw[f] == null ? '' : String(d.raw[f]).slice(0, dateF.test(f) ? 10 : 300))}"></div>`).join('')}</div>
        <p class="muted small">Leave <b>Status Override</b> empty to compute the status automatically (Current / Past due / Default / Fully Paid). Type the member's <b>Passport ID</b> to link this loan to their account.</p>
        <div class="btns"><button class="btn" data-act="adLoanSave">Save loan</button></div><p id="adErr2" class="err" role="alert"></p></div></div>
      ${l ? `<div class="form-card"><h2>Transaction history</h2><div class="scroll"><table class="tbl"><tr><th>Date</th><th>Particulars</th><th>OR No.</th><th class="r">Amount</th><th class="r">Penalty</th><th class="r">Balance</th><th>Source</th><th></th></tr>
        ${l.history.map((h) => `<tr><td>${C.fmtDate(h.date)}</td><td>${esc(h.particulars)}</td><td>${esc(h.orNo)}</td><td class="r">${h.amount ? peso(h.amount) : ''}</td><td class="r">${h.penalty ? peso(h.penalty) : ''}</td><td class="r">${peso(h.balance)}</td><td><small>${esc(h.source)}</small></td>
          <td><button class="icon-btn sm danger" data-act="adPayDel" data-id="${esc(h.id)}" aria-label="Delete payment">✕</button></td></tr>`).join('') || '<tr><td colspan="8" class="muted">No payments yet.</td></tr>'}</table></div>
        <div class="btns"><button class="btn ghost" data-act="adLoanStmt">${ic('print')} Statement of Account</button></div></div>` : ''}`;
  }

  function fail(e) {
    if (/sign in|session|allowed/i.test(e.message)) { tokenSet(null); A().toast('Please sign in again.', 'err'); return render(); }
    A().toast(e.message, 'err');
    const main = $('#main'); if (main && !main.innerHTML.trim()) main.innerHTML = `<p class="err pad">${esc(e.message)}</p>`;
  }

  async function onClick(a, b) {
    try {
      switch (a) {
        case 'adLogin': {
          const r = await API.call({ action: 'adminLogin', key: $('#adKey').value, name: $('#adName').value });
          tokenSet(r.token); st().list = null; render(); break;
        }
        case 'adLogout': tokenSet(null); st().list = null; st().current = null; render(); break;
        case 'adRefresh': st().list = null; render(); break;
        case 'adStatus': st().status = st().status === b.dataset.s ? '' : b.dataset.s; render(); break;
        case 'adOpen': {
          const r = await API.call({ action: 'adminGet', token: tokenGet(), passportId: b.dataset.id });
          st().current = { passportId: b.dataset.id, profile: r.profile, review: r.review, documentsFolderUrl: r.documentsFolderUrl }; render(); window.scrollTo(0, 0); break;
        }
        case 'adBack': st().current = null; render(); break;
        case 'adTab': st().tab = b.dataset.t; st().current = null; st().loan = null; render(); break;
        case 'adLoansRefresh': st().loans = null; render(); break;
        case 'adLStatus': st().lstatus = st().lstatus === b.dataset.s ? '' : b.dataset.s; render(); break;
        case 'adLoanOpen': st().loan = { id: b.dataset.id }; render(); window.scrollTo(0, 0); break;
        case 'adLoanNew': st().loan = { id: '' }; render(); break;
        case 'adLoanBack': st().loan = null; render(); break;
        case 'adLoanSave': {
          const loan = {}; document.querySelectorAll('[data-lf]').forEach((x) => { loan[x.dataset.lf] = x.value; });
          try { const r = await API.call({ action: 'adminLoanSave', token: tokenGet(), loanId: st().loan.id, loan }); st().loan = { id: r.loanId }; st().loans = null; A().toast('Loan saved.', 'ok'); render(); }
          catch (e) { $('#adErr2').textContent = e.message; }
          break;
        }
        case 'adPayAdd': {
          const r = await API.call({ action: 'adminPaymentAdd', token: tokenGet(), loanId: st().loan.id, date: $('#pyDate').value, orNo: $('#pyOr').value, amount: $('#pyAmt').value, penalty: $('#pyPen').value, particulars: $('#pyPart').value });
          st().loan.data = r; st().loans = null; A().toast('Payment posted.', 'ok'); render(); break;
        }
        case 'adPayDel': {
          if (!confirm('Delete this payment from the ledger?')) break;
          const r = await API.call({ action: 'adminPaymentDelete', token: tokenGet(), paymentId: b.dataset.id }); st().loan.data = r; st().loans = null; render(); break;
        }
        case 'adLoanStmt': { const l = st().loan.data.loan; A().openDocObj(G.GrowLoans.statementDoc(l, null), 'Statement_of_Account_' + l.loanId); break; }
        case 'adLoansCsv': {
          const L = st().loans || [], q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
          const cols = ['loanId', 'applicationNo', 'name', 'business', 'amount', 'paid', 'balance', 'status', 'missed', 'arrears', 'releaseDate', 'maturity', 'passportId'];
          A().download(new Blob(['\ufeff' + [cols.join(',')].concat(L.map((x) => cols.map((c) => q(x[c])).join(','))).join('\r\n')], { type: 'text/csv' }), 'EMBRACE_loans_' + new Date().toISOString().slice(0, 10) + '.csv');
          break;
        }
        case 'adOrdRefresh': st().orders = null; render(); break;
        case 'adOrdSet': {
          const note = b.dataset.s === 'Rejected' ? (prompt('Reason (shown to the applicant), e.g. "Reference number not found":') || '') : '';
          if (b.dataset.s !== 'Rejected' && !confirm('Set order ' + b.dataset.id + ' to "' + b.dataset.s + '"?')) break;
          await API.call({ action: 'adminOrderUpdate', token: tokenGet(), orderId: b.dataset.id, status: b.dataset.s, note });
          st().orders = null; A().toast('Order updated.', 'ok'); render(); break;
        }
        case 'adDoc': { const d = st().current; const p = C.normalize(d.profile || {}); p.review = d.review; A().openDoc(b.dataset.doc, p); break; }
        case 'adSave': {
          const d = st().current, verified = {};
          document.querySelectorAll('[data-ver]').forEach((x) => { const was = !!(d.review.verified || {})[x.dataset.ver]; if (x.checked !== was) verified[x.dataset.ver] = x.checked; });
          const r = await API.call({ action: 'adminUpdate', token: tokenGet(), passportId: d.passportId, status: $('#adSt').value, remarks: $('#adRem').value,
            applicantNo: $('#adNo').value, batchNo: $('#adBatch').value, verified, note: $('#adNote').value });
          d.review = r.review; st().list = null; A().toast('Saved.', 'ok'); render(); break;
        }
        case 'adExport': {
          const L = st().list || [], q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
          const cols = ['passportId', 'applicantNo', 'name', 'business', 'district', 'contact', 'type', 'loanAmount', 'completeness', 'status', 'submittedAt', 'updatedAt'];
          A().download(new Blob(['﻿' + [cols.join(',')].concat(L.map((x) => cols.map((c) => q(x[c])).join(','))).join('\r\n')], { type: 'text/csv' }), 'EMBRACE_applicants_' + new Date().toISOString().slice(0, 10) + '.csv');
          break;
        }
      }
    } catch (e) { const er = $('#adErr'); if (er) er.textContent = e.message; fail(e); }
  }

  G.GrowAdmin = { render, onClick };
})(window);
