/* Wildara · single safari page */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc, money = WA.money;
  var DATA = window.WILDARA_SAFARIS || [];
  var id = new URLSearchParams(location.search).get('id');
  var s = DATA.filter(function (x) { return x.id === id; })[0];
  var DEST_PAGE = { arusha: 'arusha', arushanp: 'arusha', tarangire: 'tarangire', manyara: 'manyara', ngorongoro: 'ngorongoro', eyasi: 'eyasi', ndutu: 'ndutu', serengeti: 'serengeti', mara: 'mara', zanzibar: 'zanzibar' };

  if (!s) {
    $('#s-title').innerHTML = 'This trail has gone <em>quiet.</em>';
    $('#sFacts').outerHTML = '<p class="lead" style="margin-top:1.4rem">We couldn’t find that itinerary. <a href="safaris.html" style="text-decoration:underline">Browse all safaris</a>.</p>';
    $('#sHeroBg').innerHTML = WA.img('lone-tree', '100vw', '');
    ['#sBody', '#gallery', '#faqs', '.subnav'].forEach(function (q) { var e = $(q); if (e) e.hidden = true; });
    var sec = $('#lodges'); if (sec) sec.closest('section').hidden = true;
    s = DATA[0];
    related(); return;
  }

  var enquire = 'plan.html?safari=' + encodeURIComponent(s.id);
  document.title = s.title + ' · ' + s.days + ' Days · Wildara Africa Safaris';
  var md = document.querySelector('meta[name="description"]'); if (md) md.content = (s.tagline + ' ' + (s.intro[0] || '')).slice(0, 158);

  /* ---------- hero ---------- */
  $('#sHeroBg').innerHTML = WA.img(s.images[0], '100vw', '', 'fetchpriority="high" loading="eager"');
  $('#sCrumb').textContent = s.days + ' days';
  var h1 = $('#s-title'); h1.textContent = s.title; h1.setAttribute('data-split', ''); WA.splitText(h1);
  $('#sFacts').innerHTML = [['Duration', s.days + ' days'], ['Destinations', s.destinations], ['Style', (s.tier !== 'Classic' ? s.tier + ' · ' : '') + 'Private'], ['From', money(s.from) + ' pp']]
    .map(function (f) { return '<div class="fact"><small>' + f[0] + '</small><b>' + esc(f[1]) + '</b></div>'; }).join('');
  ['#heroCta', '#subCta', '#priceCta'].forEach(function (q) { $(q).href = enquire; });
  $('#subPrice').textContent = money(s.from);

  /* ---------- overview ---------- */
  $('#overview').innerHTML = '<span class="eyebrow" data-reveal>Overview</span><p class="tagline" data-reveal style="margin-top:1.2rem">' + esc(s.tagline) + '</p>' +
    s.intro.map(function (p, i) { return '<p data-reveal style="--d:' + (i + 1) + '">' + esc(p) + '</p>'; }).join('') +
    '<ul class="chips-list">' + ['Private safari', s.transport ? '4x4 Land Cruiser, pop-up roof' : '', 'English-speaking guide', 'Park fees included', s.days + ' days · ' + Math.max(s.days - 1, 1) + ' nights'].filter(Boolean).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>';

  /* ---------- timeline ---------- */
  var tl = $('#sTimeline');
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
      return '<li>' + (DEST_PAGE[k] ? '<a href="destination.html?id=' + DEST_PAGE[k] + '">' + label + '</a>' : label) + '</li>';
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

  /* ---------- FAQs, written from this itinerary's own data ---------- */
  var keys = s.route.map(function (r) { return r.k; });
  var when;
  if (keys.indexOf('mara') > -1) when = 'This journey is built around the Mara River crossings in the northern Serengeti, which usually happen between July and early October. August and September are the most reliable months. Herds move with the rains, so no date is guaranteed, but our guides follow daily reports to give you the best chance.';
  else if (keys.indexOf('ndutu') > -1) when = 'This safari is designed for calving season on the southern plains around Ndutu, roughly January to March, with February usually the peak. It is a green, dramatic time with excellent predator activity and fewer vehicles than the northern crossings.';
  else when = 'The parks on this route are rewarding all year. The dry season from June to October brings easy game viewing around water, while the green season from November to May offers lush landscapes, newborn animals, quieter parks and often better lodge availability. We will suggest the best dates for what you want to see.';
  var lodges = s.accommodation.map(function (a) { return a.name; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
  var faqs = [
    { q: 'Is this a private safari?', a: 'Yes. Every Wildara safari is private, so the vehicle, the guide and the pace are yours alone. You travel in a 4x4 Toyota Land Cruiser with a pop-up roof, binoculars, charging points and mineral water on board, with a professional English-speaking guide throughout.' },
    { q: 'How much does the ' + s.days + '-day safari cost?', a: 'Prices are per person in USD and depend on group size: ' + money(priceFor(Math.min(Math.max(2, min), max))) + ' per person for ' + Math.max(2, min) + ' travellers, falling to ' + money(prices[prices.length - 1][1]) + ' per person for a group of ' + max + '. Larger groups are quoted on request. Prices may change before full payment, as set out in our terms and conditions.' },
    { q: 'When is the best time to do this safari?', a: when },
    { q: 'What is included in the price?', a: 'Airport transfers, a private 4x4 safari vehicle and guide, all park entrance and conservation fees' + (keys.indexOf('ngorongoro') > -1 ? ', the Ngorongoro Crater service fee' : '') + ', all game drives listed, accommodation on the stated meal basis, picnic lunches on game drives, drinking water and government taxes. International flights, visas, travel insurance, tips and drinks at lodges are not included.' },
    { q: 'Where does the safari start and finish?', a: 'Your guide meets you at Kilimanjaro International Airport or Arusha Airport on day 1 and transfers you to your hotel. ' + (keys.indexOf('zanzibar') > -1 ? 'The journey continues by short domestic flight to Zanzibar, and ends with a transfer for your international flight.' : 'On the final day we drop you at the airport about three hours before your international flight.') },
    { q: 'Where will we stay?', a: 'This itinerary uses ' + lodges.join(', ') + '. Each is chosen for its location, comfort and warm service. If you would like to upgrade to a more exclusive camp or change the style of accommodation, we will happily adjust the proposal.' },
    { q: 'Can we change or extend the itinerary?', a: 'Of course. Every itinerary is a starting point. We can add nights, swap parks, include a hot-air balloon flight or walking safari, or add a few days on Zanzibar. Tell us what matters to you and we will reshape the route and the price.' },
    { q: 'How do we book, and what deposit is needed?', a: 'Send an enquiry and we will reply with a tailored proposal. A 30% non-refundable deposit confirms your booking, and the balance is due 45 to 60 days before travel. Bookings made within 60 days of travel are paid in full at booking.' }
  ];
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
