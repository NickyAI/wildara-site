/* ==========================================================================
   Wildara · illustrated map of northern Tanzania
   Real geography (lon/lat, simplified), drawn as an editorial field map.
   WA.map(el, { mode: 'route' | 'explore' | 'focus', route, focus, onSelect, link })
   ========================================================================== */
(function () {
  'use strict';
  var W = 1000, H = 900, LON0 = 33.8, LON1 = 37.4, LAT0 = -1.25, LAT1 = -4.5;
  function X(lon) { return (lon - LON0) / (LON1 - LON0) * W; }
  function Y(lat) { return (LAT0 - lat) / (LAT0 - LAT1) * H; }
  function pt(p) { return [X(p[0]), Y(p[1])]; }
  function poly(pts) { return 'M' + pts.map(function (p) { var q = pt(p); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + 'Z'; }
  // smooth closed shape through points (Catmull-Rom to Bézier)
  function blob(pts) {
    var P = pts.map(pt), n = P.length, d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (var i = 0; i < n; i++) {
      var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d + 'Z';
  }
  function smooth(P) {
    if (P.length < 3) return 'M' + P.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var d = 'M' + P[0][0].toFixed(1) + ' ' + P[0][1].toFixed(1);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, P.length - 1)];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  /* ---------- Geography (simplified) ---------- */
  var PARKS = [
    { id: 'serengeti', name: 'Serengeti National Park', label: [34.55, -2.15], pts: [[34.95, -1.45], [35.28, -1.72], [35.36, -2.25], [35.22, -2.72], [35.02, -2.86], [34.62, -3.02], [34.32, -2.86], [34.12, -2.52], [33.98, -2.24], [34.15, -2.06], [34.46, -2.0], [34.62, -1.62]] },
    { id: 'ngorongoro', name: 'Ngorongoro Conservation Area', label: [35.36, -2.74], pts: [[34.95, -2.86], [35.3, -2.62], [35.74, -2.9], [35.86, -3.25], [35.64, -3.48], [35.24, -3.5], [34.92, -3.34], [34.8, -3.08]] },
    { id: 'tarangire', name: 'Tarangire N.P.', label: [36.07, -4.12], pts: [[35.86, -3.78], [36.12, -3.72], [36.24, -4.02], [36.18, -4.42], [35.96, -4.38], [35.86, -4.06]] },
    { id: 'manyara', name: '', label: [35.98, -3.5], pts: [[35.74, -3.36], [35.86, -3.38], [35.92, -3.56], [35.86, -3.62], [35.76, -3.5]] },
    { id: 'arushanp', name: '', label: [36.98, -3.16], pts: [[36.72, -3.18], [36.86, -3.12], [36.96, -3.2], [36.94, -3.32], [36.8, -3.33], [36.71, -3.26]] }
  ];
  var LAKES = [
    { name: 'Lake Victoria', label: [33.86, -1.8], vertical: true, pts: [[33.6, -1.1], [34.0, -1.2], [34.08, -1.62], [33.93, -1.98], [34.1, -2.18], [33.86, -2.26], [33.75, -2.6], [33.6, -2.8]] },
    { name: '', label: [35.05, -3.78], pts: [[34.9, -3.86], [35.1, -3.68], [35.32, -3.5], [35.37, -3.54], [35.16, -3.74], [34.95, -3.9]] },
    { name: '', label: [35.95, -3.7], pts: [[35.78, -3.45], [35.85, -3.47], [35.92, -3.66], [35.9, -3.82], [35.84, -3.78], [35.8, -3.6]] },
    { name: 'L. Natron', label: [36.13, -2.38], pts: [[35.98, -2.18], [36.08, -2.2], [36.12, -2.42], [36.06, -2.58], [35.99, -2.5], [35.96, -2.32]] },
    { name: '', pts: [[35.0, -2.98], [35.03, -2.97], [35.04, -3.0], [35.0, -3.01]] } // Lake Ndutu
  ];
  var PEAKS = [
    { name: 'Kilimanjaro', p: [37.35, -3.07], big: true, side: 'left' },
    { name: 'Mt Meru', p: [36.76, -3.24], side: 'left' },
    { name: 'Ol Doinyo Lengai', p: [35.91, -2.76], side: 'right' }
  ];
  var CRATER = [35.58, -3.18];

  /* places (also road nodes) */
  var PLACES = {
    kia: { n: 'Kilimanjaro Airport', p: [37.07, -3.43], small: true },
    usa: { p: [36.86, -3.37], node: true },
    arusha: { n: 'Arusha', p: [36.68, -3.37], town: true },
    arushanp: { n: 'Arusha NP', p: [36.86, -3.24] },
    makuyuni: { p: [36.1, -3.55], node: true },
    tarangire: { n: 'Tarangire', p: [36.02, -3.95] },
    mtowambu: { p: [35.86, -3.37], node: true },
    manyara: { n: 'Lake Manyara', p: [35.8, -3.42] },
    karatu: { n: 'Karatu', p: [35.67, -3.34], town: true },
    ngorongoro: { n: 'Ngorongoro Crater', p: [35.58, -3.18] },
    eyasi: { n: 'Lake Eyasi', p: [35.18, -3.62] },
    naabi: { p: [34.98, -2.84], node: true },
    ndutu: { n: 'Ndutu', p: [34.98, -3.02] },
    serengeti: { n: 'Central Serengeti', p: [34.83, -2.43] },
    lobo: { p: [35.02, -1.98], node: true },
    mara: { n: 'Mara River', p: [34.9, -1.6] },
    zanzibar: { n: 'Zanzibar', inset: true }
  };
  var ROADS = [['kia', 'usa'], ['usa', 'arusha'], ['usa', 'arushanp'], ['arusha', 'makuyuni'], ['makuyuni', 'tarangire'], ['makuyuni', 'mtowambu'], ['mtowambu', 'manyara'], ['mtowambu', 'karatu'], ['karatu', 'eyasi'], ['karatu', 'ngorongoro'], ['ngorongoro', 'naabi'], ['naabi', 'ndutu'], ['naabi', 'serengeti'], ['serengeti', 'lobo'], ['lobo', 'mara']];
  var ZNZ = { x: 790, y: 690, w: 190, h: 190 };
  function placeXY(k) { var pl = PLACES[k]; if (pl.inset) return [ZNZ.x + 104, ZNZ.y + 100]; return pt(pl.p); }

  /* shortest road path between two places */
  var adj = {};
  ROADS.forEach(function (r) { (adj[r[0]] = adj[r[0]] || []).push(r[1]); (adj[r[1]] = adj[r[1]] || []).push(r[0]); });
  function dist(a, b) { var A = PLACES[a].p, B = PLACES[b].p; return Math.hypot(A[0] - B[0], A[1] - B[1]); }
  function roadPath(a, b) {
    if (a === b) return [a];
    var D = {}, prev = {}, Q = Object.keys(adj); Q.forEach(function (k) { D[k] = Infinity; }); D[a] = 0;
    while (Q.length) {
      Q.sort(function (x, y) { return D[x] - D[y]; }); var u = Q.shift(); if (u === b) break;
      adj[u].forEach(function (v) { var nd = D[u] + dist(u, v); if (nd < D[v]) { D[v] = nd; prev[v] = u; } });
    }
    var path = [b]; while (path[0] !== a && prev[path[0]]) path.unshift(prev[path[0]]);
    return path;
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }

  function build(container, opt) {
    opt = opt || {};
    var mode = opt.mode || 'explore';
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'wmap', role: 'group', 'aria-label': opt.label || 'Illustrated map of northern Tanzania' });
    var defs = el('defs', {}, svg);
    defs.innerHTML =
      '<pattern id="wm-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" stroke="rgba(137,138,34,.28)" stroke-width="1.2"/></pattern>' +
      '<pattern id="wm-dots" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".9" fill="rgba(103,55,32,.12)"/></pattern>' +
      '<radialGradient id="wm-vig" cx="50%" cy="50%" r="75%"><stop offset="60%" stop-color="rgba(103,55,32,0)"/><stop offset="100%" stop-color="rgba(103,55,32,.10)"/></radialGradient>' +
      '<filter id="wm-rough"><feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter>';

    var g = el('g', {}, svg);
    el('rect', { x: 0, y: 0, width: W, height: H, class: 'wm-land' }, g);
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#wm-dots)' }, g);

    // contour rings around the highlands
    [[35.6, -3.15, 0.55, 0.38], [35.6, -3.15, 0.75, 0.55], [35.6, -3.15, 0.95, 0.72], [36.8, -3.24, 0.22, 0.18], [36.8, -3.24, 0.34, 0.28], [37.3, -3.1, 0.25, 0.2]].forEach(function (c) {
      el('ellipse', { cx: X(c[0]), cy: Y(c[1]), rx: c[2] * 278, ry: c[3] * 278, class: 'wm-contour', filter: 'url(#wm-rough)' }, g);
    });

    // Kenya border
    var border = el('path', { d: 'M' + X(33.95) + ' ' + Y(-1.0) + ' L' + X(37.6) + ' ' + Y(-2.98), class: 'wm-border' }, g);
    el('text', { x: X(35.55), y: Y(-1.4), class: 'wm-country', transform: 'rotate(23 ' + X(35.55) + ' ' + Y(-1.4) + ')' }, g).textContent = 'KENYA';
    el('text', { x: X(35.72), y: Y(-1.72), class: 'wm-country', transform: 'rotate(23 ' + X(35.72) + ' ' + Y(-1.72) + ')' }, g).textContent = 'TANZANIA';

    PARKS.forEach(function (pk) {
      var isFocus = opt.focus && opt.focus.indexOf(pk.id) > -1;
      el('path', { d: blob(pk.pts), class: 'wm-park' + (isFocus ? ' is-focus' : ''), 'data-park': pk.id }, g);
      el('path', { d: blob(pk.pts), fill: 'url(#wm-hatch)', class: 'wm-park-hatch' }, g);
      var lp = pt(pk.label);
      if (pk.name) { var t = el('text', { x: lp[0], y: lp[1], class: 'wm-park-label' }, g); t.textContent = pk.name; }
    });
    el('ellipse', { cx: X(CRATER[0]), cy: Y(CRATER[1]), rx: 24, ry: 20, class: 'wm-crater' }, g);
    el('ellipse', { cx: X(CRATER[0]), cy: Y(CRATER[1]), rx: 15, ry: 12, class: 'wm-crater-floor' }, g);

    LAKES.forEach(function (lk) {
      el('path', { d: blob(lk.pts), class: 'wm-lake' }, g);
      if (lk.name) {
        var lp = pt(lk.label);
        var t = el('text', { x: lp[0], y: lp[1], class: 'wm-water-label' }, g); t.textContent = lk.name;
        if (lk.vertical) t.setAttribute('transform', 'rotate(-80 ' + lp[0] + ' ' + lp[1] + ')');
      }
    });

    PEAKS.forEach(function (pk) {
      var p = pt(pk.p), s = pk.big ? 1.4 : 1;
      el('path', { d: 'M' + (p[0] - 16 * s) + ' ' + (p[1] + 10 * s) + ' L' + p[0] + ' ' + (p[1] - 12 * s) + ' L' + (p[0] + 16 * s) + ' ' + (p[1] + 10 * s) + 'Z', class: 'wm-peak' }, g);
      el('path', { d: 'M' + (p[0] - 5 * s) + ' ' + (p[1] - 4.5 * s) + ' L' + p[0] + ' ' + (p[1] - 12 * s) + ' L' + (p[0] + 5 * s) + ' ' + (p[1] - 4.5 * s) + ' L' + (p[0] + 1.5 * s) + ' ' + (p[1] - 6 * s) + ' L' + (p[0] - 1.5 * s) + ' ' + (p[1] - 3.5 * s) + 'Z', class: 'wm-snow' }, g);
      var t = el('text', { x: pk.side === 'left' ? p[0] - 22 * s : p[0] + 20, y: p[1] + 4, class: 'wm-peak-label', 'text-anchor': pk.side === 'left' ? 'end' : 'start' }, g);
      t.textContent = pk.name;
    });

    // roads
    ROADS.forEach(function (r) { var a = pt(PLACES[r[0]].p), b = pt(PLACES[r[1]].p); el('path', { d: 'M' + a[0] + ' ' + a[1] + ' L' + b[0] + ' ' + b[1], class: 'wm-road' }, g); });

    // Zanzibar inset
    var z = el('g', { class: 'wm-inset' }, g);
    el('rect', { x: ZNZ.x, y: ZNZ.y, width: ZNZ.w, height: ZNZ.h, rx: 14, class: 'wm-inset-frame' }, z);
    el('rect', { x: ZNZ.x, y: ZNZ.y, width: ZNZ.w, height: ZNZ.h, rx: 14, fill: 'url(#wm-dots)' }, z);
    el('path', { d: 'M' + (ZNZ.x + 92) + ' ' + (ZNZ.y + 34) + ' c 18 6 26 30 30 52 c 4 24 10 40 2 62 c -8 18 -22 24 -30 10 c -6 -14 -2 -30 -8 -48 c -6 -20 -14 -36 -8 -56 c 3 -12 8 -22 14 -20 z', class: 'wm-island' }, z);
    el('text', { x: ZNZ.x + 14, y: ZNZ.y + 24, class: 'wm-inset-title' }, z).textContent = 'ZANZIBAR';
    el('text', { x: ZNZ.x + 14, y: ZNZ.y + ZNZ.h - 14, class: 'wm-water-label', 'text-anchor': 'start' }, z).textContent = 'Indian Ocean';

    // flight to Zanzibar
    var ar = placeXY('arusha'), zz = placeXY('zanzibar');
    var flight = el('path', { d: 'M' + ar[0] + ' ' + ar[1] + ' Q ' + (ar[0] + 160) + ' ' + (ar[1] + 120) + ' ' + zz[0] + ' ' + (ZNZ.y - 2), class: 'wm-flight' }, g);
    var fl = el('text', { x: ZNZ.x + ZNZ.w - 4, y: ZNZ.y - 12, class: 'wm-note', 'text-anchor': 'end' }, g); fl.textContent = '✈ Short flight from Arusha';

    // compass + scale
    var cmp = el('g', { class: 'wm-compass', transform: 'translate(70 ' + (H - 90) + ')' }, g);
    cmp.innerHTML = '<circle r="30" class="wm-compass-ring"/><path d="M0 -26 L6 0 L0 26 L-6 0Z" class="wm-compass-needle"/><path d="M0 -26 L6 0 L-6 0Z" class="wm-compass-n"/><text y="-36" text-anchor="middle" class="wm-note">N</text>';
    var km50 = 0.45 * (W / (LON1 - LON0));
    var sc = el('g', { transform: 'translate(130 ' + (H - 70) + ')' }, g);
    sc.innerHTML = '<path d="M0 0 H' + km50 + '" class="wm-scale"/><path d="M0 -5 V5 M' + km50 / 2 + ' -3 V3 M' + km50 + ' -5 V5" class="wm-scale"/><text x="' + km50 / 2 + '" y="20" text-anchor="middle" class="wm-note">50 km</text>';
    el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#wm-vig)', 'pointer-events': 'none' }, g);

    /* ---------- route ---------- */
    var routeLayer = el('g', { class: 'wm-route-layer' }, svg);
    var markers = el('g', {}, svg);
    var visible = Object.keys(PLACES).filter(function (k) { return PLACES[k].n && !PLACES[k].small; });
    var routeKeys = [];

    if (mode === 'route' && opt.route && opt.route.length) {
      var segs = [], cur = [];
      opt.route.forEach(function (stop, i) {
        if (i === 0) { cur = [placeXY(stop.k)]; return; }
        var prevK = opt.route[i - 1].k;
        if (stop.k === 'zanzibar' || prevK === 'zanzibar') { // flights, drawn separately
          if (cur.length > 1) segs.push({ pts: cur, road: true });
          var a = placeXY(prevK === 'zanzibar' ? 'zanzibar' : prevK), b = placeXY(stop.k);
          segs.push({ fly: true, a: a, b: b }); cur = [b]; return;
        }
        roadPath(prevK, stop.k).slice(1).forEach(function (k) { cur.push(placeXY(k)); });
      });
      if (cur.length > 1) segs.push({ pts: cur, road: true });
      segs.forEach(function (s) {
        if (s.fly) {
          var mx = (s.a[0] + s.b[0]) / 2 + 60, my = Math.min(s.a[1], s.b[1]) + 40;
          el('path', { d: 'M' + s.a[0] + ' ' + s.a[1] + ' Q' + mx + ' ' + my + ' ' + s.b[0] + ' ' + s.b[1], class: 'wm-route wm-route--fly' }, routeLayer);
        } else {
          el('path', { d: smooth(s.pts), class: 'wm-route-halo' }, routeLayer);
          el('path', { d: smooth(s.pts), class: 'wm-route' }, routeLayer);
        }
      });
      // unique stops in order of first visit, with all day numbers
      var order = [], days = {};
      opt.route.forEach(function (s) { if (order.indexOf(s.k) < 0) order.push(s.k); days[s.k] = (days[s.k] || []).concat(s.days); });
      routeKeys = order;
      order.forEach(function (k, i) {
        var d = days[k].filter(function (v, j, a) { return a.indexOf(v) === j; }).sort(function (a, b) { return a - b; });
        var lbl = d.length === 1 ? 'Day ' + d[0] : 'Days ' + d[0] + (d.length > 1 ? (d[d.length - 1] - d[0] === d.length - 1 ? ' to ' : ', ') + d[d.length - 1] : '');
        marker(k, { num: i + 1, sub: lbl, active: true, days: d });
      });
      visible.forEach(function (k) { if (order.indexOf(k) < 0) marker(k, { ghost: true }); });
    } else {
      visible.forEach(function (k) { marker(k, { active: !opt.focus || opt.focus.indexOf(k) > -1, ghost: opt.focus && opt.focus.indexOf(k) < 0 }); });
    }

    function marker(k, o) {
      var pl = PLACES[k], p = placeXY(k);
      var m = el('g', { class: 'wm-marker' + (o.ghost ? ' is-ghost' : '') + (pl.town ? ' is-town' : ''), transform: 'translate(' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + ')', 'data-key': k }, markers);
      if (o.days) m.setAttribute('data-days', o.days.join(','));
      if (!o.ghost) { m.setAttribute('tabindex', '0'); m.setAttribute('role', opt.link ? 'link' : 'button'); m.setAttribute('aria-label', pl.n + (o.sub ? ', ' + o.sub : '')); }
      el('circle', { r: 20, class: 'wm-halo' }, m);
      if (o.num) {
        el('circle', { r: 13, class: 'wm-pin' }, m);
        el('text', { y: 4.5, 'text-anchor': 'middle', class: 'wm-pin-num' }, m).textContent = o.num;
      } else el('circle', { r: o.ghost ? 4.5 : 7, class: 'wm-dot' }, m);
      var POS = { serengeti: [-20, 0, 'end'], ndutu: [-20, 0, 'end'], eyasi: [-20, 0, 'end'], mara: [-20, 0, 'end'], karatu: [-20, 2, 'end'], manyara: [16, 26, 'start'], ngorongoro: [0, -30, 'middle'], arushanp: [16, -12, 'start'], tarangire: [20, 0, 'start'] };
      var ps = POS[k] || [20, 0, 'start'];
      var lx = ps[0], anchor = ps[2];
      var ly = ps[1] + (o.sub ? -2 : 5);
      var t = el('text', { x: lx, y: ly, 'text-anchor': anchor, class: 'wm-label' }, m); t.textContent = pl.n;
      if (o.sub) el('text', { x: lx, y: ly + 16, 'text-anchor': anchor, class: 'wm-sub' }, m).textContent = o.sub;
      if (k === 'zanzibar' && o.sub) { t.setAttribute('x', 0); t.setAttribute('y', -24); t.setAttribute('text-anchor', 'middle'); m.lastChild.setAttribute('x', 0); m.lastChild.setAttribute('y', 30); m.lastChild.setAttribute('text-anchor', 'middle'); }
      if (o.ghost) return;
      function select() { if (opt.onSelect) opt.onSelect(k, m); setActive(k); }
      m.addEventListener('mouseenter', select); m.addEventListener('focus', select);
      function go() { var u = opt.link && opt.link(k); if (u) location.href = u; else select(); }
      m.addEventListener('click', go);
      m.addEventListener('keydown', function (e) { if (e.key === 'Enter') go(); });
    }
    function setActive(k) { Array.prototype.forEach.call(markers.querySelectorAll('.wm-marker'), function (m) { m.classList.toggle('is-active', m.getAttribute('data-key') === k); }); }

    container.innerHTML = ''; container.appendChild(svg);

    // draw-on for the route
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce && routeLayer.childNodes.length && 'IntersectionObserver' in window) {
      var paths = Array.prototype.slice.call(routeLayer.querySelectorAll('.wm-route, .wm-route-halo'));
      paths.forEach(function (p) { var L = p.getTotalLength(); p.style.strokeDasharray = L + ' ' + L; p.style.strokeDashoffset = L; });
      var io = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; io.disconnect();
        var delay = 0;
        paths.forEach(function (p) {
          var L = p.getTotalLength(), dur = Math.max(600, L * 2.2);
          p.style.transition = 'stroke-dashoffset ' + dur + 'ms cubic-bezier(.65,0,.35,1) ' + delay + 'ms';
          requestAnimationFrame(function () { p.style.strokeDashoffset = 0; });
          if (p.classList.contains('wm-route')) delay += dur * 0.9;
          p.addEventListener('transitionend', function () { if (p.classList.contains('wm-route--fly')) p.style.strokeDasharray = ''; }, { once: true });
        });
        Array.prototype.forEach.call(markers.querySelectorAll('.wm-marker:not(.is-ghost)'), function (m, i) { m.style.animationDelay = (i * 220) + 'ms'; m.classList.add('is-pop'); });
      }, { threshold: 0.3 });
      io.observe(svg);
    }
    return { svg: svg, setActive: setActive, keys: routeKeys };
  }

  window.WA = window.WA || {};
  window.WA.map = build;
  window.WA.MAP_PLACES = PLACES;
})();
