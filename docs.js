/* EMBRACE Portal — printable / downloadable documents, generated offline from the saved Passport.
   Layouts follow the official EMBRACE forms: Annex A (Application Form), Annex C (Barangay Certificates),
   Annex D (Business Plan template), Sworn Affidavit, and the OLEDIPO Financial Statement template. */
(function (G) {
  'use strict';
  var C = G.GrowCalc;
  var peso = C.peso, n = C.n, has = C.has;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function v(x, w) { return has(x) ? '<span class="fill">' + esc(x) + '</span>' : '<span class="blank" style="min-width:' + (w || 10) + 'em">&nbsp;</span>'; }
  function para(x) { return has(x) ? esc(x).replace(/\n/g, '<br>') : '<span class="blank" style="min-width:20em">&nbsp;</span> <em class="flag">[to be completed]</em>'; }
  function box(on) { return '<span class="cb">' + (on ? '✔' : '&nbsp;') + '</span>'; }
  function money(x) { return has(x) ? peso(n(x)) : v('', 8); }
  function today() { return C.fmtDate(new Date()); }

  function header(title, sub) {
    return '<div class="doc-head"><div class="lgu">Republic of the Philippines<br><b>' + esc(G.GROW_CONFIG.LGU) + '</b><br>' + esc(G.GROW_CONFIG.OFFICE) + '</div>' +
      '<h1>' + esc(title) + '</h1>' + (sub ? '<div class="sub">' + sub + '</div>' : '') + '</div>';
  }
  function footer(p) {
    return '<div class="doc-foot">Prepared with the EMBRACE Portal (OLEDIPO, Iloilo Province) on ' + today() +
      (p.passportId ? ' · Passport ID ' + esc(p.passportId) : '') +
      '. ' + (p.meta && p.meta.aiAssisted ? 'Narrative drafted with AI assistance and reviewed by the applicant. ' : '') + 'Figures are self-reported by the applicant unless marked "Verified by OLEDIPO". This document does not guarantee loan approval and does not replace official evaluation by the EMBRACE Technical Working Group. Professional review of financial statements is recommended.</div>';
  }
  function sign(label, name) {
    return '<div class="sign"><div class="line">' + esc(name || '') + '</div><div>' + esc(label) + '</div></div>';
  }
  function basisTag(b) { return b === 'estimate' ? '<span class="tag est">ESTIMATE</span>' : '<span class="tag act">ACTUAL</span>'; }

  /* ---------------------------------------------------------- ANNEX A */
  function annexA(p) {
    var o = p.owner, b = p.business, l = p.loan, a = o.address, ba = b.address;
    var lc = C.loanCalc(l.amount, l.releaseDate);
    var age = '';
    if (o.dob) { var d = new Date(o.dob + 'T00:00:00'), t = new Date(); age = t.getFullYear() - d.getFullYear() - ((t.getMonth() < d.getMonth() || (t.getMonth() === d.getMonth() && t.getDate() < d.getDate())) ? 1 : 0); }
    var emp = b.employees, es = b.employment, reg = b.registrations;
    var prods = b.products.filter(has);
    while (prods.length < 5) prods.push('');
    var yrs = C.yrsOperating(p);
    var h = header('EMBRACE Program — APPLICATION FORM', 'Expanded Micro Business Recovery Assistance during Crisis and Emergency · <b>Annex A</b><div class="right">No. ' + v(p.review && p.review.applicantNo, 6) + ' &nbsp; Date Filed: ' + v('', 8) + '</div>');
    h += '<h2>A. PERSONAL PROFILE</h2><table class="form">' +
      '<tr><td><small>I. LAST NAME</small><br>' + v(o.lastName) + '</td><td><small>FIRST NAME</small><br>' + v(o.firstName) + '</td><td><small>MIDDLE NAME</small><br>' + v(o.middleName) + '</td></tr>' +
      '<tr><td colspan="2"><small>II. ADDRESS (Lot No., Street, Brgy., Municipality, Province, Zip Code)</small><br>' + v(C.addr(a), 30) + '</td><td><small>III. DISTRICT</small><br>' +
      ['1st', '2nd', '3rd', '4th', '5th'].map(function (x, i) { return box(String(o.district) === String(i + 1)) + ' ' + x; }).join(' &nbsp;') + '</td></tr>' +
      '<tr><td><small>IV. DATE OF BIRTH</small><br>' + v(o.dob ? C.fmtDate(o.dob) : '') + '</td><td><small>V. AGE</small><br>' + v(age, 4) + '</td><td><small>VI. SEX</small><br>' + box(o.sex === 'Male') + ' Male &nbsp; ' + box(o.sex === 'Female') + ' Female</td></tr>' +
      '<tr><td><small>VII. CONTACT NO.</small><br>' + v(o.contact) + '</td><td><small>VIII. FACEBOOK ACCOUNT</small><br>' + v(o.facebook) + '</td><td><small>IX. EMAIL ADDRESS</small><br>' + v(o.email) + '</td></tr>' +
      '<tr><td><small>X. TIN No.</small><br>' + v(o.tin) + '</td><td><small>XI. BANK AFFILIATIONS</small><br>' + v(o.banks) + '</td><td><small>XII. CIVIL STATUS</small><br>' +
      ['Single', 'Married', 'Widow/er', 'Legally Separated'].map(function (x) { return box(o.civilStatus === x) + ' ' + x; }).join(' &nbsp;') + '</td></tr></table>';
    h += '<h2>B. BUSINESS PROFILE</h2><table class="form">' +
      '<tr><td colspan="3"><small>XIII. NAME OF BUSINESS</small><br>' + v(b.name, 30) + '</td></tr>' +
      '<tr><td colspan="2"><small>XIV. PRINCIPAL ADDRESS</small><br>' + v(C.addr(ba), 30) + '</td><td><small>XV. NO. OF YEARS IN OPERATION</small><br>' + v(yrs == null ? '' : yrs, 4) + '</td></tr>' +
      '<tr><td><small>XVI. NO. OF EMPLOYEES</small><br>Male ' + v(emp.male, 3) + ' Female ' + v(emp.female, 3) + '<br>Total ' + v((has(emp.male) || has(emp.female)) ? n(emp.male) + n(emp.female) : '', 3) + '</td>' +
      '<td><small>XVII. EMPLOYMENT STATUS</small><br>Permanent ' + v(es.permanent, 2) + ' Contractual ' + v(es.contractual, 2) + '<br>Casual ' + v(es.casual, 2) + ' Seasonal ' + v(es.seasonal, 2) + ' Others ' + v(es.others, 2) + '</td>' +
      '<td><small>XVIII. REGISTRATION</small><br>' + ['DTI', "Mayor's Permit", 'SEC', 'Barangay Permit'].map(function (x) { return box(reg.indexOf(x) >= 0) + ' ' + x; }).join('<br>') + '</td></tr>' +
      '<tr><td colspan="2"><small>XIX. BUSINESS TYPE</small><br>' + ['Manufacturing/Processing', 'Trading', 'Service'].map(function (x) { return box(b.type === x) + ' ' + x; }).join(' &nbsp; ') + '</td>' +
      '<td><small>XX. OWNERSHIP</small><br>' + ['Single Proprietorship', 'Partnership', 'Others'].map(function (x) { return box(b.ownership === x) + ' ' + x; }).join('<br>') + '</td></tr>' +
      '<tr><td colspan="2"><small>XXI. PRODUCTS / SERVICES OFFERED</small><ol>' + prods.slice(0, 5).map(function (x) { return '<li>' + v(x, 24) + '</li>'; }).join('') + '</ol></td>' +
      '<td><small>XXX. CAPITAL</small><br>' + money(b.capital) + '<br><small>XXXI. ANNUAL GROSS SALES (latest)</small><br>' + money(b.annualSales) + '<br><small>XXXII. BUSINESS NET ASSETS (latest)</small><br>' + money(b.netAssets) + '</td></tr></table>';
    h += '<h2>C. APPLICATION DETAILS</h2><table class="form"><tr><td><small>XXXIII. AMOUNT OF LOAN APPLIED FOR (PHP)</small><br>' + money(l.amount) + '</td>' +
      '<td><small>XXXIV. PERIOD</small><br>' + box(lc.term === 12) + ' 1 YEAR &nbsp; ' + box(lc.term === 24) + ' 2 YEARS</td>' +
      '<td><small>D. COLLATERAL (Secretariat)</small><br>' + box(l.collateral === 'pdc') + ' Post-Dated Check<br>' + box(l.collateral === 'comaker') + ' Co-maker ' + (l.collateral === 'comaker' ? v(l.comaker.name) : '') + '</td></tr>' +
      '<tr><td colspan="3"><small>XXXV. PURPOSE</small><br>' + ['Working Capital', 'Acquisition of Equipment', 'Acquisition of Fixed Assets'].map(function (x) { return box(l.purposes.indexOf(x) >= 0) + ' ' + x; }).join(' &nbsp; ') + '</td></tr></table>';
    h += '<div class="twg"><b>TECHNICAL WORKING GROUP (TWG) ACTION ON LOAN APPLICATION</b> (for official use)<br>Action Taken: ' + box(false) + ' APPROVED &nbsp; ' + box(false) + ' DISAPPROVED &nbsp; Date: ' + v('', 8) +
      '<br>Remarks and/or Recommendations: <span class="blank" style="min-width:30em">&nbsp;</span></div>';
    h += '<h2>DISCLOSURE STATEMENT</h2><p class="just">I, ' + v(C.fullName(o).toUpperCase(), 18) + ', of legal age and a resident of ' + v(C.addr(a), 20) +
      ', do hereby attest that I have not availed of any loan assistance from any government instrumentality, subdivision or agency.</p>' +
      '<p class="just">By my signature below, I attest that the information stated above are true and correct as to the best of my knowledge and that any false, fraudulent or misrepresentation of facts and circumstances shall result into the automatic cancellation of my application under the Expanded Micro Business Recovery Assistance during Crisis and Emergency (EMBRACE) Program of the Iloilo Provincial Government.</p>' +
      '<p>Signed this ' + v('', 4) + ' day of ' + v('', 8) + ' ' + new Date().getFullYear() + ' at ' + v(a.municipality, 10) + ', Iloilo, Philippines.</p>' +
      '<div class="signs">' + sign('Signature over Printed Name of Applicant / Date', C.fullName(o).toUpperCase()) + sign('APPROVED BY', '') + '</div>';
    return { title: 'Annex A – EMBRACE Application Form', html: h + footer(p) };
  }

  /* ---------------------------------------------------------- ANNEX D BUSINESS PLAN */
  function businessPlan(p) {
    var o = p.owner, b = p.business, pl = p.plan, pc = C.planCalc(p);
    var prods = pc.products.filter(function (x) { return has(x.src.name); });
    var h = header('EMBRACE Program — BUSINESS PLAN', '<b>Annex D</b> · ' + esc(b.name || ''));
    // Executive summary
    h += '<h2>EXECUTIVE SUMMARY</h2><p class="just">' + para(pl.summary || autoSummary(p)) + '</p>';
    // 1 background
    h += '<h2>1. BACKGROUND OF THE BUSINESS</h2><table class="kv">' +
      kv('1.1 Name of Project', pl.projectName) + kv('1.2 Name of Company', b.name) + kv('1.3 Business Address', C.addr(b.address)) +
      kv('1.4 Nature of Business', b.nature) + kv('1.5 Form of Business', b.ownership) + kv('1.6 Name of Entrepreneur/Owner/s', C.fullName(o)) +
      kv('1.7 Contact Number', o.contact) + kv('Registration', (b.registrations.join(', ') || '') + (b.regNumbers ? ' — ' + b.regNumbers : '')) +
      kv('Year started / Years in operation', b.startYear ? b.startYear + ' (' + C.yrsOperating(p) + ' yrs)' : '') + '</table>' +
      '<h3>1.8 Brief Description of the Business</h3><p class="just">' + para(b.description) + '</p>';
    // 2 marketing
    h += '<h2>2. MARKETING PLAN</h2><h3>2.1 Description of the Product</h3><p class="just">' + para(pl.productDescription) + '</p>' +
      '<h3>2.2 Target Market / Main Customers</h3><p class="just">' + para(pl.targetMarket) + '</p>' +
      '<h3>2.3 Market Area</h3><p>' + para(pl.marketArea) + '</p>' +
      '<h3>2.4 Media used to promote the business</h3><p>' + para(pl.promotion.concat(pl.promotionOther ? [pl.promotionOther] : []).join(', ')) + '</p>' +
      (has(pl.salesStrategy) ? '<h3>Sales strategy</h3><p class="just">' + para(pl.salesStrategy) + '</p>' : '') +
      (has(pl.competitors) || has(pl.advantage) ? '<h3>Competition and competitive advantage</h3><p class="just">' + para([pl.competitors, pl.advantage].filter(has).join('\n')) + '</p>' : '') +
      '<h3>2.5 Selling Price / Unit and Sales Forecast</h3><table class="grid"><tr><th>Product</th><th>Unit Price</th><th>Qty sold</th><th>Sales / month</th><th>Sales / year</th></tr>' +
      prods.map(function (x) { return '<tr><td>' + esc(x.src.name) + (x.src.unit ? ' (per ' + esc(x.src.unit) + ')' : '') + '</td><td class="r">' + peso(n(x.src.price)) + '</td><td class="r">' + esc(x.src.qty) + ' / ' + esc(x.src.per) + '</td><td class="r">' + peso(x.salesMonth) + '</td><td class="r">' + peso(x.salesMonth * 12) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td colspan="3">TOTAL</td><td class="r">' + peso(pc.salesM) + '</td><td class="r">' + peso(pc.salesM * 12) + '</td></tr></table>' +
      '<p class="note">Assumption: ' + esc(pl.daysPerMonth) + ' operating days per month' + (n(pl.growthPct) ? '; sales growth of ' + esc(pl.growthPct) + '% per month in the cash flow projection' : '') + '.</p>';
    // 3 production
    h += '<h2>3. PRODUCTION / OPERATIONS PLAN</h2><h3>3.1 Raw Materials and Source</h3><table class="grid"><tr><th>Raw Materials</th><th>Source</th></tr>' +
      pl.rawMaterials.filter(function (r) { return has(r.item); }).map(function (r) { return '<tr><td>' + esc(r.item) + '</td><td>' + esc(r.source) + '</td></tr>'; }).join('') + '</table>' +
      '<h3>3.2 Tools / Equipment Used</h3><ul>' + pl.equipment.filter(function (e) { return has(e.item); }).map(function (e) { return '<li>' + esc(e.item) + '</li>'; }).join('') + '</ul>' +
      (has(pl.process) ? '<h3>Production / service process</h3><p class="just">' + para(pl.process) + '</p>' : '') +
      '<h3>3.3 Production Cost (Costing &amp; Pricing)</h3><table class="grid"><tr><th>Product</th><th>Materials</th><th>Labor</th><th>Mfg. Overhead</th><th>Total Production Cost</th><th>No. of units produced</th><th>Production Cost / Unit</th><th>Selling Price</th><th>Mark-up</th></tr>' +
      prods.map(function (x) {
        var c = x.src.costing || {};
        return '<tr><td>' + esc(x.src.name) + '</td><td class="r">' + (has(c.materials) ? peso(n(c.materials)) : '—') + '</td><td class="r">' + (has(c.labor) ? peso(n(c.labor)) : '—') + '</td><td class="r">' + (has(c.overhead) ? peso(n(c.overhead)) : '—') +
          '</td><td class="r">' + (x.batchCost ? peso(x.batchCost) : '—') + '</td><td class="r">' + (has(c.units) ? esc(c.units) : '—') + '</td><td class="r">' + (x.unitCost != null ? peso(x.unitCost) : '<em class="flag">missing</em>') +
          '</td><td class="r">' + peso(n(x.src.price)) + '</td><td class="r">' + C.pct(x.markupPct) + '</td></tr>';
      }).join('') + '</table>';
    // 4 organization
    var emps = pl.employees.filter(function (e) { return has(e.name) || has(e.work); });
    h += '<h2>4. ORGANIZATION AND MANAGEMENT PLAN</h2><h3>4.1 Business Experience and Qualification of Entrepreneur/s</h3><p class="just">' + para(o.experience) + '</p>' +
      '<h3>4.2 Profile of Employees</h3><table class="grid"><tr><th>Name of Employee</th><th>Nature of Work</th><th>Status of Employment</th></tr>' +
      emps.map(function (e) { return '<tr><td>' + esc(e.name) + '</td><td>' + esc(e.work) + '</td><td>' + esc(e.status) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td colspan="2">Total No. of Employees</td><td>' + emps.length + '</td></tr></table>';
    // 5 financial plan
    h += '<h2>5. FINANCIAL PLAN</h2><h3>A. List of Items to be Funded</h3><table class="grid"><tr><th>Item</th><th>Qty</th><th>Unit cost</th><th>Cost</th><th>Type</th><th>Source</th></tr>' +
      pc.items.filter(function (i) { return has(i.item); }).map(function (i) { return '<tr><td>' + esc(i.item) + '</td><td class="r">' + esc(i.qty || 1) + '</td><td class="r">' + peso(n(i.unitCost)) + '</td><td class="r">' + peso(i.total) + '</td><td>' + (i.type === 'fixed' ? 'Fixed asset' : 'Working capital') + '</td><td>' + (i.source === 'loan' ? 'Loan' : 'Equity') + '</td></tr>'; }).join('') +
      '<tr class="tot"><td colspan="3">TOTAL AMOUNT</td><td class="r">' + peso(pc.itemsTotal) + '</td><td colspan="2"></td></tr></table>' +
      '<h3>B. Total Project Cost</h3><table class="grid"><tr><th>Particulars</th><th>Equity</th><th>Loan</th><th>Total</th></tr>' +
      '<tr><td>Fixed Assets</td><td class="r">' + peso(pc.pc.fixedEquity) + '</td><td class="r">' + peso(pc.pc.fixedLoan) + '</td><td class="r">' + peso(pc.pc.fixedTotal) + '</td></tr>' +
      '<tr><td>Working Capital</td><td class="r">' + peso(pc.pc.wcEquity) + '</td><td class="r">' + peso(pc.pc.wcLoan) + '</td><td class="r">' + peso(pc.pc.wcTotal) + '</td></tr>' +
      '<tr class="tot"><td>Total Project Cost</td><td class="r">' + peso(pc.pc.totalEquity) + '</td><td class="r">' + peso(pc.pc.totalLoan) + '</td><td class="r">' + peso(pc.pc.total) + '</td></tr></table>' +
      '<h3>C. Financial Projection</h3><table class="grid"><tr><th></th><th>Amount</th></tr>' +
      '<tr><td>Expected Annual Sales</td><td class="r">' + peso(pc.annual.sales) + '</td></tr>' +
      '<tr><td>Expected Annual Expenses (cost of sales + operating expenses)</td><td class="r">' + peso(pc.annual.expenses) + '</td></tr>' +
      '<tr><td>Expected Annual Gross Income (sales − cost of sales)</td><td class="r">' + peso(pc.annual.gross) + '</td></tr>' +
      '<tr class="tot"><td>Expected Annual Net Income</td><td class="r">' + peso(pc.annual.net) + '</td></tr></table>' +
      '<p class="note">Monthly operating expenses used: ' + pl.opex.filter(function (x) { return n(x.amount); }).map(function (x) { return esc(x.label) + ' ' + peso(n(x.amount)); }).join('; ') + '. Loan amortization is shown in the cash flow and is not an expense.</p>';
    // loan & cash flow
    var lc = pc.loan;
    if (lc.amount) {
      h += '<h3>D. Financing Requirement</h3><table class="kv">' + kv('Loan amount applied for', peso(lc.amount)) + kv('Purpose', p.loan.purposes.join(', ')) +
        kv('Service fee (3%, deducted on release)', peso(lc.fee)) + kv('Net loan proceeds', peso(lc.net)) + kv('Term', lc.term + ' months after a 6-month grace period, 0% interest') +
        kv('Monthly amortization', peso(lc.monthly)) + '</table>';
    }
    h += '<h3>E. 12-Month Cash Flow Projection</h3>' + cashflowTable(pc) +
      '<p class="note">Projection is based only on the figures entered above' + (has(pl.beginningCash) ? '' : ' (beginning cash not provided — assumed ₱0, please confirm)') + '.' + (pc.negativeMonths.length ? ' <b>Warning:</b> cash is negative in month(s) ' + pc.negativeMonths.join(', ') + '.' : '') + '</p>';
    // break-even & goals
    h += '<h2>6. BREAK-EVEN ANALYSIS AND BUSINESS DEVELOPMENT GOALS</h2><table class="kv">' +
      kv('Monthly fixed operating expenses', peso(pc.opexM)) + kv('Contribution margin (gross profit ÷ sales)', C.pct(pc.cmRatio * 100)) +
      kv('Break-even sales per month', pc.beSales == null ? 'Cannot be computed — missing costs or prices' : peso(pc.beSales)) +
      kv('Break-even sales per operating day', pc.beDaily == null ? '—' : peso(pc.beDaily)) +
      kv('Projected sales per month', peso(pc.salesM)) +
      kv('Margin of safety', pc.beSales && pc.salesM ? C.pct((pc.salesM - pc.beSales) / pc.salesM * 100) : '—') + '</table>' +
      '<h3>Business development goals</h3><table class="grid"><tr><th>Goal</th><th>Target / measure</th><th>By when</th></tr>' +
      pl.goals.filter(function (g) { return has(g.goal); }).map(function (g) { return '<tr><td>' + esc(g.goal) + '</td><td>' + esc(g.target) + '</td><td>' + esc(g.by) + '</td></tr>'; }).join('') + '</table>';
    h += '<h2>7. RISKS AND MITIGATION MEASURES</h2><table class="grid"><tr><th>Risk</th><th>Mitigation measure</th></tr>' +
      pl.risks.filter(function (r) { return has(r.risk); }).map(function (r) { return '<tr><td>' + esc(r.risk) + '</td><td>' + esc(r.mitigation) + '</td></tr>'; }).join('') + '</table>';
    if (has(pl.assumptions)) h += '<h3>Assumptions</h3><p class="just">' + para(pl.assumptions) + '</p>';
    h += '<div class="signs">' + sign('Prepared by (Signature over Printed Name)', C.fullName(o).toUpperCase()) + sign('Date', '') + '</div>';
    return { title: 'Annex D – Business Plan', html: h + footer(p) };
  }

  function autoSummary(p) {
    var b = p.business, pc = C.planCalc(p), o = p.owner;
    var prods = pc.products.filter(function (x) { return has(x.src.name); }).map(function (x) { return x.src.name; });
    var s = [];
    if (b.name) s.push(b.name + (b.nature ? ' is a ' + b.nature.toLowerCase() : ' is a business') + ' located in ' + (C.addr(b.address) || '—') + (b.startYear ? ', operating since ' + b.startYear : '') + '.');
    if (o.firstName) s.push('It is owned and managed by ' + C.fullName(o) + '.');
    if (prods.length) s.push('It offers ' + prods.join(', ') + (p.plan.targetMarket ? ' to ' + p.plan.targetMarket.replace(/\.$/, '').toLowerCase() : '') + '.');
    if (pc.salesM) s.push('Projected sales are ' + peso(pc.salesM) + ' per month (' + peso(pc.annual.sales) + ' per year) with a projected net income of ' + peso(pc.annual.net) + ' per year.');
    if (pc.loan.amount) s.push('The business is applying for an EMBRACE loan of ' + peso(pc.loan.amount) + ' for ' + (p.loan.purposes.join(' and ').toLowerCase() || 'business use') + ', payable in ' + pc.loan.term + ' monthly amortizations of ' + peso(pc.loan.monthly) + ' after a 6-month grace period.');
    return s.join(' ');
  }

  function cashflowTable(pc) {
    var rows = pc.cashflow;
    var lines = [['Cash beginning', 'beg'], ['Cash sales', 'sales'], ['Loan proceeds (net of 3% fee)', 'loanIn'], ['Total cash in', 'cashIn'],
      ['Cost of goods / production', 'cogs'], ['Operating expenses', 'opex'], ['Equipment / fixed assets bought', 'assets'], ['Loan amortization', 'amort'], ['Owner\'s drawings', 'drawings'],
      ['Total cash out', 'cashOut'], ['Cash ending', 'end']];
    return '<div class="scroll"><table class="grid small"><tr><th>Month</th>' + rows.map(function (r) { return '<th>' + r.m + '</th>'; }).join('') + '<th>Total</th></tr>' +
      lines.map(function (L) {
        var tot = L[1] === 'beg' ? rows[0].beg : L[1] === 'end' ? rows[rows.length - 1].end : rows.reduce(function (s, r) { return s + r[L[1]]; }, 0);
        var cls = /cashIn|cashOut|end/.test(L[1]) ? ' class="tot"' : '';
        return '<tr' + cls + '><td>' + L[0] + '</td>' + rows.map(function (r) { return '<td class="r' + (r[L[1]] < 0 ? ' neg' : '') + '">' + peso(r[L[1]], 0) + '</td>'; }).join('') + '<td class="r">' + peso(tot, 0) + '</td></tr>';
      }).join('') + '</table></div>';
  }

  function kv(k, val) { return '<tr><th>' + esc(k) + ':</th><td>' + (has(val) ? esc(val) : '<span class="blank" style="min-width:14em">&nbsp;</span>') + '</td></tr>'; }

  /* ---------------------------------------------------------- FINANCIAL STATEMENTS */
  function financialStatements(p) {
    var fs = p.fs, rows = C.fsCalc(p), b = p.business;
    var yrs = rows.map(function (r) { return r.y.year; });
    var last = yrs[yrs.length - 1];
    function head() { return '<tr><th></th>' + rows.map(function (r) { return '<th class="r">' + r.y.year + '<br>' + basisTag(r.y.basis) + '</th>'; }).join('') + '</tr>'; }
    function line(label, f, cls, indent) {
      return '<tr' + (cls ? ' class="' + cls + '"' : '') + '><td' + (indent ? ' style="padding-left:' + indent + 'em"' : '') + '>' + esc(label) + '</td>' +
        rows.map(function (r) { var x = f(r); return '<td class="r' + (x < 0 ? ' neg' : '') + '">' + (x === null || x === undefined || x === '' ? '<span class="flag">—</span>' : peso(x)) + '</td>'; }).join('') + '</tr>';
    }
    function opt(val) { return has(val) ? n(val) : null; }
    var top = '<div class="fs-co"><b>' + esc((b.name || '').toUpperCase()) + '</b><br>' + esc(C.addr(b.address)) + '</div>';
    var h = header('FINANCIAL STATEMENTS', 'For the period ended December 31, ' + last + ' · In-house, prepared by the owner');
    h += top + '<h2>INCOME STATEMENT</h2><table class="grid fs">' + head() +
      line('SALES', function (r) { return opt(r.y.sales); }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>Less: Cost of Sales</b></td></tr>' +
      line('Beginning Inventory', function (r) { return opt(r.y.begInv); }, '', 1.5) + line('Purchases', function (r) { return opt(r.y.purchases); }, '', 1.5) +
      line('Total Goods Available for Sale', function (r) { return r.c.goods; }, '', 1.5) + line('Ending Inventory', function (r) { return opt(r.y.endInv); }, '', 1.5) +
      line('Total Cost of Sales', function (r) { return r.c.cogs; }, '', 1.5) + line('GROSS INCOME', function (r) { return r.c.gross; }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>Less: Operating Expenses</b></td></tr>' +
      fs.opexLabels.map(function (l) { return line(l, function (r) { return opt(r.y.opex[l]); }, '', 1.5); }).join('') +
      line('Total Operating Expenses', function (r) { return r.c.opexTotal; }, 'tot') + line('NET INCOME', function (r) { return r.c.net; }, 'tot dbl') + '</table>';
    h += '<div class="pb"></div>' + top + '<h2>BALANCE SHEET</h2><table class="grid fs">' + head() +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>ASSETS — Current Assets</b></td></tr>' +
      line('Cash on Hand & in Bank', function (r) { return opt(r.y.cash); }, '', 1.5) + line('Accounts Receivable', function (r) { return opt(r.y.receivables); }, '', 1.5) +
      line('Merchandise Inventory', function (r) { return opt(r.y.endInv); }, '', 1.5) + line('Other Current Assets', function (r) { return opt(r.y.otherCurrent); }, '', 1.5) +
      line('Total Current Assets', function (r) { return r.c.curAssets; }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>Non-Current Assets</b></td></tr>' +
      fs.ncaLabels.map(function (l) {
        return line(l, function (r) { var a = r.y.nca[l] || {}; return has(a.cost) ? n(a.cost) : null; }, '', 1.5) +
          line('Less: Accumulated Depreciation', function (r) { var a = r.y.nca[l] || {}; return has(a.dep) ? -n(a.dep) : null; }, '', 3);
      }).join('') +
      line('Total Non-Current Assets', function (r) { return r.c.ncaNet; }, 'tot') + line('TOTAL ASSETS', function (r) { return r.c.totalAssets; }, 'tot dbl') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>LIABILITIES</b></td></tr>' +
      fs.liabLabels.map(function (l) { return line(l, function (r) { return opt(r.y.liab[l]); }, '', 1.5); }).join('') +
      line('Total Liabilities', function (r) { return r.c.totalLiab; }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>OWNER\'S EQUITY (CAPITAL)</b></td></tr>' +
      line('Capital, Beginning', function (r) { return opt(r.y.capitalBeg); }, '', 1.5) + line('Add: Additional Investment', function (r) { return opt(r.y.ownerInvest); }, '', 1.5) +
      line('Add: Net Income', function (r) { return r.c.net; }, '', 1.5) + line('Less: Drawings', function (r) { return has(r.y.drawings) ? -n(r.y.drawings) : null; }, '', 1.5) +
      line('Total Capital, End', function (r) { return r.c.capitalEnd; }, 'tot') + line('TOTAL LIABILITIES & CAPITAL', function (r) { return r.c.liabCap; }, 'tot dbl') +
      line('Difference (should be zero)', function (r) { return r.c.hasBS ? r.c.diff : null; }, 'chk') + '</table>';
    h += '<div class="pb"></div>' + top + '<h2>CASH FLOW STATEMENT</h2><table class="grid fs">' + head() +
      line('Cash, Beginning', function (r) { return opt(r.y.cf.beg); }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>Add: Cash Received</b></td></tr>' +
      line('Collections from sales', function (r) { return opt(r.y.cf.inSales); }, '', 1.5) + line('Loans received', function (r) { return opt(r.y.cf.inLoans); }, '', 1.5) +
      line("Owner's additional investment", function (r) { return opt(r.y.cf.inOwner); }, '', 1.5) + line('Other cash received', function (r) { return opt(r.y.cf.inOther); }, '', 1.5) +
      line('Total Cash Received', function (r) { return r.c.cfIn; }, 'tot') +
      '<tr><td colspan="' + (rows.length + 1) + '"><b>Less: Cash Disbursements</b></td></tr>' +
      line('Purchases / raw materials', function (r) { return opt(r.y.cf.outPurchases); }, '', 1.5) + line('Operating expenses paid', function (r) { return opt(r.y.cf.outOpex); }, '', 1.5) +
      line('Equipment / assets bought', function (r) { return opt(r.y.cf.outAssets); }, '', 1.5) + line('Loan payments', function (r) { return opt(r.y.cf.outLoan); }, '', 1.5) +
      line("Owner's drawings", function (r) { return opt(r.y.cf.outDrawings); }, '', 1.5) + line('Other cash paid', function (r) { return opt(r.y.cf.outOther); }, '', 1.5) +
      line('Total Cash Disbursements', function (r) { return r.c.cfOut; }, 'tot') + line('CASH, ENDING', function (r) { return r.c.hasCf ? r.c.cfEnd : null; }, 'tot dbl') + '</table>';
    h +='<h2>FINANCIAL INDICATORS</h2><table class="grid fs">' + head() +
      ind('Gross profit margin', function (c) { return C.pct(c.grossMargin); }) + ind('Net profit margin', function (c) { return C.pct(c.netMargin); }) +
      ind('Sales growth vs previous year', function (c) { return C.pct(c.salesGrowth); }) + ind('Current ratio (current assets ÷ current liabilities)', function (c) { return c.currentRatio == null ? '—' : c.currentRatio.toFixed(2); }) +
      ind('Debt-to-equity (liabilities ÷ capital)', function (c) { return c.debtToEquity == null ? '—' : c.debtToEquity.toFixed(2); }) + ind('Return on assets', function (c) { return C.pct(c.roa); }) + '</table>';
    function ind(label, f) { return '<tr><td>' + esc(label) + '</td>' + rows.map(function (r) { return '<td class="r">' + f(r.c) + '</td>'; }).join('') + '</tr>'; }
    var issues = C.fsIssues(p).filter(function (i) { return i.sev !== 'missing'; });
    if (issues.length) h += '<div class="warnbox"><b>Items to review before signing:</b><ul>' + issues.map(function (i) { return '<li>' + esc(i.msg) + '</li>'; }).join('') + '</ul></div>';
    h += '<p class="note">ACTUAL = based on the owner\'s records. ESTIMATE = owner\'s estimate / projection. Blank (—) = not provided.</p>';
    h += '<div class="signs">' + sign('Certified by (Owner / Proprietor)', C.fullName(p.owner).toUpperCase()) + sign('Date', '') + '</div>';
    return { title: 'Financial Statements', html: h + footer(p) };
  }

  /* ---------------------------------------------------------- FINANCING SUMMARY */
  function financing(p) {
    var pc = C.planCalc(p), lc = pc.loan, l = p.loan;
    var h = header('FINANCING SUMMARY & AMORTIZATION SCHEDULE', 'EMBRACE Program · ' + esc(p.business.name || ''));
    h += '<table class="kv">' + kv('Applicant', C.fullName(p.owner)) + kv('Business', p.business.name) + kv('Type of applicant', l.applicantType === 'ofw' ? 'Overseas Filipino Worker (OFW)' : 'Micro-entrepreneur') +
      kv('Loan amount applied for', lc.amount ? peso(lc.amount) : '') + kv('Purpose', l.purposes.join(', ')) + kv('Interest', '0% (zero percent)') +
      kv('Service fee (3%, deducted from principal)', lc.amount ? peso(lc.fee) : '') + kv('Net proceeds', lc.amount ? peso(lc.net) : '') +
      kv('Payment period', lc.term ? lc.term + ' months (' + (lc.term / 12) + ' year/s) after a 6-month grace period' : '') + kv('Monthly amortization', lc.amount ? peso(lc.monthly) : '') +
      kv('Collateral', l.collateral === 'pdc' ? 'Post-Dated Checks' : l.collateral === 'comaker' ? 'Co-maker: ' + (l.comaker.name || '') + (l.comaker.relation ? ' (' + l.comaker.relation + ')' : '') : '') +
      kv('Penalty for late payment', '0.5% of the amortization due per month of delay (' + peso(lc.penaltyPerMonthLate) + '/month)') + '</table>';
    if (!lc.valid && lc.amount) h += '<div class="warnbox">The amount is outside the EMBRACE range of PHP 20,000 – 100,000.</div>';
    h += '<h2>Use of Funds</h2><table class="grid"><tr><th>Item</th><th>Type</th><th>Source</th><th>Amount</th></tr>' +
      pc.items.filter(function (i) { return has(i.item); }).map(function (i) { return '<tr><td>' + esc(i.item) + '</td><td>' + (i.type === 'fixed' ? 'Fixed asset / equipment' : 'Working capital') + '</td><td>' + (i.source === 'loan' ? 'Loan' : 'Equity') + '</td><td class="r">' + peso(i.total) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td colspan="3">Total funded by loan</td><td class="r">' + peso(pc.pc.totalLoan) + '</td></tr><tr class="tot"><td colspan="3">Total project cost</td><td class="r">' + peso(pc.pc.total) + '</td></tr></table>';
    h += '<h2>Projected Capacity to Pay</h2><table class="kv">' + kv('Projected monthly sales', peso(pc.salesM)) + kv('Projected monthly net income (before amortization)', peso(pc.netM)) +
      kv('Monthly amortization', peso(lc.monthly)) + kv('Coverage (net income ÷ amortization)', pc.dscr == null ? '—' : pc.dscr.toFixed(2) + '×') + '</table>';
    h += '<h2>Amortization Schedule</h2>' + (lc.schedule.length ? '<table class="grid"><tr><th>No.</th><th>Due date</th><th class="r">Amortization</th><th class="r">Balance</th></tr>' +
      '<tr><td>—</td><td>' + (l.releaseDate ? C.fmtDate(l.releaseDate) + ' (release)' : 'Loan release (date to be set by the Secretariat)') + '</td><td></td><td class="r">' + peso(lc.amount) + '</td></tr>' +
      lc.schedule.map(function (s) { return '<tr><td>' + s.no + '</td><td>' + (s.due ? C.fmtDate(s.due) : 'Month ' + (6 + s.no) + ' after release') + '</td><td class="r">' + peso(s.payment) + '</td><td class="r">' + peso(s.balance) + '</td></tr>'; }).join('') + '</table>' : '<p><em class="flag">Enter a loan amount to see the schedule.</em></p>') +
      '<p class="note">Indicative only. The official amortization schedule is prepared by the LEDIP Center Secretariat and the period of payment is determined by the TWG.</p>';
    h += '<div class="signs">' + sign('Applicant', C.fullName(p.owner).toUpperCase()) + (l.collateral === 'comaker' ? sign('Co-maker', (l.comaker.name || '').toUpperCase()) : '') + '</div>';
    return { title: 'Financing Summary', html: h + footer(p) };
  }

  /* ---------------------------------------------------------- PASSPORT */
  function passport(p) {
    var o = p.owner, b = p.business, rev = p.review || {}, ver = rev.verified || {};
    var lf = C.latestFs(p), pc = C.planCalc(p), ov = C.overall(p);
    var h = header('MSME ENTERPRISE PASSPORT', (p.passportId ? 'Passport ID <b>' + esc(p.passportId) + '</b> · ' : '') + 'Readiness ' + ov.pct + '%');
    h += '<h2>1. Entrepreneur Profile</h2><table class="kv">' + kv('Name', C.fullName(o)) + kv('Role in business', o.role) + kv('Date of birth', o.dob ? C.fmtDate(o.dob) : '') + kv('Sex', o.sex) +
      kv('Civil status', o.civilStatus) + kv('Address', C.addr(o.address)) + kv('District', o.district ? o.district + ' District' : '') + kv('Mobile', o.contact) + kv('Email', o.email) + kv('Facebook', o.facebook) +
      kv('Highest education', o.education) + kv('Relevant experience', o.experience) + '</table>';
    h += '<h2>2. Business Profile</h2><table class="kv">' + kv('Business name', b.name) + kv('Address', C.addr(b.address)) + kv('Nature of business', b.nature) + kv('Business type', b.type) + kv('Ownership', b.ownership) +
      kv('Year started', b.startYear) + kv('Employees', (n(b.employees.male) + n(b.employees.female)) + ' (Male ' + (b.employees.male || 0) + ', Female ' + (b.employees.female || 0) + ')') +
      kv('Registrations', b.registrations.join(', ') + (b.regNumbers ? ' — ' + b.regNumbers : '')) + kv('Products / services', b.products.filter(has).join(', ')) + kv('Operations', b.operations) + kv('Description', b.description) + '</table>';
    h += '<h2>3. Financial Profile</h2><table class="kv">' + kv('Capital', has(b.capital) ? peso(n(b.capital)) : '') + kv('Latest annual gross sales', has(b.annualSales) ? peso(n(b.annualSales)) : '') + kv('Business net assets', has(b.netAssets) ? peso(n(b.netAssets)) : '');
    if (lf) h += kv('Latest financial statement', lf.y.year + ' (' + (lf.y.basis === 'estimate' ? 'estimate' : 'actual') + '): sales ' + peso(n(lf.y.sales)) + ', net income ' + peso(lf.c.net) + ', total assets ' + peso(lf.c.totalAssets));
    if (pc.salesM) h += kv('Business plan projection', 'Sales ' + peso(pc.salesM) + '/month, net income ' + peso(pc.netM) + '/month');
    if (pc.loan.amount) h += kv('Financing requirement', peso(pc.loan.amount) + ' EMBRACE loan for ' + p.loan.purposes.join(', '));
    h += kv('Verification', ver.fs ? 'Financial statements verified by OLEDIPO' : 'Self-reported') + '</table>';
    h += trainingTable(p);
    var needs = p.needs.concat(p.needsOther ? [p.needsOther] : []);
    h += '<h2>5. Development Needs</h2><p>' + (needs.length ? esc(needs.join('; ')) : '<em>None recorded.</em>') + '</p>';
    h += '<h2>6. Supporting Documents</h2><table class="grid"><tr><th>Category</th><th>File</th><th>Added</th><th>Status</th></tr>' +
      (p.documents.length ? p.documents.map(function (d) { return '<tr><td>' + esc(d.category) + '</td><td>' + esc(d.name) + '</td><td>' + C.fmtDate(d.addedAt) + '</td><td>' + (ver[d.id] ? 'Verified by OLEDIPO' : 'Self-reported') + '</td></tr>'; }).join('') : '<tr><td colspan="4"><em>No documents uploaded yet.</em></td></tr>') + '</table>';
    h += '<p class="note">Training records help identify development needs and are not loan requirements unless officially required. Information is shared with OLEDIPO only with the owner\'s consent' + (p.consent.share ? ' (consent given ' + C.fmtDate(p.consent.at) + ')' : ' (consent not yet given)') + '.</p>';
    return { title: 'MSME Enterprise Passport', html: h + footer(p) };
  }

  function trainingTable(p) {
    var ver = (p.review && p.review.verified) || {};
    return '<h2>4. Training and Capacity Development</h2><table class="grid"><tr><th>Training / activity</th><th>Type</th><th>Provider</th><th>Date</th><th>Hours</th><th>Topics &amp; skills acquired</th><th>Certificate</th><th>Status</th></tr>' +
      (p.trainings.length ? p.trainings.map(function (t) {
        return '<tr><td>' + esc(t.title) + '</td><td>' + esc(t.kind) + '</td><td>' + esc(t.provider) + '</td><td>' + (t.date ? C.fmtDate(t.date) : '') + '</td><td>' + esc(t.hours) + '</td><td>' + esc([t.topics, t.skills].filter(has).join(' — ')) +
          '</td><td>' + (t.certificateDocId ? 'Yes' : 'No') + '</td><td>' + (ver[t.id] ? 'Verified' : 'Self-reported') + '</td></tr>';
      }).join('') : '<tr><td colspan="8"><em>No trainings recorded.</em></td></tr>') + '</table>';
  }

  function trainingSummary(p) {
    var hours = p.trainings.reduce(function (s, t) { return s + n(t.hours); }, 0);
    var h = header('TRAINING AND CAPACITY DEVELOPMENT SUMMARY', esc(C.fullName(p.owner)) + ' · ' + esc(p.business.name || ''));
    h += '<table class="kv">' + kv('Number of trainings / activities', String(p.trainings.length)) + kv('Total hours', String(hours)) + '</table>' + trainingTable(p).replace('4. ', '');
    var needs = p.needs.concat(p.needsOther ? [p.needsOther] : []);
    var sug = C.suggestedNeeds(p).filter(function (s) { return needs.indexOf(s) < 0; });
    h += '<h2>Development Needs (identified by the owner)</h2><ul>' + (needs.length ? needs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') : '<li><em>None recorded.</em></li>') + '</ul>';
    if (sug.length) h += '<h2>Suggested by the EMBRACE Portal (based on gaps in the passport)</h2><ul>' + sug.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    return { title: 'Training Summary', html: h + footer(p) };
  }

  /* ---------------------------------------------------------- AFFIDAVIT & ANNEX C */
  function affidavit(p) {
    var o = p.owner;
    var h = '<div class="aff-head">REPUBLIC OF THE PHILIPPINES)<br>' + esc((o.address.municipality || 'PROVINCE OF ILOILO').toUpperCase()) + ' &nbsp;&nbsp;&nbsp;)S.S.<br>x-----------------------------------------x</div>' +
      '<h1 class="c">SWORN AFFIDAVIT</h1>' +
      '<p class="just ind">I, ' + v(C.fullName(o).toUpperCase(), 18) + ' of legal age and a resident of ' + v(C.addr(o.address), 20) + ', Iloilo, after having been duly sworn an oath in accordance with law, hereby voluntarily depose and say:</p>' +
      '<p class="just ind">That I have not availed of any loan assistance from any government instrumentality, subdivision or agency.</p>' +
      '<p class="just ind">That by my signature below, I attest that the information I have submitted in my application are true and correct as to the best of my personal knowledge and that any false, fraudulent or misrepresentation of facts and circumstances shall result into the automatic cancellation of my application, the amount received therefore be immediately due and demandable under the Expanded Micro Business Recovery Assistance during Crisis and Emergency (EMBRACE) Program of the Iloilo Provincial Government.</p>' +
      '<p class="just ind">That I execute this affidavit to attest to the truth of the foregoing and for whatever other lawful purpose this may serve.</p>' +
      '<p class="just ind">IN TRUTH WHEREOF, I have hereunto signed my name below, this ' + v('', 14) + ' at ' + v('', 10) + ' Iloilo, Philippines.</p>' +
      '<div class="signs">' + sign('Affiant', C.fullName(o).toUpperCase()) + '</div>' +
      '<p class="just ind">SUBSCRIBED AND SWORN before me this ' + v('', 16) + ' who exhibited to me his/her competent proof of identity consisting of his/her ID Card ' + v('', 14) + '.</p>' +
      '<p>Doc No. ____<br>Page No. ____<br>Book No. ____<br>Series of ' + new Date().getFullYear() + '</p>';
    return { title: 'Sworn Affidavit', html: h + '<p class="note">To be notarized. Prefilled by the EMBRACE Portal.</p>' };
  }

  function annexC(p) {
    var o = p.owner, b = p.business, name = C.fullName(o).toUpperCase(), brgy = o.address.brgy, bbrgy = b.address.brgy;
    var h = '<div class="c"><b>ANNEX C</b></div><h1 class="c">CERTIFICATE OF RESIDENCY</h1>' +
      '<p class="just ind">I, ' + v('', 20) + ', a bonafide resident of ' + v(brgy ? 'Brgy. ' + brgy + ', ' + (o.address.municipality || '') : '', 16) + ' and the concurrent Barangay Captain of ' + v(brgy ? 'Brgy. ' + brgy : '', 12) + ', do hereby attest that:</p>' +
      '<p class="just ind">' + v(name, 18) + ' is a resident of this barangay since ' + v(o.residentSinceYear, 8) + '.</p>' +
      '<p class="ind">Signed this ' + v('', 3) + ' day of ' + v('', 8) + ' 20' + v('', 2) + ' at ' + v('', 12) + ', Iloilo, Philippines.</p>' +
      '<div class="signs">' + sign('Signature over Printed Name of Brgy. Captain', '') + '</div><div class="pb"></div>' +
      '<h1 class="c">CERTIFICATE OF BUSINESS OPERATION</h1>' +
      '<p class="just ind">I, ' + v('', 20) + ', a bonafide resident of ' + v(bbrgy ? 'Brgy. ' + bbrgy + ', ' + (b.address.municipality || '') : '', 16) + ' and the concurrent Barangay Captain of ' + v(bbrgy ? 'Brgy. ' + bbrgy : '', 12) + ', do hereby depose and say:</p>' +
      '<ol class="just"><li>That ' + v(name, 16) + ' is the business owner of ' + v((b.name || '').toUpperCase(), 16) + ' operating within this barangay since ' + v(b.startYear, 6) + ';</li>' +
      '<li>That his/her business suffered substantial losses due to either of the following:<br>' + box(p.loan.elig.closure1mo === 'yes') + ' Temporary closure for at least a month within the period of pandemic/crisis/emergency;<br>' +
      box(p.loan.elig.drop20pct === 'yes') + ' At least twenty percent (20%) decrease in monthly revenues for 2 months within the period of pandemic/crisis/emergency based on the latest ITR/Financial Statement (FS) presented before me.</li>' +
      '<li>That he/she has employed at least two (2) personnel, other than himself, for a period of at least two (2) years prior to this issuance and;</li>' +
      '<li>That the employees referred above are permanent residents of the Province of Iloilo;</li></ol>' +
      '<p class="ind">Signed this ' + v('', 3) + ' day of ' + v('', 8) + ' 20' + v('', 2) + ' at ' + v('', 12) + ', Iloilo, Philippines.</p>' +
      '<div class="signs">' + sign('Signature over Printed Name of Brgy. Captain', '') + '</div>';
    return { title: 'Annex C – Barangay Certificates', html: h + '<p class="note">Prefilled by the EMBRACE Portal for the Barangay Captain\'s review and signature. The Barangay Captain completes and signs this certificate.</p>' };
  }

  function checklistDoc(p) {
    var L = C.checklist(p), el = C.eligibility(p);
    var h = header('EMBRACE REQUIREMENTS CHECKLIST', esc(C.fullName(p.owner)) + ' · ' + (p.loan.applicantType === 'ofw' ? 'OFW' : 'Micro-Enterprise Owner'));
    h += '<h2>Eligibility self-check</h2><table class="grid"><tr><th>Criterion</th><th>Answer</th></tr>' + el.list.map(function (x) { return '<tr><td>' + esc(x.label) + (x.src ? '<br><small>' + esc(x.src) + '</small>' : '') + '</td><td>' + (x.ok === true ? '✔ Yes' : x.ok === false ? '✘ No' : '? Not answered') + '</td></tr>'; }).join('') + '</table>';
    h += '<h2>Documentary requirements</h2><table class="grid"><tr><th></th><th>Requirement</th><th>Status</th></tr>' + L.map(function (x) {
      return '<tr><td>' + box(x.status === 'done') + '</td><td>' + esc(x.label) + '<br><small>' + esc(x.detail || '') + '</small></td><td>' + ({ done: 'Complete', ready: 'Ready to print / sign', missing: 'Missing', optional: 'If requested' }[x.status]) + '</td></tr>';
    }).join('') + '</table><p class="note">Based on the EMBRACE Program Implementing Rules and Regulations. Final requirements are confirmed by the LEDIP Center Secretariat.</p>';
    return { title: 'Requirements Checklist', html: h + footer(p) };
  }

  var LIST = [
    { id: 'plan', fn: businessPlan, icon: 'plan', desc: 'Annex D business plan with costing, sales forecast, cash flow, break-even, financing and risks.' },
    { id: 'fs', fn: financialStatements, icon: 'chart', desc: 'Income statement, balance sheet, cash flow statement and indicators (actual vs estimate).' },
    { id: 'annexA', fn: annexA, icon: 'form', desc: 'EMBRACE Application Form prefilled from your Passport. Print 3 copies and sign.' },
    { id: 'financing', fn: financing, icon: 'loan', desc: 'Loan amount, use of funds, capacity to pay and indicative amortization schedule.' },
    { id: 'passport', fn: passport, icon: 'id', desc: 'Your reusable MSME Enterprise Passport.' },
    { id: 'training', fn: trainingSummary, icon: 'cap', desc: 'Trainings, seminars, coaching and development needs.' },
    { id: 'checklist', fn: checklistDoc, icon: 'check', desc: 'Eligibility self-check and documentary requirements.' },
    { id: 'annexC', fn: annexC, icon: 'stamp', desc: 'Barangay Certificate of Residency and Business Operation, prefilled for your Barangay Captain.' },
    { id: 'affidavit', fn: affidavit, icon: 'pen', desc: 'Sworn Affidavit (no other government loan), prefilled for notarization.' }
  ];

  var PRINT_CSS = 'body{font-family:"Times New Roman",Georgia,serif;font-size:11.5pt;color:#000;line-height:1.35}' +
    '.doc-head{text-align:center;margin-bottom:10pt}.doc-head .lgu{font-size:10pt}.doc-head h1{font-size:15pt;margin:8pt 0 2pt;letter-spacing:.5pt}.doc-head .sub{font-size:10pt}.right{text-align:right}' +
    'h1.c,.c{text-align:center}h1.c{font-size:15pt}h2{font-size:12pt;background:#e8eef9;padding:3pt 6pt;margin:14pt 0 6pt;border-left:4pt solid #123A8C}h3{font-size:11pt;margin:10pt 0 4pt}' +
    'table{border-collapse:collapse;width:100%;margin:4pt 0}table.grid td,table.grid th,table.form td{border:1px solid #555;padding:3pt 5pt;vertical-align:top}table.grid th{background:#f0f0f0;font-size:10pt}' +
    'table.grid.small td,table.grid.small th{font-size:8pt;padding:2pt 3pt}table.kv th{text-align:left;font-weight:normal;width:42%;padding:2pt 6pt 2pt 0;vertical-align:top}table.kv td{padding:2pt 0;border-bottom:1px dotted #999}' +
    'td.r,th.r{text-align:right;white-space:nowrap}tr.tot td{font-weight:bold;border-top:1.5px solid #000}tr.dbl td{border-bottom:3px double #000}tr.chk td{font-style:italic;color:#555}.neg{color:#b00020}' +
    'small{font-size:8.5pt;color:#333}.fill{font-weight:bold;border-bottom:1px solid #000;padding:0 2pt}.blank{display:inline-block;border-bottom:1px solid #000;min-height:1em}' +
    '.flag{color:#b45309;font-style:italic}.cb{display:inline-block;width:11pt;height:11pt;border:1px solid #000;text-align:center;line-height:11pt;font-size:9pt;vertical-align:middle}' +
    '.just{text-align:justify}.ind{text-indent:2em}.note{font-size:9pt;color:#333;font-style:italic}.twg{border:1px solid #555;padding:6pt;margin:10pt 0;font-size:10pt}' +
    '.signs{display:flex;gap:30pt;justify-content:space-between;margin-top:30pt;flex-wrap:wrap}.sign{min-width:200pt;text-align:center;font-size:10pt}.sign .line{border-bottom:1px solid #000;min-height:16pt;font-weight:bold}' +
    '.doc-foot{margin-top:20pt;border-top:1px solid #999;padding-top:4pt;font-size:8pt;color:#444}.tag{font-size:7pt;padding:0 3pt;border:1px solid #000;border-radius:2pt}.tag.est{background:#fff3cd}.tag.act{background:#e6f4ea}' +
    '.warnbox{border:1px solid #b45309;background:#fff7ed;padding:6pt;margin:8pt 0;font-size:10pt}.fs-co{text-align:center;margin-top:6pt}.pb{page-break-after:always;break-after:page}.aff-head{font-weight:bold}.scroll{overflow-x:auto}ol li{margin:3pt 0}';

  function wordBlob(doc) {
    var html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + esc(doc.title) +
      '</title><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]--><style>@page{size:8.5in 13in;margin:0.75in}' + PRINT_CSS + '</style></head><body>' + doc.html + '</body></html>';
    return new Blob(['﻿', html], { type: 'application/msword' });
  }

  G.GrowDocs = { LIST: LIST, PRINT_CSS: PRINT_CSS, wordBlob: wordBlob, autoSummary: autoSummary, cashflowTable: cashflowTable, esc: esc };
})(window);
