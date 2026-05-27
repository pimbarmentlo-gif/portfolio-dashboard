'use strict';
// ================================================================
//  PORTFOLIO DASHBOARD v3 — app.js
//  Prices:   Finnhub (stocks) + CoinGecko (crypto)
//  News:     Finnhub company-news (30-day window)
//  Earnings: Finnhub calendar (180-day window)
// ================================================================

const API = {
  FH: 'https://finnhub.io/api/v1',
  CG: 'https://api.coingecko.com/api/v3',
};

const SK = {
  H:'pfh-v5', V:'pfv-v5', A:'pfa-v5',
  S:'pfs-v5', W:'pfw-v5', N:'pfn-v5', E:'pfe-v5',
};

// ─── DEFAULT HOLDINGS ────────────────────────────────────────────
// fh  = Finnhub symbol (null = no live price, stale value shown)
// cg  = CoinGecko id (crypto only)
// cur = USD → auto-converted to EUR | EUR → shown as-is
// sh  = shares | ac = avg cost EUR | v0 = last known EUR value
const DEFAULTS = [
  // ── DEGIRO ── (ac = GAK / gemiddelde aankoopkoers, confirmed from broker app)
  {id:'d2',  n:'Applied Digital',   f:'Applied Digital Corp',          t:'APLD', fh:'APLD',  cg:null, cur:'USD', pl:'DEGIRO', ty:'stock', sh:3,           ac:27.60,      v0:118.50,  c:'#1D9E75'},
  {id:'d3',  n:'ASML',              f:'ASML Holding NV',               t:'ASML', fh:'ASML',  cg:null, cur:'USD', pl:'DEGIRO', ty:'stock', sh:1,           ac:859.20,     v0:1412.00, c:'#1e40af'},
  {id:'d4',  n:'Chevron',           f:'Chevron Corp',                  t:'CVX',  fh:'CVX',   cg:null, cur:'USD', pl:'DEGIRO', ty:'stock', sh:1,           ac:141.52,     v0:156.58,  c:'#065f46'},
  {id:'d5',  n:'IREN',              f:'IREN Ltd',                      t:'IREN', fh:'IREN',  cg:null, cur:'USD', pl:'DEGIRO', ty:'stock', sh:2,           ac:39.385,     v0:106.02,  c:'#6d28d9'},
  {id:'d6',  n:'Just Eat',          f:'Just Eat Takeaway.com NV',      t:'JET',  fh:null,    cg:null, cur:'EUR', pl:'DEGIRO', ty:'stock', sh:21,          ac:76.807619,  v0:424.62,  c:'#dc2626', dl:true},
  {id:'d7',  n:'YIT Oyj',           f:'YIT Oyj (Finnish construction)',t:'YIT',  fh:'TYTYF', cg:null, cur:'USD', pl:'DEGIRO', ty:'stock', sh:30,          ac:3.165,      v0:79.80,   c:'#78716c'},
  {id:'d8',  n:'iShares AEX',       f:'iShares AEX UCITS ETF EUR',     t:'IAEX', fh:null,    cg:null, cur:'EUR', pl:'DEGIRO', ty:'etf',   sh:1,           ac:98.37,      v0:105.38,  c:'#475569'},
  {id:'d9',  n:'VanEck Defense',    f:'VanEck Defense UCITS ETF',      t:'DFNS', fh:null,    cg:null, cur:'EUR', pl:'DEGIRO', ty:'etf',   sh:3,           ac:54.107,     v0:166.26,  c:'#9a3412'},
  // ── TRADING 212 ──
  {id:'t0',  n:'Vanguard All-World', f:'Vanguard FTSE All-World ETF',  t:'VWCE', fh:null,    cg:null,              cur:'EUR', pl:'Trading 212', ty:'etf',   sh:4.7,         ac:162.36,  v0:762.86,  c:'#991b1b'},
  {id:'t1',  n:'Siemens Energy',    f:'Siemens Energy AG',             t:'ENR',  fh:'SMNEY', cg:null,              cur:'USD', pl:'Trading 212', ty:'stock', sh:1.87619411,  ac:131.15,  v0:335.46,  c:'#065f46'},
  {id:'t2',  n:'iShares AEX',       f:'iShares AEX (Dist)',            t:'IAEX', fh:null,    cg:null,              cur:'EUR', pl:'Trading 212', ty:'etf',   sh:2.05238435,  ac:97.93,   v0:217.29,  c:'#475569'},
  {id:'t3',  n:'Rheinmetall',       f:'Rheinmetall AG',                t:'RHM',  fh:'RNMBF', cg:null,              cur:'USD', pl:'Trading 212', ty:'stock', sh:0.07150307,  ac:1399.80, v0:88.39,   c:'#9a3412'},
  {id:'t4',  n:'IREN',              f:'IREN Ltd',                      t:'IREN', fh:'IREN',  cg:null,              cur:'USD', pl:'Trading 212', ty:'stock', sh:0.09502748,  ac:47.35,   v0:4.80,    c:'#6d28d9'},
  // ── CRYPTO ──
  {id:'c1',  n:'Ethereum',          f:'Ethereum',          t:'ETH',  fh:null, cg:'ethereum',          cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:151.80, c:'#6366f1'},
  {id:'c2',  n:'Bitcoin',           f:'Bitcoin',           t:'BTC',  fh:null, cg:'bitcoin',           cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:91.95,  c:'#d97706'},
  {id:'c3',  n:'XRP',               f:'XRP',               t:'XRP',  fh:null, cg:'ripple',            cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:36.88,  c:'#1d4ed8'},
  {id:'c4',  n:'VeChain',           f:'VeChain Thor',      t:'VET',  fh:null, cg:'vechain',           cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:30.44,  c:'#0369a1'},
  {id:'c5',  n:'Internet Computer', f:'Internet Computer', t:'ICP',  fh:null, cg:'internet-computer', cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:16.28,  c:'#0284c7'},
  {id:'c6',  n:'Cardano',           f:'Cardano',           t:'ADA',  fh:null, cg:'cardano',           cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:6.73,   c:'#0e7490'},
  {id:'c7',  n:'Solana',            f:'Solana',            t:'SOL',  fh:null, cg:'solana',            cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:5.03,   c:'#7c3aed'},
  {id:'c8',  n:'Polkadot',          f:'Polkadot',          t:'DOT',  fh:null, cg:'polkadot',          cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:4.68,   c:'#be185d'},
  {id:'c9',  n:'Verge',             f:'Verge',             t:'XVG',  fh:null, cg:'verge',             cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:4.13,   c:'#0891b2'},
  {id:'c10', n:'Dogecoin',          f:'Dogecoin',          t:'DOGE', fh:null, cg:'dogecoin',          cur:'EUR', pl:'Crypto', ty:'crypto', sh:null, ac:null, v0:4.16,   c:'#b45309'},
];

