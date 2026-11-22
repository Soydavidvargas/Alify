---
id: shoegaze
name: Shoegaze de pedalera
description: Pedal de efectos esmaltado con perillas y tinta lavanda.
relief: 2d
preview: ["#353044", "#e5c6f1", "#adc6d2"]
colors:
  bg: "#353044"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#353044"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#e5c6f1"
  accent2: "#adc6d2"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#e5c6f1"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.62"
  wallpaperRatio: "1.50059"
  screen: "#eee2cb"
  phosphor: "#30282d"
  keyRadius: "2px"
  font: "Consolas, monospace"
  radius: "12px"
floating:
  instrument: shoegaze
  width: 400
  height: 156
---

# Shoegaze de pedalera

```css
.app-shell { border: 2px solid var(--c-line); }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: radial-gradient(#ffffff15 1px,transparent 1.5px) 0 0/8px 8px, var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: radial-gradient(#ffffff15 1px,transparent 1.5px) 0 0/8px 8px, var(--c-bg);
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
.pb-controls { border: 2px solid var(--c-accent2); box-shadow: inset -2px -2px #101017,2px 2px #101017; border-radius: 3px; }
.pb-controls .icon-btn { border-radius: 3px; }
.progress-fill { background: repeating-linear-gradient(90deg,var(--c-accent) 0 7px,var(--c-bg) 7px 9px); }
main.panel h1 { font-family: Consolas,monospace; }
```
