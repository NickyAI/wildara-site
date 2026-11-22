# Wildara site tooling

`Site/` is plain static HTML/CSS/JS. These Python scripts generate and test it. Install the optional dependencies with `pip install -r tools/requirements.txt`.

## Build pipeline

| Step | Script | When to run | Needs |
|---|---|---|---|
| 1 | `proc.py` | new/changed photos in `../Media`: WebP in 4 sizes (`-s` 640, `-t` 960, `-m` 1280, `-l` ≤2400) | Pillow |
| 2 | `og.py` | after `proc.py`: 1200×630 JPEG share images in `Site/assets/og/` | Pillow |
| 3 | `parse.py` → `polish.py` → `routes.py` | itinerary `.docx` changes: data, photos, map routes and FAQs → `safaris.json` + `safaris-data.js` | python-docx |
| 4 | `build.py` | **any template, content or config change**: writes every page, `sitemap.xml`, `robots.txt`, `.htaccess` | stdlib only |

`build.py` reads `site.json` (production URL, Search Console token, default share image), `htaccess` (server rules) and the templates in `src/`. Edit those, not the generated files in `Site/` (except `Site/assets/` CSS/JS/data, which are source files).

## Local preview

```sh
python3 tools/serve.py 8080
```

Mirrors Hostinger: directory index, `/dir` → `/dir/`, real 404 page, no directory listings, hidden files refused, gzip, and the exact security headers from `.htaccess`.

## Tests (start `serve.py` first)

| Command | Checks |
|---|---|
| `python3 tools/tests/smoke.py` | every sitemap URL in Chrome (desktop + mobile): status, JS/CSP errors, failed requests, one H1, canonical, og:image, duplicates, overflow |
| `python3 tools/tests/links.py` | every internal link/asset/srcset resolves; orphan pages |
| `python3 tools/tests/seo.py` | sitemap, robots, metadata lengths/duplicates, JSON-LD required fields (no server needed) |
| `python3 tools/tests/a11y.py` | axe-core WCAG 2.1 A/AA on every page type |
| `python3 tools/tests/responsive.py` | 13 widths (320–2560) × 15 page types, horizontal overflow |
| `python3 tools/tests/browsers.py` | Chrome, WebKit, Firefox (`playwright install webkit firefox` once) |
| `python3 tools/tests/interactions.py` | planner, contact, filters, booking stepper, menu, lightbox |
| `python3 tools/tests/perf.py` | lab LCP/CLS/TBT on simulated mobile 4G |

All exit non-zero on failure, so they can run in CI.
