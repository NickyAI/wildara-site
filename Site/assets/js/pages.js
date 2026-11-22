/* ==========================================================================
   Wildara · data-driven pages: destinations, experiences, journal
   ========================================================================== */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc;
  var DEST = window.WILDARA_DESTINATIONS || [], EXP = window.WILDARA_EXPERIENCES || [], JOUR = window.WILDARA_JOURNAL || [], SAF = window.WILDARA_SAFARIS || [];
  var page = document.body.getAttribute('data-page');
  var q = new URLSearchParams(location.search);
  var PAGE_ID = document.body.getAttribute('data-id');
  function byId(list, id) { return list.filter(function (x) { return x.id === id; })[0]; }
  function heroImg(name) { return WA.img(name, '100vw', '', 'fetchpriority="high" loading="eager"'); }
  function list(items, cls) { return '<ul class="' + (cls || 'notes') + '">' + items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }
  function notFound(kind, back, label) {
    $('#main').innerHTML = '<section class="page-hero"><div class="page-hero__bg">' + heroImg('lone-tree') + '</div><div class="wrap page-hero__inner"><h1>This trail has gone <em>quiet.</em></h1><p class="lead">We couldn’t find that ' + kind + '. <a href="' + back + '" style="text-decoration:underline">' + label + '</a>.</p></div></section>';
  }
  function safarisFor(fn) { return SAF.filter(fn).sort(function (a, b) { return a.days - b.days; }); }
  function track(id, items) {
    var el = $('#' + id); if (!el) return;
    if (!items.length) { el.closest('section').hidden = true; return; }
    el.innerHTML = items.map(function (s) { return WA.cardHTML(s); }).join('');
    var sec = el.closest('section');
    WA.initTrack(el, $('[data-track-prev]', sec), $('[data-track-next]', sec), $('.track__progress span', sec));
  }
  var DEST_GROUP = { serengeti: 'Serengeti ecosystem', mara: 'Serengeti ecosystem', ndutu: 'Serengeti ecosystem', ngorongoro: 'Crater highlands & lakes', manyara: 'Crater highlands & lakes', eyasi: 'Crater highlands & lakes', tarangire: 'Gateway parks', arusha: 'Gateway parks', zanzibar: 'Indian Ocean' };
  // when to go: 2 best, 1 good, 0 possible
  var WHEN = { serengeti: [2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 1, 2], mara: [0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 1, 0], ndutu: [2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 1, 2], ngorongoro: [2, 2, 1, 1, 1, 2, 2, 2, 2, 2, 1, 2], tarangire: [1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 1, 1], manyara: [1, 1, 1, 0, 1, 2, 2, 2, 2, 2, 1, 1], eyasi: [1, 1, 1, 0, 0, 2, 2, 2, 2, 2, 1, 1], arusha: [2, 2, 1, 0, 1, 2, 2, 2, 2, 2, 1, 2], zanzibar: [2, 2, 1, 0, 0, 2, 2, 2, 2, 2, 1, 2] };
  var MON = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  var MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var LEVEL = ['Possible', 'Good', 'Best'];

  function destSafaris(d) { return safarisFor(function (s) { return (s.route || []).some(function (r) { return d.mapKeys.indexOf(r.k) > -1; }); }); }
  function tabs(el, values, onPick) {
    el.innerHTML = values.map(function (v, i) { return '<button class="chip" type="button" aria-pressed="' + (i === 0) + '" data-v="' + esc(v.v) + '">' + esc(v.label) + (v.n != null ? '<sup>' + v.n + '</sup>' : '') + '</button>'; }).join('');
    $$('.chip', el).forEach(function (b) { b.addEventListener('click', function () { $$('.chip', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); onPick(b.dataset.v); }); });
  }

  /* ======================================================================
     DESTINATIONS ARCHIVE
     ====================================================================== */
  function destinations() {
    var grid = $('#destGrid');
    function draw(group) {
      grid.innerHTML = DEST.filter(function (d) { return !group || DEST_GROUP[d.id] === group; }).map(function (d, i) {
        return WA.ccardHTML({ href: WA.link('destinations', d.id), img: d.hero, pill: DEST_GROUP[d.id], meta: d.kicker, title: d.name, text: d.excerpt, cta: 'Explore ' + d.short, d: i % 3, cls: (!group && i === 0) ? 'ccard--wide' : '' });
      }).join('');
      WA.observe(grid);
    }
    var groups = ['Serengeti ecosystem', 'Crater highlands & lakes', 'Gateway parks', 'Indian Ocean'];
    tabs($('#destTabs'), [{ v: '', label: 'All destinations', n: DEST.length }].concat(groups.map(function (g) { return { v: g, label: g, n: DEST.filter(function (d) { return DEST_GROUP[d.id] === g; }).length }; })), draw);
    draw('');

    // interactive map with preview card
    var card = $('#mapCard'), keyToDest = {};
    DEST.forEach(function (d) { d.mapKeys.forEach(function (k) { if (!keyToDest[k]) keyToDest[k] = d; }); });
    function preview(k) {
      var d = keyToDest[k]; if (!d) return;
      card.innerHTML = '<div class="dest-card__img"><img src="' + WA.u('assets/img/') + d.hero + '-m.webp" alt=""></div><div class="dest-card__body"><small>' + esc(d.kicker) + '</small><h3>' + esc(d.name) + '</h3><p>' + esc(d.excerpt) + '</p><a class="link-u" href="' + WA.link('destinations', d.id) + '">Discover ' + esc(d.short) + ' ' + WA.ARROW + '</a></div>';
    }
    WA.map($('#destMap'), { mode: 'explore', onSelect: preview, link: function (k) { return keyToDest[k] ? WA.link('destinations', keyToDest[k].id) : null; } });
    preview('serengeti');

    // when-to-go matrix
    $('#whenTable').innerHTML = '<thead><tr><th scope="col">Destination</th>' + MON.map(function (m, i) { return '<th scope="col" title="' + MONL[i] + '"><abbr title="' + MONL[i] + '">' + m + '</abbr></th>'; }).join('') + '</tr></thead><tbody>' +
      DEST.map(function (d) { return '<tr><th scope="row"><a href="' + WA.link('destinations', d.id) + '">' + esc(d.short) + '</a></th>' + WHEN[d.id].map(function (v, i) { return '<td><span class="lvl lvl-' + v + '" title="' + MONL[i] + ': ' + LEVEL[v] + '"><span class="sr-only">' + MONL[i] + ': ' + LEVEL[v] + '</span></span></td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';

    var faqs = [
      { q: 'Which Tanzania destinations should I combine on a first safari?', a: 'The classic northern circuit pairs Tarangire, Lake Manyara or Ngorongoro Crater with the Serengeti. Five to seven days lets you experience elephants among baobabs, the Crater’s extraordinary density of wildlife and the open plains of the Serengeti without feeling rushed. Add Zanzibar at the end if you would like to unwind by the sea.' },
      { q: 'How far apart are the parks?', a: 'Arusha to Tarangire is about two hours by road, and Karatu, the gateway to the Crater, Manyara and Lake Eyasi, is a little further. Reaching the central Serengeti from Karatu takes around three hours, with game viewing along the way. Zanzibar is a short domestic flight from Arusha or the Serengeti airstrips.' },
      { q: 'Where should I go to see the Great Migration?', a: 'It depends on the month. The herds calve around Ndutu and the southern plains from roughly January to March, move through the central and western Serengeti from May to June, and cross the Mara River in the far north between about July and early October. Our when-to-go table above shows the best match for your dates.' },
      { q: 'Is there a destination that suits families or slower travellers?', a: 'Tarangire and Lake Manyara are close to Arusha, with short drives and rich wildlife, which makes them ideal for families or shorter trips. Arusha National Park offers walking and canoeing in the shadow of Mount Meru, and Zanzibar adds an easy, relaxed finale.' }
    ];
    $('#destFaq').innerHTML = WA.faqHTML(faqs); WA.faqSchema(faqs);
  }

  /* ======================================================================
     DESTINATION SINGLE
     ====================================================================== */
  function destination() {
    var d = byId(DEST, PAGE_ID || q.get('id'));
    if (!d) return notFound('destination', WA.link('destinations'), 'See all destinations');
    var idx = DEST.indexOf(d), next = DEST[(idx + 1) % DEST.length], prev = DEST[(idx - 1 + DEST.length) % DEST.length];
    if (!$('#hBg img')) $('#hBg').innerHTML = heroImg(d.hero);
    $('#hCrumb').textContent = d.short;
    $('#hKicker').textContent = d.kicker + ' · ' + d.region;
    var h1 = $('#hTitle'); h1.textContent = d.name; WA.splitText(h1);
    $('#hLead').textContent = d.tagline;
    $$('[data-plan]').forEach(function (a) { a.href = WA.link('plan', null, 'dest=' + d.id); });

    $('#dIntro').innerHTML = d.intro.map(function (p, i) { return '<p' + (i === 0 ? ' class="first"' : '') + ' data-reveal style="--d:' + i + '">' + esc(p) + '</p>'; }).join('');
    $('#dFacts').innerHTML = d.facts.map(function (f) { return '<div><small>' + esc(f.label) + '</small><b>' + esc(f.value) + '</b></div>'; }).join('');
    $('#dGallery').innerHTML = WA.sliderHTML(d.images, d.name); WA.initSlider($('#dGallery'));
    $('#dHigh').innerHTML = d.highlights.map(function (h, i) { return '<div class="hl" data-reveal style="--d:' + (i % 3) + '"><span>' + ['i.', 'ii.', 'iii.', 'iv.', 'v.', 'vi.'][i] + '</span><h3>' + esc(h.title) + '</h3><p>' + esc(h.text) + '</p></div>'; }).join('') + '<div class="hl" data-reveal style="--d:2"><span>Your journey</span><h3>Ready to see it for yourself?</h3><p>Every Wildara itinerary can be shaped around ' + esc(d.short) + '. Tell us your dates and we will design the route.</p><a class="btn btn--light" href="' + WA.link('plan', null, 'dest=' + d.id) + '" style="margin-top:1.2rem">Plan a safari here ' + WA.ARROW + '</a></div>';
    $('#dWild').innerHTML = d.wildlife.map(function (w) { return '<li>' + esc(w) + '</li>'; }).join('');
    $('#dTips').innerHTML = list(d.tips);
    $('#dSeasons').innerHTML = d.seasons.map(function (s, i) { return '<div class="scard2" data-reveal style="--d:' + i + '"><small>' + esc(s.period) + '</small><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('');
    $('#dWhen').innerHTML = WHEN[d.id].map(function (v, i) { return '<div class="whenbar__m"><span class="lvl lvl-' + v + '"></span><small>' + MONL[i].slice(0, 3) + '</small><span class="sr-only">' + LEVEL[v] + '</span></div>'; }).join('');
    WA.map($('#dMap'), { mode: 'focus', focus: d.mapKeys, label: 'Map showing ' + d.name, link: function (k) { var t = DEST.filter(function (x) { return x.mapKeys.indexOf(k) > -1; })[0]; return t ? WA.link('destinations', t.id) : null; } });
    $('#dStay').innerHTML = d.stay.map(function (s, i) { return '<div class="stay" data-reveal style="--d:' + i + '"><small>' + esc(s.type) + '</small><h3>' + esc(s.name) + '</h3><p>' + esc(s.text) + '</p></div>'; }).join('');
    var saf = destSafaris(d);
    $('#safCount').textContent = saf.length ? saf.length + ' journeys include ' + d.short : '';
    track('dTrack', saf);
    var exps = EXP.filter(function (e) { return e.where.some(function (w) { return w.dest === d.id; }); }).slice(0, 3);
    if (exps.length) $('#dExp').innerHTML = exps.map(function (e, i) { var w = e.where.filter(function (x) { return x.dest === d.id; })[0]; return WA.ccardHTML({ href: WA.link('experiences', e.id), img: e.hero, meta: e.category, title: e.title, text: w.text, d: i }); }).join('');
    else $('#dExp').closest('section').hidden = true;
    $('#dFaq').innerHTML = WA.faqHTML(d.faqs); WA.faqSchema(d.faqs);
    $('#faqTitle').innerHTML = esc(d.short) + ', <em>answered.</em>';
    $('#nextLink').href = WA.link('destinations', next.id); $('#nextName').textContent = next.name; $('#nextImg').innerHTML = WA.img(next.hero, '50vw', '');
    $('#prevLink').href = WA.link('destinations', prev.id); $('#prevName').textContent = prev.name;
    subnav();
  }

  /* ======================================================================
     EXPERIENCES ARCHIVE
     ====================================================================== */
  function experiences() {
    var grid = $('#expGrid');
    function draw(cat) {
      grid.innerHTML = EXP.filter(function (e) { return !cat || e.category === cat; }).map(function (e, i) {
        return WA.ccardHTML({ href: WA.link('experiences', e.id), img: e.hero, pill: e.category, meta: e.kicker, title: e.title, text: e.excerpt, cta: 'Discover', d: i % 3, cls: (!cat && (i === 0 || i === 4)) ? 'ccard--wide' : '' });
      }).join('');
      WA.observe(grid);
    }
    var cats = []; EXP.forEach(function (e) { if (cats.indexOf(e.category) < 0) cats.push(e.category); });
    tabs($('#expTabs'), [{ v: '', label: 'All experiences', n: EXP.length }].concat(cats.map(function (c) { return { v: c, label: c, n: EXP.filter(function (e) { return e.category === c; }).length }; })), draw);
    draw('');
    var faqs = [
      { q: 'Can I add experiences to any safari?', a: 'Yes. Hot-air balloon flights, guided walks, cultural visits, bush dinners and sundowners can be added to most itineraries on request. Some depend on the parks you visit and the season, so tell us what appeals and we will build it into your route and quote.' },
      { q: 'Are experiences included in the safari price?', a: 'Game drives listed in your itinerary are included. Optional experiences such as ballooning, walking safaris, cultural visits and private dining are priced separately and confirmed in your proposal, so you only pay for what you choose.' },
      { q: 'Which experiences suit children?', a: 'Game drives, cultural visits and picnic lunches work wonderfully for families. Ballooning and walking safaris have minimum age guidelines set by operators and parks, which we will confirm for your dates. Our private vehicles let you set a gentle pace with plenty of breaks.' },
      { q: 'How far ahead should I book special experiences?', a: 'Balloon flights over the Serengeti and private bush dinners can fill up in the busiest months, especially July to October and the festive season. Booking at the same time as your safari is the best way to secure them.' }
    ];
    $('#expFaq').innerHTML = WA.faqHTML(faqs); WA.faqSchema(faqs);
  }

  /* ======================================================================
     EXPERIENCE SINGLE
     ====================================================================== */
  function experience() {
    var e = byId(EXP, PAGE_ID || q.get('id'));
    if (!e) return notFound('experience', WA.link('experiences'), 'See all experiences');
    if (!$('#hBg img')) $('#hBg').innerHTML = heroImg(e.hero);
    $('#hCrumb').textContent = e.title;
    $('#hKicker').textContent = e.category + ' · ' + e.kicker;
    var h1 = $('#hTitle'); h1.textContent = e.title; WA.splitText(h1);
    $('#hLead').textContent = e.tagline;
    $('#eFacts').innerHTML = e.facts.map(function (f) { return '<div><small>' + esc(f.label) + '</small><b>' + esc(f.value) + '</b></div>'; }).join('');
    $('#eIntro').innerHTML = e.intro.map(function (p, i) { return '<p' + (i === 0 ? ' class="first"' : '') + ' data-reveal style="--d:' + i + '">' + esc(p) + '</p>'; }).join('');
    $('#eImg').innerHTML = WA.img(e.images[0], '(max-width: 900px) 92vw, 45vw', '');
    $('#eMoments').innerHTML = e.moments.map(function (m, i) { return '<div class="moment" data-reveal style="--d:' + i + '"><h3>' + esc(m.title) + '</h3><p>' + esc(m.text) + '</p></div>'; }).join('');
    $('#eWhere').innerHTML = e.where.map(function (w, i) {
      var d = byId(DEST, w.dest); if (!d) return '';
      return WA.ccardHTML({ href: WA.link('destinations', d.id), img: d.hero, meta: d.kicker, title: d.name, text: w.text, cta: 'Explore ' + d.short, d: i });
    }).join('');
    $('#eGallery').innerHTML = WA.sliderHTML([e.hero].concat(e.images), e.title); WA.initSlider($('#eGallery'));
    $('#eGood').innerHTML = list(e.goodToKnow);
    var saf = e.related.theme ? safarisFor(function (s) { return s.themes.indexOf(e.related.theme) > -1; })
      : safarisFor(function (s) { return (s.route || []).some(function (r) { return e.where.some(function (w) { var d = byId(DEST, w.dest); return d && d.mapKeys.indexOf(r.k) > -1; }); }); }).slice(0, 10);
    track('eTrack', saf);
    $('#eFaq').innerHTML = WA.faqHTML(e.faqs); WA.faqSchema(e.faqs);
    $$('[data-plan]').forEach(function (a) { a.href = WA.link('plan', null, 'experience=' + e.id); });
    var others = EXP.filter(function (x) { return x !== e; }).slice(0, 3);
    $('#eMore').innerHTML = others.map(function (x, i) { return WA.ccardHTML({ href: WA.link('experiences', x.id), img: x.hero, meta: x.category, title: x.title, text: x.excerpt, d: i }); }).join('');
  }

  /* ======================================================================
     JOURNAL ARCHIVE
     ====================================================================== */
  function journal() {
    var posts = JOUR.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var f = posts[0];
    $('#jFeature').innerHTML = '<a class="jfeature" href="' + WA.link('journal', f.id) + '" data-reveal><div class="jfeature__img">' + WA.img(f.hero, '(max-width: 900px) 92vw, 60vw', '') + '</div><div class="jfeature__body"><span class="ccard__meta">Latest · ' + esc(f.category) + '</span><h2>' + esc(f.title) + '</h2><p>' + esc(f.excerpt) + '</p><p class="jmeta">' + WA.fmtDate(f.date) + ' · ' + f.readMins + ' min read</p><span class="btn">Read the guide ' + WA.ARROW + '</span></div></a>';
    var grid = $('#jGrid');
    function draw(cat) {
      grid.innerHTML = posts.filter(function (p) { return (!cat && p !== f) || p.category === cat; }).map(function (p, i) {
        return WA.ccardHTML({ href: WA.link('journal', p.id), img: p.hero, pill: p.category, meta: WA.fmtDate(p.date) + ' · ' + p.readMins + ' min read', title: p.title, text: p.excerpt, cta: 'Read', d: i % 3 });
      }).join('');
      WA.observe(grid);
    }
    var cats = ['Planning', 'Parks & wildlife', 'Practical', 'Special interest'];
    tabs($('#jTabs'), [{ v: '', label: 'All guides', n: posts.length }].concat(cats.map(function (c) { return { v: c, label: c, n: posts.filter(function (p) { return p.category === c; }).length }; })), draw);
    draw('');
  }

  /* ======================================================================
     ARTICLE
     ====================================================================== */
  function article() {
    var a = byId(JOUR, PAGE_ID || q.get('id'));
    if (!a) return notFound('article', WA.link('journal'), 'Visit the Safari Journal');
    if (!$('#hBg img')) $('#hBg').innerHTML = heroImg(a.hero);
    $('#hCrumb').textContent = a.category;
    $('#hKicker').textContent = a.category;
    var h1 = $('#hTitle'); h1.textContent = a.title; WA.splitText(h1);
    $('#hMeta').innerHTML = '<span>' + esc(a.author) + '</span><span>' + WA.fmtDate(a.date) + '</span><span>' + a.readMins + ' min read</span>';
    function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    var mid = Math.floor(a.sections.length / 2);
    $('#aBody').innerHTML = '<p class="intro">' + esc(a.intro) + '</p>' + a.sections.map(function (s, i) {
      return '<h2 id="' + slug(s.h) + '">' + esc(s.h) + '</h2>' + s.body.map(function (b) { return typeof b === 'string' ? '<p>' + esc(b) + '</p>' : '<ul>' + b.list.map(function (li) { return '<li>' + esc(li) + '</li>'; }).join('') + '</ul>'; }).join('') +
        (s.image ? '<figure>' + WA.img(s.image, '(max-width: 860px) 92vw, 720px', '') + '</figure>' : '') +
        (i === mid ? '<blockquote class="pullquote">' + esc(a.pullquote) + '</blockquote>' : '');
    }).join('') + '<h2 id="faqs">Frequently asked questions</h2>' + WA.faqHTML(a.faqs);
    WA.faqSchema(a.faqs);
    $('#aToc').innerHTML = '<small>In this guide</small>' + a.sections.map(function (s) { return '<a href="#' + slug(s.h) + '">' + esc(s.h) + '</a>'; }).join('') + '<a href="#faqs">FAQs</a>';
    // toc active state + reading progress
    var heads = $$('#aBody h2'), links = $$('#aToc a'), bar = $('#readBar');
    window.addEventListener('scroll', function () {
      var cur = 0; heads.forEach(function (h, i) { if (h.getBoundingClientRect().top < innerHeight * 0.3) cur = i; });
      links.forEach(function (l, i) { l.classList.toggle('is-active', i === cur); });
      var body = $('#aBody').getBoundingClientRect(); bar.style.transform = 'scaleX(' + WA.clamp(-body.top / (body.height - innerHeight * 0.6), 0, 1) + ')';
    }, { passive: true });
    var saf = safarisFor(function (s) { return (a.related.theme && s.themes.indexOf(a.related.theme) > -1) || (a.related.dest && (s.route || []).some(function (r) { var d = byId(DEST, a.related.dest); return d && d.mapKeys.indexOf(r.k) > -1; })); });
    if (!saf.length) saf = SAF.slice(10, 18);
    track('aTrack', saf.slice(0, 10));
    var more = JOUR.filter(function (x) { return x !== a; }).sort(function (x, y) { return (y.category === a.category) - (x.category === a.category); }).slice(0, 3);
    $('#aMore').innerHTML = more.map(function (p, i) { return WA.ccardHTML({ href: WA.link('journal', p.id), img: p.hero, meta: p.category + ' · ' + p.readMins + ' min', title: p.title, text: p.excerpt, cta: 'Read', d: i }); }).join('');
  }

  /* sticky sub-nav active state */
  function subnav() {
    var links = $$('.subnav__links a'), targets = links.map(function (a) { return $(a.getAttribute('href')); });
    window.addEventListener('scroll', function () {
      var cur = 0; targets.forEach(function (t, i) { if (t && !t.closest('[hidden]') && t.getBoundingClientRect().top < innerHeight * 0.3) cur = i; });
      links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
    }, { passive: true });
  }

  var R = { destinations: destinations, destination: destination, experiences: experiences, experience: experience, journal: journal, article: article };
  if (R[page]) { R[page](); WA.observe(document); }
})();
