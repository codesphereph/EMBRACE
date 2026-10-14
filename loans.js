/* EMBRACE Portal — existing members: loan status, transaction history, amortization schedule, statement of account.
   Data comes from the Loans / Payments tabs (posted by OLEDIPO from official receipts). The last copy is kept
   encrypted on the device so members can view it offline. */
(function (G) {
  'use strict';
  const C = G.GrowCalc, API = G.GrowAPI, Store = G.GrowStore, D = G.GrowDocs;
  const A = () => G.GrowApp;
  const esc = (s) => D.esc(s);
  const ic = (k, c) => A().ic(k, c);
  const $ = (s) => document.querySelector(s);
  const peso = (x) => C.peso(Number(x || 0));
  const fd = (d) => (d ? C.fmtDate(d) : '—');
  let cache = null, loading = false;

  const ST = { 'Fully Paid': 'ok', Current: 'ok', 'Grace period': 'info', 'Past due': 'warn', Default: 'bad', Restructured: 'info' };

  async function load(force) {
    if (!cache) cache = await Store.getSecure('loans').catch(() => null);
    const S = A().S;
    if ((force || !cache || Date.now() - (cache.at || 0) > 5 * 60000) && S.session && navigator.onLine && API.configured() && !loading) {
      loading = true;
      try { const r = await API.call({ action: 'myLoans', token: S.session.token }); cache = { at: Date.now(), loans: r.loans, how: r.how }; await Store.setSecure('loans', cache); }
      catch (e) { if (force) A().toast(e.message, 'err'); }
      loading = false;
    }
    return cache;
  }
  function hasLoans() { return !!(cache && cache.loans && cache.loans.length); }

  /* ---------- Home card ---------- */
  function homeCard() {
    if (!hasLoans()) return '';
    return cache.loans.filter((l) => l.status !== 'Fully Paid').slice(0, 2).map((l) => `<a class="loan-home st-${cls(l.status)}" href="#loan/account">
      ${ic('loan', 'big')}<div><b>EMBRACE loan ${esc(l.loanId)}</b><span>Balance <b>${peso(l.balance)}</b>${l.next ? ` · next due <b>${peso(l.next.amount)}</b> on ${fd(l.next.due)}` : ''}</span></div>
      <span class="lstat ${cls(l.status)}">${esc(l.status)}</span></a>`).join('');
  }
  const cls = (s) => ST[s] || 'info';

  /* ---------- My Loan page ---------- */
  function view() {
    return `<div id="loanAcct"><p class="muted">Loading your loan account…</p></div>`;
  }
  async function after() {
    const S = A().S, el = $('#loanAcct'); if (!el) return;
    if (!S.session && !cache) {
      el.innerHTML = `<div class="form-card"><h2>${ic('loan')} My EMBRACE loan</h2><p>Existing EMBRACE borrowers can see their loan balance, payments and due dates here.</p>
        <p>First <b>create or sign in</b> to your online account.</p><a class="btn" href="#settings">${ic('cloud')} Go to Settings → Online account</a></div>`;
      return;
    }
    render(await load(false));
    if (S.session && navigator.onLine) { await load(true); render(cache); }
  }
  function render(c) {
    const el = $('#loanAcct'); if (!el) return;
    const loans = (c && c.loans) || [];
    const stamp = c && c.at ? `<p class="muted small">Updated ${new Date(c.at).toLocaleString()} · ${navigator.onLine ? '' : 'offline copy · '}<button class="link-btn dark" data-act="lnRefresh">Refresh</button></p>` : '';
    if (!loans.length) { el.innerHTML = stamp + linkForm(); return; }
    el.innerHTML = stamp + loans.map(card).join('') + `<details class="form-card"><summary><b>Link another loan</b></summary>${linkForm(true)}</details>`;
  }
  function linkForm(inner) {
    return `${inner ? '' : `<div class="form-card"><h2>${ic('loan')} Link your existing EMBRACE loan</h2>`}
      <p class="help">Enter your <b>Loan ID</b> or <b>Application No.</b> and the <b>check number</b> of your loan release (on your check or voucher). Or ask the LEDIP Center to link it for you.</p>
      <div class="row"><div class="fld"><label for="lnRef">Loan ID or Application No.</label><input id="lnRef" placeholder="e.g. LN-B1-001 or 1" autocomplete="off"></div>
      <div class="fld"><label for="lnChk">Check No. of loan release</label><input id="lnChk" inputmode="numeric" placeholder="e.g. 5948954" autocomplete="off"></div></div>
      <div class="btns"><button class="btn" data-act="lnLink">${ic('check')} Link my loan</button></div><p id="lnErr" class="err" role="alert"></p>${inner ? '' : '</div>'}`;
  }
  function card(l) {
    const k = cls(l.status);
    return `<section class="form-card loan-card">
      <div class="loan-head"><div><h2>${ic('loan')} EMBRACE Loan <code>${esc(l.loanId)}</code></h2><p class="muted">${esc(l.business || '')} · ${esc(l.name || '')}</p></div>
        <span class="lstat big ${k}">${esc(l.status)}</span></div>
      <div class="stats">
        <div class="stat hl"><span>Outstanding balance</span><b>${peso(l.balance)}</b></div>
        <div class="stat"><span>Total paid</span><b>${peso(l.paid)}</b></div>
        <div class="stat"><span>Loan amount</span><b>${peso(l.amount)}</b></div>
        <div class="stat ${l.next ? '' : 'okst'}"><span>${l.next ? 'Next due' : 'Next due'}</span><b>${l.next ? peso(l.next.amount) : '—'}</b><small>${l.next ? fd(l.next.due) : (l.balance > 0 ? '' : 'Fully paid')}</small></div>
      </div>
      <div class="lprog" role="img" aria-label="${l.progress}% paid"><span style="width:${l.progress}%"></span></div><p class="small muted">${l.progress}% paid · ${l.term} monthly amortizations of ${peso(l.monthly)} · 0% interest</p>
      ${l.arrears > 0 ? `<div class="issues"><h3>${ic('alert')} Past due</h3><ul><li class="sev-error">Unpaid amortizations: <b>${peso(l.arrears)}</b> (${l.missed} installment${l.missed === 1 ? '' : 's'}, ${l.daysOverdue} days overdue).</li>
        <li>Estimated penalty: <b>${peso(l.penaltyEstimate)}</b> — 0.5% of the amortization due for every month of delay.</li>
        ${l.missed >= 3 ? '<li class="sev-error">Three or more missed amortizations: the whole balance may be declared due and demandable (default). Please visit the LEDIP Center.</li>' : ''}</ul></div>` : ''}
      <div class="grid2"><div><h3>Loan details</h3><table class="tbl kvt">
        <tr><th>Release date</th><td>${fd(l.releaseDate)}</td></tr><tr><th>Check No.</th><td>${esc(l.checkNo || '—')}</td></tr>
        <tr><th>First amortization</th><td>${fd(l.firstDue)}</td></tr><tr><th>Maturity date</th><td>${fd(l.maturity)}</td></tr>
        <tr><th>Term</th><td>${l.term} months</td></tr><tr><th>Monthly amortization</th><td>${peso(l.monthly)}</td></tr>
        <tr><th>Collateral</th><td>${esc(l.collateral || '—')}${l.comaker ? ' · ' + esc(l.comaker) : ''}</td></tr>
        ${l.penaltiesPaid ? `<tr><th>Penalties paid</th><td>${peso(l.penaltiesPaid)}</td></tr>` : ''}${l.remarks ? `<tr><th>Remarks</th><td>${esc(l.remarks)}</td></tr>` : ''}</table></div>
        <div><h3>How to pay</h3><p class="small">${esc((cache && cache.how) || '')}</p>
        <div class="btns"><button class="btn ghost" data-act="lnStatement" data-id="${esc(l.loanId)}">${ic('print')} Statement of Account</button><button class="btn ghost" data-act="lnCsv" data-id="${esc(l.loanId)}">${ic('down')} CSV</button></div></div></div>
      <h3>Transaction history</h3>
      <div class="scroll"><table class="tbl"><tr><th>Date</th><th>Particulars</th><th>OR No.</th><th class="r">Amount</th><th class="r">Penalty</th><th class="r">Balance</th></tr>
        ${l.history.map((h) => `<tr><td>${fd(h.date)}</td><td>${esc(h.particulars)}</td><td>${esc(h.orNo)}</td><td class="r">${h.amount ? peso(h.amount) : ''}</td><td class="r">${h.penalty ? peso(h.penalty) : ''}</td><td class="r">${peso(h.balance)}</td></tr>`).join('')}
        <tr class="tot"><td>${fd(l.releaseDate)}</td><td>Loan release — Cash, EMBRACE Program</td><td>${esc(l.checkNo ? 'Check ' + l.checkNo : '')}</td><td class="r"></td><td class="r"></td><td class="r">${peso(l.amount)}</td></tr></table></div>
      <details class="sched"><summary>Amortization schedule (${l.schedule.filter((s) => s.status === 'paid').length} of ${l.term} paid)</summary>
        <div class="scroll"><table class="tbl"><tr><th>No.</th><th>Due date</th><th class="r">Amortization</th><th class="r">Paid</th><th>Status</th></tr>
        ${l.schedule.map((s) => `<tr class="sc-${s.status}"><td>${s.no}</td><td>${fd(s.due)}</td><td class="r">${peso(s.amount)}</td><td class="r">${s.paid ? peso(s.paid) : ''}</td><td><span class="scst ${s.status}">${{ paid: 'Paid', partial: 'Partly paid', overdue: 'Overdue', upcoming: 'Upcoming' }[s.status]}</span></td></tr>`).join('')}</table></div></details>
      <p class="muted small">Based on official receipts posted by the LEDIP Center as of ${fd(l.asOf)}. If a payment is missing, bring your OR to the Secretariat.</p>
    </section>`;
  }

  function statementDoc(l, p) {
    const o = (p && p.owner) || {};
    let h = `<div class="doc-head"><div class="lgu">Republic of the Philippines<br><b>${esc(G.GROW_CONFIG.LGU)}</b><br>${esc(G.GROW_CONFIG.OFFICE)}</div>
      <h1>STATEMENT OF ACCOUNT</h1><div class="sub">EMBRACE Program — Expanded Micro Business Recovery Assistance during Crisis and Emergency</div></div>
      <table class="kv"><tr><th>Name of Borrower:</th><td>${esc(l.name || C.fullName(o))}</td></tr><tr><th>Name of Business:</th><td>${esc(l.business || '')}</td></tr>
      <tr><th>Loan ID / Application No.:</th><td>${esc(l.loanId)} / ${esc(l.applicationNo || '—')}</td></tr><tr><th>Loan Amount:</th><td>${peso(l.amount)}</td></tr>
      <tr><th>Release date / Check No.:</th><td>${fd(l.releaseDate)} / ${esc(l.checkNo || '—')}</td></tr><tr><th>Term / Monthly amortization:</th><td>${l.term} months / ${peso(l.monthly)}</td></tr>
      <tr><th>Due / Maturity date:</th><td>${fd(l.firstDue)} – ${fd(l.maturity)}</td></tr><tr><th>Status:</th><td><b>${esc(l.status)}</b></td></tr></table>
      <h2>Summary as of ${fd(l.asOf)}</h2><table class="grid"><tr><th>Total Collections</th><th>Outstanding Balance</th><th>Unpaid amortizations</th><th>Estimated penalty</th></tr>
      <tr><td class="r">${peso(l.paid)}</td><td class="r"><b>${peso(l.balance)}</b></td><td class="r">${peso(l.arrears)}</td><td class="r">${peso(l.penaltyEstimate)}</td></tr></table>
      <h2>Payment Monitoring</h2><table class="grid"><tr><th>Date</th><th>Particulars</th><th>Check/O.R. No.</th><th class="r">Dr</th><th class="r">Cr</th><th class="r">Balance</th></tr>
      <tr><td>${fd(l.releaseDate)}</td><td>Cash - EMBRACE Program</td><td>${esc(l.checkNo ? 'Check No. ' + l.checkNo : '')}</td><td class="r">${peso(l.amount)}</td><td></td><td class="r">${peso(l.amount)}</td></tr>
      ${l.history.slice().reverse().map((x) => `<tr><td>${fd(x.date)}</td><td>${esc(x.particulars)}</td><td>${esc(x.orNo ? 'OR No. ' + x.orNo : '')}</td><td></td><td class="r">${x.amount ? peso(x.amount) : peso(x.penalty) + ' (penalty)'}</td><td class="r">${peso(x.balance)}</td></tr>`).join('')}</table>
      <p class="note">Penalty: 0.5% of the amortization due for every month of delay. Failure to pay three (3) consecutive monthly amortizations results in default and the whole obligation becomes due and demandable (EMBRACE IRR Sec. 10–11). Pay at the Iloilo Provincial Government BAYAD Center using a Payment Order Slip from the LEDIP Center.</p>
      <div class="doc-foot">Generated by the EMBRACE Portal on ${C.fmtDate(new Date())} from payments posted by the LEDIP Center. For official purposes, request a certified statement from the Secretariat.</div>`;
    return { title: 'Statement of Account – ' + l.loanId, html: h };
  }

  async function onClick(a, b) {
    switch (a) {
      case 'lnRefresh': await load(true); render(cache); return true;
      case 'lnLink': {
        const S = A().S; if (!S.session) { location.hash = '#settings'; return true; }
        try { const r = await API.call({ action: 'linkLoan', token: S.session.token, loanRef: $('#lnRef').value, checkNo: $('#lnChk').value });
          cache = { at: Date.now(), loans: r.loans, how: r.how }; await Store.setSecure('loans', cache); render(cache); A().toast('Loan linked to your account.', 'ok'); }
        catch (e) { const er = $('#lnErr'); if (er) er.textContent = e.message; }
        return true;
      }
      case 'lnStatement': { const l = cache.loans.find((x) => x.loanId === b.dataset.id); if (l) A().openDocObj(statementDoc(l, A().S.profile), 'Statement_of_Account_' + l.loanId); return true; }
      case 'lnCsv': {
        const l = cache.loans.find((x) => x.loanId === b.dataset.id); if (!l) return true;
        const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
        const rows = [['Date', 'Particulars', 'OR No.', 'Amount', 'Penalty', 'Balance']].concat([[l.releaseDate, 'Loan release', l.checkNo, '', '', l.amount]], l.history.slice().reverse().map((h) => [h.date, h.particulars, h.orNo, h.amount, h.penalty, h.balance]));
        A().download(new Blob(['﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n')], { type: 'text/csv' }), 'EMBRACE_loan_' + l.loanId + '_transactions.csv');
        return true;
      }
    }
    return false;
  }

  G.GrowLoans = { load, hasLoans, homeCard, view, after, onClick, statementDoc };
})(window);
