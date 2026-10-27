(function () {
  'use strict';

  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  if (window.__pkLoaded) return;
  window.__pkLoaded = true;

  var OWNER = 'peeksxx';
  var REPO = 'upptime';
  var MONITORING_START = '2026-10-27';
  var INCIDENT_DAYS = 7;
  var TOTAL_DAYS = 90;
  var MIN_BAR_WIDTH = 7;
  var BAR_GAP = 2;
  var PAGE_TITLE = document.title || 'Status';

  var COLORS = {
    up: '#79b02d',
    minor: '#c9ae2a',
    degraded: '#f58a2f',
    down: '#e04545',
    empty: '#dcdad4',
    muted: '#8a8a85'
  };

  var SITE_META = {
    'video': { name: 'video.peeksxx.dev' },
    'e6-scroller': { name: 'e6Scroller', note: 'e6scroller.net', underConstruction: true }
  };

  var STYLES = [
    'html,body{background:#faf8f4!important;margin:0}',
    'body>*:not(#pk){display:none!important}',
    '#pk{max-width:960px;margin:0 auto;padding:48px 16px 72px;font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#333}',
    '#pk h1{font-size:22px;font-weight:600;margin:0 0 24px;color:#222}',
    '#pk h2{font-size:22px;font-weight:600;margin:56px 0 16px;color:#222}',
    '#pk .sub{color:#8a8a85;text-align:right;font-size:14px;margin:0 0 10px}',
    '#pk .sub a{color:#111;text-decoration:none}',
    '#pk .card{background:#fcfbf8;border:1px solid #e4e2dc;border-radius:4px}',
    '#pk .card.padded{padding:26px 30px}',
    '#pk .row{padding:26px 30px 24px;border-top:1px solid #e4e2dc}',
    '#pk .row:first-child{border-top:0}',
    '#pk .top{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:baseline;gap:4px 12px;margin-bottom:12px}',
    '#pk .name{font-size:18px;color:#222}',
    '#pk .name small{font-size:14px;color:#a9a8a2;margin-left:8px}',
    '#pk .state{font-size:16px}',
    '#pk .bars{display:flex;height:50px;overflow:hidden}',
    '#pk .bars i{flex:none;height:100%;border-radius:1px}',
    '#pk .foot{display:flex;align-items:center;gap:14px;color:#8a8a85;margin-top:10px;font-size:15px}',
    '#pk .foot b{flex:1;height:1px;background:#8a8a85;opacity:.5}',
    '#pk .foot span{white-space:nowrap}',
    '#pk .day{padding:22px 0 18px;border-top:1px solid #e4e2dc}',
    '#pk .day:first-of-type{border-top:0;padding-top:0}',
    '#pk .day h3{font-size:18px;font-weight:600;margin:0 0 10px;color:#222}',
    '#pk .none{color:#8a8a85}',
    '#pk .incident{margin:0 0 14px}',
    '#pk .incident a{color:#222;text-decoration:none;font-size:17px;font-weight:600}',
    '#pk .incident a:hover{text-decoration:underline}',
    '#pk .incident p{margin:4px 0 0;color:#555;font-size:15px}',
    '#pk .incident p b{font-weight:600}',
    '#pk .incident small{display:block;color:#8a8a85;font-size:13px;margin-top:2px}',
    '@media (max-width:600px){',
    '#pk{padding:28px 16px 48px}',
    '#pk h1{margin-bottom:16px}',
    '#pk h2{margin:40px 0 12px}',
    '#pk .sub{text-align:left}',
    '#pk .card.padded{padding:20px 16px}',
    '#pk .row{padding:20px 16px 18px}',
    '#pk .name{font-size:16px}',
    '#pk .name small{display:block;margin:0}',
    '#pk .state{font-size:14px}',
    '#pk .bars{height:40px}',
    '#pk .foot{gap:8px;font-size:13px}',
    '}'
  ].join('');

  var state = {
    sites: [],
    issues: [],
    layout: { ratio: 1, step: 1, count: TOTAL_DAYS, bar: MIN_BAR_WIDTH, gap: BAR_GAP, extra: 0 }
  };
  var resizeTimer = null;

  function escapeHtml(value) {
    var entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
    return String(value).replace(/[&<>"]/g, function (char) { return entities[char]; });
  }

  function utcDate(daysAgo) {
    var date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  }

  function localDate(date) {
    return date.toLocaleDateString('en-CA');
  }

  function stripEmoji(text) {
    return String(text)
      .replace(/[\u{1F000}-\u{1FFFF}☀-➿️‍]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function colorForDowntime(minutes) {
    if (minutes === 0) return COLORS.up;
    if (minutes < 10) return COLORS.minor;
    if (minutes < 60) return COLORS.degraded;
    return COLORS.down;
  }

  function computeLayout(containerWidth) {
    var ratio = window.devicePixelRatio || 1;
    var width = Math.floor(containerWidth * ratio);
    var gap = Math.max(1, Math.round(BAR_GAP * ratio));
    var minBar = Math.max(2, Math.round(MIN_BAR_WIDTH * ratio));
    var step = 1;

    while (step < TOTAL_DAYS) {
      var fits = Math.ceil(TOTAL_DAYS / step);
      if (fits * minBar + (fits - 1) * gap <= width) break;
      step++;
    }

    var count = Math.ceil(TOTAL_DAYS / step);
    var bar = Math.floor((width - (count - 1) * gap) / count);
    var extra = width - count * bar - (count - 1) * gap;
    return { ratio: ratio, step: step, count: count, bar: bar, gap: gap, extra: extra };
  }

  function layoutKey(layout) {
    return [layout.ratio, layout.step, layout.count, layout.bar, layout.gap, layout.extra].join('|');
  }

  function toCssPixels(deviceUnits) {
    return (deviceUnits / state.layout.ratio).toFixed(4) + 'px';
  }

  function gapBefore(index) {
    var layout = state.layout;
    if (index === 0) return 0;
    var spans = layout.count - 1;
    var surplus = Math.floor(index * layout.extra / spans) - Math.floor((index - 1) * layout.extra / spans);
    return layout.gap + surplus;
  }

  function summarizeRange(site, newestDaysAgo, oldestDaysAgo) {
    var summary = { monitored: false, total: 0, worst: 0 };
    for (var daysAgo = oldestDaysAgo; daysAgo >= newestDaysAgo; daysAgo--) {
      var date = utcDate(daysAgo);
      if (date < MONITORING_START) continue;
      var minutes = (site.dailyMinutesDown || {})[date] || 0;
      summary.monitored = true;
      summary.total += minutes;
      summary.worst = Math.max(summary.worst, minutes);
    }
    return summary;
  }

  function buildBar(site, meta, newestDaysAgo, oldestDaysAgo, index) {
    var first = utcDate(oldestDaysAgo);
    var last = utcDate(newestDaysAgo);
    var range = first === last ? first : first + ' to ' + last;
    var summary = summarizeRange(site, newestDaysAgo, oldestDaysAgo);
    var color = COLORS.empty;
    var label = range + ': no data';

    if (summary.monitored && meta.underConstruction) {
      label = range + ': under construction';
    } else if (summary.monitored) {
      color = colorForDowntime(summary.worst);
      label = range + (summary.total ? ': ' + summary.total + ' min down' : ': no downtime');
      if (newestDaysAgo === 0 && site.status === 'down') {
        color = COLORS.down;
        label = range + ': down';
      } else if (newestDaysAgo === 0 && site.status === 'degraded') {
        color = COLORS.degraded;
        label = range + ': degraded';
      }
    }

    var style = 'background:' + color +
      ';width:' + toCssPixels(state.layout.bar) +
      ';margin-left:' + toCssPixels(gapBefore(index));
    return '<i style="' + style + '" title="' + label + '"></i>';
  }

  function buildBars(site, meta) {
    var layout = state.layout;
    var markup = '';
    for (var index = 0; index < layout.count; index++) {
      var newest = (layout.count - 1 - index) * layout.step;
      var oldest = Math.min(newest + layout.step - 1, TOTAL_DAYS - 1);
      markup += buildBar(site, meta, newest, oldest, index);
    }
    return markup;
  }

  function statusLabel(site, meta) {
    if (meta.underConstruction) return { text: 'Under construction', color: COLORS.muted };
    if (site.status === 'up') return { text: 'Operational', color: COLORS.up };
    if (site.status === 'down') return { text: 'Down', color: COLORS.down };
    return { text: 'Degraded', color: COLORS.degraded };
  }

  function buildSiteRow(site) {
    var meta = SITE_META[site.slug] || {};
    var status = statusLabel(site, meta);
    var summary = meta.underConstruction
      ? 'Not monitored yet'
      : escapeHtml(site.uptimeYear || '').replace('%', ' %') + ' uptime';
    var note = meta.note ? '<small>' + escapeHtml(meta.note) + '</small>' : '';

    return '<div class="row">' +
      '<div class="top">' +
      '<span class="name">' + escapeHtml(meta.name || site.name) + note + '</span>' +
      '<span class="state" style="color:' + status.color + '">' + status.text + '</span>' +
      '</div>' +
      '<div class="bars">' + buildBars(site, meta) + '</div>' +
      '<div class="foot">' +
      '<span>' + TOTAL_DAYS + ' days ago</span><b></b>' +
      '<span>' + summary + '</span><b></b>' +
      '<span>Today</span>' +
      '</div>' +
      '</div>';
  }

  function buildHeader() {
    return '<h1>' + escapeHtml(PAGE_TITLE) + '</h1>' +
      '<div class="sub">Uptime over the past ' + TOTAL_DAYS + ' days. ' +
      '<a href="https://github.com/' + OWNER + '/' + REPO + '">View historical uptime.</a></div>';
  }

  function hiddenSlugs() {
    var hidden = {};
    Object.keys(SITE_META).forEach(function (slug) {
      if (SITE_META[slug].underConstruction) hidden[slug] = true;
    });
    return hidden;
  }

  function groupIncidentsByDay() {
    var hidden = hiddenSlugs();
    var groups = {};
    state.issues.forEach(function (issue) {
      var isHidden = (issue.labels || []).some(function (label) { return hidden[label.name]; });
      if (isHidden) return;
      var key = localDate(new Date(issue.created_at));
      (groups[key] = groups[key] || []).push(issue);
    });
    return groups;
  }

  function buildIncident(issue) {
    var time = new Date(issue.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    var status = issue.state === 'open' ? 'Investigating' : 'Resolved';
    var detail = issue.comments
      ? issue.comments + ' update' + (issue.comments > 1 ? 's' : '') + ' posted.'
      : 'No statements have been published yet.';

    return '<div class="incident">' +
      '<a href="/incident/' + issue.number + '" rel="external">' + escapeHtml(stripEmoji(issue.title)) + '</a>' +
      '<p><b>' + status + '</b> - ' + detail + '</p>' +
      '<small>' + time + '</small>' +
      '</div>';
  }

  function buildIncidentDays() {
    var groups = groupIncidentsByDay();
    var markup = '';
    for (var offset = 0; offset < INCIDENT_DAYS; offset++) {
      var date = new Date();
      date.setDate(date.getDate() - offset);
      var heading = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      var incidents = groups[localDate(date)] || [];
      markup += '<div class="day"><h3>' + heading + '</h3>';
      markup += incidents.length
        ? incidents.map(buildIncident).join('')
        : '<div class="none">No incidents reported.</div>';
      markup += '</div>';
    }
    return markup;
  }

  function getRoot() {
    var root = document.getElementById('pk');
    if (!root) {
      root = document.createElement('div');
      root.id = 'pk';
      document.body.appendChild(root);
    }
    return root;
  }

  function render() {
    getRoot().innerHTML = buildHeader() +
      '<div class="card">' + state.sites.map(buildSiteRow).join('') + '</div>' +
      '<h2>Past Incidents</h2>' +
      '<div class="card padded">' + buildIncidentDays() + '</div>';
  }

  function renderError() {
    getRoot().innerHTML = '<h1>' + escapeHtml(PAGE_TITLE) + '</h1>' +
      '<div class="card padded"><div class="none">Status data is temporarily unavailable.</div></div>';
  }

  function adjustToViewport() {
    var bars = document.querySelector('#pk .bars');
    if (!bars) return;
    var width = bars.getBoundingClientRect().width;
    if (width <= 0) return;
    var next = computeLayout(width);
    if (layoutKey(next) === layoutKey(state.layout)) return;
    state.layout = next;
    render();
  }

  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(adjustToViewport, 150);
  }

  function fetchJson(url) {
    return fetch(url).then(function (response) {
      if (!response.ok) throw new Error('Request failed: ' + response.status);
      return response.json();
    });
  }

  function load() {
    var summaryUrl = 'https://raw.githubusercontent.com/' + OWNER + '/' + REPO + '/master/history/summary.json';
    var issuesQuery = ['state=all', 'labels=status', 'per_page=50'].join('&');
    var issuesUrl = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/issues' + String.fromCharCode(63) + issuesQuery;

    var issues = fetchJson(issuesUrl)
      .then(function (list) {
        return Array.isArray(list) ? list.filter(function (item) { return !item.pull_request; }) : [];
      })
      .catch(function () { return []; });

    Promise.all([fetchJson(summaryUrl), issues])
      .then(function (results) {
        state.sites = results[0];
        state.issues = results[1];
        render();
        adjustToViewport();
        window.addEventListener('resize', onResize);
      })
      .catch(renderError);
  }

  function init() {
    var style = document.createElement('style');
    style.textContent = STYLES;
    document.head.appendChild(style);
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
