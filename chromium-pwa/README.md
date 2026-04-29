# Chromium WCO matchMedia probe — PWA repro

Mirror of the Electron repro in the parent directory, packaged as an
installable PWA so the same four-signal probe can be run against plain
Chromium / Chrome with `display_override: ["window-controls-overlay"]`.

## Why a PWA install is required

Chrome only activates Window Controls Overlay for **installed** PWAs whose
manifest opts in. There is no command-line flag, `chrome://flags` toggle, or
`--app=URL` mode that activates WCO without going through the install flow.
The manifest's `display_override: ["window-controls-overlay"]` is the load-
bearing trigger; it only takes effect once the page is installed.

## Steps

1. Serve this directory over `http://localhost`:

   ```sh
   ./serve.sh
   # serves on http://localhost:7733/
   ```

2. Open `http://localhost:7733/` in Chrome (must be `localhost`, not a file
   URL — Chrome treats `localhost` as a secure context but rejects `file://`
   for PWA install).

3. Install: click the install icon in the omnibox (the small computer icon
   on the right of the address bar), or `⋮ → Install WCO matchMedia
   mismatch…`. The installed PWA window opens automatically.

4. In the installed PWA window, open DevTools (`Ctrl+Shift+I`) and look at
   the Console tab. The renderer logs a single JSON object with the
   four-signal readout, and the page itself renders the same as a table.

## What we observed on Chrome 147.0.7727.55 / Linux

All four WCO signals report inactive — Chrome opened the installed PWA in
`display: standalone` instead of WCO mode, even though the manifest's
`display_override` lists `window-controls-overlay` first.
`chrome://web-app-internals` exposes a per-app gate that explains it:

```
"display_override": ["window-controls-overlay"],
"registrar_evaluated_fields": { "display_mode": "window-controls-overlay", ... },
"window_controls_overlay_enabled": false,
"user_display_mode": "kStandalone"
```

Chrome parses the manifest correctly and the registrar even resolves the
preferred display mode to WCO — but the per-app `window_controls_overlay_enabled`
boolean stays `false`. On Windows / macOS this flag is flipped by a
"Window Controls Overlay" toggle in the installed PWA's three-dot menu.
On Linux Chrome 147 there is no such toggle in the UI; the per-app PWA
settings page has only "Start app when you sign in", "Open as window",
"Notifications", basic permissions, and "Opening supported links". The
flag has no path to `true` short of a custom Chrome build or LevelDB
patching.

Three separate activation attempts all fail:

1. **PWA install** — described above.
2. **`chrome://flags`** — the legacy `enable-desktop-pwas-window-controls-overlay`
   flag that originally gated the feature has been removed in Chrome 147
   (feature shipped stable in Chrome 102). Adjacent PWA flags
   (`enable-desktop-pwas-borderless`, `enable-desktop-pwas-tab-strip`,
   `enable-desktop-pwas-additional-windowing-controls`) are unrelated.
3. **DevTools Application → Manifest → "Emulate Window Controls Overlay"** —
   the checkbox does draw OS-style window-control buttons over the page area,
   but does NOT plumb any of the four API signals on Linux. `navigator.windowControlsOverlay.visible`
   stays `false`, `getTitlebarAreaRect()` returns `0×0`, `env(titlebar-area-*)`
   is empty, and `matchMedia('(display-mode: window-controls-overlay)')` returns
   `false`. The emulation is visual-only on Linux. (This contradicts
   [devtoolstips.org's description](https://devtoolstips.org/tips/en/simulate-pwa-wco/)
   which says env values should activate; on Linux Chrome 147 they don't.)

So a side-by-side Chromium-vs-Electron comparison of WCO matchMedia behaviour
isn't possible on Linux today. Electron's `titleBarOverlay` API activates
WCO in Linux via a separate code path (visible / rect / env populated) and
exposes the matchMedia mismatch; plain Chromium-Linux just never activates
the WCO API surface.

Tested 2026-04-29 on Chrome 147.0.7727.55, Nobara 43 (Fedora 43-based),
KDE Plasma 6.
