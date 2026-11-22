"""Crawl every page in sitemap.xml (+ 404.html) and verify every internal reference resolves:
href, src, srcset, poster, preload/imagesrcset, CSS url(...) and JSON-LD URLs on the production domain.
Also reports pages that are in the sitemap but not linked from any other page (orphans).

python3 tools/tests/links.py [base-url]
"""
import json, re, sys, urllib.error, urllib.parse, urllib.request
from collections import defaultdict

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
PROD = json.load(open(__file__.rsplit("/tests/", 1)[0] + "/site.json"))["site_url"].rstrip("/")
cache, inbound, broken = {}, defaultdict(set), []


def status(url):
    if url not in cache:
        try:
            cache[url] = urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=20).status
        except urllib.error.HTTPError as e:
            cache[url] = e.code
    return cache[url]


def refs(htm):
    out = re.findall(r'\s(?:href|src|poster)="([^"]+)"', htm)
    for ss in re.findall(r'\s(?:srcset|imagesrcset)="([^"]+)"', htm):
        out += [p.strip().split(" ")[0] for p in ss.split(",")]
    out += [u.replace(PROD, BASE) for u in re.findall(r'"(' + re.escape(PROD) + r'/[^"]*)"', htm)]
    return out


sm = urllib.request.urlopen(BASE + "/sitemap.xml").read().decode()
pages = [u.replace(PROD, "") for u in re.findall(r"<loc>([^<]+)</loc>", sm)] + ["/404.html"]
css = urllib.request.urlopen(BASE + "/assets/css/main.css").read().decode()
for u in re.findall(r"url\(([^)\"']+)\)", css):
    if not u.startswith(("data:", "%23", "#")):
        full = urllib.parse.urljoin(BASE + "/assets/css/main.css", u)
        if status(full) != 200: broken.append(("main.css", u, status(full)))

for path in pages:
    page_url = BASE + path
    htm = urllib.request.urlopen(page_url).read().decode()
    for r in refs(htm):
        if r.startswith(("mailto:", "tel:", "#", "data:", "javascript:")) or (r.startswith("http") and not r.startswith(BASE)):
            continue
        full = urllib.parse.urljoin(page_url, r).split("#")[0]
        if not full.startswith(BASE):
            continue
        tgt = urllib.parse.urlparse(full).path
        if tgt != path:
            inbound[tgt].add(path)
        st = status(full)
        if st != 200:
            broken.append((path, r, st))

orphans = [p for p in pages if p not in ("/", "/404.html") and not inbound.get(p)]
print(f"{len(pages)} pages crawled · {len(cache)} unique internal URLs checked · {len(broken)} broken · {len(orphans)} orphans")
for b in broken[:40]: print("  BROKEN", b)
for o in orphans: print("  ORPHAN", o)
sys.exit(1 if broken or orphans else 0)
