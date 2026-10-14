/* GROW — data model, calculations, validation.
   Rules from the EMBRACE Program IRR (Iloilo Provincial Government):
   - Loan PHP 20,000 – 100,000, 0% interest, 3% service fee deducted from principal
   - 6-month grace period; payable 1 year (<= 50,000) or 2 years (> 50,000), monthly
   - Penalty 0.5% of amortization due per month of delay; 3 missed dues = default
   Financial figures are ONLY computed from what the user enters. Missing data is flagged, never invented. */
(function (G) {
  'use strict';

  var EMBRACE = {
    MIN: 20000, MAX: 100000, FEE: 0.03, GRACE_MONTHS: 6, PENALTY: 0.005,
    termFor: function (amt) { return amt > 50000 ? 24 : 12; },
    ASSET_CAP: 3000000, EMP_MIN: 2, EMP_MAX: 9
  };

  var DEFAULT_OPEX = ['Salaries and Wages', 'Rent', 'Power, Light and Water', 'Permits and Licenses', 'Transportation', 'Repairs and Maintenance', 'Supplies', 'Other expenses'];
  var DEFAULT_NCA = ['Land and Building', 'Equipment', 'Vehicles', 'Furniture and Fixtures'];
  var DEFAULT_LIAB = ['Accounts Payable', 'Loans Payable', 'Other Liabilities'];

  var DOC_CATEGORIES = [
    "Mayor's Permit", 'DTI Registration', 'SEC Registration', 'Barangay Permit', 'BIR Registration / ITR',
    'Signed Financial Statement', 'Barangay Certificate (Annex C)', 'Signed Application Form (Annex A)',
    'Signed Business Plan (Annex D)', 'Sworn Affidavit', 'Post-Dated Checks (copy)', "Co-maker's proof of financial capacity",
    'Valid ID', 'Training Certificate', 'Passport / Travel Document', 'Flight Ticket / Boarding Pass',
    'Proof of Overseas Employment', 'Proof of Loss of Employment', 'OWWA Certification of Repatriation',
    'Photo of Business', 'Receipts / Bookkeeping Records', 'Other'
  ];

  var NEEDS = [
    'Bookkeeping and record keeping', 'Costing and pricing', 'Financial literacy / cash management', 'Digital marketing and social media',
    'Product development and packaging', 'Food safety / FDA / Halal requirements', 'Business registration and permits',
    'Inventory management', 'Customer service', 'Basic entrepreneurship training'
  ];

  function uid(p) { return (p || 'x') + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function n(v) { if (v === '' || v == null) return 0; var x = Number(String(v).replace(/[₱,\s]/g, '')); return isFinite(x) ? x : 0; }
  function has(v) { return v !== '' && v != null && !(typeof v === 'string' && !v.trim()); }
  function hasNum(v) { return v !== '' && v != null && isFinite(Number(String(v).replace(/[₱,\s]/g, ''))); }
  function r2(x) { return Math.round(x * 100) / 100; }

  function newProfile() {
    var y = new Date().getFullYear();
    return {
      schema: 1, id: uid('p'), passportId: '', lang: 'en',
      owner: { lastName: '', firstName: '', middleName: '', dob: '', sex: '', civilStatus: '', contact: '', facebook: '', email: '', tin: '', banks: '',
        address: { lot: '', street: '', brgy: '', municipality: '', province: 'Iloilo', zip: '' }, district: '', residentSinceYear: '', role: 'Owner', experience: '', education: '' },
      business: { name: '', address: { lot: '', street: '', brgy: '', municipality: '', province: 'Iloilo', zip: '' }, startYear: '', type: '', ownership: '', nature: '',
        employees: { male: '', female: '' }, employment: { permanent: '', contractual: '', casual: '', seasonal: '', others: '' },
        registrations: [], regNumbers: '', products: ['', '', ''], capital: '', annualSales: '', netAssets: '', description: '', operations: '' },
      plan: {
        projectName: '', summary: '', productDescription: '', targetMarket: '', marketArea: '', promotion: [], promotionOther: '', salesStrategy: '', competitors: '', advantage: '',
        products: [{ id: uid('pr'), name: '', unit: '', price: '', qty: '', per: 'day', unitCost: '', costing: { materials: '', labor: '', overhead: '', units: '' } }],
        daysPerMonth: 26, opex: [{ label: 'Rent', amount: '' }, { label: 'Power, Light and Water', amount: '' }, { label: 'Salaries and Wages (not included in product cost)', amount: '' }],
        rawMaterials: [{ item: '', source: '' }], equipment: [{ item: '' }], process: '', employees: [{ name: '', work: '', status: 'Permanent' }],
        itemsFunded: [{ item: '', qty: '', unitCost: '', type: 'fixed', source: 'loan' }],
        beginningCash: '', growthPct: '', drawings: '', includeLoan: true,
        goals: [{ goal: '', target: '', by: '' }],
        risks: [{ risk: '', mitigation: '' }],
        assumptions: ''
      },
      fs: { opexLabels: DEFAULT_OPEX.slice(), ncaLabels: DEFAULT_NCA.slice(), liabLabels: DEFAULT_LIAB.slice(),
        years: [y - 3, y - 2, y - 1].map(function (yy) { return newFsYear(yy); }) },
      loan: { applicantType: 'micro', amount: '', purposes: [], releaseDate: '', collateral: '', comaker: { name: '', relation: '', contact: '', occupation: '', income: '' },
        elig: { resident6mo: '', inIloilo: '', operating1yr: '', closure1mo: '', drop20pct: '', assetsUnder3M: '', employees2to9: '', noGovAssist: '',
          ofwResident: '', ofwDisplaced: '', ofwOwwa: '', ofwNoHostCredit: '' } },
      trainings: [],
      documents: [],
      needs: [], needsOther: '',
      consent: { share: false, at: '' },
      review: null,
      meta: { createdAt: new Date().toISOString(), updatedAt: '', lastRoute: '', readyAt: '', completeness: 0, missing: [], dirty: false, serverUpdatedAt: '' }
    };
  }

  function newFsYear(year) {
    return { year: year, basis: 'actual', sales: '', begInv: '', purchases: '', endInv: '', opex: {}, cash: '', receivables: '', otherCurrent: '',
      nca: {}, liab: {}, capitalBeg: '', drawings: '', ownerInvest: '',
      cf: { beg: '', inSales: '', inLoans: '', inOwner: '', inOther: '', outPurchases: '', outOpex: '', outAssets: '', outLoan: '', outDrawings: '', outOther: '' } };
  }

  /* migrate older / imported profiles so all paths exist */
  function normalize(p) {
    var base = newProfile();
    function merge(d, s) {
      if (Array.isArray(d)) return Array.isArray(s) ? s : d;
      if (d && typeof d === 'object') {
        var o = {};
        Object.keys(d).forEach(function (k) { o[k] = s && k in s ? merge(d[k], s[k]) : d[k]; });
        if (s && typeof s === 'object') Object.keys(s).forEach(function (k) { if (!(k in o)) o[k] = s[k]; });
        return o;
      }
      return s === undefined ? d : s;
    }
    var out = merge(base, p || {});
    out.fs.years = (out.fs.years || []).map(function (y) { return merge(newFsYear(y.year), y); });
    out.plan.products = (out.plan.products || []).map(function (x) { return merge({ id: uid('pr'), name: '', unit: '', price: '', qty: '', per: 'day', unitCost: '', costing: { materials: '', labor: '', overhead: '', units: '' } }, x); });
    return out;
  }

  /* ---------------------------------------------------------- business plan */
  function productCalc(pr, daysPerMonth) {
    var c = pr.costing || {};
    var batchCost = n(c.materials) + n(c.labor) + n(c.overhead);
    var costingUnit = n(c.units) > 0 && batchCost > 0 ? batchCost / n(c.units) : null;
    var unitCost = hasNum(pr.unitCost) && has(pr.unitCost) ? n(pr.unitCost) : (costingUnit != null ? costingUnit : null);
    var mult = pr.per === 'month' ? 1 : pr.per === 'week' ? 52 / 12 : n(daysPerMonth) || 0;
    var unitsMonth = n(pr.qty) * mult;
    var price = n(pr.price);
    var sales = unitsMonth * price;
    var cogs = unitCost != null ? unitsMonth * unitCost : null;
    return {
      batchCost: batchCost, costingUnit: costingUnit, unitCost: unitCost, unitsMonth: unitsMonth, salesMonth: sales,
      cogsMonth: cogs, marginPerUnit: unitCost != null ? price - unitCost : null,
      markupPct: unitCost ? (price - unitCost) / unitCost * 100 : null
    };
  }

  function loanCalc(amount, releaseDate) {
    var a = n(amount);
    var term = a > 0 ? EMBRACE.termFor(a) : 0;
    var fee = r2(a * EMBRACE.FEE);
    var monthly = term ? r2(a / term) : 0;
    var schedule = [];
    if (a > 0) {
      var start = releaseDate ? new Date(releaseDate + 'T00:00:00') : null;
      var bal = a;
      for (var i = 1; i <= term; i++) {
        var pay = i === term ? r2(bal) : monthly;
        bal = r2(bal - pay);
        var due = null;
        if (start && !isNaN(start)) { due = new Date(start); due.setMonth(due.getMonth() + EMBRACE.GRACE_MONTHS + (i - 1)); }
        schedule.push({ no: i, due: due, payment: pay, balance: Math.max(0, bal) });
      }
    }
    return { amount: a, term: term, fee: fee, net: r2(a - fee), monthly: monthly, schedule: schedule, penaltyPerMonthLate: r2(monthly * EMBRACE.PENALTY),
      valid: a >= EMBRACE.MIN && a <= EMBRACE.MAX };
  }

  function planCalc(p) {
    var pl = p.plan;
    var prods = pl.products.map(function (pr) { return Object.assign({ src: pr }, productCalc(pr, pl.daysPerMonth)); });
    var salesM = prods.reduce(function (s, x) { return s + x.salesMonth; }, 0);
    var cogsKnown = prods.every(function (x) { return x.cogsMonth != null || !n(x.src.price); });
    var cogsM = prods.reduce(function (s, x) { return s + (x.cogsMonth || 0); }, 0);
    var opexM = pl.opex.reduce(function (s, o) { return s + n(o.amount); }, 0);
    var loan = loanCalc(p.loan.amount, p.loan.releaseDate);
    var grossM = salesM - cogsM;
    var netM = grossM - opexM;
    var cmRatio = salesM > 0 ? grossM / salesM : 0;
    var beSales = cmRatio > 0 ? opexM / cmRatio : null;

    // funded items & project cost (Annex D 5.A / 5.B)
    var items = pl.itemsFunded.map(function (it) { return Object.assign({ total: n(it.qty || 1) * n(it.unitCost) }, it); });
    function sum(f) { return items.filter(f).reduce(function (s, i) { return s + i.total; }, 0); }
    var pc = {
      fixedEquity: sum(function (i) { return i.type === 'fixed' && i.source === 'equity'; }),
      fixedLoan: sum(function (i) { return i.type === 'fixed' && i.source === 'loan'; }),
      wcEquity: sum(function (i) { return i.type === 'working' && i.source === 'equity'; }),
      wcLoan: sum(function (i) { return i.type === 'working' && i.source === 'loan'; })
    };
    pc.totalEquity = pc.fixedEquity + pc.wcEquity; pc.totalLoan = pc.fixedLoan + pc.wcLoan;
    pc.fixedTotal = pc.fixedEquity + pc.fixedLoan; pc.wcTotal = pc.wcEquity + pc.wcLoan; pc.total = pc.totalEquity + pc.totalLoan;
    var loanItemsTotal = pc.totalLoan;

    // 12-month cash flow projection (based only on the user's inputs)
    var g = n(pl.growthPct) / 100;
    var cash = n(pl.beginningCash);
    var rows = [];
    var useLoan = pl.includeLoan && loan.amount > 0;
    for (var m = 1; m <= 12; m++) {
      var f = Math.pow(1 + g, m - 1);
      var r = { m: m, beg: cash, sales: salesM * f, loanIn: 0, equityIn: 0, cogs: cogsM * f, opex: opexM, assets: 0, amort: 0, drawings: n(pl.drawings) };
      if (m === 1) {
        r.equityIn = 0;
        if (useLoan) { r.loanIn = loan.net; r.assets = pc.fixedLoan; }
        r.assets += pc.fixedEquity;
      }
      if (useLoan && m > EMBRACE.GRACE_MONTHS && m - EMBRACE.GRACE_MONTHS <= loan.term) r.amort = loan.monthly;
      r.cashIn = r.sales + r.loanIn + r.equityIn;
      r.cashOut = r.cogs + r.opex + r.assets + r.amort + r.drawings;
      r.end = r.beg + r.cashIn - r.cashOut;
      cash = r.end;
      rows.push(r);
    }
    var annualSales = rows.reduce(function (s, r) { return s + r.sales; }, 0);
    var annualCogs = rows.reduce(function (s, r) { return s + r.cogs; }, 0);
    var annualOpex = opexM * 12;

    return {
      products: prods, salesM: salesM, cogsM: cogsM, cogsKnown: cogsKnown, opexM: opexM, grossM: grossM, netM: netM, cmRatio: cmRatio,
      beSales: beSales, beDaily: beSales != null && n(pl.daysPerMonth) ? beSales / n(pl.daysPerMonth) : null,
      items: items, itemsTotal: items.reduce(function (s, i) { return s + i.total; }, 0), pc: pc, loanItemsTotal: loanItemsTotal,
      loan: loan, cashflow: rows, negativeMonths: rows.filter(function (r) { return r.end < 0; }).map(function (r) { return r.m; }),
      annual: { sales: annualSales, cogs: annualCogs, opex: annualOpex, expenses: annualCogs + annualOpex, gross: annualSales - annualCogs, net: annualSales - annualCogs - annualOpex },
      dscr: useLoan && loan.monthly ? netM / loan.monthly : null
    };
  }

  /* ---------------------------------------------------------- financial statements */
  function fsYearCalc(y, fs) {
    var cogs = n(y.begInv) + n(y.purchases) - n(y.endInv);
    var goods = n(y.begInv) + n(y.purchases);
    var opexTotal = fs.opexLabels.reduce(function (s, l) { return s + n(y.opex[l]); }, 0);
    var gross = n(y.sales) - cogs;
    var net = gross - opexTotal;
    var curAssets = n(y.cash) + n(y.receivables) + n(y.endInv) + n(y.otherCurrent);
    var ncaNet = fs.ncaLabels.reduce(function (s, l) { var a = y.nca[l] || {}; return s + n(a.cost) - n(a.dep); }, 0);
    var totalAssets = curAssets + ncaNet;
    var curLiab = n(y.liab['Accounts Payable']);
    var totalLiab = fs.liabLabels.reduce(function (s, l) { return s + n(y.liab[l]); }, 0);
    var capitalEnd = n(y.capitalBeg) + n(y.ownerInvest) + net - n(y.drawings);
    var cf = y.cf || {};
    var cfIn = n(cf.inSales) + n(cf.inLoans) + n(cf.inOwner) + n(cf.inOther);
    var cfOut = n(cf.outPurchases) + n(cf.outOpex) + n(cf.outAssets) + n(cf.outLoan) + n(cf.outDrawings) + n(cf.outOther);
    var cfEnd = n(cf.beg) + cfIn - cfOut;
    var hasCf = ['beg', 'inSales', 'outPurchases', 'outOpex'].some(function (k) { return has(cf[k]); });
    return {
      goods: goods, cogs: cogs, gross: gross, opexTotal: opexTotal, net: net, curAssets: curAssets, ncaNet: ncaNet, totalAssets: totalAssets,
      curLiab: curLiab, totalLiab: totalLiab, capitalEnd: capitalEnd, liabCap: totalLiab + capitalEnd, diff: r2(totalAssets - (totalLiab + capitalEnd)),
      cfIn: cfIn, cfOut: cfOut, cfEnd: cfEnd, hasCf: hasCf,
      grossMargin: n(y.sales) ? gross / n(y.sales) * 100 : null,
      netMargin: n(y.sales) ? net / n(y.sales) * 100 : null,
      currentRatio: curLiab ? curAssets / curLiab : null,
      debtToEquity: capitalEnd ? totalLiab / capitalEnd : null,
      roa: totalAssets ? net / totalAssets * 100 : null,
      hasIS: has(y.sales), hasBS: has(y.cash) || has(y.capitalBeg)
    };
  }

  function fsCalc(p) {
    var fs = p.fs;
    var ys = fs.years.slice().sort(function (a, b) { return a.year - b.year; });
    var out = ys.map(function (y) { return { y: y, c: fsYearCalc(y, fs) }; });
    out.forEach(function (o, i) {
      var prev = out[i - 1];
      o.c.salesGrowth = prev && n(prev.y.sales) ? (n(o.y.sales) - n(prev.y.sales)) / n(prev.y.sales) * 100 : null;
    });
    return out;
  }

  function fsIssues(p) {
    var list = [];
    var rows = fsCalc(p);
    rows.forEach(function (o, i) {
      var y = o.y, c = o.c, Y = y.year + (y.basis === 'estimate' ? ' (estimate)' : '');
      if (!has(y.sales)) list.push({ sev: 'missing', where: 'fs', msg: Y + ': Sales is missing.' });
      if (has(y.sales) && !has(y.purchases) && !has(y.begInv)) list.push({ sev: 'missing', where: 'fs', msg: Y + ': Cost of sales (inventory / purchases) is missing.' });
      if (has(y.sales) && c.opexTotal === 0) list.push({ sev: 'missing', where: 'fs', msg: Y + ': No operating expenses entered.' });
      if (c.goods > 0 && n(y.endInv) > c.goods) list.push({ sev: 'error', where: 'fs', msg: Y + ': Ending inventory is bigger than goods available for sale.' });
      if (c.cogs < 0) list.push({ sev: 'error', where: 'fs', msg: Y + ': Cost of sales is negative — check inventory and purchases.' });
      if (!has(y.cash)) list.push({ sev: 'missing', where: 'fs', msg: Y + ': Cash on hand / in bank (balance sheet) is missing.' });
      if (!has(y.capitalBeg)) list.push({ sev: 'missing', where: 'fs', msg: Y + ': Beginning capital is missing.' });
      if (c.hasBS && Math.abs(c.diff) >= 1) list.push({ sev: 'error', where: 'fs', msg: Y + ': Balance sheet does not balance. Assets − (Liabilities + Capital) = ' + peso(c.diff) + '. Check drawings, liabilities or asset values. GROW does not force this to balance.' });
      if (c.hasCf && has(y.cash) && Math.abs(c.cfEnd - n(y.cash)) >= 1) list.push({ sev: 'warning', where: 'fs', msg: Y + ': Ending cash in the cash flow (' + peso(c.cfEnd) + ') is different from cash in the balance sheet (' + peso(n(y.cash)) + ').' });
      if (c.netMargin != null && c.netMargin > 60) list.push({ sev: 'warning', where: 'fs', msg: Y + ': Net profit margin is ' + c.netMargin.toFixed(0) + '% — unusually high. Please double-check expenses.' });
      var prev = rows[i - 1];
      if (prev) {
        if (has(y.begInv) && has(prev.y.endInv) && n(y.begInv) !== n(prev.y.endInv)) list.push({ sev: 'warning', where: 'fs', msg: y.year + ': Beginning inventory should equal ' + prev.y.year + ' ending inventory (' + peso(n(prev.y.endInv)) + ').' });
        if (has(y.capitalBeg) && prev.c.hasBS && Math.abs(n(y.capitalBeg) - prev.c.capitalEnd) >= 1) list.push({ sev: 'warning', where: 'fs', msg: y.year + ': Beginning capital should equal ' + prev.y.year + ' ending capital (' + peso(prev.c.capitalEnd) + ').' });
        if (has(y.cf.beg) && has(prev.y.cash) && n(y.cf.beg) !== n(prev.y.cash)) list.push({ sev: 'warning', where: 'fs', msg: y.year + ': Beginning cash should equal ' + prev.y.year + ' ending cash (' + peso(n(prev.y.cash)) + ').' });
      }
    });
    if (rows.length && rows.every(function (o) { return o.y.basis === 'estimate'; })) list.push({ sev: 'warning', where: 'fs', msg: 'All years are marked as estimates. Lenders prefer at least one year of actual figures.' });
    return list;
  }

  /* ---------------------------------------------------------- EMBRACE eligibility & checklist */
  function yrsOperating(p) { var s = n(p.business.startYear); return s ? new Date().getFullYear() - s : null; }
  function employeeCount(p) { var e = p.business.employees; return has(e.male) || has(e.female) ? n(e.male) + n(e.female) : null; }
  function latestFs(p) { var r = fsCalc(p).filter(function (o) { return o.c.hasBS || o.c.hasIS; }); return r.length ? r[r.length - 1] : null; }

  function eligibility(p) {
    var e = p.loan.elig, ofw = p.loan.applicantType === 'ofw';
    function yn(v) { return v === 'yes' ? true : v === 'no' ? false : null; }
    var list;
    if (ofw) {
      list = [
        { k: 'ofwResident', label: 'Bonafide resident of Iloilo Province for at least 6 months', ok: yn(e.ofwResident) },
        { k: 'ofwDisplaced', label: "Displaced from job due to the host country's crisis/emergency, or infected by a communicable disease", ok: yn(e.ofwDisplaced) },
        { k: 'ofwOwwa', label: 'Active OWWA member (verified by PESO)', ok: yn(e.ofwOwwa) },
        { k: 'ofwNoHostCredit', label: 'Has not received credit assistance from the host country', ok: yn(e.ofwNoHostCredit) }
      ];
    } else {
      var yrs = yrsOperating(p), emp = employeeCount(p), lf = latestFs(p);
      var addrIloilo = /iloilo/i.test(p.business.address.province || '') ? true : (has(p.business.address.province) ? false : null);
      var losses = yn(e.closure1mo) === true || yn(e.drop20pct) === true ? true : (yn(e.closure1mo) === false && yn(e.drop20pct) === false ? false : null);
      var assetsAuto = lf && lf.c.totalAssets > 0 ? lf.c.totalAssets <= EMBRACE.ASSET_CAP : (has(p.business.netAssets) ? n(p.business.netAssets) <= EMBRACE.ASSET_CAP : null);
      list = [
        { k: 'resident6mo', label: 'Bonafide resident of Iloilo Province for at least 6 months before applying', ok: yn(e.resident6mo) },
        { k: 'inIloilo', label: 'Business is located within Iloilo Province', ok: addrIloilo, auto: true, src: 'Business address' },
        { k: 'operating1yr', label: 'Business operating for at least 1 year', ok: yrs == null ? null : yrs >= 1, auto: true, src: yrs == null ? 'Year started is missing' : yrs + ' year(s) in operation' },
        { k: 'losses', label: 'Suffered substantial losses: closed at least 1 month, OR at least 20% drop in monthly revenue for 2 months during a crisis/emergency', ok: losses },
        { k: 'assetsUnder3M', label: 'In industry, agri-business and/or services with assets of not more than PHP 3,000,000', ok: assetsAuto, auto: true, src: lf && lf.c.totalAssets ? 'Total assets ' + peso(lf.c.totalAssets) + ' (' + lf.y.year + ')' : 'From business net assets' },
        { k: 'employees2to9', label: 'Has 2 to 9 employees (other than the owner) who are Iloilo residents', ok: emp == null ? null : emp >= EMBRACE.EMP_MIN && emp <= EMBRACE.EMP_MAX, auto: true, src: emp == null ? 'Number of employees missing' : emp + ' employee(s)' },
        { k: 'noGovAssist', label: 'Has not availed of financial assistance from any government instrumentality, subdivision or agency', ok: yn(e.noGovAssist) }
      ];
    }
    return { list: list, pass: list.every(function (x) { return x.ok === true; }), fail: list.some(function (x) { return x.ok === false; }) };
  }

  function docHas(p, cats) { return p.documents.filter(function (d) { return cats.indexOf(d.category) >= 0; }); }

  function checklist(p) {
    var ofw = p.loan.applicantType === 'ofw';
    var pc = planCalc(p);
    var annexA = completenessOf(p, 'annexA');
    var annexD = completenessOf(p, 'plan');
    var lf = latestFs(p);
    var c = function (label, status, detail, link, cats) {
      var docs = cats ? docHas(p, cats) : [];
      return { label: label, status: status, detail: detail, link: link, docs: docs, cats: cats };
    };
    var L = [];
    L.push(c('3 copies of duly accomplished Application Form (Annex A)', annexA.pct === 100 ? (docHas(p, ['Signed Application Form (Annex A)']).length ? 'done' : 'ready') : 'missing',
      annexA.pct === 100 ? 'GROW can print it for you. Sign all 3 copies.' : annexA.pct + '% filled in — complete your Passport.', '#docs', ['Signed Application Form (Annex A)']));
    L.push(c('Project Proposal / Business Plan (Annex D)', annexD.pct === 100 ? 'ready' : 'missing', annexD.pct === 100 ? 'Ready to print from Documents.' : annexD.pct + '% complete.', '#plan', ['Signed Business Plan (Annex D)']));
    if (!ofw) {
      var itr = docHas(p, ['BIR Registration / ITR', 'Signed Financial Statement']);
      L.push(c('Latest Annual ITR, or latest in-house Financial Statement signed by the owner', itr.length ? 'done' : (lf && lf.y.basis === 'actual' && lf.c.hasIS && lf.c.hasBS ? 'ready' : 'missing'),
        itr.length ? 'Uploaded.' : (lf && lf.c.hasIS ? 'Print your Financial Statement from Documents and sign it.' : 'Fill in your Financial Statements.'), '#finance', ['BIR Registration / ITR', 'Signed Financial Statement']));
      var reg = docHas(p, ["Mayor's Permit", 'DTI Registration', 'SEC Registration', 'Barangay Permit']);
      L.push(c("Mayor's Permit / DTI / SEC Registration / Barangay Permit", reg.length ? 'done' : 'missing', reg.length ? reg.length + ' uploaded.' : 'Upload a photo or scan.', '#passport/documents', ["Mayor's Permit", 'DTI Registration', 'SEC Registration', 'Barangay Permit']));
      var bc = docHas(p, ['Barangay Certificate (Annex C)']);
      L.push(c('Barangay Certificate (Annex C): residency, business operation 1+ year, 2+ employees, substantial losses', bc.length ? 'done' : 'missing', bc.length ? 'Uploaded.' : 'Print Annex C from Documents and have your Barangay Captain sign it.', '#docs', ['Barangay Certificate (Annex C)']));
    } else {
      [['Copy of passport or travel document (with arrival stamp)', ['Passport / Travel Document']],
        ['Copy of flight ticket or boarding pass showing return to the Philippines', ['Flight Ticket / Boarding Pass']],
        ['Proof of overseas employment (OEC, contract, visa, residence ID, OWWA profile, Seaman\'s book, etc.)', ['Proof of Overseas Employment']],
        ['Proof of loss of employment due to crisis/emergency, or health certificate', ['Proof of Loss of Employment']],
        ['Certification of Repatriation from OWWA VI (if repatriated)', ['OWWA Certification of Repatriation']],
        ['Certificate of Basic Entrepreneurship Training (LEDIP Center or DTI)', ['Training Certificate']]].forEach(function (x) {
        var d = docHas(p, x[1]);
        L.push(c(x[0], d.length ? 'done' : 'missing', d.length ? 'Uploaded.' : 'Upload a photo or scan.', '#passport/documents', x[1]));
      });
    }
    var col = p.loan.collateral;
    var colDocs = col === 'pdc' ? docHas(p, ['Post-Dated Checks (copy)']) : docHas(p, ["Co-maker's proof of financial capacity"]);
    L.push(c('Post-Dated Checks, or Co-maker with proof of financial capacity (ITR, pay slip, bank statement, certificate of employment)',
      !col ? 'missing' : (colDocs.length ? 'done' : 'missing'),
      !col ? 'Choose PDC or Co-maker in Loan details.' : (col === 'pdc' ? 'PDCs are given to the Secretariat. Upload a copy if available.' : (p.loan.comaker.name ? 'Co-maker: ' + p.loan.comaker.name + '. Upload proof of capacity.' : 'Enter co-maker details.')),
      '#loan', col === 'pdc' ? ['Post-Dated Checks (copy)'] : ["Co-maker's proof of financial capacity"]));
    L.push(c('Sworn Affidavit (not availed of any government loan assistance) — if requested', docHas(p, ['Sworn Affidavit']).length ? 'done' : 'optional', 'GROW can prefill it; it must be notarized.', '#docs', ['Sworn Affidavit']));
    var okLoan = pc.loan.valid;
    L.push(c('Loan amount (PHP 20,000 – 100,000) and purpose recorded', okLoan && p.loan.purposes.length ? 'done' : 'missing', okLoan ? peso(pc.loan.amount) + ' for ' + (p.loan.purposes.join(', ') || '—') : 'Enter a loan amount between PHP 20,000 and 100,000.', '#loan'));
    return L;
  }

  /* ---------------------------------------------------------- completeness & issues */
  function req(list, ok, msg, route) { list.push({ ok: !!ok, msg: msg, route: route }); }

  function completenessOf(p, part) {
    var L = [], o = p.owner, b = p.business, pl = p.plan;
    if (part === 'owner' || part === 'annexA' || part === 'passport') {
      req(L, has(o.lastName) && has(o.firstName), 'Your full name', '#passport/owner');
      req(L, has(o.address.brgy) && has(o.address.municipality), 'Home address (barangay and municipality)', '#passport/owner');
      req(L, has(o.district), 'Congressional district', '#passport/owner');
      req(L, has(o.dob), 'Date of birth', '#passport/owner');
      req(L, has(o.sex), 'Sex', '#passport/owner');
      req(L, has(o.contact), 'Mobile number', '#passport/owner');
      req(L, has(o.civilStatus), 'Civil status', '#passport/owner');
    }
    if (part === 'business' || part === 'annexA' || part === 'passport') {
      req(L, has(b.name), 'Business name', '#passport/business');
      req(L, has(b.address.brgy) && has(b.address.municipality), 'Business address', '#passport/business');
      req(L, has(b.startYear), 'Year the business started', '#passport/business');
      req(L, has(b.employees.male) || has(b.employees.female), 'Number of employees', '#passport/business');
      req(L, has(b.type), 'Business type (manufacturing, trading, service)', '#passport/business');
      req(L, has(b.ownership), 'Form of ownership', '#passport/business');
      req(L, b.products.some(has), 'At least one product or service', '#passport/business');
      req(L, has(b.capital), 'Capital', '#passport/business');
      req(L, has(b.annualSales), 'Latest annual gross sales', '#passport/business');
      req(L, has(b.netAssets), 'Business net assets', '#passport/business');
    }
    if (part === 'annexA') {
      req(L, n(p.loan.amount) > 0, 'Loan amount applied for', '#loan');
      req(L, p.loan.purposes.length > 0, 'Loan purpose', '#loan');
    }
    if (part === 'plan') {
      req(L, has(pl.projectName), 'Name of project', '#plan/1');
      req(L, has(b.name) && has(b.description || pl.summary), 'Brief description of the business', '#plan/1');
      req(L, has(pl.productDescription), 'Description of the product', '#plan/2');
      req(L, pl.products.some(function (x) { return has(x.name) && n(x.price) > 0 && n(x.qty) > 0; }), 'At least one product with selling price and quantity sold', '#plan/2');
      req(L, has(pl.targetMarket), 'Target market / main customers', '#plan/2');
      req(L, has(pl.marketArea), 'Market area', '#plan/2');
      req(L, pl.promotion.length > 0 || has(pl.promotionOther), 'How you promote the business', '#plan/3');
      req(L, pl.rawMaterials.some(function (x) { return has(x.item); }), 'Raw materials (or goods you buy) and source', '#plan/4');
      req(L, pl.equipment.some(function (x) { return has(x.item); }), 'Tools / equipment used', '#plan/4');
      req(L, has(o.experience), 'Your business experience and qualification', '#plan/4');
      req(L, pl.products.filter(function (x) { return has(x.name); }).every(function (x) { return productCalc(x, pl.daysPerMonth).unitCost != null; }), 'Cost per unit for every product', '#plan/5');
      req(L, pl.opex.some(function (x) { return n(x.amount) > 0; }), 'Monthly operating expenses', '#plan/5');
      req(L, pl.itemsFunded.some(function (x) { return has(x.item) && n(x.unitCost) > 0; }), 'List of items to be funded', '#plan/7');
      req(L, pl.goals.some(function (x) { return has(x.goal); }), 'At least one business goal', '#plan/8');
      req(L, pl.risks.some(function (x) { return has(x.risk) && has(x.mitigation); }), 'At least one risk with its solution', '#plan/9');
    }
    if (part === 'fs') {
      var ys = p.fs.years;
      req(L, ys.some(function (y) { return has(y.sales); }), 'Sales for at least one year', '#finance');
      req(L, ys.some(function (y) { return Object.keys(y.opex).some(function (k) { return has(y.opex[k]); }); }), 'Operating expenses', '#finance');
      req(L, ys.some(function (y) { return has(y.cash); }), 'Cash (balance sheet)', '#finance');
      req(L, ys.some(function (y) { return has(y.capitalBeg); }), 'Capital (balance sheet)', '#finance');
      req(L, ys.some(function (y) { return has(y.cf.beg) || has(y.cf.inSales); }), 'Cash flow statement', '#finance');
    }
    if (part === 'loan') {
      req(L, n(p.loan.amount) >= EMBRACE.MIN && n(p.loan.amount) <= EMBRACE.MAX, 'Loan amount within PHP 20,000 – 100,000', '#loan');
      req(L, p.loan.purposes.length > 0, 'Loan purpose', '#loan');
      req(L, has(p.loan.collateral), 'Post-dated checks or co-maker', '#loan');
      req(L, p.loan.collateral !== 'comaker' || has(p.loan.comaker.name), "Co-maker's name", '#loan');
      req(L, eligibility(p).list.every(function (x) { return x.ok !== null; }), 'Answer all eligibility questions', '#loan');
    }
    if (part === 'trainings') {
      req(L, p.trainings.length > 0, 'At least one training record (optional for loans)', '#passport/trainings');
    }
    var done = L.filter(function (x) { return x.ok; }).length;
    return { pct: L.length ? Math.round(done / L.length * 100) : 100, items: L, missing: L.filter(function (x) { return !x.ok; }) };
  }

  function overall(p) {
    var parts = { passport: completenessOf(p, 'passport'), plan: completenessOf(p, 'plan'), fs: completenessOf(p, 'fs'), loan: completenessOf(p, 'loan') };
    var all = [].concat(parts.passport.items, parts.plan.items, parts.fs.items, parts.loan.items);
    var pct = Math.round(all.filter(function (x) { return x.ok; }).length / all.length * 100);
    var missing = [].concat(parts.passport.missing, parts.plan.missing, parts.fs.missing, parts.loan.missing);
    return { pct: pct, parts: parts, missing: missing };
  }

  function planIssues(p) {
    var pc = planCalc(p), L = [];
    if (pc.salesM > 0 && pc.netM < 0) L.push({ sev: 'warning', msg: 'Your plan shows a monthly LOSS of ' + peso(-pc.netM) + '. Review prices, costs or expenses.' });
    pc.products.forEach(function (x) {
      if (has(x.src.name) && x.unitCost != null && n(x.src.price) > 0 && x.unitCost >= n(x.src.price)) L.push({ sev: 'error', msg: x.src.name + ': cost per unit (' + peso(x.unitCost) + ') is equal to or higher than the selling price.' });
      if (has(x.src.name) && x.unitCost == null) L.push({ sev: 'missing', msg: x.src.name + ': cost per unit is missing (use the costing worksheet).' });
    });
    if (pc.negativeMonths.length) L.push({ sev: 'warning', msg: 'Cash runs out in month(s) ' + pc.negativeMonths.join(', ') + ' of the projection.' });
    if (pc.loan.amount > 0 && pc.loanItemsTotal > 0 && Math.abs(pc.loanItemsTotal - pc.loan.amount) >= 1) L.push({ sev: 'warning', msg: 'Items to be funded by the loan total ' + peso(pc.loanItemsTotal) + ' but the loan amount is ' + peso(pc.loan.amount) + '.' });
    if (pc.dscr != null && pc.dscr < 1.2) L.push({ sev: 'warning', msg: 'Monthly profit covers the amortization only ' + pc.dscr.toFixed(2) + '×. A cushion of at least 1.2× is safer.' });
    if (!has(p.plan.beginningCash)) L.push({ sev: 'missing', msg: 'Beginning cash for the projection is missing (enter 0 if none).' });
    return L;
  }

  function suggestedNeeds(p) {
    var s = [];
    var f = completenessOf(p, 'fs');
    if (f.pct < 60) s.push('Bookkeeping and record keeping');
    var pc = planCalc(p);
    if (pc.products.some(function (x) { return x.unitCost == null && has(x.src.name); }) || (pc.salesM > 0 && pc.cmRatio < 0.2)) s.push('Costing and pricing');
    if (pc.negativeMonths.length) s.push('Financial literacy / cash management');
    if (!p.plan.promotion.some(function (m) { return /facebook|online|social|tiktok|shopee|lazada/i.test(m); })) s.push('Digital marketing and social media');
    if (!p.business.registrations.length) s.push('Business registration and permits');
    if (p.loan.applicantType === 'ofw' && !p.trainings.some(function (t) { return /entrepreneur/i.test(t.title || ''); })) s.push('Basic entrepreneurship training');
    return s;
  }

  /* ---------------------------------------------------------- formatting */
  function peso(x, dec) {
    if (x == null || !isFinite(x)) return '—';
    var neg = x < 0; x = Math.abs(x);
    return (neg ? '−' : '') + '₱' + x.toLocaleString('en-PH', { minimumFractionDigits: dec == null ? 2 : dec, maximumFractionDigits: dec == null ? 2 : dec });
  }
  function pct(x) { return x == null || !isFinite(x) ? '—' : x.toFixed(1) + '%'; }
  function fmtDate(d) {
    if (!d) return '';
    var x = d instanceof Date ? d : new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
    if (isNaN(x)) return String(d);
    return x.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  function fullName(o) { return [o.firstName, o.middleName ? o.middleName.charAt(0) + '.' : '', o.lastName].filter(Boolean).join(' '); }
  function addr(a) { a = a || {}; return [a.lot, a.street, a.brgy ? 'Brgy. ' + a.brgy.replace(/^brgy\.?\s*/i, '') : '', a.municipality, a.province, a.zip].filter(function (x) { return x && String(x).trim(); }).join(', '); }

  G.GrowCalc = {
    EMBRACE: EMBRACE, DOC_CATEGORIES: DOC_CATEGORIES, NEEDS: NEEDS, DEFAULT_OPEX: DEFAULT_OPEX,
    uid: uid, n: n, has: has, newProfile: newProfile, newFsYear: newFsYear, normalize: normalize,
    productCalc: productCalc, planCalc: planCalc, loanCalc: loanCalc, fsCalc: fsCalc, fsYearCalc: fsYearCalc, fsIssues: fsIssues,
    eligibility: eligibility, checklist: checklist, completenessOf: completenessOf, overall: overall, planIssues: planIssues, suggestedNeeds: suggestedNeeds,
    yrsOperating: yrsOperating, employeeCount: employeeCount, latestFs: latestFs,
    peso: peso, pct: pct, fmtDate: fmtDate, fullName: fullName, addr: addr
  };
})(window);
