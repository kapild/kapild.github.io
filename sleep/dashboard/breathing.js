// Breathing views for the dashboard: ResMed CPAP + O2 ring + Apple Watch nights.
//   a · CPAP & oxygen   nightly use, AHI by type, leak, monthly table, ring recordings
//   b · Night overlay   one night, every source on one clock
//   c · Analysis        coverage, mask vs sleep, events by stage, CPAP vs not, Watch vs ring, trend
// index.html calls BreathingViews.mount(root, apneaJson, nightsJson) once, then .show('a'|'b'|'c').
(function () {
  const STYLE = ".br{--bg:#F1F2F4; --card:#FFFFFF; --ink:#111418; --ink2:#3D4350; --muted:#5A6170; --line:#E4E6EA; --line2:#D9DCE1; --grid:#EEF0F3;\n  --deep:#F5D04A; --core:#3C69D9; --rem:#8FC3F2; --awake:#EC8546;\n  --ca:#C2410C; --oa:#0D9488; --ot:#8B5CF6;\n  --mask:#0F172A; --good:#2459C6; --bad:#B45314;\n  --mono:'IBM Plex Mono',ui-monospace,monospace;}\n.br .eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.06em;color:var(--muted)}\n.br h1{margin:6px 0 0;font-size:30px;font-weight:600;letter-spacing:-.01em}\n.br h2{margin:0;font-size:16px;font-weight:600}\n.br h3{margin:0;font-size:14px;font-weight:600}\n.br .sub{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:2px}\n.br .note{font-size:12px;line-height:1.5;color:var(--muted)}\n.br a{color:var(--good)}\n.br a:hover{color:#1A3F8F}\n.br .tabs{display:flex;flex-wrap:wrap;gap:6px}\n.br .tab{border:1px solid var(--ink);border-radius:4px;min-height:44px;padding:0 16px;font:inherit;font-size:14px;font-weight:600;background:#fff;color:var(--ink);cursor:pointer}\n.br .tab[aria-selected=\"true\"]{background:var(--ink);color:#fff}\n.br button:focus-visible,.br select:focus-visible{outline:2px solid var(--good);outline-offset:2px}\n.br .card{background:var(--card);border:1px solid var(--line2);border-radius:4px;padding:20px 22px;min-width:0}\n.br .row{display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start}\n.br .grow{flex:999 1 640px;min-width:0}\n.br .side{flex:1 1 340px;min-width:0}\n.br .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}\n.br .tile{background:#fff;border:1px solid var(--line2);border-radius:4px;padding:14px 16px}\n.br .tile .v{font-family:var(--mono);font-size:26px;font-weight:600}\n.br .tile .l{font-size:12px;color:var(--ink2);margin-top:2px;line-height:1.35}\n.br .legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:12px;color:var(--ink2)}\n.br .legend span{display:inline-flex;align-items:center;gap:6px}\n.br .sw{width:12px;height:12px;border-radius:2px;display:inline-block}\n.br .chart{width:100%;display:block;overflow:visible}\n.br .chart text{font-family:var(--mono);font-size:11px;fill:var(--muted)}\n.br table{border-collapse:collapse;width:100%;font-size:12.5px}\n.br th{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);text-align:right;padding:8px 6px;border-bottom:1px solid var(--ink)}\n.br th:first-child,.br td:first-child{text-align:left}\n.br td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:right;font-family:var(--mono);white-space:nowrap}\n.br .scroll{overflow-x:auto}\n.br .finding{display:flex;flex-direction:column;gap:12px}\n.br .big{font-size:20px;font-weight:600;line-height:1.3}\n.br select{min-height:40px;border:1px solid #B4BAC4;border-radius:4px;padding:0 10px;font:inherit;font-size:13px;background:#fff;color:var(--ink)}\n.br .navbtn{width:40px;min-height:40px;border:1px solid var(--line2);border-radius:4px;background:#fff;cursor:pointer;font:inherit}\n.br .navbtn:disabled{opacity:.35;cursor:default}\n.br .lanelabel{font-size:12px;color:var(--ink2)}\n.br .caveat{border-left:0;background:#FBF7F1;border:1px solid #EAD9C3}\n.br .pill{display:inline-block;font-family:var(--mono);font-size:11px;padding:2px 6px;border-radius:3px;background:var(--grid);color:var(--ink2)}\n.br [hidden]{display:none!important}\n.br{font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:14px;color:var(--ink);display:flex;flex-direction:column;gap:20px}\n.br .brhead{padding-bottom:18px;border-bottom:2px solid var(--ink)}\n#tip{position:fixed;z-index:20;pointer-events:none;background:#fff;border:1px solid #111418;border-radius:4px;padding:10px 12px;font-size:12px;line-height:1.45;box-shadow:4px 4px 0 rgba(17,20,24,.12);max-width:280px;display:none;font-family:'IBM Plex Sans',system-ui,sans-serif}#tip b{font-weight:600}#tip .m{font-family:'IBM Plex Mono',monospace;color:#3D4350}";
  const MARKUP = "<div class=\"brhead\">\n  <div class=\"eyebrow\">BREATHING \u00b7 RESMED AIRSENSE 11 + O2RING S</div>\n  <h1 id=\"br-title\"></h1>\n  <div class=\"sub\" id=\"br-cover\"></div>\n</div>\n  <!-- A \u00b7 separate tab -->\n  <section id=\"tab-a\" hidden style=\"display:flex;flex-direction:column;gap:20px\">\n    <div class=\"tiles\" id=\"a-tiles\"></div>\n    <div class=\"row\">\n      <div class=\"card grow\">\n        <div style=\"display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center\">\n          <div><h2>Nightly CPAP use</h2><div class=\"sub\" id=\"a-range\"></div></div>\n          <div style=\"display:flex;gap:8px;align-items:center\">\n            <button class=\"navbtn\" id=\"a-prev\" aria-label=\"Earlier\">\u2039</button>\n            <button class=\"navbtn\" id=\"a-next\" aria-label=\"Later\">\u203a</button>\n          </div>\n        </div>\n        <div class=\"legend\" style=\"margin:12px 0 4px\"><span><i class=\"sw\" style=\"background:var(--oa)\"></i>Mask on \u2265 4 h</span><span><i class=\"sw\" style=\"background:#99D5CF\"></i>Under 4 h</span><span><i class=\"sw\" style=\"background:#fff;border:1px dashed #B4BAC4\"></i>Not used</span></div>\n        <svg class=\"chart\" id=\"a-use\" height=\"170\" role=\"img\" aria-label=\"Hours of CPAP use per night\"></svg>\n        <h3 style=\"margin-top:18px\">Events per hour (AHI)</h3>\n        <div class=\"legend\" style=\"margin:8px 0 4px\"><span><i class=\"sw\" style=\"background:var(--ca)\"></i>Central</span><span><i class=\"sw\" style=\"background:var(--oa)\"></i>Obstructive</span><span><i class=\"sw\" style=\"background:var(--ot)\"></i>Unclassified + hypopnea</span></div>\n        <svg class=\"chart\" id=\"a-ahi\" height=\"150\" role=\"img\" aria-label=\"Apnea-hypopnea index per night by event type\"></svg>\n        <h3 style=\"margin-top:18px\">Leak, 95th percentile (L/min)</h3>\n        <svg class=\"chart\" id=\"a-leak\" height=\"110\" role=\"img\" aria-label=\"95th percentile leak per night\"></svg>\n      </div>\n      <div class=\"side\" style=\"display:flex;flex-direction:column;gap:20px\">\n        <div class=\"card\">\n          <h2>By month</h2>\n          <p class=\"note\" style=\"margin:4px 0 10px\">Every month the machine was used.</p>\n          <div class=\"scroll\"><table id=\"a-months\"></table></div>\n        </div>\n        <div class=\"card\">\n          <h2>O2 ring recordings</h2>\n          <p class=\"note\" style=\"margin:4px 0 10px\">Summaries from the ring app. ODI = SpO\u2082 drops \u22653% (\u22654%) per hour.</p>\n          <div class=\"scroll\"><table id=\"a-o2\"></table></div>\n        </div>\n      </div>\n    </div>\n  </section>\n\n  <!-- B \u00b7 overlay -->\n  <section id=\"tab-b\" hidden style=\"display:flex;flex-direction:column;gap:20px\">\n    <div class=\"card\">\n      <div style=\"display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:flex-end;padding-bottom:14px;border-bottom:1px solid var(--line)\">\n        <div>\n          <div class=\"eyebrow\" style=\"color:var(--good);font-weight:600\">ONE NIGHT \u00b7 ALL SOURCES ON ONE CLOCK</div>\n          <h2 style=\"font-size:24px;margin-top:4px\" id=\"b-date\"></h2>\n          <div class=\"sub\" id=\"b-sources\"></div>\n        </div>\n        <div style=\"display:flex;gap:8px;align-items:center;flex-wrap:wrap\">\n          <label for=\"b-pick\" class=\"eyebrow\">NIGHT</label>\n          <select id=\"b-pick\"></select>\n          <button class=\"navbtn\" id=\"b-prev\" aria-label=\"Previous night\">\u2039</button>\n          <button class=\"navbtn\" id=\"b-next\" aria-label=\"Next night\">\u203a</button>\n        </div>\n      </div>\n      <div class=\"legend\" style=\"margin:14px 0 6px\">\n        <span><i class=\"sw\" style=\"background:var(--deep)\"></i>Deep</span><span><i class=\"sw\" style=\"background:var(--core)\"></i>Core</span><span><i class=\"sw\" style=\"background:var(--rem)\"></i>REM</span><span><i class=\"sw\" style=\"background:var(--awake)\"></i>Awake</span>\n        <span><i class=\"sw\" style=\"background:var(--mask)\"></i>Mask on</span>\n        <span><svg width=\"10\" height=\"12\" aria-hidden=\"true\"><rect width=\"3\" height=\"12\" x=\"3\" fill=\"#C2410C\"></rect></svg>Central</span>\n        <span><svg width=\"10\" height=\"12\" aria-hidden=\"true\"><rect width=\"3\" height=\"12\" x=\"3\" fill=\"#0D9488\"></rect></svg>Obstructive</span>\n        <span><svg width=\"10\" height=\"12\" aria-hidden=\"true\"><rect width=\"3\" height=\"12\" x=\"3\" fill=\"#8B5CF6\"></rect></svg>Other</span>\n      </div>\n      <div class=\"scroll\"><div style=\"min-width:720px\"><svg class=\"chart\" id=\"b-chart\" height=\"520\" role=\"img\" aria-label=\"Night overlay of sleep stages, CPAP mask time, apnea events, SpO2 and pulse\"></svg></div></div>\n      <p class=\"note\" style=\"margin:8px 0 0\">Hover anywhere to read every source at that minute. The SpO\u2082 lane shows the ring's per-minute average (line) and per-minute low (shaded); the dashed line is the Watch's nightly average.</p>\n    </div>\n    <div class=\"tiles\" id=\"b-tiles\"></div>\n  </section>\n\n  <!-- C \u00b7 analysis -->\n  <section id=\"tab-c\" hidden style=\"display:flex;flex-direction:column;gap:20px\">\n    <div class=\"card caveat\"><p class=\"note\" style=\"margin:0;color:var(--ink2)\"><b>Read this as a conversation starter, not a diagnosis.</b> Consumer sensors, a small number of nights, and clocks that may drift by minutes between devices. Worth bringing to your sleep clinician, especially finding 3.</p></div>\n    <div class=\"card finding\">\n      <div><div class=\"eyebrow\">1 \u00b7 COVERAGE</div><div class=\"big\" id=\"c1-big\"></div></div>\n      <svg class=\"chart\" id=\"c1\" height=\"96\" role=\"img\" aria-label=\"Which data sources exist for each night\"></svg>\n    </div>\n    <div class=\"row\">\n      <div class=\"card finding grow\">\n        <div><div class=\"eyebrow\">2 \u00b7 MASK TIME VS SLEEP</div><div class=\"big\" id=\"c2-big\"></div></div>\n        <div class=\"legend\"><span><i class=\"sw\" style=\"background:#D5D9E0\"></i>Asleep (Apple Watch)</span><span><i class=\"sw\" style=\"background:var(--oa)\"></i>Mask on (ResMed)</span></div>\n        <svg class=\"chart\" id=\"c2\" height=\"200\" role=\"img\" aria-label=\"Apple sleep time and CPAP mask time per night\"></svg>\n      </div>\n      <div class=\"card finding side\">\n        <div><div class=\"eyebrow\">3 \u00b7 WHEN EVENTS HAPPEN</div><div class=\"big\" id=\"c3-big\"></div></div>\n        <svg class=\"chart\" id=\"c3\" height=\"210\" role=\"img\" aria-label=\"Apnea events per hour of mask time by Apple sleep stage\"></svg>\n        <p class=\"note\" id=\"c3-note\" style=\"margin:0\"></p>\n      </div>\n    </div>\n    <div class=\"row\">\n      <div class=\"card finding grow\">\n        <div><div class=\"eyebrow\">4 \u00b7 DOES A CPAP NIGHT SLEEP DIFFERENTLY?</div><div class=\"big\" id=\"c4-big\"></div></div>\n        <div class=\"scroll\"><table id=\"c4\"></table></div>\n        <p class=\"note\" style=\"margin:0\">Nights from the CPAP data window only, so season and routine are similar. Small groups: treat differences under ~10 minutes as noise.</p>\n      </div>\n      <div class=\"card finding side\">\n        <div><div class=\"eyebrow\">5 \u00b7 WATCH VS RING SpO\u2082</div><div class=\"big\" id=\"c5-big\"></div></div>\n        <div class=\"legend\"><span><i class=\"sw\" style=\"background:var(--ink);border-radius:50%\"></i>Ring lowest</span><span><i class=\"sw\" style=\"background:var(--core);border-radius:50%\"></i>Watch lowest</span></div>\n        <svg class=\"chart\" id=\"c5\" height=\"260\" role=\"img\" aria-label=\"Lowest SpO2 per night, ring versus watch\"></svg>\n      </div>\n    </div>\n    <div class=\"card finding\">\n      <div><div class=\"eyebrow\">6 \u00b7 TREND</div><div class=\"big\" id=\"c6-big\"></div></div>\n      <div class=\"legend\"><span><i class=\"sw\" style=\"background:var(--ca)\"></i>Central index</span><span><i class=\"sw\" style=\"background:var(--oa)\"></i>Obstructive index</span><span><i class=\"sw\" style=\"background:var(--ot)\"></i>Other</span></div>\n      <svg class=\"chart\" id=\"c6\" height=\"180\" role=\"img\" aria-label=\"Average apnea index per month by type\"></svg>\n    </div>\n  </section>\n";

  function mount(root, A, NJ) {
    if (!document.getElementById('br-style')) { const st = document.createElement('style'); st.id = 'br-style'; st.textContent = STYLE; document.head.appendChild(st); }
    if (!document.getElementById('tip')) { const t = document.createElement('div'); t.id = 'tip'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    root.innerHTML = '<div class="br">' + MARKUP + '</div>';
    const $ = id => document.getElementById(id);
    const NS = 'http://www.w3.org/2000/svg';
    const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const C = { deep:'#F5D04A', core:'#3C69D9', rem:'#8FC3F2', awake:'#EC8546', bed:'#C9CED6', ca:'#C2410C', oa:'#0D9488', ua:'#8B5CF6', h:'#8B5CF6', mask:'#0F172A', ink:'#111418', grid:'#EEF0F3', muted:'#5A6170' };
    const EVN = { ca:'Central apnea', oa:'Obstructive apnea', ua:'Unclassified apnea', h:'Hypopnea', ar:'Arousal' };
    const APNEA = new Set(['ca','oa','ua','h']);

    // ---------- helpers
    const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
    const clear = svg => { while (svg.firstChild) svg.removeChild(svg.firstChild); return svg.clientWidth || svg.getBoundingClientRect().width || 800; };
    const dd = s => { const p = s.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])); };
    const iso = t => new Date(t).toISOString().slice(0, 10);
    const addDays = (s, k) => iso(dd(s).getTime() + k * 864e5);
    const lab = s => { const d = dd(s); return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
    const short = s => { const d = dd(s); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
    const dur = m => { if (m == null) return '—'; m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? h + 'h ' + String(r).padStart(2, '0') + 'm' : r + 'm'; };
    const clock = m => { const t = ((Math.round(21 * 60 + m) % 1440) + 1440) % 1440, h = Math.floor(t / 60), mm = t % 60; return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
    const hourLab = m => { const t = ((Math.round(21 * 60 + m) % 1440) + 1440) % 1440, h = Math.floor(t / 60); return (h % 12 || 12) + (h < 12 ? 'a' : 'p'); };
    const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
    const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
    const f1 = v => v == null ? '—' : (Math.round(v * 10) / 10).toFixed(1);
    const asleep = n => (n.deep || 0) + (n.rem || 0) + n.core;
    const tip = $('tip');
    const showTip = (e, html) => { tip.innerHTML = html; tip.style.display = 'block'; const r = tip.getBoundingClientRect(); let x = e.clientX + 14, y = e.clientY + 14; if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 14; if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 14; tip.style.left = x + 'px'; tip.style.top = y + 'px'; };
    const hideTip = () => { tip.style.display = 'none'; };
    const hover = (node, html) => { node.addEventListener('mousemove', e => showTip(e, typeof html === 'function' ? html(e) : html)); node.addEventListener('mouseleave', hideTip); };
    // bar with 4px rounded top, square base
    const barPath = (x, y0, w, h, r = 3) => { if (h <= 0) return ''; r = Math.min(r, w / 2, h); const y = y0 - h; return `M${x},${y0}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y0}Z`; };

    const N = {}; NJ.nights.forEach(n => N[n.d] = n);
    const D = {}; A.cpapDaily.forEach(r => D[r.d] = r);
    const CN = {}; A.cpapNights.forEach(n => CN[n.d] = n);
    const O = {}; A.o2.forEach(o => (O[o.d] = O[o.d] || []).push(o));
    const mainO2 = d => (O[d] || []).filter(o => o.end > -60 && o.start < 900).sort((a, b) => b.hours - a.hours)[0];
    const days = A.cpapDaily.map(r => r.d);
    const first = days[0], last = days[days.length - 1];
    const spanDays = Math.round((dd(last) - dd(first)) / 864e5) + 1;
    $('br-title').textContent = 'CPAP + oximetry, ' + short(first) + ', ' + first.slice(0, 4) + ' – ' + short(last) + ', ' + last.slice(0, 4);
    $('br-cover').textContent = A.cpapDaily.length + ' CPAP NIGHTS · ' + A.cpapNights.length + ' WITH EVENT DETAIL · ' + A.o2.length + ' O2 RING RECORDINGS';

    // stage at minute t for a night
    function stageAt(n, t) {
      if (!n) return 'none';
      for (const s of n.segs) if (s[1] <= t && t < s[2]) return s[3] ? 'awake' : s[0];
      return 'outside';
    }

    // ---------- views
    const drawn = {};
    function show(t) {
      ['a', 'b', 'c'].forEach(k => $('tab-' + k).hidden = k !== t);
      if (!drawn[t]) { drawn[t] = true; ({ a: drawA, b: drawB, c: drawC })[t](); }
    }
    function redraw(t) { for (const k in drawn) drawn[k] = false; show(t); }

    // ================= A · Breathing tab =================
    let aEnd = last;
    function drawA() {
      const used = A.cpapDaily, ge4 = used.filter(r => r.use >= 240);
      const allEv = A.cpapNights.flatMap(n => n.events.filter(e => APNEA.has(e[0])));
      const centralShare = allEv.length ? allEv.filter(e => e[0] === 'ca').length / allEv.length : 0;
      const recent = used.filter(r => r.d >= addDays(last, -29));
      $('a-tiles').innerHTML = [
        [used.length, 'nights with the mask on, of ' + spanDays + ' days since ' + short(first)],
        [Math.round(ge4.length / used.length * 100) + '%', 'of those nights reached 4 h (' + ge4.length + ' nights)'],
        [dur(median(used.map(r => r.use))), 'median mask time on nights used'],
        [f1(median(used.map(r => r.ahi))), 'median AHI (events per hour)'],
        [Math.round(centralShare * 100) + '%', 'of logged apneas were central (' + allEv.length + ' events)'],
        [recent.length + '/30', 'nights used in the last 30 days of data']
      ].map(t => `<div class="tile"><div class="v">${t[0]}</div><div class="l">${t[1]}</div></div>`).join('');
      drawAWindow();
      // months
      const by = {}; used.forEach(r => (by[r.d.slice(0, 7)] = by[r.d.slice(0, 7)] || []).push(r));
      $('a-months').innerHTML = '<tr><th>Month</th><th>Nights</th><th>≥4 h</th><th>Median use</th><th>Median AHI</th><th>Central</th><th>Obstr.</th></tr>' +
        Object.keys(by).sort().reverse().map(k => { const rs = by[k]; const [y, m] = k.split('-'); return `<tr><td>${MON[m - 1]} ${y}</td><td>${rs.length}</td><td>${rs.filter(r => r.use >= 240).length}</td><td>${dur(median(rs.map(r => r.use)))}</td><td>${f1(median(rs.map(r => r.ahi)))}</td><td>${f1(mean(rs.map(r => r.cai)))}</td><td>${f1(mean(rs.map(r => r.oai)))}</td></tr>`; }).join('');
      $('a-o2').innerHTML = '<tr><th>Night</th><th>Hours</th><th>Avg</th><th>Low</th><th>ODI 3%</th><th>&lt;90%</th><th>CPAP</th></tr>' +
        A.o2.filter(o => o.hours >= 1).slice().reverse().map(o => `<tr><td>${short(o.d)}</td><td>${f1(o.hours)}</td><td>${o.spo2Avg}%</td><td>${o.spo2Min}%</td><td>${f1(o.odi3)} (${f1(o.odi4)})</td><td>${dur(o.below90Min)}</td><td>${D[o.d] ? dur(D[o.d].use) : '—'}</td></tr>`).join('');
    }
    function drawAWindow() {
      const W = 60, start = addDays(aEnd, -(W - 1));
      $('a-range').textContent = short(start) + ' – ' + short(aEnd) + ', ' + aEnd.slice(0, 4) + ' · ' + W + ' nights';
      $('a-prev').disabled = start <= first; $('a-next').disabled = aEnd >= last;
      const list = []; for (let i = 0; i < W; i++) list.push(addDays(start, i));
      const L = 34, R = 8;
      // use
      let svg = $('a-use'), w = clear(svg), H = 170, B = 150, top = 10, pw = (w - L - R) / W, maxH = 9;
      const y = h => B - (h / maxH) * (B - top);
      [0, 2, 4, 6, 8].forEach(h => { el('line', { x1: L, x2: w - R, y1: y(h), y2: y(h), stroke: h === 4 ? '#B4BAC4' : C.grid, 'stroke-dasharray': h === 4 ? '4 3' : '' }, svg); el('text', { x: L - 6, y: y(h) + 4, 'text-anchor': 'end' }, svg).textContent = h + 'h'; });
      list.forEach((d, i) => {
        const r = D[d], x = L + i * pw + 1, bw = Math.max(2, pw - 2);
        if (!r) { el('rect', { x: x + bw / 2 - 1, y: B - 2, width: 2, height: 2, fill: '#C9CED6' }, svg); }
        else { const p = el('path', { d: barPath(x, B, bw, B - y(Math.min(maxH, r.use / 60))), fill: r.use >= 240 ? C.oa : '#99D5CF' }, svg); }
        const hit = el('rect', { x: L + i * pw, y: top, width: pw, height: B - top, fill: 'transparent' }, svg);
        hover(hit, () => r ? `<b>${lab(d)}</b><br><span class="m">Mask on ${dur(r.use)} · AHI ${f1(r.ahi)}<br>Leak 95th ${f1(r.leak95)} L/min · pressure ${f1(r.press50)} cmH₂O</span>` + (N[d] ? `<br><span class="m">Apple: asleep ${dur(asleep(N[d]))}</span>` : '') : `<b>${lab(d)}</b><br><span class="m">CPAP not used</span>`);
        const dt = dd(d); if (dt.getUTCDate() === 1 || dt.getUTCDay() === 1 && pw > 9) el('text', { x: L + i * pw + pw / 2, y: H - 4, 'text-anchor': 'middle' }, svg).textContent = dt.getUTCDate() === 1 ? MON[dt.getUTCMonth()] + ' 1' : dt.getUTCDate();
      });
      el('text', { x: w - R, y: y(4) - 4, 'text-anchor': 'end' }, svg).textContent = '4 h goal';
      // AHI stacked
      svg = $('a-ahi'); w = clear(svg); H = 150; B = 132; top = 8;
      const vals = list.map(d => D[d]).filter(Boolean), maxA = Math.max(5, Math.ceil(Math.max(...vals.map(r => r.ahi), 0) / 5) * 5);
      const ya = v => B - v / maxA * (B - top);
      [0, maxA / 2, maxA].forEach(v => { el('line', { x1: L, x2: w - R, y1: ya(v), y2: ya(v), stroke: C.grid }, svg); el('text', { x: L - 6, y: ya(v) + 4, 'text-anchor': 'end' }, svg).textContent = v; });
      el('line', { x1: L, x2: w - R, y1: ya(5), y2: ya(5), stroke: '#B4BAC4', 'stroke-dasharray': '4 3' }, svg);
      el('text', { x: w - R, y: ya(5) - 4, 'text-anchor': 'end' }, svg).textContent = 'AHI 5';
      list.forEach((d, i) => {
        const r = D[d]; if (!r) return;
        const x = L + i * pw + 1, bw = Math.max(2, pw - 2);
        const parts = [['ca', r.cai], ['oa', r.oai], ['ua', Math.max(0, r.ahi - r.cai - r.oai)]];
        let acc = 0; const segs = parts.filter(p => p[1] > 0);
        segs.forEach((p, k) => { const h0 = ya(acc), h1 = ya(acc + p[1]); acc += p[1]; const gap = k < segs.length - 1 ? 1 : 0; el(k === segs.length - 1 ? 'path' : 'rect', k === segs.length - 1 ? { d: barPath(x, h0, bw, h0 - h1), fill: C[p[0]] } : { x, y: h1 + gap, width: bw, height: Math.max(0, h0 - h1 - gap), fill: C[p[0]] }, svg); });
        const hit = el('rect', { x: L + i * pw, y: top, width: pw, height: B - top, fill: 'transparent' }, svg);
        hover(hit, `<b>${lab(d)}</b><br><span class="m">AHI ${f1(r.ahi)}<br>Central ${f1(r.cai)} · Obstructive ${f1(r.oai)} · Other ${f1(Math.max(0, r.ahi - r.cai - r.oai))}</span>`);
      });
      // leak
      svg = $('a-leak'); w = clear(svg); B = 96; top = 6;
      const maxL = 60, yl = v => B - Math.min(v, maxL) / maxL * (B - top);
      [0, 24, 48].forEach(v => { el('line', { x1: L, x2: w - R, y1: yl(v), y2: yl(v), stroke: v === 24 ? '#B4BAC4' : C.grid, 'stroke-dasharray': v === 24 ? '4 3' : '' }, svg); el('text', { x: L - 6, y: yl(v) + 4, 'text-anchor': 'end' }, svg).textContent = v; });
      el('text', { x: w - R, y: yl(24) - 4, 'text-anchor': 'end' }, svg).textContent = '24 L/min · large leak';
      list.forEach((d, i) => { const r = D[d]; if (!r) return; const cx = L + i * pw + pw / 2; const c = el('circle', { cx, cy: yl(r.leak95), r: 4, fill: r.leak95 >= 24 ? C.ca : C.ink, stroke: '#fff', 'stroke-width': 2 }, svg); const hit = el('rect', { x: L + i * pw, y: top, width: pw, height: B - top, fill: 'transparent' }, svg); hover(hit, `<b>${lab(d)}</b><br><span class="m">Leak 95th ${f1(r.leak95)} L/min · median ${f1(r.leak50)}</span>`); });
    }
    $('a-prev').onclick = () => { aEnd = addDays(aEnd, -60); if (aEnd < addDays(first, 59)) aEnd = addDays(first, 59); drawAWindow(); };
    $('a-next').onclick = () => { aEnd = addDays(aEnd, 60); if (aEnd > last) aEnd = last; drawAWindow(); };

    // ================= B · Night overlay =================
    const overlapNights = Object.keys(Object.assign({}, CN, Object.fromEntries(A.o2.filter(o => o.hours >= 1).map(o => [o.d, 1])))).filter(d => N[d]).sort();
    let bNight = overlapNights.slice().sort((a, b) => score(b) - score(a))[0];
    function score(d) { return (D[d] ? Math.min(D[d].use, 480) : 0) + (mainO2(d) ? mainO2(d).hours * 60 : 0) + (CN[d] ? 60 : 0); }
    function drawB() {
      const pick = $('b-pick');
      pick.innerHTML = overlapNights.slice().reverse().map(d => `<option value="${d}">${short(d)}, ${d.slice(0, 4)} · ${[N[d] ? 'Apple' : '', CN[d] ? 'CPAP' : '', mainO2(d) ? 'Ring' : ''].filter(Boolean).join(' + ')}</option>`).join('');
      pick.value = bNight;
      drawNight();
    }
    $('b-pick').onchange = e => { bNight = e.target.value; drawNight(); };
    $('b-prev').onclick = () => { const i = overlapNights.indexOf(bNight); if (i > 0) { bNight = overlapNights[i - 1]; $('b-pick').value = bNight; drawNight(); } };
    $('b-next').onclick = () => { const i = overlapNights.indexOf(bNight); if (i < overlapNights.length - 1) { bNight = overlapNights[i + 1]; $('b-pick').value = bNight; drawNight(); } };
    function drawNight() {
      const d = bNight, n = N[d], cn = CN[d], o = mainO2(d), r = D[d];
      const i = overlapNights.indexOf(d); $('b-prev').disabled = i <= 0; $('b-next').disabled = i >= overlapNights.length - 1;
      const md = addDays(d, 1);
      $('b-date').textContent = lab(md) + ', ' + md.slice(0, 4);
      $('b-sources').textContent = 'NIGHT OF ' + short(d).toUpperCase() + ' → ' + dd(md).getUTCDate() + ' · ' + ['APPLE WATCH', cn ? 'RESMED' : 'NO RESMED DETAIL', o ? 'O2 RING' : 'NO RING'].join(' · ');
      // time range
      let t0 = n.inBed, t1 = n.outBed;
      if (cn) cn.sessions.forEach(s => { t0 = Math.min(t0, s[0]); t1 = Math.max(t1, s[1]); });
      if (o) { t0 = Math.min(t0, o.start); t1 = Math.max(t1, o.end); }
      t0 = Math.max(-180, Math.floor((t0 - 15) / 60) * 60); t1 = Math.min(960, Math.ceil((t1 + 15) / 60) * 60);
      const svg = $('b-chart'), w = clear(svg), L = 92, R = 12, x = t => L + (t - t0) / (t1 - t0) * (w - L - R);
      // lanes
      const lanes = { hyp: [8, 120], mask: [140, 166], ev: [172, 204], spo: [226, 366], hr: [388, 476] };
      const H = 520;
      for (let t = t0; t <= t1; t += 60) { el('line', { x1: x(t), x2: x(t), y1: 4, y2: 482, stroke: t % 180 === 0 ? '#E1E4E8' : C.grid }, svg); el('text', { x: x(t), y: 500, 'text-anchor': 'middle' }, svg).textContent = hourLab(t); }
      const label = (txt, y) => { const t = el('text', { x: L - 10, y, 'text-anchor': 'end', style: 'font-family:IBM Plex Sans,sans-serif;font-size:12px;fill:#3D4350' }, svg); t.textContent = txt; };
      // hypnogram
      const LN = { awake: 0, bed: 0, rem: 1, core: 2, deep: 3 }, lh = (lanes.hyp[1] - lanes.hyp[0]) / 4;
      ['Awake', 'REM', 'Core', 'Deep'].forEach((s, k) => label(s, lanes.hyp[0] + k * lh + lh / 2 + 4));
      n.segs.forEach(s => el('rect', { x: x(s[1]), y: lanes.hyp[0] + LN[s[0]] * lh + 3, width: Math.max(1, x(s[2]) - x(s[1])), height: lh - 6, rx: 2, fill: s[0] === 'bed' ? C.bed : C[s[0]] }, svg));
      // mask
      label('Mask on', lanes.mask[0] + 17);
      el('rect', { x: L, y: lanes.mask[0] + 6, width: w - L - R, height: 14, fill: C.grid, rx: 2 }, svg);
      if (cn) cn.sessions.forEach(s => el('rect', { x: x(s[0]), y: lanes.mask[0] + 6, width: Math.max(2, x(s[1]) - x(s[0])), height: 14, rx: 2, fill: C.mask }, svg));
      else if (r) el('text', { x: L + 8, y: lanes.mask[0] + 17 }, svg).textContent = 'Used ' + dur(r.use) + ' (no session detail on card)';
      else el('text', { x: L + 8, y: lanes.mask[0] + 17 }, svg).textContent = 'CPAP not used';
      // events
      label('Events', lanes.ev[0] + 20);
      const evs = cn ? cn.events.filter(e => APNEA.has(e[0])) : [];
      evs.forEach(e => el('rect', { x: x(e[1]) - 1.5, y: lanes.ev[0] + (e[0] === 'ca' ? 0 : e[0] === 'oa' ? 11 : 22), width: 3, height: 10, rx: 1, fill: C[e[0]] }, svg));
      // spo2
      label('SpO₂', (lanes.spo[0] + lanes.spo[1]) / 2 + 4);
      const sLo = 84, sHi = 100, ys = v => lanes.spo[1] - (Math.max(sLo, Math.min(sHi, v)) - sLo) / (sHi - sLo) * (lanes.spo[1] - lanes.spo[0]);
      [86, 90, 95, 100].forEach(v => { el('line', { x1: L, x2: w - R, y1: ys(v), y2: ys(v), stroke: v === 90 ? '#B4BAC4' : C.grid, 'stroke-dasharray': v === 90 ? '4 3' : '' }, svg); el('text', { x: L - 46, y: ys(v) + 4, 'text-anchor': 'end' }, svg).textContent = v; });
      if (o) {
        const pts = o.series.filter(p => p[0] >= t0 && p[0] <= t1);
        let area = '', line = '';
        pts.forEach((p, k) => { line += (k ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + ys(p[1]).toFixed(1); });
        pts.forEach((p, k) => { area += (k ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + ys(p[1]).toFixed(1); });
        for (let k = pts.length - 1; k >= 0; k--) area += 'L' + x(pts[k][0]).toFixed(1) + ',' + ys(pts[k][2]).toFixed(1);
        el('path', { d: area + 'Z', fill: '#C9CED6', opacity: .7 }, svg);
        el('path', { d: line, fill: 'none', stroke: C.ink, 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
      } else el('text', { x: L + 8, y: lanes.spo[0] + 20 }, svg).textContent = 'No O2 ring recording this night';
      if (n.spo2 != null) { el('line', { x1: x(n.onset), x2: x(n.wake), y1: ys(n.spo2), y2: ys(n.spo2), stroke: C.core, 'stroke-width': 2, 'stroke-dasharray': '6 4' }, svg); el('text', { x: x(n.wake) - 4, y: ys(n.spo2) - 6, 'text-anchor': 'end', style: 'fill:#2B4FB8' }, svg).textContent = 'Watch avg ' + n.spo2 + '%'; }
      // pulse
      label('Pulse', (lanes.hr[0] + lanes.hr[1]) / 2 + 4);
      if (o) {
        const hs = o.series.filter(p => p[0] >= t0 && p[0] <= t1 && p[3] != null);
        const hLo = Math.min(...hs.map(p => p[3])) - 3, hHi = Math.max(...hs.map(p => p[3])) + 3, yh = v => lanes.hr[1] - (v - hLo) / (hHi - hLo) * (lanes.hr[1] - lanes.hr[0]);
        [Math.round(hLo + 3), Math.round(hHi - 3)].forEach(v => el('text', { x: L - 46, y: yh(v) + 4, 'text-anchor': 'end' }, svg).textContent = v);
        el('path', { d: hs.map((p, k) => (k ? 'L' : 'M') + x(p[0]).toFixed(1) + ',' + yh(p[3]).toFixed(1)).join(''), fill: 'none', stroke: C.ink, 'stroke-width': 1.5, opacity: .8 }, svg);
      } else el('text', { x: L + 8, y: lanes.hr[0] + 20 }, svg).textContent = 'Ring pulse not available';
      // crosshair
      const cross = el('line', { x1: 0, x2: 0, y1: 4, y2: 482, stroke: C.ink, 'stroke-width': 1, visibility: 'hidden' }, svg);
      const hit = el('rect', { x: L, y: 0, width: w - L - R, height: 486, fill: 'transparent' }, svg);
      hit.addEventListener('mousemove', e => {
        const bb = svg.getBoundingClientRect(), t = t0 + (e.clientX - bb.left - L) / (w - L - R) * (t1 - t0);
        cross.setAttribute('x1', x(t)); cross.setAttribute('x2', x(t)); cross.setAttribute('visibility', 'visible');
        const st = stageAt(n, t), on = cn && cn.sessions.some(s => s[0] <= t && t < s[1]);
        const near = evs.filter(ev => Math.abs(ev[1] - t) <= 3);
        const sp = o && o.series.reduce((b, p) => Math.abs(p[0] - t) < Math.abs(b[0] - t) ? p : b, o.series[0]);
        const leak = cn && cn.series.leak && cn.series.leak.reduce((b, p) => Math.abs(p[0] - t) < Math.abs(b[0] - t) ? p : b, cn.series.leak[0]);
        showTip(e, `<b>${clock(t)}</b><br><span class="m">Stage: ${st === 'outside' ? 'outside sleep window' : st === 'bed' ? 'falling asleep' : st}<br>Mask: ${cn ? (on ? 'on' : 'off') : '—'}${on && leak && Math.abs(leak[0] - t) < 2 ? ' · leak ' + f1(leak[1]) + ' L/min' : ''}` +
          (sp && Math.abs(sp[0] - t) < 2 ? `<br>SpO₂ ${f1(sp[1])}% (low ${sp[2]}%) · pulse ${f1(sp[3])}` : '') +
          (near.length ? '<br>' + near.map(ev => EVN[ev[0]] + ' ' + ev[2] + 's at ' + clock(ev[1])).join('<br>') : '') + '</span>');
      });
      hit.addEventListener('mouseleave', () => { cross.setAttribute('visibility', 'hidden'); hideTip(); });
      // tiles
      let onSleep = 0, sleepMin = asleep(n);
      if (cn) cn.sessions.forEach(s => { for (let t = s[0]; t < s[1]; t++) { const st = stageAt(n, t); if (st === 'core' || st === 'deep' || st === 'rem') onSleep++; } });
      const cnt = k => evs.filter(e => e[0] === k).length;
      $('b-tiles').innerHTML = [
        [dur(sleepMin), 'asleep per Apple Watch (' + Math.round(sleepMin / (n.outBed - n.inBed) * 100) + '% efficiency)'],
        [r ? dur(r.use) : '—', 'mask on per ResMed' + (r ? ' · AHI ' + f1(r.ahi) : '')],
        [cn ? Math.round(onSleep / sleepMin * 100) + '%' : '—', 'of Apple-measured sleep covered by the mask'],
        [evs.length, 'events · ' + cnt('ca') + ' central, ' + cnt('oa') + ' obstructive, ' + (cnt('ua') + cnt('h')) + ' other'],
        [o ? o.spo2Min + '%' : '—', o ? 'ring lowest SpO₂ · ODI ' + f1(o.odi3) + '/h · ' + dur(o.below90Min) + ' under 90%' : 'no ring recording'],
        [n.spo2Low != null ? n.spo2Low + '%' : '—', 'Watch lowest SpO₂' + (n.spo2 != null ? ' · avg ' + n.spo2 + '%' : '')]
      ].map(t => `<div class="tile"><div class="v">${t[0]}</div><div class="l">${t[1]}</div></div>`).join('');
    }

    // ================= C · Analysis =================
    function drawC() {
      const lo = '2026-03-20', hi = '2026-05-25';
      // 1 coverage
      { const svg = $('c1'), w = clear(svg), L = 92, R = 8, list = []; for (let d = lo; d <= hi; d = addDays(d, 1)) list.push(d);
        const pw = (w - L - R) / list.length, rows = [['Apple Watch', d => !!N[d], C.core], ['ResMed', d => !!D[d], C.oa], ['O2 ring', d => !!mainO2(d), C.ink]];
        let all3 = 0; list.forEach(d => { if (rows.every(r => r[1](d))) all3++; });
        rows.forEach((r, k) => { const y = 8 + k * 22; el('text', { x: L - 10, y: y + 11, 'text-anchor': 'end', style: 'font-family:IBM Plex Sans,sans-serif;font-size:12px;fill:#3D4350' }, svg).textContent = r[0];
          list.forEach((d, i) => { const on = r[1](d); el('rect', { x: L + i * pw + 1, y, width: Math.max(1, pw - 2), height: 14, rx: 2, fill: on ? r[2] : C.grid }, svg); }); });
        list.forEach((d, i) => { const dt = dd(d); if (dt.getUTCDate() === 1 || dt.getUTCDay() === 1 && pw > 8) el('text', { x: L + i * pw + pw / 2, y: 90, 'text-anchor': 'middle' }, svg).textContent = dt.getUTCDate() === 1 ? MON[dt.getUTCMonth()] + ' 1' : dt.getUTCDate();
          const h = el('rect', { x: L + i * pw, y: 4, width: pw, height: 70, fill: 'transparent' }, svg); hover(h, `<b>${lab(d)}</b><br><span class="m">${rows.map(r => r[0] + ': ' + (r[1](d) ? 'yes' : '—')).join('<br>')}</span>`); });
        $('c1-big').textContent = all3 + ' nights have all three sources (Apr 1–16); ' + list.filter(d => N[d] && D[d]).length + ' have Apple + CPAP.'; }
      // 2 mask vs sleep
      { const both = days.filter(d => N[d] && d >= '2026-01-01'), svg = $('c2'), w = clear(svg), L = 34, R = 8, B = 176, top = 8, pw = (w - L - R) / both.length, mx = 10 * 60, y = m => B - Math.min(m, mx) / mx * (B - top);
        const ratios = both.map(d => D[d].use / asleep(N[d]));
        [0, 4, 8].forEach(h => { el('line', { x1: L, x2: w - R, y1: y(h * 60), y2: y(h * 60), stroke: C.grid }, svg); el('text', { x: L - 6, y: y(h * 60) + 4, 'text-anchor': 'end' }, svg).textContent = h + 'h'; });
        both.forEach((d, i) => { const xx = L + i * pw, bw = Math.max(2, pw - 2), a = asleep(N[d]), u = D[d].use;
          el('path', { d: barPath(xx + 1, B, bw, B - y(a)), fill: '#D5D9E0' }, svg);
          el('path', { d: barPath(xx + 1 + bw * .25, B, bw * .5, B - y(u)), fill: C.oa }, svg);
          const h = el('rect', { x: xx, y: top, width: pw, height: B - top, fill: 'transparent' }, svg); hover(h, `<b>${lab(d)}</b><br><span class="m">Asleep ${dur(a)} · mask ${dur(u)} (${Math.round(u / a * 100)}%)</span>`);
          const dt = dd(d); if (i === 0 || dt.getUTCDate() <= 1 || both[i - 1].slice(0, 7) !== d.slice(0, 7)) el('text', { x: xx + pw / 2, y: 194, 'text-anchor': 'start' }, svg).textContent = MON[dt.getUTCMonth()];
        });
        $('c2-big').textContent = 'On CPAP nights in 2026 the mask covered a median ' + Math.round(median(ratios) * 100) + '% of your sleep; it reached 4 h on ' + both.filter(d => D[d].use >= 240).length + ' of ' + both.length + ' nights.'; }
      // 3 events by stage
      { const tot = {}, ev = {}, ORDER = [['outside', 'Before sleep / after wake'], ['awake', 'Awake in the night'], ['bed', 'Falling asleep'], ['core', 'Core'], ['rem', 'REM'], ['deep', 'Deep']];
        let fH = 0, fN = 0, lH = 0, lN = 0;
        A.cpapNights.forEach(cn => { const n = N[cn.d]; if (!n) return;
          cn.sessions.forEach(s => { for (let t = s[0]; t < s[1]; t++) { const st = stageAt(n, t); tot[st] = (tot[st] || 0) + 1; } fH += Math.min(60, s[1] - s[0]); lH += Math.max(0, s[1] - s[0] - 60);
            cn.events.forEach(e => { if (APNEA.has(e[0]) && s[0] <= e[1] && e[1] < s[1]) { if (e[1] - s[0] < 60) fN++; else lN++; } }); });
          cn.events.forEach(e => { if (APNEA.has(e[0]) && cn.sessions.some(s => s[0] <= e[1] && e[1] < s[1])) { const st = stageAt(n, e[1]); (ev[st] = ev[st] || { n: 0, ca: 0 }).n++; if (e[0] === 'ca') ev[st].ca++; } }); });
        const rows = ORDER.filter(o => tot[o[0]] >= 60).map(o => ({ k: o[0], l: o[1], rate: (ev[o[0]] ? ev[o[0]].n : 0) / (tot[o[0]] / 60), n: ev[o[0]] ? ev[o[0]].n : 0, h: tot[o[0]] / 60, ca: ev[o[0]] ? ev[o[0]].ca : 0 }));
        const svg = $('c3'), w = clear(svg), L = 150, R = 48, bh = 22, mx = Math.max(...rows.map(r => r.rate)) * 1.05;
        rows.forEach((r, i) => { const yy = 6 + i * 32; el('text', { x: L - 10, y: yy + 15, 'text-anchor': 'end', style: 'font-family:IBM Plex Sans,sans-serif;font-size:12px;fill:#3D4350' }, svg).textContent = r.l;
          el('rect', { x: L, y: yy, width: Math.max(2, (w - L - R) * r.rate / mx), height: bh, rx: 3, fill: r.k === 'core' || r.k === 'deep' || r.k === 'rem' ? C.core : C.ca }, svg);
          el('text', { x: L + (w - L - R) * r.rate / mx + 6, y: yy + 15 }, svg).textContent = f1(r.rate);
          const h = el('rect', { x: 0, y: yy - 4, width: w, height: 30, fill: 'transparent' }, svg); hover(h, `<b>${r.l}</b><br><span class="m">${r.n} events in ${f1(r.h)} h of mask time = ${f1(r.rate)}/h<br>${r.ca} central</span>`); });
        el('text', { x: L, y: 6 + rows.length * 32 + 8 }, svg).textContent = 'events per hour of mask time';
        $('c3-big').textContent = 'Events cluster at the edges of sleep: ' + f1(fN / (fH / 60)) + '/h in the first hour of each mask session vs ' + f1(lN / (lH / 60)) + '/h after.';
        $('c3-note').textContent = 'Stage comes from the Apple Watch at the event minute. Most of these are central apneas, which often appear at the sleep–wake transition; in established sleep (Core/REM/Deep) the rate is much lower.'; }
      // 4 groups
      { const win = Object.keys(N).filter(d => d >= days.find(x => x >= '2026-01-01') && d <= last);
        const G = [['Mask ≥ 4 h', d => D[d] && D[d].use >= 240], ['Mask < 4 h', d => D[d] && D[d].use < 240], ['No CPAP', d => !D[d]]];
        const M = [['Asleep', n => asleep(n), dur, 1], ['Efficiency', n => asleep(n) / (n.outBed - n.inBed) * 100, v => f1(v) + '%', 1], ['Awake', n => n.awake, dur, -1], ['Wake-ups', n => n.wakeups, f1, -1], ['Deep', n => n.deep, dur, 1], ['REM', n => n.rem, dur, 1], ['Sleeping HR', n => n.hr, v => f1(v) + ' bpm', -1], ['HRV', n => n.hrv, v => f1(v) + ' ms', 1], ['Breathing rate', n => n.rr, f1, 0]];
        const grp = G.map(g => win.filter(g[1]).map(d => N[d]));
        const val = (ns, f) => mean(ns.map(f).filter(v => v != null && isFinite(v)));
        $('c4').innerHTML = '<tr><th>Metric</th>' + G.map((g, k) => `<th>${g[0]}<br><span style="color:#5A6170">n=${grp[k].length}</span></th>`).join('') + '<th>≥4 h vs none</th></tr>' +
          M.map(m => { const v = grp.map(ns => val(ns, m[1])), dlt = v[0] != null && v[2] != null ? v[0] - v[2] : null, good = dlt != null && m[3] !== 0 && dlt * m[3] > 0;
            return `<tr><td style="font-family:IBM Plex Sans,sans-serif">${m[0]}</td>${v.map(x => `<td>${x == null ? '—' : m[2](x)}</td>`).join('')}<td style="font-weight:600;color:${dlt == null || m[3] === 0 ? '#5A6170' : good ? '#2459C6' : '#B45314'}">${dlt == null ? '—' : (dlt > 0 ? '▲' : '▼') + (m[2] === dur ? dur(Math.abs(dlt)) : f1(Math.abs(dlt)))}</td></tr>`; }).join('');
        const deepD = val(grp[0], n => n.deep) - val(grp[2], n => n.deep);
        $('c4-big').textContent = 'Long CPAP nights show ' + dur(Math.abs(deepD)) + (deepD > 0 ? ' more' : ' less') + ' deep sleep than nights without it; most other differences are small.'; }
      // 5 watch vs ring
      { const pairs = Object.keys(O).filter(d => N[d] && mainO2(d) && N[d].spo2Low != null).sort().map(d => ({ d, ring: mainO2(d).spo2Min, watch: N[d].spo2Low, ra: mainO2(d).spo2Avg, wa: N[d].spo2 }));
        const svg = $('c5'), w = clear(svg), L = 64, R = 30, top = 6, lo = 80, hi = 100, x = v => L + (v - lo) / (hi - lo) * (w - L - R), rh = Math.min(22, (240 - top) / pairs.length);
        [80, 85, 90, 95, 100].forEach(v => { el('line', { x1: x(v), x2: x(v), y1: top, y2: top + pairs.length * rh, stroke: v === 90 ? '#B4BAC4' : C.grid, 'stroke-dasharray': v === 90 ? '4 3' : '' }, svg); el('text', { x: x(v), y: top + pairs.length * rh + 14, 'text-anchor': 'middle' }, svg).textContent = v + '%'; });
        pairs.forEach((p, i) => { const yy = top + i * rh + rh / 2;
          el('text', { x: L - 8, y: yy + 4, 'text-anchor': 'end' }, svg).textContent = short(p.d);
          el('line', { x1: x(Math.max(lo, p.ring)), x2: x(p.watch), y1: yy, y2: yy, stroke: '#C9CED6', 'stroke-width': 2 }, svg);
          el('circle', { cx: x(Math.max(lo, p.ring)), cy: yy, r: 5, fill: C.ink, stroke: '#fff', 'stroke-width': 2 }, svg);
          el('circle', { cx: x(p.watch), cy: yy, r: 5, fill: C.core, stroke: '#fff', 'stroke-width': 2 }, svg);
          if (p.ring < lo) el('text', { x: x(lo) - 4, y: yy + 4, 'text-anchor': 'end' }, svg).textContent = p.ring + '←';
          const h = el('rect', { x: 0, y: yy - rh / 2, width: w, height: rh, fill: 'transparent' }, svg); hover(h, `<b>${lab(p.d)}</b><br><span class="m">Lowest: ring ${p.ring}% · Watch ${p.watch}%<br>Average: ring ${p.ra}% · Watch ${p.wa}%</span>`); });
        const gap = mean(pairs.map(p => p.watch - p.ring)), ag = mean(pairs.map(p => p.wa - p.ra));
        $('c5-big').textContent = 'The Watch\'s lowest reading sat ' + f1(gap) + ' points above the ring\'s on the same nights (averages differ by ' + f1(ag) + '). The Watch samples occasionally and misses brief dips.'; }
      // 6 monthly trend
      { const by = {}; A.cpapDaily.forEach(r => (by[r.d.slice(0, 7)] = by[r.d.slice(0, 7)] || []).push(r));
        const ms = Object.keys(by).sort(), svg = $('c6'), w = clear(svg), L = 34, R = 8, B = 150, top = 8, pw = (w - L - R) / ms.length;
        const rows = ms.map(m => { const rs = by[m]; const ca = mean(rs.map(r => r.cai)), oa = mean(rs.map(r => r.oai)), ah = mean(rs.map(r => r.ahi)); return { m, ca, oa, ot: Math.max(0, ah - ca - oa), ah, n: rs.length }; });
        const mx = Math.ceil(Math.max(...rows.map(r => r.ah)) / 2) * 2, y = v => B - v / mx * (B - top);
        [0, mx / 2, mx].forEach(v => { el('line', { x1: L, x2: w - R, y1: y(v), y2: y(v), stroke: C.grid }, svg); el('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end' }, svg).textContent = v; });
        rows.forEach((r, i) => { const xx = L + i * pw + pw * .2, bw = pw * .6; let acc = 0; const parts = [['ca', r.ca], ['oa', r.oa], ['ua', r.ot]].filter(p => p[1] > 0);
          parts.forEach((p, k) => { const h0 = y(acc), h1 = y(acc + p[1]); acc += p[1]; if (k === parts.length - 1) el('path', { d: barPath(xx, h0, bw, h0 - h1), fill: C[p[0]] }, svg); else el('rect', { x: xx, y: h1 + 2, width: bw, height: Math.max(0, h0 - h1 - 2), fill: C[p[0]] }, svg); });
          const [yy, mm] = r.m.split('-'); el('text', { x: xx + bw / 2, y: 168, 'text-anchor': 'middle' }, svg).textContent = MON[mm - 1] + (mm === '01' || i === 0 ? ' ’' + yy.slice(2) : '');
          const h = el('rect', { x: L + i * pw, y: top, width: pw, height: B - top, fill: 'transparent' }, svg); hover(h, `<b>${MON[mm - 1]} ${yy}</b> · ${r.n} nights<br><span class="m">Avg AHI ${f1(r.ah)}<br>Central ${f1(r.ca)} · Obstructive ${f1(r.oa)} · Other ${f1(r.ot)}</span>`); });
        const caShare = mean(rows.map(r => r.ah ? r.ca / r.ah : 0));
        $('c6-big').textContent = 'Central events make up most of the residual AHI in nearly every month (' + Math.round(caShare * 100) + '% on average); obstructive events stay low on therapy.'; }
    }


    return { show, redraw };
  }
  window.BreathingViews = { mount };
})();
