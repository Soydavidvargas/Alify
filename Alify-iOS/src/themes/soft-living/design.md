---
id: soft-living
name: Soft Living
description: Verde salvia orgánico, lino cálido y terracota serena con formas de guijarro.
relief: 2d
preview: ["#384c40", "#d2e6ad", "#e7ca9d"]
colors:
  bg: "#384c40"
  panel: "rgba(232, 223, 209, 0.08)"
  panelStrong: "#384c40"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#d2e6ad"
  accent2: "#e7ca9d"
  line: "rgba(232, 223, 209, 0.22)"
  playBg: "#d2e6ad"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#eee6d4"
  phosphor: "#35412c"
  keyRadius: "3px"
  font: "Georgia, serif"
  radius: "22px"
floating:
  instrument: soft-living
  width: 400
  height: 156
  shell: assets/pebble.svg
---

# Soft Living

```css
.app-shell { background: radial-gradient(circle at 80% 15%, rgba(212,140,106,.16), transparent 45%), var(--c-bg); border: 1px solid var(--c-line); }
.btn-primary { background: #a6c49f; color: #1d2921; }
.progress-fill { background: linear-gradient(90deg, #a6c49f, #d48c6a); }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 22px 36px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(90deg,transparent 0 3px,#ffffff0a 3px 4px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(90deg,transparent 0 3px,#ffffff0a 3px 4px), var(--c-bg);
  box-shadow: inset 0 2px var(--c-line), inset 0 -3px color-mix(in srgb,var(--c-accent) 46%,transparent);
}
.pb-controls {
  padding: 2px 8px;
  border: 1px solid var(--c-line);
  border-radius: var(--v-key-radius,6px);
  background: var(--c-bg);
}
.play-bar .pb-cover:empty {
  background: var(--asset-insignia) center/cover no-repeat !important;
}
.sidebar .nav-item[aria-current="page"] { box-shadow: inset 3px 0 var(--c-accent); }

.play-bar { border-top: 4px ridge var(--c-accent2); }
.pb-controls { background: var(--v-screen); border: 3px double var(--c-accent2); }
.pb-controls .icon-btn { color: var(--v-phosphor); }
.pb-controls .icon-btn[aria-pressed=true] { outline: 2px solid var(--v-phosphor); outline-offset: -4px; }
main.panel h1 { font-family: Georgia,serif; }
.progress-track { border: 1px solid var(--c-line); }
```
