(function () {
  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  var START = '2026-10-27', OWNER = 'peeksxx', REPO = 'upptime', DAYS = 90;
  var CSS = 'html,body{background:#faf8f4!important;margin:0}' +
    'body>*:not(#pk){display:none!important}' +
    '#pk{max-width:960px;margin:0 auto;padding:48px 16px 72px;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#333}' +
    '#pk h1{font-size:22px;font-weight:600;margin:0 0 24px;color:#222}' +
    '#pk h2{font-size:18px;font-weight:600;margin:48px 0 12px;color:#222}' +
    '#pk .sub{color:#8a8a85;text-align:right;font-size:14px;margin:0 0 10px}' +
    '#pk .sub a{color:#111;text-decoration:none}' +
    '#pk .card{background:#fcfbf8;border:1px solid #e4e2dc;border-radius:4px}' +
    '#pk .row{padding:26px 30px 24px;border-top:1px solid #e4e2dc}' +
    '#pk .row:first-child{border-top:0}' +
    '#pk .top{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px}' +
    '#pk .name{font-size:18px;color:#222}' +
    '#pk .st{font-size:16px}' +
    '#pk .bars{display:flex;gap:2px;height:50px}' +
    '#pk .bars i{flex:1;border-radius:1px;min-width:1px}' +
    '#pk .foot{display:flex;align-items:center;gap:14px;color:#8a8a85;margin-top:10px;font-size:15px}' +
    '#pk .foot b{flex:1;height:1px;background:#8a8a85;opacity:.5}' +
    '#pk .inc{padding:18px 30px;border-top:1px solid #e4e2dc}' +
    '#pk .inc:first-child{border-top:0}' +
    '#pk .inc a{color:#222;text-decoration:none;font-size:16px}' +
    '#pk .inc .meta{color:#8a8a85;font-size:14px;margin-top:2px}' +
    '#pk .none{padding:22px 30px;color:#8a8a85}';
  var G = '#79b02d', Y = '#c9ae2a', O = '#f58a2f', R = '#e04545', N = '#dcdad4';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function day(offset) { var d = new Date(); d.setUTCDate(d.getUTCDate() - offset); return d.toISOString().slice(0, 10); }
  function render(sites, issues) {
    var el = document.createElement('div');
    el.id = 'pk';
    var h = '<h1>Peeksxx Status</h1><div class="sub">Uptime over the past ' + DAYS + ' days. <a href="https://github.com/' + OWNER + '/' + REPO + '">View historical uptime.</a></div><div class="card">';
    sites.forEach(function (s) {
      var daily = s.dailyMinutesDown || {};
      var bars = '';
      for (var i = DAYS - 1; i >= 0; i--) {
        var k = day(i), c, t;
        if (k < START) { c = N; t = k + ': no data'; }
        else {
          var m = daily[k] || 0;
          c = m === 0 ? G : m < 10 ? Y : m < 60 ? O : R;
          t = k + (m ? ': ' + m + ' min down' : ': no downtime');
          if (i === 0 && s.status === 'down') { c = R; t = k + ': down'; }
          if (i === 0 && s.status === 'degraded') { c = O; t = k + ': degraded'; }
        }
        bars += '<i style="background:' + c + '" title="' + t + '"></i>';
      }
      var lbl = s.status === 'up' ? ['Operational', G] : s.status === 'down' ? ['Down', R] : ['Degraded', O];
      h += '<div class="row"><div class="top"><span class="name">' + esc(s.name) + '</span><span class="st" style="color:' + lbl[1] + '">' + lbl[0] + '</span></div><div class="bars">' + bars + '</div><div class="foot"><span>' + DAYS + ' days ago</span><b></b><span>' + esc(s.uptimeYear || '').replace('%', ' %') + ' uptime</span><b></b><span>Today</span></div></div>';
    });
    h += '</div><h2>Incidents</h2><div class="card">';
    if (!issues.length) h += '<div class="none">No statements have been published yet.</div>';
    issues.forEach(function (i) {
      var when = new Date(i.created_at).toLocaleDateString(undefined, {year: 'numeric', month: 'short', day: 'numeric'});
      h += '<div class="inc"><a href="/incident/' + i.number + '">' + esc(i.title) + '</a><div class="meta">' + when + ' &middot; ' + (i.state === 'open' ? 'ongoing' : 'resolved') + ' &middot; ' + (i.comments ? i.comments + ' update' + (i.comments > 1 ? 's' : '') : 'No statements have been published yet.') + '</div></div>';
    });
    el.innerHTML = h + '</div>';
    document.body.appendChild(el);
  }
  function go() {
    var st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    var base = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/master/history/summary.json';
    var api = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/issues?state=all&labels=status&per_page=15';
    Promise.all([
      fetch(base).then(function (r) { return r.json(); }),
      fetch(api).then(function (r) { return r.json(); }).then(function (a) { return Array.isArray(a) ? a.filter(function (x) { return !x.pull_request; }) : []; }).catch(function () { return []; })
      ]).then(function (v) { render(v[0], v[1]); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();
