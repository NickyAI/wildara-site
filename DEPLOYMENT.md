# Deployment · Hostinger

## Architecture decision

The site is **static**: pre-built HTML, CSS, JavaScript, images and video. There is no server code, database, API, authentication or environment variable at runtime. It therefore needs **plain static hosting**, not Node.js, PM2 or a reverse proxy. Hostinger shared hosting (LiteSpeed, reads Apache `.htaccess`) is a correct fit.

| Item | Value |
|---|---|
| Production URL | `https://wildaraafricasafaris.com` (non-www is canonical; www redirects to it) |
| Public web root | `public_html/` |
| What to upload | the **contents** of `Site/` (including the hidden `.htaccess`) |
| Build command | `python3 tools/build.py` |
| Runtime command | none (static files) |

**Never upload** `tools/`, `.git/`, `README.md`, these `.md` docs, or the original `Media/`, `Itineraries/`, `Logos/`, `Brand Guide/` folders. Only `Site/` contents belong in `public_html/`.

## Before the first upload

1. **Domain and SSL.** In hPanel, point `wildaraafricasafaris.com` at the hosting plan and enable the free SSL certificate (**Security → SSL**). The `.htaccess` forces HTTPS, so SSL must be active first or visitors see a certificate error.
2. **Contact details and form delivery.** Edit `Site/assets/js/main.js` → `WILDARA_CONFIG`:
   - `email`, `phone`, `whatsapp` (shown in the footer and on `/contact/`)
   - `formEndpoint`: a URL that accepts the enquiry/contact JSON (e.g. Formspree). **Until this is set, forms show a thank-you screen but nothing is delivered.**
   - If you set `formEndpoint`, add its origin to `connect-src` in `tools/htaccess` (e.g. `connect-src 'self' https://formspree.io`) and rebuild.
3. **Google Search Console (optional now, recommended).** Either put the token in `tools/site.json` → `google_site_verification` and rebuild (adds the meta tag to every page), or upload Google's HTML verification file into `public_html/`.
4. **Rebuild** if you changed anything in `tools/`: `python3 tools/build.py` (then CSS/JS cache-busting hashes update automatically).

## Upload

Option A, hPanel File Manager: open `public_html/`, delete Hostinger's default `index.php`/`default.php` if present, upload a zip of the contents of `Site/`, and extract it there. Make sure `public_html/.htaccess` and `public_html/index.html` exist (enable "show hidden files").

Option B, Git deployment (hPanel → Advanced → Git): not recommended as-is, because the repository root is not the web root. Use Option A or FTP/SFTP of the `Site/` contents.

## After upload: verify (5 minutes)

Open each in a private window and also press refresh on each:

- `https://wildaraafricasafaris.com/` (intro plays once)
- `https://wildaraafricasafaris.com/safaris/` and `/safaris/7-days-amazing-big-five-wildlife/`
- `/destinations/ngorongoro/`, `/experiences/hot-air-balloon/`, `/journal/what-to-pack-for-safari/`
- `/contact/`, `/plan/`, `/privacy/`, `/terms/`
- `https://www.wildaraafricasafaris.com/` → should redirect to the non-www URL
- `http://wildaraafricasafaris.com/safaris` → should end on `https://wildaraafricasafaris.com/safaris/`
- `/assets/` and `/assets/img/` → must show the 404 page, **never** an "Index of" listing
- `/no-such-page/` → custom 404 page (status 404)
- `/robots.txt` and `/sitemap.xml` → load as plain text / XML

Optional header check from a terminal: `curl -sI https://wildaraafricasafaris.com/ | grep -iE "content-security|strict-transport|x-frame"`.

## Updating the site later

1. Edit templates in `tools/src/` or data/scripts in `Site/assets/`.
2. `python3 tools/build.py`
3. Test locally: `python3 tools/serve.py 8080`, then run the tests (see `tools/README.md`).
4. Upload the changed files (or the whole `Site/` contents again).

## Rollback

Every deploy is a set of static files, so rollback is re-uploading the previous build. Keep the previous `Site/` as a zip (or check out the previous Git commit and upload its `Site/` contents). Nothing else (database, caches) needs rolling back. HTML is served with `Cache-Control: no-cache`, so visitors get the restored version immediately; CSS/JS are versioned by hash so old and new never mix.

## Caching summary (from `.htaccess`)

| Files | Cache |
|---|---|
| `.css`, `.js` (versioned `?v=hash`) | 1 year, immutable |
| `.woff2` fonts | 1 year |
| images, video | 30 days |
| `.html`, `sitemap.xml`, `robots.txt` | `no-cache` (always revalidated) |
