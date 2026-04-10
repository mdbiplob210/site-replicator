

## Meta Pixel First-Load Fix — Final Architecture

### Root Cause (Confirmed)

The pixel fails on first visit because of a **two-document conflict**:

1. **Shell document** (`index.html`): Creates `fbq` stub, starts loading `fbevents.js`, fires `PageView` into the queue
2. **`document.write()`** destroys the entire DOM (including the loading SDK script tag) before `fbevents.js` finishes loading
3. **Final landing HTML** re-injects the SDK, but deduplication logic on `window.__lpMetaPixelTrackedUrls` sees the URL was "already tracked" and skips
4. The first `PageView` was queued on a stub whose SDK script was destroyed — it never reaches Facebook's servers
5. Pixel Helper cannot detect the pixel because the DOM it attached to was replaced

### Fix Strategy: "Single Source of Truth"

Only the **final document** (after `document.write`) should initialize and fire the pixel. The shell should do nothing except preconnect.

### Changes

**1. `index.html` — Remove all pixel tracking logic**

Strip the entire 140-line IIFE (lines 17-159). Keep only the preconnect hints:
```html
<link rel="dns-prefetch" href="https://connect.facebook.net" />
<link rel="preconnect" href="https://connect.facebook.net" crossorigin />
```

**2. `src/lib/landingPixelBootstrap.ts` — `buildMetaPixelHeadScript()` changes**

- At the start of the injected script, **clear stale state** left by the shell:
  - Reset `window.__lpMetaPixelTrackedUrls = {}`
  - Reset `window.__lpMetaPixelLifecycleInstalled = false`
  - Reset `window.__lpMetaPixelBootstrapped = {}`
  - Set `window.fbq = undefined` (force fresh stub creation)
- This ensures the final document starts clean with no dedup conflicts
- The existing SDK injection + PageView firing logic then works correctly on the fresh document

**3. `src/pages/LandingPageView.tsx` — No changes needed**

The `buildFullHtml()` already calls `buildMetaPixelHeadScript()` and injects it into the final `<head>`. Once the stale state is cleared, this will fire correctly.

### Result

```text
User clicks ad
  ↓
index.html loads (preconnect only, NO pixel)
  ↓
React loads, fetches landing page data
  ↓
document.write() replaces entire DOM
  ↓
Final <head> has fresh fbq stub + SDK + PageView
  ↓
SDK loads, processes queue → PageView hits Facebook ✅
  ↓
Pixel Helper detects pixel immediately ✅
```

### Technical Notes
- No sync XHR needed (removed from shell)
- No `document.write` for SDK injection (using standard createElement)
- SPA route tracking preserved via `pushState`/`popstate` listeners in the final document
- Purchase queue and CAPI tracking unchanged

