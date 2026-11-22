"""Static site generator for Wildara Africa Safaris.

Expands the authoring macros in tools/src/*.html and writes a crawlable static site to Site/:

  /                         index.html
  /safaris/                 listing        /safaris/<id>/        one page per itinerary
  /destinations/            listing        /destinations/<id>/   one page per destination
  /experiences/             listing        /experiences/<id>/    one page per experience
  /journal/                 listing        /journal/<id>/        one page per article
  /story/ /contact/ /plan/ /privacy/ /terms/
  /404.html  /robots.txt  /sitemap.xml

Every page gets its own title, description, canonical URL, Open Graph/Twitter tags and JSON-LD,
and detail pages ship their main content in the HTML (JavaScript then layers the interactions on top).
Configuration lives in tools/site.json. Run:  python3 tools/build.py
"""
import glob, hashlib, html, json, os, re, shutil, sys
from datetime import date
from urllib.parse import parse_qsl, urlencode

TOOLS = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.normpath(os.path.join(TOOLS, "..", "Site"))
SRC = os.path.join(TOOLS, "src")
CFG = json.load(open(os.path.join(TOOLS, "site.json")))
BASE = CFG["site_url"].rstrip("/")
BRAND = CFG["name"]
META = json.load(open(f"{SITE}/assets/data/img-meta.json"))


def load_js_data(name):
    t = open(f"{SITE}/assets/js/{name}").read()
    return json.loads(t[t.index("=") + 1:t.rindex(";")])


SAF = json.load(open(f"{SITE}/assets/data/safaris.json"))
DEST = load_js_data("content-destinations.js")
EXP = load_js_data("content-experiences.js")
JOUR = sorted(load_js_data("content-journal.js"), key=lambda a: a["date"], reverse=True)
DEST_BY = {d["id"]: d for d in DEST}

ARROW = '<svg class="btn__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
ARROW_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
THEME_LABEL = {"migration": "Great Migration", "zanzibar": "Bush & Beach", "culture": "Culture", "bigfive": "Big Five"}
DETAIL = {"safari": "safaris", "destination": "destinations", "experience": "experiences", "article": "journal"}
PAGES = ["index", "safaris", "destinations", "experiences", "journal", "story", "contact", "plan", "privacy", "terms"]
WARN = []


def e(s):
    return html.escape(str(s if s is not None else ""), quote=True)


def trim(s, n=155):
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[:s.rfind(" ", 0, n - 1)].rstrip(",;:") + "…"


def vhash(rel):
    return hashlib.md5(open(f"{SITE}/{rel}", "rb").read()).hexdigest()[:10]


def fit_title(*options, limit=65):
    """First candidate that fits Google's ~60-65 character display; falls back to the shortest."""
    for o in options:
        if len(o) <= limit:
            return o
    return min(options, key=len)


def money(n):
    return "${:,}".format(n)


def fmt_date(iso):
    y, m, d = map(int, iso.split("-"))
    return f"{d} {['January','February','March','April','May','June','July','August','September','October','November','December'][m-1]} {y}"


def og_image(name):
    """Absolute URL of the 1200x630 JPEG share image (falls back to the large WebP)."""
    rel = f"assets/og/{name}.jpg"
    if not os.path.exists(f"{SITE}/{rel}"):
        WARN.append(f"missing share image {rel} (run tools/og.py)")
        rel = f"assets/img/{name}-l.webp"
    return f"{BASE}/{rel}"


# ---------------------------------------------------------------- markup helpers
def srcset(name):
    lw = min(META[name][0], 2400)
    b = f"assets/img/{name}"
    return f"{b}-s.webp 640w, {b}-t.webp 960w, {b}-m.webp 1280w, {b}-l.webp {lw}w"


def preload(name):
    return (f'<link rel="preload" as="image" href="assets/img/{name}-m.webp" imagesrcset="{srcset(name)}" '
            f'imagesizes="100vw" fetchpriority="high">')


