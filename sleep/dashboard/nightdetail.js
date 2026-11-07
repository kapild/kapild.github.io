// Night detail: the "Night detail" tab (#night). One CPAP night, one row per signal on one clock.
//   summary cards · AHI by type · signal statistics · stacked rows (sleep stage, events, SpO2, pulse,
//   pressure, leak, flow limitation, snore) with every apnea event shaded across all rows · event list.
// Drag sideways to zoom; click an event to zoom to the 10 minutes around it.
// index.html calls NightDetail.mount(root, nightsJson, apneaJson) once, then .redraw() when shown or resized.
(function () {
  const STYLE = `
.nd{--card:#FFFFFF;--line:#D9DCE1;--grid:#EEF0F3;--ink:#111418;--ink2:#3D4350;--muted:#5A6170;--accent:#2459C6;
  --deep:#F5D04A;--core:#3C69D9;--rem:#8FC3F2;--awake:#EC8546;--bed:#C9CED6;
  --ca:#7C4DDB;--oa:#D13B52;--h:#E08A1E;--ua:#6B7486;--ar:#2E9C8A;
  --spo2:#2C7BC9;--pulse:#D9468F;--press:#3E8E5C;--leak:#C98A0E;--flim:#7C4DDB;--snore:#6B7486;
  --t-blue:#E8F0FD;--t-green:#E6F4EC;--t-amber:#FBF1DC;--t-pink:#FBE8F1;--t-violet:#EFEAFB;--t-red:#FBE6E9;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:14px;color:var(--ink);display:flex;flex-direction:column;gap:14px}
.nd .card{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:16px 18px;min-width:0}
.nd h1{font-size:24px;margin:2px 0 0;font-weight:600}
.nd h2{font-size:15px;margin:0;font-weight:600}
.nd .sub{font-family:var(--mono);font-size:12px;line-height:1.5;color:var(--muted)}
.nd .head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px}
.nd .ctl{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.nd .navbtn{width:40px;min-height:40px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);font-size:16px;cursor:pointer}
.nd .navbtn:disabled{opacity:.35;cursor:default}
.nd select{min-height:40px;border:1px solid #B4BAC4;border-radius:4px;padding:0 10px;font:inherit;font-size:13px;background:#fff;color:var(--ink)}
.nd .mini{border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);min-height:32px;padding:0 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.nd .mini:hover{border-color:var(--ink)}
.nd button:focus-visible,.nd select:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.nd .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.nd .tile{border-radius:4px;padding:12px 14px;border:1px solid var(--line);min-width:0}
.nd .tile .l{font-size:12px;font-weight:600;color:var(--ink2)}
.nd .tile .v{font-family:var(--mono);font-size:24px;font-weight:600;line-height:1.2;margin-top:4px}
.nd .tile .v small{font-size:12px;font-weight:400;color:var(--muted);margin-left:3px}
.nd .tile .d{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:2px}
.nd .up{color:var(--oa)} .nd .down{color:var(--press)}
.nd .row2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:14px}
@media (max-width:820px){.nd .row2{grid-template-columns:1fr}}
.nd .donut{display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:10px}
.nd .blist{display:flex;flex-direction:column;gap:6px;font-size:13px;min-width:150px}
.nd .blist div{display:flex;justify-content:space-between;gap:14px}
.nd .blist i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:6px}
.nd .blist b{font-family:var(--mono)}
.nd .scroll{overflow-x:auto}
.nd table{border-collapse:collapse;width:100%;font-size:12.5px}
.nd th{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);text-align:right;padding:6px 8px;border-bottom:1px solid var(--ink)}
.nd td{padding:6px 8px;border-bottom:1px solid var(--grid);text-align:right;font-family:var(--mono);white-space:nowrap}
.nd th:first-child,.nd td:first-child{text-align:left;font-family:inherit}
.nd tbody tr.clk{cursor:pointer}
.nd tbody tr.clk:hover{background:var(--t-blue)}
.nd .chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.nd .chip{display:inline-flex;align-items:center;gap:6px;min-height:30px;padding:0 10px;border:1px solid var(--line);border-radius:15px;font:inherit;font-size:12px;font-weight:600;background:#fff;color:var(--ink);cursor:pointer}
.nd .chip[aria-pressed="false"]{opacity:.45}
.nd .chip i{width:9px;height:9px;border-radius:50%}
.nd .chart svg{display:block;width:100%;height:auto;touch-action:none;cursor:crosshair;min-width:640px}
.nd svg text{font-family:var(--mono);font-size:10.5px;fill:var(--muted)}
.nd .zoom{display:flex;flex-wrap:wrap;gap:8px;align-items:center;font-size:12.5px;font-weight:600;margin-bottom:6px}
.nd .note{font-size:12.5px;line-height:1.5;color:var(--muted);margin:8px 0 0}
.nd [hidden]{display:none!important}`;

  const MARKUP = `
<section class="card head" aria-label="Night">
  <div>
    <div class="sub">ONE NIGHT · CPAP + O2 RING + WATCH ON ONE CLOCK</div>
    <h1 id="nd-title"></h1>
    <div class="sub" id="nd-srcs"></div>
  </div>
  <div class="ctl">
    <button type="button" class="navbtn" id="nd-prev" aria-label="Previous night">‹</button>
    <select id="nd-pick" aria-label="Night"></select>
    <button type="button" class="navbtn" id="nd-next" aria-label="Next night">›</button>
  </div>
</section>
<section class="tiles" id="nd-tiles" aria-label="Night summary"></section>
<section class="row2">
  <div class="card">
    <h2>Events per hour (AHI)</h2>
    <div class="sub">by event type, from the machine</div>
    <div class="donut"><svg id="nd-donut" width="140" height="140" viewBox="0 0 140 140" role="img" aria-label="AHI by event type"></svg><div class="blist" id="nd-blist"></div></div>
  </div>
  <div class="card">
    <h2>Statistics</h2>
    <div class="sub">from the minute-by-minute data; CPAP rows only while the mask was on</div>
    <div class="scroll" style="margin-top:8px"><table id="nd-stats"></table></div>
  </div>
</section>
<section class="card" aria-label="Signals">
  <div class="head" style="margin-bottom:10px">
    <div>
      <h2>The night, row by row</h2>
      <div class="sub">Shaded bands mark each event on every row. Drag sideways to zoom, double-click to reset. Hover to read every row at one minute.</div>
    </div>
    <div class="chips" id="nd-chips"></div>
  </div>
  <div class="zoom" id="nd-zoom" hidden><span id="nd-ztxt"></span><button type="button" class="mini" id="nd-zreset">Show whole night</button></div>
  <div class="scroll chart" id="nd-chart"></div>
  <p class="note">Gray background = mask off. Every row is one value per minute, so very short dips are smoothed. The breathing waveform and movement aren't in the exported data yet.</p>
</section>
<section class="card" aria-label="Event list">
  <h2>Events</h2>
  <div class="sub">Click a row to zoom to the 10 minutes around it. Stage is the Watch's sleep stage at that minute; SpO₂ low is the ring's lowest reading in the 90 seconds after the event.</div>
  <div class="scroll" style="margin-top:8px;max-height:360px;overflow-y:auto"><table id="nd-ev"></table></div>
</section>`;

  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const EV = { oa: ['Obstructive', '--oa'], ca: ['Central', '--ca'], h: ['Hypopnea', '--h'], ua: ['Unclassified', '--ua'], ar: ['Arousal', '--ar'] };
  const STG = { deep: 3, core: 2, rem: 1, awake: 0, bed: 0 };
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const clock = m => { const t = ((21 * 60 + Math.round(m)) % 1440 + 1440) % 1440, h = Math.floor(t / 60), mm = t % 60; return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
  const hm = m => Math.floor(m / 60) + 'h ' + String(Math.round(m % 60)).padStart(2, '0') + 'm';
  const longd = s => { const p = s.split('-'), d = new Date(Date.UTC(+p[0], p[1] - 1, +p[2])); return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
  const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
  const f1 = v => v == null ? '—' : (+v).toFixed(1);

  function mount(root, NJ, A) {
    if (!document.getElementById('nd-style')) { const st = document.createElement('style'); st.id = 'nd-style'; st.textContent = STYLE; document.head.appendChild(st); }
    root.innerHTML = '<div class="nd">' + MARKUP + '</div>';
    const host = root.firstChild;
    const $ = id => document.getElementById(id);
    const css = n => getComputedStyle(host).getPropertyValue(n).trim();

    const sleep = {}, daily = {}, o2 = {};
    (NJ.nights || []).forEach(n => { sleep[n.d] = n; });
    (A.cpapDaily || []).forEach(c => { daily[c.d] = c; });
    (A.o2 || []).forEach(o => { o2[o.d] = o; });
    const N = (A.cpapNights || []).slice().sort((a, b) => a.d < b.d ? -1 : 1).map(c => ({
      d: c.d, daily: daily[c.d] || {}, sess: c.sessions || [], ev: c.events || [], ser: c.series || {},
      sleep: sleep[c.d] || null, o2: o2[c.d] || null
    }));
    if (!N.length) { host.innerHTML = '<div class="card">No minute-level CPAP nights in apnea.json. Run scripts/build_apnea.py.</div>'; return { redraw() {} }; }

    // open on the latest night that also has the ring and sleep stages, else the latest CPAP night
    let start = N.length - 1;
    for (let i = N.length - 1; i >= 0; i--) if (N[i].o2 && N[i].sleep) { start = i; break; }
    const S = { i: start, on: { oa: true, ca: true, h: true, ua: true, ar: false }, z: null };

    N.forEach((n, i) => $('nd-pick').insertAdjacentHTML('beforeend', `<option value="${i}">${n.d}${n.o2 ? ' · ring' : ''}${n.sleep ? '' : ' · no sleep stages'}</option>`));
    $('nd-pick').onchange = e => { S.i = +e.target.value; S.z = null; render(); };
    $('nd-prev').onclick = () => { if (S.i > 0) { S.i--; S.z = null; render(); } };
    $('nd-next').onclick = () => { if (S.i < N.length - 1) { S.i++; S.z = null; render(); } };
    $('nd-zreset').onclick = () => { S.z = null; drawChart(); };

    const avg7 = (i, k) => { const v = N.slice(Math.max(0, i - 7), i).map(n => n.daily[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const delta = (v, base) => {
      if (v == null || base == null) return '';
      const d = v - base;
      return `<span class="${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}</span> vs 7-night avg`;
    };

    function render() {
      const n = N[S.i], dl = n.daily;
      $('nd-pick').value = S.i;
      $('nd-prev').disabled = S.i === 0; $('nd-next').disabled = S.i === N.length - 1;
      $('nd-title').textContent = longd(n.d);
      $('nd-srcs').textContent = ['ResMed CPAP', n.o2 && 'O2Ring', n.sleep && 'Watch sleep stages'].filter(Boolean).join(' · ') + (n.o2 ? '' : ' · no ring this night');
      const t = [['--t-green', 'AHI', f1(dl.ahi), 'events/h', delta(dl.ahi, avg7(S.i, 'ahi'))],
        ['--t-violet', 'Mask on', dl.use ? hm(dl.use) : '—', '', `${n.sess.length} session${n.sess.length === 1 ? '' : 's'}`],
        ['--t-blue', '95% pressure', f1(dl.press95), 'cmH₂O', delta(dl.press95, avg7(S.i, 'press95'))],
        ['--t-amber', '95% leak', f1(dl.leak95), 'L/min', delta(dl.leak95, avg7(S.i, 'leak95'))]];
      if (n.o2) t.push(['--t-red', 'SpO₂ low', n.o2.spo2Min + '%', '', `avg ${n.o2.spo2Avg}% · ${n.o2.below90Min} min < 90%`],
        ['--t-pink', 'Pulse', n.o2.hrAvg, 'bpm', `${n.o2.hrMin}–${n.o2.hrMax} · ODI4 ${n.o2.odi4}`]);
      if (n.sleep) t.push(['--t-blue', 'Asleep', hm((n.sleep.deep || 0) + (n.sleep.rem || 0) + (n.sleep.core || 0)), '', `deep ${Math.round(n.sleep.deep || 0)}m · REM ${Math.round(n.sleep.rem || 0)}m`]);
      $('nd-tiles').innerHTML = t.map(([bg, l, v, u, d]) => `<div class="tile" style="background:var(${bg})"><div class="l">${l}</div><div class="v">${v}<small>${u}</small></div><div class="d">${d}</div></div>`).join('');

      // AHI donut
      const parts = [['oa', dl.oai], ['ca', dl.cai], ['h', dl.hi], ['ua', dl.uai]].filter(p => p[1] != null);
      const tot = parts.reduce((a, p) => a + p[1], 0), dn = $('nd-donut'); dn.innerHTML = '';
      const R = 52, C = 2 * Math.PI * R; let off = 0;
      el('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: css('--grid'), 'stroke-width': 16 }, dn);
      parts.forEach(([k, v]) => { if (!v || !tot) return; const len = v / tot * C; el('circle', { cx: 70, cy: 70, r: R, fill: 'none', stroke: css(EV[k][1]), 'stroke-width': 16, 'stroke-dasharray': `${len} ${C - len}`, 'stroke-dashoffset': -off, transform: 'rotate(-90 70 70)' }, dn); off += len; });
      el('text', { x: 70, y: 75, 'text-anchor': 'middle', style: `font-size:20px;font-weight:600;fill:${css('--ink')}` }, dn).textContent = f1(dl.ahi);
      el('text', { x: 70, y: 92, 'text-anchor': 'middle' }, dn).textContent = 'AHI';
      $('nd-blist').innerHTML = parts.map(([k, v]) => `<div><span><i style="background:var(${EV[k][1]})"></i>${EV[k][0]}</span><b>${f1(v)}</b></div>`).join('') +
        `<div style="border-top:1px solid var(--line);padding-top:6px"><span>Events this night</span><b>${n.ev.filter(e => e[0] !== 'ar').length}</b></div>`;

      // statistics
      const inMask = m => n.sess.some(([a, b]) => m >= a && m <= b);
      const ser = k => (n.ser[k] || []).filter(p => inMask(p[0])).map(p => p[1]);
      const rows = [['Pressure', 'cmH₂O', ser('press')], ['Leak', 'L/min', ser('leak')], ['Flow limitation', '0–1', ser('flowlim')], ['Snore', 'index', ser('snore')]];
      if (n.o2) rows.push(['SpO₂', '%', n.o2.series.map(p => p[1]).filter(Boolean)], ['Pulse', 'bpm', n.o2.series.map(p => p[3]).filter(Boolean)]);
      $('nd-stats').innerHTML = '<thead><tr><th>Signal</th><th>Min</th><th>Median</th><th>95%</th><th>Max</th></tr></thead><tbody>' +
        rows.map(([l, u, a]) => `<tr><td>${l} <span class="sub">${u}</span></td><td>${f1(q(a, 0))}</td><td>${f1(q(a, 0.5))}</td><td>${f1(q(a, 0.95))}</td><td>${f1(q(a, 1))}</td></tr>`).join('') + '</tbody>';

      // event-type chips
      const cnt = k => n.ev.filter(e => e[0] === k).length;
      $('nd-chips').innerHTML = Object.keys(EV).map(k => `<button type="button" class="chip" data-k="${k}" aria-pressed="${S.on[k]}"><i style="background:var(${EV[k][1]})"></i>${EV[k][0]} ${cnt(k)}</button>`).join('');
      $('nd-chips').querySelectorAll('.chip').forEach(b => b.onclick = () => { S.on[b.dataset.k] = !S.on[b.dataset.k]; b.setAttribute('aria-pressed', String(S.on[b.dataset.k])); drawChart(); drawEvents(); });

      drawChart(); drawEvents();
    }

    function nightRange(n) {
      let lo = Infinity, hi = -Infinity;
      n.sess.forEach(([a, b]) => { lo = Math.min(lo, a); hi = Math.max(hi, b); });
      if (n.o2) { lo = Math.min(lo, n.o2.start); hi = Math.max(hi, n.o2.end); }
      if (n.sleep) { lo = Math.min(lo, n.sleep.inBed ?? n.sleep.onset); hi = Math.max(hi, n.sleep.outBed ?? n.sleep.wake); }
      if (!isFinite(lo)) { lo = 0; hi = 600; }
      return [Math.floor(lo / 15) * 15 - 5, Math.ceil(hi / 15) * 15 + 5];
    }

    function drawChart() {
      const n = N[S.i], [T0, T1] = S.z || nightRange(n);
      $('nd-zoom').hidden = !S.z;
      if (S.z) $('nd-ztxt').textContent = `Zoomed to ${clock(T0)} – ${clock(T1)}`;
      const box = $('nd-chart'); box.innerHTML = '';
      const W = Math.max(640, box.clientWidth || 1000), L = 150, R = 70, TOP = 8, GAP = 10, AX = 22;
      const rows = [];
      if (n.sleep) rows.push({ k: 'sleep', l: 'Sleep stage', h: 74 });
      rows.push({ k: 'ev', l: 'Events', h: 58 });
      if (n.o2) {
        rows.push({ k: 'spo2', l: 'SpO₂ (%)', h: 96, lo: 84, hi: 100, c: '--spo2', pts: n.o2.series.map(p => [p[0], p[1]]), ref: 90, low: n.o2.series.map(p => [p[0], p[2]]) });
        rows.push({ k: 'pulse', l: 'Pulse (bpm)', h: 74, lo: 40, hi: 110, c: '--pulse', pts: n.o2.series.map(p => [p[0], p[3]]) });
      }
      rows.push({ k: 'press', l: 'Pressure (cmH₂O)', h: 64, lo: 4, hi: 20, c: '--press', pts: n.ser.press || [], step: true });
      rows.push({ k: 'leak', l: 'Leak (L/min)', h: 70, lo: 0, hi: 40, c: '--leak', pts: n.ser.leak || [], ref: 24, area: true, zero: true });
      rows.push({ k: 'flim', l: 'Flow limitation', h: 56, lo: 0, hi: 1, c: '--flim', pts: n.ser.flowlim || [], area: true, zero: true });
      rows.push({ k: 'snore', l: 'Snore', h: 56, lo: 0, hi: 2, c: '--snore', pts: n.ser.snore || [], area: true, zero: true });
      const H = TOP + rows.reduce((a, r) => a + r.h + GAP, 0) + AX, plotW = W - L - R;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Night signals, one row each' }, box);
      const x = m => L + (m - T0) / (T1 - T0) * plotW;
      const cp = el('clipPath', { id: 'nd-cp' }, el('defs', {}, svg)); el('rect', { x: L, y: 0, width: plotW, height: H }, cp);
      const span = T1 - T0, step = span <= 30 ? 5 : span <= 90 ? 10 : span <= 240 ? 30 : 60;
      for (let m = Math.ceil(T0 / step) * step; m <= T1; m += step) {
        el('line', { x1: x(m), x2: x(m), y1: TOP, y2: H - AX, stroke: css('--grid') }, svg);
        el('text', { x: x(m), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = clock(m);
      }
      const plot = el('g', { 'clip-path': 'url(#nd-cp)' }, svg);
      let prevEnd = T0;   // mask-off gaps
      n.sess.concat([[T1 + 1, T1 + 1]]).forEach(([a, b]) => { if (a > prevEnd) el('rect', { x: x(prevEnd), y: TOP, width: Math.max(0, x(Math.min(a, T1)) - x(prevEnd)), height: H - AX - TOP, fill: css('--grid'), opacity: 0.6 }, plot); prevEnd = Math.max(prevEnd, b); });
      n.ev.filter(e => S.on[e[0]]).forEach(([k, m, dur]) => {   // event bands through every row
        const w = Math.max(2, x(m) - x(m - (dur || 0) / 60));
        el('rect', { x: x(m) - w, y: TOP, width: w, height: H - AX - TOP, fill: css(EV[k][1]), opacity: k === 'ar' ? 0.12 : 0.16 }, plot);
      });

      let y = TOP; const readers = [];
      rows.forEach(r => {
        const g = el('g', {}, svg), gp = el('g', { 'clip-path': 'url(#nd-cp)' }, svg);
        el('line', { x1: L, x2: W - R, y1: y + r.h, y2: y + r.h, stroke: css('--line') }, g);
        el('text', { x: 0, y: y + 13, style: `font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:12px;font-weight:600;fill:${css('--ink2')}` }, g).textContent = r.l;
        if (r.k === 'sleep') {
          const rh = (r.h - 6) / 4;
          ['Awake', 'REM', 'Core', 'Deep'].forEach((s, i) => el('text', { x: L - 6, y: y + 3 + rh * i + rh / 2 + 3, 'text-anchor': 'end' }, g).textContent = s);
          (n.sleep.segs || []).forEach(sg => el('rect', { x: x(sg[1]), y: y + 3 + (STG[sg[0]] || 0) * rh + 1, width: Math.max(1, x(sg[2]) - x(sg[1])), height: rh - 2, rx: 1.5, fill: css(sg[0] === 'bed' ? '--bed' : '--' + sg[0]) }, gp));
          readers.push(m => { const s = (n.sleep.segs || []).find(sg => m >= sg[1] && m < sg[2]); return s ? s[0] : '—'; });
        } else if (r.k === 'ev') {
          const ks = Object.keys(EV), rh = (r.h - 4) / ks.length;
          ks.forEach((k, i) => {
            el('text', { x: L - 6, y: y + 2 + rh * i + rh / 2 + 3, 'text-anchor': 'end', style: `font-size:9.5px;fill:${css(EV[k][1])}` }, g).textContent = EV[k][0];
            n.ev.filter(e => e[0] === k && S.on[k]).forEach(([, m, dur]) => { const w = Math.max(2.5, x(m) - x(m - (dur || 0) / 60)); el('rect', { x: x(m) - w, y: y + 2 + rh * i + 1, width: w, height: rh - 2, rx: 1, fill: css(EV[k][1]) }, gp); });
          });
          readers.push(m => { const e = n.ev.find(e => S.on[e[0]] && m >= e[1] - (e[2] || 0) / 60 - 0.5 && m <= e[1] + 0.5); return e ? EV[e[0]][0] + ' ' + e[2] + 's' : ''; });
        } else {
          const yy = v => y + 4 + (1 - (Math.max(r.lo, Math.min(r.hi, v)) - r.lo) / (r.hi - r.lo)) * (r.h - 8);
          [r.hi, r.lo].forEach(v => el('text', { x: L - 6, y: yy(v) + 3, 'text-anchor': 'end' }, g).textContent = v);
          if (r.ref != null) {
            el('line', { x1: L, x2: W - R, y1: yy(r.ref), y2: yy(r.ref), stroke: css(r.c), 'stroke-dasharray': '3 3', opacity: 0.6 }, g);
            el('text', { x: L - 6, y: yy(r.ref) + 3, 'text-anchor': 'end', style: `fill:${css(r.c)}` }, g).textContent = r.ref;
          }
          if (r.low) r.low.forEach(([m, v]) => { if (v && v < 90) el('rect', { x: x(m), y: yy(90), width: Math.max(2, x(m + 1) - x(m)), height: yy(v) - yy(90), fill: css('--oa'), opacity: 0.35 }, gp); });
          const segs = []; let d = '', prev = null, s0 = null;
          r.pts.forEach(([m, v]) => {
            const bad = v == null || (!r.zero && v <= 0);
            if (bad || (prev != null && m - prev > 3)) { if (d) segs.push([d, s0, prev]); d = ''; prev = null; if (bad) return; }
            if (!d) { s0 = m; d = `M${x(m).toFixed(1)} ${yy(v).toFixed(1)}`; }
            else d += r.step ? `H${x(m).toFixed(1)}V${yy(v).toFixed(1)}` : `L${x(m).toFixed(1)} ${yy(v).toFixed(1)}`;
            prev = m;
          });
          if (d) segs.push([d, s0, prev]);
          segs.forEach(([dd, a, b]) => {
            if (r.area) el('path', { d: dd + `L${x(b).toFixed(1)} ${yy(r.lo)}L${x(a).toFixed(1)} ${yy(r.lo)}Z`, fill: css(r.c), opacity: 0.18 }, gp);
            el('path', { d: dd, fill: 'none', stroke: css(r.c), 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, gp);
          });
          readers.push(m => { let best = null, bd = 1.6; r.pts.forEach(p => { const dd = Math.abs(p[0] - m); if (dd < bd) { bd = dd; best = p; } }); return best ? f1(best[1]) : '—'; });
        }
        r.y = y; y += r.h + GAP;
      });

      // hover readout + drag to zoom
      const cross = el('line', { y1: TOP, y2: H - AX, stroke: css('--ink'), 'stroke-dasharray': '3 3', opacity: 0 }, svg);
      const vals = rows.map(r => el('text', { x: W - R + 6, y: r.y + 13, style: `font-weight:600;fill:${css('--ink')}` }, svg));
      const tlab = el('text', { y: H - AX - 4, 'text-anchor': 'middle', style: `font-weight:600;fill:${css('--ink')};paint-order:stroke;stroke:#fff;stroke-width:4px` }, svg);
      const brush = el('rect', { y: TOP, height: H - AX - TOP, fill: css('--accent'), opacity: 0.12, visibility: 'hidden' }, svg);
      const px = e => { const b = svg.getBoundingClientRect(); return (e.clientX - b.left) * W / b.width; };
      const tOf = p => T0 + Math.max(0, Math.min(1, (p - L) / plotW)) * (T1 - T0);
      let start = null;
      svg.addEventListener('pointermove', e => {
        const p = px(e);
        if (p < L || p > W - R) { cross.setAttribute('opacity', 0); return; }
        const m = tOf(p);
        cross.setAttribute('x1', p); cross.setAttribute('x2', p); cross.setAttribute('opacity', 0.5);
        tlab.setAttribute('x', p); tlab.textContent = clock(m);
        vals.forEach((v, i) => { v.textContent = readers[i](m); });
        if (start != null) { brush.setAttribute('x', Math.min(start, p)); brush.setAttribute('width', Math.abs(p - start)); brush.setAttribute('visibility', 'visible'); }
      });
      svg.addEventListener('pointerleave', () => { if (start != null) return; cross.setAttribute('opacity', 0); tlab.textContent = ''; vals.forEach(v => { v.textContent = ''; }); });
      svg.addEventListener('pointerdown', e => { const p = px(e); if (p >= L && p <= W - R) { start = p; svg.setPointerCapture(e.pointerId); } });
      svg.addEventListener('pointerup', e => {
        if (start == null) return;
        const p = px(e), a = tOf(Math.min(start, p)), b = tOf(Math.max(start, p));
        start = null; brush.setAttribute('visibility', 'hidden');
        if (b - a >= 3) { S.z = [a, b]; drawChart(); }
      });
      svg.addEventListener('pointercancel', () => { start = null; brush.setAttribute('visibility', 'hidden'); });
      svg.addEventListener('dblclick', () => { S.z = null; drawChart(); });
    }

    function drawEvents() {
      const n = N[S.i], evs = n.ev.filter(e => S.on[e[0]]).sort((a, b) => a[1] - b[1]);
      const stage = m => { if (!n.sleep) return '—'; const s = (n.sleep.segs || []).find(sg => m >= sg[1] && m < sg[2]); return s ? s[0] : '—'; };
      const low = m => { if (!n.o2) return '—'; const v = n.o2.series.filter(p => p[0] >= m && p[0] <= m + 1.5 && p[2]).map(p => p[2]); return v.length ? Math.min(...v) + '%' : '—'; };
      $('nd-ev').innerHTML = '<thead><tr><th>Time</th><th>Type</th><th>Length</th><th>Stage</th><th>SpO₂ low</th></tr></thead><tbody>' +
        (evs.length ? evs.map(([k, m, dur]) => `<tr class="clk" data-m="${m}" tabindex="0"><td>${clock(m)}</td><td style="color:var(${EV[k][1]});font-family:inherit;font-weight:600">${EV[k][0]}</td><td>${dur}s</td><td>${stage(m)}</td><td>${low(m)}</td></tr>`).join('')
          : '<tr><td colspan="5">No events of the selected types this night.</td></tr>') + '</tbody>';
      $('nd-ev').querySelectorAll('tr.clk').forEach(tr => {
        const go = () => { const m = +tr.dataset.m; S.z = [m - 5, m + 5]; drawChart(); $('nd-chart').scrollIntoView({ behavior: 'smooth', block: 'center' }); };
        tr.onclick = go; tr.onkeydown = e => { if (e.key === 'Enter') go(); };
      });
    }

    render();
    return { redraw: drawChart };
  }

  window.NightDetail = { mount };
})();
