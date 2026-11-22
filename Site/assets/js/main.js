/* ==========================================================================
   Wildara Africa Safaris · shared interactions
   ========================================================================== */

/* ---- Site configuration: fill these in before launch ---- */
window.WILDARA_CONFIG = {
  email: '',          // e.g. 'hello@your-domain.com'  (shown in footer + used as enquiry fallback)
  phone: '',          // e.g. '+255 7xx xxx xxx'
  whatsapp: '',       // digits only, e.g. '2557xxxxxxxx'
  formEndpoint: ''    // optional: URL that accepts POSTed JSON enquiries (Formspree, Netlify, your CRM...)
};

(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var CFG = window.WILDARA_CONFIG;
  var IMG_W = { 'giraffe-pair': 1818 };
  // intrinsic height at 1280px width (prevents layout shift) and descriptive alt text, per photo
  var IMG_H = {"giraffe-pair":1600,"binocular-girls":853,"sunset-acacia":720,"elephant-mara":853,"migration-crossing":1220,"wildebeest-walk":853,"buffalo-serengeti":853,"buffalo-birds":853,"cheetah-mound":854,"cheetahs-resting":853,"child-binoculars":853,"sundowner-couple":852,"elephant-vehicle":853,"elephants-pair":850,"giraffes-tall":1917,"lone-acacia-herd":720,"elephant-herd":853,"zebra-herd":853,"lion-lioness":853,"lioness-grass":852,"lions-resting":854,"lone-tree":852,"ostrich-tree":1920,"silhouette-vehicle":918,"sunset-tree":854,"boy-vehicle":853,"zanzibar-dhow":845,"migration-watchers":851,"zanzibar-pier":960,"zanzibar-turquoise":720,"zanzibar-aerial":977,"zebras-mist":1280,"wildebeest-grass":853,"zebras-pair":854};
  var IMG_ALT = {"giraffe-pair":"Two giraffes browsing among acacia bushes under a blue sky","binocular-girls":"Two travellers scanning the plains through binoculars from a safari vehicle","sunset-acacia":"A lone acacia silhouetted against a deep orange sunset","elephant-mara":"An elephant and her calf walking through golden grass","migration-crossing":"Wildebeest leaping into a river during the Great Migration crossing","wildebeest-walk":"Blue wildebeest walking across dusty plains in warm light","buffalo-serengeti":"A Cape buffalo standing in tall grass on the Serengeti","buffalo-birds":"A Cape buffalo with oxpeckers in a golden field","cheetah-mound":"A cheetah surveying the Serengeti from a termite mound","cheetahs-resting":"Two cheetahs resting on a mound in the savannah","child-binoculars":"A young traveller looking through binoculars across the plains","sundowner-couple":"A couple raising a sundowner toast on a lodge terrace at sunset","elephant-vehicle":"Guests in an open safari vehicle watching an elephant nearby","elephants-pair":"Two elephants standing together on open grassland","giraffes-tall":"Two giraffes standing close together in tall golden grass","lone-acacia-herd":"Buffalo grazing beneath a lone acacia tree on the Serengeti plains","elephant-herd":"A herd of elephants walking beneath acacia trees in Tarangire","zebra-herd":"A herd of zebras standing in dry golden grass","lion-lioness":"A lion and lioness walking side by side through tall grass","lioness-grass":"A lioness moving through long golden grass","lions-resting":"A lion and lioness resting together on a grassy rise","lone-tree":"A solitary acacia tree in golden grassland under a blue sky","ostrich-tree":"An ostrich in tall grass with a lone tree behind it","silhouette-vehicle":"A traveller standing on a safari vehicle beneath an acacia at golden sunset","sunset-tree":"An acacia silhouetted against a blazing African sunset","boy-vehicle":"A smiling young boy in a safari vehicle beside his guide","zanzibar-dhow":"A traveller watching traditional dhows on Zanzibar's turquoise water","migration-watchers":"Travellers on a safari vehicle watching the wildebeest migration","zanzibar-pier":"A wooden pier with a thatched gazebo over Zanzibar's clear water","zanzibar-turquoise":"Turquoise water and boats along a white-sand Zanzibar beach","zanzibar-aerial":"Aerial view of Zanzibar's turquoise shallows and traditional boats","zebras-mist":"Two zebras standing close together in soft morning light","wildebeest-grass":"Two wildebeest in pale grass with the migration herd behind","zebras-pair":"Two zebras nuzzling on the open plains"};
  /* Every page declares how deep it sits (meta wa-root, e.g. '../../'), so links and assets
     resolve correctly from /, /safaris/ and /safaris/<id>/ alike. */
  var ROOT = (document.querySelector('meta[name="wa-root"]') || {}).content || '';
  function u(path) { return ROOT + path; }
  function link(section, id, query) {
    if (section === 'home') return (ROOT || './') + (query ? '#' + query : '');
    return ROOT + section + '/' + (id ? encodeURIComponent(id) + '/' : '') + (query ? '?' + query : '');
  }

  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  function img(name, sizes, alt, extra) {
    var l = IMG_W[name] || 2400;
    var b = ROOT + 'assets/img/' + name;
    return '<img src="' + b + '-m.webp" srcset="' + b + '-s.webp 640w, ' + b + '-t.webp 960w, ' + b + '-m.webp 1280w, ' + b + '-l.webp ' + l + 'w" sizes="' + (sizes || '100vw') + '" alt="' + esc(alt || '') + '" width="1280" height="' + (IMG_H[name] || 853) + '"' + (extra && /loading=/.test(extra) ? '' : (extra && /fetchpriority/.test(extra) ? ' loading="eager"' : ' loading="lazy"')) + ' decoding="async"' + (extra ? ' ' + extra : '') + '>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function money(n) { return '$' + Number(n).toLocaleString('en-US'); }

  var THEME_LABEL = { migration: 'Great Migration', zanzibar: 'Bush & Beach', culture: 'Culture', bigfive: 'Big Five' };
  function cardHTML(s, sizes) {
    var tag = s.themes.length ? THEME_LABEL[s.themes[0]] : (s.tier !== 'Classic' ? s.tier : 'Private safari');
    return '<a class="scard" href="' + link('safaris', s.id) + '" data-cursor="Discover" data-id="' + esc(s.id) + '">' +
      img(s.images[0], sizes || '(max-width: 760px) 90vw, 440px', '') +
      '<div class="scard__top"><span class="pill">' + s.days + ' days</span><span class="pill">' + esc(tag) + '</span></div>' +
      '<div class="scard__panel glass"><h3>' + esc(s.title) + '</h3><p class="scard__dest">' + esc(s.destinations) + '</p>' +
      '<div class="scard__foot"><div class="scard__price"><small>From</small><b>' + (s.from ? money(s.from) : 'On request') + '</b> <i>pp</i></div><span class="jcard__go">' + ARROW + '</span></div></div></a>';
  }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $('.toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-in');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('is-in'); }, 4200);
  }

  /* ---------- Split text into masked words ---------- */
  function splitText(el) {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'split-word';
            var inner = document.createElement('span'); inner.style.setProperty('--i', i++); inner.textContent = part;
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') { walk(n); }
      });
    })(el);
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  }

  /* ---------- Reveal on scroll ---------- */
  // Elements fully clipped (clip-path: inset(100%)) never "intersect", so image reveals are
  // observed through their parent and the class is applied to the proxied children.
  var proxies = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      var kids = proxies && proxies.get(e.target);
      if (kids) { kids.forEach(function (k) { k.classList.add('is-in'); }); proxies.delete(e.target); }
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -4% 0px', threshold: 0.02 }) : null;
  function observe(root) {
    $$('[data-split]', root).forEach(splitText);
    $$('[data-reveal], [data-reveal-img], [data-split], .tday', root).forEach(function (el) {
      if (el.classList.contains('is-in')) return;
      if (!io || mqReduce.matches) { el.classList.add('is-in'); return; }
      if (el.hasAttribute('data-reveal-img') && proxies) {
        var parent = el.parentNode, list = proxies.get(parent) || [];
        if (list.indexOf(el) < 0) list.push(el);
        proxies.set(parent, list); io.observe(parent);
      } else io.observe(el);
    });
  }

  /* ---------- Navigation ---------- */
  function initNav() {
    var nav = $('#nav'); if (!nav) return;
    var isStatic = nav.classList.contains('is-static');
    var lastY = window.scrollY, ticking = false;
    function update() {
      var y = window.scrollY;
      if (!isStatic) nav.classList.toggle('is-scrolled', y > 60);
      var open = document.documentElement.classList.contains('menu-open');
      if (!open && y > 500 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 500) nav.classList.remove('is-hidden');
      lastY = y; ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();

    // full-screen menu
    var toggle = $('.nav__toggle'), menu = $('#menu'), visual = $('.menu__visual', menu);
    if (!toggle || !menu) return;
    var built = false;
    function build() {
      if (built) return; built = true;
      $$('.menu__list a', menu).forEach(function (a, idx) {
        var wrap = document.createElement('div'); wrap.innerHTML = img(a.dataset.img, '50vw', '');
        var im = wrap.firstChild; if (idx === 0) im.classList.add('is-active');
        im.dataset.key = a.dataset.img; visual.appendChild(im);
        a.addEventListener('mouseenter', function () { $$('img', visual).forEach(function (x) { x.classList.toggle('is-active', x.dataset.key === a.dataset.img); }); });
      });
    }
    function setOpen(open) {
      build();
      document.documentElement.classList.toggle('menu-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      menu.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
      nav.classList.remove('is-hidden');
      nav.dataset.wasLight = nav.dataset.wasLight || String(nav.classList.contains('is-light'));
      if (open) { nav.classList.remove('is-light'); setTimeout(function () { var f = $('.menu__list a', menu); f && f.focus(); }, 300); }
      else { if (nav.dataset.wasLight === 'true') nav.classList.add('is-light'); delete nav.dataset.wasLight; toggle.focus(); }
    }
    toggle.addEventListener('click', function () { setOpen(!document.documentElement.classList.contains('menu-open')); });
    $$('.menu__list a', menu).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').indexOf('#') > -1) setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && document.documentElement.classList.contains('menu-open')) setOpen(false); });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    var c = $('.cursor'); if (!c || !finePointer || mqReduce.matches) return;
    var ring = $('.cursor__ring', c), dot = $('.cursor__dot', c), label = $('.cursor__label', c);
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
    var DARK = '.on-dark, .hero, .film__frame, .featured, .cta, .page-hero, .approach, .menu, .plan__side, .dest-card, .lightbox, .scard, .jcard';
    window.addEventListener('mousemove', function (e) { x = e.clientX; y = e.clientY; c.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('mouseleave', function () { c.classList.add('is-hidden'); });
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      var lab = t.closest('[data-cursor]');
      var link = t.closest('a, button, select, label, [role="button"], input[type="range"]');
      c.classList.toggle('is-label', !!lab);
      label.textContent = lab ? lab.dataset.cursor : '';
      c.classList.toggle('is-link', !lab && !!link);
      c.classList.toggle('on-dark-area', !!t.closest(DARK));
    });
    (function loop() {
      rx = lerp(rx, x, 0.18); ry = lerp(ry, y, 0.18);
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px)';
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!finePointer || mqReduce.matches) return;
    document.addEventListener('mousemove', function (e) {
      var el = e.target.closest && e.target.closest('.btn, .round-btn, .film__toggle, .nav__toggle');
      $$('.is-magnet').forEach(function (m) { if (m !== el) { m.style.transform = ''; m.classList.remove('is-magnet'); } });
      if (!el) return;
      var r = el.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) * 0.22, dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
      el.classList.add('is-magnet'); el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }, { passive: true });
  }

  /* ---------- Page transitions: a curved curtain of Wood Bark ---------- */
  function initCurtain() {
    var curtain = $('.curtain'); if (!curtain) return;
    var html = document.documentElement;
    if (html.classList.contains('is-entering')) {
      requestAnimationFrame(function () { requestAnimationFrame(function () {
        curtain.classList.add('is-entered');
        setTimeout(function () { html.classList.remove('is-entering'); curtain.classList.remove('is-entered'); }, 950);
      }); });
    }
    document.addEventListener('click', function (e) {
      if (mqReduce.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href]'); if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url = new URL(a.href, location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash link
      if (!/\.html$|\/$/.test(url.pathname)) return;
      e.preventDefault();
      try { sessionStorage.setItem('wa-nav', '1'); } catch (err) {}
      curtain.classList.add('is-leaving');
      setTimeout(function () { location.href = url.href; }, 720);
    });
    window.addEventListener('pageshow', function (e) { if (e.persisted) { curtain.classList.remove('is-leaving'); html.classList.remove('is-entering'); } });
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    var els = $$('[data-parallax]'); if (!els.length || mqReduce.matches) return;
    var hero = $('.page-hero__bg img, .hero__media video');
    function tick() {
      var vh = innerHeight;
      els.forEach(function (el) {
        var r = el.parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        el.style.setProperty('--py', (p * -12) + '%');
        var im = el.querySelector('img'); if (im) im.style.transform = 'translateY(' + (p * -10) + '%)';
      });
      if (hero) { var y = Math.min(scrollY, innerHeight); hero.style.setProperty('--hs', 1.06 + y / innerHeight * 0.08); }
    }
    window.addEventListener('scroll', function () { requestAnimationFrame(tick); }, { passive: true });
    tick();
  }

  /* ---------- Count-up numbers ---------- */
  function initCounters() {
    $$('[data-count]').forEach(function (el) {
      var to = +el.dataset.count; if (mqReduce.matches || !io) return;
      el.textContent = '0';
      var o = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return; o.disconnect();
        var t0 = performance.now();
        (function step(t) { var p = clamp((t - t0) / 1600, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: 0.6 });
      o.observe(el);
    });
  }

  /* ---------- Lightbox ---------- */
  function initLightbox() {
    var lb = $('#lightbox'); if (!lb) return;
    var lbImg = $('img', lb), cap = $('.lightbox__cap', lb), last;
    function open(fig) {
      var im = $('img', fig); last = fig;
      lbImg.src = im.currentSrc.replace(/-(s|m)\.webp$/, '-l.webp'); lbImg.alt = im.alt;
      cap.textContent = ($('figcaption', fig) || {}).textContent || '';
      lb.classList.add('is-open'); $('.lightbox__close', lb).focus();
    }
    function close() { lb.classList.remove('is-open'); if (last) last.focus(); }
    $$('.gallery__item').forEach(function (f) {
      f.addEventListener('click', function () { open(f); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(f); } });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.closest('.lightbox__close')) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && lb.classList.contains('is-open')) close(); });
  }

  /* ---------- Footer: contact config, year, newsletter ---------- */
  function initFooter() {
    $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
    var map = { email: CFG.email && ['mailto:' + CFG.email, CFG.email], phone: CFG.phone && ['tel:' + CFG.phone.replace(/\s/g, ''), CFG.phone], whatsapp: CFG.whatsapp && ['https://wa.me/' + CFG.whatsapp, 'WhatsApp'] };
    $$('[data-contact]').forEach(function (li) {
      var v = map[li.dataset.contact]; if (!v) return;
      var a = $('a', li); a.href = v[0]; a.textContent = v[1]; li.hidden = false;
    });
    $$('[data-newsletter]').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); f.reset(); toast('Thank you. Stories from the field will find you soon.'); });
    });
  }

  /* ---------- Generic horizontal track (drag, buttons, progress) ---------- */
  function initTrack(track, prev, next, bar) {
    if (!track) return;
    var down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return; var dx = e.clientX - sx; moved = Math.abs(dx);
      if (moved > 5) track.classList.add('is-dragging');
      track.scrollLeft = sl - dx;
    });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { track.classList.remove('is-dragging'); }, 0); });
    track.addEventListener('click', function (e) { if (moved > 5) { e.preventDefault(); moved = 0; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });
    function step(dir) { var card = track.firstElementChild; var w = card ? card.getBoundingClientRect().width + 24 : 400; track.scrollBy({ left: dir * w, behavior: mqReduce.matches ? 'auto' : 'smooth' }); }
    prev && prev.addEventListener('click', function () { step(-1); });
    next && next.addEventListener('click', function () { step(1); });
    function prog() {
      if (!bar) return; var max = track.scrollWidth - track.clientWidth;
      var ratio = track.clientWidth / track.scrollWidth; var pw = bar.parentNode.clientWidth;
      bar.style.width = (ratio * 100) + '%';
      bar.style.setProperty('--tp', ((max > 0 ? track.scrollLeft / max : 0) * pw * (1 - ratio)) + 'px');
    }
    track.addEventListener('scroll', function () { requestAnimationFrame(prog); }, { passive: true });
    window.addEventListener('resize', prog); prog();
  }

  /* ---------- FAQ accordion + FAQPage structured data ---------- */
  function faqHTML(faqs) {
    return '<div class="faq">' + faqs.map(function (f, i) {
      return '<details' + (i === 0 ? ' open' : '') + '><summary>' + esc(f.q) + '</summary><div class="faq__a"><p>' + esc(f.a) + '</p></div></details>';
    }).join('') + '</div>';
  }
  function faqSchema(faqs) {
    if (document.querySelector('script[type="application/ld+json"][data-faq]')) return;
    var s = document.createElement('script'); s.type = 'application/ld+json';
    s.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(function (f) { return { '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }; }) });
    document.head.appendChild(s);
  }

  /* ---------- Uniform gallery slider (with lightbox) ---------- */
  function sliderHTML(images, caption) {
    return '<div class="slider"><div class="slider__track">' + images.map(function (n, i) {
      return '<figure class="slide" tabindex="0" data-cursor="View" data-full="' + ROOT + 'assets/img/' + n + '-l.webp">' + img(n, '(max-width: 760px) 82vw, 460px', IMG_ALT[n] || caption || '') + '</figure>';
    }).join('') + '</div><div class="slider__bar"><span class="slider__count"><span data-cur>01</span> / ' + ('0' + images.length).slice(-2) + '</span>' +
      '<div class="slider__btns"><button class="round-btn dark" type="button" data-prev aria-label="Previous photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></button>' +
      '<button class="round-btn dark" type="button" data-next aria-label="Next photo"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></div></div></div>';
  }
  function initSlider(root) {
    var track = $('.slider__track', root); if (!track) return;
    initTrack(track, $('[data-prev]', root), $('[data-next]', root), null);
    var cur = $('[data-cur]', root);
    track.addEventListener('scroll', function () {
      var w = track.firstElementChild.getBoundingClientRect().width + 16;
      cur.textContent = ('0' + (Math.round(track.scrollLeft / w) + 1)).slice(-2);
    }, { passive: true });
    var lb = $('#lightbox');
    $$('.slide', track).forEach(function (f) {
      function open() {
        if (!lb || track.classList.contains('is-dragging')) return;
        var im = $('img', lb); im.src = f.dataset.full; im.alt = $('img', f).alt; $('.lightbox__cap', lb).textContent = '';
        lb.classList.add('is-open'); $('.lightbox__close', lb).focus();
      }
      f.addEventListener('click', open);
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(); });
    });
  }

  /* ---------- Content cards ---------- */
  function ccardHTML(o) {
    return '<a class="ccard' + (o.cls ? ' ' + o.cls : '') + '" href="' + o.href + '" data-reveal' + (o.d != null ? ' style="--d:' + o.d + '"' : '') + '>' +
      '<div class="ccard__img">' + img(o.img, o.sizes || '(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 31vw', '') + (o.pill ? '<span class="pill">' + esc(o.pill) + '</span>' : '') + '</div>' +
      '<div class="ccard__body"><span class="ccard__meta">' + esc(o.meta || '') + '</span><h3>' + esc(o.title) + '</h3><p>' + esc(o.text || '') + '</p>' +
      '<span class="link-u">' + esc(o.cta || 'Discover') + ' ' + ARROW + '</span></div></a>';
  }
  function fmtDate(iso) { var d = new Date(iso + 'T12:00:00'); return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); }

  /* ---------- Active navigation item ---------- */
  function markNav() {
    var key = (document.querySelector('meta[name="wa-nav"]') || {}).content; if (!key) return;
    $$('[data-nav="' + key + '"]').forEach(function (a) { a.setAttribute('aria-current', 'page'); });
  }

  /* ---------- Boot ---------- */
  window.WA = { IMG_ALT: IMG_ALT, root: ROOT, u: u, link: link, $: $, $$: $$, img: img, esc: esc, money: money, cardHTML: cardHTML, ccardHTML: ccardHTML, toast: toast, observe: observe, splitText: splitText, initTrack: initTrack, initSlider: initSlider, sliderHTML: sliderHTML, faqHTML: faqHTML, faqSchema: faqSchema, fmtDate: fmtDate, clamp: clamp, lerp: lerp, reduce: mqReduce, ARROW: ARROW, THEME_LABEL: THEME_LABEL };

  function boot() {
    markNav(); initNav(); initCursor(); initMagnetic(); initCurtain(); initParallax(); initCounters(); initLightbox(); initFooter();
    observe(document);
    document.dispatchEvent(new CustomEvent('wa:ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