def img(name, sizes="100vw", alt="", attrs=""):
    w, h = META[name]
    lw = min(w, 2400)
    mh = round(h * 1280 / w)
    b = f"assets/img/{name}"
    return (f'<img src="{b}-m.webp" srcset="{srcset(name)}" sizes="{sizes}" alt="{e(alt)}" '
            f'width="1280" height="{mh}"{loading(attrs)} decoding="async"{(" " + attrs) if attrs else ""}>')


def loading(attrs):
    """Lazy by default; high-priority (LCP) images load eagerly. Never emit the attribute twice."""
    if "loading=" in attrs:
        return ""
    return ' loading="eager"' if "fetchpriority" in attrs else ' loading="lazy"'


def card(s, sizes="(max-width: 760px) 90vw, 440px"):
    tag = THEME_LABEL[s["themes"][0]] if s["themes"] else (s["tier"] if s["tier"] != "Classic" else "Private safari")
    return (f'<a class="scard" href="safari.html?id={s["id"]}" data-cursor="Discover" data-id="{e(s["id"])}">' + img(s["images"][0], sizes) +
            f'<div class="scard__top"><span class="pill">{s["days"]} days</span><span class="pill">{e(tag)}</span></div>'
            f'<div class="scard__panel glass"><h3>{e(s["title"])}</h3><p class="scard__dest">{e(s["destinations"])}</p>'
            f'<div class="scard__foot"><div class="scard__price"><small>From</small><b>{money(s["from"])}</b> <i>pp</i></div>'
            f'<span class="jcard__go">{ARROW_SM}</span></div></div></a>')


def ccard(href, image, meta, title, text, cta="Discover", pill="", cls="", d=None):
    return (f'<a class="ccard{(" " + cls) if cls else ""}" href="{href}" data-reveal{f" style=--d:{d}" if d is not None else ""}>'
            f'<div class="ccard__img">{img(image, "(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 31vw")}'
            f'{f"<span class=pill>{e(pill)}</span>" if pill else ""}</div>'
            f'<div class="ccard__body"><span class="ccard__meta">{e(meta)}</span><h3>{e(title)}</h3><p>{e(text)}</p>'
            f'<span class="link-u">{e(cta)} {ARROW_SM}</span></div></a>')


def faq_html(faqs):
    return '<div class="faq">' + "".join(
        f'<details{" open" if i == 0 else ""}><summary>{e(f["q"])}</summary><div class="faq__a"><p>{e(f["a"])}</p></div></details>'
        for i, f in enumerate(faqs)) + "</div>"


# ---------------------------------------------------------------- structured data
ORG_ID = f"{BASE}/#organization"


def ld(obj, faq=False):
    return f'<script type="application/ld+json"{" data-faq" if faq else ""}>' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"


def ld_faq(faqs):
    return ld({"@context": "https://schema.org", "@type": "FAQPage",
               "mainEntity": [{"@type": "Question", "name": f["q"], "acceptedAnswer": {"@type": "Answer", "text": f["a"]}} for f in faqs]}, faq=True)


def ld_breadcrumb(trail):
    return ld({"@context": "https://schema.org", "@type": "BreadcrumbList",
               "itemListElement": [{"@type": "ListItem", "position": i + 1, "name": n, "item": f"{BASE}{p}"} for i, (n, p) in enumerate(trail)]})


ORG = {"@context": "https://schema.org", "@type": "TravelAgency", "@id": ORG_ID, "name": BRAND, "url": f"{BASE}/",
       "logo": f"{BASE}/assets/brand/favicon.png", "image": og_image(CFG["default_og_image"]),
       "description": "Private safaris across northern Tanzania: the Serengeti, Ngorongoro Crater, Tarangire, Lake Manyara, Lake Eyasi and Zanzibar.",
       "address": {"@type": "PostalAddress", "addressLocality": "Arusha", "addressCountry": "TZ"},
       "telephone": CFG["phone"].replace(" ", ""), "email": CFG["email"], "sameAs": [CFG["facebook"], CFG["instagram"]],
       "areaServed": {"@type": "Country", "name": "Tanzania"}}
WEBSITE = {"@context": "https://schema.org", "@type": "WebSite", "@id": f"{BASE}/#website", "name": BRAND, "url": f"{BASE}/",
           "inLanguage": "en", "publisher": {"@id": ORG_ID}}


