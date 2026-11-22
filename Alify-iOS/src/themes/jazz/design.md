---
id: jazz
name: Jazz de club
description: Radio de sobremesa con dial marfil y nogal acanalado.
relief: 2d
preview: ["#362a23", "#eaca97", "#c59e77"]
colors:
  bg: "#362a23"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#362a23"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#eaca97"
  accent2: "#c59e77"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#eaca97"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.64"
  wallpaperRatio: "1.50059"
  screen: "#eee2cb"
  phosphor: "#30282d"
  keyRadius: "3px"
  font: "Georgia, serif"
  radius: "12px"
floating:
  instrument: jazz
  width: 400
  height: 156
---

# Jazz de club

```css
.app-shell { border: 2px solid var(--c-line); }

.app-shell { background-color: var(--c-bg); }
.sidebar { background: repeating-linear-gradient(3deg,transparent 0 8px,#ffffff09 9px 10px), var(--c-bg); }
.panel, .input { background-color: var(--c-bg); color: var(--c-text); }
.btn-primary, .btn-play { background: var(--c-play-bg); color: var(--c-play-fg); text-shadow: none; }

/* Acabado del reproductor principal y distintivo de la colección. */
.play-bar {
  background: repeating-linear-gradient(3deg,transparent 0 8px,#ffffff09 9px 10px), var(--c-bg);
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