// DEGIRO broker-confirmed totals (from account overview screenshot)
// Totaal W/V includes realized gains from sold positions (e.g. AMD sold earlier)
// Unrealized on current positions ≈ −€561 (dominated by JET −€1,188 loss)
// Realized gains from previous trades ≈ +€1,487 (mainly AMD profit)
const DEGIRO_KNOWN_PNL  = 925.63;

// ─── STATE ──────────────────────────────────────────────────────
let S = {
  holdings: [],
  prices:   {},
  eurPerUsd: 0.92,
  vhist:    [],
  alerts:   {global:5},
  settings: {fhKey:'', refreshSec:120},
  watchlist:['NVDA','MBG.DE'],
  wlPrices: {},
  news:     [],
  earnings: [],
  tab:      'overview',
  countdown: 120,
  refreshTimer: null, cdownTimer: null,
  chartModal: null, chartPortfolio: null, chartAlloc: null,
  modalHoldingId: null, modalRange: 30,
};

// ─── STORAGE ────────────────────────────────────────────────────
const store = {
  get: k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── HELPERS ────────────────────────────────────────────────────
const sleep    = ms => new Promise(r => setTimeout(r, ms));
const eur      = (v, d=2) => v == null ? '—' : '€' + Math.abs(v).toLocaleString('nl-NL', {minimumFractionDigits:d, maximumFractionDigits:d});
const pct      = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const sign     = v => v == null ? '—' : (v >= 0 ? '+' : '') + eur(v);
const cc       = v => v == null ? '' : v >= 0 ? 'green' : 'red';
const today    = () => new Date().toISOString().split('T')[0];
const daysAgo  = n => new Date(Date.now() - n*86400000).toISOString().split('T')[0];
const daysFwd  = n => new Date(Date.now() + n*86400000).toISOString().split('T')[0];

function getVal(h) {
  const p = S.prices[h.id];
  if (p?.live && h.sh && p.eur) return p.eur * h.sh;
  return h.v0 || 0;
}
function getPnL(h) {
  if (!h.sh || !h.ac) return null;
  const val = getVal(h), cost = h.ac * h.sh;
  return { eur: val - cost, pct: ((val - cost) / cost) * 100 };
}
function getTotals() {
  const tv = S.holdings.reduce((s,h) => s + getVal(h), 0);
  const wac = S.holdings.filter(h => h.sh && h.ac);
  const tPnL = wac.length ? wac.reduce((s,h) => s + (getPnL(h)?.eur||0), 0) : null;
  const tCost = wac.reduce((s,h) => s + h.ac*h.sh, 0);
  let dayEur = 0, hasDay = false;
  S.holdings.forEach(h => {
    const p = S.prices[h.id];
    if (!p?.live || !h.sh || p.chgAbs == null) return;
    dayEur += (h.cur === 'USD' ? p.chgAbs * S.eurPerUsd : p.chgAbs) * h.sh;
    hasDay = true;
  });
  return { tv, tPnL, tCost, dayEur: hasDay ? dayEur : null };
}

// ─── FINNHUB FETCH ───────────────────────────────────────────────
async function fh(path) {
  const key = S.settings.fhKey;
  if (!key) return null;
  const sep = path.includes('?') ? '&' : '?';
  try {
    const r = await fetch(`${API.FH}${path}${sep}token=${key}`);
    if (!r.ok) { console.warn('Finnhub', r.status, path); return null; }
    const data = await r.json();
    if (data?.error) { console.warn('Finnhub error:', data.error, path); return null; }
    return data;
  } catch(e) { console.warn('Finnhub fetch failed:', e.message, path); return null; }
}

// ─── FETCH ALL PRICES ────────────────────────────────────────────
async function fetchAllPrices() {
  setDot('stale');
  document.getElementById('btn-refresh').classList.add('spinning');
  const prev = JSON.parse(JSON.stringify(S.prices));

  try {
    // 1. EUR/USD exchange rate
    const fx = await fh('/forex/rates?base=USD');
    if (fx?.quote?.EUR) S.eurPerUsd = fx.quote.EUR;

    // 2. Stock prices via Finnhub
    for (const h of S.holdings.filter(h => h.fh && !h.dl)) {
      const q = await fh(`/quote?symbol=${h.fh}`);
      if (q?.c && q.c !== 0) {
        const eurPrice = h.cur === 'USD' ? q.c * S.eurPerUsd : q.c;
        S.prices[h.id] = {
          eur: eurPrice, native: q.c,
          chgPct: q.dp, chgAbs: q.d,
          hi: h.cur==='USD' ? q.h*S.eurPerUsd : q.h,
          lo: h.cur==='USD' ? q.l*S.eurPerUsd : q.l,
          pc: h.cur==='USD' ? q.pc*S.eurPerUsd : q.pc,
          live: true, ts: Date.now(),
        };
      } else if (!S.prices[h.id]) {
        S.prices[h.id] = { eur: h.v0/(h.sh||1), native:null, chgPct:null, chgAbs:null, live:false };
      }
      await sleep(100);
    }

    // 3. Watchlist prices
    for (const ticker of S.watchlist) {
      const q = await fh(`/quote?symbol=${ticker}`);
      if (q?.c && q.c !== 0) S.wlPrices[ticker] = { price: q.c, chgPct: q.dp, live: true };
      await sleep(100);
    }

    // 4. Crypto via CoinGecko (one batch call, free, no key)
    const cgIds = [...new Set(S.holdings.filter(h=>h.cg).map(h=>h.cg))];
    if (cgIds.length) {
      try {
        const cg = await fetch(`${API.CG}/simple/price?ids=${cgIds.join(',')}&vs_currencies=eur&include_24hr_change=true`).then(r=>r.json());
        S.holdings.filter(h=>h.cg).forEach(h => {
          if (cg[h.cg]) S.prices[h.id] = { eur:cg[h.cg].eur, native:cg[h.cg].eur, chgPct:cg[h.cg].eur_24h_change, chgAbs:null, live:true, ts:Date.now() };
        });
      } catch(e) { console.warn('CoinGecko error:', e.message); }
    }

    // 5. Alerts
    checkAlerts(prev);

    // 6. Snapshot value for portfolio chart
    const { tv } = getTotals();
    snapshotVal(tv);

    setDot('live');
    document.getElementById('hdr-time').textContent = 'Updated ' + new Date().toLocaleTimeString('nl-NL', {hour:'2-digit',minute:'2-digit',second:'2-digit'});

  } catch(e) {
    console.error('Price fetch error:', e);
    setDot('error');
  }

  document.getElementById('btn-refresh').classList.remove('spinning');
  renderAll();
}

function setDot(s) {
  document.getElementById('live-dot').className = 'live-dot' + (s==='stale'?' stale':s==='error'?' error':'');
}

// ─── AUTO REFRESH ────────────────────────────────────────────────
function startRefresh() {
  if (S.refreshTimer) clearInterval(S.refreshTimer);
  if (S.cdownTimer)   clearInterval(S.cdownTimer);
  const sec = S.settings.refreshSec;
  S.countdown = sec;
  S.refreshTimer = setInterval(() => { S.countdown = sec; fetchAllPrices(); }, sec*1000);
  S.cdownTimer   = setInterval(() => { S.countdown = Math.max(0, S.countdown-1); updateBar(); }, 1000);
}
function updateBar() {
  const sec = S.settings.refreshSec;
  document.getElementById('refresh-progress').style.width = ((sec-S.countdown)/sec*100)+'%';
  const m = Math.floor(S.countdown/60), s = S.countdown%60;
  document.getElementById('refresh-label').textContent = S.countdown > 0
    ? `Next refresh in ${m>0?m+':'+String(s).padStart(2,'0'):s+'s'}`
    : 'Refreshing…';
}

// ─── VALUE HISTORY ───────────────────────────────────────────────
function snapshotVal(tv) {
  if (!tv || tv < 50) return;
  const now = Date.now(), last = S.vhist[S.vhist.length-1];
  if (last && now-last.t < 4*60000) return;
  S.vhist.push({t:now, v:Math.round(tv*100)/100});
  S.vhist = S.vhist.filter(x => x.t > now-90*86400000);
  store.set(SK.V, S.vhist);
}

// ─── ALERTS ──────────────────────────────────────────────────────
function checkAlerts(prev) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  S.holdings.forEach(h => {
    const cur = S.prices[h.id], old = prev[h.id];
    if (!cur?.live || !old?.live || !cur.eur || !old.eur) return;
    const chg = ((cur.eur-old.eur)/old.eur)*100;
    const thr = S.alerts[h.id] || S.alerts.global || 5;
    if (Math.abs(chg) >= thr) {
      new Notification(`${h.n} ${chg>=0?'▲':'▼'} ${Math.abs(chg).toFixed(1)}%`, {
        body: `Now €${cur.eur.toFixed(2)} (was €${old.eur.toFixed(2)})`,
      });
    }
  });
}

