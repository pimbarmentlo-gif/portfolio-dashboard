'use strict';
// ================================================================
//  PORTFOLIO DASHBOARD v2 — app.js
//  Prices:   Finnhub (stocks/ETFs) + CoinGecko (crypto)
//  News:     Finnhub company-news endpoint
//  Earnings: Finnhub earnings calendar endpoint
// ================================================================

const API = {
  FH:  'https://finnhub.io/api/v1',
  CG:  'https://api.coingecko.com/api/v3',
};

const SK = {
  H: 'pfh-v4', V: 'pfv-v4', A: 'pfa-v4',
  S: 'pfs-v4', W: 'pfw-v4', N: 'pfn-v4', E: 'pfe-v4',
};

// ─── DEFAULT HOLDINGS ────────────────────────────────────────────
// fh = Finnhub symbol | cg = CoinGecko id
// cur = USD means price needs EUR conversion, EUR means already EUR
// sh = shares | ac = avg cost EUR | v0 = last known EUR value
const DEFAULTS = [
  // ── DEGIRO ──
  {id:'d2',n:'Applied Digital',  f:'Applied Digital Corp',         t:'APLD', fh:'APLD',   cg:null,               cur:'USD',pl:'DEGIRO',      ty:'stock',sh:3,          ac:null,   v0:122.70, c:'#1D9E75'},
  {id:'d3',n:'ASML',             f:'ASML Holding NV',              t:'ASML', fh:'ASML',   cg:null,               cur:'USD',pl:'DEGIRO',      ty:'stock',sh:1,          ac:null,   v0:1402.40,c:'#185FA5'},
  {id:'d4',n:'Chevron',          f:'Chevron Corp',                 t:'CVX',  fh:'CVX',    cg:null,               cur:'USD',pl:'DEGIRO',      ty:'stock',sh:1,          ac:null,   v0:162.62, c:'#0F7A5A'},
  {id:'d5',n:'IREN',             f:'IREN Ltd',                     t:'IREN', fh:'IREN',   cg:null,               cur:'USD',pl:'DEGIRO',      ty:'stock',sh:2,          ac:null,   v0:100.80, c:'#7B5EA7'},
  {id:'d6',n:'Just Eat',         f:'Just Eat Takeaway.com NV',     t:'JET',  fh:null,     cg:null,               cur:'EUR',pl:'DEGIRO',      ty:'stock',sh:21,         ac:null,   v0:424.62, c:'#E24B4A',dl:true},
  {id:'d7',n:'YIT Oyj',          f:'YIT Oyj (Finnish construction)',t:'YIT',  fh:'TYTYF',  cg:null,               cur:'USD',pl:'DEGIRO',      ty:'stock',sh:30,         ac:null,   v0:79.20,  c:'#888780'},
  {id:'d8',n:'iShares AEX',      f:'iShares AEX UCITS ETF',        t:'IAEX', fh:null,     cg:null,               cur:'EUR',pl:'DEGIRO',      ty:'etf',  sh:1,          ac:null,   v0:105.78, c:'#5F5E5A'},
  {id:'d9',n:'VanEck Defense',   f:'VanEck Defense UCITS ETF',     t:'DFNS', fh:null,     cg:null,               cur:'EUR',pl:'DEGIRO',      ty:'etf',  sh:3,          ac:null,   v0:165.51, c:'#993C1D'},
  // ── TRADING 212 ──
  {id:'t0',n:'Vanguard All-World',f:'Vanguard FTSE All-World ETF', t:'VWCE', fh:null,     cg:null,               cur:'EUR',pl:'Trading 212',ty:'etf',  sh:4.7,        ac:162.36, v0:762.86, c:'#CC0000'},
  {id:'t1',n:'Siemens Energy',   f:'Siemens Energy AG',            t:'ENR',  fh:'SMNEY',  cg:null,               cur:'USD',pl:'Trading 212',ty:'stock',sh:1.87619411, ac:131.15, v0:335.46, c:'#0F7A5A'},
  {id:'t2',n:'iShares AEX',      f:'iShares AEX (Dist)',           t:'IAEX', fh:null,     cg:null,               cur:'EUR',pl:'Trading 212',ty:'etf',  sh:2.05238435, ac:97.93,  v0:217.29, c:'#5F5E5A'},
  {id:'t3',n:'Rheinmetall',      f:'Rheinmetall AG',               t:'RHM',  fh:'RNMBF',  cg:null,               cur:'USD',pl:'Trading 212',ty:'stock',sh:0.07150307, ac:1399.80,v0:88.39,  c:'#993C1D'},
  {id:'t4',n:'IREN',             f:'IREN Ltd',                     t:'IREN', fh:'IREN',   cg:null,               cur:'USD',pl:'Trading 212',ty:'stock',sh:0.09502748, ac:47.35,  v0:4.80,   c:'#7B5EA7'},
  // ── CRYPTO (CoinGecko) ──
  {id:'c1', n:'Ethereum',         f:'Ethereum',         t:'ETH',  fh:null, cg:'ethereum',           cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:151.80,c:'#627EEA'},
  {id:'c2', n:'Bitcoin',          f:'Bitcoin',          t:'BTC',  fh:null, cg:'bitcoin',            cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:91.95, c:'#F7931A'},
  {id:'c3', n:'XRP',              f:'XRP',              t:'XRP',  fh:null, cg:'ripple',             cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:36.88, c:'#346AA9'},
  {id:'c4', n:'VeChain',          f:'VeChain Thor',     t:'VET',  fh:null, cg:'vechain',            cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:30.44, c:'#15BDFF'},
  {id:'c5', n:'Internet Computer',f:'Internet Computer',t:'ICP',  fh:null, cg:'internet-computer',  cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:16.28, c:'#29ABE2'},
  {id:'c6', n:'Cardano',          f:'Cardano',          t:'ADA',  fh:null, cg:'cardano',            cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:6.73,  c:'#3CC8C8'},
  {id:'c7', n:'Solana',           f:'Solana',           t:'SOL',  fh:null, cg:'solana',             cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:5.03,  c:'#9945FF'},
  {id:'c8', n:'Polkadot',         f:'Polkadot',         t:'DOT',  fh:null, cg:'polkadot',           cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:4.68,  c:'#E6007A'},
  {id:'c9', n:'Verge',            f:'Verge',            t:'XVG',  fh:null, cg:'verge',              cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:4.13,  c:'#33AADE'},
  {id:'c10',n:'Dogecoin',         f:'Dogecoin',         t:'DOGE', fh:null, cg:'dogecoin',           cur:'EUR',pl:'Crypto',ty:'crypto',sh:null,ac:null,v0:4.16,  c:'#C2A633'},
];

