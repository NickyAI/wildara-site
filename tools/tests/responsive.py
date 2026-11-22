"""Responsive sweep: every page type at 13 viewport widths; reports horizontal overflow and
elements wider than the viewport. Optional screenshots of the homepage hero at key widths.

python3 tools/tests/responsive.py [base-url] [--shots DIR]
"""
import asyncio, os, sys
from playwright.async_api import async_playwright

argv = sys.argv[1:]
if "--shots" in argv:
    i = argv.index("--shots"); argv = argv[:i] + argv[i + 2:]
args = [a for a in argv if not a.startswith("--")]
BASE = (args[0] if args else "http://127.0.0.1:8080").rstrip("/")
SHOTS = sys.argv[sys.argv.index("--shots") + 1] if "--shots" in sys.argv else None
WIDTHS = [320, 360, 375, 390, 414, 768, 820, 1024, 1280, 1366, 1440, 1920, 2560]
PAGES = ["/?nointro", "/safaris/", "/safaris/12-days-majestic-great-migration-safari-at-mara-river-crossing/", "/destinations/",
         "/destinations/serengeti/", "/experiences/", "/experiences/cultural-encounters/", "/journal/",
         "/journal/how-much-does-a-tanzania-safari-cost/", "/story/", "/contact/", "/plan/", "/terms/", "/privacy/", "/404-check/"]
WIDE = """() => { const vw = document.documentElement.clientWidth; const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect(); if (r.width === 0 || r.right <= vw + 1) continue;
    let p = el.parentElement, clipped = false;
    while (p && p !== document.body) { const s = getComputedStyle(p); if (/(hidden|auto|scroll|clip)/.test(s.overflowX) || s.position === 'fixed') { clipped = true; break; } p = p.parentElement; }
    if (!clipped && getComputedStyle(el).position !== 'fixed') out.push(el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0] + ' ' + Math.round(r.right));
    if (out.length > 3) break; }
  return { sw: document.documentElement.scrollWidth, vw, out }; }"""


async def main():
    bad = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        for w in WIDTHS:
            mobile = w < 768
            ctx = await b.new_context(viewport={"width": w, "height": 900 if w >= 768 else 800}, is_mobile=mobile, has_touch=mobile, reduced_motion="reduce")
            row = []
            for path in PAGES:
                pg = await ctx.new_page()
                await pg.goto(BASE + path); await pg.wait_for_timeout(350)
                r = await pg.evaluate(WIDE)
                if r["sw"] > r["vw"] + 1 or r["out"]:
                    bad += 1; row.append(f"{path} overflow {r['sw'] - r['vw']}px {r['out']}")
                if SHOTS and path == "/?nointro" and w in (320, 768, 1024, 1920, 2560):
                    os.makedirs(SHOTS, exist_ok=True); await pg.screenshot(path=f"{SHOTS}/home-{w}.png")
                await pg.close()
            await ctx.close()
            print(f"{w:>5}px: " + ("ok, no horizontal overflow on %d pages" % len(PAGES) if not row else "\n        ".join(row)))
        await b.close()
    print(f"\n{len(WIDTHS)} widths x {len(PAGES)} pages · {bad} problems")
    sys.exit(1 if bad else 0)

asyncio.run(main())