// ─── RENDER: HEADER ──────────────────────────────────────────────
function renderHeader() {
  const {tv, tPnL, tCost, dayEur} = getTotals();
  document.getElementById('hdr-total').textContent = eur(tv);
  const dayEl = document.getElementById('hdr-day');
  dayEl.textContent = dayEur != null ? sign(dayEur) : '—';
  dayEl.className = 'total-val ' + cc(dayEur);
  const pnlEl = document.getElementById('hdr-pnl');
  // Include known DEGIRO P&L in the total display
  const knownPnL = tPnL;
  if (knownPnL != null) {
    pnlEl.textContent = sign(knownPnL) + (tCost > 0 ? ' ('+pct(knownPnL/tCost*100)+')' : '');
    pnlEl.className = 'total-val ' + cc(knownPnL);
  } else {
    pnlEl.textContent = '—'; pnlEl.className = 'total-val muted';
  }
  const now = new Date();
  const cet = new Date(now.toLocaleString('en-US', {timeZone:'Europe/Amsterdam'}));
  const h = cet.getHours(), dow = cet.getDay();
  const open = dow>=1 && dow<=5 && h>=9 && (h<17||(h===17&&cet.getMinutes()<30));
  const pill = document.getElementById('market-pill');
  pill.textContent = open ? 'Market Open' : 'Market Closed';
  pill.className = 'market-pill ' + (open ? 'open' : 'closed');
}

