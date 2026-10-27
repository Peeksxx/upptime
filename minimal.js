(function () {
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  if (window.__pkLoaded) return;
  window.__pkLoaded = true;
  var START = '2026-10-27', OWNER = 'peeksxx', REPO = 'upptime', DAYS = 90, INC_DAYS = 7;
  var META = {
    'video': {n: 'video.peeksxx.dev'},
    'e6-scroller': {n: 'e6Scroller', sub: 'e6scroller.net', construction: true}
  };
  var CSS = 'html,body{background:#faf8f4!important;margin:0}' +
    'body>*:not(#pk){display:none!important}' +
    '#pk{max-width:960px;margin:0 auto;padding:48px 16px 72px;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#333}' +
    '#pk h1{font-size:22px;font-weight:600;margin:0 0 24px;color:#222}' +
    '#pk h2{font-size:22px;font-weight:600;margin:56px 0 16px;color:#222}' +
    '#pk .sub{color:#8a8a85;text-align:right;font-size:14px;margin:0 0 10px}' +
    '#pk .sub a{color:#111;text-decoration:none}' +
    '#pk .card{background:#fcfbf8;border:1px solid #e4e2dc;border-radius:4px}' +
    '#pk .row{padding:26px 30px 24px;border-top:1px solid #e4e2dc}' +
    '#pk .row:first-child{border-top:0}' +
    '#pk .top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}' +
    '#pk .name{font-size:18px;color:#222}' +
    '#pk .name small{font-size:14px;color:#a9a8a2;margin-left:8px}' +
    '#pk .st{font-size:16px}' +
    '#pk .bars{display:flex;gap:2px;height:50px}' +
    '#pk .bars i{flex:1;border-radius:1px;min-width:1px}' +
    '#pk .foot{display:flex;align-items:center;gap:14px;color:#8a8a85;margin-top:10px;font-size:15px}' +
    '#pk .foot b{flex:1;height:1px;background:#8a8a85;opacity:.5}' +
    '#pk .day{padding:22px 0 18px;border-top:1px solid #e4e2dc}' +
    '#pk .day:first-of-type{border-top:0;padding-top:0}' +
    '#pk .day h3{font-size:18px;font-weight:600;margin:0 0 10px;color:#222}' +
    '#pk .none{color:#8a8a85}' +
    '#pk .inc{margin:0 0 14px}' +
    '#pk .inc a{color:#222;text-decoration:none;font-size:17px;font-weight:600}' +
    '#pk .inc a:hover{text-decoration:underline}' +
    '#pk .inc p{margin:4px 0 0;color:#555;font-size:15px}' +
    '#pk .inc p b{font-weight:600}' +
    '#pk .inc small{display:block;color:#8a8a85;font-size:13px;margin-top:2px}';
  var G = '#79b02d', Y = '#c9ae2a', O = '#f58a2f', R = '#e04545', N = '#dcdad4', GR = '#8a8a85';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function utcDay(offset) { var d = new Date(); d.setUTCDate(d.getUTCDate() - offset); return d.toISOString().slice(0, 10); }
  function localDay(d) { return d.toLocaleDateString('en-CA'); }
  function clean(t) { return String(t).replace(/[\u{1F000}-\u{1FFFF}☀-➿️‍]/gu, '').replace(/\s+/g, ' ').trim(); }
  function render(sites, issues) {
    var old = document.getElementById('pk');
    if (old) old.remove();
    var el = document.createElement('div');
    el.id = 'pk';
    var hidden = {};
    var h = '<h1>Peeksxx Status</h1><div class="sub">Uptime over the past ' + DAYS + ' days. <a href="https://github.com/' + OWNER + '/' + REPO + '">View historical uptime.</a></div><div class="card">';
    sites.forEach(function (s) {
      var m0 = META[s.slug] || {};
      if (m0.construction) hidden[s.slug] = true;
      var daily = s.dailyMinutesDown || {};
      var bars = '';
      for (var i = DAYS - 1; i >= 0; i--) {
        var k = utcDay(i), c, t;
        if (k < START) { c = N; t = k + ': no data'; }
        else if (m0.construction) { c = N; t = k + ': under construction'; }
        else {
          var m = daily[k] || 0;
          c = m === 0 ? G : m < 10 ? Y : m < 60 ? O : R;
          t = k + (m ? ': ' + m + ' min down' : ': no downtime');
          if (i === 0 && s.status === 'down') { c = R; t = k + ': down'; }
          if (i === 0 && s.status === 'degraded') { c = O; t = k + ': degraded'; }
        }
        bars += '<i style="background:' + c + '" title="' + t + '"></i>';
      }
      var lbl = m0.construction ? ['Under construction', GR] : s.status === 'up' ? ['Operational', G] : s.status === 'down' ? ['Down', R] : ['Degraded', O];
      var mid = m0.construction ? 'Not monitored yet' : esc(s.uptimeYear || '').replace('%', ' %') + ' uptime';
      h += '<div class="row"><div class="top"><span class="name">' + esc(m0.n || s.name) + (m0.sub ? '<small>' + esc(m0.sub) + '</small>' : '') + '</span><span class="st" style="color:' + lbl[1] + '">' + lbl[0] + '</span></div><div class="bars">' + bars + '</div><div class="foot"><span>' + DAYS + ' days ago</span><b></b><span>' + mid + '</span><b></b><span>Today</span></div></div>';
    });
    h += '</div><h2>Past Incidents</h2>';
    var byDay = {};
    issues.forEach(function (i) {
      var skip = (i.labels || []).some(function (l) { return hidden[l.name]; });
      if (skip) return;
      var k = localDay(new Date(i.created_at));
      (byDay[k] = byDay[k] || []).push(i);
    });
    var out = '';
    for (var j = 0; j < INC_DAYS; j++) {
      var d = new Date(); d.setDate(d.getDate() - j);
      var key = localDay(d);
      var title = d.toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
      var list = byDay[key] || [];
      out += '<div class="day"><h3>' + title + '</h3>';
      if (!list.length) out += '<div class="none">No incidents reported.</div>';
      list.forEach(function (i) {
        var time = new Date(i.created_at).toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'});
        var stat = i.state === 'open' ? 'Investigating' : 'Resolved';
        var body = i.comments ? i.comments + ' update' + (i.comments > 1 ? 's' : '') + ' posted.' : 'No statements have been published yet.';
        out += '<div class="inc"><a href="/incident/' + i.number + '" rel="external">' + esc(clean(i.title)) + '</a><p><b>' + stat + '</b> - ' + body + '</p><small>' + time + '</small></div>';
      });
      out += '</div>';
    }
    el.innerHTML = h + '<div class="card" style="padding:26px 30px">' + out + '</div>';
    document.body.appendChild(el);
  }
  function go() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    var base = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/master/history/summary.json';
    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/issues?state=all&labels=status&per_page=50';
    Promise.all([
      fetch(base).then(function (r) { return r.json(); }),
      fetch(api).then(function (r) { return r.json(); }).then(function (a) { return Array.isArray(a) ? a.filter(function (x) { return !x.pull_request; }) : []; }).catch(function () { return []; })
      ]).then(function (v) { render(v[0], v[1]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
