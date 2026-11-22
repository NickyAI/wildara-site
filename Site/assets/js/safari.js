/* Wildara · single safari page */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc, money = WA.money;
  var DATA = window.WILDARA_SAFARIS || [];
  var id = document.body.getAttribute('data-id') || new URLSearchParams(location.search).get('id');
  var s = DATA.filter(function (x) { return x.id === id; })[0];
  var DEST_PAGE = { arusha: 'arusha', arushanp: 'arusha', tarangire: 'tarangire', manyara: 'manyara', ngorongoro: 'ngorongoro', eyasi: 'eyasi', ndutu: 'ndutu', serengeti: 'serengeti', mara: 'mara', zanzibar: 'zanzibar' };

  if (!s) {
    $('#s-title').innerHTML = 'This trail has gone <em>quiet.</em>';
    $('#sFacts').outerHTML = '<p class="lead" style="margin-top:1.4rem">We couldn’t find that itinerary. <a href="' + WA.link('safaris') + '" style="text-decoration:underline">Browse all safaris</a>.</p>';
    $('#sHeroBg').innerHTML = WA.img('lone-tree', '100vw', '');
    ['#sBody', '#gallery', '#faqs', '.subnav'].forEach(function (q) { var e = $(q); if (e) e.hidden = true; });
    var sec = $('#lodges'); if (sec) sec.closest('section').hidden = true;
    s = DATA[0];
    related(); return;
  }

  var enquire = WA.link('plan', null, 'safari=' + encodeURIComponent(s.id));
  // title, description, canonical and JSON-LD are written into the HTML by tools/build.py

  /* ---------- hero ---------- */
  if (!$('#sHeroBg img')) $('#sHeroBg').innerHTML = WA.img(s.images[0], '100vw', '', 'fetchpriority="high"');
  $('#sCrumb').textContent = s.days + ' days';
  var h1 = $('#s-title'); h1.textContent = s.title; h1.setAttribute('data-split', ''); WA.splitText(h1);
  if (!$('#sFacts .fact')) $('#sFacts').innerHTML = [['Duration', s.days + ' days'], ['Destinations', s.destinations], ['Style', (s.tier !== 'Classic' ? s.tier + ' · ' : '') + 'Private'], ['From', money(s.from) + ' pp']]
    .map(function (f) { return '<div class="fact"><small>' + f[0] + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('');
  ['#heroCta', '#subCta', '#priceCta'].forEach(function (q) { $(q).href = enquire; });
  $('#subPrice').textContent = money(s.from);

  /* ---------- overview ---------- */
  $('#overview').innerHTML = '<span class="eyebrow" data-reveal>Overview</span><p class="tagline" data-reveal style="margin-top:1.2rem">' + esc(s.tagline) + '</p>' +
    s.intro.map(function (p, i) { return '<p data-reveal style="--d:' + (i + 1) + '">' + esc(p) + '</p>'; }).join('') +
    '<ul class="chips-list">' + ['Private safari', s.transport ? '4x4 Land Cruiser, pop-up roof' : '', 'English-speaking guide', 'Park fees included', s.days + ' days · ' + Math.max(s.days - 1, 1) + ' nights'].filter(Boolean).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';

  /* ---------- timeline ---------- */
  var tl = $('#sTimeline');
  $$('.tday', tl).forEach(function (n) { n.remove(); });   // replace the pre-rendered days
  tl.insertAdjacentHTML('beforeend', s.itinerary.map(function (d) {
    return '<article class="tday" data-day="' + d.day + '"><div class="tday__n" aria-hidden="true">' + d.day + '</div><div class="tday__body">' +
      '<small>Day ' + d.day + (d.transfer ? ' · ' + esc(d.transfer) : '') + '</small><h3>' + esc(d.title) + '</h3>' + (d.program ? '<p>' + esc(d.program) + '</p>' : '') +
      (d.stay ? '<span class="tday__stay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M3 20V9l9-6 9 6v11"/><path d="M9 20v-6h6v6"/></svg>' + esc(d.stay) + '</span>' : '') + '</div></article>';
  }).join(''));
  var line = $('.timeline__line span', tl);
  function tlTick() { var r = tl.getBoundingClientRect(); line.style.height = (WA.clamp((innerHeight * 0.6 - r.top) / r.height, 0, 1) * 100) + '%'; }
  window.addEventListener('scroll', function () { requestAnimationFrame(tlTick); }, { passive: true }); tlTick();

  /* ---------- route map ---------- */
  if (WA.map && s.route) {
    var P = WA.MAP_PLACES;
    WA.map($('#routeMap'), {
      mode: 'route', route: s.route, label: 'Route map for ' + s.title,
      onSelect: function (k, m) {
        var days = (m.getAttribute('data-days') || '').split(',').map(Number);
        $$('.tday', tl).forEach(function (t) { t.classList.toggle('is-hl', days.indexOf(+t.dataset.day) > -1); });
      }
    });
    var order = [], days = {};
    s.route.forEach(function (r) { if (order.indexOf(r.k) < 0) order.push(r.k); days[r.k] = (days[r.k] || []).concat(r.days); });
    $('#routeStops').innerHTML = order.map(function (k, i) {
      var d = days[k].filter(function (v, j, a) { return a.indexOf(v) === j; });
      var label = '<b style="font-weight:700">' + (i + 1) + '</b> ' + esc(P[k].n) + ' <span style="opacity:.7">· Day' + (d.length > 1 ? 's ' : ' ') + d.join(', ') + '</span>';
      return '<li>' + (DEST_PAGE[k] ? '<a href="' + WA.link('destinations', DEST_PAGE[k]) + '">' + label + '</a>' : label) + '</li>';
    }).join('');
  }

  /* ---------- gallery (uniform slider) ---------- */
  var gal = $('#sGallery'); gal.innerHTML = WA.sliderHTML(s.gallery || s.images, s.title); WA.initSlider(gal);

  /* ---------- lodges, inclusions ---------- */
  $('#sAcc tbody').innerHTML = s.accommodation.map(function (a) { return '<tr><td>' + esc(a.name) + '</td><td>' + esc(a.loc) + '</td><td>' + esc(a.nights) + '</td><td>' + esc(a.basis) + '</td></tr>'; }).join('');
  $('#sInc').innerHTML = s.included.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
  $('#sExc').innerHTML = s.excluded.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');

  /* ---------- pricing + booking widget ---------- */
  var prices = s.prices.slice().sort(function (a, b) { return a[0] - b[0]; });
  var min = prices[0][0], max = prices[prices.length - 1][0], n = Math.min(Math.max(2, min), max);
  function priceFor(k) { var p = prices.filter(function (x) { return x[0] === k; })[0]; return p ? p[1] : null; }
  $('#sPrices tbody').innerHTML = prices.map(function (p) { return '<tr data-n="' + p[0] + '"><td>' + p[0] + (p[0] === 1 ? ' traveller' : ' travellers') + '</td><td>' + money(p[1]) + '</td></tr>'; }).join('') + '<tr><td>' + (max + 1) + '+ travellers</td><td>On request</td></tr>';
  $('#bTitle').textContent = s.title;
  function update() {
    var lbl = n + (n === 1 ? ' traveller' : ' travellers'), pp = priceFor(n);
    $('#bCount').textContent = lbl; $('#bGroupLbl').textContent = lbl;
    $('#bPrice').textContent = money(pp); $('#bTotal').textContent = money(pp * n);
    $('#bMinus').disabled = n <= min; $('#bPlus').disabled = n >= max;
    $$('#sPrices tbody tr').forEach(function (tr) { tr.classList.toggle('is-current', +tr.dataset.n === n); });
    $('#bCta').href = enquire + '&travellers=' + n;
  }
  $('#bMinus').addEventListener('click', function () { if (n > min) { n--; update(); } });
  $('#bPlus').addEventListener('click', function () { if (n < max) { n++; update(); } });
  update();

  /* ---------- FAQs (generated from this itinerary's data in tools/routes.py) ---------- */
  var faqs = s.faqs || [];
  $('#sFaq').innerHTML = WA.faqHTML(faqs); WA.faqSchema(faqs);

  /* ---------- sub-nav active state ---------- */
  var links = $$('.subnav__links a'), targets = links.map(function (a) { return $(a.getAttribute('href')); });
  window.addEventListener('scroll', function () {
    var y = innerHeight * 0.3, cur = 0;
    targets.forEach(function (t, i) { if (t && t.getBoundingClientRect().top < y) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
  }, { passive: true });

  WA.observe($('#main'));
  related();

  function related() {
    var rel = DATA.filter(function (x) { return x.id !== s.id; }).map(function (x) {
      return { x: x, score: x.themes.filter(function (t) { return s.themes.indexOf(t) > -1; }).length * 10 - Math.abs(x.days - s.days) };
    }).sort(function (a, b) { return b.score - a.score; }).slice(0, 8).map(function (o) { return o.x; });
    var track = $('#relTrack');
    track.innerHTML = rel.map(function (x) { return WA.cardHTML(x); }).join('');
    WA.initTrack(track, $('[data-track-prev]'), $('[data-track-next]'), $('.track__progress span'));
  }
})();