// ─── RENDER: PLATFORM STRIP ──────────────────────────────────────
function renderPlatformStrip() {
  const plats = ['DEGIRO','Trading 212','Crypto'];
  const cols  = {DEGIRO:'#1e40af','Trading 212':'#166534',Crypto:'#b45309'};
  document.getElementById('platform-strip').innerHTML = plats.map(pl => {
    const ph  = S.holdings.filter(h=>h.pl===pl);
    const val = ph.reduce((s,h)=>s+getVal(h),0);
    const wac = ph.filter(h=>h.sh&&h.ac);
    const pnl = wac.reduce((s,h)=>s+(getPnL(h)?.eur||0),0);
    // For DEGIRO, use the known total P&L from broker
    const isDeg = pl === 'DEGIRO';
    // For DEGIRO: show calculated unrealized P&L per holding, plus broker-confirmed total
    const unrealizedPnL = wac.length ? pnl : null;
    const pnlLabel = isDeg
      ? (unrealizedPnL != null
          ? `${sign(unrealizedPnL)} unrealized · +€${DEGIRO_KNOWN_PNL.toFixed(2)} total incl. realized`
          : `+€${DEGIRO_KNOWN_PNL.toFixed(2)} total (broker confirmed)`)
      : (wac.length ? sign(pnl) : 'Add avg cost for P&L');
    const displayPnL = isDeg ? unrealizedPnL : (wac.length ? pnl : null);
    return `<div class="plat-card">
      <div class="plat-top"><span class="plat-dot2" style="background:${cols[pl]}"></span><span class="plat-nm">${pl}</span></div>
      <div class="plat-val">${eur(val)}</div>
      <div class="plat-pnl ${isDeg?(unrealizedPnL!=null?cc(unrealizedPnL):'green'):(displayPnL!=null?cc(pnl):'muted')}">${pnlLabel}</div>
      <div class="plat-cnt">${ph.length} positions</div>
    </div>`;
  }).join('');
}

