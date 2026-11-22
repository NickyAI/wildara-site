# Responsive & cross-browser QA

Everything below was executed against the production build served by `tools/serve.py` (same headers as `.htaccess`). Re-run with the scripts in `tools/tests/`.

## Viewports (automated, `responsive.py`)

15 page types (home, safaris listing + detail, destinations listing + detail, experiences listing + detail, journal listing + article, story, contact, plan, terms, privacy, 404) at 13 widths:

320 · 360 · 375 · 390 · 414 · 768 · 820 · 1024 · 1280 · 1366 · 1440 · 1920 · 2560 px

**Result: 0 pages with horizontal overflow or elements wider than the viewport (195 combinations).**

Fixed during this pass: the safaris filter bar clipped its dropdowns at ≤ 414 px; itinerary content was clipped by up to 42 px at 320–360 px (grid items not allowed to shrink).

Visually inspected (screenshots): homepage at 320, 768, 1024, 1920, 2560; itinerary, destination, article and 404 at 1440; itinerary map, gallery, destination, article, story, contact and experience at 390.

## Browsers (automated, `browsers.py`)

| Engine | How tested | Pages | JS errors / CSP violations / failed requests |
|---|---|---|---|
| Chromium | installed Google Chrome | 11 page types | 0 |
| WebKit (Safari's engine) | Playwright WebKit build | 11 page types | 0 |
| Firefox | Playwright Firefox build | 11 page types | 0 |

The intro (masked light reveal) and the W portal were screenshot-compared in all three engines and render the same, including the portal's dissolve into the landscape (the earlier "empty section" issue).

**Not tested:** a physical iPhone/iPad (mobile Safari specifics like the dynamic toolbar), Microsoft Edge separately (Chromium-based, so expected to match Chrome), Android Chrome on a device. Mobile behaviour was tested with Chrome's mobile emulation (touch, device metrics).

## Accessibility (automated, `a11y.py`)

axe-core 4.10 (WCAG 2.0/2.1 A + AA + best practice) on 15 page types at 1440 and 390 px: **0 violations** after fixes (planner headline hidden from screen readers, nested landmarks, heading-order skips, duplicate form labels). Reduced-motion users get no intro, no scroll animations and static content.

## Interactions (automated, `interactions.py`)

17 checks passed: booking stepper pricing, itinerary → planner hand-off (safari + travellers), planner validation and confirmation, destination → planner interest, contact validation and confirmation, URL-driven filters, menu open/Escape, gallery lightbox, descriptive gallery alt text, no uncaught errors.
