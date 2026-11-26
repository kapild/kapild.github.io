// Sleep habits: the "Sleep habits" tab (#habits). Long-term patterns across every night.
//   summary cards · nightly trend · sleep window · bedtime / wake heatmaps · sleep debt · month over month
//   · bedtime consistency · deep + REM by month · weekday rhythm · year over year · CPAP vs other nights
//   · long awakenings (how long you sleep before the first long wake) · wake heatmaps (clock time / sleep
//   before vs minutes awake) · calendar heatmap colored by a chosen measure (red = rough night, green = good). Dashed lines on the trend charts mark US daylight-saving switches.
// index.html calls SleepHabits.mount(root, nightsJson, apneaJson) once, then .redraw() when shown or resized.
(function () {
  const STYLE = `
.hb{--card:#FFFFFF;--line:#D9DCE1;--grid:#EEF0F3;--ink:#111418;--ink2:#3D4350;--muted:#5A6170;--accent:#2459C6;
  --sleep:#3C69D9;--bed:#3F33A8;--wake:#E08A1E;--good:#2E8B57;--bad:#C2410C;--goal:#E6F4EC;--debt:#C2410C;--debtbg:#FBE6DC;
  --wakewin:#EC8546;--after:#AFC4F1;--nowake:#D5DCEA;--deep:#D9A90F;--deeptext:#8A6700;--rem:#7DB9EE;--dst:#9AA1AD;
  --empty:#F4F5F7;--monthline:#111418;--h0:#F3F4F8;--h1:#DCE5F9;--h2:#AFC4F1;--h3:#7097E6;--h4:#3C69D9;--h5:#22408F;
  --mono:'IBM Plex Mono',ui-monospace,monospace;
  font-family:'IBM Plex Sans',system-ui,sans-serif;font-size:14px;color:var(--ink);display:flex;flex-direction:column;gap:14px}
.hb .card{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:16px 18px;min-width:0}
.hb h1{font-size:24px;margin:2px 0 0;font-weight:600}
.hb h2{font-size:15px;margin:0;font-weight:600}
.hb .sub{font-family:var(--mono);font-size:12px;line-height:1.5;color:var(--muted)}
.hb .head{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:12px}
.hb .seg{display:inline-flex;flex-wrap:wrap;border:1px solid var(--ink);border-radius:4px;overflow:hidden}
.hb .seg button{border:0;min-height:38px;padding:0 13px;font:inherit;font-size:13px;font-weight:600;background:#fff;color:var(--ink);cursor:pointer}
.hb .seg button[aria-pressed="true"]{background:var(--ink);color:#fff}
.hb .seg.sm button{min-height:30px;font-size:12px;padding:0 10px}
.hb button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.hb .tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
.hb .tile{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:12px 14px}
.hb .tile .l{font-size:12px;font-weight:600;color:var(--ink2)}
.hb .tile .v{font-family:var(--mono);font-size:26px;font-weight:600;line-height:1.2;margin-top:4px}
.hb .tile .d{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:2px}
.hb .up{color:var(--good)} .hb .dn{color:var(--bad)}
.hb .two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@media (max-width:860px){.hb .two{grid-template-columns:1fr}}
.hb .legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-family:var(--mono);font-size:12px;color:var(--muted);align-items:center}
.hb .legend span{display:inline-flex;align-items:center;gap:6px}
.hb .sw{display:inline-block;width:12px;height:12px;border-radius:2px}
.hb .chart{overflow-x:auto;margin-top:8px}
.hb .chart svg{display:block;width:100%;height:auto}
.hb svg text{font-family:var(--mono);font-size:10.5px;fill:var(--muted)}
.hb .ramp{display:inline-flex;gap:2px;vertical-align:middle}
.hb .ramp i{width:14px;height:10px;display:inline-block}
.hb .scroll{overflow-x:auto}
.hb table{border-collapse:collapse;width:100%;font-size:12.5px}
.hb th{font-family:var(--mono);font-size:11px;font-weight:500;color:var(--muted);text-align:right;padding:6px 8px;border-bottom:1px solid var(--ink);white-space:nowrap}
.hb td{padding:5px 8px;border-bottom:1px solid var(--grid);text-align:right;font-family:var(--mono);white-space:nowrap}
.hb th:first-child,.hb td:first-child{text-align:left}
.hb .bar{display:inline-block;height:8px;border-radius:2px;background:var(--sleep);vertical-align:middle;margin-right:6px}
.hb .find{font-size:16px;font-weight:600;line-height:1.4;margin:6px 0 0;max-width:72ch}
.hb .wleg i{display:inline-block;width:12px;height:12px;border-radius:2px}
.hb .chart svg.fixed{width:auto;max-width:none}
.hb .ckey{display:inline-flex;align-items:center;gap:4px}
.hb .ckey i{display:inline-block;width:14px;height:14px;border-radius:2px}
.hb .note{font-size:12.5px;line-height:1.5;color:var(--muted);margin:8px 0 0;max-width:80ch}
.hb-tip{position:fixed;pointer-events:none;background:#fff;color:#111418;border:1px solid #111418;border-radius:4px;padding:6px 9px;font:12px/1.45 'IBM Plex Mono',monospace;display:none;z-index:30;max-width:260px;box-shadow:4px 4px 0 rgba(17,20,24,.12)}
.hb [hidden]{display:none!important}`;

  const MARKUP = `
<section class="card head">
  <div>
    <div class="sub">SLEEP HABITS · ALL NIGHTS</div>
    <h1>How much, when, and how steady</h1>
    <div class="sub" id="hb-cover"></div>
  </div>
  <div class="seg" role="group" aria-label="Range">
    <button type="button" data-r="90">90 days</button>
    <button type="button" data-r="365" aria-pressed="true">12 months</button>
    <button type="button" data-r="730">2 years</button>
    <button type="button" data-r="all">All years</button>
  </div>
</section>
<section class="tiles" id="hb-tiles" aria-label="Summary"></section>
<section class="card" aria-label="Daily trend">
  <div class="head">
    <div><h2>Time asleep, night by night</h2><div class="sub">dots = each night · line = 14-night average · band = 7–9 h · dashed = daylight-saving switch</div></div>
    <div class="legend"><span><i class="sw" style="background:var(--h2)"></i>night</span><span><i class="sw" style="height:3px;background:var(--sleep)"></i>14-night avg</span><span><i class="sw" style="background:var(--goal)"></i>7–9 h</span></div>
  </div>
  <div class="chart" id="hb-trend"></div>
</section>
<section class="card" aria-label="Sleep window">
  <div class="head">
    <div><h2>Sleep window</h2><div class="sub">each night from falling asleep to waking · lines = 14-night average bedtime and wake time</div></div>
    <div class="legend"><span><i class="sw" style="background:var(--h2)"></i>asleep</span><span><i class="sw" style="height:3px;background:var(--bed)"></i>bedtime</span><span><i class="sw" style="height:3px;background:var(--wake)"></i>wake</span></div>
  </div>
  <div class="chart" id="hb-window"></div>
</section>
<section class="two">
  <div class="card" aria-label="Bedtime heatmap">
    <h2>When you fall asleep, by month</h2>
    <div class="sub">each column is a month · darker = more of that month's nights in that half hour · bar = month average</div>
    <div class="chart" id="hb-hm-bed"></div>
  </div>
  <div class="card" aria-label="Wake heatmap">
    <h2>When you wake up, by month</h2>
    <div class="sub">each column is a month · darker = more of that month's nights in that half hour · bar = month average</div>
    <div class="chart" id="hb-hm-wake"></div>
  </div>
</section>
<section class="card" aria-label="Sleep debt">
  <div class="head">
    <div><h2>Sleep debt</h2><div class="sub">minutes short of your goal, added up over the last 14 nights with data (extra sleep pays some back)</div></div>
    <div class="seg sm" role="group" aria-label="Sleep goal">
      <button type="button" data-g="420">7 h goal</button>
      <button type="button" data-g="450">7.5 h goal</button>
      <button type="button" data-g="480" aria-pressed="true">8 h goal</button>
    </div>
  </div>
  <p class="find" id="hb-debt-find"></p>
  <div class="chart" id="hb-debt"></div>
</section>
<section class="card" aria-label="Long awakenings">
  <div class="head">
    <div><h2>Waking up in the night</h2><div class="sub">how long you sleep before the first long awake stretch, how long it lasts, and how much sleep comes after</div></div>
    <div class="seg sm" role="group" aria-label="What counts as a long wake">
      <button type="button" data-w="15">15 min+</button>
      <button type="button" data-w="20" aria-pressed="true">20 min+</button>
      <button type="button" data-w="30">30 min+</button>
    </div>
  </div>
  <p class="find" id="hb-wk-find"></p>
  <section class="tiles" id="hb-wk-tiles" style="margin-top:10px"></section>
  <div class="legend" style="margin-top:12px"><span><i class="sw" style="background:var(--sleep)"></i>first stretch of sleep</span><span><i class="sw" style="background:var(--wakewin)"></i>first long wake</span><span><i class="sw" style="background:var(--after)"></i>after it</span><span><i class="sw" style="background:var(--nowake)"></i>night with no long wake</span><span><i class="sw" style="height:3px;background:var(--bed)"></i>14-night median of the first stretch</span></div>
  <div class="sub" style="margin-top:4px">each bar is one night, measured in hours from falling asleep (top) downwards</div>
  <div class="chart" id="hb-wk-bars"></div>
  <div class="two" style="margin-top:6px">
    <div><h2 style="font-size:13px">How long the first stretch lasts</h2><div class="sub">nights with a long wake · sleep before it, in half-hour bins</div><div class="chart" id="hb-wk-hist"></div></div>
    <div><h2 style="font-size:13px">When the first long wake starts</h2><div class="sub">clock time, half-hour bins · bar label = median minutes awake</div><div class="chart" id="hb-wk-clock"></div></div>
  </div>
  <p class="note">A long wake is any stretch of at least the chosen length between two periods of sleep: awake, in bed but not asleep, or a gap with no sleep data. The last wake of the morning doesn't count. The Pixel Watch reports far fewer long wakes than the Apple Watch did, partly because the two watches record being awake differently, so compare nights from the same watch. Short wake-ups inside the first stretch are left in it, so the first stretch is the time from falling asleep to the long wake, and "slept" is the sleep inside it.</p>
</section>
<section class="card" aria-label="Wake heatmaps">
  <div class="head">
    <div><h2>When you wake, and for how long</h2><div class="sub">every awake stretch between two periods of sleep · darker red = more wakes</div></div>
    <div style="display:flex;flex-wrap:wrap;gap:8px">
      <div class="seg sm" role="group" aria-label="Heatmap window">
        <button type="button" data-hw="30">1 month</button>
        <button type="button" data-hw="91">Quarter</button>
        <button type="button" data-hw="182">6 months</button>
        <button type="button" data-hw="365" aria-pressed="true">1 year</button>
      </div>
      <div class="seg sm" role="group" aria-label="Which wakes to count">
        <button type="button" data-hk="all" aria-pressed="true">Every wake 5 min+</button>
        <button type="button" data-hk="first">First long wake 20 min+</button>
      </div>
      <div class="seg sm" role="group" aria-label="Which watch">
        <button type="button" data-hs="both" aria-pressed="true">Both</button>
        <button type="button" data-hs="apple">Apple</button>
        <button type="button" data-hs="google">Pixel</button>
      </div>
      <div class="seg sm" role="group" aria-label="Move window"><button type="button" id="hb-wh-prev" aria-label="Earlier window">‹</button><button type="button" id="hb-wh-next" aria-label="Later window">›</button></div>
    </div>
  </div>
  <div class="sub" id="hb-wh-cover" style="margin-top:6px"></div>
  <p class="find" id="hb-wh-find"></p>
  <div class="two" style="margin-top:6px">
    <div><h2 style="font-size:13px">What time you wake vs how long you stay awake</h2><div class="sub">across = clock time the wake starts · down = minutes awake</div><div class="chart" id="hb-wh1"></div></div>
    <div><h2 style="font-size:13px">How long you'd slept vs how long you stay awake</h2><div class="sub">across = hours since falling asleep · down = minutes awake</div><div class="chart" id="hb-wh2"></div></div>
  </div>
  <p class="note">Each square counts the wakes in the window that started at that time (left) or after that much sleep (right) and lasted that long. The bold line marks 20 minutes. Bars on the edges total each row and column. Hover a square for its count and the latest examples. The final wake of the morning isn't counted.</p>
</section>
<section class="card" aria-label="Month over month">
  <div class="head">
    <div><h2>Month over month</h2><div class="sub">averages per month · arrows compare with the month before (minutes)</div></div>
    <div class="seg sm" role="group" aria-label="Month table order">
      <button type="button" data-s="new" aria-pressed="true">Newest first</button>
      <button type="button" data-s="old">Oldest first</button>
    </div>
  </div>
  <p class="find" id="hb-mom-find"></p>
  <div class="scroll" style="margin-top:8px;max-height:420px;overflow-y:auto"><table id="hb-mom"></table></div>
</section>
<section class="two">
  <div class="card" aria-label="Consistency">
    <h2>How steady is your timing?</h2>
    <div class="sub">spread of bedtime and wake time per month (standard deviation) · lower = steadier</div>
    <div class="legend" style="margin-top:8px"><span><i class="sw" style="height:3px;background:var(--bed)"></i>bedtime spread</span><span><i class="sw" style="height:3px;background:var(--wake)"></i>wake spread</span></div>
    <div class="chart" id="hb-cons"></div>
  </div>
  <div class="card" aria-label="Stages by month">
    <h2>Deep and REM sleep by month</h2>
    <div class="sub">average minutes a night, nights with stages only</div>
    <div class="legend" style="margin-top:8px"><span><i class="sw" style="height:3px;background:var(--deep)"></i>deep</span><span><i class="sw" style="height:3px;background:var(--rem)"></i>REM</span></div>
    <div class="chart" id="hb-stages"></div>
  </div>
</section>
<section class="two">
  <div class="card" aria-label="Weekday rhythm">
    <h2>Weekday rhythm</h2>
    <div class="sub">average sleep window by the night it starts · label = time asleep</div>
    <p class="find" id="hb-sjl"></p>
    <div class="chart" id="hb-dow"></div>
  </div>
  <div class="card" aria-label="Year over year">
    <h2>Year over year</h2>
    <div class="sub">average time asleep per calendar month, one line per year (all data)</div>
    <div class="legend" id="hb-yoy-leg" style="margin-top:8px"></div>
    <div class="chart" id="hb-yoy"></div>
  </div>
</section>
<section class="card" aria-label="CPAP nights vs other nights">
  <h2>CPAP nights vs other nights</h2>
  <div class="sub" id="hb-cpap-sub"></div>
  <p class="find" id="hb-cpap-find"></p>
  <div class="scroll" style="margin-top:8px"><table id="hb-cpap"></table></div>
  <p class="note">A CPAP night is one with at least 2 hours of mask time. Only nights between the first and last CPAP night count, so both groups come from the same stretch of your life.</p>
</section>
<section class="card" aria-label="Calendar heatmap">
  <div class="head">
    <div><h2>Every night at a glance</h2><div class="sub">one square per night · thick lines mark months · green = good night, red = rough night · faded = outside the range</div></div>
    <div class="seg sm" role="group" aria-label="Calendar measure" id="hb-cal-metrics"></div>
  </div>
  <div class="legend" id="hb-cal-leg" style="margin-top:8px"></div>
  <div class="chart" id="hb-cal"></div>
</section>`;

  const NS = 'http://www.w3.org/2000/svg';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY = 864e5;
  const el = (t, a, p) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  // times are minutes from 9 PM on the night's date
  const clock = m => { const t = ((21 * 60 + Math.round(m)) % 1440 + 1440) % 1440, h = Math.floor(t / 60), mm = t % 60; return (h % 12 || 12) + ':' + String(mm).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };
  const hm = m => { m = Math.round(m); const s = m < 0 ? '-' : ''; m = Math.abs(m); return s + Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm'; };
  const mean = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : null;
  const sd = a => { const m = mean(a); return a.length > 1 ? Math.sqrt(mean(a.map(x => (x - m) ** 2))) : null; };
  const fmtD = d => { const t = new Date(d + 'T12:00Z'); return DOW[t.getUTCDay()] + ' ' + MON[t.getUTCMonth()] + ' ' + t.getUTCDate() + ', ' + t.getUTCFullYear(); };
  const monLab = k => MON[+k.slice(5) - 1] + ' ' + k.slice(0, 4);
  // usual bedtime / wake ranges; naps and all-nighters stay in the counts but not in the time averages
  const ON_OK = m => m >= -120 && m <= 420, WK_OK = m => m >= 360 && m <= 960;
  // US daylight-saving switches: second Sunday of March, first Sunday of November
  // red → yellow → green, low → high
  const RDYLGN = ['#D73027', '#FC8D59', '#FEE08B', '#D9EF8B', '#91CF60', '#1A9850'];
  const nthSunday = (y, mo, k) => { const d = new Date(Date.UTC(y, mo, 1)); const first = (7 - d.getUTCDay()) % 7 + 1; return Date.UTC(y, mo, first + 7 * (k - 1), 12); };

  function mount(root, NJ, A) {
    if (!document.getElementById('hb-style')) { const st = document.createElement('style'); st.id = 'hb-style'; st.textContent = STYLE; document.head.appendChild(st); }
    root.innerHTML = '<div class="hb">' + MARKUP + '</div>';
    const host = root.firstChild;
    const $ = id => document.getElementById(id);
    const css = n => getComputedStyle(host).getPropertyValue(n).trim();
    let tip = document.getElementById('hb-tip');
    if (!tip) { tip = document.createElement('div'); tip.id = 'hb-tip'; tip.className = 'hb-tip'; tip.setAttribute('role', 'status'); document.body.appendChild(tip); }
    const hover = (node, html) => {
      node.addEventListener('mousemove', e => { tip.innerHTML = html; tip.style.display = 'block'; tip.style.left = Math.min(innerWidth - 270, e.clientX + 12) + 'px'; tip.style.top = Math.min(innerHeight - 90, e.clientY + 12) + 'px'; });
      node.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
    };

    const N = (NJ.nights || []).map(x => ({
      d: x.d, on: x.onset, wk: x.wake, a: (x.deep || 0) + (x.rem || 0) + (x.core || 0), deep: x.deep || null, rem: x.rem || null,
      aw: x.awake || 0, wu: x.wakeups, segs: x.segs || [], g: x.src === 'google', t: Date.parse(x.d + 'T12:00Z')
    })).filter(n => n.a >= 120 && n.on != null && n.wk != null).sort((a, b) => a.t - b.t);
    if (!N.length) { host.innerHTML = '<div class="card">No nights in nights.json.</div>'; return { redraw() {} }; }
    const LAST = N[N.length - 1];
    const mask = {}; (A && A.cpapDaily || []).forEach(c => { mask[c.d] = c.use || 0; });

    let R = '365', GOAL = 480, ORDER = 'new', WTH = 20;
    const median = a => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y), k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
    // first long wake of a night: a gap of WTH+ minutes between two asleep segments (awake, in bed, or no data)
    const wcache = new Map();
    // every awake stretch of 5+ minutes between two asleep segments: [start, minutes awake, minutes since falling asleep]
    const allWakes = new Map();
    function nightWakes(n) {
      if (allWakes.has(n.d)) return allWakes.get(n.d);
      const sl = n.segs.filter(s => s[0] === 'deep' || s[0] === 'core' || s[0] === 'rem').map(s => [s[1], s[2]]).sort((a, b) => a[0] - b[0]);
      const out = [];
      if (sl.length) { const on = sl[0][0]; let cur = sl[0][1]; for (let i = 1; i < sl.length; i++) { if (sl[i][0] - cur >= 5) out.push([cur, sl[i][0] - cur, cur - on]); cur = Math.max(cur, sl[i][1]); } }
      allWakes.set(n.d, out);
      return out;
    }
    const HW = { win: 365, end: null, kind: 'all', src: 'both' };
    function wakeInfo(n) {
      const key = n.d + '|' + WTH;
      if (wcache.has(key)) return wcache.get(key);
      const sl = n.segs.filter(s => s[0] === 'deep' || s[0] === 'core' || s[0] === 'rem').map(s => [s[1], s[2]]).sort((a, b) => a[0] - b[0]);
      let r = { long: false };
      if (sl.length) {
        const on = sl[0][0], end = sl.reduce((m, s) => Math.max(m, s[1]), 0);
        let cur = sl[0][1], win = null, count = 0;
        for (let i = 1; i < sl.length; i++) {
          if (sl[i][0] - cur >= WTH) { count++; if (!win) win = [cur, sl[i][0]]; }
          cur = Math.max(cur, sl[i][1]);
        }
        const asleepIn = (a, b) => sl.reduce((s, q) => s + Math.max(0, Math.min(q[1], b) - Math.max(q[0], a)), 0);
        r = win
          ? { long: true, on, end, start: win[0], stop: win[1], dur: win[1] - win[0], span: win[0] - on, slept: asleepIn(on, win[0]), after: asleepIn(win[1], end), count }
          : { long: false, on, end, span: end - on, slept: asleepIn(on, end) };
      }
      wcache.set(key, r);
      return r;
    }
    const inRange = () => R === 'all' ? N : N.filter(n => n.t > LAST.t - (+R) * DAY);
    const rolling = (sel, f, win = 14) => sel.map(n => { const w = sel.filter(m => m.t <= n.t && m.t > n.t - win * DAY).map(f).filter(v => v != null); return w.length >= 4 ? mean(w) : null; });
    const linePath = (sel, vals, x, y) => { let d = '', prev = null; sel.forEach((n, i) => { const v = vals[i]; if (v == null) { prev = null; return; } d += (prev == null || n.t - prev > 21 * DAY ? 'M' : 'L') + x(n.t).toFixed(1) + ' ' + y(v).toFixed(1); prev = n.t; }); return d; };
    const months = sel => {
      const m = new Map();
      sel.forEach(n => { const k = n.d.slice(0, 7); if (!m.has(k)) m.set(k, []); m.get(k).push(n); });
      return [...m.entries()].map(([k, a]) => ({ k, a, n: a.length, asleep: mean(a.map(n => n.a)),
        on: mean(a.map(n => n.on).filter(ON_OK)), wk: mean(a.map(n => n.wk).filter(WK_OK)),
        sdOn: sd(a.map(n => n.on).filter(ON_OK)), sdWk: sd(a.map(n => n.wk).filter(WK_OK)),
        p7: a.filter(n => n.a >= 420).length / a.length, lw: a.filter(n => wakeInfo(n).long).length / a.length, fs: median(a.map(n => wakeInfo(n)).filter(w => w.long).map(w => w.span)), deep: mean(a.map(n => n.deep).filter(Boolean)), rem: mean(a.map(n => n.rem).filter(Boolean)) }));
    };

    function timeAxis(svg, x, t0, t1, top, bottom, H) {
      const span = (t1 - t0) / DAY, every = span > 1500 ? 12 : span > 500 ? 3 : 1;
      const d0 = new Date(t0); let y = d0.getUTCFullYear(), m = d0.getUTCMonth() + 1;
      if (m > 11) { m = 0; y++; }
      for (;;) {
        const t = Date.UTC(y, m, 1); if (t > t1) break;
        if (m % every === 0) {
          el('line', { x1: x(t), x2: x(t), y1: top, y2: bottom, stroke: css('--grid') }, svg);
          el('text', { x: x(t) + 3, y: H - 6 }, svg).textContent = every === 12 ? String(y) : MON[m] + (m === 0 || every > 1 ? ' ' + y : '');
        }
        m++; if (m > 11) { m = 0; y++; }
      }
      // daylight-saving switches
      if (span <= 1500) for (let yy = new Date(t0).getUTCFullYear(); yy <= new Date(t1).getUTCFullYear(); yy++) {
        [[nthSunday(yy, 2, 2), 'Clocks forward (DST starts)'], [nthSunday(yy, 10, 1), 'Clocks back (DST ends)']].forEach(([t, l]) => {
          if (t < t0 || t > t1) return;
          const ln = el('line', { x1: x(t), x2: x(t), y1: top, y2: bottom, stroke: css('--dst'), 'stroke-dasharray': '4 3', 'stroke-width': 1.2 }, svg);
          const hit = el('rect', { x: x(t) - 4, y: top, width: 8, height: bottom - top, fill: 'transparent' }, svg);
          hover(hit, `${l}<br>${fmtD(new Date(t).toISOString().slice(0, 10))}`); void ln;
        });
      }
    }

    function tiles(sel) {
      const w = (a, b) => N.filter(n => n.t <= LAST.t - a * DAY && n.t > LAST.t - b * DAY);
      const l30 = w(0, 30), p30 = w(30, 60);
      const a1 = mean(l30.map(n => n.a)), a0 = mean(p30.map(n => n.a));
      const b1 = mean(l30.map(n => n.on).filter(ON_OK)), b0 = mean(p30.map(n => n.on).filter(ON_OK));
      const w1 = mean(l30.map(n => n.wk).filter(WK_OK)), w0 = mean(p30.map(n => n.wk).filter(WK_OK));
      const diff = (v, b, goodUp, words) => {
        if (v == null || b == null) return 'no earlier nights to compare';
        const d = v - b, good = goodUp ? d >= 0 : d <= 0;
        return `<span class="${good ? 'up' : 'dn'}">${words ? (d > 0 ? 'later' : 'earlier') + ' ' : ''}${d >= 0 ? '▲' : '▼'} ${Math.round(Math.abs(d))} min</span> vs the 30 days before`;
      };
      const debt = debtSeries(N)[N.length - 1];
      const t = [
        ['Asleep, last 30 days', a1 != null ? hm(a1) : '—', diff(a1, a0, true)],
        ['Bedtime, last 30 days', b1 != null ? clock(b1) : '—', diff(b1, b0, false, true)],
        ['Wake time, last 30 days', w1 != null ? clock(w1) : '—', diff(w1, w0, false, true)],
        ['Sleep debt, last 14 nights', debt != null ? hm(Math.max(0, debt)) : '—', `against a ${GOAL / 60} h goal`],
        ['Nights with 7 h or more', Math.round(100 * sel.filter(n => n.a >= 420).length / sel.length) + '%', `${sel.length} nights in range`],
        ['Bedtime spread', '±' + Math.round(sd(sel.map(n => n.on).filter(ON_OK)) || 0) + ' min', 'standard deviation in range (lower = steadier)'],
      ];
      $('hb-tiles').innerHTML = t.map(([l, v, d]) => `<div class="tile"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join('');
    }

    function trend(sel) {
      const box = $('hb-trend'); box.innerHTML = '';
      const W = Math.max(600, box.clientWidth || 1000), H = 240, L = 40, Rr = 10, B = 22, T = 8;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Hours asleep per night with 14-night average' }, box);
      const t0 = sel[0].t, t1 = LAST.t, x = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - Rr), y = m => T + (1 - (Math.min(660, Math.max(180, m)) - 180) / 480) * (H - T - B);
      el('rect', { x: L, y: y(540), width: W - L - Rr, height: y(420) - y(540), fill: css('--goal') }, svg);
      [180, 300, 420, 540, 660].forEach(m => { el('line', { x1: L, x2: W - Rr, y1: y(m), y2: y(m), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(m) + 3, 'text-anchor': 'end' }, svg).textContent = m / 60 + 'h'; });
      timeAxis(svg, x, t0, t1, T, H - B, H);
      const r = sel.length > 800 ? 1.4 : sel.length > 300 ? 2 : 3;
      sel.forEach(n => { const c = el('circle', { cx: x(n.t), cy: y(n.a), r, fill: css('--sleep'), opacity: 0.3 }, svg); if (sel.length <= 800) hover(c, `${fmtD(n.d)}<br>asleep <b>${hm(n.a)}</b><br>${clock(n.on)} → ${clock(n.wk)}`); });
      el('path', { d: linePath(sel, rolling(sel, n => n.a), x, y), fill: 'none', stroke: css('--sleep'), 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
    }

    function windowChart(sel) {
      const box = $('hb-window'); box.innerHTML = '';
      const W = Math.max(600, box.clientWidth || 1000), H = 260, L = 56, Rr = 10, B = 22, T = 8, lo = -120, hi = 780;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Sleep window per night' }, box);
      const t0 = sel[0].t, t1 = LAST.t, x = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - Rr), y = m => T + (Math.min(hi, Math.max(lo, m)) - lo) / (hi - lo) * (H - T - B);
      for (let m = lo; m <= hi; m += 120) { el('line', { x1: L, x2: W - Rr, y1: y(m), y2: y(m), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(m) + 3, 'text-anchor': 'end' }, svg).textContent = clock(m).replace(':00', ''); }
      timeAxis(svg, x, t0, t1, T, H - B, H);
      const bw = Math.max(1, (W - L - Rr) / ((t1 - t0) / DAY + 1) * 0.8);
      sel.forEach(n => { const rc = el('rect', { x: x(n.t) - bw / 2, y: y(n.on), width: bw, height: Math.max(1, y(n.wk) - y(n.on)), fill: css('--sleep'), opacity: 0.28 }, svg); if (sel.length <= 800) hover(rc, `${fmtD(n.d)}<br>${clock(n.on)} → ${clock(n.wk)}<br>asleep ${hm(n.a)}`); });
      [['on', '--bed', ON_OK], ['wk', '--wake', WK_OK]].forEach(([k, c, ok]) => el('path', { d: linePath(sel, rolling(sel, n => ok(n[k]) ? n[k] : null), x, y), fill: 'none', stroke: css(c), 'stroke-width': 2.2, 'stroke-linejoin': 'round' }, svg));
    }

    function heat(id, sel, key, lo, hi, color) {
      const box = $(id); box.innerHTML = '';
      const ms = months(sel), bins = (hi - lo) / 30;
      const W = Math.max(420, box.clientWidth || 600), L = 56, Rr = 6, T = 6, B = 22, ch = 15, H = T + bins * ch + B, cw = (W - L - Rr) / ms.length;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Heatmap by month and half hour' }, box);
      const ramp = ['--h0', '--h1', '--h2', '--h3', '--h4', '--h5'].map(css);
      for (let b = 0; b <= bins; b += 2) el('text', { x: L - 6, y: T + b * ch + 4, 'text-anchor': 'end' }, svg).textContent = clock(lo + b * 30).replace(':00', '');
      const ok = key === 'on' ? ON_OK : WK_OK;
      ms.forEach((mo, i) => {
        const counts = Array(bins).fill(0);
        mo.a.forEach(n => { counts[Math.floor((Math.min(hi - 1, Math.max(lo, n[key])) - lo) / 30)]++; });
        counts.forEach((c, b) => {
          const s = c / mo.n, lvl = c === 0 ? 0 : s < 0.05 ? 1 : s < 0.12 ? 2 : s < 0.22 ? 3 : s < 0.35 ? 4 : 5;
          const r = el('rect', { x: L + i * cw + 0.5, y: T + b * ch + 0.5, width: Math.max(1, cw - 1), height: ch - 1, fill: ramp[lvl] }, svg);
          hover(r, `${monLab(mo.k)}<br>${clock(lo + b * 30)}–${clock(lo + b * 30 + 30)}<br><b>${c}</b> of ${mo.n} nights`);
        });
        const mm = +mo.k.slice(5);
        if (ms.length <= 14 || mm === 1 || (ms.length <= 30 && mm % 3 === 1)) el('text', { x: L + i * cw + 1, y: H - 6 }, svg).textContent = ms.length > 14 && mm === 1 ? mo.k.slice(0, 4) : MON[mm - 1];
        const avg = mean(mo.a.map(n => n[key]).filter(ok));
        if (avg != null) el('rect', { x: L + i * cw + cw * 0.2, y: T + (Math.min(hi, Math.max(lo, avg)) - lo) / 30 * ch - 1, width: cw * 0.6, height: 2, fill: css(color) }, svg);
      });
    }

    function debtSeries(sel) {   // running 14-night sum of (goal - asleep); the chart shows it floored at zero
      return sel.map(n => { const w = sel.filter(m => m.t <= n.t && m.t > n.t - 14 * DAY); return w.length >= 5 ? w.reduce((s, m) => s + (GOAL - m.a), 0) : null; });
    }
    function debt(sel) {
      const box = $('hb-debt'); box.innerHTML = '';
      const W = Math.max(600, box.clientWidth || 1000), H = 200, L = 48, Rr = 10, B = 22, T = 8;
      const vals = debtSeries(sel).map(v => v == null ? null : Math.max(0, v));
      const mx = Math.max(600, ...vals.filter(v => v != null));
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Sleep debt over the last 14 nights' }, box);
      const t0 = sel[0].t, t1 = LAST.t, x = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - Rr), y = v => T + (1 - v / mx) * (H - T - B);
      for (let v = 0; v <= mx; v += mx > 1500 ? 600 : 300) { el('line', { x1: L, x2: W - Rr, y1: y(v), y2: y(v), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(v) + 3, 'text-anchor': 'end' }, svg).textContent = v / 60 + 'h'; }
      timeAxis(svg, x, t0, t1, T, H - B, H);
      const d = linePath(sel, vals, x, y);
      // fill under each run
      d.split('M').filter(Boolean).forEach(seg => { const pts = seg.split('L'); const first = pts[0].split(' ')[0], last = pts[pts.length - 1].split(' ')[0]; el('path', { d: 'M' + seg + `L${last} ${y(0)}L${first} ${y(0)}Z`, fill: css('--debtbg') }, svg); });
      el('path', { d, fill: 'none', stroke: css('--debt'), 'stroke-width': 1.8, 'stroke-linejoin': 'round' }, svg);
      sel.forEach((n, i) => { if (vals[i] == null || sel.length > 400) return; const hit = el('rect', { x: x(n.t) - 2, y: T, width: 4, height: H - T - B, fill: 'transparent' }, svg); hover(hit, `${fmtD(n.d)}<br>debt <b>${hm(vals[i])}</b> over 14 nights<br>this night ${hm(n.a)}`); });
      const cur = vals[vals.length - 1], v = vals.filter(x => x != null);
      const last14 = sel.filter(n => n.t > LAST.t - 14 * DAY);
      const now = cur == null ? '' : cur > 0 ? `Right now you're ${hm(cur)} short of a ${GOAL / 60} h goal over the last 14 nights.` : `You're not behind right now: the last ${last14.length} nights averaged ${hm(mean(last14.map(n => n.a)))}, at or above a ${GOAL / 60} h goal.`;
      $('hb-debt-find').textContent = now + (v.length ? ` Across this range the 14-night debt averaged ${hm(mean(v))}.` : '');
    }

    function wakes(sel) {
      const info = sel.map(n => ({ n, w: wakeInfo(n) })).filter(x => x.w.on != null);
      const lw = info.filter(x => x.w.long);
      const pct = info.length ? Math.round(100 * lw.length / info.length) : 0;
      const med = f => median(lw.map(x => f(x.w)));
      $('hb-wk-find').textContent = !lw.length ? `No awake stretches of ${WTH}+ minutes in this range.` :
        `On ${pct}% of nights (${lw.length} of ${info.length}) you had a wake of ${WTH}+ minutes. On those nights you typically slept ${hm(med(w => w.slept))} first, were awake for ${Math.round(med(w => w.dur))} min, then slept ${hm(med(w => w.after))} more.`;
      const noWake = info.filter(x => !x.w.long);
      // the watches record wake differently, so show the share per device when both are in range
      const share = g => { const s = info.filter(x => x.n.g === g); return s.length ? Math.round(100 * s.filter(x => x.w.long).length / s.length) + '%' : null; };
      const ap = share(false), gg = share(true);
      const bySrc = ap && gg ? `<br>Apple Watch ${ap} · Pixel Watch ${gg}` : '';
      const tl = [
        ['Nights with a long wake', pct + '%', `${lw.length} of ${info.length} nights · ${WTH}+ min awake` + bySrc],
        ['First stretch, median', lw.length ? hm(med(w => w.span)) : '—', lw.length ? `${hm(med(w => w.slept))} of it asleep` : ''],
        ['Awake, median', lw.length ? Math.round(med(w => w.dur)) + ' min' : '—', 'length of the first long wake'],
        ['Sleep after it, median', lw.length ? hm(med(w => w.after)) : '—', lw.length ? `on ${Math.round(100 * lw.filter(x => x.w.after >= 60).length / lw.length)}% of these nights, 1 h or more` : ''],
        ['Asleep: long-wake nights', lw.length ? hm(mean(lw.map(x => x.n.a))) : '—', noWake.length ? `vs ${hm(mean(noWake.map(x => x.n.a)))} on other nights` : ''],
      ];
      $('hb-wk-tiles').innerHTML = tl.map(([l, v, d]) => `<div class="tile"><div class="l">${l}</div><div class="v">${v}</div><div class="d">${d}</div></div>`).join('');

      // one bar per night, measured from falling asleep
      const box = $('hb-wk-bars'); box.innerHTML = '';
      const W = Math.max(600, box.clientWidth || 1000), H = 250, L = 40, Rr = 10, T = 8, B = 22, MAXH = 720;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Each night from falling asleep: first stretch, first long wake, and sleep after it' }, box);
      const t0 = sel[0].t, t1 = LAST.t, x = t => L + (t - t0) / Math.max(1, t1 - t0) * (W - L - Rr), y = m => T + Math.min(MAXH, Math.max(0, m)) / MAXH * (H - T - B);
      for (let m = 0; m <= MAXH; m += 120) { el('line', { x1: L, x2: W - Rr, y1: y(m), y2: y(m), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(m) + 3, 'text-anchor': 'end' }, svg).textContent = m / 60 + 'h'; }
      timeAxis(svg, x, t0, t1, T, H - B, H);
      const bw = Math.max(1, (W - L - Rr) / ((t1 - t0) / DAY + 1) * 0.8);
      info.forEach(({ n, w }) => {
        const bx = x(n.t) - bw / 2, g = el('g', {}, svg);
        if (!w.long) el('rect', { x: bx, y: y(0), width: bw, height: Math.max(1, y(w.span) - y(0)), fill: css('--nowake') }, g);
        else {
          el('rect', { x: bx, y: y(0), width: bw, height: Math.max(1, y(w.span) - y(0)), fill: css('--sleep') }, g);
          el('rect', { x: bx, y: y(w.span), width: bw, height: Math.max(1, y(w.span + w.dur) - y(w.span)), fill: css('--wakewin') }, g);
          el('rect', { x: bx, y: y(w.span + w.dur), width: bw, height: Math.max(0, y(w.end - w.on) - y(w.span + w.dur)), fill: css('--after') }, g);
        }
        hover(g, w.long
          ? `${fmtD(n.d)}<br>asleep ${clock(w.on)}<br>first stretch <b>${hm(w.span)}</b> (slept ${hm(w.slept)})<br>awake <b>${Math.round(w.dur)} min</b>, ${clock(w.start)}–${clock(w.stop)}<br>then slept ${hm(w.after)}${w.count > 1 ? `<br>${w.count} long wakes in total` : ''}`
          : `${fmtD(n.d)}<br>no wake of ${WTH}+ min<br>slept ${hm(w.slept)} through to ${clock(w.end)}`);
      });
      const rm = sel.map(n => { const v = sel.filter(m => m.t <= n.t && m.t > n.t - 14 * DAY).map(wakeInfo).filter(w => w.long).map(w => w.span); return v.length >= 3 ? median(v) : null; });
      el('path', { d: linePath(sel, rm, x, y), fill: 'none', stroke: css('--bed'), 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);

      // histogram: first stretch length
      const hist = (id, vals, lo, hi, step, lab, extra) => {
        const hb = $(id); hb.innerHTML = '';
        const HW = Math.max(320, hb.clientWidth || 500), HH = 180, HL = 30, HR = 6, HT = 14, HB = 22, nb = Math.round((hi - lo) / step);
        const cnt = Array(nb).fill(0), grp = Array.from({ length: nb }, () => []);
        vals.forEach(([v, e]) => { const b = Math.max(0, Math.min(nb - 1, Math.floor((v - lo) / step))); cnt[b]++; grp[b].push(e); });
        const mx = Math.max(1, ...cnt), bwid = (HW - HL - HR) / nb;
        const hs = el('svg', { viewBox: `0 0 ${HW} ${HH}`, role: 'img', 'aria-label': lab }, hb);
        const yy = c => HT + (1 - c / mx) * (HH - HT - HB);
        [0, Math.ceil(mx / 2), mx].forEach(c => { el('line', { x1: HL, x2: HW - HR, y1: yy(c), y2: yy(c), stroke: css('--grid') }, hs); el('text', { x: HL - 5, y: yy(c) + 3, 'text-anchor': 'end' }, hs).textContent = c; });
        cnt.forEach((c, i) => {
          const r = el('rect', { x: HL + i * bwid + 1, y: yy(c), width: Math.max(1, bwid - 2), height: yy(0) - yy(c), fill: css(extra.color), rx: 1.5 }, hs);
          hover(r, extra.tip(lo + i * step, c, grp[i]));
          if (extra.top && c) el('text', { x: HL + i * bwid + bwid / 2, y: yy(c) - 3, 'text-anchor': 'middle', style: 'font-size:9px' }, hs).textContent = extra.top(grp[i]);
          if (i % extra.every === 0) el('text', { x: HL + i * bwid, y: HH - 6 }, hs).textContent = extra.x(lo + i * step);
        });
      };
      hist('hb-wk-hist', lw.map(x => [x.w.span, x.w]), 0, 480, 30, 'Histogram of the first stretch of sleep', {
        color: '--sleep', every: 2, x: v => v / 60 + 'h',
        tip: (v, c) => `first stretch ${hm(v)}–${hm(v + 30)}<br><b>${c}</b> nights`
      });
      hist('hb-wk-clock', lw.map(x => [x.w.start, x.w]), 60, 660, 30, 'When the first long wake starts', {
        color: '--wakewin', every: 4, x: v => clock(v).replace(':00', ''),
        top: g => Math.round(median(g.map(w => w.dur))) + 'm',
        tip: (v, c, g) => `${clock(v)}–${clock(v + 30)}<br><b>${c}</b> nights${g.length ? `<br>median awake ${Math.round(median(g.map(w => w.dur)))} min` : ''}`
      });
    }

    function mom(sel) {
      const ms = months(sel).filter(m => m.n >= 5);
      if (!ms.length) { $('hb-mom').innerHTML = ''; $('hb-mom-find').textContent = ''; return; }
      const prev = new Map(ms.map((m, i) => [m.k, ms[i - 1]]));
      const arrow = (v, p, good) => { if (p == null || v == null) return ''; const d = v - p; if (Math.abs(d) < 5) return '<span class="sub">·</span>'; const ok = good === 'up' ? d > 0 : good === 'down' ? d < 0 : null; return `<span class="${ok == null ? '' : ok ? 'up' : 'dn'}">${d > 0 ? '▲' : '▼'}${Math.round(Math.abs(d))}</span>`; };
      const rows = ORDER === 'old' ? ms : ms.slice().reverse(), maxA = Math.max(...ms.map(m => m.asleep));
      $('hb-mom').innerHTML = '<thead><tr><th>Month</th><th>Nights</th><th style="text-align:left">Asleep</th><th>Δ</th><th>Bedtime</th><th>Δ</th><th>Wake</th><th>Δ</th><th>Bedtime spread</th><th>≥ 7 h</th><th>Deep</th><th>REM</th><th>Long wake</th><th>First stretch</th></tr></thead><tbody>' +
        rows.map(m => { const p = prev.get(m.k); return `<tr><td>${monLab(m.k)}</td><td>${m.n}</td><td style="text-align:left"><span class="bar" style="width:${Math.round(80 * m.asleep / maxA)}px"></span>${hm(m.asleep)}</td><td>${arrow(m.asleep, p && p.asleep, 'up')}</td><td>${m.on != null ? clock(m.on) : '—'}</td><td>${arrow(m.on, p && p.on, 'down')}</td><td>${m.wk != null ? clock(m.wk) : '—'}</td><td>${arrow(m.wk, p && p.wk, 'none')}</td><td>${m.sdOn != null ? '±' + Math.round(m.sdOn) + ' min' : '—'}</td><td>${Math.round(100 * m.p7)}%</td><td>${m.deep ? Math.round(m.deep) + 'm' : '—'}</td><td>${m.rem ? Math.round(m.rem) + 'm' : '—'}</td><td>${Math.round(100 * m.lw)}%</td><td>${m.fs != null ? hm(m.fs) : '—'}</td></tr>`; }).join('') + '</tbody>';
      const full = ms.filter(m => m.n >= 12).length ? ms.filter(m => m.n >= 12) : ms;
      const best = full.reduce((a, b) => b.asleep > a.asleep ? b : a), worst = full.reduce((a, b) => b.asleep < a.asleep ? b : a);
      $('hb-mom-find').textContent = `Among months with 12 or more nights, the longest was ${monLab(best.k)} (${hm(best.asleep)} a night) and the shortest was ${monLab(worst.k)} (${hm(worst.asleep)}).`;
    }

    function monthLines(id, sel, series, lo, hi, unit, label) {
      const box = $(id); box.innerHTML = '';
      const ms = months(sel).filter(m => m.n >= 5);
      const W = Math.max(420, box.clientWidth || 600), H = 220, L = 44, Rr = 10, T = 8, B = 22;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': label }, box);
      if (!ms.length) return;
      const x = i => L + (ms.length === 1 ? 0.5 : i / (ms.length - 1)) * (W - L - Rr), y = v => T + (1 - (Math.min(hi, Math.max(lo, v)) - lo) / (hi - lo)) * (H - T - B);
      for (let v = lo; v <= hi; v += (hi - lo) / 4) { el('line', { x1: L, x2: W - Rr, y1: y(v), y2: y(v), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(v) + 3, 'text-anchor': 'end' }, svg).textContent = Math.round(v) + unit; }
      ms.forEach((m, i) => { const mm = +m.k.slice(5); if (ms.length <= 14 || mm === 1 || (ms.length <= 30 && mm % 3 === 1)) el('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = ms.length > 14 && mm === 1 ? m.k.slice(0, 4) : MON[mm - 1]; });
      series.forEach(([key, color]) => {
        let d = '', prevI = null;
        ms.forEach((m, i) => { const v = m[key]; if (v == null) { prevI = null; return; } d += (prevI == null ? 'M' : 'L') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); prevI = i; });
        el('path', { d, fill: 'none', stroke: css(color), 'stroke-width': 2, 'stroke-linejoin': 'round' }, svg);
        ms.forEach((m, i) => { if (m[key] == null) return; const c = el('circle', { cx: x(i), cy: y(m[key]), r: ms.length > 40 ? 1.5 : 3, fill: css(color) }, svg); hover(c, `${monLab(m.k)}<br>${Math.round(m[key])} ${unit === 'm' ? 'min' : unit} · ${m.n} nights`); });
      });
    }

    function dow(sel) {
      const box = $('hb-dow'); box.innerHTML = '';
      const W = Math.max(420, box.clientWidth || 600), L = 44, Rr = 70, T = 8, rh = 30, B = 22, H = T + 7 * rh + B, lo = -60, hi = 720;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Average sleep window by weekday' }, box);
      const x = m => L + (m - lo) / (hi - lo) * (W - L - Rr);
      for (let m = lo; m <= hi; m += 120) { el('line', { x1: x(m), x2: x(m), y1: T, y2: H - B, stroke: css('--grid') }, svg); el('text', { x: x(m), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = clock(m).replace(':00', ''); }
      const res = {};
      [1, 2, 3, 4, 5, 6, 0].forEach((wd, i) => {
        const a = sel.filter(n => new Date(n.t).getUTCDay() === wd);
        const on = mean(a.map(n => n.on).filter(ON_OK)), wk = mean(a.map(n => n.wk).filter(WK_OK)), as = mean(a.map(n => n.a));
        res[wd] = { on, wk };
        const y = T + i * rh, we = wd === 5 || wd === 6;
        el('text', { x: 0, y: y + rh / 2 + 4, style: `font-weight:${we ? 600 : 400};fill:${css(we ? '--ink' : '--muted')}` }, svg).textContent = DOW[wd];
        if (on == null || wk == null) return;
        const r = el('rect', { x: x(on), y: y + 6, width: Math.max(1, x(wk) - x(on)), height: rh - 12, rx: 3, fill: css(we ? '--bed' : '--sleep'), opacity: we ? 0.55 : 0.75 }, svg);
        hover(r, `${DOW[wd]} nights (${a.length})<br>${clock(on)} → ${clock(wk)}<br>asleep ${hm(as)}`);
        el('text', { x: x(wk) + 6, y: y + rh / 2 + 4, style: `fill:${css('--ink')}` }, svg).textContent = hm(as);
      });
      const mid = ds => mean(ds.map(d => res[d].on != null && res[d].wk != null ? (res[d].on + res[d].wk) / 2 : null).filter(v => v != null));
      const sjl = mid([5, 6]) - mid([0, 1, 2, 3, 4]);
      $('hb-sjl').textContent = isFinite(sjl) ? `Friday and Saturday nights run ${Math.round(Math.abs(sjl))} min ${sjl >= 0 ? 'later' : 'earlier'} than weeknights at the midpoint of sleep. Sleep researchers call this "social jet lag".` : '';
    }

    function yoy() {
      const box = $('hb-yoy'); box.innerHTML = '';
      const W = Math.max(420, box.clientWidth || 600), H = 240, L = 40, Rr = 10, T = 8, B = 22;
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Average hours asleep per month by year' }, box);
      const x = m => L + m / 11 * (W - L - Rr), y = v => T + (1 - (Math.min(510, Math.max(300, v)) - 300) / 210) * (H - T - B);
      [300, 360, 420, 480].forEach(v => { el('line', { x1: L, x2: W - Rr, y1: y(v), y2: y(v), stroke: css('--grid') }, svg); el('text', { x: L - 6, y: y(v) + 3, 'text-anchor': 'end' }, svg).textContent = v / 60 + 'h'; });
      MON.forEach((m, i) => el('text', { x: x(i), y: H - 6, 'text-anchor': 'middle' }, svg).textContent = m);
      const ms = months(N).filter(m => m.n >= 8), years = [...new Set(ms.map(m => m.k.slice(0, 4)))].slice(-4), pal = ['--h2', '--h3', '--bed', '--wake'];
      $('hb-yoy-leg').innerHTML = years.map((yr, i) => `<span><i class="sw" style="height:3px;background:var(${pal[i]})"></i>${yr}</span>`).join('') + '<span>(last 4 years with data; months with 8+ nights)</span>';
      years.forEach((yr, i) => {
        const pts = ms.filter(m => m.k.startsWith(yr));
        let d = '', prev = null;
        pts.forEach(m => { const mi = +m.k.slice(5) - 1; d += (prev != null && mi === prev + 1 ? 'L' : 'M') + x(mi).toFixed(1) + ' ' + y(m.asleep).toFixed(1); prev = mi; });
        el('path', { d, fill: 'none', stroke: css(pal[i]), 'stroke-width': i === years.length - 1 ? 2.6 : 1.6 }, svg);
        pts.forEach(m => { const c = el('circle', { cx: x(+m.k.slice(5) - 1), cy: y(m.asleep), r: 3, fill: css(pal[i]) }, svg); hover(c, `${monLab(m.k)}<br>${hm(m.asleep)} a night · ${m.n} nights`); });
      });
    }

    function cpap() {
      const days = Object.keys(mask).filter(d => mask[d] > 0).sort();
      if (!days.length) { $('hb-cpap-sub').textContent = 'No CPAP data in apnea.json.'; return; }
      const a = days[0], b = days[days.length - 1];
      const span = N.filter(n => n.d >= a && n.d <= b);
      const on = span.filter(n => (mask[n.d] || 0) >= 120), off = span.filter(n => !((mask[n.d] || 0) >= 120));
      $('hb-cpap-sub').textContent = `${fmtD(a)} – ${fmtD(b)} · ${on.length} CPAP nights, ${off.length} other nights`;
      const row = (l, f, fmt) => { const v1 = mean(on.map(f).filter(v => v != null)), v0 = mean(off.map(f).filter(v => v != null)); return `<tr><td>${l}</td><td>${v1 == null ? '—' : fmt(v1)}</td><td>${v0 == null ? '—' : fmt(v0)}</td><td>${v1 == null || v0 == null ? '' : (v1 - v0 >= 0 ? '+' : '') + Math.round(v1 - v0) + (l === 'Wake-ups' ? '' : ' min')}</td></tr>`; };
      $('hb-cpap').innerHTML = '<thead><tr><th></th><th>CPAP nights</th><th>Other nights</th><th>Difference</th></tr></thead><tbody>' +
        row('Asleep', n => n.a, hm) + row('Awake in the night', n => n.aw, v => Math.round(v) + 'm') + row('Wake-ups', n => n.wu, v => v.toFixed(1)) +
        row('Deep', n => n.deep, v => Math.round(v) + 'm') + row('REM', n => n.rem, v => Math.round(v) + 'm') +
        row('Bedtime', n => ON_OK(n.on) ? n.on : null, clock) + row('Wake time', n => WK_OK(n.wk) ? n.wk : null, clock) + '</tbody>';
      const d = mean(on.map(n => n.a)) - mean(off.map(n => n.a));
      $('hb-cpap-find').textContent = on.length && off.length ? `On CPAP nights you slept ${hm(Math.abs(d))} ${d >= 0 ? 'more' : 'less'} on average than on other nights in the same period.` : '';
    }

    // ---------- wake heatmaps (square cells)
    const DUR = [[5, 10, '5–10m'], [10, 15, '10–15m'], [15, 20, '15–20m'], [20, 30, '20–30m'], [30, 45, '30–45m'], [45, 60, '45–60m'], [60, 90, '60–90m'], [90, 120, '90–120m'], [120, 1e9, '2h+']];
    const durRow = m => DUR.findIndex(([a, b]) => m >= a && m < b);
    const srcOk = n => HW.src === 'both' || (HW.src === 'google') === n.g;
    function sqHeat(id, ws, colOf, cols, colLab, colTip, every) {
      const box = $(id); box.innerHTML = '';
      const avail = Math.max(360, box.clientWidth || 600), L = 62, R = 64, T = 46, B = 24, rows = DUR.length;
      const cs = Math.max(14, Math.min(30, Math.floor((avail - L - R) / cols)));
      const W = L + cols * cs + R, H = T + rows * cs + B;
      const svg = el('svg', { class: 'fixed', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img' }, box);
      const grid = Array.from({ length: rows }, () => Array(cols).fill(0)), cell = Array.from({ length: rows }, () => Array.from({ length: cols }, () => []));
      ws.forEach(w => { const c = colOf(w), r = durRow(w.dur); if (c < 0 || c >= cols || r < 0) return; grid[r][c]++; cell[r][c].push(w); });
      const mx = Math.max(1, ...grid.flat()), pal = RDYLGN.slice().reverse();   // more wakes = redder
      const lvl = c => c === 0 ? -1 : Math.min(5, Math.floor(6 * Math.sqrt(c / mx) - 1e-9));
      DUR.forEach((d, r) => el('text', { x: L - 6, y: T + r * cs + cs / 2 + 4, 'text-anchor': 'end' }, svg).textContent = d[2]);
      el('text', { x: L - 6, y: T - 32, 'text-anchor': 'end', style: 'font-weight:600' }, svg).textContent = 'awake';
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const v = grid[r][c], lv = lvl(v);
        const rect = el('rect', { x: L + c * cs, y: T + r * cs, width: cs, height: cs, fill: lv < 0 ? css('--empty') : pal[lv], stroke: '#fff', 'stroke-width': 1.5 }, svg);
        if (v && cs >= 22) el('text', { x: L + c * cs + cs / 2, y: T + r * cs + cs / 2 + 3.5, 'text-anchor': 'middle', style: `font-size:9.5px;font-weight:600;fill:${lv >= 4 ? '#fff' : '#111418'};pointer-events:none` }, svg).textContent = v;
        const ex = cell[r][c].slice(-3).map(w => `${fmtD(w.n.d)} · ${clock(w.s)} · ${Math.round(w.dur)}m`).join('<br>');
        hover(rect, `${colTip(c)}<br>awake ${DUR[r][2]}<br><b>${v}</b> wake${v === 1 ? '' : 's'}${ex ? '<br><span style="opacity:.7">latest:<br>' + ex + '</span>' : ''}`);
      }
      el('rect', { x: L, y: T, width: cols * cs, height: rows * cs, fill: 'none', stroke: css('--monthline'), 'stroke-width': 1.5 }, svg);
      el('line', { x1: L, x2: L + cols * cs, y1: T + 3 * cs, y2: T + 3 * cs, stroke: css('--monthline'), 'stroke-width': 2 }, svg);
      el('text', { x: L + cols * cs + 4, y: T + 3 * cs + 3, style: 'font-size:9px' }, svg).textContent = '20m';
      const colT = Array.from({ length: cols }, (_, c) => grid.reduce((s, row) => s + row[c], 0)), rowT = grid.map(r => r.reduce((a, b) => a + b, 0));
      const mc = Math.max(1, ...colT), mr = Math.max(1, ...rowT), barC = pal[1];
      colT.forEach((v, c) => { const h = 26 * v / mc; const b = el('rect', { x: L + c * cs + 2, y: T - 6 - h, width: cs - 4, height: h, fill: barC }, svg); hover(b, `${colTip(c)}<br><b>${v}</b> wakes in total`); });
      rowT.forEach((v, r) => { const w = (R - 40) * v / mr; const b = el('rect', { x: L + cols * cs + 26, y: T + r * cs + 4, width: w, height: cs - 8, fill: barC }, svg); hover(b, `awake ${DUR[r][2]}<br><b>${v}</b> wakes in total`); if (v) el('text', { x: L + cols * cs + 29 + w, y: T + r * cs + cs / 2 + 3, style: 'font-size:9px' }, svg).textContent = v; });
      for (let c = 0; c < cols; c += every) el('text', { x: L + c * cs, y: H - 6 }, svg).textContent = colLab(c);
    }
    function wakeHeat() {
      if (HW.end == null) HW.end = LAST.t;
      const ns = N.filter(n => n.t > HW.end - HW.win * DAY && n.t <= HW.end && srcOk(n));
      const ws = [];
      ns.forEach(n => {
        const nw = nightWakes(n);
        if (HW.kind === 'all') nw.forEach(w => ws.push({ n, s: w[0], dur: w[1], since: w[2] }));
        else { const w = nw.find(w => w[1] >= 20); if (w) ws.push({ n, s: w[0], dur: w[1], since: w[2] }); }
      });
      const start = HW.end - HW.win * DAY + DAY;
      $('hb-wh-cover').textContent = `${fmtD(new Date(Math.max(start, N[0].t)).toISOString().slice(0, 10))} – ${fmtD(new Date(HW.end).toISOString().slice(0, 10))} · ${ns.length} nights · ${ws.length} ${HW.kind === 'all' ? 'wakes of 5 min+' : 'first long wakes'}`;
      $('hb-wh-prev').disabled = start <= N[0].t; $('hb-wh-next').disabled = HW.end >= LAST.t;
      sqHeat('hb-wh1', ws, w => Math.floor((w.s - 60) / 30), 24, c => clock(60 + c * 30).replace(':00', ''), c => `${clock(60 + c * 30)}–${clock(90 + c * 30)}`, 4);
      sqHeat('hb-wh2', ws, w => Math.floor(w.since / 30), 20, c => (c / 2) + 'h', c => `${c / 2}–${(c + 1) / 2} h after falling asleep`, 2);
      const long = ws.filter(w => w.dur >= 20);
      if (!ws.length) { $('hb-wh-find').textContent = 'No wakes in this window.'; return; }
      const cnt = Array(24).fill(0); long.forEach(w => { const i = Math.floor((w.s - 60) / 30); if (i >= 0 && i < 24) cnt[i]++; });
      const peak = cnt.indexOf(Math.max(...cnt));
      $('hb-wh-find').textContent = `${ws.length} wakes in ${ns.length} nights; ${long.length} lasted 20 min or more` + (long.length ? ` (median ${Math.round(median(long.map(w => w.dur)))} min). Long wakes came most often around ${clock(60 + peak * 30)}, a median of ${(median(long.map(w => w.since)) / 60).toFixed(1)} h after falling asleep.` : '.');
    }

    // ---------- calendar heatmap, colored by a chosen measure (green = good night)
    const firstStretch = n => { const w = nightWakes(n).find(w => w[1] >= 20); return w ? w[2] : n.wk - n.on; };
    const CM = {
      asleep: { l: 'Hours asleep', get: n => n.a, bins: [300, 360, 420, 480, 540], fmt: hm, lab: ['<5h', '5–6h', '6–7h', '7–8h', '8–9h', '9h+'], good: 'high' },
      awake: { l: 'Awake in the night', get: n => nightWakes(n).reduce((s, w) => s + w[1], 0), bins: [10, 20, 40, 60, 90], fmt: v => Math.round(v) + ' min', lab: ['<10m', '10–20m', '20–40m', '40–60m', '60–90m', '90m+'], good: 'low' },
      longest: { l: 'Longest wake', get: n => nightWakes(n).reduce((m, w) => Math.max(m, w[1]), 0), bins: [5, 15, 20, 30, 60], fmt: v => v ? Math.round(v) + ' min' : 'none', lab: ['none', '5–15m', '15–20m', '20–30m', '30–60m', '60m+'], good: 'low' },
      stretch: { l: 'First unbroken stretch', get: firstStretch, bins: [120, 180, 240, 300, 360], fmt: hm, lab: ['<2h', '2–3h', '3–4h', '4–5h', '5–6h', '6h+'], good: 'high' },
      bedtime: { l: 'Bedtime', get: n => n.on, bins: [60, 120, 180, 240, 300], fmt: clock, lab: ['<10 PM', '10–11 PM', '11–12', '12–1 AM', '1–2 AM', '2 AM+'], good: 'low' },
      deep: { l: 'Deep sleep', get: n => n.deep, bins: [30, 45, 60, 75, 90], fmt: v => Math.round(v) + ' min', lab: ['<30m', '30–45m', '45–60m', '60–75m', '75–90m', '90m+'], good: 'high' },
    };
    let CAL = 'asleep';
    const binOf = (v, bins) => { let i = 0; while (i < bins.length && v >= bins[i]) i++; return i; };
    function cal(sel) {
      const box = $('hb-cal'); box.innerHTML = '';
      const M = CM[CAL], pal = M.good === 'high' ? RDYLGN : RDYLGN.slice().reverse();
      $('hb-cal-leg').innerHTML = `<span>${M.l}:</span>` + M.lab.map((l, i) => `<span class="ckey"><i style="background:${pal[i]}"></i>${l}</span>`).join('') + '<span class="ckey"><i style="background:#fff;border:1px solid var(--line)"></i>no data</span>';
      const byD = new Map(N.map(n => [n.d, n])), inSel = new Set(sel.map(n => n.d));
      const y1 = +LAST.d.slice(0, 4), y0 = Math.min(+sel[0].d.slice(0, 4), y1 - 1);
      const years = []; for (let y = y1; y >= y0; y--) if (y === y1 || y === y1 - 1 || N.some(n => n.d.startsWith(String(y)))) years.push(y);
      const avail = Math.max(700, box.clientWidth || 1000), L = 70, cs = Math.max(12, Math.min(20, Math.floor((avail - L - 8) / 54)));
      const yh = cs * 7 + 30, W = L + cs * 54 + 8, H = years.length * yh + 4;
      const svg = el('svg', { class: 'fixed', viewBox: `0 0 ${W} ${H}`, width: W, height: H, role: 'img', 'aria-label': 'Calendar heatmap, ' + M.l }, box);
      years.forEach((yr, yi) => {
        const top = yi * yh + 22, jan1 = Date.UTC(yr, 0, 1, 12), off = new Date(jan1).getUTCDay();
        const g = el('g', { transform: `translate(${L} ${top})` }, svg);
        el('text', { x: -L + 4, y: cs * 3.5 + 5, style: `font-size:14px;font-weight:600;fill:${css('--ink')}`, transform: `rotate(-90 ${-L + 14} ${cs * 3.5})` }, g).textContent = yr;
        DOW.forEach((d, i) => el('text', { x: -6, y: i * cs + cs / 2 + 4, 'text-anchor': 'end' }, g).textContent = d);
        const pos = t => { const day = Math.round((t - jan1) / DAY); return [Math.floor((day + off) / 7), new Date(t).getUTCDay()]; };
        for (let t = jan1; new Date(t).getUTCFullYear() === yr; t += DAY) {
          const [wk, wd] = pos(t), d = new Date(t).toISOString().slice(0, 10), n = byD.get(d), v = n ? M.get(n) : null;
          const r = el('rect', { x: wk * cs, y: wd * cs, width: cs, height: cs, fill: v == null ? '#fff' : pal[binOf(v, M.bins)], stroke: css('--line'), 'stroke-width': 0.8, opacity: v == null || inSel.has(d) ? 1 : 0.3 }, g);
          if (v != null) { const nw = nightWakes(n); hover(r, `${fmtD(d)}<br>${M.l}: <b>${M.fmt(v)}</b><br>asleep ${hm(n.a)} · ${clock(n.on)} → ${clock(n.wk)}<br>${nw.length ? `${nw.length} wake${nw.length > 1 ? 's' : ''} of 5 min+, longest ${Math.round(Math.max(...nw.map(w => w[1])))} min` : 'no wakes of 5 min+'}`); }
        }
        for (let m = 0; m < 12; m++) {
          const [w0, d0] = pos(Date.UTC(yr, m, 1, 12)), [w1, d1] = pos(Date.UTC(yr, m + 1, 0, 12));
          el('path', { d: `M${(w0 + 1) * cs},${d0 * cs}H${w0 * cs}V${7 * cs}H${w1 * cs}V${(d1 + 1) * cs}H${(w1 + 1) * cs}V0H${(w0 + 1) * cs}Z`, fill: 'none', stroke: css('--monthline'), 'stroke-width': 2 }, g);
          el('text', { x: (w0 + w1 + 1) / 2 * cs, y: -6, 'text-anchor': 'middle', style: `font-size:12px;fill:${css('--ink2')}` }, g).textContent = MON[m];
        }
      });
    }

    function render() {
      const sel = inRange();
      if (!sel.length) return;
      $('hb-cover').textContent = `${sel.length} nights · ${fmtD(sel[0].d)} – ${fmtD(LAST.d)} · ${sel.some(n => n.g) ? 'Apple Watch + Google Health' : 'Apple Watch'}`;
      tiles(sel); trend(sel); windowChart(sel);
      heat('hb-hm-bed', sel, 'on', -60, 360, '--bed'); heat('hb-hm-wake', sel, 'wk', 360, 900, '--wake');
      debt(sel); wakes(sel); mom(sel);
      monthLines('hb-cons', sel, [['sdOn', '--bed'], ['sdWk', '--wake']], 0, 160, 'm', 'Bedtime and wake time spread per month');
      monthLines('hb-stages', sel.filter(n => n.deep || n.rem), [['deep', '--deep'], ['rem', '--rem']], 0, 160, 'm', 'Deep and REM minutes per month');
      dow(sel); yoy(); cpap();
      wakeHeat(); cal(sel);
    }
    const press = (sel, b) => host.querySelectorAll(sel).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    host.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { R = b.dataset.r; press('[data-r]', b); render(); });
    host.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { GOAL = +b.dataset.g; press('[data-g]', b); tiles(inRange()); debt(inRange()); });
    host.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { WTH = +b.dataset.w; press('[data-w]', b); wakes(inRange()); mom(inRange()); });
    $('hb-cal-metrics').innerHTML = Object.entries(CM).map(([k, m]) => `<button type="button" data-cm="${k}" aria-pressed="${k === CAL}">${m.l}</button>`).join('');
    host.querySelectorAll('[data-cm]').forEach(b => b.onclick = () => { CAL = b.dataset.cm; press('[data-cm]', b); cal(inRange()); });
    host.querySelectorAll('[data-hw]').forEach(b => b.onclick = () => { HW.win = +b.dataset.hw; press('[data-hw]', b); wakeHeat(); });
    host.querySelectorAll('[data-hk]').forEach(b => b.onclick = () => { HW.kind = b.dataset.hk; press('[data-hk]', b); wakeHeat(); });
    host.querySelectorAll('[data-hs]').forEach(b => b.onclick = () => { HW.src = b.dataset.hs; press('[data-hs]', b); wakeHeat(); });
    $('hb-wh-prev').onclick = () => { HW.end = Math.max(N[0].t + HW.win * DAY, HW.end - HW.win * DAY); wakeHeat(); };
    $('hb-wh-next').onclick = () => { HW.end = Math.min(LAST.t, HW.end + HW.win * DAY); wakeHeat(); };
    host.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { ORDER = b.dataset.s; press('[data-s]', b); mom(inRange()); });

    render();
    return { redraw: render };
  }

  window.SleepHabits = { mount };
})();
