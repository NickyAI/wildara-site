"""End-to-end interaction tests (real Chrome): planner, contact form, filters, booking stepper, menu, lightbox.
python3 tools/tests/interactions.py [base-url]
"""
import asyncio, sys
from playwright.async_api import async_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
results = []


def check(name, cond, detail=""):
    results.append((name, bool(cond), detail)); print(("PASS " if cond else "FAIL ") + name + (f"  ({detail})" if detail and not cond else ""))


async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(channel="chrome")
        ctx = await b.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
        pg = await ctx.new_page()
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))

        # itinerary -> planner keeps the chosen safari and traveller count
        await pg.goto(BASE + "/safaris/7-days-amazing-big-five-wildlife/"); await pg.wait_for_timeout(600)
        await pg.click("#bPlus"); await pg.wait_for_timeout(100)
        check("booking stepper updates price", (await pg.text_content("#bPrice")) == "$2,120", await pg.text_content("#bPrice"))
        href = await pg.get_attribute("#bCta", "href")
        check("enquire link uses clean URL", href.startswith("../../plan/?safari=7-days-amazing-big-five-wildlife&travellers=3"), href)
        await pg.click("#bCta"); await pg.wait_for_url("**/plan/**")
        await pg.wait_for_timeout(700)
        check("planner shows the chosen safari", "Amazing Big Five Wildlife" in (await pg.text_content("#chosenSafari")))
        check("planner carries traveller count", (await pg.text_content("#adults")) == "3")
        await pg.click(".tile >> nth=0"); await pg.click("#nextBtn"); await pg.click("#nextBtn"); await pg.click("#nextBtn")
        await pg.click("#nextBtn"); await pg.wait_for_timeout(200)
        check("planner validates required fields", await pg.is_visible("text=Please tell us your first name."))
        await pg.fill("#fname", "Amani"); await pg.fill("#email", "amani@example.com"); await pg.check("#consent")
        await pg.click("#nextBtn"); await pg.wait_for_timeout(500)
        check("planner submits to confirmation", await pg.is_visible("#thanks") and "Amani" in (await pg.text_content("#thanksMsg")))

        # destination -> planner interest
        await pg.goto(BASE + "/destinations/zanzibar/"); await pg.wait_for_timeout(500)
        await pg.click(".page-hero [data-plan]"); await pg.wait_for_url("**/plan/**"); await pg.wait_for_timeout(500)
        check("destination CTA pre-fills interest", "Zanzibar" in (await pg.text_content("#chosenSafari")))

        # contact form
        await pg.goto(BASE + "/contact/"); await pg.wait_for_timeout(400)
        await pg.click("#contactForm button[type=submit]"); await pg.wait_for_timeout(150)
        check("contact validates", await pg.is_visible("text=Please tell us your name."))
        await pg.fill("#cName", "Amani Moshi"); await pg.fill("#cEmail", "amani@example.com"); await pg.fill("#cMsg", "Hello"); await pg.check("#cConsent")
        await pg.click("#contactForm button[type=submit]"); await pg.wait_for_timeout(300)
        check("contact submits to confirmation", await pg.is_visible("#cThanks"))

        # listing filters from URL + chip
        await pg.goto(BASE + "/safaris/?theme=zanzibar"); await pg.wait_for_timeout(600)
        n = await pg.locator("#grid .scard").count()
        check("theme filter from URL", n == 3, f"{n} cards")
        await pg.click("[data-theme=migration]"); await pg.wait_for_timeout(700)
        check("chip filter + URL sync", "theme=migration" in pg.url and await pg.locator("#grid .scard").count() == 7)
        first = await pg.get_attribute("#grid .scard", "href")
        check("card links are clean URLs", first.startswith("../safaris/") or first.startswith("safaris/") or "/safaris/" in first, first)

        # menu via keyboard + lightbox
        await pg.set_viewport_size({"width": 1000, "height": 800}); await pg.goto(BASE + "/"); await pg.wait_for_timeout(500)
        await pg.click(".nav__toggle"); await pg.wait_for_timeout(300)
        check("menu opens", await pg.get_attribute(".nav__toggle", "aria-expanded") == "true")
        await pg.keyboard.press("Escape"); await pg.wait_for_timeout(300)
        check("menu closes with Escape", await pg.get_attribute(".nav__toggle", "aria-expanded") == "false")
        await pg.goto(BASE + "/safaris/7-days-amazing-big-five-wildlife/"); await pg.wait_for_timeout(500)
        await pg.click("#sGallery .slide >> nth=0"); await pg.wait_for_timeout(300)
        src = await pg.get_attribute("#lightbox img", "src") or ""
        check("gallery opens lightbox with large image", "is-open" in (await pg.get_attribute("#lightbox", "class")) and src.endswith("-l.webp"), src)
        alt = await pg.get_attribute("#sGallery .slide img", "alt")
        check("gallery images have descriptive alt text", alt and "photograph" not in alt and len(alt) > 15, alt)
        await pg.keyboard.press("Escape")
        check("no uncaught JS errors", not errors, "; ".join(errors[:3]))
        await b.close()
    failed = [r for r in results if not r[1]]
    print(f"\n{len(results)} checks · {len(failed)} failed"); sys.exit(1 if failed else 0)

asyncio.run(main())
