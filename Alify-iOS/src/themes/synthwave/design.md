---
id: synthwave
name: Synthwave 84
description: Atardecer ochentero en magenta neón, naranja solar y rejilla cian.
relief: 3d
preview: ["#372449", "#ff91d0", "#83ecff"]
colors:
  bg: "#372449"
  panel: "rgba(255, 0, 110, 0.08)"
  panelStrong: "#372449"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ff91d0"
  accent2: "#83ecff"
  line: "rgba(0, 229, 255, 0.36)"
  playBg: "#ff91d0"
  playFg: "#16191c"
  floatBg: "transparent"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#211c3b"
  phosphor: "#f8c5f1"
  keyRadius: "2px"
  font: "Consolas, monospace"
  radius: "10px"
floating:
  instrument: synthwave
  width: 400
  height: 156
  shell: assets/sun-deck.svg
---

# Synthwave 84

```css
.app-shell { border: 2px solid #00e5ff; background: linear-gradient(180deg, rgba(255,0,110,.18), rgba(22,10,44,.86) 45%), var(--c-bg); }
.btn-primary { background: linear-gradient(90deg, #ff006e, #ffbe0b); color: #fff; }
.progress-fill { background: linear-gradient(90deg, #ffbe0b, #ff006e, #00e5ff); box-shadow: 0 0 10px #ff006e; }
.float-root { -webkit-mask-image: var(--shell-mask); mask-image: var(--shell-mask); -webkit-mask-size: 100% 100%; mask-size: 100% 100%; }
.float-shell { background: var(--shell-image) center/100% 100% no-repeat; border: 0; padding: 22px 34px; }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(90deg,transparent 0 12px,#ffffff0b 12px 13px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(90deg,transparent 0 12px,#ffffff0b 12px 13px), var(--c-bg);
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

.titlebar { border-bottom: 2px solid var(--c-accent2); }
.pb-controls { border-radius: 24px; border-color: var(--c-accent2); box-shadow: inset 0 0 8px color-mix(in srgb,var(--c-accent2) 25%,transparent); }
.progress-fill { background: linear-gradient(90deg,var(--c-accent2),var(--c-accent)); }
main.panel h1 { text-shadow: 2px 2px var(--c-bg); }
```
