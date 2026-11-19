---
id: rockabilly
name: Rockabilly de rocola
description: Arcos de rocola, crema y ribetes rojo cereza.
relief: 2d
preview: ["#402a30", "#ffccb7", "#ead9a8"]
colors:
  bg: "#402a30"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#402a30"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#ffccb7"
  accent2: "#ead9a8"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#ffccb7"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#eee2cb"
  phosphor: "#30282d"
  keyRadius: "4px"
  font: "Georgia, serif"
  radius: "12px"
floating:
  instrument: rockabilly
  width: 400
  height: 156
---

# Rockabilly de rocola

```css
.app-shell { border: 2px solid var(--c-line); }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(0deg,transparent 0 4px,#ffffff09 4px 5px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(0deg,transparent 0 4px,#ffffff09 4px 5px), var(--c-bg);
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