// ─── STATE ──────────────────────────────────────────────────────
let S = {
  holdings: [],
  prices:   {},    // {holdingId: {eur, native, chgPct, chgAbs, hi, lo, live}}
  eurPerUsd: 0.92,
  vhist:    [],    // [{t, v}]
  alerts:   {global:5},
  settings: {fhKey:'', refreshSec:120},
  watchlist:['NVDA','MBG.DE'],
  wlPrices: {},
  news:     [],
  earnings: [],
  tab:      'overview',
  countdown:120,
  refreshTimer: null,
  cdownTimer:   null,
  chartModal:   null,  // active Chart.js instance in modal
  chartPortfolio: null,
  chartAlloc:     null,
  modalTicker:  null,
  modalRange:   30,
};

// ─── STORAGE ────────────────────────────────────────────────────
const store = {
  get: k => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ─── HELPERS ────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));
const eur   = (v, d=2) => v == null ? '—' : '€' + Math.abs(v).toLocaleString('nl-NL', {minimumFractionDigits:d, maximumFractionDigits:d});
const pct   = v => v == null ? '—' : (v >= 0 ? '+' : '') + v.toFixed(2) + '%';
const sign  = v => v == null ? '—' : (v >= 0 ? '+' : '') + eur(v);
const cc    = v => v == null ? '' : v >= 0 ? 'green' : 'red';
const today     = () => new Date().toISOString().split('T')[0];
const daysAgo   = n => new Date(Date.now() - n*86400000).toISOString().split('T')[0];
const daysAhead = n => new Date(Date.now() + n*86400000).toISOString().split('T')[0];

function getVal(h) {
  const p = S.prices[h.id];
  if (p && p.live && h.sh) return p.eur * h.sh;
  return h.v0 || 0;
}
function getPnL(h) {
  if (!h.sh || !h.ac) return null;
  const val = getVal(h);
  const cost = h.ac * h.sh;
  return { eur: val - cost, pct: ((val - cost) / cost) * 100 };
}
function getTotals() {
  const tv = S.holdings.reduce((s, h) => s + getVal(h), 0);
  const withAC = S.holdings.filter(h => h.sh && h.ac);
  const tCost = withAC.reduce((s, h) => s + h.ac * h.sh, 0);
  const tPnL  = withAC.length ? withAC.reduce((s, h) => s + (getPnL(h)?.eur || 0), 0) : null;
  let dayEur = 0, hasDay = false;
  S.holdings.forEach(h => {
    const p = S.prices[h.id];
    if (!p || !h.sh || p.chgAbs == null) return;
    dayEur += (h.cur === 'USD' ? p.chgAbs * S.eurPerUsd : p.chgAbs) * h.sh;
    hasDay = true;
  });
  return { tv, tPnL, tCost, dayEur: hasDay ? dayEur : null };
}

