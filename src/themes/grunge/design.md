---
id: grunge
name: Grunge de garaje
description: Casete de ensayo, papel kraft y marcas de fotocopia.
relief: 2d
preview: ["#342e25", "#e5bb75", "#b5c49a"]
colors:
  bg: "#342e25"
  panel: "rgba(255, 255, 255, 0.04)"
  panelStrong: "#342e25"
  text: "#faf8f5"
  muted: "#ded9de"
  accent: "#e5bb75"
  accent2: "#b5c49a"
  line: "rgba(255, 255, 255, 0.08)"
  playBg: "#e5bb75"
  playFg: "#16191c"
  floatBg: "rgba(16, 16, 18, 0.86)"
vars:
  wallpaperShade: "0.63"
  wallpaperRatio: "1.50059"
  screen: "#eee2cb"
  phosphor: "#30282d"
  keyRadius: "2px"
  font: "'Courier New', monospace"
  radius: "12px"
floating:
  instrument: grunge
  width: 400
  height: 156
---

# Grunge de garaje

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

.titlebar { border-bottom: 3px dashed var(--c-accent); }
.pb-controls { border: 2px solid var(--c-text); border-radius: 0; box-shadow: 3px 3px var(--c-accent); }
.pb-controls .btn-play { border-radius: 3px; transform: rotate(-3deg); }
main.panel h1 { text-decoration: underline; text-decoration-thickness: 3px; text-decoration-color: var(--c-accent); text-underline-offset: 5px; }
```
