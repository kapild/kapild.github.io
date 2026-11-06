// Nightly timeline with CPAP + O2 ring, shown on the sleep report under the artboard.
//   A · on the sleep bar   mask-on rail, event lines and the SpO2 trace drawn over each night's bar
//   B · extra column       a slim breathing column next to each night's bar, on the same clock
// Drag a box to zoom into a time range (all nights stay, or only the nights in the box).
// The CPAP / O2 ring checkboxes gray out timeline nights and calendar days that lack that data.
// index.html calls NightlyTimeline.mount(root, nightsJson, apneaJson) once, then .redraw() on resize.
(function () {
  const STYLE = `
.tl{--bg:#F1F2F4;--card:#FFFFFF;--line:#D9DCE1;--grid:#EEF0F3;--ink:#111418;--ink2:#3D4350;--muted:#5A6170;--accent:#2459C6;
  --deep:#3F33A8;--core:#3C69D9;--rem:#8FC3F2;--awake:#EC8546;--hatch:#B4BAC4;
  --mask:#E9B730;--maskbg:rgba(233,183,48,.22);--spo2:#C7304A;
  --ev-oa:#C7304A;--ev-ca:#111418;--ev-h:#EC8546;--ev-ua:#7C8597;
  --gray:#E6E8EC;--grayfg:#A3A9B4;--hl:rgba(36,89,198,.08);--mono:'IBM Plex Mono',ui-monospace,monospace;
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:14px;color:var(--ink);display:flex;flex-direction:column;gap:16px}
.tl .card{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:20px 22px;min-width:0}
.tl h2{margin:0;font-size:16px;font-weight:600}
.tl .sub{font-family:var(--mono);font-size:12px;color:var(--muted);margin-top:2px}
.tl .row{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:flex-end;justify-content:space-between}
.tl .grp{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.tl .lbl{font-family:var(--mono);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.tl .seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--ink);border-radius:4px;overflow:hidden}
.tl .seg button{border:0;min-height:40px;padding:0 14px;font:inherit;font-size:13px;font-weight:600;background:#fff;color:var(--ink);cursor:pointer}
.tl .seg button[aria-pressed="true"]{background:var(--ink);color:#fff}
.tl .seg.small button{min-height:32px;font-size:12px;padding:0 10px}
.tl .navbtn{width:40px;min-height:40px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);cursor:pointer;font:inherit;font-size:16px}
.tl .navbtn:disabled{opacity:.35;cursor:default}
.tl .mini{border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);min-height:32px;padding:0 10px;font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.tl .mini:hover{border-color:var(--ink)}
.tl .chk{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 12px;border:1px solid var(--line);border-radius:4px;cursor:pointer;font-size:13px;font-weight:600;user-select:none}
.tl .chk input{width:16px;height:16px;margin:0;accent-color:var(--accent)}
.tl .sw{display:inline-block;width:12px;height:12px;border-radius:2px;vertical-align:-1px}
.tl button:focus-visible,.tl .chk:focus-within{outline:2px solid var(--accent);outline-offset:2px}
.tl .legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--ink2);align-items:center}
.tl .legend span{display:inline-flex;align-items:center;gap:6px}
.tl .legend.small{font-family:var(--mono);font-size:12px;color:var(--muted)}
.tl .hint{font-family:var(--mono);font-size:12px;color:var(--muted)}
.tl .zoombar{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:8px 10px;border:1px solid var(--accent);border-radius:4px;background:var(--hl);font-size:13px;font-weight:600}
.tl .scroll{overflow-x:auto}
.tl svg.chart{display:block;width:100%;min-width:560px;height:auto;touch-action:none;cursor:crosshair}
.tl svg text{font-family:var(--mono);font-size:11px;fill:var(--muted)}
.tl .readout{font-family:var(--mono);font-size:12.5px;line-height:1.5;color:var(--muted);min-height:38px}
.tl .readout b{color:var(--ink)}
.tl .months{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px}
.tl .mname{font-size:13px;font-weight:600;margin-bottom:6px}
.tl .grid7{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.tl .wd{font-family:var(--mono);font-size:11px;color:var(--muted);text-align:center;padding-bottom:2px}
.tl .day{height:44px;border:1px solid var(--line);border-radius:3px;background:#fff;color:var(--ink);padding:4px 5px;display:flex;flex-direction:column;justify-content:space-between;text-align:left;cursor:pointer;font-family:var(--mono);font-size:11px}
.tl .day:hover{border-color:var(--ink)}
.tl .day .dots{display:flex;gap:3px}
.tl .day .dots span{width:7px;height:7px;border-radius:50%;background:var(--grid)}
.tl .day.sel{border:2px solid var(--accent);padding:3px 4px}
.tl .day.inwin{box-shadow:inset 0 -3px 0 var(--accent)}
.tl .day.off{background:var(--gray);color:var(--grayfg);border-style:dashed;cursor:not-allowed;background-image:repeating-linear-gradient(135deg,transparent 0 5px,var(--line) 5px 6px)}
.tl .day.off .dots span{opacity:.45}
.tl [hidden]{display:none!important}`;

  const MARKUP = `
<section class="card" aria-label="Nightly timeline with CPAP and O2 ring">
  <div class="row" style="align-items:flex-start;margin-bottom:14px">
    <div>
      <h2>Nightly timeline + breathing</h2>
      <div class="sub" id="tl-range"></div>
    </div>
    <div class="grp">
      <div class="seg" role="group" aria-label="Window">
        <button type="button" data-n="7">7 nights</button>
        <button type="button" data-n="14">14 nights</button>
        <button type="button" data-n="30">30 nights</button>
        <button type="button" data-n="90">90 nights</button>
      </div>
      <button type="button" class="navbtn" id="tl-prev" aria-label="Earlier nights">‹</button>
      <button type="button" class="navbtn" id="tl-next" aria-label="Later nights">›</button>
    </div>
  </div>
  <div class="row" style="margin-bottom:14px">
    <div class="grp" style="gap:12px 24px;align-items:flex-end">
      <div>
        <div class="lbl">Breathing data</div>
        <div class="seg" role="group" aria-label="How to show breathing data">
          <button type="button" id="tl-m-overlay" aria-pressed="true">On the sleep bar</button>
          <button type="button" id="tl-m-column" aria-pressed="false">Extra column per night</button>
        </div>
      </div>
      <div>
        <div class="lbl">Add</div>
        <div class="grp">
          <label class="chk"><input type="checkbox" id="tl-cpap" checked><span class="sw" style="background:var(--mask)"></span>CPAP</label>
          <label class="chk"><input type="checkbox" id="tl-o2" checked><span class="sw" style="background:var(--spo2)"></span>O2 ring</label>
        </div>
      </div>
    </div>
    <div class="grp">
      <button type="button" class="mini" id="tl-jump-breath">Latest night with all 3</button>
      <button type="button" class="mini" id="tl-jump-latest">Latest nights</button>
    </div>
  </div>
  <div class="legend" style="margin-bottom:8px">
    <span><i class="sw" style="background:var(--deep)"></i>Deep</span>
    <span><i class="sw" style="background:var(--core)"></i>Core</span>
    <span><i class="sw" style="background:var(--rem)"></i>REM</span>
    <span><i class="sw" style="background:var(--awake)"></i>Awake</span>
    <span><i class="sw" style="background:repeating-linear-gradient(135deg,var(--hatch) 0 2px,transparent 2px 4px)"></i>In bed, not asleep</span>
  </div>
  <div class="legend small" id="tl-blegend" style="margin-bottom:10px"></div>
  <div class="row" style="align-items:center;margin-bottom:8px">
    <div class="grp hint">Drag to zoom:
      <div class="seg small" role="group" aria-label="What a drag zooms">
        <button type="button" id="tl-zn-off" aria-pressed="true">Hours, keep all nights</button>
        <button type="button" id="tl-zn-on" aria-pressed="false">Hours + selected nights</button>
      </div>
    </div>
    <div class="grp hint">Quick zoom:
      <button type="button" class="mini" data-z="-30,270">Falling asleep (8:30 PM–2 AM)</button>
      <button type="button" class="mini" data-z="180,600">Middle of night (12–7 AM)</button>
      <button type="button" class="mini" data-z="480,900">Waking up (5 AM–12 PM)</button>
    </div>
  </div>
  <div class="zoombar" id="tl-zoombar" hidden style="margin-bottom:8px"><span id="tl-zoomtxt"></span><button type="button" class="mini" id="tl-zback">← Back</button><button type="button" class="mini" id="tl-zreset">Reset zoom</button><span class="hint" style="font-weight:400">Esc goes back · double-click resets</span></div>
  <div class="scroll" id="tl-chart"></div>
  <div class="readout" id="tl-readout" style="margin-top:8px"></div>
</section>
<section class="card" aria-label="Breathing data calendar">
  <div class="row" style="align-items:flex-start;margin-bottom:12px">
    <div>
      <h2>Which nights have what</h2>
      <div class="sub" id="tl-cal-sub"></div>
    </div>
    <div class="grp">
      <div class="legend small">
        <span><i class="sw" style="border-radius:50%;background:var(--deep)"></i>sleep</span>
        <span><i class="sw" style="border-radius:50%;background:var(--mask)"></i>CPAP</span>
        <span><i class="sw" style="border-radius:50%;background:var(--spo2)"></i>O2 ring</span>
        <span><i class="sw" style="background:var(--gray);border:1px dashed var(--grayfg)"></i>missing a checked source</span>
      </div>
      <button type="button" class="navbtn" id="tl-cal-prev" aria-label="Earlier months">‹</button>
      <button type="button" class="navbtn" id="tl-cal-next" aria-label="Later months">›</button>
    </div>
  </div>
  <div class="months" id="tl-months"></div>
</section>`;

  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const STAGE = { deep: '--deep', core: '--core', rem: '--rem', awake: '--awake' };
  const EVK = { oa: ['--ev-oa', 'obstructive'], ca: ['--ev-ca', 'central'], h: ['--ev-h', 'hypopnea'], ua: ['--ev-ua', 'unclassified'] };
  const FULL = [-60, 900];             // minutes from 9 PM: 8 PM … 12 PM next day

  const el = (tag, a, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const dd = s => { const p = s.split('-'); return new Date(Date.UTC(+p[0], p[1] - 1, +p[2])); };
  const iso = t => new Date(t).toISOString().slice(0, 10);
  const addDays = (s, k) => iso(dd(s).getTime() + k * 864e5);
  const short = s => { const d = dd(s); return MON[d.getUTCMonth()] + ' ' + d.getUTCDate(); };
  const longd = s => { const d = dd(s); return DOW[d.getUTCDay()] + ', ' + MON[d.getUTCMonth()] + ' ' + d.getUTCDate() + ', ' + d.getUTCFullYear(); };
  const dowDay = s => { const d = dd(s); return DOW[d.getUTCDay()] + ' ' + d.getUTCDate(); };
  const hm = m => Math.floor(m / 60) + 'h ' + String(Math.round(m % 60)).padStart(2, '0') + 'm';
  const clock = m => { const t = ((21 * 60 + Math.round(m)) % 1440 + 1440) % 1440, h = Math.floor(t / 60), mm = t % 60; return (h % 12 || 12) + (mm ? ':' + String(mm).padStart(2, '0') : '') + (h < 12 ? ' AM' : ' PM'); };

  function mount(root, NJ, A) {
    if (!document.getElementById('tl-style')) { const st = document.createElement('style'); st.id = 'tl-style'; st.textContent = STYLE; document.head.appendChild(st); }
    root.innerHTML = '<div class="tl">' + MARKUP + '</div>';
    const host = root.firstChild;
    const $ = id => document.getElementById(id);
    const css = n => getComputedStyle(host).getPropertyValue(n).trim();

    // ---------- data
    const sleep = {}, cpap = {}, o2 = {}, daily = {};
    (NJ.nights || []).forEach(n => { sleep[n.d] = n; });
    (A.cpapDaily || []).forEach(c => { if (c.use > 0) daily[c.d] = c; });
    (A.cpapNights || []).forEach(c => { cpap[c.d] = c; });
    (A.o2 || []).forEach(o => { o2[o.d] = o; });
    const cpapDays = new Set([...Object.keys(daily), ...Object.keys(cpap)]);
    const has = d => ({ sleep: !!sleep[d], cpap: cpapDays.has(d), o2: !!o2[d] });
    const allDates = [...new Set([...Object.keys(sleep), ...cpapDays, ...Object.keys(o2)])].sort();
    const FIRST = allDates[0], LAST = allDates[allDates.length - 1];
    const breathDates = [...cpapDays, ...Object.keys(o2)].sort();
    const LAST_BREATH = breathDates[breathDates.length - 1] || LAST;
    // open on the latest night that has sleep + CPAP + ring, so the default view isn't all grayed out
    const ALL3 = Object.keys(o2).filter(d => sleep[d] && cpapDays.has(d)).sort().pop() || LAST_BREATH;

    const S = { mode: 'overlay', src: { cpap: true, o2: true }, n: 30, end: addDays(ALL3, 7), sel: ALL3,
      t0: FULL[0], t1: FULL[1], zoomed: false, zoomNights: false, hist: [], calEnd: ALL3.slice(0, 7) };
    const ok = d => { const h = has(d); return h.sleep && (!S.src.cpap || h.cpap) && (!S.src.o2 || h.o2); };
    const clampEnd = () => { if (S.end > LAST) S.end = LAST; if (addDays(S.end, -(S.n - 1)) < FIRST) S.end = addDays(FIRST, S.n - 1); };
    const followCal = () => { S.calEnd = S.end.slice(0, 7); };

    // ---------- timeline
    function legend() {
      const b = [];
      if (S.src.cpap) b.push(`<span><i class="sw" style="background:var(--mask)"></i>${S.mode === 'overlay' ? 'mask on (rail on the left of the bar)' : 'mask on (shading)'}</span>`,
        ...Object.values(EVK).map(([c, l]) => `<span><i class="sw" style="height:3px;background:var(${c})"></i>${l}</span>`));
      if (S.src.o2) b.push('<span><i class="sw" style="height:2px;background:var(--spo2)"></i>SpO₂ trace (85–100%, dotted line at 90%)</span>');
      b.push('<span>AHI chip · SpO₂-min dot (red when under 89%)</span>');
      $('tl-blegend').innerHTML = b.join('');
    }

    function draw() {
      legend();
      const nights = []; for (let i = S.n - 1; i >= 0; i--) nights.push(addDays(S.end, -i));
      $('tl-range').textContent = `${short(nights[0])} – ${short(nights[nights.length - 1])}, ${nights[nights.length - 1].slice(0, 4)} · ${S.n} nights`;
      $('tl-prev').disabled = nights[0] <= FIRST; $('tl-next').disabled = S.end >= LAST;
      host.querySelectorAll('[data-n]').forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.n === S.n && !(S.zoomed && S.zoomNights))));
      $('tl-zoombar').hidden = !S.zoomed;
      $('tl-zoomtxt').textContent = S.zoomed ? `Zoomed to ${clock(S.t0)} – ${clock(S.t1)} · ${S.n} night${S.n > 1 ? 's' : ''}` : '';

      const box = $('tl-chart'); box.innerHTML = '';
      const W = Math.max(560, box.clientWidth || 900), L = 64, R = 8, TOP = 52, PH = 620, BOT = 26, H = TOP + PH + BOT;
      const svg = el('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Nightly timeline of sleep stages with CPAP and O2 ring data' }, box);
      const defs = el('defs', {}, svg);
      const pat = el('pattern', { id: 'tl-hatch', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      el('rect', { width: 2, height: 5, fill: css('--hatch') }, pat);
      const clip = el('clipPath', { id: 'tl-plot' }, defs); el('rect', { x: L, y: TOP, width: W - L - R, height: PH }, clip);
      const T0 = S.t0, span = S.t1 - S.t0, y = m => TOP + (m - T0) / span * PH, sw = (W - L - R) / S.n;

      const stepM = span <= 90 ? 10 : span <= 180 ? 15 : span <= 420 ? 30 : 60, every = span > 600 ? 2 : 1;
      for (let m = Math.ceil(T0 / stepM) * stepM, k = 0; m <= S.t1; m += stepM, k++) {
        const mid = m === 180;
        el('line', { x1: L, x2: W - R, y1: y(m), y2: y(m), stroke: css(mid ? '--hatch' : '--grid') }, svg);
        if (k % every === 0) el('text', { x: L - 8, y: y(m) + 4, 'text-anchor': 'end', style: mid ? 'font-weight:600;fill:' + css('--ink') : '' }, svg).textContent = clock(m);
      }
      el('text', { x: L - 8, y: 18, 'text-anchor': 'end' }, svg).textContent = 'AHI';
      el('text', { x: L - 8, y: 38, 'text-anchor': 'end' }, svg).textContent = 'SpO₂ min';

      const col = S.mode === 'column' && (S.src.cpap || S.src.o2);
      const step = S.n > 14 ? Math.ceil(S.n / 6) : 1;
      nights.forEach((d, i) => {
        const x0 = L + i * sw, s = sleep[d], c = S.src.cpap ? cpap[d] : null, o = S.src.o2 ? o2[d] : null;
        const g = el('g', { 'clip-path': 'url(#tl-plot)' }, svg), hg = el('g', {}, svg);
        if (d === S.sel) el('rect', { x: x0, y: TOP, width: sw, height: PH, fill: css('--hl') }, g);
        if (!ok(d)) el('rect', { x: x0 + 1, y: TOP, width: sw - 2, height: PH, fill: css('--gray'), opacity: 0.55 }, g);

        const dl = daily[d];
        if (S.src.cpap && dl && dl.ahi != null) {
          el('rect', { x: x0 + 2, y: 6, width: Math.max(1, sw - 4), height: 16, rx: 2, fill: css(dl.ahi < 5 ? '--rem' : dl.ahi < 15 ? '--awake' : '--ev-oa') }, hg);
          if (sw > 26) el('text', { x: x0 + sw / 2, y: 18, 'text-anchor': 'middle', style: 'font-size:10px;font-weight:600;fill:' + css('--ink') }, hg).textContent = dl.ahi.toFixed(1);
        }
        if (S.src.o2 && o2[d]) {
          const v = o2[d].spo2Min;
          el('circle', { cx: x0 + sw / 2, cy: 34, r: v < 89 ? 6 : 3, fill: css(v < 89 ? '--ev-oa' : '--hatch') }, hg);
          if (sw > 26 && v >= 89) el('text', { x: x0 + sw / 2, y: 47, 'text-anchor': 'middle', style: 'font-size:9px' }, hg).textContent = v;
        }

        const pad = Math.max(1.5, sw * 0.12);
        let bx = x0 + pad, bw = sw - pad * 2, cx = 0, cw = 0;
        if (col) { const gap = Math.max(1, sw * 0.06); bw = (sw - pad * 2 - gap) * 0.55; cx = bx + bw + gap; cw = sw - pad * 2 - gap - bw; }
        if (s) (s.segs || []).forEach(q => {
          const st = q[0], a = q[1], b = q[2];
          if (b < T0 || a > S.t1) return;
          el('rect', { x: bx, y: y(a), width: bw, height: Math.max(1, y(b) - y(a)), fill: st === 'bed' ? 'url(#tl-hatch)' : css(STAGE[st] || '--core') }, g);
        });

        const tx = col ? cx : bx, tw = col ? cw : bw;
        if (col && (c || o)) {
          const a = Math.min(...[c && c.sessions[0][0], o && o.start].filter(v => v != null));
          const b = Math.max(...[c && c.sessions[c.sessions.length - 1][1], o && o.end].filter(v => v != null));
          el('rect', { x: cx, y: y(a), width: cw, height: y(b) - y(a), fill: 'none', stroke: css('--line') }, g);
        }
        if (c) {
          c.sessions.forEach(([a, b]) => {
            if (col) el('rect', { x: cx, y: y(a), width: cw, height: y(b) - y(a), fill: css('--maskbg') }, g);
            else el('rect', { x: bx - 3, y: y(a), width: 3, height: y(b) - y(a), fill: css('--mask') }, g);
          });
          (c.events || []).forEach(([t, m]) => {
            if (!EVK[t] || m < T0 || m > S.t1) return;
            if (!col) el('line', { x1: bx - 1, x2: bx + bw + 1, y1: y(m), y2: y(m), stroke: '#fff', 'stroke-width': 2.4, opacity: 0.8 }, g);
            el('line', { x1: tx - (col ? 0 : 1), x2: tx + tw + (col ? 0 : 1), y1: y(m), y2: y(m), stroke: css(EVK[t][0]), 'stroke-width': col ? 1.4 : 1.1 }, g);
          });
        }
        if (o) {
          const sx = v => tx + 1 + (Math.max(85, Math.min(100, v)) - 85) / 15 * Math.max(1, tw - 2);
          el('line', { x1: sx(90), x2: sx(90), y1: y(o.start), y2: y(o.end), stroke: css('--spo2'), 'stroke-dasharray': '2 3', opacity: 0.7 }, g);
          let path = '', prev = null;
          (o.series || []).forEach(r => {
            const m = r[0], v = r[1];
            if (!v || m < T0 - 5 || m > S.t1 + 5) { prev = null; return; }
            path += (prev == null || m - prev > 6 ? 'M' : 'L') + sx(v).toFixed(1) + ' ' + y(m).toFixed(1); prev = m;
          });
          if (!col) el('path', { d: path, fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round', opacity: 0.85 }, g);
          el('path', { d: path, fill: 'none', stroke: css('--spo2'), 'stroke-width': 1.3, 'stroke-linejoin': 'round' }, g);
          (o.series || []).forEach(r => { if (r[1] && r[1] < 90 && r[0] >= T0 && r[0] <= S.t1) el('circle', { cx: sx(r[1]), cy: y(r[0]), r: 2, fill: css('--spo2') }, g); });
        }
        if (i % step === 0) el('text', { x: x0 + sw / 2, y: H - 6, 'text-anchor': 'middle' }, svg).textContent = S.n > 14 ? short(d) : dowDay(d);
      });
      brush(svg, { W, L, R, TOP, PH, sw, nights, H });
      readout(S.sel);
    }

    function readout(d) {
      const s = sleep[d], c = cpap[d], dl = daily[d], o = o2[d], p = [`<b>${longd(d)}</b>`];
      p.push(s ? `asleep <b>${hm((s.deep || 0) + (s.rem || 0) + (s.core || 0))}</b> · deep ${Math.round(s.deep || 0)}m · REM ${Math.round(s.rem || 0)}m` : 'no sleep data');
      if (dl) p.push(`CPAP mask <b>${hm(dl.use)}</b> · AHI <b>${dl.ahi}</b>` + (c ? ` · ${(c.events || []).filter(e => EVK[e[0]]).length} events` : ' · daily total only'));
      else p.push('no CPAP');
      p.push(o ? `SpO₂ avg <b>${o.spo2Avg}%</b> · min <b>${o.spo2Min}%</b> · ${o.below90Min} min under 90%` : 'no O2 ring');
      $('tl-readout').innerHTML = p.join('  ·  ');
    }

    // ---------- drag to zoom
    function pushHist() { S.hist.push({ t0: S.t0, t1: S.t1, n: S.n, end: S.end }); }
    function brush(svg, g) {
      const box = el('rect', { fill: css('--hl'), stroke: css('--accent'), 'stroke-width': 1.2, 'stroke-dasharray': '4 3', visibility: 'hidden' }, svg);
      const lbl = el('text', { visibility: 'hidden', style: 'font-weight:600;paint-order:stroke;stroke-width:4px;stroke:#fff;fill:' + css('--accent') }, svg);
      const pt = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) * g.W / r.width, (e.clientY - r.top) * g.H / r.height]; };
      const tAt = py => S.t0 + Math.max(0, Math.min(1, (py - g.TOP) / g.PH)) * (S.t1 - S.t0);
      const iAt = px => Math.max(0, Math.min(g.nights.length - 1, Math.floor((px - g.L) / g.sw)));
      const hide = () => { box.setAttribute('visibility', 'hidden'); lbl.setAttribute('visibility', 'hidden'); };
      let start = null;
      svg.addEventListener('pointerdown', e => { const p = pt(e); if (p[0] < g.L || p[1] < g.TOP || p[1] > g.TOP + g.PH) return; start = p; svg.setPointerCapture(e.pointerId); });
      svg.addEventListener('pointermove', e => {
        const p = pt(e);
        if (p[0] >= g.L && !start) readout(g.nights[iAt(p[0])]);
        if (!start) return;
        const yy = Math.max(g.TOP, Math.min(start[1], p[1])), h = Math.min(g.TOP + g.PH, Math.max(start[1], p[1])) - yy;
        const i0 = S.zoomNights ? iAt(Math.min(start[0], p[0])) : 0, i1 = S.zoomNights ? iAt(Math.max(start[0], p[0])) : g.nights.length - 1;
        const vis = h > 4 ? 'visible' : 'hidden';
        Object.entries({ x: g.L + i0 * g.sw, y: yy, width: (i1 - i0 + 1) * g.sw, height: h, visibility: vis }).forEach(([k, v]) => box.setAttribute(k, v));
        lbl.setAttribute('x', g.L + i0 * g.sw + 4); lbl.setAttribute('y', Math.max(12, yy - 5)); lbl.setAttribute('visibility', vis);
        lbl.textContent = `${clock(tAt(yy))} – ${clock(tAt(yy + h))} · ${S.zoomNights ? (i1 - i0 + 1) + ' night' + (i1 > i0 ? 's' : '') : 'all ' + g.nights.length + ' nights'}`;
      });
      svg.addEventListener('pointerup', e => {
        if (!start) return;
        const p = pt(e), s0 = start; start = null; hide();
        if (Math.abs(p[1] - s0[1]) < 8) {             // a plain click selects the night
          const d = g.nights[iAt(p[0])]; S.sel = d; readout(d); draw(); drawCal(); return;
        }
        let a = Math.floor(tAt(Math.min(s0[1], p[1])) / 5) * 5, b = Math.ceil(tAt(Math.max(s0[1], p[1])) / 5) * 5;
        b = Math.max(a + 20, b);
        pushHist();
        S.t0 = a; S.t1 = b; S.zoomed = true;
        if (S.zoomNights) {
          const i0 = iAt(Math.min(s0[0], p[0])), i1 = iAt(Math.max(s0[0], p[0]));
          S.n = i1 - i0 + 1; S.end = g.nights[i1];
          if (S.sel < g.nights[i0] || S.sel > S.end) S.sel = S.end;
        }
        draw(); drawCal();
      });
      svg.addEventListener('pointercancel', () => { start = null; hide(); });
      svg.addEventListener('dblclick', resetZoom);
    }
    function zoomBack() {
      const h = S.hist.pop(); if (!h) return resetZoom();
      Object.assign(S, h); S.zoomed = S.hist.length > 0 || h.t0 !== FULL[0] || h.t1 !== FULL[1];
      draw(); drawCal();
    }
    function resetZoom() {
      if (S.hist.length) { S.n = S.hist[0].n; S.end = S.hist[0].end; }
      S.hist = []; S.t0 = FULL[0]; S.t1 = FULL[1]; S.zoomed = false; draw(); drawCal();
    }
    function clearZoom() { S.hist = []; S.t0 = FULL[0]; S.t1 = FULL[1]; S.zoomed = false; }

    // ---------- calendar (3 months ending at S.calEnd)
    function drawCal() {
      const box = $('tl-months'); box.innerHTML = '';
      const winStart = addDays(S.end, -(S.n - 1));
      let [cy, cm] = S.calEnd.split('-').map(Number); cm -= 1;
      const months = []; for (let k = 2; k >= 0; k--) { const t = new Date(Date.UTC(cy, cm - k, 1)); months.push([t.getUTCFullYear(), t.getUTCMonth()]); }
      let active = 0;
      months.forEach(([yy, m]) => {
        const days = new Date(Date.UTC(yy, m + 1, 0)).getUTCDate(), lead = (new Date(Date.UTC(yy, m, 1)).getUTCDay() + 6) % 7;
        const wrap = document.createElement('div');
        wrap.innerHTML = `<div class="mname">${MONL[m]} ${yy}</div>`;
        const grid = document.createElement('div'); grid.className = 'grid7';
        ['M', 'T', 'W', 'T', 'F', 'S', 'S'].forEach(c => grid.insertAdjacentHTML('beforeend', `<div class="wd">${c}</div>`));
        for (let i = 0; i < lead; i++) grid.appendChild(document.createElement('div'));
        for (let day = 1; day <= days; day++) {
          const d = `${yy}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, h = has(d), good = ok(d);
          if (good) active++;
          const b = document.createElement('button'); b.type = 'button';
          b.className = 'day' + (good ? '' : ' off') + (d === S.sel ? ' sel' : '') + (d >= winStart && d <= S.end ? ' inwin' : '');
          const have = [h.sleep && 'sleep', h.cpap && 'CPAP', h.o2 && 'O2 ring'].filter(Boolean);
          b.title = longd(d) + ' · ' + (have.join(', ') || 'no data');
          b.setAttribute('aria-label', b.title); b.disabled = !good;
          b.innerHTML = `<span>${day}</span><span class="dots"><span style="${h.sleep ? 'background:var(--deep)' : ''}"></span><span style="${h.cpap ? 'background:var(--mask)' : ''}"></span><span style="${h.o2 ? 'background:var(--spo2)' : ''}"></span></span>`;
          b.onclick = () => {
            S.sel = d;
            if (d < winStart || d > S.end) { S.end = addDays(d, Math.floor(S.n / 2)); clampEnd(); }
            draw(); drawCal();
          };
          grid.appendChild(b);
        }
        wrap.appendChild(grid); box.appendChild(wrap);
      });
      const names = ['sleep', S.src.cpap && 'CPAP', S.src.o2 && 'O2 ring'].filter(Boolean);
      $('tl-cal-sub').textContent = `${active} nights in these months have ${names.join(' + ')} · click a day to jump the timeline to it`;
      $('tl-cal-prev').disabled = S.calEnd <= FIRST.slice(0, 7);
      $('tl-cal-next').disabled = S.calEnd >= LAST.slice(0, 7);
    }
    const shiftCal = k => { let [yy, m] = S.calEnd.split('-').map(Number); const t = new Date(Date.UTC(yy, m - 1 + k, 1)); S.calEnd = iso(t).slice(0, 7); drawCal(); };

    // ---------- wiring
    const setMode = m => { S.mode = m; $('tl-m-overlay').setAttribute('aria-pressed', String(m === 'overlay')); $('tl-m-column').setAttribute('aria-pressed', String(m === 'column')); draw(); };
    $('tl-m-overlay').onclick = () => setMode('overlay');
    $('tl-m-column').onclick = () => setMode('column');
    const setZN = v => { S.zoomNights = v; $('tl-zn-on').setAttribute('aria-pressed', String(v)); $('tl-zn-off').setAttribute('aria-pressed', String(!v)); };
    $('tl-zn-on').onclick = () => setZN(true); $('tl-zn-off').onclick = () => setZN(false);
    host.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
      clearZoom(); S.n = +b.dataset.n; S.end = addDays(S.sel, Math.floor(S.n / 4)); clampEnd(); followCal(); draw(); drawCal();
    });
    host.querySelectorAll('[data-z]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.z.split(',').map(Number); pushHist(); S.t0 = a; S.t1 = c; S.zoomed = true; draw(); });
    $('tl-zback').onclick = zoomBack; $('tl-zreset').onclick = resetZoom;
    $('tl-prev').onclick = () => { S.end = addDays(S.end, -S.n); clampEnd(); followCal(); draw(); drawCal(); };
    $('tl-next').onclick = () => { S.end = addDays(S.end, S.n); clampEnd(); followCal(); draw(); drawCal(); };
    $('tl-jump-breath').onclick = () => { S.sel = ALL3; S.end = addDays(ALL3, 7); clampEnd(); followCal(); draw(); drawCal(); };
    $('tl-jump-latest').onclick = () => { S.end = S.sel = LAST; clampEnd(); followCal(); draw(); drawCal(); };
    $('tl-cal-prev').onclick = () => shiftCal(-1); $('tl-cal-next').onclick = () => shiftCal(1);
    ['cpap', 'o2'].forEach(k => $('tl-' + k).addEventListener('change', e => { S.src[k] = e.target.checked; draw(); drawCal(); }));
    addEventListener('keydown', e => { if (e.key === 'Escape' && S.zoomed && !root.hidden) zoomBack(); });

    clampEnd(); draw(); drawCal();
    return { redraw: draw };
  }

  window.NightlyTimeline = { mount };
})();
