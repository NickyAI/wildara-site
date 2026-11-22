"""Cross-browser check: Chromium (installed Chrome), WebKit (Safari's engine) and Firefox via Playwright.
Loads every page type, records JS errors / CSP violations / failed requests, and screenshots the
mask-heavy homepage moments (intro + W portal) in each engine.

One-off setup for WebKit/Firefox engines:  playwright install webkit firefox
python3 tools/tests/browsers.py [base-url] [shots-dir]
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
SHOTS = sys.argv[2] if len(sys.argv) > 2 else None
PAGES = ["/?nointro", "/safaris/", "/safaris/7-days-amazing-big-five-wildlife/", "/destinations/", "/destinations/zanzibar/",
         "/experiences/photography/", "/journal/first-safari-tips-and-etiquette/", "/story/", "/contact/", "/plan/", "/nope/"]


async def run(p, name):
    bt = {"chrome": p.chromium, "webkit": p.webkit, "firefox": p.firefox}[name]
    b = await bt.launch(channel="chrome") if name == "chrome" else await bt.launch()
    ctx = await b.new_context(viewport={"width": 1440, "height": 900})
    issues = []
    for path in PAGES:
        pg = await ctx.new_page(); errs = []
        pg.on("console", lambda m: errs.append(m.text[:160]) if m.type == "error" and "404" not in m.text else None)
        pg.on("pageerror", lambda e: errs.append("exception: " + str(e)[:160]))
        pg.on("response", lambda r: errs.append(f"HTTP {r.status} {r.url}") if r.status >= 400 and "/nope/" not in r.url else None)
        await pg.goto(BASE + path); await pg.wait_for_timeout(900)
        h1 = await pg.evaluate("(document.querySelector('h1')||{}).textContent||''")
        if not h1.strip(): errs.append("no h1 text rendered")
        issues += [f"{path}: {e}" for e in errs]
        await pg.close()
    if SHOTS:
        os.makedirs(SHOTS, exist_ok=True)
        pg = await ctx.new_page()
        await pg.goto(BASE + "/"); await pg.wait_for_timeout(1700)            # intro: light resting on the fox
        await pg.screenshot(path=f"{SHOTS}/{name}-intro.png")
        await pg.wait_for_timeout(5000)
        await pg.screenshot(path=f"{SHOTS}/{name}-hero.png")
        top, h = await pg.evaluate("(()=>{const s=document.getElementById('portal');return [s.getBoundingClientRect().top+scrollY,s.offsetHeight]})()")
        for k, f in (("a", 0.3), ("b", 0.7), ("c", 0.95)):
            await pg.evaluate(f"window.scrollTo(0,{top}+({h}-900)*{f})"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f"{SHOTS}/{name}-portal-{k}.png")
        await pg.close()
    await b.close()
    return issues


async def main():
    total = 0
    async with async_playwright() as p:
        for name in ("chrome", "webkit", "firefox"):
            try:
                issues = await run(p, name)
            except Exception as ex:
                print(f"{name}: could not run ({str(ex)[:120]})"); continue
            total += len(issues)
            print(f"{name}: {len(PAGES)} pages, {len(issues)} issues")
            for i in issues: print("   -", i)
    sys.exit(1 if total else 0)

asyncio.run(main())
