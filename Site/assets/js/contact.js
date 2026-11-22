/* Wildara · contact page */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$, CFG = window.WILDARA_CONFIG || {};
  var vals = {
    whatsapp: CFG.whatsapp && ['https://wa.me/' + CFG.whatsapp, ''],
    email: CFG.email && ['mailto:' + CFG.email, CFG.email],
    phone: CFG.phone && ['tel:' + CFG.phone.replace(/\s/g, ''), CFG.phone]
  };
  $$('[data-contact-card]').forEach(function (c) {
    var v = vals[c.dataset.contactCard]; if (!v) return;
    c.href = v[0]; var b = $('[data-v]', c); if (b) b.textContent = v[1]; c.hidden = false;
  });

  var form = $('#contactForm'); if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true, first = null;
    [['cName', function (v) { return v.trim(); }], ['cEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }], ['cMsg', function (v) { return v.trim().length > 1; }]].forEach(function (r) {
      var el = $('#' + r[0]), good = !!r[1](el.value);
      el.closest('.field').classList.toggle('is-invalid', !good); el.setAttribute('aria-invalid', String(!good));
      if (!good) { ok = false; first = first || el; }
    });
    var c = $('#cConsent'); $('#cConsentErr').style.display = c.checked ? 'none' : 'block';
    if (!c.checked) { ok = false; first = first || c; }
    if (!ok) { first.focus(); return; }
    var data = { type: 'contact', name: $('#cName').value, email: $('#cEmail').value, phone: $('#cPhone').value, topic: $('#cTopic').value, message: $('#cMsg').value, submittedAt: new Date().toISOString() };
    function done() {
      form.hidden = true; var t = $('#cThanks'); t.classList.add('is-active');
      $('#cThanksMsg').textContent = 'Thank you, ' + data.name.split(' ')[0] + '. We will reply to ' + data.email + ' within one working day.';
      t.focus();
    }
    if (CFG.formEndpoint) {
      fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
        .catch(function () { WA.toast('We couldn’t send that just now. Please try again in a moment.'); });
    } else done();
  });
  $$('#cName, #cEmail, #cMsg').forEach(function (el) { el.addEventListener('input', function () { el.closest('.field').classList.remove('is-invalid'); }); });
})();