// ─── RENDER: OVERVIEW ────────────────────────────────────────────
function renderOverview() {
  const panel = document.getElementById('panel-overview');
  const tv = S.holdings.reduce((s,h)=>s+getVal(h),0);
  let html = '';

  // Allocation bar
  html += '<div class="alloc-bar">';
  S.holdings.forEach(h => {
    html += `<div style="flex:${Math.max(0.3,(getVal(h)/tv)*100)};background:${h.c}" title="${h.n}: ${((getVal(h)/tv)*100).toFixed(1)}%"></div>`;
  });
  html += '</div>';

  html += `<div class="alert-strip alert-warn">⚠ <strong>Just Eat Takeaway</strong> — 21 shares bought at €76.81 avg, now worth €20.22 (delisted). Unrealized loss: <strong>−€1,188.34 (−73.67%)</strong>. Contact DEGIRO to receive the delisted share cash.</div>`;
  html += `<div class="alert-strip alert-good">✅ <strong>DEGIRO total return: +€925.63</strong> — Your open positions have −€562 unrealized (JET drag), but realized gains from previous trades (incl. AMD sold earlier) add +€1,487. ASML alone is up +€552.80 (+64%). Chevron dividend €1.53 due 10 June.</div>`;

  const plColors = {DEGIRO:'#1e40af','Trading 212':'#166534',Crypto:'#b45309'};

  ['DEGIRO','Trading 212','Crypto'].forEach(pl => {
    const ph = S.holdings.filter(h=>h.pl===pl);
    if (!ph.length) return;
    const plVal = ph.reduce((s,h)=>s+getVal(h),0);
    const isDeg = pl === 'DEGIRO';

    html += `<div class="sec-hdr">
      <div class="sec-dot" style="background:${plColors[pl]}"></div>
      <span class="sec-lbl">${pl}</span>
      <span class="sec-sub">${eur(plVal)} · ${ph.length} positions${isDeg?' · day Δ shown':' · total P&L shown'}</span>
    </div>
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th>Holding</th><th class="r">Shares</th><th class="r">Price (€)</th>
        <th class="r">Value</th><th class="r">P&L €</th><th class="r">${isDeg?'Day Δ':'Return'}</th>
        <th class="r">Port%</th><th></th><th></th>
      </tr></thead><tbody>`;

    ph.forEach(h => {
      const val  = getVal(h);
      const pnl  = getPnL(h);
      const p    = S.prices[h.id];
      const live = p?.live;
      const priceDisp = p?.eur != null
        ? `€${p.eur.toFixed(2)}${h.cur==='USD'&&p.native?`<span class="price-usd">$${p.native.toFixed(2)}</span>`:''}`
        : `<span class="muted">€${(h.v0/(h.sh||1)).toFixed(2)}<span class="tag tag-stale">stale</span></span>`;
      const retDisp = pnl ? pct(pnl.pct) : (isDeg&&p?.chgPct!=null ? pct(p.chgPct) : '—');
      const retCol  = pnl ? cc(pnl.pct)  : (isDeg ? cc(p?.chgPct) : '');

      html += `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="h-chip" style="background:${h.c}18;color:${h.c}">${h.t.slice(0,3)}</div>
            <div>
              <div class="h-name">${h.n}
                ${h.dl?'<span class="tag tag-del">DELISTED</span>':''}
                ${!live&&!h.dl?'<span class="tag tag-stale">stale</span>':''}
              </div>
              <div class="h-sub">${h.t} · ${h.ty}</div>
            </div>
          </div>
        </td>
        <td class="r muted" style="font-size:12px">${h.sh!=null?h.sh.toLocaleString('nl-NL',{maximumFractionDigits:8}):'—'}</td>
        <td class="r">${priceDisp}</td>
        <td class="r" style="font-weight:600">${eur(val)}</td>
        <td class="r ${cc(pnl?.eur)}">${pnl?sign(pnl.eur):'<span class="muted" style="font-size:11px">add avg cost</span>'}</td>
        <td class="r ${retCol}" style="font-weight:500">${retDisp}</td>
        <td class="r muted" style="font-size:11px">${((val/tv)*100).toFixed(1)}%</td>
        <td><button class="btn-chart" onclick="openChart('${h.id}')" title="Price chart">📈</button></td>
        <td><button class="btn-rm" onclick="removeHolding('${h.id}')" title="Remove">×</button></td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  });

  panel.innerHTML = html;
}

// ─── CHARTS ──────────────────────────────────────────────────────
function renderPortfolioChart() {
  const canvas = document.getElementById('chart-portfolio');
  if (S.chartPortfolio) { S.chartPortfolio.destroy(); S.chartPortfolio = null; }
  const note = document.getElementById('portfolio-note');
  if (S.vhist.length < 2) {
    note.textContent = `${S.vhist.length} snapshot(s) so far — chart builds automatically as you use the dashboard.`;
    return;
  }
  note.textContent = `${S.vhist.length} snapshots · tracking since ${new Date(S.vhist[0].t).toLocaleDateString('nl-NL')}`;
  const labels = S.vhist.map(d=>new Date(d.t));
  const values = S.vhist.map(d=>d.v);
  const up = values[values.length-1] >= values[0];
  S.chartPortfolio = new Chart(canvas.getContext('2d'), {
    type:'line',
    data:{labels,datasets:[{data:values,borderColor:up?'#16a34a':'#dc2626',backgroundColor:up?'rgba(22,163,74,.07)':'rgba(220,38,38,.07)',borderWidth:2,fill:true,tension:0.3,pointRadius:S.vhist.length>40?0:3,pointHoverRadius:5}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' €'+c.parsed.y.toLocaleString('nl-NL',{minimumFractionDigits:2})}}},scales:{x:{type:'time',time:{tooltipFormat:'dd MMM HH:mm'},ticks:{color:'#94a3b8',maxTicksLimit:8},grid:{color:'rgba(0,0,0,.05)'}},y:{ticks:{color:'#94a3b8',callback:v=>'€'+v.toLocaleString('nl-NL')},grid:{color:'rgba(0,0,0,.05)'}}}},
  });
}

function renderAllocChart() {
  const canvas = document.getElementById('chart-alloc');
  if (S.chartAlloc) { S.chartAlloc.destroy(); S.chartAlloc = null; }
  const vals = S.holdings.map(h=>getVal(h));
  const total = vals.reduce((a,b)=>a+b,0);
  S.chartAlloc = new Chart(canvas.getContext('2d'), {
    type:'doughnut',
    data:{labels:S.holdings.map(h=>h.n),datasets:[{data:vals,backgroundColor:S.holdings.map(h=>h.c),borderColor:'#ffffff',borderWidth:2,hoverOffset:6}]},
    options:{responsive:true,maintainAspectRatio:false,cutout:'62%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>` €${c.parsed.toLocaleString('nl-NL',{maximumFractionDigits:0})} (${((c.parsed/total)*100).toFixed(1)}%)`}}}},
  });
}

function renderSparklines() {
  document.getElementById('sparklines').innerHTML = S.holdings.map(h => {
    const p = S.prices[h.id];
    return `<div class="spark-card" onclick="openChart('${h.id}')">
      <div class="spark-top">
        <div style="display:flex;align-items:center;gap:5px">
          <div style="width:8px;height:8px;border-radius:50%;background:${h.c}"></div>
          <span class="spark-nm">${h.n}</span>
        </div>
        <span class="spark-pct ${cc(p?.chgPct)}">${p?.chgPct!=null?pct(p.chgPct):'—'}</span>
      </div>
      <div class="spark-val">${eur(getVal(h))} · ${h.t}</div>
    </div>`;
  }).join('');
}

// ─── STOCK CHART MODAL ────────────────────────────────────────────
async function openChart(holdingId) {
  const h = S.holdings.find(x=>x.id===holdingId);
  if (!h) return;
  S.modalHoldingId = holdingId;
  S.modalRange = 30;
  document.getElementById('chart-modal-title').textContent = h.n;
  document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b.dataset.range==='30'));
  openModal('modal-chart');
  await loadChart(h, 30);
}

async function loadChart(h, days) {
  const statsEl = document.getElementById('chart-stats');
  const canvas  = document.getElementById('stock-chart-canvas');
  statsEl.innerHTML = '<span class="muted">Loading…</span>';
  if (S.chartModal) { S.chartModal.destroy(); S.chartModal = null; }

  try {
    let labels = [], values = [];

    if (h.cg) {
      const data = await fetch(`${API.CG}/coins/${h.cg}/market_chart?vs_currency=eur&days=${days}&interval=${days<=7?'hourly':'daily'}`).then(r=>r.json());
      (data.prices||[]).forEach(([ts,price]) => { labels.push(new Date(ts)); values.push(price); });
    } else if (h.fh) {
      const to = Math.floor(Date.now()/1000), from = to-days*86400;
      const res = days<=7?'60':'D';
      const data = await fh(`/stock/candle?symbol=${h.fh}&resolution=${res}&from=${from}&to=${to}`);
      if (data?.s==='ok') {
        data.t.forEach((ts,i) => { if(data.c[i]) { labels.push(new Date(ts*1000)); values.push(h.cur==='USD'?data.c[i]*S.eurPerUsd:data.c[i]); } });
      }
    } else {
      statsEl.innerHTML = `<span class="muted">No live price data for ${h.n} — this is a European ETF not covered by Finnhub. Last known value: ${eur(h.v0)}</span>`;
      return;
    }

    if (!values.length) { statsEl.innerHTML = '<span class="muted">No chart data returned for this period.</span>'; return; }

    const first=values[0], last=values[values.length-1];
    const chg=last-first, chgPct=(chg/first)*100;
    const hi=Math.max(...values), lo=Math.min(...values);
    const up=chg>=0;

    statsEl.innerHTML = `
      <div class="cstat"><div class="cstat-lbl">Price</div><div class="cstat-val">€${last.toFixed(2)}</div></div>
      <div class="cstat"><div class="cstat-lbl">Change</div><div class="cstat-val ${up?'green':'red'}">${sign(chg)} (${pct(chgPct)})</div></div>
      <div class="cstat"><div class="cstat-lbl">High</div><div class="cstat-val">€${hi.toFixed(2)}</div></div>
      <div class="cstat"><div class="cstat-lbl">Low</div><div class="cstat-val">€${lo.toFixed(2)}</div></div>`;

    S.chartModal = new Chart(canvas.getContext('2d'), {
      type:'line',
      data:{labels,datasets:[{data:values,borderColor:up?'#16a34a':'#dc2626',backgroundColor:up?'rgba(22,163,74,.07)':'rgba(220,38,38,.07)',borderWidth:2,fill:true,tension:0.2,pointRadius:0,pointHoverRadius:5}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' €'+c.parsed.y.toFixed(2)}}},scales:{x:{type:'time',time:{tooltipFormat:'dd MMM HH:mm'},ticks:{color:'#94a3b8',maxTicksLimit:8},grid:{color:'rgba(0,0,0,.05)'}},y:{ticks:{color:'#94a3b8',callback:v=>'€'+v.toFixed(2)},grid:{color:'rgba(0,0,0,.05)'}}}},
    });
  } catch(e) {
    statsEl.innerHTML = `<span class="red">Chart error: ${e.message}</span>`;
  }
}

// ─── NEWS ────────────────────────────────────────────────────────
// Fetches from Finnhub company-news — works best for US-listed stocks.
// ASML (NASDAQ), CVX, APLD, IREN have full coverage. OTC stocks may have limited news.
async function fetchNews() {
  const btn = document.getElementById('btn-fetch-news');
  btn.disabled = true; btn.textContent = '⏳ Loading…';
  document.getElementById('news-body').innerHTML = '<div class="empty">Fetching news from Finnhub (last 30 days)…</div>';

  const from = daysAgo(30), to = today();
  const results = [];
  const eligible = S.holdings.filter(h => h.fh && h.ty !== 'crypto' && !h.dl);

  for (const h of eligible) {
    try {
      const url = `${API.FH}/company-news?symbol=${h.fh}&from=${from}&to=${to}&token=${S.settings.fhKey}`;
      const resp = await fetch(url);
      if (!resp.ok) { console.warn(`News HTTP ${resp.status} for ${h.fh}`); await sleep(200); continue; }
      const news = await resp.json();
      if (Array.isArray(news) && news.length > 0) {
        news.slice(0,3).forEach(n => {
          if (!n.headline) return;
          results.push({
            hid:h.id, ticker:h.t, name:h.n, color:h.c,
            headline:n.headline, summary:n.summary||'',
            url:n.url||'', source:n.source||'', dt:n.datetime,
          });
        });
      } else {
        console.log(`No news for ${h.fh} (${Array.isArray(news)?'empty array':typeof news})`);
      }
    } catch(e) { console.warn(`News error for ${h.fh}:`, e.message); }
    await sleep(200);
  }

  S.news = results;
  store.set(SK.N, results);
  renderNews();

  if (results.length === 0) {
    document.getElementById('news-meta').textContent = 'No articles found. Note: news works best for US-listed stocks (ASML, CVX, APLD, IREN).';
  } else {
    document.getElementById('news-meta').textContent = `${results.length} articles · last 30 days`;
  }
  btn.disabled = false; btn.textContent = '📰 Load latest news';
}

function renderNews() {
  const body = document.getElementById('news-body');
  if (!S.news.length) {
    body.innerHTML = `<div class="empty">No news loaded yet — or Finnhub returned no articles.<br><br>
      <strong>Tips:</strong><br>
      • News works best for ASML, CVX, APLD, IREN (US-listed)<br>
      • European OTC tickers (SMNEY, RNMBF) may have limited coverage<br>
      • Make sure your Finnhub key is correct in ⚙ Settings</div>`;
    return;
  }
  const byH = {};
  S.news.forEach(n => { if (!byH[n.hid]) byH[n.hid]=[]; byH[n.hid].push(n); });
  let html = '<div class="news-grid">';
  S.holdings.forEach(h => {
    const items = byH[h.id];
    if (!items?.length) return;
    html += `<div class="news-card">
      <div class="news-card-hdr" style="background:${h.c}12">
        <div class="news-cdot" style="background:${h.c}"></div>
        <span>${h.n}</span>
        <span class="muted" style="font-size:11px;margin-left:4px">${h.t}</span>
      </div>`;
    items.forEach(n => {
      const ts = n.dt ? new Date(n.dt*1000).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}) : '';
      html += `<div class="news-item">
        <div class="news-hl">${n.headline}</div>
        ${n.summary?`<div class="news-sum">${n.summary.slice(0,200)}…</div>`:''}
        <div class="news-src">${n.source} · ${ts}${n.url?` · <a class="news-url" href="${n.url}" target="_blank" rel="noopener">Read →</a>`:''}</div>
      </div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  body.innerHTML = html;
}

// ─── EARNINGS ────────────────────────────────────────────────────
async function fetchEarnings() {
  const btn = document.getElementById('btn-fetch-earnings');
  btn.disabled = true; btn.textContent = '⏳ Loading…';
  document.getElementById('earnings-body').innerHTML = '<div class="empty">Fetching earnings calendar from Finnhub (next 180 days)…</div>';

  const from = today(), to = daysFwd(180);
  const data = await fh(`/calendar/earnings?from=${from}&to=${to}`);

  if (!data) {
    document.getElementById('earnings-body').innerHTML = '<div class="empty">Could not load earnings calendar. Check your Finnhub key in ⚙ Settings.</div>';
    btn.disabled = false; btn.textContent = '📅 Load earnings calendar';
    return;
  }

  const fhSymbols = new Set(S.holdings.filter(h=>h.fh).map(h=>h.fh));
  const cal = (data?.earningsCalendar || []).filter(e => fhSymbols.has(e.symbol));

  // Also try fetching per-symbol for better coverage
  if (cal.length === 0) {
    const usSymbols = ['ASML','CVX','APLD','IREN'];
    for (const sym of usSymbols) {
      const d = await fh(`/calendar/earnings?from=${from}&to=${to}&symbol=${sym}`);
      if (d?.earningsCalendar?.length) cal.push(...d.earningsCalendar);
      await sleep(150);
    }
  }

  S.earnings = cal;
  store.set(SK.E, cal);
  renderEarnings();
  document.getElementById('earnings-meta').textContent = `${cal.length} upcoming events`;
  btn.disabled = false; btn.textContent = '📅 Load earnings calendar';
}

function renderEarnings() {
  const body = document.getElementById('earnings-body');
  if (!S.earnings.length) {
    body.innerHTML = `<div class="empty">No upcoming earnings found for your holdings in the next 180 days.<br><br>
      Earnings data is available for US-listed stocks: ASML (NASDAQ), CVX, APLD, IREN.</div>`;
    return;
  }
  const sorted = [...S.earnings].sort((a,b)=>new Date(a.date)-new Date(b.date));
  body.innerHTML = '<div class="earnings-list">' + sorted.map(e => {
    const h = S.holdings.find(x=>x.fh===e.symbol);
    const days = Math.ceil((new Date(e.date)-new Date())/86400000);
    const hr = e.hour==='bmo'?'Before market open':e.hour==='amc'?'After market close':'';
    const eps = e.epsEstimate!=null?`EPS est: $${Number(e.epsEstimate).toFixed(2)}`:'';
    return `<div class="earn-row">
      <div>
        <div class="earn-date">${new Date(e.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</div>
        <div class="earn-days">in ${days}d</div>
      </div>
      <div>
        <div class="earn-co">
          ${h?`<div style="width:8px;height:8px;border-radius:50%;background:${h.c}"></div>`:'' }
          <span>${h?.n||e.symbol}</span>
          <span class="earn-tag earn-e">earnings</span>
        </div>
        <div class="earn-desc">${[hr,eps].filter(Boolean).join(' · ')||'Q earnings release'}</div>
      </div>
      <div>${days<=14?'<span class="earn-soon">Soon</span>':''}</div>
    </div>`;
  }).join('') + '</div>';
}

// ─── WATCHLIST ────────────────────────────────────────────────────
function renderWatchlist() {
  const body = document.getElementById('watchlist-body');
  if (!S.watchlist.length) {
    body.innerHTML = '<div class="empty">Add Finnhub tickers above.<br>Examples: NVDA · MBG.DE · SMNEY · AAPL</div>';
    return;
  }
  body.innerHTML = '<div class="wl-grid">' + S.watchlist.map(t => {
    const p = S.wlPrices[t];
    return `<div class="wl-card">
      <button class="btn-rm wl-rm" onclick="removeWL('${t}')">×</button>
      <div class="wl-ticker">${t}</div>
      <div class="wl-price ${p?'':'muted'}">${p?'€'+p.price.toFixed(2):'…'}</div>
      <div class="wl-chg ${cc(p?.chgPct)}">${p?pct(p.chgPct):''}</div>
    </div>`;
  }).join('') + '</div>';
}
function addWL() {
  const t = document.getElementById('watchlist-input').value.trim().toUpperCase();
  if (!t || S.watchlist.includes(t)) return;
  S.watchlist.push(t); store.set(SK.W, S.watchlist);
  document.getElementById('watchlist-input').value = '';
  fetchAllPrices();
}
function removeWL(t) {
  S.watchlist = S.watchlist.filter(x=>x!==t); store.set(SK.W, S.watchlist);
  renderWatchlist();
}

// ─── ADD / REMOVE HOLDINGS ───────────────────────────────────────
function addHolding() {
  const n  = document.getElementById('add-name').value.trim();
  const t  = document.getElementById('add-ticker').value.trim().toUpperCase();
  if (!n || !t) return;
  const fhSym = document.getElementById('add-fhsym').value.trim() || null;
  const cgId  = document.getElementById('add-cgid').value.trim() || null;
  const pl    = document.getElementById('add-platform').value;
  const ty    = document.getElementById('add-type').value;
  const sh    = parseFloat(document.getElementById('add-shares').value) || null;
  const ac    = parseFloat(document.getElementById('add-avgcost').value) || null;
  const c     = document.getElementById('add-color').value;
  const cur   = ty==='crypto'?'EUR':(fhSym&&!fhSym.includes('.'))?'USD':'EUR';
  S.holdings.push({id:'u'+Date.now(), n, f:n, t, fh:ty!=='crypto'?fhSym:null, cg:ty==='crypto'?cgId:null, cur, pl, ty, sh, ac, v0:0, c});
  store.set(SK.H, S.holdings);
  closeModal('modal-add');
  fetchAllPrices();
}
function removeHolding(id) {
  if (!confirm('Remove this position?')) return;
  S.holdings = S.holdings.filter(h=>h.id!==id);
  store.set(SK.H, S.holdings);
  renderAll();
}

// ─── MODAL HELPERS ───────────────────────────────────────────────
function openModal(id)  { document.getElementById(id).classList.remove('hidden'); document.getElementById('overlay').classList.remove('hidden'); }
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  if (!document.querySelectorAll('.modal:not(.hidden)').length) document.getElementById('overlay').classList.add('hidden');
}

// ─── RENDER ALL ──────────────────────────────────────────────────
function renderAll() {
  renderHeader();
  renderPlatformStrip();
  renderOverview();
  renderSparklines();
  renderWatchlist();
  if (S.tab==='charts') { renderPortfolioChart(); renderAllocChart(); }
  if (S.news.length) renderNews();
  if (S.earnings.length) renderEarnings();
}

// ─── ALERTS MODAL ────────────────────────────────────────────────
function renderAlertsModal() {
  document.getElementById('per-holding-alerts').innerHTML =
    S.holdings.filter(h=>h.fh||h.cg).map(h =>
      `<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:7px;flex:1">
          <div style="width:8px;height:8px;border-radius:50%;background:${h.c}"></div>
          <span style="font-size:13px;font-weight:500">${h.n}</span>
        </div>
        <input type="number" placeholder="${S.alerts.global||5}" min=".5" max="50" step=".5"
          value="${S.alerts[h.id]||''}"
          style="width:58px;padding:5px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px"
          onchange="S.alerts['${h.id}']=parseFloat(this.value)||null;store.set(SK.A,S.alerts)">
        <span style="font-size:11px;color:var(--text3)">%</span>
      </div>`
    ).join('');
}

// ─── EVENTS ──────────────────────────────────────────────────────
function bindEvents() {
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab,.panel').forEach(el=>el.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-'+btn.dataset.tab).classList.add('active');
    S.tab = btn.dataset.tab;
    if (S.tab==='charts') { renderPortfolioChart(); renderAllocChart(); renderSparklines(); }
  }));

  document.getElementById('btn-refresh').addEventListener('click', () => { S.countdown = S.settings.refreshSec; fetchAllPrices(); });
  document.getElementById('btn-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('btn-alerts').addEventListener('click', () => { renderAlertsModal(); openModal('modal-alerts'); if(Notification.permission==='default') Notification.requestPermission(); });
  document.getElementById('btn-add').addEventListener('click', () => openModal('modal-add'));

  document.getElementById('btn-save-fhkey').addEventListener('click', () => {
    S.settings.fhKey = document.getElementById('inp-fhkey').value.trim();
    store.set(SK.S, S.settings);
    closeModal('modal-settings');
    fetchAllPrices();
  });
  document.getElementById('inp-refresh').addEventListener('change', e => {
    S.settings.refreshSec = parseInt(e.target.value);
    store.set(SK.S, S.settings);
    startRefresh();
  });
  document.getElementById('inp-alert-global').addEventListener('change', e => {
    S.alerts.global = parseFloat(e.target.value)||5;
    store.set(SK.A, S.alerts);
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset ALL portfolio data and settings?')) {
      Object.values(SK).forEach(k=>localStorage.removeItem(k));
      location.reload();
    }
  });

  document.querySelectorAll('.range-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    S.modalRange = parseInt(btn.dataset.range);
    const h = S.holdings.find(x=>x.id===S.modalHoldingId);
    if (h) loadChart(h, S.modalRange);
  }));

  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', ()=>closeModal(btn.dataset.close)));
  document.getElementById('overlay').addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
    document.getElementById('overlay').classList.add('hidden');
  });

  document.getElementById('btn-fetch-news').addEventListener('click', fetchNews);
  document.getElementById('btn-fetch-earnings').addEventListener('click', fetchEarnings);
  document.getElementById('btn-watchlist-add').addEventListener('click', addWL);
  document.getElementById('watchlist-input').addEventListener('keydown', e=>{if(e.key==='Enter')addWL();});
  document.getElementById('btn-confirm-add').addEventListener('click', addHolding);

  // Setup screen
  document.getElementById('setup-save-btn').addEventListener('click', () => {
    const key = document.getElementById('setup-key-input').value.trim();
    if (!key || key.length < 8) { alert('Please enter your Finnhub API key.'); return; }
    S.settings.fhKey = key;
    store.set(SK.S, S.settings);
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    fetchAllPrices();
    startRefresh();
  });
}

// ─── INIT ────────────────────────────────────────────────────────
function init() {
  S.holdings  = store.get(SK.H) || DEFAULTS.map(h=>({...h}));
  S.vhist     = store.get(SK.V) || [];
  S.alerts    = store.get(SK.A) || {global:5};
  S.watchlist = store.get(SK.W) || ['NVDA','MBG.DE'];
  S.news      = store.get(SK.N) || [];
  S.earnings  = store.get(SK.E) || [];
  const saved = store.get(SK.S);
  if (saved) Object.assign(S.settings, saved);

  document.getElementById('inp-refresh').value = S.settings.refreshSec;
  document.getElementById('inp-alert-global').value = S.alerts.global || 5;
  if (S.settings.fhKey) document.getElementById('inp-fhkey').value = S.settings.fhKey;

  bindEvents();

  if (!S.settings.fhKey) {
    document.getElementById('setup-screen').classList.remove('hidden');
  } else {
    document.getElementById('main-app').classList.remove('hidden');
    renderAll();
    fetchAllPrices();
    startRefresh();
  }
}

document.addEventListener('DOMContentLoaded', init);
