"""Expands the small authoring macros in src/*.html into plain, dependency-free HTML in Site/."""
import json, re, glob, os, sys

SITE = "/Users/nicky/Documents/Wildara/Site"
SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
META = json.load(open(f"{SITE}/assets/data/img-meta.json"))

ARROW = '<svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'


def img(name, sizes="100vw", alt="", attrs=""):
    w, h = META[name]
    lw = min(w, 2400)
    mh = round(h * 1280 / w)
    srcset = f"assets/img/{name}-s.webp 640w, assets/img/{name}-m.webp 1280w, assets/img/{name}-l.webp {lw}w"
    a = f' alt="{alt}"' if alt else ' alt=""'
    return (f'<img src="assets/img/{name}-m.webp" srcset="{srcset}" sizes="{sizes}"{a} '
            f'width="1280" height="{mh}" loading="lazy" decoding="async"{(" " + attrs) if attrs else ""}>')


def head(title, desc):
    return f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="theme-color" content="#1C0F07">
<meta property="og:type" content="website">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="assets/img/lone-acacia-herd-l.webp">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="assets/brand/favicon.png">
<link rel="apple-touch-icon" href="assets/brand/favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/css/main.css">
<script>
  (function () {{
    var d = document.documentElement; d.classList.add('js');
    try {{ if (sessionStorage.getItem('wa-nav') === '1') {{ sessionStorage.removeItem('wa-nav');
      if (!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) d.classList.add('is-entering'); }} }} catch (e) {{}}
  }})();
</script>'''


def nav(mode):
    light = mode.startswith("light")
    cls = "nav" + (" is-light" if light else "") + (" is-scrolled is-static" if mode == "light-static" else "")
    return f'''<header class="{cls}" id="nav" data-mode="{"light" if light else "dark"}">
  <div class="wrap">
    <div class="nav__bar">
      <a class="nav__logo" href="index.html" aria-label="Wildara Africa Safaris, home">
        <img class="logo-white" src="assets/brand/WA-logo-white.webp" alt="" width="836" height="296">
        <img class="logo-dark" src="assets/brand/WA-logo-main.webp" alt="" width="837" height="296">
        <img class="logo-icon logo-icon-amber" src="assets/brand/w-icon-1000.webp" alt="" width="1000" height="619">
        <img class="logo-icon logo-icon-light" src="assets/brand/w-icon-almond.webp" alt="" width="1000" height="619">
      </a>
      <nav class="nav__links" aria-label="Primary">
        <a href="index.html" data-nav="home">Home</a>
        <a href="safaris.html" data-nav="safaris">Safaris</a>
        <a href="destinations.html" data-nav="destinations">Destinations</a>
        <a href="experiences.html" data-nav="experiences">Experiences</a>
        <a href="story.html" data-nav="story">Our Story</a>
        <a href="journal.html" data-nav="journal">Safari Journal</a>
        <a href="contact.html" data-nav="contact">Contact</a>
        <a class="btn btn--light nav__cta" href="plan.html">Plan my safari</a>
        <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="menu" aria-label="Open menu"><span></span><span></span></button>
      </nav>
    </div>
  </div>
</header>
<div class="menu" id="menu" aria-hidden="true">
  <ul class="menu__list">
    <li><a href="index.html" data-img="giraffe-pair"><small>01</small>Home</a></li>
    <li><a href="safaris.html" data-img="lion-lioness"><small>02</small>Safaris</a></li>
    <li><a href="destinations.html" data-img="cheetah-mound"><small>03</small>Destinations</a></li>
    <li><a href="experiences.html" data-img="sundowner-couple"><small>04</small>Experiences</a></li>
    <li><a href="story.html" data-img="silhouette-vehicle"><small>05</small>Our Story</a></li>
    <li><a href="journal.html" data-img="binocular-girls"><small>06</small>Safari Journal</a></li>
    <li><a href="contact.html" data-img="zebras-mist"><small>07</small>Contact</a></li>
  </ul>
  <div class="menu__visual" aria-hidden="true"></div>
  <p class="menu__foot">Wildara Africa Safaris · Arusha, Tanzania</p>
