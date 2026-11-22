/* ==========================================================================
   Wildara · homepage choreography
   ========================================================================== */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, clamp = WA.clamp, lerp = WA.lerp;
  var reduce = WA.reduce.matches;
  var ICON_RATIO = 1291 / 2085;
  var DEEP = { x: 0.526, y: 0.80 };   // thickest point of the W stroke, below the fox's head
  var FOX = { x: 0.50, y: 0.67 };     // where the light comes to rest

  var easeInOut = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var easeOut = function (t) { return 1 - Math.pow(1 - t, 3); };
  var easeIn = function (t) { return t * t * t; };

  /* ======================================================================
     1. INTRO  ·  light discovers the fox and trunk, then the W opens
     ====================================================================== */
  var hero = $('.hero');
  var heroVideo = $('#heroVideo');
  function heroReady() { hero && hero.classList.add('is-ready'); }
  if (heroVideo) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }

  function runIntro() {
    var html = document.documentElement, intro = $('#intro');
    if (!intro || !html.classList.contains('intro-on')) { heroReady(); return; }
    var bark = $('.intro__bark', intro), stage = $('.intro__stage', intro), mark = $('.intro__mark', intro),
        glow = $('.intro__glow', intro), caption = $('.intro__caption', intro), skip = $('.intro__skip', intro);
    var mw, mh, rect;
    function layout() {
      mw = Math.min(innerWidth * (innerWidth < 700 ? 0.78 : 0.56), 760); mh = mw * ICON_RATIO;
      intro.style.setProperty('--mw', mw + 'px'); intro.style.setProperty('--mh', mh + 'px');
      var left = (innerWidth - mw) / 2, top = (innerHeight - mh) / 2;
      rect = { left: left, top: top };
      var ox = left + DEEP.x * mw, oy = top + DEEP.y * mh;
      bark.style.setProperty('--ox', ox + 'px'); bark.style.setProperty('--oy', oy + 'px');
      stage.style.setProperty('--ox', ox + 'px'); stage.style.setProperty('--oy', oy + 'px');
    }
    layout();

    // the beam traces the letter: left swash, down the first stroke, up the diagonal, to the fox
    var path = [[-0.12, 0.42], [0.05, 0.36], [0.2, 0.3], [0.22, 0.6], [0.2, 0.86], [0.3, 0.78], [0.42, 0.55], [0.47, 0.5], [FOX.x, FOX.y]];
    function catmull(pts, t) {
      var n = pts.length - 1, f = t * n, i = Math.min(Math.floor(f), n - 1), u = f - i;
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n)];
      function c(a, b, c2, d) { return 0.5 * ((2 * b) + (-a + c2) * u + (2 * a - 5 * b + 4 * c2 - d) * u * u + (-a + 3 * b - 3 * c2 + d) * u * u * u); }
      return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
    }

    var T = { fadeIn: 500, trace: 2300, rest: 1000, light: 650, open: 1200 };
    var t1 = T.fadeIn, t2 = t1 + T.trace, t3 = t2 + T.rest, t4 = t3 + T.light, t5 = t4 + T.open;
    var start = null, done = false, windowed = false;

    function finish(fast) {
      if (done) return; done = true;
      try { sessionStorage.setItem('wa-intro', '1'); } catch (e) {}
      intro.classList.add('is-done');
      if (fast) intro.style.transition = 'opacity .45s, visibility 0s .45s';
      setTimeout(function () { html.classList.remove('intro-on'); intro.remove(); }, fast ? 460 : 650);
      heroReady();
    }
    skip.addEventListener('click', function () { finish(true); });
    document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { finish(true); document.removeEventListener('keydown', onKey); } });
    window.addEventListener('resize', layout);

    function frame(now) {
      if (done) return;
      if (start === null) start = now;
      var t = now - start;
      mark.style.opacity = clamp(t / T.fadeIn, 0, 1);

      var lx, ly, lr = 9;
      if (t < t2) {
        var pt = catmull(path, easeInOut(clamp((t - t1) / T.trace, 0, 1)));
        lx = pt[0]; ly = pt[1];
      } else { lx = FOX.x; ly = FOX.y; }
      if (t >= t2 && t < t3) { lr = 9 + Math.sin(((t - t2) / T.rest) * Math.PI) * 3; caption.classList.add('is-in'); }
      if (t >= t3) { lr = lerp(9, 170, easeIn(clamp((t - t3) / T.light, 0, 1))); }
      mark.style.setProperty('--lx', (lx * 100) + '%'); mark.style.setProperty('--ly', (ly * 100) + '%'); mark.style.setProperty('--lr', lr + '%');
      glow.style.setProperty('--gx', (rect.left + lx * mw) + 'px'); glow.style.setProperty('--gy', (rect.top + ly * mh) + 'px');
      glow.style.opacity = t < t3 ? 1 : 1 - clamp((t - t3) / T.light, 0, 1);

      if (t >= t4) {
        if (!windowed) { windowed = true; bark.classList.add('is-window'); caption.classList.remove('is-in'); }
        var k = easeIn(clamp((t - t4) / T.open, 0, 1));
        var s = Math.pow(60, k);
        bark.style.transform = stage.style.transform = 'scale(' + s + ')';
        mark.style.opacity = 1 - clamp((t - t4) / (T.open * 0.35), 0, 1);
        if (t >= t4 + T.open * 0.55) heroReady();
      }
      if (t >= t5) { finish(false); return; }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  runIntro();

  /* ======================================================================
     2. MANIFESTO  ·  words light up as you read
     ====================================================================== */
  (function () {
    var el = $('[data-scrub-text]'); if (!el) return;
    var words = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'w'; s.textContent = part; words.push(s); frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !n.classList.contains('inline-pic')) walk(n);
      });
    })(el);
    if (reduce) { words.forEach(function (w) { w.classList.add('is-lit'); }); return; }
    function tick() {
      var r = el.getBoundingClientRect(), vh = innerHeight;
      var p = clamp((vh * 0.9 - r.top) / (r.height * 0.9 + vh * 0.1), 0, 1);
      var n = Math.round(p * words.length * 1.08);
      for (var i = 0; i < words.length; i++) words[i].classList.toggle('is-lit', i < n);
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true });
    tick();
  })();

  /* ======================================================================
     3. PORTAL  ·  the savannah through the W, then the W opens
     ====================================================================== */
  (function () {
    var sec = $('#portal'); if (!sec) return;
    var layer = $('#portalImage'), notes = $$('.portal__note', sec), bars = $$('.portal__progress i', sec), cards = $$('.portal__card', sec);
    if (reduce) {
      layer.classList.remove('is-masked'); sec.style.setProperty('--pf', 1); sec.style.setProperty('--pc', 0); sec.style.setProperty('--pdim', 1); sec.style.setProperty('--pfull', 1);
      return;
    }
    var active = -1, MAXZOOM = 7;   // keep the mask a sensible size: some browsers drop very large masks
    function tick() {
      var r = sec.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
      if (r.bottom < 0 || r.top > vh) return;
      var p = clamp(-r.top / (r.height - vh), 0, 1);
      var bw = vw < 760 ? vw * 0.86 : Math.min(vw * 0.46, vh * 0.86 / ICON_RATIO);
      var bh = bw * ICON_RATIO;
      var cx = vw / 2, cy = vh * (vw < 760 ? 0.5 : 0.56);

      var intro = easeOut(clamp(p / 0.1, 0, 1));
      var zoomK = clamp((p - 0.58) / 0.22, 0, 1);
      var s = (0.84 + 0.16 * intro) * Math.pow(MAXZOOM, easeIn(zoomK));
      var L = cx - bw / 2, Tp = cy - bh / 2;
      var dx = L + DEEP.x * bw, dy = Tp + DEEP.y * bh;
      var w = bw * s, h = bh * s;
      layer.style.webkitMaskSize = layer.style.maskSize = w + 'px ' + h + 'px';
      layer.style.webkitMaskPosition = layer.style.maskPosition = (dx - DEEP.x * w) + 'px ' + (dy - DEEP.y * h) + 'px';

      sec.style.setProperty('--ps', 1.18 - 0.18 * p);
      sec.style.setProperty('--pc', 1 - clamp((p - 0.56) / 0.1, 0, 1));
      sec.style.setProperty('--pfull', easeOut(clamp((p - 0.66) / 0.16, 0, 1)));   // W dissolves into the full landscape
      sec.style.setProperty('--pf', clamp((p - 0.8) / 0.1, 0, 1));
      sec.style.setProperty('--pdim', clamp((p - 0.74) / 0.12, 0, 1));
      sec.style.setProperty('--pgx', ((0.5 - p) * vw * 0.18) + 'px');               // ghost type drifts
      sec.style.setProperty('--pcy', (p * -60) + 'px');                             // contours drift
      sec.style.setProperty('--pcard', ((0.33 - p) * 80) + 'px');                   // cards float

      var np = clamp((p - 0.06) / 0.5, 0, 0.999), idx = Math.floor(np * 3);
      if (idx !== active) {
        active = idx;
        notes.forEach(function (n, i) { n.classList.toggle('is-active', i === idx); });
        cards.forEach(function (c) { c.classList.toggle('is-active', +c.dataset.note === idx); });
      }
      bars.forEach(function (b, i) { b.style.setProperty('--f', clamp(np * 3 - i, 0, 1)); });
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true });
    window.addEventListener('resize', tick);
    tick();
  })();

  /* ======================================================================
     4. FILM  ·  the frame opens like a lens; timecode runs while it plays
     ====================================================================== */
  (function () {
    var frame = $('#filmFrame'), video = $('#filmVideo'), btn = $('#filmToggle'), tc = $('#timecode');
    if (!frame || !video) return;
    var userPaused = false;
    if (!reduce) {
      var tick = function () {
        var r = frame.getBoundingClientRect(), vh = innerHeight;
        var p = clamp((vh - r.top) / (vh * 0.9), 0, 1);
        frame.style.setProperty('--fi', ((1 - easeOut(p)) * 8) + '%');
        frame.style.setProperty('--fr', ((1 - p) * 40 + 4) + 'px');
      };
      window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true }); tick();
    } else { userPaused = true; setBtn(false); }

    function setBtn(playing) {
      btn.setAttribute('aria-label', playing ? 'Pause film' : 'Play film');
      btn.setAttribute('aria-pressed', String(!playing));
      $('.i-pause', btn).hidden = !playing; $('.i-play', btn).hidden = playing;
    }
    new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { if (!userPaused) { video.preload = 'auto'; var pr = video.play(); pr && pr.catch && pr.catch(function () {}); } }
      else video.pause();
    }, { threshold: 0.25 }).observe(frame);
    btn.addEventListener('click', function () {
      if (video.paused) { userPaused = false; video.play(); } else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', function () { setBtn(true); });
    video.addEventListener('pause', function () { setBtn(false); });
    var base = 6 * 3600 + 12 * 60 + 4;
    video.addEventListener('timeupdate', function () {
      var s = Math.floor(base + video.currentTime), f = Math.floor((video.currentTime % 1) * 25);
      tc.textContent = [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(function (n) { return ('0' + n).slice(-2); }).join(':') + ':' + ('0' + f).slice(-2);
    });
  })();

  /* ======================================================================
     5. FEATURED SAFARIS
     ====================================================================== */
  (function () {
    var track = $('#featuredTrack'); if (!track) return;
    if (!track.querySelector('.scard') && window.WILDARA_SAFARIS) {   // normally pre-rendered by the build
      var byId = {}; window.WILDARA_SAFARIS.forEach(function (s) { byId[s.id] = s; });
      track.innerHTML = track.dataset.featured.split(',').map(function (id) { return byId[id] ? WA.cardHTML(byId[id]) : ''; }).join('');
    }
    WA.initTrack(track, $('[data-track-prev]'), $('[data-track-next]'), $('.track__progress span'));
  })();

  /* ======================================================================
     6. CIRCUIT MAP
     ====================================================================== */
  var DEST = {
    arusha: { k: 'Gateway · Start & finish', n: 'Arusha', img: 'giraffe-pair', q: '', t: 'Nestled at the foot of Mount Meru, the safari capital of northern Tanzania. Your guide meets you at Kilimanjaro or Arusha airport, and every journey begins and ends here.' },
    tarangire: { k: 'Elephants & baobabs', n: 'Tarangire', img: 'elephant-herd', q: 'tarangire', t: 'Golden plains curve along the Tarangire River while great herds of elephant wander between ancient baobabs. Lions in the grass, leopards in the branches, pure African romance.' },
    manyara: { k: 'Forest, lake & flamingos', n: 'Lake Manyara', img: 'elephants-pair', q: 'manyara', t: 'Emerald groundwater forest meets glistening soda lake. Famous for tree-climbing lions, playful baboon troops and flamingos painting the shoreline pink.' },
    ngorongoro: { k: 'UNESCO World Heritage', n: 'Ngorongoro Crater', img: 'buffalo-serengeti', q: 'ngorongoro', t: 'The world’s largest intact volcanic caldera, a natural amphitheatre teeming with life. One of the best places in Africa to see black rhino, with lions, elephants and buffalo on its fertile floor.' },
    eyasi: { k: 'Culture & people', n: 'Lake Eyasi', img: 'sunset-tree', q: 'eyasi', t: 'A remote landscape of salt flats, baobabs and escarpment. Spend time with the Hadzabe, among the last hunter-gatherers in Africa, and the pastoralist Datoga.' },
    ndutu: { k: 'Calving season · Jan to Mar', n: 'Ndutu', img: 'wildebeest-walk', q: 'migration', t: 'Rolling short-grass plains on the edge of the Serengeti, where hundreds of thousands of wildebeest gather to give birth, and the predators follow.' },
    serengeti: { k: 'Endless plains', n: 'Central Serengeti', img: 'cheetah-mound', q: 'serengeti', t: 'Vast herds of wildebeest, zebra and antelope, watched by resident lions, leopards and cheetahs. The Seronera valley is one of the richest predator areas on Earth.' },
    mara: { k: 'River crossings · Jul to Oct', n: 'Mara River', img: 'migration-crossing', q: 'migration', t: 'In the far north, the herds gather on the banks of the crocodile-filled Mara River. The crossings are raw, thunderous and unforgettable.' },
    zanzibar: { k: 'Bush & beach finale', n: 'Zanzibar', img: 'zanzibar-turquoise', q: 'zanzibar', t: 'A short flight from the plains: powder-white sand, turquoise reefs, dhows at sunset and the winding alleys of historic Stone Town.' }
  };
  (function () {
    var host = $('#homeMap'); if (!host || !WA.map) return;
    var imgEl = $('#destImg'), body = $('#destBody'), cur = null, timer;
    var ALIAS = { arushanp: 'arusha', karatu: 'ngorongoro' };
    function show(key, instant) {
      key = ALIAS[key] || key; var d = DEST[key]; if (!d || key === cur) return; cur = key;
      clearTimeout(timer);
      var apply = function () {
        $('#destKicker').textContent = d.k; $('#destName').textContent = d.n; $('#destText').textContent = d.t;
        $('#destLink').href = WA.link('destinations', key);
        imgEl.src = WA.u('assets/img/') + d.img + '-m.webp'; imgEl.alt = d.n;
        imgEl.classList.remove('is-out'); body.classList.remove('is-out');
      };
      if (instant || reduce) return apply();
      imgEl.classList.add('is-out'); body.classList.add('is-out');
      var pre = new Image(); pre.src = WA.u('assets/img/') + d.img + '-m.webp';
      timer = setTimeout(apply, 380);
    }
    var m = WA.map(host, { mode: 'explore', onSelect: function (k) { show(k); }, link: function (k) { return WA.link('destinations', ALIAS[k] || k); } });
    show('serengeti', true); m.setActive('serengeti');
  })();

  /* journal teaser */
  (function () {
    var el = $('#homeJournal'); if (!el || el.children.length || !window.WILDARA_JOURNAL) { if (el) WA.observe(el); return; }   // pre-rendered by the build
    el.innerHTML = window.WILDARA_JOURNAL.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3).map(function (p, i) {
      return WA.ccardHTML({ href: WA.link('journal', p.id), img: p.hero, pill: p.category, meta: WA.fmtDate(p.date) + ' · ' + p.readMins + ' min read', title: p.title, text: p.excerpt, cta: 'Read', d: i });
    }).join('');
    WA.observe(el);
  })();

  /* ======================================================================
     7. SEASONS
     ====================================================================== */
  var SEASONS = [
    { m: 'January', s: 'Jan', v: 4, mig: 1, title: 'Calving begins', region: 'Ndutu · Southern Serengeti', img: 'wildebeest-walk', theme: 'migration', tags: ['Calving season', 'Green landscapes', 'Predator action'], t: 'The herds settle on the southern short-grass plains around Ndutu. Thousands of calves are born, the land is green and lion, cheetah and hyena are never far away.' },
    { m: 'February', s: 'Feb', v: 5, mig: 1, title: 'Peak calving', region: 'Ndutu · Southern Serengeti', img: 'cheetahs-resting', theme: 'migration', tags: ['Peak calving', 'Big cats', 'Warm days'], t: 'The heart of calving season, when up to eight thousand calves can be born in a single day. Extraordinary predator sightings and wide-open skies.' },
    { m: 'March', s: 'Mar', v: 4, mig: 1, title: 'Herds in the south', region: 'Southern Serengeti', img: 'zebra-herd', theme: 'migration', tags: ['Young calves', 'Fewer vehicles', 'Lush plains'], t: 'Herds linger in the south with their young. Afternoon showers begin to build, the light is beautiful and the parks are quiet.' },
    { m: 'April', s: 'Apr', v: 2, mig: 0, title: 'The long rains', region: 'Northern circuit', img: 'lone-tree', theme: '', tags: ['Green season', 'Quiet parks', 'Photographer’s light'], t: 'Tanzania’s long rains. Dramatic skies, emerald landscapes and the parks almost to yourself. Ngorongoro and Tarangire remain excellent.' },
    { m: 'May', s: 'May', v: 3, mig: 0, title: 'The herds begin to move', region: 'Central & Western Serengeti', img: 'wildebeest-grass', theme: 'migration', tags: ['Rut season', 'Movement', 'Fresh grass'], t: 'As the rains ease, columns of wildebeest stream north and west through the central Serengeti. The wildebeest rut fills the plains with sound.' },
    { m: 'June', s: 'Jun', v: 4, mig: 1, title: 'Western corridor', region: 'Grumeti · Western Serengeti', img: 'elephant-mara', theme: 'migration', tags: ['Grumeti crossings', 'Dry season begins', 'Cool mornings'], t: 'The dry season arrives. Herds gather in the western corridor and brave the Grumeti River, while game everywhere concentrates around water.' },
    { m: 'July', s: 'Jul', v: 5, mig: 1, title: 'The first crossings', region: 'Northern Serengeti', img: 'migration-crossing', theme: 'migration', tags: ['Mara River crossings', 'Dry & clear', 'Peak season'], t: 'The herds reach the far north. The first dramatic Mara River crossings begin, and the whole northern circuit is at its golden best.' },
    { m: 'August', s: 'Aug', v: 5, mig: 1, title: 'The river crossings', region: 'Northern Serengeti', img: 'migration-watchers', theme: 'migration', tags: ['Peak crossings', 'Big Five', 'Book early'], t: 'Peak drama on the Mara River, with crossings almost daily. Superb game viewing across every park. The most sought-after month, so plan ahead.' },
    { m: 'September', s: 'Sep', v: 5, mig: 1, title: 'Golden plains', region: 'Northern Serengeti', img: 'lions-resting', theme: 'migration', tags: ['Mara crossings', 'Big cats', 'Golden light'], t: 'Crossings continue against golden grasslands. Predators are at their most visible and the weather is reliably dry and warm.' },
    { m: 'October', s: 'Oct', v: 4, mig: 1, title: 'The return begins', region: 'Northern & Central Serengeti', img: 'buffalo-birds', theme: 'migration', tags: ['Late crossings', 'Fewer crowds', 'Excellent value'], t: 'Final crossings in the north as the herds begin to turn south. A wonderful shoulder month with fewer vehicles and great sightings.' },
    { m: 'November', s: 'Nov', v: 3, mig: 0, title: 'The short rains', region: 'Central Serengeti', img: 'zebras-pair', theme: '', tags: ['Short rains', 'Herds heading south', 'Bush & beach'], t: 'Brief afternoon showers refresh the land as the migration flows south through the central Serengeti. A perfect time to add Zanzibar.' },
    { m: 'December', s: 'Dec', v: 4, mig: 1, title: 'Back to the south', region: 'Southern Serengeti · Zanzibar', img: 'zanzibar-pier', theme: 'zanzibar', tags: ['Festive journeys', 'Green season', 'Beach finale'], t: 'Herds return to the southern plains ahead of calving. Green, warm and festive, ideal for a family safari with a beach finale.' }
  ];
  (function () {
    var wrap = $('#months'); if (!wrap) return;
    wrap.innerHTML = SEASONS.map(function (s, i) {
      return '<button class="month' + (s.mig ? ' is-migr' : '') + '" role="tab" id="m-' + i + '" aria-controls="seasonPanel" aria-selected="false" tabindex="-1" style="--v:' + s.v + '"><span>' + s.s + '</span><span class="bar"></span><span class="sr-only">, ' + s.title + '</span></button>';
    }).join('');
    var tabs = $$('.month', wrap), imgEl = $('#seasonImg'), body = $('#seasonBody'), cur = -1, timer;
    function select(i, focus) {
      if (i === cur) return; cur = i; var s = SEASONS[i];
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(j === i)); t.tabIndex = j === i ? 0 : -1; });
      $('#seasonPanel').setAttribute('aria-labelledby', 'm-' + i);
      if (focus) tabs[i].focus();
      var apply = function () {
        $('#seasonMonth').textContent = s.m; $('#seasonTitle').textContent = s.title; $('#seasonText').textContent = s.t;
        $('#seasonRegion').textContent = s.region;
        $('#seasonTags').innerHTML = s.tags.map(function (t) { return '<span class="tag">' + t + '</span>'; }).join('');
        $('#seasonLink').href = WA.link('safaris', null, s.theme ? 'theme=' + s.theme : '');
        imgEl.src = WA.u('assets/img/') + s.img + '-m.webp'; imgEl.alt = s.title + ', ' + s.region;
        imgEl.classList.remove('is-out'); body.classList.remove('is-out');
      };
      if (reduce || !imgEl.getAttribute('data-init')) { imgEl.setAttribute('data-init', '1'); return apply(); }
      imgEl.classList.add('is-out'); body.classList.add('is-out');
      var pre = new Image(); pre.src = WA.u('assets/img/') + s.img + '-m.webp';
      clearTimeout(timer); timer = setTimeout(apply, 380);
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); select((i + 1) % 12, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); select((i + 11) % 12, true); }
      });
    });
    select(new Date().getMonth());
  })();
})();
