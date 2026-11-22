/* Wildara · boot (loaded synchronously in <head>, before first paint).
   Kept external so the Content-Security-Policy can forbid inline scripts. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  try {
    // page-transition curtain: arriving from an internal link
    if (sessionStorage.getItem('wa-nav') === '1') {
      sessionStorage.removeItem('wa-nav');
      if (!reduce) d.classList.add('is-entering');
    }
    // homepage intro: once per session, never with reduced motion, skippable via ?nointro
    if (document.querySelector('meta[name="wa-intro"]') && !reduce &&
        sessionStorage.getItem('wa-intro') !== '1' && !/[?&]nointro/.test(location.search)) {
      d.classList.add('intro-on');
    }
  } catch (e) { /* storage blocked: play nothing, show the page */ }
})();
