# Wildara Africa Safaris · Website

The "Wild Within" website for Wildara Africa Safaris, a private safari company in Arusha, Tanzania. Production: **https://wildaraafricasafaris.com** (Hostinger).

## Structure

- `Site/` is the complete, built static website: upload its **contents** to `public_html/`. Clean URLs (`/safaris/<slug>/`, `/destinations/<id>/`, `/journal/<id>/` …), `sitemap.xml`, `robots.txt`, `404.html` and `.htaccess` are all generated.
- `tools/` holds the generator, page templates (`tools/src/`), configuration (`tools/site.json`, `tools/htaccess`), a production-like local server and the test suites.

The original photos, videos, itinerary documents, logo files and brand guide are not included in this repository.

## Common tasks

```sh
python3 tools/build.py          # regenerate Site/ from tools/src + data
python3 tools/serve.py 8080     # preview at http://127.0.0.1:8080 with the same rules as .htaccess
```

Pages must be viewed through a web server (the line above, or the live host). Opening `Site/index.html` directly from disk does not support the folder-style URLs.

## Before launch

1. Fill in `WILDARA_CONFIG` in `Site/assets/js/main.js` (`email`, `phone`, `whatsapp`, and `formEndpoint`; without an endpoint, enquiries are not delivered).
2. Enable SSL in hPanel, then upload. Full runbook: **`DEPLOYMENT.md`**.

## Documentation

- `DEPLOYMENT.md`: Hostinger setup, upload, verification, rollback
- `PRODUCTION_AUDIT.md`: architecture, issues fixed, test results, open items, verdict
- `SEO_AUDIT.md`: indexability, metadata, structured data, Search Console readiness
- `RESPONSIVE_QA.md`: viewports, browsers, accessibility and interaction testing performed
- `tools/README.md`: build pipeline and test commands

## Pages

Home · Safaris (29 itineraries) · Destinations (9) · Experiences (9) · Our Story · Safari Journal (8 guides) · Contact · Plan my safari · Privacy Policy · Terms & Conditions