// ─── FINNHUB API ─────────────────────────────────────────────────
async function fh(path) {
  const key = S.settings.fhKey;
  if (!key) return null;
  const sep = path.includes('?') ? '&' : '?';
  try {
    const r = await fetch(`${API.FH}${path}${sep}token=${key}`);
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ─── FETCH ALL PRICES ────────────────────────────────────────────
async function fetchAllPrices() {
  setDot('stale');
  document.getElementById('btn-refresh').classList.add('spinning');
  const prev = JSON.parse(JSON.stringify(S.prices));

  try {
    // 1. EUR/USD rate
    const fx = await fh('/forex/rates?base=USD');
    if (fx?.quote?.EUR) S.eurPerUsd = fx.quote.EUR;

    // 2. Stock prices from Finnhub (sequential with delay)
    const stockHoldings = S.holdings.filter(h => h.fh && !h.dl);
    for (const h of stockHoldings) {
      const q = await fh(`/quote?symbol=${h.fh}`);
      if (q && q.c && q.c !== 0) {
        const eurPrice = h.cur === 'USD' ? q.c * S.eurPerUsd : q.c;
        S.prices[h.id] = {
          eur: eurPrice, native: q.c,
          chgPct: q.dp, chgAbs: q.d,
          hi: h.cur === 'USD' ? q.h * S.eurPerUsd : q.h,
          lo: h.cur === 'USD' ? q.l * S.eurPerUsd : q.l,
          pc: h.cur === 'USD' ? q.pc * S.eurPerUsd : q.pc,
          live: true, ts: Date.now(),
        };
      } else if (!S.prices[h.id]) {
        // No data — fall back to last known value
        S.prices[h.id] = { eur: h.v0 / (h.sh || 1), native: null, chgPct: null, chgAbs: null, live: false };
      }
      await sleep(80);
    }

    // 3. Watchlist prices
    for (const ticker of S.watchlist) {
      const q = await fh(`/quote?symbol=${ticker}`);
      if (q && q.c && q.c !== 0) {
        S.wlPrices[ticker] = { price: q.c, chgPct: q.dp, live: true };
      }
      await sleep(80);
    }

    // 4. Crypto via CoinGecko
    const cgIds = [...new Set(S.holdings.filter(h => h.cg).map(h => h.cg))];
    if (cgIds.length) {
      const cgUrl = `${API.CG}/simple/price?ids=${cgIds.join(',')}&vs_currencies=eur&include_24hr_change=true`;
      const cg = await fetch(cgUrl).then(r => r.json()).catch(() => ({}));
      S.holdings.filter(h => h.cg).forEach(h => {
        if (cg[h.cg]) {
          S.prices[h.id] = {
            eur: cg[h.cg].eur, native: cg[h.cg].eur,
            chgPct: cg[h.cg].eur_24h_change, chgAbs: null,
            live: true, ts: Date.now(),
          };
        }
      });
    }

    // 5. Alerts check
    checkAlerts(prev);

    // 6. Snapshot value
    const { tv } = getTotals();
    snapshotVal(tv);

    setDot('live');
    const now = new Date();
    document.getElementById('hdr-time').textContent =
      'Updated ' + now.toLocaleTimeString('nl-NL', {hour:'2-digit', minute:'2-digit', second:'2-digit'});

  } catch (e) {
    console.error('Fetch error:', e);
    setDot('error');
  }

  document.getElementById('btn-refresh').classList.remove('spinning');
  renderAll();
}

function setDot(state_) {
  const d = document.getElementById('live-dot');
  d.className = 'live-dot' + (state_ === 'stale' ? ' stale' : state_ === 'error' ? ' error' : '');
}

// ─── AUTO REFRESH ────────────────────────────────────────────────
function startRefresh() {
  if (S.refreshTimer)  clearInterval(S.refreshTimer);
  if (S.cdownTimer)    clearInterval(S.cdownTimer);
  const sec = S.settings.refreshSec;
  S.countdown = sec;
  S.refreshTimer = setInterval(() => { S.countdown = sec; fetchAllPrices(); }, sec * 1000);
  S.cdownTimer   = setInterval(() => { S.countdown = Math.max(0, S.countdown - 1); updateBar(); }, 1000);
}

function updateBar() {
  const sec = S.settings.refreshSec;
  const pct = ((sec - S.countdown) / sec) * 100;
  document.getElementById('refresh-progress').style.width = pct + '%';
  const m = Math.floor(S.countdown / 60), s = S.countdown % 60;
  document.getElementById('refresh-label').textContent =
    S.countdown > 0
      ? `Next refresh in ${m > 0 ? m + ':' + String(s).padStart(2,'0') : s + 's'}`
      : 'Refreshing…';
}

// ─── VALUE HISTORY ───────────────────────────────────────────────
function snapshotVal(tv) {
  if (!tv || tv < 50) return;
  const now = Date.now();
  const last = S.vhist[S.vhist.length - 1];
  if (last && now - last.t < 4 * 60000) return;
  S.vhist.push({ t: now, v: Math.round(tv * 100) / 100 });
  const cutoff = now - 90 * 86400000;
  S.vhist = S.vhist.filter(x => x.t > cutoff);
  store.set(SK.V, S.vhist);
}

// ─── ALERTS ──────────────────────────────────────────────────────
function checkAlerts(prev) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  S.holdings.forEach(h => {
    const cur = S.prices[h.id], old = prev[h.id];
    if (!cur?.live || !old?.live || !cur.eur || !old.eur) return;
    const chg = ((cur.eur - old.eur) / old.eur) * 100;
    const thr = S.alerts[h.id] || S.alerts.global || 5;
    if (Math.abs(chg) >= thr) {
      new Notification(`${h.n} ${chg >= 0 ? '▲' : '▼'} ${Math.abs(chg).toFixed(1)}%`, {
        body: `Now €${cur.eur.toFixed(2)} (was €${old.eur.toFixed(2)})`,
      });
    }
  });
}

// ─── RENDER: HEADER ──────────────────────────────────────────────
function renderHeader() {
  const { tv, tPnL, tCost, dayEur } = getTotals();
  document.getElementById('hdr-total').textContent = eur(tv);
  document.getElementById('hdr-total').className = 'total-val';

  const dayEl = document.getElementById('hdr-day');
  dayEl.textContent = dayEur != null ? sign(dayEur) : '—';
  dayEl.className = 'total-val ' + cc(dayEur);

  const pnlEl = document.getElementById('hdr-pnl');
  if (tPnL != null) {
    pnlEl.textContent = sign(tPnL) + (tCost > 0 ? ' (' + pct(tPnL/tCost*100) + ')' : '');
    pnlEl.className = 'total-val ' + cc(tPnL);
  } else {
    pnlEl.textContent = '—'; pnlEl.className = 'total-val muted';
  }

  // Market status
  const now = new Date();
  const cet = new Date(now.toLocaleString('en-US', {timeZone:'Europe/Amsterdam'}));
  const h = cet.getHours(), dow = cet.getDay();
  const open = dow >= 1 && dow <= 5 && h >= 9 && (h < 17 || (h === 17 && cet.getMinutes() < 30));
  const pill = document.getElementById('market-pill');
  pill.textContent = open ? 'Market Open' : 'Market Closed';
  pill.className = 'market-pill ' + (open ? 'open' : 'closed');
}

// ─── RENDER: PLATFORM CARDS ──────────────────────────────────────
function renderPlatformStrip() {
  const plats = ['DEGIRO','Trading 212','Crypto'];
  const cols  = {DEGIRO:'#0055ff','Trading 212':'#00b050',Crypto:'#F7931A'};
  document.getElementById('platform-strip').innerHTML = plats.map(pl => {
    const ph  = S.holdings.filter(h => h.pl === pl);
    const val = ph.reduce((s,h) => s + getVal(h), 0);
    const pnl = ph.filter(h=>h.sh&&h.ac).reduce((s,h)=>s+(getPnL(h)?.eur||0), 0);
    const hasPnL = ph.some(h=>h.sh&&h.ac);
    return `<div class="plat-card">
      <div class="plat-top"><span class="plat-dot2" style="background:${cols[pl]}"></span><span class="plat-nm">${pl}</span></div>
      <div class="plat-val">${eur(val)}</div>
      <div class="plat-pnl ${hasPnL?cc(pnl):'muted'}">${hasPnL?sign(pnl):'Add avg cost for P&L'}</div>
      <div class="plat-cnt">${ph.length} positions</div>
    </div>`;
  }).join('');
}

// ─── RENDER: OVERVIEW ────────────────────────────────────────────
function renderOverview() {
  const panel = document.getElementById('panel-overview');
  const tv = S.holdings.reduce((s,h) => s+getVal(h), 0);
  let html = '';

  // Allocation bar
  html += '<div class="alloc-bar">';
  S.holdings.forEach(h => {
    const p = Math.max(0.3, (getVal(h)/tv)*100);
    html += `<div style="flex:${p};background:${h.c}" title="${h.n}: ${((getVal(h)/tv)*100).toFixed(1)}%"></div>`;
  });
  html += '</div>';

  // Alert banners
  html += `<div class="alert-strip alert-warn">⚠ <strong>Just Eat Takeaway</strong> (21 shares · €424.62) — Delisted after Prosus acquisition Oct 2025. Contact DEGIRO to settle the cash owed to you.</div>`;
  html += `<div class="alert-strip alert-info">ℹ European ETFs (iShares AEX, VanEck Defense, VWCE) show last known values — Finnhub doesn't cover these. Update via the edit button if needed.</div>`;

  // Per platform
  const plColors = {DEGIRO:'#0055ff','Trading 212':'#00b050',Crypto:'#F7931A'};
  ['DEGIRO','Trading 212','Crypto'].forEach(pl => {
    const ph = S.holdings.filter(h => h.pl === pl);
    if (!ph.length) return;
    const plVal = ph.reduce((s,h) => s+getVal(h), 0);
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
      const portPct = ((val/tv)*100).toFixed(1);
      const priceDisp = p?.eur != null
        ? `€${p.eur.toFixed(2)}${h.cur==='USD'&&p.native?' <span class="price-usd">$'+p.native.toFixed(2)+'</span>':''}`
        : `<span class="muted">€${(h.v0/(h.sh||1)).toFixed(2)} <span class="tag tag-stale">stale</span></span>`;
      const dayChg = isDeg ? (p?.chgPct!=null?pct(p.chgPct):'—') : null;
      const retDisp = pnl ? pct(pnl.pct) : (isDeg && p?.chgPct!=null ? pct(p.chgPct) : '—');
      const retCol  = pnl ? cc(pnl.pct) : (isDeg ? cc(p?.chgPct) : '');

      html += `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="h-chip" style="background:${h.c}20;color:${h.c}">${h.t.slice(0,3)}</div>
            <div>
              <div class="h-name">${h.n}${h.dl?'<span class="tag tag-del">DELISTED</span>':''}${!live&&!h.dl?'<span class="tag tag-stale">stale</span>':''}</div>
              <div class="h-sub">${h.t} · ${h.ty}</div>
            </div>
          </div>
        </td>
        <td class="r muted" style="font-size:12px">${h.sh!=null?h.sh.toLocaleString('nl-NL',{maximumFractionDigits:8}):'—'}</td>
        <td class="r">${priceDisp}</td>
        <td class="r" style="font-weight:500">${eur(val)}</td>
        <td class="r ${cc(pnl?.eur)}">${pnl?sign(pnl.eur):'<span class="muted" style="font-size:11px">add avg cost</span>'}</td>
        <td class="r ${retCol}">${retDisp}</td>
        <td class="r muted" style="font-size:11px">${portPct}%</td>
        <td><button class="btn-chart" onclick="openChart('${h.id}')" title="Price chart">📈</button></td>
        <td><button class="btn-rm" onclick="removeHolding('${h.id}')" title="Remove">×</button></td>
      </tr>`;
    });
    html += '</tbody></table></div>';
  });

  panel.innerHTML = html;
}

