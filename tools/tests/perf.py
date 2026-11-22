"""Lab Core Web Vitals (Chrome, simulated mobile 4G + 4x CPU slowdown).
Reports LCP, CLS, total blocking time (long tasks) and transferred bytes per page.
These are lab numbers, not field data; use PageSpeed Insights / Search Console for real-user metrics.

python3 tools/tests/perf.py [base-url]
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
PAGES = ["/?nointro", "/safaris/", "/safaris/7-days-amazing-big-five-wildlife/", "/destinations/serengeti/", "/journal/what-to-pack-for-safari/", "/contact/"]
OBS = """() => { window.__v = {lcp: 0, cls: 0, tbt: 0, lcpEl: ''};
  new PerformanceObserver(l => { for (const e of l.getEntries()) { __v.lcp = e.startTime; __v.lcpEl = (e.element && (e.element.tagName + '.' + (e.element.className||'')).slice(0,60)) || e.url.slice(-50); } }).observe({type: 'largest-contentful-paint', buffered: true});
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) __v.cls += e.value; }).observe({type: 'layout-shift', buffered: true});
  new PerformanceObserver(l => { for (const e of l.getEntries()) __v.tbt += Math.max(0, e.duration - 50); }).observe({type: 'longtask', buffered: true}); }"""


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        print(f"{'page':58} {'LCP':>7} {'CLS':>6} {'TBT':>6} {'KB':>7}  LCP element")
        for path in PAGES:
            ctx = await b.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
            pg = await ctx.new_page()
            cdp = await ctx.new_cdp_session(pg)
            await cdp.send("Network.enable")
            await cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 150, "downloadThroughput": 1.6e6 / 8, "uploadThroughput": 750e3 / 8})
            await cdp.send("Emulation.setCPUThrottlingRate", {"rate": 4})
            total = {"b": 0}
            cdp.on("Network.loadingFinished", lambda ev: total.__setitem__("b", total["b"] + ev.get("encodedDataLength", 0)))
            await pg.add_init_script(f"({OBS})()")
            await pg.goto(BASE + path, wait_until="load", timeout=120000)
            await pg.wait_for_timeout(3000)
            v = await pg.evaluate("window.__v")
            print(f"{path[:58]:58} {v['lcp']/1000:6.2f}s {v['cls']:6.3f} {v['tbt']:5.0f}ms {total['b']/1024:6.0f}  {v['lcpEl']}")
            await ctx.close()
        await b.close()

asyncio.run(main())
