
Goal: permanently stop landing pages from freezing on load by removing the mutation storm / blocking work in the landing-page injection pipeline, while keeping buttons, quantity selectors, and order flow working.

What I found
- The strongest root cause is in `src/lib/landingPhoneHtml.ts`:
  - it mounts a document-wide `MutationObserver` while the page is still being parsed
  - it watches the same attributes that `patchPhoneInput()` mutates (`maxlength`, `inputmode`, `type`, `pattern`, `oninput`)
  - that can create a self-triggering mutation loop and a huge amount of work during `document.write()`
- `src/pages/LandingPageView.tsx` injects all helper scripts into `</head>`, so non-critical tracking, heartbeat, partial tracking, exit popup logic, and phone patching all start before the landing page finishes rendering.
- For `drain-01`, the stored HTML itself is not especially heavy:
  - ~26.9 KB HTML
  - 2 images
  - 0 videos
  - 3 inline scripts
  So the main problem is script churn, not asset weight.
- `LandingPageCheckout.tsx` reuses the same phone/partial/order script pattern, so the same hardening should be applied there too.

Implementation plan
1. Fix the infinite-loop candidate in `src/lib/landingPhoneHtml.ts`
- Replace the current global observer approach with an idempotent, scoped patcher.
- Only patch phone inputs when needed.
- Do not observe the same attributes that are being mutated.
- Do not observe the whole document during initial parse.
- Scope observation to the actual checkout form/root after DOM is ready.
- Add guards so `setAttribute()` only runs when values actually differ.

2. Split landing-page scripts into critical vs deferred in `src/pages/LandingPageView.tsx`
- Keep only minimal globals / compatibility helpers in `<head>`.
- Move non-critical scripts to end of `<body>` or schedule them after first paint / idle:
  - analytics view tracking
  - heartbeat
  - partial tracking
  - exit-intent popup
  - debug panel
  - third-party pixels / GTM bootstrap
- This keeps `document.write()` but stops main-thread blocking before content appears.

3. Add a landing HTML performance sanitizer
- Extend the sanitization layer (likely `src/lib/htmlSanitizer.ts`, or a new helper) to:
  - lazy-load non-hero images
  - set `decoding="async"` on images
  - keep only the first above-the-fold image eager/high-priority
  - rewrite supported storage image URLs to optimized transform URLs where safe
  - defer/disable known non-essential external scripts inside page HTML/custom scripts
  - set safer defaults for iframe/video loading if present
- This is preventive hardening for all landing pages, even though `drain-01` is mainly script-bound.

4. Make initial API calls non-blocking
- Change landing analytics / heartbeat startup so they do not fire during parse.
- Schedule first send after render/idle instead of immediately in `<head>`.
- Prefer `sendBeacon` where possible; otherwise fire-and-forget `fetch` after first paint.
- Dedupe startup calls so the same event is not triggered twice during initial mount.

5. Keep template interactions intact
- Preserve the existing `document.write()` rendering approach.
- Make sure quantity selection, `openCheckout()`, `syncTierToCheckout()`, call buttons, and form submission still work after script deferral.
- Apply the same stabilization to `src/pages/LandingPageCheckout.tsx` so checkout iframe behavior matches the main landing page.

Files to update
- `src/lib/landingPhoneHtml.ts`
- `src/lib/landingPhoneHtml.test.ts`
- `src/lib/htmlSanitizer.ts` (or a new landing-performance helper)
- `src/pages/LandingPageView.tsx`
- `src/pages/LandingPageCheckout.tsx`
- Optional only if needed after code review/testing: `supabase/functions/visitor-heartbeat/index.ts`

Technical details
- Primary bug pattern:
  ```text
  MutationObserver(attributes: maxlength/inputmode/type/pattern/oninput)
      -> patchPhoneInput()
      -> setAttribute/removeAttribute on same input
      -> MutationObserver fires again
  ```
- Secondary issue:
  ```text
  document.write()
      -> injected scripts in <head> execute immediately
      -> observers/listeners/fetches start before page content is fully ready
      -> main-thread pressure + delayed interactivity
  ```

Validation plan after implementation
- Load `/lp/drain-01` and confirm no “Page Unresponsive” / freeze.
- Verify:
  - page appears without hanging on loading
  - Order/CTA buttons respond immediately
  - quantity/tier changes update prices correctly
  - call button still works
  - phone input still sanitizes/validates correctly
  - order submission still succeeds
- Add regression tests for:
  - phone HTML normalization
  - no recursive attribute-watching behavior in generated phone script
  - landing HTML performance sanitizer output
- If any remaining slowness is tied to live-visitor tracking, then harden `visitor-heartbeat` so cleanup does not run on every request path.

Expected outcome
- No blocking mutation loop
- No non-critical scripts running during parse
- Landing pages render first, then tracking starts
- Existing landing-page interactions remain functional
- `drain-01` becomes stable without depending on preview debugging
