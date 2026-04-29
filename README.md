# WCO `matchMedia` mismatch — Electron repro

Minimal reproduction for an Electron-on-Linux bug: when a `BrowserWindow` is
configured for Window Controls Overlay (`frame: false` + `titleBarStyle:
'hidden'` + populated `titleBarOverlay`), three of the four standard WCO
entry points correctly report WCO is active — but
`matchMedia('(display-mode: window-controls-overlay)').matches` returns
`false`. Pages that follow the W3C-recommended detection pattern (the
`@media (display-mode: window-controls-overlay)` rule) silently render
their non-WCO layout while WCO is active.

Verified on Electron 41.3.0 (Chromium 146), Linux X11 + Wayland, KDE Plasma 6
(Nobara 43), 2026-04-29.

| signal | value |
|---|---|
| `navigator.windowControlsOverlay.visible` | `true` |
| `getTitlebarAreaRect()` width × height | non-zero (matches `titleBarOverlay.height`) |
| `env(titlebar-area-width)` / `env(titlebar-area-height)` | populated |
| `matchMedia('(display-mode: window-controls-overlay)').matches` | **`false`** ← bug |

## Layout

```
.
├── main.js               ┐
├── preload.js            │  Electron Fiddle-compatible repro.
├── index.html            │  Standard 5-file layout. Renderer probes the
├── renderer.js           │  four WCO entry points after DOMContentLoaded
├── styles.css            ┘  and renders a comparison table; result is also
│                            logged to the DevTools console as JSON.
└── chromium-pwa/            Companion Chromium PWA repro — same probe
    ├── manifest.webmanifest packaged for installation as a desktop PWA, used
    ├── icon-512.png         to attempt a Chromium-vs-Electron comparison.
    ├── index.html           See chromium-pwa/README.md for what we found
    ├── renderer.js          (spoiler: Chromium-Linux has no path to
    ├── styles.css           activate the WCO API surface — the Electron
    ├── serve.sh             observation can only be reproduced in Electron).
    └── README.md
```

## Running the Electron repro

The five top-level files are the standard Electron Fiddle quick-start
layout. Either:

- **Via Electron Fiddle** — `Open with Electron Fiddle` from a clone of this
  repo, then **Run**. Pick Electron 41 in the version dropdown to match the
  verification environment.
- **Manually**:

  ```sh
  npm init -y && npm install electron@41
  ./node_modules/.bin/electron --enable-logging=stderr .
  ```

The window opens with `frame: false` + `titleBarStyle: 'hidden'` + a 40-px
`titleBarOverlay`. The renderer's probe table appears in the page area;
the same probe is logged to stderr as a single JSON line via Chromium's
`--enable-logging=stderr` flag.

Expected console output (Electron 41.3.0 on Linux):

```json
{
  "navigator.windowControlsOverlay.visible": "true",
  "getTitlebarAreaRect() width × height": "804 × 40",
  "env(titlebar-area-width)": "804px",
  "env(titlebar-area-height)": "40px",
  "matchMedia('(display-mode: window-controls-overlay)').matches": "false"
}
```

## Running the Chromium PWA repro

See [`chromium-pwa/README.md`](chromium-pwa/README.md) for the full setup
and the three Chromium activation paths we tried (PWA install,
`chrome://flags`, DevTools emulation), all of which fail to activate WCO
on Linux. The short version:

```sh
cd chromium-pwa && ./serve.sh
# then in Chrome: open http://localhost:7733/, install via the omnibox install icon,
# launch the installed PWA window, and observe that all four WCO signals stay inactive.
```

## License

MIT. See [LICENSE](LICENSE).

## AI disclosure

The probe code, repro layout, and documentation in this repo were drafted
with Claude Code assistance and verified empirically before publication.
Per [Electron's governance AI policy](https://github.com/electron/governance/blob/main/policy/ai.md),
commit messages carry `Co-Authored-By:` trailers where appropriate.
