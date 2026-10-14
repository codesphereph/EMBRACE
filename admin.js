/* GROW — OLEDIPO staff workspace: review submitted passports, verify records, update application status. Online only. */
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
      main.innerHTML = `<div class="form-card"><h1>OLEDIPO Staff Workspace</h1><p>The online server is not configured for this copy of GROW. Set <code>API_URL</code> in <code>js/config.js</code>, or open GROW from the Apps Script web app URL.</p></div>`;
      return;
    }
    if (!tokenGet()) return loginView(main);
    if (st().current) return detailView(main);
    listView(main);
  }

  function loginView(main) {
    main.innerHTML = `<div class="gate-card admin-login"><h1>${ic('users')} OLEDIPO Staff Workspace</h1><p class="muted">Review EMBRACE applications submitted through GROW.</p>
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
    main.innerHTML = `<div class="page-head"><div><h1>EMBRACE Applications</h1><p class="muted">${L.length} passports · ${L.filter((x) => x.consent).length} shared with OLEDIPO</p></div>
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
        ${p.documents.map((x) => vbox(x.id, x.category + ' — ' + x.name + (x.driveId ? '' : ' (not uploaded)'))).join('') || '<p class="muted">No documents.</p>'}
        <h3>Trainings</h3>${p.trainings.map((x) => vbox(x.id, (x.title || '') + ' — ' + (x.provider || '') + (x.date ? ' (' + x.date + ')' : ''))).join('') || '<p class="muted">None recorded.</p>'}
        <div class="fld"><label for="adNote">Internal note (optional)</label><input id="adNote"></div>
        ${(d.review.notes || []).length ? `<ul class="small">${d.review.notes.map((nn) => `<li><b>${esc(nn.by)}</b> ${new Date(nn.at).toLocaleString()}: ${esc(nn.text)}</li>`).join('')}</ul>` : ''}
        <div class="btns"><button class="btn big" data-act="adSave">Save evaluation</button></div><p id="adErr" class="err" role="alert"></p>
      </div></div>`;
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
          A().download(new Blob(['﻿' + [cols.join(',')].concat(L.map((x) => cols.map((c) => q(x[c])).join(','))).join('\r\n')], { type: 'text/csv' }), 'GROW_applicants_' + new Date().toISOString().slice(0, 10) + '.csv');
          break;
        }
      }
    } catch (e) { const er = $('#adErr'); if (er) er.textContent = e.message; fail(e); }
  }

  G.GrowAdmin = { render, onClick };
})(window);
