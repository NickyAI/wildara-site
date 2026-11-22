/* Wildara · legal pages: highlight the current section in the contents list */
(function () {
  var links = WA.$$('.toc a'), heads = links.map(function (a) { return WA.$(a.getAttribute('href')); });
  window.addEventListener('scroll', function () {
    var cur = 0; heads.forEach(function (h, i) { if (h && h.getBoundingClientRect().top < innerHeight * 0.3) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === cur); });
  }, { passive: true });
})();