// ─── RENDER: PORTFOLIO CHART ─────────────────────────────────────
function renderPortfolioChart() {
  const canvas = document.getElementById('chart-portfolio');
  if (S.chartPortfolio) { S.chartPortfolio.destroy(); S.chartPortfolio = null; }
  const note = document.getElementById('portfolio-note');

  if (S.vhist.length < 2) {
    note.textContent = `${S.vhist.length} data point(s) so far. Chart fills in automatically as you use the dashboard.`;
    return;
  }

  note.textContent = `${S.vhist.length} snapshots since ${new Date(S.vhist[0].t).toLocaleDateString('nl-NL')}`;
  const labels = S.vhist.map(d => new Date(d.t));
  const values = S.vhist.map(d => d.v);
  const up = values[values.length-1] >= values[0];

  S.chartPortfolio = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets: [{
      data: values,
      borderColor: up ? '#1fc876' : '#f05252',
      backgroundColor: up ? 'rgba(31,200,118,.07)' : 'rgba(240,82,82,.07)',
      borderWidth: 2, fill: true, tension: 0.3,
      pointRadius: S.vhist.length > 40 ? 0 : 3, pointHoverRadius: 5,
    }]},
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{display:false}, tooltip:{callbacks:{label:c=>' €'+c.parsed.y.toLocaleString('nl-NL',{minimumFractionDigits:2,maximumFractionDigits:2})}} },
      scales: {
        x: {type:'time', time:{tooltipFormat:'dd MMM HH:mm'}, ticks:{color:'#475e78',maxTicksLimit:8}, grid:{color:'rgba(255,255,255,.04)'}},
        y: {ticks:{color:'#475e78',callback:v=>'€'+v.toLocaleString('nl-NL')}, grid:{color:'rgba(255,255,255,.04)'}},
      },
    },
  });
}

