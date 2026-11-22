"""Static SEO validation of the built Site/ folder (no server needed).

python3 tools/tests/seo.py
Checks: sitemap.xml well-formed + every <loc> maps to a built page; robots.txt references the sitemap and
blocks nothing important; every page has title/description/canonical/og tags; lengths; duplicates;
accidental noindex/localhost/staging URLs; JSON-LD parses and carries required properties per type.
"""
import glob, json, os, re, sys
import xml.etree.ElementTree as ET
from collections import Counter

TOOLS = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(TOOLS, "..", "Site")
PROD = json.load(open(os.path.join(TOOLS, "site.json")))["site_url"].rstrip("/")
REQ = {"TravelAgency": ["name", "url", "address"], "WebSite": ["name", "url"], "BreadcrumbList": ["itemListElement"],
       "TouristTrip": ["name", "description", "itinerary"], "TouristDestination": ["name", "description"],
       "Article": ["headline", "image", "datePublished", "author"], "FAQPage": ["mainEntity"], "ItemList": ["itemListElement"]}
errors, warns = [], []

# sitemap + robots
root = ET.parse(os.path.join(SITE, "sitemap.xml")).getroot()
locs = [e.text for e in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
for u in locs:
    if not u.startswith(PROD + "/"): errors.append(f"sitemap loc not on production domain: {u}")
    f = os.path.join(SITE, u[len(PROD) + 1:], "index.html") if u.endswith("/") else os.path.join(SITE, u[len(PROD) + 1:])
    if not os.path.exists(f): errors.append(f"sitemap loc has no file: {u}")
if len(locs) != len(set(locs)): errors.append("duplicate sitemap URLs")
robots = open(os.path.join(SITE, "robots.txt")).read()
if f"Sitemap: {PROD}/sitemap.xml" not in robots: errors.append("robots.txt missing Sitemap line")
if re.search(r"^Disallow:\s*/\s*$", robots, re.M): errors.append("robots.txt blocks the whole site")

titles, descs, ldtypes = Counter(), Counter(), Counter()
pages = sorted(glob.glob(os.path.join(SITE, "**", "index.html"), recursive=True))
for f in pages:
    rel = "/" + os.path.relpath(os.path.dirname(f), SITE).replace(".", "").strip("/")
    rel = "/" if rel == "/" else rel + "/"
    h = open(f).read()
    t = re.search(r"<title>(.*?)</title>", h, re.S); d = re.search(r'<meta name="description" content="([^"]*)"', h)
    c = re.search(r'<link rel="canonical" href="([^"]*)"', h); og = re.search(r'<meta property="og:image" content="([^"]*)"', h)
    robots_meta = re.search(r'<meta name="robots" content="([^"]*)"', h)
    if not t or not d or not c or not og: errors.append(f"{rel}: missing title/description/canonical/og:image"); continue
    if c.group(1) != PROD + rel: errors.append(f"{rel}: canonical {c.group(1)}")
    if f"{PROD}{rel}" not in locs: errors.append(f"{rel}: not in sitemap")
    if robots_meta and "noindex" in robots_meta.group(1): errors.append(f"{rel}: noindex")
    if re.search(r"localhost|127\.0\.0\.1|staging\.", h): errors.append(f"{rel}: dev/staging URL in markup")
    if not 15 <= len(t.group(1)) <= 75: warns.append(f"{rel}: title length {len(t.group(1))}")
    if not 70 <= len(d.group(1)) <= 160: warns.append(f"{rel}: description length {len(d.group(1))}")
    if h.count("<h1") != 1: errors.append(f"{rel}: {h.count('<h1')} <h1> in HTML")
    titles[t.group(1)] += 1; descs[d.group(1)] += 1
    for block in re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S):
        try:
            obj = json.loads(block)
        except ValueError as ex:
            errors.append(f"{rel}: JSON-LD does not parse ({ex})"); continue
        typ = obj.get("@type"); ldtypes[typ] += 1
        if obj.get("@context") != "https://schema.org": errors.append(f"{rel}: JSON-LD missing @context")
        for k in REQ.get(typ, []):
            if not obj.get(k): errors.append(f"{rel}: {typ} missing {k}")
        if typ == "FAQPage" and any(not q.get("acceptedAnswer", {}).get("text") for q in obj["mainEntity"]): errors.append(f"{rel}: FAQ answer empty")

errors += [f"duplicate title x{n}: {t}" for t, n in titles.items() if n > 1]
errors += [f"duplicate description x{n}: {d[:60]}" for d, n in descs.items() if n > 1]
nf = open(os.path.join(SITE, "404.html")).read()
if 'content="noindex' not in nf: errors.append("404.html is not noindex")
print(f"{len(pages)} pages · {len(locs)} sitemap URLs · JSON-LD: {dict(ldtypes)}")
print(f"{len(errors)} errors · {len(warns)} warnings")
for x in errors: print("  ERROR", x)
for x in warns: print("  warn ", x)
sys.exit(1 if errors else 0)