# ---------------------------------------------------------------- page chrome
def head(p):
    css = f'assets/css/main.css?v={vhash("assets/css/main.css")}'
    robots = "noindex, follow" if p.get("noindex") else "index, follow, max-image-preview:large"
    verify = f'\n<meta name="google-site-verification" content="{e(CFG["google_site_verification"])}">' if CFG.get("google_site_verification") else ""
    canonical = "" if p.get("noindex") else f'\n<link rel="canonical" href="{BASE}{p["path"]}">'
    og = og_image(p.get("og", CFG["default_og_image"]))
    intro = '\n<meta name="wa-intro" content="1">' if p.get("intro") else ""
    return f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(p["title"])}</title>
<meta name="description" content="{e(trim(p["desc"]))}">
<meta name="robots" content="{robots}">{canonical}{verify}
<meta name="wa-root" content="{p["root"]}">
<meta name="wa-nav" content="{p.get("nav", "")}">{intro}
<meta name="theme-color" content="#1C0F07">
<meta property="og:site_name" content="{BRAND}">
<meta property="og:locale" content="{CFG["locale"]}">
<meta property="og:type" content="{p.get("og_type", "website")}">
<meta property="og:title" content="{e(p.get("og_title", p["title"]))}">
<meta property="og:description" content="{e(trim(p["desc"]))}">
<meta property="og:url" content="{BASE}{p["path"]}">
<meta property="og:image" content="{og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(p.get("og_alt", p.get("og_title", p["title"])))}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(p.get("og_title", p["title"]))}">
<meta name="twitter:description" content="{e(trim(p["desc"]))}">
<meta name="twitter:image" content="{og}">
<link rel="icon" type="image/png" href="assets/brand/favicon.png">
<link rel="apple-touch-icon" href="assets/brand/favicon.png">
<link rel="preload" href="assets/fonts/libre-baskerville-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/manrope-variable.woff2" as="font" type="font/woff2" crossorigin>
{preload(p["hero"]) if p.get("hero") else ""}
<link rel="stylesheet" href="{css}">
<script src="assets/js/boot.js?v={vhash("assets/js/boot.js")}"></script>
''' + "\n".join(p.get("ld", []))


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


FOOTER = '''<footer class="footer on-dark">
  <div class="pattern-bg" aria-hidden="true"></div>
  <div class="wrap">
    <div class="footer__grid">
      <div class="footer__brand">
        <img class="footer__logo" src="assets/brand/WA-logo-white.webp" alt="Wildara Africa Safaris" width="836" height="296" loading="lazy">
        <p>Private safaris across northern Tanzania, designed around curiosity, care and the quiet thrill of discovery.</p>
        <form class="footer__news" data-newsletter aria-label="Newsletter">
          <label class="sr-only" for="news-email">Email address</label>
          <input id="news-email" type="email" placeholder="Stories from the field" required autocomplete="email">
          <button type="submit" aria-label="Subscribe"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
        </form>
      </div>
      <div>
        <h2 class="footer__h">Journeys</h2>
        <ul>
          <li><a href="safaris.html?theme=migration">The Great Migration</a></li>
          <li><a href="safaris.html?theme=bigfive">Big cats &amp; Big Five</a></li>
          <li><a href="safaris.html?theme=zanzibar">Bush &amp; beach</a></li>
          <li><a href="safaris.html?theme=culture">Culture &amp; people</a></li>
          <li><a href="safaris.html?dur=short">Short escapes</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer__h">Explore</h2>
        <ul>
          <li><a href="destinations.html">Destinations</a></li>
          <li><a href="experiences.html">Experiences</a></li>
          <li><a href="story.html">Our Story</a></li>
          <li><a href="journal.html">Safari Journal</a></li>
          <li><a href="index.html#seasons">When to go</a></li>
        </ul>
      </div>
      <div>
        <h2 class="footer__h">Talk to us</h2>
        <ul>
          <li><a href="contact.html">Contact us</a></li>
          <li><a href="plan.html">Plan my safari</a></li>
          <li><a href="mailto:{{email}}">{{email}}</a></li>
          <li><a href="tel:{{tel}}">{{phone}}</a></li>
          <li><a href="https://wa.me/{{whatsapp}}" target="_blank" rel="noopener">WhatsApp us</a></li>
          <li><span class="footer__muted">Arusha, Tanzania</span></li>
        </ul>
        <ul class="social" aria-label="Wildara on social media">
          <li><a href="{{facebook}}" target="_blank" rel="noopener me" aria-label="Facebook (opens in a new tab)"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21z"/></svg></a></li>
          <li><a href="{{instagram}}" target="_blank" rel="noopener me" aria-label="Instagram (opens in a new tab)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9" fill="currentColor" stroke="none"/></svg></a></li>
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
  <button class="round-btn lightbox__close" type="button" aria-label="Close image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
  <img alt="">
  <p class="lightbox__cap"></p>
