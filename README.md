# Wildara Africa Safaris · Website

The "Wild Within" website for Wildara Africa Safaris, a private safari company in Arusha, Tanzania.

## Structure

- `Site/` is the complete static website (HTML, CSS, JavaScript, optimised WebP images and web video). It needs no build step or server code: open `Site/index.html` in a browser, or upload the folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).
- `tools/` holds optional Python scripts that regenerate images, itinerary data and pages from the original source files. See `tools/README.md`.

The original photos, videos, itinerary documents, logo files and brand guide are not included in this repository.

## Before launch

Open `Site/assets/js/main.js` and fill in `WILDARA_CONFIG`:

- `email`, `phone` and `whatsapp` are shown in the footer and on the contact page.
- `formEndpoint` is a URL that receives enquiry and contact forms as JSON (e.g. Formspree). Until it is set, the forms show a confirmation screen but nothing is sent.

## Pages

Home · Safaris (29 itineraries) · Destinations (9) · Experiences (9) · Our Story · Safari Journal (8 guides) · Contact · Plan my safari · Privacy Policy · Terms & Conditions
