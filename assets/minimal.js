(function () {
  'use strict';

  if (location.pathname !== '/' && location.pathname !== '/index.html') return;
  if (window.__pkLoaded) return;
  window.__pkLoaded = true;

  var OWNER = 'peeksxx';
  var REPO = 'upptime';
  var MONITORING_START = '2026-10-27';
  var INCIDENT_DAYS = 7;
  var DAY_STEPS = [90, 60, 30];
  var BAR_MIN_WIDTH = 6;
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
    '#pk .bars{display:flex;gap:' + BAR_GAP + 'px;height:50px}',
    '#pk .bars i{flex:1 1 0;min-width:' + BAR_MIN_WIDTH + 'px;border-radius:1px}',
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

  var state = { sites: [], issues: [], days: DAY_STEPS[0] };
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

  function buildBars(site, meta) {
    var markup = '';
    for (var daysAgo = state.days - 1; daysAgo >= 0; daysAgo--) {
      var date = utcDate(daysAgo);
      var color;
      var label;
      if (date < MONITORING_START) {
        color = COLORS.empty;
        label = date + ': no data';
      } else if (meta.underConstruction) {
        color = COLORS.empty;
        label = date + ': under construction';
      } else {
        var minutes = (site.dailyMinutesDown || {})[date] || 0;
        color = colorForDowntime(minutes);
        label = date + (minutes ? ': ' + minutes + ' min down' : ': no downtime');
        if (daysAgo === 0 && site.status === 'down') {
          color = COLORS.down;
          label = date + ': down';
        } else if (daysAgo === 0 && site.status === 'degraded') {
          color = COLORS.degraded;
          label = date + ': degraded';
        }
      }
      markup += '<i style="background:' + color + '" title="' + label + '"></i>';
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
      '<span>' + state.days + ' days ago</span><b></b>' +
      '<span>' + summary + '</span><b></b>' +
      '<span>Today</span>' +
      '</div>' +
      '</div>';
  }

  function buildHeader() {
    return '<h1>' + escapeHtml(PAGE_TITLE) + '</h1>' +
      '<div class="sub">Uptime over the past ' + state.days + ' days. ' +
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

  function daysThatFit() {
    var bars = document.querySelector('#pk .bars');
    if (!bars) return state.days;
    var slots = Math.floor((bars.clientWidth + BAR_GAP) / (BAR_MIN_WIDTH + BAR_GAP));
    for (var i = 0; i < DAY_STEPS.length; i++) {
      if (slots >= DAY_STEPS[i]) return DAY_STEPS[i];
    }
    return DAY_STEPS[DAY_STEPS.length - 1];
  }

  function adjustToViewport() {
    var days = daysThatFit();
    if (days === state.days) return;
    state.days = days;
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