</div>'''

CHROME = '''<div class="cursor is-hidden" aria-hidden="true"><div class="cursor__ring"><span class="cursor__label"></span></div><div class="cursor__dot"></div></div>
<div class="curtain" aria-hidden="true"><div class="curtain__panel"><img src="assets/brand/w-icon-almond.webp" alt="" width="1000" height="619"></div></div>
<div class="toast glass" role="status" aria-live="polite"></div>
<aside class="wa-dock" aria-label="WhatsApp chat"><a class="wa-float" href="https://wa.me/{{whatsapp}}?text={{wa_text}}" target="_blank" rel="noopener" aria-label="Chat with Wildara on WhatsApp (opens in a new tab)">
  <span class="wa-float__label" aria-hidden="true"><small>Questions?</small>Chat with us</span>
  <span class="wa-float__btn"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2A12.7 12.7 0 0 0 5.1 22.4L3.3 28.8l6.6-1.7A12.7 12.7 0 1 0 16 3.2zm0 23.2a10.5 10.5 0 0 1-5.4-1.5l-.4-.2-3.9 1 1-3.8-.2-.4A10.5 10.5 0 1 1 16 26.4zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.6 8.6 0 0 1-4.3-3.8c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.6 3.6 0 0 0-1.1 2.7 6.3 6.3 0 0 0 1.3 3.3c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8.9 3.8.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5l-.6-.3z"/></svg></span>
