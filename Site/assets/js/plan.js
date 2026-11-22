/* Wildara · four-step safari enquiry */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc;
  var CFG = window.WILDARA_CONFIG || {};
  var form = $('#planForm'), steps = $$('.step', form), imgs = $$('[data-step-img]');
  var back = $('#backBtn'), next = $('#nextBtn'), cur = 0;
  var q = new URLSearchParams(location.search);
  var counts = { adults: 2, children: 0 };

  /* preselected safari from an itinerary page */
  var safari = (window.WILDARA_SAFARIS || []).filter(function (s) { return s.id === q.get('safari'); })[0];
  var NAMES = { serengeti: 'Serengeti National Park', mara: 'Northern Serengeti & the Mara River', ndutu: 'Ndutu & the southern plains', ngorongoro: 'Ngorongoro Crater', tarangire: 'Tarangire National Park', manyara: 'Lake Manyara', eyasi: 'Lake Eyasi', arusha: 'Arusha & Arusha National Park', zanzibar: 'Zanzibar',
    'great-migration': 'The Great Migration', 'big-five': 'Big Five & big cats', 'hot-air-balloon': 'Hot-air balloon safari', 'walking-safaris': 'Walking safaris', 'cultural-encounters': 'Cultural encounters', 'bush-dining': 'Bush dining & sundowners', 'family-safaris': 'Family safaris', honeymoons: 'Honeymoons & bush and beach', photography: 'Photography safaris' };
  var interest = NAMES[q.get('dest')] || NAMES[q.get('experience')] || '';
  function renderChosen() {
    var box = $('#chosenSafari');
    if (!safari && interest) {
      box.innerHTML = '<div class="selected-safari" style="padding:1rem 1.2rem"><div><small>You’re interested in</small><b>' + esc(interest) + '</b></div><button type="button" aria-label="Remove">✕</button></div>';
      $('button', box).addEventListener('click', function () { interest = ''; renderChosen(); });
      return;
    }
    if (!safari) { box.innerHTML = ''; return; }
    box.innerHTML = '<div class="selected-safari"><img src="assets/img/' + safari.images[0] + '-s.webp" alt=""><div><small>Enquiring about</small><b>' + esc(safari.title) + '</b><small style="letter-spacing:.1em">' + safari.days + ' days · from ' + WA.money(safari.from) + ' pp</small></div><button type="button" aria-label="Remove selected safari">✕</button></div>';
    $('button', box).addEventListener('click', function () { safari = null; renderChosen(); });
  }
  renderChosen();
  if (safari) { $('#days').value = safari.days; }
  var tq = parseInt(q.get('travellers'), 10); if (tq > 0) counts.adults = Math.min(tq, 12);

  /* months + years */
  var MONTHS = ['Flexible', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  $('#monthPills').innerHTML = MONTHS.map(function (m, i) { return '<label><input type="radio" name="month" value="' + m + '"' + (i === 0 ? ' checked' : '') + '><span>' + m + '</span></label>'; }).join('');
  var y = new Date().getFullYear();
  $('#yearPills').innerHTML = [y, y + 1, y + 2].map(function (yr, i) { return '<label><input type="radio" name="year" value="' + yr + '"' + (i === (new Date().getMonth() > 8 ? 1 : 0) ? ' checked' : '') + '><span>' + yr + '</span></label>'; }).join('');

  /* duration slider */
  var range = $('#days'), out = $('#daysOut');
  function rangeUpd() { var v = +range.value; out.textContent = v + ' days'; range.style.setProperty('--rv', ((v - range.min) / (range.max - range.min) * 100) + '%'); }
  range.addEventListener('input', rangeUpd); rangeUpd();

  /* counters */
  function countUpd() {
    $('#adults').textContent = counts.adults; $('#children').textContent = counts.children;
    $$('[data-counter]').forEach(function (b) {
      var k = b.dataset.counter, d = +b.dataset.d;
      b.disabled = d < 0 ? counts[k] <= (k === 'adults' ? 1 : 0) : counts[k] >= 12;
    });
  }
  $$('[data-counter]').forEach(function (b) { b.addEventListener('click', function () { counts[b.dataset.counter] += +b.dataset.d; countUpd(); }); });
  countUpd();

  /* step navigation */
  function go(i) {
    cur = i;
    steps.forEach(function (s, j) { s.classList.toggle('is-active', j === i); });
    imgs.forEach(function (im) { im.classList.toggle('is-out', +im.dataset.stepImg !== i); });
    $('#stepLbl').textContent = 'Step ' + (i + 1) + ' of 4';
    $('#stepBar').style.setProperty('--pp', ((i + 1) / 4 * 100) + '%');
    back.hidden = i === 0;
    next.firstChild.textContent = i === 3 ? 'Send my enquiry ' : 'Continue ';
    var h = $('h2', steps[i]); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true });
    if (innerWidth < 1100) $('.plan__main').scrollIntoView({ behavior: WA.reduce.matches ? 'auto' : 'smooth' });
    else window.scrollTo({ top: 0, behavior: WA.reduce.matches ? 'auto' : 'smooth' });
  }
  back.addEventListener('click', function () { if (cur > 0) go(cur - 1); });

  function validate() {
    var ok = true, firstBad = null;
    [['fname', function (v) { return v.trim().length > 0; }], ['email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }]].forEach(function (r) {
      var el = $('#' + r[0]), good = r[1](el.value);
      el.closest('.field').classList.toggle('is-invalid', !good); el.setAttribute('aria-invalid', String(!good));
      if (!good) { ok = false; firstBad = firstBad || el; }
    });
    var c = $('#consent'); $('#consentErr').style.display = c.checked ? 'none' : 'block';
    if (!c.checked) { ok = false; firstBad = firstBad || c; }
    if (firstBad) firstBad.focus();
    return ok;
  }
  $$('#fname, #email').forEach(function (el) { el.addEventListener('input', function () { el.closest('.field').classList.remove('is-invalid'); }); });

  function collect() {
    var fd = new FormData(form);
    return {
      safari: safari ? safari.title + ' (' + safari.days + ' days)' : (interest ? 'Interested in ' + interest : ''),
      interests: fd.getAll('interests'),
      month: fd.get('month'), year: fd.get('year'), days: fd.get('days'),
      adults: counts.adults, children: counts.children,
      style: fd.get('style'), budget: fd.get('budget'),
      name: (fd.get('fname') + ' ' + fd.get('lname')).trim(), email: fd.get('email'), phone: fd.get('phone'),
      country: fd.get('country'), hear: fd.get('hear'), message: fd.get('message'),
      submittedAt: new Date().toISOString()
    };
  }

  function showThanks(d) {
    form.hidden = true; $('.progress').style.visibility = 'hidden';
    var rows = [
      ['Journey', d.safari || 'Tailor-made'], ['Interests', d.interests.join(', ') || 'Open to ideas'],
      ['When', d.month === 'Flexible' ? 'Flexible, ' + d.year : d.month + ' ' + d.year], ['Length', d.days + ' days'],
      ['Travellers', d.adults + ' adult' + (d.adults > 1 ? 's' : '') + (d.children ? ', ' + d.children + ' child' + (d.children > 1 ? 'ren' : '') : '')], ['Style', d.style]
    ];
    $('#summary').innerHTML = rows.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('');
    $('#thanksMsg').textContent = 'Thank you, ' + d.name.split(' ')[0] + '. Your enquiry is with our team in Arusha, and we’ll be in touch at ' + d.email + ' within one working day.';
    var t = $('#thanks'); t.classList.add('is-active'); t.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function mailtoFallback(d) {
    if (!CFG.email) return;
    var body = Object.keys(d).map(function (k) { return k + ': ' + (Array.isArray(d[k]) ? d[k].join(', ') : d[k]); }).join('\n');
    var a = document.createElement('a');
    a.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Safari enquiry from ' + d.name) + '&body=' + encodeURIComponent(body);
    a.className = 'link-u'; a.style.cssText = 'position:relative;display:inline-flex;margin-top:1.4rem'; a.textContent = 'Or send it by email';
    $('#thanks .summary').insertAdjacentElement('afterend', a);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (cur < 3) { go(cur + 1); return; }
    if (!validate()) return;
    var data = collect();
    next.disabled = true;
    var done = function () { next.disabled = false; showThanks(data); };
    if (CFG.formEndpoint) {
      fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () { next.disabled = false; WA.toast('We couldn’t send that just now. Please try again in a moment.'); });
    } else {
      // No endpoint configured yet: confirm on screen and offer an email fallback.
      done(); mailtoFallback(data);
    }
  });
})();
