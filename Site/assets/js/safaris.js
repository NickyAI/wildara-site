/* Wildara · safari listing with filters synced to the URL */
(function () {
  'use strict';
  var WA = window.WA, $ = WA.$, $$ = WA.$$;
  var DATA = window.WILDARA_SAFARIS || [];
  var grid = $('#grid'), count = $('#resultCount');
  var q = new URLSearchParams(location.search);
  var state = { theme: q.get('theme') || '', dest: q.get('dest') || '', dur: q.get('dur') || '', sort: q.get('sort') || 'days' };

  var DUR = { short: [1, 4], mid: [5, 7], long: [8, 99] };
  function matches(s) {
    if (state.theme && s.themes.indexOf(state.theme) < 0) return false;
    if (state.dest) {
      var hay = (s.destinations + ' ' + s.title).toLowerCase();
      if (state.dest === 'arusha' ? hay.indexOf('arusha') < 0 : hay.indexOf(state.dest) < 0) return false;
    }
    if (state.dur) { var r = DUR[state.dur]; if (s.days < r[0] || s.days > r[1]) return false; }
    return true;
  }
  var SORT = {
    days: function (a, b) { return a.days - b.days || a.from - b.from; },
    'days-desc': function (a, b) { return b.days - a.days || b.from - a.from; },
    price: function (a, b) { return a.from - b.from; },
    'price-desc': function (a, b) { return b.from - a.from; }
  };

  function sync() {
    $$('#themeChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.theme === state.theme)); });
    $('#fDest').value = state.dest; $('#fDur').value = state.dur; $('#fSort').value = state.sort;
    var p = new URLSearchParams(); Object.keys(state).forEach(function (k) { if (state[k] && !(k === 'sort' && state[k] === 'days')) p.set(k, state[k]); });
    history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p : ''));
  }

  var first = true;
  function render() {
    sync();
    var list = DATA.filter(matches).sort(SORT[state.sort] || SORT.days);
    count.textContent = list.length + (list.length === 1 ? ' journey' : ' journeys') + ' found';
    var draw = function () {
      grid.innerHTML = list.length ? list.map(function (s, i) {
        return WA.cardHTML(s, i % 6 === 0 ? '(max-width: 760px) 92vw, 66vw' : '(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 31vw');
      }).join('') : '<div class="empty"><h3>Nothing on this trail, yet.</h3><p>Try widening your filters, or <a class="amber" href="plan.html" style="text-decoration:underline">ask us to design one</a>.</p></div>';
      $$('.scard', grid).forEach(function (c, i) { c.setAttribute('data-reveal', ''); c.style.setProperty('--d', i % 3); });
      WA.observe(grid);
    };
    if (first || WA.reduce.matches) { first = false; draw(); return; }
    $$('.scard', grid).forEach(function (c) { c.classList.add('is-hiding'); });
    setTimeout(draw, 260);
  }

  $$('#themeChips .chip').forEach(function (c) { c.addEventListener('click', function () { state.theme = c.dataset.theme; render(); }); });
  $('#fDest').addEventListener('change', function (e) { state.dest = e.target.value; render(); });
  $('#fDur').addEventListener('change', function (e) { state.dur = e.target.value; render(); });
  $('#fSort').addEventListener('change', function (e) { state.sort = e.target.value; render(); });
  render();
})();