function renderAllocChart() {
  const canvas = document.getElementById('chart-alloc');
  if (S.chartAlloc) { S.chartAlloc.destroy(); S.chartAlloc = null; }
  const vals = S.holdings.map(h => getVal(h));
  const total = vals.reduce((a,b)=>a+b,0);
  S.chartAlloc = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: { labels: S.holdings.map(h=>h.n), datasets:[{data:vals, backgroundColor:S.holdings.map(h=>h.c), borderColor:'#07111c', borderWidth:2, hoverOffset:6}] },
    options: {
      responsive:true, maintainAspectRatio:false, cutout:'62%',
      plugins: { legend:{display:false}, tooltip:{callbacks:{label:c=>` €${c.parsed.toLocaleString('nl-NL',{maximumFractionDigits:0})} (${((c.parsed/total)*100).toFixed(1)}%)`}} },
    },
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
  const h = S.holdings.find(x => x.id === holdingId);
  if (!h) return;
  S.modalTicker = holdingId;
  S.modalRange  = 30;
  document.getElementById('chart-modal-title').textContent = h.n;
  document.querySelectorAll('.range-btn').forEach(b => b.classList.toggle('active', b.dataset.range === '30'));
  openModal('modal-chart');
  await loadChart(h, 30);
}

async function loadChart(hOrId, days) {
  const h = typeof hOrId === 'string' ? S.holdings.find(x=>x.id===hOrId) : hOrId;
  if (!h) return;
  const statsEl = document.getElementById('chart-stats');
  const canvas  = document.getElementById('stock-chart-canvas');
  statsEl.innerHTML = '<span class="muted">Loading…</span>';
  if (S.chartModal) { S.chartModal.destroy(); S.chartModal = null; }

  try {
    let labels = [], values = [];

    if (h.cg) {
      // CoinGecko for crypto
      const url = `${API.CG}/coins/${h.cg}/market_chart?vs_currency=eur&days=${days}&interval=${days<=7?'hourly':'daily'}`;
      const data = await fetch(url).then(r=>r.json());
      (data.prices||[]).forEach(([ts,price]) => { labels.push(new Date(ts)); values.push(price); });
    } else if (h.fh) {
      // Finnhub candles
      const to   = Math.floor(Date.now()/1000);
      const from = to - days*86400;
      const res  = days <= 7 ? '60' : 'D';
      const data = await fh(`/stock/candle?symbol=${h.fh}&resolution=${res}&from=${from}&to=${to}`);
      if (data?.s === 'ok') {
        data.t.forEach((ts,i) => { if (data.c[i]) { labels.push(new Date(ts*1000)); values.push(h.cur==='USD'?data.c[i]*S.eurPerUsd:data.c[i]); } });
      }
    } else {
      statsEl.innerHTML = `<span class="muted">No live price data available for ${h.n}. (European ETF — not in Finnhub)</span>`;
      return;
    }

    if (!values.length) { statsEl.innerHTML = '<span class="muted">No data returned for this period.</span>'; return; }

    const first = values[0], last = values[values.length-1];
    const chg = last - first, chgPct = (chg/first)*100;
    const hi = Math.max(...values), lo = Math.min(...values);
    const up = chg >= 0;

    statsEl.innerHTML = `
      <div class="cstat"><div class="cstat-lbl">Price</div><div class="cstat-val">€${last.toFixed(2)}</div></div>
      <div class="cstat"><div class="cstat-lbl">Change</div><div class="cstat-val ${up?'green':'red'}">${sign(chg)} (${pct(chgPct)})</div></div>
      <div class="cstat"><div class="cstat-lbl">High</div><div class="cstat-val">€${hi.toFixed(2)}</div></div>
      <div class="cstat"><div class="cstat-lbl">Low</div><div class="cstat-val">€${lo.toFixed(2)}</div></div>
    `;

    S.chartModal = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{
        data: values,
        borderColor: up ? '#1fc876' : '#f05252',
        backgroundColor: up ? 'rgba(31,200,118,.07)' : 'rgba(240,82,82,.07)',
        borderWidth: 2, fill: true, tension: 0.2,
        pointRadius: 0, pointHoverRadius: 5,
      }]},
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>' €'+c.parsed.y.toFixed(2)}}},
        scales:{
          x:{type:'time',time:{tooltipFormat:'dd MMM HH:mm'},ticks:{color:'#475e78',maxTicksLimit:8},grid:{color:'rgba(255,255,255,.04)'}},
          y:{ticks:{color:'#475e78',callback:v=>'€'+v.toFixed(2)},grid:{color:'rgba(255,255,255,.04)'}},
        },
      },
    });
  } catch(e) {
    statsEl.innerHTML = `<span class="red">Chart error: ${e.message}</span>`;
  }
}

