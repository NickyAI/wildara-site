"""Mobile-first audit: every sitemap URL at phone widths.
Checks horizontal overflow, tap targets (< 40px), body text under 12px, form fields under 16px
(iOS zooms on focus), and fixed elements covering each other. Start tools/serve.py first.
Usage: python3 tools/tests/mobile.py [base_url]"""
import re, sys
from collections import defaultdict
from playwright.sync_api import sync_playwright

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8080").rstrip("/")
WIDTHS = (320, 360, 390, 430)

AUDIT = r"""() => {
  const vw = innerWidth, out = {overflow: [], tap: [], small: [], field: []};
  const vis = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 && !el.closest('[aria-hidden="true"],[hidden],.menu,.lightbox,.intro,.cursor,.sr-only'); };
  const name = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0,2).join('.') : '') + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) + '"');
  if (document.documentElement.scrollWidth > vw + 1) out.overflow.push('page scrollWidth ' + document.documentElement.scrollWidth);
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.right > vw + 1 && !el.closest('.track, .tgallery, .subnav__links, .months, .filters__scroll, [data-track], .footer__big, .marquee, pre, .portal')) {
      let p = el.parentElement, clipped = false;
      while (p) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { clipped = true; break; } p = p.parentElement; }
      if (!clipped) out.overflow.push(name(el) + ' right=' + Math.round(r.right));
    }
  }
  for (const el of document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea, [role=button], summary, label[for]')) {
    // map pins are exempt: each route map has an equivalent 44px link list (#routeStops), per WCAG 2.5.8
    if (!vis(el) || el.closest('.hp') || el.closest('svg')) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === 'A' && el.closest('p, li p, .prose, .legal-note, figcaption, dd, label') && getComputedStyle(el).display === 'inline';
    if (inline) continue;
    if (el.tagName === 'INPUT' && (el.type === 'checkbox' || el.type === 'radio')) { const l = el.closest('label') || document.querySelector('label[for="' + el.id + '"]'); if (l && l.getBoundingClientRect().height >= 40) continue; }
    if (el.tagName === 'LABEL') continue;
    if (Math.min(r.width, r.height) < 40) out.tap.push(name(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (seen.has(el) || !vis(el)) continue; seen.add(el);
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) out.small.push(name(el) + ' ' + fs + 'px');
  }
  for (const el of document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=range]), select, textarea')) {
    if (!vis(el) || el.closest('.hp')) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 16) out.field.push(name(el) + ' ' + fs + 'px');
  }
  return out;
}"""

def main():
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        xml = b.new_page().request.get(BASE + "/sitemap.xml").text()
        urls = [re.sub(r"^https?://[^/]+", BASE, u) for u in re.findall(r"<loc>([^<]+)</loc>", xml)] + [BASE + "/404.html"]
        agg = defaultdict(lambda: defaultdict(set)); pages_bad = set()
        for w in WIDTHS:
            ctx = b.new_context(viewport={"width": w, "height": 800}, device_scale_factor=2, is_mobile=True, has_touch=True)
            pg = ctx.new_page()
            for u in urls:
                pg.goto(u + ("&" if "?" in u else "?") + "nointro", wait_until="networkidle")
                pg.evaluate("window.scrollTo(0, document.body.scrollHeight)"); pg.wait_for_timeout(250)
                pg.evaluate("window.scrollTo(0, 0)"); pg.wait_for_timeout(150)
                res = pg.evaluate(AUDIT)
                for k, items in res.items():
                    for it in items:
                        agg[k][it].add(f"{w}:{u.replace(BASE, '') or '/'}"); pages_bad.add(u)
            ctx.close()
        b.close()
    total = 0
    for k in ("overflow", "tap", "small", "field"):
        print(f"\n== {k}: {len(agg[k])} distinct")
        for it, where in sorted(agg[k].items(), key=lambda x: -len(x[1]))[:40]:
            ws = sorted(where); print(f"  {it}   [{len(ws)}× e.g. {ws[0]}]")
        total += len(agg[k])
    print(f"\n{len(urls)} URLs × {len(WIDTHS)} widths · {total} distinct findings")
    sys.exit(1 if total else 0)

if __name__ == "__main__":
    main()
