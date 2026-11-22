"""Browser smoke test for the built site (real Chrome via Playwright).

Start the production-like server first:   python3 tools/serve.py 8080
Then run:                                 python3 tools/tests/smoke.py [http://127.0.0.1:8080]
Requires: pip install playwright   (uses the installed Google Chrome; no browser download needed)

Checks every URL in sitemap.xml plus the 404 page:
  HTTP status · console errors (incl. CSP violations) · uncaught exceptions · failed requests
  exactly one <h1> with text · canonical = production URL · og:image absolute · no localhost leaks
  unique <title> and description · no horizontal overflow (1440 and 375 px) · pre-rendered content not duplicated
Exit code 1 if anything fails.
"""
import asyncio, json, re, sys, urllib.request
from collections import Counter
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
PROD = json.load(open(__file__.rsplit("/tests/", 1)[0] + "/site.json"))["site_url"].rstrip("/")

CHECK = r"""() => {
  const q = s => document.querySelector(s), qa = s => [...document.querySelectorAll(s)];
  const h1 = qa('h1');
  return {
    title: document.title,
    desc: (q('meta[name="description"]') || {}).content || '',
    canonical: (q('link[rel="canonical"]') || {}).href || '',
    robots: (q('meta[name="robots"]') || {}).content || '',
    og: (q('meta[property="og:image"]') || {}).content || '',
    h1: h1.length, h1text: h1[0] ? h1[0].textContent.trim() : '',
    days: qa('#sTimeline .tday').length, dayIds: qa('#sTimeline .tday').map(t => t.dataset.day).join(','),
    faq: qa('.faq').length,
    ld: qa('script[type="application/ld+json"]').map(s => { try { return JSON.parse(s.textContent)['@type']; } catch (e) { return 'INVALID'; } }),
    overflow: document.documentElement.scrollWidth - innerWidth,
    html: document.documentElement.outerHTML.includes('localhost') || document.documentElement.outerHTML.includes('127.0.0.1')
  };
}"""


async def main():
    sm = urllib.request.urlopen(BASE + "/sitemap.xml").read().decode()
    paths = [u.replace(PROD, "") for u in re.findall(r"<loc>([^<]+)</loc>", sm)] + ["/this-page-does-not-exist/"]
    fails, titles, descs = [], Counter(), Counter()
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        for vw, vh, mobile in ((1440, 900, False), (375, 812, True)):
            ctx = await b.new_context(viewport={"width": vw, "height": vh}, is_mobile=mobile, has_touch=mobile, reduced_motion="reduce")
            for path in paths:
                if mobile and path.count("/") > 3:   # mobile: one of each detail type is enough
                    if not any(path.startswith(x) and path.endswith(y) for x, y in []) and path not in (
                        "/safaris/12-days-majestic-great-migration-safari-at-mara-river-crossing/", "/destinations/serengeti/",
                        "/experiences/walking-safaris/", "/journal/great-migration-month-by-month/"):
                        continue
                pg = await ctx.new_page()
                errs = []
                pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" and "404 (Not Found)" not in m.text else None)
                pg.on("pageerror", lambda ex: errs.append("exception: " + str(ex)))
                pg.on("response", lambda r: errs.append(f"HTTP {r.status} {r.url}") if r.status >= 400 and "does-not-exist" not in r.url else None)
                resp = await pg.goto(BASE + path, wait_until="load")
                await pg.wait_for_timeout(500)
                r = await pg.evaluate(CHECK)
                tag = f"[{vw}] {path}"
                is404 = "does-not-exist" in path
                if resp.status != (404 if is404 else 200): errs.append(f"status {resp.status}")
                if r["h1"] != 1 or not r["h1text"]: errs.append(f"h1 count={r['h1']} text='{r['h1text'][:30]}'")
                if not is404:
                    if r["canonical"] != PROD + path: errs.append(f"canonical {r['canonical']}")
                    if not r["og"].startswith(PROD + "/"): errs.append(f"og:image {r['og']}")
                    if "noindex" in r["robots"]: errs.append("noindex on indexable page")
                    if vw == 1440: titles[r["title"]] += 1; descs[r["desc"]] += 1
                elif "noindex" not in r["robots"]: errs.append("404 page should be noindex")
                if "INVALID" in r["ld"]: errs.append("invalid JSON-LD")
                if r["html"]: errs.append("localhost/127.0.0.1 leaked into markup")
                if r["overflow"] > 1: errs.append(f"horizontal overflow {r['overflow']}px")
                if path.startswith("/safaris/") and path != "/safaris/":
                    ids = r["dayIds"].split(",")
                    if len(ids) != len(set(ids)): errs.append(f"duplicated itinerary days {r['dayIds']}")
                for x in errs: fails.append(f"{tag}: {x}")
                print(("FAIL " if errs else "ok   ") + tag + (f"  ({len(errs)} issues)" if errs else f"  ld={','.join(r['ld'])}"))
                await pg.close()
            await ctx.close()
        await b.close()
    for t, n in titles.items():
        if n > 1: fails.append(f"duplicate title x{n}: {t}")
    for d, n in descs.items():
        if n > 1: fails.append(f"duplicate description x{n}: {d[:70]}")
    print(f"\n{len(paths)} URLs checked · {len(fails)} failures")
    for f in fails: print("  -", f)
    sys.exit(1 if fails else 0)

asyncio.run(main())