// ─── NEWS ────────────────────────────────────────────────────────
async function fetchNews() {
  const btn = document.getElementById('btn-fetch-news');
  btn.disabled = true; btn.textContent = '⏳ Loading…';
  document.getElementById('news-body').innerHTML = '<div class="empty">Fetching news from Finnhub…</div>';

  const from = daysAgo(7), to = today();
  const results = [];

  const eligible = S.holdings.filter(h => h.fh && h.ty !== 'crypto' && !h.dl);
  for (const h of eligible) {
    const news = await fh(`/company-news?symbol=${h.fh}&from=${from}&to=${to}`);
    if (Array.isArray(news) && news.length) {
      news.slice(0, 3).forEach(n => results.push({ hid:h.id, ticker:h.t, name:h.n, color:h.c, headline:n.headline, summary:n.summary, url:n.url, source:n.source, dt:n.datetime }));
    }
    await sleep(150);
  }

  S.news = results;
  store.set(SK.N, results);
  renderNews();
  document.getElementById('news-meta').textContent = `${results.length} articles · last 7 days`;
  btn.disabled = false; btn.textContent = '📰 Load latest news';
}

function renderNews() {
  const body = document.getElementById('news-body');
  if (!S.news.length) { body.innerHTML = '<div class="empty">No news found. Try refreshing or check that your Finnhub key is correct.</div>'; return; }

  const byHolding = {};
  S.news.forEach(n => {
    if (!byHolding[n.hid]) byHolding[n.hid] = [];
    byHolding[n.hid].push(n);
  });

  let html = '<div class="news-grid">';
  S.holdings.forEach(h => {
    const items = byHolding[h.id];
    if (!items?.length) return;
    html += `<div class="news-card">
      <div class="news-card-hdr" style="background:${h.c}12">
        <div class="news-cdot" style="background:${h.c}"></div>
        <span>${h.n}</span><span class="muted" style="font-size:11px;margin-left:4px">${h.t}</span>
      </div>`;
    items.forEach(n => {
      const ts = n.dt ? new Date(n.dt*1000).toLocaleDateString('nl-NL',{day:'numeric',month:'short'}) : '';
      html += `<div class="news-item">
        <div class="news-head"><span class="news-hl">${n.headline}</span></div>
        ${n.summary?`<div style="font-size:12px;color:var(--text2);margin-top:4px;line-height:1.5">${n.summary.slice(0,200)}…</div>`:''}
        <div class="news-src">${n.source||''} · ${ts} ${n.url?`· <a class="news-url" href="${n.url}" target="_blank" rel="noopener">Read →</a>`:''}</div>
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
  document.getElementById('earnings-body').innerHTML = '<div class="empty">Fetching earnings calendar from Finnhub…</div>';

  const from = today(), to = daysAhead(90);
  const data = await fh(`/calendar/earnings?from=${from}&to=${to}`);
  const fhSymbols = new Set(S.holdings.filter(h=>h.fh).map(h=>h.fh));
  const cal = (data?.earningsCalendar || []).filter(e => fhSymbols.has(e.symbol));

  S.earnings = cal;
  store.set(SK.E, cal);
  renderEarnings();
  document.getElementById('earnings-meta').textContent = `${cal.length} upcoming events`;
  btn.disabled = false; btn.textContent = '📅 Load earnings calendar';
}

function renderEarnings() {
  const body = document.getElementById('earnings-body');
  if (!S.earnings.length) {
    body.innerHTML = '<div class="empty">No upcoming earnings found for your holdings in the next 90 days.</div>';
    return;
  }
  const sorted = [...S.earnings].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const html = '<div class="earnings-list">' + sorted.map(e => {
    const h = S.holdings.find(x=>x.fh===e.symbol);
    const days = Math.ceil((new Date(e.date)-new Date())/86400000);
    const hr = e.hour==='bmo'?'Before market open':e.hour==='amc'?'After market close':'';
    const eps = e.epsEstimate!=null?`EPS est: $${e.epsEstimate.toFixed(2)}`:'';
    return `<div class="earn-row">
      <div>
        <div class="earn-date">${new Date(e.date).toLocaleDateString('nl-NL',{day:'numeric',month:'short'})}</div>
        <div class="earn-days">in ${days}d</div>
      </div>
      <div>
        <div class="earn-co">
          ${h?`<div style="width:8px;height:8px;border-radius:50%;background:${h.c}"></div>`:''}
          <span>${h?.n||e.symbol}</span>
          <span class="earn-tag earn-e">earnings</span>
        </div>
        <div class="earn-desc">${[hr,eps].filter(Boolean).join(' · ')}</div>
      </div>
      <div>${days<=14?'<span class="earn-soon">Soon</span>':''}</div>
    </div>`;
  }).join('') + '</div>';
  body.innerHTML = html;
}

// ─── WATCHLIST ────────────────────────────────────────────────────
function renderWatchlist() {
  const body = document.getElementById('watchlist-body');
  if (!S.watchlist.length) {
    body.innerHTML = '<div class="empty">Add Finnhub tickers above.<br>Examples: NVDA · MBG.DE · SMNEY</div>';
    return;
  }
  const cards = S.watchlist.map(t => {
    const p = S.wlPrices[t];
    const priceEur = p ? (p.price / (p.price > 500 ? 1 : 1)).toFixed(2) : null;
    return `<div class="wl-card">
      <button class="btn-rm wl-rm" onclick="removeWL('${t}')">×</button>
      <div class="wl-ticker">${t}</div>
      <div class="wl-price ${p?'':'muted'}">${p?'€'+priceEur:'…'}</div>
      <div class="wl-chg ${cc(p?.chgPct)}">${p?pct(p.chgPct):''}</div>
    </div>`;
  }).join('');
  body.innerHTML = `<div class="wl-grid">${cards}</div>`;
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
  const fhSym = document.getElementById('add-fhsym').value.trim() || null;
  const cgId  = document.getElementById('add-cgid').value.trim() || null;
  const pl    = document.getElementById('add-platform').value;
  const ty    = document.getElementById('add-type').value;
  const sh    = parseFloat(document.getElementById('add-shares').value) || null;
  const ac    = parseFloat(document.getElementById('add-avgcost').value) || null;
  const c     = document.getElementById('add-color').value;
  if (!n || !t) return;
  const cur = ty==='crypto'?'EUR':(fhSym&&!fhSym.includes('.'))?'USD':'EUR';
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
  if (S.tab === 'charts') { renderPortfolioChart(); renderAllocChart(); }
  if (S.news.length) renderNews();
  if (S.earnings.length) renderEarnings();
}

// ─── ALERTS MODAL ────────────────────────────────────────────────
function renderAlertsModal() {
  document.getElementById('per-holding-alerts').innerHTML =
    S.holdings.filter(h=>h.fh||h.cg).map(h =>
      `<div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.06)">
        <div style="display:flex;align-items:center;gap:7px;flex:1">
          <div style="width:8px;height:8px;border-radius:50%;background:${h.c}"></div>
          <span>${h.n}</span>
        </div>
        <input type="number" placeholder="${S.alerts.global||5}" min=".5" max="50" step=".5" value="${S.alerts[h.id]||''}"
          style="width:58px;padding:4px 8px;background:var(--bg3);border:1px solid var(--border);border-radius:6px;color:var(--text);font-size:12px"
          onchange="S.alerts['${h.id}']=parseFloat(this.value)||null;store.set(SK.A,S.alerts)">
        <span style="font-size:11px;color:var(--text3)">%</span>
      </div>`
    ).join('');
}

// ─── EVENTS ──────────────────────────────────────────────────────
function bindEvents() {
  // Tabs
  document.querySelectorAll('.tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.tab,.panel').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.getElementById('panel-' + tab).classList.add('active');
    S.tab = tab;
    if (tab === 'charts') { renderPortfolioChart(); renderAllocChart(); renderSparklines(); }
  }));

  // Header buttons
  document.getElementById('btn-refresh').addEventListener('click', () => { S.countdown = S.settings.refreshSec; fetchAllPrices(); });
  document.getElementById('btn-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('btn-alerts').addEventListener('click', () => { renderAlertsModal(); openModal('modal-alerts'); if(Notification.permission==='default') Notification.requestPermission(); });
  document.getElementById('btn-add').addEventListener('click', () => openModal('modal-add'));

  // Settings
  document.getElementById('btn-save-fhkey').addEventListener('click', () => {
    S.settings.fhKey = document.getElementById('inp-fhkey').value.trim();
    store.set(SK.S, S.settings); closeModal('modal-settings');
    fetchAllPrices();
  });
  document.getElementById('inp-refresh').addEventListener('change', e => {
    S.settings.refreshSec = parseInt(e.target.value);
    store.set(SK.S, S.settings); startRefresh();
  });
  document.getElementById('inp-alert-global').addEventListener('change', e => {
    S.alerts.global = parseFloat(e.target.value) || 5;
    store.set(SK.A, S.alerts);
  });
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset ALL portfolio data?')) { Object.values(SK).forEach(k => localStorage.removeItem(k)); location.reload(); }
  });

  // Range buttons
  document.querySelectorAll('.range-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    S.modalRange = parseInt(btn.dataset.range);
    const h = S.holdings.find(x=>x.id===S.modalTicker);
    if (h) loadChart(h, S.modalRange);
  }));

  // Close modals
  document.querySelectorAll('[data-close]').forEach(btn => btn.addEventListener('click', () => closeModal(btn.dataset.close)));
  document.getElementById('overlay').addEventListener('click', () => {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('overlay').classList.add('hidden');
  });

  // News & Earnings
  document.getElementById('btn-fetch-news').addEventListener('click', fetchNews);
  document.getElementById('btn-fetch-earnings').addEventListener('click', fetchEarnings);

  // Watchlist
  document.getElementById('btn-watchlist-add').addEventListener('click', addWL);
  document.getElementById('watchlist-input').addEventListener('keydown', e => { if(e.key==='Enter') addWL(); });

  // Add holding
  document.getElementById('btn-confirm-add').addEventListener('click', addHolding);

  // Setup screen
  document.getElementById('setup-save-btn').addEventListener('click', () => {
    const key = document.getElementById('setup-key-input').value.trim();
    if (!key || key.length < 10) { alert('Please enter a valid Finnhub API key.'); return; }
    S.settings.fhKey = key;
    store.set(SK.S, S.settings);
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('main-app').classList.remove('hidden');
    fetchAllPrices(); startRefresh();
  });
}

// ─── INIT ────────────────────────────────────────────────────────
function init() {
  // Load persisted state
  S.holdings  = store.get(SK.H) || DEFAULTS.map(h=>({...h}));
  S.vhist     = store.get(SK.V) || [];
  S.alerts    = store.get(SK.A) || {global:5};
  S.watchlist = store.get(SK.W) || ['NVDA','MBG.DE'];
  S.news      = store.get(SK.N) || [];
  S.earnings  = store.get(SK.E) || [];
  const saved = store.get(SK.S);
  if (saved) Object.assign(S.settings, saved);

  // Apply settings to UI
  document.getElementById('inp-refresh').value = S.settings.refreshSec;
  document.getElementById('inp-alert-global').value = S.alerts.global || 5;
  if (S.settings.fhKey) document.getElementById('inp-fhkey').value = S.settings.fhKey;

  bindEvents();

  // Show setup or main app
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
