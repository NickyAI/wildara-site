"""Accessibility audit with axe-core (WCAG 2.0/2.1 A + AA rules) on one page of every type.

Start the server (python3 tools/serve.py 8080), then: python3 tools/tests/a11y.py [base-url]
Downloads axe-core once from cdnjs into tools/tests/.axe.min.js. Requires: pip install playwright
"""
import asyncio, os, sys, urllib.request
from collections import defaultdict
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
AXE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".axe.min.js")
if not os.path.exists(AXE):
    urllib.request.urlretrieve("https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js", AXE)
PAGES = ["/?nointro", "/safaris/", "/safaris/7-days-amazing-big-five-wildlife/", "/destinations/", "/destinations/ngorongoro/",
         "/experiences/", "/experiences/hot-air-balloon/", "/journal/", "/journal/what-to-pack-for-safari/",
         "/story/", "/contact/", "/plan/", "/privacy/", "/terms/", "/missing-page/"]


async def main():
    found = defaultdict(lambda: {"impact": "", "help": "", "pages": set(), "nodes": 0, "sample": ""})
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        for vw, mobile in ((1440, False), (390, True)):
            ctx = await b.new_context(viewport={"width": vw, "height": 900}, is_mobile=mobile, bypass_csp=True, reduced_motion="reduce")
            for path in PAGES:
                pg = await ctx.new_page()
                await pg.goto(BASE + path); await pg.wait_for_timeout(900)
                await pg.add_script_tag(path=AXE)
                res = await pg.evaluate("axe.run(document, {runOnly: {type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']}})")
                for v in res["violations"]:
                    f = found[v["id"]]
                    f.update(impact=v["impact"], help=v["help"]); f["pages"].add(f"{path}@{vw}"); f["nodes"] += len(v["nodes"])
                    f["sample"] = f["sample"] or (v["nodes"][0]["target"][0] if v["nodes"] else "")
                await pg.close()
            await ctx.close()
        await b.close()
    order = {"critical": 0, "serious": 1, "moderate": 2, "minor": 3}
    for k, f in sorted(found.items(), key=lambda kv: order.get(kv[1]["impact"], 9)):
        print(f"[{f['impact']}] {k}: {f['help']}  ({f['nodes']} nodes, {len(f['pages'])} page-views) e.g. {f['sample']}")
    print(f"\n{len(found)} distinct rule violations")
    sys.exit(1 if any(f["impact"] in ("critical", "serious") for f in found.values()) else 0)

asyncio.run(main())
