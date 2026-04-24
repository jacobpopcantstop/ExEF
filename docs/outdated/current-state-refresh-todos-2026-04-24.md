# Current-State Refresh TODOs (2026-04-24)

Purpose: identify older code/content that should be updated so public messaging matches the current ExEF product and site state.

## 1) Normalize curriculum-size language site-wide
- **Issue:** Multiple high-visibility pages still describe ExEF as a “six-module” program, which can conflict with the current expanded module surface.
- **Why it matters:** Visitors can interpret this as stale information and question whether curriculum pages are in sync.
- **Where:** `index.html`, `curriculum.html` (meta + OG description), `store.html`, and `module-6.html` alt text.

## 2) Replace “installments coming soon” with real payment status
- **Issue:** Store FAQ still says installment payments are “coming soon.”
- **Why it matters:** This is conversion-critical copy at checkout intent stage; stale language creates uncertainty.
- **Where:** `store.html` FAQ section.

## 3) Decide whether `coach-directory.html` should launch or redirect
- **Issue:** The page title is production-ready, but the page body and meta description still present a placeholder “coming soon” state.
- **Why it matters:** SEO snippets and on-page messaging can mislead users if directory functionality is already available elsewhere.
- **Where:** `coach-directory.html`.

## 4) Replace blog placeholder with live content or a stronger interim CTA
- **Issue:** Blog page shows only “Posts coming soon.”
- **Why it matters:** The nav links to blog as a primary learning destination; empty pages degrade trust and internal-link quality.
- **Where:** `blog.html`.

## 5) Convert legacy module landing pages into hard redirects (or add noindex)
- **Issue:** Legacy Module A/B/C pages remain full pages with old framing (“folded into…”).
- **Why it matters:** They can compete in search results and keep legacy IA alive instead of consolidating authority on current module URLs.
- **Where:** `module-a-neuroscience.html`, `module-b-pedagogy.html`, `module-c-interventions.html`.

## 6) Retire checkout bridge page by enforcing direct store routing
- **Issue:** `checkout.html` exists as a bridge and explicitly says it is only for old links.
- **Why it matters:** Legacy bridge pages can fragment analytics and create duplicate conversion paths.
- **Where:** `checkout.html`.

## 7) Refresh narrative/docs that still describe the old six-module era
- **Issue:** Historical narrative docs still state the “six-module certification path” as current context.
- **Why it matters:** Internal and external references should clearly distinguish historical state vs current state.
- **Where:** `docs/story-of-efi.md` (and linked pitch/story docs where relevant).

## 8) Complete auth migration away from legacy password fallback
- **Issue:** Frontend auth still supports a legacy hash fallback when WebCrypto is unavailable.
- **Why it matters:** Legacy algorithm support should be explicitly sunset with migration metrics and removal date.
- **Where:** `js/auth.js`.

## 9) Fix malformed external resource URL in open resources directory
- **Issue:** UNICEF link ends with `.pdf.pdf`.
- **Why it matters:** Broken/incorrect links reduce perceived quality and can break trust in curated resource hubs.
- **Where:** `open-ef-resources-directory.html`.

## 10) Align “coming soon” service-lane badges with actual service readiness
- **Issue:** Coaching/Ed Specialist/OT lanes all still show “Coming Soon” badges even though the page otherwise reads like a live offer surface.
- **Why it matters:** Mixed readiness signals create friction and can suppress inquiries.
- **Where:** `coaching-home.html`.