</a></aside>'''


def _contacts(s):
    return (s.replace("{{email}}", CFG["email"]).replace("{{phone}}", CFG["phone"])
             .replace("{{tel}}", CFG["phone"].replace(" ", "")).replace("{{whatsapp}}", CFG["whatsapp"])
             .replace("{{facebook}}", e(CFG["facebook"])).replace("{{instagram}}", e(CFG["instagram"]))
             .replace("{{wa_text}}", "Hello%20Wildara%2C%20I%27d%20love%20to%20plan%20a%20safari."))


FOOTER, CHROME = _contacts(FOOTER), _contacts(CHROME)


def scripts(names):
    return "\n".join(f'<script src="assets/js/{n}.js?v={vhash(f"assets/js/{n}.js")}" defer></script>' for n in names.split(","))


# ---------------------------------------------------------------- expansion + URL rewriting
PAGE_RE = re.compile(r'href="(index|safaris|safari|destinations|destination|experiences|experience|journal|article|story|contact|plan|privacy|terms)\.html(\?[^"#]*)?(#[^"]*)?"')


def clean_url(page, query, frag, root):
    q = dict(parse_qsl((query or "").lstrip("?")))
    frag = frag or ""
    if page == "index":
        return (root or "./") + frag
    section = DETAIL.get(page, page)
    path = section + "/"
    if page in DETAIL and "id" in q:
        path += q.pop("id") + "/"
    return root + path + (("?" + urlencode(q)) if q else "") + frag


def rewrite(htm, root):
    htm = PAGE_RE.sub(lambda m: f'href="{clean_url(m.group(1), m.group(2), m.group(3), root)}"', htm)
    htm = re.sub(r'(?<=["\s,])assets/', root + "assets/", htm)
    return htm


def expand(src, p):
    htm = src
    htm = re.sub(r"\[\[head:(.*?)\|(.*?)\]\]", lambda m: head(p), htm)
    htm = re.sub(r"\[\[scripts:(.*?)\]\]", lambda m: scripts(m.group(1)), htm)
    htm = htm.replace("[[arrow]]", ARROW).replace("[[footer]]", FOOTER).replace("[[lightbox]]", LIGHTBOX).replace("[[chrome]]", CHROME)
    htm = re.sub(r"\[\[nav:([\w-]+)\]\]", lambda m: nav(m.group(1)), htm)

    def im(m):
        parts = m.group(1).split("|") + ["", "", ""]
        return img(parts[0], parts[1] or "100vw", parts[2], parts[3])
    htm = re.sub(r"\[\[img:(.*?)\]\]", im, htm)
    left = re.findall(r"\[\[.*?\]\]", htm)
    if left:
        sys.exit(f"Unexpanded macros: {left}")
    if p.get("body_attrs"):
        htm = re.sub(r"<body([^>]*)>", lambda m: f"<body{m.group(1)} {p['body_attrs']}>", htm, count=1)
    for el_id, inner in p.get("fill", {}).items():
        htm, n = re.subn(r'(<(\w+)\b[^>]*\bid="' + re.escape(el_id) + r'"[^>]*>)(.*?)(</\2>)', lambda m: m.group(1) + inner + m.group(4), htm, count=1, flags=re.S)
        if not n:
            sys.exit(f"fill target #{el_id} not found")
    return rewrite(htm, p["root"])


def write(path, htm):
    out = SITE + path + ("index.html" if path.endswith("/") else "")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    open(out, "w").write(htm)


def src(name):
    return open(f"{SRC}/{name}.html").read()


def head_args(source):
    m = re.search(r"\[\[head:(.*?)\|(.*?)\]\]", source)
    return html.unescape(m.group(1)), html.unescape(m.group(2))


# ---------------------------------------------------------------- pages
built = []   # (path, lastmod or None)


def page(path, source, **p):
    p.setdefault("root", "../" * path.strip("/").count("/") + ("../" if path.strip("/") else ""))
    p["path"] = path
    write(path, expand(source, p))
    if not p.get("noindex"):
        built.append((path, p.get("lastmod")))


def build():
    # static + listing pages
    NAV = {"index": "home", "safaris": "safaris", "destinations": "destinations", "experiences": "experiences", "journal": "journal", "story": "story", "contact": "contact"}
    LABEL = {"safaris": "Safaris", "destinations": "Destinations", "experiences": "Experiences", "journal": "Safari Journal", "story": "Our Story",
             "contact": "Contact", "plan": "Plan my safari", "privacy": "Privacy Policy", "terms": "Terms & Conditions"}
    OG = {"index": "lone-acacia-herd", "safaris": "zebra-herd", "destinations": "lone-acacia-herd", "experiences": "silhouette-vehicle", "journal": "binocular-girls",
          "story": "giraffe-pair", "contact": "zebras-mist", "plan": "sundowner-couple", "privacy": "zebras-pair", "terms": "lone-tree"}
    for name in PAGES:
        source = src(name)
        title, desc = head_args(source)
        path = "/" if name == "index" else f"/{name}/"
        p = {"title": title, "desc": desc, "nav": NAV.get(name, ""), "og": OG[name], "fill": {}, "ld": []}
        m = re.search(r"\[\[img:([\w-]+)\|[^\]]*fetchpriority", source)
        if m: p["hero"] = m.group(1)
        if name == "index":
            p.update(intro=True, ld=[ld(ORG), ld(WEBSITE)])
            p["fill"]["featuredTrack"] = "".join(card(next(s for s in SAF if s["id"] == i)) for i in re.search(r'data-featured="([^"]+)"', source).group(1).split(","))
            p["fill"]["homeJournal"] = "".join(ccard(f'article.html?id={a["id"]}', a["hero"], f'{fmt_date(a["date"])} · {a["readMins"]} min read', a["title"], a["excerpt"], "Read", a["category"], d=i) for i, a in enumerate(JOUR[:3]))
        else:
            p["ld"].append(ld_breadcrumb([("Home", "/"), (LABEL[name], path)]))
        if name == "safaris":
            ordered = sorted(SAF, key=lambda s: (s["days"], s["from"]))
            p["fill"]["grid"] = "".join(card(s, "(max-width: 760px) 92vw, 66vw" if i % 6 == 0 else "(max-width: 760px) 92vw, (max-width: 1100px) 46vw, 31vw") for i, s in enumerate(ordered))
            p["fill"]["resultCount"] = f"{len(SAF)} journeys found"
            p["ld"].append(ld({"@context": "https://schema.org", "@type": "ItemList", "name": "Private Tanzania safaris",
                               "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f'{BASE}/safaris/{s["id"]}/', "name": s["title"]} for i, s in enumerate(ordered)]}))
        if name == "destinations":
            p["fill"]["destGrid"] = "".join(ccard(f'destination.html?id={d["id"]}', d["hero"], d["kicker"], d["name"], d["excerpt"], f'Explore {d["short"]}', d=i % 3) for i, d in enumerate(DEST))
        if name == "experiences":
            p["fill"]["expGrid"] = "".join(ccard(f'experience.html?id={x["id"]}', x["hero"], x["kicker"], x["title"], x["excerpt"], "Discover", x["category"], d=i % 3) for i, x in enumerate(EXP))
        if name == "journal":
            p["fill"]["jGrid"] = "".join(ccard(f'article.html?id={a["id"]}', a["hero"], f'{fmt_date(a["date"])} · {a["readMins"]} min read', a["title"], a["excerpt"], "Read", a["category"], d=i % 3) for i, a in enumerate(JOUR))
        page(path, source, **p)

    # safaris
    t = src("safari")
    for s in SAF:
        path = f'/safaris/{s["id"]}/'
        intro = "".join(f"<p>{e(x)}</p>" for x in s["intro"])
        days = "".join(
            f'<article class="tday is-in" data-day="{d["day"]}"><div class="tday__n" aria-hidden="true">{d["day"]}</div><div class="tday__body">'
            f'<small>Day {d["day"]}{(" · " + e(d["transfer"])) if d["transfer"] else ""}</small><h3>{e(d["title"])}</h3>'
            f'{("<p>" + e(d["program"]) + "</p>") if d["program"] else ""}{("<span class=tday__stay>" + e(d["stay"]) + "</span>") if d["stay"] else ""}</div></article>'
            for d in s["itinerary"])
        places = [{"@type": "ListItem", "position": i + 1, "item": {"@type": "Place", "name": n}} for i, n in enumerate(dict.fromkeys(r["k"] for r in s["route"]))]
        trip = {"@context": "https://schema.org", "@type": "TouristTrip", "name": s["title"], "description": trim(" ".join(s["intro"]), 300),
                "url": f"{BASE}{path}", "image": og_image(s["images"][0]), "provider": {"@id": ORG_ID},
                "itinerary": {"@type": "ItemList", "numberOfItems": len(s["itinerary"]),
                              "itemListElement": [{"@type": "ListItem", "position": d["day"], "name": f'Day {d["day"]}: {d["title"]}'} for d in s["itinerary"]]},
                "offers": {"@type": "Offer", "price": s["from"], "priceCurrency": "USD", "url": f"{BASE}{path}",
                           "description": f'From price per person for a private group of {max(g for g, _ in s["prices"])}'}}
        page(path, t, nav="safaris", og=s["images"][0], hero=s["images"][0], og_alt=s["title"],
             title=fit_title(f'{s["title"]} · {s["days"]}-Day Private Safari | {BRAND}', f'{s["title"]} · {s["days"]}-Day Safari | Wildara', f'{s["days"]}-Day {s["title"]} | Wildara', f'{s["days"]}-Day {s["title"]}', s["title"]),
             desc=trim(f'{s["title"]}: a {s["days"]}-day private safari through {s["destinations"]}. From {money(s["from"])} per person, with day-by-day itinerary, lodges and route map.'),
             body_attrs=f'data-id="{e(s["id"])}"',
             ld=[ld_breadcrumb([("Home", "/"), ("Safaris", "/safaris/"), (s["title"], path)]), ld(trip), ld_faq(s["faqs"])],
             fill={"s-title": e(s["title"]), "sCrumb": f'{s["days"]} days', "sHeroBg": img(s["images"][0], "100vw", "", 'fetchpriority="high"'),
                   "sFacts": "".join(f'<div class="fact"><small>{k}</small><b>{e(v)}</b></div>' for k, v in [("Duration", f'{s["days"]} days'), ("Destinations", s["destinations"]), ("Style", (s["tier"] + " · " if s["tier"] != "Classic" else "") + "Private"), ("From", money(s["from"]) + " pp")]),
                   "overview": f'<span class="eyebrow">Overview</span><p class="tagline" style="margin-top:1.2rem">{e(s["tagline"])}</p>{intro}',
                   "sFaq": faq_html(s["faqs"]), "subPrice": money(s["from"]), "bTitle": e(s["title"]),
                   "bPrice": money(two_price(s)), "bTotal": money(two_price(s) * max(2, min(g for g, _ in s["prices"])))})
        # timeline days are appended after the line element
        tl = SITE + path + "index.html"
        h = open(tl).read().replace('<div class="timeline__line"><span></span></div></div>', '<div class="timeline__line"><span></span></div>' + days.replace('class=tday__stay', 'class="tday__stay"') + '</div>', 1)
        open(tl, "w").write(h)

    # destinations
    t = src("destination")
    for d in DEST:
        path = f'/destinations/{d["id"]}/'
        place = {"@context": "https://schema.org", "@type": "TouristDestination", "name": d["name"], "description": d["excerpt"],
                 "url": f"{BASE}{path}", "image": og_image(d["hero"]), "containedInPlace": {"@type": "Country", "name": "Tanzania"}}
        page(path, t, nav="destinations", og=d["hero"], hero=d["hero"], og_alt=d["name"],
             title=fit_title(f'{d["name"]} Safari Guide | {BRAND}', f'{d["name"]} Safari Guide | Wildara', f'{d["name"]} | Wildara'), desc=trim(f'{d["tagline"]} {d["excerpt"]}'),
             body_attrs=f'data-id="{d["id"]}"',
             ld=[ld_breadcrumb([("Home", "/"), ("Destinations", "/destinations/"), (d["name"], path)]), ld(place), ld_faq(d["faqs"])],
             fill={"hBg": img(d["hero"], "100vw", "", 'fetchpriority="high"'), "hTitle": e(d["name"]), "hLead": e(d["tagline"]), "hKicker": e(f'{d["kicker"]} · {d["region"]}'), "hCrumb": e(d["short"]),
                   "dIntro": "".join(f'<p{" class=first" if i == 0 else ""}>{e(x)}</p>' for i, x in enumerate(d["intro"])),
                   "dFaq": faq_html(d["faqs"])})

    # experiences
    t = src("experience")
    for x in EXP:
        path = f'/experiences/{x["id"]}/'
        page(path, t, nav="experiences", og=x["hero"], hero=x["hero"], og_alt=x["title"],
             title=fit_title(f'{x["title"]} in Tanzania | {BRAND}', f'{x["title"]} in Tanzania | Wildara', f'{x["title"]} | Wildara'), desc=trim(f'{x["tagline"]} {x["excerpt"]}'),
             body_attrs=f'data-id="{x["id"]}"',
             ld=[ld_breadcrumb([("Home", "/"), ("Experiences", "/experiences/"), (x["title"], path)]), ld_faq(x["faqs"])],
             fill={"hBg": img(x["hero"], "100vw", "", 'fetchpriority="high"'), "hTitle": e(x["title"]), "hLead": e(x["tagline"]), "hKicker": e(f'{x["category"]} · {x["kicker"]}'), "hCrumb": e(x["title"]),
                   "eIntro": "".join(f'<p{" class=first" if i == 0 else ""}>{e(y)}</p>' for i, y in enumerate(x["intro"])),
                   "eMoments": "".join(f'<div class="moment"><h3>{e(m["title"])}</h3><p>{e(m["text"])}</p></div>' for m in x["moments"]),
                   "eFaq": faq_html(x["faqs"])})

    # journal articles
    t = src("article")
    for a in JOUR:
        path = f'/journal/{a["id"]}/'
        def slug(s): return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
        body = f'<p class="intro">{e(a["intro"])}</p>'
        for s in a["sections"]:
            body += f'<h2 id="{slug(s["h"])}">{e(s["h"])}</h2>' + "".join(
                f"<p>{e(b)}</p>" if isinstance(b, str) else "<ul>" + "".join(f"<li>{e(li)}</li>" for li in b["list"]) + "</ul>" for b in s["body"])
        body += '<h2 id="faqs">Frequently asked questions</h2>' + faq_html(a["faqs"])
        art = {"@context": "https://schema.org", "@type": "Article", "headline": a["title"], "description": a["excerpt"], "image": og_image(a["hero"]),
               "datePublished": a["date"], "dateModified": a["date"], "author": {"@type": "Organization", "name": BRAND, "url": f"{BASE}/"},
               "publisher": {"@id": ORG_ID}, "mainEntityOfPage": f"{BASE}{path}", "articleSection": a["category"], "inLanguage": "en"}
        page(path, t, nav="journal", og=a["hero"], hero=a["hero"], og_alt=a["title"], og_type="article", lastmod=a["date"],
             title=fit_title(f'{a["title"]} | Wildara Safari Journal', f'{a["title"]} | Wildara', a["title"]), desc=trim(a["excerpt"]),
             body_attrs=f'data-id="{a["id"]}"',
             ld=[ld_breadcrumb([("Home", "/"), ("Safari Journal", "/journal/"), (a["title"], path)]), ld(org_ref(art)), ld_faq(a["faqs"])],
             fill={"hBg": img(a["hero"], "100vw", "", 'fetchpriority="high"'), "hTitle": e(a["title"]), "hKicker": e(a["category"]), "hCrumb": e(a["category"]),
                   "hMeta": f'<span>{e(a["author"])}</span><span>{fmt_date(a["date"])}</span><span>{a["readMins"]} min read</span>',
                   "aToc": "<small>In this guide</small>" + "".join(f'<a href="#{slug(s["h"])}">{e(s["h"])}</a>' for s in a["sections"]) + '<a href="#faqs">FAQs</a>',
                   "aBody": body})

    # 404 (served for any depth, so it uses root-absolute paths)
    page("/404.html", src("404"), root="/", title=f"Page not found | {BRAND}", desc="This page could not be found.", noindex=True,
         og=CFG["default_og_image"])
    built.pop() if built and built[-1][0] == "/404.html" else None


def two_price(s):
    pr = sorted(s["prices"]); n = min(max(2, pr[0][0]), pr[-1][0])
    return next(p for g, p in pr if g == n)


def org_ref(obj):
    return obj


def write_seo_files():
    urls = "".join(f"  <url><loc>{BASE}{p}</loc>{f'<lastmod>{lm}</lastmod>' if lm else ''}</url>\n" for p, lm in built)
    open(f"{SITE}/sitemap.xml", "w").write(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    open(f"{SITE}/robots.txt", "w").write(f"User-agent: *\nAllow: /\n\nSitemap: {BASE}/sitemap.xml\n")


def clean_legacy():
    """Remove pre-clean-URL flat pages (e.g. safaris.html) so they can't be served as duplicates."""
    for name in PAGES[1:] + list(DETAIL):
        f = f"{SITE}/{name}.html"
        if os.path.exists(f):
            os.remove(f)
            print("removed legacy", os.path.relpath(f, SITE))


if __name__ == "__main__":
    clean_legacy()
    build()
    write_seo_files()
    shutil.copyfile(os.path.join(TOOLS, "htaccess"), f"{SITE}/.htaccess")
    print(f"built {len(built)} indexable pages + 404 · sitemap.xml · robots.txt · .htaccess  (site: {BASE})")
    for w in sorted(set(WARN)):
        print("WARNING:", w)
