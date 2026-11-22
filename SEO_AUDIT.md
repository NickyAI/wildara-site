# SEO audit

Validated locally against the production build (`python3 tools/tests/seo.py`, `smoke.py`, `links.py`). **Search Console account data not verified. Technical indexability has been validated from the application instead.** The site is not live yet, so nothing can be indexed until it is deployed.

## Before → after

| Area | Before | After |
|---|---|---|
| Item URLs | `safari.html?id=…`, one template for 29 safaris, content injected by JS | `/safaris/<slug>/` etc.: 55 real pages with unique HTML |
| Canonical tags | none | every indexable page, absolute `https://wildaraafricasafaris.com/...` |
| Titles / descriptions | identical across all items in raw HTML | unique per page; titles ≤ 65 chars, descriptions ≤ 155 (0 duplicates) |
| Social sharing | relative `og:image` (unusable) | absolute 1200×630 JPEG per page, OG + X/Twitter tags |
| Sitemap / robots | missing | `/sitemap.xml` (65 URLs), `/robots.txt` with sitemap reference |
| 404 | none (server default) | custom `/404.html`, real 404 status, `noindex` |
| Structured data | JS-injected FAQ only | TravelAgency, WebSite, BreadcrumbList, TouristTrip, TouristDestination, Article, ItemList, FAQPage (all in HTML) |

## Indexability (65 public pages)

| Requirement | Status | Evidence |
|---|---|---|
| Discoverable | ✅ | in sitemap; 0 orphans (every page linked from another page in plain HTML) |
| Crawlable | ✅ | robots.txt `Allow: /`; no `Disallow` of content or assets |
| Renderable without JS | ✅ | titles, H1, intro, itinerary days, FAQs and listing grids pre-rendered (verified with JS disabled) |
| Canonicalised | ✅ | canonical = own clean URL on every page; filter URLs (`/safaris/?theme=…`) canonicalise to `/safaris/` |
| Technically indexable | ✅ | `index, follow, max-image-preview:large`; no accidental `noindex`; no localhost/staging URLs |
| HTTP status | ✅ | 65/65 return 200 on direct load; unknown URLs 404 (no soft 404s, no redirect to home) |
| Duplicate URLs | ✅ | old `.html?id=` URLs 301 → clean URLs; `www` 301 → non-www; `/index.html` 301 → `/` |

## Metadata pattern

| Page type | Title example |
|---|---|
| Safari | `Amazing Big Five Wildlife · 7-Day Safari \| Wildara` |
| Destination | `Ngorongoro Crater and Conservation Area Safari Guide \| Wildara` |
| Experience | `Hot-Air Balloon Safari in Tanzania \| Wildara Africa Safaris` |
| Article | `What to Pack for a Tanzania Safari \| Wildara Safari Journal` |

## Structured data

All JSON-LD reflects visible content only: no ratings, reviews, awards, phone numbers or street addresses were invented. The TravelAgency address is locality-level (Arusha, TZ) because that is all the site states. Safari `Offer` prices are the real "from" prices shown on each page. FAQPage markup matches visible FAQs (note: Google currently shows FAQ rich results mainly for government/health sites, so expect this to help understanding rather than produce FAQ snippets).

Validate after launch with Google's Rich Results Test and the Schema.org validator.

## Images

All 34 photos are WebP in four sizes (640/960/1280/up to 2400 px) with `srcset`/`sizes`, width/height attributes, lazy loading below the fold and eager + `fetchpriority="high"` + `<link rel=preload>` for each page's hero. Every meaningful image has descriptive alt text (34 descriptions in `assets/data/img-alt.json`); decorative images use empty alt.

## Google Search Console

- No existing verification token or HTML file was found in the project.
- Ready to accept one: set `google_site_verification` in `tools/site.json` and rebuild, or upload Google's HTML file.
- After verifying: submit `https://wildaraafricasafaris.com/sitemap.xml`, then use URL Inspection on the homepage and one safari page.
- No analytics or tag manager exists; none was added (no IDs provided).