</div>'''


FOOTER = f'''<footer class="footer on-dark">
  <div class="pattern-bg" aria-hidden="true"></div>
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img class="footer__logo" src="assets/brand/WA-logo-white.webp" alt="Wildara Africa Safaris" width="836" height="296" loading="lazy">
        <p>Private safaris across northern Tanzania, designed around curiosity, care and the quiet thrill of discovery.</p>
        <form class="footer__news" data-newsletter aria-label="Newsletter">
          <label class="sr-only" for="news-email">Email address</label>
          <input id="news-email" type="email" placeholder="Stories from the field" required autocomplete="email">
          <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
      </div>
      <div>
        <h4>Journeys</h4>
        <ul>
          <li><a href="safaris.html?theme=migration">The Great Migration</a></li>
          <li><a href="safaris.html?theme=bigfive">Big cats &amp; Big Five</a></li>
          <li><a href="safaris.html?theme=zanzibar">Bush &amp; beach</a></li>
          <li><a href="safaris.html?theme=culture">Culture &amp; people</a></li>
          <li><a href="safaris.html?dur=short">Short escapes</a></li>
        </ul>
      </div>
      <div>
        <h4>Explore</h4>
        <ul>
          <li><a href="destinations.html">Destinations</a></li>
          <li><a href="experiences.html">Experiences</a></li>
          <li><a href="story.html">Our Story</a></li>
          <li><a href="journal.html">Safari Journal</a></li>
          <li><a href="index.html#seasons">When to go</a></li>
        </ul>
      </div>
      <div>
        <h4>Talk to us</h4>
        <ul>
          <li><a href="contact.html">Contact us</a></li>
          <li><a href="plan.html">Plan my safari</a></li>
          <li data-contact="email" hidden><a href="#"></a></li>
          <li data-contact="phone" hidden><a href="#"></a></li>
          <li data-contact="whatsapp" hidden><a href="#" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><span class="footer__muted">Arusha, Tanzania</span></li>
        </ul>
      </div>
    </div>
    <div class="footer__big" aria-hidden="true">Wild Within</div>
    <div class="footer__bottom">
      <span>© <span data-year>2026</span> Wildara Africa Safaris. All rights reserved.</span>
      <span class="footer__legal"><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a></span>
    </div>
  </div>
</footer>'''

LIGHTBOX = '''<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="Image viewer">
  <button class="round-btn lightbox__close" type="button" aria-label="Close image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <img alt="">
  <p class="lightbox__cap"></p>
</div>'''

CHROME = '''<div class="cursor is-hidden" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div></div>
<div class="curtain" aria-hidden="true"><div class="curtain__panel"><img src="assets/brand/w-icon-almond.webp" alt="" width="1000" height="619"></div></div>
<div class="toast glass" role="status" aria-live="polite"></div>'''


def scripts(names):
    return "\n".join(f'<script src="assets/js/{n}.js" defer></script>' for n in names.split(","))


def expand(html):
    html = re.sub(r"\[\[scripts:(.*?)\]\]", lambda m: scripts(m.group(1)), html)
    html = html.replace("[[arrow]]", ARROW).replace("[[footer]]", FOOTER).replace("[[lightbox]]", LIGHTBOX).replace("[[chrome]]", CHROME)
    html = re.sub(r"\[\[head:(.*?)\|(.*?)\]\]", lambda m: head(m.group(1), m.group(2)), html)
    html = re.sub(r"\[\[nav:([\w-]+)\]\]", lambda m: nav(m.group(1)), html)

    def im(m):
        parts = m.group(1).split("|") + ["", "", ""]
        return img(parts[0], parts[1] or "100vw", parts[2], parts[3])
    html = re.sub(r"\[\[img:(.*?)\]\]", im, html)
    left = re.findall(r"\[\[.*?\]\]", html)
    if left:
        sys.exit(f"Unexpanded macros: {left}")
    return html


for f in sorted(glob.glob(f"{SRC}/*.html")):
    out = expand(open(f).read())
    open(f"{SITE}/{os.path.basename(f)}", "w").write(out)
    print("built", os.path.basename(f), len(out))
